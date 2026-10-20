/**
 * Installation de CineViseur adaptée à chaque plateforme :
 * Windows, Mac, Android, iPhone & iPad.
 * Déclenche l'installation officielle pour placer le vrai raccourci sur le Bureau / Écran d'accueil.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

const DISMISS_KEY = "cv_install_hidden";

export function detectPlatform() {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh|Mac OS X/.test(ua)) return "mac";
  return "windows";
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
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
  handleInstall: async () => false,
});

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

  // Déclenche l'installation native en un clic si possible, sinon ouvre le guide adapté
  const handleInstall = useCallback(async () => {
    const promptEvent = deferred || window.__cvInstallPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          window.__cvInstallPrompt = null;
          setDeferred(null);
          setInstalled(true);
          setOpen(false);
          return true;
        }
      } catch {
        // En cas d'erreur de prompt, on ouvre le guide
      }
    }
    setOpen(true);
    return false;
  }, [deferred]);

  const openGuide = useCallback(() => {
    setOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      platform,
      installed,
      canInstall: Boolean(deferred),
      openGuide,
      handleInstall,
    }),
    [platform, installed, deferred, openGuide, handleInstall]
  );

  return (
    <InstallContext.Provider value={value}>
      {children}
      {!installed && (
        <>
          <InstallPill hidden={hidden} onAction={handleInstall} onDismiss={dismiss} />
          <InstallModal
            open={open}
            onClose={() => setOpen(false)}
            platform={platform}
            canInstall={Boolean(deferred)}
            onDirectInstall={handleInstall}
          />
        </>
      )}
    </InstallContext.Provider>
  );
}

/** Pastille discrète en bas à droite. */
function InstallPill({ hidden, onAction, onDismiss }) {
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
          <button onClick={onAction} className="flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white transition-colors">
            <Icon name="download" className="w-4 h-4 text-cine-soft" weight="bold" />
            Installer l'application
          </button>
          <button onClick={onDismiss} className="btn-icon !w-7 !h-7" aria-label="Masquer">
            <Icon name="x" className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const PLATFORM_CONFIG = {
  windows: {
    label: "Windows",
    icon: "windows",
    title: "Installer sur le Bureau Windows",
    subtitle: "Créez le raccourci CineViseur sur votre Bureau et dans le menu Démarrer.",
  },
  mac: {
    label: "Mac",
    icon: "apple",
    title: "Installer sur Mac",
    subtitle: "Ajoutez CineViseur directement dans votre Dock macOS et vos Applications.",
  },
  android: {
    label: "Android",
    icon: "android",
    title: "Installer sur Android",
    subtitle: "Ajoutez l'icône CineViseur en plein écran sur votre écran d'accueil.",
  },
  ios: {
    label: "iPhone / iPad",
    icon: "apple",
    title: "Installer sur iPhone / iPad",
    subtitle: "Ajoutez CineViseur en plein écran sur votre écran d'accueil Safari.",
  },
};

function InstallModal({ open, onClose, platform, canInstall, onDirectInstall }) {
  const [activePlatform, setActivePlatform] = useState(platform);

  useEffect(() => {
    if (open) {
      setActivePlatform(platform);
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

  const cfg = PLATFORM_CONFIG[activePlatform] || PLATFORM_CONFIG.windows;

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
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={SPRING}
            className="panel w-full max-w-lg p-6 my-auto shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="section-title text-xl">{cfg.title}</h2>
                <p className="text-xs text-white/55 mt-1">{cfg.subtitle}</p>
              </div>
              <button onClick={onClose} className="btn-icon shrink-0" aria-label="Fermer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            {/* Onglets de sélection de système */}
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] rounded-xl mb-6">
              {Object.entries(PLATFORM_CONFIG).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setActivePlatform(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                    activePlatform === key
                      ? "bg-cine-violet text-white font-semibold shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Icon name={p.icon} className="w-3.5 h-3.5" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>

            {/* CONTENU SPÉCIFIQUE SELON LA PLATEFORME */}
            {activePlatform === "windows" && (
              <div className="flex flex-col gap-4">
                {canInstall && (
                  <button onClick={onDirectInstall} className="btn-primary w-full justify-center !py-3.5 text-sm">
                    <Icon name="download" className="w-4 h-4" weight="bold" />
                    Créer le raccourci officiel sur le Bureau Windows
                  </button>
                )}

                {/* Bloc spécifique Opera */}
                <div className="p-4 rounded-xl bg-cine-violet/10 ring-1 ring-inset ring-cine-violet/30 flex flex-col gap-2.5 text-xs text-white/85">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cine-soft text-sm flex items-center gap-2">
                      Navigateur Opera
                    </span>
                    {typeof navigator !== "undefined" && /OPR\/|Opera\//.test(navigator.userAgent) && (
                      <span className="text-[10px] bg-cine-violet/30 px-2 py-0.5 rounded text-white font-medium">Détecté sur votre navigateur</span>
                    )}
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    Opera désactive l'icône d'installation automatique pour privilégier sa barre latérale.
                  </p>
                  <div className="flex items-start gap-2.5 mt-1 bg-black/30 p-3 rounded-lg border border-white/[0.08]">
                    <span className="text-lg shrink-0">🔒</span>
                    <p className="leading-relaxed">
                      <strong>Astuce en 1 seconde :</strong> Cliquez sur le <strong>cadenas 🔒</strong> (juste à gauche de l'adresse URL en haut) et <strong>glissez-le directement avec votre souris sur votre Bureau Windows</strong>. Le raccourci est créé instantanément !
                    </p>
                  </div>
                </div>

                {/* Bloc pour Chrome et Edge */}
                <div className="p-4 rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.08] flex flex-col gap-3 text-xs text-white/80">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">Sur Google Chrome ou Microsoft Edge :</span>
                    {typeof navigator !== "undefined" && !/OPR\/|Opera\//.test(navigator.userAgent) && /Chrome\/|Edg\//.test(navigator.userAgent) && (
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white font-medium">Détecté sur votre navigateur</span>
                    )}
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-cine-violet/20 text-cine-soft grid place-items-center shrink-0 font-bold text-xs">1</span>
                    <p className="leading-relaxed">
                      <strong>Via la barre d'adresse :</strong> Tout à droite de l'URL en haut (à côté de l'étoile des favoris), cliquez sur l'icône <strong>⊕ (Installer CineViseur)</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-cine-violet/20 text-cine-soft grid place-items-center shrink-0 font-bold text-xs">2</span>
                    <p className="leading-relaxed">
                      <strong>Via le menu :</strong> Cliquez sur le menu <strong>⋮ (3 points en haut à droite)</strong> → <strong>« Enregistrer et partager »</strong> → <strong>« Installer CineViseur »</strong>.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-white/45 bg-white/[0.02] p-3 rounded-lg border border-white/[0.05] leading-relaxed">
                  💡 <strong>Note :</strong> Si vous êtes en fenêtre de <em>navigation privée</em>, Chrome et Edge bloquent l'installation d'applications par sécurité. Ouvrez CineViseur dans une fenêtre classique pour créer le raccourci.
                </p>
              </div>
            )}

            {activePlatform === "android" && (
              <div className="flex flex-col gap-4">
                {canInstall && (
                  <button onClick={onDirectInstall} className="btn-primary w-full justify-center !py-3.5 text-sm">
                    <Icon name="download" className="w-4 h-4" weight="bold" />
                    Ajouter à l'écran d'accueil Android
                  </button>
                )}

                <div className="p-4 rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.08] flex flex-col gap-3.5 text-xs text-white/80">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-cine-violet/20 text-cine-soft grid place-items-center shrink-0 font-bold text-xs">1</span>
                    <p className="leading-relaxed">
                      Touchez le menu <strong>⋮ (les 3 points)</strong> en haut à droite de Chrome.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-cine-violet/20 text-cine-soft grid place-items-center shrink-0 font-bold text-xs">2</span>
                    <p className="leading-relaxed">
                      Appuyez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activePlatform === "ios" && (
              <div className="p-4 rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.08] flex flex-col gap-3.5 text-xs text-white/80">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-cine-violet/20 text-cine-soft grid place-items-center shrink-0 font-bold text-xs">1</span>
                  <p className="leading-relaxed">
                    Dans <strong>Safari</strong>, touchez le bouton <strong>Partager</strong> (le carré avec la flèche vers le haut ⎋) tout en bas de l'écran.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-cine-violet/20 text-cine-soft grid place-items-center shrink-0 font-bold text-xs">2</span>
                  <p className="leading-relaxed">
                    Faites défiler le menu vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong> (icône ➕).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-cine-violet/20 text-cine-soft grid place-items-center shrink-0 font-bold text-xs">3</span>
                  <p className="leading-relaxed">
                    Touchez <strong>« Ajouter »</strong> en haut à droite : CineViseur apparaîtra directement sur votre écran d'accueil !
                  </p>
                </div>
              </div>
            )}

            {activePlatform === "mac" && (
              <div className="p-4 rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.08] flex flex-col gap-3 text-xs text-white/80">
                <p className="leading-relaxed">
                  • <strong>Sur Safari :</strong> cliquez sur le menu <strong>Fichier</strong> en haut de l'écran, puis sur <strong>« Ajouter au Dock »</strong>.
                </p>
                <p className="leading-relaxed">
                  • <strong>Sur Chrome :</strong> cliquez sur l'icône <strong>⊕ (Installer)</strong> tout à droite de la barre d'adresse.
                </p>
              </div>
            )}

            <button onClick={onClose} className="btn-light w-full justify-center mt-5 !py-2.5 text-xs">
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
