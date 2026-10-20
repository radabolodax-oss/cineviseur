import { useRef } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { EASE_OUT, SOFT_SPRING, SPRING, finePointer, stagger } from "../lib/motionTokens";
import { GlowingEffect } from "./backgrounds";

/** Apparition au scroll : le contenu monte légèrement en entrant dans l'écran. */
export function Reveal({ as = "div", delay = 0, y = 24, amount = 0.25, className, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Titre révélé mot par mot, chaque mot glisse hors d'un masque. */
export function KineticTitle({ text, className, delay = 0 }) {
  const words = text.split(" ");
  return (
    <motion.h1
      className={className}
      initial="hidden"
      animate="show"
      variants={stagger(0.06, delay)}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.06em] -mb-[0.06em]">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%", transition: { duration: 0.7, ease: EASE_OUT } },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </motion.h1>
  );
}

/** Bouton aimanté : suit légèrement le curseur puis revient en ressort (rect mis en cache au survol). */
export function Magnetic({ children, className = "inline-block", ...rest }) {
  if (!finePointer) return <span className={className}>{children}</span>;
  return (
    <MagneticPointer className={className} {...rest}>
      {children}
    </MagneticPointer>
  );
}

function MagneticPointer({ children, strength = 0.3, className }) {
  const ref = useRef(null);
  const rectRef = useRef(null);
  const reduce = useReducedMotion();
  const x = useSpring(0, SOFT_SPRING);
  const y = useSpring(0, SOFT_SPRING);

  if (reduce) return <span className={className}>{children}</span>;

  function handleEnter() {
    if (ref.current) rectRef.current = ref.current.getBoundingClientRect();
  }
  function handleMove(e) {
    const rect = rectRef.current || ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  }
  function reset() {
    rectRef.current = null;
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ x, y }}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.span>
  );
}

/**
 * Conteneur de carte d'affiche ultra-léger :
 * évite d'instancier 6 hooks Framer Motion et un contexte 3D sur chacune des 60+ affiches d'une page.
 */
export function TiltCard({ children, className }) {
  return <div className={className}>{children}</div>;
}

/** Carte dont le contour s'allume du côté où se trouve le curseur. */
export function GlowCard({ as = "div", className, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={`relative ${className}`} {...rest}>
      {children}
      {finePointer && <GlowingEffect />}
    </Tag>
  );
}

/** Menu déroulant animé (compte, notifications, téléchargement). */
export function Popover({ open, className, origin = "top right", children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={className}
          style={{ transformOrigin: origin }}
          initial={{ opacity: 0, scale: 0.94, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12 } }}
          transition={SPRING}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
