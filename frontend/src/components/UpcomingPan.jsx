import { useEffect, useState } from "react";
import { getUpcoming } from "../lib/tmdb";
import PosterRack from "./PosterRack";

/**
 * Calcule dynamiquement le libellé de sortie en salle par rapport à la date/heure actuelle :
 * - Plus de 4 jours : date de sortie complète (ex: "Sortie le 18 nov.")
 * - De 1 à 4 jours : compte à rebours ("Dans 4 j", "Dans 3 j", "Dans 2 j", "Dans 1 j")
 * - Le jour même : "Sortie aujourd'hui !"
 */
function getReleaseCountdown(dateStr, now) {
  if (!dateStr) return "Prochainement";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "Prochainement";
  const [y, m, d] = parts;
  const targetMidnight = new Date(y, m - 1, d, 0, 0, 0);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const daysDiff = Math.round((targetMidnight.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) return "En salle actuellement";
  if (daysDiff === 0) return "Sortie aujourd'hui !";
  if (daysDiff <= 4) return `Dans ${daysDiff} j`;

  const formattedDate = targetMidnight.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: targetMidnight.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
  return `Sortie le ${formattedDate}`;
}

export default function UpcomingPan() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Horloge continue : actualise les décomptes chaque minute et au réveil de l'onglet
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    getUpcoming()
      .then((list) => {
        const sorted = (list || [])
          .filter((m) => m.poster_path)
          .sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""))
          .slice(0, 16);
        setItems(sorted);
      })
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && items.length === 0) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 w-full my-10">
      <PosterRack
        items={items}
        mediaType="movie"
        sectionIndex="04"
        sectionLabel="BIENTÔT AU CINÉMA"
        sectionTitle="Prochaines sorties en salle"
        subtitle="Dates de sortie et comptes à rebours mis à jour en direct"
        accent="amber"
        pending={!loaded}
        getSubtext={(item) => getReleaseCountdown(item.release_date, now)}
      />
    </div>
  );
}
