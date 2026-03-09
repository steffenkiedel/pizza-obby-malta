const CACHE = 'pizza-obby-v1';
const ASSETS = [
  '/pizza-obby-malta/',
  '/pizza-obby-malta/index.html',
  '/pizza-obby-malta/game.js',
  '/pizza-obby-malta/phaser.min.js',
  '/pizza-obby-malta/icons/icon-192.png',
  '/pizza-obby-malta/icons/icon-512.png',
  '/pizza-obby-malta/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
