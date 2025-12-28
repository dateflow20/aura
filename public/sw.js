// AURA Neural System - Service Worker v1.2
// Offline-First Progressive Web App with Smart Caching

const CACHE_NAME = 'aura-neural-v1.2'; // Incremented version
const RUNTIME_CACHE = 'aura-runtime-v1.2';

// Files to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/icon-192.png',
    '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v1.2...');
    self.skipWaiting(); // Force immediate activation

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker v1.2...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete, taking control');
                return self.clients.claim(); // Take control of all clients immediately
            })
    );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests (except for Google Fonts, etc.)
    if (url.origin !== location.origin) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
        return;
    }

    // For JavaScript and CSS files: NETWORK-FIRST (to prevent stale code issues)
    if (request.destination === 'script' || request.destination === 'style' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Only cache successful responses
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }

    // For everything else (HTML, images, etc.): CACHE-FIRST
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version but update cache in background
                    fetch(request).then((response) => {
                        if (response && response.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, response);
                            });
                        }
                    }).catch(() => { });
                    return cachedResponse;
                }

                return fetch(request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        if (request.destination === 'document') {
                            return caches.match('/');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});
