import { Link } from "react-router-dom";
import Icon from "./Icon";

export default function QuickDecisionCard() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-16" aria-label="Aide au choix du film du soir">
      <div className="rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-br from-[#181528]/95 via-[#151221]/95 to-[#12101b]/95 border border-white/[0.07] shadow-[0_16px_40px_rgba(0,0,0,0.35)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cine-soft/15 border border-cine-soft/30 text-cine-soft text-xs font-semibold mb-3">
            <span>🎲 Décision Express</span>
            <span>•</span>
            <span>Zéro prise de tête</span>
          </div>

          <h3 className="font-display font-semibold text-2xl sm:text-3xl text-white tracking-tight">
            En panne d'inspiration pour votre soirée ?
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-white/65 leading-relaxed">
            Ne passez plus 45 minutes à scroller sans fin dans vos catalogues. Filtrez selon vos abonnements (Netflix, Prime Video, Canal+, Disney+...), vos genres favoris ou laissez la roulette cinéphile choisir la séance parfaite en 10 secondes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/ce-soir"
              className="btn-primary !px-6 !py-3 text-sm shadow-[0_6px_20px_-4px_rgba(171,152,242,0.4)]"
            >
              <span>Faire tourner la roulette</span>
              <span className="text-base">🎲</span>
            </Link>
            <Link
              to="/swipe"
              className="btn-ghost !px-5 !py-3 text-sm !bg-white/[0.06] hover:!bg-white/[0.1]"
            >
              <span>Lancer le Mode Duo (à deux)</span>
              <span className="text-base">🍿</span>
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center shrink-0 pr-6">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-cine-soft/20 border border-white/10 flex items-center justify-center text-5xl shadow-[0_0_50px_-10px_rgba(171,152,242,0.25)] select-none">
            🎬
          </div>
        </div>
      </div>
    </section>
  );
}
