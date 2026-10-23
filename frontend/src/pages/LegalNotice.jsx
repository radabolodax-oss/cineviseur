import LegalPage from "../components/LegalPage";
import { SITE } from "../lib/site";

export default function LegalNotice() {
  const sections = [
    {
      title: "1. Éditeur du site et direction de publication",
      body: (
        <div className="space-y-3">
          <p>
            Le service de communication au public en ligne accessible à l'adresse <strong>{SITE.url}</strong> est édité par :
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Dénomination du service :</strong> CineViseur</li>
            <li>
              <strong>Statut de l'éditeur :</strong> Personne physique éditant à titre non professionnel / Particulier, conformément aux dispositions expresses de l'<strong>article 6-III-2 de la loi n° 2004-575 du 21 juin 2004</strong> pour la confiance dans l'économie numérique (LCEN).
            </li>
            <li>
              <strong>Direction de la publication :</strong> La direction de la publication est assurée par le créateur et responsable éditorial indépendant du projet CineViseur.
            </li>
            <li>
              <strong>Préservation de l'anonymat & Identification légale :</strong> Conformément à l'article 6-III-2 de la loi LCEN, les éléments d'identification personnelle (nom patronymique, prénom et adresse postale du domicile) ont été régulièrement transmis, enregistrés et certifiés auprès de la société d'hébergement ci-après mentionnée, qui est habilitée à les communiquer sur réquisition des autorités judiciaires.
            </li>
            <li>
              <strong>Contact de l'éditeur :</strong> Via le formulaire sécurisé accessible à la rubrique <a href="/contact" className="text-emerald-400 hover:underline">/contact</a> ou à l'adresse électronique dédiée : <a href={`mailto:${SITE.contactEmail}`} className="text-emerald-400 hover:underline">{SITE.contactEmail}</a>.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "2. Hébergement de l'application et de l'infrastructure",
      body: (
        <div className="space-y-2">
          <p>
            L'infrastructure d'hébergement, la distribution de contenu par réseau mondial (CDN européen) et les fonctions serverless sont assurées par :
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Raison sociale de l'hébergeur :</strong> Vercel Inc.</li>
            <li><strong>Adresse du siège social :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis d'Amérique</li>
            <li><strong>Téléphone du service d'hébergement :</strong> +1 (951) 383-6898</li>
            <li><strong>Signalement d'abus & contact hébergeur :</strong> <a href="https://vercel.com/contact" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">vercel.com/contact</a></li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. Encadrement des transferts de données hors UE (RGPD Chapitre V)",
      body: (
        <div className="space-y-2">
          <p>
            CineViseur privilégie le traitement local des données (stockage <code>localStorage</code> sur votre navigateur) et ne recourt à aucun intermédiaire tiers non souverain pour ses formulaires.
          </p>
          <p>
            Pour les prestations techniques indispensables d'hébergement réseau (Vercel Inc.) et de diffusion vidéo (YouTube / Google LLC) :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Ces entités sont certifiées sous la <strong>décision d'adéquation de la Commission Européenne du 10 juillet 2023</strong> (Cadre de protection des données UE-États-Unis / <em>EU-U.S. Data Privacy Framework — DPF</em>).
            </li>
            <li>
              Les transferts techniques sont en outre régis par les <strong>Clauses Contractuelles Types (CCT / SCC)</strong> de la Commission Européenne intégrées aux accords de traitement des données (DPA).
            </li>
            <li>
              Le formulaire de contact du site est hébergé sur une fonction serverless européenne sans sous-traitant tiers de collecte.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "4. Propriété intellectuelle et sources de données",
      body: (
        <div className="space-y-3">
          <p>
            L'architecture applicative, le code source, la marque CineViseur et l'interface utilisateur sont protégés par le Code de la Propriété Intellectuelle et constituent la propriété exclusive de leur auteur.
          </p>
          <p>
            Les métadonnées, titres originaux, résumés et affiches de films proviennent de l'API communautaire <strong>The Movie Database (TMDB)</strong>. CineViseur utilise l'API TMDB sans être sponsorisé ni certifié directement par TMDB. Les droits patrimoniaux et moraux des œuvres cinématographiques demeurent la propriété exclusive de leurs producteurs et ayants droit.
          </p>
          <p>
            Les données cartographiques des cinémas proviennent de la base contributive libre <strong>OpenStreetMap (OSM)</strong> via l'API Overpass.
          </p>
        </div>
      ),
    },
    {
      title: "5. Affiliation et partenariats rémunérés",
      body: (
        <p>
          En tant que Partenaire Amazon, CineViseur réalise un bénéfice sur les achats éligibles remplissant les conditions requises (identifiant partenaire <code>cineviseur-21</code>). Certains liens de redirection vers les catalogues légaux de streaming (Amazon Prime Video, Apple TV) ou le matériel home-cinéma sont des liens partenaires affiliés finançant le futur hébergement de la plateforme sans coût additionnel pour l'utilisateur.
        </p>
      ),
    },
    {
      title: "6. Notification de contenu illicite (LCEN art. 6-I-7)",
      body: (
        <p>
          Toute personne constatant un contenu illicite ou portant atteinte à ses droits peut le notifier à tout moment à l'adresse{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-emerald-400 hover:underline">
            {SITE.contactEmail}
          </a>
          . Le signalement fera l'objet d'un accusé de réception et d'un traitement diligent sous 48 heures ouvrées.
        </p>
      ),
    },
  ];

  return (
    <LegalPage title="Mentions légales" description="Éditeur, hébergeur et cadre réglementaire LCEN et RGPD de CineViseur." sections={sections} />
  );
}