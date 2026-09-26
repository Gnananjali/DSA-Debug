/**
 * Standalone worker process. Run separately from the API:
 *   npm run worker
 * On Render, deploy this as a second "Background Worker" service pointed
 * at the same repo, so heavy code execution never blocks API requests.
 */
require("dotenv").config();
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const createRedisConnection = require("../config/redis");
const connectDB = require("../config/db");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { Emitter } = require("@socket.io/redis-emitter");
const { runAgainstTestCases } = require("../services/executionService");
const { analyzeSubmission } = require("../services/aiService");

let emitter = null;

async function start() {
  await connectDB();
  const connection = createRedisConnection();
  const emitterRedis = createRedisConnection();

emitterRedis.on("ready", () => {
  console.log("[worker] emitter Redis ready");
});

emitter = new Emitter(emitterRedis);

  const worker = new Worker(
    "code-execution",
    async (job) => {
      const { submissionId } = job.data;

console.log(
  `[worker] processing job ${job.id}, submissionId=${submissionId}`
);
      const submission = await Submission.findById(submissionId);
      if (!submission) return;

      const problem = await Problem.findById(submission.problem);
      submission.status = "running";
      await submission.save();
      emitStatus(submission);

      try {
        const outcome = await runAgainstTestCases(
          submission.language,
          submission.code,
          problem.testCases
        );

        submission.status = outcome.status;
        submission.testsTotal = problem.testCases.length;
        submission.testsPassed = outcome.results.filter((r) => r.passed).length;
        submission.runtimeMs = outcome.runtimeMs;
        if (outcome.error) submission.error = outcome.error;

        const firstFailure = outcome.results.find((r) => !r.passed);
        if (firstFailure) {
          submission.failedCase = {
            input: firstFailure.input,
            expectedOutput: firstFailure.expectedOutput,
            actualOutput: firstFailure.actualOutput,
          };
        }

        await submission.save();
        emitStatus(submission);

        // AI analysis runs after the verdict so it never blocks correctness feedback.
        if (process.env.GROQ_API_KEY) {
          try {
            const analysis = await analyzeSubmission({
  problemTitle: problem.title,
  language: submission.language,
  code: submission.code,
  status: submission.status,
});

console.log("[worker] AI analysis result:", analysis);

submission.aiAnalysis = analysis;
            await submission.save();
            emitStatus(submission);
          } catch (aiErr) {
            console.error("[worker] AI analysis failed:", aiErr.message);
          }
        }

        // Update user stats on first-time accept.
        if (submission.status === "accepted") {
          await updateUserStatsOnAccept(submission, problem);
        }
      } catch (err) {
        submission.status = "error";
        submission.error = err.message;
        await submission.save();
        emitStatus(submission);
      }
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err.message);
  });

  console.log("[worker] execution worker started");
}

function emitStatus(submission) {
  if (!emitter) return;

  const room = `user:${submission.user.toString()}`;

  console.log(
    `[worker] emitting submission:update room=${room}, status=${submission.status}, submissionId=${submission._id}`
  );

  emitter.to(room).emit("submission:update", {
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

async function updateUserStatsOnAccept(submission, problem) {
  const User = require("../models/User");
  const user = await User.findById(submission.user);
  if (!user) return;
  const alreadySolved = user.solvedProblems.some((id) => id.toString() === problem._id.toString());
  if (alreadySolved) return;

  user.solvedProblems.push(problem._id);
  user.stats.solved += 1;
  if (problem.difficulty === "Easy") user.stats.easySolved += 1;
  if (problem.difficulty === "Medium") user.stats.mediumSolved += 1;
  if (problem.difficulty === "Hard") user.stats.hardSolved += 1;
  await user.save();
}

start().catch((err) => {
  console.error("[worker] fatal startup error:", err);
  process.exit(1);
});
