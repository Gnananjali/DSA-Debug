/**
 * Small, dependency-free input validators. Type checks matter here: without
 * them, `{ "email": { "$ne": null } }` in a JSON body becomes a MongoDB
 * operator-injection (NoSQL injection) in `User.findOne({ email })`.
 */
const USERNAME_RE = /^[A-Za-z0-9_]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { validateCppSignature } = require("../services/execution/harness");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isString = (v) => typeof v === "string";

function validateRegistration({ username, email, password } = {}) {
  if (![username, email, password].every(isString)) {
    return "username, email and password are required";
  }
  if (!USERNAME_RE.test(username.trim())) {
    return "Username must be 3-24 characters: letters, numbers and underscores only";
  }
  if (email.length > 254 || !EMAIL_RE.test(email.trim())) {
    return "Please enter a valid email address";
  }
  // bcrypt only uses the first 72 bytes, so reject anything longer instead of silently truncating.
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    return "Password must be 8-72 characters";
  }
  return null;
}

function validateLogin({ email, password } = {}) {
  if (!isString(email) || !isString(password)) return "email and password are required";
  return null;
}

function validateSubmission({ problemSlug, language, code } = {}, { languages, maxCodeLength }) {
  if (![problemSlug, language, code].every(isString) || !problemSlug || !code.trim()) {
    return "problemSlug, language and code are required";
  }
  if (!languages.includes(language)) {
    return `language must be one of: ${languages.join(", ")}`;
  }
  if (code.length > maxCodeLength) {
    return `Code is too long (max ${maxCodeLength} characters)`;
  }
  return null;
}

/** Whitelist + validate an admin-created problem. Returns { error } or { value }. */
function parseProblemInput(body = {}) {
  const { title, slug, description, difficulty, tags, starterCode, testCases, constraints, order, compareMode, cppSignature } = body;

  if (!isString(title) || !title.trim()) return { error: "title is required" };
  if (!isString(slug) || !SLUG_RE.test(slug)) return { error: "slug must be lowercase-kebab-case" };
  if (!isString(description) || !description.trim()) return { error: "description is required" };
  if (!["Easy", "Medium", "Hard"].includes(difficulty)) return { error: "difficulty must be Easy, Medium or Hard" };
  if (!Array.isArray(testCases) || testCases.length === 0) return { error: "at least one test case is required" };

  for (const tc of testCases) {
    if (!tc || !isString(tc.input) || !isString(tc.expectedOutput)) {
      return { error: "each test case needs string input and expectedOutput" };
    }
  }
  if (compareMode !== undefined && !["exact", "unordered"].includes(compareMode)) {
    return { error: "compareMode must be exact or unordered" };
  }

  if (cppSignature !== undefined && validateCppSignature(cppSignature)) {
    return { error: "cppSignature.params must be a non-empty list of supported C++ types" };
  }

  const strings = (arr) => (Array.isArray(arr) ? arr.filter(isString) : []);

  return {
    value: {
      title: title.trim(),
      slug,
      description,
      difficulty,
      tags: strings(tags),
      constraints: strings(constraints),
      starterCode: {
        javascript: isString(starterCode?.javascript) ? starterCode.javascript : "",
        python: isString(starterCode?.python) ? starterCode.python : "",
        cpp: isString(starterCode?.cpp) ? starterCode.cpp : "",
      },
      ...(cppSignature ? { cppSignature: { params: cppSignature.params.map((t) => t.trim()) } } : {}),
      testCases: testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden === true,
      })),
      compareMode: compareMode || "exact",
      order: Number.isFinite(order) ? order : 0,
    },
  };
}

module.exports = { validateRegistration, validateLogin, validateSubmission, parseProblemInput };
