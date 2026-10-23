// Gestion des abonnements de streaming et liens directs vers les plateformes (France)
import { AFFILIATE } from "./site.js";

export const POPULAR_PROVIDERS = [
  { id: 8, name: "Netflix", color: "#E50914", logo: "/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
  { id: 381, name: "Canal+", color: "#1E1E1E", logo: "/t/p/original/12UeP5G8p37xK6Wp9i8Kk7G.jpg" },
  { id: 119, name: "Prime Video", color: "#00A8E1", logo: "/t/p/original/emthp39XA2zhzgTvILbg290zyav.jpg" },
  { id: 337, name: "Disney+", color: "#113CCF", logo: "/t/p/original/7rwgQI5a5BPco4YPRbBGGdHGKO1.jpg" },
  { id: 283, name: "Crunchyroll", color: "#F47521", logo: "/t/p/original/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png" },
  { id: 415, name: "ADN", color: "#008CD2", logo: "/t/p/original/lqW5wpRdZQrAPiHv1nZo3j8t4BW.png" },
  { id: 1899, name: "Max", color: "#002BE7", logo: "/t/p/original/fksCUZ9QDWZMUwL2LgfqR20.jpg" },
  { id: 350, name: "Apple TV+", color: "#333333", logo: "/t/p/original/2E03zgIKaKNGgBP2j0VdUm0o856.jpg" },
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

  // 3. Netflix (ID: 8, 1796)
  if (id === 8 || id === 1796 || name.includes("netflix")) {
    return `https://www.netflix.com/search?q=${encodedTitle}`;
  }

  // 4. Crunchyroll (ID: 283, 1968)
  if (id === 283 || id === 1968 || name.includes("crunchyroll")) {
    return `https://www.crunchyroll.com/fr/search?q=${encodedTitle}`;
  }

  // 5. ADN - Animation Digital Network (ID: 415, 2173)
  if (id === 415 || id === 2173 || name.includes("animation digital network") || name.includes("adn")) {
    return `https://animationdigitalnetwork.fr/video?search=${encodedTitle}`;
  }

  // 6. Google Play Films / Google TV (ID: 3)
  if (id === 3 || name.includes("google play") || name.includes("google tv")) {
    return `https://play.google.com/store/search?q=${encodedTitle}&c=movies`;
  }

  // 7. YouTube VOD / Films (ID: 192)
  if (id === 192 || name.includes("youtube")) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle + " film")}`;
  }

  // 8. France TV / France.tv Slash (ID: 236)
  if (id === 236 || name.includes("france tv") || name.includes("france.tv")) {
    return `https://www.france.tv/recherche/?q=${encodedTitle}`;
  }

  // 9. TF1+ (ID: 1754)
  if (id === 1754 || name.includes("tf1")) {
    return `https://www.tf1.fr/recherche?q=${encodedTitle}`;
  }

  // 10. M6+ / 6play (ID: 147)
  if (id === 147 || name.includes("m6") || name.includes("6play")) {
    return `https://www.6play.fr/recherche?q=${encodedTitle}`;
  }

  // 11. Arte (ID: 234)
  if (id === 234 || name.includes("arte")) {
    return `https://www.arte.tv/fr/search/?q=${encodedTitle}`;
  }

  // 12. Rakuten TV (ID: 35)
  if (id === 35 || name.includes("rakuten")) {
    return `https://www.rakuten.tv/fr/search?q=${encodedTitle}`;
  }

  // 13. Canal+ / Canal+ Séries / myCANAL / Ciné+ (IDs: 381, 345, 608, etc.)
  // Canal+ bloque les URLs directes /recherche/ avec 403. La recherche ciblée Watch ouvre la bonne fiche directement.
  if (id === 381 || id === 345 || name.includes("canal") || name.includes("mycanal") || name.includes("ciné+")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming myCANAL Canal+`)}`;
  }

  // 14. Disney+ (ID: 337)
  if (id === 337 || name.includes("disney")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming Disney+`)}`;
  }

  // 15. Max / HBO Max (ID: 1899)
  if (id === 1899 || name.includes("max") || name.includes("hbo")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming Max HBO`)}`;
  }

  // 16. Paramount+ (ID: 531)
  if (id === 531 || name.includes("paramount")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming Paramount+`)}`;
  }

  // 17. OCS (ID: 56)
  if (id === 56 || name.includes("ocs")) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming OCS`)}`;
  }

  // 18. Tout autre diffuseur (UniversCiné, LaCinetek, Filmo...)
  const providerLabel = provider?.provider_name || "streaming";
  return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} regarder streaming ${providerLabel}`)}`;
}

// --- NORMALISATION ET VALIDATION DES FOURNISSEURS (FRANCE) ---

