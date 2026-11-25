import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import {
  SOUNDS_CHANGED_EVENT,
  play,
  setSoundsEnabled,
  soundsEnabled,
  unlockAudio,
  vibrate,
} from "../lib/feedback";
import { mediaTitle, mediaYear, tmdbImage } from "../lib/tmdb";
import Icon from "./Icon";

/**
 * Portant d'affiches 3D à physique de ressort 60fps + défilement infini vers la droite :
 * - Au repos : les affiches pendent de profil (~74°) serrées sur la barre métallique
 * - Au passage du curseur : onde gaussienne 3D qui ouvre 2-3 affiches face caméra, écarte les voisines
 *   avec balancement pendulaire (rotateZ) et fait défiler le rail automatiquement quand on approche des bords
 * - Pagination infinie : appelle onLoadMore() dès qu'on approche de la fin du portant (sans coupure)
 * - Au clic : l'affiche sort sous le spot avec rotation 3D au glisser + fiche vitrée teintée
 */
const ACCENTS = {
  emerald: {
    label: "text-emerald-300",
    badge: "bg-emerald-500/20 border-emerald-400/40 text-emerald-200",
    spot: "rgba(16, 185, 129, 0.24)",
    sheet: "from-emerald-950/92 via-[#0b1f1a]/90 to-[#07120f]/94 border-emerald-400/35",
    glow: "0 0 46px -8px rgba(16, 185, 129, 0.6)",
    btn: "bg-emerald-400 hover:bg-emerald-300 text-black",
  },
  crimson: {
    label: "text-rose-300",
    badge: "bg-rose-500/20 border-rose-400/40 text-rose-200",
    spot: "rgba(225, 29, 72, 0.3)",
    sheet: "from-rose-950/94 via-[#2b0912]/90 to-[#140509]/95 border-rose-400/40",
    glow: "0 0 46px -8px rgba(244, 63, 94, 0.65)",
    btn: "bg-rose-500 hover:bg-rose-400 text-white",
  },
  amber: {
    label: "text-amber-300",
    badge: "bg-amber-500/20 border-amber-400/40 text-amber-200",
    spot: "rgba(245, 158, 11, 0.25)",
    sheet: "from-amber-950/92 via-[#241607]/90 to-[#120b04]/95 border-amber-400/35",
    glow: "0 0 46px -8px rgba(245, 158, 11, 0.6)",
    btn: "bg-amber-400 hover:bg-amber-300 text-black",
  },
  indigo: {
    label: "text-indigo-300",
    badge: "bg-indigo-500/20 border-indigo-400/40 text-indigo-200",
    spot: "rgba(99, 102, 241, 0.26)",
    sheet: "from-indigo-950/94 via-[#11122c]/90 to-[#090918]/95 border-indigo-400/35",
    glow: "0 0 46px -8px rgba(99, 102, 241, 0.6)",
    btn: "bg-indigo-400 hover:bg-indigo-300 text-black",
  },
  purple: {
    label: "text-purple-300",
    badge: "bg-purple-500/20 border-purple-400/40 text-purple-200",
    spot: "rgba(168, 85, 247, 0.25)",
    sheet: "from-purple-950/94 via-[#1d0e2b]/90 to-[#0e0716]/95 border-purple-400/35",
    glow: "0 0 46px -8px rgba(168, 85, 247, 0.6)",
    btn: "bg-purple-400 hover:bg-purple-300 text-black",
  },
};

