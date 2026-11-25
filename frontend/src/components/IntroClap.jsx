import { useCallback, useEffect, useId, useRef, useState } from "react";
import { play } from "../lib/feedback";

const INTRO_SEEN_KEY = "cv_intro_clap_seen";
export const REPLAY_INTRO_EVENT = "cv:replay-intro";

const INTRO_STYLES = `
@keyframes clapWave {
  0% {
    transform: translate(-50%, -50%) scale(0.18);
    opacity: 0.92;
    border-width: 3px;
  }
  70% {
    opacity: 0.35;
  }
  100% {
    transform: translate(-50%, -50%) scale(3.4);
    opacity: 0;
    border-width: 1px;
  }
}
@keyframes clapFlash {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  25% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.15); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.1); }
}
@keyframes clapBounce {
  0% { transform: scale(1); }
  35% { transform: scale(0.93) translateY(3px); }
  70% { transform: scale(1.04) translateY(-1px); }
  100% { transform: scale(1); }
}
.intro-wave-1 { animation: clapWave 1150ms cubic-bezier(0.16, 1, 0.3, 1) both; }
.intro-wave-2 { animation: clapWave 1350ms cubic-bezier(0.16, 1, 0.3, 1) 130ms both; }
.intro-wave-3 { animation: clapWave 1550ms cubic-bezier(0.16, 1, 0.3, 1) 260ms both; }
.intro-flash  { animation: clapFlash 650ms ease-out both; }
.intro-bounce { animation: clapBounce 360ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .intro-wave-1, .intro-wave-2, .intro-wave-3, .intro-flash, .intro-bounce { animation: none !important; }
}
`;

/**
 * Intro cinématique CineViseur :
 * 1. Logo clapperboard en grand au centre sur fond noir pur
 * 2. Animation « Action ! » (clap de cinéma qui s'abat) + ondes lumineuses concentriques
 * 3. Révélation du titre « CINEVISEUR » qui glisse depuis la droite du logo
 * 4. Vol FLIP pixel-perfect pour se replacer exactement sur le logo dans la Navbar
 */
