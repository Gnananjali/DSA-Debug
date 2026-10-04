import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProblemCard from "../components/ProblemCard";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

function ProblemSkeleton() {
  return (
    <div className="divide-y divide-border/70">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton h-6 w-6 rounded-full" />
          <div className="skeleton h-4 w-56" />
          <div className="skeleton ml-auto h-5 w-14" />
        </div>
      ))}
    </div>
  );
}

export default function Problems() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/problems")
      .then(({ data }) => !cancelled && setProblems(data.problems))
      .catch(() => !cancelled && setError("Could not load problems. Is the server running?"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const solvedIds = useMemo(() => new Set(user?.solvedProblems || []), [user]);
  const counts = useMemo(() => {
    const c = { All: problems.length, Easy: 0, Medium: 0, Hard: 0 };
    problems.forEach((p) => { c[p.difficulty] = (c[p.difficulty] || 0) + 1; });
    return c;
  }, [problems]);
  const visible = filter === "All" ? problems : problems.filter((p) => p.difficulty === filter);
  const solvedCount = problems.filter((p) => solvedIds.has(String(p._id))).length;
  const pct = problems.length ? Math.round((solvedCount / problems.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight">Problems</h1>
          <p className="mt-1 text-sm text-dim">Work through the set, easiest to hardest.</p>
        </div>

        {problems.length > 0 && (
          <div className="card w-full max-w-xs p-4 sm:w-72">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-medium text-dim">Your progress</span>
              <span className="font-mono text-sm"><span className="font-bold text-ink">{solvedCount}</span><span className="text-dim"> / {problems.length}</span></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by difficulty">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={filter === d}
            onClick={() => setFilter(d)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              filter === d
                ? "border-accent bg-accent/10 font-semibold text-accent"
                : "border-border text-dim hover:border-accent/50 hover:text-ink"
            }`}
          >
            {d}
            <span className="ml-1.5 font-mono text-xs opacity-70">{counts[d] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <ProblemSkeleton />
        ) : error ? (
          <div role="alert" className="p-6 text-sm text-danger">{error}</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-dim">No problems match this filter yet.</div>
        ) : (
          visible.map((p, i) => (
            <ProblemCard key={p.slug} problem={p} index={i + 1} solved={solvedIds.has(String(p._id))} />
          ))
        )}
      </div>
    </div>
  );
}
