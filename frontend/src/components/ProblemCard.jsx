import { Link } from "react-router-dom";
import DifficultyBadge from "./DifficultyBadge";

export default function ProblemCard({ problem, index }) {
  return (
    <Link
      to={`/problems/${problem.slug}`}
      className="flex items-center justify-between border-b border-border px-4 py-4 transition-colors hover:bg-surface2"
    >
      <div className="flex items-center gap-4">
        <span className="w-6 font-mono text-sm text-dim">{index}</span>
        <span className="text-ink">{problem.title}</span>
        <div className="hidden gap-2 sm:flex">
          {problem.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded border border-border px-2 py-0.5 font-mono text-xs text-dim">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
    </Link>
  );
}
