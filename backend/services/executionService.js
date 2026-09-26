/**
 * Executes untrusted user code against a set of test cases.
 *
 * SECURITY NOTE: this uses per-language process isolation with strict
 * timeouts as a reasonable baseline for a portfolio/practice project.
 * For a production judge handling real internet traffic, run each
 * submission inside a locked-down container (gVisor/Docker with
 * --network none, --memory, --pids-limit, a non-root user, and a
 * read-only filesystem) or delegate to a hardened judge service
 * (e.g. Judge0) instead of executing directly on the API host.
 */

const { spawn } = require("child_process");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const TIMEOUT_MS = Number(process.env.EXEC_TIMEOUT_MS || 5000);

function runProcess({ command, args, input, cwd }) {
  return new Promise((resolve) => {
    console.log(`[executor] starting: ${command} ${args.join(" ")}`);

const child = spawn(command, args, {
      cwd,
      timeout: TIMEOUT_MS,
      env: { PATH: process.env.PATH }, // minimal env, no secrets leak to user code
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const killTimer = setTimeout(() => {
  console.log(`[executor] timeout after ${TIMEOUT_MS}ms`);
  timedOut = true;
  child.kill("SIGKILL");
}, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.stdin.write(input || "");
    child.stdin.end();

    child.on("close", (exitCode) => {
  console.log(`[executor] process closed, exitCode=${exitCode}`);

  if (stderr) {
    console.log(`[executor] stderr:\n${stderr}`);
  }

  if (stdout) {
    console.log(`[executor] stdout:\n${stdout}`);
  }

  clearTimeout(killTimer);
  resolve({
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    exitCode,
    timedOut,
  });
});

    child.on("error", (err) => {
  console.error("[executor] process error:", err.message);
      clearTimeout(killTimer);
      resolve({ stdout: "", stderr: err.message, exitCode: -1, timedOut: false });
    });
  });
}

async function withTempDir(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "dsadebug-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function executeJavaScript(userCode, input) {
  return withTempDir(async (dir) => {
    // Wrap the user's function so stdin (a JSON array of args) is applied
    // to whatever function they defined as `module.exports.solve` or `solve`.
    const wrapper = `
      "use strict";
      let raw = "";
      process.stdin.on("data", (d) => (raw += d));
      process.stdin.on("end", () => {
        try {
          const args = JSON.parse(raw || "[]");
          ${userCode}
          const fn = typeof solve === "function" ? solve : module.exports;
          const result = fn(...args);
          process.stdout.write(JSON.stringify(result));
        } catch (err) {
          process.stderr.write(String(err && err.stack ? err.stack : err));
          process.exitCode = 1;
        }
      });
    `;
    const file = path.join(dir, `sol-${crypto.randomUUID()}.js`);
    await fs.writeFile(file, wrapper);
    return runProcess({ command: "node", args: [file], input, cwd: dir });
  });
}

async function executePython(userCode, input) {
  return withTempDir(async (dir) => {
    const wrapper = `
import sys, json

${userCode}

if __name__ == "__main__":
    raw = sys.stdin.read()
    args = json.loads(raw) if raw.strip() else []
    result = solve(*args)
    sys.stdout.write(json.dumps(result))
`;
    const file = path.join(dir, `sol-${crypto.randomUUID()}.py`);
    await fs.writeFile(file, wrapper);
    const pythonCommand = process.platform === "win32" ? "python" : "python3";

return runProcess({
  command: pythonCommand,
  args: [file],
  input,
  cwd: dir,
});
  });
}

async function executeCpp(userCode, input) {
  return withTempDir(async (dir) => {
    const sourceFile = path.join(
      dir,
      `sol-${crypto.randomUUID()}.cpp`
    );

    const executableFile = path.join(
      dir,
      `sol-${crypto.randomUUID()}`
    );

    const wrapper = `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string input;
    getline(cin, input);

    // The C++ solution should implement:
    // vector<int> solve(vector<int> nums, int target)
    //
    // JSON parsing will be added separately.
    
    return 0;
}
`;

    await fs.writeFile(sourceFile, wrapper);

    const compileResult = await runProcess({
      command: "g++",
      args: [
        "-std=c++17",
        sourceFile,
        "-o",
        executableFile,
      ],
      input: "",
      cwd: dir,
    });

    if (compileResult.exitCode !== 0) {
      return {
        stdout: "",
        stderr: compileResult.stderr,
        exitCode: compileResult.exitCode,
        timedOut: compileResult.timedOut,
      };
    }

    return runProcess({
      command: executableFile,
      args: [],
      input,
      cwd: dir,
    });
  });
}

async function runAgainstTestCases(language, code, testCases) {
  let runner;

if (language === "python") {
  runner = executePython;
} else if (language === "cpp") {
  runner = executeCpp;
} else {
  runner = executeJavaScript;
}
  const results = [];

  for (const testCase of testCases) {
    const start = Date.now();
    const { stdout, stderr, exitCode, timedOut } = await runner(code, testCase.input);
    const runtimeMs = Date.now() - start;

    if (timedOut) {
      return { status: "timeout", results, runtimeMs };
    }
    if (exitCode !== 0) {
      return { status: "runtime_error", error: stderr, results, runtimeMs };
    }

    let passed;

try {
  const actual = JSON.parse(stdout.trim());
  const expected = JSON.parse(testCase.expectedOutput.trim());

  passed = JSON.stringify(actual) === JSON.stringify(expected);
} catch {
  passed = stdout.trim() === testCase.expectedOutput.trim();
}
    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: stdout,
      passed,
      runtimeMs,
    });

    if (!passed) {
      return { status: "wrong_answer", results, runtimeMs };
    }
  }

  return { status: "accepted", results, runtimeMs: results.at(-1)?.runtimeMs || 0 };
}

module.exports = { runAgainstTestCases };
