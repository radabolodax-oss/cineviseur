import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { api } from "../lib/api";
import { mediaTitle, mediaYear, tmdbImage } from "../lib/tmdb";
import { libraryKey, setLibraryStatus } from "../lib/library";
import { play, vibrate } from "../lib/feedback";
import useLibrary from "../hooks/useLibrary";
import useSeo from "../hooks/useSeo";
import Icon from "../components/Icon";
import { KineticTitle } from "../components/motion";

const THRESHOLD = 120;
const EXIT = {
  to_watch: { x: 600, y: 40, rotate: 25 },
  skip: { x: -600, y: 40, rotate: -25 },
  watched: { x: 0, y: -700, rotate: 0 },
};

function TopCard({ item, onDecide }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [30, THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-THRESHOLD, -30], [1, 0]);
  const seenOpacity = useTransform(y, [-THRESHOLD, -30], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      style={{ x, y, rotate }}
      drag
      dragSnapToOrigin
      dragElastic={0.8}
      onDragEnd={(_, info) => {
        if (info.offset.y < -THRESHOLD && Math.abs(info.offset.x) < THRESHOLD) onDecide("watched");
        else if (info.offset.x > THRESHOLD) onDecide("to_watch");
        else if (info.offset.x < -THRESHOLD) onDecide("skip");
      }}
      variants={{
        enter: { scale: 0.95, y: 20, opacity: 0 },
        center: { scale: 1, y: 0, opacity: 1 },
        // La carte part du côté choisi (direction transmise par AnimatePresence via `custom`).
        leave: (dir) => ({ ...EXIT[dir || "skip"], opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }),
      }}
      initial="enter"
      animate="center"
      exit="leave"
    >
      <img src={tmdbImage(item.poster_path, "posterLarge")} alt={`Affiche de ${mediaTitle(item)}`} draggable={false} className="h-full w-full object-cover rounded-3xl ring-1 ring-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] pointer-events-none" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24">
        <h2 className="font-display text-2xl font-semibold leading-tight">{mediaTitle(item)}</h2>
        <p className="mt-1 text-sm text-white/70 tabular-nums">
          {mediaYear(item)} {item.vote_average ? `· ${item.vote_average.toFixed(1)}/10` : ""}
        </p>
      </div>
      <motion.span style={{ opacity: likeOpacity }} className="pointer-events-none absolute left-6 top-8 -rotate-12 rounded-xl border-4 border-cine-soft px-4 py-1 font-display text-3xl font-bold text-cine-soft">
        À VOIR
      </motion.span>
      <motion.span style={{ opacity: skipOpacity }} className="pointer-events-none absolute right-6 top-8 rotate-12 rounded-xl border-4 border-white/80 px-4 py-1 font-display text-3xl font-bold text-white/90">
        PASSER
      </motion.span>
      <motion.span style={{ opacity: seenOpacity }} className="pointer-events-none absolute left-1/2 bottom-32 -translate-x-1/2 rounded-xl border-4 border-emerald-300 px-4 py-1 font-display text-3xl font-bold text-emerald-200">
        DÉJÀ VU
      </motion.span>
    </motion.div>
  );
}

export default function Swipe() {
  useSeo("Trier en swipant", "Fais défiler les films populaires et range-les dans ta liste d'un geste.");
  const { index, ready } = useLibrary();
  const [deck, setDeck] = useState([]);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(null);
  const [counts, setCounts] = useState({ to_watch: 0, watched: 0, skip: 0 });
  const [loading, setLoading] = useState(true);

  // On attend la liste de l'utilisateur : la pile ne doit proposer que des titres qu'il n'a pas encore classés.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([api.discover("movie", "fr", { sort: "popularity", page }), api.discover("tv", "fr", { sort: "popularity", page })])
      .then(([movies, shows]) => {
        if (cancelled) return;
        const fresh = [
          ...(movies.results || []).map((m) => ({ ...m, media_type: "movie" })),
          ...(shows.results || []).map((m) => ({ ...m, media_type: "tv" })),
        ]
          .filter((m) => m.poster_path && !index.has(libraryKey(m.media_type, m.id)))
          .sort(() => Math.random() - 0.5);
        setDeck((d) => [...d, ...fresh]);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ready]);

  // Filtre aussi à l'affichage : un titre classé ailleurs (aperçu, fiche) quitte la pile.
  const pile = deck.filter((m) => !index.has(libraryKey(m.media_type, m.id)));
  const top = pile[0];

  const decide = useCallback(
    async (dir) => {
      if (!top) return;
      setDirection(dir);
      setCounts((c) => ({ ...c, [dir]: c[dir] + 1 }));
      setDeck((d) => d.filter((m) => m !== top));
      if (pile.length < 6) setPage((p) => p + 1);
      if (dir === "skip") {
        play("whoosh");
        vibrate(8);
        return;
      }
      try {
        await setLibraryStatus({ item: top, mediaType: top.media_type, existing: index.get(libraryKey(top.media_type, top.id)) }, dir);
      } catch {
        // l'échec n'interrompt pas le tri
      }
    },
    [top, index, pile.length]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") decide("to_watch");
      else if (e.key === "ArrowLeft") decide("skip");
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        decide("watched");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16 flex flex-col items-center">
      <KineticTitle text="Trier en swipant" className="page-title mb-2 text-center" />
      <p className="text-white/65 text-center mb-8 max-w-[46ch]">
        À droite : à voir. À gauche : passer. Vers le haut : déjà vu. Les flèches du clavier marchent aussi.
      </p>

      <div className="relative w-[min(86vw,340px)] aspect-[2/3]">
        {pile[2] && <img src={tmdbImage(pile[2].poster_path, "poster")} alt="" className="absolute inset-0 h-full w-full object-cover rounded-3xl opacity-40 scale-[0.9] translate-y-6" />}
        {pile[1] && <img src={tmdbImage(pile[1].poster_path, "poster")} alt="" className="absolute inset-0 h-full w-full object-cover rounded-3xl opacity-70 scale-[0.95] translate-y-3 transition-transform duration-300" />}
        <AnimatePresence custom={direction}>
          {top && <TopCard key={`${top.media_type}-${top.id}`} item={top} onDecide={decide} />}
        </AnimatePresence>
        {!top && (
          <div className="absolute inset-0 grid place-items-center rounded-3xl skeleton">
            {!loading && <p className="relative text-white/60 text-sm">Plus rien à trier pour l'instant.</p>}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <motion.button onClick={() => decide("skip")} disabled={!top} className="btn-icon !w-14 !h-14" aria-label="Passer">
          <Icon name="x" className="h-6 w-6" weight="bold" />
        </motion.button>
        <motion.button onClick={() => decide("watched")} disabled={!top} className="btn-icon !w-12 !h-12" aria-label="Déjà vu">
          <Icon name="eye" className="h-5 w-5" weight="bold" />
        </motion.button>
        <motion.button onClick={() => decide("to_watch")} disabled={!top} className="btn-primary !w-14 !h-14 !p-0" aria-label="À voir">
          <Icon name="plus" className="h-6 w-6" weight="bold" />
        </motion.button>
      </div>

      <p className="mt-6 text-sm text-white/60 tabular-nums" aria-live="polite">
        {counts.to_watch} à voir · {counts.watched} déjà vus · {counts.skip} passés
      </p>
      <Link to="/watchlist" className="link mt-3 text-sm">Voir ma liste</Link>
    </div>
  );
}
