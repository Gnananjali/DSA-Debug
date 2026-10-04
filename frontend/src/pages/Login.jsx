import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Spinner from "../components/Spinner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/problems");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep working through problems."
      footer={<>Don't have an account? <Link to="/register" className="font-medium text-accent hover:underline">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-dim">Email</label>
          <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-dim">Password</label>
          <input id="password" type="password" required autoComplete="current-password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full !py-2.5">
          {submitting ? <><Spinner /> Logging in…</> : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
