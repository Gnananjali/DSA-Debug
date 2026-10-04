/**
 * Judge0 backend: runs submissions on a hosted (or self-hosted) Judge0 instance
 * instead of on this machine. No Docker and no local compilers required, and the
 * untrusted code never touches your server.
 *
 *   EXEC_MODE=judge0
 *   JUDGE0_URL=https://ce.judge0.com        (default: the public Judge0 CE instance)
 *   JUDGE0_AUTH_TOKEN=...                   (optional, sent as X-Auth-Token for self-hosted)
 *   JUDGE0_RAPIDAPI_KEY=...                 (optional, for the RapidAPI-hosted version)
 *   JUDGE0_LANG_JS=63 JUDGE0_LANG_PYTHON=71 JUDGE0_LANG_CPP=54   (language ids, see GET /languages)
 *
 * Defaults match Judge0 CE: Node.js 12.14.0 (63), Python 3.8.1 (71), C++ GCC 9.2.0 (54).
 *
 * Privacy: submitted source code is sent to the Judge0 host you configure.
 */
const logger = require("../../utils/logger");

const POLL_INTERVAL_MS = 600;
const REQUEST_TIMEOUT_MS = 15000;
const QUEUE_ALLOWANCE_MS = 30000; // time we are willing to wait for queueing + compilation

const baseUrl = () => (process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/+$/, "");

const languageId = (language) =>
  ({
    javascript: Number(process.env.JUDGE0_LANG_JS || 63),
    python: Number(process.env.JUDGE0_LANG_PYTHON || 71),
    cpp: Number(process.env.JUDGE0_LANG_CPP || 54),
  })[language];

function headers() {
  const h = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_AUTH_TOKEN) h["X-Auth-Token"] = process.env.JUDGE0_AUTH_TOKEN;
  if (process.env.JUDGE0_RAPIDAPI_KEY) {
    h["X-RapidAPI-Key"] = process.env.JUDGE0_RAPIDAPI_KEY;
    h["X-RapidAPI-Host"] = process.env.JUDGE0_RAPIDAPI_HOST || new URL(baseUrl()).host;
  }
  return h;
}

const encode = (text) => Buffer.from(text, "utf8").toString("base64");
const decode = (b64) => (b64 ? Buffer.from(b64, "base64").toString("utf8") : "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(pathname, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(baseUrl() + pathname, { ...options, headers: headers(), signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Judge0 responded ${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs one program (the harness) and returns the same shape as the local
 * process runner. Infrastructure problems THROW, so BullMQ can retry; problems
 * in the user's program are returned as data.
 */
async function runOnJudge0({ language, source, input, timeoutMs }) {
  const id = languageId(language);
  if (!id) throw new Error(`No Judge0 language id configured for ${language}`);

  const body = { language_id: id, source_code: encode(source), stdin: encode(input) };
  if (process.env.JUDGE0_SEND_LIMITS !== "false") {
    const cpuSeconds = timeoutMs / 1000;
    body.cpu_time_limit = cpuSeconds;
    body.wall_time_limit = Math.min(cpuSeconds * 2, 20);
    body.memory_limit = 256000; // KB
  }

  const created = await request("/submissions?base64_encoded=true&wait=true", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!created || !created.token) throw new Error("Judge0 did not return a submission token");

  const deadline = Date.now() + timeoutMs + QUEUE_ALLOWANCE_MS;
  const fields = "status,stdout,stderr,compile_output,message,time,memory";

  while (Date.now() < deadline) {
    const data = await request(`/submissions/${created.token}?base64_encoded=true&fields=${fields}`);
    const statusId = data.status && data.status.id;

    if (statusId === 1 || statusId === 2) {
      await sleep(POLL_INTERVAL_MS); // In Queue / Processing
      continue;
    }

    const stdout = decode(data.stdout);
    const stderr = decode(data.stderr);
    const compileOutput = decode(data.compile_output);
    const message = decode(data.message);
    const description = (data.status && data.status.description) || "";
    logger.debug(`[judge0] token=${created.token} status=${statusId} (${description})`);

    if (statusId === 13 || statusId === 14) {
      throw new Error(`Judge0 internal error: ${description} ${message}`.trim());
    }
    if (statusId === 6) {
      return { stdout: "", stderr: "", exitCode: 1, timedOut: false, outputLimitHit: false, compileFailed: true, compileOutput };
    }

    return {
      stdout,
      stderr: stderr || message || (statusId === 3 ? "" : description),
      exitCode: statusId === 3 ? 0 : 1,
      signal: null,
      timedOut: statusId === 5,
      outputLimitHit: false,
    };
  }

  throw new Error("Timed out waiting for Judge0 to finish the submission");
}

module.exports = { runOnJudge0 };
