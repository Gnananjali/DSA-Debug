const { Redis } = require("ioredis");
const logger = require("../utils/logger");

// BullMQ requires maxRetriesPerRequest: null on the connection it manages.
function createRedisConnection() {
  const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  connection.on("connect", () => logger.info("[redis] connected"));
  connection.on("error", (err) => logger.error("[redis] error:", err.message));

  return connection;
}

module.exports = createRedisConnection;
