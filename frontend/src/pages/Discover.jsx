import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CarouselRow from "../components/CarouselRow";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import Icon from "../components/Icon";
import SegmentedControl from "../components/SegmentedControl";
import { SPRING, riseItem, stagger } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";

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

/** Ligne de tags qui défile en boucle infinie. Pause au survol/focus ; défilement manuel si mouvement réduit. */
function InfiniteTagRow({ items, onSelect, activeLabel }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const paused = useRef(false);
  const trackRef = useRef(null);
  const SPEED = 50; // px/s

  useAnimationFrame((_, delta) => {
    if (reduce || paused.current) return;
    const track = trackRef.current;
    if (!track) return;
    const halfW = track.scrollWidth / 2;
    let next = x.get() - (SPEED * delta) / 1000;
    if (next <= -halfW) next += halfW;
    x.set(next);
  });

  const copies = reduce ? [items] : [items, items];

  return (
    <div
      className={`select-none py-1.5 ${reduce ? "overflow-x-auto [scrollbar-width:none] px-4 sm:px-6 md:px-10" : "overflow-hidden"}`}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }}
      onBlur={() => { paused.current = false; }}
    >
      <motion.div ref={trackRef} className="flex w-max gap-2 pr-2" style={{ x }}>
        {copies.map((list, copy) =>
          list.map((cat) => (
            <button
              key={`${copy}-${cat.label}`}
              onClick={() => onSelect(cat.label)}
              aria-hidden={copy > 0 || undefined}
              tabIndex={copy > 0 ? -1 : undefined}
              aria-pressed={activeLabel === cat.label}
              className="btn-chip"
            >
              {cat.label}
            </button>
          ))
        )}
      </motion.div>
    </div>
  );
}

const SORTS = [
  { value: "popularity", label: "Popularité" },
  { value: "rating", label: "Mieux notés" },
  { value: "date", label: "Récents" },
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
        className="appearance-none bg-white/[0.04] ring-1 ring-inset ring-white/[0.09] hover:ring-white/20 focus:ring-2 focus:ring-cine-soft/70 text-xs sm:text-sm text-white/85 rounded-full pl-9 pr-9 py-2 outline-none transition cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#111116] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/45" />
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
      { id: "streaming", title: "Nouveautés Streaming & VOD", mediaType: "movie", listKind: "streaming" },
      { id: "upcoming", title: "Prochaines sorties cinéma", mediaType: "movie", listKind: "upcoming" },
      { id: "pop-movies", title: "Films populaires", mediaType: "movie" },
      { id: "pop-tv", title: "Séries populaires", mediaType: "tv" },
    ];
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
    <div className="pt-10 pb-16">
      <motion.div className="px-4 sm:px-6 md:px-10 mb-8" initial="hidden" animate="show" variants={stagger(0.08)}>
        <motion.div variants={riseItem} className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cine-soft animate-ping" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cine-soft font-semibold">
            EXPLORATION & CATALOGUE
          </span>
        </motion.div>

        <motion.h1 variants={riseItem} className="page-title mb-3">
          Découvrir
        </motion.h1>
        <motion.p variants={riseItem} className="text-white/65 max-w-[55ch] text-base leading-relaxed">
          Ce qui sort au cinéma, ce qui arrive en streaming, et tout le catalogue mondial classé par genre.
        </motion.p>
        <motion.div variants={riseItem} className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/ce-soir" className="btn-ghost">
            <Icon name="aperture" weight="bold" /> Ce soir, je regarde quoi ?
          </Link>
          <Link to="/swipe" className="link text-sm font-medium">Trier en swipant (Soirée Duo)</Link>
        </motion.div>
      </motion.div>

      {/* Rangée de tags défilante */}
      <div className="mb-6">
        <InfiniteTagRow items={CATEGORIES} onSelect={jumpTo} activeLabel={activeCategory} />
      </div>

      {/* Barre de filtres interactive (Originkit SegmentedControl + Selects) */}
      <div className="px-4 sm:px-6 md:px-10 flex flex-wrap items-center justify-between gap-4 mb-12 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            options={SORTS}
            value={sort}
            onChange={setSort}
            size="sm"
            layoutId="discover-sort-pill"
          />

          <FilterSelect icon="star" label="Note minimale" value={minRating} onChange={(e) => setMinRating(e.target.value)} options={MIN_RATINGS} />
          <FilterSelect
            icon="calendar"
            label="Année"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={[{ value: "", label: "Toutes les années" }, ...YEARS.map((y) => ({ value: y, label: y }))]}
          />

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("cv:open-providers"))}
            className="btn-ghost !px-3.5 !py-2 text-xs flex items-center gap-2 !bg-white/[0.04] hover:!bg-white/[0.1] border border-white/10 rounded-full text-white/80"
          >
            <Icon name="tv" className="w-3.5 h-3.5 text-cine-soft" />
            <span>Mes plateformes</span>
          </button>
        </div>

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
              className="btn-chip !text-xs !py-1.5 text-white/60 hover:text-white"
            >
              <Icon name="x" className="w-3.5 h-3.5" /> Réinitialiser les filtres
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
              <div key={i} className="shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 aspect-[2/3] rounded-2xl skeleton" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
