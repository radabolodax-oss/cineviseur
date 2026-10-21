import { memo } from "react";

/**
 * CinemaAtmosphere — Arrière-plan cinématique unifié et optimisé GPU
 * Remplace l'empilement multiple pour diviser par deux la charge graphique.
 */
export const CinemaAtmosphere = memo(function CinemaAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#08090e]"
    >
      {/* 1. Lueur supérieure feutrée Violet Nuit (salle de projection) */}
      <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1200px] h-[580px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,rgba(67,56,202,0.05)_45%,transparent_75%)] blur-[90px]" />

      {/* 2. Nuance latérale Émeraude optique (viseur de régie cinéma) */}
      <div className="absolute top-[35%] -left-[10%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_65%)] blur-[100px]" />

      {/* 3. Vignettage naturel de lentille cinéma */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(5,6,10,0.8)_100%)] pointer-events-none" />
    </div>
  );
});

export default CinemaAtmosphere;
