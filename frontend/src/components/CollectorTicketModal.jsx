import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { tmdbImage } from "../lib/tmdb";
import { play } from "../lib/feedback";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

export default function CollectorTicketModal({ item, rating, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    play("stamp");
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const title = item.title || item.name || "Film";
  const dateStr = item.watched_at
    ? new Date(item.watched_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const stars = rating?.score ? (rating.score / 2).toFixed(1) : (item.vote_average ? (item.vote_average / 2).toFixed(1) : "—");
  const formatTag = item.viewing_tag === "cinema" ? "SALLE OBSCURE" : item.viewing_tag === "rewatch" ? "RE-VISIONNAGE" : "STREAMING PRIVÉ";

  // Génération directe sur Canvas pour téléchargement en haute définition
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1620;
      const ctx = canvas.getContext("2d");

      // Fond sombre cinéma
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1620);
      bgGrad.addColorStop(0, "#0b0c16");
      bgGrad.addColorStop(1, "#05060a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1620);

      // Texture ticket central
      ctx.save();
      ctx.fillStyle = "#161928";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 50;
      ctx.beginPath();
      ctx.roundRect(80, 100, 920, 1420, [32]);
      ctx.fill();
      ctx.restore();

      // Bordure néon subtile
      ctx.strokeStyle = "rgba(124, 92, 224, 0.4)";
      ctx.lineWidth = 4;
      ctx.stroke();

      // En-tête CineViseur
      ctx.fillStyle = "#a78bfa";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("🎬 CINEVISEUR • BILLET COLLECTOR", 140, 190);

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "24px monospace";
      ctx.fillText(`N° CV-${(item.id || item.media_id || "777").toString().padStart(6, "0")}`, 720, 190);

      // Ligne pointillée
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.setLineDash([12, 12]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 240);
      ctx.lineTo(960, 240);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dessin de l'affiche
      if (item.poster_path) {
        const posterImg = new Image();
        posterImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          posterImg.onload = resolve;
          posterImg.onerror = resolve;
          posterImg.src = tmdbImage(item.poster_path, "posterLarge");
        });
        if (posterImg.width) {
          ctx.drawImage(posterImg, 140, 300, 420, 630);
        }
      }

      // Informations à droite de l'affiche
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px sans-serif";
      const words = title.split(" ");
      let line = "";
      let yPos = 380;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > 360) {
          ctx.fillText(line, 600, yPos);
          line = word + " ";
          yPos += 64;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, 600, yPos);

      // Note & Étoiles
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText(`★ ${stars} / 5`, 600, yPos + 100);

      // Format & Date
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "28px sans-serif";
      ctx.fillText(`FORMAT : ${formatTag}`, 600, yPos + 180);
      ctx.fillText(`DATE : ${dateStr}`, 600, yPos + 230);

      // Coupon détachable en bas
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(120, 1100);
      ctx.lineTo(960, 1100);
      ctx.stroke();
      ctx.setLineDash([]);

      // Encoche circulaire gauche & droite
      ctx.fillStyle = "#0b0c16";
      ctx.beginPath();
      ctx.arc(80, 1100, 36, 0, Math.PI * 2);
      ctx.arc(1000, 1100, 36, 0, Math.PI * 2);
      ctx.fill();

      // Faux code-barres stylisé
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      for (let i = 0; i < 60; i++) {
        const x = 160 + i * 13;
        const w = (i % 3 === 0 ? 5 : 2);
        ctx.fillRect(x, 1200, w, 100);
      }

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "24px monospace";
      ctx.fillText("VALABLE POUR SÉANCE PRIVÉE • GARDE LA MÉMOIRE DE VOS ÉCRANS", 160, 1360);

      // Téléchargement automatique
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `billet-cineviseur-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
      a.click();
    } catch (err) {
      console.warn("Erreur génération billet", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-cine-ink/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        ref={ticketRef}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={SPRING}
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#181c2e] to-[#0e111d] border border-cine-violet/50 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden text-white"
      >
        {/* En-tête ticket */}
        <div className="p-6 border-b border-dashed border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎟️</span>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-cine-soft">Billet Collector</p>
              <h3 className="font-display font-semibold text-lg leading-tight">CineViseur</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon !w-8 !h-8 text-white/50 hover:text-white" aria-label="Fermer">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Corps du billet */}
        <div className="p-6 flex gap-4">
          <div className="w-24 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-white/10 shadow-lg ring-1 ring-white/20">
            {item.poster_path ? (
              <img src={tmdbImage(item.poster_path, "poster")} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/40">🎬</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="chip !text-[10px] !py-0.5 !px-2 mb-2 !bg-cine-violet/25 !text-cine-soft">
              {formatTag}
            </span>
            <h4 className="font-display font-bold text-xl leading-snug line-clamp-2">{title}</h4>
            <p className="text-xs text-white/60 mt-1">Séance du {dateStr}</p>
            <div className="flex items-center gap-1.5 mt-3 text-amber-300 font-semibold text-sm">
              <Icon name="star" weight="fill" className="w-4 h-4" />
              <span>{stars} / 5</span>
            </div>
          </div>
        </div>

        {/* Ligne de perforation */}
        <div className="relative border-t border-dashed border-white/15 py-4 px-6 flex items-center justify-between bg-black/20">
          <div className="absolute -left-4 -top-3 w-6 h-6 rounded-full bg-cine-ink" />
          <div className="absolute -right-4 -top-3 w-6 h-6 rounded-full bg-cine-ink" />

          {/* Faux code barre */}
          <div className="flex items-center gap-1 h-8 opacity-40">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className={`h-full bg-white ${i % 3 === 0 ? "w-1" : "w-0.5"}`} />
            ))}
          </div>
          <span className="font-mono text-[10px] text-white/40 tracking-wider">
            CV-{(item.id || item.media_id || "777").toString().slice(0, 6)}
          </span>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 btn-primary !py-2.5 !text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Icon name="download" className="w-4 h-4" />
            <span>{downloading ? "Génération de l'image..." : "Télécharger mon billet"}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
