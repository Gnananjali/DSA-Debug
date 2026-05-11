import { Queue } from "bullmq";

export const submissionQueue = new Queue("submissions", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});
