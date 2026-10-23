import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { tmdbImage } from "../lib/tmdb";
import { play } from "../lib/feedback";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

// 24-point mathematical starburst rosette polygon (style mg-event-ticket 21st.dev)
const STARBURST_POINTS =
  "50.0,0.0 57.8,5.7 67.1,3.0 72.5,11.0 82.1,11.7 84.5,21.1 93.3,25.0 92.3,34.6 99.2,41.3 95.0,50.0 99.2,58.7 92.3,65.4 93.3,75.0 84.5,78.9 82.1,88.3 72.5,89.0 67.1,97.0 57.8,94.3 50.0,100.0 42.2,94.3 32.9,97.0 27.5,89.0 17.9,88.3 15.5,78.9 6.7,75.0 7.7,65.4 0.8,58.7 5.0,50.0 0.8,41.3 7.7,34.6 6.7,25.0 15.5,21.1 17.9,11.7 27.5,11.0 32.9,3.0 42.2,5.7";

export default function CollectorTicketModal({ item, rating, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef(null);

  // 3D Interactive Mouse Tilt (inspiré des micro-interactions 21st.dev)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-220, 220], [10, -10]);
  const rotateY = useTransform(mouseX, [-220, 220], [-10, 10]);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 22 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 22 });

  const handleMouseMove = (e) => {
    if (!ticketRef.current) return;
    const rect = ticketRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    play("stamp");
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!item) return null;

  const title = item.title || item.name || "Film";
  const dateObj = item.watched_at ? new Date(item.watched_at) : new Date();
  const dateStr = dateObj.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dayNum = dateObj.getDate();
  const monthShort = dateObj.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", "");
  const yearNum = dateObj.getFullYear();

  // Score calculé sur 5 étoiles
  const rawScore =
    typeof rating === "number"
      ? rating
      : rating?.score != null
        ? rating.score
        : item.vote_average != null
          ? item.vote_average
          : 9;
  const scoreNum = rawScore > 5 ? rawScore / 2 : rawScore;
  const stars = scoreNum ? scoreNum.toFixed(1) : "4.5";

  // Tier de certification pour le sceau holographique
  let badgeTier = "SÉANCE VALIDÉE";
  let badgeColor = "#FBBF24"; // Gold
  if (scoreNum >= 4.5) {
    badgeTier = "CHEF-D'ŒUVRE";
    badgeColor = "#F59E0B";
  } else if (scoreNum >= 4.0) {
    badgeTier = "COUP DE CŒUR";
    badgeColor = "#10B981"; // Emerald
  } else if (scoreNum < 3.0) {
    badgeTier = "VU & ARCHIVÉ";
    badgeColor = "#A78BFA"; // Violet
  }

  const formatTag =
    item.viewing_tag === "cinema"
      ? "SALLE OBSCURE"
      : item.viewing_tag === "rewatch"
        ? "RE-VISIONNAGE"
        : item.viewing_tag === "streaming"
          ? "STREAMING PRIVÉ"
          : "SÉANCE CERTIFIÉE";

  const ticketNo = `CV-${yearNum}-${(item.id || item.media_id || "777").toString().padStart(6, "0")}`;

  // Partage natif ou copie dans le presse-papier
  const handleShare = async () => {
    play("pop");
    const shareData = {
      title: `Billet Collector CineViseur : ${title}`,
      text: `J'ai vu « ${title} » (${stars}/5 ★) • Billet Collector officiel CineViseur certifié le ${dateStr}.`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Annulé par l'utilisateur ou fallback
      }
    }
    try {
      await navigator.clipboard.writeText(
        `🎬 Billet Collector CineViseur : « ${title} » (${stars}/5 ★) le ${dateStr}\n${window.location.href}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  // Téléchargement Haute Définition (Canvas 1080 x 1620 px style Holo Ticket 21st.dev)
  const handleDownload = async () => {
    setDownloading(true);
    play("pop");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1620;
      const ctx = canvas.getContext("2d");

      // 1. Fond sombre cinéma avec dégradé et lueur ambiante
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1620);
      bgGrad.addColorStop(0, "#080912");
      bgGrad.addColorStop(0.5, "#0d0f1e");
      bgGrad.addColorStop(1, "#05060b");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1620);

      // Lueur holographique d'ambiance
      const radialGlow = ctx.createRadialGradient(800, 200, 50, 800, 200, 600);
      radialGlow.addColorStop(0, "rgba(124, 92, 255, 0.25)");
      radialGlow.addColorStop(1, "transparent");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, 1080, 1620);

      // 2. Corps du ticket avec encoches latérales de perforation
      const ticketX = 90;
      const ticketY = 100;
      const ticketW = 900;
      const ticketH = 1420;
      const perfY = ticketY + 1040;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;

      ctx.beginPath();
      ctx.moveTo(ticketX + 36, ticketY);
      ctx.lineTo(ticketX + ticketW - 36, ticketY);
      ctx.quadraticCurveTo(ticketX + ticketW, ticketY, ticketX + ticketW, ticketY + 36);
      ctx.lineTo(ticketX + ticketW, perfY - 40);
      // Encoche droite
      ctx.arc(ticketX + ticketW, perfY, 40, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(ticketX + ticketW, ticketY + ticketH - 36);
      ctx.quadraticCurveTo(ticketX + ticketW, ticketY + ticketH, ticketX + ticketW - 36, ticketY + ticketH);
      ctx.lineTo(ticketX + 36, ticketY + ticketH);
      ctx.quadraticCurveTo(ticketX, ticketY + ticketH, ticketX, ticketY + ticketH - 36);
      ctx.lineTo(ticketX, perfY + 40);
      // Encoche gauche
      ctx.arc(ticketX, perfY, 40, Math.PI / 2, -Math.PI / 2, true);
      ctx.lineTo(ticketX, ticketY + 36);
      ctx.quadraticCurveTo(ticketX, ticketY, ticketX + 36, ticketY);
      ctx.closePath();

      // Remplissage carte ticket
      const ticketGrad = ctx.createLinearGradient(ticketX, ticketY, ticketX, ticketY + ticketH);
      ticketGrad.addColorStop(0, "#161828");
      ticketGrad.addColorStop(1, "#0d0e17");
      ctx.fillStyle = ticketGrad;
      ctx.fill();

      // Bordure subtile
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // 3. Bandeau foil holographique supérieur
      const holoGrad = ctx.createLinearGradient(ticketX, ticketY, ticketX + ticketW, ticketY);
      holoGrad.addColorStop(0, "rgba(167, 139, 250, 0.35)");
      holoGrad.addColorStop(0.25, "rgba(16, 185, 129, 0.25)");
      holoGrad.addColorStop(0.5, "rgba(251, 191, 36, 0.3)");
      holoGrad.addColorStop(0.75, "rgba(244, 63, 94, 0.25)");
      holoGrad.addColorStop(1, "rgba(167, 139, 250, 0.35)");
      ctx.fillStyle = holoGrad;
      ctx.fillRect(ticketX, ticketY, ticketW, 120);

      // Marque officielle
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("🎬 CINEVISEUR • BILLET COLLECTOR PRIVÉ", ticketX + 50, ticketY + 75);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 22px monospace";
      ctx.fillText(ticketNo, ticketX + ticketW - 320, ticketY + 75);

      // 4. Affiche du film
      if (item.poster_path) {
        const posterImg = new Image();
        posterImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          posterImg.onload = resolve;
          posterImg.onerror = resolve;
          posterImg.src = tmdbImage(item.poster_path, "posterLarge");
        });
        if (posterImg.width) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(ticketX + 50, ticketY + 160, 340, 510, [20]);
          ctx.clip();
          ctx.drawImage(posterImg, ticketX + 50, ticketY + 160, 340, 510);
          ctx.restore();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(ticketX + 50, ticketY + 160, 340, 510, [20]);
          ctx.stroke();
        }
      }

      // 5. Titre et métadonnées
      const textX = ticketX + 430;
      let textY = ticketY + 220;

      // Tag de visionnage
      ctx.fillStyle = "rgba(124, 92, 255, 0.3)";
      ctx.beginPath();
      ctx.roundRect(textX, textY - 32, 240, 44, [10]);
      ctx.fill();
      ctx.fillStyle = "#c4b5fd";
      ctx.font = "bold 20px monospace";
      ctx.fillText(formatTag, textX + 20, textY - 3);

      textY += 70;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 52px sans-serif";
      const words = title.split(" ");
      let line = "";
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > 420 && line) {
          ctx.fillText(line, textX, textY);
          line = word + " ";
          textY += 60;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, textX, textY);

      // Note attribuée
      textY += 70;
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText(`★ ${stars} / 5`, textX, textY);

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "24px sans-serif";
      textY += 50;
      ctx.fillText(`Date : ${dateStr}`, textX, textY);
      textY += 40;
      ctx.fillText(`Émission : Certifié CineViseur`, textX, textY);

      // Grille de spécifications (Date, Salle, Format, Sécurité)
      const gridY = ticketY + 730;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ticketX + 50, gridY, ticketW - 100, 240);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "18px monospace";
      ctx.fillText("DATE DE VISIONNAGE", ticketX + 80, gridY + 45);
      ctx.fillText("FORMAT D'EXPÉRIENCE", ticketX + 520, gridY + 45);
      ctx.fillText("TIER DE QUALITÉ", ticketX + 80, gridY + 160);
      ctx.fillText("VALIDATION CINÉPHILE", ticketX + 520, gridY + 160);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(dateStr, ticketX + 80, gridY + 90);
      ctx.fillText(formatTag, ticketX + 520, gridY + 90);
      ctx.fillText(badgeTier, ticketX + 80, gridY + 205);
      ctx.fillText("✓ ARCHIVÉ DANS LE DIARY", ticketX + 520, gridY + 205);

      // 6. Ligne de perforation pointillés
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.setLineDash([14, 12]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ticketX + 50, perfY);
      ctx.lineTo(ticketX + ticketW - 50, perfY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 7. Coupon détachable (Stub)
      const stubY = perfY + 50;

      // Code-barres stylisé
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (let i = 0; i < 68; i++) {
        const bx = ticketX + 60 + i * 11.5;
        const bw = i % 4 === 0 ? 5 : i % 2 === 0 ? 3 : 1.5;
        ctx.fillRect(bx, stubY + 20, bw, 130);
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("ADMIT ONE • ENTRÉE SÉANCE COLLECTOR", ticketX + 60, stubY + 210);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "20px monospace";
      ctx.fillText(`${ticketNo} • ARCHIVE PERMANENTE PRIVÉE`, ticketX + 60, stubY + 250);

      // Blocs de date carrés dans le stub
      const dateBoxX = ticketX + ticketW - 280;
      ctx.fillStyle = "#1c1e30";
      ctx.beginPath();
      ctx.roundRect(dateBoxX, stubY + 30, 90, 90, [16]);
      ctx.roundRect(dateBoxX + 110, stubY + 30, 90, 90, [16]);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(dayNum), dateBoxX + 45, stubY + 75);
      ctx.fillText(String(yearNum).slice(-2), dateBoxX + 155, stubY + 75);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 14px monospace";
      ctx.fillText(monthShort, dateBoxX + 45, stubY + 102);
      ctx.fillText("YEAR", dateBoxX + 155, stubY + 102);
      ctx.textAlign = "left";

      // Téléchargement
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `billet-collector-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
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
      className="fixed inset-0 z-50 bg-[#06070e]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Styles d'animation optique de haute précision (style mg-event-ticket 21st.dev) */}
      <style>{`
        @keyframes cv-holo-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cv-sheen-sweep {
          0%, 45% { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
          50% { opacity: 0.6; }
          70%, 100% { transform: translateX(250%) skewX(-20deg); opacity: 0; }
        }
        @keyframes cv-laser-scan {
          0%, 15% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          75% { transform: translateY(72px); opacity: 1; }
          80%, 100% { transform: translateY(72px); opacity: 0; }
        }
        @keyframes cv-beam-left {
          0%, 100% { transform: rotate(18deg) scaleY(1); opacity: 0.25; }
          50% { transform: rotate(8deg) scaleY(1.1); opacity: 0.45; }
        }
        @keyframes cv-beam-right {
          0%, 100% { transform: rotate(-18deg) scaleY(1); opacity: 0.2; }
          50% { transform: rotate(-8deg) scaleY(1.1); opacity: 0.35; }
        }
        @keyframes cv-starburst-pulse {
          0%, 100% { transform: rotate(12deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.04); }
        }
      `}</style>

      {/* Projecteurs cinéma de fond (Beams) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 w-72 h-[600px] bg-gradient-to-b from-cine-violet/30 via-cine-violet/10 to-transparent blur-3xl origin-top"
        style={{ animation: "cv-beam-left 7s cubic-bezier(0.65, 0, 0.35, 1) infinite" }}
      />
      <div
        className="pointer-events-none absolute -top-40 right-1/4 w-72 h-[600px] bg-gradient-to-b from-amber-400/25 via-amber-400/05 to-transparent blur-3xl origin-top"
        style={{ animation: "cv-beam-right 8s cubic-bezier(0.65, 0, 0.35, 1) infinite" }}
      />

      {/* Conteneur 3D Interactif */}
      <div
        style={{ perspective: 1200 }}
        className="relative z-10 w-full max-w-[440px] my-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          ref={ticketRef}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.88, y: 35, opacity: 0, rotateX: 20 }}
          animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.88, y: 20, opacity: 0 }}
          style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
          transition={SPRING}
          className="relative rounded-[28px] bg-gradient-to-b from-[#181a2c] via-[#111322] to-[#0a0b14] border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_45px_rgba(124,92,255,0.22)] overflow-hidden text-white"
        >
          {/* Reflet holographique en diagonale (Sheen) */}
          <div
            className="pointer-events-none absolute inset-0 z-20 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ animation: "cv-sheen-sweep 6s cubic-bezier(0.65, 0, 0.35, 1) infinite" }}
          />

          {/* Sceau holographique Starburst (Rosette 24 pointes) */}
          <div
            className="absolute top-3.5 right-3.5 sm:-top-2 sm:-right-2 z-30 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
            style={{ animation: "cv-starburst-pulse 4s ease-in-out infinite" }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400" aria-hidden="true">
              <defs>
                <linearGradient id="cv-seal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="40%" stopColor={badgeColor} />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>
              <polygon points={STARBURST_POINTS} fill="url(#cv-seal-grad)" />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#0f111c"
                strokeWidth="1.2"
                strokeDasharray="3 2"
                opacity="0.8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#12131f] text-center pointer-events-none select-none">
              <span className="text-[7px] font-mono font-black uppercase tracking-wider">CERTIFIÉ</span>
              <span className="font-display font-black text-sm sm:text-base leading-none my-0.5">★ {stars}</span>
              <span className="text-[6.5px] font-mono font-bold uppercase tracking-tight">{badgeTier}</span>
            </div>
          </div>

          {/* Bandeau Foil Holographique supérieur */}
          <div
            className="relative h-14 sm:h-16 px-5 flex items-center justify-between border-b border-white/10"
            style={{
              background:
                "linear-gradient(90deg, rgba(124,92,255,0.35) 0%, rgba(16,185,129,0.3) 25%, rgba(251,191,36,0.35) 50%, rgba(244,63,94,0.3) 75%, rgba(124,92,255,0.35) 100%)",
              backgroundSize: "200% 100%",
              animation: "cv-holo-shimmer 8s linear infinite",
            }}
          >
            <div className="flex items-center gap-2.5 z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/80 font-semibold">
                  CineViseur • Billet Collector
                </p>
                <p className="text-[9px] font-mono text-white/50">{ticketNo}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="z-10 btn-icon !w-7 !h-7 text-white/60 hover:text-white bg-black/30 hover:bg-black/50 border border-white/10"
              aria-label="Fermer"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Corps principal du Billet */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex gap-4">
              {/* Vignette Affiche */}
              <div className="relative w-24 sm:w-28 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 shadow-xl ring-1 ring-white/20">
                {item.poster_path ? (
                  <img
                    src={tmdbImage(item.poster_path, "poster")}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-white/30 text-2xl">🎬</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Titre et badges */}
              <div className="flex-1 min-w-0 pr-10 sm:pr-14">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cine-violet/25 text-cine-soft border border-cine-soft/40 shadow-sm mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cine-soft" />
                  {formatTag}
                </span>

                <h3 className="font-display font-bold text-xl sm:text-2xl leading-tight text-white line-clamp-2">
                  {title}
                </h3>

                <p className="text-xs text-white/60 mt-1.5 flex items-center gap-2">
                  <span>Séance du {dateStr}</span>
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-xs">
                    <Icon name="star" weight="fill" className="w-3.5 h-3.5" />
                    <span>{stars} / 5</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/40">Entrée archivée</span>
                </div>
              </div>
            </div>

            {/* Grille de métadonnées du Billet */}
            <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                  Date de visionnage
                </span>
                <span className="font-medium text-white/90 truncate block mt-0.5">{dateStr}</span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                  Format / Séance
                </span>
                <span className="font-medium text-white/90 truncate block mt-0.5">{formatTag}</span>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                  Note attribuée
                </span>
                <span className="font-medium text-amber-300 flex items-center gap-1 mt-0.5">
                  ★ {stars} • {badgeTier}
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                  Statut Séance
                </span>
                <span className="font-medium text-emerald-400 flex items-center gap-1 mt-0.5">
                  ✓ Certifié Cinéphile
                </span>
              </div>
            </div>
          </div>

          {/* Ligne de perforation avec encoches semi-circulaires (Style ticket détachable) */}
          <div className="relative py-2">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#06070e] border-r border-white/15" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#06070e] border-l border-white/15" />
            <div className="border-t-2 border-dashed border-white/20 mx-7" />
          </div>

          {/* Coupon détachable inférieur (Stub & QR Code avec Laser Scan) */}
          <div className="p-5 sm:p-6 pt-3 bg-white/[0.02] flex items-center justify-between gap-4">
            {/* QR Code avec faisceau laser */}
            <div className="relative w-20 h-20 shrink-0 p-1.5 rounded-2xl bg-white/[0.06] border border-white/15 overflow-hidden">
              <svg viewBox="-1 -1 27 27" shapeRendering="crispEdges" className="w-full h-full text-white/80" aria-hidden="true">
                <path
                  d="M0 0h7v1h-7zM8 0h1v1h-1zM12 0h1v1h-1zM14 0h3v1h-3zM18 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM11 1h1v1h-1zM16 1h1v1h-1zM18 1h1v1h-1zM24 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM10 2h3v1h-3zM15 2h2v1h-2zM18 2h1v1h-1zM20 2h3v1h-3zM24 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM9 3h5v1h-5zM16 3h1v1h-1zM18 3h1v1h-1zM20 3h3v1h-3zM24 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM10 4h1v1h-1zM12 4h2v1h-2zM16 4h1v1h-1zM18 4h1v1h-1zM20 4h3v1h-3zM24 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM11 5h1v1h-1zM13 5h3v1h-3zM18 5h1v1h-1zM24 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h7v1h-7zM9 7h5v1h-5zM16 7h1v1h-1zM3 8h2v1h-2zM6 8h1v1h-1zM9 8h1v1h-1zM12 8h1v1h-1zM14 8h2v1h-2zM18 8h3v1h-3zM23 8h1v1h-1zM1 9h4v1h-4zM7 9h1v1h-1zM10 9h2v1h-2zM13 9h4v1h-4zM20 9h1v1h-1zM23 9h1v1h-1zM3 10h1v1h-1zM5 10h2v1h-2zM9 10h2v1h-2zM15 10h1v1h-1zM17 10h1v1h-1zM19 10h1v1h-1zM24 10h1v1h-1zM0 11h4v1h-4zM5 11h1v1h-1zM7 11h2v1h-2zM10 11h1v1h-1zM13 11h1v1h-1zM15 11h1v1h-1zM17 11h3v1h-3zM22 11h2v1h-2zM0 12h1v1h-1zM2 12h1v1h-1zM4 12h1v1h-1zM6 12h4v1h-4zM11 12h2v1h-2zM18 12h2v1h-2zM22 12h2v1h-2zM0 13h1v1h-1zM3 13h1v1h-1zM5 13h1v1h-1zM8 13h2v1h-2zM11 13h2v1h-2zM14 13h3v1h-3zM18 13h1v1h-1zM21 13h2v1h-2zM24 13h1v1h-1zM0 14h1v1h-1zM3 14h2v1h-2zM6 14h1v1h-1zM10 14h3v1h-3zM18 14h1v1h-1zM20 14h2v1h-2zM24 14h1v1h-1zM3 15h2v1h-2zM9 15h1v1h-1zM11 15h1v1h-1zM13 15h1v1h-1zM16 15h1v1h-1zM20 15h5v1h-5zM2 16h2v1h-2zM5 16h2v1h-2zM9 16h1v1h-1zM12 16h12v1h-12zM8 17h1v1h-1zM12 17h1v1h-1zM15 17h2v1h-2zM20 17h1v1h-1zM22 17h3v1h-3zM0 18h7v1h-7zM9 18h5v1h-5zM15 18h2v1h-2zM18 18h1v1h-1zM20 18h1v1h-1zM22 18h1v1h-1zM24 18h1v1h-1zM0 19h1v1h-1zM6 19h1v1h-1zM9 19h3v1h-3zM14 19h3v1h-3zM20 19h3v1h-3zM0 20h1v1h-1zM2 20h3v1h-3zM6 20h1v1h-1zM11 20h1v1h-1zM14 20h7v1h-7zM23 20h2v1h-2zM0 21h1v1h-1zM2 21h3v1h-3zM6 21h1v1h-1zM8 21h5v1h-5zM14 21h2v1h-2zM17 21h2v1h-2zM21 21h1v1h-1zM0 22h1v1h-1zM2 22h3v1h-3zM6 22h1v1h-1zM8 22h2v1h-2zM12 22h3v1h-3zM17 22h3v1h-3zM21 22h4v1h-4zM0 23h1v1h-1zM6 23h1v1h-1zM10 23h1v1h-1zM12 23h4v1h-4zM18 23h3v1h-3zM23 23h2v1h-2zM0 24h7v1h-7zM9 24h2v1h-2zM14 24h2v1h-2zM18 24h1v1h-1zM20 24h3v1h-3zM24 24h1v1h-1z"
                  fill="currentColor"
                />
              </svg>
              {/* Ligne laser néon animée */}
              <div
                className="absolute left-0 right-0 top-0 h-1 bg-cine-soft shadow-[0_0_12px_#a78bfa]"
                style={{ animation: "cv-laser-scan 3.5s linear infinite" }}
              />
            </div>

            {/* Détails du Coupon */}
            <div className="flex-1 min-w-0">
              <span className="font-display font-black text-sm uppercase tracking-wide block text-white">
                ADMIT ONE • ENTRÉE SÉANCE
              </span>
              <p className="font-mono text-[11px] text-white/50 tracking-wider mt-0.5">{ticketNo}</p>
              <p className="text-[10px] text-white/40 mt-1">Valable pour archivage cinéphile permanent</p>

              {/* Tuiles date du coupon */}
              <div className="flex gap-2 mt-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex flex-col items-center justify-center leading-none">
                  <span className="font-display font-bold text-xs text-white">{dayNum}</span>
                  <span className="text-[7.5px] font-mono font-semibold text-amber-300 mt-0.5">{monthShort}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex flex-col items-center justify-center leading-none">
                  <span className="font-display font-bold text-xs text-white">{yearNum.toString().slice(-2)}</span>
                  <span className="text-[7.5px] font-mono font-semibold text-cine-soft mt-0.5">YEAR</span>
                </div>
                <div className="flex-1 flex items-center justify-end">
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    SCAN OK ✓
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barre d'Actions Inférieure */}
          <div className="p-5 sm:p-6 pt-3 flex flex-col sm:flex-row items-center gap-2.5 border-t border-white/[0.08] bg-black/30">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:flex-1 btn-primary !py-2.5 !text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cine-violet/20"
            >
              <Icon name="download" className="w-4 h-4" />
              <span>{downloading ? "Génération du Billet..." : "Télécharger mon billet HD"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto btn-ghost !py-2.5 !px-4 !text-sm flex items-center justify-center gap-2 !bg-white/[0.05] hover:!bg-white/[0.1] border border-white/15"
              title="Partager mon billet"
            >
              <Icon name="share" className="w-4 h-4" />
              <span>{copied ? "Copié !" : "Partager"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
