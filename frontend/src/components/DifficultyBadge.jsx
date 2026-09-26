const styles = {
  Easy: "text-success border-success/40 bg-success/10",
  Medium: "text-accent border-accent/40 bg-accent/10",
  Hard: "text-danger border-danger/40 bg-danger/10",
};

export default function DifficultyBadge({ difficulty }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-mono ${styles[difficulty] || ""}`}>
      {difficulty}
    </span>
  );
}
