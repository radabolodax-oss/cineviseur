import { memo, useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Arrière-plan global cinématique :
 * Dégradés lumineux profonds bleutés/violets apportant contraste, chaleur et lisibilité.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#0a0c18]">
      {/* Halo supérieur violet/bleu cinéma vibrant */}
      <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1200px] h-[650px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,92,224,0.28)_0%,rgba(67,56,202,0.18)_40%,transparent_70%)] blur-[90px]" />
      {/* Halo d'ambiance latéral indigo */}
      <div className="absolute top-[30%] -left-[10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.16)_0%,transparent_65%)] blur-[100px]" />
      {/* Halo d'ambiance bas violet */}
      <div className="absolute -bottom-[15%] right-[5%] w-[850px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,92,224,0.2)_0%,rgba(147,51,234,0.1)_40%,transparent_70%)] blur-[100px]" />
    </div>
  );
}

/**
 * Contour lumineux qui s'oriente vers le curseur uniquement au survol de la carte parente
 * (aucun écouteur global sur document.body, rect mis en cache à l'entrée du pointeur).
 */
export const GlowingEffect = memo(function GlowingEffect({
  spread = 40,
  borderWidth = 2,
}) {
  const containerRef = useRef(null);
  const rectRef = useRef(null);
  const frameRef = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!el || !parent || reduce) return;

    function onEnter() {
      rectRef.current = parent.getBoundingClientRect();
      el.style.setProperty("--active", "1");
    }

    function onMove(e) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rect = rectRef.current || parent.getBoundingClientRect();
        const cx = rect.left + rect.width * 0.5;
        const cy = rect.top + rect.height * 0.5;
        const angle = (180 * Math.atan2(e.clientY - cy, e.clientX - cx)) / Math.PI + 90;
        el.style.setProperty("--start", String(angle));
      });
    }

    function onLeave() {
      cancelAnimationFrame(frameRef.current);
      rectRef.current = null;
      el.style.setProperty("--active", "0");
    }

    parent.addEventListener("pointerenter", onEnter, { passive: true });
    parent.addEventListener("pointermove", onMove, { passive: true });
    parent.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      cancelAnimationFrame(frameRef.current);
      parent.removeEventListener("pointerenter", onEnter);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="glowing-effect pointer-events-none absolute inset-0 z-[3] rounded-[inherit]"
      style={{ "--spread": spread, "--start": "0", "--active": "0", "--glow-border": `${borderWidth}px` }}
    />
  );
});

function generatePath(index, position, amplitude, segments) {
  const phase = index * 0.25;
  const points = [];
  const startX = 2400;
  const startY = 800;
  const endX = -2400;
  const endY = -800 + index * 35;
  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;
    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;
    const factor = 1 - eased * 0.3;
    const wave =
      Math.sin(progress * Math.PI * 3 + phase) * amplitude * 0.7 * factor +
      Math.cos(progress * Math.PI * 4 + phase) * amplitude * 0.3 * factor;
    points.push({ x: baseX * position, y: baseY + wave });
  }
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const t = 0.4;
      return `C ${prev.x + (p.x - prev.x) * t} ${prev.y}, ${prev.x + (p.x - prev.x) * (1 - t)} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");
}

/** Courbes lumineuses statiques (aucune boucle d'animation SVG pendant le scroll). */
export const BackgroundPaths = memo(function BackgroundPaths({ className = "" }) {
  const paths = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        d: generatePath(i, 1, 120, 8),
        width: 2.5 + i * 0.3,
        opacity: 0.1 + i * 0.02,
      })),
    []
  );

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid slice" viewBox="-2400 -800 4800 1600">
        <defs>
          <linearGradient id="cv-paths-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(124, 92, 224, 0.55)" />
            <stop offset="50%" stopColor="rgba(171, 152, 242, 0.45)" />
            <stop offset="100%" stopColor="rgba(49, 46, 129, 0.55)" />
          </linearGradient>
        </defs>
        <g>
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              stroke="url(#cv-paths-gradient)"
              strokeLinecap="round"
              strokeWidth={p.width}
              style={{ opacity: p.opacity }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
});

/** Texte au reflet qui balaie : réservé aux états d'attente. */
export function TextShimmer({ children, as = "span", className = "", duration = 2 }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const spread = children.length * 2;
  return (
    <Tag
      className={`relative inline-block bg-clip-text text-transparent [background-repeat:no-repeat,padding-box] bg-[length:250%_100%,auto] ${className}`}
      initial={{ backgroundPosition: "100% center" }}
      animate={reduce ? { backgroundPosition: "50% center" } : { backgroundPosition: "0% center" }}
      transition={reduce ? { duration: 0 } : { repeat: Infinity, duration, ease: "linear" }}
      style={{
        backgroundImage: `linear-gradient(90deg, transparent calc(50% - ${spread}px), #f4f4f6, transparent calc(50% + ${spread}px)), linear-gradient(rgba(244,244,246,0.55), rgba(244,244,246,0.55))`,
      }}
    >
      {children}
    </Tag>
  );
}
