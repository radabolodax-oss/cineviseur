// Position de l'utilisateur, demandée une seule fois par session (jamais envoyée ailleurs qu'à notre API).
const KEY = "cv_position";

export function cachedPosition() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lon: coords.longitude };
        try {
          sessionStorage.setItem(KEY, JSON.stringify(pos));
        } catch {
          // position gardée pour cet appel seulement
        }
        resolve(pos);
      },
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Autorise la géolocalisation pour trouver les cinémas près de toi."
              : "Impossible de récupérer ta position."
          )
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/** Cap (en degrés, 0 = nord) et distance pour placer un cinéma sur le radar. */
export function bearing(from, to) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(to.lon - from.lon)) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lon - from.lon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
