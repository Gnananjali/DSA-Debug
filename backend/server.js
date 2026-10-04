require("dotenv").config();
const http = require("http");

const logger = require("./utils/logger");
const { validateEnv, getClientOrigins } = require("./config/env");
const connectDB = require("./config/db");
const { initSockets } = require("./sockets");
const { createApp } = require("./app");

validateEnv();

const app = createApp();
const httpServer = http.createServer(app);
initSockets(httpServer, getClientOrigins());

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => logger.info(`[server] listening on :${PORT}`));
  })
  .catch((err) => {
    logger.error("[server] failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

function shutdown(signal) {
  logger.info(`[server] ${signal} received, shutting down`);
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
