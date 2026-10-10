import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { getPerson, tmdbImage } from "../lib/tmdb";
import { libraryKey } from "../lib/library";
import useLibrary from "../hooks/useLibrary";
import useSeo from "../hooks/useSeo";
import MediaCard from "../components/MediaCard";
import Icon from "../components/Icon";
import { KineticTitle } from "../components/motion";
import { EASE_OUT, riseItem, stagger } from "../lib/motionTokens";

function year(c) {
  return (c.release_date || c.first_air_date || "").slice(0, 4);
}

/** Filmographie en bobine : une piste horizontale chronologique, bordée de perforations. */
function Reel({ credits, index }) {
  let lastYear = null;
  return (
    <div className="relative">
      <div className="reel-perforations" aria-hidden="true" />
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-6 px-4 sm:px-6 md:px-10 py-10 [scrollbar-width:thin]">
        {credits.map((c, i) => {
          const y = year(c);
          const showYear = y && y !== lastYear;
          lastYear = y;
          const seen = index.get(libraryKey(c.media_type, c.id))?.status === "watched";
          return (
            <motion.div
              key={`${c.media_type}-${c.id}`}
              className="relative w-32 sm:w-36 shrink-0 snap-start"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: (i % 6) * 0.04, ease: EASE_OUT }}
            >
              <p className={`mb-2 h-5 font-mono text-xs tabular-nums ${showYear ? "text-cine-soft" : "text-transparent"}`}>{y || "----"}</p>
              <div className={seen ? "rounded-xl ring-2 ring-cine-soft ring-offset-2 ring-offset-cine-ink" : "opacity-80 hover:opacity-100 transition-opacity"}>
                <MediaCard item={c} mediaType={c.media_type} />
              </div>
              {seen && (
                <span className="absolute right-2 top-9 z-[3] rounded-md bg-cine-violet px-2 py-0.5 text-[10px] font-bold text-white">VU</span>
              )}
              {c.character && <p className="mt-1 text-[11px] text-white/55 line-clamp-1">{c.character}</p>}
            </motion.div>
          );
        })}
      </div>
      <div className="reel-perforations reel-perforations--bottom" aria-hidden="true" />
    </div>
  );
}

export default function Person() {
  const { id } = useParams();
  const { index } = useLibrary();
  const [person, setPerson] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  useSeo(person?.name || "Acteur", person?.biography ? person.biography.slice(0, 150) : undefined);

  useEffect(() => {
    setPerson(null);
    setError("");
    getPerson(id).then(setPerson).catch((e) => setError(e.message));
  }, [id]);

  const credits = useMemo(() => {
    const seen = new Set();
    return (person?.combined_credits?.cast || [])
      .filter((c) => c.poster_path && year(c) && !seen.has(`${c.media_type}-${c.id}`) && seen.add(`${c.media_type}-${c.id}`))
      .sort((a, b) => year(a).localeCompare(year(b)));
  }, [person]);

  const seenCount = credits.filter((c) => index.get(libraryKey(c.media_type, c.id))?.status === "watched").length;

  if (error)
    return (
      <p role="alert" className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16 text-rose-300">
        Impossible de charger cette personne. {error}
      </p>
    );

  if (!person)
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16 min-h-[100dvh]" aria-hidden="true">
        <div className="flex gap-8">
          <div className="w-32 sm:w-44 aspect-square rounded-[30%] skeleton" />
          <div className="flex-1 space-y-4 pt-6">
            <div className="h-12 w-1/2 rounded skeleton" />
            <div className="h-4 w-1/3 rounded skeleton" />
            <div className="h-4 w-full max-w-xl rounded skeleton" />
          </div>
        </div>
      </div>
    );

  const born = person.birthday ? new Date(person.birthday).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : null;

  return (
    <div className="pb-16">
      <motion.header
        className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 flex flex-col sm:flex-row gap-8 sm:items-end"
        initial="hidden"
        animate="show"
        variants={stagger(0.08)}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.8, rotate: -6 }, show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 18 } } }}
          className="w-32 sm:w-44 aspect-square shrink-0 overflow-hidden rounded-[30%] ring-2 ring-cine-soft/50 shadow-[0_0_60px_-12px_rgba(171,152,242,0.6)]"
        >
          {person.profile_path ? (
            <img src={tmdbImage(person.profile_path, "posterLarge")} alt={person.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-white/[0.06] text-white/55">
              <Icon name="user" className="h-12 w-12" weight="light" />
            </div>
          )}
        </motion.div>
        <div className="min-w-0">
          <motion.p variants={riseItem} className="text-sm font-medium text-cine-soft mb-2">
            {person.known_for_department === "Acting" ? "Interprète" : person.known_for_department || "Artiste"}
          </motion.p>
          <KineticTitle text={person.name} className="font-display font-semibold text-4xl md:text-6xl tracking-tighter leading-[1.05] mb-3" />
          <motion.p variants={riseItem} className="text-sm text-white/60">
            {[born && `Né(e) le ${born}`, person.place_of_birth].filter(Boolean).join(", ")}
          </motion.p>
        </div>
      </motion.header>

      {person.biography && (
        <motion.section
          className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE_OUT }}
        >
          <p className={`max-w-[70ch] text-white/75 leading-relaxed whitespace-pre-line ${expanded ? "" : "line-clamp-4"}`}>{person.biography}</p>
          {person.biography.length > 320 && (
            <button onClick={() => setExpanded((v) => !v)} className="link mt-2 text-sm font-medium">
              {expanded ? "Réduire" : "Lire la suite"}
            </button>
          )}
        </motion.section>
      )}

      <section className="mt-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 flex flex-wrap items-end justify-between gap-3">
          <h2 className="section-title">Filmographie</h2>
          <p className="text-sm text-white/60 tabular-nums">
            {credits.length} titres
            {seenCount > 0 && <span className="text-cine-soft"> · tu en as vu {seenCount}</span>}
          </p>
        </div>
        {credits.length > 0 ? (
          <Reel credits={credits} index={index} />
        ) : (
          <p className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-6 text-white/60">Aucun titre avec affiche pour le moment.</p>
        )}
      </section>
    </div>
  );
}
