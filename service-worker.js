
const CACHE_NAME = 'hudoor-cache-v3';
// Use relative paths to ensure it works in subdirectories
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  // Force this service worker to become the active service worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
             // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Optional: Dynamic caching for other assets could go here
            return response;
        }).catch(() => {
            // If fetch fails (e.g., offline or server 404 on navigation), try to serve index.html
            // This handles the SPA routing fallback for offline or weird server configs
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html').then(idx => {
                    return idx || caches.match('./'); // Fallback to root if index.html specific cache misses
                });
            }
        });
      })
  );
});
