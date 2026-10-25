// Fonction serverless Netlify : remplace le backend Python pour TMDB et les cinémas proches.
// Aucun serveur Render requis : les affiches, recherches, fiches et cinémas chargent instantanément sur Netlify.

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
// La clé TMDB est un secret de déploiement : elle ne doit jamais être écrite dans le dépôt.
// Sans elle, on échoue avec un message explicite plutôt que de retomber sur une clé partagée.
class MissingTmdbKeyError extends Error {
  constructor() {
    super(
      "TMDB_API_KEY manquante : ajoute cette variable d'environnement dans les réglages du site (Netlify → Site configuration → Environment variables), puis redéploie."
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
    return jsonResponse({ detail: "Erreur TMDB" }, resp.status);
  }
  const data = await resp.json();
  return jsonResponse(data, 200, "public, max-age=300");
}

function jsonResponse(body, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const q = url.searchParams;
    // Normalise le chemin que l'appel vienne de /api/... ou de /.netlify/functions/api/...
    const path = url.pathname
      .replace(/^\/\.netlify\/functions\/api/, "/api")
      .replace(/\/+$/, "");

    if (path === "/api/health") {
      return jsonResponse({ status: "ok", mode: "netlify" });
    }

    // --- Routes TMDB ---
    if (path === "/api/tmdb/trending") {
      const lang = q.get("lang") || "fr";
      const mediaType = /^(all|movie|tv)$/.test(q.get("media_type") || "all") ? q.get("media_type") || "all" : "all";
      const window = /^(day|week)$/.test(q.get("window") || "week") ? q.get("window") || "week" : "week";
      return await tmdbGet(`/trending/${mediaType}/${window}`, { language: lang });
    }

    if (path === "/api/tmdb/genres") {
      const mediaType = q.get("media_type") === "tv" ? "tv" : "movie";
      const lang = q.get("lang") || "fr";
      return await tmdbGet(`/genre/${mediaType}/list`, { language: lang });
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
      return await tmdbGet(`/discover/${mediaType}`, params);
    }

    const listMatch = path.match(/^\/api\/tmdb\/lists\/([a-z_]+)$/);
    if (listMatch) {
      const kind = listMatch[1];
      const lang = q.get("lang") || "fr";
      const page = Math.min(500, Math.max(1, Number(q.get("page") || 1)));
      if (LISTS[kind]) {
        return await tmdbGet(LISTS[kind], { language: lang, region: "FR", page });
      }
      if (kind === "streaming") {
        return await tmdbGet("/discover/movie", {
          language: lang,
          page,
          watch_region: "FR",
          with_watch_monetization_types: "flatrate",
          sort_by: "popularity.desc",
        });
      }
      return jsonResponse({ detail: "kind invalide" }, 400);
    }

    if (path === "/api/tmdb/search") {
      const query = (q.get("query") || "").slice(0, 200);
      const lang = q.get("lang") || "fr";
      const page = Math.min(500, Math.max(1, Number(q.get("page") || 1)));
      return await tmdbGet("/search/multi", { language: lang, query, page });
    }

    const personMatch = path.match(/^\/api\/tmdb\/person\/(\d+)$/);
    if (personMatch) {
      const lang = q.get("lang") || "fr";
      return await tmdbGet(`/person/${personMatch[1]}`, {
        language: lang,
        append_to_response: "combined_credits",
      });
    }

    const seasonMatch = path.match(/^\/api\/tmdb\/tv\/(\d+)\/season\/(\d+)$/);
    if (seasonMatch) {
      const [, tvId, seasonNum] = seasonMatch;
      const lang = q.get("lang") || "fr";
      return await tmdbGet(`/tv/${tvId}/season/${seasonNum}`, { language: lang });
    }

    const detailMatch = path.match(/^\/api\/tmdb\/(movie|tv)\/(\d+)$/);
    if (detailMatch) {
      const [, mediaType, mediaId] = detailMatch;
      const lang = q.get("lang") || "fr";
      return await tmdbGet(`/${mediaType}/${mediaId}`, {
        language: lang,
        append_to_response: `credits,videos,similar,watch/providers${mediaType === "movie" ? ",release_dates" : ""}`,
      });
    }

    // --- Route Cinémas proches (Overpass OpenStreetMap) ---
    if (path === "/api/cinemas/nearby") {
      const lat = Number(q.get("lat"));
      const lon = Number(q.get("lon"));
      const radiusKm = Math.min(50, Math.max(1, Number(q.get("radius_km") || 20)));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return jsonResponse({ detail: "Coordonnées invalides" }, 400);
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
        return jsonResponse({ detail: "Erreur du service de cinémas" }, 502);
      }

      const cinemas = [];
      const seen = new Set();
      for (const el of data.elements || []) {
        const clat = el.lat ?? el.center?.lat;
        const clon = el.lon ?? el.center?.lon;
        if (clat == null || clon == null) continue;
        const tags = el.tags || {};
        const name = tags.name || "Cinéma";
        const key = `${name.toLowerCase()}|${clat.toFixed(3)}|${clon.toFixed(3)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const street = tags["addr:street"];
        const number = tags["addr:housenumber"];
        const city = tags["addr:city"];
        const streetLine = number && street ? `${number} ${street}`.trim() : street;
        const [formats, brand, chainSite, source] = detectFormats(tags);
        const rawWebsite = tags.website || tags["contact:website"];
        const website =
          typeof rawWebsite === "string" && /^https?:\/\//i.test(rawWebsite) ? rawWebsite : null;

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
      return jsonResponse({ cinemas: cinemas.slice(0, 20) }, 200, "public, max-age=600");
    }

    return jsonResponse({ detail: "Route introuvable" }, 404);
  } catch (err) {
    if (err?.code === "TMDB_KEY_MISSING") {
      console.error(`[CineViseur] ${err.message}`);
      return jsonResponse({ detail: err.message }, 500);
    }
    return jsonResponse({ detail: "Erreur interne du serveur" }, 500);
  }
};

export const config = {
  path: ["/api/tmdb/*", "/api/cinemas/*", "/api/health"],
};
