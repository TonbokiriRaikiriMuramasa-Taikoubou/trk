// SPDX-License-Identifier: GPL-3.0-or-later
/* trk! サービスワーカー：ネット優先。オフラインのときだけ保存した版を使う。
   同じサイトのファイルだけを対象にし、CDN（three.js）や読み込んだ曲は扱いません。 */
const CACHE = "trk-v2026.10";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);   // 古い版を消す
  await self.clients.claim();
})()));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req))
  );
});
