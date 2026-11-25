import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PosterRack from "../components/PosterRack";
import Icon from "../components/Icon";
import { api } from "../lib/api";
import { getNowPlaying, getStreamingReleases, getTrending, getUpcoming } from "../lib/tmdb";
import useSeo from "../hooks/useSeo";

const TICKER_STYLES = `
@keyframes laboTicker {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}
.labo-ticker-track {
  display: flex;
  width: max-content;
  animation: laboTicker 32s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .labo-ticker-track { animation: none; }
}
`;

const SECTION_NAV = [
  { id: "labo-trending", code: "01", label: "Tendances", accent: "bg-rose-400" },
  { id: "labo-cinema", code: "02", label: "Au cinéma", accent: "bg-emerald-400" },
  { id: "labo-streaming", code: "03", label: "Streaming", accent: "bg-indigo-400" },
  { id: "labo-upcoming", code: "04", label: "Bientôt", accent: "bg-amber-400" },
  { id: "labo-series", code: "05", label: "Séries", accent: "bg-purple-400" },
  { id: "labo-personal", code: "06", label: "Top / Ma liste", accent: "bg-emerald-300" },
];

function readLocalWatchlist() {
  try {
    const raw = localStorage.getItem("cv_local_watchlist");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        id: entry.tmdb_id || entry.id,
        title: entry.title,
        name: entry.title,
        media_type: entry.media_type || "movie",
        poster_path: entry.poster_path || null,
        release_date: entry.release_date || "",
        vote_average: entry.vote_average || 0,
        overview: entry.overview || "",
      }))
      .filter((entry) => entry.id && entry.poster_path);
  } catch {
    return [];
  }
}

