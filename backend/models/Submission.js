const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true, index: true },
    language: { type: String, enum: ["javascript", "python", "cpp"], required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "running", "accepted", "wrong_answer", "compile_error", "runtime_error", "timeout", "error"],
      default: "queued",
    },
    runtimeMs: { type: Number },
    testsPassed: { type: Number, default: 0 },
    testsTotal: { type: Number, default: 0 },
    failedCase: {
      hidden: { type: Boolean, default: false }, // true => details withheld (hidden test)
      input: String,
      expectedOutput: String,
      actualOutput: String,
    },
    aiAnalysis: {
      timeComplexity: String,
      spaceComplexity: String,
      summary: String,
      suggestions: [String],
    },
    error: { type: String },
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
