/* ==========================================================================
   data.js — tout le contenu pédagogique
   ========================================================================== */

/* Nom des lettres écrit "phonétiquement" : sans ça, la synthèse vocale lit
   "Y" comme "i" et "F" comme "fe". Là, elle prononce le vrai nom de lettre. */
var LETTER_SAY = {
  A: 'A', B: 'Bé', C: 'Cé', D: 'Dé', E: 'euh', F: 'èffe', G: 'Gé',
  H: 'ache', I: 'i', J: 'ji', K: 'ka', L: 'èlle', M: 'èmme', N: 'ènne',
  O: 'o', P: 'pé', Q: 'ku', R: 'èrre', S: 'èsse', T: 'té', U: 'u',
  V: 'vé', W: 'double vé', X: 'ixe', Y: 'i grec', Z: 'zède'
};

/* Une image-repère par lettre : "B comme Ballon" */
var LETTER_WORD = {
  A: ['Avion', '✈️'], B: ['Ballon', '🎈'], C: ['Chat', '🐱'], D: ['Dauphin', '🐬'],
  E: ['Étoile', '⭐'], F: ['Fraise', '🍓'], G: ['Gâteau', '🍰'], H: ['Hibou', '🦉'],
  I: ['Île', '🏝️'], J: ['Jus', '🧃'], K: ['Koala', '🐨'], L: ['Lune', '🌙'],
  M: ['Maison', '🏠'], N: ['Nuage', '☁️'], O: ['Ours', '🐻'], P: ['Pizza', '🍕'],
  Q: ['Quille', '🎳'], R: ['Robot', '🤖'], S: ['Serpent', '🐍'], T: ['Tortue', '🐢'],
  U: ['Usine', '🏭'], V: ['Vélo', '🚲'], W: ['Wagon', '🚃'], X: ['Xylophone', '🎹'],
  Y: ['Yaourt', '🥣'], Z: ['Zèbre', '🦓']
};

var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/* Lettres classées par difficulté : on commence par les plus faciles à
   distinguer, on ajoute progressivement les lettres qui se ressemblent. */
var LETTER_LEVELS = [
  ['A', 'O', 'I', 'S', 'M', 'L'],                    // niveau 1
  ['A', 'O', 'I', 'S', 'M', 'L', 'E', 'T', 'R', 'U'], // niveau 2
  ['A', 'O', 'I', 'S', 'M', 'L', 'E', 'T', 'R', 'U', 'C', 'P', 'N', 'B', 'D', 'F'],
  ALPHABET.slice()                                    // niveau 4 : tout
];

/* Mots du Pendu : courts, illustrés, et… quelques mots qui font rire. */
var MOTS = [
  { m: 'CACA', e: '💩' }, { m: 'PIPI', e: '🚽' }, { m: 'PROUT', e: '💨' },
  { m: 'CHAT', e: '🐱' }, { m: 'CHIEN', e: '🐶' }, { m: 'LUNE', e: '🌙' },
  { m: 'VELO', e: '🚲' }, { m: 'POMME', e: '🍎' }, { m: 'SOLEIL', e: '☀️' },
  { m: 'ROBOT', e: '🤖' }, { m: 'PIZZA', e: '🍕' }, { m: 'FUSEE', e: '🚀' },
  { m: 'BALLON', e: '🎈' }, { m: 'DINO', e: '🦖' }, { m: 'PAPA', e: '👨' },
  { m: 'MAMAN', e: '👩' }, { m: 'GATEAU', e: '🍰' }, { m: 'SLIP', e: '🩲' },
  { m: 'VACHE', e: '🐮' }, { m: 'BANANE', e: '🍌' }, { m: 'ETOILE', e: '⭐' },
  { m: 'POULE', e: '🐔' }, { m: 'TRAIN', e: '🚂' }, { m: 'ZEBRE', e: '🦓' }
];

/* Chiffres : comment les prononcer + un emoji à compter */
var CHIFFRE_SAY = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq',
                   'six', 'sept', 'huit', 'neuf', 'dix'];

var COMPTE_EMOJIS = ['🐸', '🍪', '🚗', '🐟', '🐝', '🍭', '👻', '🦆', '🐛', '🍄',
                     '⚽', '🐧', '🎩', '🦕', '🍩', '💩'];

