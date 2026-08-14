// MamaTrack GPS — Service Worker
//
// Caching has to be conservative here. An earlier version applied
// stale-while-revalidate to every same-origin GET, which meant it also cached
// the development server's module and dependency URLs. After the bundler
// re-optimised its dependencies, the worker kept serving the previous
// generation of some chunks alongside the new generation of others, which
// loaded two copies of React and broke every dashboard with "Invalid hook
// call". The same fault shape applies in production: serving a stale
// index.html points the browser at asset hashes that no longer exist.
//
// So: never touch build tooling URLs, fetch documents from the network first,
// and only cache fingerprinted static assets.

const CACHE_NAME = 'mamatrack-pwa-v3';

const PRECACHE = [
  '/',
  '/index.html',
  '/vite.svg',
  '/mother.jpeg',
];

// Paths the worker must leave alone. These are served by the dev server and
// carry their own version query strings; caching them mixes generations.
const BYPASS = [
  '/@vite/',
  '/@react-refresh',
  '/@fs/',
  '/@id/',
  '/node_modules/',
  '/src/',
];

function shouldBypass(url) {
  if (BYPASS.some((prefix) => url.pathname.startsWith(prefix))) return true;
  // Dev module requests are versioned with ?v= or ?t=; a cached copy of one of
  // those is stale the moment the version changes.
  if (url.searchParams.has('v') || url.searchParams.has('t')) return true;
  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldBypass(url)) return;

  // Documents: network first, so a new deployment is picked up on the next
  // load rather than the one after it. The cache is the offline fallback,
  // which is what matters on a rural connection.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Static assets: serve from cache and refresh in the background. Built asset
  // filenames carry a content hash, so a stale entry is never a wrong entry.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
