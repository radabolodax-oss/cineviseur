import { useRef } from "react";
import { openPreview, emitTint, vibrate } from "../lib/feedback";
import { posterColor } from "../lib/color";

const HOLD_MS = 450;

/**
 * Gestes communs aux affiches :
 * - appui long (doigt ou souris) ou clic droit : aperçu rapide sans quitter la page ;
 * - survol : le fond prend la couleur de l'affiche.
 * Un appui long annule le clic qui suit (pas de navigation involontaire).
 */
export default function usePosterGestures(item, mediaType) {
  const timer = useRef(null);
  const start = useRef(null);
  const held = useRef(false);
  const hoverTimer = useRef(null);

  function cancel() {
    clearTimeout(timer.current);
    timer.current = null;
  }

  const el = useRef(null);

  function open() {
    held.current = true;
    // Repère lu par la navigation cinéma : ce clic-là ne doit pas ouvrir la fiche.
    if (el.current) el.current.dataset.held = "1";
    vibrate(15);
    openPreview(item, mediaType);
  }

  return {
    onPointerDown(e) {
      if (e.button !== 0) return;
      held.current = false;
      el.current = e.currentTarget;
      delete e.currentTarget.dataset.held;
      start.current = { x: e.clientX, y: e.clientY };
      cancel();
      timer.current = setTimeout(open, HOLD_MS);
    },
    onPointerMove(e) {
      if (!timer.current || !start.current) return;
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onClickCapture(e) {
      if (held.current) {
        e.preventDefault();
        e.stopPropagation();
        held.current = false;
        delete e.currentTarget.dataset.held;
      }
    },
    onContextMenu(e) {
      e.preventDefault();
      cancel();
      open();
    },
    onMouseEnter() {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => posterColor(item.poster_path).then((rgb) => rgb && emitTint(rgb)), 250);
    },
    onMouseLeave() {
      clearTimeout(hoverTimer.current);
      cancel();
    },
  };
}
