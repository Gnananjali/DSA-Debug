const express = require("express");
const { listProblems, getProblem, createProblem } = require("../controllers/problemController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", listProblems);
router.get("/:slug", getProblem);
// In a real deployment, gate this behind an admin role check.
router.post("/", requireAuth, createProblem);

module.exports = router;
