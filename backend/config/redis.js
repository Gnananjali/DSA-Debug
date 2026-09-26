const { Redis } = require("ioredis");

// BullMQ requires maxRetriesPerRequest: null on the connection it manages.
function createRedisConnection() {
  const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  connection.on("connect", () => console.log("[redis] connected"));
  connection.on("error", (err) => console.error("[redis] error:", err.message));

  return connection;
}

module.exports = createRedisConnection;
