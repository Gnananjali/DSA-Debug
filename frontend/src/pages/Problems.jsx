import { useEffect, useState } from "react";
import api from "../services/api";
import ProblemCard from "../components/ProblemCard";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = filter !== "All" ? { difficulty: filter } : {};
      const { data } = await api.get("/problems", { params });
      setProblems(data.problems);
      setLoading(false);
    }
    load();
  }, [filter]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-display text-2xl font-800 text-ink">Problems</h1>
      <p className="mb-6 text-sm text-dim">Work through the set, easiest to hardest.</p>

      <div className="mb-4 flex gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`rounded border px-3 py-1.5 text-sm ${
              filter === d
                ? "border-accent text-accent"
                : "border-border text-dim hover:text-ink"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-border bg-surface">
        {loading ? (
          <div className="p-6 text-sm text-dim">Loading problems…</div>
        ) : problems.length === 0 ? (
          <div className="p-6 text-sm text-dim">No problems match this filter yet.</div>
        ) : (
          problems.map((p, i) => <ProblemCard key={p.slug} problem={p} index={i + 1} />)
        )}
      </div>
    </div>
  );
}
