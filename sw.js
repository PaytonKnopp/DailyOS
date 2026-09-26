/* Daily OS service worker — makes the home-screen app open instantly and work offline.
   The app shell is served from cache and refreshed in the background, so a new version
   shows up on the launch after it's published. Bump VERSION whenever the shell files change. */
var VERSION = "dailyos-v4";
var SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png"
];

self.addEventListener("install", function (e) {
  /* cache: "reload" skips the browser's HTTP cache, so a new version never installs with stale files */
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    /* serve the cached app instantly, refresh the cache in the background for next launch */
    var refresh = fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put("index.html", copy); }); }
      return res;
    });
    e.waitUntil(refresh.catch(function () {}));
    e.respondWith(caches.match("index.html").then(function (hit) { return hit || refresh; }));
    return;
  }

  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
