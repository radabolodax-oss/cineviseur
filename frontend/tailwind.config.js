/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cine: {
          // Vert Émeraude Viseur optique (précis, noble, professionnel)
          emerald: "#10b981",
          green: "#10b981",
          emeraldDark: "#047857",
          // Violet Nuit profond (feutré, ambiance salle obscure)
          violet: "#6366f1",
          violetDeep: "#4338ca",
          soft: "#818cf8",
          // Base OLED carbone régie cinéma
          ink: "#08090e",
          carbon: "#0c0d14",
          midnight: "#0e101b",
        },
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        body: ["'Outfit Variable'", "Outfit", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      // Les animations passent par Motion (src/components/motion.jsx), plus par des keyframes Tailwind.
    },
  },
  plugins: [],
}
