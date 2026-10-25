import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { tmdbImage } from "../lib/tmdb";
import Icon from "./Icon";
import { EASE_OUT } from "../lib/motionTokens";

/**
 * Placard de trophées : chaque titre marqué « vu » reçoit son billet collector,
 * exposé sur une planche comme dans une vitrine. Les paliers se débloquent avec la collection.
 */
const TIERS = [
  { count: 1, label: "Premier billet" },
  { count: 10, label: "Habitué du hall" },
  { count: 25, label: "Cinéphile" },
  { count: 50, label: "Projectionniste" },
  { count: 100, label: "Légende du placard" },
];

const PER_SHELF = 7; // billets tenant sur une planche

const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

function watchDate(item) {
  return new Date(item.watched_at || item.added_at || Date.now());
}

/** Un billet posé sur la planche : légèrement de travers, il se redresse et se soulève au survol. */
function ShelfTicket({ item, ordinal, onSelect }) {
  const tilt = ((item.media_id % 5) - 2) * 1.6;
  const isSeries = item.media_type === "tv";

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(item)}
      initial={{ opacity: 0, y: 24, rotate: tilt * 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={{ rotate: 0, y: -8 }}
      whileTap={{ scale: 0.97 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="group relative w-[78px] shrink-0 text-left outline-none sm:w-[96px] focus-visible:ring-2 focus-visible:ring-cine-soft rounded-lg"
      aria-label={`Billet collector de ${item.title}${isSeries ? " (série)" : ""} — ouvrir`}
    >
      <div className="relative overflow-hidden rounded-lg bg-[#f4f1ea] text-cine-ink shadow-[0_12px_20px_-10px_rgba(0,0,0,0.85)] ring-1 ring-black/20 transition-shadow duration-300 group-hover:shadow-[0_20px_32px_-12px_rgba(0,0,0,0.9)]">
        {item.poster_path ? (
          <img
            src={tmdbImage(item.poster_path, "thumb")}
            alt=""
            loading="lazy"
            className="h-[104px] w-full object-cover sm:h-[126px]"
          />
        ) : (
          <span className="grid h-[104px] w-full place-items-center bg-cine-ink/15 text-lg sm:h-[126px]">🎬</span>
        )}

        {/* Talon déchirable */}
        <div className="border-t-2 border-dashed border-cine-ink/25 px-1.5 py-1.5">
          <p className="line-clamp-2 text-[9px] font-semibold leading-tight sm:text-[10px]">{item.title}</p>
          <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-cine-ink/55 tabular-nums sm:text-[8px]">
            {SHORT_DATE.format(watchDate(item))} · N°{String(ordinal).padStart(3, "0")}
          </p>
        </div>

        {isSeries && (
          <span className="absolute right-1 top-1 rounded bg-cine-ink/80 px-1 font-mono text-[7px] uppercase tracking-wider text-white/90">
            Série
          </span>
        )}
      </div>

      {/* Ombre portée sur la planche */}
      <span className="pointer-events-none absolute inset-x-1 bottom-0 h-2 rounded-[50%] bg-black/50 blur-[3px]" />
    </motion.button>
  );
}

/** Un palier de collection : doré une fois atteint, en pointillés tant qu'il manque des billets. */
function TierPlaque({ tier, total }) {
  const unlocked = total >= tier.count;
  return (
    <div
      className={`flex min-w-[142px] items-center gap-2.5 rounded-xl px-3 py-2.5 ${
        unlocked
          ? "bg-[linear-gradient(120deg,rgba(250,204,21,0.16),rgba(255,255,255,0.03))]"
          : "bg-white/[0.02]"
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          unlocked ? "bg-amber-300/15 text-amber-200" : "bg-white/[0.04] text-white/25"
        }`}
      >
        <Icon name="trophy" weight={unlocked ? "fill" : "regular"} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className={`truncate text-[11px] font-semibold ${unlocked ? "text-amber-100" : "text-white/45"}`}>
          {tier.label}
        </p>
        <p className="font-mono text-[10px] text-white/40 tabular-nums">
          {unlocked ? "Obtenu" : `${total} / ${tier.count}`}
        </p>
      </div>
    </div>
  );
}

export default function TrophyCabinet({ items = [], onSelect }) {
  const stats = useMemo(() => {
    const movies = items.filter((i) => i.media_type !== "tv").length;
    const shows = items.length - movies;
    const cinema = items.filter((i) => i.viewing_tag === "cinema").length;
    const rewatches = items.filter((i) => i.viewing_tag === "rewatch").length;
    const years = new Set(items.map((i) => String(watchDate(i).getFullYear()))).size;
    return { movies, shows, cinema, rewatches, years };
  }, [items]);

  // Numéro de billet : ordre chronologique, du plus ancien au plus récent.
  const ordinals = useMemo(() => {
    const map = new Map();
    [...items]
      .sort((a, b) => watchDate(a) - watchDate(b))
      .forEach((item, i) => map.set(item.id, i + 1));
    return map;
  }, [items]);

  // Une planche par année, découpée en plusieurs planches si l'année est chargée.
  const shelves = useMemo(() => {
    const byYear = new Map();
    [...items]
      .sort((a, b) => watchDate(b) - watchDate(a))
      .forEach((item) => {
        const year = String(watchDate(item).getFullYear());
        if (!byYear.has(year)) byYear.set(year, []);
        byYear.get(year).push(item);
      });

    const boards = [];
    [...byYear.entries()].forEach(([year, list]) => {
      for (let i = 0; i < list.length; i += PER_SHELF) {
        const slice = list.slice(i, i + PER_SHELF);
        boards.push({
          key: `${year}-${i}`,
          year,
          label: i === 0 ? year : null,
          count: i === 0 ? list.length : 0,
          items: slice,
          isLastOfYear: i + PER_SHELF >= list.length,
        });
      }
    });
    return boards;
  }, [items]);

  const nextTier = TIERS.find((t) => t.count > items.length);
  const nextProgress = nextTier ? Math.min(100, (items.length / nextTier.count) * 100) : 100;

  const counters = [
    { label: "Billets", value: items.length },
    { label: "Films", value: stats.movies },
    { label: "Séries", value: stats.shows },
    { label: "Au cinéma", value: stats.cinema },
    { label: "Re-visionnages", value: stats.rewatches },
    { label: "Années", value: stats.years },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      aria-label="Placard de trophées"
    >
      {/* En-tête : la vitrine elle-même */}
      <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(130%_120%_at_50%_0%,rgba(124,92,224,0.22),rgba(255,255,255,0.02)_62%)] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200/80">
              <Icon name="trophy" weight="fill" className="h-3.5 w-3.5" />
              Collection
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Le placard aux trophées
            </h2>
            <p className="mt-1.5 max-w-[52ch] text-sm text-white/55">
              Chaque titre marqué « vu » laisse son billet collector. Ils sont rangés ici par année,
              avec les paliers déjà décrochés.
            </p>
          </div>

          <div className="flex items-baseline gap-2 rounded-2xl bg-black/25 px-4 py-2.5">
            <span className="font-display text-3xl font-semibold tabular-nums text-white">{items.length}</span>
            <span className="text-xs text-white/50">billet{items.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Compteurs */}
        <dl className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {counters.map((c) => (
            <div key={c.label} className="rounded-xl bg-white/[0.04] px-2.5 py-2 ">
              <dt className="truncate text-[10px] uppercase tracking-wider text-white/40">{c.label}</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">{c.value}</dd>
            </div>
          ))}
        </dl>

        {/* Paliers */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Paliers</p>
            {nextTier && (
              <p className="text-[11px] text-white/45">
                Prochain : <span className="text-white/75">{nextTier.label}</span> à {nextTier.count}
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TIERS.map((tier) => (
              <TierPlaque key={tier.count} tier={tier} total={items.length} />
            ))}
          </div>
          {nextTier && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nextProgress}%` }}
                transition={{ duration: 0.9, ease: EASE_OUT }}
                className="h-full rounded-full bg-[linear-gradient(90deg,#7c66dc,#facc15)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Les planches */}
      {items.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white/[0.02] p-8 text-center ">
          <span className="mb-3 block text-3xl">🏆</span>
          <p className="font-medium text-white/80">Le placard est encore vide.</p>
          <p className="mx-auto mt-1 mb-6 max-w-[44ch] text-sm text-white/50">
            Marque un film comme « vu » et son billet collector vient se poser sur la première planche.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="hidden sm:flex gap-3" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[104px] w-[78px] rounded-lg border border-dashed border-white/10 bg-white/[0.02]"
                />
              ))}
            </div>
            <Link to="/discover" className="btn-ghost">
              Trouver un film
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          {shelves.map((board) => (
            <div key={board.key}>
              {board.label && (
                <div className="mb-2.5 flex items-center gap-3">
                  <h3 className="font-mono text-xs uppercase tracking-[0.28em] text-white/45 tabular-nums">
                    {board.label}
                  </h3>
                  <span className="text-[11px] text-white/25 tabular-nums">{board.count} billet{board.count > 1 ? "s" : ""}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                </div>
              )}

              {/* Meuble : fond velours, planche claire, ombre sous la planche */}
              <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(120%_130%_at_50%_0%,rgba(124,92,224,0.12),rgba(255,255,255,0.015)_65%)] ">
                <div className="flex items-end gap-2 overflow-x-auto px-3 pt-7 pb-3 sm:gap-3 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {board.items.map((item) => (
                    <ShelfTicket
                      key={item.id}
                      item={item}
                      ordinal={ordinals.get(item.id) || 1}
                      onSelect={onSelect}
                    />
                  ))}

                  {/* Places encore libres sur la dernière planche de l'année */}
                  {board.isLastOfYear &&
                    Array.from({ length: PER_SHELF - board.items.length }).map((_, i) => (
                      <span
                        key={`empty-${i}`}
                        aria-hidden="true"
                        className="hidden h-[130px] w-[78px] shrink-0 rounded-lg border border-dashed border-white/[0.08] sm:block sm:w-[96px]"
                      />
                    ))}
                </div>

                <div className="relative h-3.5 bg-gradient-to-b from-white/[0.14] via-white/[0.05] to-transparent">
                  <span className="absolute inset-x-0 top-0 h-px bg-white/25" />
                </div>
                <div className="h-4 bg-gradient-to-b from-black/45 to-transparent" />
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-white/35">
            Clique un billet pour l'afficher en grand et le télécharger.
          </p>
        </div>
      )}
    </motion.section>
  );
}
