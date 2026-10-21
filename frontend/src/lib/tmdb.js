import { api } from "./api";

const IMAGE_ROOT = "https://image.tmdb.org/t/p";

// Tailles TMDB utilisées sur le site : une seule source de vérité.
export const SIZES = {
  thumb: "w92",
  profile: "w185",
  poster: "w342",
  posterLarge: "w500",
  backdrop: "w1280",
};

export function tmdbImage(path, size = "poster") {
  return path ? `${IMAGE_ROOT}/${SIZES[size]}${path}` : null;
}

// Variantes servies par TMDB : le navigateur choisit la plus légère qui suffit à l'écran.
const SRCSETS = {
  poster: [185, 342, 500],
  backdrop: [780, 1280],
};

export function tmdbSrcSet(path, kind = "poster") {
  if (!path) return undefined;
  return SRCSETS[kind].map((w) => `${IMAGE_ROOT}/w${w}${path} ${w}w`).join(", ");
}

export function mediaTitle(item) {
  return item.title || item.name || "";
}

export function mediaYear(item) {
  return (item.release_date || item.first_air_date || "").slice(0, 4);
}

export function mediaType(item, fallback) {
  return fallback || (item.media_type === "tv" ? "tv" : "movie");
}

// Les mêmes listes sont demandées par plusieurs pages (accueil, connexion, inscription) :
// on garde la promesse en mémoire pour ne faire qu'un appel par session.
const cache = new Map();

function cached(key, loader) {
  if (!cache.has(key)) {
    const promise = loader().catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, promise);
  }
  return cache.get(key);
}

export function getTrending() {
  return cached("trending", () =>
    api.trending("fr").then((data) => (data.results || []).filter((r) => r.media_type !== "person"))
  );
}

export function getPerson(id) {
  return cached(`person-${id}`, () => api.person(id, "fr"));
}

export function getUpcoming() {
  return cached("upcoming", () => api.list("upcoming", "fr", 1).then((data) => data.results || []));
}

export function getNowPlaying() {
  return cached("now_playing", () => api.list("now_playing", "fr", 1).then((data) => data.results || []));
}

export function getStreamingReleases() {
  return cached("streaming", () => api.list("streaming", "fr", 1).then((data) => data.results || []));
}
