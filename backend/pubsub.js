import Redis from "ioredis";

export const publisher = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

export const subscriber = new Redis({
  host: "127.0.0.1",
  port: 6379,
});
