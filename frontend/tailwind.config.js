/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0F1117",
        surface: "#171A23",
        surface2: "#1E222D",
        border: "#2A2F3E",
        ink: "#ECEAE6",
        dim: "#9AA0B2",
        accent: "#F0A93B",
        accentSoft: "#4A3A22",
        success: "#5FD39A",
        danger: "#F07A70",
        info: "#7AA2F7",
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(240,169,59,0.35), 0 10px 40px -10px rgba(240,169,59,0.35)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "pulse-soft": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.45 } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "pulse-soft": "pulse-soft 1.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