/* Petites phrases de félicitation (variées = l'enfant reste curieux) */
var BRAVOS = [
  'Bravo !', 'Super !', 'Trop fort !', 'Génial !', 'Waouh !',
  'Tu déchires !', 'Champion !', 'Incroyable !', 'Youpi !', 'Magnifique !'
];
var BRAVOS_DROLES = [
  'Bravo, tu mérites un prout !', 'Excellent, ça sent la victoire !',
  'Ouah, tu es plus fort qu\'un dinosaure !',
  'Bien joué, espèce de génie !', 'Yes ! Le robot est content !'
];
var ENCOURAGEMENTS = [
  'Presque ! Essaye encore.', 'Oups, on réessaye !', 'Pas grave, encore un coup !',
  'Zut alors ! Retente ta chance.', 'Raté ! Mais tu vas y arriver.'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* Le « l » minuscule et le « I » majuscule se dessinent pareil : on ne les
   met JAMAIS dans le même exercice, sinon la bonne réponse est indevinable. */
function noAmbig(list) {
  if (list.indexOf('I') >= 0 && list.indexOf('L') >= 0) {
    var drop = Math.random() < 0.5 ? 'I' : 'L';
    return list.filter(function (x) { return x !== drop; });
  }
  return list;
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ==========================================================================
   Tracés des lettres majuscules (jeu "Tableau magique")
   Coordonnées normalisées 0→1 dans un carré, y vers le bas.
   Un tracé = liste de "strokes" ; un stroke = liste de points.
   ========================================================================== */
function arcPts(cx, cy, rx, ry, a0, a1, n) {
  var pts = [];
  n = n || 22;
  for (var i = 0; i <= n; i++) {
    var a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

var TRACES = {
  A: [[[0.5, 0.08], [0.14, 0.94]], [[0.5, 0.08], [0.86, 0.94]], [[0.26, 0.64], [0.74, 0.64]]],
  B: [
    [[0.26, 0.06], [0.26, 0.94]],
    [[0.26, 0.06], [0.55, 0.06]].concat(arcPts(0.55, 0.28, 0.24, 0.22, -Math.PI / 2, Math.PI / 2, 12)).concat([[0.26, 0.5]]),
    [[0.26, 0.5], [0.57, 0.5]].concat(arcPts(0.57, 0.72, 0.26, 0.22, -Math.PI / 2, Math.PI / 2, 12)).concat([[0.26, 0.94]])
  ],
  C: [arcPts(0.52, 0.5, 0.36, 0.44, -Math.PI / 3.2, -Math.PI * 2 + Math.PI / 3.2, 26)],
  D: [[[0.26, 0.06], [0.26, 0.94]],
      [[0.26, 0.06], [0.5, 0.06]].concat(arcPts(0.5, 0.5, 0.34, 0.44, -Math.PI / 2, Math.PI / 2, 18)).concat([[0.26, 0.94]])],
  E: [[[0.28, 0.06], [0.28, 0.94]], [[0.28, 0.06], [0.8, 0.06]], [[0.28, 0.5], [0.72, 0.5]], [[0.28, 0.94], [0.8, 0.94]]],
  F: [[[0.28, 0.06], [0.28, 0.94]], [[0.28, 0.06], [0.8, 0.06]], [[0.28, 0.48], [0.7, 0.48]]],
  G: [arcPts(0.52, 0.5, 0.36, 0.44, -Math.PI / 3.2, -Math.PI * 2 + Math.PI / 3.4, 24).concat([[0.88, 0.52], [0.62, 0.52]])],
  H: [[[0.24, 0.06], [0.24, 0.94]], [[0.76, 0.06], [0.76, 0.94]], [[0.24, 0.5], [0.76, 0.5]]],
  I: [[[0.5, 0.06], [0.5, 0.94]]],
  J: [[[0.62, 0.06], [0.62, 0.7]].concat(arcPts(0.42, 0.7, 0.2, 0.24, 0, Math.PI * 0.95, 12))],
  K: [[[0.26, 0.06], [0.26, 0.94]], [[0.78, 0.06], [0.26, 0.52]], [[0.36, 0.44], [0.8, 0.94]]],
  L: [[[0.3, 0.06], [0.3, 0.94], [0.82, 0.94]]],
  M: [[[0.14, 0.94], [0.14, 0.06], [0.5, 0.6], [0.86, 0.06], [0.86, 0.94]]],
  N: [[[0.18, 0.94], [0.18, 0.06], [0.82, 0.94], [0.82, 0.06]]],
  O: [arcPts(0.5, 0.5, 0.37, 0.44, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2, 30)],
  P: [[[0.28, 0.06], [0.28, 0.94]],
      [[0.28, 0.06], [0.55, 0.06]].concat(arcPts(0.55, 0.3, 0.26, 0.24, -Math.PI / 2, Math.PI / 2, 14)).concat([[0.28, 0.54]])],
  Q: [arcPts(0.5, 0.46, 0.36, 0.4, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2, 28), [[0.62, 0.62], [0.9, 0.96]]],
  R: [[[0.28, 0.06], [0.28, 0.94]],
      [[0.28, 0.06], [0.55, 0.06]].concat(arcPts(0.55, 0.3, 0.26, 0.24, -Math.PI / 2, Math.PI / 2, 14)).concat([[0.28, 0.54]]),
      [[0.4, 0.54], [0.82, 0.94]]],
  S: [arcPts(0.5, 0.26, 0.26, 0.2, 0, -Math.PI * 1.35, 14)
        .concat(arcPts(0.5, 0.7, 0.26, 0.24, Math.PI * 0.72, Math.PI * 2.1, 16))],
  T: [[[0.14, 0.08], [0.86, 0.08]], [[0.5, 0.08], [0.5, 0.94]]],
  U: [[[0.18, 0.06], [0.18, 0.6]].concat(arcPts(0.5, 0.6, 0.32, 0.34, Math.PI, 0, 16)).concat([[0.82, 0.06]])],
  V: [[[0.14, 0.06], [0.5, 0.94], [0.86, 0.06]]],
  W: [[[0.08, 0.06], [0.28, 0.94], [0.5, 0.34], [0.72, 0.94], [0.92, 0.06]]],
  X: [[[0.18, 0.06], [0.82, 0.94]], [[0.82, 0.06], [0.18, 0.94]]],
  Y: [[[0.18, 0.06], [0.5, 0.5]], [[0.82, 0.06], [0.5, 0.5]], [[0.5, 0.5], [0.5, 0.94]]],
  Z: [[[0.2, 0.08], [0.8, 0.08], [0.2, 0.92], [0.8, 0.92]]]
};

/* Lettres proposées au tracé, de la plus simple à la plus difficile */
var TRACE_ORDER = ['I', 'L', 'T', 'O', 'A', 'E', 'C', 'H', 'M', 'N',
                   'U', 'V', 'X', 'Z', 'P', 'F', 'D', 'B', 'S', 'R',
                   'J', 'K', 'W', 'Y', 'G', 'Q'];
