// sw.js — Service Worker for Ambedkar Digital Heritage Archive (v3)
// Museum-grade offline sanctuary: caches core assets, JSON catalogs, and provides offline API fallback
const CACHE_NAME = 'ambedkar-archive-v3';
const DATA_CACHE_NAME = 'ambedkar-archive-data-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/archive.html',
  '/debates.html',
  '/memorials.html',
  '/letters.html',
  '/vows.html',
  '/timeline.html',
  '/compare.html',
  '/transparency.html',
  '/about.html',
  '/kiosk.html',
  '/slides.html',
  '/assistant.html',
  '/constitution.html',
  '/ideas.html',
  '/learning.html',
  '/quotes.html',
  '/media.html',
  '/ocr.html',
  '/css/style.css',
  '/css/reader.css',
  '/css/auth.css',
  '/css/apple-design.css',
  '/js/app.js',
  '/js/api.js',
  '/js/toast.js',
  '/js/command-palette.js',
  '/js/apple-design.js',
  '/js/navigation-system.js',
  '/js/vendor/lenis.min.js',
  '/js/vendor/gsap.min.js',
  '/js/vendor/ScrollTrigger.min.js',
  '/data/vows.json',
  '/data/baws_catalog.json',
  '/data/volumes.json',
  '/data/writings.json',
  '/manifest.json',
  '/favicon.ico',
  '/og-image.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW cache.addAll partially completed', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !currentCaches.includes(key)).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass non-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. API Requests — Network-first with smart offline cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network failed — try to serve from data cache
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;

            // Specific offline fallbacks for essential catalogs
            if (url.pathname.includes('/api/vows')) {
              return caches.match('/data/vows.json');
            }
            if (url.pathname.includes('/api/documents')) {
              return caches.match('/data/baws_catalog.json');
            }

            // Return empty JSON response rather than breaking the client
            return new Response(JSON.stringify({
              offline: true,
              message: 'Operating in Offline Sanctuary Mode. Reconnect to sync fresh archival records.'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // 2. Static Assets — Stale-While-Revalidate with offline fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // If navigating to an HTML page while offline, fallback to cached index.html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
