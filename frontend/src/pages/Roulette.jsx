import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { api } from "../lib/api";
import { mediaTitle, mediaYear, tmdbImage } from "../lib/tmdb";
import { libraryKey, setLibraryStatus } from "../lib/library";
import { play, vibrate } from "../lib/feedback";
import useLibrary from "../hooks/useLibrary";
import useSeo from "../hooks/useSeo";
import Icon from "../components/Icon";
import { KineticTitle } from "../components/motion";
import { EASE_OUT, SPRING } from "../lib/motionTokens";

const GENRES = [
  { label: "Tout", id: null },
  { label: "Action", id: 28 },
  { label: "Comédie", id: 35 },
  { label: "Drame", id: 18 },
  { label: "Horreur", id: 27 },
  { label: "Science-fiction", id: 878 },
  { label: "Animation", id: 16 },
  { label: "Thriller", id: 53 },
  { label: "Romance", id: 10749 },
];

const CARD = 168; // largeur d'une affiche + écart
const LOOPS = 6;

export default function Roulette() {
  useSeo("Ce soir, je regarde quoi ?", "Fais tourner la bobine : CineViseur choisit un film ou une série pour ta soirée.");
  const { index, token, user } = useLibrary();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [genre, setGenre] = useState(null);
  const [kind, setKind] = useState("movie");
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [added, setAdded] = useState(false);
  const x = useMotionValue(0);
  const lastSlot = useRef(0);
  const viewport = useRef(null);

  useEffect(() => {
    setLoading(true);
    setWinner(null);
    x.set(0);
    Promise.all([1, 2, 3].map((page) => api.discover(kind, "fr", { genre, sort: "popularity", minRating: 6.5, page })))
      .then((pages) => {
        const items = pages.flatMap((p) => p.results || []).filter((m) => m.poster_path);
        const unseen = items.filter((m) => index.get(libraryKey(kind, m.id))?.status !== "watched");
        // Mélange : la bobine ne commence jamais par les mêmes affiches.
        setPool([...unseen].sort(() => Math.random() - 0.5).slice(0, 40));
      })
      .catch(() => setPool([]))
      .finally(() => setLoading(false));
    // index exclu volontairement : on ne recharge pas la bobine à chaque ajout à la liste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, kind]);

  const strip = useMemo(() => Array.from({ length: LOOPS }, () => pool).flat(), [pool]);

  // Cliquet à chaque affiche qui passe sous le faisceau.
  useMotionValueEvent(x, "change", (v) => {
    const slot = Math.floor(-v / CARD);
    if (slot !== lastSlot.current) {
      lastSlot.current = slot;
      if (spinning) {
        play("tick");
        vibrate(4);
      }
    }
  });

  async function spin() {
    if (!pool.length || spinning) return;
    setWinner(null);
    setAdded(false);
    setSpinning(true);
    play("projector");
    const pick = Math.floor(Math.random() * pool.length);
    // Point d'arrêt visé ; le gagnant final est lu à l'écran une fois la bobine arrêtée.
    const targetIndex = pool.length * (LOOPS - 2) + pick;
    // Affiche i : bord gauche à 8 + i × 168 px, largeur 160 px. On aligne son centre sur celui de l'écran.
    const center = (viewport.current?.clientWidth || 800) / 2 - 80 - 8;
    x.set(0);
    await animate(x, -(targetIndex * CARD) + center, reduce ? { duration: 0.01 } : { duration: 4.6, ease: [0.08, 0.6, 0.1, 1] });
    // Le gagnant est l'affiche réellement sous le faisceau (robuste si la fenêtre a changé de taille),
    // recentrée d'un petit ressort.
    const beam = viewport.current.querySelector("[data-beam]").getBoundingClientRect();
    const beamCenter = beam.left + beam.width / 2;
    const imgs = [...viewport.current.querySelectorAll("[data-reel-item]")];
    let best = 0;
    let bestDelta = Infinity;
    imgs.forEach((img, i) => {
      const r = img.getBoundingClientRect();
      const delta = beamCenter - (r.left + r.width / 2);
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        bestDelta = delta;
        best = i;
      }
    });
    await animate(x, x.get() + bestDelta, { type: "spring", stiffness: 300, damping: 30 });
    setSpinning(false);
    setWinner(strip[best]);
    play("stamp");
    vibrate([20, 40, 30]);
  }

  async function addWinner() {
    if (!user) return navigate("/login");
    await setLibraryStatus(token, { item: winner, mediaType: kind, existing: index.get(libraryKey(kind, winner.id)) }, "to_watch");
    setAdded(true);
  }

  return (
    <div className="pb-16 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12">
        <KineticTitle text="Ce soir, je regarde quoi ?" className="font-display font-semibold text-4xl md:text-6xl tracking-tighter leading-[1.05] mb-3" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white/65 max-w-[52ch] mb-8">
          Choisis une envie, lance la bobine. On écarte les titres que tu as déjà vus.
        </motion.p>

        <div className="flex flex-wrap items-center gap-2 mb-3" role="group" aria-label="Type">
          {[
            { id: "movie", label: "Un film" },
            { id: "tv", label: "Une série" },
          ].map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              aria-pressed={kind === k.id}
              className={`relative btn px-4 py-2 ${kind === k.id ? "text-cine-ink" : "text-white/70 hover:text-white"}`}
            >
              {kind === k.id && <motion.span layoutId="roulette-kind" transition={SPRING} className="absolute inset-0 rounded-full bg-[#f4f4f6]" />}
              <span className="relative">{k.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap" role="group" aria-label="Genre">
          {GENRES.map((g) => (
            <button
              key={g.label}
              onClick={() => setGenre(g.id)}
              aria-pressed={genre === g.id}
              className={`btn shrink-0 px-4 py-2 ring-1 ring-inset ${genre === g.id ? "bg-cine-violet text-white ring-white/15" : "bg-white/[0.06] text-white/75 ring-white/10 hover:bg-white/[0.12]"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* La bobine */}
      <div ref={viewport} className="relative mt-10 py-8">
        <div className="reel-perforations" aria-hidden="true" />
        <div data-beam className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[176px] -translate-x-1/2 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(171,152,242,0.35),transparent_70%)] ring-2 ring-cine-soft/70" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/4 bg-gradient-to-r from-cine-ink to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/4 bg-gradient-to-l from-cine-ink to-transparent" aria-hidden="true" />
        {loading ? (
          <div className="flex gap-2 justify-center" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 aspect-[2/3] rounded-xl skeleton" />
            ))}
          </div>
        ) : pool.length === 0 ? (
          <p className="text-center text-white/60 py-24">Rien à proposer avec ces filtres. Essaie un autre genre.</p>
        ) : (
          <motion.div className="flex gap-2 pl-2 will-change-transform" style={{ x }} aria-hidden="true">
            {strip.map((m, i) => (
              <img
                key={`${m.id}-${i}`}
                data-reel-item
                src={tmdbImage(m.poster_path, "poster")}
                alt=""
                loading={i < 14 ? "eager" : "lazy"}
                draggable={false}
                className={`w-40 shrink-0 aspect-[2/3] object-cover rounded-xl transition-[filter] duration-300 ${spinning ? "blur-[1.5px]" : ""}`}
              />
            ))}
          </motion.div>
        )}
        <div className="reel-perforations reel-perforations--bottom" aria-hidden="true" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-8 flex flex-col items-center text-center">
        <motion.button
          
          onClick={spin}
          disabled={spinning || loading || !pool.length}
          className="btn-primary !px-10 !py-4 text-base"
        >
          <motion.span animate={spinning ? { rotate: 360 } : { rotate: 0 }} transition={spinning ? { duration: 0.8, repeat: Infinity, ease: "linear" } : SPRING} className="inline-flex">
            <Icon name="aperture" className="h-5 w-5" weight="bold" />
          </motion.span>
          {winner ? "Relancer" : "Lancer la bobine"}
        </motion.button>

        <AnimatePresence mode="wait">
          {winner && (
            <motion.div
              key={winner.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="mt-10 max-w-xl"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm text-cine-soft mb-2">Ce soir, ce sera</p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{mediaTitle(winner)}</h2>
              <p className="mt-1 text-sm text-white/60 tabular-nums">
                {mediaYear(winner)} {winner.vote_average ? `· ${winner.vote_average.toFixed(1)}/10` : ""}
              </p>
              <p className="mt-4 text-white/70 leading-relaxed line-clamp-4">{winner.overview || "Pas de synopsis disponible."}</p>
              <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
                <button onClick={addWinner} disabled={added} className="btn-ghost">
                  <Icon name={added ? "check" : "plus"} weight="bold" /> {added ? "Dans ma liste" : "Ajouter à ma liste"}
                </button>
                <Link to={`/title/${kind}/${winner.id}`} className="link text-sm font-medium">
                  Voir la fiche
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
