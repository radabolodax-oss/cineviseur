import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/** Fine barre en haut de l'écran qui indique où l'on en est dans la page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 inset-x-0 z-50 h-[2px] origin-left bg-gradient-to-r from-cine-violet to-cine-soft"
      style={{ scaleX }}
    />
  );
}

/**
 * Bandes noires de format cinéma qui s'ouvrent sur la scène, une fois par session :
 * l'entrée dans le site ressemble au début d'une séance.
 */
export function Letterbox() {
  const reduce = useReducedMotion();
  const [play] = useState(() => {
    try {
      if (sessionStorage.getItem("cv_intro")) return false;
      sessionStorage.setItem("cv_intro", "1");
    } catch {
      // stockage indisponible : on joue l'intro, sans conséquence
    }
    return true;
  });
  if (!play || reduce) return null;

  const bar = "absolute inset-x-0 h-[50%] bg-[#050507] z-30 pointer-events-none";
  const transition = { duration: 1.3, delay: 0.25, ease: [0.76, 0, 0.24, 1] };
  return (
    <>
      <motion.div aria-hidden="true" className={`${bar} top-0 origin-top`} initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={transition} />
      <motion.div aria-hidden="true" className={`${bar} bottom-0 origin-bottom`} initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={transition} />
    </>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*+<>";

/** Texte qui se décode caractère par caractère, comme un générique qui se cale. */
export function ScrambleText({ text, delay = 0, duration = 900, className }) {
  const reduce = useReducedMotion();
  const [output, setOutput] = useState(reduce ? text : "");

  useEffect(() => {
    if (reduce) {
      setOutput(text);
      return;
    }
    let frame = 0;
    const totalFrames = Math.round(duration / 30);
    let interval;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        frame += 1;
        const revealed = Math.floor((frame / totalFrames) * text.length);
        setOutput(
          text
            .split("")
            .map((ch, i) => (i < revealed || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join("")
        );
        if (frame >= totalFrames) clearInterval(interval);
      }, 30);
    }, delay * 1000);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, delay, duration, reduce]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{output || " "}</span>
    </span>
  );
}
