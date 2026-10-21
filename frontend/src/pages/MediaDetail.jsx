import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { api } from "../lib/api";
import { tmdbImage, tmdbSrcSet } from "../lib/tmdb";
import { useAuth } from "../context/AuthContext";
import GlassCarousel from "../components/GlassCarousel";
import Toast from "../components/Toast";
import Icon from "../components/Icon";
import SectionTitle from "../components/SectionTitle";
import useSeo from "../hooks/useSeo";
import { isSubscribed } from "../lib/providers";
import { setLibraryStatus } from "../lib/library";
import RatingDial from "../components/RatingDial";
import CastCarousel from "../components/CastCarousel";
import CinemaFinder from "../components/CinemaFinder";
import CollectorTicketModal from "../components/CollectorTicketModal";
import TvEpisodeTracker from "../components/TvEpisodeTracker";
import { KineticTitle, Reveal, TiltCard } from "../components/motion";
import { EASE_OUT, SPRING, riseItem, stagger } from "../lib/motionTokens";

function DetailSkeleton({ poster }) {
  return (
    // Mêmes dimensions que la page chargée, pour que rien ne saute à l'arrivée du contenu.
    // Si l'on vient d'une affiche, elle est déjà là : c'est elle qui « vole » jusqu'ici.
    <div className="pb-16 min-h-[100dvh]" aria-hidden="true">
      <div className="-mt-16 h-[50dvh] md:h-[65dvh] w-full skeleton" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 -mt-48 md:-mt-64 relative flex flex-col md:flex-row gap-8 md:gap-12">
        {poster ? (
          <img
            data-vt-target
            src={tmdbImage(poster, "poster")}
            alt=""
            className="w-40 sm:w-48 md:w-64 shrink-0 aspect-[2/3] object-cover rounded-2xl ring-1 ring-white/15"
            style={{ viewTransitionName: "poster-hero" }}
          />
        ) : (
          <div className="w-40 sm:w-48 md:w-64 shrink-0 aspect-[2/3] rounded-2xl skeleton" />
        )}
        <div className="flex-1 md:pt-28 space-y-4">
          <div className="h-12 w-2/3 rounded skeleton" />
          <div className="h-4 w-1/2 rounded skeleton" />
          <div className="h-4 w-full max-w-2xl rounded skeleton" />
          <div className="h-4 w-full max-w-xl rounded skeleton" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-44 rounded-full skeleton" />
            <div className="h-12 w-56 rounded-full skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

const PROVIDER_GROUPS = [
  { key: "flatrate", label: "Inclus dans l'abonnement" },
  { key: "free", label: "Gratuit" },
  { key: "ads", label: "Gratuit avec publicités" },
  { key: "rent", label: "À la location" },
  { key: "buy", label: "À l'achat" },
];

// TMDB : 2 = sortie limitée en salle, 3 = sortie en salle (4 = numérique, 6 = TV).
const THEATRICAL = [2, 3];

/**
 * En salle : une sortie cinéma (en France de préférence) entre il y a 4 mois et dans une semaine.
 * Un film sorti directement sur une plateforme (Netflix, Prime...) n'a pas de sortie de type 2 ou 3.
 */
function isInTheaters(item) {
  const countries = item.release_dates?.results || [];
  const fr = countries.find((c) => c.iso_3166_1 === "FR");
  const pool = fr ? [fr] : countries;
  const dates = pool
    .flatMap((c) => c.release_dates || [])
    .filter((r) => THEATRICAL.includes(r.type))
    .map((r) => new Date(r.release_date));
  return dates.some((d) => {
    const days = (Date.now() - d) / 86400000;
    return days > -7 && days < 120;
  });
}

function findTrailer(videos) {
  const results = (videos?.results || []).filter((v) => /^[\w-]{6,20}$/.test(v.key || ""));
  return (
    results.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    results.find((v) => v.site === "YouTube")
  );
}

function TrailerModal({ videoKey, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-cine-ink/90 backdrop-blur-md flex items-center justify-center px-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Bande-annonce"
    >
      <motion.div
        className="w-full max-w-5xl aspect-video"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.88, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={SPRING}
      >
        <iframe
          className="w-full h-full rounded-2xl ring-1 ring-white/10 shadow-2xl"
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1`}
          title="Bande-annonce"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </motion.div>
      <button onClick={onClose} className="btn-icon absolute top-6 right-6 !w-11 !h-11" aria-label="Fermer">
        <Icon name="x" className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

function Score({ value, count }) {
  return (
    <div className="flex items-center gap-3">
      <Icon name="star" weight="fill" className="w-6 h-6 text-cine-soft" />
      <p className="font-display font-semibold text-3xl tabular-nums leading-none">
        {value.toFixed(1)}
        <span className="text-base text-white/55 font-normal">/10</span>
      </p>
      <p className="text-xs leading-tight text-white/50">
        Note du public
        {count ? (
          <>
            <br />
            {count.toLocaleString("fr-FR")} votes
          </>
        ) : null}
      </p>
    </div>
  );
}

/** Un seul contrôle pour l'état dans ma liste : À voir ou Vu. Recliquer sur l'état actif retire le titre. */
function ListStatus({ status, busy, onChange }) {
  const options = [
    { value: "to_watch", label: "À voir", icon: "plus" },
    { value: "watched", label: "Vu", icon: "eye" },
  ];
  return (
    <div role="group" aria-label="Ma liste" className="inline-flex p-1 rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10 backdrop-blur-md">
      {options.map((opt) => {
        const active = status === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(active ? null : opt.value)}
            disabled={busy}
            aria-pressed={active}
            title={active ? "Retirer de ma liste" : undefined}
            className={`relative btn px-5 py-2.5 ${active ? "text-white" : "text-white/70 hover:text-white"}`}
          >
            {active && <motion.span layoutId="list-status" transition={SPRING} className="absolute inset-0 rounded-full bg-cine-violet" />}
            <span className="relative inline-flex items-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={active ? "check" : opt.icon}
                  initial={{ scale: 0, rotate: -60 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 60 }}
                  transition={SPRING}
                  className="inline-flex"
                >
                  <Icon name={active ? "check" : opt.icon} className="w-4 h-4" weight="bold" />
                </motion.span>
              </AnimatePresence>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function formatRuntime(item) {
  const minutes = item.runtime || item.episode_run_time?.[0];
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export default function MediaDetail() {
  const { mediaType, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef = useRef(null);

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [watchlistItem, setWatchlistItem] = useState(null);
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState("");
  const [showTrailer, setShowTrailer] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [myRating, setMyRating] = useState(null);

  // Le fond descend plus lentement que la page et s'assombrit.
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const backdropOpacity = useTransform(scrollYProgress, [0, 1], [0.55, 0.15]);

  useSeo(
    item ? item.title || item.name : null,
    item?.overview ? `${item.overview.slice(0, 150).trim()}${item.overview.length > 150 ? "..." : ""}` : undefined
  );

  useEffect(() => {
    api
      .ratings()
      .then((list) => {
        const found = list.find((r) => r.media_id === Number(id) && r.media_type === mediaType);
        if (found) setMyRating(found);
      })
      .catch(() => {});
  }, [id, mediaType]);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .details(mediaType, id, "fr")
      .then(setItem)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mediaType, id]);

  useEffect(() => {
    api
      .libraryStatus(mediaType, id)
      .then((data) => {
        setWatchlistItem(data.watchlist_item);
        setAlert(data.alert);
      })
      .catch(() => {});
  }, [mediaType, id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (loading) return <DetailSkeleton poster={location.state?.poster} />;
  if (error)
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-10 pb-16">
        <div role="alert" className="bg-rose-500/10 ring-1 ring-inset ring-rose-500/30 text-rose-200 rounded-2xl px-5 py-4 max-w-xl">
          Impossible de charger ce titre. {error}
        </div>
      </div>
    );
  if (!item) return null;

  const title = item.title || item.name;
  const releaseDate = item.release_date || item.first_air_date;
  const isReleased = releaseDate ? new Date(releaseDate) <= new Date() : false;
  const releaseLabel = releaseDate
    ? new Date(releaseDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "Date inconnue";
  const runtime = formatRuntime(item);
  const inTheaters = mediaType === "movie" && isInTheaters(item);
  const frProviders = item["watch/providers"]?.results?.FR;
  const providers = frProviders && PROVIDER_GROUPS.some((g) => frProviders[g.key]?.length) ? frProviders : null;

  const cast = (item.credits?.cast || []).slice(0, 15);
  const trailer = findTrailer(item.videos);
  const similar = (item.similar?.results || []).filter((s) => s.poster_path).slice(0, 12);

  async function handleStatus(nextStatus) {
    setBusy(true);
    try {
      const result = await setLibraryStatus({ item, mediaType, existing: watchlistItem }, nextStatus);
      setWatchlistItem(result);
      if (!nextStatus) setToast("Retiré de ta liste");
      else if (nextStatus === "to_watch") setToast("Ajouté à ta liste");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleAlert() {
    setBusy(true);
    try {
      if (alert) {
        await api.removeAlert(alert.id);
        setAlert(null);
        setToast("Alerte désactivée");
      } else {
        const result = await api.createAlert(
          { media_id: item.id, media_type: mediaType, title, poster_path: item.poster_path, release_date: releaseDate }
        );
        setAlert(result);
        setToast("On t'alertera à la sortie");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pb-16">
      <div ref={heroRef} className="relative -mt-16 h-[50dvh] md:h-[65dvh] w-full overflow-hidden" aria-hidden="true">
        {item.backdrop_path && (
          <motion.img
            src={tmdbImage(item.backdrop_path, "backdrop")} srcSet={tmdbSrcSet(item.backdrop_path, "backdrop")} sizes="100vw" decoding="async"
            alt=""
            fetchPriority="high"
            style={{ y: backdropY, opacity: backdropOpacity }}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.4, ease: EASE_OUT }}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cine-ink via-cine-ink/40 to-cine-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-cine-ink/80 via-transparent to-transparent" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 -mt-48 md:-mt-64 relative flex flex-col md:flex-row gap-8 md:gap-12">
        <motion.div
          className="relative w-40 sm:w-48 md:w-64 shrink-0"
          initial={{ opacity: 0, y: 40, rotate: -3, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ ...SPRING, stiffness: 160, damping: 20, delay: 0.1 }}
        >
          {item.poster_path ? (
            <>
              {/* Mode ambiant : l'affiche floutée diffuse ses couleurs autour d'elle. */}
              <motion.img
                src={tmdbImage(item.poster_path, "thumb")}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl blur-3xl saturate-150 pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.7, scale: 1.25 }}
                transition={{ duration: 1.8, delay: 0.4, ease: EASE_OUT }}
              />
              <TiltCard className="relative aspect-[2/3] rounded-2xl overflow-hidden ring-1 ring-white/15 bg-white/[0.05] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]" max={10}>
                <img src={tmdbImage(item.poster_path, "posterLarge")} srcSet={tmdbSrcSet(item.poster_path, "poster")} sizes="(min-width: 768px) 256px, 192px" decoding="async" alt={`Affiche de ${title}`} className="w-full h-full object-cover block" data-vt-target style={{ viewTransitionName: "poster-hero" }} />
              </TiltCard>
            </>
          ) : (
            <div className="w-full aspect-[2/3] rounded-2xl bg-white/10 grid place-items-center text-white/55">
              <Icon name={mediaType === "tv" ? "tv" : "film"} className="w-10 h-10" weight="light" />
            </div>
          )}
        </motion.div>

        <motion.div className="flex-1 md:pt-28" initial="hidden" animate="show" variants={stagger(0.07, 0.2)}>
          <motion.p variants={riseItem} className="text-sm font-medium text-cine-soft mb-3">
            {mediaType === "tv" ? "Série" : "Film"}
          </motion.p>
          <KineticTitle
            key={title}
            text={title}
            delay={0.25}
            className="font-display font-semibold text-4xl md:text-6xl leading-[1.04] tracking-tighter mb-3"
          />
          {item.tagline && (
            <motion.p variants={riseItem} className="text-white/55 italic leading-[1.4] mb-5 max-w-2xl">
              « {item.tagline} »
            </motion.p>
          )}

          <motion.div variants={riseItem} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65 mb-3 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" className="w-4 h-4 text-white/55" /> {releaseLabel}
            </span>
            {runtime && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" className="w-4 h-4 text-white/55" /> {runtime}
              </span>
            )}
            {item.number_of_seasons && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="tv" className="w-4 h-4 text-white/55" />
                {item.number_of_seasons} saison{item.number_of_seasons > 1 ? "s" : ""}
              </span>
            )}
            {!isReleased && <span className="chip !bg-cine-violet/25 !ring-cine-violet/50 !text-white">Pas encore sorti</span>}
          </motion.div>
          {item.genres?.length > 0 && (
            <motion.p variants={riseItem} className="text-sm text-white/50 mb-7">
              {item.genres.map((g) => g.name).join(", ")}
            </motion.p>
          )}

          <motion.div variants={riseItem} className="mb-7 flex flex-wrap items-center gap-x-10 gap-y-5">
            {item.vote_average ? (
              <Score value={item.vote_average} count={item.vote_count} />
            ) : (
              <span className="text-sm text-white/55">Pas encore noté</span>
            )}
            {isReleased && <RatingDial mediaId={item.id} mediaType={mediaType} />}
          </motion.div>

          <motion.p variants={riseItem} className="text-white/75 text-[15px] md:text-base max-w-[65ch] leading-relaxed mb-8">
            {item.overview || "Pas de synopsis disponible."}
          </motion.p>

          <motion.div variants={riseItem} className="flex flex-wrap items-center gap-3">
            {trailer && (
              <motion.button onClick={() => setShowTrailer(true)} className="btn-light group">
                <Icon name="play" weight="fill" className="w-4 h-4 transition-transform duration-300 group-hover:scale-125" /> Bande-annonce
              </motion.button>
            )}

            <ListStatus status={watchlistItem?.status || null} busy={busy} onChange={handleStatus} />

            {watchlistItem?.status === "watched" && (
              <motion.button
                onClick={() => setShowTicket(true)}
                className="btn-light !bg-amber-400/10 !border-amber-400/30 !text-amber-200 shadow-sm"
              >
                🎟️ Mon billet collector
              </motion.button>
            )}

            {inTheaters && (
              <a href="#seances" className="btn-ghost">
                <Icon name="pin" /> Trouver une séance
              </a>
            )}

            {providers?.flatrate?.length > 0 && (
              <a href="#plateformes" className="btn-ghost">
                <Icon name="play" /> Sur {providers.flatrate[0].provider_name}
              </a>
            )}

            {!isReleased && (
              <motion.button onClick={handleToggleAlert} disabled={busy} className={alert ? "btn-primary" : "btn-ghost"}>
                <Icon name="bell" className="w-4 h-4" weight={alert ? "fill" : "regular"} />
                {alert ? "Alerte activée" : "M'alerter à la sortie"}
              </motion.button>
            )}
          </motion.div>


        </motion.div>
      </div>

      {mediaType === "tv" && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mb-14">
          <TvEpisodeTracker tvId={item.id} seasons={item.seasons || []} totalEpisodes={item.number_of_episodes || 0} />
        </section>
      )}

      {inTheaters && (
        <section id="seances" className="scroll-mt-24 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-16">
          <Reveal y={16}>
            <SectionTitle>Où le voir au cinéma</SectionTitle>
            <p className="-mt-2 mb-6 text-white/60 max-w-[60ch]">
              {title} est {isReleased ? "à l'affiche" : "bientôt en salle"}. Trouve les cinémas autour de toi, leurs formats (Dolby, IMAX, 4DX, 3D...) et leurs séances.
              {providers && ` Tu peux aussi le regarder en ligne sur ${providers.flatrate?.length ? providers.flatrate.map(p => p.provider_name).join(", ") : "les plateformes proposées"}.`}
            </p>
          </Reveal>
          <CinemaFinder filmTitle={title} />
        </section>
      )}

      {providers && (
        <section id="plateformes" className="scroll-mt-24 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-16">
          <Reveal y={16}>
            <SectionTitle>Où le regarder</SectionTitle>
          </Reveal>
          <div className="flex flex-col gap-6">
            {PROVIDER_GROUPS.filter((g) => providers[g.key]?.length).map((g) => (
              <div key={g.key}>
                <p className="mb-3 text-sm text-white/60">{g.label}</p>
                <div className="flex flex-wrap gap-3">
                  {providers[g.key].map((p) => {
                    const subscribed = isSubscribed(p.provider_id);
                    return (
                      <a
                        key={p.provider_id}
                        href={providers.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 rounded-2xl py-2 pl-2 pr-4 ring-1 ring-inset transition-all ${
                          subscribed
                            ? "bg-emerald-500/15 ring-emerald-500/40 text-white shadow-sm"
                            : "bg-white/[0.04] ring-white/[0.08] text-white/85 hover:bg-white/[0.09] hover:ring-cine-soft/50"
                        }`}
                      >
                        <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt="" loading="lazy" className="h-10 w-10 rounded-xl" />
                        <div>
                          <span className="text-sm font-medium block">{p.provider_name}</span>
                          {subscribed && (
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                              ✓ Inclus dans vos abonnements
                            </span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/50">Disponibilités en France fournies par JustWatch.</p>
        </section>
      )}

      {cast.length > 0 && (
        <section className="max-w-[1440px] mx-auto mt-16">
          <Reveal y={16}>
            <SectionTitle className="px-4 sm:px-6 md:px-10">Casting</SectionTitle>
          </Reveal>
          <CastCarousel cast={cast} />
        </section>
      )}

      {similar.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-14">
          <Reveal y={16}>
            <SectionTitle>Titres similaires</SectionTitle>
          </Reveal>
          <GlassCarousel items={similar} mediaType={mediaType} />
        </section>
      )}

      <AnimatePresence>
        {showTrailer && trailer && <TrailerModal videoKey={trailer.key} onClose={() => setShowTrailer(false)} />}
        {showTicket && (
          <CollectorTicketModal
            item={{
              ...item,
              watched_at: watchlistItem?.watched_at || new Date().toISOString(),
              viewing_tag: watchlistItem?.viewing_tag,
            }}
            rating={myRating}
            onClose={() => setShowTicket(false)}
          />
        )}
      </AnimatePresence>
      <Toast message={toast} />
    </div>
  );
}
