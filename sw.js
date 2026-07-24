// 家計記録 PWA — オフラインキャッシュ
const CACHE = "kakei-v8";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットワーク優先（常に最新を取得）→ オフライン時はキャッシュにフォールバック
// 自分のファイル（同一オリジン）はブラウザHTTPキャッシュを迂回し、push後すぐ反映させる
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  const net = sameOrigin
    ? fetch(req.url, { cache: "no-store", credentials: "same-origin" })
    : fetch(req);
  e.respondWith(
    net.then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
