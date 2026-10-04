import { STATUS, TONE_CLASSES } from "../utils/status";

export default function StatusPill({ status }) {
  const info = STATUS[status] || { label: status, tone: "dim" };
  const tone = TONE_CLASSES[info.tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium ${tone.text} ${tone.bg} ${tone.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {info.label}
    </span>
  );
}
