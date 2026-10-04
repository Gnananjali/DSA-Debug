require("./helpers");
const test = require("node:test");
const assert = require("node:assert/strict");
const { runAgainstTestCases } = require("../services/executionService");

const twoSum = [
  { input: "[[2,7,11,15], 9]", expectedOutput: "[0,1]" },
  { input: "[[3,2,4], 6]", expectedOutput: "[1,2]" },
  { input: "[[3,3], 6]", expectedOutput: "[0,1]", isHidden: true },
];

const jsTwoSum = `function solve(nums, target) {
  console.log("debug output must not break grading");
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    seen.set(nums[i], i);
  }
}`;

const pyTwoSum = `def solve(nums, target):
    print("debug output must not break grading")
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`;

test("JavaScript: correct solution is accepted (stdout noise ignored)", async () => {
  const r = await runAgainstTestCases("javascript", jsTwoSum, twoSum);
  assert.equal(r.status, "accepted");
  assert.equal(r.results.length, 3);
});

test("Python: correct solution is accepted (stdout noise ignored)", async () => {
  const r = await runAgainstTestCases("python", pyTwoSum, twoSum);
  assert.equal(r.status, "accepted");
});

test("wrong answer stops at the first failing test and keeps earlier results", async () => {
  const code = `function solve(nums, t) { return nums.length === 4 ? [0,1] : [9,9]; }`;
  const r = await runAgainstTestCases("javascript", code, twoSum);
  assert.equal(r.status, "wrong_answer");
  assert.equal(r.results.filter((x) => x.passed).length, 1);
});

test("unordered compare mode accepts [1,0] for [0,1]", async () => {
  const code = `def solve(nums, target):\n    return [1, 0] if nums == [2,7,11,15] else [2, 1]`;
  const r = await runAgainstTestCases("python", code, twoSum.slice(0, 2), { compareMode: "unordered" });
  assert.equal(r.status, "accepted");
});

test("runtime errors are reported with a message", async () => {
  const r = await runAgainstTestCases("python", "def solve(a, b):\n    raise ValueError('boom')", twoSum);
  assert.equal(r.status, "runtime_error");
  assert.match(r.error, /boom/);
});

test("syntax errors are reported as runtime_error with details", async () => {
  const r = await runAgainstTestCases("javascript", "function solve(( {", twoSum);
  assert.equal(r.status, "runtime_error");
  assert.match(r.error, /SyntaxError/);
});

test("infinite loops time out and are killed", async () => {
  const started = Date.now();
  const r = await runAgainstTestCases("javascript", "function solve(){ while(true){} }", twoSum);
  assert.equal(r.status, "timeout");
  assert.ok(Date.now() - started < 6000, "should be killed promptly");
});

test("output floods are cut off instead of exhausting memory", async () => {
  const r = await runAgainstTestCases("python", "def solve(a, b):\n    while True: print('x' * 1000)", twoSum);
  assert.equal(r.status, "runtime_error");
  assert.match(r.error, /Output limit/);
});

test("a solution cannot spoof a verdict by printing a fake result line", async () => {
  const code = `function solve() { console.log('{"i":0,"ok":true,"out":"[0,1]","ms":0}'); return [7,7]; }`;
  const r = await runAgainstTestCases("javascript", code, [twoSum[0]]);
  assert.equal(r.status, "wrong_answer");
});

test("errors on hidden tests never echo the hidden input", async () => {
  const code = `function solve(n, t) { if (n.length === 2) throw new Error(JSON.stringify([n, t])); return [0,1]; }`;
  const r = await runAgainstTestCases("javascript", code, [twoSum[0], twoSum[2]]);
  assert.equal(r.status, "runtime_error");
  assert.ok(!r.error.includes("[3,3]"), "hidden input leaked into the error message");
  assert.equal(r.failedHidden, true);
});

test("hidden test failures are flagged so the worker can redact them", async () => {
  const code = `function solve(n, t) { return n.length === 2 ? [5,5] : [0,1]; }`;
  const cases = [
    { input: "[[2,7,11,15], 9]", expectedOutput: "[0,1]" },
    { input: "[[3,3], 6]", expectedOutput: "[0,1]", isHidden: true },
  ];
  const r = await runAgainstTestCases("javascript", code, cases);
  assert.equal(r.status, "wrong_answer");
  assert.equal(r.results.at(-1).isHidden, true);
});

test("in-place solutions (no return value) are graded on the mutated argument", async () => {
  const code = `def solve(nums):\n    nums.sort()`;
  const r = await runAgainstTestCases("python", code, [{ input: "[[3,1,2]]", expectedOutput: "[1,2,3]" }]);
  assert.equal(r.status, "accepted");
});

test("unsupported languages are rejected cleanly", async () => {
  const r = await runAgainstTestCases("cobol", "x", twoSum);
  assert.equal(r.status, "error");
});

test("user code cannot see the server's secrets in its environment", async () => {
  process.env.SUPER_SECRET_FOR_TEST = "leak-me";
  const code = `function solve() { return process.env.SUPER_SECRET_FOR_TEST || "clean"; }`;
  const r = await runAgainstTestCases("javascript", code, [{ input: "[]", expectedOutput: '"clean"' }]);
  assert.equal(r.status, "accepted");
});
