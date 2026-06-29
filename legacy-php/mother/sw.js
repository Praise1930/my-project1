/**
 * MamaTrack GPS — PWA Service Worker (sw.js)
 * Caches core files for basic offline loading in low-bandwidth rural conditions.
 */

const CACHE_NAME = 'mamatrack-v1';
const ASSETS_TO_CACHE = [
  'index.php',
  'manifest.json',
  '../assets/css/main.css',
  '../assets/css/mother.css',
  '../assets/js/dashboard.js',
  '../assets/js/notifications.js',
  '../assets/js/map.js',
  '../assets/js/emergency.js',
  '../assets/images/mother_bg.png'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-First approach with Cache fallback)
self.addEventListener('fetch', (e) => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then((networkResponse) => {
      // Update cache
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(e.request, networkResponse.clone());
        return networkResponse;
      });
    }).catch(() => {
      // Load from cache on network failure
      return caches.match(e.request);
    })
  );
});
