// Monetag SW معطّل مؤقتاً أثناء مراجعة AdSense (2026-07-06).
// هذا stub يلغي تسجيل نفسه عند أول تحديث في متصفحات الزوار القدامى.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          if (client instanceof WindowClient) client.navigate(client.url).catch(() => {});
        });
      })
      .catch(() => {})
  );
});
