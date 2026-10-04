const express = require("express");
const { listProblems, getProblem, createProblem } = require("../controllers/problemController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listProblems);
router.get("/:slug", getProblem);
router.post("/", requireAuth, requireAdmin, createProblem);

module.exports = router;
