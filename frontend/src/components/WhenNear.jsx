import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Ne monte son contenu que lorsqu'il approche de l'écran : le code et les animations des sections
 * basses de la page ne coûtent rien au premier affichage.
 */
export default function WhenNear({ children, minHeight = "60vh", margin = "600px" }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, margin]);

  return (
    <div ref={ref} style={near ? undefined : { minHeight }}>
      {near && <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>}
    </div>
  );
}
