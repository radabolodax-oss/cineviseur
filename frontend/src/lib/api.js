const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
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
  me: (token) => request("/api/auth/me", { token }),
  deleteAccount: (token) => request("/api/auth/me", { method: "DELETE", token }),

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

  watchlist: (token) => request("/api/watchlist", { token }),
  addToWatchlist: (payload, token) => request("/api/watchlist", { method: "POST", body: payload, token }),
  updateWatchlistStatus: (id, statusValue, token) =>
    request(`/api/watchlist/${id}`, { method: "PATCH", body: { status: statusValue }, token }),
  removeFromWatchlist: (id, token) => request(`/api/watchlist/${id}`, { method: "DELETE", token }),

  libraryStatus: (mediaType, id, token) =>
    request(`/api/library/status?media_id=${id}&media_type=${mediaType}`, { token }),

  createAlert: (payload, token) => request("/api/alerts", { method: "POST", body: payload, token }),
  removeAlert: (id, token) => request(`/api/alerts/${id}`, { method: "DELETE", token }),
  alerts: (token) => request("/api/alerts", { token }),
  dueAlerts: (token) => request("/api/alerts/due", { token }),
  dismissAlert: (id, token) => request(`/api/alerts/${id}/dismiss`, { method: "POST", token }),

  rate: (payload, token) => request("/api/ratings", { method: "PUT", body: payload, token }),
  ratings: (token) => request("/api/ratings", { token }),

  nearbyCinemas: (lat, lon, radiusKm = 20) =>
    request(`/api/cinemas/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`),
};
