import { lazy, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { getNowPlaying, getTrending, tmdbImage, tmdbSrcSet } from "../lib/tmdb";
import InstallButton from "../components/InstallButton";
import CarouselRow from "../components/CarouselRow";
import Icon from "../components/Icon";
import WhenNear from "../components/WhenNear";
import SpotlightCard from "../components/SpotlightCard";
import {
  InteractiveSeriesPreview,
  InteractiveTicketPreview,
  InteractiveDuoPreview,
  InteractiveImportPreview,
} from "../components/FeatureDemos";

// Sections sous la ligne de flottaison : chargées seulement quand on s'en approche.
const UpcomingPan = lazy(() => import("../components/UpcomingPan"));
const VelocityMarquee = lazy(() => import("../components/VelocityMarquee"));
import { EASE_OUT, riseItem } from "../lib/motionTokens";
import { play } from "../lib/feedback";
import useSeo from "../hooks/useSeo";

const GENRES = ["Action", "Drame", "Science-fiction", "Thriller", "Animation", "Comédie", "Horreur", "Romance", "Documentaire", "Western"];

const ROTATE_MS = 8000;

function Hero({ featured }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  // Parallaxe au scroll
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % featured.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [featured.length]);

  const current = featured[index];
  const year = current?.release_date ? current.release_date.slice(0, 4) : "";
  const rating = current?.vote_average ? current.vote_average.toFixed(1) : null;

  return (
    <section ref={ref} className="relative -mt-16 min-h-[92dvh] flex items-end overflow-hidden">
      {/* Image de fond cinématique haute fidélité */}
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: imageY }} aria-hidden="true">
        <AnimatePresence initial={false}>
          {current && (
            <motion.img
              key={current.id}
              src={tmdbImage(current.backdrop_path, "backdrop")}
              srcSet={tmdbSrcSet(current.backdrop_path, "backdrop")}
              sizes="100vw"
              decoding="async"
              alt=""
              fetchPriority={index === 0 ? "high" : "low"}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{
                opacity: 0.65,
                scale: 1,
                transition: { duration: 1.2, ease: EASE_OUT },
              }}
              exit={{ opacity: 0, transition: { duration: 1.1, ease: EASE_OUT } }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dégradés d'ambiance salle de cinéma (noir graphite profond et halo projecteur 35mm) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/55 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07080c]/90 via-[#07080c]/40 to-transparent" aria-hidden="true" />

      {/* Contenu du Hero centré sur l'œuvre */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pb-16 md:pb-24 pt-24"
      >
        <div className="max-w-3xl">
          {/* Témoin d'ambiance cabine de projection (Orbe Hardware style) */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-medium uppercase tracking-[0.18em] text-white/70 mb-4">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse" />
              À L'AFFICHE • 0{index + 1}
            </span>
            {year && <span className="text-white/50">{year}</span>}
            {rating && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold font-mono">
                ★ {rating}
              </span>
            )}
          </div>

          <h1 className="font-display font-semibold text-4xl sm:text-6xl md:text-7xl leading-[0.98] uppercase tracking-tighter mb-5 text-white drop-shadow-lg">
            {current?.title || "Le cinéma en direct"}
          </h1>

          {current?.overview && (
            <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-[55ch] leading-relaxed mb-8 line-clamp-3">
              {current.overview}
            </p>
          )}

          {/* Boutons d'action tactiles matériels (Orbe Audio / OriginKit) */}
          <div className="flex flex-wrap items-center gap-3.5 mb-10">
            {current && (
              <Link
                to={`/title/movie/${current.id}`}
                className="btn-primary !px-7 !py-3.5 text-sm sm:text-base group"
              >
                <span>Fiche du film</span>
                <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" weight="bold" />
              </Link>
            )}
            <Link
              to="/watchlist"
              className="btn-ghost !px-6 !py-3.5 text-sm sm:text-base"
            >
              <Icon name="list" className="w-4 h-4 text-white/70" />
              <span>Ma liste</span>
            </Link>
            <Link
              to="/ce-soir"
              className="btn-ghost !px-5 !py-3.5 text-sm sm:text-base hidden sm:inline-flex"
            >
              <Icon name="dice" className="w-4 h-4 text-amber-400" />
              <span>Film au hasard</span>
            </Link>
          </div>

          {/* Sélecteur de bobine tactile (Hardware Console Switcher) */}
          {featured.length > 1 && (
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl shadow-lg">
              <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase px-2 hidden sm:inline">
                BOBINE :
              </span>
              {featured.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    play("tick");
                    setIndex(i);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                    i === index
                      ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label={`Passer au film ${i + 1}`}
                >
                  0{i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function FeatureShowcase() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="text-xs font-mono font-medium tracking-[0.2em] uppercase text-amber-400/90 block mb-2">
            OUTILS & EXPÉRIENCE DE SALLE
          </span>
          <h2 className="section-title !text-3xl md:!text-5xl tracking-tight text-white">
            Conçu pour ceux qui vivent le cinéma
          </h2>
          <p className="text-white/70 text-base max-w-2xl mt-2">
            Zéro compte imposé, zéro publicité. Des outils physiques et instantanés pour vos séances, vos séries et vos souvenirs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/cinemas"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] active:translate-y-0.5"
          >
            <Icon name="pin" className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salles de cinéma</span>
          </Link>
          <InstallButton className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] active:translate-y-0.5 cursor-pointer" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Suivi des séries */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] via-[#0d0e15] to-[#07080c] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
          spotlightColor="rgba(245, 158, 11, 0.16)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-white/[0.06] border border-white/15 text-white/90 font-semibold">
                SÉRIES & SAISONS
              </span>
              <span className="text-[10px] font-mono text-amber-400/80 tracking-wider uppercase font-semibold">
                INTERACTIF
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Régie séries & suivi des épisodes
            </h3>
            <p className="text-sm text-white/75 leading-relaxed mb-6">
              Émargez vos épisodes un à un. CineViseur calcule en direct le prochain épisode à regarder et l'avancement de chaque saison.
            </p>

            <div className="mb-6">
              <InteractiveSeriesPreview />
            </div>
          </div>

          <Link
            to="/watchlist"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors group mt-2"
          >
            <span>Ouvrir le gestionnaire de séries</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </SpotlightCard>

        {/* 2. Billets collectors */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] via-[#0d0e15] to-[#07080c] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
          spotlightColor="rgba(245, 158, 11, 0.2)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-amber-500/20 border border-amber-500/35 text-amber-300 font-semibold">
                SOUVENIR DE SÉANCE
              </span>
              <span className="text-[10px] font-mono text-white/60 tracking-wider uppercase">
                35MM HD
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Billets de cinéma rétro en haute résolution
            </h3>
            <p className="text-sm text-white/75 leading-relaxed mb-6">
              Chaque film vu génère un ticket de cinéma rétro personnalisé avec date, note et perforation. Téléchargeable en HD pour vos souvenirs et stories.
            </p>

            <div className="mb-6">
              <InteractiveTicketPreview />
            </div>
          </div>

          <Link
            to="/watchlist"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors group mt-2"
          >
            <span>Générer mes billets collectors</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </SpotlightCard>

        {/* 3. Soirée Duo */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] via-[#0d0e15] to-[#07080c] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
          spotlightColor="rgba(244, 63, 94, 0.2)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-rose-500/20 border border-rose-500/35 text-rose-300 font-semibold">
                À DEUX SUR LE CANAPÉ
              </span>
              <span className="text-[10px] font-mono text-white/60 tracking-wider uppercase">
                SANS FRICTION
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Le mode « Soirée Duo »
            </h3>
            <p className="text-sm text-white/75 leading-relaxed mb-6">
              Plus besoin de débattre pendant 40 minutes : rejoignez le même salon sur vos téléphones, swipez en direct et matchez instantanément.
            </p>

            <div className="mb-6">
              <InteractiveDuoPreview />
            </div>
          </div>

          <Link
            to="/ce-soir"
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors group mt-2"
          >
            <span>Lancer un match à deux</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </SpotlightCard>

        {/* 4. Import Letterboxd & Trakt */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-white/[0.04] via-[#0d0e15] to-[#07080c] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
          spotlightColor="rgba(34, 197, 94, 0.2)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 font-semibold">
                PASSERELLE UNIVERSELLE
              </span>
              <span className="text-[10px] font-mono text-white/60 tracking-wider uppercase">
                CSV 1-CLIC
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Import Letterboxd & Trakt
            </h3>
            <p className="text-sm text-white/75 leading-relaxed mb-6">
              Vous avez des années d'historique ? Déposez simplement votre fichier CSV dans votre profil pour retrouver tous vos films en deux secondes.
            </p>

            <div className="mb-6">
              <InteractiveImportPreview />
            </div>
          </div>

          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group mt-2"
          >
            <span>Importer ma collection</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </SpotlightCard>
      </div>
    </section>
  );
}

export default function Home() {
  useSeo(null);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [trending, setTrending] = useState([]);
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  useEffect(() => {
    getNowPlaying().then(setNowPlaying).catch(() => setNowPlaying([]));
    getTrending()
      .then(setTrending)
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoaded(true));
  }, []);

  // Le hero montre les films à l'affiche, le carrousel les tendances
  const withBackdrop = nowPlaying.filter((t) => t.backdrop_path);
  const featured = withBackdrop.slice(0, 5);

  return (
    <div>
      <Hero featured={featured} />

      <div className="-mt-10 relative z-10">
        <CarouselRow title="Tendances de la semaine" staticItems={trending} pending={!trendingLoaded} />
      </div>

      <WhenNear minHeight="100dvh">
        <UpcomingPan />
      </WhenNear>

      <WhenNear minHeight="380px">
        <VelocityMarquee items={GENRES} />
      </WhenNear>

      <FeatureShowcase />
    </div>
  );
}
