import { useEffect } from "react";
import { SITE } from "../lib/site";

const DEFAULT_TITLE = "CineViseur - Suivez vos films et séries";
const DEFAULT_DESCRIPTION =
  "CineViseur garde la mémoire de vos écrans : listes de films et séries, alertes de sortie et cinémas près de chez vous.";

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/** Titre d'onglet, description et balises de partage propres à chaque page. */
export default function useSeo(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    const fullTitle = title ? `${title} | CineViseur` : DEFAULT_TITLE;
    document.title = fullTitle;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", description);
    if (SITE.url) {
      const url = SITE.url + window.location.pathname;
      setMeta('meta[property="og:url"]', "content", url);
      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }
  }, [title, description]);
}
