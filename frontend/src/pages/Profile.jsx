import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import DifficultyBadge from "../components/DifficultyBadge";

const COLORS = { Easy: "#6FCF97", Medium: "#E8A33D", Hard: "#E8746A" };

export default function Profile() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    api.get("/submissions").then(({ data }) => setSubmissions(data.submissions));
  }, []);

  if (!user) return null;

  const chartData = [
    { name: "Easy", value: user.stats.easySolved },
    { name: "Medium", value: user.stats.mediumSolved },
    { name: "Hard", value: user.stats.hardSolved },
  ].filter((d) => d.value > 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-display text-2xl font-800 text-ink">{user.username}</h1>
      <p className="mb-8 text-sm text-dim">{user.email}</p>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded border border-border bg-surface p-6">
          <p className="mb-1 font-mono text-3xl text-ink">{user.stats.solved}</p>
          <p className="text-sm text-dim">Problems solved</p>
          <div className="mt-4 flex gap-4 font-mono text-xs">
            <span className="text-success">{user.stats.easySolved} Easy</span>
            <span className="text-accent">{user.stats.mediumSolved} Medium</span>
            <span className="text-danger">{user.stats.hardSolved} Hard</span>
          </div>
        </div>

        <div className="rounded border border-border bg-surface p-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={COLORS[d.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#20232F", border: "1px solid #2A2E3D" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[140px] items-center justify-center text-sm text-dim">
              Solve a problem to see your breakdown here.
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-3 font-display text-lg font-700 text-ink">Recent submissions</h2>
      <div className="overflow-hidden rounded border border-border bg-surface">
        {submissions.length === 0 ? (
          <div className="p-6 text-sm text-dim">No submissions yet.</div>
        ) : (
          submissions.map((s) => (
            <div key={s._id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="text-sm text-ink">{s.problem?.title}</span>
                <DifficultyBadge difficulty={s.problem?.difficulty} />
              </div>
              <span className={`font-mono text-xs ${s.status === "accepted" ? "text-success" : "text-dim"}`}>
                {s.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
