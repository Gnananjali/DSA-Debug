/**
 * Executes untrusted user code against a problem's test cases.
 *
 * EXECUTION MODES (EXEC_MODE)
 *   judge0 : sends the program to a Judge0 instance (hosted or self-hosted). No Docker and
 *            no local compilers needed; untrusted code never runs on your machine.
 *            See services/execution/judge0.js.
 *   docker : every submission runs in a throw-away container with no network,
 *            capped memory/CPU/pids, a read-only root filesystem, all Linux
 *            capabilities dropped and an unprivileged user. This is the mode
 *            you should use for anything reachable from the internet.
 *   local  : runs a child process on the host. NOT a security boundary: the
 *            submission can read the host filesystem and the parent process
 *            environment. Use for local development only.
 *   auto   : (default) docker if the runner image exists, else judge0 if JUDGE0_URL is
 *            set, else local with a loud warning.
 *
 * PROTOCOL
 *   All test cases run in ONE process (one container start per submission,
 *   not one per test). The harness prints one result line per test, prefixed
 *   with a random per-run nonce, so a solution's own console.log/print output
 *   can never be mistaken for (or spoof) a result. Results stream out as they
 *   complete, so on a timeout we still know how many tests passed.
 */

const { spawn, execFile } = require("child_process");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const logger = require("../utils/logger");
const { buildSource, parseRecords, validateCppSignature } = require("./execution/harness");
const { runOnJudge0 } = require("./execution/judge0");

const TIMEOUT_MS = Number(process.env.EXEC_TIMEOUT_MS || 8000); // whole submission
const COMPILE_TIMEOUT_MS = Number(process.env.EXEC_COMPILE_TIMEOUT_MS || 30000);
const DOCKER_STARTUP_GRACE_MS = 4000;
const MAX_OUTPUT_CHARS = 256 * 1024;
const IMAGE = process.env.EXEC_IMAGE || "dsadebug-runner:latest";
const MEMORY = process.env.EXEC_MEMORY || "128m";
const SUPPORTED = ["javascript", "python", "cpp"];
const IS_WINDOWS = process.platform === "win32";

/* ------------------------------------------------------------------ */
/* Output comparison                                                    */
/* ------------------------------------------------------------------ */

function deepEqual(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return a === b || Math.abs(a - b) < 1e-9;
  }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return a === b;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return keysA.length === keysB.length && keysA.every((k) => k in b && deepEqual(a[k], b[k]));
}

/**
 * compareMode "exact"     : deep structural equality (object key order ignored)
 * compareMode "unordered" : top-level arrays compared as multisets
 *                           (e.g. Two Sum accepts [0,1] and [1,0])
 */
function outputsMatch(actualRaw, expectedRaw, compareMode = "exact") {
  let actual;
  let expected;
  try {
    actual = JSON.parse(actualRaw);
    expected = JSON.parse(String(expectedRaw).trim());
  } catch {
    return String(actualRaw).trim() === String(expectedRaw).trim();
  }

  if (compareMode === "unordered" && Array.isArray(actual) && Array.isArray(expected)) {
    const key = (v) => JSON.stringify(v);
    actual = [...actual].sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));
    expected = [...expected].sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));
  }
  return deepEqual(actual, expected);
}

/* ------------------------------------------------------------------ */
/* Mode resolution                                                      */
/* ------------------------------------------------------------------ */

let resolvedMode = null;

function commandSucceeds(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 10000 }, (err) => resolve(!err));
  });
}

