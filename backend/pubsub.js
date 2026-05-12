import dotenv from "dotenv";

dotenv.config();
import Redis from "ioredis";

export const publisher =
  new Redis(process.env.REDIS_URL);

export const subscriber =
  new Redis(process.env.REDIS_URL);

publisher.on("connect", () => {
  console.log("✅ Publisher Connected");
});

subscriber.on("connect", () => {
  console.log("✅ Subscriber Connected");
});