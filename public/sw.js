// DR DHL Elite Fitness Club — Service Worker
// Provides installability and caches the application shell.
// NOTE: Sensitive ERP/member data is NOT cached offline — only
// static assets and the app shell are cached. All data requests
// go to the network.

const CACHE_NAME = 'drdhl-fitness-v1';

// Static assets to pre-cache (app shell only)
const SHELL_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
];

// ---------------------------------------------------------------------------
// Install: pre-cache app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache shell assets; ignore individual failures so install always
      // succeeds even when some assets aren't reachable at install time.
      return Promise.allSettled(
        SHELL_ASSETS.map((url) => cache.add(url).catch(() => null))
      );
    }).then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate: remove stale caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch: network-first strategy for API/data, cache-first for static assets.
// IMPORTANT: Never cache authenticated data or API responses.
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never cache Supabase API calls or any /api/ routes
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.pathname.includes('_next/data') ||
    url.searchParams.has('apikey')
  ) {
    return; // let the browser handle it normally
  }

  // For Next.js static assets (_next/static): cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For authenticated app routes: network-first, fall back to cache for offline
  // shell rendering only. Do not serve stale authenticated data.
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
