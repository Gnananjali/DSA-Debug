/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#12141C",
        surface: "#1A1D29",
        surface2: "#20232F",
        border: "#2A2E3D",
        ink: "#E7E5E2",
        dim: "#9B9FAE",
        accent: "#E8A33D",
        accentSoft: "#4A3A22",
        success: "#6FCF97",
        danger: "#E8746A",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
