# Dossier `sons/` — remplacer les bruitages par de vrais enregistrements

Par défaut, **tous les bruits du jeu sont fabriqués par le navigateur** : il n'y
a aucun fichier audio, donc rien à télécharger et ça marche hors-ligne.

Si un bruit synthétisé ne vous convient pas :

1. déposez votre `.mp3` dans ce dossier ;
2. ouvrez **`sons.js`** et retirez le `//` devant la ligne correspondante.

C'est tout. Si le fichier est absent ou illisible, le jeu revient tout seul à
la version synthétisée — il n'y a donc aucun risque à essayer.

## Noms de fichiers prévus

| Fichier | Utilisé pour |
|---|---|
| `prout.mp3` | le gros bouton 💩, les erreurs, la fin du Prout-du |
| `prout-2.mp3`, `prout-3.mp3`, `prout-4.mp3` | *(facultatif)* variantes tirées au hasard — c'est **ce qui rend le gag durable**, un prout toujours identique lasse vite |
| `petit-prout.mp3` | bouton 🫧 de la Boîte à Prouts |
| `prout-trompette.mp3` | bouton 🎺 |
| `rot.mp3` | bouton 🐸 |
| `boing.mp3` | mauvais départ dans le Tableau Magique |
| `ballon.mp3` | ballon qui se dégonfle |

## Où trouver des sons libres de droits

Cherchez « fart », « burp », « raspberry » ou « whoopee cushion » sur :

- **freesound.org** — filtre *License → Creative Commons 0* : réutilisable sans
  condition, y compris sans citer l'auteur. (Compte gratuit requis.)
- **Wikimedia Commons** — beaucoup de fichiers en domaine public ou CC0.
- **Pixabay** (section *Sound Effects*) — licence Pixabay, libre d'usage.

⚠️ Évitez les banques « gratuites » qui exigent une attribution ou interdisent
un usage commercial si vous comptez publier le jeu ailleurs. Le plus simple
reste **CC0 / domaine public**.

## Deux conseils pratiques

1. **Coupez le silence** au début du fichier, sinon le bruit arrive en retard
   sur l'appui du doigt et le gag tombe à plat.
2. **Restez court** : moins d'une seconde. Un bruitage long finit par agacer
   au bout de la trentième écoute — et il y en aura beaucoup plus que trente.

Si vous ajoutez des fichiers non-CC0, notez ici leur source et leur licence.
