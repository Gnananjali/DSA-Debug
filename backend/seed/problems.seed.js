require("dotenv").config();
const connectDB = require("../config/db");
const Problem = require("../models/Problem");

const problems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    tags: ["array", "hash-map"],
    description:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to target. Assume exactly one solution exists.",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
    starterCode: {
      javascript: "function solve(nums, target) {\n  // your code here\n}",
      python: "def solve(nums, target):\n    # your code here\n    pass",
    },
    testCases: [
      { input: "[[2,7,11,15], 9]", expectedOutput: "[0,1]" },
      { input: "[[3,2,4], 6]", expectedOutput: "[1,2]" },
      { input: "[[3,3], 6]", expectedOutput: "[0,1]", isHidden: true },
    ],
    order: 1,
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    tags: ["stack", "string"],
    description:
      "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid (every bracket is closed by the same type in the correct order).",
    constraints: ["1 <= s.length <= 10^4"],
    starterCode: {
      javascript: "function solve(s) {\n  // your code here\n}",
      python: "def solve(s):\n    # your code here\n    pass",
    },
    testCases: [
      { input: '["()"]', expectedOutput: "true" },
      { input: '["()[]{}"]', expectedOutput: "true" },
      { input: '["(]"]', expectedOutput: "false" },
      { input: '["([)]"]', expectedOutput: "false", isHidden: true },
    ],
    order: 2,
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "Medium",
    tags: ["array", "dynamic-programming"],
    description:
      "Given an integer array `nums`, find the contiguous subarray with the largest sum and return that sum.",
    constraints: ["1 <= nums.length <= 10^5"],
    starterCode: {
      javascript: "function solve(nums) {\n  // your code here\n}",
      python: "def solve(nums):\n    # your code here\n    pass",
    },
    testCases: [
      { input: "[[-2,1,-3,4,-1,2,1,-5,4]]", expectedOutput: "6" },
      { input: "[[1]]", expectedOutput: "1" },
      { input: "[[5,4,-1,7,8]]", expectedOutput: "23", isHidden: true },
    ],
    order: 3,
  },
    {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "Easy",
    tags: ["array", "greedy"],
    description:
      "Given an array of prices where prices[i] is the price of a stock on the ith day, return the maximum profit you can achieve by buying on one day and selling on a later day. If no profit is possible, return 0.",
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    starterCode: {
      javascript: "function solve(prices) {\n  // your code here\n}",
      python: "def solve(prices):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: "[[7,1,5,3,6,4]]",
        expectedOutput: "5",
      },
      {
        input: "[[7,6,4,3,1]]",
        expectedOutput: "0",
      },
      {
        input: "[[2,4,1,7]]",
        expectedOutput: "6",
        isHidden: true,
      },
    ],
    order: 4,
  },

  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    difficulty: "Easy",
    tags: ["array", "hash-set"],
    description:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    constraints: ["1 <= nums.length <= 10^5"],
    starterCode: {
  javascript: `function solve(nums) {
  // your code here
}`,
  python: `def solve(nums):
    # your code here
    pass`,
},
    testCases: [
      {
        input: "[[1,2,3,1]]",
        expectedOutput: "true",
      },
      {
        input: "[[1,2,3,4]]",
        expectedOutput: "false",
      },
      {
        input: "[[1,1,1,3,3,4,3,2,4,2]]",
        expectedOutput: "true",
        isHidden: true,
      },
    ],
    order: 5,
  },

  {
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "Easy",
    tags: ["array", "binary-search"],
    description:
      "Given a sorted array of integers nums and an integer target, return the index of target if it exists. Otherwise, return -1.",
    constraints: [
      "1 <= nums.length <= 10^4",
      "nums is sorted in ascending order",
    ],
    starterCode: {
      javascript: "function solve(nums, target) {\n  // your code here\n}",
      python: "def solve(nums, target):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: "[[-1,0,3,5,9,12], 9]",
        expectedOutput: "4",
      },
      {
        input: "[[-1,0,3,5,9,12], 2]",
        expectedOutput: "-1",
      },
      {
        input: "[[5], 5]",
        expectedOutput: "0",
        isHidden: true,
      },
    ],
    order: 6,
  },

  {
    title: "Move Zeroes",
    slug: "move-zeroes",
    difficulty: "Easy",
    tags: ["array", "two-pointers"],
    description:
      "Given an integer array nums, move all 0s to the end of it while maintaining the relative order of the non-zero elements.",
    constraints: ["1 <= nums.length <= 10^4"],
    starterCode: {
      javascript: "function solve(nums) {\n  // your code here\n}",
      python: "def solve(nums):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: "[[0,1,0,3,12]]",
        expectedOutput: "[1,3,12,0,0]",
      },
      {
        input: "[[0]]",
        expectedOutput: "[0]",
      },
      {
        input: "[[1,0,2,0,3]]",
        expectedOutput: "[1,2,3,0,0]",
        isHidden: true,
      },
    ],
    order: 7,
  },

  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    difficulty: "Easy",
    tags: ["string", "two-pointers"],
    description:
      "Given a string s, return true if it is a palindrome after converting all uppercase letters to lowercase and removing all non-alphanumeric characters.",
    constraints: ["1 <= s.length <= 2 * 10^5"],
    starterCode: {
      javascript: "function solve(s) {\n  // your code here\n}",
      python: "def solve(s):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: '["A man, a plan, a canal: Panama"]',
        expectedOutput: "true",
      },
      {
        input: '["race a car"]',
        expectedOutput: "false",
      },
      {
        input: '[" "]',
        expectedOutput: "true",
        isHidden: true,
      },
    ],
    order: 8,
  },

  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    tags: ["string", "sliding-window", "hash-map"],
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    constraints: ["0 <= s.length <= 5 * 10^4"],
    starterCode: {
      javascript: "function solve(s) {\n  // your code here\n}",
      python: "def solve(s):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: '["abcabcbb"]',
        expectedOutput: "3",
      },
      {
        input: '["bbbbb"]',
        expectedOutput: "1",
      },
      {
        input: '["pwwkew"]',
        expectedOutput: "3",
        isHidden: true,
      },
    ],
    order: 9,
  },

  {
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    difficulty: "Medium",
    tags: ["array", "prefix-sum"],
    description:
      "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
    constraints: ["2 <= nums.length <= 10^5"],
    starterCode: {
      javascript: "function solve(nums) {\n  // your code here\n}",
      python: "def solve(nums):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: "[[1,2,3,4]]",
        expectedOutput: "[24,12,8,6]",
      },
      {
        input: "[[-1,1,0,-3,3]]",
        expectedOutput: "[0,0,9,0,0]",
      },
      {
        input: "[[2,3,4,5]]",
        expectedOutput: "[60,40,30,24]",
        isHidden: true,
      },
    ],
    order: 10,
  },

  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "Easy",
    tags: ["dynamic-programming", "math"],
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb either 1 or 2 steps. Return the number of distinct ways you can climb to the top.",
    constraints: ["1 <= n <= 45"],
    starterCode: {
      javascript: "function solve(n) {\n  // your code here\n}",
      python: "def solve(n):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: "[2]",
        expectedOutput: "2",
      },
      {
        input: "[3]",
        expectedOutput: "3",
      },
      {
        input: "[5]",
        expectedOutput: "8",
        isHidden: true,
      },
    ],
    order: 11,
  },

  {
    title: "House Robber",
    slug: "house-robber",
    difficulty: "Medium",
    tags: ["array", "dynamic-programming"],
    description:
      "You are a professional robber planning to rob houses along a street. Adjacent houses have security systems connected. Determine the maximum amount of money you can rob without robbing two adjacent houses.",
    constraints: ["1 <= nums.length <= 100"],
    starterCode: {
      javascript: "function solve(nums) {\n  // your code here\n}",
      python: "def solve(nums):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: "[[1,2,3,1]]",
        expectedOutput: "4",
      },
      {
        input: "[[2,7,9,3,1]]",
        expectedOutput: "12",
      },
      {
        input: "[[2,1,1,2]]",
        expectedOutput: "4",
        isHidden: true,
      },
    ],
    order: 12,
  },

  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "Medium",
    tags: ["array", "sorting"],
    description:
      "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return an array of the non-overlapping intervals.",
    constraints: ["1 <= intervals.length <= 10^4"],
    starterCode: {
      javascript: "function solve(intervals) {\n  // your code here\n}",
      python: "def solve(intervals):\n    # your code here\n    pass",
    },
    testCases: [
      {
        input: "[[[1,3],[2,6],[8,10],[15,18]]]",
        expectedOutput: "[[1,6],[8,10],[15,18]]",
      },
      {
        input: "[[[1,4],[4,5]]]",
        expectedOutput: "[[1,5]]",
      },
      {
        input: "[[[1,4],[0,4]]]",
        expectedOutput: "[[0,4]]",
        isHidden: true,
      },
    ],
    order: 13,
  },
];

async function seed() {
  await connectDB();
  for (const p of problems) {
    await Problem.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    console.log(`[seed] upserted "${p.title}"`);
  }
  console.log("[seed] done");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
