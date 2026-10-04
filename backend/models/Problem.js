const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    tags: [{ type: String }],
    starterCode: {
      javascript: { type: String, default: "" },
      python: { type: String, default: "" },
      cpp: { type: String, default: "" },
    },
    // C++ has no eval, so the harness needs each parameter's C++ type, e.g. ["vector<int>", "int"].
    // A problem without a cppSignature simply doesn't offer C++.
    cppSignature: { params: [{ type: String }] },
    testCases: [testCaseSchema],
    constraints: [{ type: String }],
    // "unordered": top-level arrays are compared as multisets (e.g. Two Sum [0,1] == [1,0]).
    compareMode: { type: String, enum: ["exact", "unordered"], default: "exact" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

problemSchema.index({ difficulty: 1 });
problemSchema.index({ tags: 1 });

module.exports = mongoose.model("Problem", problemSchema);
