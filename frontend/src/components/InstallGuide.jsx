/**
 * Installation et raccourcis adaptés à chaque plateforme (Windows, Mac, Android, iPhone & iPad).
 * Propose les 4 systèmes avec téléchargement direct d'un raccourci natif adapté à chacun
 * (.url pour Windows, .webloc pour Mac, WebClip .mobileconfig pour iOS, lanceur .html / PWA pour Android).
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
    title: "Raccourci Bureau Windows",
    description:
      "Ajoute l'icône CineViseur directement sur ton Bureau Windows ou épingle-la dans ta barre des tâches.",
    buttonLabel: "Télécharger le raccourci Windows (.url)",
    pwaLabel: "Installer l'application Windows en 1 clic",
    successHint:
      "Le fichier CineViseur.url est téléchargé : glisse-le sur ton Bureau Windows pour ouvrir le site d'un double-clic.",
  },
  {
    key: "mac",
    label: "Mac",
    icon: "apple",
    title: "Raccourci Bureau & Dock Mac",
    description:
      "Place le raccourci natif macOS sur ton Bureau ou glisse-le directement dans le Dock de ton Mac.",
    buttonLabel: "Télécharger le raccourci Mac (.webloc)",
    pwaLabel: "Installer l'application Mac en 1 clic",
    successHint:
      "Le fichier CineViseur.webloc est téléchargé : glisse-le sur ton Bureau ou dans ton Dock macOS.",
  },
  {
    key: "android",
    label: "Android",
    icon: "android",
    title: "Application & Raccourci Android",
    description:
      "Installe CineViseur en plein écran avec son icône sur l'écran d'accueil de ton téléphone ou ta tablette Android.",
    buttonLabel: "Télécharger le raccourci Android",
    pwaLabel: "Installer l'application Android en 1 clic",
    successHint:
      "Le raccourci CineViseur est téléchargé sur ton appareil Android : ouvre-le pour accéder directement à l'application.",
  },
  {
    key: "ios",
    label: "iPhone & iPad",
    icon: "apple",
    title: "Raccourci Écran d'accueil iOS",
    description:
      "Ajoute l'icône CineViseur en plein écran sur l'écran d'accueil de ton iPhone ou de ton iPad.",
    buttonLabel: "Télécharger le raccourci iOS (.mobileconfig)",
    pwaLabel: "Installer sur iPhone / iPad",
    successHint:
      "Le raccourci WebClip iOS est téléchargé : valide-le pour voir l'icône CineViseur sur ton écran d'accueil.",
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

/** Génère et télécharge directement le fichier raccourci adapté à la plateforme choisie. */
function triggerShortcutDownload(targetPlatform) {
  const origin = window.location.origin;
  let content;
  let filename;
  let mime;

  if (targetPlatform === "mac") {
    content = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      "<dict>",
      "  <key>URL</key>",
      `  <string>${origin}/</string>`,
      "</dict>",
      "</plist>",
      "",
    ].join("\n");
    filename = "CineViseur.webloc";
    mime = "application/octet-stream";
  } else if (targetPlatform === "ios") {
    // WebClip Apple officiel (.mobileconfig) qui crée une icône plein écran sur iPhone / iPad
    content = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      "<dict>",
      "  <key>PayloadContent</key>",
      "  <array>",
      "    <dict>",
      "      <key>FullScreen</key>",
      "      <true/>",
      "      <key>IsRemovable</key>",
      "      <true/>",
      "      <key>Label</key>",
      "      <string>CineViseur</string>",
      "      <key>PayloadDescription</key>",
      "      <string>Raccourci Web App CineViseur</string>",
      "      <key>PayloadDisplayName</key>",
      "      <string>CineViseur</string>",
      "      <key>PayloadIdentifier</key>",
      "      <string>fr.cineviseur.webclip.icon</string>",
      "      <key>PayloadType</key>",
      "      <string>com.apple.webClip.managed</string>",
      "      <key>PayloadUUID</key>",
      "      <string>9A6C4E2B-81D2-4F55-9B2A-11E4C90A7F01</string>",
      "      <key>PayloadVersion</key>",
      "      <integer>1</integer>",
      "      <key>Precomposed</key>",
      "      <true/>",
      "      <key>URL</key>",
      `      <string>${origin}/</string>`,
      "    </dict>",
      "  </array>",
      "  <key>PayloadDisplayName</key>",
      "  <string>CineViseur — Raccourci Écran d'accueil</string>",
      "  <key>PayloadIdentifier</key>",
      "  <string>fr.cineviseur.webclip</string>",
      "  <key>PayloadRemovalDisallowed</key>",
      "  <false/>",
      "  <key>PayloadType</key>",
      "  <string>Configuration</string>",
      "  <key>PayloadUUID</key>",
      "  <string>9A6C4E2B-81D2-4F55-9B2A-11E4C90A7F02</string>",
      "  <key>PayloadVersion</key>",
      "  <integer>1</integer>",
      "</dict>",
      "</plist>",
      "",
    ].join("\n");
    filename = "CineViseur.mobileconfig";
    mime = "application/x-apple-aspen-config";
  } else if (targetPlatform === "android") {
    // Lanceur autonome plein écran pour Android
    content = [
      "<!doctype html>",
      '<html lang="fr"><head><meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
      '<meta name="mobile-web-app-capable" content="yes">',
      '<meta name="theme-color" content="#06070f">',
      "<title>CineViseur</title>",
      `<link rel="icon" href="${origin}/icon-192.png">`,
      `<meta http-equiv="refresh" content="0;url=${origin}/">`,
      `<script>window.location.replace("${origin}/");</script>`,
      '</head><body style="background:#06070f;color:#f4f4f6;font-family:sans-serif;display:grid;place-items:center;height:100dvh;margin:0">Ouverture de CineViseur…</body></html>',
    ].join("\n");
    filename = "CineViseur-Android.html";
    mime = "text/html;charset=utf-8";
  } else {
    // Windows (.url natif)
    content = [
      "[InternetShortcut]",
      `URL=${origin}/`,
      `IconFile=${origin}/favicon-32.png`,
      "IconIndex=0",
      "",
    ].join("\r\n");
    filename = "CineViseur.url";
    mime = "application/internet-shortcut";
  }

  const blob = new Blob([content], { type: mime });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

