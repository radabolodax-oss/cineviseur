# CineViseur — kit de promotion et de démarchage annonceurs

Objectif : obtenir sur CineViseur des encarts sponsorisés directs, comme Freebuff en vend à Greptile, Archil, Runable ou ObsessionDB.

---

## 1. Ce qu'on copie vraiment de Freebuff (et ce qu'on ne peut pas copier)

Freebuff vend des encarts texte à des **outils pour développeurs**, parce que son audience est composée de développeurs. CineViseur s'adresse à des **cinéphiles francophones** : les quatre annonceurs cités ci-dessus n'achèteront jamais un emplacement sur un site de films, et il ne faut pas perdre de temps à les démarcher.

Ce qui se transpose, c'est la **mécanique** :

| Ce que fait Freebuff | Équivalent CineViseur |
|---|---|
| Une page publique `/advertisers` avec l'offre et les formats | Une page `/annonceurs` (à créer) |
| Un format unique et lisible (encart texte, lien, accroche) | Encart « Partenaire » en bas de fiche film et dans les listes |
| Un tarif simple (au clic, budget plancher) | Forfait mensuel + option au clic |
| Une preuve d'audience chiffrée | À produire (voir §2) |
| Un contact direct et une réponse rapide | `contact.cineviseur@gmail.com` |

Les prospects réels de CineViseur sont : cinémas indépendants et festivals, boutiques home-cinéma et matériel, plateformes de VOD / ciné-clubs en ligne, VPN et services numériques grand public, newsletters ciné.

---

## 2. Les trois prérequis avant tout démarchage

1. **Mesurer l'audience.** Aujourd'hui `analyticsEnabled` est faux tant que `VITE_ANALYTICS_PROVIDER`, `VITE_ANALYTICS_ID` et `VITE_ANALYTICS_SRC` ne sont pas renseignés : il n'existe donc aucun chiffre à montrer. Brancher une mesure sans cookie (Plausible, Umami ou Vercel Analytics) et attendre 3 à 4 semaines.
2. **Avoir les cinq chiffres que réclame un annonceur** : visites / mois, pages vues, pages les plus vues, provenance (recherche, réseaux, direct), répartition mobile / ordinateur. Sans ça, la négociation se fait à 0 €.
3. **Une page d'offre publique.** Un lien qu'on envoie en un clic vaut mieux qu'un PDF : `/annonceurs` avec les formats, la grille, la jauge d'audience et un bouton vers `/contact` (catégorie « Demande de partenariat / Publicité », déjà prévue dans le formulaire).

À corriger en parallèle : la diffusion AdSense (identifiant de bloc non numérique → réponse 400) et la CSP qui bloque la mesure publicitaire. Un site dont la régie existante ne sert rien ne rassure pas un annonceur direct.

---

## 3. Posts de lancement (copier-coller)

### X / Threads — fil de 3 posts

> 1/ Vingt minutes à faire défiler Netflix pour finir sur un énième épisode de série que tu connais déjà. J'ai construit CineViseur pour arrêter ça : tendances, sorties en salle, plateformes FR, et une liste de films qui vit sans compte.
> cineviseur.vercel.app

> 2/ Pas d'inscription, pas d'e-mail, pas de mot de passe. Ta liste, tes notes et ta progression de séries restent dans ton navigateur. Export JSON ou CSV quand tu veux, import Letterboxd en deux clics. Tes données ne partent nulle part.

> 3/ Le reste : « Ce soir » tire un film au sort (roue, oracle, ou duo à distance avec un ami), les séances près de chez toi avec les formats (IMAX, Dolby, 4DX), et un récap annuel en story à partager. Installable comme une app. Gratuit.

### LinkedIn — angle produit indé

