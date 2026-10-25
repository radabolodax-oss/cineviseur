// Garde-fou de déploiement.
//
// La clé TMDB n'est plus écrite en dur dans les fonctions serverless : elle doit venir
// de l'environnement. Sans elle, /api/tmdb/* ne peut plus charger le catalogue, donc on
// arrête le déploiement tout de suite au lieu de publier un site aux affiches vides.
//
// En local, on se contente d'un avertissement : le build Vite reste utilisable même si
// la personne développe sans clé (les appels TMDB partent alors vers l'API de production).

const deployTarget = process.env.VERCEL === "1" ? "Vercel" : process.env.NETLIFY === "true" ? "Netlify" : null;
const hasKey = Boolean((process.env.TMDB_API_KEY || "").trim());

if (hasKey) {
  process.exit(0);
}

const where = deployTarget
  ? `${deployTarget} → réglages du projet → Environment Variables`
  : "ton fichier .env local (ou les variables du projet en ligne)";

console.error(
  [
    "",
    "[CineViseur] TMDB_API_KEY est absente de l'environnement de build.",
    "  Sans elle, /api/tmdb/* répond « TMDB_API_KEY manquante » au lieu de charger le catalogue.",
    `  Ajoute TMDB_API_KEY dans ${where}, puis relance le build.`,
    "",
  ].join("\n")
);

// Sur Vercel et Netlify, on bloque le déploiement : mieux vaut un build rouge qu'un site cassé.
if (deployTarget) process.exit(1);
