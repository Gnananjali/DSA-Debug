/**
 * Tiny leveled logger. Set LOG_LEVEL=debug|info|warn|error (default: info).
 * Keeps noisy diagnostics out of production logs and never logs user code
 * or test-case data at the default level.
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[(process.env.LOG_LEVEL || "info").toLowerCase()] ?? LEVELS.info;

function make(level, sink) {
  return (...args) => {
    if (LEVELS[level] <= current) sink(`[${level}]`, ...args);
  };
}

module.exports = {
  error: make("error", console.error),
  warn: make("warn", console.warn),
  info: make("info", console.log),
  debug: make("debug", console.log),
};
