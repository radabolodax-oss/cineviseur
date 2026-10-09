// Informations de l'éditeur et du déploiement, lues depuis les variables d'environnement (.env).
// Tant qu'une valeur n'est pas renseignée, la page légale affiche clairement « à compléter ».
const env = import.meta.env;

const todo = (label) => `[À compléter : ${label}]`;

export const SITE = {
  name: "CineViseur",
  url: (env.VITE_SITE_URL || "").replace(/\/$/, ""),
  editor: env.VITE_SITE_EDITOR || todo("nom ou raison sociale de l'éditeur"),
  editorAddress: env.VITE_SITE_ADDRESS || todo("adresse de l'éditeur"),
  contactEmail: env.VITE_CONTACT_EMAIL || todo("email de contact"),
  host: env.VITE_SITE_HOST || todo("hébergeur du site et de l'API (nom, adresse)"),
  lastLegalUpdate: "9 octobre 2026",
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
