import { BugIcon } from "./Icons";

export default function Logo({ size = "md" }) {
  const box = size === "lg" ? "h-9 w-9" : "h-8 w-8";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`${box} grid place-items-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30`}>
        <BugIcon size={size === "lg" ? 20 : 18} />
      </span>
      <span className={`font-display font-extrabold tracking-tight ${size === "lg" ? "text-xl" : "text-lg"}`}>
        DSA<span className="text-accent">Debug</span>
      </span>
    </span>
  );
}
