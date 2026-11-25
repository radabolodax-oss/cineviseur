import { useEffect, useState } from "react";
import PosterRack from "../components/PosterRack";
import { getTrending } from "../lib/tmdb";

// Repli de test (sans affiche) si l'API TMDB ne répond pas : permet de vérifier la mise en page.
const FALLBACK_ITEMS = ["Dune", "Arrival", "Blade Runner 2049", "Her", "Drive", "Past Lives", "Parasite", "Alien"].map(
  (title, i) => ({ id: i + 1, title, poster_path: null, release_date: "2020-01-01" })
);

export default function TestPortant() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    getTrending()
      .then((results) => {
        if (cancelled) return;
        setItems(results.filter((r) => r.poster_path).slice(0, 12));
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setItems(FALLBACK_ITEMS);
        setStatus("fallback");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pt-10 pb-16 px-4 sm:px-6 md:px-10">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-emerald-400 font-semibold mb-3">
        PROTOTYPE · PORTANT D'AFFICHES
      </p>
      <h1 className="page-title mb-8">Portant</h1>
      {status === "loading" && <p className="text-white/60">Chargement…</p>}
      {status === "fallback" && (
        <p className="text-white/50 text-sm mb-6">API TMDB indisponible : titres de test affichés à la place des affiches.</p>
      )}
      {(status === "ready" || status === "fallback") && <PosterRack items={items} />}
    </div>
  );
}
