// Courbes, ressorts et variantes communs à tout le site.
export const EASE_OUT = [0.16, 1, 0.3, 1];
export const SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 };
export const SOFT_SPRING = { type: "spring", stiffness: 150, damping: 18, mass: 0.4 };

// Effets de pointeur réservés aux souris : inutiles et coûteux au doigt.
export const finePointer =
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

/** Variantes pour une cascade parent / enfants. */
export const stagger = (step = 0.07, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
});

export const riseItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};
