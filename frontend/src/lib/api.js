const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail || "Une erreur est survenue");
  }
  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  deleteAccount: () => request("/api/auth/me", { method: "DELETE" }),

  trending: (lang = "fr") => request(`/api/tmdb/trending?lang=${lang}`),
  genres: (mediaType, lang = "fr") => request(`/api/tmdb/genres?media_type=${mediaType}&lang=${lang}`),
  discover: (mediaType, lang = "fr", { genre, sort, minRating, year, page } = {}) => {
    const params = new URLSearchParams({ media_type: mediaType, lang });
    if (genre) params.set("genre", genre);
    if (sort) params.set("sort", sort);
    if (minRating) params.set("min_rating", minRating);
    if (year) params.set("year", year);
    if (page) params.set("page", page);
    return request(`/api/tmdb/discover?${params.toString()}`);
  },
  search: (query, lang = "fr") => request(`/api/tmdb/search?query=${encodeURIComponent(query)}&lang=${lang}`),
  list: (kind, lang = "fr", page = 1) => request(`/api/tmdb/lists/${kind}?lang=${lang}&page=${page}`),
  details: (mediaType, id, lang = "fr") => request(`/api/tmdb/${mediaType}/${id}?lang=${lang}`),
  person: (id, lang = "fr") => request(`/api/tmdb/person/${id}?lang=${lang}`),

  watchlist: () => request("/api/watchlist"),
  addToWatchlist: (payload) => request("/api/watchlist", { method: "POST", body: payload }),
  updateWatchlistStatus: (id, statusValue) =>
    request(`/api/watchlist/${id}`, { method: "PATCH", body: { status: statusValue } }),
  removeFromWatchlist: (id) => request(`/api/watchlist/${id}`, { method: "DELETE" }),

  libraryStatus: (mediaType, id) =>
    request(`/api/library/status?media_id=${id}&media_type=${mediaType}`),

  createAlert: (payload) => request("/api/alerts", { method: "POST", body: payload }),
  removeAlert: (id) => request(`/api/alerts/${id}`, { method: "DELETE" }),
  alerts: () => request("/api/alerts"),
  dueAlerts: () => request("/api/alerts/due"),
  dismissAlert: (id) => request(`/api/alerts/${id}/dismiss`, { method: "POST" }),

  rate: (payload) => request("/api/ratings", { method: "PUT", body: payload }),
  ratings: () => request("/api/ratings"),

  nearbyCinemas: (lat, lon, radiusKm = 20) =>
    request(`/api/cinemas/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`),
};
