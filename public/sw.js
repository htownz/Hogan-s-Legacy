// Act Up - Service Worker for Mobile Optimization
const CACHE_NAME = 'act-up-v1';
const OFFLINE_CACHE = 'act-up-offline-v1';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/dashboard',
  '/bills',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache for offline access
const API_CACHE_PATTERNS = [
  /\/api\/bills\/critical/,
  /\/api\/mobile\/optimized/,
  /\/api\/notifications/
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(CACHE_NAME).then(cache => {
        console.log('Service Worker: Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Create offline cache
      caches.open(OFFLINE_CACHE).then(cache => {
        console.log('Service Worker: Creating offline cache');
        return cache.add('/offline.html');
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same-origin requests
    event.respondWith(handleSameOriginRequest(request));
  } else {
    // Cross-origin requests (CDNs, external APIs)
    event.respondWith(handleCrossOriginRequest(request));
  }
});

// Handle same-origin requests with cache-first strategy for assets
async function handleSameOriginRequest(request) {
  const url = new URL(request.url);
  
  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request);
  }
  
  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    return handleStaticAsset(request);
  }
  
  // HTML pages - network first with cache fallback
  return handlePageRequest(request);
}

// Handle API requests with smart caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API endpoint should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (!shouldCache) {
    // Don't cache sensitive endpoints, just fetch
    return fetch(request).catch(() => {
      return new Response(JSON.stringify({ 
        error: 'Network unavailable', 
        offline: true 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      });
    });
  }

  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Add offline indicator to cached API responses
      const data = await cachedResponse.json();
      return new Response(JSON.stringify({
        ...data,
        _offline: true,
        _cachedAt: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No cache available
    return new Response(JSON.stringify({ 
      error: 'No cached data available', 
      offline: true 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Failed to load asset:', request.url);
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Show offline page
    return caches.match('/offline.html');
  }
}

// Handle cross-origin requests
async function handleCrossOriginRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('Service Worker: Cross-origin request failed:', request.url);
    throw error;
  }
}

// Check if a path is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'bill-updates') {
    event.waitUntil(syncBillUpdates());
  }
  
  if (event.tag === 'user-actions') {
    event.waitUntil(syncUserActions());
  }
});

// Sync bill updates when back online
async function syncBillUpdates() {
  try {
    const response = await fetch('/api/bills/critical');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/api/bills/critical', response.clone());
      console.log('Service Worker: Bill updates synced');
    }
  } catch (error) {
    console.log('Service Worker: Failed to sync bill updates:', error);
  }
}

// Sync user actions when back online
async function syncUserActions() {
  try {
    // Get queued actions from IndexedDB (would need to implement)
    console.log('Service Worker: User actions sync not implemented yet');
  } catch (error) {
    console.log('Service Worker: Failed to sync user actions:', error);
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'A bill you\'re tracking has been updated',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: { billId: 'unknown' },
    actions: [
      { action: 'view', title: 'View Update' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: true,
    tag: 'bill-update'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.message || options.body;
      options.data = data;
    } catch (error) {
      console.log('Service Worker: Failed to parse push data');
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Act Up - Bill Update', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'view' && data.billId) {
    // Open the bill page
    event.waitUntil(
      clients.openWindow(`/bills/${data.billId}`)
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle message from main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});