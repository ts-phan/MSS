// Service Worker — Simulateur Système Masse-Ressort
// Stratégie : cache-first pour tous les assets de l'application.
//
// CORRECTIF v3 : toutes les dépendances (React, ReactDOM, Recharts, PropTypes)
// sont désormais vendorisées localement dans ./vendor/ au lieu d'être chargées
// depuis un CDN externe (unpkg.com). Le code applicatif (JSX) est également
// pré-transpilé en JavaScript pur, Babel Standalone n'est plus nécessaire au
// runtime. Cause du bug précédent : une ressource cross-origin mise en cache en
// mode 'no-cors' produit une réponse opaque (status toujours 0, jamais 200) —
// peu fiable pour garantir un fonctionnement hors-ligne complet en conditions
// réelles (l'app restait bloquée sur "Initialisation..." en mode avion, faute
// d'avoir pu recharger Babel Standalone). En vendorisant tout en local, chaque
// fichier est mis en cache de façon fiable via cache.addAll (même origine,
// réponse normale avec status 200).

const CACHE_NAME = 'vdf-simulateur-v3';

// Tous les fichiers nécessaires au fonctionnement complet de l'application,
// y compris hors-ligne. Un échec sur l'un de ces fichiers fait échouer
// l'installation du service worker (comportement voulu : mieux vaut un échec
// visible qu'un cache silencieusement incomplet).
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/prop-types.min.js',
  './vendor/Recharts.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne traiter que les requêtes GET (éviter de mettre en cache des POST, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Mise en cache dynamique de toute nouvelle ressource récupérée avec
          // succès et de même origine (permet par exemple de mettre en cache
          // les polices Google Fonts si le réseau est disponible, sans bloquer
          // le fonctionnement si elles restent indisponibles hors-ligne).
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => {
          // Hors-ligne et pas en cache : pour une navigation HTML, retomber sur
          // la page principale déjà mise en cache plutôt que de planter.
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});
