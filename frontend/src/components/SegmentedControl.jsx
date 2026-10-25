import { motion } from "motion/react";
import { SPRING } from "../lib/motionTokens";
import { play } from "../lib/feedback";

/**
 * SegmentedControl — Inspiré d'Originkit Interactive Elements & Motion.dev
 * Contrôle segmenté tactile en pilule avec pastille coulissante fluide via layoutId.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  className = "",
  size = "md",
  layoutId = "segmented-pill",
}) {
  const sizeClasses = {
    sm: "p-1 text-xs gap-1",
    md: "p-1.5 text-sm gap-1.5",
    lg: "p-2 text-base gap-2",
  };

  const itemPadding = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2",
    lg: "px-5 py-2.5",
  };

  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-full bg-white/[0.04] p-1 border border-transparent backdrop-blur-xl shadow-inner ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => {
              if (!isSelected) {
                play("tick");
                onChange(option.value);
              }
            }}
            className={`relative rounded-full font-medium transition-colors duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-cine-soft ${
              itemPadding[size] || itemPadding.md
            } ${isSelected ? "text-white font-semibold" : "text-white/60 hover:text-white/90"}`}
          >
            {isSelected && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING}
                className="absolute inset-0 rounded-full bg-cine-violet shadow-[0_4px_16px_rgba(124,92,224,0.45)] ring-1 ring-white/20"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span
                  className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-white/[0.08] text-white/50"
                  }`}
                >
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
