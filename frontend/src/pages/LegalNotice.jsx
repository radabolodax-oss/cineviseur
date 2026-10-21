import LegalPage from "../components/LegalPage";
import { SITE } from "../lib/site";

export default function LegalNotice() {
  const sections = [
    {
      title: "Éditeur du site",
      body: (
        <ul className="space-y-1">
          <li>Éditeur et direction de publication : <strong>{SITE.editor}</strong></li>
          <li>Localisation : {SITE.editorAddress}</li>
          <li>Contact électronique : <a href={`mailto:${SITE.contactEmail}`} className="text-emerald-400 hover:underline">{SITE.contactEmail}</a></li>
        </ul>
      ),
    },
    {
      title: "Hébergement de l'application",
      body: (
        <p>
          Le site et ses API de synchronisation sont hébergés par la société <strong>{SITE.host}</strong> (infrastructure mondiale sécurisée avec CDN européen).
        </p>
      ),
    },
    {
      title: "Propriété intellectuelle et sources de données",
      body: (
        <div className="space-y-3">
          <p>
            La marque CineViseur, son logo, son architecture logicielle et son interface sont la propriété exclusive de leur auteur.
          </p>
          <p>
            Les métadonnées, affiches, résumés et images de films et séries proviennent de l'API publique <strong>The Movie Database (TMDB)</strong>. Ce produit utilise l'API TMDB sans être certifié ni approuvé directement par TMDB. Les droits de propriété intellectuelle des œuvres représentées demeurent la propriété de leurs producteurs et ayants droit respectifs.
          </p>
          <p>
            Les bandes-annonces vidéo sont intégrées via le service d'intégration respectueux de la vie privée <strong>YouTube (Google LLC)</strong> sans dépôt de cookies publicitaires préalables.
          </p>
        </div>
      ),
    },
  ];

  return (
    <LegalPage title="Mentions légales" description="Éditeur, hébergeur et propriété intellectuelle de CineViseur." sections={sections} />
  );
}
