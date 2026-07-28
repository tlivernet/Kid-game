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
5. Ouvre cette adresse sur la tablette, puis **« Ajouter à l'écran d'accueil »**
   pour avoir une vraie icône en plein écran.

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
| 🔢 **Compte les Zigotos** | Compter des personnages, toucher le bon chiffre | Dénombrement, chiffres 1→10 |
| ✍️ **Tableau Magique** | Tracer la lettre au doigt en suivant le chemin | Geste d'écriture, sens du tracé |
| 💩 **Boîte à Prouts** | Récréation : appuyer sur des boutons rigolos | (rien — c'est la récompense !) |

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

**La difficulté s'ajuste toute seule.**
Chaque jeu a 4 niveaux (les 🔥 sur les cartes du menu). Réussite → on monte,
difficulté → on redescend. Progression : majuscules faciles (A O I S M L) →
alphabet complet → minuscules → mélange des deux écritures.

**Le « l » et le « I » ne sont jamais proposés ensemble**, parce qu'ils se
dessinent exactement pareil : la question serait indevinable.

---

## 🧹 Réglages

- **Effacer la progression** : appui long (1,5 s) sur le balai 🧹 en haut à droite
  du menu — volontairement hors de portée d'un enfant qui tapote.
- **Faire répéter la consigne** : le bouton 🔁 en haut de chaque jeu, ou le
  gros bouton 👂 dans la Dictée Magique.
- La progression est stockée dans le navigateur de la tablette (localStorage).

---

## 🛠️ Sous le capot

- HTML/CSS/JS **vanilla**, aucune dépendance, aucun build, aucun appel réseau.
- Tous les sons sont **synthétisés à la volée** par la Web Audio API — y compris
  les prouts (oscillateur en dents de scie + vibrato + filtre passe-bas qui
  s'effondre). Aucun fichier audio dans le dépôt.
- La voix utilise `SpeechSynthesis` en `fr-FR`, avec une écriture phonétique des
  noms de lettres (`B` → « bé », `Y` → « i grec ») sinon la synthèse les lit mal.
- Les lettres du Tableau Magique sont définies comme des polylignes normalisées
  dans `js/data.js` (`TRACES`), rééchantillonnées en points de contrôle : le
  tracé est validé si le doigt passe près de chaque point, dans l'ordre.

```
index.html          écrans + chargement des scripts
css/style.css       tout le style (unités vmin : ça s'adapte à l'écran)
js/audio.js         moteur de sons + voix
js/data.js          lettres, mots, chiffres, tracés des lettres
js/core.js          état, sauvegarde, navigation, confettis
js/boot.js          démarrage et boutons globaux
js/games/*.js       un fichier par jeu
```

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
