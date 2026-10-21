import { memo } from "react";

/**
 * CinemaAtmosphere — Arrière-plan cinématique unifié et optimisé GPU
 * Remplace l'empilement multiple pour diviser par deux la charge graphique.
 */
export const CinemaAtmosphere = memo(function CinemaAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#0a0c18]"
    >
      {/* 1. Halo supérieur projecteur cinéma */}
      <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[1200px] h-[650px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,92,224,0.30)_0%,rgba(67,56,202,0.18)_40%,transparent_70%)] blur-[80px]" />

      {/* 2. Lueur latérale subtile indigo */}
      <div className="absolute top-[35%] -left-[10%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.14)_0%,transparent_65%)] blur-[90px]" />

      {/* 3. Lueur d'ambiance bas d'écran */}
      <div className="absolute -bottom-[15%] right-[5%] w-[850px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,92,224,0.22)_0%,rgba(147,51,234,0.12)_40%,transparent_70%)] blur-[90px]" />
    </div>
  );
});

export default CinemaAtmosphere;
