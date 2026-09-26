const statusStyles = {
  queued: "text-dim",
  running: "text-accent",
  accepted: "text-success",
  wrong_answer: "text-danger",
  runtime_error: "text-danger",
  timeout: "text-danger",
  error: "text-danger",
};

const statusLabel = {
  queued: "Queued",
  running: "Running...",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  timeout: "Time Limit Exceeded",
  error: "Error",
};

export default function SubmissionPanel({ result }) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-dim">
        Run your code to see results here.
      </div>
    );
  }

  const ai = result.aiAnalysis;

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <span
          className={`font-display text-lg font-700 ${
            statusStyles[result.status] || "text-ink"
          }`}
        >
          {statusLabel[result.status] || result.status}
        </span>

        {result.testsTotal > 0 && (
          <span className="font-mono text-sm text-dim">
            {result.testsPassed}/{result.testsTotal} tests ·{" "}
            {result.runtimeMs ?? "-"}ms
          </span>
        )}
      </div>

      {result.failedCase && (
        <div className="space-y-2 rounded border border-border bg-surface2 p-3 font-mono text-xs">
          <div>
            <span className="text-dim">Input: </span>
            {result.failedCase.input}
          </div>
          <div>
            <span className="text-dim">Expected: </span>
            {result.failedCase.expectedOutput}
          </div>
          <div>
            <span className="text-dim">Got: </span>
            {result.failedCase.actualOutput}
          </div>
        </div>
      )}

      {result.error && (
        <pre className="whitespace-pre-wrap rounded border border-danger/40 bg-danger/10 p-3 font-mono text-xs text-danger">
          {result.error}
        </pre>
      )}

      {ai && (
        <div className="space-y-3 rounded border border-border bg-surface2 p-4">
          <div className="flex gap-6 font-mono text-xs">
            <span className="text-dim">
              Time:{" "}
              <span className="text-ink">
                {ai.timeComplexity || "-"}
              </span>
            </span>

            <span className="text-dim">
              Space:{" "}
              <span className="text-ink">
                {ai.spaceComplexity || "-"}
              </span>
            </span>
          </div>

          {ai.summary && (
            <p className="text-sm leading-relaxed text-ink">
              {ai.summary}
            </p>
          )}

          {Array.isArray(ai.suggestions) && ai.suggestions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-dim">
                Suggestions
              </p>

              <ul className="list-inside list-disc space-y-1 text-sm text-dim">
                {ai.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}