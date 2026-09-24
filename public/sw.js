const CACHE = 'memory-arcade-v1';
const BASE_URL = new URL('./', self.location.href);
const assetUrl = (path = '') => new URL(path, BASE_URL).toString();
const CORE = [
  assetUrl(),
  assetUrl('manifest.webmanifest'),
  assetUrl('favicon.svg'),
  ...Array.from({ length: 6 }, (_, index) => assetUrl(`content/memory-0${index + 1}.svg`)),
  assetUrl('content/finale.svg'),
  assetUrl('content/reward.svg'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(CORE);
      const html = await (await fetch(assetUrl())).text();
      const builtAssets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)]
        .map((match) => new URL(match[1], BASE_URL).toString());
      if (builtAssets.length) await cache.addAll([...new Set(builtAssets)]);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(assetUrl())));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
