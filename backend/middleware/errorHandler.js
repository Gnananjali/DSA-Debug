const logger = require("../utils/logger");

function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  // Map common library errors to the right HTTP status.
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  } else if (err.name === "ValidationError") {
    status = 400;
  } else if (err.code === 11000) {
    status = 409;
    message = "That value is already taken";
  }

  if (status >= 500) {
    logger.error("[error]", err);
    // Never leak internals to clients in production.
    if (process.env.NODE_ENV === "production") message = "Internal server error";
  }

  res.status(status).json({ message: message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
