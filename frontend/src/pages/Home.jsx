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
import { KineticTitle, Magnetic, GlowCard } from "../components/motion";
import { Letterbox, ScrambleText } from "../components/effects";

// Sections sous la ligne de flottaison : chargées seulement quand on s'en approche.
const UpcomingPan = lazy(() => import("../components/UpcomingPan"));
const VelocityMarquee = lazy(() => import("../components/VelocityMarquee"));
import { EASE_OUT, riseItem, stagger } from "../lib/motionTokens";
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
    <section ref={ref} className="relative -mt-16 min-h-[88dvh] flex items-end overflow-hidden">
      <Letterbox />
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: imageY }} aria-hidden="true">
        <AnimatePresence initial={false}>
          {current && (
            <motion.img
              key={current.id}
              src={tmdbImage(current.backdrop_path, "backdrop")} srcSet={tmdbSrcSet(current.backdrop_path, "backdrop")} sizes="100vw" decoding="async"
              alt=""
              fetchPriority={index === 0 ? "high" : "low"}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 0.55,
                transition: { duration: 1.1, ease: EASE_OUT },
              }}
              exit={{ opacity: 0, transition: { duration: 1.1, ease: EASE_OUT } }}
            />
          )}
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-cine-ink via-cine-ink/45 to-cine-ink/25" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-cine-ink via-cine-ink/55 to-transparent" aria-hidden="true" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pb-20 md:pb-28 pt-24"
      >
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="flex items-center gap-3 text-cine-soft text-xs font-mono font-medium tracking-[0.2em] uppercase mb-6"
          >
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT }}
              className="w-8 h-px bg-cine-soft/60 origin-left"
            />
            <ScrambleText text="VOTRE VISEUR SUR LE CINÉMA" delay={0.3} />
          </motion.p>

          <KineticTitle
            text="Suivez tout ce que vous regardez"
            delay={0.05}
            className="font-display font-semibold text-5xl sm:text-6xl md:text-7xl leading-[0.98] uppercase tracking-tighter mb-7"
          />

          {/* Visible dès le premier affichage (c'est le plus gros texte de la page, donc le LCP) : il glisse seulement. */}
          <motion.p
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
            className="text-white/70 text-lg md:text-xl max-w-[42ch] leading-relaxed mb-10"
          >
            Films, séries, notes et coups de cœur. CineViseur garde la mémoire de vos écrans.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE_OUT }}
            className="flex flex-wrap items-center gap-x-7 gap-y-4"
          >
            <Magnetic>
              <Link to="/watchlist" className="btn-primary !px-7 !py-4 text-base group">
                Ouvrir ma liste
                <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" weight="bold" />
              </Link>
            </Magnetic>
            <Link to="/discover" className="inline-block py-2.5 text-sm font-medium text-white/80 hover:text-white underline-offset-4 hover:underline transition-colors">
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
  const cell = "rounded-2xl ring-1 ring-inset ring-white/[0.08] hover:ring-white/[0.16] transition-[box-shadow] duration-500";

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-10 mb-24">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="section-title !text-2xl md:!text-3xl mb-8"
      >
        Votre liste, vos alertes, vos salles
      </motion.h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger(0.12)}
      >
        <GlowCard as="article" variants={riseItem} className={`md:col-span-2 md:row-span-2 min-h-[340px] md:min-h-[480px] flex items-end ${cell}`}>
          <div className="absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
            {big && (
              <motion.img
                src={tmdbImage(big.backdrop_path, "backdrop")} srcSet={tmdbSrcSet(big.backdrop_path, "backdrop")} sizes="(min-width: 768px) 66vw, 100vw" decoding="async"
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
                initial={{ scale: 1.15 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: EASE_OUT }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-cine-ink via-cine-ink/60 to-transparent" />
          </div>
          <div className="relative z-[2] p-7 md:p-10 max-w-lg">
            <Icon name="list" className="w-7 h-7 text-cine-soft mb-5" />
            <h3 className="font-display font-semibold text-2xl md:text-3xl tracking-tight mb-3">Une liste, tous vos écrans</h3>
            <p className="text-white/65 leading-relaxed mb-7">
              À voir, déjà vu : votre liste vous suit sur tous vos appareils. Installez CineViseur
              directement sur votre Bureau en un clic.
            </p>
            <InstallButton />
          </div>
        </GlowCard>

        <GlowCard as="article" variants={riseItem} className={`min-h-[220px] flex items-end ${cell}`}>
          <div className="absolute inset-0 rounded-2xl overflow-hidden" aria-hidden="true">
            {small && (
              <img src={tmdbImage(small.backdrop_path, "backdrop")} srcSet={tmdbSrcSet(small.backdrop_path, "backdrop")} sizes="(min-width: 768px) 33vw, 100vw" decoding="async" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-cine-ink via-cine-ink/70 to-cine-ink/20" />
          </div>
          <div className="relative z-[2] p-7">
            <Icon name="bell" className="w-6 h-6 text-cine-soft mb-4" />
            <h3 className="font-display font-semibold text-xl tracking-tight mb-2">Alertes de sortie</h3>
            <p className="text-sm text-white/60 leading-relaxed">Activez une alerte sur un film à venir. On vous prévient le jour J.</p>
          </div>
        </GlowCard>

        <GlowCard
          as="div"
          variants={riseItem}
          className={`min-h-[220px] bg-[radial-gradient(120%_90%_at_100%_0%,rgba(124,92,224,0.32),transparent_60%)] bg-cine-midnight/60 ${cell}`}
        >
          <Link
            to="/cinemas"
            className="group relative z-[2] h-full p-7 flex flex-col justify-end rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft"
          >
            <Icon name="pin" className="w-6 h-6 text-cine-soft mb-4 transition-transform duration-500 ease-out group-hover:-translate-y-1" />
            <h3 className="font-display font-semibold text-xl tracking-tight mb-2">Cinémas autour de vous</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">Les salles les plus proches, avec l'itinéraire en un geste.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white">
              Trouver une salle
              <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </GlowCard>
      </motion.div>
    </section>
  );
}

function NewFeaturesShowcase() {
  const cell = "rounded-3xl p-6 sm:p-8 ring-1 ring-inset ring-white/[0.08] hover:ring-cine-violet/50 transition-all duration-500 flex flex-col justify-between";

  const features = [
    {
      title: "Suivi des séries & « Up Next »",
      tag: "Inspiré de Trakt",
      badge: "NOUVEAU",
      desc: "Cochez vos épisodes saison par saison. CineViseur calcule automatiquement votre prochain épisode à voir avec un bouton 1-clic depuis votre liste.",
      link: "/watchlist",
      linkText: "Voir mes séries",
      gradient: "from-cine-violet/20 via-transparent to-transparent",
    },
    {
      title: "Billets de cinéma collectors en HD",
      tag: "Exclusivité CineViseur",
      badge: "TÉLÉCHARGEABLE",
      desc: "Chaque film vu génère un vrai ticket de cinéma vintage personnalisé avec date, note et perforation, téléchargeable en haute résolution pour vos stories.",
      link: "/watchlist",
      linkText: "Générer un billet",
      gradient: "from-amber-500/15 via-transparent to-transparent",
    },
    {
      title: "Le mode « Soirée Duo » (Tinder ciné)",
      tag: "À deux",
      badge: "MATCH RAPIDE",
      desc: "Partagez votre lien à un ami ou votre moitié : CineViseur compare vos listes d'envies et trouve immédiatement vos films en commun sans prise de tête.",
      link: "/ce-soir",
      linkText: "Lancer un match",
      gradient: "from-pink-500/15 via-transparent to-transparent",
    },
    {
      title: "Import Letterboxd & Trakt en 1 clic",
      tag: "Zéro friction",
      badge: "MIGRATION FACILE",
      desc: "Vous avez déjà tout un historique ailleurs ? Glissez votre fichier CSV dans Mon Espace pour importer des centaines de films et notes en 2 secondes.",
      link: "/profile",
      linkText: "Importer ma collection",
      gradient: "from-emerald-500/15 via-transparent to-transparent",
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span className="text-xs font-mono font-medium tracking-[0.2em] uppercase text-cine-soft block mb-2">
            L'EXPÉRIENCE CINEVISEUR
          </span>
          <h2 className="section-title !text-3xl md:!text-4xl">
            Tout ce qu'un cinéphile a toujours voulu
          </h2>
        </div>
        <p className="text-sm text-white/60 max-w-md">
          Inspiré du meilleur de Trakt et Letterboxd, optimisé pour la France avec streaming, séances de cinéma et zéro mot de passe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((f) => (
          <GlowCard key={f.title} as="article" variants={riseItem} className={`${cell} bg-gradient-to-br ${f.gradient} bg-white/[0.02]`}>
            <div>
              <div className="flex items-center justify-between gap-3 mb-5">
                <span className="chip !text-[10px] !py-0.5 !px-2.5 !bg-cine-violet/25 !text-cine-soft !ring-cine-violet/40">
                  {f.tag}
                </span>
                <span className="text-[10px] font-mono font-semibold tracking-wider text-white/50 uppercase">
                  {f.badge}
                </span>
              </div>
              <h3 className="font-display font-semibold text-xl sm:text-2xl text-white mb-2.5">
                {f.title}
              </h3>
              <p className="text-sm text-white/65 leading-relaxed mb-6">
                {f.desc}
              </p>
            </div>

            <Link
              to={f.link}
              className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-cine-soft transition-colors group"
            >
              <span>{f.linkText}</span>
              <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </GlowCard>
        ))}
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

  // Le hero montre les films à l'affiche, le carrousel les tendances : jamais deux fois les mêmes images.
  const withBackdrop = nowPlaying.filter((t) => t.backdrop_path);
  const featured = withBackdrop.slice(0, 5);
  const bentoImages = withBackdrop.slice(5, 7);

  return (
    <div>
      <Hero featured={featured} />

      <div className="-mt-10 relative">
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
