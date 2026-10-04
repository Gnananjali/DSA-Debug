require("./helpers");
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { runAgainstTestCases } = require("../services/executionService");

const skip = spawnSync("g++", ["--version"]).status === 0 ? false : "g++ not installed";
const sig = { params: ["vector<int>", "int"] };
const cases = [
  { input: "[[2,7,11,15], 9]", expectedOutput: "[0,1]" },
  { input: "[[3,2,4], 6]", expectedOutput: "[1,2]" },
  { input: "[[3,3], 6]", expectedOutput: "[0,1]", isHidden: true },
];
const run = (code, extra = {}, tcs = cases) =>
  runAgainstTestCases("cpp", code, tcs, { cppSignature: sig, ...extra });

test("C++: accepted, even when the program prints extra output (with and without newline)", { skip }, async () => {
  const r = await run(`vector<int> solve(vector<int>& n, int t) { cout << "debug" << endl; printf("no newline");
    for (int i = 0; i < (int)n.size(); i++) for (int j = i + 1; j < (int)n.size(); j++) if (n[i] + n[j] == t) return {i, j}; return {}; }`);
  assert.equal(r.status, "accepted");
});

test("C++: wrong answer", { skip }, async () => {
  assert.equal((await run("vector<int> solve(vector<int>& n, int t){ return {9,9}; }")).status, "wrong_answer");
});

test("C++: syntax errors are reported as compile_error with the user's line numbers", { skip }, async () => {
  const r = await run("vector<int> solve(vector<int>& n, int t){\n  return 1 +;\n}");
  assert.equal(r.status, "compile_error");
  assert.match(r.error, /solution\.cpp:2:/);
});

test("C++: missing solve() or a wrong signature gives a friendly message", { skip }, async () => {
  const missing = await run("int other() { return 1; }");
  assert.equal(missing.status, "compile_error");
  assert.match(missing.error, /No function named 'solve'/);

  const wrong = await run("string solve(string s) { return s; }");
  assert.equal(wrong.status, "compile_error");
  assert.match(wrong.error, /signature/);
});

test("C++: segfault and uncaught exception are runtime errors with hints", { skip }, async () => {
  const seg = await run("vector<int> solve(vector<int>& n, int t){ int* p = nullptr; return {*p}; }");
  assert.equal(seg.status, "runtime_error");
  assert.match(seg.error, /Segmentation fault/);

  const exc = await run('vector<int> solve(vector<int>& n, int t){ throw runtime_error("boom"); }');
  assert.equal(exc.status, "runtime_error");
  assert.match(exc.error, /boom/);
});

test("C++: infinite loops time out", { skip }, async () => {
  assert.equal((await run("vector<int> solve(vector<int>& n, int t){ while(true){} }")).status, "timeout");
});

test("C++: exceptions on hidden tests never echo hidden input", { skip }, async () => {
  const r = await run(`vector<int> solve(vector<int>& n, int t) { if (n.size() == 2) throw runtime_error("hidden:" + to_string(n[0])); return {0, 1}; }`,
    {}, [cases[0], cases[2]]);
  assert.equal(r.status, "runtime_error");
  assert.ok(!r.error.includes("hidden:3"));
});

test("C++: a malicious signature cannot inject code into the harness", async () => {
  const r = await run("vector<int> solve(vector<int>& n, int t){ return {}; }", { cppSignature: { params: ['vector<int>); system("id"); //'] } });
  assert.equal(r.status, "error");
});

test("C++: problems without a signature report that C++ is unavailable", async () => {
  const r = await runAgainstTestCases("cpp", "int solve(){return 1;}", cases, {});
  assert.equal(r.status, "error");
  assert.match(r.error, /not available/);
});
