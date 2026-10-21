import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";
import { SITE } from "../lib/site";

export default function Terms() {
  const sections = [
    {
      title: "Objet",
      body: (
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) encadrent l'accès et l'utilisation de <strong>CineViseur</strong>,
          un guide et mémo cinématographique gratuit permettant de découvrir des œuvres (films et séries), d'organiser sa liste
          de visionnage personnelle, de trouver des idées de visionnage seul ou à deux via le mode Soirée Duo, et de localiser
          les salles de cinéma à proximité.
        </p>
      ),
    },
    {
      title: "Accès au service (Sans inscription obligatoire)",
      body: (
        <p>
          L'accès à CineViseur est entièrement libre et gratuit. Aucun compte serveur obligatoire ni abonnement payant n'est
          requis pour profiter du catalogue, gérer sa liste de visionnage, noter des œuvres ou utiliser les outils de sélection.
          Le service est fourni en l'état (« as is ») et nous œuvrons continuellement à maintenir sa disponibilité et sa fluidité.
        </p>
      ),
    },
    {
      title: "Gestion des données locales et sauvegarde",
      body: (
        <p>
          Toutes les listes, historiques et notes sont conservés directement dans la mémoire de votre navigateur (stockage local).
          L'utilisateur est responsable de la conservation de ses données : il lui est recommandé d'utiliser l'outil d'export
          (JSON/CSV) accessible dans la section <Link to="/profile" className="underline text-cine-emerald">Mon espace</Link> s'il
          souhaite transférer ou sauvegarder sa bibliothèque avant de vider son cache de navigation.
        </p>
      ),
    },
    {
      title: "Propriété intellectuelle et sources tierces",
      body: (
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Métadonnées et visuels</strong> : Les informations, affiches, synopsis et photos des films et séries
            proviennent de l'API The Movie Database (TMDB). Ce produit utilise l'API TMDB mais n'est ni certifié ni approuvé
            par TMDB. L'ensemble de ces contenus demeure la propriété exclusive de leurs ayants droit respectifs.
          </li>
          <li>
            <strong>Bandes-annonces</strong> : Les vidéos et bandes-annonces sont hébergées et diffusées par YouTube (Google LLC)
            selon leurs conditions de service.
          </li>
          <li>
            <strong>Interface et code</strong> : Les éléments graphiques originaux, logos, code source et fonctionnalités de
            CineViseur sont protégés par le droit de la propriété intellectuelle.
          </li>
        </ul>
      ),
    },
    {
      title: "Usages interdits",
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Toute extraction massive automatisée (scraping intensif) susceptible d'altérer la performance des serveurs ou des API tierces.</li>
          <li>Toute tentative d'intrusion, de contournement des mesures de sécurité ou de dégradation du service.</li>
          <li>L'utilisation du service pour des finalités illégales ou contraires à l'ordre public.</li>
        </ul>
      ),
    },
    {
      title: "Responsabilité",
      body: (
        <p>
          Les dates de sortie en salles, disponibilités sur plateformes et fiches techniques sont fournies à titre indicatif selon
          les données transmises par nos partenaires tiers. CineViseur ne saurait être tenu responsable d'éventuelles inexactitudes,
          de retards de programmation en salles ou d'interruptions ponctuelles des services tiers.
        </p>
      ),
    },
    {
      title: "Protection des données personnelles",
      body: (
        <p>
          Pour en savoir plus sur notre engagement de transparence et la protection de vos données, consultez notre{" "}
          <Link to="/confidentialite" className="underline text-cine-emerald">
            politique de confidentialité
          </Link>.
        </p>
      ),
    },
    {
      title: "Évolution des conditions et droit applicable",
      body: (
        <p>
          CineViseur se réserve le droit d'adapter ces conditions pour refléter les évolutions techniques ou réglementaires.
          Les présentes conditions sont régies par le droit français. Pour toute question :{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="underline text-cine-emerald">
            {SITE.contactEmail}
          </a>.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      description="Les modalités d'utilisation de la plateforme CineViseur, nos engagements et le respect des droits d'auteur."
      sections={sections}
    />
  );
}
