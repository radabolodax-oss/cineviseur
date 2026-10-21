/**
 * forceAppUpdate — Purge les caches de fichiers du navigateur (HTML, CSS, JS)
 * et recharge immédiatement l'application avec la dernière version en ligne.
 *
 * IMPORTANT : Les données utilisateur (films, notes, alertes, épisodes)
 * stockées dans localStorage ne sont JAMAIS supprimées.
 */
export async function forceAppUpdate() {
  try {
    // 1. Vider tous les caches de fichiers gérés par le navigateur (CacheStorage / Workbox)
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // 2. Débloquer et désinscrire les anciens Service Workers pour garantir un chargement réseau neuf
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        await reg.unregister().catch(() => {});
      }
    }
  } catch (err) {
    console.warn("[PWA] Erreur lors du nettoyage du cache :", err);
  } finally {
    // 3. Forcer le rechargement immédiat
    setTimeout(() => {
      window.location.reload();
    }, 150);
  }
}
