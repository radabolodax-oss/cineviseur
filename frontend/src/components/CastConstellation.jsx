import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getPerson, tmdbImage } from "../lib/tmdb";
import { libraryKey } from "../lib/library";
import useLibrary from "../hooks/useLibrary";
import Icon from "./Icon";
import { EASE_OUT } from "../lib/motionTokens";

// Décalages verticaux en quinconce : les visages forment une constellation plutôt qu'une ligne.
const OFFSETS = [0, 34, 10, 46, 18, 40, 4, 30];

/** Combien de films de cet acteur sont dans ta liste (calculé au survol, mis en cache). */
function useOverlap(personId, active, index) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (!active || count !== null) return;
    getPerson(personId)
      .then((p) => {
        const credits = p.combined_credits?.cast || [];
        setCount(credits.filter((c) => index.has(libraryKey(c.media_type, c.id))).length);
      })
      .catch(() => setCount(0));
  }, [personId, active, index, count]);
  return count;
}

function Star({ person, i, active, dimmed, onHover, index, user, registerRef }) {
  const reduce = useReducedMotion();
  const overlap = useOverlap(person.id, active && user, index);
  return (
    <motion.div
      ref={registerRef}
      className="relative w-24 sm:w-28 shrink-0"
      style={{ marginTop: OFFSETS[i % OFFSETS.length] }}
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: (i % 8) * 0.06, ease: EASE_OUT }}
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.4 }}
      >
        <Link
          to={`/person/${person.id}`}
          onMouseEnter={() => onHover(person.id)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(person.id)}
          onBlur={() => onHover(null)}
          className={`group block text-center transition-[opacity,filter] duration-500 focus-visible:outline-none ${dimmed ? "opacity-35 blur-[1px]" : "opacity-100"}`}
        >
          <motion.div
            animate={{ scale: active ? 1.12 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`mx-auto aspect-square w-20 sm:w-24 overflow-hidden rounded-[30%] ring-2 transition-[box-shadow] duration-500 ${
              active ? "ring-cine-soft shadow-[0_0_40px_-6px_rgba(171,152,242,0.7)]" : "ring-white/10"
            } group-focus-visible:ring-cine-soft`}
          >
            {person.profile_path ? (
              <img src={tmdbImage(person.profile_path, "profile")} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-white/[0.06] text-white/55">
                <Icon name="user" className="h-7 w-7" weight="light" />
              </div>
            )}
          </motion.div>
          <p className="mt-2 text-[13px] font-semibold leading-tight line-clamp-1">{person.name}</p>
          <p className="text-xs text-white/55 line-clamp-1">{person.character}</p>
        </Link>
      </motion.div>
      <AnimatePresence>
        {active && user && overlap !== null && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-cine-violet px-3 py-1 text-xs font-semibold text-white shadow-lg"
          >
            {overlap === 0 ? "Aucun de ses films dans ta liste" : `${overlap} de ses films dans ta liste`}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Casting en constellation : visages flottants reliés par un fil de lumière. */
export default function CastConstellation({ cast }) {
  const { index, user } = useLibrary();
  const [hovered, setHovered] = useState(null);
  const wrapRef = useRef(null);
  const nodes = useRef([]);
  const [points, setPoints] = useState([]);

  // Positions des visages pour tracer le fil qui les relie (recalculées au redimensionnement).
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const base = wrap.getBoundingClientRect();
      setPoints(
        nodes.current.filter(Boolean).map((n) => {
          const r = n.getBoundingClientRect();
          return [r.left - base.left + wrap.scrollLeft + r.width / 2, r.top - base.top + 44];
        })
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [cast.length]);

  const width = points.length ? Math.max(...points.map((p) => p[0])) + 80 : 0;

  return (
    <div ref={wrapRef} className="relative overflow-x-auto px-4 sm:px-6 md:px-10 pt-12 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0" width={width} height="260">
        <motion.polyline
          points={points.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="url(#cast-line)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: EASE_OUT }}
        />
        <defs>
          <linearGradient id="cast-line" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(171,152,242,0)" />
            <stop offset="0.2" stopColor="rgba(171,152,242,0.45)" />
            <stop offset="0.8" stopColor="rgba(124,92,224,0.45)" />
            <stop offset="1" stopColor="rgba(124,92,224,0)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative flex gap-6 sm:gap-8">
        {cast.map((person, i) => (
          <Star
            key={person.credit_id || person.id}
            person={person}
            i={i}
            index={index}
            user={user}
            active={hovered === person.id}
            dimmed={hovered !== null && hovered !== person.id}
            onHover={setHovered}
            registerRef={(el) => (nodes.current[i] = el)}
          />
        ))}
      </div>
    </div>
  );
}
