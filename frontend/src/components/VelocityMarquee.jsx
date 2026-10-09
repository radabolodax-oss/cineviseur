import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";

function wrap(min, max, v) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

/** Une ligne du bandeau : défile en continu, accélère et s'incline avec la vitesse du scroll. */
function MarqueeLine({ items, baseVelocity }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smoothVelocity, [-2000, 2000], [8, -8], { clamp: true });
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  // Deux copies côte à côte pour une boucle sans couture.
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div className="inline-flex items-center gap-10 pr-10" style={{ x, skewX }}>
        {row.map((word, i) => (
          <span
            key={i}
            className={`font-display font-semibold uppercase tracking-tighter text-6xl md:text-8xl leading-none ${
              i % 2 ? "text-transparent [-webkit-text-stroke:1.5px_rgba(244,244,246,0.35)]" : "text-white/90"
            }`}
          >
            {word}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/** Bandeau des genres : deux lignes en sens inverse. Un seul par page. */
export default function VelocityMarquee({ items }) {
  return (
    <section aria-hidden="true" className="py-16 md:py-24 flex flex-col gap-4 select-none">
      <MarqueeLine items={items} baseVelocity={-2.5} />
      <MarqueeLine items={[...items].reverse()} baseVelocity={2.5} />
    </section>
  );
}
