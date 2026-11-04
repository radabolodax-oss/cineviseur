// Inventaire des emplacements sponsorisés directs (modèle « encart partenaire »).
// Un emplacement = une liste de sponsors ; la rotation change chaque jour, sans rechargement intempestif.
// Pour vendre une place, il suffit d'ajouter une entrée ici (ou de remplacer « yourbrand »).
import { AFFILIATE } from "./site";

const amazonUrl = (query) =>
  `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(AFFILIATE.amazonTag || "cineviseur-21")}`;

export const SPONSORS = [
  {
    id: "nordvpn",
    name: "NordVPN",
    headline: "Vos plateformes, où que vous soyez",
    description: "Le catalogue de votre pays, même en voyage. 30 jours satisfait ou remboursé.",
    cta: "Voir l'offre",
    url: AFFILIATE.vpnUrl || "https://nordvpn.com/fr/special-offer/",
    icon: "sparkle",
    accent: "from-sky-500/25 to-cyan-500/10",
    ring: "border-sky-400/25",
    text: "text-sky-200",
  },
  {
    id: "amazon",
    name: "Amazon",
    headline: "Coffrets cinéma et places de séance",
    description: "Des places valables dans plus de 1 800 salles, livrées chez vous.",
    cta: "Découvrir",
    url: amazonUrl("coffret cinema places de cinema"),
    icon: "popcorn",
    accent: "from-amber-500/25 to-orange-500/10",
    ring: "border-amber-400/25",
    text: "text-amber-200",
  },
  {
    id: "yourbrand",
    name: "Votre marque",
    headline: "Cet encart est à louer",
    description: "Un emplacement vu par des cinéphiles français, à partir de 45 € par mois.",
    cta: "Nous écrire",
    url: "/contact?category=partenariat",
    internal: true,
    icon: "aperture",
    accent: "from-rose-500/25 to-fuchsia-500/10",
    ring: "border-rose-400/25",
    text: "text-rose-200",
  },
];

// Emplacements disponibles dans le site : l'ordre définit l'alternance.
const PLACEMENTS = {
  home: ["nordvpn", "amazon", "yourbrand"],
  discover: ["yourbrand", "amazon", "nordvpn"],
  detail: ["nordvpn", "yourbrand"],
  search: ["amazon", "yourbrand"],
  cinemas: ["amazon", "yourbrand"],
};

const daySeed = () => Math.floor(Date.now() / 86400000);

const placementSeed = (placement) =>
  [...placement].reduce((total, char) => total + char.charCodeAt(0), 0);

/** Sponsor du jour pour un emplacement donné. */
export function pickSponsor(placement = "home") {
  const ids = PLACEMENTS[placement] || PLACEMENTS.home;
  if (!ids.length) return null;
  const id = ids[(daySeed() + placementSeed(placement)) % ids.length];
  return SPONSORS.find((sponsor) => sponsor.id === id) || null;
}
