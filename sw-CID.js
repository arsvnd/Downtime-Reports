// Cutter ID Generator service worker.
//
// Strategy:
//  - The page itself (HTML) and the manifest: NETWORK FIRST. When the phone is online it
//    always gets the latest version from GitHub Pages; the cached copy is only used offline.
//    This means you no longer need to bump the cache name for updates to reach people.
//  - Icons and other static files: CACHE FIRST (they rarely change), refreshed in the background.
//
// Bumping CACHE_NAME is still fine (it clears old caches), but it's no longer required.
const CACHE_NAME = 'cutter-id-cache-v3';

const ASSETS_TO_CACHE = [
  './Cutter_ID_Generator.html',
  './manifest-CID.json',
  './CID-icon-192.png',
  './CID-icon-180.png',
  './CID-icon-app-192.png',
  './CID-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n.startsWith('cutter-id-cache') && n !== CACHE_NAME)
             .map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

function isFreshFirst(request) {
  if (request.mode === 'navigate') return true;
  const path = new URL(request.url).pathname;
  return path.endsWith('.html') || path.endsWith('.json') || path.endsWith('/');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const page = await cache.match('./Cutter_ID_Generator.html');
      if (page) return page;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await refresh) || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle same-origin GET requests; let everything else go straight to the network.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(isFreshFirst(request) ? networkFirst(request) : cacheFirst(request));
});
