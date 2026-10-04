// Tiny inline icon set (no icon-library dependency). All icons inherit currentColor.
const base = {
  width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
};
const make = (paths) => function Icon({ size = 16, className = "" }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      {paths}
    </svg>
  );
};

export const CheckIcon = make(<path d="M20 6 9 17l-5-5" />);
export const XIcon = make(<path d="M18 6 6 18M6 6l12 12" />);
export const ClockIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const BoltIcon = make(<path d="M13 2 4 14h7l-1 8 9-12h-7z" />);
export const ShieldIcon = make(<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />);
export const SparkleIcon = make(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />);
export const CodeIcon = make(<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" />);
export const LayersIcon = make(<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />);
export const EyeOffIcon = make(<><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-3 3.5M6.6 6.6A15 15 0 0 0 3 12s4 6 9 6a9.7 9.7 0 0 0 4-.9" /></>);
export const ChartIcon = make(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const ResetIcon = make(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>);
export const PlayIcon = make(<path d="m6 4 14 8-14 8z" />);
export const BugIcon = make(<><path d="M8 8a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0zM12 8v10M4 13h4M16 13h4M5 7l3 2M19 7l-3 2M5 20l3-2M19 20l-3-2" /></>);
export const ArrowRightIcon = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const AlertIcon = make(<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>);
export const TerminalIcon = make(<><path d="m5 8 4 4-4 4M12 16h7" /><rect x="2" y="4" width="20" height="16" rx="2" /></>);
