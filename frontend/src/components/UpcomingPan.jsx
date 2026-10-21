import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { getUpcoming, mediaTitle, tmdbImage, tmdbSrcSet } from "../lib/tmdb";
import { EASE_OUT } from "../lib/motionTokens";
import { TiltCard } from "./motion";
import { BackgroundPaths } from "./backgrounds";

const wideScreen = typeof window !== "undefined" && window.matchMedia?.("(min-width: 768px)").matches;

function formatDay(date) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric" });
}
function formatMonth(date) {
  return new Date(date).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
}

function UpcomingCard({ item, index }) {
  return (
    <Link
      to={`/title/movie/${item.id}`}
      className={`group block shrink-0 w-[220px] md:w-[280px] focus-visible:outline-none ${index % 2 ? "md:mt-16" : ""}`}
    >
      <TiltCard className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/[0.05] ring-1 ring-inset ring-white/10 group-hover:ring-white/25 group-focus-visible:ring-2 group-focus-visible:ring-emerald-400 transition-[box-shadow] duration-300 group-hover:shadow-[0_24px_50px_-16px_rgba(16,185,129,0.25)]">
        <img
          src={tmdbImage(item.poster_path, "posterLarge")} srcSet={tmdbSrcSet(item.poster_path, "poster")} sizes="(min-width: 768px) 280px, 220px" decoding="async"
          alt={`Affiche de ${mediaTitle(item)}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </TiltCard>
      <div className="flex items-end gap-3 pt-4">
        <p className="font-display font-semibold text-5xl leading-none tabular-nums tracking-tighter">{formatDay(item.release_date)}</p>
        <div className="min-w-0 pb-0.5">
          <p className="text-xs uppercase tracking-wide text-emerald-400 font-semibold font-mono">{formatMonth(item.release_date)}</p>
          <p className="text-sm font-medium truncate text-white/85 group-hover:text-white transition-colors">{mediaTitle(item)}</p>
        </div>
      </div>
    </Link>
  );
}

function Heading() {
  return (
    <div className="shrink-0 w-[260px] md:w-[360px] self-center pr-6">
      <h2 className="font-display font-semibold text-4xl md:text-6xl tracking-tighter leading-[0.95] mb-4">Bientôt au cinéma</h2>
      <p className="text-white/60 max-w-[28ch]">Les prochaines sorties en salle, dans l'ordre du calendrier.</p>
    </div>
  );
}

/** Scroll vertical → défilement horizontal des prochaines sorties (section épinglée). */
function PinnedTrack({ items }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [distance, setDistance] = useState(0);

  // La distance à parcourir = largeur de la piste moins la largeur de l'écran ; recalculée au redimensionnement.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [items.length]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const x = useTransform(progress, [0, 1], [0, -distance]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: `calc(100dvh + ${distance}px)` }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden flex items-center">
        <BackgroundPaths className="opacity-70" />
        <motion.div ref={trackRef} style={{ x }} className="relative flex items-start gap-8 px-10 will-change-transform">
          <Heading />
          {items.map((item, i) => (
            <UpcomingCard key={item.id} item={item} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function UpcomingPan() {
  const reduce = useReducedMotion();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    getUpcoming()
      .then((list) =>
        setItems(
          list
            .filter((m) => m.poster_path && m.release_date && m.release_date >= today)
            .sort((a, b) => a.release_date.localeCompare(b.release_date))
            .slice(0, 14)
        )
      )
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  if (reduce || !wideScreen) {
    return (
      <section className="py-12">
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Heading />
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              className="snap-start"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.05, ease: EASE_OUT }}
            >
              <UpcomingCard item={item} index={0} />
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  return <PinnedTrack items={items} />;
}
