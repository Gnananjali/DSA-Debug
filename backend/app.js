/**
 * Express app, with no side effects (no DB, no listen) so tests can import it.
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { getClientOrigins } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind Render's proxy: needed for correct client IPs in rate limiting

  app.use(helmet());
  app.use(cors({ origin: getClientOrigins(), credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("tiny"));

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api/problems", problemRoutes);
  app.use("/api/submissions", submissionRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
