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
            <strong>Mode Soirée Duo (Swipe à deux)</strong> : lors d'une session partagée, un code de salon temporaire (6 caractères cryptographiques) est généré pour synchroniser les votes en direct. Ces salons expirent automatiquement après 2 heures et aucune donnée n'est conservée.
          </li>
          <li>
            <strong>Mesure d'audience et cookies</strong> : {analyticsEnabled
              ? "une mesure d'audience anonymisée peut être activée après votre accord explicite."
              : "aucune mesure d'audience intrusive n'est active par défaut. Vos choix sont modifiables à tout moment via la bannière de consentement."}
          </li>
        </ul>
      ),
    },
    {
      title: "Cookies, traceurs et régie publicitaire",
      body: (
        <>
          <p>
            Conformément aux directives de la CNIL et à la directive ePrivacy, <strong>aucun cookie publicitaire ni traceur tiers n'est déposé avant votre accord explicite</strong>.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Google AdSense</strong> : conditionné à votre consentement via notre bannière. En cas de refus, aucun appel réseau vers la régie publicitaire n'est effectué. En cas d'acceptation, des cookies d'affichage contextuel peuvent être déposés pour assurer la rémunération de l'hébergeur.
            </li>
            <li>
              <strong>Stockage local fonctionnel</strong> : enregistre vos films vus, à voir, notes et réglages d'accessibilité sans aucun cookie traceur.
            </li>
            <li>
              <strong>Bandes-annonces YouTube</strong> : intégrées via le domaine de confidentialité renforcée (<code>youtube-nocookie.com</code>), ne déposant pas de cookies préalables.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Services tiers et sous-traitants techniques",
      body: (
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>The Movie Database (TMDB)</strong> : métadonnées et affiches cinématographiques, relayées de façon sécurisée par notre serveur proxy pour protéger les clés d'API.
          </li>
          <li>
            <strong>OpenStreetMap / Overpass API</strong> : localisation géographique des salles de cinéma à proximité immédiate.
          </li>
          <li>
            <strong>YouTube (Google LLC)</strong> : lecture des bandes-annonces officielles à la demande.
          </li>
          <li>
            <strong>Vercel Inc.</strong> : hébergement de l'infrastructure web, fonctions serverless et distribution CDN sécurisée HTTPS.
          </li>
          <li>
            <strong>Google AdSense (Google LLC)</strong> : régie publicitaire sous réserve de consentement préalable.
          </li>
          <li>
            <strong>Amazon Partenaires (Amazon Europe Core S.à r.l.)</strong> : redirection vers les offres d'achat, de location VOD et équipements home-cinéma.
          </li>
        </ul>
      ),
    },
    {
      title: "Transferts de données hors Union Européenne (RGPD Chapitre V)",
      body: (
        <div className="space-y-2">
          <p>
            Certains prestataires techniques indispensables au fonctionnement du service sont établis aux États-Unis (notamment <strong>Vercel Inc.</strong> pour l'hébergement réseau et <strong>Google LLC</strong> pour YouTube et la régie AdSense sous consentement).
          </p>
          <p>
            Ces transferts de données sont strictement encadrés conformément au Chapitre V du RGPD par :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              La <strong>décision d'adéquation de la Commission Européenne du 10 juillet 2023</strong> (EU-U.S. Data Privacy Framework — DPF), sous laquelle ces entités sont certifiées ;
            </li>
            <li>
              Et/ou les <strong>Clauses Contractuelles Types (CCT / SCC)</strong> adoptées par la Commission Européenne dans les accords de traitement des données (DPA) souscrits avec ces hébergeurs.
            </li>
          </ul>
        </div>
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
      description="Transparence sur l'utilisation des données, l'architecture locale et vos droits RGPD sur CineViseur."
      sections={sections}
    />
  );
}