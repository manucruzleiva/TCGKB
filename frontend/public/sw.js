// Service Worker for TCG Knowledge Base PWA
// Version: 1.1.0

// Cache names
const CACHE_VERSION = '1.1.0';
const STATIC_CACHE = `tcgkb-static-v${CACHE_VERSION}`;
const IMAGES_CACHE = `tcgkb-images-v${CACHE_VERSION}`;
const API_CACHE = `tcgkb-api-v${CACHE_VERSION}`;
const FONTS_CACHE = `tcgkb-fonts-v${CACHE_VERSION}`;

// Cache TTLs (in milliseconds)
const IMAGE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const API_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker', CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Force immediate activation
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker', CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old cache versions
            return (
              name.startsWith('tcgkb-') &&
              !name.includes(CACHE_VERSION)
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control immediately
  self.clients.claim();
});

// Fetch event - apply cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return;

  // Route to appropriate cache strategy
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'font') {
    event.respondWith(handleFontRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

/**
 * Cache-First strategy for static assets (HTML, JS, CSS)
 * - Try cache first
 * - If not in cache, fetch from network and cache
 * - If network fails, return offline page for navigation
 */
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Not in cache, fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed
    console.log('[SW] Network failed for static asset:', request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }

    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Last resort: generic offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Stale-While-Revalidate strategy for card images
 * - Return cached version immediately
 * - Fetch fresh version in background
 * - Update cache for next time
 * - Respect TTL (30 days)
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGES_CACHE);

  // Try to get from cache
  const cachedResponse = await caches.match(request);

  // Check if cached response is still valid (TTL)
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const age = now - cachedDate;

    if (age < IMAGE_TTL) {
      // Cache is fresh, return it and maybe revalidate in background
      fetchAndCache(request, cache);
      return cachedResponse;
    }
  }

  // No valid cache, try network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, return stale cache if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache and no network
    return new Response('Image not available offline', { status: 503 });
  }
}

/**
 * Cache-First strategy for fonts
 * - Fonts rarely change, prioritize cache
 */
async function handleFontRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(FONTS_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    return new Response('Font not available offline', { status: 503 });
  }
}

/**
 * Network-First strategy for API calls
 * - Try network first (fresh data)
 * - Cache successful GET responses
 * - Fallback to cache if network fails
 * - Respect TTL (7 days)
 */
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful GET responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[SW] Network failed for API:', request.url);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Check TTL
      const cachedDate = new Date(cachedResponse.headers.get('date'));
      const now = new Date();
      const age = now - cachedDate;

      if (age < API_TTL) {
        console.log('[SW] Returning cached API response');
        return cachedResponse;
      } else {
        console.log('[SW] Cached API response expired');
      }
    }

    // No valid cache
    return new Response(
      JSON.stringify({ error: 'Offline - No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Helper: Fetch and cache in background
 */
async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silent fail - background revalidation
    console.log('[SW] Background revalidation failed:', request.url);
  }
}

// Message handler for manual cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
