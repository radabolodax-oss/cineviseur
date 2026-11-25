// Retours sensoriels et événements partagés entre composants.
// Sons synthétisés en WebAudio (aucun fichier), désactivés par défaut ; vibration sur mobile.

const SOUND_KEY = "cv_sounds";
export const SOUNDS_CHANGED_EVENT = "cv:sounds-changed";

export function soundsEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundsEnabled(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // stockage indisponible : réglage limité à la visite
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SOUNDS_CHANGED_EVENT, { detail: { enabled: !!on } }));
  }
}

let ctx = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function unlockAudio() {
  try {
    const ac = audio();
    if (ac.state === "suspended") ac.resume().catch(() => {});
  } catch {
    // ignore
  }
}

function noiseBurst(duration, gainValue, filterFreq) {
  const ac = audio();
  const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.value = gainValue;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

function tone(freq, duration, gainValue, type = "sine") {
  const ac = audio();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ac.currentTime + duration);
  gain.gain.setValueAtTime(gainValue, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

const SOUNDS = {
  tick: () => noiseBurst(0.03, 0.25, 3200), // cliquet de bobine
  stamp: () => {
    tone(140, 0.18, 0.5, "triangle"); // coup sourd du tampon
    noiseBurst(0.08, 0.3, 900);
  },
  whoosh: () => noiseBurst(0.25, 0.12, 600),
  projector: () => noiseBurst(0.12, 0.15, 2200),
  // Sons tactiles du portant 3D (cintre métallique sur barre chromée + léger frottement)
  hanger: (index = 0) => {
    const pitch = 2150 + ((index % 7) - 3) * 85;
    tone(pitch, 0.032, 0.045, "triangle");
    tone(pitch * 1.48, 0.022, 0.022, "sine");
    noiseBurst(0.024, 0.055, 1600);
  },
  hangerPull: () => {
    tone(1680, 0.045, 0.06, "triangle");
    tone(420, 0.14, 0.08, "sine");
    noiseBurst(0.16, 0.09, 750);
  },
  hangerReturn: () => {
    tone(1280, 0.04, 0.05, "triangle");
    noiseBurst(0.09, 0.065, 1100);
  },
  // Clap de cinéma sec (bois + léger impact grave d'onde)
  clap: () => {
    noiseBurst(0.038, 0.55, 2400);
    noiseBurst(0.065, 0.35, 950);
    tone(115, 0.24, 0.32, "sine");
  },
};

export function play(name, arg) {
  if (!soundsEnabled()) return;
  try {
    SOUNDS[name]?.(arg);
  } catch {
    // audio indisponible : silence
  }
}

export function vibrate(pattern = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // non supporté
  }
}

// --- Événements globaux ------------------------------------------------------

/** Un titre vient d'être marqué « vu » : la couche Ticket joue l'animation du tampon. */
export function emitWatched(item) {
  window.dispatchEvent(new CustomEvent("cv:watched", { detail: item }));
}

/** Ouvre l'aperçu rapide d'un film ou d'une série. */
export function openPreview(item, mediaType) {
  window.dispatchEvent(new CustomEvent("cv:preview", { detail: { item, mediaType } }));
}

/** Teinte l'aurore du fond avec la couleur dominante d'une affiche. */
export function emitTint(rgb) {
  window.dispatchEvent(new CustomEvent("cv:tint", { detail: rgb }));
}
