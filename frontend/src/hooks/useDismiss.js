import { useEffect } from "react";

// Ferme un menu au clic extérieur ou à la touche Échap.
export default function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    function handlePointer(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, open, onClose]);
}
