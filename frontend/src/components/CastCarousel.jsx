/**
 * CastCarousel — Carrousel horizontal de boutons acteur.
 * Drag-to-scroll natif, anneau violet au focus, photo ronde + nom + rôle.
 */
import { Link } from "react-router-dom";
import { tmdbImage } from "../lib/tmdb";

export default function CastCarousel({ cast = [] }) {
  if (!cast.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto scroll-smooth px-4 sm:px-6 md:px-10 pb-4 pt-1
                    [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cast.map((person) => (
        <Link
          key={person.id}
          to={`/person/${person.id}`}
          className="shrink-0 flex flex-col items-center gap-2 w-20 group outline-none
                     focus-visible:ring-2 focus-visible:ring-cine-soft rounded-xl"
        >
          {/* Photo */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/[0.06] ring-1 ring-white/10
                          group-hover:ring-cine-soft/60 group-hover:shadow-[0_0_18px_rgba(124,92,224,0.45)]
                          transition-[box-shadow,ring] duration-300 shrink-0">
            {person.profile_path ? (
              <img
                src={tmdbImage(person.profile_path, "profile")}
                alt={person.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/30 text-xl font-display font-semibold">
                {person.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Texte */}
          <div className="text-center w-full">
            <p className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors
                          leading-tight line-clamp-2">
              {person.name}
            </p>
            {person.character && (
              <p className="text-[10px] text-white/45 leading-tight line-clamp-1 mt-0.5">
                {person.character}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
