import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { mediaTitle, mediaType, mediaYear, tmdbImage, tmdbSrcSet } from "../lib/tmdb";
import { libraryKey, setLibraryStatus } from "../lib/library";
import useLibrary from "../hooks/useLibrary";
import usePosterGestures from "../hooks/usePosterGestures";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

export default function MediaCard({ item, mediaType: typeOverride }) {
  const { index, user } = useLibrary();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const title = mediaTitle(item);
  const type = mediaType(item, typeOverride);
  const year = mediaYear(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const existing = index.get(libraryKey(type, item.id));
  const gestures = usePosterGestures(item, type);

  async function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || existing || busy) return;
    setBusy(true);
    try {
      await setLibraryStatus({ item, mediaType: type, existing }, "to_watch");
    } finally {
      setBusy(false);
    }
  }

  const state = existing?.status === "watched" ? "watched" : existing ? "listed" : "none";

  return (
    <Link
      to={`/title/${type}/${item.id}`}
      data-vt-poster={item.poster_path || undefined}
      data-vt-title={title}
      title="Appui long ou clic droit : aperçu rapide"
      className="group block rounded-2xl focus-visible:outline-none select-none [-webkit-touch-callout:none]"
      {...gestures}
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] transition-all duration-300 group-hover:border-emerald-500/40 group-hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.25)] group-focus-visible:ring-2 group-focus-visible:ring-emerald-400">
        {item.poster_path ? (
          <img
            data-poster
            src={tmdbImage(item.poster_path, "poster")}
            srcSet={tmdbSrcSet(item.poster_path, "poster")}
            sizes="(min-width: 1024px) 176px, (min-width: 768px) 160px, 144px"
            decoding="async"
            draggable={false}
            alt={`Affiche de ${title}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            data-sharp={loaded || undefined}
            className="w-full h-full object-cover focus-in transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/55 text-xs px-3 text-center">
            <Icon name={type === "tv" ? "tv" : "film"} className="w-7 h-7" weight="light" />
            {title}
          </div>
        )}
        {!loaded && item.poster_path && <div className="absolute inset-0 skeleton" />}

        {/* Reflet de brillance cinématique au survol (21st.dev) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.12] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        {/* Pastille Note / Score en verre dépoli (Originkit) */}
        {rating && (
          <div className="absolute top-2.5 left-2.5 z-[2] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/90 shadow-sm tabular-nums">
            <Icon name="star" weight="fill" className="w-2.5 h-2.5 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Badge Type (Film / Série) */}
        <div className="absolute top-2.5 right-2.5 z-[2] px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-mono uppercase tracking-wider text-white/60">
          {type === "tv" ? "SÉRIE" : "FILM"}
        </div>

        {/* Bouton d'action rapide tactile (Originkit) */}
        {user && (
          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.88 }}
            aria-label={state === "none" ? `Ajouter ${title} à ma liste` : `${title} est dans ma liste`}
            title={state === "watched" ? "Déjà vu" : state === "listed" ? "Dans ma liste" : "Ajouter à ma liste"}
            className={`absolute bottom-2.5 right-2.5 z-[2] flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 ease-out focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shadow-lg ${
              state !== "none"
                ? "bg-emerald-500 text-black font-bold opacity-100 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : "bg-black/75 text-white hover:bg-white hover:text-black opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={state}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={SPRING}
                className="inline-flex"
              >
                <Icon name={state === "watched" ? "eye" : state === "listed" ? "check" : "plus"} className="w-4 h-4" weight="bold" />
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      <div className="pt-2.5 px-0.5">
        <p className="text-[13px] font-medium leading-snug truncate text-white/90 group-hover:text-emerald-400 transition-colors">{title}</p>
        <p className="flex items-center justify-between text-[11px] text-white/50 mt-0.5 tabular-nums">
          <span>{year || "Date à venir"}</span>
          <span className="font-mono text-[10px] text-white/40 tracking-wider">FR</span>
        </p>
      </div>
    </Link>
  );
}
