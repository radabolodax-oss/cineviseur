// Fonction serverless Vercel Node.js : gère /api/tmdb/*, /api/cinemas/*, /api/duo/*, /api/contact et /api/health
import crypto from "node:crypto";

// Store des salons Duo en mémoire globale serverless
const DUO_ROOMS = (globalThis.__CV_DUO_ROOMS = globalThis.__CV_DUO_ROOMS || new Map());

// Rate limit anti-flood pour le formulaire de contact (UE, sécurisé)
const CONTACT_LIMITS = (globalThis.__CV_CONTACT_LIMITS = globalThis.__CV_CONTACT_LIMITS || new Map());

function cleanContactLimits() {
  const now = Date.now();
  for (const [ip, item] of CONTACT_LIMITS.entries()) {
    if (now > item.resetAt) {
      CONTACT_LIMITS.delete(ip);
    }
  }
}

// Codes de salons Duo : 6 caractères alphanumériques non ambigus (évite I, 1, O, 0)
const DUO_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateSecureDuoCode() {
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += DUO_CODE_CHARS[bytes[i] % DUO_CODE_CHARS.length];
  }
  return code;
}

function cleanOldRooms() {
  const now = Date.now();
  // Expiration automatique des salons après 2 heures (au lieu de 24h)
  for (const [code, r] of DUO_ROOMS.entries()) {
    if (now - r.created_at > 2 * 60 * 60 * 1000) {
      DUO_ROOMS.delete(code);
    }
  }
}

async function getJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// La clé TMDB est un secret de déploiement : elle ne doit jamais être écrite dans le dépôt.
// Sans elle, on échoue avec un message explicite plutôt que de retomber sur une clé partagée.
class MissingTmdbKeyError extends Error {
  constructor() {
    super(
      "TMDB_API_KEY manquante : ajoute cette variable d'environnement dans les réglages du projet (Vercel → Settings → Environment Variables), puis redéploie."
    );
    this.code = "TMDB_KEY_MISSING";
  }
}

function tmdbApiKey() {
  const key = (process.env.TMDB_API_KEY || "").trim();
  if (!key) throw new MissingTmdbKeyError();
  return key;
}

const SORT_FIELDS = {
  movie: {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    date: "release_date.desc",
    title: "original_title.asc",
  },
  tv: {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    date: "first_air_date.desc",
    title: "original_name.asc",
  },
};

const LISTS = {
  now_playing: "/movie/now_playing",
  upcoming: "/movie/upcoming",
};

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

const CHAINS = [
  [/path[ée]|gaumont/i, "Pathé", "https://www.pathe.fr/cinemas", ["Dolby Cinema", "IMAX", "4DX", "ScreenX", "3D"]],
  [/\bugc\b/i, "UGC", "https://www.ugc.fr/cinemas.html", ["IMAX", "4DX", "3D"]],
  [/\bcgr\b/i, "CGR", "https://www.cgrcinemas.fr/", ["ICE", "3D"]],
  [/kin[ée]polis/i, "Kinepolis", "https://kinepolis.fr/", ["Laser ULTRA", "4DX", "ScreenX", "IMAX", "3D"]],
  [/m[ée]garama/i, "Mégarama", "https://www.megarama.fr/", ["IMAX", "3D"]],
  [/\bmk2\b/i, "MK2", "https://www.mk2.com/salles", ["VO"]],
  [/cin[ée]ville/i, "Cinéville", "https://www.cineville.fr/", ["3D"]],
  [/cin[ée]max|grand rex/i, null, null, ["IMAX"]],
];

const OSM_FORMAT_TAGS = {
  "cinema:3D": "3D",
  "cinema:imax": "IMAX",
  "cinema:4dx": "4DX",
  "cinema:dolby_atmos": "Dolby Atmos",
  "cinema:screenx": "ScreenX",
};

// Catalogue officiel des animes licenciés sur Disney+ en France
const DISNEY_ANIME_IDS = new Set([
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
  258849, // Cat's Eye
]);

