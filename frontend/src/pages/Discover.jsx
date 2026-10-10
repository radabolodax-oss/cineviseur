import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CarouselRow from "../components/CarouselRow";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import Icon from "../components/Icon";
import { SPRING, riseItem, stagger } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";

/** Ligne de tags qui défile en boucle infinie. Pause au survol. Les items restent cliquables. */
function InfiniteTagRow({ items, onSelect, activeLabel }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const paused = useRef(false);
  // Vitesse en px/s
  const SPEED = 60;

  // Largeur d'un exemplaire de la liste : estimée à 130px par item en moyenne
  const trackRef = useRef(null);

  useAnimationFrame((_, delta) => {
    if (reduce || paused.current) return;
    const track = trackRef.current;
    if (!track) return;
    const halfW = track.scrollWidth / 2;
    let next = x.get() - (SPEED * delta) / 1000;
    if (next <= -halfW) next += halfW;
    x.set(next);
  });

  // Items dupliqués pour la boucle sans couture
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden select-none"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <motion.div
        ref={trackRef}
        className="inline-flex gap-2 whitespace-nowrap"
        style={{ x }}
      >
        {doubled.map((cat, i) => (
          <button
            key={`${cat.label}-${i}`}
            onClick={() => onSelect(cat.label)}
            className={`btn shrink-0 !font-medium px-4 py-2 ring-1 ring-inset transition-all
              ${activeLabel === cat.label
                ? "bg-cine-violet text-white ring-cine-violet shadow-[0_0_16px_rgba(124,92,224,0.5)]"
                : "bg-white/[0.06] text-white/75 ring-white/10 hover:bg-white/[0.13] hover:text-white"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

const CATEGORIES = [
  { label: "Action", movie: 28 },
  { label: "Animation", movie: 16 },
  { label: "Comédie", movie: 35 },
  { label: "Crime", movie: 80 },
  { label: "Documentaire", movie: 99 },
  { label: "Drame", movie: 18 },
  { label: "Familial", movie: 10751 },
  { label: "Fantastique", movie: 14 },
  { label: "Horreur", movie: 27 },
  { label: "Mystère", movie: 9648 },
  { label: "Romance", movie: 10749 },
  { label: "Science-Fiction", movie: 878 },
  { label: "Thriller", movie: 53 },
  { label: "Guerre", movie: 10752 },
  { label: "Western", movie: 37 },
];

const SORTS = [
  { value: "popularity", label: "Popularité" },
  { value: "rating", label: "Mieux notés" },
  { value: "date", label: "Plus récents" },
  { value: "title", label: "A-Z" },
];

const MIN_RATINGS = [
  { value: "", label: "Toutes les notes" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 45 }, (_, i) => CURRENT_YEAR + 1 - i);

const BATCH_SIZE = 4;
const INITIAL_COUNT = 6;

function slug(label) {
  return `cat-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function FilterSelect({ icon, label, value, onChange, options }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="appearance-none bg-white/[0.06] ring-1 ring-inset ring-white/10 hover:ring-white/20 focus:ring-2 focus:ring-cine-soft/70 text-sm text-white/85 rounded-full pl-9 pr-9 py-2.5 outline-none transition cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#111116] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/55" />
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/55" />
    </label>
  );
}

export default function Discover() {
  useSeo("Découvrir", "Films à l'affiche, sorties en streaming, prochaines sorties et tout le catalogue par genre.");
  const [sort, setSort] = useState("popularity");
  const [minRating, setMinRating] = useState("");
  const [year, setYear] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [activeCategory, setActiveCategory] = useState(null);
  const isFiltered = Boolean(sort !== "popularity" || minRating || year);
  const sentinelRef = useRef(null);

  const rows = useMemo(() => {
    const base = [
      { id: "now-playing", title: "En ce moment au cinéma", mediaType: "movie", listKind: "now_playing" },
      { id: "streaming", title: "Sur vos plateformes", mediaType: "movie", listKind: "streaming" },
      { id: "upcoming", title: "Bientôt au cinéma", mediaType: "movie", listKind: "upcoming" },
      { id: "pop-movies", title: "Films populaires", mediaType: "movie" },
      { id: "pop-tv", title: "Séries populaires", mediaType: "tv" },
    ];
    // Une rangée par genre : le tri (popularité, note, date) se choisit avec le filtre,
    // pas en dupliquant chaque genre trois fois.
    const genreRows = CATEGORIES.map((cat) => ({
      id: slug(cat.label),
      title: cat.label,
      mediaType: "movie",
      genre: cat.movie,
    }));
    return [...base, ...genreRows];
  }, []);

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [sort, minRating, year]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + BATCH_SIZE, rows.length));
        }
      },
      { rootMargin: "800px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rows.length]);

  function jumpTo(label) {
    setActiveCategory(label);
    const id = slug(label);
    const index = rows.findIndex((r) => r.id === id);
    if (index >= 0 && index >= visibleCount) {
      setVisibleCount(Math.min(index + BATCH_SIZE, rows.length));
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="pt-12 pb-16">
      <motion.div className="px-4 sm:px-6 md:px-10 mb-8" initial="hidden" animate="show" variants={stagger(0.08)}>
        <motion.h1 variants={riseItem} className="font-display font-semibold text-4xl md:text-5xl tracking-tighter mb-3">
          Découvrir
        </motion.h1>
        <motion.p variants={riseItem} className="text-white/60 max-w-[55ch]">
          Ce qui sort au cinéma, ce qui arrive en streaming, et tout le catalogue par genre.
        </motion.p>
        <motion.div variants={riseItem} className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/ce-soir" className="btn-ghost">
            <Icon name="aperture" weight="bold" /> Ce soir, je regarde quoi ?
          </Link>
          <Link to="/swipe" className="link text-sm font-medium">Trier en swipant</Link>
        </motion.div>
      </motion.div>

      <div className="mb-5">
        <InfiniteTagRow items={CATEGORIES} onSelect={jumpTo} activeLabel={activeCategory} />
      </div>

      <div className="px-4 sm:px-6 md:px-10 flex flex-wrap items-center gap-2.5 mb-12 pb-8 border-b border-white/[0.08]">
        <FilterSelect icon="sort" label="Trier par" value={sort} onChange={(e) => setSort(e.target.value)} options={SORTS} />
        <FilterSelect icon="star" label="Note minimale" value={minRating} onChange={(e) => setMinRating(e.target.value)} options={MIN_RATINGS} />
        <FilterSelect
          icon="calendar"
          label="Année"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          options={[{ value: "", label: "Toutes les années" }, ...YEARS.map((y) => ({ value: y, label: y }))]}
        />
        <AnimatePresence>
          {isFiltered && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={SPRING}
              onClick={() => {
                setSort("popularity");
                setMinRating("");
                setYear("");
              }}
              className="btn px-3 py-2.5 text-white/60 hover:text-white"
            >
              <Icon name="x" className="w-3.5 h-3.5" /> Réinitialiser
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {rows.slice(0, visibleCount).map((row) => (
        <div id={row.id} key={row.id} className="scroll-mt-20">
          <CarouselRow
            title={row.title}
            mediaType={row.mediaType}
            genre={row.genre}
            sort={sort}
            minRating={minRating}
            year={year}
            listKind={row.listKind}
          />
        </div>
      ))}

      {visibleCount < rows.length && (
        <div ref={sentinelRef} aria-hidden="true" className="px-4 sm:px-6 md:px-10">
          <div className="h-6 w-48 rounded-full skeleton mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 aspect-[2/3] rounded-xl skeleton" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
