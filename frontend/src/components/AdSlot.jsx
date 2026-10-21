import { useEffect, useRef } from "react";
import { ADSENSE } from "../lib/site";

/**
 * Composant de bannière publicitaire Google AdSense propre et responsive.
 * Se charge sans bloquer le rendu et gère gracieusement les bloqueurs de publicité (AdBlock).
 */
export default function AdSlot({ slotId, format = "auto", responsive = "true", className = "" }) {
  const adRef = useRef(null);

  useEffect(() => {
    if (!ADSENSE.pubId) return;

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      // Ignorer silencieusement si bloqué par AdBlock
      console.debug("AdSlot: AdSense script blocked or not loaded yet.", err);
    }
  }, [slotId]);

  if (!ADSENSE.pubId) {
    // Si aucun ID éditeur AdSense n'est configuré pour l'instant, on n'affiche rien d'intrusif
    return null;
  }

  return (
    <div className={`w-full overflow-hidden flex flex-col items-center justify-center my-6 text-center ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Publicité</span>
      <div className="w-full flex justify-center min-h-[90px] bg-white/[0.02] border border-white/5 rounded-xl p-2">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={ADSENSE.pubId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      </div>
    </div>
  );
}
