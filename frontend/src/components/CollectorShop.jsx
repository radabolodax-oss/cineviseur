import { AFFILIATE } from "../lib/site";
import { Reveal } from "./motion";
import SectionTitle from "./SectionTitle";

export default function CollectorShop({ title, mediaType = "movie" }) {
  if (!title) return null;

  const tag = AFFILIATE.amazonTag || "cineviseur-21";
  const makeAmazonUrl = (query) =>
    `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(tag)}`;

  const items = [
    {
      title: "Édition 4K & Steelbook",
      desc: "Boîtier métal collector, son Dolby Atmos et master haute fidélité.",
      badge: "Cinéma à domicile",
      icon: "💿",
      accent: "text-amber-400/90",
      query: `${title} 4k uhd steelbook`,
      actionLabel: "Voir les éditions 4K",
    },
    {
      title: "Livre officiel & Artbook",
      desc: "Plongez dans les coulisses, les storyboards et les photos de plateau.",
      badge: "Livre officiel",
      icon: "📖",
      accent: "text-emerald-400/90",
      query: `${title} artbook livre officiel`,
      actionLabel: "Feuilleter l'ouvrage",
    },
    {
      title: "Bande Originale & Vinyle",
      desc: "La partition originale pressée sur vinyle d'exception ou CD.",
      badge: "Musique",
      icon: "🎵",
      accent: "text-purple-400/90",
      query: `${title} bande originale vinyle ost`,
      actionLabel: "Écouter la B.O.",
    },
    {
      title: "Objets de collection",
      desc: "Affiches originales, statuettes et répliques authentifiées.",
      badge: "Objets cultes",
      icon: "🎁",
      accent: "text-rose-400/90",
      query: `${title} figurine collector officiel`,
      actionLabel: "Découvrir la boutique",
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-14" aria-label="Boutique et éditions collector">
      <Reveal y={16}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <SectionTitle>Boutique & Éditions Collector</SectionTitle>
            <p className="mt-1 text-xs sm:text-sm text-white/55">
              Pour les amoureux du cinéma : éditions physiques 4K, beaux livres et vinyles officiels de {title}.
            </p>
          </div>
          <span className="text-[11px] font-mono text-white/40">
            Partenaire Amazon
          </span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <Reveal key={item.title} y={16} delay={idx * 0.04}>
            <a
              href={makeAmazonUrl(item.query)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex flex-col justify-between h-full p-5 rounded-3xl bg-[#161423]/90 hover:bg-[#1c192c] border border-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-2xl" role="img" aria-hidden="true">{item.icon}</span>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/70">
                    {item.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-base text-white group-hover:text-cine-soft transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="mt-1.5 text-xs text-white/55 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-medium text-white/80 group-hover:text-white">
                <span>{item.actionLabel}</span>
                <span className="text-cine-emerald group-hover:translate-x-0.5 transition-transform">↗</span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-white/40 text-right">
        * En tant que Partenaire Amazon, CineViseur réalise un bénéfice sur les achats remplissant les conditions requises.
      </p>
    </section>
  );
}
