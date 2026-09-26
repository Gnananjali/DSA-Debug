const { Queue } = require("bullmq");
const createRedisConnection = require("../config/redis");

const connection = createRedisConnection();

const executionQueue = new Queue("code-execution", { connection });

async function enqueueSubmission(submissionId) {
  await executionQueue.add(
    "run-submission",
    { submissionId },
    {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 100,
    }
  );
}

module.exports = { executionQueue, enqueueSubmission };
