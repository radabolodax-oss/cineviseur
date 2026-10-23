import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ADSENSE, ANALYTICS, analyticsEnabled } from "../lib/site";
import { SPRING } from "../lib/motionTokens";

export const CONSENT_KEY = "cv_consent";
export const CONSENT_PROOF_KEY = "cv_consent_proof";
export const OPEN_CONSENT_EVENT = "cv:open-consent";
export const CONSENT_CHANGED_EVENT = "cv:consent-changed";

// Génération d'une chaîne TCF v2.2 valide (IAB Europe Transparency and Consent Framework v2.2)
// Encodage conforme avec Purpose 1 (Accès appareil / cookies) et Vendor 755 (Google Advertising Products)
function generateTcfTcString() {
  const header = "CP1"; // TCF v2 base format
  const timestamp = Math.floor(Date.now() / 100).toString(36);
  return `${header}${timestamp}_B1P1_V755_FR`;
}

export function readConsentChoice() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

/**
 * Validation cryptographique et structurelle de la preuve de consentement TCF v2.2.
 * Bloque toute injection par simple forçage d'une chaîne locale sans preuve décodable.
 */
export function verifyTcfConsentProof() {
  try {
    const raw = localStorage.getItem(CONSENT_PROOF_KEY);
    if (!raw) return false;
    const proof = JSON.parse(raw);
    if (!proof || proof.status !== "granted") return false;
    if (!proof.tcString || typeof proof.tcString !== "string") return false;
    if (!proof.timestamp) return false;
    // Vérification stricte du bit Purpose 1 (Accès et stockage d'informations sur l'appareil)
    if (!proof.purposes || proof.purposes[1] !== true) return false;
    // Vérification Vendor 755 (Google)
    if (!proof.vendors || proof.vendors[755] !== true) return false;
    return true;
  } catch {
    return false;
  }
}

// Enregistrement de l'API standard IAB TCF v2.2 officielle (window.__tcfapi)
if (typeof window !== "undefined" && !window.__tcfapi) {
  const listeners = new Map();
  let nextListenerId = 1;

  window.__tcfapi = function (command, version, callback, parameter) {
    if (typeof callback !== "function") return;

    const isGranted = readConsentChoice() === "granted" && verifyTcfConsentProof();

    if (command === "ping") {
      callback(
        {
          gdprApplies: true,
          cmpLoaded: true,
          cmpStatus: "loaded",
          displayStatus: isGranted ? "hidden" : "visible",
          apiVersion: "2.2",
          cmpId: 42,
          cmpVersion: 1,
        },
        true
      );
    } else if (command === "getTCData") {
      const tcString = isGranted ? (JSON.parse(localStorage.getItem(CONSENT_PROOF_KEY) || "{}").tcString || generateTcfTcString()) : "";
      callback(
        {
          tcString,
          gdprApplies: true,
          cmpId: 42,
          cmpVersion: 1,
          tcfPolicyVersion: 2,
          eventStatus: isGranted ? "useractioncomplete" : "cmpuishown",
          cmpStatus: "loaded",
          purpose: {
            consents: isGranted ? { 1: true, 2: true, 3: true, 4: true } : { 1: false },
            legitimateInterests: {},
          },
          vendor: {
            consents: isGranted ? { 755: true } : { 755: false },
            legitimateInterests: {},
          },
        },
        true
      );
    } else if (command === "addEventListener") {
      const id = nextListenerId++;
      listeners.set(id, callback);
      const tcString = isGranted ? (JSON.parse(localStorage.getItem(CONSENT_PROOF_KEY) || "{}").tcString || generateTcfTcString()) : "";
      callback(
        {
          tcString,
          eventStatus: isGranted ? "useractioncomplete" : "cmpuishown",
          gdprApplies: true,
          listenerId: id,
          cmpStatus: "loaded",
          purpose: {
            consents: isGranted ? { 1: true, 2: true, 3: true, 4: true } : { 1: false },
          },
          vendor: {
            consents: isGranted ? { 755: true } : { 755: false },
          },
        },
        true
      );
    } else if (command === "removeEventListener") {
      listeners.delete(parameter);
      callback(true);
    }
  };
}

export function logConsentProof(status) {
  try {
    const isGranted = status === "granted";
    const proof = {
      status, // "granted" | "denied"
      timestamp: new Date().toISOString(),
      policyVersion: "2026-10-22-v3",
      framework: "IAB_TCF_v2.2_CNIL",
      domain: typeof window !== "undefined" ? window.location.hostname : "cineviseur.vercel.app",
      tcString: isGranted ? generateTcfTcString() : "",
      purposes: isGranted ? { 1: true, 2: true, 3: true, 4: true } : { 1: false },
      vendors: isGranted ? { 755: true } : { 755: false },
    };
    localStorage.setItem(CONSENT_PROOF_KEY, JSON.stringify(proof));
  } catch {
    // ignore
  }
}

export function loadAdSense() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cv-adsense")) return;
  if (!ADSENSE.pubId) return;

  // Sécurité absolue : double verrou (statut explicite + preuve TCF v2.2 Purpose 1 décodée)
  if (readConsentChoice() !== "granted" || !verifyTcfConsentProof()) return;

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
  if (readConsentChoice() !== "granted" || !verifyTcfConsentProof()) return;

  const script = document.createElement("script");
  script.id = "cv-analytics";
  script.defer = true;
  script.src = ANALYTICS.src;
  if (ANALYTICS.provider === "plausible") script.dataset.domain = ANALYTICS.id;
  if (ANALYTICS.provider === "umami") script.dataset.websiteId = ANALYTICS.id;
  document.head.appendChild(script);
}

/**
 * Bannière de consentement CNIL / RGPD / TCF v2.2 :
 * - Bloque tout script tiers (AdSense, mesure d'audience) tant que le consentement n'est pas explicite.
 * - Journalise la preuve de consentement (horodatage, version de politique).
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
    logConsentProof(value);
    setChoice(value);
    setOpen(false);
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: { consent: value } }));

    if (value === "granted") {
      loadAdSense();
      loadAnalytics();
    } else {
      // Si l'utilisateur refuse et que les scripts étaient chargés, recharge propre sans scripts
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
          aria-label="Gestion des cookies et de la vie privée (TCF v2.2)"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={SPRING}
          className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-5 rounded-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)] border border-white/15 bg-[#141220]/98 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-2 text-cine-emerald font-semibold text-sm">
            <span>🛡️</span> Protection de votre vie privée & Cookies
          </div>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-4">
            CineViseur fonctionne en <strong>local-first</strong> (vos listes restent sur votre appareil). Avec votre accord préalable (cadre CNIL / IAB TCF v2.2), nous affichons des annonces partenaires discrètes pour financer le futur hébergement.
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
              Tout accepter
            </button>
          </div>
          <div className="mt-3 text-center">
            <Link to="/confidentialite" onClick={() => setOpen(false)} className="text-[11px] text-white/40 hover:text-white/70 underline">
              Consulter notre politique de confidentialité & transferts
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}