import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { api } from "../lib/api";
import { bearing, cachedPosition, locate } from "../lib/geo";
import { play } from "../lib/feedback";
import Icon from "./Icon";
import { TextShimmer } from "./backgrounds";
import { EASE_OUT, SPRING } from "../lib/motionTokens";

const RADIUS_KM = 20;
// Ordre d'affichage des filtres : les formats premium d'abord.
const FORMAT_ORDER = ["Dolby Cinema", "IMAX", "4DX", "ScreenX", "Laser ULTRA", "ICE", "Dolby Atmos", "3D", "VO"];

/** Radar : toi au centre, chaque salle placée selon sa direction et sa distance. */
function Radar({ cinemas, origin, active, onActive, maxKm }) {
  const reduce = useReducedMotion();
  const size = 300;
  const c = size / 2;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]" aria-hidden="true">
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full">
        {[0.33, 0.66, 1].map((r) => (
          <circle key={r} cx={c} cy={c} r={(c - 8) * r} fill="none" stroke="rgba(171,152,242,0.18)" strokeDasharray="2 4" />
        ))}
        <line x1={c} y1={8} x2={c} y2={size - 8} stroke="rgba(255,255,255,0.05)" />
        <line x1={8} y1={c} x2={size - 8} y2={c} stroke="rgba(255,255,255,0.05)" />
        <text x={c} y={18} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">N</text>
      </svg>
      {/* Balayage du radar */}
      {!reduce && (
        <motion.div
          className="absolute inset-2 rounded-full bg-[conic-gradient(from_0deg,rgba(171,152,242,0.35),transparent_25%)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}
      <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.15)]" />
      {cinemas.map((cin, i) => {
        const angle = (bearing(origin, cin) - 90) * (Math.PI / 180);
        const dist = Math.min(1, cin.distance_km / maxKm) * (c - 16);
        const isActive = active === cin.id;
        return (
          <motion.button
            key={cin.id}
            type="button"
            tabIndex={-1}
            onMouseEnter={() => onActive(cin.id)}
            onMouseLeave={() => onActive(null)}
            className="absolute -ml-2 -mt-2 h-4 w-4 rounded-full"
            style={{ left: `${((c + Math.cos(angle) * dist) / size) * 100}%`, top: `${((c + Math.sin(angle) * dist) / size) * 100}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: isActive ? 1.8 : 1, opacity: 1 }}
            transition={{ ...SPRING, delay: isActive ? 0 : 0.3 + i * 0.05 }}
          >
            <span className={`block h-full w-full rounded-full ${cin.formats.length ? "bg-cine-soft" : "bg-white/60"} ${isActive ? "shadow-[0_0_16px_4px_rgba(171,152,242,0.8)]" : ""}`} />
          </motion.button>
        );
      })}
    </div>
  );
}

function directionsUrl(origin, cin) {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.lat}%2C${origin.lon}%3B${cin.lat}%2C${cin.lon}`;
}

/**
 * Où voir ce film en salle : cinémas proches, formats (Dolby Cinema, IMAX, 4DX, 3D...),
 * lien vers les séances du cinéma et itinéraire.
 */
export default function CinemaFinder({ filmTitle }) {
  const [origin, setOrigin] = useState(cachedPosition);
  const [cinemas, setCinemas] = useState(null);
  const [status, setStatus] = useState(origin ? "loading" : "idle");
  const [error, setError] = useState("");
  const [format, setFormat] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!origin) return;
    setStatus("loading");
    api
      .nearbyCinemas(origin.lat, origin.lon, RADIUS_KM)
      .then((data) => {
        setCinemas(data.cinemas);
        setStatus("done");
        play("projector");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, [origin]);

  async function start() {
    setStatus("locating");
    setError("");
    try {
      setOrigin(await locate());
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }

  const formats = useMemo(() => {
    const all = new Set((cinemas || []).flatMap((c) => c.formats));
    return FORMAT_ORDER.filter((f) => all.has(f));
  }, [cinemas]);

  const shown = (cinemas || []).filter((c) => !format || c.formats.includes(format));
  const maxKm = Math.max(5, ...shown.map((c) => c.distance_km));

  return (
    <div>
      {(status === "idle" || status === "locating" || status === "error") && (
        <div className="flex flex-col items-start gap-4">
          <button onClick={start} disabled={status === "locating"} className="btn-primary">
            <Icon name="pin" weight="bold" /> {filmTitle ? "Trouver un cinéma autour de moi" : "Utiliser ma position"}
          </button>
          {status === "locating" && <TextShimmer as="p" className="text-sm">On cherche ta position...</TextShimmer>}
          {status === "error" && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </div>
      )}

      {status === "loading" && <TextShimmer as="p" className="text-sm">On interroge les salles autour de toi...</TextShimmer>}

      {status === "done" && cinemas && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT }}>
          {cinemas.length === 0 ? (
            <p className="text-white/65">Aucun cinéma trouvé dans un rayon de {RADIUS_KM} km.</p>
          ) : (
            <>
              {formats.length > 0 && (
                <div className="mb-6 flex gap-3 overflow-x-auto px-1 pt-1 pb-3 -mx-1 [scrollbar-width:none]" role="group" aria-label="Filtrer par format">
                  {[null, ...formats].map((f) => (
                    <button
                      key={f || "all"}
                      onClick={() => setFormat(f)}
                      aria-pressed={format === f}
                      className="btn-chip"
                    >
                      {f || "Tous les cinémas"}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
                <div className="hidden sm:block lg:sticky lg:top-24">
                  <Radar cinemas={shown} origin={origin} active={active} onActive={setActive} maxKm={maxKm} />
                  <p className="mt-3 text-center text-xs text-white/55">Rayon de {Math.round(maxKm)} km autour de toi</p>
                </div>

                <ol className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {shown.map((cin, i) => (
                      <motion.li
                        key={cin.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: EASE_OUT }}
                        onMouseEnter={() => setActive(cin.id)}
                        onMouseLeave={() => setActive(null)}
                        className={`rounded-2xl p-4 ring-1 ring-inset transition-colors ${active === cin.id ? "bg-white/[0.08] ring-cine-soft/50" : "bg-white/[0.03] ring-white/[0.08]"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold">{cin.name}</p>
                            {cin.address && <p className="text-sm text-white/55">{cin.address}</p>}
                          </div>
                          <span className="shrink-0 font-mono text-sm tabular-nums text-cine-soft">{cin.distance_km} km</span>
                        </div>

                        {cin.formats.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            {FORMAT_ORDER.filter((f) => cin.formats.includes(f)).map((f) => (
                              <span
                                key={f}
                                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                  ["Dolby Cinema", "IMAX", "4DX", "ScreenX", "Laser ULTRA", "ICE"].includes(f)
                                    ? "bg-cine-violet/25 text-white ring-1 ring-inset ring-cine-violet/50"
                                    : "bg-white/[0.07] text-white/80"
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                            {cin.formats_source === "reseau" && <span className="text-[11px] text-white/50">selon le réseau {cin.brand}</span>}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
                          <a href={cin.showtimes_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white hover:text-cine-soft transition-colors">
                            <Icon name="calendar" /> {filmTitle ? "Voir les séances" : "Programme"}
                          </a>
                          <a href={directionsUrl(origin, cin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/75 hover:text-white transition-colors">
                            <Icon name="compass" /> Itinéraire
                          </a>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ol>
              </div>

              <p className="mt-6 text-xs text-white/50 max-w-[70ch]">
                Les horaires viennent du site de chaque cinéma : « Voir les séances » l'ouvre directement. Les formats marqués
                « selon le réseau » sont ceux que l'enseigne propose, vérifie leur disponibilité pour ta séance.
              </p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
