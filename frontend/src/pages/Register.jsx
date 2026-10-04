import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Spinner from "../components/Spinner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate("/problems");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start solving and tracking your progress."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-accent hover:underline">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-dim">Username</label>
          <input id="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username"
            title="Letters, numbers and underscores only" placeholder="ada_lovelace"
            value={username} onChange={(e) => setUsername(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-dim">Email</label>
          <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-dim">Password</label>
          <input id="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password"
            placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full !py-2.5">
          {submitting ? <><Spinner /> Creating account…</> : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
