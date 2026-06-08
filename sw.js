/* Droguerías Económicas — Service Worker v1.0 */
const CACHE_STATIC  = 'de-static-v2';
const CACHE_DYNAMIC = 'de-dynamic-v2';

const STATIC_ASSETS = [
  '/', '/index.html', '/productos.html', '/promociones.html',
  '/afiliaciones.html', '/contacto.html', '/404.html',
  '/css/estilos.css', '/css/afiliaciones.css',
  '/js/productos-data.js', '/js/catalogo.js', '/js/carrito.js',
  '/js/pago.js', '/js/cupones-regalo.js', '/js/checkout.js',
  '/js/wa-config.js', '/js/pwa-init.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET' || url.startsWith('chrome-extension://')) return;

  /* Imágenes externas → cache dinámico */
  if (url.includes('picsum.photos') || url.includes('fonts.gstatic')) {
    e.respondWith(cacheFirst(e.request, CACHE_DYNAMIC)); return;
  }
  /* CSS/JS/imágenes propias → cache estático */
  if (url.includes('/css/') || url.includes('/js/') || url.includes('/img/')) {
    e.respondWith(cacheFirst(e.request, CACHE_STATIC)); return;
  }
  /* HTML → network first */
  if ((e.request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(networkFirst(e.request)); return;
  }
  e.respondWith(staleWhileRevalidate(e.request));
});

function cacheFirst(req, name) {
  return caches.open(name).then(c =>
    c.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200) c.put(req, res.clone());
        return res;
      }).catch(() => new Response('', { status: 503 }));
    })
  );
}

function networkFirst(req) {
  return fetch(req).then(res => {
    if (res && res.status === 200)
      caches.open(CACHE_DYNAMIC).then(c => c.put(req, res.clone()));
    return res;
  }).catch(() =>
    caches.match(req).then(c => c || caches.match('/404.html'))
  );
}

function staleWhileRevalidate(req) {
  return caches.open(CACHE_DYNAMIC).then(c =>
    c.match(req).then(cached => {
      const fresh = fetch(req).then(res => {
        if (res && res.status === 200) c.put(req, res.clone());
        return res;
      });
      return cached || fresh;
    })
  );
}