async function resolveMode() {
  if (resolvedMode) return resolvedMode;

  const requested = (process.env.EXEC_MODE || "auto").toLowerCase();

  if (requested === "judge0") {
    logger.info(`[executor] mode=judge0 (code is sent to ${process.env.JUDGE0_URL || "https://ce.judge0.com"})`);
    resolvedMode = "judge0";
    return resolvedMode;
  }

  if (requested === "local") {
    logger.warn("EXEC_MODE=local: submissions run on the host with NO isolation. Development only.");
    resolvedMode = "local";
    return resolvedMode;
  }

  const dockerReady = await commandSucceeds("docker", ["image", "inspect", IMAGE]);

  if (requested === "docker") {
    if (!dockerReady) {
      throw new Error(
        `EXEC_MODE=docker but image "${IMAGE}" is not available. Build it with: npm run sandbox:build`
      );
    }
    resolvedMode = "docker";
  } else if (dockerReady) {
    resolvedMode = "docker";
  } else if (process.env.JUDGE0_URL) {
    resolvedMode = "judge0";
  } else {
    logger.warn(
      "No sandbox available (no Docker image, JUDGE0_URL not set). Falling back to UNSAFE local execution. " +
        "Set EXEC_MODE=judge0 to use a hosted sandbox with no Docker."
    );
    resolvedMode = "local";
  }

  logger.info(`[executor] mode=${resolvedMode}`);
  return resolvedMode;
}

/* ------------------------------------------------------------------ */
/* Process runner                                                       */
/* ------------------------------------------------------------------ */

function killTree(child) {
  try {
    if (process.platform !== "win32" && child.pid) process.kill(-child.pid, "SIGKILL");
    else child.kill("SIGKILL");
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  }
}

function runProcess({ command, args, input, cwd, env, timeoutMs, onKill }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: process.platform !== "win32", // own process group so we can kill the whole tree
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputLimitHit = false;
    let settled = false;

    const kill = () => {
      killTree(child);
      if (onKill) onKill();
    };

    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, timeoutMs);

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const collect = (stream, append) => {
      stream.on("data", (chunk) => {
        if (outputLimitHit) return;
        append(chunk.toString());
        if (stdout.length + stderr.length > MAX_OUTPUT_CHARS) {
          outputLimitHit = true;
          kill();
        }
      });
    };
    collect(child.stdout, (s) => (stdout += s));
    collect(child.stderr, (s) => (stderr += s));

    child.stdin.on("error", () => {}); // process may exit before reading stdin
    child.stdin.end(input || "");

    child.on("error", (err) =>
      finish({ stdout: "", stderr: err.message, exitCode: -1, timedOut: false, outputLimitHit: false, spawnError: err })
    );
    child.on("close", (exitCode, signal) =>
      finish({ stdout, stderr, exitCode, signal, timedOut, outputLimitHit })
    );
  });
}

const CRASH_HINTS = {
  SIGSEGV: "Segmentation fault: invalid memory access (out-of-bounds index or null/dangling pointer?).",
  SIGFPE: "Arithmetic error (division by zero?).",
  SIGABRT: "Program aborted (uncaught exception or failed assertion?).",
};
const WINDOWS_CRASH_CODES = { 3221225477: CRASH_HINTS.SIGSEGV, 3221225620: CRASH_HINTS.SIGFPE };

function describeFailure(proc, dir) {
  if (proc.outputLimitHit) return "Output limit exceeded (your program printed too much).";
  const raw = (proc.stderr || "").trim();
  if (raw) return raw.split(dir).join(".").slice(-2000);
  if (proc.signal && CRASH_HINTS[proc.signal]) return CRASH_HINTS[proc.signal];
  if (WINDOWS_CRASH_CODES[proc.exitCode]) return WINDOWS_CRASH_CODES[proc.exitCode];
  if (proc.exitCode === 139) return CRASH_HINTS.SIGSEGV;
  if (proc.signal === "SIGKILL" || proc.exitCode === 137) {
    return "Process was killed (likely exceeded the memory limit).";
  }
  return `Process exited unexpectedly (code ${proc.exitCode}).`;
}

