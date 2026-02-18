// Service Worker for Vocabulary Dojo PWA
// Handles caching, offline support, and asset management

const CACHE_NAME = 'vocab-dojo-v2';
const AUDIO_CACHE = 'vocab-dojo-audio-v1';

// Core assets to precache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './word_details.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// External assets to cache opportunistically (won't block install if they fail)
const EXTERNAL_URLS = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
];

// Install event: precache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache local assets (must succeed)
      console.log('[SW] Precaching local assets...');
      await cache.addAll(PRECACHE_URLS);
      console.log('[SW] Local assets cached');

      // Cache external assets individually (failures are OK)
      for (const url of EXTERNAL_URLS) {
        try {
          await cache.add(url);
          console.log('[SW] Cached:', url);
        } catch (err) {
          console.warn('[SW] Could not cache (will try at runtime):', url);
        }
      }

      // Cache Google Fonts CSS with no-cors mode
      try {
        const fontResp = await fetch('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        if (fontResp.ok) {
          await cache.put('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap', fontResp);
          console.log('[SW] Google Fonts CSS cached');
        }
      } catch (err) {
        console.warn('[SW] Could not cache Google Fonts CSS');
      }

      self.skipWaiting();
    })
  );
});

// Activate event: clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== AUDIO_CACHE) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // NAVIGATION REQUESTS: always serve cached index.html as fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        console.log('[SW] Navigation offline, serving cached index.html');
        return caches.match('./index.html') || caches.match('./');
      })
    );
    return;
  }

  // AUDIO FILES: cache-first with lazy caching
  if (url.pathname.match(/\/audio\/.*\.mp3$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(AUDIO_CACHE).then((c) => c.put(request, clone));
          }
          return resp;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // FIREBASE APIs: network-only, let Firestore IndexedDB handle offline
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('www.googleapis.com')
  ) {
    return; // Don't intercept — let Firebase SDK handle it
  }

  // GOOGLE FONTS: cache-first for font files and CSS
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return resp;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // FIREBASE SDK & CDN SCRIPTS: cache-first
  if (url.hostname === 'www.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return resp;
        }).catch(() => caches.match(request));
      })
    );
    return;
  }

  // STATIC ASSETS (JS, CSS, images, JSON): cache-first
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return resp;
        }).catch(() => caches.match(request));
      })
    );
    return;
  }

  // EVERYTHING ELSE: network-first with cache fallback
  event.respondWith(
    fetch(request).then((resp) => {
      if (resp && resp.status === 200) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
      }
      return resp;
    }).catch(() => caches.match(request))
  );
});
