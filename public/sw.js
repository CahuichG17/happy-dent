// Happy Dent Admin — Service Worker
// Estrategia: Network-first para el admin (siempre datos frescos),
// con fallback a cache para que la shell cargue sin conexion.

const CACHE = 'hd-admin-v1';

// Recursos de shell que se precachean al instalar
const PRECACHE = [
  '/admin',
  '/admin/login',
  '/manifest.webmanifest',
  '/happy-dent-icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen
  if (url.origin !== self.location.origin) return;

  // API y autenticacion: siempre red, sin cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Para todo lo demas: Network-first con fallback a cache
  e.respondWith(
    fetch(request)
      .then((res) => {
        // Guardar en cache solo respuestas exitosas de navegacion/estaticos
        if (res.ok && (request.mode === 'navigate' || request.destination === 'script' || request.destination === 'style' || request.destination === 'image')) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response('Sin conexión', { status: 503 })))
  );
});
