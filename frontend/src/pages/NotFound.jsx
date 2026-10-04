import { Link } from "react-router-dom";
import { BugIcon } from "../components/Icons";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center animate-fade-up">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/30"><BugIcon size={28} /></span>
      <p className="font-mono text-sm text-dim">404</p>
      <h1 className="text-2xl font-extrabold tracking-tight">Found a bug: this page doesn't exist</h1>
      <p className="max-w-sm text-sm text-dim">The link may be broken, or the page may have moved.</p>
      <Link to="/" className="btn-primary mt-2">Back home</Link>
    </div>
  );
}
