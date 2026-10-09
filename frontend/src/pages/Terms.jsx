import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";
import { SITE } from "../lib/site";

export default function Terms() {
  const sections = [
    {
      title: "Objet",
      body: (
        <p>
          Ces conditions générales d'utilisation (CGU) encadrent l'utilisation de CineViseur, un service gratuit qui permet
          de suivre les films et séries que tu regardes, de recevoir des alertes de sortie et de trouver des cinémas
          proches. En créant un compte, tu acceptes ces conditions.
        </p>
      ),
    },
    {
      title: "Accès au service",
      body: (
        <p>
          Le catalogue est consultable sans compte. La liste, les alertes et les notes nécessitent un compte. Le service est
          fourni tel quel : nous faisons notre possible pour qu'il reste disponible, sans garantie de disponibilité continue.
        </p>
      ),
    },
    {
      title: "Ton compte",
      body: (
        <ul>
          <li>Tu fournis une adresse email valide et tu gardes ton mot de passe secret.</li>
          <li>Un compte est personnel. Tu es responsable de ce qui est fait avec.</li>
          <li>Tu peux supprimer ton compte à tout moment depuis ton profil.</li>
        </ul>
      ),
    },
    {
      title: "Usages interdits",
      body: (
        <ul>
          <li>Créer des comptes de façon automatisée ou en masse.</li>
          <li>Tenter de contourner les protections du service ou d'accéder aux données d'autres utilisateurs.</li>
          <li>Utiliser le service pour une activité illégale.</li>
        </ul>
      ),
    },
    {
      title: "Contenus",
      body: (
        <p>
          Les informations, affiches et images des films et séries proviennent de TMDB (The Movie Database). Ce produit
          utilise l'API TMDB sans être approuvé ni certifié par TMDB. Les bandes-annonces sont hébergées par YouTube. Ces
          contenus restent la propriété de leurs ayants droit.
        </p>
      ),
    },
    {
      title: "Responsabilité",
      body: (
        <p>
          Les dates de sortie et informations proviennent de sources tierces et peuvent changer. CineViseur ne peut être tenu
          responsable d'une erreur dans ces données ni d'une interruption du service.
        </p>
      ),
    },
    {
      title: "Suspension et résiliation",
      body: (
        <p>
          En cas de non-respect de ces conditions, un compte peut être suspendu ou supprimé. Tu peux toi-même mettre fin au
          service à tout moment en supprimant ton compte.
        </p>
      ),
    },
    {
      title: "Données personnelles",
      body: (
        <p>
          Le traitement de tes données est décrit dans la <Link to="/confidentialite">politique de confidentialité</Link>.
        </p>
      ),
    },
    {
      title: "Modification des conditions",
      body: <p>Ces conditions peuvent évoluer. La date de mise à jour en haut de page indique la version en vigueur.</p>,
    },
    {
      title: "Droit applicable et contact",
      body: (
        <p>
          Ces conditions sont soumises au droit français. Pour toute question : <strong>{SITE.contactEmail}</strong>.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      description="Les règles d'utilisation de CineViseur : compte, usages interdits, contenus et responsabilités."
      sections={sections}
    />
  );
}
