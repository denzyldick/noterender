/* noop service worker
 * The Workbox-generated service worker caused pathological request latency
 * (15-60s per request) on Cloudflare Pages, breaking the station model load in
 * the Studio. This inert SW registers/activates but does NOT intercept fetch,
 * so every request goes straight to the network (same behavior as dev).
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
});
