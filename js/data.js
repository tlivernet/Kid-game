/* ==========================================================================
   data.js — tout le contenu pédagogique
   ========================================================================== */

/* Nom des lettres écrit "phonétiquement" : sans ça, la synthèse vocale lit
   "Y" comme "i" et "F" comme "fe".

   ⚠️ AUCUN « è » ici. Les voix des tablettes le prononcent littéralement
   (« èffe » devenait « e-accent-grave-f-f-e ») ou le confondent avec « é »
   (« èrre » sonnait « érre »). Le « é », lui, passe très bien.
   On utilise donc de vrais mots français homophones du nom de la lettre :
   elle, aime, aine, erre, esse — impossibles à écorcher.

   Le Q est le cas le plus retors. « ku » puis « cu » ont été essayés : la
   voix ne les reconnaît pas comme des mots et les ÉPELLE (« cé-u »). Il lui
   faut un vrai mot, et le seul qui se prononce exactement /ky/ en français
   est « cul », dont le L est muet. C'est le son juste du nom de la lettre,
   ni plus ni moins — et dans un jeu qui compte en proutons, l'orthographe
   du fichier ne choquera personne. Si la voix de la tablette prononçait le
   L, remplacer ici par 'Q' tout court. */
var LETTER_SAY = {
  A: 'A', B: 'Bé', C: 'Cé', D: 'Dé', E: 'euh', F: 'effe', G: 'Gé',
  H: 'hache', I: 'i', J: 'ji', K: 'ka', L: 'elle', M: 'aime', N: 'aine',
  O: 'o', P: 'pé', Q: 'cul', R: 'erre', S: 'esse', T: 'té', U: 'u',
  V: 'vé', W: 'double vé', X: 'ixe', Y: 'i grec', Z: 'zed'
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

/* Mots du Pendu : courts, illustrés, et… quelques mots qui font rire.
   « d » = la façon de DIRE le mot. Sans ça, la synthèse vocale prend
   « ZEBRE » pour un sigle et l'épelle lettre par lettre : il faut lui
   donner le mot en minuscules et avec ses accents.
   « h » = mot écarté du Détective (première lettre muette ou trompeuse). */
var MOTS = [
  /* --- les incontournables --- */
  { m: 'CACA', e: '💩', d: 'caca' },        { m: 'PIPI', e: '🚽', d: 'pipi' },
  { m: 'PROUT', e: '💨', d: 'prout' },      { m: 'SLIP', e: '🩲', d: 'slip' },
  { m: 'ZIZI', e: '🙈', d: 'zizi' },        { m: 'POUBELLE', e: '🗑️', d: 'poubelle' },
  /* --- animaux --- */
  { m: 'CHAT', e: '🐱', d: 'chat' },        { m: 'CHIEN', e: '🐶', d: 'chien' },
  { m: 'VACHE', e: '🐮', d: 'vache' },      { m: 'POULE', e: '🐔', d: 'poule' },
  { m: 'ZEBRE', e: '🦓', d: 'zèbre' },      { m: 'LION', e: '🦁', d: 'lion' },
  { m: 'OURS', e: '🐻', d: 'ours' },        { m: 'SINGE', e: '🐵', d: 'singe' },
  { m: 'SOURIS', e: '🐭', d: 'souris' },    { m: 'LAPIN', e: '🐰', d: 'lapin' },
  { m: 'CANARD', e: '🦆', d: 'canard' },    { m: 'COCHON', e: '🐷', d: 'cochon' },
  { m: 'MOUTON', e: '🐑', d: 'mouton' },    { m: 'CHEVAL', e: '🐴', d: 'cheval' },
  { m: 'POISSON', e: '🐟', d: 'poisson' },  { m: 'ABEILLE', e: '🐝', d: 'abeille' },
  { m: 'TORTUE', e: '🐢', d: 'tortue' },    { m: 'DAUPHIN', e: '🐬', d: 'dauphin' },
  { m: 'REQUIN', e: '🦈', d: 'requin' },    { m: 'PAPILLON', e: '🦋', d: 'papillon' },
  { m: 'DINO', e: '🦖', d: 'dino' },        { m: 'GIRAFE', e: '🦒', d: 'girafe' },
  { m: 'RENARD', e: '🦊', d: 'renard' },    { m: 'LOUP', e: '🐺', d: 'loup' },
  { m: 'SERPENT', e: '🐍', d: 'serpent' },  { m: 'KOALA', e: '🐨', d: 'koala' },
  { m: 'PANDA', e: '🐼', d: 'panda' },      { m: 'PINGOUIN', e: '🐧', d: 'pingouin' },
  { m: 'ESCARGOT', e: '🐌', d: 'escargot' },{ m: 'CRABE', e: '🦀', d: 'crabe' },
  { m: 'HIBOU', e: '🦉', d: 'hibou', h: 1 },{ m: 'ELEPHANT', e: '🐘', d: 'éléphant' },
  { m: 'GRENOUILLE', e: '🐸', d: 'grenouille' },
  /* --- à manger --- */
  { m: 'POMME', e: '🍎', d: 'pomme' },      { m: 'BANANE', e: '🍌', d: 'banane' },
  { m: 'FRAISE', e: '🍓', d: 'fraise' },    { m: 'CERISE', e: '🍒', d: 'cerise' },
  { m: 'CAROTTE', e: '🥕', d: 'carotte' },  { m: 'PIZZA', e: '🍕', d: 'pizza' },
  { m: 'GATEAU', e: '🍰', d: 'gâteau' },    { m: 'BONBON', e: '🍬', d: 'bonbon' },
  { m: 'GLACE', e: '🍦', d: 'glace' },      { m: 'FROMAGE', e: '🧀', d: 'fromage' },
  { m: 'PAIN', e: '🥖', d: 'pain' },        { m: 'SOUPE', e: '🍲', d: 'soupe' },
  { m: 'MIEL', e: '🍯', d: 'miel' },        { m: 'CHOCOLAT', e: '🍫', d: 'chocolat' },
  { m: 'POPCORN', e: '🍿', d: 'popcorn' },  { m: 'SUCETTE', e: '🍭', d: 'sucette' },
  /* --- objets --- */
  { m: 'VELO', e: '🚲', d: 'vélo' },        { m: 'TRAIN', e: '🚂', d: 'train' },
  { m: 'VOITURE', e: '🚗', d: 'voiture' },  { m: 'AVION', e: '✈️', d: 'avion' },
  { m: 'FUSEE', e: '🚀', d: 'fusée' },      { m: 'BATEAU', e: '⛵', d: 'bateau' },
  { m: 'BALLON', e: '🎈', d: 'ballon' },    { m: 'ROBOT', e: '🤖', d: 'robot' },
  { m: 'LIVRE', e: '📕', d: 'livre' },      { m: 'CHAPEAU', e: '🎩', d: 'chapeau' },
  { m: 'CLE', e: '🔑', d: 'clé' },          { m: 'MAISON', e: '🏠', d: 'maison' },
  { m: 'ECOLE', e: '🏫', d: 'école' },      { m: 'LIT', e: '🛏️', d: 'lit' },
  { m: 'TAMBOUR', e: '🥁', d: 'tambour' },  { m: 'CADEAU', e: '🎁', d: 'cadeau' },
  { m: 'PARAPLUIE', e: '☂️', d: 'parapluie' },
  /* --- dehors --- */
  { m: 'SOLEIL', e: '☀️', d: 'soleil' },    { m: 'LUNE', e: '🌙', d: 'lune' },
  { m: 'ETOILE', e: '⭐', d: 'étoile' },    { m: 'NUAGE', e: '☁️', d: 'nuage' },
  { m: 'ARBRE', e: '🌳', d: 'arbre' },      { m: 'FLEUR', e: '🌻', d: 'fleur' },
  { m: 'NEIGE', e: '❄️', d: 'neige' },      { m: 'PLAGE', e: '🏖️', d: 'plage' },
  { m: 'VOLCAN', e: '🌋', d: 'volcan' },    { m: 'ARCENCIEL', e: '🌈', d: 'arc-en-ciel' },
  /* --- personnages --- */
  { m: 'PAPA', e: '👨', d: 'papa' },        { m: 'MAMAN', e: '👩', d: 'maman' },
  { m: 'BEBE', e: '👶', d: 'bébé' },        { m: 'MAMIE', e: '👵', d: 'mamie' },
  { m: 'PAPI', e: '👴', d: 'papi' },        { m: 'PIRATE', e: '🏴\u200d☠️', d: 'pirate' },
  { m: 'SORCIERE', e: '🧙', d: 'sorcière' },{ m: 'DRAGON', e: '🐉', d: 'dragon' },
  { m: 'FEE', e: '🧚', d: 'fée' },          { m: 'CLOWN', e: '🤡', d: 'clown' },
  { m: 'ROI', e: '👑', d: 'roi' },          { m: 'ZOMBIE', e: '🧟', d: 'zombie' },
  { m: 'FANTOME', e: '👻', d: 'fantôme' },  { m: 'MONSTRE', e: '👹', d: 'monstre' }
];

/* Autocollants à collectionner : la vraie récompense longue durée.
   Un enfant range, compare, réclame celui qui manque — ça fait revenir. */
var AUTOCOLLANTS = [
  ['🦖', 'Dino'], ['🚀', 'Fusée'], ['🦄', 'Licorne'], ['🐙', 'Poulpe'],
  ['🍩', 'Donut'], ['👑', 'Couronne'], ['🐉', 'Dragon'], ['🎸', 'Guitare'],
  ['🦁', 'Lion'], ['🍕', 'Pizza'], ['🤖', 'Robot'], ['🌈', 'Arc-en-ciel'],
  ['🐢', 'Tortue'], ['⚡', 'Éclair'], ['🎃', 'Citrouille'], ['🦕', 'Diplo'],
  ['🍄', 'Champi'], ['🐳', 'Baleine'], ['🎪', 'Cirque'], ['🕹️', 'Manette'],
  ['🦜', 'Perroquet'], ['🏆', 'Trophée'], ['🧙', 'Magicien'], ['💎', 'Diamant'],
  /* deuxième planche : de quoi continuer quand la première est pleine */
  ['🐺', 'Loup'], ['🦈', 'Requin'], ['🦋', 'Papillon'], ['🐝', 'Abeille'],
  ['🦩', 'Flamant'], ['🦔', 'Hérisson'], ['🐨', 'Koala'], ['🦥', 'Paresseux'],
  ['🛸', 'Soucoupe'], ['🎠', 'Manège'], ['🎡', 'Grande roue'], ['🏰', 'Château'],
  ['⛵', 'Voilier'], ['🚂', 'Locomotive'], ['🚁', 'Hélico'], ['🏎️', 'Bolide'],
  ['🍉', 'Pastèque'], ['🥨', 'Bretzel'], ['🧁', 'Cupcake'], ['🍫', 'Chocolat'],
  ['🎺', 'Trompette'], ['🥁', 'Batterie'], ['🪄', 'Baguette'], ['💩', 'Le Prout d\'Or']
];

/* Rangs : la progression qui ne s'arrête jamais. Les autocollants et les
   sons finissent par être tous obtenus ; le rang, lui, continue de monter
   avec le total d'étoiles et donne toujours un « prochain palier ». */
var RANGS = [
  [0,   '🐣', 'Petit Poussin'],
  [15,  '🐥', 'Explorateur'],
  [40,  '🦊', 'Fin Renard'],
  [80,  '🦸', 'Super-Héros'],
  [140, '🐉', 'Dompteur de Dragon'],
  [220, '👑', 'Roi des Lettres'],
  [350, '🚀', 'Légende de la Planète']
];

function rangDe(etoiles) {
  var r = RANGS[0];
  for (var i = 0; i < RANGS.length; i++) if (etoiles >= RANGS[i][0]) r = RANGS[i];
  return r;
}
function rangSuivant(etoiles) {
  for (var i = 0; i < RANGS.length; i++) if (etoiles < RANGS[i][0]) return RANGS[i];
  return null;
}


/* Mots SANS emoji : rien ne les illustre, mais ils sont dits à voix haute et
   maintenant écrits en toutes lettres dès qu'ils sont trouvés. C'est ce qui
   permet d'ouvrir le vocabulaire au-delà de ce qu'Unicode sait dessiner. */
var MOTS_SIMPLES = [
  /* le corps */
  ['MAIN','main'], ['PIED','pied'], ['TETE','tête'], ['BRAS','bras'],
  ['JAMBE','jambe'], ['DENT','dent'], ['NEZ','nez'], ['DOIGT','doigt'],
  ['GENOU','genou'], ['VENTRE','ventre'], ['EPAULE','épaule'], ['COUDE','coude'],
  /* la maison */
  ['PORTE','porte'], ['MUR','mur'], ['TOIT','toit'], ['SALON','salon'],
  ['CUISINE','cuisine'], ['JARDIN','jardin'], ['ESCALIER','escalier'],
  ['FENETRE','fenêtre'], ['PLACARD','placard'], ['TAPIS','tapis'],
  ['COUSSIN','coussin'], ['LAMPE','lampe'], ['MIROIR','miroir'],
  ['BAIGNOIRE','baignoire'], ['BROSSE','brosse'], ['SAVON','savon'],
  ['SERVIETTE','serviette'], ['ASSIETTE','assiette'], ['CUILLERE','cuillère'],
  ['FOURCHETTE','fourchette'], ['CASSEROLE','casserole'], ['BOL','bol'],
  /* l'école */
  ['CAHIER','cahier'], ['CRAYON','crayon'], ['GOMME','gomme'], ['COLLE','colle'],
  ['CISEAUX','ciseaux'], ['CARTABLE','cartable'], ['MAITRESSE','maîtresse'],
  ['COPAIN','copain'], ['RECREATION','récréation'], ['DESSIN','dessin'],
  ['PEINTURE','peinture'], ['PINCEAU','pinceau'], ['FEUTRE','feutre'],
  ['REGLE','règle'], ['CLASSE','classe'], ['TABLEAU','tableau'],
  /* dehors */
  ['ROUTE','route'], ['PONT','pont'], ['RIVIERE','rivière'], ['CHEMIN','chemin'],
  ['FORET','forêt'], ['CHAMP','champ'], ['PRAIRIE','prairie'], ['CAILLOU','caillou'],
  ['SABLE','sable'], ['BOUE','boue'], ['FLAQUE','flaque'], ['VENT','vent'],
  ['ORAGE','orage'], ['BROUILLARD','brouillard'], ['SAISON','saison'],
  ['PRINTEMPS','printemps'], ['MONTAGNE','montagne'], ['VILLAGE','village'],
  /* actions et vie quotidienne */
  ['REPAS','repas'], ['GOUTER','goûter'], ['SIESTE','sieste'], ['BISOU','bisou'],
  ['CALIN','câlin'], ['SOURIRE','sourire'], ['RIRE','rire'], ['DODO','dodo'],
  ['JEU','jeu'], ['CADENAS','cadenas'], ['SECRET','secret'], ['SURPRISE','surprise'],
  ['ANNIVERSAIRE','anniversaire'], ['VACANCES','vacances'], ['VOYAGE','voyage'],
  ['CHANSON','chanson'], ['MUSIQUE','musique'], ['DANSE','danse'],
  ['HISTOIRE','histoire', 1], ['IMAGE','image'], ['COULEUR','couleur'],
  /* couleurs */
  ['ROUGE','rouge'], ['VERT','vert'], ['BLEU','bleu'], ['JAUNE','jaune'],
  ['NOIR','noir'], ['BLANC','blanc'], ['ROSE','rose'], ['MARRON','marron'],
  ['VIOLET','violet'], ['ORANGE','orange'], ['GRIS','gris'],
  /* animaux sans emoji dédié */
  ['MOUCHE','mouche'], ['FOURMI','fourmi'], ['CHENILLE','chenille'],
  ['MOINEAU','moineau'], ['CORBEAU','corbeau'], ['TAUPE','taupe'],
  ['BICHE','biche'], ['SANGLIER','sanglier'], ['LEZARD','lézard'],
  ['CRAPAUD','crapaud'], ['PIGEON','pigeon'], ['MOUETTE','mouette'],
  /* nourriture sans emoji dédié */
  ['PUREE','purée'], ['NOUILLE','nouille'], ['JAMBON','jambon'],
  ['YAOURT','yaourt'], ['COMPOTE','compote'], ['SIROP','sirop'],
  ['CONFITURE','confiture'], ['BEURRE','beurre'], ['SUCRE','sucre'],
  ['SALADE','salade'], ['RADIS','radis'], ['COURGETTE','courgette'],
  ['POIREAU','poireau'], ['GALETTE','galette'], ['CREPE','crêpe'],
  ['BISCUIT','biscuit'], ['TARTINE','tartine'], ['LIMONADE','limonade']
].map(function (w) {
  return { m: w[0], d: w[1], e: '', h: w[2] || 0 };
});

/* La liste complète : illustrés d'abord, puis tous les autres. */
var TOUS_LES_MOTS = MOTS.concat(MOTS_SIMPLES);

/* Chiffres : comment les prononcer + un emoji à compter */
var CHIFFRE_SAY = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq',
                   'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze',
                   'treize', 'quatorze', 'quinze', 'seize', 'dix-sept',
                   'dix-huit', 'dix-neuf', 'vingt'];

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

