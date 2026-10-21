import { useEffect, useRef, useState } from "react";
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
  const [detailedStats, setDetailedStats] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [sounds, setSounds] = useState(soundsEnabled);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [importStatus, setImportStatus] = useState("");

  const csvInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  useSeo("Mon espace");

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

  const loadData = () => {
    if (!user) return;
    Promise.all([api.watchlist(), api.alerts().catch(() => []), api.ratings().catch(() => [])])
      .then(([list, alerts, ratingsList]) => {
        const toWatch = list.filter((i) => i.status !== "watched");
        const watched = list.filter((i) => i.status === "watched");
        
        setStats({
          toWatch: toWatch.length,
          watched: watched.length,
          alerts: alerts.length,
        });

        // Calcul des statistiques avancées
        const epProgress = api.getAllEpisodesProgress();
        let totalEpisodesWatched = 0;
        Object.values(epProgress).forEach((prog) => {
          totalEpisodesWatched += Object.keys(prog.episodes || {}).length;
        });

        // Estimation du temps : 110 min par film, 45 min par épisode
        const totalMinutes = watched.length * 110 + totalEpisodesWatched * 45;
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

        // Note moyenne
        const validRatings = ratingsList.filter((r) => r.score);
        const avgScore = validRatings.length
          ? (validRatings.reduce((sum, r) => sum + r.score, 0) / validRatings.length).toFixed(1)
          : null;

        // Tags de visionnage
        const cinemaCount = watched.filter((w) => w.viewing_tag === "cinema").length;
        const streamingCount = watched.filter((w) => w.viewing_tag === "streaming" || !w.viewing_tag).length;

        setDetailedStats({
          totalEpisodesWatched,
          timeString: days > 0 ? `${days}j ${hours}h` : `${hours} heures`,
          avgScore,
          cinemaCount,
          streamingCount,
        });
      })
      .catch(() => setStats({ toWatch: 0, watched: 0, alerts: 0 }));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, [user]);

  // Exportation au format JSON CineViseur
  const handleExport = () => {
    play("tick");
    const data = api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sauvegarde-cineviseur-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus("Sauvegarde exportée avec succès !");
    setTimeout(() => setImportStatus(""), 4000);
  };

  // Importation de fichier JSON CineViseur
  const handleJsonFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = api.importData(parsed);
      play("stamp");
      setImportStatus(`Restauration réussie ! ${res.importedCount} titres ajoutés.`);
      loadData();
    } catch {
      setImportStatus("Erreur : fichier JSON invalide");
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = "";
      setTimeout(() => setImportStatus(""), 5000);
    }
  };

  // Importation CSV Letterboxd ou Trakt
  const handleCsvFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await api.importCsv(text);
      play("stamp");
      setImportStatus(`Importation réussie ! ${res.count} films importés depuis votre fichier.`);
      loadData();
    } catch (err) {
      setImportStatus(`Erreur : ${err.message || "Fichier CSV non reconnu"}`);
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = "";
      setTimeout(() => setImportStatus(""), 5000);
    }
  };

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
          <h1 className="page-title truncate">Mon espace</h1>
          <p className="text-white/55 truncate">Données stockées dans le cache de votre navigateur</p>
        </div>
      </motion.div>

      {/* Compteurs principaux */}
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

      {/* Tableau de bord Statistiques (Style Trakt & Letterboxd) */}
      {detailedStats && (
        <motion.section variants={riseItem} className="mt-12 max-w-4xl">
          <h2 className="section-title mb-4">Vos statistiques cinéphiles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-xs uppercase tracking-wider text-white/50 block mb-1">Temps total</span>
              <p className="font-display font-bold text-2xl text-white">{detailedStats.timeString}</p>
              <span className="text-[11px] text-white/40">passés devant un écran</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-xs uppercase tracking-wider text-white/50 block mb-1">Épisodes de séries</span>
              <p className="font-display font-bold text-2xl text-cine-soft">{detailedStats.totalEpisodesWatched}</p>
              <span className="text-[11px] text-white/40">vus au total</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-xs uppercase tracking-wider text-white/50 block mb-1">Note moyenne</span>
              <p className="font-display font-bold text-2xl text-amber-300">
                {detailedStats.avgScore ? `★ ${detailedStats.avgScore}` : "—"}
              </p>
              <span className="text-[11px] text-white/40">sur 10</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-xs uppercase tracking-wider text-white/50 block mb-1">Lieux de séance</span>
              <p className="font-display font-bold text-xl text-white">
                {detailedStats.cinemaCount} 🍿 / {detailedStats.streamingCount} 📺
              </p>
              <span className="text-[11px] text-white/40">Cinéma vs Streaming</span>
            </div>
          </div>
        </motion.section>
      )}

      {/* Import & Sauvegarde (Letterboxd, Trakt, JSON) */}
      <motion.section variants={riseItem} className="mt-12 max-w-4xl">
        <h2 className="section-title mb-2">Sauvegarde & Importation</h2>
        <p className="text-sm text-white/60 mb-5">
          Vos données vous appartiennent. Vous pouvez importer votre historique depuis Letterboxd ou Trakt, ou créer une sauvegarde de secours.
        </p>

        {importStatus && (
          <div className="mb-4 p-3 rounded-xl bg-cine-violet/20 border border-cine-violet/40 text-cine-soft text-xs font-medium">
            {importStatus}
          </div>
        )}

        {/* Inputs masqués */}
        <input type="file" ref={csvInputRef} accept=".csv" onChange={handleCsvFile} className="hidden" />
        <input type="file" ref={jsonInputRef} accept=".json" onChange={handleJsonFile} className="hidden" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-cine-soft/40 transition text-sm font-medium text-white"
          >
            <Icon name="download" className="w-4 h-4 text-cine-soft" />
            <span>Importer Letterboxd / Trakt (.csv)</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-cine-soft/40 transition text-sm font-medium text-white"
          >
            <Icon name="share" className="w-4 h-4 text-cine-soft" />
            <span>Exporter ma sauvegarde (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-cine-soft/40 transition text-sm font-medium text-white"
          >
            <Icon name="plus" className="w-4 h-4 text-cine-soft" />
            <span>Restaurer une sauvegarde (.json)</span>
          </button>
        </div>
      </motion.section>

      {/* Réglages */}
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

        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
          <div>
            <span className="block font-medium">Mises à jour de l'application</span>
            <span className="block text-sm text-white/60">Vérifier si un nouveau patch ou de nouvelles fonctionnalités sont prêts.</span>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("cv:check-update"))}
            className="btn-light !py-2 !px-3.5 !text-xs !font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Icon name="refresh" className="w-3.5 h-3.5" />
            <span>Vérifier</span>
          </button>
        </div>

        <Link to="/recap" className="mt-4 flex items-center justify-between rounded-2xl bg-[radial-gradient(120%_120%_at_0%_0%,rgba(124,92,224,0.3),transparent_60%)] p-4 ring-1 ring-inset ring-white/[0.08] hover:ring-white/20 transition">
          <span>
            <span className="block font-medium">Ton année ciné {new Date().getFullYear()}</span>
            <span className="block text-sm text-white/60">Ton récap en diapositives, à partager.</span>
          </span>
          <Icon name="arrowRight" />
        </Link>
      </motion.section>

      {/* Suppression du cache */}
      <motion.section variants={riseItem} className="mt-16 pt-8 border-t border-white/[0.08] max-w-xl">
        <h2 className="section-title mb-2">Vider le cache de ma liste</h2>
        <p className="text-sm text-white/65 leading-relaxed mb-5">
          Efface tous les films enregistrés dans votre liste, vos alertes et vos notes de ce navigateur.
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
              Vider ma liste et mes notes
            </motion.button>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3">
              <p className="w-full text-sm font-medium text-rose-200">Cette action videra les données locales. Confirmer ?</p>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? "Suppression..." : "Oui, vider mes données"}
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
