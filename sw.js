// SPDX-License-Identifier: GPL-3.0-or-later
/* trk! offline shell: network first, cached same-origin app files as a fallback. */
const CACHE = "trk-v2026.10.5-spec4";
const CACHE_PREFIX = "trk-";
const SCOPE = new URL(self.registration.scope);

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        try {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        } catch { /* storage may be unavailable or full; the network response still works */ }
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const offlineHome = new URL("index.html", SCOPE).href;
        const fallback = await caches.match(offlineHome);
        if (fallback) return fallback;
      }
      return new Response("trk! is offline. Reconnect to load this file.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
