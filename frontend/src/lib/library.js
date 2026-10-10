// Liste de l'utilisateur partagée entre les pages (aperçu, swipe, roulette, acteurs, récap).
import { api } from "./api";
import { emitWatched, play, vibrate } from "./feedback";

let cache = null;
let cacheOwner = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(cache || []));
}

export function subscribeLibrary(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let inflight = null;

// Un seul appel réseau même si vingt cartes demandent la liste en même temps.
export async function loadLibrary(ownerId, force = false) {
  if (!ownerId) return [];
  if (cache && cacheOwner === ownerId && !force) return cache;
  if (!inflight || force) {
    inflight = api
      .watchlist()
      .then((list) => {
        cache = list;
        cacheOwner = ownerId;
        notify();
        return list;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function libraryKey(mediaType, id) {
  return `${mediaType}-${id}`;
}

export function libraryIndex(list) {
  return new Map((list || []).map((i) => [libraryKey(i.media_type, i.media_id), i]));
}

/**
 * Place un titre dans un état : "to_watch", "watched" ou null (retirer).
 * Joue le tampon « VU » quand il devient vu.
 */
export async function setLibraryStatus({ item, mediaType, existing }, status) {
  const title = item.title || item.name;
  let result = null;
  if (!status) {
    if (existing) await api.removeFromWatchlist(existing.id);
  } else if (existing) {
    result = await api.updateWatchlistStatus(existing.id, status);
  } else {
    result = await api.addToWatchlist(
      { media_id: item.id, media_type: mediaType, title, poster_path: item.poster_path, status }
    );
  }
  if (cache) {
    cache = cache.filter((i) => !(i.media_id === item.id && i.media_type === mediaType));
    if (result) cache = [result, ...cache];
    notify();
  }
  if (status === "watched") {
    emitWatched({ title, poster_path: item.poster_path });
    play("stamp");
    vibrate([10, 40, 20]);
  } else if (status === "to_watch") {
    play("whoosh");
    vibrate(10);
  }
  return result;
}

export function resetLibrary() {
  cache = null;
  cacheOwner = null;
}