async function withTempDir(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "dsadebug-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

function sandboxEnv() {
  // Minimal environment for local child processes. Windows needs a few system variables to run at all.
  const env = { PATH: process.env.PATH, PYTHONDONTWRITEBYTECODE: "1" };
  for (const key of ["SystemRoot", "windir", "TEMP", "TMP", "TMPDIR", "COMSPEC", "PATHEXT"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

function dockerArgs({ name, dir, writable, memory, cpus, pids, tmpfs, command }) {
  return [
    "run", "--rm", "-i",
    "--name", name,
    "--network", "none",
    "--memory", memory, "--memory-swap", memory,
    "--cpus", cpus,
    "--pids-limit", pids,
    "--read-only",
    "--tmpfs", tmpfs,
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "--user", "65534:65534",
    "-v", `${dir}:/work:${writable ? "rw" : "ro"}`,
    "-w", "/tmp",
    IMAGE,
    ...command,
  ];
}

function runDocker({ dir, input, timeoutMs, writable = false, memory = MEMORY, cpus = "0.5", pids = "64", command }) {
  const name = `dsadebug-${crypto.randomBytes(8).toString("hex")}`;
  return runProcess({
    command: "docker",
    args: dockerArgs({ name, dir, writable, memory, cpus, pids, tmpfs: "/tmp:rw,noexec,nosuid,size=16m", command }),
    input,
    cwd: dir,
    env: process.env, // env for the docker CLI only; nothing is forwarded into the container
    timeoutMs,
    // Killing the docker CLI does not stop the container, so kill it explicitly.
    onKill: () => execFile("docker", ["kill", name], () => {}),
  });
}

/**
 * Compiles C++ where the chosen backend lives. Returns null on success, or a
 * partial proc ({ compileFailed } / { unavailable }) describing why we can't run.
 */
async function compileCpp({ mode, dir, fileName }) {
  const flags = ["-O2", "-std=c++17"];

  if (mode === "docker") {
    const compile = await runDocker({
      dir, input: "", writable: true, memory: "768m", cpus: "1", pids: "256",
      timeoutMs: COMPILE_TIMEOUT_MS + DOCKER_STARTUP_GRACE_MS,
      command: ["g++", ...flags, "-o", "/work/sol", `/work/${fileName}`],
    });
    if (compile.exitCode !== 0 || compile.timedOut) {
      return { compileFailed: true, compileOutput: compile.timedOut ? "Compilation timed out." : compile.stderr };
    }
    return null;
  }

  const compile = await runProcess({
    command: "g++",
    args: [...flags, "-o", path.join(dir, IS_WINDOWS ? "sol.exe" : "sol"), fileName],
    input: "",
    cwd: dir,
    env: sandboxEnv(),
    timeoutMs: COMPILE_TIMEOUT_MS,
  });

  if (compile.spawnError && compile.spawnError.code === "ENOENT") {
    return {
      unavailable:
        "C++ is not available on this server (g++ was not found). Install g++ (MinGW-w64 on Windows) " +
        "or set EXEC_MODE=judge0 to run C++ on a hosted sandbox.",
    };
  }
  if (compile.exitCode !== 0 || compile.timedOut) {
    return { compileFailed: true, compileOutput: compile.timedOut ? "Compilation timed out." : compile.stderr };
  }
  return null;
}

async function execute({ mode, language, source, input, dir, fileName }) {
  if (mode === "judge0") {
    return runOnJudge0({ language, source, input, timeoutMs: TIMEOUT_MS });
  }

  const isPython = language === "python";
  const isCpp = language === "cpp";

  if (isCpp) {
    const failure = await compileCpp({ mode, dir, fileName });
    if (failure) return failure;
  }

  if (mode === "docker") {
    const command = isCpp
      ? ["/work/sol"]
      : isPython
        ? ["python3", "-I", "-B", `/work/${fileName}`]
        : ["node", `/work/${fileName}`];
    return runDocker({ dir, input, timeoutMs: TIMEOUT_MS + DOCKER_STARTUP_GRACE_MS, command });
  }

  // local
  let command;
  let args;
  if (isCpp) {
    command = path.join(dir, IS_WINDOWS ? "sol.exe" : "sol");
    args = [];
  } else if (isPython) {
    command = IS_WINDOWS ? "python" : "python3";
    args = ["-I", "-B", fileName];
  } else {
    command = process.execPath;
    args = [fileName];
  }
  return runProcess({ command, args, input, cwd: dir, env: sandboxEnv(), timeoutMs: TIMEOUT_MS });
}

function cleanCompileOutput(text, dir) {
  const cleaned = String(text || "")
    .split(dir)
    .join(".")
    .replace(/^In file included from.*\n/gm, "")
    .trim();

  // Errors located in OUR harness (not the user's lines) mean solve() is missing or has the wrong signature.
  const userError = /solution\.cpp:\d+:\d+: error/.test(cleaned);
  if (!userError && /harness\.cpp/.test(cleaned)) {
    return /'solve' was not declared/.test(cleaned)
      ? "No function named 'solve' was found. Keep the function name and signature from the starter code."
      : "Your solve() function doesn't match the expected signature. Keep the function name and parameter types from the starter code.";
  }
  return cleaned.slice(0, 4000);
}

async function runAgainstTestCases(language, code, testCases, options = {}) {
  if (!SUPPORTED.includes(language)) {
    return { status: "error", error: `Unsupported language: ${language}`, results: [], runtimeMs: 0 };
  }
  if (language === "cpp") {
    const problem = validateCppSignature(options.cppSignature);
    if (problem) return { status: "error", error: problem, results: [], runtimeMs: 0 };
  }

  const mode = await resolveMode();
  const nonce = crypto.randomBytes(16).toString("hex");

  return withTempDir(async (dir) => {
    const fileName = { javascript: "sol.js", python: "sol.py", cpp: "sol.cpp" }[language];
    const source = buildSource(language, code, nonce, options.cppSignature);

    // World-readable (and, for C++ in Docker, writable) so the unprivileged container user can use it.
    await fs.chmod(dir, mode === "docker" && language === "cpp" ? 0o777 : 0o755);
    await fs.writeFile(path.join(dir, fileName), source, { mode: 0o644 });

    const input = JSON.stringify(testCases.map((tc) => tc.input));
    const proc = await execute({ mode, language, source, input, dir, fileName });

    if (proc.unavailable) return { status: "error", error: proc.unavailable, results: [], runtimeMs: 0 };
    if (proc.compileFailed) {
      return {
        status: "compile_error",
        error: cleanCompileOutput(proc.compileOutput, dir) || "Compilation failed.",
        results: [],
        runtimeMs: 0,
      };
    }

    logger.debug(`[executor] ${language}/${mode} finished exit=${proc.exitCode} timedOut=${proc.timedOut}`);

    const records = parseRecords(proc.stdout, nonce);
    const results = [];
    let totalMs = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const rec = records.get(i);

      if (!rec) {
        // No result for this test: it hung, the process died, or the code didn't even load.
        if (proc.timedOut) return { status: "timeout", results, runtimeMs: totalMs, failedHidden: !!tc.isHidden };
        return { status: "runtime_error", error: describeFailure(proc, dir), results, runtimeMs: totalMs };
      }

      totalMs += rec.ms || 0;

      if (!rec.ok) {
        // Never echo error text from hidden tests: a thrown message could print the hidden input.
        const error = tc.isHidden
          ? "Runtime error on a hidden test case (details are not shown for hidden tests)."
          : String(rec.err).split(dir).join(".");
        return { status: "runtime_error", error, results, runtimeMs: totalMs, failedHidden: !!tc.isHidden };
      }

      const passed = outputsMatch(rec.out, tc.expectedOutput, options.compareMode);
      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: rec.out,
        passed,
        runtimeMs: rec.ms || 0,
        isHidden: !!tc.isHidden,
      });

      if (!passed) return { status: "wrong_answer", results, runtimeMs: totalMs };
    }

    return { status: "accepted", results, runtimeMs: totalMs };
  });
}

function _resetModeForTests() {
  resolvedMode = null;
}

module.exports = { runAgainstTestCases, outputsMatch, deepEqual, _resetModeForTests };
