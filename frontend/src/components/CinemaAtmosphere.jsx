import { memo } from "react";
import { motion } from "motion/react";
import { finePointer } from "../lib/motionTokens";

/**
 * CinemaAtmosphere — Inspiré par l'esthétique d'Orbe Audio (orbe-audio.vercel.app) et 21st.dev
 * Ajoute un faisceau de projection cinématographique ambiant, une trame de repères techniques
 * et un grain analogique subtil qui transforme l'ambiance du site en salle obscure haute fidélité.
 */
export const CinemaAtmosphere = memo(function CinemaAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* 1. Faisceau lumineux de projection cinéma (Projector Beam / Cone of Light) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] opacity-40 blur-[130px] rounded-full bg-[conic-gradient(from_90deg_at_50%_0%,rgba(124,92,224,0.35)_0deg,rgba(34,197,94,0.12)_120deg,rgba(124,92,224,0.25)_240deg,rgba(124,92,224,0.35)_360deg)] will-change-transform" />

      {/* 2. Lueur d'ambiance bleutée / violette au bas de l'écran */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1400px] h-[400px] opacity-25 blur-[120px] rounded-full bg-gradient-to-t from-cine-violet/30 via-cine-midnight/40 to-transparent" />

      {/* 3. Lignes de repère techniques de cadrage cinéma (Orbe Audio style) */}
      <div className="absolute inset-x-4 sm:inset-x-8 md:inset-x-12 top-0 bottom-0 border-x border-white/[0.025] hidden lg:block">
        {/* Croix de cadrage cinéma subtiles aux angles */}
        <span className="absolute top-20 -left-2 text-[10px] font-mono text-white/20 select-none">+</span>
        <span className="absolute top-20 -right-2 text-[10px] font-mono text-white/20 select-none">+</span>
        <span className="absolute top-1/2 -left-2 text-[10px] font-mono text-white/15 select-none">+</span>
        <span className="absolute top-1/2 -right-2 text-[10px] font-mono text-white/15 select-none">+</span>
      </div>

      {/* 4. Grain analogique pellicule cinéma (SVG ultra léger, 0 lag GPU) */}
      <div
        className="absolute inset-0 opacity-[0.028] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});

/**
 * TechnicalHudBar — Bandeau de télémétrie cinéma (Orbe Audio / UI/UX Pro Max)
 * Affiche des métadonnées cinématographiques réelles pour ancrer l'identité cinéma.
 */
export function TechnicalHudBar({ className = "" }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-2 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10px] font-mono tracking-[0.16em] uppercase text-white/40 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white/70 font-semibold">SIGNAL CINÉ DIRECT</span>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <span>RATIO 2.39:1</span>
        <span className="text-white/20">•</span>
        <span>24.000 FPS</span>
        <span className="text-white/20">•</span>
        <span>DOLBY ATMOS</span>
      </div>

      <div className="flex items-center gap-2 text-cine-soft/80 font-medium">
        <span>FRANCE ENTIÈRE</span>
      </div>
    </div>
  );
}

export default CinemaAtmosphere;
