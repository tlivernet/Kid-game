# 💩 La Planète des Prouts

Un petit jeu web pour aider un enfant de 5 ans (entrée en CP) à reconnaître les
lettres — **majuscules et minuscules** — et les chiffres, **sans jamais avoir
l'impression de travailler**.

Pas d'installation, pas de compte, pas de pub, pas de réseau : un dossier de
fichiers HTML/CSS/JS. Ça tourne sur tablette, dans le navigateur.

---

## 🚀 Comment y jouer

### Option 1 — GitHub Pages (recommandé, 30 secondes)

1. Dans ce dépôt : **Settings** → **Pages**
2. *Source* : **Deploy from a branch**
3. *Branch* : `main` (ou la branche où se trouve le jeu) + dossier `/ (root)` → **Save**
4. Au bout d'une minute, GitHub affiche l'adresse :
   `https://tlivernet.github.io/kid-game/`
5. Ouvre cette adresse sur la tablette, puis installe-la (voir juste en dessous).

### 📱 L'installer comme une vraie application

Le jeu est une **PWA** : une fois installé, il a son icône sur l'écran
d'accueil, s'ouvre en plein écran sans barre de navigateur, et **fonctionne
entièrement sans connexion** (train, vacances, wifi capricieux). Les 640 Ko du
jeu, sons compris, sont copiés sur la tablette au premier lancement.

- **iPad / iPhone** : ouvrir l'adresse dans **Safari** (pas Chrome), bouton
  *Partager* → **Sur l'écran d'accueil**.
