import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-mono text-sm text-dim">404</p>
      <h1 className="font-display text-xl font-800 text-ink">Page not found</h1>
      <Link to="/" className="text-accent hover:underline">Back home</Link>
    </div>
  );
}
