import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  problemId: Number,

  problemTitle: String,

  language: String,

  code: String,

  results: Array,

  complexity: String,

  status: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Submission", submissionSchema);
