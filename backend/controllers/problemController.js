const Problem = require("../models/Problem");

async function listProblems(req, res, next) {
  try {
    const { difficulty, tag } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (tag) filter.tags = tag;

    const problems = await Problem.find(filter)
      .select("title slug difficulty tags order")
      .sort({ order: 1, createdAt: 1 });

    res.json({ problems });
  } catch (err) {
    next(err);
  }
}

async function getProblem(req, res, next) {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // Never send hidden test cases to the client.
    const visibleTestCases = problem.testCases.filter((tc) => !tc.isHidden);

    res.json({
      problem: {
        id: problem._id,
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        difficulty: problem.difficulty,
        tags: problem.tags,
        starterCode: problem.starterCode,
        constraints: problem.constraints,
        sampleTestCases: visibleTestCases,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createProblem(req, res, next) {
  try {
    const problem = await Problem.create(req.body);
    res.status(201).json({ problem });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProblems, getProblem, createProblem };
