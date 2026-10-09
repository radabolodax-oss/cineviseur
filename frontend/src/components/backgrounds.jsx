import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { animate, motion, useReducedMotion } from "motion/react";

/*
  Composants issus du catalogue 21st.dev, récupérés à leur source open source et adaptés à CineViseur :
  - AuroraBackground : Aceternity UI (Manu Arora), https://ui.aceternity.com
  - GlowingEffect : Aceternity UI (Manu Arora), https://ui.aceternity.com
  - BackgroundPaths : Kokonut UI (Dorian Baffier), MIT, https://github.com/kokonut-labs/kokonutui
  Adaptations : JavaScript au lieu de TypeScript, palette de la marque, animations en transform/opacity,
  pas d'écouteur de scroll, respect de prefers-reduced-motion.
*/

/**
 * Arrière-plan global, direction artistique « Dark Mode (OLED) » du skill ui-ux-pro-max :
 * base noir bleu nuit, puis une aurore indigo/violette qui dérive lentement en haut de l'écran.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-cine-ink">
      {/* Profondeur bleu nuit : un halo midnight en haut, le noir OLED en bas. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,#0A0E27_0%,#06070F_60%)]" />
      {/* Aurore : bandes de lumière floutées, masquées vers le coin haut-droit. */}
      <div className="absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(ellipse_90%_70%_at_85%_0%,black_10%,transparent_70%)]">
        <div className="aurora-layer absolute -inset-y-[10%] -left-[10%] w-[220%]" />
      </div>
      {/* Lueur basse très légère pour que le bas de page ne soit pas un aplat. */}
      <div className="absolute inset-x-0 bottom-0 h-[50vh] bg-[radial-gradient(ellipse_60%_80%_at_20%_100%,rgba(30,27,75,0.35),transparent_70%)]" />
    </div>
  );
}

/**
 * Contour lumineux qui s'oriente vers le curseur quand il approche de la carte.
 * À placer dans un parent `relative` arrondi.
 */
export const GlowingEffect = memo(function GlowingEffect({
  spread = 40,
  proximity = 64,
  inactiveZone = 0.01,
  movementDuration = 1.6,
  borderWidth = 2,
}) {
  const containerRef = useRef(null);
  const frame = useRef(0);
  const reduce = useReducedMotion();

  const handleMove = useCallback(
    (e) => {
      if (!containerRef.current) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        const center = [left + width * 0.5, top + height * 0.5];
        const distance = Math.hypot(e.clientX - center[0], e.clientY - center[1]);
        if (distance < 0.5 * Math.min(width, height) * inactiveZone) {
          el.style.setProperty("--active", "0");
          return;
        }
        const isActive =
          e.clientX > left - proximity &&
          e.clientX < left + width + proximity &&
          e.clientY > top - proximity &&
          e.clientY < top + height + proximity;
        el.style.setProperty("--active", isActive ? "1" : "0");
        if (!isActive) return;
        const current = parseFloat(el.style.getPropertyValue("--start")) || 0;
        const target = (180 * Math.atan2(e.clientY - center[1], e.clientX - center[0])) / Math.PI + 90;
        const diff = ((target - current + 180) % 360) - 180;
        animate(current, current + diff, {
          duration: movementDuration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (v) => el.style.setProperty("--start", String(v)),
        });
      });
    },
    [inactiveZone, proximity, movementDuration]
  );

  useEffect(() => {
    if (reduce) return;
    document.body.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame.current);
      document.body.removeEventListener("pointermove", handleMove);
    };
  }, [handleMove, reduce]);

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
  const phase = index * 0.2;
  const points = [];
  const startX = 2400;
  const startY = 800;
  const endX = -2400;
  const endY = -800 + index * 25;
  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;
    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;
    const factor = 1 - eased * 0.3;
    const wave =
      Math.sin(progress * Math.PI * 3 + phase) * amplitude * 0.7 * factor +
      Math.cos(progress * Math.PI * 4 + phase) * amplitude * 0.3 * factor +
      Math.sin(progress * Math.PI * 2 + phase) * amplitude * 0.2 * factor;
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

const LAYERS = [
  { count: 8, amplitude: 150, segments: 10, width: 4, step: 0.3, opacity: 0.15, drift: 15, duration: 8 },
  { count: 8, amplitude: 100, segments: 8, width: 3, step: 0.25, opacity: 0.12, drift: 10, duration: 6 },
  { count: 6, amplitude: 60, segments: 6, width: 2, step: 0.2, opacity: 0.1, drift: 5, duration: 4 },
];

/** Courbes lumineuses qui ondulent lentement, comme des faisceaux de projecteur. */
export const BackgroundPaths = memo(function BackgroundPaths({ className = "" }) {
  const reduce = useReducedMotion();
  const layers = useMemo(
    () =>
      LAYERS.map((layer, l) =>
        Array.from({ length: layer.count }, (_, i) => ({
          id: `${l}-${i}`,
          d: generatePath(i, 1, layer.amplitude, layer.segments),
          width: layer.width + i * layer.step,
          opacity: layer.opacity + i * 0.02,
        }))
      ),
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
        {layers.map((paths, l) => (
          <g key={l}>
            {paths.map((p) => (
              <motion.path
                key={p.id}
                d={p.d}
                stroke="url(#cv-paths-gradient)"
                strokeLinecap="round"
                strokeWidth={p.width}
                style={{ opacity: p.opacity }}
                initial={{ pathLength: 0.2, opacity: 0 }}
                animate={reduce ? { pathLength: 1, opacity: p.opacity } : { pathLength: 1, opacity: p.opacity, y: [0, -LAYERS[l].drift, 0] }}
                transition={{
                  pathLength: { duration: 2.4, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 1.2 },
                  y: { duration: LAYERS[l].duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                }}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
});

/** Texte au reflet qui balaie (Motion Primitives, TextShimmer) : réservé aux états d'attente. */
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
