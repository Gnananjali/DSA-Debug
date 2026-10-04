import { useEffect, useState } from "react";
import { STATUS, TONE_CLASSES, PENDING } from "../utils/status";
import { CheckIcon, XIcon, ClockIcon, AlertIcon, SparkleIcon, TerminalIcon, EyeOffIcon } from "./Icons";
import Spinner from "./Spinner";

const STEPS = ["Queued", "Running", "Verdict"];

function Stepper({ status }) {
  const active = status === "queued" ? 0 : 1;
  return (
    <div className="p-5" role="status" aria-live="polite">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full border font-mono text-xs transition ${
                  done ? "border-success bg-success/15 text-success"
                  : current ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-dim"
                }`}
              >
                {done ? <CheckIcon size={14} /> : current ? <Spinner size={14} /> : i + 1}
              </span>
              <span className={`text-sm ${current ? "font-semibold text-ink" : "text-dim"}`}>{label}</span>
              {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? "bg-success/50" : "bg-border"}`} />}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm text-dim">{STATUS[status]?.hint}</p>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

function TestBar({ passed = 0, total = 0, status }) {
  if (!total) return null;
  const failedIndex = status === "accepted" ? -1 : passed; // the first test that did not pass
  return (
    <div className="flex gap-1" aria-label={`${passed} of ${total} tests passed`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < passed ? "bg-success" : i === failedIndex ? "bg-danger" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-2">
      <span className="text-dim">{label}</span>
      <code className={`break-all ${tone || "text-ink"}`}>{value}</code>
    </div>
  );
}

function Analysis({ ai }) {
  return (
    <section className="rounded-xl border border-border bg-surface2/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-accent">
        <SparkleIcon size={15} /> AI analysis
      </div>
      <div className="mb-3 flex flex-wrap gap-2 font-mono text-xs">
        <span className="chip">Time <span className="ml-1.5 font-bold text-ink">{ai.timeComplexity || "–"}</span></span>
        <span className="chip">Space <span className="ml-1.5 font-bold text-ink">{ai.spaceComplexity || "–"}</span></span>
      </div>
      {ai.summary && <p className="text-sm leading-relaxed text-ink/90">{ai.summary}</p>}
      {Array.isArray(ai.suggestions) && ai.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-dim">Suggestions</p>
          <ul className="space-y-1.5">
            {ai.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-dim">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function SubmissionPanel({ result }) {
  // AI analysis arrives after the verdict. Show a "thinking" hint briefly, but not forever
  // (analysis may be switched off on the server).
  const [aiTimedOut, setAiTimedOut] = useState(false);
  useEffect(() => {
    setAiTimedOut(false);
    if (!result || PENDING.includes(result.status)) return;
    const t = setTimeout(() => setAiTimedOut(true), 20000);
    return () => clearTimeout(t);
  }, [result?.submissionId, result?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface2 text-dim"><TerminalIcon size={20} /></span>
        <p className="text-sm text-dim">Submit your code to see results here.</p>
        <p className="text-xs text-dim/70"><span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> to submit</p>
      </div>
    );
  }

  if (PENDING.includes(result.status)) return <Stepper status={result.status} />;

  const info = STATUS[result.status] || { label: result.status, tone: "dim", hint: "" };
  const tone = TONE_CLASSES[info.tone];
  const ok = result.status === "accepted";
  const Icon = ok ? CheckIcon : result.status === "timeout" ? ClockIcon : result.status === "error" ? AlertIcon : XIcon;
  const ai = result.aiAnalysis;
  const errorTitle = result.status === "compile_error" ? "Compiler output" : "Error";
  const compileFailed = result.status === "compile_error"; // nothing ran, so no tests and no analysis
  const showAiPending = !ai && !aiTimedOut && !["error", "compile_error"].includes(result.status);

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4 animate-fade-up" role="status" aria-live="polite">
      <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${tone.bg} ${tone.border}`}>
        <div className="flex items-center gap-3">
          <span className={`grid h-9 w-9 place-items-center rounded-full ${tone.bg} ${tone.text} ring-1 ring-white/10`}><Icon size={18} /></span>
          <div>
            <p className={`text-lg font-extrabold leading-tight ${tone.text}`}>{info.label}</p>
            <p className="text-xs text-dim">{info.hint}</p>
          </div>
        </div>
        {result.testsTotal > 0 && !compileFailed && (
          <div className="text-right font-mono text-xs text-dim">
            <p><span className="text-base font-bold text-ink">{result.testsPassed}</span>/{result.testsTotal} tests</p>
            <p>{result.runtimeMs ?? "–"} ms</p>
          </div>
        )}
      </div>

      {!compileFailed && <TestBar passed={result.testsPassed} total={result.testsTotal} status={result.status} />}

      {result.failedCase?.hidden && (
        <div className="flex gap-3 rounded-xl border border-border bg-surface2/60 p-4 text-sm text-dim">
          <EyeOffIcon size={18} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Failed on a <span className="font-semibold text-ink">hidden test case</span>. Hidden tests don't reveal their input or
            expected output. Think about edge cases: empty or minimal input, duplicates, negative numbers, very large values.
          </p>
        </div>
      )}

      {result.failedCase && !result.failedCase.hidden && (
        <section className="space-y-2 rounded-xl border border-border bg-surface2/60 p-4 font-mono text-xs">
          <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-wide text-dim">First failing test</p>
          <Row label="Input" value={result.failedCase.input} />
          <Row label="Expected" value={result.failedCase.expectedOutput} tone="text-success" />
          <Row label="Got" value={result.failedCase.actualOutput} tone="text-danger" />
        </section>
      )}

      {result.error && (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-dim">{errorTitle}</p>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-danger/30 bg-danger/5 p-3 font-mono text-xs leading-relaxed text-danger">
            {result.error}
          </pre>
        </section>
      )}

      {ai ? <Analysis ai={ai} /> : showAiPending && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 p-4 text-sm text-dim">
          <Spinner size={16} className="text-accent" /> Analyzing time &amp; space complexity…
        </div>
      )}
    </div>
  );
}
