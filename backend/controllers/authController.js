const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { validateRegistration, validateLogin } = require("../utils/validate");

// Compared against when the email doesn't exist, so "unknown user" and
// "wrong password" take the same time (prevents user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function register(req, res, next) {
  try {
    const problem = validateRegistration(req.body);
    if (problem) return res.status(400).json({ message: problem });

    const username = req.body.username.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "Username or email is already taken" });
    }

    const user = new User({ username, email });
    await user.setPassword(password);
    await user.save(); // a racing duplicate is caught by the unique index -> 409 in errorHandler

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const problem = validateLogin(req.body);
    if (problem) return res.status(400).json({ message: problem });

    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    const valid = await bcrypt.compare(req.body.password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
