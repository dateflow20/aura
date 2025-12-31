
const CACHE_NAME = 'gtd-aura-v2.1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.svg'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and cross-origin
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;

            return fetch(event.request).then((networkResponse) => {
                // Don't cache if not a successful response or if it's a range request
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Cache successful asset requests (JS, CSS, Images)
                const url = new URL(event.request.url);
                if (url.pathname.includes('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }

                return networkResponse;
            }).catch(() => {
                // SPA Fallback: if it's a document request, return index.html
                if (event.request.destination === 'document') {
                    return caches.match('./');
                }
                return new Response('Offline', { status: 503 });
            });
        })
    );
});
