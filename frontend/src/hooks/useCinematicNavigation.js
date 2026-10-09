import { useEffect } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";

// Attend qu'un élément apparaisse dans la nouvelle page (ou abandonne après `timeout`).
function waitFor(test, timeout = 1200) {
  return new Promise((resolve) => {
    const start = performance.now();
    (function check() {
      if (test() || performance.now() - start > timeout) resolve();
      else setTimeout(check, 30);
    })();
  });
}

/**
 * Changements de page « cinéma » via l'API View Transitions :
 * - clic sur une affiche : l'affiche s'agrandit et vole jusqu'à sa place dans la fiche ;
 * - autres liens : fondu au noir entre les pages.
 * React Router laisse la main dès que le clic est marqué defaultPrevented ; les onClick des liens
 * (fermer un menu, etc.) continuent de s'exécuter.
 */
export default function useCinematicNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.startViewTransition) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduce.matches) return;
      const anchor = e.target.closest("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      // Fin d'un appui long sur une affiche : c'est l'aperçu qui s'ouvre, pas la fiche.
      if (anchor.dataset.held) return;
      // Un bouton dans une carte (ex. « + ») garde son propre comportement.
      if (e.target.closest("button") && anchor.contains(e.target.closest("button"))) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const to = url.pathname + url.search;
      if (to === window.location.pathname + window.location.search) return;

      e.preventDefault();
      const poster = anchor.dataset.vtPoster ? anchor.querySelector("img[data-poster]") : null;
      const root = document.documentElement;
      if (poster) poster.style.viewTransitionName = "poster-hero";
      root.dataset.vt = poster ? "poster" : "page";

      const transition = document.startViewTransition(async () => {
        flushSync(() => {
          navigate(to, poster ? { state: { poster: anchor.dataset.vtPoster, title: anchor.dataset.vtTitle } } : undefined);
        });
        window.scrollTo(0, 0);
        // La capture de la nouvelle page attend que son contenu soit monté (pages chargées à la demande).
        await waitFor(() =>
          poster ? document.querySelector("[data-vt-target]") : !document.querySelector("[data-suspense-fallback]")
        );
      });
      transition.finished.finally(() => {
        if (poster) poster.style.viewTransitionName = "";
        delete root.dataset.vt;
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);
}
