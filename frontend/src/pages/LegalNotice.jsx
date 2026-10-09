import LegalPage from "../components/LegalPage";
import { SITE } from "../lib/site";

export default function LegalNotice() {
  const sections = [
    {
      title: "Éditeur du site",
      body: (
        <ul>
          <li>Éditeur et directeur de la publication : <strong>{SITE.editor}</strong></li>
          <li>Adresse : {SITE.editorAddress}</li>
          <li>Contact : {SITE.contactEmail}</li>
        </ul>
      ),
    },
    {
      title: "Hébergement",
      body: <p>{SITE.host}</p>,
    },
    {
      title: "Propriété intellectuelle",
      body: (
        <p>
          Le nom CineViseur, le logo et le code du site appartiennent à leur éditeur. Les données et images des films et
          séries proviennent de TMDB et restent la propriété de leurs ayants droit.
        </p>
      ),
    },
  ];

  return (
    <LegalPage title="Mentions légales" description="Éditeur, hébergeur et propriété intellectuelle de CineViseur." sections={sections} />
  );
}
