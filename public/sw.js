/* ═══════════════════════════════════════════════════════════
   SMMFactory — Service Worker
   ===========================================================
   - Offline fallback (network-first for pages, cache-first
     for static assets, fallback to offline page)
   - Push notification handling (DESIGN_MOBILE.md §6)
   - Background sync for queued actions
   - Cache management / stale-while-revalidate for API calls
   ═══════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `smmfactory-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `smmfactory-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

/* ── Install: pre-cache static assets ───────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/manifest.json',
        // App shell assets — uncomment once built:
        // '/_next/static/css/styles.css',
        // '/_next/static/js/main.js',
      ]);
    })
  );
  // Activate immediately — don't wait for page reload
  self.skipWaiting();
});

/* ── Activate: clean old caches ──────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('smmfactory-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

/* ── Fetch: network-first with cache fallback ────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always fetch from network for API calls / non-GET
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) {
    return networkFirstThenCache(event, DYNAMIC_CACHE);
  }

  // Static assets: cache-first (fonts, icons, build output)
  if (
    url.pathname.match(/\.(css|js|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return cacheFirstThenNetwork(event, STATIC_CACHE);
  }

  // Navigations / pages: network-first
  if (request.mode === 'navigate') {
    return networkFirstThenCache(event, DYNAMIC_CACHE);
  }

  // Everything else: network-first
  return networkFirstThenCache(event, DYNAMIC_CACHE);
});

/* ── Push Notifications (DESIGN_MOBILE.md §6) ────────────── */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'SMMFactory';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: data.vibrate || [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification Click ──────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const url = event.notification.data?.url || '/';

  // Open or focus the app
  const openApp = async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        await client.focus();
        if (action === 'view') {
          client.postMessage({ type: 'NAVIGATE', url });
        }
        return;
      }
    }
    // No open client — open a new window
    if (clients.openWindow) {
      await self.clients.openWindow(url);
    }
  };

  event.waitUntil(openApp());
});

/* ── Background Sync ─────────────────────────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-campaigns') {
    event.waitUntil(syncCampaigns());
  }
  if (event.tag === 'sync-drafts') {
    event.waitUntil(syncDrafts());
  }
});

async function syncCampaigns() {
  // Placeholder: replay queued campaign updates
  console.log('[SW] Background sync: campaigns');
}

async function syncDrafts() {
  // Placeholder: replay queued draft posts
  console.log('[SW] Background sync: drafts');
}

/* ── Message Handler ──────────────────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ── Cache Strategies ─────────────────────────────────────── */

/**
 * Network-first: try the network, fall back to cache, fall back
 * to offline page for navigations.
 */
async function networkFirstThenCache(event, cacheName) {
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    // Fall back to offline page for navigation requests
    if (event.request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) return offlineResponse;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Cache-first: serve from cache, update cache in background.
 */
async function cacheFirstThenNetwork(event, cacheName) {
  const cached = await caches.match(event.request);
  if (cached) {
    // Stale-while-revalidate in background
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          caches.open(cacheName).then((cache) => cache.put(event.request, response));
        }
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