const DISNEY_ANIME_TITLE_REGEX =
  /bleach|tokyo revengers|summer time rendering|time shadows|tengoku daimakyo|heavenly delusion|undead unluck|sand land|the fable|loser ranger|ranger reject|murai in love|visions|eden17|black rock shooter|tatami time|synduality|ishura|rozé of the recapture|macross|cat's eye/i;

function isDisneyAnime(id, title, originalTitle) {
  if (id && DISNEY_ANIME_IDS.has(Number(id))) return true;
  const str = `${title || ""} ${originalTitle || ""}`.toLowerCase();
  return DISNEY_ANIME_TITLE_REGEX.test(str);
}

const DISNEY_DIRECT_ORIGINAL_REGEX =
  /soul|luca|turning red|alerte rouge|peter pan & wendy|hocus pocus 2|pinocchio|disenchanted|il était une fois 2|hamilton|taylor swift/i;

function isDisneyDirectOriginal(id, title, originalTitle) {
  const str = `${title || ""} ${originalTitle || ""}`.toLowerCase();
  return DISNEY_DIRECT_ORIGINAL_REGEX.test(str);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dp = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function detectFormats(tags) {
  const exact = Object.entries(OSM_FORMAT_TAGS)
    .filter(([key]) => tags[key] === "yes" || tags[key] === "true")
    .map(([, label]) => label);
  const label = [tags.brand, tags.operator, tags.name].filter(Boolean).join(" ");
  for (const [pattern, brand, site, formats] of CHAINS) {
    if (pattern.test(label)) {
      if (exact.length) return [exact, brand, site, "osm"];
      return [formats, brand, site, "reseau"];
    }
  }
  return [exact, tags.brand || null, null, exact.length ? "osm" : "inconnu"];
}

async function tmdbGet(tmdbPath, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${tmdbPath}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("api_key", tmdbApiKey());

  const resp = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!resp.ok) {
    return { status: resp.status, data: { detail: "Erreur TMDB" } };
  }
  const data = await resp.json();
  return { status: 200, data, cacheControl: "public, max-age=300" };
}

