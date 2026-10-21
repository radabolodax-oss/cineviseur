import { memo } from "react";

/**
 * CinemaAtmosphere — Arrière-plan cinématique unifié et optimisé GPU
 * Remplace l'empilement multiple pour diviser par deux la charge graphique.
 */
export const CinemaAtmosphere = memo(function CinemaAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#07080c]"
    >
      {/* 1. Faisceau projecteur 35mm ambré (lumière chaude de salle obscure) */}
      <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.09)_0%,rgba(217,119,6,0.03)_45%,transparent_75%)] blur-[90px]" />

      {/* 2. Nuance argentée / titane latérale subtile */}
      <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.025)_0%,transparent_65%)] blur-[100px]" />

      {/* 3. Vignettage naturel d'optique cinéma */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(4,5,8,0.75)_100%)] pointer-events-none" />
    </div>
  );
});

export default CinemaAtmosphere;
