// AURA Neural System - Service Worker v1.0
// Offline-First Progressive Web App

const CACHE_NAME = 'aura-neural-v1.0';
const RUNTIME_CACHE = 'aura-runtime-v1.0';

// Files to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/icon-192.png',
    '/icon-512.png',
    // Add other static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

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
                console.log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // For API requests (Gemini, Supabase, etc), try network first, cache as fallback
        if (request.method === 'GET') {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        // Clone response for caching
                        const responseToCache = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                        return response;
                    })
                    .catch(() => {
                        // If network fails, try cache
                        return caches.match(request);
                    })
            );
        }
        return;
    }

    // For same-origin requests, use cache-first strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Serving from cache:', request.url);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                console.log('[SW] Fetching from network:', request.url);
                return fetch(request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone response for caching
                        const responseToCache = response.clone();

                        caches.open(request.method === 'GET' ? CACHE_NAME : RUNTIME_CACHE)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline page if available
                        if (request.destination === 'document') {
                            return caches.match('/');
                        }

                        // Return error response
                        return new Response('Offline - Content not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync initiated');

    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Sync queued data when online
            syncQueuedData()
        );
    }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'aura-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('AURA Neural System', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Helper function to sync queued data
async function syncQueuedData() {
    try {
        // Get queued data from IndexedDB
        const db = await openDatabase();
        const queue = await getQueuedData(db);

        // Sync each item
        for (const item of queue) {
            try {
                await syncItem(item);
                await removeFromQueue(db, item.id);
            } catch (error) {
                console.error('[SW] Failed to sync item:', error);
            }
        }

        console.log('[SW] Background sync complete');
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// Database helpers (for background sync)
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('aura-sync-queue', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('queue')) {
                db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getQueuedData(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['queue'], 'readonly');
        const store = transaction.objectStore('queue');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function removeFromQueue(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['queue'], 'readwrite');
        const store = transaction.objectStore('queue');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function syncItem(item) {
    // Implement actual sync logic here
    // For now, just log
    console.log('[SW] Syncing item:', item);
}

console.log('[SW] Service Worker loaded');
