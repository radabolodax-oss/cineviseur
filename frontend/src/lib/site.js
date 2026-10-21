// Informations de l'éditeur et du déploiement, lues depuis les variables d'environnement (.env).
// Tant qu'une valeur n'est pas renseignée, la page légale affiche clairement « à compléter ».
const env = import.meta.env;

export const SITE = {
  name: "CineViseur",
  url: (env.VITE_SITE_URL || "https://cineviseur.vercel.app").replace(/\/$/, ""),
  editor: env.VITE_SITE_EDITOR || "CineViseur (Édition et développement indépendant)",
  editorAddress: env.VITE_SITE_ADDRESS || "France / Union Européenne",
  contactEmail: env.VITE_CONTACT_EMAIL || "contact.cineviseur@gmail.com",
  host: env.VITE_SITE_HOST || "Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  lastLegalUpdate: "21 octobre 2026",
};

// Mesure d'audience : désactivée tant que le fournisseur n'est pas configuré.
// Plausible : VITE_ANALYTICS_PROVIDER=plausible, VITE_ANALYTICS_ID=mon-domaine.fr
// Umami     : VITE_ANALYTICS_PROVIDER=umami, VITE_ANALYTICS_ID=<website-id>, VITE_ANALYTICS_SRC=https://.../script.js
export const ANALYTICS = {
  provider: env.VITE_ANALYTICS_PROVIDER || null,
  id: env.VITE_ANALYTICS_ID || null,
  src:
    env.VITE_ANALYTICS_SRC ||
    (env.VITE_ANALYTICS_PROVIDER === "plausible" ? "https://plausible.io/js/script.js" : null),
};

export const analyticsEnabled = Boolean(ANALYTICS.provider && ANALYTICS.id && ANALYTICS.src);

// Configuration régie publicitaire Google AdSense (Vercel Production)
export const ADSENSE = {
  pubId: env.VITE_ADSENSE_PUB_ID || "ca-pub-4993578792461847",
};
