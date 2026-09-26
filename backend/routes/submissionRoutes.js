const express = require("express");
const {
  createSubmission,
  getSubmission,
  listMySubmissions,
} = require("../controllers/submissionController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.post("/", createSubmission);
router.get("/", listMySubmissions);
router.get("/:id", getSubmission);

module.exports = router;
