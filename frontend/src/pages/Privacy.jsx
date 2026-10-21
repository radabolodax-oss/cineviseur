import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";
import { SITE, analyticsEnabled } from "../lib/site";

export default function Privacy() {
  const sections = [
    {
      title: "Responsable du traitement",
      body: (
        <p>
          Le responsable du traitement est <strong>{SITE.editor}</strong>, joignable à l'adresse{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="underline text-cine-emerald">
            {SITE.contactEmail}
          </a>
          . Cette politique détaille de manière transparente les données utilisées par CineViseur, leur finalité, leur durée de
          conservation et l'exercice de vos droits (Règlement Général sur la Protection des Données — RGPD).
        </p>
      ),
    },
    {
      title: "Architecture 100% Local-First (Aucun compte serveur requis)",
      body: (
        <>
          <p>
            CineViseur a été conçu selon le principe de minimisation stricte des données (« Privacy by Design »).
            <strong> Aucun compte serveur n'est nécessaire pour utiliser le service</strong> :
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Vos listes et préférences</strong> (films à voir, vus, notes personnelles, filtres de plateformes streaming)
              sont stockées <strong>exclusivement dans votre navigateur</strong> via le stockage local (<code>localStorage</code>).
            </li>
            <li>
              CineViseur ne possède pas de base de données d'utilisateurs nominative : aucun mot de passe, nom ou adresse postale n'est enregistré sur nos serveurs.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Fonctionnalités spécifiques et données ponctuelles",
      body: (
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Recherche de cinémas proches</strong> : lorsque vous cliquez sur « Utiliser ma position », votre navigateur sollicite votre autorisation de géolocalisation. Vos coordonnées GPS servent uniquement à interroger les serveurs cartographiques (OpenStreetMap / Overpass) et <strong>ne sont jamais enregistrées ni conservées</strong>.
          </li>
          <li>
            <strong>Mode Soirée Duo (Swipe à deux)</strong> : lors d'une session partagée, un code de salon éphémère est généré pour synchroniser les votes en direct. Ces données de session temporaires expirent et sont effacées à la clôture de la session.
          </li>
          <li>
            <strong>Mesure d'audience et cookies</strong> : {analyticsEnabled
              ? "une mesure d'audience anonymisée et respectueuse de la vie privée peut être activée selon vos préférences de cookies."
              : "aucune mesure d'audience intrusive n'est active par défaut. Vous gardez la main sur vos préférences à tout moment."}
          </li>
        </ul>
      ),
    },
    {
      title: "Cookies et stockage local",
      body: (
        <>
          <p>CineViseur n'exploite aucun cookie publicitaire tiers intrusif à des fins de pistage transversal. Votre navigateur conserve :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Vos choix de consentement (bannière de cookies et préférences) ;</li>
            <li>Vos listes de visionnage, notes et progression de séries (stockage local) ;</li>
            <li>Vos réglages d'accessibilité et d'effets sonores.</li>
          </ul>
          <p className="mt-2">
            Les bandes-annonces sont intégrées via le domaine <strong>youtube-nocookie.com</strong> (mode de confidentialité renforcée), qui limite le dépôt de cookies tant que vous ne lancez pas activement la lecture vidéo.
          </p>
        </>
      ),
    },
    {
      title: "Services tiers et sous-traitants techniques",
      body: (
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>The Movie Database (TMDB)</strong> : fourniture des fiches, métadonnées, casting et affiches cinématographiques. Les visuels sont chargés depuis leurs serveurs de distribution (CDN).
          </li>
          <li>
            <strong>OpenStreetMap / Overpass API</strong> : localisation géographique des salles de cinéma à proximité immédiate.
          </li>
          <li>
            <strong>YouTube (Google LLC)</strong> : lecture des bandes-annonces officielles à la demande de l'utilisateur.
          </li>
          <li>
            <strong>Vercel Inc.</strong> : hébergement de l'infrastructure web, distribution de contenu et sécurité réseau HTTPS.
          </li>
        </ul>
      ),
    },
    {
      title: "Contrôle, export et suppression de vos données",
      body: (
        <>
          <p>
            Vous conservez à tout moment la maîtrise absolue de vos données :
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Export de votre bibliothèque</strong> : rendez-vous dans <Link to="/profile" className="underline text-cine-emerald">Mon espace / Réglages</Link> pour télécharger l'ensemble de vos données au format JSON ou CSV d'un simple clic.
            </li>
            <li>
              <strong>Suppression instantanée</strong> : vous pouvez effacer l'intégralité de votre bibliothèque et de vos préférences locales en un clic depuis cette même page ou en vidant les données de navigation de votre navigateur.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Vos droits (RGPD)",
      body: (
        <>
          <p>
            Conformément aux articles 15 à 22 du RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données. Pour toute interrogation ou demande d'assistance, vous pouvez contacter :{" "}
            <strong>{SITE.contactEmail}</strong>.
          </p>
          <p className="mt-2">
            Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :{" "}
            <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="underline text-cine-emerald">
              cnil.fr/fr/plaintes
            </a>.
          </p>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      title="Politique de confidentialité"
      description="Transparence sur l'utilisation des données, l'architecture 100% locale et vos droits RGPD sur CineViseur."
      sections={sections}
    />
  );
}
