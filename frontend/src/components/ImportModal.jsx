import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { api } from "../lib/api";
import { play } from "../lib/feedback";

export default function ImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setResultMessage(null);
      setErrorMessage(null);
      setProgress(0);
      play("pop");
    };

    window.addEventListener("cv:open-import", handleOpen);
    return () => window.removeEventListener("cv:open-import", handleOpen);
  }, []);

  const handleProcessFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv") && !file.type.includes("csv") && !file.type.includes("text")) {
      setErrorMessage("Veuillez sélectionner un fichier au format .CSV (export Letterboxd ou IMDb).");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResultMessage(null);
    setProgress(20);

    try {
      const text = await file.text();
      setProgress(50);
      const res = await api.importCsv(text);
      setProgress(100);
      setResultMessage(`${res.count} films & séries ont été importés avec succès dans votre bibliothèque CineViseur !`);
      play("bell");
    } catch (err) {
      setErrorMessage(err.message || "Erreur lors de la lecture du fichier CSV.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => !loading && setIsOpen(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg rounded-3xl bg-[#0f111e]/95 border border-white/20 shadow-2xl p-6 md:p-8 z-10 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cine-violet/20 flex items-center justify-center text-cine-soft">
                  <Icon name="download" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Importer mes listes</h3>
                  <p className="text-xs text-white/50">Letterboxd, IMDb, Trakt ou SensCritique</p>
                </div>
              </div>

              {!loading && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-icon !w-8 !h-8 text-white/60 hover:text-white"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              Ne recommencez pas de zéro ! Glissez simplement votre fichier <strong>.csv</strong> (exporté depuis votre compte Letterboxd ou IMDb) pour transférer vos films vus et vos notes instantanément.
            </p>

            {/* Zone de Drag and Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-cine-soft bg-cine-violet/20 scale-[1.01]"
                  : "border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessFile(file);
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center mb-3 text-white/70">
                <Icon name="download" className="w-6 h-6" />
              </div>

              <p className="font-semibold text-sm text-white mb-1">
                {isDragging ? "Déposez votre fichier ici" : "Glissez votre fichier .csv ici"}
              </p>
              <p className="text-xs text-white/50 mb-3">ou cliquez pour parcourir vos dossiers</p>

              <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-mono text-white/60">
                Supporte watched.csv, ratings.csv, watchlist.csv
              </span>
            </div>

            {/* Barre de progression pendant l'import */}
            {loading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-mono text-white/70 mb-1.5">
                  <span>Traitement des films...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cine-violet to-cine-soft"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Message de succès */}
            {resultMessage && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <span className="text-base">✓</span>
                <span>{resultMessage}</span>
              </div>
            )}

            {/* Message d'erreur */}
            {errorMessage && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                <span className="text-base">⚠</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bouton de fermeture si terminé */}
            {resultMessage && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-primary !py-3 text-sm w-full mt-4 font-semibold"
              >
                Parfait, voir ma liste
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
