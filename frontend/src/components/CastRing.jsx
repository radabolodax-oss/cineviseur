/**
 * CastRing — Carrousel 3D cylindrique du casting.
 * Inspiré du "Round Carousel" d'Originkit : cylindre CSS 3D, auto-rotation,
 * drag pour tourner, pause au survol. Pas de WebGL nécessaire.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { tmdbImage } from "../lib/tmdb";

const DRAG_SENSITIVITY = 0.35; // degrés par pixel de drag
const AUTO_SPEED = 0.012;       // degrés par ms

export default function CastRing({ cast }) {
  const reduce = useReducedMotion();
  const items = cast.slice(0, 12);
  const n = items.length;
  const RADIUS = Math.max(220, n * 36); // rayon du cylindre en px

  const [angle, setAngle] = useState(0);
  const [active, setActive] = useState(null);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const raf = useRef(null);
  const last = useRef(null);
  const angleRef = useRef(angle);
  const hovering = useRef(false);

  // Animation d'auto-rotation
  useEffect(() => {
    if (reduce) return;
    function tick(now) {
      if (last.current !== null && !hovering.current && !dragging.current) {
        const delta = now - last.current;
        angleRef.current = (angleRef.current + AUTO_SPEED * delta) % 360;
        setAngle(angleRef.current);
      }
      last.current = now;
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reduce]);

  // Drag sur desktop
  function onPointerDown(e) {
    dragging.current = true;
    lastX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    angleRef.current = (angleRef.current + dx * DRAG_SENSITIVITY) % 360;
    setAngle(angleRef.current);
  }
  function onPointerUp() { dragging.current = false; }

  return (
    <div className="relative w-full overflow-hidden py-10 select-none">
      {/* Scène 3D */}
      <div
        className="relative mx-auto cursor-grab active:cursor-grabbing"
        style={{ height: 260, width: "100%", perspective: 900 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onMouseEnter={() => { hovering.current = true; }}
        onMouseLeave={() => { hovering.current = false; setActive(null); }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((member, i) => {
            const theta = (360 / n) * i;
            const rad = ((theta + angle) * Math.PI) / 180;
            // Position sur le cylindre : x = sin, z = cos
            const x = Math.sin(rad) * RADIUS;
            const z = Math.cos(rad) * RADIUS;
            // Opacité proportionnelle à la profondeur (z normalisé)
            const zNorm = (z + RADIUS) / (2 * RADIUS); // 0 = derrière, 1 = devant
            const opacity = 0.25 + zNorm * 0.75;
            const scale = 0.72 + zNorm * 0.28;
            const isActive = active === i;

            return (
              <div
                key={member.id}
                className="absolute"
                style={{
                  transform: `translateX(${x}px) translateZ(${z}px)`,
                  opacity: reduce ? 1 : opacity,
                  transition: "opacity 0.1s",
                  zIndex: Math.round(zNorm * 100),
                }}
              >
                <Link
                  to={`/person/${member.id}`}
                  draggable={false}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-cine-soft rounded-2xl"
                  style={{ transform: `scale(${reduce ? 1 : scale})`, transformOrigin: "center center" }}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
                    style={{
                      width: 120,
                      height: 150,
                      transition: "box-shadow 0.3s",
                      boxShadow: isActive
                        ? "0 0 0 2px #ab98f2, 0 8px 40px rgba(124,92,224,0.6)"
                        : "0 8px 32px rgba(0,0,0,0.8)",
                    }}
                  >
                    {member.profile_path ? (
                      <img
                        src={tmdbImage(member.profile_path, "profile")}
                        alt={member.name}
                        draggable={false}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/10 flex items-center justify-center">
                        <span className="text-3xl">🎭</span>
                      </div>
                    )}
                    {/* Film sur l'objectif */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                  <div className="text-center w-28">
                    <p className="text-xs font-semibold text-white truncate leading-tight">{member.name}</p>
                    {member.character && (
                      <p className="text-[10px] text-white/50 truncate mt-0.5">{member.character}</p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fondu sur les côtés */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cine-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-cine-ink to-transparent" />

      <p className="text-center text-xs text-white/40 mt-2">Glisse pour faire tourner</p>
    </div>
  );
}