- **Android** : ouvrir dans Chrome → menu ⋮ → **Installer l'application**
  (une bannière le propose souvent d'elle-même).

Deux conditions : l'adresse doit être en **https** — c'est le cas de GitHub
Pages — et il faut lancer le jeu **une fois avec du réseau** pour qu'il se
mette en cache. Ouvert en double-clic depuis un dossier (`file://`), le jeu
fonctionne mais sans installation ni cache : les navigateurs l'interdisent.

### Option 2 — Hors-ligne

**Code** → **Download ZIP**, on dézippe, on double-clique `index.html`.
Tout fonctionne pareil (les sons sont générés par le navigateur, il n'y a aucun
fichier audio à télécharger).

> 🔊 **Important** : sur tablette, il faut appuyer une fois sur **▶ JOUER** pour
> que le son se débloque — c'est une sécurité des navigateurs, pas un bug.

---

## 🎮 Les jeux

| Jeu | Ce que l'enfant fait | Ce qu'il travaille |
|---|---|---|
| 🪄 **Dictée Magique** | La voix dit une lettre, il la touche | Reconnaissance auditive → visuelle |
| 🎈 **Attrape-Ballons** | Éclater les ballons portant la bonne lettre | Balayage visuel rapide, réflexe |
| 👯 **Les Jumeaux** | Memory : associer `A` et `a` | **Le lien majuscule ↔ minuscule** |
| 🎩 **Le Prout-du** | Le pendu : trouver les lettres d'un mot | Décomposition d'un mot en lettres |
| 🔢 **Les Nombres** | Compter, lire un nombre, la suite, additions et soustractions | Dénombrement puis calcul |
| ✍️ **Tableau Magique** | Tracer la lettre au doigt en suivant le chemin | Geste d'écriture, sens du tracé |
| 🕵️ **Le Détective** | « Par quelle lettre commence PIZZA ? » puis le mot s'écrit | **Relier un son entendu à une lettre** |
| 🚀 **Fusée Alphabet** | Toucher les lettres dans l'ordre ; la fusée se pose sur chaque bulle comme sur une planète | L'ordre de l'alphabet |
| 👹 **Le Monstre** | Combat de boss : tout y passe, avec 3 vies et un chrono | Révision mélangée sous tension |
| 💩 **Boutique** | Dépenser ses proutons en bruits rigolos et en autocollants | (rien — c'est la récompense !) |

Les jeux **se débloquent avec les étoiles** (3 ⭐ pour Les Jumeaux, 6 pour le
Prout-du… 25 pour le Monstre). Au tout début, seules la Dictée, les Zigotos et
la Boîte à Prouts sont ouvertes : deux jeux, pas dix — on ne noie pas l'enfant,
et chaque cadenas qui saute devient un petit événement (le jeu l'annonce à voix
haute).

---

## 🧠 Les partis pris (pour les parents)

**Le « caca/pipi » devient le moteur, pas l'ennemi.**
Quand on demande une lettre et qu'un enfant répond « caca » par défi, il teste la
réaction de l'adulte. Ici, le jeu ne se laisse pas provoquer : il propose le gag
lui-même. Un gros bouton 💩 est disponible **en permanence, sans condition**, et
chaque étoile gagnée débloque un nouveau bruit dans la Boîte à Prouts. Le mot
`CACA` fait même partie des mots à deviner. Résultat : le pouvoir de provocation
disparaît, et l'envie de « débloquer le prochain bruit » prend sa place.

**Zéro lecture nécessaire pour jouer.**
Tout est dit à voix haute (synthèse vocale française) et illustré par des emojis.
Un enfant qui ne sait pas lire n'est jamais bloqué et n'est jamais mis en échec
par l'interface elle-même.

**On ne perd jamais vraiment.**
Une erreur déclenche un bruit rigolo, jamais une sanction. Au bout de deux essais,
la bonne réponse se met à sautiller. Dans le pendu, l'échec c'est un pet
retentissant — donc c'est drôle, donc on ose réessayer. Chaque partie se termine
sur des étoiles, jamais sur un score négatif.

**Des parties très courtes.**
6 à 10 questions par partie (1 à 2 minutes). C'est calibré pour un enfant qui
décroche vite : on finit une partie *avant* que l'attention ne tombe, et
l'écran de victoire donne envie d'en refaire une.

**La difficulté s'ajuste toute seule, et ça se voit.**
Chaque carte affiche « Niveau N » avec sa jauge, et une montée de niveau est
annoncée en grand sur l'écran de fin. Une partie réussie fait monter d'un
cran ; une partie faible ne fait **pas** redescendre tout de suite — il en
faut deux d'affilée. Un enfant qu'on appelle au milieu d'une partie ne doit
pas perdre ce qu'il a acquis, sinon il a l'impression de repartir à zéro.
Seules les réponses trouvées **du premier coup** comptent dans le score.
Progression des lettres : majuscules faciles (A O I S M L) → alphabet complet
→ minuscules → mélange des deux écritures.

*Les Nombres* a **10 niveaux qui changent de nature**, pas seulement de
taille : compter 18 objets au lieu de 9 n'apprend rien de plus. On passe donc
de compter (1→12, alignés puis éparpillés) à **lire** un nombre entendu
(« touche le 14 »), puis à la **suite** (« quel nombre vient après 7 ? »), à
l'**addition** et enfin à la **soustraction**, où les objets mangés restent
visibles mais barrés. Les réponses proposées sont des voisins du bon nombre
(il faut compter juste, pas à peu près) et sont **rangées dans l'ordre
croissant** pour construire la frise numérique.

**On peut vraiment perdre.** Trois cœurs par partie dans les jeux de
questions : trois erreurs et la partie s'arrête, sans étoile. En revanche le
jeu **ne reprend jamais** ce qui est déjà gagné : à cet âge, voir son trésor
diminuer fait abandonner. L'enjeu, c'est de repartir les mains vides — pas
d'être puni.

**Quatre récompenses qui se cumulent.**
- ⭐ **Les étoiles** ouvrent les jeux et font monter le **rang** (7 rangs, de
  Petit Poussin à Légende de la Planète). Le rang ne se termine jamais : même
  quand tout le reste est obtenu, il reste un palier devant soi, avec sa jauge
  affichée en haut du menu.
- 💩 **Les proutons sont la monnaie.** On les dépense à la **Boutique** :
  bruits rigolos (5 à 60 proutons) et autocollants surprises (25). Ils ne
  servent plus seulement de compteur — il faut choisir et économiser.
- 🏅 **48 autocollants** à collectionner, un par partie à 3 étoiles, plus ceux
  qu'on s'offre à la boutique. Un enfant de 5 ans ne se motive pas pour un
  score : il se motive pour la vignette qui lui manque.
- 🎯 **Trois missions** en cours en permanence (« gagne 4 ⭐ au Détective »),
  toujours sur des jeux différents et en priorité **les moins joués**. C'est
  la réponse au « il ne joue qu'à trois jeux » : on ne l'oblige à rien, on lui
  donne une raison d'aller voir ailleurs, payée en proutons. Toucher une
  mission lance directement le jeu concerné.

**Le boss.** À 25 étoiles s'ouvre *Le Monstre*, qui mélange les quatre
compétences (reconnaître, entendre, compter, associer). Il a 5 crânes de vie,
l'enfant a 3 cœurs, et le monstre grossit quand il gagne un échange. Il
rapporte 5 étoiles d'un coup. Chaque monstre battu rend le suivant plus
coriace, et un chrono apparaît à partir du deuxième combat — jamais au
premier, pour laisser découvrir la règle sans pression.

**Le « l » et le « I » ne sont jamais proposés ensemble**, parce qu'ils se
dessinent exactement pareil : la question serait indevinable.

**Aucune répétition dans une partie.** Le hasard pur reproposait trois fois le
même mot en huit questions, ce qui fait paraître le jeu pauvre. Chaque jeu
puise maintenant dans un « sac » qui distribue *tout* son contenu avant d'être
remélangé, et le dernier tiré ne peut pas revenir juste après. Les sacs vivent
tant que la page est ouverte : deux parties d'affilée ne redonnent donc pas la
même chose non plus.

**226 mots**, dont la moitié sans image. Un emoji n'existe pas pour *escalier*,
*récréation* ou *jaune* : ces mots-là sont dits à voix haute (l'oreille 👂
remplace l'image) et **écrits en toutes lettres** dès que la réponse est
trouvée. C'est ce qui permet d'ouvrir le vocabulaire au-delà de ce qu'Unicode
sait dessiner — et l'enfant croise le mot écrit sans qu'on lui demande de le
lire.

---

## 🧹 Réglages

- **Effacer la progression** : le balai 🧹 en haut à droite du menu, puis une
  multiplication à résoudre — un enfant de 5 ans ne passe pas, un adulte oui.
- **Faire répéter la consigne** : le bouton 🔁 en haut de chaque jeu, ou le
  gros bouton 👂 dans la Dictée Magique.
- La progression est stockée dans le navigateur de la tablette (localStorage).

---

## 🛠️ Sous le capot

- HTML/CSS/JS **vanilla**, aucune dépendance, aucun build, aucun appel réseau.
- Tous les sons sont **synthétisés à la volée** par la Web Audio API — y compris
  les prouts (dent de scie + vibrato rapide + filtre passe-bas + couche de bruit
  filtré). Aucun fichier audio dans le dépôt.
- Les sons sont calibrés pour un **haut-parleur de tablette**, qui ne restitue
  quasiment rien sous 200 Hz : l'énergie est maintenue entre 300 et 2500 Hz et
  c'est le vibrato (le « brrr ») plus les harmoniques qui font le prout, pas les
  graves. `Sound._useContext()` permet de rejouer chaque son dans un
  `OfflineAudioContext` pour le mesurer ou l'exporter en WAV.
- Vous pouvez remplacer n'importe quel bruitage par un **vrai enregistrement** :
  voir `sons/LISEZMOI.md`. Sans fichier, le jeu reste 100 % synthétisé.
- La voix utilise `SpeechSynthesis` en `fr-FR`, avec une écriture phonétique des
  noms de lettres (`B` → « bé », `Y` → « i grec ») sinon la synthèse les lit mal.
  **Aucun « è » dans ces graphies** : les voix des tablettes le prononcent
  littéralement (« èffe » devenait « e-accent-grave-f-f-e ») ou le confondent
  avec « é ». On passe donc par de vrais mots homophones — *elle, aime, aine,
  erre, esse* — impossibles à écorcher.
- Les phrases passent par une **file d'attente** (`Voice.say`). Auparavant
  chaque phrase annulait la précédente, et le « bravo » de fin de partie se
  faisait couper par l'annonce suivante. Pour interrompre volontairement
  (l'enfant vient d'agir), on passe `{ coupe: true }`.
  Les mots du pendu sont eux aussi stockés en version « à dire » (`zèbre` et non
  `ZEBRE`) : en majuscules, la synthèse prend le mot pour un sigle et l'épelle.
- Tous les boutons passent par `tap()` (sur `pointerdown`) et **jamais** par
  `click` : mélanger les deux fait qu'un doigt qui se lève après un changement
  d'écran déclenche l'élément situé dessous sur le nouvel écran.
- Les lettres du Tableau Magique sont définies comme des polylignes normalisées
  dans `js/data.js` (`TRACES`), rééchantillonnées en points de contrôle : le
  tracé est validé si le doigt passe près de chaque point, dans l'ordre.

```
index.html          écrans + chargement des scripts
manifest.json       nom, icônes, plein écran (installation)
sw.js               cache hors ligne (service worker)
icones/             icônes PNG de l'application
sons/               vide par défaut ; vos .mp3 si vous en voulez de vrais
css/style.css       tout le style (unités vmin : ça s'adapte à l'écran)
js/audio.js         moteur de sons + voix
js/data.js          lettres, mots, chiffres, tracés des lettres
js/core.js          état, sauvegarde, navigation, confettis
js/boot.js          démarrage et boutons globaux
js/games/*.js       un fichier par jeu (10 jeux)
```

### ⚠️ Après avoir modifié un fichier

Le jeu sert d'abord sa copie en cache puis se rafraîchit en arrière-plan : une
modification apparaît donc **au lancement suivant**. Si vous **ajoutez** un
fichier (nouveau jeu, nouveau son), ajoutez-le à la liste `FICHIERS` de
`sw.js` **et** changez le numéro de `VERSION` — sans ça, les tablettes déjà
installées garderont l'ancienne version.

### Ajouter un jeu

Créer `js/games/monjeu.js` :

```js
Games.monjeu = (function () {
  function start(root, api, level) { /* root.innerHTML = ... */ }
  function stop() { /* nettoyer timers / rAF */ }
  function repeat() { Voice.say('la consigne'); }
  return {
    title: 'Mon Jeu', spoken: 'mon jeu', emoji: '🎲',
    color: 'linear-gradient(160deg,#aaa,#333)',
    start: start, stop: stop, repeat: repeat
  };
})();
```

puis ajouter la balise `<script>` dans `index.html` : la carte apparaît toute
seule dans le menu.

`api` fournit : `dots(fait, total)`, `win(étoiles, emoji)`, `confetti(n)`,
`flash(texte)`, `bumpLevel(id, réussi)` et `alive()` — à tester dans tout
callback asynchrone (la voix peut répondre après un retour au menu).
