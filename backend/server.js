import dotenv from "dotenv";

dotenv.config();
console.log(process.env.REDIS_URL);
import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import User from "./models/User.js";
import { setIO } from "./socket.js";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import { runCodeInDocker } from "./dockerExecutor.js";
import { submissionQueue } from "./queue.js";
import express from "express";
import "./config/redis.js";
import cors from "cors";

import Submission from "./models/Submission.js";

import { generateAIExplanation } from "./aiExplanation.js";
import authMiddleware from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {
    console.log("✅ MongoDB Connected");
  })

  .catch((err) => {
    console.error(err);
  });

const server = http.createServer(app);
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,

        error: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,

      email,

      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        id: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,

      token,

      user: {
        id: user._id,

        username: user.username,

        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      error: err.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        success: false,

        error: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,

        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,

      token,

      user: {
        id: user._id,

        username: user.username,

        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      error: err.message,
    });
  }
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
setIO(io);




const PORT = process.env.PORT || 4000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi";

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "512kb" }));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

const JUDGE0_LANG_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  "c++": 54,
  typescript: 74,
  go: 60,
};

const PROBLEMS = [
  {
    id: 1,
    slug: "two-sum",
    title: "Two Sum",
    signature: {
      functionName: "test",
    },
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    description:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. You may assume exactly one solution exists.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6",
      },
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "Exactly one valid answer exists.",
    ],
    optimal_complexity: { time: "O(n)", space: "O(n)" },
    starter: {
      python:
        "def two_sum(nums, target):\n    # Your solution here\n    pass\n",
      javascript:
        "function twoSum(nums, target) {\n    // Your solution here\n}\n",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n    }\n}\n",
      "c++":
        "vector<int> twoSum(vector<int>& nums, int target) {\n    // Your solution here\n}\n",
    },
    visible_tests: [
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1],
      },

      {
        input: [[3, 2, 4], 6],
        expected: [1, 2],
      },

      {
        input: [[3, 3], 6],
        expected: [0, 1],
      },
    ],
    hidden_tests: [
      {
        input: [[1000000, 2, 4, 7], 9],
        expected: [1, 3],
      },

      {
        input: [[-1, -2, -3, -4, -5], -8],
        expected: [2, 4],
      },

      {
        input: [[0, 4, 3, 0], 0],
        expected: [0, 3],
      },
    ],
  },
  {
    id: 2,
    slug: "max-subarray",
    title: "Maximum Subarray",
    signature: {
      functionName: "test",
    },
    difficulty: "Medium",
    tags: ["Array", "DP", "Divide & Conquer"],
    description:
      "Given an integer array `nums`, find the subarray with the largest sum and return its sum.",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "Subarray [4,-1,2,1] has the largest sum = 6.",
      },
      { input: "nums = [1]", output: "1", explanation: "Single element." },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    optimal_complexity: { time: "O(n)", space: "O(1)" },
    starter: {
      python: "def max_subarray(nums):\n    # Your solution here\n    pass\n",
      javascript:
        "function maxSubArray(nums) {\n    // Your solution here\n}\n",
      java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Your solution here\n    }\n}\n",
      "c++":
        "int maxSubArray(vector<int>& nums) {\n    // Your solution here\n}\n",
    },
    visible_tests: [
      {
        input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]],
        expected: 6,
      },

      {
        input: [[1]],
        expected: 1,
      },

      {
        input: [[-1, -2, -3]],
        expected: -1,
      },
    ],
    hidden_tests: [
      {
        input: [[5, 4, -1, 7, 8]],
        expected: 23,
      },

      {
        input: [[-2, -1]],
        expected: -1,
      },

      {
        input: [[1, -1, 1, -1, 1]],
        expected: 1,
      },
    ],
  },
  {
    id: 3,
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    signature: {
      functionName: "test",
    },
    difficulty: "Easy",
    tags: ["Stack", "String"],
    description:
      "Given a string `s` containing just '(', ')', '{', '}', '[', ']', determine if the input string is valid. An input string is valid if brackets are closed in the correct order.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: [
      "1 ≤ s.length ≤ 10⁴",
      "s consists of parentheses only '()[]{}'",
    ],
    optimal_complexity: { time: "O(n)", space: "O(n)" },
    starter: {
      python: "def is_valid(s):\n    # Your solution here\n    pass\n",
      javascript: "function isValid(s) {\n    // Your solution here\n}\n",
      java: "class Solution {\n    public boolean isValid(String s) {\n        // Your solution here\n    }\n}\n",
      "c++": "bool isValid(string s) {\n    // Your solution here\n}\n",
    },
    visible_tests: [
      {
        input: ["()"],
        expected: true,
      },

      {
        input: ["()[]{}"],
        expected: true,
      },

      {
        input: ["(]"],
        expected: false,
      },

      {
        input: ["([)]"],
        expected: false,
      },

      {
        input: ["{[]}"],
        expected: true,
      },
    ],
    hidden_tests: [
      {
        input: ["(((((((((())))))))))"],
        expected: true,
      },

      {
        input: ["([{}])"],
        expected: true,
      },

      {
        input: ["((({{{[[[]]]}}}"],
        expected: false,
      },
    ],
  },
  {
    id: 4,
    slug: "reverse-linked-list",
    title: "Reverse Linked List",
    signature: {
      functionName: "test",
    },
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
    description:
      "Given the head of a singly linked list, reverse the list and return the reversed list.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
    ],
    constraints: ["0 ≤ nodes ≤ 5000", "-5000 ≤ Node.val ≤ 5000"],
    optimal_complexity: { time: "O(n)", space: "O(1)" },
    starter: {
      python:
        "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # Your solution here\n    pass\n",
      javascript:
        "function reverseList(head) {\n    // Your solution here\n}\n",
      java: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Your solution here\n    }\n}\n",
      "c++":
        "ListNode* reverseList(ListNode* head) {\n    // Your solution here\n}\n",
    },
    visible_tests: [
      {
        input: [[1, 2, 3, 4, 5]],
        expected: [5, 4, 3, 2, 1],
      },

      {
        input: [[1, 2]],
        expected: [2, 1],
      },

      {
        input: [[]],
        expected: [],
      },
    ],
    hidden_tests: [
      {
        input: [[9, 8, 7, 6, 5]],
        expected: [5, 6, 7, 8, 9],
      },

      {
        input: [[1]],
        expected: [1],
      },

      {
        input: [[10, 20]],
        expected: [20, 10],
      },
    ],
  },
];

