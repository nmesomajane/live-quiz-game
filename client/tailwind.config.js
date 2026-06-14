/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy:   "#0F1117",
        card:   "#1E2130",
        border: "#2A2D3E",
        indigo: "#6C63FF",
        lime:   "#BFFF00",
        muted:  "#8B8FA8",
        light:  "#E8E9F0",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["Inter", "sans-serif"],
      },
      keyframes: {
        flash: {
          "0%, 100%": { opacity: "0" },
          "50%":       { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(108,99,255,0.5)" },
          "70%":  { transform: "scale(1)",    boxShadow: "0 0 0 10px rgba(108,99,255,0)" },
          "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(108,99,255,0)" },
        },
      },
      animation: {
        flash:       "flash 0.6s ease-in-out",
        "slide-up":  "slide-up 0.25s ease-out",
        "pulse-ring": "pulse-ring 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};