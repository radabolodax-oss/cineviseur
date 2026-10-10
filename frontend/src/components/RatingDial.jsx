import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { api } from "../lib/api";
import { play, vibrate } from "../lib/feedback";

const SIZE = 112;
const R = 46;
const C = 2 * Math.PI * R;
// La molette couvre 300° (de 7 h à 5 h, comme un bouton de volume).
const SWEEP = 300;
const START = 120;

function angleToScore(deg) {
  const rel = (deg - START + 360) % 360;
  if (rel > SWEEP) return rel > SWEEP + (360 - SWEEP) / 2 ? 1 : 10;
  return Math.max(1, Math.min(10, Math.round((rel / SWEEP) * 9) + 1));
}

/** Molette de note personnelle, de 1 à 10 : on la tourne au doigt, à la souris ou aux flèches. */
export default function RatingDial({ mediaId, mediaType }) {
  const ref = useRef(null);
  const [score, setScoreState] = useState(null);
  // Valeur toujours à jour, même si plusieurs touches arrivent avant le prochain rendu.
  const scoreRef = useRef(null);
  const setScore = (v) => {
    scoreRef.current = v;
    setScoreState(v);
  };
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const progress = useSpring(0, { stiffness: 260, damping: 26 });
  const dash = useTransform(progress, (p) => `${(p * SWEEP) / 360 * C} ${C}`);
  // Le repère du bouton est dessiné en haut (-90°) : +90° pour qu'il suive l'arc.
  const knobRotate = useTransform(progress, (p) => START + p * SWEEP + 90);

  useEffect(() => {
    api
      .ratings()
      .then((list) => {
        const mine = list.find((r) => r.media_id === Number(mediaId) && r.media_type === mediaType);
        if (mine) setScore(mine.score);
      })
      .catch(() => {});
  }, [mediaId, mediaType]);

  useEffect(() => {
    progress.set(score ? (score - 1) / 9 : 0);
  }, [score, progress]);

  function update(next) {
    if (scoreRef.current !== next) {
      play("tick");
      vibrate(6);
    }
    setScore(next);
  }

  function fromPointer(e) {
    const rect = ref.current.getBoundingClientRect();
    const deg = (Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2)) * 180) / Math.PI;
    update(angleToScore((deg + 360) % 360));
  }

  async function save(value) {
    if (!value) return;
    try {
      await api.rate({ media_id: Number(mediaId), media_type: mediaType, score: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch {
      // l'échec reste silencieux : la note n'est simplement pas enregistrée
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Ta note"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={score || undefined}
        aria-valuetext={score ? `${score} sur 10` : "Pas encore noté"}
        className="relative grid place-items-center rounded-full cursor-grab active:cursor-grabbing touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging && fromPointer(e)}
        onPointerUp={() => {
          setDragging(false);
          save(scoreRef.current);
        }}
        onKeyDown={(e) => {
          if (["ArrowRight", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            const next = Math.min(10, (scoreRef.current || 0) + 1);
            update(next);
            save(next);
          } else if (["ArrowLeft", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            const next = Math.max(1, (scoreRef.current || 2) - 1);
            update(next);
            save(next);
          }
        }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0" aria-hidden="true">
          <g transform={`rotate(${START} ${SIZE / 2} ${SIZE / 2})`}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeDasharray={`${(SWEEP / 360) * C} ${C}`} strokeLinecap="round" />
            <motion.circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="url(#dial-gradient)" strokeWidth="8" strokeLinecap="round" style={{ strokeDasharray: dash }} />
          </g>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = ((START + (i / 9) * SWEEP) * Math.PI) / 180;
            return <circle key={i} cx={SIZE / 2 + Math.cos(a) * (R + 9)} cy={SIZE / 2 + Math.sin(a) * (R + 9)} r="1.4" fill={score && i < score ? "#ab98f2" : "rgba(255,255,255,0.25)"} />;
          })}
          <defs>
            <linearGradient id="dial-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7c5ce0" />
              <stop offset="1" stopColor="#ab98f2" />
            </linearGradient>
          </defs>
        </svg>
        <motion.span aria-hidden="true" className="absolute inset-[18px] rounded-full bg-[#111326] ring-1 ring-white/10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]" style={{ rotate: knobRotate }}>
          <span className="absolute left-1/2 top-1 h-3 w-1 -translate-x-1/2 rounded-full bg-cine-soft" />
        </motion.span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={score || "none"}
            initial={{ y: 10, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="relative font-display text-3xl font-semibold tabular-nums"
          >
            {score || "?"}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="text-xs leading-tight text-white/60">
        Ta note
        <br />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={saved ? "ok" : "hint"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={saved ? "text-cine-soft" : ""}>
            {saved ? "Enregistrée" : "Tourne la molette"}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
