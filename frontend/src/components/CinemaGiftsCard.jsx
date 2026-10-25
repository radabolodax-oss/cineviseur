import { AFFILIATE } from "../lib/site";
import Icon from "./Icon";

export default function CinemaGiftsCard() {
  const tag = AFFILIATE.amazonTag || "cineviseur-21";
  const boxUrl = `https://www.amazon.fr/s?k=coffret+cinema+places+cultur+in+the+city+wonderbox&tag=${encodeURIComponent(tag)}`;

  return (
    <section className="mt-12 overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#161424]/95 via-[#1a172c]/95 to-[#13111e]/95 border border-transparent shadow-[0_16px_40px_rgba(0,0,0,0.35)]" aria-label="Coffrets et places de cinéma">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium mb-3">
            <span>🎁 Idée Cadeau Cinéphile</span>
            <span>•</span>
            <span>Valable partout en France</span>
          </div>

          <h3 className="font-display font-semibold text-xl sm:text-2xl text-white tracking-tight">
            Offrir ou s'offrir une séance : Coffrets & Box Cinéma
          </h3>

          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Profitez de places de cinéma à tarif préférentiel valables dans plus de 1 800 salles partenaires en France (Pathé, UGC, CGR, MK2 et cinémas indépendants d'art et essai).
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> 1 à 2 ans de validité
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> Choix libre du film et de la séance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> Réservation en ligne ou en caisse
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <a
            href={boxUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white font-medium text-sm shadow-[0_8px_24px_-4px_rgba(225,29,72,0.4)] active:scale-[0.98] transition-all"
          >
            <Icon name="popcorn" className="w-4 h-4" />
            <span>Découvrir les coffrets cinéma</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
