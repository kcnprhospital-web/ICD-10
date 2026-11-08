/* KCPH ICD-10 Finder — service worker (offline support)
   Developed by Dr. Yeap Kong, Technical Office, Kampong Chhnang Provincial Hospital.
   Bump VERSION whenever index.html or the data files change. */
const VERSION = 'kcph-icd10-v1.2.0-2026-11d';
const CORE = ['./', 'index.html', 'manifest.json', 'icd10-data.json?v=2026-11a', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'lib/xlsx.full.min.js', 'lib/qrcode.min.js',
  'fonts/kantumruy-pro-khmer-400-normal.woff2', 'fonts/kantumruy-pro-khmer-600-normal.woff2', 'fonts/kantumruy-pro-khmer-700-normal.woff2',
  'fonts/kantumruy-pro-latin-400-normal.woff2', 'fonts/kantumruy-pro-latin-600-normal.woff2', 'fonts/kantumruy-pro-latin-700-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache the Apps Script backend
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  // App page: network first, so updates arrive; fall back to cache offline
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  // Everything else (data, icons, fonts, SheetJS, QR library): cache first, then network and store
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
    return r;
  })));
});
