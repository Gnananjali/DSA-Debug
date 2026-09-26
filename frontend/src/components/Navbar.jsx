import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg font-800 tracking-tight text-ink">
          DSA<span className="text-accent">Debug</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-dim">
          {user ? (
            <>
              <Link to="/problems" className="hover:text-ink">Problems</Link>
              <Link to="/profile" className="hover:text-ink">Profile</Link>
              <span className="text-ink">{user.username}</span>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="rounded border border-border px-3 py-1.5 hover:border-accent hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-ink">Log in</Link>
              <Link to="/register" className="rounded bg-accent px-3 py-1.5 font-medium text-bg hover:opacity-90">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
