const rateLimit = require("express-rate-limit");

const json = (message) => ({ message });

// Brute-force protection: only FAILED logins count toward the limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: json("Too many failed login attempts. Try again in 15 minutes."),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: json("Too many sign-ups from this address. Try again later."),
});

// Per USER (not per IP): shared networks such as colleges/offices must not
// throttle each other. Mount this AFTER requireAuth so req.userId is set.
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId,
  message: json("You're submitting too quickly. Please wait a moment."),
});

module.exports = { loginLimiter, registerLimiter, submissionLimiter };
