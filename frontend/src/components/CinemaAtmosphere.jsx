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

export default CinemaAtmosphere;
