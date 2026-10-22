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
      title: "Blu-ray 4K Ultra HD & Steelbook",
      desc: "Édition boîtier métal collector, HDR10+ et son Dolby Atmos.",
      badge: "Cinéma à domicile",
      icon: "💿",
      gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
      borderColor: "border-amber-500/25 hover:border-amber-500/50",
      query: `${title} 4k uhd steelbook`,
      actionLabel: "Voir les éditions 4K",
    },
    {
      title: "Artbook & Coulisses du tournage",
      desc: "Livres officiels, storyboards originaux et making-of exclusifs.",
      badge: "Livre officiel",
      icon: "📖",
      gradient: "from-cine-emerald/15 via-cine-emerald/5 to-transparent",
      borderColor: "border-cine-emerald/25 hover:border-cine-emerald/50",
      query: `${title} artbook livre officiel`,
      actionLabel: "Feuilleter sur Amazon",
    },
    {
      title: "Bande Originale & Vinyle",
      desc: "Musique originale composée pour l'œuvre, pressage vinyle ou CD.",
      badge: "B.O. Collector",
      icon: "🎵",
      gradient: "from-purple-500/15 via-purple-500/5 to-transparent",
      borderColor: "border-purple-500/25 hover:border-purple-500/50",
      query: `${title} bande originale vinyle ost`,
      actionLabel: "Écouter & Commander",
    },
    {
      title: "Figurines & Produits Dérivés",
      desc: "Statuettes de collection, affiches officielles et répliques.",
      badge: "Goodies & Cadeaux",
      icon: "🎁",
      gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
      borderColor: "border-rose-500/25 hover:border-rose-500/50",
      query: `${title} figurine collector officiel`,
      actionLabel: "Explorer les goodies",
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 mt-14" aria-label="Boutique et éditions collector">
      <Reveal y={16}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <SectionTitle>Boutique & Éditions Collector</SectionTitle>
            <p className="mt-1 text-sm text-white/55">
              Prolongez l'expérience avec les éditions physiques 4K, livres et objets officiels de {title}.
            </p>
          </div>
          <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
            Partenaire Amazon Prime
          </span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <Reveal key={item.title} y={16} delay={idx * 0.05}>
            <a
              href={makeAmazonUrl(item.query)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`flex flex-col justify-between h-full p-5 rounded-2xl bg-gradient-to-br ${item.gradient} bg-white/[0.02] border ${item.borderColor} hover:bg-white/[0.06] hover:scale-[1.01] transition-all group shadow-sm`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-2xl" role="img" aria-hidden="true">{item.icon}</span>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
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

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-white">
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
