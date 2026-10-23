import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { api } from "../lib/api";
import { mediaTitle, mediaYear, tmdbImage } from "../lib/tmdb";
import { libraryKey, setLibraryStatus } from "../lib/library";
import { play, vibrate } from "../lib/feedback";
import useLibrary from "../hooks/useLibrary";
import useSeo from "../hooks/useSeo";
import Icon from "../components/Icon";
import SegmentedControl from "../components/SegmentedControl";
import SpotlightCard from "../components/SpotlightCard";
import { KineticTitle, Magnetic } from "../components/motion";
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

const PROVIDERS = [
  { label: "Toutes plateformes", id: null },
  { label: "Netflix", id: 8 },
  { label: "Prime Video", id: 119 },
  { label: "Disney+", id: 337 },
  { label: "Crunchyroll", id: 283 },
  { label: "ADN", id: 415 },
  { label: "Canal+", id: 381 },
  { label: "Max", id: 1899 },
];

const CARD = 168; // largeur d'une affiche + écart
const LOOPS = 6;

export default function Roulette() {
  useSeo("Ce soir, je regarde quoi ?", "Fais tourner la bobine ou trouve un film en commun avec le mode Soirée Duo.");
  const { index, list } = useLibrary();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState("solo"); // "solo" ou "duo"
  const [genre, setGenre] = useState(null);
  const [provider, setProvider] = useState(null);
  const [kind, setKind] = useState("movie");
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [added, setAdded] = useState(false);

  // Duo Mode State
  const [partnerCode, setPartnerCode] = useState("");
  const [matchedFilms, setMatchedFilms] = useState([]);
  const [duoCopied, setDuoCopied] = useState(false);

  const x = useMotionValue(0);
  const lastSlot = useRef(0);
  const viewport = useRef(null);

  // Vérifier si un paramètre duo est passé dans l'URL
  useEffect(() => {
    const duoParam = searchParams.get("duo");
    if (duoParam) {
      setMode("duo");
      try {
        const decoded = JSON.parse(atob(duoParam));
        if (Array.isArray(decoded)) {
          // Compare avec ma liste locale
          const myToWatch = list.filter((i) => i.status !== "watched");
          const matches = myToWatch.filter((m) => decoded.includes(Number(m.media_id)));
          setMatchedFilms(matches);
        }
      } catch {
        // ignore
      }
    }
  }, [searchParams, list]);

  useEffect(() => {
    setLoading(true);
    setWinner(null);
    x.set(0);

    const query = {
      genre,
      sort: "popularity",
      minRating: 6.5,
      provider: provider || undefined,
    };

    Promise.all([1, 2, 3].map((page) => api.discover(kind, "fr", { ...query, page })))
      .then((pages) => {
        const items = pages.flatMap((p) => p.results || []).filter((m) => m.poster_path);
        const unseen = items.filter((m) => index.get(libraryKey(kind, m.id))?.status !== "watched");
        setPool([...unseen].sort(() => Math.random() - 0.5).slice(0, 40));
      })
      .catch(() => setPool([]))
      .finally(() => setLoading(false));
  }, [genre, kind, provider]);

  const strip = useMemo(() => Array.from({ length: LOOPS }, () => pool).flat(), [pool]);

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

    const pickIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[pickIndex];
    const targetOffset = 3 * pool.length * CARD + pickIndex * CARD;
    const vp = viewport.current;
    const centerShift = vp ? vp.offsetWidth / 2 - CARD / 2 : 0;
    const finalX = -(targetOffset - centerShift);

    await animate(x, finalX, {
      duration: 5.5,
      ease: [0.12, 0.8, 0.2, 1],
    });

    setSpinning(false);
    setWinner(chosen);
    play("stamp");
    vibrate(20);
  }

  async function addWinner() {
    if (!winner || added) return;
    await setLibraryStatus({ item: winner, mediaType: kind, existing: null }, "to_watch");
    setAdded(true);
    play("stamp");
  }

  // Générer le lien de partage Duo
  const handleShareDuo = () => {
    const myToWatchIds = list.filter((i) => i.status !== "watched").map((i) => Number(i.media_id));
    const encoded = btoa(JSON.stringify(myToWatchIds));
    const shareUrl = `${window.location.origin}/ce-soir?duo=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    setDuoCopied(true);
    setTimeout(() => setDuoCopied(false), 3000);
  };

  // Comparer manuellement le code du partenaire
  const handleCompareCode = (e) => {
    e.preventDefault();
    try {
      let raw = partnerCode.trim();
      if (raw.includes("duo=")) {
        raw = raw.split("duo=")[1].split("&")[0];
      }
      const decoded = JSON.parse(atob(raw));
      if (Array.isArray(decoded)) {
        const myToWatch = list.filter((i) => i.status !== "watched");
        const matches = myToWatch.filter((m) => decoded.includes(Number(m.media_id)));
        setMatchedFilms(matches);
      }
    } catch {
      alert("Code ou lien invalide");
    }
  };

  return (
    <div className="pt-12 pb-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 text-center">
        <KineticTitle text="Ce soir, on regarde quoi ?" className="page-title mb-3" />
        <p className="text-white/60 max-w-lg mx-auto mb-8">
          La roulette choisit pour toi, ou compare ta liste avec celle d'un ami pour trouver le film parfait pour votre soirée.
        </p>

        {/* Sélecteur de mode : Solo vs Soirée Duo (Originkit SegmentedControl) */}
        <div className="flex justify-center mb-8">
          <SegmentedControl
            options={[
              { value: "solo", label: "La Bobine Solitaire", icon: "🎰" },
              { value: "duo", label: "Soirée Duo (Match à 2)", icon: "👥" },
            ]}
            value={mode}
            onChange={setMode}
            size="md"
            layoutId="roulette-mode-pill"
          />
        </div>
      </div>

      {mode === "duo" ? (
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl mb-8">
            <span className="text-4xl block mb-3">🍿🤝</span>
            <h3 className="font-display font-bold text-xl text-white mb-2">Trouver un film en commun</h3>
            <p className="text-sm text-white/60 mb-6">
              Partagez votre lien avec la personne avec qui vous voulez regarder un film. CineViseur comparera vos listes en direct pour trouver vos envies communes !
            </p>

            <Link
              to="/swipe?duo=1"
              className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 mb-4 !bg-gradient-to-r !from-pink-500 !to-cine-violet shadow-lg shadow-pink-500/25"
            >
              <Icon name="heart" className="w-4 h-4" weight="fill" />
              <span>Lancer un Match Duo en direct (Swipe à 2)</span>
            </Link>

            <button
              type="button"
              onClick={handleShareDuo}
              className="btn-ghost w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mb-4 !bg-white/10 hover:!bg-white/15"
            >
              <Icon name="share" className="w-4 h-4" />
              <span>{duoCopied ? "Lien copié dans le presse-papier !" : "Partager ma liste à un ami"}</span>
            </button>

            <div className="relative my-6 text-center">
              <span className="bg-cine-ink px-3 text-xs text-white/40 uppercase tracking-widest relative z-10">ou coller son lien</span>
              <div className="absolute inset-x-0 top-1/2 border-t border-white/[0.08]" />
            </div>

            <form onSubmit={handleCompareCode} className="flex gap-2">
              <input
                type="text"
                placeholder="Coller le lien de votre ami ici..."
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                className="input flex-1 !text-xs !py-2.5"
              />
              <button type="submit" className="btn-light !px-4 !py-2.5 !text-xs font-semibold shrink-0">
                Comparer
              </button>
            </form>
          </div>

          {matchedFilms.length > 0 ? (
            <div className="text-left">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎉</span>
                <h4 className="font-display font-bold text-lg text-cine-soft">
                  Match ! Vous voulez tous les deux voir {matchedFilms.length} film{matchedFilms.length > 1 ? "s" : ""} :
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {matchedFilms.map((m) => (
                  <Link
                    key={m.id}
                    to={`/title/${m.media_type}/${m.media_id}`}
                    className="group rounded-2xl bg-white/[0.03] border border-white/[0.08] p-2 hover:border-cine-violet/50 transition-colors"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/10 mb-2">
                      {m.poster_path ? (
                        <img src={tmdbImage(m.poster_path, "thumb")} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs">🎬</div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white group-hover:text-cine-soft truncate">{m.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : partnerCode ? (
            <p className="text-sm text-white/50">Aucun film en commun trouvé pour l'instant. Ajoutez plus de films à vos listes !</p>
          ) : null}
        </div>
      ) : (
        <>
          {/* Filtres de la Bobine Solo */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
            {/* Films vs Séries (SegmentedControl) */}
            <div className="flex justify-center mb-4">
              <SegmentedControl
                options={[
                  { value: "movie", label: "Films" },
                  { value: "tv", label: "Séries" },
                ]}
                value={kind}
                onChange={setKind}
                size="sm"
                layoutId="roulette-kind-pill"
              />
            </div>

            {/* Fournisseurs Streaming (JustWatch / TMDB) */}
            <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
              {PROVIDERS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setProvider(p.id)}
                  className={`chip shrink-0 !text-xs !py-1 !px-3 ${provider === p.id ? "!bg-cine-violet !text-white !ring-cine-violet" : "!bg-white/[0.03] !text-white/60 hover:!text-white"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Genres */}
            <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {GENRES.map((g) => (
                <button
                  key={g.label}
                  onClick={() => setGenre(g.id)}
                  className={`chip shrink-0 !text-xs !py-1 !px-3 ${genre === g.id ? "!bg-white !text-cine-ink !ring-white" : "!bg-white/[0.03] !text-white/60 hover:!text-white"}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* La bobine animée */}
          <div ref={viewport} className="relative mt-8 py-8">
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
              <p className="text-center text-white/60 py-24">Rien à proposer avec ces filtres. Essaie une autre plateforme ou un autre genre.</p>
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
            <Magnetic>
              <motion.button
                onClick={spin}
                disabled={spinning || loading || !pool.length}
                className="btn-primary !px-10 !py-4 text-base"
              >
                <motion.span animate={spinning ? { rotate: 360 } : { rotate: 0 }} transition={spinning ? { duration: 0.8, repeat: Infinity, ease: "linear" } : SPRING} className="inline-flex">
                  <Icon name="aperture" className="h-5 w-5" weight="bold" />
                </motion.span>
                {winner ? "Relancer la bobine" : "Lancer la bobine"}
              </motion.button>
            </Magnetic>

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
        </>
      )}
    </div>
  );
}
