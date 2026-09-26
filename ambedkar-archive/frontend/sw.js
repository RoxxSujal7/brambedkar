// sw.js — Service Worker for Ambedkar Digital Heritage Archive
const CACHE_NAME = 'ambedkar-archive-v2';
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
  '/js/navigation-system.js',
  '/js/vendor/lenis.min.js',
  '/js/vendor/gsap.min.js',
  '/js/vendor/ScrollTrigger.min.js',
  '/data/offline_vows.json',
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
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Bypass API and external requests
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
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
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