export default async function handler(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const q = parsedUrl.searchParams;
    const path = parsedUrl.pathname.replace(/\/+$/, "");

    // Restriction CORS ciblée (remplace le joker *)
    const reqOrigin = req.headers.origin || "";
    const allowedOrigins = [
      "https://cineviseur.vercel.app",
      "https://cineviseur.fr",
      "http://localhost:5173",
      "http://localhost:3000",
    ];
    if (allowedOrigins.includes(reqOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", reqOrigin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "https://cineviseur.vercel.app");
    }
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (path === "/api/health") {
      return res.status(200).json({ status: "ok", mode: "vercel" });
    }

    // --- Route Contact Sécurisée UE (Souveraine, anti-spam, sans tiers US, rate-limit par hash IP) ---
    if (path === "/api/contact" && req.method === "POST") {
      cleanContactLimits();
      const rawIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1").split(",")[0].trim();
      const ipHash = crypto.createHash("sha256").update(rawIp + "cv-rate-salt").digest("hex").slice(0, 16);
      const now = Date.now();
      const limit = CONTACT_LIMITS.get(ipHash) || { attempts: 0, resetAt: now + 15 * 60 * 1000 };

      // Comptage immédiat de toute tentative (valide ou invalide) pour neutraliser le brute-force
      limit.attempts++;
      CONTACT_LIMITS.set(ipHash, limit);

      const remaining = Math.max(0, 5 - limit.attempts);
      res.setHeader("X-RateLimit-Limit", "5");
      res.setHeader("X-RateLimit-Remaining", String(remaining));

      if (limit.attempts > 5) {
        const retryAfterSeconds = Math.max(1, Math.ceil((limit.resetAt - now) / 1000));
        res.setHeader("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({
          error: "Too Many Requests",
          detail: "Trop de tentatives. Veuillez patienter 15 minutes avant de réessayer.",
          retryAfter: retryAfterSeconds,
        });
      }

      const body = await getJsonBody(req);
      const { name, email, subject, message, honeypot_website, honeypot_phone, math_answer, math_expected } = body;

      // Piège honeypot anti-bots
      if (honeypot_website || honeypot_phone) {
        return res.status(200).json({ ok: true, message: "Message transmis." });
      }

      // Vérification calcul de sécurité
      if (Number(math_answer) !== Number(math_expected)) {
        return res.status(400).json({ detail: "Le calcul anti-robot est incorrect." });
      }

      // Validations
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ detail: "Nom requis (au moins 2 caractères)." });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(String(email).trim())) {
        return res.status(400).json({ detail: "Adresse email invalide." });
      }
      if (!message || typeof message !== "string" || message.trim().length < 15 || message.length > 3000) {
        return res.status(400).json({ detail: "Message trop court (min 15) ou trop long (max 3000 caractères)." });
      }

      const spamWords = ["crypto bonus", "viagra", "seo ranking", "telegram @", "whatsapp +", "backlink"];
      const lower = message.toLowerCase();
      if (spamWords.some((w) => lower.includes(w))) {
        return res.status(400).json({ detail: "Message identifié comme indésirable." });
      }

      // Traitement réussi et consigné en toute confidentialité sur l'infrastructure UE
      console.log(`[Contact CineViseur] De: ${name.trim()} <${email.trim()}> | Sujet: ${subject || "Sans objet"}`);

      return res.status(200).json({
        ok: true,
        message: "Votre message a bien été envoyé à l'équipe CineViseur.",
      });
    }

    // --- Routes TMDB ---
    if (path === "/api/tmdb/trending") {
      const lang = q.get("lang") || "fr";
      const mediaType = /^(all|movie|tv)$/.test(q.get("media_type") || "all") ? q.get("media_type") || "all" : "all";
      const window = /^(day|week)$/.test(q.get("window") || "week") ? q.get("window") || "week" : "week";
      const result = await tmdbGet(`/trending/${mediaType}/${window}`, { language: lang });
      if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
      return res.status(result.status).json(result.data);
    }

    if (path === "/api/tmdb/genres") {
      const mediaType = q.get("media_type") === "tv" ? "tv" : "movie";
      const lang = q.get("lang") || "fr";
      const result = await tmdbGet(`/genre/${mediaType}/list`, { language: lang });
      if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
      return res.status(result.status).json(result.data);
    }

    if (path === "/api/tmdb/discover") {
      const mediaType = q.get("media_type") === "tv" ? "tv" : "movie";
      const lang = q.get("lang") || "fr";
      const page = Math.min(500, Math.max(1, Number(q.get("page") || 1)));
      const sort = q.get("sort") || "popularity";
      const sortBy = SORT_FIELDS[mediaType]?.[sort] || "popularity.desc";
      const params = { language: lang, sort_by: sortBy, page };
      if (q.get("genre")) params.with_genres = q.get("genre");
      if (q.get("min_rating")) {
        params["vote_average.gte"] = q.get("min_rating");
        params["vote_count.gte"] = 50;
      }
      if (sort === "rating") params["vote_count.gte"] = 50;
      if (q.get("year")) {
        params[mediaType === "movie" ? "primary_release_year" : "first_air_date_year"] = q.get("year");
      }
      const provider = q.get("provider");
      if (provider) {
        params.with_watch_providers = provider;
        params.watch_region = "FR";
        params.with_watch_monetization_types = "flatrate";
      }
      const result = await tmdbGet(`/discover/${mediaType}`, params);

      // Filtrage de cohérence territoriale (France) pour éliminer les faux positifs TMDB/JustWatch
      if (result.status === 200 && Array.isArray(result.data?.results)) {
        const now = new Date();
        result.data.results = result.data.results.filter((r) => {
          const dateStr = r.release_date || r.first_air_date;
          if (dateStr && new Date(dateStr) > now) return false;

          if (provider === "337") {
            const title = r.title || r.name || "";
            const orig = r.original_title || r.original_name || "";

            // Le Seigneur des Anneaux n'est pas sur Disney+
            if (/seigneur des anneaux|lord of the rings/i.test(`${title} ${orig}`)) return false;

            // Animes japonais : seuls les animes officiellement acquis par Disney en France sont gardés
            const isAnime =
              (r.genre_ids || []).includes(16) &&
              ((r.origin_country || []).includes("JP") || r.original_language === "ja");
            if (isAnime && !isDisneyAnime(r.id, title, orig)) return false;

            // Chronologie des médias : films de cinéma < 17 mois (510 jours)
            if (mediaType === "movie" && dateStr) {
              const diffDays = (now.getTime() - new Date(dateStr).getTime()) / 86400000;
              if (diffDays < 510 && !isDisneyDirectOriginal(r.id, title, orig)) return false;
            }
          }

          return true;
        });
      }

      if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
      return res.status(result.status).json(result.data);
    }

    const listMatch = path.match(/^\/api\/tmdb\/lists\/([a-z_]+)$/);
    if (listMatch) {
      const kind = listMatch[1];
      const lang = q.get("lang") || "fr";
      const page = Math.min(500, Math.max(1, Number(q.get("page") || 1)));
      if (LISTS[kind]) {
        const result = await tmdbGet(LISTS[kind], { language: lang, region: "FR", page });
        if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
        return res.status(result.status).json(result.data);
      }
      if (kind === "streaming" || kind === "vod_releases") {
        const result = await tmdbGet("/discover/movie", {
          language: lang,
          page,
          watch_region: "FR",
          with_watch_monetization_types: "flatrate|rent|buy",
          sort_by: "popularity.desc",
        });
        if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
        return res.status(result.status).json(result.data);
      }
      return res.status(400).json({ detail: "kind invalide" });
    }

    if (path === "/api/tmdb/search") {
      const query = (q.get("query") || "").slice(0, 200);
      const lang = q.get("lang") || "fr";
      const page = Math.min(500, Math.max(1, Number(q.get("page") || 1)));
      const result = await tmdbGet("/search/multi", { language: lang, query, page });
      if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
      return res.status(result.status).json(result.data);
    }

    const personMatch = path.match(/^\/api\/tmdb\/person\/(\d+)$/);
    if (personMatch) {
      const lang = q.get("lang") || "fr";
      const result = await tmdbGet(`/person/${personMatch[1]}`, {
        language: lang,
        append_to_response: "combined_credits",
      });
      if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
      return res.status(result.status).json(result.data);
    }

    const seasonMatch = path.match(/^\/api\/tmdb\/tv\/(\d+)\/season\/(\d+)$/);
    if (seasonMatch) {
      const [, tvId, seasonNum] = seasonMatch;
      const lang = q.get("lang") || "fr";
      const result = await tmdbGet(`/tv/${tvId}/season/${seasonNum}`, { language: lang });
      if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
      return res.status(result.status).json(result.data);
    }

    const detailMatch = path.match(/^\/api\/tmdb\/(movie|tv)\/(\d+)$/);
    if (detailMatch) {
      const [, mediaType, mediaId] = detailMatch;
      const lang = q.get("lang") || "fr";
      const result = await tmdbGet(`/${mediaType}/${mediaId}`, {
        language: lang,
        append_to_response: `credits,videos,similar,watch/providers${mediaType === "movie" ? ",release_dates" : ""}`,
      });
      if (result.cacheControl) res.setHeader("Cache-Control", result.cacheControl);
      return res.status(result.status).json(result.data);
    }

    // --- Route Cinémas proches (Overpass OpenStreetMap) ---
    if (path === "/api/cinemas/nearby") {
      const lat = Number(q.get("lat"));
      const lon = Number(q.get("lon"));
      const radiusKm = Math.min(50, Math.max(1, Number(q.get("radius_km") || 20)));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ detail: "Coordonnées invalides" });
      }
      const radiusM = Math.round(radiusKm * 1000);
      const queries = [
        `[out:json][timeout:25];nwr["amenity"="cinema"](around:${radiusM},${lat},${lon});out center tags;`,
        `[out:json][timeout:20];node["amenity"="cinema"](around:${radiusM},${lat},${lon});out body;`,
      ];

      let data = null;
      for (const query of queries) {
        for (const overpassUrl of OVERPASS_URLS) {
          try {
            const resp = await fetch(overpassUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "CineViseur/1.0 (recherche de cinemas proches)",
              },
              body: new URLSearchParams({ data: query }).toString(),
            });
            if (resp.ok) {
              data = await resp.json();
              break;
            }
          } catch {
            // Essayer le miroir suivant
          }
        }
        if (data) break;
      }

      if (!data) {
        return res.status(502).json({ detail: "Erreur du service de cinémas" });
      }

      const cinemas = [];
      const seen = new Set();
      for (const el of data.elements || []) {
        const tags = el.tags || {};
        const name = (tags.name || "").trim();
        if (!name) continue;

        const clat = el.lat !== undefined ? el.lat : el.center?.lat;
        const clon = el.lon !== undefined ? el.lon : el.center?.lon;
        if (clat === undefined || clon === undefined) continue;

        const dedupeKey = `${name.toLowerCase()}:${Math.round(clat * 100)}:${Math.round(clon * 100)}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const [formats, brand, chainSite, source] = detectFormats(tags);
        const streetLine = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
        const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || null;
        const website = tags.website || tags["contact:website"] || null;

        cinemas.push({
          id: `${el.type || "node"}-${el.id}`,
          name,
          brand,
          address: [streetLine, city].filter(Boolean).join(", ") || null,
          lat: clat,
          lon: clon,
          distance_km: Math.round(haversineKm(lat, lon, clat, clon) * 10) / 10,
          screens: tags.screen || tags.screens || null,
          formats,
          formats_source: source,
          showtimes_url:
            website ||
            chainSite ||
            `https://www.google.com/search?q=${encodeURIComponent(`${name} ${city || ""} séances`.trim())}`,
        });
      }

      cinemas.sort((a, b) => a.distance_km - b.distance_km);
      res.setHeader("Cache-Control", "public, max-age=600");
      return res.status(200).json({ cinemas: cinemas.slice(0, 20) });
    }

    // --- Routes Soirée Duo (Matchmaking 2 personnes) ---
    if (path === "/api/duo/create" && req.method === "POST") {
      cleanOldRooms();
      const body = await getJsonBody(req);
      const code = generateSecureDuoCode();
      const deck = Array.isArray(body.deck) ? body.deck.slice(0, 40) : [];
      const room = {
        code,
        created_at: Date.now(),
        host_name: body.host_name || "Hôte",
        guest_name: null,
        guest_connected: false,
        deck,
        host_likes: new Set(),
        host_dislikes: new Set(),
        guest_likes: new Set(),
        guest_dislikes: new Set(),
        matches: [],
      };
      DUO_ROOMS.set(code, room);
      return res.status(200).json({ code, host_name: room.host_name, deck_length: deck.length });
    }

    if (path === "/api/duo/join" && req.method === "POST") {
      cleanOldRooms();
      const body = await getJsonBody(req);
      const code = String(body.code || "").trim().toUpperCase();
      let room = DUO_ROOMS.get(code);

      // Auto-création / ré-hydratation du salon si la lambda Vercel a redémarré
      if (!room) {
        const deck = Array.isArray(body.deck) ? body.deck.slice(0, 40) : [];
        const hostLikes = Array.isArray(body.host_likes) ? body.host_likes.map(Number) : [];
        room = {
          code,
          created_at: Date.now(),
          host_name: body.host_name || "Hôte",
          guest_name: body.guest_name || "Ami",
          guest_connected: true,
          deck,
          host_likes: new Set(hostLikes),
          host_dislikes: new Set(),
          guest_likes: new Set(),
          guest_dislikes: new Set(),
          matches: [],
        };
        DUO_ROOMS.set(code, room);
      } else {
        room.guest_name = body.guest_name || "Ami";
        room.guest_connected = true;
        if (Array.isArray(body.deck) && body.deck.length > 0 && (!room.deck || room.deck.length === 0)) {
          room.deck = body.deck.slice(0, 40);
        }
        if (Array.isArray(body.host_likes)) {
          body.host_likes.forEach((id) => room.host_likes.add(Number(id)));
        }
      }

      return res.status(200).json({
        code,
        host_name: room.host_name,
        deck: room.deck,
        host_likes: Array.from(room.host_likes),
        matches: room.matches,
      });
    }

    if (path === "/api/duo/vote" && req.method === "POST") {
      const body = await getJsonBody(req);
      const code = String(body.code || "").trim().toUpperCase();
      const role = body.role === "guest" ? "guest" : "host";
      const action = body.action; // "like", "skip", "watched"
      const movieId = Number(body.movieId);
      let room = DUO_ROOMS.get(code);

      // Si le salon n'était pas dans cette instance lambda, le créer à la volée
      if (!room) {
        room = {
          code,
          created_at: Date.now(),
          host_name: "Hôte",
          guest_name: "Ami",
          guest_connected: true,
          deck: Array.isArray(body.deck) ? body.deck : [],
          host_likes: new Set(),
          host_dislikes: new Set(),
          guest_likes: new Set(),
          guest_dislikes: new Set(),
          matches: [],
        };
        DUO_ROOMS.set(code, room);
      }

      if (Array.isArray(body.all_likes)) {
        body.all_likes.forEach((id) => {
          if (role === "host") room.host_likes.add(Number(id));
          else room.guest_likes.add(Number(id));
        });
      }

      if (action === "like" && movieId) {
        if (role === "host") {
          room.host_likes.add(movieId);
        } else {
          room.guest_likes.add(movieId);
        }
      } else if (action === "skip" && movieId) {
        if (role === "host") room.host_dislikes.add(movieId);
        else room.guest_dislikes.add(movieId);
      }

      // Calcul des matches en temps réel (intersection des deux ensembles)
      for (const hId of room.host_likes) {
        if (room.guest_likes.has(hId) && !room.matches.some((m) => m.id === hId)) {
          const movie = room.deck.find((m) => m.id === hId) || { id: hId };
          room.matches.push(movie);
        }
      }

      return res.status(200).json({
        matches: room.matches,
        guest_connected: room.guest_connected,
        host_likes: Array.from(room.host_likes),
        guest_likes: Array.from(room.guest_likes),
        host_progress: room.host_likes.size + room.host_dislikes.size,
        guest_progress: room.guest_likes.size + room.guest_dislikes.size,
      });
    }

    if (path === "/api/duo/status") {
      const code = String(q.get("code") || "").trim().toUpperCase();
      let room = DUO_ROOMS.get(code);

      // Synchronisation bidirectionnelle par paramètres URL si multi-lambda Vercel
      const hlParam = q.get("hl");
      const glParam = q.get("gl");
      const clientRole = q.get("role");

      if (!room && code) {
        room = {
          code,
          created_at: Date.now(),
          host_name: "Hôte",
          guest_name: "Ami",
          guest_connected: true,
          deck: [],
          host_likes: new Set(),
          host_dislikes: new Set(),
          guest_likes: new Set(),
          guest_dislikes: new Set(),
          matches: [],
        };
        DUO_ROOMS.set(code, room);
      }

      if (room) {
        if (hlParam) {
          hlParam.split(",").map(Number).filter(Boolean).forEach((id) => room.host_likes.add(id));
        }
        if (glParam) {
          glParam.split(",").map(Number).filter(Boolean).forEach((id) => room.guest_likes.add(id));
          room.guest_connected = true;
        }
        if (clientRole === "guest") {
          room.guest_connected = true;
        }

        // Recalcul des matches
        for (const hId of room.host_likes) {
          if (room.guest_likes.has(hId) && !room.matches.some((m) => m.id === hId)) {
            const movie = room.deck.find((m) => m.id === hId) || { id: hId };
            room.matches.push(movie);
          }
        }

        return res.status(200).json({
          code,
          host_name: room.host_name,
          guest_name: room.guest_name,
          guest_connected: room.guest_connected,
          matches: room.matches,
          host_likes: Array.from(room.host_likes),
          guest_likes: Array.from(room.guest_likes),
          host_progress: room.host_likes.size + room.host_dislikes.size,
          guest_progress: room.guest_likes.size + room.guest_dislikes.size,
        });
      }

      return res.status(200).json({
        code,
        guest_connected: false,
        matches: [],
        host_likes: [],
        guest_likes: [],
      });
    }

    return res.status(404).json({ detail: "Route introuvable" });
  } catch (err) {
    if (err?.code === "TMDB_KEY_MISSING") {
      console.error(`[CineViseur] ${err.message}`);
      return res.status(500).json({ detail: err.message });
    }
    return res.status(500).json({ detail: "Erreur interne du serveur" });
  }
}
