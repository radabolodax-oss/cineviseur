import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimate, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { tmdbImage } from "../lib/tmdb";
import { finePointer } from "../lib/motionTokens";

/**
 * Ticket de cinéma : quand un titre passe en « vu », un ticket apparaît, reçoit le tampon VU,
 * puis s'envole vers « Ma liste ». C'est le moment de récompense propre à CineViseur.
 */
function Ticket({ ticket, onDone }) {
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const el = scope.current;
      if (reduce) {
        await animate(el, { opacity: [0, 1] }, { duration: 0.2 });
        await new Promise((r) => setTimeout(r, 900));
        if (!cancelled) onDone();
        return;
      }
      await animate(el, { opacity: [0, 1], y: [60, 0], rotate: [-8, -3], scale: [0.8, 1] }, { type: "spring", stiffness: 260, damping: 20 });
      await animate("[data-stamp]", { opacity: [0, 1], scale: [2.6, 1], rotate: [-30, -12] }, { duration: 0.28, ease: [0.5, 0, 0.75, 0] });
      await animate(el, { x: [0, -4, 4, 0] }, { duration: 0.18 });
      await new Promise((r) => setTimeout(r, 450));
      // Destination : le lien « Ma liste » visible (barre du haut ou onglet mobile).
      const target = [...document.querySelectorAll("[data-ticket-target]")].find((t) => t.getBoundingClientRect().width > 0);
      const from = el.getBoundingClientRect();
      if (target) {
        const to = target.getBoundingClientRect();
        await animate(
          el,
          {
            x: to.left + to.width / 2 - (from.left + from.width / 2),
            y: to.top + to.height / 2 - (from.top + from.height / 2),
            scale: 0.08,
            rotate: 20,
            opacity: [1, 1, 0],
          },
          { duration: 0.7, ease: [0.6, 0, 0.2, 1] }
        );
        target.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 380 });
      } else {
        await animate(el, { opacity: 0, y: -40 }, { duration: 0.4 });
      }
      if (!cancelled) onDone();
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={scope} className="pointer-events-none fixed left-1/2 top-1/2 z-[70] -ml-[150px] -mt-[80px] w-[300px] opacity-0" role="status" aria-live="polite">
      <div className="ticket relative flex h-[160px] overflow-hidden rounded-2xl bg-[#f4f1ea] text-cine-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
        {ticket.poster_path && <img src={tmdbImage(ticket.poster_path, "poster")} alt="" className="h-full w-[106px] object-cover" />}
        <div className="flex flex-1 flex-col justify-between border-l-2 border-dashed border-cine-ink/25 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cine-ink/60">CineViseur · Entrée</p>
          <p className="font-display text-lg font-semibold leading-tight line-clamp-3">{ticket.title}</p>
          <p className="font-mono text-[10px] text-cine-ink/60">{new Date().toLocaleDateString("fr-FR")}</p>
        </div>
        <span
          data-stamp
          className="absolute right-4 top-1/2 -mt-7 rounded-lg border-[3px] border-cine-violet px-3 py-1 font-display text-3xl font-bold text-cine-violet opacity-0 mix-blend-multiply"
        >
          VU
        </span>
      </div>
    </div>
  );
}

function TicketLayer() {
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    const onWatched = (e) => setQueue((q) => [...q, { ...e.detail, key: Date.now() + Math.random() }]);
    window.addEventListener("cv:watched", onWatched);
    return () => window.removeEventListener("cv:watched", onWatched);
  }, []);
  const current = queue[0];
  return current ? <Ticket key={current.key} ticket={current} onDone={() => setQueue((q) => q.slice(1))} /> : null;
}

/** Halo de projecteur qui éclaire doucement le contenu sous la souris. */
function CursorSpotlight() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const sx = useSpring(x, { stiffness: 300, damping: 40 });
  const sy = useSpring(y, { stiffness: 300, damping: 40 });
  const background = useMotionTemplate`radial-gradient(380px circle at ${sx}px ${sy}px, rgba(255,255,255,0.07), transparent 70%)`;

  useEffect(() => {
    if (reduce) return;
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y, reduce]);

  if (reduce) return null;
  return <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[55] mix-blend-soft-light" style={{ background }} />;
}

/** Teinte du fond : l'aurore prend la couleur de l'affiche survolée, puis revient au violet. */
function AuroraTint() {
  const [tint, setTint] = useState(null);
  useEffect(() => {
    let timer;
    const onTint = (e) => {
      clearTimeout(timer);
      setTint(e.detail);
      if (!e.detail) return;
      timer = setTimeout(() => setTint(null), 6000);
    };
    window.addEventListener("cv:tint", onTint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("cv:tint", onTint);
    };
  }, []);
  return (
    <AnimatePresence>
      {tint && (
        <motion.div
          key={tint.join(",")}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-[5]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          style={{
            background: `radial-gradient(ellipse 80% 60% at 75% -5%, rgba(${tint.join(",")},0.28), transparent 70%)`,
          }}
        />
      )}
    </AnimatePresence>
  );
}

export default function CinemaLayer() {
  return (
    <>
      <AuroraTint />
      {finePointer && <CursorSpotlight />}
      <TicketLayer />
    </>
  );
}
