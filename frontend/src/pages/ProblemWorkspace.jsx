import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import DifficultyBadge from "../components/DifficultyBadge";
import CodeEditor from "../components/CodeEditor";
import SubmissionPanel from "../components/SubmissionPanel";
import Spinner from "../components/Spinner";
import { AlertIcon, PlayIcon, ResetIcon } from "../components/Icons";
import { LANGUAGES, PENDING } from "../utils/status";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes, then give up and tell the user

const draftKey = (slug, language) => `dsadebug:draft:${slug}:${language}`;
const readDraft = (slug, language) => { try { return localStorage.getItem(draftKey(slug, language)); } catch { return null; } };
const writeDraft = (slug, language, code) => { try { localStorage.setItem(draftKey(slug, language), code); } catch { /* storage unavailable */ } };
const clearDraft = (slug, language) => { try { localStorage.removeItem(draftKey(slug, language)); } catch { /* ignore */ } };

// The REST API and the socket use slightly different field names for the id.
function normalize(payload) {
  return {
    submissionId: payload.submissionId ?? payload._id,
    status: payload.status,
    testsPassed: payload.testsPassed,
    testsTotal: payload.testsTotal,
    runtimeMs: payload.runtimeMs,
    failedCase: payload.failedCase,
    aiAnalysis: payload.aiAnalysis || null,
    error: payload.error,
  };
}

