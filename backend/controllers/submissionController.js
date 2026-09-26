const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { enqueueSubmission } = require("../queue/executionQueue");

async function createSubmission(req, res, next) {
  try {
    const { problemSlug, language, code } = req.body;
    if (!problemSlug || !language || !code) {
      return res.status(400).json({ message: "problemSlug, language and code are required" });
    }
    if (!["javascript", "python"].includes(language)) {
      return res.status(400).json({ message: "language must be javascript or python" });
    }

    const problem = await Problem.findOne({ slug: problemSlug });
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const submission = await Submission.create({
      user: req.userId,
      problem: problem._id,
      language,
      code,
      status: "queued",
    });

    await enqueueSubmission(submission._id.toString());

    res.status(202).json({ submissionId: submission._id, status: submission.status });
  } catch (err) {
    next(err);
  }
}

async function getSubmission(req, res, next) {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, user: req.userId }).populate(
      "problem",
      "title slug difficulty"
    );
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

async function listMySubmissions(req, res, next) {
  try {
    const submissions = await Submission.find({ user: req.userId })
      .populate("problem", "title slug difficulty")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ submissions });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSubmission, getSubmission, listMySubmissions };
