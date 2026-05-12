import dotenv from "dotenv";

import { getIO } from "../socket.js";

dotenv.config();
import { generateExplanation } from "../explanationEngine.js";
import { generateSuggestions } from "../suggestionEngine.js";
import { analyzeComplexity } from "../analyzer.js";
import { publisher } from "../pubsub.js";
import { Worker } from "bullmq";
import { runCodeInDocker } from "../dockerExecutor.js";

const worker = new Worker(
  "submissions",

  async (job) => {
    console.log(`Processing Job ${job.id}`);

    const { code } = job.data;
    const complexityAnalysis = analyzeComplexity(code);

    const suggestions = generateSuggestions(complexityAnalysis);
    const explanation = generateExplanation(complexityAnalysis);

    console.log("Explanation:", explanation);

    console.log("Suggestions:", suggestions);

    console.log("Complexity Analysis:", complexityAnalysis);

    // ✅ ADD HERE
    await publisher.publish(
      "job-events",
      JSON.stringify({
        jobId: job.id,
        status: "running",
      })
    );

    const result = await runCodeInDocker(code, async (chunk) => {
      await publisher.publish(
        "job-events",
        JSON.stringify({
          jobId: job.id,
          status: "streaming",
          chunk,
        })
      );
    });

    console.log("Execution Result:", result);

    // ✅ ADD COMPLETED EVENT HERE
    await publisher.publish(
      "job-events",
      JSON.stringify({
        jobId: job.id,
        status: "completed",
        result,
        complexityAnalysis,
        suggestions,
        explanation,
      })
    );

    return {
      ...result,
      complexityAnalysis,
    };
  },

  {
  connection: {
    url: process.env.REDIS_URL,
  },
}
);

console.log("🚀 Worker started...");