/* ==========================================================================
   Tirage SANS REMISE — le hasard pur reproposait trois fois le même mot dans
   une seule partie, ce qui donne l'impression d'un jeu pauvre. Ici chaque
   « sac » distribue tout son contenu avant d'être remélangé, et le dernier
   tiré ne peut pas revenir immédiatement après le remélange.
   Les sacs vivent tant que la page est ouverte : deux parties d'affilée ne
   redonnent donc pas les mêmes mots non plus.
   ========================================================================== */
var Sacs = (function () {
  var sacs = {};

  function tirer(nom, items, cle) {
    if (!items || !items.length) return null;
    cle = cle || String;
    // signature triée : le sac ne doit pas se réinitialiser simplement
    // parce que l'appelant lui a passé la même liste dans un autre ordre
    var sig = items.map(cle).slice().sort().join('|');
    var s = sacs[nom];
    if (!s || s.sig !== sig) s = sacs[nom] = { sig: sig, reste: [], dernier: null };

    if (!s.reste.length) {
      s.reste = shuffle(items);
      // on ne recommence pas par celui qu'on vient de donner
      if (s.reste.length > 1 && cle(s.reste[0]) === s.dernier) {
        s.reste.push(s.reste.shift());
      }
    }
    var x = s.reste.shift();
    s.dernier = cle(x);
    return x;
  }

  /* Tire n éléments différents d'un coup (pour remplir une grille) */
  function tirerPlusieurs(nom, items, n, cle) {
    var out = [];
    for (var i = 0; i < n && i < items.length; i++) {
      var x = tirer(nom, items, cle);
      // on ne veut pas deux fois le même DANS la même grille
      var k = (cle || String)(x), essais = 0;
      while (out.some(function (y) { return (cle || String)(y) === k; }) && essais++ < items.length) {
        x = tirer(nom, items, cle);
        k = (cle || String)(x);
      }
      out.push(x);
    }
    return out;
  }

  return { tirer: tirer, tirerPlusieurs: tirerPlusieurs };
})();

/* Le « l » minuscule et le « I » majuscule se dessinent pareil : on ne les
   met JAMAIS dans le même exercice, sinon la bonne réponse est indevinable. */
var LETTRE_ECARTEE = Math.random() < 0.5 ? 'I' : 'L';   // tirée une fois par session
function noAmbig(list) {
  if (list.indexOf('I') >= 0 && list.indexOf('L') >= 0) {
    return list.filter(function (x) { return x !== LETTRE_ECARTEE; });
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
