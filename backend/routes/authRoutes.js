const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", requireAuth, me);

module.exports = router;