const InstallContext = createContext({
  platform: "windows",
  installed: false,
  canInstall: false,
  openGuide: () => {},
  install: async () => false,
  downloadShortcut: () => {},
});

/** Permet à n'importe quelle page d'ouvrir la fenêtre de téléchargement / raccourci. */
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
    setDeferred(null);
    return outcome === "accepted";
  }, [deferred]);

  const downloadShortcut = useCallback(
    (targetPlatform) => {
      triggerShortcutDownload(targetPlatform || platform);
    },
    [platform]
  );

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
      downloadShortcut,
    }),
    [platform, installed, deferred, openGuide, install, downloadShortcut]
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
            onDownloadShortcut={downloadShortcut}
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

function InstallModal({ open, onClose, platform, canInstall, onInstall, onDownloadShortcut }) {
  const [tab, setTab] = useState(platform);
  const [downloadedTab, setDownloadedTab] = useState(null);

  useEffect(() => {
    if (open) {
      setTab(platform);
      setDownloadedTab(null);
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
  const showNativeInstall = canInstall && isCurrentDeviceTab;
  const isDownloaded = downloadedTab === current.key;

  async function handlePrimaryAction() {
    if (showNativeInstall) {
      const accepted = await onInstall();
      if (accepted) {
        onClose();
        return;
      }
    }
    onDownloadShortcut(current.key);
    setDownloadedTab(current.key);
  }

  function handleShortcutDownload() {
    onDownloadShortcut(current.key);
    setDownloadedTab(current.key);
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
              <h2 id="install-title" className="section-title">Télécharger CineViseur</h2>
              <button onClick={onClose} className="btn-icon shrink-0" aria-label="Fermer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-5">
              Choisis ton appareil pour installer directement l'application ou télécharger son raccourci Bureau / Écran d'accueil.
            </p>

            {/* Sélection de la plateforme : Windows, Mac, Android, iPhone & iPad */}
            <div role="tablist" aria-label="Choisir un appareil" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={tab === p.key}
                  onClick={() => setTab(p.key)}
                  className="btn-chip justify-center !px-3 !py-2.5"
                >
                  <Icon name={p.icon} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>

            {/* Carte d'action directe adaptée à la plateforme sélectionnée */}
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

              <div className="flex flex-col gap-2.5">
                {showNativeInstall ? (
                  <>
                    <button onClick={handlePrimaryAction} className="btn-primary w-full justify-center !py-3.5">
                      <Icon name="download" className="w-4 h-4" weight="bold" />
                      {current.pwaLabel}
                    </button>
                    <button onClick={handleShortcutDownload} className="btn-ghost w-full justify-center !py-3">
                      <Icon name="download" className="w-4 h-4" />
                      {isDownloaded ? "Raccourci téléchargé !" : current.buttonLabel}
                    </button>
                  </>
                ) : (
                  <button onClick={handleShortcutDownload} className="btn-primary w-full justify-center !py-3.5">
                    <Icon name="download" className="w-4 h-4" weight="bold" />
                    {isDownloaded ? "Raccourci téléchargé !" : current.buttonLabel}
                  </button>
                )}
              </div>

              {isDownloaded && (
                <p className="mt-4 text-xs text-cine-soft leading-relaxed text-center">
                  {current.successHint}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
