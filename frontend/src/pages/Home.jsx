import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRightIcon, BoltIcon, CheckIcon, CodeIcon, EyeOffIcon, LayersIcon, SparkleIcon, ShieldIcon, ChartIcon,
} from "../components/Icons";

const FEATURES = [
  { icon: ShieldIcon, title: "Sandboxed execution", text: "Submissions run in an isolated sandbox, either Docker or a hosted Judge0 runner, with strict time and memory limits." },
  { icon: BoltIcon, title: "Real-time verdicts", text: "A job queue and WebSockets stream your result back the moment it's ready, with no refreshing." },
  { icon: SparkleIcon, title: "AI complexity analysis", text: "After the verdict, get the time and space complexity of your solution plus concrete ways to improve it." },
  { icon: CodeIcon, title: "JavaScript, Python & C++", text: "Switch languages in one click. C++ is compiled for you and compile errors point at your own line numbers." },
  { icon: EyeOffIcon, title: "Hidden test cases", text: "Samples are visible, edge cases are not, so passing means your solution is actually correct." },
  { icon: ChartIcon, title: "Track your progress", text: "See what you've solved, your difficulty breakdown, and your recent submissions at a glance." },
];

const STEPS = [
  { n: "01", title: "Write", text: "Pick a problem and solve it in the Monaco editor, the same editor that powers VS Code." },
  { n: "02", title: "Run", text: "Your code is queued, compiled if needed, and tested against every case in a sandbox." },
  { n: "03", title: "Learn", text: "Read the verdict, the failing case, and an AI breakdown of your approach." },
];

function PreviewCard() {
  return (
    <div className="card relative overflow-hidden animate-fade-up" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 font-mono text-xs text-dim">two-sum.cpp</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-6 text-ink/90">
{`vector<int> solve(vector<int>& nums, int target) {
  unordered_map<int,int> seen;
  for (int i = 0; i < nums.size(); i++) {
    int need = target - nums[i];
    if (seen.count(need)) return {seen[need], i};
    seen[nums[i]] = i;
  }
  return {};
}`}
      </pre>
      <div className="border-t border-border bg-surface2/60 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-success">
            <CheckIcon size={18} /> Accepted
          </span>
          <span className="font-mono text-xs text-dim">3/3 tests · 4ms</span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full w-full rounded-full bg-success" />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip">Time <span className="ml-1 text-ink">O(n)</span></span>
          <span className="chip">Space <span className="ml-1 text-ink">O(n)</span></span>
          <span className="chip text-accent"><SparkleIcon size={12} className="mr-1" /> AI analysis</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const cta = user ? "/problems" : "/register";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div className="animate-fade-up">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
              Sandboxed runner · AI complexity analysis
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Practice DSA.<br />
              <span className="bg-gradient-to-r from-accent to-[#ffd08a] bg-clip-text text-transparent">Debug like a pro.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-dim">
              Solve interview problems in JavaScript, Python or C++. Your code runs in an isolated sandbox, results stream back in real time, and AI explains the complexity of your solution.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={cta} className="btn-primary !px-6 !py-3 text-base shadow-glow">
                {user ? "Continue practicing" : "Start practicing free"} <ArrowRightIcon size={18} />
              </Link>
              {!user && <Link to="/login" className="btn-ghost !px-6 !py-3 text-base">Log in</Link>}
            </div>
            <dl className="mt-10 flex gap-8 font-mono text-sm">
              {[["13", "problems"], ["3", "languages"], ["∞", "attempts"]].map(([n, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-bold text-ink">{n}</dt>
                  <dd className="text-dim">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <PreviewCard />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Built like a real judge</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-dim">
          Not just a text box: a queue, a sandbox, a compiler and an analyst behind every submit button.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              className="card group p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/40 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20 transition group-hover:bg-accent/20">
                <Icon size={20} />
              </span>
              <h3 className="mb-1.5 font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-dim">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="card grid gap-8 p-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <h3 className="mb-1.5 mt-1 text-xl font-bold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-dim">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA + footer */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 text-center sm:px-6">
        <LayersIcon size={28} className="mx-auto mb-4 text-accent" />
        <h2 className="text-3xl font-extrabold tracking-tight">Ready for your first problem?</h2>
        <Link to={cta} className="btn-primary mt-6 !px-6 !py-3 text-base">
          {user ? "Open problems" : "Create your account"} <ArrowRightIcon size={18} />
        </Link>
      </section>
      <footer className="border-t border-border/70 py-6 text-center font-mono text-xs text-dim">
        DSADebug · React · Node · MongoDB · Redis · Socket.IO
      </footer>
    </div>
  );
}
