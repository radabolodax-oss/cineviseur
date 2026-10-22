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

  const affiliateUrl = `https://www.amazon.fr/gp/video/primesignup?tag=${encodeURIComponent(AFFILIATE.amazonTag || "cineviseur-21")}`;

  return (
    <aside
      aria-label="Offre partenaire Prime Video"
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 md:p-8 bg-gradient-to-br from-[#00A8E1]/20 via-[#1a233a]/80 to-cine-purple/20 border border-[#00A8E1]/30 shadow-[0_12px_40px_rgba(0,168,225,0.12)] backdrop-blur-md ${className}`}
    >
      {/* Glow décoratif */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#00A8E1]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-cine-purple/25 blur-3xl" />

      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all text-xs"
        title="Fermer cette bannière"
        aria-label="Fermer"
      >
        <Icon name="x" className="w-3.5 h-3.5" />
      </button>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A8E1]/20 border border-[#00A8E1]/40 text-[#00A8E1] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <span>⭐ Offre Partenaire</span>
            <span>•</span>
            <span>Essai 30 jours gratuit</span>
          </div>

          <h3 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight leading-snug">
            30 jours offerts sur Prime Video pour voir vos films en streaming
          </h3>

          <p className="mt-2 text-sm sm:text-base text-white/75 leading-relaxed">
            Accédez à des milliers de films, séries et créations originales sans engagement. Résiliable à tout moment en 1 clic.
          </p>

          <p className="mt-2 text-[11px] text-white/40">
            * Réservé aux nouveaux membres. En tant que Partenaire Amazon, CineViseur réalise un bénéfice sur les inscriptions éligibles.
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#00A8E1] hover:bg-[#0092c7] text-white font-semibold text-sm shadow-[0_8px_20px_rgba(0,168,225,0.35)] hover:shadow-[0_12px_28px_rgba(0,168,225,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Activer mes 30 jours gratuits</span>
            <span className="text-base font-bold">↗</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
