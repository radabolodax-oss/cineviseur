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
import { tmdbImage } from "../lib/tmdb";
import Icon from "./Icon";

// Spirale dorée de Fibonacci (Phyllotaxie : 137.5° d'angle d'or pour une répartition spatiale parfaite)
const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

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

  const minZ = stage.isMobile ? -1200 : -1800;
  const maxZ = stage.isMobile ? 350 : 520;
  const z = useTransform(cardProgress, [0, 1], [minZ, maxZ]);

  // Apparition progressive puis disparition quand elle dépasse la caméra
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
  const title = item.title || item.name || "Film";
  const mediaType = item.media_type === "tv" ? "tv" : "movie";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const rating = item.vote_average ? (item.vote_average / 2).toFixed(1) : null;

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
        to={`/title/${mediaType}/${item.id}`}
        className="group relative block h-full w-full overflow-hidden rounded-2xl bg-[#141624] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/15 transition-all duration-500 hover:ring-cine-soft hover:shadow-[0_0_35px_rgba(124,92,255,0.45)]"
      >
        {item.poster_path ? (
          <img
            src={tmdbImage(item.poster_path, "poster")}
            alt={title}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-3xl bg-white/5">🎬</div>
        )}

        {/* Dégradé de lisibilité et métadonnées cinéma */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3.5 sm:p-4 opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 mb-1">
            {rating && (
              <span className="inline-flex items-center gap-0.5 text-amber-300 font-bold text-[11px] font-mono">
                ★ {rating}
              </span>
            )}
            {year && <span className="text-[10px] text-white/50 font-mono">• {year}</span>}
          </div>
          <span className="font-display font-bold text-xs sm:text-sm text-white line-clamp-1 drop-shadow-md">
            {title}
          </span>
        </div>

        {/* Halo néon subtil au survol */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-cine-soft/60 transition-colors pointer-events-none" />
      </Link>
    </motion.div>
  );
}

export default function PerspectiveTunnelSection({ items = [] }) {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const [stage, setStage] = useState({
    width: 1440,
    height: 900,
    isMobile: false,
    cardWidth: 200,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768;
      const cardWidth = isMobile
        ? Math.max(120, Math.min(160, w * 0.36))
        : Math.max(180, Math.min(240, w * 0.16));
      setStage({ width: w, height: h, isMobile, cardWidth });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Progression du scroll sur la hauteur de la section (300vh pour un défilement immersif)
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

  // Distribution en spirale dorée de Fibonacci (max 10 films marquants)
  const tunnelCards = useMemo(() => {
    const list = (items || []).filter((i) => i.poster_path).slice(0, 10);
    return list.map((item, index) => {
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

  // Fondu du titre central au début et à la fin du tunnel
  const centerTitleOpacity = useTransform(smoothProgress, [0, 0.12, 0.85, 0.98], [0.95, 1, 1, 0.4]);
  const centerTitleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.96, 1, 1.05]);

  if (!tunnelCards.length) return null;

  return (
    <section
      ref={containerRef}
      className="relative h-[260vh] bg-[#07080f] select-none"
      aria-label="Vortex immersif du catalogue"
    >
      {/* Conteneur Sticky plein écran avec perspective 3D */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Lueur et projecteur central de salle obscure */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(124,92,255,0.22)_0%,rgba(16,185,129,0.08)_40%,transparent_75%)]"
          aria-hidden="true"
        />

        {/* Faisceau conique d'arrière-plan */}
        <div
          className="pointer-events-none absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cine-violet/20 via-amber-400/10 to-transparent blur-3xl opacity-60"
          aria-hidden="true"
        />

        {/* Espace 3D pour le vol des affiches */}
        <div
          style={{ perspective: stage.isMobile ? "1000px" : "1500px" }}
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
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

        {/* Hub d'information au centre du point de fuite */}
        <motion.div
          style={{ opacity: centerTitleOpacity, scale: centerTitleScale }}
          className="relative z-30 max-w-xl mx-auto px-6 text-center pointer-events-auto"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md text-cine-soft text-xs font-mono font-semibold uppercase tracking-wider mb-4 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cine-soft animate-ping" />
            <span>Vortex Cinéma • Immersion 3D</span>
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08] drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
            Traversez les toiles
          </h2>

          <p className="mt-3 text-sm sm:text-base text-white/70 font-light max-w-md mx-auto leading-relaxed drop-shadow">
            Faites défiler pour naviguer à travers les œuvres du moment et cliquez sur n'importe quel film pour ouvrir sa fiche.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/discover"
              className="btn-primary !px-6 !py-3 !text-sm font-semibold flex items-center gap-2 shadow-xl shadow-cine-violet/25"
            >
              <Icon name="sparkle" className="w-4 h-4" />
              <span>Explorer tout le catalogue</span>
            </Link>

            <Link
              to="/ce-soir"
              className="btn-ghost !px-5 !py-3 !text-sm font-semibold !bg-white/[0.05] hover:!bg-white/[0.1] border border-white/15"
            >
              <span>Tirage aléatoire</span>
            </Link>
          </div>

          {/* Indicateur de défilement immersif */}
          <div className="mt-8 flex flex-col items-center gap-1.5 opacity-60 text-[11px] font-mono text-white/50">
            <span>FAITES DÉFILER</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-1 h-3 rounded-full bg-white/40"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
