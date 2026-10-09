import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";
import { SITE, analyticsEnabled } from "../lib/site";

export default function Privacy() {
  const sections = [
    {
      title: "Qui est responsable de tes données",
      body: (
        <p>
          Le responsable du traitement est <strong>{SITE.editor}</strong>, joignable à{" "}
          <strong>{SITE.contactEmail}</strong>. Cette page explique quelles données CineViseur utilise, pourquoi, combien de
          temps, et comment exercer tes droits (Règlement général sur la protection des données, RGPD).
        </p>
      ),
    },
    {
      title: "Les données que nous collectons",
      body: (
        <ul>
          <li>
            <strong>Ton compte</strong> : nom, adresse email, mot de passe (stocké uniquement sous forme chiffrée par hachage
            bcrypt, jamais en clair) et date d'acceptation des conditions d'utilisation.
          </li>
          <li>
            <strong>Ton utilisation</strong> : les films et séries de ta liste (à voir, vus), tes alertes de sortie et tes notes.
          </li>
          <li>
            <strong>Ta position</strong>, seulement quand tu cliques sur « Utiliser ma position » dans la page Cinémas. Elle
            sert à chercher les salles proches et <strong>n'est pas enregistrée</strong>.
          </li>
        </ul>
      ),
    },
    {
      title: "Pourquoi et sur quelle base légale",
      body: (
        <ul>
          <li>Faire fonctionner ton compte, ta liste et tes alertes : exécution du service que tu as demandé (art. 6.1.b RGPD).</li>
          <li>Trouver les cinémas autour de toi : ton consentement, donné par l'autorisation de géolocalisation du navigateur (art. 6.1.a).</li>
          <li>
            Mesurer l'audience du site :{" "}
            {analyticsEnabled
              ? "ton consentement, donné via la bannière de cookies, que tu peux retirer à tout moment (art. 6.1.a)."
              : "aucune mesure d'audience n'est active pour le moment."}
          </li>
          <li>Protéger le service contre les abus (limitation des tentatives de connexion) : intérêt légitime (art. 6.1.f).</li>
        </ul>
      ),
    },
    {
      title: "Cookies et stockage local",
      body: (
        <>
          <p>CineViseur n'utilise aucun cookie publicitaire. Ton navigateur conserve seulement :</p>
          <ul>
            <li>ton jeton de connexion (stockage local), indispensable pour rester connecté ;</li>
            <li>ton choix concernant la mesure d'audience, pour ne pas te le redemander ;</li>
            <li>un indicateur de session pour ne jouer l'animation d'ouverture qu'une fois.</li>
          </ul>
          <p>
            Les bandes-annonces sont lues via le domaine <strong>youtube-nocookie.com</strong>, qui ne dépose pas de cookie
            tant que tu ne lances pas la vidéo.
          </p>
        </>
      ),
    },
    {
      title: "Services tiers",
      body: (
        <ul>
          <li>
            <strong>TMDB</strong> (The Movie Database) : fiches et affiches des films. Les images sont chargées depuis leurs
            serveurs, qui reçoivent donc ton adresse IP.
          </li>
          <li>
            <strong>OpenStreetMap / Overpass</strong> : recherche des cinémas proches. Ta position y est transmise de façon
            ponctuelle. Certains serveurs de secours Overpass peuvent être situés hors de l'Union européenne.
          </li>
          <li>
            <strong>YouTube</strong> (Google) : lecture des bandes-annonces, uniquement quand tu cliques sur « Bande-annonce ».
          </li>
        </ul>
      ),
    },
    {
      title: "Combien de temps nous gardons tes données",
      body: (
        <p>
          Tant que ton compte existe. Quand tu supprimes ton compte, ton nom, ton email, ta liste, tes alertes et tes notes
          sont effacés immédiatement et définitivement.
        </p>
      ),
    },
    {
      title: "Tes droits",
      body: (
        <>
          <p>
            Tu peux accéder à tes données, les corriger, les exporter, t'opposer à un traitement ou demander leur effacement.
            Pour supprimer ton compte toi-même, va dans <Link to="/profile">ton profil</Link>, rubrique « Supprimer mon
            compte ». Pour toute autre demande, écris à <strong>{SITE.contactEmail}</strong> : nous répondons sous un mois.
          </p>
          <p>
            Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL :{" "}
            <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">cnil.fr/fr/plaintes</a>.
          </p>
        </>
      ),
    },
    {
      title: "Hébergement et sécurité",
      body: (
        <p>
          Les données sont hébergées par : <strong>{SITE.host}</strong>. Les échanges avec le site sont chiffrés (HTTPS) et les
          mots de passe sont hachés.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      title="Politique de confidentialité"
      description="Quelles données CineViseur utilise, pourquoi, combien de temps, et comment exercer tes droits RGPD."
      sections={sections}
    />
  );
}
