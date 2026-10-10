import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { mediaTitle, mediaType, mediaYear, tmdbImage, tmdbSrcSet } from "../lib/tmdb";
import { libraryKey, setLibraryStatus } from "../lib/library";
import useLibrary from "../hooks/useLibrary";
import usePosterGestures from "../hooks/usePosterGestures";
import Icon from "./Icon";
import { TiltCard } from "./motion";
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
      className="group block rounded-xl focus-visible:outline-none select-none [-webkit-touch-callout:none]"
      {...gestures}
    >
      <TiltCard className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] transition-[box-shadow] duration-300 group-hover:ring-white/20 group-hover:shadow-[0_22px_44px_-18px_rgba(124,92,224,0.5)] group-focus-visible:ring-2 group-focus-visible:ring-cine-soft">
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
            className={`w-full h-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05] ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/55 text-xs px-3 text-center">
            <Icon name={type === "tv" ? "tv" : "film"} className="w-7 h-7" weight="light" />
            {title}
          </div>
        )}
        {!loaded && item.poster_path && <div className="absolute inset-0 skeleton" />}

        {user && (
          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.85 }}
            aria-label={state === "none" ? `Ajouter ${title} à ma liste` : `${title} est dans ma liste`}
            title={state === "watched" ? "Déjà vu" : state === "listed" ? "Dans ma liste" : "Ajouter à ma liste"}
            className={`absolute bottom-2 right-2 z-[2] flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md ring-1 ring-inset ring-white/20 transition-[opacity,transform,background-color] duration-300 ease-out focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft ${
              state !== "none"
                ? "bg-cine-violet text-white opacity-100"
                : "bg-cine-ink/70 text-white hover:bg-[#f4f4f6] hover:text-cine-ink opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
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
      </TiltCard>

      <div className="pt-2.5 px-0.5">
        <p className="text-[13px] font-medium leading-snug truncate text-white/90 group-hover:text-white transition-colors">{title}</p>
        <p className="flex items-center gap-2 text-[11px] text-white/55 mt-0.5 tabular-nums">
          <span>{year || "Date à venir"}</span>
          {rating && (
            <span className="flex items-center gap-0.5 text-white/65">
              <Icon name="star" weight="fill" className="w-2.5 h-2.5 text-cine-soft" />
              {rating}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