const RACK_STYLES = `
@keyframes sheetReveal {
  from { opacity: 0; transform: translate3d(24px, 0, 0) scale(0.96); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes posterPull {
  from { opacity: 0; transform: perspective(1200px) translate3d(-28px, 18px, -110px) rotateY(-42deg) scale(0.82); }
  to { opacity: 1; transform: perspective(1200px) translate3d(0, 0, 0) rotateY(0deg) scale(1); }
}
.locker-wood {
  background-color: #130e0b;
  background-image:
    radial-gradient(ellipse 46% 52% at 18% 0%, rgba(255, 214, 153, 0.16), transparent 68%),
    radial-gradient(ellipse 48% 54% at 50% 0%, rgba(255, 214, 153, 0.20), transparent 68%),
    radial-gradient(ellipse 46% 52% at 82% 0%, rgba(255, 214, 153, 0.16), transparent 68%),
    repeating-linear-gradient(
      90deg,
      rgba(255, 200, 140, 0.04) 0px,
      rgba(255, 200, 140, 0.04) 2px,
      rgba(0, 0, 0, 0.28) 2px,
      rgba(0, 0, 0, 0.28) 18px
    ),
    linear-gradient(180deg, #1d140e 0%, #110b08 55%, #080607 100%);
}
.locker-rail-bar {
  background: linear-gradient(180deg, #f9fafb 0%, #9ca3af 38%, #3f3f46 68%, #e5e7eb 100%);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(255, 255, 255, 0.75) inset;
}
@media (prefers-reduced-motion: reduce) {
  .locker-sheet, .locker-pull { animation: none !important; transition: none !important; }
}
`;

const POSTER_W = 164;
const BASE_SLOT_W = 58; // Espace occupé par un cintre de profil sur la barre
const OPEN_EXTRA_W = 132; // Espace supplémentaire lorsqu'une affiche s'ouvre face caméra
const PAD_LEFT = 96;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function resolveItemKind(item, fallbackType) {
  if (!item) return fallbackType || "movie";
  if (item.media_type === "tv" || item.media_type === "movie") return item.media_type;
  if (item.first_air_date && !item.release_date) return "tv";
  return fallbackType || "movie";
}

function formatRelease(item) {
  const raw = item.release_date || item.first_air_date;
  if (!raw) return "Prochainement";
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(`${raw}T12:00:00`)
    );
  } catch {
    return raw;
  }
}

