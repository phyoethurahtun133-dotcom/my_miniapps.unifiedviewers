const CACHE_NAME = 'ror-colregs-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest-viewer.json',
  '/assets/icons/icon.svg',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-maskable.svg'
];

// Install Event - Pre-caches the app files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA: Removing old cache storage', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Serves cached versions immediately for instant offline speeds
self.addEventListener('fetch', (event) => {
  // SAFETY CHECK: Only intercept standard GET requests from your own app origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, but update cache in background silently
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => /* Ignore network failures offline */ {});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
