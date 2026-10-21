// Gestion des abonnements de streaming de l'utilisateur (France)
import { AFFILIATE } from "./site";

export const POPULAR_PROVIDERS = [
  { id: 8, name: "Netflix", color: "#E50914", logo: "/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
  { id: 381, name: "Canal+", color: "#1E1E1E", logo: "/t/p/original/12UeP5G8p37xK6Wp9i8Kk7G.jpg" },
  { id: 119, name: "Prime Video", color: "#00A8E1", logo: "/t/p/original/emthp39XA2zhzgTvILbg290zyav.jpg" },
  { id: 337, name: "Disney+", color: "#113CCF", logo: "/t/p/original/7rwgQI5a5BPco4YPRbBGGdHGKO1.jpg" },
  { id: 350, name: "Apple TV+", color: "#333333", logo: "/t/p/original/2E03zgIKaKNGgBP2j0VdUm0o856.jpg" },
  { id: 1899, name: "Max", color: "#002BE7", logo: "/t/p/original/fksCUZ9QDWZMUwL2LgfqR20.jpg" },
  { id: 531, name: "Paramount+", color: "#0064FF", logo: "/t/p/original/fi83B1oztoS47xxcemFdPMhIzK.jpg" },
  { id: 234, name: "Arte", color: "#FA4B1E", logo: "/t/p/original/f2nwbz76qA7Hk.jpg" },
  { id: 236, name: "France TV", color: "#0055A5", logo: "/t/p/original/q4q9b1o3z.jpg" },
];

const LS_KEY = "cv:my-providers";

export function getMyProviders() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [8, 119]; // Par défaut Netflix et Prime
    return JSON.parse(raw);
  } catch {
    return [8, 119];
  }
}

export function setMyProviders(ids) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("cv:providers-changed"));
  } catch {
    // ignore
  }
}

export function isSubscribed(providerId) {
  const list = getMyProviders();
  return list.includes(Number(providerId));
}

/**
 * Construit un lien direct vers la plateforme avec affiliation (Amazon Prime, Apple TV, etc.).
 * Si aucun partenaire spécifique n'est détecté, renvoie vers JustWatch.
 */
export function getProviderDirectUrl(provider, title, justWatchFallback) {
  const name = (provider?.provider_name || "").toLowerCase();
  const id = Number(provider?.provider_id);

  // Amazon Prime Video / Amazon Video (IDs: 119, 9, 10, etc.)
  if (id === 119 || id === 9 || id === 10 || name.includes("amazon") || name.includes("prime video")) {
    const tag = AFFILIATE.amazonTag ? `&tag=${encodeURIComponent(AFFILIATE.amazonTag)}` : "";
    return `https://www.amazon.fr/s?k=${encodeURIComponent(title)}&i=instant-video${tag}`;
  }

  // Apple TV / iTunes / Apple TV+ (IDs: 2, 350)
  if (id === 2 || id === 350 || name.includes("apple") || name.includes("itunes")) {
    const at = AFFILIATE.appleToken ? `&at=${encodeURIComponent(AFFILIATE.appleToken)}` : "";
    return `https://tv.apple.com/fr/search?term=${encodeURIComponent(title)}${at}`;
  }

  // Canal+ (ID: 381)
  if (id === 381 || name.includes("canal")) {
    return `https://www.canalplus.com/recherche/${encodeURIComponent(title)}`;
  }

  // Par défaut, lien JustWatch officiel
  return justWatchFallback || `https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(title)}`;
}
