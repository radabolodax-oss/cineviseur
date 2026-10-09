import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../lib/api";
import MediaCard from "../components/MediaCard";
import PosterGrid, { PosterSkeleton } from "../components/PosterGrid";
import Icon from "../components/Icon";
import { TextShimmer } from "../components/backgrounds";
import { riseItem } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";

export default function Search() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q") || "";
  useSeo(query ? `Recherche « ${query} »` : "Rechercher", "Recherche un film ou une série dans le catalogue CineViseur.");
  const [draft, setDraft] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setDraft(query);
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    setFailed(false);
    api
      .search(query, "fr")
      .then((data) => setResults((data.results || []).filter((r) => r.media_type !== "person")))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [query]);

  function handleSubmit(e) {
    e.preventDefault();
    if (draft.trim()) navigate(`/search?q=${encodeURIComponent(draft.trim())}`);
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16">
      {/* Champ visible seulement sur mobile : sur ordinateur, la recherche est dans la barre du haut. */}
      <form onSubmit={handleSubmit} role="search" className="sm:hidden mb-8">
        <label className="flex items-center gap-3 input !rounded-full !py-3.5">
          <Icon name="search" className="w-5 h-5 text-white/50" />
          <span className="sr-only">Rechercher</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Un film, une série..."
            className="bg-transparent outline-none w-full placeholder:text-white/55"
            autoFocus={!query}
          />
        </label>
      </form>

      <motion.h1
        key={query}
        initial="hidden"
        animate="show"
        variants={riseItem}
        className="font-display font-semibold text-3xl md:text-4xl tracking-tight mb-8"
      >
        {query ? (
          <>
            Résultats pour « {query} »
            {!loading && results.length > 0 && (
              <span className="ml-3 text-base font-normal text-white/55 tabular-nums">{results.length}</span>
            )}
          </>
        ) : (
          "Rechercher"
        )}
      </motion.h1>

      {!query && <p className="text-white/55 -mt-5">Tape le titre d'un film ou d'une série.</p>}

      {loading && (
        <>
          <TextShimmer as="p" className="text-sm mb-6">Recherche dans le catalogue...</TextShimmer>
          <PosterSkeleton count={12} />
        </>
      )}

      {failed && <p role="alert" className="text-rose-300">La recherche a échoué. Réessaie dans un instant.</p>}

      {!loading && !failed && results.length === 0 && query && (
        <div className="max-w-md">
          <p className="text-white/65 mb-6">Aucun titre ne correspond à « {query} ». Vérifie l'orthographe ou essaie le titre original.</p>
          <Link to="/discover" className="link text-sm font-medium">Parcourir le catalogue</Link>
        </div>
      )}

      {!loading && results.length > 0 && (
        <PosterGrid
          items={results}
          getKey={(item) => `${item.media_type}-${item.id}`}
          render={(item) => <MediaCard item={item} mediaType={item.media_type} />}
        />
      )}
    </div>
  );
}
