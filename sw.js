// 青帆社区 Service Worker（v110 上架版）
var CACHE_NAME = 'qingfan-v110';
var ASSETS = [
  './',
  './index.html',
  './yangfan_youth_platform.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './splash-hero.webp'
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

// HTML network-first（更新即时生效）；其余 cache-first；离线兜底缓存 HTML
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  var isHTML = req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') > -1;

  if (isHTML) {
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
