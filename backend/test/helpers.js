// Shared test setup: deterministic env, no real DB/Redis needed.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.EXEC_MODE = "local"; // Docker isn't required to run the unit tests
process.env.EXEC_TIMEOUT_MS = "2000";
process.env.LOG_LEVEL = "error";