export default function PosterRack({
  items = [],
  mediaType,
  sectionIndex = "01",
  sectionLabel = "SÉLECTION",
  sectionTitle = "Portant d'affiches",
  subtitle = "",
  accent = "crimson",
  pending = false,
  getSubtext,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  const theme = ACCENTS[accent] || ACCENTS.crimson;
  const [activeIndex, setActiveIndex] = useState(null);
  const [focusedBadge, setFocusedBadge] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [heroSpin, setHeroSpin] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [soundOn, setSoundOn] = useState(() => soundsEnabled());

  const stageRef = useRef(null);
  const itemRefs = useRef([]);
  const shadeRefs = useRef([]);
  const pointerRef = useRef({
    active: false,
    clientX: 0,
    relX: 0,
    normX: 0.5,
    focusSmooth: -1,
    lastIdx: -1,
    lastSoundAt: 0,
  });
  const scrollRef = useRef({ current: 0, target: 0, max: 0, lastLoadCount: -1 });
  const physRef = useRef([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const loadMoreRef = useRef({ fn: onLoadMore, hasMore, loadingMore });
  loadMoreRef.current = { fn: onLoadMore, hasMore, loadingMore };

  const heroDragRef = useRef({ down: false, startX: 0, startY: 0, baseRx: 0, baseRy: 0 });
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;

  const active = activeIndex !== null ? items[activeIndex] || null : null;

  // Synchronise la watchlist locale
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cv_local_watchlist");
      if (!raw) return;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        setSavedIds(new Set(list.map((entry) => Number(entry.tmdb_id || entry.id))));
      }
    } catch {
      // ignore
    }
  }, [items.length]);

  // Synchronise le réglage sonore + déverrouille WebAudio au premier geste
  useEffect(() => {
    const onChanged = (e) => setSoundOn(e.detail?.enabled ?? soundsEnabled());
    const onFirstGesture = () => unlockAudio();
    window.addEventListener(SOUNDS_CHANGED_EVENT, onChanged);
    window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
    return () => {
      window.removeEventListener(SOUNDS_CHANGED_EVENT, onChanged);
      window.removeEventListener("pointerdown", onFirstGesture);
    };
  }, []);

  // Ajoute les états physiques uniquement pour les nouveaux films chargés (jamais de reset brutal en plein défilement)
  useEffect(() => {
    const prev = physRef.current;
    if (items.length < prev.length) {
      // Filtre réinitialisé (ex: changement de genre sur Découvrir)
      physRef.current = [];
      scrollRef.current = { current: 0, target: 0, max: 0, lastLoadCount: -1 };
    }
    const base = physRef.current;
    for (let i = base.length; i < items.length; i++) {
      base.push({
        x: PAD_LEFT + i * BASE_SLOT_W,
        vx: 0,
        rotY: 74,
        vRotY: 0,
        swayZ: ((i % 3) - 1) * 1.1,
        vSwayZ: 0,
        z: 0,
        vz: 0,
        scale: 1,
        vScale: 0,
      });
    }
  }, [items]);

  // Navigation clavier quand une affiche est sortie
  useEffect(() => {
    if (activeIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        play("hangerReturn");
        setActiveIndex(null);
      } else if (e.key === "ArrowRight") {
        const nextIdx = (activeIndex + 1) % items.length;
        play("hanger", nextIdx);
        setHeroSpin({ rx: 0, ry: 0, gx: 50, gy: 50 });
        setActiveIndex(nextIdx);
        if (nextIdx >= items.length - 4 && loadMoreRef.current.hasMore && loadMoreRef.current.fn) {
          loadMoreRef.current.fn();
        }
      } else if (e.key === "ArrowLeft") {
        const prevIdx = (activeIndex - 1 + items.length) % items.length;
        play("hanger", prevIdx);
        setHeroSpin({ rx: 0, ry: 0, gx: 50, gy: 50 });
        setActiveIndex(prevIdx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, items.length]);

  // Boucle physique 60fps : rail infini glissant + ressorts + onde gaussienne + balancement pendulaire
  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.032, Math.max(0.004, (now - lastTime) / 1000));
      lastTime = now;

      const list = itemsRef.current;
      const count = list.length;
      const elStage = stageRef.current;
      if (!elStage || count === 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const stageW = elStage.clientWidth || 1100;
      const ptr = pointerRef.current;
      const scr = scrollRef.current;
      const isModalOpen = activeRef.current !== null;

      // Auto-défilement fluide quand le curseur approche le bord droit (ou gauche) du portant
      if (ptr.active && !isModalOpen && !reducedMotion) {
        if (ptr.normX > 0.78) {
          const edgeStrength = (ptr.normX - 0.78) / 0.22; // 0 -> 1
          scr.target += edgeStrength * edgeStrength * 640 * dt;
        } else if (ptr.normX < 0.16 && scr.target > 0) {
          const edgeStrength = (0.16 - ptr.normX) / 0.16;
          scr.target -= edgeStrength * edgeStrength * 640 * dt;
        }
      }

      // Calcul de l'indice continu pointé sur le rail infini
      let rawFocus = -1;
      if (ptr.active && !isModalOpen) {
        const worldX = ptr.relX + scr.current;
        rawFocus = clamp((worldX - PAD_LEFT) / BASE_SLOT_W, 0, count - 1);
      }

      if (rawFocus >= 0) {
        if (ptr.focusSmooth < 0) ptr.focusSmooth = rawFocus;
        else ptr.focusSmooth += (rawFocus - ptr.focusSmooth) * Math.min(1, dt * 16);

        const nearest = clamp(Math.round(ptr.focusSmooth), 0, count - 1);
        if (nearest !== ptr.lastIdx) {
          ptr.lastIdx = nearest;
          setFocusedBadge(nearest);
          if (now - ptr.lastSoundAt > 48) {
            ptr.lastSoundAt = now;
            play("hanger", nearest);
          }
        }
      } else {
        ptr.focusSmooth = -1;
      }

      // Calcule les positions mondiales cumulées le long du rail infini
      const influences = new Array(count);
      const targetXs = new Array(count);
      let cursorX = PAD_LEFT;

      for (let i = 0; i < count; i++) {
        let inf = 0;
        if (ptr.focusSmooth >= 0) {
          const d = i - ptr.focusSmooth;
          inf = Math.exp(-(d * d) / (2 * 1.15 * 1.15));
        }
        influences[i] = inf;
        const slotW = BASE_SLOT_W + inf * OPEN_EXTRA_W;
        targetXs[i] = cursorX + slotW * 0.5;
        cursorX += slotW;
      }

      const totalRailW = cursorX + PAD_LEFT;
      const maxScroll = Math.max(0, totalRailW - stageW);
      scr.max = maxScroll;
      scr.target = clamp(scr.target, 0, maxScroll);
      scr.current += (scr.target - scr.current) * Math.min(1, dt * 12);

      // Charge automatiquement la page TMDB suivante dès qu'on approche de la fin à droite
      const { fn, hasMore: canLoad, loadingMore: isFetching } = loadMoreRef.current;
      if (fn && canLoad && !isFetching && maxScroll > 0 && scr.target > maxScroll - 420 && scr.lastLoadCount !== count) {
        scr.lastLoadCount = count;
        fn();
      }

      // Mise à jour physique 60fps + culling hors-écran pour rester fluide même avec 100+ films
      for (let i = 0; i < count; i++) {
        const p = physRef.current[i];
        const node = itemRefs.current[i];
        if (!p || !node) continue;

        const inf = influences[i];
        const tX = targetXs[i];
        const sideSign = ptr.focusSmooth >= 0 ? (i < ptr.focusSmooth ? 1 : -1) : 1;
        const tRotY = ptr.focusSmooth >= 0 ? sideSign * 74 * (1 - inf) : 74;
        const tZ = inf * 36;
        const tScale = 1 + inf * 0.08;

        const screenApprox = tX - scr.current;
        if (screenApprox < -280 || screenApprox > stageW + 280) {
          p.x = tX;
          p.vx = 0;
          p.rotY = tRotY;
          p.z = tZ;
          p.scale = tScale;
          p.swayZ = 0;
          node.style.visibility = "hidden";
          continue;
        }
        node.style.visibility = "visible";

        if (reducedMotion) {
          p.x = tX;
          p.rotY = tRotY;
          p.z = tZ;
          p.scale = tScale;
          p.swayZ = 0;
        } else {
          const ax = (tX - p.x) * 145 - p.vx * 17;
          p.vx += ax * dt;
          p.x += p.vx * dt;

          const aRot = (tRotY - p.rotY) * 135 - p.vRotY * 15.5;
          p.vRotY += aRot * dt;
          p.rotY += p.vRotY * dt;

          const aZ = (tZ - p.z) * 135 - p.vz * 16;
          p.vz += aZ * dt;
          p.z += p.vz * dt;

          const aS = (tScale - p.scale) * 140 - p.vScale * 16;
          p.vScale += aS * dt;
          p.scale += p.vScale * dt;

          // Balancement pendulaire lié à la vitesse relative + glissement du rail
          const scrollVel = (scr.target - scr.current) * 6;
          const ambientBreath = Math.sin(now * 0.0014 + i * 0.7) * 0.6;
          const targetSway = clamp(-(p.vx - scrollVel * 0.35) * 0.022 + ambientBreath, -15, 15);
          const aSway = (targetSway - p.swayZ) * 85 - p.vSwayZ * 7.2;
          p.vSwayZ += aSway * dt;
          p.swayZ += p.vSwayZ * dt;
        }

        const screenX = p.x - scr.current - POSTER_W / 2;
        node.style.transform = `translate3d(${screenX.toFixed(2)}px, 0px, ${p.z.toFixed(2)}px) rotateY(${p.rotY.toFixed(2)}deg) rotateZ(${p.swayZ.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
        node.style.zIndex = String(Math.round(10 + inf * 90));

        const shadeEl = shadeRefs.current[i];
        if (shadeEl) {
          const darkness = clamp(Math.abs(p.rotY) / 95, 0.06, 0.72);
          shadeEl.style.opacity = darkness.toFixed(2);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function handleRailMove(e) {
    const stage = stageRef.current;
    if (!stage || items.length === 0) return;
    const rect = stage.getBoundingClientRect();
    const relX = clamp(e.clientX - rect.left, 0, rect.width);
    pointerRef.current.active = true;
    pointerRef.current.relX = relX;
    pointerRef.current.normX = relX / Math.max(1, rect.width);
  }

  function handleRailLeave() {
    pointerRef.current.active = false;
    pointerRef.current.lastIdx = -1;
    setFocusedBadge(null);
  }

  const panRail = useCallback((dir) => {
    if (itemsRef.current.length === 0) return;
    unlockAudio();
    const step = BASE_SLOT_W * 6;
    scrollRef.current.target = clamp(scrollRef.current.target + dir * step, 0, scrollRef.current.max + step);
    play("hanger", dir > 0 ? 5 : 2);
    if (dir > 0 && loadMoreRef.current.hasMore && loadMoreRef.current.fn) {
      if (scrollRef.current.target >= scrollRef.current.max - 420) {
        loadMoreRef.current.fn();
      }
    }
  }, []);

  function handleWheel(e) {
    // Supporte le défilement horizontal trackpad ou Shift + molette
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      scrollRef.current.target = clamp(scrollRef.current.target + delta * 1.4, 0, scrollRef.current.max);
    }
  }

  async function toggleWatchlist(item) {
    const id = Number(item.id);
    const kind = resolveItemKind(item, mediaType);
    const already = savedIds.has(id);
    try {
      if (already) {
        if (api.removeFromWatchlist) await api.removeFromWatchlist(id);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        if (api.addToWatchlist) {
          await api.addToWatchlist({
            tmdb_id: id,
            media_type: kind,
            title: mediaTitle(item),
            poster_path: item.poster_path || "",
            release_date: item.release_date || item.first_air_date || "",
            vote_average: item.vote_average || 0,
            status: "want",
          });
        }
        setSavedIds((prev) => new Set(prev).add(id));
      }
    } catch {
      // ignore
    }
  }

  function onHeroPointerDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    heroDragRef.current = {
      down: true,
      startX: e.clientX,
      startY: e.clientY,
      baseRx: heroSpin.rx,
      baseRy: heroSpin.ry,
    };
  }

  function onHeroPointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const gx = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const gy = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    if (heroDragRef.current.down) {
      const dx = e.clientX - heroDragRef.current.startX;
      const dy = e.clientY - heroDragRef.current.startY;
      setHeroSpin({
        rx: clamp(heroDragRef.current.baseRx - dy * 0.25, -26, 26),
        ry: clamp(heroDragRef.current.baseRy + dx * 0.35, -45, 45),
        gx,
        gy,
      });
    } else {
      setHeroSpin({
        rx: (0.5 - (e.clientY - rect.top) / rect.height) * 12,
        ry: ((e.clientX - rect.left) / rect.width - 0.5) * 16,
        gx,
        gy,
      });
    }
  }

  function onHeroPointerUp() {
    heroDragRef.current.down = false;
  }

  const activeKind = active ? resolveItemKind(active, mediaType) : mediaType || "movie";
  const activeSaved = active ? savedIds.has(Number(active.id)) : false;
  const focusedItem = focusedBadge !== null ? items[focusedBadge] : null;

  return (
    <section className="relative rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)] locker-wood">
      <style>{RACK_STYLES}</style>

      {/* Halo de couleur de section au plafond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-60 opacity-90"
        style={{
          background: `radial-gradient(ellipse 68% 75% at 50% -10%, ${theme.spot}, transparent 72%)`,
        }}
      />

      {/* Bandeau supérieur façon casier / vestiaire */}
      <div className="relative z-10 flex flex-col gap-3 px-5 sm:px-8 pt-5 pb-4 border-b border-white/[0.07] bg-black/25 backdrop-blur-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="font-mono text-[11px] font-bold tracking-[0.22em] px-2.5 py-1 rounded-md border bg-black/50 border-white/15 text-white/80">
            {sectionIndex}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono text-[10px] tracking-[0.26em] uppercase font-semibold ${theme.label}`}>
                {sectionLabel}
              </span>
              <span className="text-white/25">•</span>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/45">
                {pending
                  ? "CHARGEMENT..."
                  : `${items.length}${hasMore ? "+" : ""} AFFICHES SUR LE PORTANT`}
              </span>
              {loadingMore && (
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-emerald-300/80 animate-pulse">
                  · Chargement de la suite…
                </span>
              )}
            </div>
            <h2 className="font-display text-lg sm:text-2xl font-semibold text-white tracking-tight truncate">
              {sectionTitle}
            </h2>
            {subtitle && <p className="text-xs text-white/50 truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Barre inférieure fixe : indicateur en direct + son + flèches */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06]">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-white/65 min-w-0 truncate">
            {focusedItem ? (
              <>
                <span className={`font-bold ${theme.label}`}>#{String(focusedBadge + 1).padStart(2, "0")}</span>
                <span className="truncate">{mediaTitle(focusedItem)}</span>
              </>
            ) : (
              <span className="text-white/45 truncate">
                Glissez vers la droite pour dérouler à l'infini · Cliquez pour sortir
              </span>
            )}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !soundOn;
                setSoundsEnabled(next);
                setSoundOn(next);
                if (next) {
                  unlockAudio();
                  play("hanger", 3);
                }
              }}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Couper les sons du portant" : "Activer les sons du portant"}
              title={soundOn ? "Sons actifs (cliquer pour couper)" : "Sons coupés (cliquer pour activer)"}
              className={`h-8 px-3 rounded-full border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                soundOn
                  ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  : "border-white/15 bg-black/40 text-white/50 hover:text-white/80"
              }`}
            >
              <span aria-hidden="true">{soundOn ? "🔊" : "🔇"}</span>
              <span>{soundOn ? "Son" : "Muet"}</span>
            </button>
            <button
              type="button"
              onClick={() => panRail(-1)}
              aria-label={`Faire défiler ${sectionTitle} vers la gauche`}
              className="w-8 h-8 rounded-full border border-white/15 bg-black/40 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => panRail(1)}
              aria-label={`Faire défiler ${sectionTitle} vers la droite`}
              className="w-8 h-8 rounded-full border border-white/15 bg-black/40 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scène principale du portant 3D infini */}
      <div className="relative">
        {/* Spots lumineux encastrés au plafond */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-10 flex justify-around z-10"
        >
          {[0, 1, 2, 3].map((lamp) => (
            <div key={lamp} className="w-11 h-1.5 rounded-b-full bg-amber-100/90 shadow-[0_0_20px_5px_rgba(255,220,160,0.68)]" />
          ))}
        </div>

        {/* Barre métallique chromée continue */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-4 right-4 top-9 h-2.5 rounded-full locker-rail-bar z-10"
        />

        {/* Stage 3D infini piloté à 60fps (perspectiveOrigin calé sur la barre à 42px) */}
        <div
          ref={stageRef}
          onMouseMove={handleRailMove}
          onMouseLeave={handleRailLeave}
          onWheel={handleWheel}
          onTouchMove={(e) => {
            if (e.touches?.[0]) handleRailMove(e.touches[0]);
          }}
          className={`relative w-full h-[370px] sm:h-[400px] overflow-hidden select-none transition-all duration-500 ${
            active ? "opacity-25 scale-[0.97] blur-[1.5px] pointer-events-none" : "opacity-100"
          }`}
          style={{ perspective: "1350px", perspectiveOrigin: "50% 42px" }}
        >
          {pending && items.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-12 h-56 rounded-lg bg-white/[0.06] border border-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : (
            items.map((item, i) => {
              const title = mediaTitle(item);
              const year = mediaYear(item);
              const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
              const isClosest = focusedBadge === i;

              return (
                <div
                  key={`${item.media_type || mediaType || "m"}-${item.id}-${i}`}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="absolute top-9 left-0 pt-5"
                  style={{
                    width: `${POSTER_W}px`,
                    transformOrigin: "50% 0%",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                  }}
                >
                  {/* Crochet métallique accroché à la barre chromée */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20"
                  >
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-200/95 border-b-transparent -mt-0.5 shadow-sm" />
                    <div className="w-[2px] h-2.5 bg-gradient-to-b from-zinc-100 to-zinc-500 -mt-1" />
                    <div className="w-8 h-1.5 rounded-sm bg-gradient-to-r from-zinc-500 via-zinc-100 to-zinc-500 shadow-md" />
                  </div>

                  {/* Affiche suspendue */}
                  <button
                    type="button"
                    onFocus={() => {
                      pointerRef.current.active = true;
                      pointerRef.current.lastIdx = i;
                      setFocusedBadge(i);
                      const targetScroll = Math.max(0, PAD_LEFT + i * BASE_SLOT_W - (stageRef.current?.clientWidth || 900) / 2);
                      scrollRef.current.target = clamp(targetScroll, 0, scrollRef.current.max);
                    }}
                    onClick={() => {
                      unlockAudio();
                      play("hangerPull");
                      vibrate(14);
                      setActiveIndex(i);
                      setHeroSpin({ rx: 0, ry: 0, gx: 50, gy: 50 });
                    }}
                    aria-label={`Sortir l'affiche de ${title} du portant`}
                    className="group relative block w-full aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    style={{
                      boxShadow: isClosest
                        ? `0 28px 55px -12px rgba(0, 0, 0, 0.96), ${theme.glow}`
                        : "-10px 24px 36px -12px rgba(0, 0, 0, 0.95)",
                    }}
                  >
                    {item.poster_path ? (
                      <img
                        src={tmdbImage(item.poster_path, "poster")}
                        alt={`Affiche de ${title}`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                        <span className="font-mono text-2xl font-bold text-white/30 mb-2">
                          #{String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs font-semibold text-white/80 line-clamp-3">{title}</span>
                      </div>
                    )}

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/40 via-white/10 to-transparent"
                    />

                    <div
                      ref={(el) => {
                        shadeRefs.current[i] = el;
                      }}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-black"
                      style={{ opacity: 0.55 }}
                    />

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/95 via-black/45 to-transparent"
                    />

                    <span className="absolute top-2 left-2 font-mono text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/75 border border-white/15 text-white/95 backdrop-blur-sm">
                      #{String(i + 1).padStart(2, "0")}
                    </span>

                    {rating && (
                      <span className="absolute top-2 right-2 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/75 border border-amber-400/35 text-amber-300 backdrop-blur-sm">
                        ★ {rating}
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
                      <p className="font-display text-xs font-semibold text-white line-clamp-2 leading-tight drop-shadow">
                        {title}
                      </p>
                      <p className="font-mono text-[9px] text-amber-200/80 mt-0.5 truncate">
                        {getSubtext ? getSubtext(item) : year || "À venir"}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Scène héroïque : affiche extraite (pivotable en 3D) + fiche vitrée teintée */}
        {active && (
          <div
            role="dialog"
            aria-modal="false"
            aria-label={`Fiche de ${mediaTitle(active)}`}
            className="fixed inset-0 z-50 md:absolute md:inset-0 md:z-40 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 md:bg-black/55 backdrop-blur-md md:backdrop-blur-[3px]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                play("hangerReturn");
                setActiveIndex(null);
              }
            }}
          >
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5 sm:gap-7 items-center">
              <div className="locker-pull flex flex-col items-center">
                <div
                  onPointerDown={onHeroPointerDown}
                  onPointerMove={onHeroPointerMove}
                  onPointerUp={onHeroPointerUp}
                  onPointerCancel={onHeroPointerUp}
                  onMouseLeave={() => {
                    if (!heroDragRef.current.down) setHeroSpin({ rx: 0, ry: 0, gx: 50, gy: 50 });
                  }}
                  className="relative w-44 sm:w-52 md:w-60 aspect-[2/3] rounded-2xl overflow-hidden border border-white/25 bg-zinc-900 cursor-grab active:cursor-grabbing touch-none"
                  style={{
                    transform: `perspective(1000px) rotateX(${heroSpin.rx}deg) rotateY(${heroSpin.ry}deg)`,
                    transition: heroDragRef.current.down ? "none" : "transform 220ms ease-out",
                    boxShadow: `0 30px 70px -15px rgba(0,0,0,0.95), ${theme.glow}`,
                  }}
                >
                  {active.poster_path ? (
                    <img
                      src={tmdbImage(active.poster_path, "posterLarge")}
                      alt={`Affiche de ${mediaTitle(active)}`}
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-5 text-center text-white/80 font-display text-lg">
                      {mediaTitle(active)}
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at ${heroSpin.gx}% ${heroSpin.gy}%, rgba(255,255,255,0.24), transparent 55%)`,
                    }}
                  />
                </div>
                <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
                  Glissez l'affiche pour la pivoter en 3D
                </span>
              </div>

              <div
                className={`locker-sheet relative rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-5 sm:p-6 text-left shadow-2xl ${theme.sheet}`}
                style={{ animation: "sheetReveal 360ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
                  <span className={`font-mono text-[10px] tracking-[0.22em] uppercase px-2 py-0.5 rounded border ${theme.badge}`}>
                    FICHE CINEVISEUR · {sectionLabel}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/60">
                    <span>
                      {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx = (activeIndex - 1 + items.length) % items.length;
                        play("hanger", prevIdx);
                        setHeroSpin({ rx: 0, ry: 0, gx: 50, gy: 50 });
                        setActiveIndex(prevIdx);
                      }}
                      aria-label="Affiche précédente"
                      className="ml-1 w-7 h-7 rounded-md border border-white/15 bg-black/30 hover:bg-white/15 flex items-center justify-center text-white"
                    >
                      <Icon name="chevronLeft" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = (activeIndex + 1) % items.length;
                        play("hanger", nextIdx);
                        setHeroSpin({ rx: 0, ry: 0, gx: 50, gy: 50 });
                        setActiveIndex(nextIdx);
                        if (nextIdx >= items.length - 4 && hasMore && onLoadMore) onLoadMore();
                      }}
                      aria-label="Affiche suivante"
                      className="w-7 h-7 rounded-md border border-white/15 bg-black/30 hover:bg-white/15 flex items-center justify-center text-white"
                    >
                      <Icon name="chevronRight" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="font-mono text-3xl sm:text-4xl font-bold text-white/90 leading-none">
                    {String(activeIndex + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
                    {mediaTitle(active)}
                  </h3>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-y border-white/10 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-white/45">FORMAT</dt>
                    <dd className="font-semibold text-white/90">{activeKind === "tv" ? "Série" : "Film"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-white/45">NOTE TMDB</dt>
                    <dd className="font-mono font-bold text-amber-300">
                      {active.vote_average ? `★ ${active.vote_average.toFixed(1)} / 10` : "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-white/45">SORTIE</dt>
                    <dd className="font-medium text-white/85">{formatRelease(active)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-white/45">POPULARITÉ</dt>
                    <dd className="font-mono text-white/80">
                      {active.popularity ? Math.round(active.popularity) : "—"}
                    </dd>
                  </div>
                </dl>

                {active.overview && (
                  <p className="mt-3.5 text-xs sm:text-sm text-white/75 leading-relaxed line-clamp-3">
                    {active.overview}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <Link
                    to={`/title/${activeKind}/${active.id}`}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${theme.btn}`}
                  >
                    <span>Voir la fiche complète</span>
                    <Icon name="arrowRight" className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(active)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors"
                  >
                    <span>{activeSaved ? "✓ Dans ma liste" : "+ Ma Watchlist"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      play("hangerReturn");
                      setActiveIndex(null);
                    }}
                    className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-white/60 hover:text-white transition-colors px-2 py-1"
                  >
                    ← Retour au portant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