> J'ai mis en ligne CineViseur, un tracker de films et séries pour le public français.
>
> Le parti pris : aucun compte utilisateur. La liste, les notes, les alertes de sortie et la progression des épisodes vivent dans le navigateur. Concrètement, pas de base d'utilisateurs à protéger, pas de mot de passe à gérer, et un export complet à tout moment (JSON/CSV, import Letterboxd).
>
> Côté produit : catalogue TMDB en français, disponibilités par plateforme nettoyées à la main (les faux positifs « Disney+ » sur des films qui n'y sont pas, ça existe), séances réelles avec formats, mode duo à distance, récap annuel exportable en image.
>
> Côté technique : React 19, Vite, PWA, et une API serverless qui ne stocke rien. Site : cineviseur.vercel.app
>
> Curieux d'avoir vos retours, surtout sur la partie « choisir un film à deux ».

### Instagram — légende

> Marre de passer plus de temps à choisir un film qu'à le regarder ?
>
> CineViseur réunit les tendances, les sorties en salle et ce qui est dispo sur tes plateformes, avec une liste qui se souvient de tout — sans créer de compte.
>
> Le bonus qu'on utilise le plus : « Ce soir » tire un film au sort, et le mode duo permet de choisir à deux, chacun sur son téléphone.
>
> Lien en bio. Gratuit, installable, sans inscription.
>
> #cinema #films #series #cinéphile #netflixfrance #primevideo #allocine #sortiecinema

### TikTok / Reels — script 20 s

> **Accroche (0-3 s)** : « Je perds plus de temps à choisir un film qu'à le regarder. »
> **Plan 1 (3-8 s)** : écran de la page « Ce soir », la roue tourne. Voix off : « Du coup j'ai fait une app qui choisit pour moi. »
> **Plan 2 (8-14 s)** : fiche film, les plateformes s'affichent. « Là je vois direct si c'est sur mes abonnements, ou au cinéma près de chez moi. »
> **Plan 3 (14-18 s)** : mode duo, deux téléphones côte à côte. « Et avec un ami, chacun swipe, et on voit ce qu'on a en commun. »
> **CTA (18-20 s)** : « CineViseur, c'est gratuit et sans compte. Lien en bio. »

### Reddit — à manier avec précaution

La plupart des subreddits francophones interdisent l'auto-promotion pure. Choisis un fil où la question est posée (« comment vous choisissez vos films ? ») et réponds avec du contenu utile, le lien en fin de message. Un post « voici mon projet » sera supprimé sur r/france et probablement sur r/CineSeries.

---

## 4. E-mails de démarchage

### A. Cinémas indépendants et festivals

> **Objet : Vos séances mises en avant sur CineViseur (gratuit)**
>
> Bonjour,
>
> Je développe CineViseur, un site qui aide les cinéphiles à choisir quoi voir : les séances proches de chez eux y apparaissent déjà, avec les formats (IMAX, Dolby, 4DX).
>
> Je propose à [nom du cinéma] un encart « Partenaire » sur la fiche des films que vous exploitez, avec votre logo, vos horaires et un lien vers votre billetterie. C'est gratuit le premier mois, sans engagement, et je vous envoie les chiffres de clics à la fin.
>
> Si ça vous intéresse, je vous prépare un aperçu avec un de vos films à l'affiche.
>
> [Prénom], CineViseur — contact.cineviseur@gmail.com

### B. Boutiques et marques home-cinéma

> **Objet : Encart sponsorisé sur CineViseur — cinéphiles français**
>
> Bonjour,
>
> CineViseur est un site français de découverte de films (fiches, séances, plateformes de streaming) dont l'audience est composée de cinéphiles équipés : vidéoprojecteurs, écrans, barres de son.
>
> Je propose un encart « Partenaire » en bas de fiche film, dans la section équipement : visuel, accroche, lien vers votre boutique. Forfait mensuel, [X] € pour le lancement, rapport de clics fourni chaque mois.
>
> Je peux vous envoyer la jauge d'audience des 30 derniers jours avant toute décision.
>
> [Prénom], CineViseur — contact.cineviseur@gmail.com

### C. Newsletters ciné, créateurs, ciné-clubs (échange, pas d'argent)

> **Objet : Échange de visibilité — CineViseur × [média]**
>
> Bonjour,
>
> Je m'occupe de CineViseur, un outil gratuit de découverte de films pour le public français. Je propose un échange simple : je mets en avant votre newsletter dans la section « Explorer » des fiches film, vous mentionnez CineViseur dans une édition. Aucun budget, juste deux audiences qui se ressemblent.
>
> Je peux vous envoyer les chiffres de clics après deux semaines pour que vous jugiez.

---

## 5. Grille tarifaire de départ

Fourchettes indicatives pour un site jeune, à ajuster après les premiers chiffres réels. Ne jamais annoncer un volume de trafic que tu n'as pas mesuré.

| Emplacement | Format | Prix de lancement |
|---|---|---|
| Encart « Partenaire » bas de fiche film | Texte + logo + lien | 45 €/mois (puis 90 €) |
| Encart section équipement home-cinéma | Visuel + lien affilié | 60 €/mois |
| Séance / événement d'un cinéma | Logo + horaires + lien billetterie | 30 €/mois par salle, 1er mois offert |
| Post dédié Instagram ou TikTok | Visuel + légende | 60 € |
| Display au CPM (si volume) | Bloc AdSense direct | 6 à 12 € CPM |
| Au clic | Lien sponsorisé | 0,40 € CPC |

Pack « partenaire fondateur » à pousser tant que l'audience est petite : 3 emplacements, 6 mois, tarif bloqué, en échange d'un témoignage utilisable ensuite.

---

## 6. Règles à ne pas enfreindre

- Tout encart payant porte la mention **« Sponsorisé »** ou **« Partenaire »**, visible sans survol.
- Les liens d'affiliation restent déclarés (c'est déjà fait dans les mentions légales, section 5) et ne doivent jamais être présentés comme un choix éditorial neutre.
- Ne pas promettre de trafic, de clics ou de ventes. Fournir des chiffres, pas des engagements.
- Ne pas démarcher les annonceurs de Freebuff en leur promettant une audience développeurs : le positionnement est différent.

---

## 7. Ordre d'exécution

1. Brancher la mesure d'audience (sans cookie).
2. Corriger AdSense (blocs numériques + CSP) pour que la régie actuelle serve au moins quelque chose.
3. Créer `/annonceurs` avec l'offre et le formulaire de contact.
4. Publier les posts de lancement (X, LinkedIn, Instagram) sur les comptes CineViseur — à créer s'ils n'existent pas encore.
5. Après 3 semaines de chiffres : envoyer les e-mails A et B à 10 cinémas et 5 boutiques, un par jour, en personnalisant le nom du film à l'affiche.
