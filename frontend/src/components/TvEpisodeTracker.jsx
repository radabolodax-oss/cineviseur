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
    <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-5 sm:p-7 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📺</span>
            <h3 className="font-display font-semibold text-lg text-white">Suivi des épisodes (Up Next)</h3>
          </div>
          <p className="text-xs sm:text-sm text-white/60">
            Cochez les épisodes au fil de votre visionnage pour reprendre exactement là où vous vous êtes arrêté.
          </p>
        </div>

        {/* Jauge globale de visionnage */}
        <div className="flex items-center gap-3 bg-white/[0.04] px-4 py-2.5 rounded-2xl border border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-cine-violet/20 border border-cine-violet/40 grid place-items-center font-display font-bold text-cine-soft text-sm">
            {totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0}%
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-white/50">Progression</span>
            <span className="block text-sm font-medium text-white/90">
              {watchedCount} {totalEpisodes > 0 ? `/ ${totalEpisodes}` : ""} vu{watchedCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Onglets des saisons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {validSeasons.map((s) => {
          const isActive = activeSeason === s.season_number;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSeason(s.season_number)}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                isActive ? "text-white" : "text-white/60 hover:text-white bg-white/[0.03]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="active-season-tab"
                  transition={SPRING}
                  className="absolute inset-0 rounded-xl bg-cine-violet shadow-lg shadow-cine-violet/30"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span>{s.name}</span>
                <span className="text-[10px] opacity-70">({s.episode_count})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Barre d'action de saison */}
      <div className="flex items-center justify-between text-xs text-white/60 pb-3 border-b border-white/[0.06] mb-4">
        <span>
          Saison {activeSeason} : {currentSeasonEpisodesWatched} / {episodes.length} vus
        </span>
        <div className="flex items-center gap-3">
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

      {/* Liste des épisodes */}
      {loading ? (
        <div className="space-y-3 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl skeleton" />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-center text-sm text-white/40 py-6">Aucun épisode répertorié pour cette saison.</p>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {episodes.map((ep) => {
            const isWatched = Boolean(progress.episodes?.[`s${activeSeason}e${ep.episode_number}`]?.watched);
            return (
              <div
                key={ep.id}
                onClick={() => handleToggle(ep)}
                className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                  isWatched
                    ? "bg-cine-violet/10 border-cine-violet/30 text-white"
                    : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] text-white/70 hover:text-white"
                }`}
              >
                {/* Case à cocher */}
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    isWatched ? "bg-cine-violet border-cine-violet text-white" : "border-white/30 group-hover:border-white/60"
                  }`}
                >
                  {isWatched && <Icon name="check" weight="bold" className="w-3.5 h-3.5" />}
                </div>

                {/* Numéro & Titre */}
                <span className="font-mono text-xs text-white/40 w-7 shrink-0">
                  {ep.episode_number.toString().padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${isWatched ? "line-through opacity-70" : ""}`}>
                    {ep.name || `Épisode ${ep.episode_number}`}
                  </p>
                  {ep.air_date && (
                    <p className="text-[11px] text-white/45">
                      Diffusé le {new Date(ep.air_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
