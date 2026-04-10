const CACHE_NAME = 'dfar-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/',
  '/corpus/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // Notify all active clients that cached content is being served
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SERVING_FROM_CACHE', url: event.request.url });
          });
        });
        return response;
      }
      return fetch(event.request);
    })
  );
});
