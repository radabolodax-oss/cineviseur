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

// --- Stockage local de secours (quand le site tourne sur Netlify sans serveur MongoDB) ---
const LS_KEYS = {
  users: "cv_local_users",
  session: "cv_local_session",
  watchlist: "cv_local_watchlist",
  ratings: "cv_local_ratings",
  alerts: "cv_local_alerts",
};

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
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function currentLocalUser() {
  const userId = readStore(LS_KEYS.session, null);
  if (!userId) return null;
  const users = readStore(LS_KEYS.users, []);
  return users.find((u) => u.id === userId) || null;
}

function requireLocalUser() {
  const user = currentLocalUser();
  if (!user) throw new Error("Non authentifié");
  return user;
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

    // Si Netlify renvoie la page HTML ou une 404/502 faute de backend Python, on bascule sur le mode autonome.
    if ((!isJson || res.status === 404 || res.status === 502 || res.status === 503) && fallback) {
      return await fallback();
    }

    if (!res.ok) {
      throw new Error(data?.detail || "Une erreur est survenue");
    }
    return data;
  } catch (err) {
    // Erreur réseau (serveur Python éteint ou absent) : bascule sur le mode autonome s'il existe.
    if (fallback && (err instanceof TypeError || err.message === "Failed to fetch")) {
      return await fallback();
    }
    throw err;
  }
}

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: payload,
      fallback: () => {
        if (payload.website) throw new Error("Inscription refusée");
        if (!payload.accepted_terms) {
          throw new Error("Tu dois accepter les conditions d'utilisation et la politique de confidentialité");
        }
        const users = readStore(LS_KEYS.users, []);
        const email = (payload.email || "").trim().toLowerCase();
        if (users.some((u) => u.email === email)) {
          throw new Error("Un compte existe déjà avec cet email");
        }
        const user = { id: uid(), name: payload.name.trim(), email, password: payload.password };
        users.push(user);
        writeStore(LS_KEYS.users, users);
        writeStore(LS_KEYS.session, user.id);
        return { id: user.id, name: user.name, email: user.email };
      },
    }),

  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: payload,
      fallback: () => {
        const users = readStore(LS_KEYS.users, []);
        const email = (payload.email || "").trim().toLowerCase();
        const user = users.find((u) => u.email === email && u.password === payload.password);
        if (!user) throw new Error("Email ou mot de passe incorrect");
        writeStore(LS_KEYS.session, user.id);
        return { id: user.id, name: user.name, email: user.email };
      },
    }),

  me: () =>
    request("/api/auth/me", {
      fallback: () => {
        const user = requireLocalUser();
        return { id: user.id, name: user.name, email: user.email };
      },
    }),

  logout: () =>
    request("/api/auth/logout", {
      method: "POST",
      fallback: () => {
        writeStore(LS_KEYS.session, null);
        return null;
      },
    }),

  deleteAccount: () =>
    request("/api/auth/me", {
      method: "DELETE",
      fallback: () => {
        const user = requireLocalUser();
        writeStore(
          LS_KEYS.users,
          readStore(LS_KEYS.users, []).filter((u) => u.id !== user.id)
        );
        writeStore(
          LS_KEYS.watchlist,
          readStore(LS_KEYS.watchlist, []).filter((w) => w.user_id !== user.id)
        );
        writeStore(
          LS_KEYS.ratings,
          readStore(LS_KEYS.ratings, []).filter((r) => r.user_id !== user.id)
        );
        writeStore(
          LS_KEYS.alerts,
          readStore(LS_KEYS.alerts, []).filter((a) => a.user_id !== user.id)
        );
        writeStore(LS_KEYS.session, null);
        return null;
      },
    }),

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
        const user = requireLocalUser();
        return readStore(LS_KEYS.watchlist, [])
          .filter((w) => w.user_id === user.id)
          .sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
      },
    }),

  addToWatchlist: (payload) =>
    request("/api/watchlist", {
      method: "POST",
      body: payload,
      fallback: () => {
        const user = requireLocalUser();
        const items = readStore(LS_KEYS.watchlist, []);
        const statusValue = payload.status || "to_watch";
        const watchedAt = statusValue === "watched" ? new Date().toISOString() : null;
        const existing = items.find(
          (w) => w.user_id === user.id && w.media_id === payload.media_id && w.media_type === payload.media_type
        );
        if (existing) {
          existing.status = statusValue;
          existing.watched_at = watchedAt;
          writeStore(LS_KEYS.watchlist, items);
          return existing;
        }
        const doc = {
          id: uid(),
          user_id: user.id,
          media_id: payload.media_id,
          media_type: payload.media_type,
          title: payload.title,
          poster_path: payload.poster_path || null,
          status: statusValue,
          added_at: new Date().toISOString(),
          watched_at: watchedAt,
        };
        items.push(doc);
        writeStore(LS_KEYS.watchlist, items);
        return doc;
      },
    }),

  updateWatchlistStatus: (id, statusValue) =>
    request(`/api/watchlist/${id}`, {
      method: "PATCH",
      body: { status: statusValue },
      fallback: () => {
        const user = requireLocalUser();
        const items = readStore(LS_KEYS.watchlist, []);
        const item = items.find((w) => w.id === id && w.user_id === user.id);
        if (!item) throw new Error("Élément introuvable");
        item.status = statusValue;
        item.watched_at = statusValue === "watched" ? new Date().toISOString() : null;
        writeStore(LS_KEYS.watchlist, items);
        return item;
      },
    }),

  removeFromWatchlist: (id) =>
    request(`/api/watchlist/${id}`, {
      method: "DELETE",
      fallback: () => {
        const user = requireLocalUser();
        const items = readStore(LS_KEYS.watchlist, []);
        writeStore(
          LS_KEYS.watchlist,
          items.filter((w) => !(w.id === id && w.user_id === user.id))
        );
        return null;
      },
    }),

  libraryStatus: (mediaType, id) =>
    request(`/api/library/status?media_id=${id}&media_type=${mediaType}`, {
      fallback: () => {
        const user = requireLocalUser();
        const mid = Number(id);
        const watchlistItem =
          readStore(LS_KEYS.watchlist, []).find(
            (w) => w.user_id === user.id && Number(w.media_id) === mid && w.media_type === mediaType
          ) || null;
        const alert =
          readStore(LS_KEYS.alerts, []).find(
            (a) => a.user_id === user.id && Number(a.media_id) === mid && a.media_type === mediaType
          ) || null;
        return { watchlist_item: watchlistItem, alert };
      },
    }),

  createAlert: (payload) =>
    request("/api/alerts", {
      method: "POST",
      body: payload,
      fallback: () => {
        const user = requireLocalUser();
        const alerts = readStore(LS_KEYS.alerts, []);
        const existing = alerts.find(
          (a) => a.user_id === user.id && a.media_id === payload.media_id && a.media_type === payload.media_type
        );
        if (existing) return existing;
        const doc = {
          id: uid(),
          user_id: user.id,
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
        const user = requireLocalUser();
        writeStore(
          LS_KEYS.alerts,
          readStore(LS_KEYS.alerts, []).filter((a) => !(a.id === id && a.user_id === user.id))
        );
        return null;
      },
    }),

  alerts: () =>
    request("/api/alerts", {
      fallback: () => {
        const user = requireLocalUser();
        return readStore(LS_KEYS.alerts, []).filter((a) => a.user_id === user.id);
      },
    }),

  dueAlerts: () =>
    request("/api/alerts/due", {
      fallback: () => {
        const user = requireLocalUser();
        const today = new Date().toISOString().slice(0, 10);
        return readStore(LS_KEYS.alerts, []).filter(
          (a) => a.user_id === user.id && !a.notified && a.release_date && a.release_date <= today
        );
      },
    }),

  dismissAlert: (id) =>
    request(`/api/alerts/${id}/dismiss`, {
      method: "POST",
      fallback: () => {
        const user = requireLocalUser();
        const alerts = readStore(LS_KEYS.alerts, []);
        const alert = alerts.find((a) => a.id === id && a.user_id === user.id);
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
        const user = requireLocalUser();
        const ratings = readStore(LS_KEYS.ratings, []);
        const now = new Date().toISOString();
        const existing = ratings.find(
          (r) => r.user_id === user.id && r.media_id === payload.media_id && r.media_type === payload.media_type
        );
        if (existing) {
          existing.score = payload.score;
          existing.updated_at = now;
        } else {
          ratings.push({
            id: uid(),
            user_id: user.id,
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
        const user = requireLocalUser();
        return readStore(LS_KEYS.ratings, []).filter((r) => r.user_id === user.id);
      },
    }),

  nearbyCinemas: (lat, lon, radiusKm = 20) =>
    request(`/api/cinemas/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`),
};
