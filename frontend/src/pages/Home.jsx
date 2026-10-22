import { lazy, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { getNowPlaying, getTrending, getStreamingReleases, tmdbImage, tmdbSrcSet } from "../lib/tmdb";
import InstallButton from "../components/InstallButton";
import CarouselRow from "../components/CarouselRow";
import Icon from "../components/Icon";
import WhenNear from "../components/WhenNear";
import AdSlot from "../components/AdSlot";
import PrimeBanner from "../components/PrimeBanner";
import {
  InteractiveSeriesPreview,
  InteractiveTicketPreview,
  InteractiveDuoPreview,
  InteractiveImportPreview,
} from "../components/FeatureDemos";

const UpcomingPan = lazy(() => import("../components/UpcomingPan"));
import { EASE_OUT, riseItem } from "../lib/motionTokens";
import { play } from "../lib/feedback";
import useSeo from "../hooks/useSeo";

const GENRES = ["Action", "Drame", "Science-fiction", "Thriller", "Animation", "Comédie", "Horreur", "Romance", "Documentaire", "Western"];

const ROTATE_MS = 8000;

function Hero({ featured }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
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
    <section ref={ref} className="relative -mt-16 min-h-[90dvh] flex items-end overflow-hidden">
      {/* Affiche de fond cinématique feutrée */}
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
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{
                opacity: 0.6,
                scale: 1,
                transition: { duration: 1.2, ease: EASE_OUT },
              }}
              exit={{ opacity: 0, transition: { duration: 1, ease: EASE_OUT } }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dégradés d'ambiance velours chaud */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b12] via-[#0c0b12]/60 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0b12]/95 via-[#0c0b12]/50 to-transparent" aria-hidden="true" />

      {/* Contenu du Hero centré sur l'œuvre */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pb-16 md:pb-22 pt-24"
      >
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-white/70 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              À l'affiche en salle
            </span>
            {year && <span className="text-white/50">{year}</span>}
            {rating && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold font-mono">
                ★ {rating}
              </span>
            )}
          </div>

          <h1 className="font-display font-semibold text-4xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight mb-4 text-white drop-shadow-md">
            {current?.title || "Le cinéma en direct"}
          </h1>

          {current?.overview && (
            <p className="text-white/75 text-sm sm:text-base md:text-lg line-clamp-3 mb-8 max-w-2xl font-light leading-relaxed">
              {current.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
            {current && (
              <Link
                to={`/title/movie/${current.id}`}
                className="btn-primary !px-7 !py-3.5 text-sm sm:text-base"
              >
                <Icon name="play" className="w-4 h-4" />
                <span>Voir la fiche & séances</span>
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
              <Icon name="sparkle" className="w-4 h-4 text-amber-300" />
              <span>Film au hasard</span>
            </Link>
          </div>

          {/* Pagination discrète et douce */}
          {featured.length > 1 && (
            <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
              {featured.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    play("tick");
                    setIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === index
                      ? "w-7 bg-emerald-400"
                      : "w-2 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Passer au film ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function CozyGenreShelf({ items }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-16" aria-label="Explorer par genre">
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141220]/80 border border-white/[0.06] shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display font-semibold text-xl text-white">Explorer par genre</h3>
            <p className="text-xs sm:text-sm text-white/55 mt-0.5">Choisissez une ambiance pour votre prochaine séance</p>
          </div>
          <Link to="/discover" className="text-xs font-semibold text-cine-soft hover:text-white transition-colors inline-flex items-center gap-1">
            <span>Tout le catalogue</span>
            <span>→</span>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {items.map((g) => (
            <Link
              key={g}
              to="/discover"
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.18] text-white/80 hover:text-white transition-all shadow-sm active:scale-95"
            >
              {g}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureShowcase() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-400 block mb-2">
            L'EXPÉRIENCE CINEVISEUR
          </span>
          <h2 className="section-title !text-3xl md:!text-4xl text-white">
            Votre salon de cinéma personnalisé
          </h2>
          <p className="text-white/65 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
            Vos listes, vos séances en salle et vos soirées film restent privées dans votre navigateur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/cinemas"
            className="btn-ghost !px-4 !py-2.5 text-xs font-semibold"
          >
            <Icon name="pin" className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salles de cinéma</span>
          </Link>
          <InstallButton className="btn-ghost !px-4 !py-2.5 text-xs font-semibold" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Suivi des séries */}
        <motion.article
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between rounded-3xl bg-[#161423]/90 border border-white/[0.07] shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 border border-indigo-500/25 text-indigo-300">
                Séries & Saisons
              </span>
            </div>

            <h3 className="font-display font-semibold text-xl text-white mb-2">
              Suivi des épisodes & saisons
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Cochez vos épisodes un à un. CineViseur calcule automatiquement le prochain épisode à regarder.
            </p>

            <div className="mb-6">
              <InteractiveSeriesPreview />
            </div>
          </div>

          <Link
            to="/watchlist"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors group mt-2"
          >
            <span>Ouvrir le suivi des séries</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.article>

        {/* 2. Billets collectors */}
        <motion.article
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between rounded-3xl bg-[#161423]/90 border border-white/[0.07] shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 border border-amber-500/25 text-amber-300">
                Souvenir de séance
              </span>
            </div>

            <h3 className="font-display font-semibold text-xl text-white mb-2">
              Billets de cinéma rétro en haute résolution
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Chaque film vu génère un ticket de cinéma rétro personnalisé avec date et note, téléchargeable pour vos souvenirs.
            </p>

            <div className="mb-6">
              <InteractiveTicketPreview />
            </div>
          </div>

          <Link
            to="/watchlist"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors group mt-2"
          >
            <span>Créer mes billets collectors</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.article>

        {/* 3. Soirée Duo */}
        <motion.article
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between rounded-3xl bg-[#161423]/90 border border-white/[0.07] shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/15 border border-purple-500/25 text-purple-300">
                À deux sur le canapé
              </span>
            </div>

            <h3 className="font-display font-semibold text-xl text-white mb-2">
              Le mode « Soirée Duo »
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Plus besoin de débattre pendant 40 minutes : rejoignez le même salon sur vos téléphones, swipez en direct et matchez instantanément.
            </p>

            <div className="mb-6">
              <InteractiveDuoPreview />
            </div>
          </div>

          <Link
            to="/ce-soir"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-300 hover:text-purple-200 transition-colors group mt-2"
          >
            <span>Lancer un match à deux</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.article>

        {/* 4. Import Letterboxd & Trakt */}
        <motion.article
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between rounded-3xl bg-[#161423]/90 border border-white/[0.07] shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
                Passerelle 1-clic
              </span>
            </div>

            <h3 className="font-display font-semibold text-xl text-white mb-2">
              Import Letterboxd & Trakt
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
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
        </motion.article>
      </div>
    </section>
  );
}

export default function Home() {
  useSeo(null);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [trending, setTrending] = useState([]);
  const [streaming, setStreaming] = useState([]);
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [streamingLoaded, setStreamingLoaded] = useState(false);

  useEffect(() => {
    getNowPlaying().then(setNowPlaying).catch(() => setNowPlaying([]));
    getTrending()
      .then(setTrending)
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoaded(true));
    getStreamingReleases()
      .then(setStreaming)
      .catch(() => setStreaming([]))
      .finally(() => setStreamingLoaded(true));
  }, []);

  const withBackdrop = nowPlaying.filter((t) => t.backdrop_path);
  const featured = withBackdrop.slice(0, 5);

  return (
    <div>
      <Hero featured={featured} />

      <div className="-mt-10 relative z-10 flex flex-col gap-6">
        <CarouselRow title="Tendances de la semaine" staticItems={trending} pending={!trendingLoaded} />
        <CarouselRow title="À l'affiche au cinéma" staticItems={nowPlaying} pending={nowPlaying.length === 0} />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 w-full my-2">
          <PrimeBanner />
        </div>
        <CarouselRow title="Nouveautés en streaming & VOD" staticItems={streaming} pending={!streamingLoaded} />
      </div>

      <WhenNear minHeight="100dvh">
        <UpcomingPan />
      </WhenNear>

      <CozyGenreShelf items={GENRES} />

      <FeatureShowcase />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
        <AdSlot slotId="home-bottom-banner" />
      </div>
    </div>
  );
}
