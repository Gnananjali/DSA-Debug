import { Link } from "react-router-dom";
import DifficultyBadge from "./DifficultyBadge";
import { CheckIcon, ArrowRightIcon } from "./Icons";

export default function ProblemCard({ problem, index, solved }) {
  return (
    <Link
      to={`/problems/${problem.slug}`}
      className="group flex items-center justify-between gap-4 border-b border-border/70 px-4 py-4 transition-colors last:border-b-0 hover:bg-surface2/70 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs ${
            solved ? "bg-success/15 text-success" : "text-dim"
          }`}
          aria-label={solved ? "Solved" : undefined}
        >
          {solved ? <CheckIcon size={14} /> : index}
        </span>
        <span className="truncate font-medium text-ink transition-colors group-hover:text-accent">{problem.title}</span>
        <div className="hidden gap-1.5 md:flex">
          {problem.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="chip">{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <DifficultyBadge difficulty={problem.difficulty} />
        <ArrowRightIcon size={16} className="-translate-x-1 text-dim opacity-0 transition group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100" />
      </div>
    </Link>
  );
}
