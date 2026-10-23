import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { getUpcoming, mediaTitle, tmdbImage, tmdbSrcSet } from "../lib/tmdb";

// Spirale dorée de Fibonacci (137.5° d'angle d'or pour une répartition spatiale sans superposition)
const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

function formatDay(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric" });
}

function formatMonth(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
}

function useCameraParallax(enabled = true) {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, SPRING_CONFIG);
  const y = useSpring(targetY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e) => {
      targetX.set((e.clientX / window.innerWidth - 0.5) * 2);
      targetY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, targetX, targetY]);

  return { x, y };
}

function TunnelPosterCard({ card, progress, pointer, total, stage }) {
  const staggerStart = (card.index / total) * 0.45;
  const staggerEnd = staggerStart + 0.55;
  const cardProgress = useTransform(progress, [staggerStart, staggerEnd], [0, 1]);

  const minZ = stage.isMobile ? -1200 : -1750;
  const maxZ = stage.isMobile ? 360 : 520;
  const z = useTransform(cardProgress, [0, 1], [minZ, maxZ]);

  // Apparition progressive depuis le fond (0 -> 1) puis disparition après dépassement de la caméra
  const opacity = useTransform(cardProgress, [0, 0.16, 0.82, 0.98], [0, 1, 1, 0]);

  const baseOffsetX = card.angleCos * (stage.width * card.radiusFactorX);
  const baseOffsetY = card.angleSin * (stage.height * card.radiusFactorY);
  const parallaxMultiplier = stage.isMobile ? 18 : 42;

  const transform = useTransform([z, pointer.x, pointer.y], ([currentZ, px, py]) => {
    const currentX = baseOffsetX - px * parallaxMultiplier;
    const currentY = baseOffsetY - py * parallaxMultiplier;
    return `translate3d(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px), ${currentZ}px) rotateZ(${card.rotationZ}deg)`;
  });

  const item = card.item;
  const title = mediaTitle(item);
  const day = formatDay(item.release_date);
  const month = formatMonth(item.release_date);

  return (
    <motion.div
      style={{
        width: stage.cardWidth,
        transform,
        opacity,
        zIndex: card.index + 10,
      }}
      className="pointer-events-auto absolute left-1/2 top-1/2 aspect-[2/3] will-change-transform select-none cursor-pointer"
    >
      <Link
        to={`/title/movie/${item.id}`}
        className="group relative block h-full w-full overflow-hidden rounded-2xl bg-[#141624] shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/15 transition-all duration-500 hover:ring-emerald-400/80 hover:shadow-[0_0_35px_rgba(16,185,129,0.4)]"
      >
        {/* Badge de date de sortie en salle (Jour + Mois) */}
        {day && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-emerald-400/40 shadow-lg">
            <span className="font-display font-bold text-sm text-white tabular-nums leading-none">
              {day}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 leading-none">
              {month}
            </span>
          </div>
        )}

        {/* Affiche du film */}
        {item.poster_path ? (
          <img
            src={tmdbImage(item.poster_path, "posterLarge")}
            srcSet={tmdbSrcSet(item.poster_path, "poster")}
            sizes="(min-width: 768px) 260px, 170px"
            alt={`Affiche de ${title}`}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-3xl bg-white/5">🎬</div>
        )}

        {/* Dégradé et titre cinéma */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent flex flex-col justify-end p-3.5 sm:p-4 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className="font-display font-bold text-xs sm:text-sm text-white line-clamp-1 drop-shadow-md">
            {title}
          </span>
          <span className="text-[10px] text-white/60 font-mono mt-0.5 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            En salle prochainement
          </span>
        </div>

        {/* Halo néon subtil au survol */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-emerald-400/60 transition-colors pointer-events-none" />
      </Link>
    </motion.div>
  );
}

export default function UpcomingPan() {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [items, setItems] = useState([]);

  const [stage, setStage] = useState({
    width: 1440,
    height: 900,
    isMobile: false,
    cardWidth: 200,
  });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    getUpcoming()
      .then((list) => {
        const sorted = (list || [])
          .filter((m) => m.poster_path && m.release_date && m.release_date >= today)
          .sort((a, b) => a.release_date.localeCompare(b.release_date))
          .slice(0, 12);
        setItems(sorted);
      })
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768;
      const cardWidth = isMobile
        ? Math.max(130, Math.min(170, w * 0.38))
        : Math.max(190, Math.min(260, w * 0.17));
      setStage({ width: w, height: h, isMobile, cardWidth });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Défilement immersif lié au scroll sur les 280vh de la section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.0001,
  });

  const pointer = useCameraParallax(!shouldReduceMotion && !stage.isMobile);

  // Distribution en spirale dorée de Fibonacci (jusqu'à 12 sorties)
  const tunnelCards = useMemo(() => {
    return items.map((item, index) => {
      const angle = index * GOLDEN_ANGLE;
      const radiusFactorX = 0.28 + (index % 3) * 0.08;
      const radiusFactorY = 0.26 + (index % 2) * 0.09;
      const rotationZ = (index % 2 === 0 ? 1 : -1) * (3 + (index % 5) * 2);
      return {
        item,
        index,
        angleCos: Math.cos(angle),
        angleSin: Math.sin(angle),
        radiusFactorX,
        radiusFactorY,
        rotationZ,
      };
    });
  }, [items]);

  // Fondu du titre central
  const centerTitleOpacity = useTransform(smoothProgress, [0, 0.15, 0.75, 0.95], [1, 1, 0.35, 0]);
  const centerTitleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.96, 1, 1.05]);

  return (
    <section
      ref={containerRef}
      className="relative h-[280vh] bg-[#07080f] select-none"
      aria-label="Bientôt au cinéma - Vortex 3D"
    >
      {/* Conteneur Sticky plein écran */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Lueur et anneaux géométriques d'ambiance spatiale */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(16,185,129,0.14)_0%,rgba(124,92,255,0.08)_40%,transparent_75%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute h-[50vmin] w-[50vmin] rounded-full border border-emerald-500/15"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute h-[78vmin] w-[78vmin] rounded-full border border-dashed border-white/10"
          aria-hidden="true"
        />

        {/* Scène 3D des affiches (transform-style: preserve-3d sans overflow-hidden destructeur) */}
        <div
          style={{
            perspective: stage.isMobile ? "900px" : "1300px",
            transformStyle: "preserve-3d",
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {tunnelCards.map((card) => (
            <TunnelPosterCard
              key={card.item.id}
              card={card}
              progress={smoothProgress}
              pointer={pointer}
              total={tunnelCards.length}
              stage={stage}
            />
          ))}
        </div>

        {/* Hub d'information central */}
        <motion.div
          style={{ opacity: centerTitleOpacity, scale: centerTitleScale }}
          className="pointer-events-none relative z-10 flex flex-col items-center text-center px-6 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4 shadow-lg shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sorties en salle • Calendrier</span>
          </div>

          <h2 className="font-display font-bold text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[0.98] drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] mb-4">
            Bientôt au cinéma
          </h2>

          <p className="text-sm sm:text-base text-white/70 font-light max-w-md mx-auto leading-relaxed drop-shadow">
            Faites défiler pour traverser les toiles à venir et découvrir leurs dates de sortie.
          </p>

          <div className="mt-8 flex flex-col items-center gap-1.5 opacity-60 text-[11px] font-mono text-white/50">
            <span>FAITES DÉFILER</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-1 h-3 rounded-full bg-emerald-400/80"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
