const CACHE_NAME = 'learnforward-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/apple-touch-icon.png',
  // Add more static assets as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Runtime cache for images and fonts
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|otf)$/)) {
    event.respondWith(
      caches.open('runtime-assets').then(cache =>
        cache.match(event.request).then(response => {
          return response || fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
      )
    );
    return;
  }

  // Navigation requests: fallback to offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Default: cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

// TODO: Add push notification and background sync support
