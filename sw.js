// Service Worker — Simulateur Système Masse-Ressort
// Stratégie : cache-first pour les assets statiques (app shell + CDN),
// avec fallback réseau si une ressource n'est pas encore en cache.

const CACHE_NAME = 'vdf-simulateur-v2';

// Fichiers de l'application (même origine)
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Dépendances CDN nécessaires au fonctionnement (React, Recharts, Babel, police)
const CDN_ASSETS = [
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/prop-types@15/prop-types.min.js',
  'https://unpkg.com/recharts@2.10.3/umd/Recharts.js',
  'https://unpkg.com/@babel/standalone@7/babel.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // L'app shell est essentiel : si ça échoue, l'install échoue.
      return cache.addAll(APP_SHELL).then(() =>
        // Les CDN sont mis en cache en best-effort (opaque cross-origin possible,
        // ou réseau lent) — on ne bloque pas l'installation si ça échoue.
        Promise.allSettled(
          CDN_ASSETS.map((url) =>
            cache.add(new Request(url, { mode: 'no-cors' })).catch(() => null)
          )
        )
      );
    })
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
          // Mise en cache dynamique de toute nouvelle ressource récupérée avec succès
          // (permet de fonctionner hors-ligne dès la deuxième visite, même pour des
          // ressources non listées explicitement ci-dessus).
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
