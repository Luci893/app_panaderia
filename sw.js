/**
 * ========================================
 * SERVICE WORKER - Panadería Ingredientes
 * ========================================
 * Permite funcionamiento offline básico
 */

const CACHE_NAME = 'panaderia-ingredientes-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app_panaderia.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// ========================================
// INSTALACIÓN - Cachear recursos estáticos
// ========================================
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando recursos...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] Recursos cacheados');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Error al cachear:', error);
            })
    );
});

// ========================================
// ACTIVACIÓN - Limpiar caches antiguos
// ========================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activo');
                return self.clients.claim();
            })
    );
});

// ========================================
// FETCH - Estrategia cache first, fallback network
// ========================================
self.addEventListener('fetch', (event) => {
    // No cachear solicitudes externas
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then((response) => {
                        // No cachear respuestas no válidas
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar respuesta para cachear
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Fallback offline si no hay conexión
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// ========================================
// MENSAJES DESDE EL CLIENTE
// ========================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});