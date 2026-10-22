import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import { tmdbImage } from "../lib/tmdb";
import { api } from "../lib/api";
import { setLibraryStatus } from "../lib/library";
import useLibrary from "../hooks/useLibrary";
import useSeo from "../hooks/useSeo";
import Icon from "../components/Icon";
import CollectorTicketModal from "../components/CollectorTicketModal";
import SegmentedControl from "../components/SegmentedControl";
import SupportCard from "../components/SupportCard";
import { SPRING, riseItem, stagger } from "../lib/motionTokens";

const ORDER_KEY = "cv_queue_order";
const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function readOrder() {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
  } catch {
    return [];
  }
}

function writeOrder(ids) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
  } catch {
    // ordre gardé pour la visite seulement
  }
}

/** Une place dans la file d'attente : numéro de séance, affiche, poignée de déplacement. */
function QueueRow({ item, position, onWatched, onRemove }) {
  const controls = useDragControls();
  const href = `/title/${item.media_type}/${item.media_id}`;
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="group relative flex items-center gap-4 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]"
      whileDrag={{ scale: 1.03, boxShadow: "0 24px 48px -16px rgba(0,0,0,0.8)", zIndex: 5 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="btn-icon !bg-transparent !ring-0 cursor-grab active:cursor-grabbing touch-none"
        aria-label={`Déplacer ${item.title} dans la file`}
      >
        <Icon name="list" />
      </button>
      <span className="w-8 shrink-0 text-center font-display text-2xl font-semibold tabular-nums text-white/40">{position}</span>
      <Link to={href} data-vt-poster={item.poster_path || undefined} className="shrink-0">
        {item.poster_path ? (
          <img data-poster src={tmdbImage(item.poster_path, "profile")} alt="" className="h-20 w-14 rounded-lg object-cover" />
        ) : (
          <span className="block h-20 w-14 rounded-lg bg-white/10" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={href} className="block truncate font-medium hover:text-cine-soft transition-colors">{item.title}</Link>
        <p className="text-xs text-white/55">{item.media_type === "tv" ? "Série" : "Film"}</p>
      </div>
      <motion.button onClick={() => onWatched(item)} className="btn-ghost !px-4 !py-2 !text-xs">
        <Icon name="eye" weight="bold" /> Vu
      </motion.button>
      <motion.button onClick={() => onRemove(item)} className="btn-icon !w-8 !h-8" aria-label={`Retirer ${item.title}`}>
        <Icon name="x" className="h-3.5 w-3.5" />
      </motion.button>
    </Reorder.Item>
  );
}

/** Ticket du mur : légèrement de travers, il se redresse au survol. */
function TicketCard({ item, i, onSelect }) {
  const tilt = ((item.media_id % 7) - 3) * 1.2;
  const href = `/title/${item.media_type}/${item.media_id}`;
  const date = item.watched_at ? new Date(item.watched_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: tilt * 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -6, scale: 1.04 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 220, damping: 20, delay: (i % 8) * 0.04 }}
      className="cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div
        className="group relative flex overflow-hidden rounded-xl bg-[#f4f1ea] text-cine-ink shadow-[0_18px_36px_-18px_rgba(0,0,0,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft"
      >
        {item.poster_path ? (
          <img data-poster src={tmdbImage(item.poster_path, "poster")} alt={`Affiche de ${item.title}`} className="h-36 w-24 object-cover" />
        ) : (
          <span className="h-36 w-24 bg-cine-ink/20" />
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between border-l-2 border-dashed border-cine-ink/20 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cine-ink/55">Entrée</p>
          <p className="font-display text-sm font-semibold leading-tight line-clamp-3">{item.title}</p>
          <div className="flex items-center justify-between">
            {date && <p className="font-mono text-[10px] text-cine-ink/55">{date}</p>}
            <span className="text-[10px] text-cine-violet font-semibold">🎟️ Billet</span>
          </div>
        </div>
        <span className="absolute right-2 top-2 -rotate-12 rounded-md border-2 border-cine-violet px-1.5 text-xs font-bold text-cine-violet mix-blend-multiply">VU</span>
      </div>
    </motion.div>
  );
}

/** Ligne du Journal de visionnage (style Letterboxd Diary) */
function DiaryRow({ item, onSelectTicket }) {
  const dateStr = item.watched_at
    ? new Date(item.watched_at).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date non renseignée";

  const href = `/title/${item.media_type}/${item.media_id}`;
  const tagLabel = item.viewing_tag === "cinema" ? "🍿 Cinéma" : item.viewing_tag === "rewatch" ? "🔄 Re-visionnage" : "📺 Streaming";

  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
      <div className="flex items-center gap-3.5 min-w-0">
        <Link to={href} className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-white/10">
          {item.poster_path ? (
            <img src={tmdbImage(item.poster_path, "thumb")} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs">🎬</div>
          )}
        </Link>
        <div className="min-w-0">
          <Link to={href} className="font-medium text-white hover:text-cine-soft transition-colors truncate block">
            {item.title}
          </Link>
          <p className="text-xs text-white/50 capitalize mt-0.5">{dateStr}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="chip !text-[10px] !py-0.5 !px-2 !bg-white/[0.06] !text-white/70">
              {tagLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onSelectTicket(item)}
          className="btn-light !py-1.5 !px-3 !text-xs !bg-amber-400/10 !border-amber-400/25 !text-amber-200"
          title="Afficher et télécharger le billet collector"
        >
          🎟️ Billet
        </button>
      </div>
    </div>
  );
}

/** Carte d'une série avec son épisode suivant (Up Next - style Trakt) */
function UpNextCard({ item, onEpisodeWatched }) {
  const [progress, setProgress] = useState(() => api.getEpisodesProgress(item.media_id));
  const href = `/title/tv/${item.media_id}`;

  const lastWatched = progress.last_watched;
  const nextSeason = lastWatched ? lastWatched.season : 1;
  const nextEpNum = lastWatched ? lastWatched.episode + 1 : 1;
  const watchedCount = Object.keys(progress.episodes || {}).length;

  const handleNextClick = () => {
    api.toggleEpisodeWatched(item.media_id, nextSeason, nextEpNum, {
      title: `Épisode ${nextEpNum}`,
    });
    setProgress(api.getEpisodesProgress(item.media_id));
    if (onEpisodeWatched) onEpisodeWatched();
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-cine-violet/40 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <Link to={href} className="w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden shrink-0 bg-white/10 shadow-md">
          {item.poster_path ? (
            <img src={tmdbImage(item.poster_path, "poster")} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-xl">📺</div>
          )}
        </Link>
        <div className="min-w-0">
          <Link to={href} className="font-display font-semibold text-base sm:text-lg text-white hover:text-cine-soft transition-colors truncate block">
            {item.title}
          </Link>
          <p className="text-xs text-white/50 mt-0.5">
            {watchedCount > 0 ? `${watchedCount} épisode${watchedCount > 1 ? "s" : ""} vu${watchedCount > 1 ? "s" : ""}` : "Pas encore commencé"}
          </p>

          {/* Bandeau Prochain épisode */}
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cine-violet/15 border border-cine-violet/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-cine-soft" />
            <span className="font-semibold text-cine-soft">À voir ensuite :</span>
            <span className="text-white/90">Saison {nextSeason}, Ép. {nextEpNum}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={handleNextClick}
          className="btn-primary !py-2 !px-4 !text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cine-violet/25"
        >
          <Icon name="check" weight="bold" className="w-3.5 h-3.5" />
          <span>Marquer S{nextSeason}E{nextEpNum} vu</span>
        </button>
        <Link to={href} className="btn-ghost !py-2 !px-3 !text-xs">
          Détails
        </Link>
      </div>
    </div>
  );
}

export default function Watchlist() {
  useSeo("Ma liste", "Ta file d'attente de films et séries, suivi d'épisodes et ton journal de visionnage.");
  const { list, ready: loaded } = useLibrary();
  const [tab, setTab] = useState("queue");
  const [wallMode, setWallMode] = useState("wall"); // "wall" ou "diary"
  const [queue, setQueue] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const toWatch = useMemo(() => list.filter((i) => i.status !== "watched"), [list]);
  const watched = useMemo(() => list.filter((i) => i.status === "watched"), [list]);
  const seriesList = useMemo(() => list.filter((i) => i.media_type === "tv"), [list]);

  // File d'attente : l'ordre choisi par glisser-déposer est gardé sur cet appareil.
  useEffect(() => {
    const order = readOrder();
    const sorted = [...toWatch].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? -1 : ia) - (ib === -1 ? -1 : ib);
    });
    setQueue(sorted);
  }, [toWatch]);

  const months = useMemo(() => {
    const groups = new Map();
    [...watched]
      .sort((a, b) => new Date(b.watched_at || b.added_at) - new Date(a.watched_at || a.added_at))
      .forEach((w) => {
        const key = MONTH.format(new Date(w.watched_at || w.added_at));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(w);
      });
    return [...groups.entries()];
  }, [watched]);

  function reorder(next) {
    setQueue(next);
    writeOrder(next.map((i) => i.id));
  }

  const asItem = (w) => ({ id: w.media_id, title: w.title, poster_path: w.poster_path });
  const markWatched = (w) => setLibraryStatus({ item: asItem(w), mediaType: w.media_type, existing: w }, "watched");
  const remove = (w) => setLibraryStatus({ item: asItem(w), mediaType: w.media_type, existing: w }, null);

  const tabs = [
    { value: "queue", label: "File d'attente", count: toWatch.length },
    { value: "upnext", label: "Séries (Up Next)", count: seriesList.length },
    { value: "wall", label: "Vus & Journal", count: watched.length },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16">
      <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <motion.h1 variants={riseItem} className="page-title">
          Ma liste
        </motion.h1>
        <motion.div variants={riseItem} className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("cv:open-import"))}
            className="btn-ghost !px-3.5 !py-2 !text-xs flex items-center gap-1.5 !bg-white/[0.06] hover:!bg-white/[0.12] border border-white/10"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-cine-soft" />
            <span>Importer CSV (Letterboxd / IMDb)</span>
          </button>
          <Link to="/swipe?duo=1" className="btn-ghost !px-3.5 !py-2 !text-xs flex items-center gap-1.5 !bg-pink-500/15 text-pink-300 hover:!bg-pink-500/25 border border-pink-500/30">
            <Icon name="heart" className="w-3.5 h-3.5" weight="fill" />
            <span>Soirée Duo</span>
          </Link>
          <Link to="/swipe" className="link">Trier en swipant</Link>
          <Link to="/recap" className="link">Mon année ciné</Link>
        </motion.div>
      </motion.div>

      {/* Onglets principaux tactiles (Originkit) */}
      <div className="mb-10 overflow-x-auto max-w-full pb-2">
        <SegmentedControl
          options={tabs}
          value={tab}
          onChange={setTab}
          size="md"
          layoutId="watchlist-tab-pill"
        />
      </div>

      {!loaded && (
        <div className="space-y-3 max-w-3xl" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] rounded-2xl skeleton" />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* 1. File d'attente à voir */}
        {loaded && tab === "queue" && (
          <motion.div key="queue" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-3xl">
            {queue.length === 0 ? (
              <div className="py-10">
                <Icon name="popcorn" className="w-12 h-12 text-cine-soft mb-6" weight="light" />
                <h2 className="font-display font-semibold text-2xl tracking-tight mb-2">Ta file d'attente est vide</h2>
                <p className="text-white/60 mb-8 max-w-[46ch]">Ajoute des titres avec le « + » d'une affiche, ou laisse la roulette choisir pour toi.</p>
                <Link to="/ce-soir" className="btn-primary">Lancer la roulette</Link>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-white/55">Glisse la poignée pour décider de l'ordre des prochaines séances.</p>
                <Reorder.Group axis="y" values={queue} onReorder={reorder} className="space-y-3">
                  <AnimatePresence initial={false}>
                    {queue.map((item, i) => (
                      <QueueRow key={item.id} item={item} position={i + 1} onWatched={markWatched} onRemove={remove} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </>
            )}
          </motion.div>
        )}

        {/* 2. Suivi des séries (Up Next) */}
        {loaded && tab === "upnext" && (
          <motion.div key="upnext" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="max-w-3xl space-y-4">
            <div className="mb-6">
              <h2 className="font-display font-semibold text-xl text-white">À regarder ensuite</h2>
              <p className="text-sm text-white/60">Toutes vos séries en cours avec leur prochain épisode calculé automatiquement.</p>
            </div>

            {seriesList.length === 0 ? (
              <div className="py-10 text-center rounded-3xl bg-white/[0.02] border border-white/[0.05] p-8">
                <span className="text-3xl block mb-3">📺</span>
                <p className="text-white/80 font-medium">Aucune série dans votre liste pour l'instant.</p>
                <p className="text-sm text-white/50 mt-1 mb-6">Ajoutez des séries pour suivre vos épisodes sans jamais vous perdre.</p>
                <Link to="/discover" className="btn-ghost">Explorer les séries</Link>
              </div>
            ) : (
              seriesList.map((item) => (
                <UpNextCard key={item.id} item={item} />
              ))
            )}
          </motion.div>
        )}

        {/* 3. Vus & Journal (Mur des tickets + Diary) */}
        {loaded && tab === "wall" && (
          <motion.div key="wall" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {/* Basculeur de mode : Mur de tickets vs Journal chronologique (SegmentedControl) */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <SegmentedControl
                options={[
                  { value: "wall", label: "Mur des tickets", icon: "🎟️" },
                  { value: "diary", label: "Journal (Diary)", icon: "📖" },
                ]}
                value={wallMode}
                onChange={setWallMode}
                size="sm"
                layoutId="wall-mode-pill"
              />
            </div>

            {months.length === 0 ? (
              <p className="text-white/60 py-10">Aucun titre vu pour l'instant. Marque un film ou une série comme « vu » pour commencer ton mur.</p>
            ) : wallMode === "wall" ? (
              months.map(([month, items]) => (
                <section key={month} className="mb-12">
                  <h2 className="mb-5 font-display text-xl font-semibold tracking-tight capitalize">
                    {month} <span className="ml-2 text-sm font-normal text-white/55 tabular-nums">{items.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {items.map((item, i) => (
                      <TicketCard key={item.id} item={item} i={i} onSelect={setSelectedTicket} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="max-w-3xl space-y-3">
                {watched.map((item) => (
                  <DiaryRow key={item.id} item={item} onSelectTicket={setSelectedTicket} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SupportCard />

      {/* Modal Billet Collector si sélectionné */}
      <AnimatePresence>
        {selectedTicket && (
          <CollectorTicketModal
            item={selectedTicket}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
