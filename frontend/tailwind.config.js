/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cine: {
          // Vert Émeraude noble, feutré et soyeux (D.A conservée, moins agressif)
          emerald: "#10b981",
          green: "#10b981",
          emeraldDark: "#047857",
          // Violet Nuit feutré velours (ambiance salle obscure cocon)
          violet: "#7c66dc",
          violetDeep: "#4f3fa6",
          soft: "#9d8df1",
          // Base chaleureuse cocon (noir prune et velours nuit feutré, pas de noir froid OLED)
          ink: "#0c0b12",
          carbon: "#13111c",
          midnight: "#181524",
          surface: "#1e1b2e",
        },
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        body: ["'Outfit Variable'", "Outfit", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
