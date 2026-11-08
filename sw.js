const CACHE = 'rumbo-v16';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/apple-touch-icon.png', './fonts/inter.woff2', './img/gym.png', './img/clase.png', './img/trabajo.png', './img/estudio.png', './img/leer.png', './img/correr.png', './img/meditar.png', './img/proyecto.png', './img/despertar.png', './img/dormir.png', './img/otro.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (e.request.mode === 'navigate') { // página: primero red (para recibir versiones nuevas), si no hay internet, la guardada
    e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.pathname.endsWith('.apk')) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })));
});

// Avisos push (iPhone con la app en inicio, Android y PC en el navegador)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Rumbo', {
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    tag: d.act ? 'act-' + d.act : undefined, data: { act: d.act || null }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const act = e.notification.data && e.notification.data.act;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { if (act) c.postMessage({ open: act }); return c.focus(); } }
    return self.clients.openWindow('./' + (act ? '?open=' + encodeURIComponent(act) : ''));
  }));
});
