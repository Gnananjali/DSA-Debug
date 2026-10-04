require("./helpers");
const test = require("node:test");
const assert = require("node:assert/strict");
const { outputsMatch, deepEqual } = require("../services/executionService");

test("deepEqual ignores object key order and tolerates float noise", () => {
  assert.ok(deepEqual({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }));
  assert.ok(deepEqual(0.1 + 0.2, 0.3));
  assert.ok(!deepEqual([1, 2], [2, 1]));
  assert.ok(!deepEqual({ a: 1 }, { a: 1, b: 2 }));
  assert.ok(!deepEqual(null, {}));
});

test("outputsMatch: exact mode is order-sensitive", () => {
  assert.ok(outputsMatch("[0,1]", "[0,1]"));
  assert.ok(!outputsMatch("[1,0]", "[0,1]"));
});

test("outputsMatch: unordered mode accepts any ordering", () => {
  assert.ok(outputsMatch("[1,0]", "[0,1]", "unordered"));
  assert.ok(!outputsMatch("[1,2]", "[0,1]", "unordered"));
});

test("outputsMatch: booleans and non-JSON fall back sensibly", () => {
  assert.ok(outputsMatch("true", "true"));
  assert.ok(!outputsMatch("false", "true"));
  assert.ok(outputsMatch("hello", " hello "));
});
