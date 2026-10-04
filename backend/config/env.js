const logger = require("../utils/logger");

const isProd = () => process.env.NODE_ENV === "production";

/**
 * Fail fast with a readable message instead of crashing later with a
 * confusing stack trace (or, worse, running with a weak secret).
 */
function validateEnv(required = ["MONGO_URI", "REDIS_URL", "JWT_SECRET"]) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (required.includes("JWT_SECRET")) {
    const secret = process.env.JWT_SECRET;
    if (isProd() && secret.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters in production. Generate one with: " +
          "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
      );
    }
    if (!isProd() && secret.length < 32) {
      logger.warn("JWT_SECRET is shorter than 32 characters. Use a long random value before deploying.");
    }
  }
}

function getClientOrigins() {
  const origins = (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    if (isProd()) {
      logger.warn("CLIENT_ORIGINS is empty in production: browsers will be blocked by CORS.");
      return [];
    }
    return ["http://localhost:5173"]; // Vite dev server
  }
  return origins;
}

module.exports = { validateEnv, getClientOrigins, isProd };
