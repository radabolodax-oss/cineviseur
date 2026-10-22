import LegalPage from "../components/LegalPage";
import { SITE } from "../lib/site";

export default function LegalNotice() {
  const sections = [
    {
      title: "Éditeur du site et direction de publication",
      body: (
        <div className="space-y-3">
          <p>
            Le site internet accessible à l'adresse <strong>{SITE.url}</strong> est édité par :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Éditeur : <strong>CineViseur</strong></li>
            <li>Statut juridique : <strong>Particulier / Édition non professionnelle</strong> au sens de l'article 6-III-2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).</li>
            <li>Direction de la publication : Le créateur et responsable éditorial indépendant de CineViseur.</li>
            <li>Localisation : {SITE.editorAddress}</li>
            <li>
              Contact électronique :{" "}
              <a href={`mailto:${SITE.contactEmail}`} className="text-emerald-400 hover:underline">
                {SITE.contactEmail}
              </a>
            </li>
          </ul>
          <p className="text-xs text-white/60">
            Conformément à l'article 6-III-2 de la loi LCEN, les coordonnées personnelles d'identification de l'auteur ont été régulièrement communiquées et certifiées auprès de la société d'hébergement.
          </p>
        </div>
      ),
    },
    {
      title: "Hébergement de l'application",
      body: (
        <div className="space-y-2">
          <p>
            L'infrastructure d'hébergement, la distribution de contenu par réseau CDN et les fonctions serverless sont fournies par :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Société : <strong>Vercel Inc.</strong></li>
            <li>Adresse postale : 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
            <li>Téléphone : +1 (951) 383-6898</li>
            <li>Site officiel et formulaire de signalement : <a href="https://vercel.com/contact" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">vercel.com/contact</a></li>
          </ul>
        </div>
      ),
    },
    {
      title: "Propriété intellectuelle et sources de données",
      body: (
        <div className="space-y-3">
          <p>
            La marque CineViseur, sa charte graphique, son architecture logicielle, ses logos et ses interfaces interactives sont protégés par le Code de la Propriété Intellectuelle et constituent la création exclusive de leur auteur.
          </p>
          <p>
            Les métadonnées, synopsis, affiches et visuels de films et séries proviennent de l'API communautaire <strong>The Movie Database (TMDB)</strong>. CineViseur utilise l'API TMDB sans être sponsorisé ni certifié directement par TMDB. Les droits d'auteur des œuvres cinématographiques et audiovisuelles demeurent la propriété exclusive de leurs producteurs, distributeurs et ayants droit respectifs.
          </p>
          <p>
            Les bandes-annonces sont intégrées via le lecteur sans cookie publicitaire préalable <strong>YouTube (Google LLC)</strong>. Les données cartographiques des cinémas proviennent de la base libre <strong>OpenStreetMap</strong> via l'API Overpass.
          </p>
        </div>
      ),
    },
    {
      title: "Programmes d'affiliation et partenariats",
      body: (
        <p>
          En tant que Partenaire Amazon, CineViseur réalise un bénéfice sur les achats et inscriptions éligibles remplissant les conditions requises (notamment via le tag partenaire <code>cineviseur-21</code>). Certains liens de redirection vers les services de streaming légal (Amazon Prime Video, Apple TV), les équipements home-cinéma et les coffrets cinémas sont des liens partenaires affiliés. Ils permettent de financer le serveur sans surcoût pour l'utilisateur.
        </p>
      ),
    },
    {
      title: "Notification de contenu illicite",
      body: (
        <p>
          Conformément à l'article 6-I-7 de la LCEN, toute personne constatant un contenu présumé illicite ou portant atteinte à ses droits peut le notifier sans délai à l'adresse{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-emerald-400 hover:underline">
            {SITE.contactEmail}
          </a>
          . Le message fera l'objet d'un examen et d'un traitement diligent sous 48 heures ouvrées.
        </p>
      ),
    },
  ];

  return (
    <LegalPage title="Mentions légales" description="Éditeur, hébergeur et cadre réglementaire LCEN de CineViseur." sections={sections} />
  );
}