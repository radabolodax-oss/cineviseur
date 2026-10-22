// Informations de l'éditeur et du déploiement, lues depuis les variables d'environnement (.env).
const env = import.meta.env;

// Contact légal obfusqué contre le moissonnage automatisé de spams
const defaultContact = typeof atob !== "undefined" ? atob("Y29udGFjdC5jaW5ldmlzZXVyQGdtYWlsLmNvbQ==") : "";

export const SITE = {
  name: "CineViseur",
  url: (env.VITE_SITE_URL || "https://cineviseur.vercel.app").replace(/\/$/, ""),
  editor: env.VITE_SITE_EDITOR || "CineViseur (Édition et développement indépendant)",
  editorAddress: env.VITE_SITE_ADDRESS || "France / Union Européenne",
  contactEmail: env.VITE_CONTACT_EMAIL || defaultContact,
  host: env.VITE_SITE_HOST || "Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  lastLegalUpdate: "22 octobre 2026",
};

// Mesure d'audience : désactivée tant que le fournisseur n'est pas configuré.
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

// Liens partenaires et affiliation (Prime Video, Apple TV, Amazon, VPN, Soutien)
export const AFFILIATE = {
  amazonTag: env.VITE_AMAZON_AFFILIATE_TAG || "cineviseur-21",
  appleToken: env.VITE_APPLE_AFFILIATE_TOKEN || "",
  kofiUrl: env.VITE_KOFI_URL || "https://ko-fi.com/cineviseur",
  vpnUrl: env.VITE_VPN_AFFILIATE_URL || "https://nordvpn.com/fr/special-offer/?utm_medium=affiliate&utm_source=cineviseur",
};
