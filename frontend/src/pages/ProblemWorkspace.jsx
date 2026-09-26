import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";
import DifficultyBadge from "../components/DifficultyBadge";
import CodeEditor from "../components/CodeEditor";
import SubmissionPanel from "../components/SubmissionPanel";

export default function ProblemWorkspace() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const pendingSubmissionId = useRef(null);

  useEffect(() => {
    async function load() {
      const { data } = await api.get(`/problems/${slug}`);
      setProblem(data.problem);
      setCode(data.problem.starterCode[language] || "");
      setResult(null);
    }
    load();
  }, [slug]);

  useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  function onUpdate(payload) {
    console.log("[socket] submission:update received:", payload);
    if (payload.submissionId?.toString() !== pendingSubmissionId.current?.toString()) {
      return;
    }

    setResult((prev) => ({
  ...prev,
  ...payload,
  aiAnalysis: payload.aiAnalysis ?? prev?.aiAnalysis,
}));

    if (payload.status !== "queued" && payload.status !== "running") {
      setSubmitting(false);
    }
  }

  socket.on("submission:update", onUpdate);

  return () => {
    socket.off("submission:update", onUpdate);
  };
}, []);

  async function handleSubmit() {
  setSubmitting(true);
  setResult({ status: "queued" });

  const { data } = await api.post("/submissions", {
    problemSlug: slug,
    language,
    code,
  });

  pendingSubmissionId.current = data.submissionId.toString();

  const pollSubmission = async () => {
    try {
      const response = await api.get(`/submissions/${data.submissionId}`);
      const submission = response.data.submission;
      console.log("[frontend] submission from API:", submission);

      setResult({
  submissionId: submission._id,
  status: submission.status,
  testsPassed: submission.testsPassed,
  testsTotal: submission.testsTotal,
  runtimeMs: submission.runtimeMs,
  failedCase: submission.failedCase,
  aiAnalysis: submission.aiAnalysis
    ? {
        timeComplexity: submission.aiAnalysis.timeComplexity,
        spaceComplexity: submission.aiAnalysis.spaceComplexity,
        summary: submission.aiAnalysis.summary,
        suggestions: submission.aiAnalysis.suggestions,
      }
    : null,
  error: submission.error,
});

      if (
  submission.status === "queued" ||
  submission.status === "running" ||
  (submission.status === "accepted" && !submission.aiAnalysis?.timeComplexity)
) {
  setTimeout(pollSubmission, 1000);
} else {
  setSubmitting(false);
}
    } catch (error) {
      console.error("[submission] polling failed:", error);
      setSubmitting(false);
    }
  };

  pollSubmission();
}

  if (!problem) {
    return <div className="p-10 text-dim">Loading problem…</div>;
  }

  return (
    <div className="grid h-[calc(100vh-65px)] grid-cols-1 md:grid-cols-2">
      {/* Problem description */}
      <div className="overflow-y-auto border-r border-border p-6">
        <div className="mb-3 flex items-center gap-3">
          <h1 className="font-display text-xl font-800 text-ink">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="mb-6 flex gap-2">
          {problem.tags?.map((t) => (
            <span key={t} className="rounded border border-border px-2 py-0.5 font-mono text-xs text-dim">{t}</span>
          ))}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{problem.description}</p>

        {problem.constraints?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-medium text-dim">Constraints</h3>
            <ul className="list-inside list-disc space-y-1 font-mono text-xs text-dim">
              {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {problem.sampleTestCases?.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-medium text-dim">Examples</h3>
            {problem.sampleTestCases.map((tc, i) => (
              <div key={i} className="rounded border border-border bg-surface p-3 font-mono text-xs">
                <div><span className="text-dim">Input: </span>{tc.input}</div>
                <div><span className="text-dim">Output: </span>{tc.expectedOutput}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor + results */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
          <select
  value={language}
  onChange={(e) => setLanguage(e.target.value)}
  className="rounded border border-border bg-surface2 px-2 py-1 text-sm text-ink"
>
  <option value="javascript">JavaScript</option>
  <option value="python">Python</option>
  
</select>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Running…" : "Submit"}
          </button>
        </div>

        <div className="h-[55%] min-h-[200px]">
          <CodeEditor language={language} value={code} onChange={setCode} />
        </div>

        <div className="h-[45%] border-t border-border">
          <SubmissionPanel result={result} />
        </div>
      </div>
    </div>
  );
}
