const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");
const TMDB_BASE = "https://api.themoviedb.org/3";
const FALLBACK_TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY || "21bd7c2bfbde3a1cd4f82dfbe7781f76";

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

// --- Stockage dans le cache local du navigateur (sans compte ni mot de passe) ---
const LS_KEYS = {
  watchlist: "cv_local_watchlist",
  ratings: "cv_local_ratings",
  alerts: "cv_local_alerts",
  episodes: "cv_local_episodes_progress",
  diary: "cv_local_diary_meta",
};

// Nettoyage de toute ancienne clé d'authentification ou session
try {
  localStorage.removeItem("cv_local_users");
  localStorage.removeItem("cv_local_session");
  localStorage.removeItem("cv_local_users_v2");
  localStorage.removeItem("cv_local_session_v2");
} catch {
  // ignore
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage indisponible
  }
}

function uid() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const LOCAL_USER = {
  id: "local-visitor",
  name: "Mon Espace",
  email: "",
};

function currentLocalUser() {
  return LOCAL_USER;
}

function requireLocalUser() {
  return LOCAL_USER;
}

async function directTmdb(tmdbPath, params = {}) {
  const url = new URL(`${TMDB_BASE}${tmdbPath}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("api_key", FALLBACK_TMDB_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Erreur TMDB");
  return res.json();
}

async function request(path, { method = "GET", body, fallback } = {}) {
  // En mode autonome (Netlify sans serveur backend distant), les opérations
  // de compte et de listes utilisent directement le stockage local sécurisé (0 latence, 100% autonome).
  if (
    !API_URL &&
    fallback &&
    (path.startsWith("/api/auth") ||
      path.startsWith("/api/watchlist") ||
      path.startsWith("/api/alerts") ||
      path.startsWith("/api/ratings") ||
      path.startsWith("/api/library"))
  ) {
    return await fallback();
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;

    if ((!isJson || res.status === 404 || res.status === 502 || res.status === 503) && fallback) {
      return await fallback();
    }

    if (!res.ok) {
      throw new Error(data?.detail || "Une erreur est survenue");
    }
    return data;
  } catch (err) {
    if (fallback && (err instanceof TypeError || err.message === "Failed to fetch")) {
      return await fallback();
    }
    throw err;
  }
}

export const api = {
  register: () => {
    throw new Error("L'inscription est désactivée : votre liste fonctionne directement dans votre navigateur.");
  },

  login: () => Promise.resolve(LOCAL_USER),

  me: () => Promise.resolve(LOCAL_USER),

  logout: () => Promise.resolve(null),

  clearLocalData: () => {
    writeStore(LS_KEYS.watchlist, []);
    writeStore(LS_KEYS.ratings, []);
    writeStore(LS_KEYS.alerts, []);
    return Promise.resolve(null);
  },

  deleteAccount: () => {
    writeStore(LS_KEYS.watchlist, []);
    writeStore(LS_KEYS.ratings, []);
    writeStore(LS_KEYS.alerts, []);
    return Promise.resolve(null);
  },

  trending: (lang = "fr") =>
    request(`/api/tmdb/trending?lang=${lang}`, {
      fallback: () => directTmdb("/trending/all/week", { language: lang }),
    }),

  genres: (mediaType, lang = "fr") =>
    request(`/api/tmdb/genres?media_type=${mediaType}&lang=${lang}`, {
      fallback: () => directTmdb(`/genre/${mediaType}/list`, { language: lang }),
    }),

  discover: (mediaType, lang = "fr", { genre, sort, minRating, year, page } = {}) => {
    const params = new URLSearchParams({ media_type: mediaType, lang });
    if (genre) params.set("genre", genre);
    if (sort) params.set("sort", sort);
    if (minRating) params.set("min_rating", minRating);
    if (year) params.set("year", year);
    if (page) params.set("page", page);
    return request(`/api/tmdb/discover?${params.toString()}`, {
      fallback: () => {
        const tmdbParams = {
          language: lang,
          sort_by: SORT_FIELDS[mediaType]?.[sort || "popularity"] || "popularity.desc",
          page: page || 1,
        };
        if (genre) tmdbParams.with_genres = genre;
        if (minRating) {
          tmdbParams["vote_average.gte"] = minRating;
          tmdbParams["vote_count.gte"] = 50;
        }
        if (sort === "rating") tmdbParams["vote_count.gte"] = 50;
        if (year) {
          tmdbParams[mediaType === "movie" ? "primary_release_year" : "first_air_date_year"] = year;
        }
        return directTmdb(`/discover/${mediaType}`, tmdbParams);
      },
    });
  },

  search: (query, lang = "fr") =>
    request(`/api/tmdb/search?query=${encodeURIComponent(query)}&lang=${lang}`, {
      fallback: () => directTmdb("/search/multi", { language: lang, query, page: 1 }),
    }),

  list: (kind, lang = "fr", page = 1) =>
    request(`/api/tmdb/lists/${kind}?lang=${lang}&page=${page}`, {
      fallback: () => {
        if (kind === "now_playing" || kind === "upcoming") {
          return directTmdb(`/movie/${kind}`, { language: lang, region: "FR", page });
        }
        if (kind === "streaming") {
          return directTmdb("/discover/movie", {
            language: lang,
            page,
            watch_region: "FR",
            with_watch_monetization_types: "flatrate",
            sort_by: "popularity.desc",
          });
        }
        throw new Error("Liste invalide");
      },
    }),

  details: (mediaType, id, lang = "fr") =>
    request(`/api/tmdb/${mediaType}/${id}?lang=${lang}`, {
      fallback: () =>
        directTmdb(`/${mediaType}/${id}`, {
          language: lang,
          append_to_response: `credits,videos,similar,watch/providers${mediaType === "movie" ? ",release_dates" : ""}`,
        }),
    }),

  person: (id, lang = "fr") =>
    request(`/api/tmdb/person/${id}?lang=${lang}`, {
      fallback: () =>
        directTmdb(`/person/${id}`, {
          language: lang,
          append_to_response: "combined_credits",
        }),
    }),

  watchlist: () =>
    request("/api/watchlist", {
      fallback: () => {
        return readStore(LS_KEYS.watchlist, []).sort(
          (a, b) => new Date(b.added_at) - new Date(a.added_at)
        );
      },
    }),

  addToWatchlist: (payload) =>
    request("/api/watchlist", {
      method: "POST",
      body: payload,
      fallback: () => {
        const items = readStore(LS_KEYS.watchlist, []);
        const statusValue = payload.status || "to_watch";
        const watchedAt = statusValue === "watched" ? (payload.watched_at || new Date().toISOString()) : null;
        const viewingTag = payload.viewing_tag || null;
        const existing = items.find(
          (w) => w.media_id === payload.media_id && w.media_type === payload.media_type
        );
        if (existing) {
          existing.status = statusValue;
          existing.watched_at = watchedAt || existing.watched_at;
          if (viewingTag) existing.viewing_tag = viewingTag;
          writeStore(LS_KEYS.watchlist, items);
          return existing;
        }
        const doc = {
          id: uid(),
          user_id: "local-visitor",
          media_id: payload.media_id,
          media_type: payload.media_type,
          title: payload.title,
          poster_path: payload.poster_path || null,
          status: statusValue,
          added_at: new Date().toISOString(),
          watched_at: watchedAt,
          viewing_tag: viewingTag,
        };
        items.push(doc);
        writeStore(LS_KEYS.watchlist, items);
        return doc;
      },
    }),

  updateWatchlistStatus: (id, statusValue, extra = {}) =>
    request(`/api/watchlist/${id}`, {
      method: "PATCH",
      body: { status: statusValue, ...extra },
      fallback: () => {
        const items = readStore(LS_KEYS.watchlist, []);
        const item = items.find((w) => w.id === id);
        if (!item) throw new Error("Élément introuvable");
        item.status = statusValue;
        item.watched_at = statusValue === "watched" ? (extra.watched_at || item.watched_at || new Date().toISOString()) : null;
        if (extra.viewing_tag !== undefined) item.viewing_tag = extra.viewing_tag;
        writeStore(LS_KEYS.watchlist, items);
        return item;
      },
    }),

  removeFromWatchlist: (id) =>
    request(`/api/watchlist/${id}`, {
      method: "DELETE",
      fallback: () => {
        const items = readStore(LS_KEYS.watchlist, []);
        writeStore(
          LS_KEYS.watchlist,
          items.filter((w) => w.id !== id)
        );
        return null;
      },
    }),

  libraryStatus: (mediaType, id) =>
    request(`/api/library/status?media_id=${id}&media_type=${mediaType}`, {
      fallback: () => {
        const mid = Number(id);
        const watchlistItem =
          readStore(LS_KEYS.watchlist, []).find(
            (w) => Number(w.media_id) === mid && w.media_type === mediaType
          ) || null;
        const alert =
          readStore(LS_KEYS.alerts, []).find(
            (a) => Number(a.media_id) === mid && a.media_type === mediaType
          ) || null;
        return { watchlist_item: watchlistItem, alert };
      },
    }),

  createAlert: (payload) =>
    request("/api/alerts", {
      method: "POST",
      body: payload,
      fallback: () => {
        const alerts = readStore(LS_KEYS.alerts, []);
        const existing = alerts.find(
          (a) => a.media_id === payload.media_id && a.media_type === payload.media_type
        );
        if (existing) return existing;
        const doc = {
          id: uid(),
          user_id: "local-visitor",
          media_id: payload.media_id,
          media_type: payload.media_type,
          title: payload.title,
          poster_path: payload.poster_path || null,
          release_date: payload.release_date || null,
          created_at: new Date().toISOString(),
          notified: false,
        };
        alerts.push(doc);
        writeStore(LS_KEYS.alerts, alerts);
        return doc;
      },
    }),

  removeAlert: (id) =>
    request(`/api/alerts/${id}`, {
      method: "DELETE",
      fallback: () => {
        writeStore(
          LS_KEYS.alerts,
          readStore(LS_KEYS.alerts, []).filter((a) => a.id !== id)
        );
        return null;
      },
    }),

  alerts: () =>
    request("/api/alerts", {
      fallback: () => {
        return readStore(LS_KEYS.alerts, []);
      },
    }),

  dueAlerts: () =>
    request("/api/alerts/due", {
      fallback: () => {
        const today = new Date().toISOString().slice(0, 10);
        return readStore(LS_KEYS.alerts, []).filter(
          (a) => !a.notified && a.release_date && a.release_date <= today
        );
      },
    }),

  dismissAlert: (id) =>
    request(`/api/alerts/${id}/dismiss`, {
      method: "POST",
      fallback: () => {
        const alerts = readStore(LS_KEYS.alerts, []);
        const alert = alerts.find((a) => a.id === id);
        if (!alert) throw new Error("Alerte introuvable");
        alert.notified = true;
        writeStore(LS_KEYS.alerts, alerts);
        return alert;
      },
    }),

  rate: (payload) =>
    request("/api/ratings", {
      method: "PUT",
      body: payload,
      fallback: () => {
        const ratings = readStore(LS_KEYS.ratings, []);
        const now = new Date().toISOString();
        const existing = ratings.find(
          (r) => r.media_id === payload.media_id && r.media_type === payload.media_type
        );
        if (existing) {
          existing.score = payload.score;
          existing.updated_at = now;
        } else {
          ratings.push({
            id: uid(),
            user_id: "local-visitor",
            media_id: payload.media_id,
            media_type: payload.media_type,
            score: payload.score,
            created_at: now,
            updated_at: now,
          });
        }
        writeStore(LS_KEYS.ratings, ratings);
        return { ok: true };
      },
    }),

  ratings: () =>
    request("/api/ratings", {
      fallback: () => {
        return readStore(LS_KEYS.ratings, []);
      },
    }),

  nearbyCinemas: (lat, lon, radiusKm = 20) =>
    request(`/api/cinemas/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`),

  tvSeason: (id, seasonNum, lang = "fr") =>
    request(`/api/tmdb/tv/${id}/season/${seasonNum}?lang=${lang}`, {
      fallback: () => directTmdb(`/tv/${id}/season/${seasonNum}`, { language: lang }),
    }),

  // Suivi précis des épisodes pour les séries (style Trakt / TV Time)
  getEpisodesProgress: (tvId) => {
    const store = readStore(LS_KEYS.episodes, {});
    return store[tvId] || { episodes: {}, last_watched: null };
  },

  getAllEpisodesProgress: () => {
    return readStore(LS_KEYS.episodes, {});
  },

  toggleEpisodeWatched: (tvId, seasonNum, episodeNum, meta = {}) => {
    const store = readStore(LS_KEYS.episodes, {});
    if (!store[tvId]) store[tvId] = { episodes: {}, last_watched: null };
    const epKey = `s${seasonNum}e${episodeNum}`;
    const current = store[tvId].episodes[epKey];
    if (current?.watched) {
      delete store[tvId].episodes[epKey];
    } else {
      store[tvId].episodes[epKey] = {
        watched: true,
        season: seasonNum,
        episode: episodeNum,
        title: meta.title || `Épisode ${episodeNum}`,
        watched_at: new Date().toISOString(),
      };
      store[tvId].last_watched = {
        season: seasonNum,
        episode: episodeNum,
        title: meta.title || `Épisode ${episodeNum}`,
        at: new Date().toISOString(),
      };
    }
    writeStore(LS_KEYS.episodes, store);
    window.dispatchEvent(new CustomEvent("cv:episodes-changed", { detail: { tvId } }));
    return store[tvId];
  },

  markSeasonWatched: (tvId, seasonNum, episodesList = [], watched = true) => {
    const store = readStore(LS_KEYS.episodes, {});
    if (!store[tvId]) store[tvId] = { episodes: {}, last_watched: null };
    episodesList.forEach((ep) => {
      const epKey = `s${seasonNum}e${ep.episode_number}`;
      if (watched) {
        store[tvId].episodes[epKey] = {
          watched: true,
          season: seasonNum,
          episode: ep.episode_number,
          title: ep.name || `Épisode ${ep.episode_number}`,
          watched_at: new Date().toISOString(),
        };
      } else {
        delete store[tvId].episodes[epKey];
      }
    });
    if (watched && episodesList.length) {
      const last = episodesList[episodesList.length - 1];
      store[tvId].last_watched = {
        season: seasonNum,
        episode: last.episode_number,
        title: last.name || `Épisode ${last.episode_number}`,
        at: new Date().toISOString(),
      };
    }
    writeStore(LS_KEYS.episodes, store);
    window.dispatchEvent(new CustomEvent("cv:episodes-changed", { detail: { tvId } }));
    return store[tvId];
  },

  // Export complet de toutes les données CineViseur
  exportData: () => {
    return {
      version: 2,
      exported_at: new Date().toISOString(),
      watchlist: readStore(LS_KEYS.watchlist, []),
      ratings: readStore(LS_KEYS.ratings, []),
      alerts: readStore(LS_KEYS.alerts, []),
      episodes: readStore(LS_KEYS.episodes, {}),
    };
  },

  // Import de données CineViseur JSON
  importData: (imported) => {
    if (!imported || typeof imported !== "object") throw new Error("Format JSON invalide");
    let count = 0;
    if (Array.isArray(imported.watchlist)) {
      const current = readStore(LS_KEYS.watchlist, []);
      imported.watchlist.forEach((item) => {
        if (!item.media_id || !item.media_type) return;
        const exists = current.find(
          (w) => String(w.media_id) === String(item.media_id) && w.media_type === item.media_type
        );
        if (!exists) {
          current.push({ ...item, id: uid(), user_id: "local-visitor" });
          count++;
        }
      });
      writeStore(LS_KEYS.watchlist, current);
    }
    if (Array.isArray(imported.ratings)) {
      const currentRatings = readStore(LS_KEYS.ratings, []);
      imported.ratings.forEach((r) => {
        const exists = currentRatings.find(
          (x) => String(x.media_id) === String(r.media_id) && x.media_type === r.media_type
        );
        if (!exists) currentRatings.push({ ...r, id: uid(), user_id: "local-visitor" });
      });
      writeStore(LS_KEYS.ratings, currentRatings);
    }
    if (imported.episodes && typeof imported.episodes === "object") {
      const curEp = readStore(LS_KEYS.episodes, {});
      writeStore(LS_KEYS.episodes, { ...curEp, ...imported.episodes });
    }
    window.dispatchEvent(new Event("storage"));
    return { importedCount: count };
  },

  // Import de CSV Letterboxd ou Trakt
  importCsv: async (csvText) => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("Fichier CSV vide ou invalide");
    
    // Détection des en-têtes
    const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h === "name" || h === "title");
    const yearIdx = headers.findIndex((h) => h === "year");
    const dateIdx = headers.findIndex((h) => h === "date" || h === "watched date" || h === "watchedat");
    const ratingIdx = headers.findIndex((h) => h === "rating");
    const tmdbIdx = headers.findIndex((h) => h === "tmdbid" || h === "tmdb_id");

    if (nameIdx === -1 && tmdbIdx === -1) {
      throw new Error("Impossible de trouver la colonne 'Name' ou 'Title' dans le fichier");
    }

    const currentWatchlist = readStore(LS_KEYS.watchlist, []);
    const currentRatings = readStore(LS_KEYS.ratings, []);
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleanCols = cols.map((c) => c.replace(/^["']|["']$/g, "").trim());
      
      const title = nameIdx >= 0 ? cleanCols[nameIdx] : null;
      const year = yearIdx >= 0 ? cleanCols[yearIdx] : null;
      const date = dateIdx >= 0 ? cleanCols[dateIdx] : null;
      const rating = ratingIdx >= 0 ? parseFloat(cleanCols[ratingIdx]) : null;
      const tmdbId = tmdbIdx >= 0 && cleanCols[tmdbIdx] ? Number(cleanCols[tmdbIdx]) : null;

      if (!title && !tmdbId) continue;

      const mediaId = tmdbId || (900000 + i);
      const exists = currentWatchlist.some((w) => w.title?.toLowerCase() === title?.toLowerCase());
      
      if (!exists) {
        currentWatchlist.push({
          id: uid(),
          user_id: "local-visitor",
          media_id: mediaId,
          media_type: "movie",
          title: title || `Film ${mediaId}`,
          year: year || null,
          poster_path: null,
          status: "watched",
          added_at: date || new Date().toISOString(),
          watched_at: date || new Date().toISOString(),
          viewing_tag: "streaming",
        });
        count++;

        if (rating && !isNaN(rating)) {
          const score = rating <= 5 ? rating * 2 : rating;
          currentRatings.push({
            id: uid(),
            user_id: "local-visitor",
            media_id: mediaId,
            media_type: "movie",
            score,
            created_at: date || new Date().toISOString(),
            updated_at: date || new Date().toISOString(),
          });
        }
      }
    }

    writeStore(LS_KEYS.watchlist, currentWatchlist);
    writeStore(LS_KEYS.ratings, currentRatings);
    window.dispatchEvent(new Event("storage"));
    return { count };
  },
};
