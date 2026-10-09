import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { api } from "../lib/api";
import { tmdbImage } from "../lib/tmdb";
import useLibrary from "../hooks/useLibrary";
import useSeo from "../hooks/useSeo";
import Icon from "../components/Icon";
import { EASE_OUT } from "../lib/motionTokens";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const SLIDE_MS = 6000;

function CountUp({ value, className }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("fr-FR"));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.6, ease: EASE_OUT });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span className={className}>{text}</motion.span>;
}

// Détails TMDB (durée, genres, casting) des titres vus, 6 requêtes à la fois.
async function loadDetails(items) {
  const out = [];
  for (let i = 0; i < items.length; i += 6) {
    const batch = await Promise.all(items.slice(i, i + 6).map((it) => api.details(it.media_type, it.media_id, "fr").catch(() => null)));
    out.push(...batch);
  }
  return out.filter(Boolean);
}

function computeStats(watched, details) {
  const movies = details.filter((d) => d.title);
  const minutes = movies.reduce((s, d) => s + (d.runtime || 0), 0);
  const genres = new Map();
  const actors = new Map();
  for (const d of details) {
    for (const g of d.genres || []) genres.set(g.name, (genres.get(g.name) || 0) + 1);
    for (const a of (d.credits?.cast || []).slice(0, 10)) {
      const prev = actors.get(a.id) || { ...a, count: 0 };
      actors.set(a.id, { ...prev, count: prev.count + 1 });
    }
  }
  const topGenre = [...genres.entries()].sort((a, b) => b[1] - a[1])[0];
  const topActor = [...actors.values()].sort((a, b) => b.count - a.count)[0];
  const months = new Array(12).fill(0);
  watched.forEach((w) => months[new Date(w.watched_at || w.added_at).getMonth()]++);
  const topMonth = months.indexOf(Math.max(...months));
  const genrePosters = topGenre ? details.filter((d) => d.genres?.some((g) => g.name === topGenre[0]) && d.poster_path).slice(0, 6) : [];
  return { count: watched.length, movies: movies.length, shows: details.length - movies.length, hours: Math.round(minutes / 60), topGenre, topActor, months, topMonth, genrePosters };
}