export const DISNEY_ANIME_IDS = new Set([
  30984,  // Bleach
  209867, // Bleach TYBW
  105009, // Tokyo Revengers
  117933, // Summer Time Rendering
  208891, // Tengoku Daimakyo (Heavenly Delusion)
  209077, // Undead Unluck
  240498, // Sand Land: The Series
  231575, // The Fable
  217684, // Go! Go! Loser Ranger! (Ranger Reject)
  228080, // Murai in Love
  114461, // Star Wars: Visions
  215437, // Phoenix: Eden17
  133748, // Black Rock Shooter: Dawn Fall
  135402, // Tatami Time Machine Blues
  210879, // Synduality: Noir
  220970, // Ishura
  252974, // Code Geass: Rozé of the Recapture
  255299, // Medaka Kuroiwa is Impervious to My Charms
  258849, // Cat's Eye (2025)
]);

export const DISNEY_ANIME_TITLE_REGEX =
  /bleach|tokyo revengers|summer time rendering|time shadows|tengoku daimakyo|heavenly delusion|undead unluck|sand land|the fable|loser ranger|ranger reject|murai in love|visions|eden17|black rock shooter|tatami time|synduality|ishura|rozé of the recapture|macross|cat's eye/i;

export function isDisneyAnime(id, title, originalTitle) {
  if (id && DISNEY_ANIME_IDS.has(Number(id))) return true;
  const str = `${title || ""} ${originalTitle || ""}`.toLowerCase();
  return DISNEY_ANIME_TITLE_REGEX.test(str);
}

export function isJapaneseAnime(item) {
  if (!item) return false;
  const genres = item.genres || [];
  const genreIds = item.genre_ids || genres.map((g) => g.id);
  const isAnim = genreIds.includes(16);
  if (!isAnim) return false;
  const countries = item.origin_country || [];
  const lang = item.original_language;
  return countries.includes("JP") || lang === "ja";
}

