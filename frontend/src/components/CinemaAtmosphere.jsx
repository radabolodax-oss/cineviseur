import { memo } from "react";

/**
 * CinemaAtmosphere — Ambiance feutrée, chaleureuse et cocon (fauteuils de velours et salle tamisée)
 * Reste fidèle à la D.A (Émeraude & Violet Nuit) tout en réchauffant les teintes pour un confort visuel maximal.
 */
export const CinemaAtmosphere = memo(function CinemaAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#0c0b12]"
    >
      {/* 1. Halo supérieur feutré Violet Nuit / Velours prune */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,102,220,0.08)_0%,rgba(79,63,166,0.03)_50%,transparent_75%)] blur-[100px]" />

      {/* 2. Douce lueur chaude d'ambiance (lampe feutrée / atmosphère cosy de salle) */}
      <div className="absolute top-[25%] -right-[10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.035)_0%,transparent_65%)] blur-[120px]" />

      {/* 3. Nuance Émeraude végétale très douce sur le côté gauche */}
      <div className="absolute top-[45%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04)_0%,transparent_65%)] blur-[120px]" />

      {/* 4. Vignettage doux velouté */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(8,7,12,0.75)_100%)] pointer-events-none" />
    </div>
  );
});

export default CinemaAtmosphere;
