// CloudHub Service Worker — v1.0
// Caches the app shell so it loads offline

const CACHE = 'cloudhub-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', e => {
  // Only cache same-origin GET requests (not API calls)
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache new HTML/CSS/JS responses
        if (res.ok && (e.request.url.endsWith('.html') || e.request.url.endsWith('.js') || e.request.url.endsWith('.css') || e.request.url.endsWith('.json'))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html')); // offline fallback
    })
  );
});
