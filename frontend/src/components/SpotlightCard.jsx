import { useRef, useState } from "react";
import { motion } from "motion/react";
import { finePointer } from "../lib/motionTokens";

/**
 * SpotlightCard — Inspiré de 21st.dev & Originkit
 * Carte interactive avec halo lumineux fluide qui suit le pointeur de la souris.
 * Révèle un dégradé radial subtil et illumine les contours internes sans re-render coûteux.
 */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(124, 92, 224, 0.14)",
  borderColor = "rgba(171, 152, 242, 0.35)",
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
      className={`relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.08] transition-all duration-300 ${className}`}
      {...rest}
    >
      {/* Halo radial interactif au survol (21st.dev) */}
      {finePointer && isHovered && (
        <>
          <div
            className="pointer-events-none absolute -inset-px z-10 transition-opacity duration-300"
            style={{
              background: `radial-gradient(550px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 65%)`,
            }}
          />
          <div
            className="pointer-events-none absolute -inset-px z-10 rounded-[inherit] transition-opacity duration-300"
            style={{
              border: `1px solid ${borderColor}`,
              maskImage: `radial-gradient(280px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), black 0%, transparent 80%)`,
              WebkitMaskImage: `radial-gradient(280px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), black 0%, transparent 80%)`,
            }}
          />
        </>
      )}

      {/* Contenu de la carte */}
      <div className="relative z-[2] h-full flex flex-col justify-between">{children}</div>
    </Tag>
  );
}
