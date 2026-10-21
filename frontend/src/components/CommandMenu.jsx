import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { api } from "../lib/api";
import { mediaTitle, mediaYear, tmdbImage } from "../lib/tmdb";
import { play } from "../lib/feedback";

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Écoute du raccourci universel Cmd+K ou Ctrl+K et événement personnalisé
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("cv:open-command-menu", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("cv:open-command-menu", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus automatique du champ texte à l'ouverture
  useEffect(() => {
    if (isOpen) {
      play("pop");
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Recherche dynamique TMDB avec debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      api.search(query.trim(), "fr", 1)
        .then((data) => {
          const filtered = (data.results || [])
            .filter((item) => (item.media_type === "movie" || item.media_type === "tv") && item.poster_path)
            .slice(0, 5);
          setResults(filtered);
          setSelectedIndex(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Raccourcis fixes
  const staticActions = [
    {
      id: "discover",
      title: "Explorer le catalogue",
      category: "Navigation",
      icon: "compass",
      action: () => navigate("/discover"),
    },
    {
      id: "watchlist",
      title: "Ouvrir ma liste",
      category: "Navigation",
      icon: "list",
      action: () => navigate("/watchlist"),
    },
    {
      id: "duo",
      title: "Soirée Duo · Trouver un film à 2",
      category: "Fonctionnalités",
      icon: "heart",
      badge: "Nouveau",
      action: () => navigate("/swipe?duo=1"),
    },
    {
      id: "roulette",
      title: "Qu'est-ce qu'on regarde ? (Roulette)",
      category: "Fonctionnalités",
      icon: "sparkle",
      action: () => navigate("/ce-soir"),
    },
    {
      id: "cinemas",
      title: "Cinémas & séances géolocalisées",
      category: "Navigation",
      icon: "pin",
      action: () => navigate("/cinemas"),
    },
    {
      id: "recap",
      title: "Mon Bilan & Statistiques",
      category: "Navigation",
      icon: "popcorn",
      action: () => navigate("/recap"),
    },
    {
      id: "providers",
      title: "Gérer mes abonnements streaming",
      category: "Paramètres",
      icon: "tv",
      action: () => window.dispatchEvent(new CustomEvent("cv:open-providers")),
    },
    {
      id: "import",
      title: "Importer depuis Letterboxd ou IMDb",
      category: "Données",
      icon: "download",
      action: () => window.dispatchEvent(new CustomEvent("cv:open-import")),
    },
  ];

  // Liste active des éléments navigables au clavier
  const activeItems = results.length > 0
    ? results.map((r) => ({
        id: `media-${r.id}`,
        title: mediaTitle(r),
        subtitle: `${mediaYear(r)} · ${r.media_type === "tv" ? "Série" : "Film"} · ★ ${r.vote_average ? r.vote_average.toFixed(1) : "-"}`,
        poster: r.poster_path,
        action: () => navigate(`/title/${r.media_type}/${r.id}`),
      }))
    : staticActions;

  // Clavier dans la modal
  const handleKeyDownModal = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % activeItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeItems[selectedIndex]) {
        activeItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onKeyDown={handleKeyDownModal}
            className="relative w-full max-w-2xl rounded-3xl bg-[#0f111e]/95 border border-white/20 shadow-[0_24px_64px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden z-10"
          >
            {/* Champ de recherche Command Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <Icon name="search" className="w-5 h-5 text-white/50 shrink-0" weight="bold" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un film, une série, ou taper une action..."
                className="w-full bg-transparent text-white placeholder-white/40 text-base md:text-lg outline-none font-medium"
              />
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-cine-soft rounded-full animate-spin shrink-0" />
              ) : (
                <kbd className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-mono text-white/50 shrink-0 select-none">
                  ESC
                </kbd>
              )}
            </div>

            {/* Corps des résultats / actions */}
            <div className="max-h-[60vh] overflow-y-auto p-2.5">
              {query.trim() && results.length === 0 && !loading && (
                <div className="py-8 text-center text-sm text-white/50">
                  Aucun résultat trouvé pour « {query} ».
                </div>
              )}

              {/* Titre de section */}
              <div className="px-3 pt-2 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold">
                {results.length > 0 ? "Films & Séries" : "Actions rapides & Raccourcis"}
              </div>

              {/* Liste d'éléments */}
              <div className="space-y-1">
                {activeItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        item.action();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                        isSelected
                          ? "bg-white/15 text-white shadow-sm ring-1 ring-white/20"
                          : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.poster ? (
                          <img
                            src={tmdbImage(item.poster, "thumb")}
                            alt=""
                            className="w-8 h-12 object-cover rounded-lg shrink-0 ring-1 ring-white/20"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-cine-violet text-white" : "bg-white/10 text-white/70"
                          }`}>
                            <Icon name={item.icon || "compass"} className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0 pr-2">
                          <span className="font-medium text-sm block truncate text-white">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="text-xs text-white/50 font-mono block truncate">
                              {item.subtitle}
                            </span>
                          )}
                          {item.category && (
                            <span className="text-[10px] font-mono text-white/40 uppercase block">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono text-[10px] font-semibold">
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono text-white/80">
                            ↵
                          </kbd>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pied de page avec astuces clavier */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/10 bg-white/[0.02] text-[11px] font-mono text-white/50">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 mr-1">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 mr-1.5">↓</kbd>
                  Naviguer
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 mr-1.5">↵</kbd>
                  Sélectionner
                </span>
              </div>
              <span className="text-cine-soft font-semibold">CineViseur Command</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