export default function IntroClap() {
  const gradId = `intro-lg-${useId().replace(/:/g, "")}`;
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("intro") === "1") return true;
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) !== "1";
    } catch {
      return true;
    }
  });

  // Phases : "enter" -> "windup" -> "clap" -> "title" -> "dock" -> done
  const [phase, setPhase] = useState("enter");
  const [dockTransform, setDockTransform] = useState(null);
  const lockupRef = useRef(null);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }, []);

  // Permet de rejouer l'intro à la demande (événement global)
  useEffect(() => {
    const onReplay = () => {
      setDockTransform(null);
      setPhase("enter");
      setVisible(true);
    };
    window.addEventListener(REPLAY_INTRO_EVENT, onReplay);
    return () => window.removeEventListener(REPLAY_INTRO_EVENT, onReplay);
  }, []);

  // Verrouille le scroll + masque le vrai logo de la Navbar tant que l'intro vole vers lui (évite le doublon)
  useEffect(() => {
    if (!visible) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const brandTarget = document.querySelector("[data-intro-brand-target]");
    if (brandTarget) brandTarget.style.opacity = "0";

    const onKey = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      if (brandTarget) brandTarget.style.opacity = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, finish]);

  // Chorégraphie chronométrée
  useEffect(() => {
    if (!visible) return undefined;

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    // 1. Anticipation : le clap s'ouvre légèrement plus grand
    at(280, () => setPhase("windup"));

    // 2. CLAP ! ("Action !") + ondes lumineuses + son de clap
    at(480, () => {
      setPhase("clap");
      play("clap");
    });

    // 3. Le titre « CINEVISEUR » émerge depuis le bord droit du logo
    at(980, () => setPhase("title"));

    // 4. Vol FLIP vers l'emplacement exact du logo dans la Navbar
    at(1880, () => {
      const target = document.querySelector("[data-intro-brand-target]");
      const lockup = lockupRef.current;
      if (target && lockup) {
        const tRect = target.getBoundingClientRect();
        const lRect = lockup.getBoundingClientRect();
        if (tRect.width > 0 && lRect.width > 0) {
          const scale = tRect.height / lRect.height;
          const tCenterX = tRect.left + tRect.width / 2;
          const tCenterY = tRect.top + tRect.height / 2;
          const lCenterX = lRect.left + lRect.width / 2;
          const lCenterY = lRect.top + lRect.height / 2;
          setDockTransform({
            dx: tCenterX - lCenterX,
            dy: tCenterY - lCenterY,
            scale,
          });
        }
      }
      setPhase("dock");
    });

    // 5. Fin propre une fois posé dans la Navbar
    at(2820, finish);

    return () => timers.forEach(clearTimeout);
  }, [visible, finish]);

  if (!visible) return null;

  const hasClapped = phase === "clap" || phase === "title" || phase === "dock";
  const showTitle = phase === "title" || phase === "dock";
  const isDocking = phase === "dock";

  // Angle de la barre supérieure du clap
  let clapAngle = -26;
  if (phase === "windup") clapAngle = -42;
  else if (hasClapped) clapAngle = 0;

  const paint = `url(#${gradId})`;

  return (
    <div
      role="presentation"
      onClick={finish}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none"
      style={{
        backgroundColor: isDocking ? "rgba(5, 5, 9, 0)" : "#050509",
        transition: "background-color 720ms cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: isDocking ? "none" : "auto",
      }}
    >
      <style>{INTRO_STYLES}</style>

      {/* Halo subtil d'ambiance cinéma sur fond noir */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: isDocking ? 0 : 1,
          background:
            "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.11) 0%, rgba(124, 102, 220, 0.08) 28%, rgba(5, 5, 9, 1) 66%)",
        }}
      />

      {/* Bloc marque [Logo + CINEVISEUR] qui vole ensuite exactement vers la Navbar */}
      <div
        ref={lockupRef}
        className="relative z-10 flex items-center"
        style={{
          gap: showTitle ? "24px" : "0px",
          transform:
            isDocking && dockTransform
              ? `translate3d(${dockTransform.dx.toFixed(1)}px, ${dockTransform.dy.toFixed(1)}px, 0) scale(${dockTransform.scale.toFixed(4)})`
              : phase === "enter"
                ? "translate3d(0, 0, 0) scale(0.92)"
                : "translate3d(0, 0, 0) scale(1)",
          transition: isDocking
            ? "transform 860ms cubic-bezier(0.22, 1, 0.36, 1), gap 450ms ease"
            : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), gap 560ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {/* Logo Clapperboard exact de CineViseur + ondes parfaitement centrées sur le clap */}
        <div
          className={`relative shrink-0 ${phase === "clap" ? "intro-bounce" : ""}`}
          style={{
            filter: hasClapped
              ? "drop-shadow(0 0 28px rgba(16, 185, 129, 0.45)) drop-shadow(0 0 48px rgba(124, 102, 220, 0.35))"
              : "drop-shadow(0 0 18px rgba(16, 185, 129, 0.25))",
            transition: "filter 400ms ease",
          }}
        >
          {hasClapped && !isDocking && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div
                className="intro-flash absolute left-1/2 top-1/2 w-56 h-56 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(52, 211, 153, 0.45) 0%, rgba(124, 102, 220, 0.25) 45%, transparent 72%)",
                }}
              />
              <div
                className="intro-wave-1 absolute left-1/2 top-1/2 w-56 h-56 rounded-full border border-emerald-400/80"
                style={{ boxShadow: "0 0 36px rgba(16, 185, 129, 0.45), inset 0 0 24px rgba(16, 185, 129, 0.25)" }}
              />
              <div
                className="intro-wave-2 absolute left-1/2 top-1/2 w-56 h-56 rounded-full border border-cyan-400/70"
                style={{ boxShadow: "0 0 40px rgba(34, 211, 238, 0.35)" }}
              />
              <div
                className="intro-wave-3 absolute left-1/2 top-1/2 w-56 h-56 rounded-full border border-indigo-400/65"
                style={{ boxShadow: "0 0 44px rgba(124, 102, 220, 0.35)" }}
              />
            </div>
          )}
          <svg viewBox="36 16 440 440" className="w-24 h-24 sm:w-28 sm:h-28 overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="64" y1="40" x2="448" y2="440">
                <stop offset="0" stopColor="#10b981" />
                <stop offset="1" stopColor="#7c66dc" />
              </linearGradient>
            </defs>
            <g fill="none" stroke={paint} strokeWidth="30" strokeLinejoin="round" strokeLinecap="round">
              {/* Cadre inférieur */}
              <rect x="88" y="226" width="336" height="200" rx="30" />
              {/* Barre supérieure animée du clap (pivot charnière à gauche : 88px 182px) */}
              <g
                style={{
                  transformOrigin: "88px 182px",
                  transform: `rotate(${clapAngle}deg)`,
                  transition:
                    phase === "clap"
                      ? "transform 150ms cubic-bezier(0.55, 0.06, 0.68, 0.19)"
                      : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <rect x="88" y="120" width="336" height="62" rx="18" />
                <g strokeWidth="18" strokeLinecap="butt">
                  <path d="M174 166l26-30" />
                  <path d="M262 166l26-30" />
                  <path d="M350 166l26-30" />
                </g>
              </g>
            </g>
            {/* Triangle Play qui pulse à l'impact */}
            <path
              d="M228 284v84l72-42z"
              fill={paint}
              stroke={paint}
              strokeWidth="14"
              strokeLinejoin="round"
              style={{
                transformOrigin: "264px 326px",
                transform: phase === "clap" ? "scale(1.24)" : "scale(1)",
                transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </svg>
        </div>

        {/* Titre CINEVISEUR qui sort depuis le bord droit du logo (masqué à gauche) */}
        <div
          className="overflow-hidden flex items-center"
          style={{
            maxWidth: showTitle ? "540px" : "0px",
            opacity: showTitle ? 1 : 0,
            transition:
              "max-width 680ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease",
          }}
        >
          <span
            className="block whitespace-nowrap font-display font-semibold text-5xl sm:text-6xl tracking-tight text-white pr-1"
            style={{
              transform: showTitle ? "translate3d(0, 0, 0)" : "translate3d(-100%, 0, 0)",
              transition: "transform 680ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            CINE
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              VISEUR
            </span>
          </span>
        </div>
      </div>

      {/* Indice discret pour passer l'intro */}
      <button
        type="button"
        onClick={finish}
        className="fixed bottom-7 right-7 z-20 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 hover:text-white/80 transition-opacity duration-300"
        style={{ opacity: isDocking ? 0 : 1 }}
      >
        Passer · Échap
      </button>
    </div>
  );
}
