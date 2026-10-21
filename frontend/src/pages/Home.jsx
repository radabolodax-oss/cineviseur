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
import { KineticTitle, Magnetic } from "../components/motion";
import { Letterbox, ScrambleText } from "../components/effects";
import SpotlightCard from "../components/SpotlightCard";
import { TechnicalHudBar } from "../components/CinemaAtmosphere";
import {
  InteractiveSeriesPreview,
  InteractiveTicketPreview,
  InteractiveDuoPreview,
  InteractiveImportPreview,
} from "../components/FeatureDemos";

// Sections sous la ligne de flottaison : chargées seulement quand on s'en approche.
const UpcomingPan = lazy(() => import("../components/UpcomingPan"));
const VelocityMarquee = lazy(() => import("../components/VelocityMarquee"));
import { EASE_OUT, riseItem, stagger, SPRING } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";

const GENRES = ["Action", "Drame", "Science-fiction", "Thriller", "Animation", "Comédie", "Horreur", "Romance", "Documentaire", "Western"];

const ROTATE_MS = 8000;

function Hero({ featured }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  // Parallaxe légère au scroll (transform/opacity uniquement, accéléré GPU).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % featured.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [featured.length]);

  const current = featured[index];

  return (
    <section ref={ref} className="relative -mt-16 min-h-[92dvh] flex items-end overflow-hidden">
      <Letterbox />

      {/* Image de fond avec fondu cinématique */}
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
                opacity: 0.5,
                scale: 1,
                transition: { duration: 1.4, ease: EASE_OUT },
              }}
              exit={{ opacity: 0, transition: { duration: 1.1, ease: EASE_OUT } }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dégradés d'immersion cinéma */}
      <div className="absolute inset-0 bg-gradient-to-t from-cine-ink via-cine-ink/50 to-cine-ink/20" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-cine-ink via-cine-ink/65 to-transparent" aria-hidden="true" />

      {/* Contenu du Hero */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pb-20 md:pb-28 pt-28"
      >
        <div className="max-w-3xl">
          {/* Bandeau télémétrie cinéma (Orbe Audio style) */}
          <div className="mb-6 max-w-xl">
            <TechnicalHudBar />
          </div>

          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="flex items-center gap-3 text-cine-soft text-xs font-mono font-medium tracking-[0.2em] uppercase mb-4"
          >
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT }}
              className="w-8 h-px bg-cine-soft/60 origin-left"
            />
            <ScrambleText text="VOTRE VISEUR SUR LE CINÉMA" delay={0.2} />
          </motion.p>

          <KineticTitle
            text="Suivez tout ce que vous regardez"
            delay={0.05}
            className="font-display font-semibold text-5xl sm:text-6xl md:text-7xl leading-[0.98] uppercase tracking-tighter mb-6 text-white"
          />

          <motion.p
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}
            className="text-white/75 text-lg md:text-xl max-w-[44ch] leading-relaxed mb-6"
          >
            Films, séries, notes et séances en salle. CineViseur centralise tout avec zéro friction et sans compte obligatoire.
          </motion.p>

          {/* Pastilles métadonnées rapides (21st.dev / Originkit) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE_OUT }}
            className="flex flex-wrap items-center gap-2 mb-9 text-xs font-mono text-white/60"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Streaming & VOD France
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cine-soft" />
              Séances ciné géolocalisées
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Billets collectors HD
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT }}
            className="flex flex-wrap items-center gap-x-6 gap-y-4"
          >
            <Magnetic>
              <Link to="/watchlist" className="btn-primary !px-7 !py-4 text-base group">
                <span>Ouvrir ma liste</span>
                <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" weight="bold" />
              </Link>
            </Magnetic>
            <Link
              to="/discover"
              className="btn-ghost !px-6 !py-4 text-base"
            >
              Explorer le catalogue
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function FeatureBento({ images }) {
  const [big, small] = images;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-12 mb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="mb-8"
      >
        <span className="text-xs font-mono font-medium tracking-[0.2em] uppercase text-cine-soft block mb-2">
          SUR LE TERRAIN & SUR VOS ÉCRANS
        </span>
        <h2 className="section-title !text-3xl md:!text-4xl">
          Votre liste, vos alertes, vos salles
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-5"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger(0.12)}
      >
        {/* Grande carte Bento 1 */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="md:col-span-2 md:row-span-2 min-h-[360px] md:min-h-[500px] flex items-end bg-black/40"
          spotlightColor="rgba(124, 92, 224, 0.18)"
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
            {big && (
              <motion.img
                src={tmdbImage(big.backdrop_path, "backdrop")}
                srcSet={tmdbSrcSet(big.backdrop_path, "backdrop")}
                sizes="(min-width: 768px) 66vw, 100vw"
                decoding="async"
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-45"
                initial={{ scale: 1.12 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: EASE_OUT }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-cine-ink via-cine-ink/65 to-transparent" />
          </div>

          <div className="relative z-[2] p-7 md:p-10 max-w-xl">
            <div className="w-12 h-12 rounded-2xl bg-cine-violet/25 border border-cine-violet/40 flex items-center justify-center text-cine-soft mb-6 shadow-lg shadow-cine-violet/20">
              <Icon name="list" className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-2xl md:text-3xl tracking-tight mb-3 text-white">
              Une liste, tous vos appareils
            </h3>
            <p className="text-white/70 leading-relaxed mb-7 text-sm sm:text-base">
              À voir, déjà vu, notes personnelles : votre collection vous suit partout instantanément. Installez CineViseur sur votre smartphone ou Bureau en 1 clic.
            </p>
            <InstallButton />
          </div>
        </SpotlightCard>

        {/* Carte Bento 2 : Alertes */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="min-h-[230px] flex items-end bg-black/40"
          spotlightColor="rgba(171, 152, 242, 0.16)"
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
            {small && (
              <img
                src={tmdbImage(small.backdrop_path, "backdrop")}
                srcSet={tmdbSrcSet(small.backdrop_path, "backdrop")}
                sizes="(min-width: 768px) 33vw, 100vw"
                decoding="async"
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-cine-ink via-cine-ink/75 to-cine-ink/30" />
          </div>

          <div className="relative z-[2] p-7">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-cine-soft mb-4">
              <Icon name="bell" className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-xl tracking-tight mb-2 text-white">
              Alertes de sortie
            </h3>
            <p className="text-sm text-white/65 leading-relaxed">
              Activez une alerte sur un film très attendu : CineViseur vous notifie le jour de sa sortie.
            </p>
          </div>
        </SpotlightCard>

        {/* Carte Bento 3 : Cinémas */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="min-h-[230px] bg-[radial-gradient(120%_90%_at_100%_0%,rgba(124,92,224,0.25),transparent_60%)] bg-cine-midnight/50"
          spotlightColor="rgba(34, 197, 94, 0.16)"
        >
          <Link
            to="/cinemas"
            className="group relative z-[2] h-full p-7 flex flex-col justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 transition-transform duration-300 group-hover:-translate-y-1">
              <Icon name="pin" className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-xl tracking-tight mb-2 text-white">
              Cinémas autour de vous
            </h3>
            <p className="text-sm text-white/65 leading-relaxed mb-4">
              Localisez les salles d'art et essai et multiplexes à proximité avec itinéraire direct.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
              Trouver une salle
              <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </SpotlightCard>
      </motion.div>
    </section>
  );
}

function NewFeaturesShowcase() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-24">
      <div className="mb-12">
        <span className="text-xs font-mono font-medium tracking-[0.2em] uppercase text-cine-soft block mb-2">
          INNOVATIONS CINEVISEUR
        </span>
        <h2 className="section-title !text-3xl md:!text-5xl tracking-tight">
          L'expérience cinéphile réinventée
        </h2>
        <p className="text-white/60 text-base max-w-2xl mt-2">
          Découvrez les outils interactifs exclusifs conçus pour rendre chaque séance mémorable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Suivi des séries */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-black/35"
          spotlightColor="rgba(124, 92, 224, 0.22)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-cine-violet/20 border border-cine-violet/40 text-cine-soft font-semibold">
                SÉRIES & SAISONS
              </span>
              <span className="text-[10px] font-mono text-white/45 tracking-wider uppercase">
                INTERACTIF
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Suivi des séries & « Up Next »
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Cochez vos épisodes un à un. CineViseur calcule automatiquement le prochain épisode à regarder et met à jour votre avancement en direct.
            </p>

            <div className="mb-6">
              <InteractiveSeriesPreview />
            </div>
          </div>

          <Link
            to="/watchlist"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-cine-soft transition-colors group mt-2"
          >
            <span>Ouvrir le gestionnaire de séries</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </SpotlightCard>

        {/* 2. Billets collectors */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-black/35"
          spotlightColor="rgba(245, 158, 11, 0.2)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
                SOUVENIR DE SÉANCE
              </span>
              <span className="text-[10px] font-mono text-white/45 tracking-wider uppercase">
                HD EXCLUSIF
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Billets de cinéma collectors en HD
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Chaque film vu génère un ticket de cinéma rétro personnalisé avec date, note et perforation. Téléchargeable en haute résolution pour vos stories et souvenirs.
            </p>

            <div className="mb-6">
              <InteractiveTicketPreview />
            </div>
          </div>

          <Link
            to="/watchlist"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-amber-400 transition-colors group mt-2"
          >
            <span>Générer mes billets collectors</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </SpotlightCard>

        {/* 3. Soirée Duo */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-black/35"
          spotlightColor="rgba(236, 72, 153, 0.2)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-pink-500/20 border border-pink-500/40 text-pink-300 font-semibold">
                À DEUX
              </span>
              <span className="text-[10px] font-mono text-white/45 tracking-wider uppercase">
                MATCH RAPIDE
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Le mode « Soirée Duo »
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Plus besoin de débattre pendant 40 minutes sur le canapé : comparez vos listes respectives et découvrez instantanément vos films coups de cœur en commun.
            </p>

            <div className="mb-6">
              <InteractiveDuoPreview />
            </div>
          </div>

          <Link
            to="/ce-soir"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-pink-400 transition-colors group mt-2"
          >
            <span>Lancer un match à deux</span>
            <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </SpotlightCard>

        {/* 4. Import Letterboxd & Trakt */}
        <SpotlightCard
          as="article"
          variants={riseItem}
          className="p-6 sm:p-8 flex flex-col justify-between bg-black/35"
          spotlightColor="rgba(34, 197, 94, 0.2)"
        >
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                MIGRATION 1-CLIC
              </span>
              <span className="text-[10px] font-mono text-white/45 tracking-wider uppercase">
                0 FRICTION
              </span>
            </div>

            <h3 className="font-display font-semibold text-2xl text-white mb-2">
              Import Letterboxd & Trakt
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Vous avez un historique de plusieurs années sur d'autres plateformes ? Déposez simplement votre export CSV dans votre profil pour tout retrouver en 2 secondes.
            </p>

            <div className="mb-6">
              <InteractiveImportPreview />
            </div>
          </div>

          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-400 transition-colors group mt-2"
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
  const bentoImages = withBackdrop.slice(5, 7);

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

      <NewFeaturesShowcase />

      <FeatureBento images={bentoImages} />
    </div>
  );
}
