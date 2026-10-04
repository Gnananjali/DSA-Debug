const { Queue } = require("bullmq");
const createRedisConnection = require("../config/redis");

let queue = null;

// Lazy: importing this module must not open a Redis connection (keeps tests and
// scripts fast, and lets the app boot far enough to report a clear config error).
function getQueue() {
  if (!queue) {
    queue = new Queue("code-execution", { connection: createRedisConnection() });
  }
  return queue;
}

async function enqueueSubmission(submissionId) {
  await getQueue().add(
    "run-submission",
    { submissionId },
    {
      // Infrastructure failures (Docker hiccup, Mongo blip) are retried once with backoff.
      // A wrong answer / runtime error in the user's code is a normal result, not a failure.
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    }
  );
}

module.exports = { getQueue, enqueueSubmission };
