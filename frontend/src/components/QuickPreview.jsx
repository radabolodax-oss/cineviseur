import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { api } from "../lib/api";
import { mediaTitle, mediaYear, tmdbImage } from "../lib/tmdb";
import { libraryKey, setLibraryStatus } from "../lib/library";
import useLibrary from "../hooks/useLibrary";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

const SWIPE = 110;

function findTrailer(details) {
  const list = details?.videos?.results || [];
  return list.find((v) => v.site === "YouTube" && v.type === "Trailer") || list.find((v) => v.site === "YouTube");
}

/** Affiche qu'on glisse : à droite « Vu », à gauche « À voir ». */
function SwipePoster({ item, onSwipe, disabled }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const watchedOpacity = useTransform(x, [20, SWIPE], [0, 1]);
  const queueOpacity = useTransform(x, [-SWIPE, -20], [1, 0]);

  return (
    <motion.div
      className="relative w-28 sm:w-36 shrink-0 cursor-grab active:cursor-grabbing touch-pan-y"
      style={{ x, rotate }}
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE) onSwipe("watched");
        else if (info.offset.x < -SWIPE) onSwipe("to_watch");
      }}
    >
      <img
        src={tmdbImage(item.poster_path, "poster")}
        alt={`Affiche de ${mediaTitle(item)}`}
        draggable={false}
        className="w-full aspect-[2/3] object-cover rounded-xl ring-1 ring-white/15 shadow-2xl pointer-events-none"
      />
      <motion.span style={{ opacity: watchedOpacity }} className="absolute top-3 left-2 -rotate-12 rounded-md border-2 border-emerald-300 px-2 py-0.5 text-sm font-bold text-emerald-200">
        VU
      </motion.span>
      <motion.span style={{ opacity: queueOpacity }} className="absolute top-3 right-2 rotate-12 rounded-md border-2 border-cine-soft px-2 py-0.5 text-sm font-bold text-cine-soft">
        À VOIR
      </motion.span>
    </motion.div>
  );
}

export default function QuickPreview() {
  const { index, token, user } = useLibrary();
  const navigate = useNavigate();
  const [target, setTarget] = useState(null);
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onPreview = (e) => {
      setTarget(e.detail);
      setDetails(null);
      api.details(e.detail.mediaType, e.detail.item.id, "fr").then(setDetails).catch(() => {});
    };
    window.addEventListener("cv:preview", onPreview);
    return () => window.removeEventListener("cv:preview", onPreview);
  }, []);

  useEffect(() => {
    if (!target) return;
    const onKey = (e) => e.key === "Escape" && setTarget(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target]);

  const item = target?.item;
  const type = target?.mediaType;
  const existing = item ? index.get(libraryKey(type, item.id)) : null;
  const trailer = findTrailer(details);
  const href = item ? `/title/${type}/${item.id}` : "/";

  async function choose(status) {
    if (!user) {
      setTarget(null);
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      await setLibraryStatus(token, { item, mediaType: type, existing }, existing?.status === status ? null : status);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key="preview"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-cine-ink/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Aperçu de ${mediaTitle(item)}`}
        >
          <motion.div
            className="relative w-full sm:max-w-2xl panel !bg-[#0c0d18]/95 overflow-hidden rounded-b-none sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={SPRING}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && setTarget(null)}
          >
            <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-white/25" aria-hidden="true" />
            <div className="relative aspect-video bg-black">
              {trailer ? (
                <iframe
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1&playsinline=1`}
                  title={`Bande-annonce de ${mediaTitle(item)}`}
                  allow="autoplay; encrypted-media"
                />
              ) : (
                item.backdrop_path && <img src={tmdbImage(item.backdrop_path, "backdrop")} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d18] via-transparent to-transparent" />
              <button onClick={() => setTarget(null)} className="btn-icon absolute top-3 right-3" aria-label="Fermer l'aperçu">
                <Icon name="x" />
              </button>
            </div>

            <div className="relative -mt-16 flex gap-5 px-5 pb-6">
              {item.poster_path && <SwipePoster item={item} onSwipe={choose} disabled={busy} />}
              <div className="min-w-0 flex-1 pt-14">
                <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight">{mediaTitle(item)}</h2>
                <p className="mt-1 flex items-center gap-3 text-sm text-white/60 tabular-nums">
                  <span>{mediaYear(item) || "Date à venir"}</span>
                  {item.vote_average ? (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="star" weight="fill" className="w-3.5 h-3.5 text-cine-soft" />
                      {item.vote_average.toFixed(1)}
                    </span>
                  ) : null}
                  {details?.runtime ? <span>{Math.floor(details.runtime / 60)} h {String(details.runtime % 60).padStart(2, "0")}</span> : null}
                </p>
                <p className="mt-3 text-sm text-white/70 leading-relaxed line-clamp-4">{item.overview || details?.overview || "Pas de synopsis disponible."}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-4">
              <button
                onClick={() => choose("to_watch")}
                disabled={busy}
                aria-pressed={existing?.status === "to_watch"}
                className={existing?.status === "to_watch" ? "btn-primary !px-5 !py-2.5" : "btn-ghost !py-2.5"}
              >
                <Icon name={existing?.status === "to_watch" ? "check" : "plus"} weight="bold" /> À voir
              </button>
              <button
                onClick={() => choose("watched")}
                disabled={busy}
                aria-pressed={existing?.status === "watched"}
                className={existing?.status === "watched" ? "btn-primary !px-5 !py-2.5" : "btn-ghost !py-2.5"}
              >
                <Icon name="eye" weight="bold" /> Vu
              </button>
              <Link to={href} onClick={() => setTarget(null)} className="ml-auto link text-sm font-medium">
                Ouvrir la fiche
              </Link>
              <p className="w-full pt-1 text-xs text-white/50">Astuce : glisse l'affiche à droite pour « Vu », à gauche pour « À voir ».</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
