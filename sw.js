// Shows offline.html when a page cannot be loaded without a connection.
// Pages are always fetched from the network first, so the app itself is never
// served stale from here; only the offline page (and its icon) is cached.
// Paths are relative to this file, so it works under /my-portfolio/ too.

// Bump the version whenever offline.html changes, so the new one is cached
const CACHE = "offline-v1";
const OFFLINE_URL = "offline.html";
const PRECACHE = [OFFLINE_URL, "favicon.svg"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            // "reload" skips the browser's HTTP cache, so a fresh copy is stored
            .then((cache) =>
                cache.addAll(
                    PRECACHE.map((url) => new Request(url, { cache: "reload" }))
                )
            )
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key !== CACHE)
                    .map((key) => caches.delete(key))
            );

            // Lets page loads start while the service worker is still waking up
            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
            }

            await self.clients.claim();
        })()
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    const preloaded = await event.preloadResponse;
                    if (preloaded) return preloaded;

                    return await fetch(request);
                } catch {
                    const cache = await caches.open(CACHE);
                    return cache.match(OFFLINE_URL);
                }
            })()
        );
        return;
    }

    // The offline page's icon, which it cannot fetch while offline
    if (new URL(request.url).pathname.endsWith("/favicon.svg")) {
        event.respondWith(
            caches
                .match(request)
                .then((cached) => cached || fetch(request))
        );
    }
});
