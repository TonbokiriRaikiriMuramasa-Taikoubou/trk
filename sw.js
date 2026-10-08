// SPDX-License-Identifier: GPL-3.0-or-later
/* trk! offline shell: network first, cached same-origin app files as a fallback. */
const CACHE = "trk-v2026.10.8-trk37";
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

/* 🛡 セーフモード（?safe=1）のページでは、キャッシュしたアプリの殻を使いません。
   キャッシュはページ内で動くコード（アドオンなど）からも書けるため、汚染されたコピーを
   セーフモードで実行してしまわないようにするためです。通信できるときは今までどおりネットワーク優先、
   オフラインのときだけ「キャッシュを見ない」ぶん、安全側に倒します（§docs/SECURITY.md）。 */
const safeClients = new Set();
function safeWanted(url) {
  const params = new URLSearchParams(url.search);
  return params.has("safe") || params.has("safety") || String(url.hash || "").toLowerCase().includes("safe");
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  if (request.mode === "navigate" && safeWanted(url)) safeClients.add(event.clientId);
  const safeClient = safeClients.has(event.clientId);

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
      if (safeClient) {
        return new Response("trk! is offline. Safe mode does not use the cached copy -- reconnect and reload.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
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