/** Image 1080×1920 du récap, prête à partager en story. */
async function shareImage(stats, yearValue) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const c = canvas.getContext("2d");
  const g = c.createRadialGradient(800, -100, 100, 540, 600, 1600);
  g.addColorStop(0, "#3b2a8a");
  g.addColorStop(0.5, "#0a0e27");
  g.addColorStop(1, "#06070f");
  c.fillStyle = g;
  c.fillRect(0, 0, 1080, 1920);
  c.fillStyle = "#ab98f2";
  c.font = "600 44px 'Clash Display', sans-serif";
  c.fillText(`MON ANNÉE CINÉ ${yearValue}`, 90, 220);
  c.fillStyle = "#f4f4f6";
  c.font = "600 300px 'Clash Display', sans-serif";
  c.fillText(String(stats.count), 80, 560);
  c.font = "500 56px 'Outfit Variable', sans-serif";
  c.fillText("titres vus", 96, 650);
  const lines = [
    [`${stats.hours} h`, "de films"],
    [stats.topGenre?.[0] || "-", "genre favori"],
    [stats.topActor?.name || "-", "acteur le plus croisé"],
    [MONTHS[stats.topMonth], "mois le plus ciné"],
  ];
  lines.forEach(([big, small], i) => {
    const y = 860 + i * 230;
    c.fillStyle = "#f4f4f6";
    c.font = "600 84px 'Clash Display', sans-serif";
    c.fillText(big, 90, y);
    c.fillStyle = "rgba(244,244,246,0.6)";
    c.font = "400 40px 'Outfit Variable', sans-serif";
    c.fillText(small, 94, y + 60);
  });
  c.fillStyle = "#ab98f2";
  c.font = "600 48px 'Clash Display', sans-serif";
  c.fillText("CINEVISEUR", 90, 1800);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  const file = new File([blob], `cineviseur-${yearValue}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `Mon année ciné ${yearValue}` }).catch(() => {});
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

export default function Recap() {
  const yearValue = new Date().getFullYear();
  useSeo(`Ton année ciné ${yearValue}`, "Ton récap : titres vus, heures de films, genre favori et acteur le plus croisé.");
  const { list, user } = useLibrary();
  const [details, setDetails] = useState(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const watched = useMemo(
    () => list.filter((w) => w.status === "watched" && new Date(w.watched_at || w.added_at).getFullYear() === yearValue),
    [list, yearValue]
  );

  useEffect(() => {
    if (!user) return;
    if (!watched.length) {
      setDetails([]);
      return;
    }
    loadDetails(watched.slice(0, 60)).then(setDetails);
  }, [watched, user]);

  const stats = useMemo(() => (details ? computeStats(watched, details) : null), [watched, details]);

  const slides = stats
    ? [
        {
          key: "count",
          body: (
            <>
              <p className="text-xl text-white/70">En {yearValue}, tu as vu</p>
              <CountUp value={stats.count} className="block font-display text-[clamp(7rem,30vw,16rem)] font-semibold leading-none tracking-tighter" />
              <p className="text-2xl text-white/80">titres. {stats.movies} films, {stats.shows} séries.</p>
            </>
          ),
        },
        {
          key: "hours",
          body: (
            <>
              <p className="text-xl text-white/70">Rien qu'en films, ça fait</p>
              <p className="font-display text-[clamp(5rem,22vw,12rem)] font-semibold leading-none tracking-tighter">
                <CountUp value={stats.hours} /> h
              </p>
              <p className="text-2xl text-white/80">devant l'écran. Soit {Math.round(stats.hours / 24)} jours complets.</p>
            </>
          ),
        },
        stats.topGenre && {
          key: "genre",
          body: (
            <>
              <p className="text-xl text-white/70">Ton genre de prédilection</p>
              <p className="font-display text-[clamp(3.5rem,14vw,8rem)] font-semibold leading-none tracking-tighter">{stats.topGenre[0]}</p>
              <div className="mt-8 flex justify-center -space-x-6">
                {stats.genrePosters.map((d, i) => (
                  <motion.img
                    key={d.id}
                    src={tmdbImage(d.poster_path, "poster")}
                    alt=""
                    className="w-24 sm:w-28 aspect-[2/3] rounded-xl object-cover ring-2 ring-cine-ink shadow-2xl"
                    initial={{ opacity: 0, y: 60, rotate: (i - 2.5) * 8 }}
                    animate={{ opacity: 1, y: 0, rotate: (i - 2.5) * 6 }}
                    transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 180, damping: 18 }}
                  />
                ))}
              </div>
            </>
          ),
        },
        stats.topActor && {
          key: "actor",
          body: (
            <>
              <p className="text-xl text-white/70">Le visage que tu as le plus croisé</p>
              <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 16 }} className="mx-auto my-6 w-40 aspect-square overflow-hidden rounded-[30%] ring-4 ring-cine-soft shadow-[0_0_80px_-10px_rgba(171,152,242,0.8)]">
                {stats.topActor.profile_path && <img src={tmdbImage(stats.topActor.profile_path, "posterLarge")} alt={stats.topActor.name} className="h-full w-full object-cover" />}
              </motion.div>
              <p className="font-display text-5xl font-semibold tracking-tight">{stats.topActor.name}</p>
              <p className="mt-2 text-xl text-white/70">dans {stats.topActor.count} de tes titres</p>
            </>
          ),
        },
        {
          key: "month",
          body: (
            <>
              <p className="text-xl text-white/70">Ton mois le plus ciné</p>
              <p className="font-display text-[clamp(4rem,18vw,10rem)] font-semibold leading-none tracking-tighter capitalize">{MONTHS[stats.topMonth]}</p>
              <div className="mx-auto mt-10 flex h-32 max-w-md items-end gap-1.5" aria-hidden="true">
                {stats.months.map((m, i) => (
                  <motion.div
                    key={i}
                    className={`flex-1 rounded-t-md ${i === stats.topMonth ? "bg-cine-soft" : "bg-white/20"}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: Math.max(0.04, m / Math.max(...stats.months)) }}
                    style={{ height: "100%", originY: 1 }}
                    transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 160, damping: 20 }}
                  />
                ))}
              </div>
            </>
          ),
        },
        {
          key: "wall",
          body: (
            <>
              <p className="font-display text-4xl font-semibold tracking-tight mb-8">Ton année en affiches</p>
              <div className="mx-auto grid max-w-2xl grid-cols-5 sm:grid-cols-8 gap-1.5">
                {details.filter((d) => d.poster_path).slice(0, 40).map((d, i) => (
                  <motion.img
                    key={d.id}
                    src={tmdbImage(d.poster_path, "thumb")}
                    alt=""
                    className="aspect-[2/3] w-full rounded-md object-cover"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                  />
                ))}
              </div>
              <button onClick={() => shareImage(stats, yearValue)} className="btn-primary mt-10">
                <Icon name="download" weight="bold" /> Partager mon récap
              </button>
            </>
          ),
        },
      ].filter(Boolean)
    : [];

  // Avance automatique façon story, en pause tant qu'on maintient l'écran.
  useEffect(() => {
    if (!slides.length || paused || slide >= slides.length - 1) return;
    const t = setTimeout(() => setSlide((s) => s + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide, slides.length, paused]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setSlide((s) => Math.min(s + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  if (!stats)
    return (
      <div className="min-h-[100dvh] grid place-items-center">
        <p className="text-white/60">On rembobine ton année...</p>
      </div>
    );

  if (!stats.count)
    return (
      <div className="max-w-xl mx-auto px-4 pt-24 pb-24 text-center">
        <Icon name="popcorn" className="mx-auto mb-6 h-12 w-12 text-cine-soft" weight="light" />
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-3">Ton année ciné {yearValue}</h1>
        <p className="text-white/65 mb-8">Marque des films comme « vus » pour que ton récap prenne forme.</p>
        <Link to="/swipe" className="btn-primary">Trier des films</Link>
      </div>
    );

  const current = slides[Math.min(slide, slides.length - 1)];

  return (
    <div
      className="relative -mt-16 min-h-[100dvh] overflow-hidden select-none"
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
    >
      <div className="absolute inset-x-4 top-20 z-10 flex gap-1.5" aria-hidden="true">
        {slides.map((s, i) => (
          <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full origin-left bg-white"
              initial={false}
              animate={{ scaleX: i < slide ? 1 : i === slide ? 1 : 0 }}
              transition={i === slide && !paused ? { duration: SLIDE_MS / 1000, ease: "linear" } : { duration: 0.2 }}
            />
          </div>
        ))}
      </div>

      <button className="absolute inset-y-0 left-0 z-[5] w-1/4" aria-label="Diapositive précédente" onClick={() => setSlide((s) => Math.max(0, s - 1))} />
      <button className="absolute inset-y-0 right-0 z-[5] w-1/4" aria-label="Diapositive suivante" onClick={() => setSlide((s) => Math.min(slides.length - 1, s + 1))} />

      <AnimatePresence mode="wait">
        <motion.section
          key={current.key}
          className="pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto relative z-[6] mx-auto flex min-h-[100dvh] max-w-3xl flex-col items-center justify-center px-6 pt-24 pb-16 text-center"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          {current.body}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