// Problem text uses `backticks` for code: render them as inline code instead of showing the backticks.
function InlineCode({ text }) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[13px] text-accent">{part.slice(1, -1)}</code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ProblemWorkspace() {
  const { slug } = useParams();
  const { refreshUser } = useAuth();
  const [problem, setProblem] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [language, setLanguage] = useState(() => localStorage.getItem("dsadebug:language") || "javascript");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  const pendingSubmissionId = useRef(null);
  const pollTimer = useRef(null);

  const stopPolling = useCallback(() => {
    clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  const available = problem ? Object.keys(LANGUAGES).filter((l) => problem.starterCode?.[l]) : [];
  const activeLanguage = available.includes(language) ? language : available[0] || "javascript";

  const starterFor = useCallback((p, lang) => p.starterCode?.[lang] || "", []);

  // Load the problem.
  useEffect(() => {
    let cancelled = false;
    setProblem(null);
    setLoadError("");
    setResult(null);
    setSubmitError("");
    api
      .get(`/problems/${slug}`)
      .then(({ data }) => { if (!cancelled) setProblem(data.problem); })
      .catch((err) => {
        if (!cancelled) setLoadError(err.response?.status === 404 ? "Problem not found." : "Could not load this problem.");
      });
    return () => { cancelled = true; };
  }, [slug]);

  // Load the user's saved draft (or the starter) whenever the problem or language changes.
  useEffect(() => {
    if (!problem) return;
    setCode(readDraft(slug, activeLanguage) ?? starterFor(problem, activeLanguage));
  }, [problem, slug, activeLanguage, starterFor]);

  function handleCodeChange(value) {
    setCode(value);
    writeDraft(slug, activeLanguage, value);
  }

  function handleLanguageChange(next) {
    setLanguage(next);
    try { localStorage.setItem("dsadebug:language", next); } catch { /* ignore */ }
  }

  function handleReset() {
    if (!problem) return;
    clearDraft(slug, activeLanguage);
    setCode(starterFor(problem, activeLanguage));
  }

  // Real-time updates: the worker pushes every status change over the socket.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onUpdate(payload) {
      if (payload.submissionId?.toString() !== pendingSubmissionId.current) return;

      setResult((prev) => ({
        ...prev,
        ...normalize(payload),
        aiAnalysis: payload.aiAnalysis ?? prev?.aiAnalysis ?? null,
      }));

      if (!PENDING.includes(payload.status)) {
        setSubmitting(false);
        if (payload.aiAnalysis) stopPolling(); // nothing left to wait for
      }
    }

    socket.on("submission:update", onUpdate);
    return () => socket.off("submission:update", onUpdate);
  }, [stopPolling]);

  useEffect(() => stopPolling, [stopPolling]); // stop any poll when leaving the page

  // An accepted submission changes the user's stats and solved ticks.
  useEffect(() => {
    if (result?.status === "accepted") refreshUser();
  }, [result?.status, result?.submissionId, refreshUser]);

  /**
   * Safety net, not the main channel. The socket normally delivers results
   * instantly, but it can miss an event (reconnect, or the worker finishing
   * before we knew the submission id), so we check the API every few seconds
   * until the verdict arrives.
   */
  const pollSubmission = useCallback((id, attempt = 0, extraRounds = 0) => {
    pollTimer.current = setTimeout(async () => {
      if (pendingSubmissionId.current !== id) return; // user submitted something newer

      try {
        const { data } = await api.get(`/submissions/${id}`);
        const latest = normalize(data.submission);
        setResult((prev) => ({ ...latest, aiAnalysis: latest.aiAnalysis ?? prev?.aiAnalysis ?? null }));

        if (!PENDING.includes(latest.status)) {
          setSubmitting(false);
          // AI analysis arrives shortly after the verdict: check a few more times, then stop.
          if (!latest.aiAnalysis && extraRounds < 3) pollSubmission(id, attempt + 1, extraRounds + 1);
          return;
        }

        if (attempt + 1 < MAX_POLLS) {
          pollSubmission(id, attempt + 1);
        } else {
          setSubmitting(false);
          setSubmitError("This is taking longer than expected. Check your Profile page for the result.");
        }
      } catch {
        setSubmitting(false);
        setSubmitError("Lost connection while waiting for the result.");
      }
    }, attempt === 0 ? 1500 : POLL_INTERVAL_MS);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting || !problem) return;
    stopPolling();
    setSubmitError("");
    setSubmitting(true);
    setResult({ status: "queued" });
    pendingSubmissionId.current = null;

    try {
      const { data } = await api.post("/submissions", { problemSlug: slug, language: activeLanguage, code });
      const id = data.submissionId.toString();
      pendingSubmissionId.current = id;
      pollSubmission(id);
    } catch (err) {
      setSubmitting(false);
      setResult(null);
      setSubmitError(err.response?.data?.message || "Could not submit. Please try again.");
    }
  }, [submitting, problem, slug, activeLanguage, code, stopPolling, pollSubmission]);

  // Ctrl/Cmd + Enter anywhere on the page (the editor registers the same shortcut itself).
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSubmit]);

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertIcon size={28} className="text-danger" />
        <p className="text-danger">{loadError}</p>
        <Link to="/problems" className="btn-ghost">Back to problems</Link>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-3/4" />
        </div>
        <div className="skeleton h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:h-[calc(100vh-65px)] md:grid-cols-[minmax(320px,42%)_1fr]">
      {/* Problem description */}
      <div className="overflow-y-auto border-border p-6 md:border-r">
        <Link to="/problems" className="mb-4 inline-block text-xs text-dim transition-colors hover:text-accent">← All problems</Link>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {problem.tags?.map((t) => <span key={t} className="chip">{t}</span>)}
        </div>

        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90"><InlineCode text={problem.description} /></p>

        <p className="mt-5 rounded-lg border border-border bg-surface2/50 px-3 py-2 text-xs text-dim">
          Implement a function named <code className="font-mono text-accent">solve</code>. Keep the name and parameter types from the starter code.
        </p>

        {problem.sampleTestCases?.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-dim">Examples</h3>
            {problem.sampleTestCases.map((tc, i) => (
              <div key={i} className="space-y-1 rounded-lg border border-border bg-surface p-3 font-mono text-xs">
                <div><span className="text-dim">Input: </span>{tc.input}</div>
                <div><span className="text-dim">Output: </span><span className="text-success">{tc.expectedOutput}</span></div>
              </div>
            ))}
          </div>
        )}

        {problem.constraints?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dim">Constraints</h3>
            <ul className="space-y-1 font-mono text-xs text-dim">
              {problem.constraints.map((c, i) => (
                <li key={i} className="flex gap-2"><span className="text-accent">▸</span>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Editor + results */}
      <div className="flex min-h-[640px] flex-col md:min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/70 px-3 py-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-bg/60 p-0.5" role="tablist" aria-label="Language">
            {available.map((l) => (
              <button
                key={l}
                role="tab"
                aria-selected={activeLanguage === l}
                onClick={() => handleLanguageChange(l)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeLanguage === l ? "bg-accent text-bg" : "text-dim hover:text-ink"
                }`}
              >
                {LANGUAGES[l].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="btn-ghost !px-2.5 !py-1.5 text-xs" title="Reset to starter code">
              <ResetIcon size={14} /> <span className="hidden sm:inline">Reset</span>
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary !py-1.5">
              {submitting ? <><Spinner size={14} /> Running…</> : <><PlayIcon size={13} /> Submit <span className="kbd ml-1 hidden !bg-bg/20 !text-bg/80 border-bg/20 sm:inline">Ctrl ⏎</span></>}
            </button>
          </div>
        </div>

        {submitError && (
          <div role="alert" className="flex items-center gap-2 border-b border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
            <AlertIcon size={15} /> {submitError}
          </div>
        )}

        <div className="min-h-[240px] flex-[3]">
          <CodeEditor language={activeLanguage} value={code} onChange={handleCodeChange} onSubmit={handleSubmit} />
        </div>

        <div className="min-h-[220px] flex-[2] border-t border-border bg-surface/40">
          <SubmissionPanel result={result} />
        </div>
      </div>
    </div>
  );
}
