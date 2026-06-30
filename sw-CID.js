// A unique name for this cache version. Change the v1 to v2, etc., when you update the app.
const CACHE_NAME = 'cutter-id-cache-v1';

// The exact file names you want to save to the device for offline use
const ASSETS_TO_CACHE = [
  './', // Caches the root directory
  './Cutter_ID_Generator.html',
  './manifest-CID.json',
  './CID-icon-192.png'
];

// 1. Install Event: Opens the cache and saves the files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Files successfully cached for offline use.');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 2. Fetch Event: Intercepts requests and serves from cache if available (enables offline mode)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return the cached version if we have it, otherwise go to the network
        return response || fetch(event.request);
      })
  );
});

// 3. Activate Event: Cleans up any old caches if you change the CACHE_NAME
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});