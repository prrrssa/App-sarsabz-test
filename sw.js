const CACHE_NAME = 'sabz-sarrafi-cache-v2';
// The app shell files that are absolutely required for the app to start.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo_sabz_icon.png',
  './assets/logo_sabz_text.png',
];

// Install event: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache, caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache app shell:', err);
      })
  );
});

// Fetch event: serve from cache first, then network, and cache new resources
self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get the resource from the cache.
      const cachedResponse = await cache.match(event.request);
      
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // If the fetch is successful, clone the response and store it in the cache.
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          cache.put(event.request, responseToCache);
        }
        return networkResponse;
      });

      // Return the cached response if available, otherwise wait for the network response.
      return cachedResponse || fetchPromise;
    })
  );
});


// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});