import { useEffect, useRef, useState } from "react";
import { ADSENSE } from "../lib/site";
import { CONSENT_CHANGED_EVENT, readConsentChoice, verifyTcfConsentProof } from "./CookieConsent";

/**
 * Composant de bannière publicitaire Google AdSense propre et responsive.
 * RGPD / ePrivacy : ne se charge que si le consentement de l'utilisateur a été accordé et vérifié TCF v2.2.
 * Se charge sans bloquer le rendu et gère gracieusement les bloqueurs de publicité (AdBlock).
 */
export default function AdSlot({ slotId, format = "auto", responsive = "true", className = "" }) {
  const adRef = useRef(null);
  const [hasConsent, setHasConsent] = useState(() => readConsentChoice() === "granted" && verifyTcfConsentProof());

  useEffect(() => {
    const onConsentChanged = (e) => {
      setHasConsent(e.detail?.consent === "granted" && verifyTcfConsentProof());
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChanged);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChanged);
  }, []);

  useEffect(() => {
    if (!ADSENSE.pubId || !hasConsent) return;

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      // Ignorer silencieusement si bloqué par AdBlock
      console.debug("AdSlot: AdSense script blocked or not loaded yet.", err);
    }
  }, [slotId, hasConsent]);

  if (!ADSENSE.pubId || !hasConsent) {
    // Si pas de pubId ou si le consentement n'est pas accordé, zéro pub affichée
    return null;
  }

  return (
    <div className={`w-full overflow-hidden flex flex-col items-center justify-center my-6 text-center ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Publicité</span>
      <div className="w-full flex justify-center min-h-[90px] bg-white/[0.02] border border-transparent rounded-xl p-2">
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