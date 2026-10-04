// One place that describes how every submission status looks and reads.
export const PENDING = ["queued", "running"];

export const STATUS = {
  queued: { label: "Queued", tone: "dim", hint: "Waiting for a runner…" },
  running: { label: "Running", tone: "accent", hint: "Executing your code in the sandbox…" },
  accepted: { label: "Accepted", tone: "success", hint: "All tests passed." },
  wrong_answer: { label: "Wrong Answer", tone: "danger", hint: "Your output didn't match the expected output." },
  compile_error: { label: "Compilation Error", tone: "danger", hint: "Your code didn't compile." },
  runtime_error: { label: "Runtime Error", tone: "danger", hint: "Your program crashed while running." },
  timeout: { label: "Time Limit Exceeded", tone: "danger", hint: "Your solution took too long. Look for a faster approach." },
  error: { label: "System Error", tone: "danger", hint: "Something went wrong on our side." },
};

export const TONE_CLASSES = {
  success: { text: "text-success", bg: "bg-success/10", border: "border-success/40", dot: "bg-success" },
  danger: { text: "text-danger", bg: "bg-danger/10", border: "border-danger/40", dot: "bg-danger" },
  accent: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/40", dot: "bg-accent" },
  dim: { text: "text-dim", bg: "bg-surface2", border: "border-border", dot: "bg-dim" },
};

export const LANGUAGES = {
  javascript: { label: "JavaScript", short: "JS", monaco: "javascript", tabSize: 2 },
  python: { label: "Python", short: "PY", monaco: "python", tabSize: 4 },
  cpp: { label: "C++", short: "C++", monaco: "cpp", tabSize: 4 },
};

export function timeAgo(date) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const units = [["d", 86400], ["h", 3600], ["m", 60]];
  for (const [unit, size] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
  }
  return "just now";
}
