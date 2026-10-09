import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ANALYTICS, analyticsEnabled } from "../lib/site";
import { SPRING } from "../lib/motionTokens";

const KEY = "cv_consent";
// Événement émis par le lien « Gérer les cookies » du pied de page.
const OPEN_CONSENT_EVENT = "cv:open-consent";

function readChoice() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function loadAnalytics() {
  if (document.getElementById("cv-analytics")) return;
  const script = document.createElement("script");
  script.id = "cv-analytics";
  script.defer = true;
  script.src = ANALYTICS.src;
  if (ANALYTICS.provider === "plausible") script.dataset.domain = ANALYTICS.id;
  if (ANALYTICS.provider === "umami") script.dataset.websiteId = ANALYTICS.id;
  document.head.appendChild(script);
}

/**
 * Bannière de consentement (CNIL) : la mesure d'audience ne se charge qu'après « Accepter ».
 * « Refuser » est aussi visible et aussi simple qu'« Accepter ». Sans outil d'analytics configuré,
 * le site ne dépose rien de non essentiel et la bannière ne s'affiche pas.
 */
export default function CookieConsent() {
  const [choice, setChoice] = useState(readChoice);
  const [open, setOpen] = useState(() => analyticsEnabled && !readChoice());

  useEffect(() => {
    if (analyticsEnabled && choice === "granted") loadAnalytics();
  }, [choice]);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!analyticsEnabled) return null;

  function decide(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // stockage indisponible : le choix vaut pour cette visite
    }
    setChoice(value);
    setOpen(false);
    // Retirer son consentement doit arrêter la mesure : on recharge sans le script.
    if (value === "denied" && document.getElementById("cv-analytics")) window.location.reload();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Mesure d'audience"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={SPRING}
          className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 panel p-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
        >
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            On aimerait mesurer l'audience du site, de façon anonyme, pour savoir quelles pages sont utiles. Rien n'est
            déposé sans ton accord. <Link to="/confidentialite" className="link">En savoir plus</Link>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => decide("denied")} className="btn-ghost !py-2.5">Refuser</button>
            <button onClick={() => decide("granted")} className="btn-ghost !py-2.5">Accepter</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
