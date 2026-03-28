// AUDIT V1.2 [V12-SEC-004]: Cache apenas recursos do proprio origin.
// CDNs protegidos por SRI no HTML — nao precisam de cache local.
var CACHE_NAME = 'mamae-app-v3';
var ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './features.js',
    './content.js',
    './extras.js',
    './baby-illustrations.js'
];

// Install - cache core assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) { return cache.addAll(ASSETS_TO_CACHE); })
            .then(function() { return self.skipWaiting(); })
    );
});

// Activate - clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        }).then(function() { return self.clients.claim(); })
    );
});

// Fetch - network first, cache only own-origin resources
self.addEventListener('fetch', function(event) {
    // Skip non-GET requests and API calls
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('generativelanguage.googleapis.com')) return;

    // AUDIT V1.2: Only cache resources from own origin
    var requestUrl = new URL(event.request.url);
    var isOwnOrigin = requestUrl.origin === self.location.origin;

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Cache only successful own-origin responses
                if (response.ok && isOwnOrigin) {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(function() {
                // Fallback to cache when offline
                return caches.match(event.request);
            })
    );
});
