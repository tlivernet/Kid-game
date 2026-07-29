/* ==========================================================================
   sw.js — service worker : le jeu s'installe sur la tablette et fonctionne
   ENTIÈREMENT hors ligne (dans le train, en vacances, sans wifi).

   ⚠️ En cas d'ajout d'un fichier au jeu : l'ajouter à FICHIERS **et**
   changer le numéro de VERSION, sinon les tablettes garderont l'ancienne
   version en cache.
   ========================================================================== */
var VERSION = 'prouts-v2';

var FICHIERS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/audio.js',
  './js/data.js',
  './js/core.js',
  './js/boot.js',
  './js/games/dictee.js',
  './js/games/ballons.js',
  './js/games/jumeaux.js',
  './js/games/pendu.js',
  './js/games/compte.js',
  './js/games/tableau.js',
  './js/games/detective.js',
  './js/games/fusee.js',
  './js/games/boss.js',
  './js/games/prouts.js',
  './sons/sons.js',
  './sons/prout.mp3',
  './sons/prout-2.mp3',
  './sons/prout-3.mp3',
  './sons/prout-4.mp3',
  './sons/prout-5.mp3',
  './sons/petit-prout.mp3',
  './sons/prout-trompette.mp3',
  './sons/rot.mp3',
  './sons/boing.mp3',
  './sons/ballon.mp3',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      // addAll échoue en bloc si UN fichier manque : on tolère les absents
      return Promise.all(FICHIERS.map(function (f) {
        return c.add(f).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(noms.map(function (n) {
        return n === VERSION ? null : caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Safari demande les .mp3 par morceaux (en-tête Range). Une réponse
   complète servie depuis le cache casse alors la lecture : il faut
   découper nous-mêmes et répondre 206. */
function morceau(reponse, range) {
  return reponse.arrayBuffer().then(function (buf) {
    var m = /bytes=(\d+)-(\d*)/.exec(range) || [];
    var debut = Number(m[1] || 0);
    var fin = m[2] ? Number(m[2]) : buf.byteLength - 1;
    if (fin >= buf.byteLength) fin = buf.byteLength - 1;
    return new Response(buf.slice(debut, fin + 1), {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': reponse.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Range': 'bytes ' + debut + '-' + fin + '/' + buf.byteLength,
        'Content-Length': String(fin - debut + 1)
      }
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  var range = req.headers.get('range');
  if (range) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(function (c) {
        return c ? morceau(c.clone(), range) : fetch(req);
      })
    );
    return;
  }

  /* Sinon : on sert le cache tout de suite (démarrage instantané, même
     hors ligne) et on rafraîchit en arrière-plan pour la prochaine fois. */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cache) {
      var reseau = fetch(req).then(function (rep) {
        if (rep && rep.status === 200 && rep.type === 'basic') {
          var copie = rep.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copie); });
        }
        return rep;
      }).catch(function () { return cache; });
      return cache || reseau;
    })
  );
});
