const CACHE_NAME = 'adaptive-reader-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/corpus/article.json', // generic generic for testing
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Workbox-less fallback. Ignore errors if files don't physically exist during build
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Strategy: Cache First for /corpus/ files; Network First for everything else
  const url = new URL(event.request.url);
  
  if (url.pathname.includes('/corpus/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
