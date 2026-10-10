/**
 * Installation de CineViseur en application (PWA).
 *
 * Chrome et Edge savent installer le site d'un clic : ils émettent « beforeinstallprompt »,
 * que l'on met de côté pour déclencher l'installation au bon moment. Safari ne le fait pas,
 * d'où la marche à suivre détaillée pour iPhone et Mac.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

const DISMISS_KEY = "cv_install_hidden";

const PLATFORMS = [
  {
    key: "android",
    label: "Android",
    icon: "android",
    browser: "Chrome",
    steps: [
      "Touche le menu ⋮ en haut à droite de Chrome.",
      "Choisis « Installer l'application ».",
      "Confirme avec « Installer ».",
    ],
  },
  {
    key: "ios",
    label: "iPhone & iPad",
    icon: "apple",
    browser: "Safari",
    steps: [
      "Touche le bouton Partager, le carré avec une flèche vers le haut.",
      "Fais défiler la liste, puis choisis « Sur l'écran d'accueil ».",
      "Touche « Ajouter » en haut à droite.",
    ],
    note: "À faire depuis Safari : les autres navigateurs iPhone ne proposent pas toujours cette option.",
  },
  {
    key: "windows",
    label: "Windows",
    icon: "windows",
    browser: "Chrome ou Edge",
    steps: [
      "Clique sur l'icône d'installation, à droite de la barre d'adresse.",
      "Si elle n'y est pas, ouvre le menu ⋮ puis « Installer CineViseur ».",
      "Confirme avec « Installer ».",
    ],
  },
  {
    key: "mac",
    label: "Mac",
    icon: "apple",
    browser: "Safari 17+, Chrome ou Edge",
    steps: [
      "Dans Safari : menu Fichier, puis « Ajouter au Dock ».",
      "Dans Chrome ou Edge : l'icône d'installation dans la barre d'adresse.",
      "Confirme avec « Ajouter » ou « Installer ».",
    ],
  },
];

function detectPlatform() {
  const ua = navigator.userAgent;
  // Un iPad récent se présente comme un Mac : seul le tactile le distingue.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
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

const InstallContext = createContext(null);

/** Permet à n'importe quelle page d'ouvrir la marche à suivre. */
export function useInstall() {
  return useContext(InstallContext);
}

export function InstallProvider({ children }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [platform, setPlatform] = useState("windows");

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    setHidden(readDismissed());

    function onBeforeInstall(e) {
      // Sans ça, Chrome affiche sa propre invite et l'on perd la main sur le moment.
      e.preventDefault();
      setDeferred(e);
    }
    function onInstalled() {
      setDeferred(null);
      setInstalled(true);
      setOpen(false);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // Une invite ne peut servir qu'une fois.
    setDeferred(null);
    return outcome === "accepted";
  }, [deferred]);

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
      openGuide: () => setOpen(true),
      install,
    }),
    [platform, installed, deferred, install]
  );

  return (
    <InstallContext.Provider value={value}>
      {children}
      {!installed && (
        <>
          <InstallPill hidden={hidden} onOpen={() => setOpen(true)} onDismiss={dismiss} />
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

/** Pastille discrète, présente sur toutes les pages tant qu'on ne l'a pas écartée. */
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
            <Icon name="mobile" className="w-4 h-4 text-cine-soft" weight="bold" />
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

  useEffect(() => {
    if (open) setTab(platform);
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
              CineViseur s'installe depuis ton navigateur : pas de téléchargement, pas de boutique.
              L'icône rejoint ton écran d'accueil et l'app se met à jour toute seule.
            </p>

            {canInstall && (
              <div className="mb-5">
                <button onClick={onInstall} className="btn-primary w-full justify-center">
                  <Icon name="download" className="w-4 h-4" weight="bold" /> Installer maintenant
                </button>
                <p className="mt-2 text-xs text-white/45 text-center">
                  Ton navigateur gère l'installation : un clic suffit.
                </p>
              </div>
            )}

            <div role="tablist" aria-label="Choisir un appareil" className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={tab === p.key}
                  onClick={() => setTab(p.key)}
                  className="btn-chip"
                >
                  <Icon name={p.icon} className="w-4 h-4" />
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Avec {current.browser}</p>
              <ol className="space-y-3">
                {current.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-white/80 leading-relaxed">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-cine-violet/20 ring-1 ring-inset ring-cine-violet/40 text-cine-soft grid place-items-center text-xs font-semibold tabular-nums">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              {current.note && <p className="mt-4 text-xs text-white/50 leading-relaxed">{current.note}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
