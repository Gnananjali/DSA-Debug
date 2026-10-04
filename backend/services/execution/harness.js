/**
 * Generates the program that is actually executed for a submission: the user's
 * code plus a small harness that feeds it every test case and prints one
 * result record per case.
 *
 * Wire format (identical for every language):
 *   stdin  : a JSON array of strings. Each string is a test input, itself a JSON
 *            array of arguments, e.g. ["[[2,7,11,15], 9]", "[[3,3], 6]"]
 *   stdout : for each case, on its own line:  <nonce>{"i":0,"ok":true,"out":"[0,1]","ms":1}
 *            The nonce is random per run, so a program's own prints can neither
 *            break grading nor forge a result. Each record starts with "\n" so
 *            output without a trailing newline cannot swallow the nonce.
 *
 * Compatibility: these harnesses must also run on the Judge0 CE public
 * instance (Node.js 12.14, Python 3.8, GCC 9.2 which defaults to C++14), so
 * they avoid newer syntax (no `?.`, `??`, `if constexpr`, `enable_if_t`, ...).
 */

const SAFE_TYPE_RE = /^[A-Za-z_][A-Za-z0-9_:<>, ]*$/;
const ALLOWED_CPP_TYPES = new Set([
  "int", "long long", "double", "bool", "string",
  "vector<int>", "vector<long long>", "vector<double>", "vector<bool>", "vector<string>",
  "vector<vector<int>>", "vector<vector<long long>>", "vector<vector<double>>",
  "vector<vector<string>>", "vector<vector<char>>", "vector<char>", "char",
]);

/** Returns an error string, or null when the signature is usable. */
function validateCppSignature(signature) {
  if (!signature || !Array.isArray(signature.params) || signature.params.length === 0) {
    return "C++ is not available for this problem yet.";
  }
  for (const type of signature.params) {
    if (typeof type !== "string" || !SAFE_TYPE_RE.test(type) || !ALLOWED_CPP_TYPES.has(type.trim())) {
      return `Unsupported C++ parameter type: ${String(type).slice(0, 40)}`;
    }
  }
  return null;
}

function javascriptSource(userCode, nonce) {
  // "use strict" shares line 1 with the user's first line so reported line numbers match their editor.
  return `"use strict"; ${userCode}
;(async function __dsadebugMain() {
  const __fs = require("fs");
  const __nonce = ${JSON.stringify(nonce)};
  const __emit = (o) => { try { __fs.writeSync(1, "\\n" + __nonce + JSON.stringify(o) + "\\n"); } catch (e) {} };
  let __raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => (__raw += d));
  await new Promise((resolve) => process.stdin.on("end", resolve));
  const __cases = JSON.parse(__raw || "[]");
  let __fn = null;
  try {
    __fn = typeof solve === "function" ? solve : typeof module.exports === "function" ? module.exports : null;
  } catch (e) {}
  for (let i = 0; i < __cases.length; i++) {
    const t0 = process.hrtime.bigint();
    const ms = () => Number((process.hrtime.bigint() - t0) / 1000000n);
    try {
      if (!__fn) throw new Error("No function named 'solve' was found. Define: function solve(...) { ... }");
      const args = JSON.parse(__cases[i]);
      let result = __fn(...args);
      if (result && typeof result.then === "function") result = await result;
      // In-place problems: if nothing is returned, report the (mutated) first argument.
      if (result === undefined) result = args[0];
      __emit({ i, ok: true, out: JSON.stringify(result === undefined ? null : result), ms: ms() });
    } catch (err) {
      __emit({ i, ok: false, err: String(err && err.stack ? err.stack : err).slice(0, 2000), ms: ms() });
    }
  }
})();
`;
}

function pythonSource(userCode, nonce) {
  // Harness comes AFTER the user's code so line numbers in tracebacks match their editor.
  return `${userCode}

import sys as __sys, json as __json, time as __time, traceback as __tb

def __dsadebug_main():
    nonce = ${JSON.stringify(nonce)}
    cases = __json.loads(__sys.stdin.read() or "[]")
    out_stream = __sys.__stdout__
    for i, raw in enumerate(cases):
        t0 = __time.perf_counter()
        try:
            args = __json.loads(raw)
            if "solve" not in globals():
                raise NameError("No function named 'solve' was found. Define: def solve(...):")
            result = solve(*args)
            if result is None and len(args) > 0:
                result = args[0]  # in-place problems: report the mutated first argument
            line = {"i": i, "ok": True, "out": __json.dumps(result), "ms": int((__time.perf_counter() - t0) * 1000)}
        except BaseException:
            line = {"i": i, "ok": False, "err": __tb.format_exc()[-2000:], "ms": int((__time.perf_counter() - t0) * 1000)}
        out_stream.write("\\n" + nonce + __json.dumps(line) + "\\n")
        out_stream.flush()

__dsadebug_main()
`;
}

