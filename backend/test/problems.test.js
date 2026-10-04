require("./helpers");
process.env.EXEC_TIMEOUT_MS = "6000";
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { runAgainstTestCases } = require("../services/executionService");
const { problems } = require("../seed/problems.seed");
const references = require("./references");

const hasGpp = spawnSync("g++", ["--version"]).status === 0;

test("every seeded problem has a reference solution", () => {
  assert.deepEqual(problems.map((p) => p.slug).sort(), Object.keys(references).sort());
});

test("every seeded problem declares a valid C++ signature and starter", () => {
  for (const p of problems) {
    assert.ok(p.cppSignature?.params?.length > 0, `${p.slug}: cppSignature`);
    assert.match(p.starterCode.cpp, /solve\(/, `${p.slug}: cpp starter`);
    assert.ok(p.starterCode.javascript && p.starterCode.python, `${p.slug}: js/python starters`);
  }
});

for (const problem of problems) {
  for (const language of ["javascript", "python", "cpp"]) {
    const skip = language === "cpp" && !hasGpp ? "g++ not installed" : false;
    test(`${problem.slug} [${language}]: reference solution passes all ${problem.testCases.length} tests`, { skip }, async () => {
      const r = await runAgainstTestCases(language, references[problem.slug][language], problem.testCases, {
        compareMode: problem.compareMode,
        cppSignature: problem.cppSignature,
      });
      assert.equal(r.status, "accepted", `${r.status}: ${r.error || JSON.stringify(r.results.at(-1))}`);
    });
  }
}
