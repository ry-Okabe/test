/* PWA技術検証用の最小 Service Worker
   目的：Androidの「インストール」要件（manifest＋fetchハンドラを持つSW＋HTTPS）を満たすこと。
   ついでにアプリ外殻をキャッシュ（通信断でも検証画面が開く）。本格的なオフライン設計は別途。 */
const CACHE = "pwa-kensho-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// cache-first（外殻）→ 無ければネットワーク
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
