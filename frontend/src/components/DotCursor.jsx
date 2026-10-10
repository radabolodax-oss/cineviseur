import { useEffect, useRef } from "react";
import { finePointer } from "../lib/motionTokens";

/**
 * Curseur personnalisé deux couches :
 * - Un petit point colle à la souris (quasi-instantané).
 * - Un anneau suit avec un léger retard (lerp doux).
 * Actif uniquement sur les dispositifs à pointeur fin.
 */
export default function DotCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!finePointer) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-dot-cursor");

    let mx = -200, my = -200;
    let rx = -200, ry = -200;
    const LERP = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.13;

    let raf;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animate() {
      rx = lerp(rx, mx, LERP);
      ry = lerp(ry, my, LERP);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(animate);
    }

    function show() {
      dot.style.opacity  = "1";
      ring.style.opacity = "1";
    }

    function onMove(e) {
      if (dot.style.opacity !== "1") {
        rx = e.clientX;
        ry = e.clientY;
        show();
      }
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }

    function onLeave() {
      dot.style.opacity  = "0";
      ring.style.opacity = "0";
    }

    function onDown() { ring.classList.add("cursor-ring--pressed"); }
    function onUp()   { ring.classList.remove("cursor-ring--pressed"); }

    function onOver(e) {
      const el = e.target;
      if (el?.closest?.("a, button, [role='button'], input, select, textarea, label")) {
        ring.classList.add("cursor-ring--hover");
      } else {
        ring.classList.remove("cursor-ring--hover");
      }
    }

    raf = requestAnimationFrame(animate);
    document.addEventListener("mousemove",  onMove,  { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave, { passive: true });
    document.addEventListener("mousedown",  onDown,  { passive: true });
    document.addEventListener("mouseup",    onUp,    { passive: true });
    document.addEventListener("mouseover",  onOver,  { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-dot-cursor");
      document.removeEventListener("mousemove",  onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mousedown",  onDown);
      document.removeEventListener("mouseup",    onUp);
      document.removeEventListener("mouseover",  onOver);
    };
  }, []);

  if (!finePointer) return null;

  return (
    <>
      <div ref={dotRef}  aria-hidden="true" className="cursor-dot"  style={{ opacity: 0 }} />
      <div ref={ringRef} aria-hidden="true" className="cursor-ring" style={{ opacity: 0 }} />
    </>
  );
}
