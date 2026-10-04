require("./helpers");
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseAnalysis } = require("../services/aiService");

test("parses clean JSON", () => {
  const out = parseAnalysis('{"timeComplexity":"O(n)","spaceComplexity":"O(1)","summary":"Single pass.","suggestions":["Add comments"]}');
  assert.equal(out.timeComplexity, "O(n)");
  assert.deepEqual(out.suggestions, ["Add comments"]);
});

test("extracts JSON wrapped in prose and code fences", () => {
  const out = parseAnalysis('Sure!\n```json\n{"timeComplexity":"O(n log n)","spaceComplexity":"O(n)","summary":"Sorts first.","suggestions":[]}\n```\nHope that helps.');
  assert.equal(out.timeComplexity, "O(n log n)");
});

test("falls back safely on garbage", () => {
  assert.equal(parseAnalysis("no json here").timeComplexity, "unknown");
  assert.equal(parseAnalysis("{ not valid json }").summary, "AI analysis could not be parsed.");
});

test("coerces bad shapes and caps lengths", () => {
  const out = parseAnalysis(JSON.stringify({
    timeComplexity: 42,
    spaceComplexity: "O(1)",
    summary: "x".repeat(5000),
    suggestions: ["a", 7, null, "b", "c", "d", "e", "f", "g"],
  }));
  assert.equal(out.timeComplexity, "unknown");
  assert.equal(out.summary.length, 500);
  assert.deepEqual(out.suggestions, ["a", "b", "c", "d", "e"]);
});

test("the AI module can be loaded without a GROQ_API_KEY (no crash at import)", () => {
  delete process.env.GROQ_API_KEY;
  assert.doesNotThrow(() => require("../services/aiService"));
});
