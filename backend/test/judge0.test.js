require("./helpers");
process.env.EXEC_MODE = "judge0";
process.env.EXEC_TIMEOUT_MS = "2000";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// ---- A tiny fake Judge0 that speaks the real API shape and really executes the code ----
const b64 = (s) => Buffer.from(s || "", "utf8").toString("base64");
const unb64 = (s) => Buffer.from(s || "", "base64").toString("utf8");
const results = new Map();
const polls = new Map();
const seen = [];
let injected = null; // set per test to simulate Judge0 failures

function execute(p) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fake-j0-"));
  const stdin = unb64(p.stdin);
  const timeout = (p.cpu_time_limit || 2) * 1000;
  let run;
  if (p.language_id === 54) {
    fs.writeFileSync(path.join(dir, "sol.cpp"), unb64(p.source_code));
    const c = spawnSync("g++", ["-std=c++14", "-o", path.join(dir, "sol"), path.join(dir, "sol.cpp")], { encoding: "utf8" });
    if (c.status !== 0) return { status: { id: 6, description: "Compilation Error" }, compile_output: b64(c.stderr) };
    run = spawnSync(path.join(dir, "sol"), [], { input: stdin, encoding: "utf8", timeout });
  } else {
    const [cmd, file] = p.language_id === 71 ? ["python3", "sol.py"] : ["node", "sol.js"];
    fs.writeFileSync(path.join(dir, file), unb64(p.source_code));
    run = spawnSync(cmd, [file], { input: stdin, cwd: dir, encoding: "utf8", timeout });
  }
  fs.rmSync(dir, { recursive: true, force: true });
  if (run.error && run.error.code === "ETIMEDOUT") {
    return { status: { id: 5, description: "Time Limit Exceeded" }, stdout: b64(run.stdout), stderr: null };
  }
  return {
    status: run.status === 0 ? { id: 3, description: "Accepted" } : { id: 11, description: "Runtime Error (NZEC)" },
    stdout: b64(run.stdout),
    stderr: b64(run.stderr),
  };
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    const url = new URL(req.url, "http://fake");
    const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

    if (injected && injected.httpError) return send(injected.httpError, { error: "boom" });

    if (req.method === "POST" && url.pathname === "/submissions") {
      assert.equal(url.searchParams.get("base64_encoded"), "true");
      const payload = JSON.parse(body);
      seen.push({ payload, headers: req.headers });
      const token = crypto.randomUUID();
      results.set(token, injected && injected.result ? injected.result : execute(payload));
      polls.set(token, 0);
      return send(201, { token });
    }
    const m = url.pathname.match(/^\/submissions\/(.+)$/);
    if (req.method === "GET" && m) {
      const n = polls.get(m[1]) || 0;
      polls.set(m[1], n + 1);
      if (n === 0) return send(200, { status: { id: 2, description: "Processing" } }); // exercise polling
      return send(200, results.get(m[1]));
    }
    send(404, {});
  });
});

let runAgainstTestCases;
test.before(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  process.env.JUDGE0_URL = `http://127.0.0.1:${server.address().port}`;
  ({ runAgainstTestCases } = require("../services/executionService"));
});
test.after(() => server.close());
test.beforeEach(() => { injected = null; seen.length = 0; });

const cases = [
  { input: "[[2,7,11,15], 9]", expectedOutput: "[0,1]" },
  { input: "[[3,3], 6]", expectedOutput: "[0,1]", isHidden: true },
];
const sig = { params: ["vector<int>", "int"] };
const solutions = {
  javascript: `function solve(n,t){ const m=new Map(); for(let i=0;i<n.length;i++){ if(m.has(t-n[i])) return [m.get(t-n[i]),i]; m.set(n[i],i);} }`,
  python: `def solve(n, t):\n    s = {}\n    for i, x in enumerate(n):\n        if t - x in s: return [s[t - x], i]\n        s[x] = i`,
  cpp: `vector<int> solve(vector<int>& n, int t){ map<int,int> m; for(int i=0;i<(int)n.size();i++){ if(m.count(t-n[i])) return {m[t-n[i]], i}; m[n[i]]=i;} return {}; }`,
};

for (const language of ["javascript", "python", "cpp"]) {
  test(`judge0 mode: ${language} solution is accepted (base64 + polling path)`, async () => {
    const r = await runAgainstTestCases(language, solutions[language], cases, { cppSignature: sig });
    assert.equal(r.status, "accepted");
    assert.equal(seen.length, 1, "all test cases must go in a single Judge0 submission");
    assert.equal(seen[0].payload.language_id, { javascript: 63, python: 71, cpp: 54 }[language]);
    assert.match(unb64(seen[0].payload.source_code), /solve/);
    assert.equal(seen[0].payload.cpu_time_limit, 2);
  });
}

test("judge0 mode: wrong answers are detected", async () => {
  const r = await runAgainstTestCases("python", "def solve(n, t):\n    return [7, 7]", cases);
  assert.equal(r.status, "wrong_answer");
});

test("judge0 mode: C++ compile errors become compile_error with details", async () => {
  const r = await runAgainstTestCases("cpp", "vector<int> solve(vector<int>& n, int t){ return 1 +; }", cases, { cppSignature: sig });
  assert.equal(r.status, "compile_error");
  assert.match(r.error, /error/);
});

test("judge0 mode: time limit exceeded maps to timeout", async () => {
  const r = await runAgainstTestCases("javascript", "function solve(){ while(true){} }", cases);
  assert.equal(r.status, "timeout");
});

test("judge0 mode: runtime errors surface stderr", async () => {
  const r = await runAgainstTestCases("python", "def solve(n, t):\n    raise ValueError('boom')", cases);
  assert.equal(r.status, "runtime_error");
});

test("judge0 mode: auth headers are sent when configured", async () => {
  process.env.JUDGE0_AUTH_TOKEN = "secret-token";
  try {
    await runAgainstTestCases("python", solutions.python, cases);
    assert.equal(seen[0].headers["x-auth-token"], "secret-token");
  } finally {
    delete process.env.JUDGE0_AUTH_TOKEN;
  }
});

test("judge0 mode: infrastructure failures THROW so the queue can retry", async () => {
  injected = { httpError: 503 };
  await assert.rejects(() => runAgainstTestCases("python", solutions.python, cases), /Judge0 responded 503/);

  injected = { result: { status: { id: 13, description: "Internal Error" }, message: b64("isolate crashed") } };
  await assert.rejects(() => runAgainstTestCases("python", solutions.python, cases), /Judge0 internal error/);
});

test("C++ is refused cleanly when a problem has no signature", async () => {
  const r = await runAgainstTestCases("cpp", solutions.cpp, cases, {});
  assert.equal(r.status, "error");
  assert.equal(seen.length, 0, "must not even call Judge0");
});
