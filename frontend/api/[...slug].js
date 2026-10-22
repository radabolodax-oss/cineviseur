// Fonction serverless Vercel Node.js : gère /api/tmdb/*, /api/cinemas/*, /api/duo/* et /api/health
const crypto = require("node:crypto");

// Store des salons Duo en mémoire globale serverless
const DUO_ROOMS = (globalThis.__CV_DUO_ROOMS = globalThis.__CV_DUO_ROOMS || new Map());

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
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || "21bd7c2bfbde3a1cd4f82dfbe7781f76";

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
  url.searchParams.set("api_key", TMDB_API_KEY);

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

    if (path === "/api/health") {
      return res.status(200).json({ status: "ok", mode: "vercel" });
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
      if (q.get("provider")) {
        params.with_watch_providers = q.get("provider");
        params.watch_region = "FR";
        params.with_watch_monetization_types = "flatrate";
      }
      const result = await tmdbGet(`/discover/${mediaType}`, params);
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
      const room = DUO_ROOMS.get(code);
      if (!room) {
        return res.status(404).json({ detail: "Salon introuvable ou expiré" });
      }
      room.guest_name = body.guest_name || "Ami";
      room.guest_connected = true;
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
      const room = DUO_ROOMS.get(code);
      if (!room) {
        return res.status(404).json({ detail: "Salon introuvable" });
      }

      if (action === "like" && movieId) {
        if (role === "host") {
          room.host_likes.add(movieId);
          if (room.guest_likes.has(movieId) && !room.matches.some((m) => m.id === movieId)) {
            const movie = room.deck.find((m) => m.id === movieId) || { id: movieId };
            room.matches.push(movie);
          }
        } else {
          room.guest_likes.add(movieId);
          if (room.host_likes.has(movieId) && !room.matches.some((m) => m.id === movieId)) {
            const movie = room.deck.find((m) => m.id === movieId) || { id: movieId };
            room.matches.push(movie);
          }
        }
      } else if (action === "skip" && movieId) {
        if (role === "host") room.host_dislikes.add(movieId);
        else room.guest_dislikes.add(movieId);
      }

      return res.status(200).json({
        matches: room.matches,
        guest_connected: room.guest_connected,
        host_progress: room.host_likes.size + room.host_dislikes.size,
        guest_progress: room.guest_likes.size + room.guest_dislikes.size,
      });
    }

    if (path === "/api/duo/status") {
      const code = String(q.get("code") || "").trim().toUpperCase();
      const room = DUO_ROOMS.get(code);
      if (!room) {
        return res.status(404).json({ detail: "Salon introuvable" });
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

    return res.status(404).json({ detail: "Route introuvable" });
  } catch {
    return res.status(500).json({ detail: "Erreur interne du serveur" });
  }
}
