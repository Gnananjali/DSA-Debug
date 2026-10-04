import { Link } from "react-router-dom";
import Logo from "./Logo";
import { CheckIcon } from "./Icons";

const POINTS = [
  "Run code in an isolated sandbox",
  "JavaScript, Python and C++",
  "AI time & space complexity analysis",
  "Hidden test cases, real verdicts",
];

// Shared two-column layout for the login and sign-up screens.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-2">
      <aside className="hidden md:block">
        <Link to="/"><Logo size="lg" /></Link>
        <h2 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight">
          Get better at the problems<br />that get you hired.
        </h2>
        <ul className="mt-8 space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-3 text-dim">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success"><CheckIcon size={14} /></span>
              {p}
            </li>
          ))}
        </ul>
      </aside>

      <div className="card mx-auto w-full max-w-md p-8 animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mb-7 mt-1 text-sm text-dim">{subtitle}</p>
        {children}
        <p className="mt-6 text-sm text-dim">{footer}</p>
      </div>
    </div>
  );
}
