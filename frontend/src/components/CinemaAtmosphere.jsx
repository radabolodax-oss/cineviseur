import { memo } from "react";

/**
 * CinemaAtmosphere — Faisceau de projection et lueurs cinématiques
 * Positionné en arrière-plan (-z-10) pour apporter de la profondeur lumineuse et de la couleur.
 */
export const CinemaAtmosphere = memo(function CinemaAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. Faisceau lumineux de projection cinéma (Projector Beam) */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-60 blur-[110px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,92,224,0.35)_0%,rgba(67,56,202,0.22)_40%,transparent_70%)] will-change-transform" />

      {/* 2. Lueur d'ambiance violette / magenta en bas */}
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[350px] opacity-40 blur-[100px] rounded-full bg-gradient-to-t from-cine-violet/25 via-indigo-950/30 to-transparent" />
    </div>
  );
});

/**
 * TechnicalHudBar — Bandeau de télémétrie cinéma haute lisibilité
 */
export function TechnicalHudBar({ className = "" }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-2 px-4 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-md text-[11px] font-mono tracking-[0.16em] uppercase text-white/75 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white font-semibold">SIGNAL CINÉ DIRECT</span>
      </div>

      <div className="hidden sm:flex items-center gap-4 text-white/70">
        <span>RATIO 2.39:1</span>
        <span className="text-white/30">•</span>
        <span>24.000 FPS</span>
        <span className="text-white/30">•</span>
        <span>DOLBY ATMOS</span>
      </div>

      <div className="flex items-center gap-2 text-cine-soft font-semibold">
        <span>FRANCE ENTIÈRE</span>
      </div>
    </div>
  );
}

export default CinemaAtmosphere;
