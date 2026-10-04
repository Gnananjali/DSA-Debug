const jwt = require("jsonwebtoken");
const User = require("../models/User");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Must run after requireAuth. Reads the role from the database (not the JWT)
 * so a demoted admin loses access immediately.
 */
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireAdmin };
