import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import useSeo from "../hooks/useSeo";
import { play, setSoundsEnabled, soundsEnabled } from "../lib/feedback";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import { GlowCard } from "../components/motion";
import { EASE_OUT, SPRING, riseItem, stagger } from "../lib/motionTokens";

/** Nombre qui compte jusqu'à sa valeur quand il apparaît. */
function CountUp({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString("fr-FR"));
  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: EASE_OUT });
    return () => controls.stop();
  }, [count, value]);
  return <motion.span>{rounded}</motion.span>;
}

function TileBody({ to, children }) {
  const className = "relative z-[2] flex flex-col gap-6 p-6 rounded-2xl";
  return to ? (
    <Link to={to} className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft`}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [sounds, setSounds] = useState(soundsEnabled);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  useSeo("Profil");

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteAccount();
      logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    Promise.all([api.watchlist(), api.alerts().catch(() => [])])
      .then(([list, alerts]) =>
        setStats({
          toWatch: list.filter((i) => i.status !== "watched").length,
          watched: list.filter((i) => i.status === "watched").length,
          alerts: alerts.length,
        })
      )
      .catch(() => setStats({ toWatch: 0, watched: 0, alerts: 0 }));
  }, [user]);

  if (!user) return null;

  const initial = (user.name || "?").trim()[0]?.toUpperCase();
  const tiles = [
    { key: "toWatch", label: "À voir", icon: "list", to: "/watchlist" },
    { key: "watched", label: "Vus", icon: "eye", to: "/watchlist" },
    { key: "alerts", label: "Alertes de sortie", icon: "bell", to: null },
  ];

  return (
    <motion.div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16" initial="hidden" animate="show" variants={stagger(0.08)}>
      <motion.div variants={riseItem} className="flex items-center gap-5 mb-12">
        <motion.span
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-16 h-16 rounded-[20px] bg-cine-violet grid place-items-center font-display font-semibold text-2xl text-white"
        >
          {initial}
        </motion.span>
        <div className="min-w-0">
          <h1 className="page-title truncate">{user.name}</h1>
          <p className="text-white/55 truncate">{user.email}</p>
        </div>
      </motion.div>

      <motion.div variants={stagger(0.08)} className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-4 max-w-4xl">
        {tiles.map((tile, i) => (
          <GlowCard
            key={tile.key}
            as="div"
            variants={riseItem}
            className={`rounded-2xl ring-1 ring-inset ring-white/[0.08] ${i === 0 ? "bg-[radial-gradient(120%_100%_at_0%_0%,rgba(124,92,224,0.28),transparent_60%)] bg-[#111116]" : "bg-white/[0.03]"}`}
          >
            <TileBody to={tile.to}>
              <Icon name={tile.icon} className="w-5 h-5 text-cine-soft" />
              <div>
                <p className="font-display font-semibold text-5xl tracking-tight tabular-nums leading-none mb-2">
                  {stats ? <CountUp value={stats[tile.key]} /> : <span className="inline-block w-10 h-10 rounded-lg skeleton align-middle" />}
                </p>
                <p className="text-sm text-white/60">{tile.label}</p>
              </div>
            </TileBody>
          </GlowCard>
        ))}
      </motion.div>

      <motion.div variants={riseItem}>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="btn-ghost mt-12"
        >
          <Icon name="logout" className="w-4 h-4" /> Déconnexion
        </button>
      </motion.div>

      <motion.section variants={riseItem} className="mt-14 max-w-xl">
        <h2 className="section-title mb-4">Réglages</h2>
        <label className="flex items-center justify-between gap-6 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07] cursor-pointer">
          <span>
            <span className="block font-medium">Sons du projecteur</span>
            <span className="block text-sm text-white/60">Cliquet de la molette, tampon du ticket, bobine qui tourne.</span>
          </span>
          <button
            role="switch"
            aria-checked={sounds}
            onClick={() => {
              setSoundsEnabled(!sounds);
              setSounds(!sounds);
              if (!sounds) setTimeout(() => play("stamp"), 50);
            }}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${sounds ? "bg-cine-violet" : "bg-white/15"}`}
          >
            <motion.span layout transition={SPRING} className={`absolute top-1 h-5 w-5 rounded-full bg-white ${sounds ? "right-1" : "left-1"}`} />
          </button>
        </label>
        <Link to="/recap" className="mt-4 flex items-center justify-between rounded-2xl bg-[radial-gradient(120%_120%_at_0%_0%,rgba(124,92,224,0.3),transparent_60%)] p-4 ring-1 ring-inset ring-white/[0.08] hover:ring-white/20 transition">
          <span>
            <span className="block font-medium">Ton année ciné {new Date().getFullYear()}</span>
            <span className="block text-sm text-white/60">Ton récap en diapositives, à partager.</span>
          </span>
          <Icon name="arrowRight" />
        </Link>
      </motion.section>

      <motion.section variants={riseItem} className="mt-16 pt-8 border-t border-white/[0.08] max-w-xl">
        <h2 className="section-title mb-2">Supprimer mon compte</h2>
        <p className="text-sm text-white/65 leading-relaxed mb-5">
          Ton compte, ta liste, tes alertes et tes notes seront effacés immédiatement et définitivement.
        </p>
        <AnimatePresence mode="wait" initial={false}>
          {!confirming ? (
            <motion.button
              key="ask"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirming(true)}
              className="btn px-5 py-3 text-rose-200 ring-1 ring-inset ring-rose-400/40 hover:bg-rose-500/10"
            >
              Supprimer mon compte
            </motion.button>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3">
              <p className="w-full text-sm font-medium text-rose-200">Cette action est irréversible. Confirmer ?</p>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? "Suppression..." : "Oui, supprimer définitivement"}
              </button>
              <button onClick={() => setConfirming(false)} disabled={deleting} className="btn-ghost">
                Annuler
              </button>
              {deleteError && <p role="alert" className="w-full text-sm text-rose-300">{deleteError}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
