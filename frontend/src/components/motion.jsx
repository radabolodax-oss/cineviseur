import { useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
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
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
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
      variants={stagger(0.08, delay)}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.06em] -mb-[0.06em]">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%", transition: { duration: 0.9, ease: EASE_OUT } },
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

/** Bouton aimanté : suit légèrement le curseur puis revient en ressort. Rien n'est créé sur écran tactile. */
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
  const reduce = useReducedMotion();
  const x = useSpring(0, SOFT_SPRING);
  const y = useSpring(0, SOFT_SPRING);

  if (reduce) return <span className={className}>{children}</span>;

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span ref={ref} className={className} style={{ x, y }} onPointerMove={handleMove} onPointerLeave={reset}>
      {children}
    </motion.span>
  );
}

/** Carte qui s'incline vers le curseur, avec un reflet qui le suit. Rien n'est créé sur écran tactile. */
export function TiltCard({ children, className, max }) {
  if (!finePointer) return <div className={className}>{children}</div>;
  return (
    <TiltCardPointer className={className} max={max}>
      {children}
    </TiltCardPointer>
  );
}

function TiltCardPointer({ children, className, max = 8 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), SOFT_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), SOFT_SPRING);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.18), transparent 55%)`;

  if (reduce) return <div className={className}>{children}</div>;

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }
  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      className={`${className} [transform-style:preserve-3d] [perspective:800px]`}
      style={{ rotateX, rotateY }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      {children}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"
        style={{ background: glare }}
      />
    </motion.div>
  );
}

/** Carte dont le contour s'allume du côté où se trouve le curseur (Glowing Effect, Aceternity via 21st.dev). */
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
