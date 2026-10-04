/**
 * Execution worker. Run separately from the API:   npm run worker
 * (or together with the API on one small host:      npm run start:all)
 *
 * It pulls submissions from the BullMQ queue, runs them in the sandbox,
 * stores the verdict, then (optionally) adds AI analysis, pushing every state
 * change to the user's browser through the Socket.IO Redis emitter.
 */
require("dotenv").config();
const { Worker } = require("bullmq");
const { Emitter } = require("@socket.io/redis-emitter");

const logger = require("../utils/logger");
const { validateEnv } = require("../config/env");
const createRedisConnection = require("../config/redis");
const connectDB = require("../config/db");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const User = require("../models/User");
const { runAgainstTestCases } = require("../services/executionService");
const { analyzeSubmission } = require("../services/aiService");

const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 2);
const STUCK_AFTER_MS = 5 * 60 * 1000; // queued/running longer than this => the worker died mid-job
const REAP_EVERY_MS = 60 * 1000;

let emitter = null;

function emitStatus(submission) {
  if (!emitter) return;
  emitter.to(`user:${submission.user.toString()}`).emit("submission:update", {
    submissionId: submission._id,
    status: submission.status,
    testsPassed: submission.testsPassed,
    testsTotal: submission.testsTotal,
    runtimeMs: submission.runtimeMs,
    failedCase: submission.failedCase,
    aiAnalysis: submission.aiAnalysis,
    error: submission.error,
  });
}

async function failSubmission(submission, message) {
  submission.status = "error";
  submission.error = message;
  await submission.save();
  emitStatus(submission);
}

/** Atomic: two concurrent accepts of the same problem can't double-count. */
async function updateUserStatsOnAccept(submission, problem) {
  const inc = { "stats.solved": 1 };
  const difficultyKey = { Easy: "easySolved", Medium: "mediumSolved", Hard: "hardSolved" }[problem.difficulty];
  if (difficultyKey) inc[`stats.${difficultyKey}`] = 1;

  await User.updateOne(
    { _id: submission.user, solvedProblems: { $ne: problem._id } }, // only the first accept counts
    { $push: { solvedProblems: problem._id }, $inc: inc }
  );
}

async function processJob(job) {
  const { submissionId } = job.data;
  logger.debug(`[worker] job ${job.id} submission=${submissionId}`);

  const submission = await Submission.findById(submissionId);
  if (!submission) return;
  if (!["queued", "running"].includes(submission.status)) return; // already finished (duplicate delivery)

  const problem = await Problem.findById(submission.problem);
  if (!problem) {
    await failSubmission(submission, "This problem no longer exists.");
    return;
  }

  submission.status = "running";
  await submission.save();
  emitStatus(submission);

  let outcome;
  try {
    outcome = await runAgainstTestCases(submission.language, submission.code, problem.testCases, {
      compareMode: problem.compareMode,
      cppSignature: problem.cppSignature,
    });
  } catch (err) {
    // Infrastructure failure (not the user's fault). Rethrow so BullMQ retries;
    // only surface an error to the user once retries are exhausted.
    logger.error(`[worker] execution infrastructure error (attempt ${job.attemptsMade + 1}):`, err.message);
    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
    if (!isLastAttempt) throw err;
    await failSubmission(submission, "The code runner is unavailable right now. Please try again shortly.");
    return;
  }

  submission.status = outcome.status;
  submission.testsTotal = problem.testCases.length;
  submission.testsPassed = outcome.results.filter((r) => r.passed).length;
  submission.runtimeMs = outcome.runtimeMs;
  submission.error = outcome.error;
  submission.failedCase = undefined;

  const firstFailure = outcome.results.find((r) => !r.passed);
  if (firstFailure) {
    // Hidden tests must never reveal their input or expected output.
    submission.failedCase = firstFailure.isHidden
      ? { hidden: true }
      : {
          hidden: false,
          input: firstFailure.input,
          expectedOutput: firstFailure.expectedOutput,
          actualOutput: firstFailure.actualOutput,
        };
  } else if (outcome.failedHidden) {
    submission.failedCase = { hidden: true }; // timeout / runtime error on a hidden test
  }

  await submission.save();
  emitStatus(submission);

  if (submission.status === "accepted") {
    await updateUserStatsOnAccept(submission, problem);
  }

  // AI analysis runs after the verdict so it never delays correctness feedback.
  // (Skipped when nothing ran: a compile error or system error has no solution to analyze.)
  if (process.env.GROQ_API_KEY && !["error", "compile_error"].includes(submission.status)) {
    try {
      submission.aiAnalysis = await analyzeSubmission({
        problemTitle: problem.title,
        language: submission.language,
        code: submission.code,
        status: submission.status,
      });
      await submission.save();
      emitStatus(submission);
    } catch (aiErr) {
      logger.warn("[worker] AI analysis failed:", aiErr.message);
    }
  }
}

/**
 * If a worker is killed mid-job (deploy, crash, OOM) the submission would sit
 * on "running" forever. Periodically fail anything that has been pending too long.
 */
async function reapStuckSubmissions() {
  try {
    const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
    const stuck = await Submission.find({
      status: { $in: ["queued", "running"] },
      updatedAt: { $lt: cutoff },
    });
    for (const submission of stuck) {
      logger.warn(`[worker] reaping stuck submission ${submission._id}`);
      await failSubmission(submission, "Your submission timed out while waiting to run. Please resubmit.");
    }
  } catch (err) {
    logger.error("[worker] reaper failed:", err.message);
  }
}

async function start() {
  validateEnv(["MONGO_URI", "REDIS_URL"]);
  await connectDB();

  const connection = createRedisConnection();
  emitter = new Emitter(createRedisConnection());

  const worker = new Worker("code-execution", processJob, { connection, concurrency: CONCURRENCY });

  worker.on("failed", (job, err) => {
    logger.error(`[worker] job ${job?.id} failed:`, err.message);
  });

  const reaper = setInterval(reapStuckSubmissions, REAP_EVERY_MS);
  reaper.unref();
  reapStuckSubmissions();

  const shutdown = async (signal) => {
    logger.info(`[worker] ${signal} received, finishing current jobs`);
    clearInterval(reaper);
    await worker.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  logger.info(`[worker] execution worker started (concurrency=${CONCURRENCY})`);
}

start().catch((err) => {
  logger.error("[worker] fatal startup error:", err);
  process.exit(1);
});
