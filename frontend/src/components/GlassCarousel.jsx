/**
 * GlassCarousel — Carrousel horizontal avec loupe en verre liquide.
 * Inspiré du "Liquid Glass Carousel" d'Originkit :
 * la carte centrale est agrandie et filtrée comme à travers un verre.
 */
import { useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { tmdbImage, mediaTitle, mediaYear } from "../lib/tmdb";
import { SPRING } from "../lib/motionTokens";

const CARD_W = 160; // px
const CARD_GAP = 12;
const CARD_STEP = CARD_W + CARD_GAP;

export default function GlassCarousel({ items = [], mediaType = "movie", title }) {
  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const spring = useSpring(x, { stiffness: 300, damping: 40, mass: 0.8 });
  const [hoverIdx, setHoverIdx] = useState(null);

  // Limite de défilement
  const maxOffset = useCallback(
    () => -Math.max(0, items.length * CARD_STEP - (trackRef.current?.offsetWidth || 800) + CARD_GAP),
    [items.length]
  );

  // Drag
  const dragX = useRef(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  function onPointerDown(e) {
    isDragging.current = false;
    startX.current = e.clientX;
    dragX.current = x.get();
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 4) isDragging.current = true;
    if (!isDragging.current) return;
    const next = Math.min(0, Math.max(maxOffset(), dragX.current + dx));
    x.set(next);
  }
  function onPointerUp() { isDragging.current = false; }

  if (!items.length) return null;

  return (
    <div>
      {title && <h3 className="font-display text-xl font-semibold mb-4">{title}</h3>}
      <div
        ref={trackRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <motion.div
          className="flex gap-3 will-change-transform"
          style={{ x: spring }}
        >
          {items.map((item, i) => {
            const isHovered = hoverIdx === i;
            return (
              <Link
                key={`${item.id}-${i}`}
                to={`/title/${mediaType}/${item.id}`}
                draggable={false}
                onClick={(e) => { if (isDragging.current) e.preventDefault(); }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className="shrink-0 outline-none"
                style={{ width: CARD_W }}
              >
                <motion.div
                  animate={{
                    scale: isHovered ? 1.12 : 1,
                    y: isHovered ? -8 : 0,
                  }}
                  transition={SPRING}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    width: CARD_W,
                    aspectRatio: "2/3",
                    // Effet verre sur la carte active
                    filter: isHovered
                      ? "drop-shadow(0 0 20px rgba(124,92,224,0.6)) drop-shadow(0 12px 32px rgba(0,0,0,0.8))"
                      : "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                  }}
                >
                  {item.poster_path ? (
                    <img
                      src={tmdbImage(item.poster_path, "poster")}
                      alt={mediaTitle(item)}
                      draggable={false}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-white/[0.07] rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}

                  {/* Overlay gradient au survol */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Reflet verre en haut */}
                  <motion.div
                    className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-2xl pointer-events-none"
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                  />

                  {/* Texte au survol */}
                  <motion.div
                    className="absolute inset-x-0 bottom-0 p-3"
                    animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{mediaTitle(item)}</p>
                    <p className="text-[10px] text-white/60 mt-0.5">{mediaYear(item)}</p>
                  </motion.div>

                  {/* Anneau violet */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl ring-2 ring-cine-soft pointer-events-none"
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                  />
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