/**
 * C++ has no eval, so arguments are parsed into the exact C++ types declared in
 * the problem's cppSignature, then passed to the user's `solve(...)`.
 * Supported types: int, long long, double, bool, char, string, vector<T> (nested).
 */
const CPP_RUNTIME = `
namespace dsad {

struct Parser {
  const std::string& s;
  size_t i;
  explicit Parser(const std::string& str) : s(str), i(0) {}
  void ws() { while (i < s.size() && std::isspace(static_cast<unsigned char>(s[i]))) i++; }
  bool peek(char c) { ws(); return i < s.size() && s[i] == c; }
  bool take(char c) { if (peek(c)) { i++; return true; } return false; }
  void expect(char c) {
    ws();
    if (i >= s.size() || s[i] != c) throw std::runtime_error(std::string("Invalid test input: expected '") + c + "'");
    i++;
  }
};

// ---- readers ----
template <class T>
typename std::enable_if<std::is_integral<T>::value && !std::is_same<T, bool>::value && !std::is_same<T, char>::value>::type
read(Parser& p, T& v) {
  p.ws();
  const char* start = p.s.c_str() + p.i;
  char* end = nullptr;
  long long x = std::strtoll(start, &end, 10);
  if (end == start) throw std::runtime_error("Invalid test input: expected an integer");
  p.i += static_cast<size_t>(end - start);
  v = static_cast<T>(x);
}

template <class T>
typename std::enable_if<std::is_floating_point<T>::value>::type
read(Parser& p, T& v) {
  p.ws();
  const char* start = p.s.c_str() + p.i;
  char* end = nullptr;
  double x = std::strtod(start, &end);
  if (end == start) throw std::runtime_error("Invalid test input: expected a number");
  p.i += static_cast<size_t>(end - start);
  v = static_cast<T>(x);
}

inline void read(Parser& p, bool& v) {
  p.ws();
  if (p.s.compare(p.i, 4, "true") == 0) { v = true; p.i += 4; }
  else if (p.s.compare(p.i, 5, "false") == 0) { v = false; p.i += 5; }
  else throw std::runtime_error("Invalid test input: expected true or false");
}

inline void read(Parser& p, std::string& v) {
  p.expect('"');
  v.clear();
  while (p.i < p.s.size() && p.s[p.i] != '"') {
    char c = p.s[p.i];
    if (c == '\\\\' && p.i + 1 < p.s.size()) {
      p.i++;
      switch (p.s[p.i]) {
        case 'n': v += '\\n'; break;
        case 't': v += '\\t'; break;
        case 'r': v += '\\r'; break;
        case 'b': v += '\\b'; break;
        case 'f': v += '\\f'; break;
        case 'u': v += '?'; p.i += 4; break; // non-ASCII escapes are not needed for these problems
        default: v += p.s[p.i];
      }
    } else {
      v += c;
    }
    p.i++;
  }
  if (p.i >= p.s.size()) throw std::runtime_error("Invalid test input: unterminated string");
  p.i++; // closing quote
}

inline void read(Parser& p, char& v) {
  std::string tmp;
  read(p, tmp);
  if (tmp.size() != 1) throw std::runtime_error("Invalid test input: expected a single character");
  v = tmp[0];
}

template <class T>
void read(Parser& p, std::vector<T>& v) {
  p.expect('[');
  v.clear();
  if (p.take(']')) return;
  do {
    T e;
    read(p, e);
    v.push_back(e);
  } while (p.take(','));
  p.expect(']');
}

// ---- writers (JSON) ----
inline void write(std::ostream& o, bool v) { o << (v ? "true" : "false"); }

inline void write(std::ostream& o, const std::string& v) {
  o << '"';
  for (size_t k = 0; k < v.size(); k++) {
    unsigned char c = static_cast<unsigned char>(v[k]);
    switch (c) {
      case '"': o << "\\\\\\""; break;
      case '\\\\': o << "\\\\\\\\"; break;
      case '\\n': o << "\\\\n"; break;
      case '\\t': o << "\\\\t"; break;
      case '\\r': o << "\\\\r"; break;
      default:
        if (c < 0x20) { char buf[8]; std::snprintf(buf, sizeof buf, "\\\\u%04x", c); o << buf; }
        else o << static_cast<char>(c);
    }
  }
  o << '"';
}

inline void write(std::ostream& o, char v) { write(o, std::string(1, v)); }
inline void write(std::ostream& o, const char* v) { write(o, std::string(v)); }

template <class T>
typename std::enable_if<std::is_integral<T>::value && !std::is_same<T, bool>::value && !std::is_same<T, char>::value>::type
write(std::ostream& o, T v) { o << v; }

template <class T>
typename std::enable_if<std::is_floating_point<T>::value>::type
write(std::ostream& o, T v) {
  std::ostringstream tmp;
  tmp << std::setprecision(15) << v;
  o << tmp.str();
}

template <class T>
void write(std::ostream& o, const std::vector<T>& v) {
  o << '[';
  for (size_t k = 0; k < v.size(); k++) {
    if (k) o << ',';
    write(o, v[k]);
  }
  o << ']';
}

// ---- call + report: functions returning void are in-place, so report the first argument ----
template <class Fn, class First>
typename std::enable_if<!std::is_void<decltype(std::declval<Fn&>()())>::value, std::string>::type
report(Fn fn, First&) {
  std::ostringstream os;
  write(os, fn());
  return os.str();
}

template <class Fn, class First>
typename std::enable_if<std::is_void<decltype(std::declval<Fn&>()())>::value, std::string>::type
report(Fn fn, First& first) {
  fn();
  std::ostringstream os;
  write(os, first);
  return os.str();
}

} // namespace dsad
`;