app.post("/api/docker-run", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "Code required",
    });
  }

  console.log("🔥 Adding job to queue...");
  const job = await submissionQueue.add("execute", {
    code,
  });

  res.json({
    success: true,
    jobId: job.id,
    message: "Job added to queue",
  });
});

app.get("/api/job/:id", async (req, res) => {
  const job = await submissionQueue.getJob(req.params.id);

  if (!job) {
    return res.status(404).json({
      error: "Job not found",
    });
  }

  const state = await job.getState();

  res.json({
    id: job.id,
    state,
    result: job.returnvalue || null,
    failedReason: job.failedReason || null,
  });
});

async function runJavaScript(code, testInput) {
  const { VM } = (await import("vm2").catch(() => null)) || {};
  // Fallback: use built-in vm if vm2 not available
  const vm = await import("node:vm");

  const results = [];
  const lines = String(testInput).trim().split("\n");

  const wrapped = `
let logs = [];

const console = {
  log: (...args) => logs.push(args.join(" "))
};

let result;

try {
  ${code}


  if (typeof test === "function") {
    result = test(${lines.join(",")});
  }

} catch (e) {
  result = "ERROR: " + e.message;
}

typeof result !== "undefined" ? result : null;
`;

  try {
    const ctx = vm.createContext({
      JSON,
      Math,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set,
      console: { log: () => {} },
    });
    const result = vm.runInContext(wrapped, ctx, { timeout: 3000 });
    return { output: result, error: null };
  } catch (e) {
    return { output: null, error: e.message };
  }
}

