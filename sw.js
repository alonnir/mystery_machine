// Service Worker for Vocabulary Dojo PWA
// Handles caching, offline support, and asset management

const CACHE_NAME = 'vocab-dojo-v1';
const AUDIO_CACHE = 'vocab-dojo-audio-v1';

// Core assets to precache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './word_details.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Firebase SDK scripts
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
  // Google Fonts CSS
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap'
];

// Install event: precache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching core assets...');
      return cache.addAll(PRECACHE_URLS).catch((error) => {
        console.error('[SW] Precache failed:', error);
        // Don't fail install if precache fails - network will be available
        return Promise.resolve();
      });
    }).then(() => {
      // Activate immediately without waiting for other tabs to close
      self.skipWaiting();
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event: implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy 1: Cache-first for audio files (lazy cache)
  if (url.pathname.match(/\/audio\/.*\.mp3$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Audio served from cache:', url.pathname);
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            // Cache the audio file for future use
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(AUDIO_CACHE).then((cache) => {
                cache.put(request, responseToCache);
                console.log('[SW] Audio cached:', url.pathname);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            console.warn('[SW] Audio fetch failed (offline):', url.pathname);
            return caches.match(request);
          });
      })
    );
    return;
  }

  // Strategy 2: Network-first for Firebase APIs
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch((error) => {
          console.warn('[SW] Firebase API unavailable (offline):', error);
          // Firebase handles offline caching via IndexedDB
          return caches.match(request);
        })
    );
    return;
  }

  // Strategy 3: Cache-first for Firebase AI modular SDK
  if (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/12.9.0')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
      })
    );
    return;
  }

  // Strategy 4: Cache-first for Google Fonts font files
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
      })
    );
    return;
  }

  // Strategy 5: Cache-first for other cached core assets
  // (index, CSS, JS, images, manifest, Firebase SDK scripts, Google Fonts CSS)
  if (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            console.warn('[SW] Asset fetch failed:', url.pathname);
            // Return cached version if available
            return caches.match(request);
          });
      })
    );
    return;
  }

  // Strategy 6: Network-first for everything else
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.warn('[SW] Fetch failed, returning cached version:', url.pathname);
        return caches.match(request);
      })
  );
});
