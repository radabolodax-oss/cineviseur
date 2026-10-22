import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../lib/api";
import { tmdbImage } from "../lib/tmdb";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

const MOODS = [
  {
    id: "popcorn",
    emoji: "🍿",
    label: "Popcorn & Évasion",
    subtitle: "Grand spectacle & Aventure",
    genre: "28", // Action / Aventure
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300",
    activeColor: "bg-amber-500/20 border-amber-500/50 text-amber-200 ring-2 ring-amber-500/30",
  },
  {
    id: "cozy",
    emoji: "🛋️",
    label: "Douceur & Plaid",
    subtitle: "Feel-good, rires & réconfort",
    genre: "35", // Comédie / Romance
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    activeColor: "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 ring-2 ring-emerald-500/30",
  },
  {
    id: "mystery",
    emoji: "🧠",
    label: "Enquête & Mystère",
    subtitle: "Tension, complot & Mindfuck",
    genre: "9648", // Mystère / Thriller
    color: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-300",
    activeColor: "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 ring-2 ring-indigo-500/30",
  },
  {
    id: "thrill",
    emoji: "⚡",
    label: "Frissons & Suspense",
    subtitle: "Peur, sueurs froides & adrénaline",
    genre: "27", // Horreur
    color: "from-rose-500/20 to-purple-500/10 border-rose-500/30 text-rose-300",
    activeColor: "bg-rose-500/20 border-rose-500/50 text-rose-200 ring-2 ring-rose-500/30",
  },
];

export default function MoodInspirer() {
  const [activeMood, setActiveMood] = useState(null);
  const [movie, setMovie] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSelectMood = async (mood) => {
    setActiveMood(mood.id);
    setLoading(true);

    try {
      // Tirage aléatoire parmi les pages les mieux notées du genre
      const randomPage = Math.floor(Math.random() * 3) + 1;
      const res = await api.discover("movie", "fr", {
        genre: mood.genre,
        sort: "popularity",
        minRating: 7,
        page: randomPage,
      });

      const validList = (res.results || []).filter((m) => m.poster_path && m.overview);
      if (validList.length > 0) {
        setCandidates(validList);
        const picked = validList[Math.floor(Math.random() * validList.length)];
        setMovie(picked);
      }
    } catch {
      // Ignorer silencieusement si hors ligne
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = () => {
    if (!candidates.length) return;
    const remaining = candidates.filter((m) => m.id !== movie?.id);
    const list = remaining.length ? remaining : candidates;
    const picked = list[Math.floor(Math.random() * list.length)];
    setMovie(picked);
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-16" aria-label="Inspirateur ciné du soir">
      <div className="rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-br from-[#181528]/95 via-[#151221]/95 to-[#12101b]/95 border border-white/[0.07] shadow-[0_16px_40px_rgba(0,0,0,0.35)] relative overflow-hidden">
        
        {/* En-tête */}
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cine-soft/15 border border-cine-soft/30 text-cine-soft text-xs font-semibold mb-3">
            <span>✨ Inspirateur du Soir</span>
            <span>•</span>
            <span>En panne d'idées ?</span>
          </div>

          <h3 className="font-display font-semibold text-2xl sm:text-3xl text-white tracking-tight">
            Quelle est votre ambiance ce soir ?
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-white/65 leading-relaxed">
            Choisissez votre humeur en 1 clic. CineViseur vous sélectionne instantanément la pépite idéale avec sa note et où la regarder.
          </p>
        </div>

        {/* 4 Boutons d'humeur */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {MOODS.map((m) => {
            const isSelected = activeMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMood(m)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? m.activeColor
                    : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-white/80"
                }`}
              >
                <span className="text-2xl sm:text-3xl block mb-2">{m.emoji}</span>
                <span className="font-display font-semibold text-sm sm:text-base text-white block">
                  {m.label}
                </span>
                <span className="text-[11px] text-white/50 block mt-0.5 line-clamp-1">
                  {m.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Résultat du film proposé */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center gap-3 text-white/60 text-sm"
            >
              <span className="animate-spin text-xl">⏳</span>
              <span>Recherche de la meilleure pépite...</span>
            </motion.div>
          )}

          {!loading && movie && (
            <motion.article
              key={movie.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SPRING}
              className="p-5 sm:p-6 rounded-2xl bg-[#0f0e18]/90 border border-white/10 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
            >
              <Link
                to={`/title/movie/${movie.id}`}
                className="shrink-0 group overflow-hidden rounded-xl shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft"
              >
                <img
                  src={tmdbImage(movie.poster_path, "poster")}
                  alt={movie.title}
                  className="w-28 sm:w-36 aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold font-mono text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    ★ {movie.vote_average ? movie.vote_average.toFixed(1) : "—"}
                  </span>
                  {movie.release_date && (
                    <span className="text-white/45 text-xs font-mono">
                      {movie.release_date.slice(0, 4)}
                    </span>
                  )}
                </div>

                <h4 className="font-display font-semibold text-lg sm:text-xl text-white tracking-tight">
                  <Link to={`/title/movie/${movie.id}`} className="hover:text-cine-soft transition-colors">
                    {movie.title}
                  </Link>
                </h4>

                <p className="mt-2 text-xs sm:text-sm text-white/70 line-clamp-3 leading-relaxed">
                  {movie.overview}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Link
                    to={`/title/movie/${movie.id}`}
                    className="btn-primary !px-5 !py-2.5 text-xs sm:text-sm"
                  >
                    <span>Voir la fiche & Où regarder</span>
                    <Icon name="arrowRight" className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="btn-ghost !px-4 !py-2.5 text-xs sm:text-sm !bg-white/[0.06] hover:!bg-white/[0.1] flex items-center gap-1.5"
                  >
                    <span>Autre pépite</span>
                    <span>🎲</span>
                  </button>
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>

        {/* Liens secondaires rapides */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <p>
            Plus de 10 000 titres explorables avec filtres plateformes et notes certifiées.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/ce-soir" className="hover:text-white transition-colors underline">
              Lancer la grande roulette
            </Link>
            <span>•</span>
            <Link to="/swipe" className="hover:text-white transition-colors underline">
              Mode Duo (soirée à deux)
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