async function runViaJudge0(code, language, stdin) {
  const apiKey = process.env.JUDGE0_API_KEY;
  const base = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
  const langId = JUDGE0_LANG_IDS[language.toLowerCase()];

  if (!apiKey || !langId) {
    return { output: null, error: "Judge0 not configured", skipped: true };
  }

  try {
    const fetch = (await import("node-fetch")).default;

    const submitRes = await fetch(
      `${base}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          language_id: langId,
          source_code: code,
          stdin: String(stdin),
          cpu_time_limit: 3,
          memory_limit: 131072,
        }),
      }
    );

    const data = await submitRes.json();
    if (data.stderr || data.compile_output) {
      return { output: null, error: data.stderr || data.compile_output };
    }
    return {
      output: (data.stdout || "").trim(),
      error: null,
      time_ms: Math.round((data.time || 0) * 1000),
    };
  } catch (e) {
    return { output: null, error: e.message };
  }
}

async function executeCode(code, language, stdin) {
  const lang = language.toLowerCase();
  if (lang === "javascript") return runJavaScript(code, stdin);
  return runViaJudge0(code, language, stdin);
}

app.get("/api/problems", (_, res) => {
  res.json(PROBLEMS);
});

app.get("/api/problems/:slug", (req, res) => {
  const problem = PROBLEMS.find((p) => p.slug === req.params.slug);
  if (!problem) return res.status(404).json({ error: "Problem not found" });
  res.json(problem);
});

app.post("/api/run", async (req, res) => {
  console.log("🔥 /api/run HIT");

  try {
    const { code, language, problemId, problemTitle } = req.body;

    const problem = PROBLEMS.find((p) => p.id === problemId);

    const allTests = problem.visible_tests;

    const results = [];

    let maxRuntime = 0;

    let memoryUsage = 0;

    for (let i = 0; i < allTests.length; i++) {
      const tc = allTests[i];

      let wrappedCode = "";

      const inputArgs = tc.input.map((x) => JSON.stringify(x)).join(", ");

      if (language === "javascript") {
        wrappedCode = `
${code}

const result =
    ${problem.signature.functionName}
    (${inputArgs});

console.log(
    JSON.stringify(result)
);
`;
      }

      // Python
      else if (language === "python") {
        wrappedCode = `
${code}

import json

result = test(${inputArgs})

print(
    json.dumps(
        result,
        separators=(',', ':')
    )
)
`;
      }

      console.log(wrappedCode);

      const executionResult = await runCodeInDocker(wrappedCode, language);

      if (executionResult.runtime > maxRuntime) {
        maxRuntime = executionResult.runtime;
      }

      memoryUsage = executionResult.memory;

      const actual = String(executionResult.output).trim();

      const expected = JSON.stringify(tc.expected);

      console.log("ACTUAL:", actual);
      console.log("EXPECTED:", expected);

      const passed = actual === expected;

      results.push({
        id: i + 1,

        passed,

        hidden: i >= problem.visible_tests.length,

        ...(i < problem.visible_tests.length && {
          expected,
          actual,
        }),
      });
    }

    const complexityAnalysis = analyzeComplexity(code);

    const suggestions = [
      "Single loop detected.",
      "Complexity appears efficient.",
    ];

    const aiExplanation = generateAIExplanation({
      code,

      complexity: `
Time Complexity:
${complexityAnalysis.time}

Space Complexity:
${complexityAnalysis.space}
`,

      suggestions,
    });

    res.json({
      success: true,

      results,

      complexityAnalysis,

      suggestions,

      aiExplanation,

      runtime: maxRuntime,

      memory: memoryUsage,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      error: err.message,
    });
  }
});

function analyzeComplexity(code) {
  let time = "O(1)";
  let space = "O(1)";

  // Nested loops
  if (code.includes("for") && code.match(/for/g)?.length >= 2) {
    time = "O(n²)";
  }

  // Single loop
  else if (code.includes("for") || code.includes("while")) {
    time = "O(n)";
  }

  // Sorting
  if (code.includes(".sort(")) {
    time = "O(n log n)";
  }

  // HashMap / Dictionary
  if (
    code.includes("Map") ||
    code.includes("{}") ||
    code.includes("dict") ||
    code.includes("hashmap")
  ) {
    space = "O(n)";
  }

  return {
    time,
    space,
  };
}

app.post("/api/submit", authMiddleware, async (req, res) => {
  console.log("🔥 /api/submit HIT");

  try {
    const { code, language, problemId, problemTitle } = req.body;

    const problem = PROBLEMS.find((p) => p.id === problemId);

    const allTests = [...problem.visible_tests, ...problem.hidden_tests];

    const results = [];
    let maxRuntime = 0;

    let memoryUsage = 0;

    for (let i = 0; i < allTests.length; i++) {
      const tc = allTests[i];

      let wrappedCode = "";

      const inputArgs = tc.input.map((x) => JSON.stringify(x)).join(", ");

      if (language === "javascript") {
        wrappedCode = `
${code}

const result =
    ${problem.signature.functionName}
    (${inputArgs});

console.log(
    JSON.stringify(result)
);
`;
      } else if (language === "python") {
        wrappedCode = `
${code}

import json

result = test(${inputArgs})

print(
    json.dumps(
        result,
        separators=(',', ':')
    )
)
`;
      }

      console.log(wrappedCode);

      const executionResult = await runCodeInDocker(wrappedCode, language);

      if (executionResult.runtime > maxRuntime) {
        maxRuntime = executionResult.runtime;
      }

      memoryUsage = executionResult.memory;

      const actual = String(executionResult.output).trim();

      const expected = JSON.stringify(tc.expected);

      console.log("ACTUAL:", actual);
      console.log("EXPECTED:", expected);

      const passed = actual === expected;

      results.push({
        id: i + 1,

        passed,

        hidden: i >= problem.visible_tests.length,

        ...(i < problem.visible_tests.length && {
          expected,
          actual,
        }),
      });
    }

    const complexityAnalysis = analyzeComplexity(code);

    const isOptimal =
      complexityAnalysis.time === problem.optimal_complexity.time;

    const suggestions = [];

    if (isOptimal) {
      suggestions.push("Your solution appears optimal.");
    } else {
      suggestions.push(
        `Expected optimal time complexity is ${problem.optimal_complexity.time}.`
      );

      suggestions.push(
        "Try reducing nested iterations or using better data structures."
      );
    }

    if (complexityAnalysis.space === "O(n)") {
      suggestions.push("Your solution uses extra memory.");
    }

    const aiExplanation = `

Time Complexity:
${complexityAnalysis.time}

Space Complexity:
${complexityAnalysis.space}

Optimal Complexity:
Time → ${problem.optimal_complexity.time}
Space → ${problem.optimal_complexity.space}

${
  isOptimal
    ? "Your solution appears optimal."
    : "Your solution can likely be optimized further."
}

Suggestions:
${suggestions.join("\n")}

`;

    await Submission.create({
      userId: req.user.id,

      problemId,

      problemTitle,

      language,

      code,

      results,
      runtime: maxRuntime,

      memory: memoryUsage,

      complexity: `
Time Complexity:
${complexityAnalysis.time}

Space Complexity:
${complexityAnalysis.space}
`,

      status: results.every((r) => r.passed) ? "Accepted" : "Failed",
    });

    res.json({
      success: true,

      results,

      complexityAnalysis,

      suggestions,

      aiExplanation,

      runtime: maxRuntime,

      memory: memoryUsage,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      error: err.message,
    });
  }
});

app.get(
  "/api/profile",
  authMiddleware,

  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      const submissions = await Submission.find({
        userId: req.user.id,
      });

      const accepted = submissions.filter((s) => s.status === "Accepted");

      const solvedProblems = new Set(accepted.map((s) => s.problemId));

      res.json({
        success: true,

        user: {
          username: user.username,

          email: user.email,
        },

        stats: {
          totalSubmissions: submissions.length,

          accepted: accepted.length,

          solved: solvedProblems.size,

          acceptanceRate: submissions.length
            ? Math.round((accepted.length / submissions.length) * 100)
            : 0,
        },

        recentSubmissions: submissions.slice(-5).reverse(),
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,

        error: err.message,
      });
    }
  }
);

app.post("/api/analyze", async (req, res) => {
  console.log("🔥 ANALYZE API HIT");
  console.time("TOTAL_ANALYZE");
  const { code, language, tests, run_results, problem_slug, mode } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: "code and language required" });

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  if (mode === "fix") {
    console.time("FIX_RULES");
    let currentCode = code;

    let err = "";

    try {
      const { output, error } = await executeCode(code, language, "");

      if (error) {
        err = error.toLowerCase();
      } else if (typeof output === "string" && output.includes("ERROR")) {
        err = output.toLowerCase();
      }
    } catch (e) {
      err = String(e.message).toLowerCase();
    }

    //  Rule 1: Undefined variable
    if (err.includes("not defined") || err.includes("undefined")) {
      currentCode = currentCode.replace(
        /function\s+(\w+)\s*\(\s*\)/,
        (m, fn) => `function ${fn}(x)`
      );
    }

    //  Rule 2: Syntax error
    else if (err.includes("syntax")) {
      currentCode = "// Fix syntax error\n" + currentCode;
    }

    //  Rule 3: Type error
    else if (err.includes("not a function")) {
      currentCode = "// Fix function usage\n" + currentCode;
    }

    //  If fixed → instant return
    if (currentCode !== code) {
      console.timeEnd("FIX_RULES");
      send("analysis", {
        explanation: "",
        fixed_code: currentCode,
        time_complexity: "",
        space_complexity: "",
      });

      send("done", {});
      console.timeEnd("TOTAL_ANALYZE");
      return res.end();
    }

    console.timeEnd("FIX_RULES");
  }

  let executionResults = run_results;

  if (
    mode !== "fix" &&
    !executionResults &&
    Array.isArray(tests) &&
    tests.length
  ) {
    send("status", { message: "Running your code..." });

    const runRes = [];

    for (const [i, tc] of tests.entries()) {
      const { output, error, skipped, time_ms } = await executeCode(
        code,
        language,
        tc.input
      );

      const actual = error ? `ERROR: ${error}` : String(output ?? "").trim();
      const expected = String(tc.expected).trim();
      const passed = !error && actual === expected;

      runRes.push({
        id: i + 1,
        input: tc.input,
        expected,
        actual,
        passed,
        error: error || null,
        skipped: skipped || false,
        time_ms: time_ms || null,
        reason: passed ? "" : error ? "Runtime error" : "Output mismatch",
      });
    }

    executionResults = runRes;

    send("run_results", {
      results: executionResults,
      passed: executionResults.filter((r) => r.passed).length,
      total: executionResults.length,
    });
  } else if (!executionResults && mode !== "fix") {
    const { output, error } = await executeCode(code, language, "");

    executionResults = [
      {
        id: 1,
        input: "",
        expected: "",
        actual: error ? "ERROR: " + error : output,
        passed: !error,
      },
    ];
  }

  if (mode !== "fix") {
    const err = executionResults?.[0]?.actual || "";

    if (err.includes("not defined")) {
      send("analysis", {
        explanation:
          "A variable is used without being defined, which causes a runtime error.",
        fixed_code: "",
        time_complexity: "",
        space_complexity: "",
      });

      send("done", {});
      console.timeEnd("TOTAL_ANALYZE");
      return res.end();
    }
  }

  send("status", { message: "Generating analysis..." });

  const problem = problem_slug
    ? PROBLEMS.find((p) => p.slug === problem_slug)
    : null;
  const optimalCx = problem?.optimal_complexity;

  let aiPrompt;

  if (mode === "fix") {
    aiPrompt = `
Fix the following JavaScript code.

Rules:
- Return ONLY corrected code
- Do NOT explain anything
- Do NOT return empty response

Code:
${code}
`;
  } else {
    aiPrompt = `
Explain why this code fails.

${code}

Error:
${executionResults.map((r) => r.actual).join("\n")}
`;
  }

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0,
          max_tokens: 300,
        }),
      }
    );

    const data = await groqRes.json();
    const rawBuf = data.choices?.[0]?.message?.content || "";

    console.log("RAW AI OUTPUT:\n", rawBuf);

    let explanation = "";
    let fixed_code = "";

    if (mode === "fix") {
      let cleaned = rawBuf
        .replace(/```[\w]*/g, "")
        .replace(/```/g, "")
        .trim();

      if (!cleaned) {
        fixed_code = "// AI failed — returning original code\n" + code;
      } else if (!cleaned.includes("function") && !cleaned.includes(";")) {
        fixed_code = "// Invalid AI response\n" + code;
      } else {
        fixed_code = cleaned;
      }
    }

    send("analysis", {
      explanation,
      fixed_code,
      time_complexity: "",
      space_complexity: "",
    });

    send("done", {});
  } catch (err) {
    if (err.name === "AbortError") {
      send("analysis", {
        explanation: mode === "fix" ? "" : "⚠️ AI took too long. Try again.",
        fixed_code: mode === "fix" ? "// AI timeout — try again\n" + code : "",
        time_complexity: "",
        space_complexity: "",
      });
    } else {
      send("analysis", {
        explanation: "AI error: " + err.message,
        fixed_code: "",
        time_complexity: "",
        space_complexity: "",
      });
    }

    send("done", {});
  }
  console.timeEnd("TOTAL_ANALYZE");
  res.end();
});

app.get("/health", async (_, res) => {
  let ollamaOk = false;
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    ollamaOk = r.ok;
  } catch {}
  res.json({
    status: "ok",
    service: "DSADebug v3",
    ollama: ollamaOk
      ? `✅ running (${OLLAMA_MODEL})`
      : "❌ not reachable — run: ollama serve",
    judge0: !!process.env.JUDGE0_API_KEY
      ? "✅ configured"
      : "⚠️  not set (JS sandbox only)",
  });
});

app.get(
  "/api/profile/stats",

  async (_, res) => {
    try {
      const submissions = await Submission.find();

      const totalSubmissions = submissions.length;

      const accepted = submissions.filter(
        (s) => s.status === "Accepted"
      ).length;

      const failed = submissions.filter((s) => s.status === "Failed").length;

      const solvedProblems = new Set(
        submissions

          .filter((s) => s.status === "Accepted")

          .map((s) => s.problemId)
      ).size;

      const languages = {};

      submissions.forEach((sub) => {
        languages[sub.language] = (languages[sub.language] || 0) + 1;
      });

      res.json({
        totalSubmissions,

        accepted,

        failed,

        solvedProblems,

        languages,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

app.get("/api/submissions", async (_, res) => {
  const submissions = await Submission.find().sort({ createdAt: -1 });

  res.json(submissions);
});

app.get(
  "/api/submissions/:id",

  async (req, res) => {
    try {
      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({
          error: "Submission not found",
        });
      }

      res.json(submission);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

server.listen(PORT, () => {
  console.log(`🚀 DSADebug backend → http://localhost:${PORT}`);
});
