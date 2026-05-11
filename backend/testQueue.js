import { submissionQueue } from "./queue.js";

await submissionQueue.add("execute", {
  code: "console.log(2 + 3)",
});

console.log("Job added");
process.exit();
