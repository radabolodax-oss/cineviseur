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

/**
 * Calcule dynamiquement le libellé de sortie en salle par rapport à la date/heure actuelle :
 * - Plus de 4 jours : date de sortie complète (ex: "Sortie le 18 nov.")
 * - De 1 à 4 jours : compte à rebours ("Dans 4 j", "Dans 3 j", "Dans 2 j", "Dans 1 j")
 * - Le jour même : "Sortie aujourd'hui !"
 */
function getReleaseCountdown(dateStr, now) {
  if (!dateStr) return { text: "Prochainement", urgent: false, isToday: false };
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return { text: "Prochainement", urgent: false, isToday: false };
  }
  const [y, m, d] = parts;
  const targetMidnight = new Date(y, m - 1, d, 0, 0, 0);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.round((targetMidnight.getTime() - startOfToday.getTime()) / msPerDay);

  if (daysDiff < 0) {
    return { text: "En salle actuellement", urgent: false, isToday: false };
  }

  if (daysDiff === 0) {
    return { text: "Sortie aujourd'hui !", urgent: true, isToday: true };
  }

  if (daysDiff <= 4) {
    return { text: `Dans ${daysDiff} j`, urgent: true, isToday: false };
  }

  const formattedDate = targetMidnight.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: targetMidnight.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

  return { text: `Sortie le ${formattedDate}`, urgent: false, isToday: false };
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

function TunnelPosterCard({ card, progress, pointer, total, stage, now }) {
  const staggerStart = (card.index / total) * 0.45;
  const staggerEnd = staggerStart + 0.55;
  const cardProgress = useTransform(progress, [staggerStart, staggerEnd], [0, 1]);

  const minZ = stage.isMobile ? -950 : -1750;
  const maxZ = stage.isMobile ? 220 : 520;
  const z = useTransform(cardProgress, [0, 1], [minZ, maxZ]);

  // Apparition progressive depuis le fond (0 -> 1) puis disparition avant collision caméra
  const opacity = useTransform(
    cardProgress,
    [0, stage.isMobile ? 0.12 : 0.16, stage.isMobile ? 0.72 : 0.82, stage.isMobile ? 0.9 : 0.98],
    [0, 1, 1, 0]
  );

  // Positionnement géométrique adaptatif (Portrait mobile 9:19 vs Paysage desktop 16:9)
  let baseOffsetX;
  let baseOffsetY;

  if (stage.isMobile) {
    // Sur smartphone : contrainte stricte pour que les affiches ne débordent JAMAIS de l'écran
    const maxSafeX = Math.max(20, stage.width / 2 - stage.cardWidth / 2 - 14);
    const safeRadiusX = maxSafeX * (0.62 + (card.index % 3) * 0.16);
    const safeRadiusY = Math.min(stage.height * 0.28, 200) * (0.65 + (card.index % 2) * 0.25);
    baseOffsetX = card.angleCos * safeRadiusX;
    baseOffsetY = card.angleSin * safeRadiusY;
  } else {
    // Sur desktop : exploitation de la largeur panoramique
    baseOffsetX = card.angleCos * (stage.width * card.radiusFactorX);
    baseOffsetY = card.angleSin * (stage.height * card.radiusFactorY);
  }

  const parallaxMultiplier = stage.isMobile ? 0 : 42;

  const transform = useTransform([z, pointer.x, pointer.y], ([currentZ, px, py]) => {
    const currentX = baseOffsetX - px * parallaxMultiplier;
    const currentY = baseOffsetY - py * parallaxMultiplier;
    return `translate3d(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px), ${currentZ}px) rotateZ(${card.rotationZ}deg)`;
  });

  const item = card.item;
  const title = mediaTitle(item);
  const day = formatDay(item.release_date);
  const month = formatMonth(item.release_date);
  const countdown = getReleaseCountdown(item.release_date, now);

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
        {/* Badge de date de sortie en salle (Jour + Mois ou Compte à rebours) */}
        {day && (
          <div
            className={`absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-md border shadow-lg ${
              countdown.isToday
                ? "bg-emerald-950/80 border-emerald-400 text-emerald-300"
                : countdown.urgent
                ? "bg-amber-950/80 border-amber-400/70 text-amber-300"
                : "bg-black/75 border-emerald-400/40"
            }`}
          >
            <span className="font-display font-bold text-sm text-white tabular-nums leading-none">
              {day}
            </span>
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider leading-none ${
                countdown.urgent ? "text-amber-400" : "text-emerald-400"
              }`}
            >
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
            loading="eager"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-3xl bg-white/5">🎬</div>
        )}

        {/* Dégradé et titre cinéma avec date / décompte dynamique en temps réel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent flex flex-col justify-end p-3.5 sm:p-4 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className="font-display font-bold text-xs sm:text-sm text-white line-clamp-1 drop-shadow-md">
            {title}
          </span>
          <span
            className={`text-[10px] font-mono mt-0.5 inline-flex items-center gap-1.5 transition-colors ${
              countdown.isToday
                ? "text-emerald-300 font-bold"
                : countdown.urgent
                ? "text-amber-300 font-semibold"
                : "text-white/70"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ${
                countdown.isToday
                  ? "bg-emerald-400 animate-ping"
                  : countdown.urgent
                  ? "bg-amber-400 animate-pulse"
                  : "bg-emerald-400"
              }`}
            />
            <span>{countdown.text}</span>
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
  const [now, setNow] = useState(() => new Date());

  // Horloge continue : actualise les décomptes (jours/heures) chaque minute et au réveil de l'onglet
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const [stage, setStage] = useState(() => {
    if (typeof window !== "undefined") {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768;
      const cardWidth = isMobile
        ? Math.max(120, Math.min(160, Math.round(w * 0.35)))
        : Math.max(190, Math.min(260, Math.round(w * 0.17)));
      return { width: w, height: h, isMobile, cardWidth };
    }
    return { width: 390, height: 844, isMobile: true, cardWidth: 140 };
  });

  useEffect(() => {
    getUpcoming()
      .then((list) => {
        const sorted = (list || [])
          .filter((m) => m.poster_path)
          .sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""))
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
        ? Math.max(120, Math.min(160, Math.round(w * 0.35)))
        : Math.max(190, Math.min(260, Math.round(w * 0.17)));
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
      {/* Conteneur Sticky plein écran adaptatif (100dvh pour les barres d'adresse mobiles) */}
      <div className="sticky top-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden flex items-center justify-center">
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

        {/* Scène 3D des affiches (perspective adoucie sur mobile) */}
        <div
          style={{
            perspective: stage.isMobile ? "750px" : "1300px",
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
              now={now}
            />
          ))}
        </div>

        {/* Hub d'information central */}
        <motion.div
          style={{ opacity: centerTitleOpacity, scale: centerTitleScale }}
          className="pointer-events-none relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-xl"
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-emerald-400 text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider mb-3 sm:mb-4 shadow-lg shadow-emerald-500/10">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sorties en salle • Calendrier</span>
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.05] sm:leading-[0.98] drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] mb-3 sm:mb-4">
            Bientôt au cinéma
          </h2>

          <p className="text-xs sm:text-base text-white/70 font-light max-w-xs sm:max-w-md mx-auto leading-relaxed drop-shadow">
            Faites défiler pour traverser les toiles à venir et découvrir leurs dates de sortie.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col items-center gap-1.5 opacity-60 text-[10px] sm:text-[11px] font-mono text-white/50">
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
