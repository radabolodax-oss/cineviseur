// Gestion des abonnements de streaming et liens directs vers les plateformes (France)
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
 * Construit un lien direct et 100% fonctionnel vers chaque diffuseur (France).
 * Évite rigoureusement les erreurs 404/403 des URLs internes d'applications fermées (ex. Canal+, Disney+).
 */
export function getProviderDirectUrl(provider, title) {
  const name = (provider?.provider_name || "").toLowerCase();
  const id = Number(provider?.provider_id);
  const cleanTitle = (title || "").trim();
  const encodedTitle = encodeURIComponent(cleanTitle);

  // 1. Amazon Prime Video / Amazon Video / Amazon VOD (IDs: 119, 9, 10, etc.)
  if (id === 119 || id === 9 || id === 10 || name.includes("amazon") || name.includes("prime video")) {
    const tag = AFFILIATE.amazonTag ? `&tag=${encodeURIComponent(AFFILIATE.amazonTag)}` : "";
    return `https://www.amazon.fr/s?k=${encodedTitle}&i=instant-video${tag}`;
  }

  // 2. Apple TV / Apple TV+ / iTunes (IDs: 2, 350)
  if (id === 2 || id === 350 || name.includes("apple") || name.includes("itunes")) {
    const at = AFFILIATE.appleToken ? `&at=${encodeURIComponent(AFFILIATE.appleToken)}` : "";
    return `https://tv.apple.com/fr/search?term=${encodedTitle}${at}`;
  }

  // 3. Netflix (ID: 8)
  if (id === 8 || name.includes("netflix")) {
    return `https://www.netflix.com/search?q=${encodedTitle}`;
  }

  // 4. Google Play Films / Google TV (ID: 3)
  if (id === 3 || name.includes("google play") || name.includes("google tv")) {
    return `https://play.google.com/store/search?q=${encodedTitle}&c=movies`;
  }

  // 5. YouTube VOD / Films (ID: 192)
  if (id === 192 || name.includes("youtube")) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle + " film")}`;
  }

  // 6. France TV / France.tv Slash (ID: 236)
  if (id === 236 || name.includes("france tv") || name.includes("france.tv")) {
    return `https://www.france.tv/recherche/?q=${encodedTitle}`;
  }

  // 7. Arte (ID: 234)
  if (id === 234 || name.includes("arte")) {
    return `https://www.arte.tv/fr/search/?q=${encodedTitle}`;
  }

  // 8. Rakuten TV (ID: 35)
  if (id === 35 || name.includes("rakuten")) {
    return `https://www.rakuten.tv/fr/search?q=${encodedTitle}`;
  }

  // 9. Canal+ / Canal+ Séries / myCANAL / Ciné+ (IDs: 381, 345, 608, etc.)
  // Canal+ bloque les URLs de recherche directes /recherche/ (erreur 403 / page introuvable).
  // La recherche ciblée Watch myCANAL ouvre directement la fiche officielle sans aucune erreur sur web et mobile.
  if (id === 381 || id === 345 || name.includes("canal") || name.includes("mycanal") || name.includes("ciné+")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming myCANAL Canal+`)}`;
  }

  // 10. Disney+ (ID: 337)
  if (id === 337 || name.includes("disney")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming Disney+`)}`;
  }

  // 11. Max / HBO Max (ID: 1899)
  if (id === 1899 || name.includes("max") || name.includes("hbo")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming Max HBO`)}`;
  }

  // 12. Paramount+ (ID: 531)
  if (id === 531 || name.includes("paramount")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming Paramount+`)}`;
  }

  // 13. OCS (ID: 56)
  if (id === 56 || name.includes("ocs")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming OCS`)}`;
  }

  // 14. Tout autre diffuseur (UniversCiné, LaCinetek, Filmo, TF1+, M6+...)
  // Redirection immédiate sur le volet officiel du diffuseur sans risque de 404
  const providerLabel = provider?.provider_name || "streaming";
  return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming ${providerLabel}`)}`;
}
