const styles = {
  Easy: "text-success border-success/30 bg-success/10",
  Medium: "text-accent border-accent/30 bg-accent/10",
  Hard: "text-danger border-danger/30 bg-danger/10",
};

export default function DifficultyBadge({ difficulty }) {
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium ${styles[difficulty] || "border-border text-dim"}`}>
      {difficulty}
    </span>
  );
}