export default function Labo() {
  useSeo(
    "Labo 3D · Le Vestiaire Cinéma",
    "Prototype interactif CineViseur : chaque section présentée comme un portant d'affiches 3D."
  );

  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [streaming, setStreaming] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [series, setSeries] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState({
    trending: true,
    nowPlaying: true,
    streaming: true,
    upcoming: true,
    series: true,
    topRated: true,
  });

  const localWatchlist = useMemo(() => readLocalWatchlist(), []);

  useEffect(() => {
    let cancelled = false;

    const load = (key, promise, setter) => {
      promise
        .then((list) => {
          if (cancelled) return;
          const clean = (Array.isArray(list) ? list : list?.results || []).filter((it) => it && it.poster_path);
          setter(clean.slice(0, 16));
        })
        .catch(() => {
          if (!cancelled) setter([]);
        })
        .finally(() => {
          if (!cancelled) setLoading((prev) => ({ ...prev, [key]: false }));
        });
    };

    load("trending", getTrending(), setTrending);
    load("nowPlaying", getNowPlaying(), setNowPlaying);
    load("streaming", getStreamingReleases(), setStreaming);
    load("upcoming", getUpcoming(), setUpcoming);
    load("series", api.discover("tv", "fr", { sort: "popularity", page: 1 }), setSeries);
    load("topRated", api.discover("movie", "fr", { sort: "rating", minRating: 7.5, page: 1 }), setTopRated);

    return () => {
      cancelled = true;
    };
  }, []);

  const personalItems = localWatchlist.length >= 4 ? localWatchlist : topRated;
  const usingWatchlist = localWatchlist.length >= 4;

  const tickerText =
    "CINEVISEUR LABO 3D • PORTANT D'AFFICHES INTERACTIF • SURVOLEZ POUR FEUILLETER LA VAGUE 3D • CLIQUEZ POUR EXTRAIRE LA FICHE • FLÈCHES ← → POUR PARCOURIR • ÉCHAP POUR RANGER • ";

  return (
    <div className="min-h-screen pb-24">
      <style>{TICKER_STYLES}</style>

      {/* En-tête du Labo façon studio */}
      <header className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-8 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 font-mono text-[10px] tracking-[0.24em] uppercase font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              CINEVISEUR · LABO 3D INTERACTIF
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Le Vestiaire Cinéma
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/60 max-w-2xl">
              Chaque section de CineViseur transformée en portant d'affiches 3D : survolez le rail pour faire pivoter les affiches en vague, puis cliquez pour extraire la fiche complète.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.1] px-4 py-2 text-xs sm:text-sm font-medium text-white/85 transition-colors"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
              <span>Retour accueil classique</span>
            </Link>
          </div>
        </div>

        {/* Navigation rapide par section (style onglets de casiers) */}
        <nav aria-label="Sections du labo" className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTION_NAV.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] hover:border-white/25 px-3.5 py-1.5 text-xs font-medium text-white/80 hover:text-white transition-all"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sec.accent}`} />
              <span className="font-mono text-[10px] text-white/45">{sec.code}</span>
              <span>{sec.label}</span>
            </a>
          ))}
        </nav>
      </header>

      {/* Toutes les sections CineViseur en mode Portant 3D */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 flex flex-col gap-10">
        <div id="labo-trending" className="scroll-mt-24">
          <PosterRack
            sectionIndex="01"
            sectionLabel="TENDANCES"
            sectionTitle="Tendances de la semaine"
            subtitle="Les films et séries les plus regardés et commentés en ce moment"
            accent="crimson"
            items={trending}
            pending={loading.trending}
          />
        </div>

        <div id="labo-cinema" className="scroll-mt-24">
          <PosterRack
            sectionIndex="02"
            sectionLabel="EN SALLE"
            sectionTitle="À l'affiche au cinéma"
            subtitle="Actuellement projetés dans les salles françaises"
            accent="emerald"
            mediaType="movie"
            items={nowPlaying}
            pending={loading.nowPlaying}
          />
        </div>

        <div id="labo-streaming" className="scroll-mt-24">
          <PosterRack
            sectionIndex="03"
            sectionLabel="STREAMING & VOD"
            sectionTitle="Nouveautés à la maison"
            subtitle="Sorties récentes disponibles sur vos plateformes et en VOD"
            accent="indigo"
            mediaType="movie"
            items={streaming}
            pending={loading.streaming}
          />
        </div>

        <div id="labo-upcoming" className="scroll-mt-24">
          <PosterRack
            sectionIndex="04"
            sectionLabel="BIENTÔT AU CINÉMA"
            sectionTitle="Prochaines sorties en salle"
            subtitle="Les films très attendus à préparer dans votre watchlist"
            accent="amber"
            mediaType="movie"
            items={upcoming}
            pending={loading.upcoming}
          />
        </div>

        <div id="labo-series" className="scroll-mt-24">
          <PosterRack
            sectionIndex="05"
            sectionLabel="SÉRIES"
            sectionTitle="Séries du moment"
            subtitle="Les séries populaires à suivre épisode par épisode"
            accent="purple"
            mediaType="tv"
            items={series}
            pending={loading.series}
          />
        </div>

        <div id="labo-personal" className="scroll-mt-24">
          <PosterRack
            sectionIndex="06"
            sectionLabel={usingWatchlist ? "MA WATCHLIST" : "LES MIEUX NOTÉS"}
            sectionTitle={usingWatchlist ? "Votre portant personnel" : "Films les mieux notés"}
            subtitle={
              usingWatchlist
                ? "Vos films et séries enregistrés dans votre espace local"
                : "Les œuvres les mieux notées par la communauté (ajoutez 4 titres à votre watchlist pour voir votre portant ici)"
            }
            accent="emerald"
            mediaType="movie"
            items={personalItems}
            pending={!usingWatchlist && loading.topRated}
          />
        </div>
      </div>

      {/* Bandeau défilant en bas d'écran (hommage direct au Reel) */}
      <div className="fixed bottom-0 inset-x-0 z-30 overflow-hidden bg-rose-600/95 border-t border-rose-400/50 py-1.5 backdrop-blur-md">
        <div className="labo-ticker-track font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-white whitespace-nowrap">
          <span>{tickerText}</span>
          <span aria-hidden="true">{tickerText}</span>
        </div>
      </div>
    </div>
  );
}