function cppSource(userCode, nonce, signature) {
  const params = signature.params.map((t) => t.trim());

  const decls = params
    .map((type, k) => `${k === 0 ? "" : "      p.expect(',');\n"}      ${type} a${k};\n      dsad::read(p, a${k});`)
    .join("\n");
  const callArgs = params.map((_, k) => `a${k}`).join(", ");

  // #line makes compiler errors point at the user's own line numbers.
  return `#include <bits/stdc++.h>
using namespace std;
#line 1 "solution.cpp"
${userCode}
#line 1 "harness.cpp"
${CPP_RUNTIME}
int main() {
  std::string dsad_all((std::istreambuf_iterator<char>(std::cin)), std::istreambuf_iterator<char>());
  std::vector<std::string> dsad_cases;
  { dsad::Parser p(dsad_all); dsad::read(p, dsad_cases); }

  for (size_t idx = 0; idx < dsad_cases.size(); ++idx) {
    std::chrono::steady_clock::time_point t0 = std::chrono::steady_clock::now();
    bool ok = true;
    std::string out, err;
    try {
      dsad::Parser p(dsad_cases[idx]);
      p.expect('[');
${decls}
      p.expect(']');
      out = dsad::report([&]() { return solve(${callArgs}); }, a0);
    } catch (const std::exception& e) {
      ok = false; err = e.what();
    } catch (...) {
      ok = false; err = "Unknown exception thrown";
    }
    long long ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - t0).count();

    std::ostringstream rec;
    rec << "{\\"i\\":" << idx << ",\\"ok\\":" << (ok ? "true" : "false") << ",\\"ms\\":" << ms << ",";
    if (ok) { rec << "\\"out\\":"; dsad::write(rec, out); }
    else    { rec << "\\"err\\":"; dsad::write(rec, err); }
    rec << "}";
    std::cout << "\\n" << ${JSON.stringify(nonce)} << rec.str() << "\\n" << std::flush;
  }
  return 0;
}
`;
}

function buildSource(language, userCode, nonce, signature) {
  if (language === "python") return pythonSource(userCode, nonce);
  if (language === "cpp") return cppSource(userCode, nonce, signature);
  return javascriptSource(userCode, nonce);
}

/** Collect result records (one per test case) from raw stdout. */
function parseRecords(stdout, nonce) {
  const records = new Map();
  for (const line of stdout.split("\n")) {
    if (!line.startsWith(nonce)) continue;
    try {
      const rec = JSON.parse(line.slice(nonce.length));
      if (Number.isInteger(rec.i)) records.set(rec.i, rec);
    } catch {
      /* ignore malformed line */
    }
  }
  return records;
}

module.exports = { buildSource, parseRecords, validateCppSignature };
