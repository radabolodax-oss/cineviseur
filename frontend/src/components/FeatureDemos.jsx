import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";
import { play } from "../lib/feedback";

/**
 * InteractiveSeriesPreview — Démo interactive pour le suivi des séries
 * Permet à l'utilisateur de cliquer sur un épisode pour voir le progrès s'animer.
 */
export function InteractiveSeriesPreview() {
  const [watched, setWatched] = useState([1, 2]);
  const episodes = [
    { num: 1, title: "Épisode 1", duration: "54m" },
    { num: 2, title: "Épisode 2", duration: "58m" },
    { num: 3, title: "Épisode 3", duration: "49m" },
    { num: 4, title: "Épisode 4", duration: "61m" },
  ];

  const toggleEpisode = (num) => {
    play("tick");
    if (watched.includes(num)) {
      setWatched(watched.filter((n) => n !== num));
    } else {
      setWatched([...watched, num]);
    }
  };

  const nextEp = episodes.find((e) => !watched.includes(e.num));
  const progressPct = Math.round((watched.length / episodes.length) * 100);

  return (
    <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-4 text-xs font-sans shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cine-soft animate-pulse" />
          <span className="font-semibold text-white/90">Saison 1 • Severance</span>
        </div>
        <span className="font-mono text-[11px] text-cine-soft tabular-nums font-semibold">
          {progressPct}% ({watched.length}/{episodes.length})
        </span>
      </div>

      {/* Barre de progression avec ressort fluide */}
      <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-cine-violet to-cine-soft rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={SPRING}
        />
      </div>

      {/* Liste des épisodes cliquables */}
      <div className="grid grid-cols-2 gap-2">
        {episodes.map((ep) => {
          const isDone = watched.includes(ep.num);
          const isNext = nextEp?.num === ep.num;
          return (
            <button
              key={ep.num}
              type="button"
              onClick={() => toggleEpisode(ep.num)}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left ${
                isDone
                  ? "bg-cine-violet/20 border-cine-violet/40 text-white"
                  : isNext
                  ? "bg-white/[0.06] border-cine-soft/60 text-white ring-1 ring-cine-soft/40"
                  : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.04]"
              }`}
            >
              <div className="truncate pr-1">
                <span className="font-mono font-semibold block text-[10px]">
                  E0{ep.num} {isNext && "• SUIVANT"}
                </span>
                <span className="text-[11px] truncate block opacity-80">{ep.title}</span>
              </div>
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                  isDone ? "bg-cine-violet text-white" : "border border-white/20"
                }`}
              >
                {isDone ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * InteractiveTicketPreview — Billet vintage collector 3D
 */
export function InteractiveTicketPreview() {
  return (
    <motion.div
      whileHover={{ y: -4, rotate: -1, scale: 1.02 }}
      transition={SPRING}
      className="relative rounded-2xl bg-gradient-to-br from-[#f8f5ee] to-[#e8e2d2] text-cine-ink p-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] border border-[#d6cfbe] overflow-hidden select-none"
    >
      {/* Encoches de perforation vintage gauche et droite */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0a0f]" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0a0f]" />

      <div className="flex items-start justify-between border-b border-dashed border-cine-ink/20 pb-2.5 mb-2.5 px-2">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cine-ink/60 font-semibold block">
            CINEVISEUR COLLECTOR • N°0842
          </span>
          <span className="font-display font-bold text-base tracking-tight text-cine-ink">
            INTERSTELLAR
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono text-[9px] block text-cine-ink/60">SIÈGE</span>
          <span className="font-mono font-bold text-xs text-cine-violet">A-14 • IMAX 70MM</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-1 text-amber-600 font-bold">
          <span>★★★★★</span>
          <span className="text-[10px] text-cine-ink/70 font-mono ml-1">9.8/10</span>
        </div>
        <span className="font-mono text-[9px] tracking-widest text-cine-ink/50 uppercase">
          ||| | |||| | ||| ||||
        </span>
      </div>
    </motion.div>
  );
}

/**
 * InteractiveDuoPreview — Démo interactive Soirée Duo
 */
export function InteractiveDuoPreview() {
  const [liked, setLiked] = useState(false);

  return (
    <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-4 text-xs font-sans shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center -space-x-2">
          <div className="w-7 h-7 rounded-full bg-cine-violet border-2 border-cine-ink flex items-center justify-center font-bold text-white text-[10px]">
            TOI
          </div>
          <div className="w-7 h-7 rounded-full bg-pink-500 border-2 border-cine-ink flex items-center justify-center font-bold text-white text-[10px]">
            DUO
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-mono text-[10px] font-semibold border border-pink-500/30">
          98% DE MATCH
        </span>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="min-w-0 pr-2">
          <span className="font-semibold text-white block text-sm truncate">Dune: Deuxième Partie</span>
          <span className="text-[11px] text-white/55">En commun dans vos 2 listes</span>
        </div>
        <button
          type="button"
          onClick={() => {
            play("stamp");
            setLiked(!liked);
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            liked ? "bg-pink-500 text-white scale-110 shadow-lg shadow-pink-500/30" : "bg-white/10 text-white/70 hover:text-white"
          }`}
          title="Valider ce film à deux"
        >
          <Icon name="heart" className="w-4 h-4" weight={liked ? "fill" : "regular"} />
        </button>
      </div>
    </div>
  );
}

/**
 * InteractiveImportPreview — Démo interactive Import Letterboxd & Trakt
 */
export function InteractiveImportPreview() {
  return (
    <div className="rounded-2xl bg-black/40 border border-dashed border-emerald-500/40 p-4 text-xs text-center shadow-xl">
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
        <Icon name="download" className="w-4 h-4" />
      </div>
      <p className="font-medium text-white/90 mb-1">Glissez votre fichier .CSV ou .JSON</p>
      <div className="flex items-center justify-center gap-2 mt-2 font-mono text-[10px] text-white/50">
        <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10">Letterboxd</span>
        <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10">Trakt</span>
        <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10">IMDb</span>
      </div>
      <p className="mt-2 text-[10px] text-emerald-400 font-mono">
        ✓ Détection instantanée • Sauvegarde locale 100% privée
      </p>
    </div>
  );
}
