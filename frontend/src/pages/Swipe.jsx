import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { api, generateClientRoomCode } from "../lib/api";
import { mediaTitle, mediaYear, tmdbImage } from "../lib/tmdb";
import { libraryKey, setLibraryStatus } from "../lib/library";
import { play, vibrate } from "../lib/feedback";
import useLibrary from "../hooks/useLibrary";
import useSeo from "../hooks/useSeo";
import Icon from "../components/Icon";
import { KineticTitle, Magnetic } from "../components/motion";
import SegmentedControl from "../components/SegmentedControl";
import SpotlightCard from "../components/SpotlightCard";

const THRESHOLD = 120;
const EXIT = {
  to_watch: { x: 600, y: 40, rotate: 25 },
  skip: { x: -600, y: 40, rotate: -25 },
  watched: { x: 0, y: -700, rotate: 0 },
};

function TopCard({ item, onDecide, isDuo = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [30, THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-THRESHOLD, -30], [1, 0]);
  const seenOpacity = useTransform(y, [-THRESHOLD, -30], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
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
        leave: (dir) => ({
          ...EXIT[dir || "skip"],
          opacity: 0,
          transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
        }),
      }}
      initial="enter"
      animate="center"
      exit="leave"
    >
      <img
        src={tmdbImage(item.poster_path, "posterLarge")}
        alt={`Affiche de ${mediaTitle(item)}`}
        draggable={false}
        className="h-full w-full object-cover rounded-3xl ring-1 ring-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] pointer-events-none"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-28">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-mono uppercase text-white/90">
            {item.media_type === "tv" ? "Série" : "Film"}
          </span>
          {item.vote_average > 0 && (
            <span className="text-amber-400 font-mono text-xs font-semibold flex items-center gap-1">
              ★ {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>
        <h2 className="font-display text-2xl font-semibold leading-tight text-white drop-shadow">
          {mediaTitle(item)}
        </h2>
        <p className="mt-1 text-sm text-white/70 tabular-nums">
          {mediaYear(item)} {item.overview ? `· ${item.overview.slice(0, 95)}...` : ""}
        </p>
      </div>

      <motion.span
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-6 top-8 -rotate-12 rounded-2xl border-4 border-emerald-400 bg-emerald-950/60 backdrop-blur-md px-4 py-1.5 font-display text-2xl md:text-3xl font-bold text-emerald-300 shadow-xl"
      >
        {isDuo ? "CHAUD CE SOIR !" : "À VOIR"}
      </motion.span>
      <motion.span
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute right-6 top-8 rotate-12 rounded-2xl border-4 border-rose-400 bg-rose-950/60 backdrop-blur-md px-4 py-1.5 font-display text-2xl md:text-3xl font-bold text-rose-300 shadow-xl"
      >
        PASSER
      </motion.span>
      <motion.span
        style={{ opacity: seenOpacity }}
        className="pointer-events-none absolute left-1/2 bottom-36 -translate-x-1/2 rounded-2xl border-4 border-cine-soft bg-indigo-950/70 backdrop-blur-md px-4 py-1.5 font-display text-2xl md:text-3xl font-bold text-cine-soft shadow-xl"
      >
        DÉJÀ VU
      </motion.span>
    </motion.div>
  );
}

// Modal Célébration de Match Duo
function MatchCelebrationModal({ match, onClose, onSave }) {
  if (!match) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c1a36] to-[#0c0d1c] border border-cine-soft/40 p-6 md:p-8 text-center shadow-[0_0_80px_rgba(168,85,247,0.35)] overflow-hidden"
      >
        {/* Éléments de fond festifs */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cine-soft/20 blur-3xl" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-mono font-semibold tracking-wider uppercase mb-5 animate-pulse">
          ✨ MATCH CONFIRMÉ !
        </div>

        <h3 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-2">
          C'est votre film !
        </h3>
        <p className="text-white/70 text-sm mb-6">
          Vous et votre binôme avez tous les deux flashé sur ce titre ce soir.
        </p>

        <div className="relative mx-auto w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-cine-soft/50 mb-6">
          <img
            src={tmdbImage(match.poster_path, "posterLarge")}
            alt={mediaTitle(match)}
            className="w-full h-full object-cover"
          />
        </div>

        <h4 className="font-display text-xl font-semibold text-white mb-1">
          {mediaTitle(match)}
        </h4>
        <p className="text-xs font-mono text-white/60 mb-6">
          {mediaYear(match)} · Note TMDB {match.vote_average ? `${match.vote_average.toFixed(1)}/10` : "Non noté"}
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSave}
            className="btn-primary !py-3.5 text-base w-full shadow-lg shadow-cine-violet/40 font-semibold"
          >
            <span>On regarde ça ce soir !</span>
            <Icon name="check" className="w-5 h-5" weight="bold" />
          </button>

          <Link
            to={`/title/${match.media_type || "movie"}/${match.id}`}
            className="btn-ghost !py-3 text-sm w-full !bg-white/10 hover:!bg-white/15"
          >
            Voir la fiche & où le regarder
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-white/50 hover:text-white pt-2 transition-colors"
          >
            Continuer à swiper pour en trouver d'autres
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Swipe() {
  useSeo("Trier en swipant & Soirée Duo", "Swipéz seul pour trier votre liste, ou à deux pour trouver le film de ce soir.");
  const [searchParams, setSearchParams] = useSearchParams();
  const { index, ready } = useLibrary();

  // Mode : 'solo' ou 'duo'
  const initialMode = searchParams.get("room") || searchParams.get("duo") ? "duo" : "solo";
  const [mode, setMode] = useState(initialMode);

  // Pile de cartes communes
  const [deck, setDeck] = useState([]);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(null);
  const [counts, setCounts] = useState({ to_watch: 0, watched: 0, skip: 0 });
  const [loading, setLoading] = useState(true);

  // État Duo
  const [roomCode, setRoomCode] = useState(searchParams.get("room") || "");
  const [duoRole, setDuoRole] = useState(searchParams.get("room") ? "guest" : "host");
  const [hostLikes, setHostLikes] = useState(() => {
    const raw = searchParams.get("hl");
    return raw ? raw.split(",").map(Number).filter(Boolean) : [];
  });
  const [guestConnected, setGuestConnected] = useState(false);
  const [myDuoLikes, setMyDuoLikes] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [joinInputCode, setJoinInputCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [duoStatusText, setDuoStatusText] = useState("");

  const pollIntervalRef = useRef(null);

  // Chargement des cartes pour le mode solo
  useEffect(() => {
    if (mode !== "solo" || !ready) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.discover("movie", "fr", { sort: "popularity", page }),
      api.discover("tv", "fr", { sort: "popularity", page }),
    ])
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
  }, [page, ready, mode, index]);

  // Si on arrive avec un lien direct ?room=XXXX
  useEffect(() => {
    const directRoom = searchParams.get("room");
    if (directRoom && mode === "duo" && !deck.length) {
      joinRoom(directRoom);
    }
  }, [searchParams, mode]);

  // Création d'un salon Duo
  const createRoom = async () => {
    setLoading(true);
    try {
      // On prépare une sélection équilibrée de 30 films populaires de qualité
      const [movies, trending] = await Promise.all([
        api.discover("movie", "fr", { sort: "popularity", page: 1 }),
        api.trending("fr"),
      ]);

      const pool = [
        ...(movies.results || []).map((m) => ({ ...m, media_type: "movie" })),
        ...(trending.results || []).filter((t) => t.poster_path && t.media_type !== "person"),
      ];

      // Dédoublonnage
      const map = new Map();
      pool.forEach((item) => {
        if (item.poster_path && !map.has(item.id)) map.set(item.id, item);
      });
      const selectedDeck = Array.from(map.values()).slice(0, 30);

      const res = await api.duoCreate({ deck: selectedDeck, host_name: "Toi" });
      const newCode = res.code;
      setRoomCode(newCode);
      setDuoRole("host");
      setDeck(selectedDeck);
      setSearchParams({ room: newCode });
      play("pop");
    } catch {
      // Fallback local
      const fallbackCode = generateClientRoomCode();
      setRoomCode(fallbackCode);
      setDuoRole("host");
    } finally {
      setLoading(false);
    }
  };

  // Rejoindre un salon Duo existant
  const joinRoom = async (codeToJoin) => {
    const code = (codeToJoin || joinInputCode).trim();
    if (!code) return;
    setLoading(true);
    try {
      const res = await api.duoJoin({ code, guest_name: "Ami" });
      setRoomCode(code);
      setDuoRole("guest");
      if (res.deck?.length) setDeck(res.deck);
      if (res.host_likes?.length) setHostLikes(res.host_likes);
      if (res.matches?.length) setCurrentMatch(res.matches[0]);
      setSearchParams({ room: code });
      play("pop");
    } catch {
      setDuoStatusText("Code introuvable. Vérifie le numéro du salon.");
    } finally {
      setLoading(false);
    }
  };

  // Polling temps réel du salon Duo
  useEffect(() => {
    if (mode !== "duo" || !roomCode) return;

    const poll = async () => {
      try {
        const status = await api.duoStatus(roomCode);
        if (status.guest_connected) setGuestConnected(true);
        if (status.host_likes?.length) setHostLikes(status.host_likes);

        // Détection de match
        if (status.matches?.length && !currentMatch) {
          const match = status.matches[status.matches.length - 1];
          setCurrentMatch(match);
          play("bell");
          vibrate(50);
        }
      } catch {
        // En cas de micro-coupure, continue
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 2200);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [mode, roomCode, currentMatch]);

  const pile = deck.filter((m) => (mode === "solo" ? !index.has(libraryKey(m.media_type, m.id)) : true));
  const top = pile[0];

  // Décision de swipe
  const decide = useCallback(
    async (dir) => {
      if (!top) return;
      setDirection(dir);
      setCounts((c) => ({ ...c, [dir]: c[dir] + 1 }));
      setDeck((d) => d.filter((m) => m !== top));

      if (mode === "solo" && pile.length < 6) {
        setPage((p) => p + 1);
      }

      if (dir === "skip") {
        play("whoosh");
        vibrate(8);
      } else if (dir === "to_watch") {
        play("tick");
        vibrate(12);
      }

      // Si mode Solo : enregistrement dans la bibliothèque locale
      if (mode === "solo") {
        if (dir !== "skip") {
          try {
            await setLibraryStatus(
              { item: top, mediaType: top.media_type, existing: index.get(libraryKey(top.media_type, top.id)) },
              dir
            );
          } catch {
            // échec silencieux
          }
        }
      }

      // Si mode Duo : enregistrement du vote sur le serveur et vérification de match
      if (mode === "duo" && roomCode) {
        const nextLikes = dir === "to_watch" ? [...myDuoLikes, top.id] : myDuoLikes;
        if (dir === "to_watch") setMyDuoLikes(nextLikes);

        // Détection asynchrone immédiate si l'hôte avait déjà liké ce film
        if (duoRole === "guest" && dir === "to_watch" && hostLikes.includes(top.id)) {
          setCurrentMatch(top);
          play("bell");
          vibrate(50);
        }

        // Met à jour l'URL pour la persistance asynchrone
        if (duoRole === "host" && dir === "to_watch") {
          const updatedParams = new URLSearchParams(searchParams);
          updatedParams.set("room", roomCode);
          updatedParams.set("hl", nextLikes.join(","));
          setSearchParams(updatedParams, { replace: true });
        }

        try {
          const voteRes = await api.duoVote({
            code: roomCode,
            role: duoRole,
            action: dir === "to_watch" ? "like" : dir,
            movieId: top.id,
          });

          if (voteRes.matches?.length && !currentMatch) {
            setCurrentMatch(voteRes.matches[voteRes.matches.length - 1]);
            play("bell");
            vibrate(50);
          }
        } catch {
          // continue
        }
      }
    },
    [top, mode, pile.length, roomCode, myDuoLikes, duoRole, hostLikes, searchParams, currentMatch, index]
  );

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
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

  // Partage du lien Duo
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/swipe?room=${roomCode}${hostLikes.length ? `&hl=${hostLikes.join(",")}` : ""}`
    : "";

  const copyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText?.(shareUrl);
    setIsCopied(true);
    play("pop");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Validation du film matché dans la liste
  const handleSaveMatch = async () => {
    if (!currentMatch) return;
    try {
      await setLibraryStatus(
        { item: currentMatch, mediaType: currentMatch.media_type || "movie" },
        "to_watch"
      );
      play("pop");
    } catch {}
    setCurrentMatch(null);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-10 pb-16 flex flex-col items-center">
      <KineticTitle
        text={mode === "duo" ? "Soirée Duo · Match Ciné" : "Trier en swipant"}
        className="page-title mb-2 text-center"
      />

      {/* Switcher Solo / Duo */}
      <div className="mb-6">
        <SegmentedControl
          options={[
            { label: "Mode Solo", value: "solo" },
            { label: "Soirée Duo (À 2)", value: "duo" },
          ]}
          value={mode}
          onChange={(newMode) => {
            setMode(newMode);
            if (newMode === "solo") {
              setSearchParams({});
            }
          }}
          size="md"
        />
      </div>

      {/* --- ÉCRAN LOBBY DUO (si pas encore en jeu) --- */}
      {mode === "duo" && !roomCode && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md my-4"
        >
          <SpotlightCard className="p-6 md:p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 mx-auto flex items-center justify-center mb-4">
              <Icon name="heart" className="w-6 h-6" weight="fill" />
            </div>

            <h3 className="font-display text-2xl font-bold uppercase text-white mb-2">
              Trouvez quoi regarder ensemble
            </h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              Swipéz le même paquet de films sur vos téléphones respectifs. Dès que vous aimez le même film : <strong>MATCH immédiat !</strong>
            </p>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={createRoom}
                disabled={loading}
                className="btn-primary !py-3.5 text-base w-full shadow-lg shadow-pink-500/30 !bg-gradient-to-r !from-pink-500 !to-cine-violet"
              >
                <span>Créer un salon & inviter un ami</span>
                <Icon name="arrowRight" className="w-4 h-4" weight="bold" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-4 text-xs font-mono text-white/40 uppercase">ou</span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code à 4 chiffres (ex: 7842)"
                  value={joinInputCode}
                  onChange={(e) => setJoinInputCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="input-text text-center font-mono tracking-widest text-lg font-bold"
                />
                <button
                  type="button"
                  onClick={() => joinRoom()}
                  disabled={!joinInputCode.trim() || loading}
                  className="btn-light !px-6 shrink-0"
                >
                  Rejoindre
                </button>
              </div>

              {duoStatusText && (
                <p className="text-xs text-rose-400 font-mono mt-1">{duoStatusText}</p>
              )}
            </div>
          </SpotlightCard>
        </motion.div>
      )}

      {/* --- BANDEAU SALON DUO ACTIF --- */}
      {mode === "duo" && roomCode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mb-6 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-[10px] font-mono uppercase text-white/50 block">Code Salon</span>
                <span className="font-mono text-lg font-bold text-white tracking-widest">
                  #{roomCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyShareLink}
                className="btn-ghost !px-3 !py-1.5 text-xs flex items-center gap-1.5 !bg-white/10"
              >
                <Icon name={isCopied ? "check" : "share"} className="w-3.5 h-3.5" weight="bold" />
                <span>{isCopied ? "Copié !" : "Partager"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoomCode("");
                  setSearchParams({});
                }}
                className="btn-icon !w-8 !h-8 text-white/60 hover:text-white"
                title="Quitter le salon"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Statut de connexion ami */}
          <div className="flex items-center justify-between px-2 text-xs font-mono text-white/60">
            <span>
              {guestConnected || hostLikes.length > 0 ? (
                <span className="text-emerald-400">● Ami connecté · Vos votes se croisent en direct</span>
              ) : (
                <span className="text-amber-400/90">○ En attente du 2ème joueur (envoie-lui le lien !)</span>
              )}
            </span>
            <span>{myDuoLikes.length} aimés</span>
          </div>
        </motion.div>
      )}

      {/* Consignes simples */}
      {mode === "solo" && (
        <p className="text-white/65 text-center mb-8 max-w-[46ch] text-sm">
          À droite : à voir. À gauche : passer. Vers le haut : déjà vu. Les flèches du clavier fonctionnent aussi.
        </p>
      )}

      {/* --- PILE DE CARTES --- */}
      {(mode === "solo" || (mode === "duo" && roomCode)) && (
        <>
          <div className="relative w-[min(88vw,350px)] aspect-[2/3]">
            {pile[2] && (
              <img
                src={tmdbImage(pile[2].poster_path, "poster")}
                alt=""
                className="absolute inset-0 h-full w-full object-cover rounded-3xl opacity-40 scale-[0.9] translate-y-6"
              />
            )}
            {pile[1] && (
              <img
                src={tmdbImage(pile[1].poster_path, "poster")}
                alt=""
                className="absolute inset-0 h-full w-full object-cover rounded-3xl opacity-70 scale-[0.95] translate-y-3 transition-transform duration-300"
              />
            )}
            <AnimatePresence custom={direction}>
              {top && (
                <TopCard
                  key={`${top.media_type}-${top.id}`}
                  item={top}
                  onDecide={decide}
                  isDuo={mode === "duo"}
                />
              )}
            </AnimatePresence>
            {!top && (
              <div className="absolute inset-0 grid place-items-center rounded-3xl bg-white/[0.03] border border-white/10 p-6 text-center">
                {!loading && (
                  <div>
                    <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center mb-3 text-white/70">
                      <Icon name="check" className="w-6 h-6" weight="bold" />
                    </div>
                    <p className="text-white/80 font-semibold mb-1">Fin de la pile !</p>
                    <p className="text-white/50 text-xs">
                      {mode === "duo"
                        ? "Tu as swipé tous les films de la session. En attente des choix de ton ami !"
                        : "Plus rien à trier pour l'instant."}
                    </p>
                    {mode === "duo" && (
                      <button
                        type="button"
                        onClick={createRoom}
                        className="btn-primary !py-2.5 !px-4 text-xs mt-4"
                      >
                        Relancer un nouveau deck
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Boutons d'action tactiles */}
          <div className="mt-8 flex items-center gap-4">
            <Magnetic>
              <motion.button
                onClick={() => decide("skip")}
                disabled={!top}
                className="btn-icon !w-14 !h-14 !rounded-2xl hover:!border-rose-500/50 hover:!text-rose-400"
                aria-label="Passer"
              >
                <Icon name="x" className="h-6 w-6" weight="bold" />
              </motion.button>
            </Magnetic>

            {mode === "solo" && (
              <Magnetic>
                <motion.button
                  onClick={() => decide("watched")}
                  disabled={!top}
                  className="btn-icon !w-12 !h-12 !rounded-2xl"
                  aria-label="Déjà vu"
                >
                  <Icon name="eye" className="h-5 w-5" weight="bold" />
                </motion.button>
              </Magnetic>
            )}

            <Magnetic>
              <motion.button
                onClick={() => decide("to_watch")}
                disabled={!top}
                className={`btn-primary !w-14 !h-14 !p-0 !rounded-2xl ${
                  mode === "duo" ? "!bg-gradient-to-r !from-pink-500 !to-cine-violet shadow-pink-500/30" : ""
                }`}
                aria-label={mode === "duo" ? "Chaud ce soir" : "À voir"}
              >
                <Icon name={mode === "duo" ? "heart" : "plus"} className="h-6 w-6" weight="fill" />
              </motion.button>
            </Magnetic>
          </div>

          {/* Compteur discret */}
          <p className="mt-6 text-sm text-white/60 tabular-nums font-mono" aria-live="polite">
            {counts.to_watch} {mode === "duo" ? "likés" : "à voir"} · {counts.skip} passés
          </p>
        </>
      )}

      {/* Modale de Célébration de Match Duo */}
      <AnimatePresence>
        {currentMatch && (
          <MatchCelebrationModal
            match={currentMatch}
            onClose={() => setCurrentMatch(null)}
            onSave={handleSaveMatch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
