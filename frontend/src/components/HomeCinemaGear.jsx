import { AFFILIATE } from "../lib/site";
import { Reveal } from "./motion";
import SectionTitle from "./SectionTitle";

export default function HomeCinemaGear() {
  const tag = AFFILIATE.amazonTag || "cineviseur-21";
  const makeUrl = (query) =>
    `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(tag)}`;

  const gearItems = [
    {
      title: "Vidéoprojecteurs Portables 4K",
      desc: "Transformez n'importe quel mur blanc ou plafond en écran géant de 120 pouces.",
      badge: "Immersion Totale",
      icon: "📽️",
      query: "videoprojecteur portable cinema maison 4k",
      cta: "Voir les projecteurs",
    },
    {
      title: "Fire TV Stick 4K Max & Boîtiers",
      desc: "Toutes vos plateformes (Netflix, Prime, Canal+, Disney+) en 4K Dolby Vision avec télécommande vocale.",
      badge: "Incontournable",
      icon: "📺",
      query: "fire tv stick 4k max boitier streaming",
      cta: "Découvrir les boîtiers",
    },
    {
      title: "Barres de Son Dolby Atmos",
      desc: "L'acoustique enveloppante de la salle obscure sans encombrer votre salon de câbles.",
      badge: "Son Cinéma",
      icon: "🔊",
      query: "barre de son dolby atmos home cinema",
      cta: "Explorer le son",
    },
    {
      title: "Casques TV & Audio Spatial",
      desc: "Vivez vos séances nocturnes à plein volume sans réveiller personne autour de vous.",
      badge: "Séance Nocturne",
      icon: "🎧",
      query: "casque sans fil home cinema tv audio spatial",
      cta: "Choisir un casque",
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-18" aria-label="Équipement cinéma à domicile">
      <Reveal y={16}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium mb-2">
              <span>🍿 Confort Canapé</span>
              <span>•</span>
              <span>Home-Cinéma</span>
            </div>
            <SectionTitle>Le Coin Salon Cinéphile</SectionTitle>
            <p className="mt-1 text-xs sm:text-sm text-white/60 max-w-2xl leading-relaxed">
              Pour profiter de vos séances comme en salle : vidéoprojecteurs, son immersif et boîtiers de streaming recommandés.
            </p>
          </div>
          <span className="text-[11px] font-mono text-white/40">Sélection Partenaire Amazon</span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gearItems.map((item, idx) => (
          <Reveal key={item.title} y={16} delay={idx * 0.05}>
            <a
              href={makeUrl(item.query)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex flex-col justify-between h-full p-5 sm:p-6 rounded-3xl bg-[#161423]/90 hover:bg-[#1d1a2f] border border-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3.5">
                  <span className="text-3xl" role="img" aria-hidden="true">{item.icon}</span>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/70">
                    {item.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-base text-white group-hover:text-cine-soft transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-white/80 group-hover:text-white">
                <span>{item.cta}</span>
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
