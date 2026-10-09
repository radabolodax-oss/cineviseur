/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cine: {
          green: "#22c55e",
          // Accent unique du site (désaturé, texte blanc lisible dessus).
          violet: "#7c5ce0",
          // Variante claire pour les liens/texte accent sur fond sombre.
          soft: "#ab98f2",
          // Base OLED bleu nuit (ui-ux-pro-max), jamais du noir pur.
          ink: "#06070f",
          midnight: "#0a0e27",
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
