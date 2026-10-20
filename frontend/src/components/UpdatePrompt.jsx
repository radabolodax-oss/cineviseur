import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AnimatePresence, motion } from "motion/react";
import { SPRING } from "../lib/motionTokens";
import Icon from "./Icon";

/**
 * UpdatePrompt — Système de patch et mise à jour transparente de CineViseur.
 * 
 * Détecte automatiquement lorsqu'une nouvelle version est déployée en ligne.
 * Au lieu de demander à l'utilisateur de vider son cache ou de risquer de perdre ses films,
 * une notification propose directement d'appliquer la mise à jour en 1 clic.
 */
export default function UpdatePrompt() {
  const [checking, setChecking] = useState(false);
  const [upToDateNotice, setUpToDateNotice] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // 1. Vérifie immédiatement au démarrage
      registration.update().catch(() => {});

      // 2. Vérifie dès que l'utilisateur revient sur l'onglet ou rouvre l'application PWA
      const onVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      // 3. Vérifie régulièrement en arrière-plan toutes les 15 minutes
      const interval = setInterval(() => {
        registration.update().catch(() => {});
      }, 15 * 60 * 1000);

      // 4. Écoute les demandes manuelles (depuis les réglages par exemple)
      const onManualCheck = async () => {
        setChecking(true);
        try {
          await registration.update();
          setTimeout(() => {
            setChecking(false);
            if (!needRefresh) {
              setUpToDateNotice(true);
              setTimeout(() => setUpToDateNotice(false), 3500);
            }
          }, 800);
        } catch {
          setChecking(false);
        }
      };
      window.addEventListener("cv:check-update", onManualCheck);

      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("cv:check-update", onManualCheck);
        clearInterval(interval);
      };
    },
    onRegisterError(error) {
      console.warn("[PWA] Erreur d'enregistrement du Service Worker :", error);
    },
  });

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
    } catch {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <>
      {/* Toast de confirmation si le site est déjà à jour (déclenché manuellement) */}
      <AnimatePresence>
        {upToDateNotice && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={SPRING}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-cine-ink/95 backdrop-blur-2xl border border-emerald-500/40 shadow-xl text-white text-xs"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Icon name="check" className="w-3.5 h-3.5" weight="bold" />
            </div>
            <span className="font-medium text-white/90">CineViseur est déjà à jour avec la dernière version !</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière de mise à jour / Patch disponible */}
      <AnimatePresence>
        {needRefresh && (
          <motion.aside
            role="alertdialog"
            aria-label="Mise à jour CineViseur disponible"
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={SPRING}
            className="fixed top-4 inset-x-3 sm:inset-x-4 max-w-lg mx-auto z-50 flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-cine-ink/95 backdrop-blur-2xl border border-cine-violet/50 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cine-violet/25 border border-cine-violet/40 flex items-center justify-center shrink-0 text-cine-soft shadow-inner">
                <Icon name="sparkle" className="w-5 h-5" weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-cine-soft flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-cine-soft animate-ping" />
                  Mise à jour disponible
                </p>
                <p className="text-xs sm:text-sm font-medium text-white/90 truncate">
                  Une nouvelle version avec améliorations est prête.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUpdate}
                className="btn-primary !py-1.5 !px-3.5 !text-xs !font-semibold shadow-lg shadow-cine-violet/25 flex items-center gap-1.5"
              >
                <Icon name="refresh" className="w-3.5 h-3.5" />
                <span>Mettre à jour</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="btn-icon !w-8 !h-8 text-white/50 hover:text-white"
                aria-label="Fermer"
                title="Plus tard"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
