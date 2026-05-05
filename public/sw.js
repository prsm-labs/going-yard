// public/sw.js
// Going Yard — Service Worker
// Handles push notifications and notification click deep-linking

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()));

// ── Push received — show notification ────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  let payload = {};
  try { payload = e.data.json(); } catch { payload = { title: e.data.text(), body: '' }; }

  const title   = payload.title || 'Going Yard';
  const body    = payload.body  || '';
  const url     = payload.url   || '/#live/gameday';
  const icon    = '/icons/icon-192.png';
  const badge   = '/icons/badge-72.png';
  const tag     = payload.dedupKey || `gy-${Date.now()}`;

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,                   // dedup — same tag replaces previous
      renotify: false,       // don't vibrate again for same tag
      data: { url },         // store deep-link for click handler
      vibrate: [100, 50, 100],
    })
  );
});

// ── Notification clicked — navigate to deep-link URL ─────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const targetUrl = (e.notification.data && e.notification.data.url)
    ? e.notification.data.url
    : '/#live/gameday';

  // Resolve to absolute URL
  const absolute = new URL(targetUrl, self.location.origin).href;

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // If app is already open in a tab, focus it and navigate
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          // Post message so App.jsx can handle the hash-based routing
          client.postMessage({ type: 'NOTIFY_NAV', url: absolute });
          return client.focus();
        }
      }
      // No open tab — open a new one at the target URL
      return self.clients.openWindow(absolute);
    })
  );
});
