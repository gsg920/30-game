// Offline cache for the PWA. Bump CACHE_VERSION whenever any cached file changes.
const CACHE_VERSION = 'royal-casino-v6';

const PRECACHE = [
  './',
  'index.html',
  'style.css',
  'audio.js',
  'common.js',
  'blackjack.js',
  'roulette.js',
  'holdem.js',
  'manifest.json',
  'vendor/tailwind.css',
  'vendor/fontawesome.css',
  'vendor/google-fonts.css',
  'fonts/fa-solid-900.woff2',
  'fonts/fa-regular-400.woff2',
  'fonts/fa-brands-400.woff2',
  'fonts/fa-v4compatibility.woff2',
  'images/lobby/lobby-bg.webp',
  'images/icons/icon-192.png',
  'images/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for same-origin GETs; anything not precached (font slices, ending images) is cached on first use.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
