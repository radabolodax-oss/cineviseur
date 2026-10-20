/**
 * Installation de l'application CineViseur (PWA) adaptée à chaque plateforme :
 * Windows, Mac, Android, iPhone & iPad.
 * Déclenche directement la fenêtre d'installation native du système (qui crée la vraie
 * application et le vrai raccourci sur le Bureau / Écran d'accueil, sans fichier .html).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

const DISMISS_KEY = "cv_install_hidden";

const PLATFORMS = [
  {
    key: "windows",
    label: "Windows",
    icon: "windows",
    title: "Application & Raccourci Bureau Windows",
    description:
      "Installe la vraie application CineViseur avec son raccourci directement sur ton Bureau Windows et dans le menu Démarrer.",
    actionLabel: "Installer sur le Bureau Windows",
    fallbackHint:
      "Si la fenêtre d'installation ne s'ouvre pas automatiquement, clique sur l'icône d'installation (⊕) tout à droite de la barre d'adresse de Chrome ou Edge.",
  },
  {
    key: "mac",
    label: "Mac",
    icon: "apple",
    title: "Application & Raccourci Dock Mac",
    description:
      "Ajoute l'application CineViseur directement dans ton Dock macOS et dans ton dossier Applications.",
    actionLabel: "Installer sur Mac",
    fallbackHint:
      "Sur Chrome ou Edge : clique sur l'icône d'installation (⊕) dans la barre d'adresse. Sur Safari : menu Fichier → « Ajouter au Dock ».",
  },
  {
    key: "android",
    label: "Android",
    icon: "android",
    title: "Application Android plein écran",
    description:
      "Installe l'application CineViseur en plein écran avec son icône sur l'écran d'accueil de ton téléphone ou ta tablette Android.",
    actionLabel: "Installer sur Android",
    fallbackHint:
      "Sur ton téléphone Android : ouvre le menu ⋮ de Chrome en haut à droite puis appuie sur « Installer l'application ».",
  },
  {
    key: "ios",
    label: "iPhone & iPad",
    icon: "apple",
    title: "Application iPhone & iPad",
    description:
      "Ajoute CineViseur en plein écran avec son icône sur l'écran d'accueil de ton iPhone ou de ton iPad.",
    actionLabel: "Ajouter sur iPhone / iPad",
    fallbackHint:
      "Dans le menu qui s'ouvre (ou via le bouton Partager de Safari en bas de l'écran), touche « Sur l'écran d'accueil » puis « Ajouter ».",
  },
];

function detectPlatform() {
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh|Mac OS X/.test(ua)) return "mac";
  return "windows";
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

const InstallContext = createContext({
  platform: "windows",
  installed: false,
  canInstall: false,
  openGuide: () => {},
  install: async () => false,
});

/** Permet à n'importe quelle page d'ouvrir la fenêtre d'installation. */
export function useInstall() {
  return useContext(InstallContext);
}

export function InstallProvider({ children }) {
  const [deferred, setDeferred] = useState(() =>
    typeof window !== "undefined" ? window.__cvInstallPrompt || null : null
  );
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [platform, setPlatform] = useState("windows");

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    setHidden(readDismissed());
    if (window.__cvInstallPrompt) {
      setDeferred(window.__cvInstallPrompt);
    }

    function onBeforeInstall(e) {
      e.preventDefault();
      window.__cvInstallPrompt = e;
      setDeferred(e);
    }
    function onInstallReady() {
      if (window.__cvInstallPrompt) setDeferred(window.__cvInstallPrompt);
    }
    function onInstalled() {
      window.__cvInstallPrompt = null;
      setDeferred(null);
      setInstalled(true);
      setOpen(false);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("cv:install-ready", onInstallReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("cv:install-ready", onInstallReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const promptEvent = deferred || window.__cvInstallPrompt;
    if (!promptEvent) return false;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    window.__cvInstallPrompt = null;
    setDeferred(null);
    return outcome === "accepted";
  }, [deferred]);

  const openGuide = useCallback(() => {
    setOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // refus du stockage : la pastille reviendra à la prochaine visite
    }
  }, []);

  const value = useMemo(
    () => ({
      platform,
      installed,
      canInstall: Boolean(deferred),
      openGuide,
      install,
    }),
    [platform, installed, deferred, openGuide, install]
  );

  return (
    <InstallContext.Provider value={value}>
      {children}
      {!installed && (
        <>
          <InstallPill hidden={hidden} onOpen={openGuide} onDismiss={dismiss} />
          <InstallModal
            open={open}
            onClose={() => setOpen(false)}
            platform={platform}
            canInstall={Boolean(deferred)}
            onInstall={install}
          />
        </>
      )}
    </InstallContext.Provider>
  );
}

/** Pastille discrète en bas à droite. */
function InstallPill({ hidden, onOpen, onDismiss }) {
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={SPRING}
          className="fixed z-30 right-4 sm:right-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-6 flex items-center gap-1 panel p-1.5 pl-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          <button onClick={onOpen} className="flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white transition-colors">
            <Icon name="download" className="w-4 h-4 text-cine-soft" weight="bold" />
            Installer l'app
          </button>
          <button onClick={onDismiss} className="btn-icon !w-7 !h-7" aria-label="Masquer la proposition d'installation">
            <Icon name="x" className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InstallModal({ open, onClose, platform, canInstall, onInstall }) {
  const [tab, setTab] = useState(platform);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(platform);
      setShowHint(false);
    }
  }, [open, platform]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const current = PLATFORMS.find((p) => p.key === tab) || PLATFORMS[0];
  const isCurrentDeviceTab = tab === platform;

  async function handleAction() {
    if (canInstall) {
      const accepted = await onInstall();
      if (accepted) {
        onClose();
        return;
      }
    }
    if (current.key === "ios" && navigator.share) {
      try {
        await navigator.share({ title: "CineViseur", url: window.location.origin });
      } catch {
        // Partage fermé par l'utilisateur
      }
    }
    setShowHint(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] bg-cine-ink/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-title"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={SPRING}
            className="panel w-full max-w-lg p-6 my-auto shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 id="install-title" className="section-title">Installer CineViseur</h2>
              <button onClick={onClose} className="btn-icon shrink-0" aria-label="Fermer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-5">
              Choisis ton système pour installer l'application et son raccourci directement sur ton appareil.
            </p>

            {/* Sélection de la plateforme : Windows, Mac, Android, iPhone & iPad */}
            <div role="tablist" aria-label="Choisir un appareil" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={tab === p.key}
                  onClick={() => {
                    setTab(p.key);
                    setShowHint(false);
                  }}
                  className="btn-chip justify-center !px-3 !py-2.5"
                >
                  <Icon name={p.icon} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Carte d'installation adaptée à la plateforme */}
            <div className="rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-9 h-9 rounded-xl bg-cine-violet/20 ring-1 ring-inset ring-cine-violet/40 text-cine-soft grid place-items-center shrink-0">
                  <Icon name={current.icon} className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-base text-white">{current.title}</h3>
                  {isCurrentDeviceTab && (
                    <span className="text-[11px] text-cine-soft font-medium">Détecté sur cet appareil</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-white/65 leading-relaxed mt-2 mb-5">
                {current.description}
              </p>

              <button onClick={handleAction} className="btn-primary w-full justify-center !py-3.5">
                <Icon name="download" className="w-4 h-4" weight="bold" />
                {current.actionLabel}
              </button>

              {showHint && (
                <p className="mt-4 text-xs text-cine-soft leading-relaxed text-center bg-cine-violet/10 ring-1 ring-inset ring-cine-violet/30 rounded-xl p-3">
                  {current.fallbackHint}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
