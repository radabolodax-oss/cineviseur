/**
 * CastCarousel — carrousel d'acteurs compact avec boutons précédent / suivant.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { EASE_OUT, SPRING } from "../lib/motionTokens";
import { tmdbImage } from "../lib/tmdb";
import Icon from "./Icon";

export default function CastCarousel({ cast = [] }) {
  const scroller = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () =>
      setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [cast.length]);

  if (!cast.length) return null;

  const scrollBy = (dir) => {
    const el = scroller.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative max-w-[1440px] mx-auto">
      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto scroll-smooth px-4 sm:px-6 md:px-10 pb-4 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cast.map((person, i) => (
          <motion.div
            key={person.id}
            className="shrink-0 w-20"
            initial={{ opacity: 0, x: 40, scale: 0.8 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: Math.min(i, 10) * 0.06, ease: EASE_OUT }}
          >
            <motion.div whileHover={{ y: -6, scale: 1.08 }} whileTap={{ scale: 0.95 }} transition={SPRING}>
              <Link
                to={`/person/${person.id}`}
                className="flex flex-col items-center gap-2 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/[0.06] ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-cine-soft group-hover:shadow-[0_0_22px_rgba(124,92,224,0.6)] transition-shadow duration-300">
                  {person.profile_path ? (
                    <img src={tmdbImage(person.profile_path, "profile")} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-white/40 text-xl font-display font-semibold">
                      {person.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-center w-full">
                  <p className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors leading-tight line-clamp-2">{person.name}</p>
                  {person.character && <p className="text-[10px] text-white/55 leading-tight line-clamp-1 mt-0.5">{person.character}</p>}
                </div>
              </Link>
            </motion.div>
          </motion.div>
        ))}
      </div>
      {!edge.start && (
        <button onClick={() => scrollBy(-1)} aria-label="Acteurs précédents" className="btn-icon hidden md:flex absolute left-2 top-8 z-10 bg-cine-ink/90">
          <Icon name="chevronLeft" />
        </button>
      )}
      {!edge.end && (
        <button onClick={() => scrollBy(1)} aria-label="Acteurs suivants" className="btn-icon hidden md:flex absolute right-2 top-8 z-10 bg-cine-ink/90">
          <Icon name="chevronRight" />
        </button>
      )}
    </div>
  );
}
