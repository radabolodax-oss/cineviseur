import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ADSENSE, ANALYTICS, analyticsEnabled } from "../lib/site";
import { SPRING } from "../lib/motionTokens";

export const CONSENT_KEY = "cv_consent";
export const OPEN_CONSENT_EVENT = "cv:open-consent";
export const CONSENT_CHANGED_EVENT = "cv:consent-changed";

export function readConsentChoice() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function loadAdSense() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cv-adsense")) return;
  if (!ADSENSE.pubId) return;
  const script = document.createElement("script");
  script.id = "cv-adsense";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.pubId}`;
  document.head.appendChild(script);
}

export function loadAnalytics() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cv-analytics")) return;
  if (!analyticsEnabled) return;
  const script = document.createElement("script");
  script.id = "cv-analytics";
  script.defer = true;
  script.src = ANALYTICS.src;
  if (ANALYTICS.provider === "plausible") script.dataset.domain = ANALYTICS.id;
  if (ANALYTICS.provider === "umami") script.dataset.websiteId = ANALYTICS.id;
  document.head.appendChild(script);
}

/**
 * Bannière de consentement CNIL / RGPD / TCF v2 compliant :
 * - Bloque tout script tiers (AdSense, mesure d'audience) tant que le consentement n'est pas explicite.
 * - En cas d'acceptation : charge dynamiquement AdSense et Analytics.
 * - En cas de refus : aucun script ni traceur n'est injecté.
 */
export default function CookieConsent() {
  const [choice, setChoice] = useState(readConsentChoice);
  const [open, setOpen] = useState(() => !readConsentChoice());

  useEffect(() => {
    if (choice === "granted") {
      loadAdSense();
      loadAnalytics();
    }
  }, [choice]);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  function decide(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // stockage indisponible
    }
    setChoice(value);
    setOpen(false);
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: { consent: value } }));

    if (value === "granted") {
      loadAdSense();
      loadAnalytics();
    } else {
      // Si l'utilisateur refuse et que les scripts étaient chargés, on recharge proprement sans scripts
      if (document.getElementById("cv-adsense") || document.getElementById("cv-analytics")) {
        window.location.reload();
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Gestion des cookies et de la vie privée"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={SPRING}
          className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-5 rounded-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)] border border-white/15 bg-[#141220]/98 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-2 text-cine-emerald font-semibold text-sm">
            <span>🛡️</span> Protection de votre vie privée
          </div>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-4">
            CineViseur utilise le stockage local de votre navigateur pour vos listes de films. Nous affichons des annonces partenaires discrètes et mesurons l'audience anonymisée pour financer l'hébergement gratuit. Acceptez-vous ces fonctionnalités ?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => decide("denied")}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 text-xs font-medium transition-all"
            >
              Continuer sans accepter
            </button>
            <button
              onClick={() => decide("granted")}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-[#0c0b12] text-xs font-bold transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
            >
              Accepter & poursuivre
            </button>
          </div>
          <div className="mt-3 text-center">
            <Link to="/confidentialite" onClick={() => setOpen(false)} className="text-[11px] text-white/40 hover:text-white/70 underline">
              En savoir plus sur notre politique de confidentialité
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}