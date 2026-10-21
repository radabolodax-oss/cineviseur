import { useRef, useState } from "react";
import { motion } from "motion/react";
import { finePointer } from "../lib/motionTokens";

/**
 * SpotlightCard — Inspiré de 21st.dev
 * Carte interactive avec halo lumineux fluide qui suit le pointeur de la souris.
 * Surface en verre teinté profonde avec contraste et éclairage biseauté.
 */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(16, 185, 129, 0.12)",
  borderColor = "rgba(16, 185, 129, 0.35)",
  as = "div",
  ...rest
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!finePointer || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const Tag = motion[as] || motion.div;

  return (
    <Tag
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-3xl bg-[#0d0e15]/90 backdrop-blur-xl border border-white/[0.08] transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}
      {...rest}
    >
      {/* Halo radial interactif au survol (21st.dev) */}
      {finePointer && isHovered && (
        <>
          <div
            className="pointer-events-none absolute -inset-px z-10 transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 65%)`,
            }}
          />
          <div
            className="pointer-events-none absolute -inset-px z-10 rounded-[inherit] transition-opacity duration-300"
            style={{
              border: `1px solid ${borderColor}`,
              maskImage: `radial-gradient(320px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), black 0%, transparent 80%)`,
              WebkitMaskImage: `radial-gradient(320px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), black 0%, transparent 80%)`,
            }}
          />
        </>
      )}

      {/* Contenu de la carte */}
      <div className="relative z-[2] h-full flex flex-col justify-between">{children}</div>
    </Tag>
  );
}
