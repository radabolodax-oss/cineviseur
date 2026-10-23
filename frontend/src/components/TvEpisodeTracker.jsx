import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { play } from "../lib/feedback";
import Icon from "./Icon";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../lib/motionTokens";

export default function TvEpisodeTracker({ tvId, seasons = [], totalEpisodes = 0 }) {
  // Filtrer la saison 0 (épisodes spéciaux) si non nécessaire ou la mettre à la fin
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const [activeSeason, setActiveSeason] = useState(validSeasons[0]?.season_number || 1);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(() => api.getEpisodesProgress(tvId));

  // Charge les épisodes de la saison sélectionnée
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.tvSeason(tvId, activeSeason)
      .then((data) => {
        if (active) setEpisodes(data.episodes || []);
      })
      .catch(() => {
        if (active) setEpisodes([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tvId, activeSeason]);

  // Synchronise les progrès en direct
  useEffect(() => {
    const handleProgressChange = (e) => {
      if (e.detail?.tvId === tvId) {
        setProgress(api.getEpisodesProgress(tvId));
      }
    };
    window.addEventListener("cv:episodes-changed", handleProgressChange);
    return () => window.removeEventListener("cv:episodes-changed", handleProgressChange);
  }, [tvId]);

  const watchedCount = Object.keys(progress.episodes || {}).length;
  const currentSeasonEpisodesWatched = episodes.filter(
    (ep) => progress.episodes?.[`s${activeSeason}e${ep.episode_number}`]?.watched
  ).length;

  const handleToggle = (ep) => {
    play("tick");
    api.toggleEpisodeWatched(tvId, activeSeason, ep.episode_number, { title: ep.name });
    setProgress(api.getEpisodesProgress(tvId));
  };

  const handleMarkAllSeason = (watched) => {
    play("stamp");
    api.markSeasonWatched(tvId, activeSeason, episodes, watched);
    setProgress(api.getEpisodesProgress(tvId));
  };

  return (
    <div className="w-full">
      {/* En-tête compact sans arrière-plan lourd */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📺</span>
          <h3 className="font-display font-semibold text-base sm:text-lg text-white">Suivi des épisodes</h3>
          <span className="text-xs text-white/40 hidden sm:inline">• Reprenez où vous vous êtes arrêté</span>
        </div>

        {/* Jauge compacte */}
        <div className="flex items-center gap-2.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/[0.08] shrink-0">
          <div className="w-6 h-6 rounded-lg bg-cine-violet/25 border border-cine-violet/40 grid place-items-center font-mono font-bold text-cine-soft text-xs">
            {totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0}%
          </div>
          <span className="text-xs text-white/75 font-medium">
            {watchedCount}{totalEpisodes > 0 ? ` / ${totalEpisodes}` : ""} vu{watchedCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Barre unifiée des saisons & actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {validSeasons.map((s) => {
            const isActive = activeSeason === s.season_number;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSeason(s.season_number)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isActive ? "text-white" : "text-white/60 hover:text-white bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-season-tab"
                    transition={SPRING}
                    className="absolute inset-0 rounded-lg bg-cine-violet shadow-md shadow-cine-violet/30"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <span>{s.name}</span>
                  <span className="text-[10px] opacity-70">({s.episode_count})</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-white/50 ml-auto">
          <span>
            Saison {activeSeason} : {currentSeasonEpisodesWatched} / {episodes.length} vus
          </span>
          <span>•</span>
          {currentSeasonEpisodesWatched < episodes.length ? (
            <button
              type="button"
              onClick={() => handleMarkAllSeason(true)}
              className="text-cine-soft hover:underline font-medium"
            >
              Tout cocher
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleMarkAllSeason(false)}
              className="text-rose-300 hover:underline font-medium"
            >
              Tout décocher
            </button>
          )}
        </div>
      </div>

      {/* Grille compacte des épisodes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl skeleton" />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-center text-xs text-white/40 py-4">Aucun épisode répertorié pour cette saison.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto pr-1">
          {episodes.map((ep) => {
            const isWatched = Boolean(progress.episodes?.[`s${activeSeason}e${ep.episode_number}`]?.watched);
            return (
              <div
                key={ep.id}
                onClick={() => handleToggle(ep)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer border transition-all ${
                  isWatched
                    ? "bg-cine-violet/10 border-cine-violet/25 text-white/90"
                    : "bg-white/[0.015] hover:bg-white/[0.04] border-white/[0.04] text-white/70 hover:text-white"
                }`}
              >
                {/* Case à cocher compacte */}
                <div
                  className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isWatched ? "bg-cine-violet border-cine-violet text-white" : "border-white/30 group-hover:border-white/50"
                  }`}
                >
                  {isWatched && <Icon name="check" weight="bold" className="w-3 h-3" />}
                </div>

                {/* Numéro */}
                <span className="font-mono text-xs text-white/40 w-5 shrink-0">
                  {ep.episode_number.toString().padStart(2, "0")}
                </span>

                {/* Titre */}
                <p className={`text-xs sm:text-sm font-medium truncate flex-1 ${isWatched ? "line-through opacity-60 text-white/50" : ""}`}>
                  {ep.name || `Épisode ${ep.episode_number}`}
                </p>

                {/* Date discrète */}
                {ep.air_date && (
                  <span className="text-[11px] text-white/35 shrink-0 hidden sm:inline">
                    {new Date(ep.air_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
