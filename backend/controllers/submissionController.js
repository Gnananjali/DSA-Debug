const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { enqueueSubmission } = require("../queue/executionQueue");
const { validateSubmission } = require("../utils/validate");
const {
  SUPPORTED_LANGUAGES,
  MAX_CODE_LENGTH,
  MAX_PENDING_SUBMISSIONS_PER_USER,
} = require("../utils/constants");
const logger = require("../utils/logger");

async function createSubmission(req, res, next) {
  try {
    const problemMsg = validateSubmission(req.body, {
      languages: SUPPORTED_LANGUAGES,
      maxCodeLength: MAX_CODE_LENGTH,
    });
    if (problemMsg) return res.status(400).json({ message: problemMsg });

    const { problemSlug, language, code } = req.body;

    const problem = await Problem.findOne({ slug: problemSlug });
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    if (language === "cpp" && !problem.cppSignature?.params?.length) {
      return res.status(400).json({ message: "C++ isn't available for this problem yet." });
    }

    // One user must not be able to flood the shared execution queue.
    const pending = await Submission.countDocuments({
      user: req.userId,
      status: { $in: ["queued", "running"] },
    });
    if (pending >= MAX_PENDING_SUBMISSIONS_PER_USER) {
      return res
        .status(429)
        .json({ message: "You already have submissions running. Wait for them to finish." });
    }

    const submission = await Submission.create({
      user: req.userId,
      problem: problem._id,
      language,
      code,
      status: "queued",
    });

    try {
      await enqueueSubmission(submission._id.toString());
    } catch (queueErr) {
      logger.error("[submission] failed to enqueue:", queueErr.message);
      submission.status = "error";
      submission.error = "Could not queue your submission. Please try again.";
      await submission.save();
      return res.status(503).json({ message: submission.error });
    }

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
      .select("-code") // list view doesn't need source code
      .populate("problem", "title slug difficulty")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ submissions });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSubmission, getSubmission, listMySubmissions };
