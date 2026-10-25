import { useRef, useState } from "react";
import { motion } from "motion/react";
import { finePointer } from "../lib/motionTokens";

/**
 * Carte feutrée et douce pour les modules interactifs (Soirée Duo, Roulette).
 * Rendu velours soyeux, bordure tamisée et reflet d'ambiance reposant.
 */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(124, 102, 220, 0.08)",
  borderColor = "rgba(255, 255, 255, 0.12)",
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
      className={`relative overflow-hidden rounded-3xl bg-[#161423]/90 backdrop-blur-xl border border-transparent transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.35)] ${className}`}
      {...rest}
    >
      {finePointer && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(450px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 65%)`,
          }}
        />
      )}

      {/* Contenu de la carte */}
      <div className="relative z-[2] h-full flex flex-col justify-between">{children}</div>
    </Tag>
  );
}
