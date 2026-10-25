import { useState, useEffect } from "react";
import { AFFILIATE } from "../lib/site";
import Icon from "./Icon";

export default function PrimeBanner({ className = "" }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("cv_dismiss_prime_banner") === "1") {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("cv_dismiss_prime_banner", "1");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  const affiliateUrl = `https://www.amazon.fr/tryprimefree?tag=${encodeURIComponent(AFFILIATE.amazonTag || "cineviseur-21")}`;

  return (
    <aside
      aria-label="Offre partenaire Prime Video"
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-[#121b2d]/90 via-[#19152b]/90 to-[#131726]/90 border border-transparent shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition-all text-xs"
        title="Fermer cette bannière"
        aria-label="Fermer"
      >
        <Icon name="x" className="w-3.5 h-3.5" />
      </button>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A8E1]/15 border border-[#00A8E1]/25 text-[#38bdf8] text-xs font-medium mb-2.5">
            <span>🎬 Offre Partenaire</span>
            <span>•</span>
            <span>30 jours offerts</span>
          </div>

          <h3 className="font-display font-semibold text-lg sm:text-xl text-white tracking-tight leading-snug">
            30 jours offerts sur Prime Video pour regarder vos films depuis le canapé
          </h3>

          <p className="mt-1.5 text-xs sm:text-sm text-white/70 leading-relaxed">
            Accédez à un vaste catalogue de films, séries et créations originales sans engagement. Résiliable à tout moment en 1 clic.
          </p>

          <p className="mt-2 text-[10px] text-white/40">
            * En tant que Partenaire Amazon, CineViseur réalise un bénéfice sur les inscriptions éligibles.
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00A8E1] to-[#0284c7] hover:brightness-105 text-white font-medium text-xs sm:text-sm shadow-[0_6px_20px_-4px_rgba(0,168,225,0.4)] active:scale-[0.98] transition-all"
          >
            <span>Activer mes 30 jours gratuits</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
