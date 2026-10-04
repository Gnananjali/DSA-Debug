const express = require("express");
const {
  createSubmission,
  getSubmission,
  listMySubmissions,
} = require("../controllers/submissionController");
const { requireAuth } = require("../middleware/auth");
const { submissionLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.use(requireAuth);
router.post("/", submissionLimiter, createSubmission);
router.get("/", listMySubmissions);
router.get("/:id", getSubmission);

module.exports = router;
