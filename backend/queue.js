import dotenv from "dotenv";

import { Queue } from "bullmq";

dotenv.config();

export const submissionQueue = new Queue(
  "submissions",

  {
    connection: {
      url: process.env.REDIS_URL,
    },
  }
);