const CANONICAL_PROVIDERS = {
  8: { id: 8, name: "Netflix", logo_path: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
  1796: { id: 8, name: "Netflix", logo_path: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" }, // Netflix Standard avec pub -> Netflix
  119: { id: 119, name: "Prime Video", logo_path: "/emthp39XA2zhzgTvILbg290zyav.jpg" },
  2100: { id: 119, name: "Prime Video", logo_path: "/emthp39XA2zhzgTvILbg290zyav.jpg" }, // Prime avec pub -> Prime
  9: { id: 119, name: "Prime Video", logo_path: "/emthp39XA2zhzgTvILbg290zyav.jpg" },
  10: { id: 119, name: "Prime Video", logo_path: "/emthp39XA2zhzgTvILbg290zyav.jpg" },
  337: { id: 337, name: "Disney+", logo_path: "/7rwgQI5a5BPco4YPRbBGGdHGKO1.jpg" },
  381: { id: 381, name: "Canal+", logo_path: "/12UeP5G8p37xK6Wp9i8Kk7G.jpg" },
  345: { id: 381, name: "Canal+", logo_path: "/12UeP5G8p37xK6Wp9i8Kk7G.jpg" },
  685: { id: 381, name: "Canal+", logo_path: "/12UeP5G8p37xK6Wp9i8Kk7G.jpg" }, // Ciné+ OCS Amazon Channel -> Canal+
  283: { id: 283, name: "Crunchyroll", logo_path: "/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png" },
  1968: { id: 283, name: "Crunchyroll", logo_path: "/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png" }, // Crunchyroll Amazon Channel -> Crunchyroll
  415: { id: 415, name: "ADN", logo_path: "/lqW5wpRdZQrAPiHv1nZo3j8t4BW.png" },
  2173: { id: 415, name: "ADN", logo_path: "/lqW5wpRdZQrAPiHv1nZo3j8t4BW.png" }, // ADN Amazon Channel -> ADN
  1899: { id: 1899, name: "Max", logo_path: "/fksCUZ9QDWZMUwL2LgfqR20.jpg" },
  1825: { id: 1899, name: "Max", logo_path: "/fksCUZ9QDWZMUwL2LgfqR20.jpg" }, // HBO Max Amazon Channel -> Max
  531: { id: 531, name: "Paramount+", logo_path: "/fi83B1oztoS47xxcemFdPMhIzK.jpg" },
  582: { id: 531, name: "Paramount+", logo_path: "/fi83B1oztoS47xxcemFdPMhIzK.jpg" }, // Paramount+ Amazon Channel -> Paramount+
  1853: { id: 531, name: "Paramount+", logo_path: "/fi83B1oztoS47xxcemFdPMhIzK.jpg" },
  234: { id: 234, name: "Arte", logo_path: "/f2nwbz76qA7Hk.jpg" },
  236: { id: 236, name: "France TV", logo_path: "/q4q9b1o3z.jpg" },
  2535: { id: 236, name: "France TV", logo_path: "/q4q9b1o3z.jpg" }, // France TV Amazon Channel -> France TV
  1754: { id: 1754, name: "TF1+", logo_path: "/e146YwVd5k5yQ5k5y.png" },
  2615: { id: 1754, name: "TF1+", logo_path: "/e146YwVd5k5yQ5k5y.png" }, // TFOU Max Amazon Channel -> TF1+
  147: { id: 147, name: "M6+", logo_path: "/m6plus.png" },
  2672: { id: 147, name: "M6+", logo_path: "/m6plus.png" }, // M6plus Amazon Channel -> M6+
  2: { id: 2, name: "Apple TV", logo_path: "/2E03zgIKaKNGgBP2j0VdUm0o856.jpg" },
  350: { id: 350, name: "Apple TV+", logo_path: "/2E03zgIKaKNGgBP2j0VdUm0o856.jpg" },
  2243: { id: 350, name: "Apple TV+", logo_path: "/2E03zgIKaKNGgBP2j0VdUm0o856.jpg" },
};

const IGNORED_PROVIDER_IDS = new Set([
  193,  // SFR Play (service définitivement arrêté)
  1967, // Molotov TV (pas de catalogue SVOD direct)
]);

/**
 * Nettoie, vérifie et certifie la liste des diffuseurs français :
 * - Supprime les faux positifs Disney+ sur les animes japonais (ex. Jujutsu Kaisen, One Piece, L'Attaque des Titans, Naruto)
 * - Restaure Disney+ sur les animes officiellement exclusifs Disney+ (Bleach TYBW, Tokyo Revengers, Summer Time Rendering...)
 * - Respecte la chronologie des médias en France (les films récents en salle < 17 mois ne sont pas en SVOD sur Disney+/Max)
 * - Élimine les doublons de canaux Amazon ("Crunchyroll Amazon Channel", "ADN Amazon Channel"...)
 * - Masque les titres non encore sortis (date future)
 */
export function sanitizeProviders(item, rawProviders, mediaType) {
  if (!item) return null;
  const safeProviders = rawProviders || {};
  const title = item.title || item.name || "";
  const originalTitle = item.original_title || item.original_name || "";
  const releaseDateStr = item.release_date || item.first_air_date;
  const releaseDate = releaseDateStr ? new Date(releaseDateStr) : null;
  const isFuture = releaseDate && releaseDate > new Date();

  // 1. Film ou série non sorti : aucun abonnement SVOD ni VOD active
  if (isFuture) {
    return { flatrate: [], rent: [], buy: [], free: [], ads: [] };
  }

  const isAnime = isJapaneseAnime(item);
  const isDisneyExclusiveAnime = isAnime && isDisneyAnime(item.id, title, originalTitle);

  // 2. Chronologie des médias pour les films de cinéma en France :
  // En France, un film sorti en salle ne peut PAS être disponible sur Disney+, Max ou Prime en SVOD avant 17 mois (510 jours).
  const isRecentFrenchTheatrical =
    mediaType === "movie" &&
    releaseDate &&
    Date.now() - releaseDate.getTime() < 510 * 86400000;

  // Détection film Warner Bros / New Line (ex: Le Seigneur des Anneaux) faussement rattaché à Disney+
  const isLordOfTheRings = /seigneur des anneaux|lord of the rings/i.test(`${title} ${originalTitle}`);

  const cleanGroup = (list, groupKey) => {
    const safeList = Array.isArray(list) ? list : [];
    const seen = new Set();
    const result = [];

    for (const p of safeList) {
      const pid = Number(p.provider_id);
      if (IGNORED_PROVIDER_IDS.has(pid)) continue;

      const pName = (p.provider_name || "").toLowerCase();
      const isDisneyProvider = pid === 337 || pName.includes("disney");

      // Faux positif Disney+ sur anime non-Disney
      if (groupKey === "flatrate" && isAnime && isDisneyProvider && !isDisneyExclusiveAnime) {
        continue;
      }

      // Bleach TYBW : exclusif Disney+ en France (TMDB retourne Netflix & Crunchyroll à tort)
      if (Number(item.id) === 209867 && (pid === 8 || pid === 283 || pid === 1796 || pid === 1968)) {
        continue;
      }

      // Chronologie des médias : films récents au ciné ne peuvent être sur Disney+ ou Max en SVOD
      if (groupKey === "flatrate" && isRecentFrenchTheatrical && (isDisneyProvider || pid === 1899)) {
        continue;
      }

      // Faux positif Disney+ sur Le Seigneur des Anneaux (Warner Bros)
      if (groupKey === "flatrate" && isLordOfTheRings && isDisneyProvider) {
        continue;
      }

      const canonical = CANONICAL_PROVIDERS[pid] || {
        id: pid,
        name: p.provider_name,
        logo_path: p.logo_path,
      };

      if (!seen.has(canonical.id)) {
        seen.add(canonical.id);
        result.push({
          provider_id: canonical.id,
          provider_name: canonical.name,
          logo_path: canonical.logo_path || p.logo_path,
        });
      }
    }

    // Ré-injection garantie de Disney+ pour les animes officiellement exclusifs Disney+
    if (groupKey === "flatrate" && isDisneyExclusiveAnime && !seen.has(337)) {
      result.unshift({
        provider_id: 337,
        provider_name: "Disney+",
        logo_path: "/7rwgQI5a5BPco4YPRbBGGdHGKO1.jpg",
      });
    }

    return result;
  };

  return {
    flatrate: cleanGroup(safeProviders.flatrate, "flatrate"),
    rent: cleanGroup(safeProviders.rent, "rent"),
    buy: cleanGroup(safeProviders.buy, "buy"),
    free: cleanGroup(safeProviders.free, "free"),
    ads: cleanGroup(safeProviders.ads, "ads"),
  };
}
