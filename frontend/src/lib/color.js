// Couleur dominante d'une affiche, calculée sur une miniature de 92 px (une seule fois par affiche).
const cache = new Map();

export function posterColor(posterPath) {
  if (!posterPath) return Promise.resolve(null);
  if (cache.has(posterPath)) return cache.get(posterPath);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 24;
        canvas.height = 36;
        const c = canvas.getContext("2d", { willReadFrequently: true });
        c.drawImage(img, 0, 0, 24, 36);
        const data = c.getImageData(0, 0, 24, 36).data;
        // Moyenne pondérée par la saturation : on garde la couleur, pas les gris.
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < data.length; i += 4) {
          const max = Math.max(data[i], data[i + 1], data[i + 2]);
          const min = Math.min(data[i], data[i + 1], data[i + 2]);
          const weight = (max - min) / 255 + 0.02;
          r += data[i] * weight;
          g += data[i + 1] * weight;
          b += data[i + 2] * weight;
          w += weight;
        }
        resolve([Math.round(r / w), Math.round(g / w), Math.round(b / w)]);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `https://image.tmdb.org/t/p/w92${posterPath}`;
  });
  cache.set(posterPath, promise);
  return promise;
}
