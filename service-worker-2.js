// TeachMate School Portal - Service Worker (portal + head teacher dashboard + admin dashboard)
// Pages: network-first (so security fixes and new versions arrive straight away), cached copy when offline.
// Static files: cache-first. Firebase / Firestore / payments are never intercepted.

const CACHE_VERSION = 'tm-portal-v5';
const CACHE_NAME = `${CACHE_VERSION}-shell`;

const APP_SHELL = [
  './',
  './index.html',
  './headteacher.html',
  './admin.html',
  './office.css',
  './office.js',
  './manifest.json',
  './icons/icon-192-1.png',
  './icons/icon-512-1.png'
];

const NETWORK_ONLY_HOSTS = [
  'firestore.googleapis.com',
  'firebaseio.com',
  'firebaseinstallations.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'googleapis.com',
  'gstatic.com',
  'onrender.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // one missing file must not stop the whole install
      .then((cache) => Promise.all(APP_SHELL.map((u) => cache.add(u).catch((e) => console.warn('[SW] skip', u, e)))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => (k.startsWith('tm-headteacher-') || k.startsWith('tm-portal-')) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (NETWORK_ONLY_HOSTS.some((h) => url.hostname.includes(h))) return;
  if (url.origin !== self.location.origin) return;

  const isPage = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isPage) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, copy));
      }
      return res;
    }))
  );
});
