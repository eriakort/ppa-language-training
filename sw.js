/*
 * Offline support. Keeps a copy of the app so it opens without internet (the communication board must
 * work anywhere). Network first: when online the latest files are always used and the copy is
 * refreshed; the copy is used only when the network fails. Only this site's own files are cached:
 * Supabase and other services are never stored here.
 *
 * Keep SHELL in step with index.html (tests/offline.test.js checks this). Bump VERSION when the list changes.
 */
var VERSION = "pog-shell-v1";
var SHELL = [
  "./", "index.html", "css/styles.css",
  "js/strings.js", "content/base.js", "content/interests.js",
  "js/speech.js", "js/recorder.js", "js/recordings.js",
  "js/vendor/supabase-js-2.119.0.js", "js/supabase-config.js",
  "js/app.js", "js/album-store.js", "js/aac.js", "js/album.js",
  "js/account.js", "js/cloud-sync.js", "js/therapist-cloud.js", "js/profile-lifecycle.js",
  "js/deletion-retention.js", "js/ownership-transfer.js", "js/account-deletion-review.js",
  "js/utility-menu.js", "js/offline.js",
  "assets/fonts/atkinson-regular-latin.woff2", "assets/fonts/atkinson-regular-latin-ext.woff2",
  "assets/fonts/atkinson-bold-latin.woff2", "assets/fonts/atkinson-bold-latin-ext.woff2"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(VERSION).then(function (cache) {
    /* One missing file must not stop the rest from being saved. */
    return Promise.all(SHELL.map(function (url) { return cache.add(new Request(url, { cache: "reload" })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("pog-shell-") === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && res.type === "basic") {
      var copy = res.clone();
      caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      if (req.mode === "navigate") return caches.match("index.html");
      return Response.error();
    });
  }));
});
