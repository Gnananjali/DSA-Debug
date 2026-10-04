import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const linkClass = ({ isActive }) =>
  `relative rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive ? "text-ink" : "text-dim hover:text-ink"
  } ${isActive ? "after:absolute after:inset-x-3 after:-bottom-[17px] after:h-0.5 after:rounded-full after:bg-accent" : ""}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/75 backdrop-blur-md">
      <div className="mx-auto flex h-[65px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="DSADebug home">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <NavLink to="/problems" className={linkClass}>Problems</NavLink>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              <span
                title={user.username}
                className="ml-2 hidden h-8 w-8 place-items-center rounded-full bg-accent/15 font-mono text-xs font-bold uppercase text-accent ring-1 ring-accent/30 sm:grid"
              >
                {user.username.slice(0, 2)}
              </span>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="btn-ghost ml-1 !px-3 !py-1.5"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <Link to="/register" className="btn-primary !px-4 !py-1.5">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
