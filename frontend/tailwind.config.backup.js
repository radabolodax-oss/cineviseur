/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cine: {
          red: "#e50914",
          green: "#22c55e",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translate(-50%, 10px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
