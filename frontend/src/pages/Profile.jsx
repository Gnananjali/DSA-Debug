import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import DifficultyBadge from "../components/DifficultyBadge";
import StatusPill from "../components/StatusPill";
import { LANGUAGES, timeAgo } from "../utils/status";

const COLORS = { Easy: "#5FD39A", Medium: "#F0A93B", Hard: "#F07A70" };

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div className="card p-5">
      <p className={`font-mono text-3xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-sm text-dim">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [submissions, setSubmissions] = useState(null);

  useEffect(() => {
    refreshUser();
    api
      .get("/submissions")
      .then(({ data }) => setSubmissions(data.submissions))
      .catch(() => setSubmissions([]));
  }, [refreshUser]);

  const accepted = useMemo(() => (submissions || []).filter((s) => s.status === "accepted").length, [submissions]);

  if (!user) return null;

  const { easySolved, mediumSolved, hardSolved, solved } = user.stats;
  const chartData = [
    { name: "Easy", value: easySolved },
    { name: "Medium", value: mediumSolved },
    { name: "Hard", value: hardSolved },
  ].filter((d) => d.value > 0);
  const total = submissions?.length ?? 0;
  const rate = total ? Math.round((accepted / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-4 animate-fade-up">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 font-mono text-xl font-bold uppercase text-accent ring-1 ring-accent/30">
          {user.username.slice(0, 2)}
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{user.username}</h1>
          <p className="text-sm text-dim">{user.email}{user.role === "admin" && <span className="chip ml-2 text-accent">admin</span>}</p>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="grid grid-cols-2 gap-5 md:col-span-2 md:grid-cols-2">
          <Stat label="Problems solved" value={solved} tone="text-success" />
          <Stat label="Submissions" value={total} />
          <Stat label="Acceptance rate" value={total ? `${rate}%` : "–"} tone="text-accent" />
          <div className="card p-5">
            <div className="flex gap-4 font-mono text-sm">
              <span className="text-success">{easySolved} <span className="text-dim">E</span></span>
              <span className="text-accent">{mediumSolved} <span className="text-dim">M</span></span>
              <span className="text-danger">{hardSolved} <span className="text-dim">H</span></span>
            </div>
            <p className="mt-2 text-sm text-dim">By difficulty</p>
          </div>
        </div>

        <div className="card relative p-4">
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} paddingAngle={3} stroke="none">
                    {chartData.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1E222D", border: "1px solid #2A2F3E", borderRadius: 8, color: "#ECEAE6" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center"><p className="font-mono text-2xl font-bold">{solved}</p><p className="text-[11px] text-dim">solved</p></div>
              </div>
            </>
          ) : (
            <div className="flex h-[170px] items-center justify-center px-4 text-center text-sm text-dim">
              Solve a problem to see your breakdown here.
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold">Recent submissions</h2>
      <div className="card overflow-hidden">
        {submissions === null ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-5 w-full" />)}</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-dim">
            No submissions yet. <Link to="/problems" className="text-accent hover:underline">Pick a problem</Link> to get started.
          </div>
        ) : (
          submissions.map((s) => (
            <Link
              key={s._id}
              to={s.problem?.slug ? `/problems/${s.problem.slug}` : "/problems"}
              className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface2/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate text-sm font-medium">{s.problem?.title || "Deleted problem"}</span>
                {s.problem && <DifficultyBadge difficulty={s.problem.difficulty} />}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="chip hidden sm:inline-flex">{LANGUAGES[s.language]?.short || s.language}</span>
                <span className="hidden font-mono text-xs text-dim sm:inline">{timeAgo(s.createdAt)}</span>
                <StatusPill status={s.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
