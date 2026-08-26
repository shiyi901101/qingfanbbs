// 青帆社区 Service Worker
var CACHE_NAME = 'qingfan-v8.17';
var ASSETS = [
  './',
  './index.html',
  './yangfan_youth_platform.html',
  './yangfan_admin.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

// Install: cache core assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Network-first for HTML (so updates are picked up immediately), cache-first for other assets
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  var isHTML = req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') > -1;

  if (isHTML) {
    // Network-first for HTML navigation
    event.respondWith(
      fetch(req).then(function(resp) {
        if (resp && resp.status === 200) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        }
        return resp;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match('./yangfan_youth_platform.html');
        });
      })
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(resp) {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            var clone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
          }
          return resp;
        }).catch(function() {});
      })
    );
  }
});
