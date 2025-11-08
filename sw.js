const CACHE_NAME = 'psychosuite-v18';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './index.js',
  './config.js',
  './sw-register.js',
  './manifest.json',
  './index.css',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js'
  // URL для @google/genai больше не нужен здесь, так как он импортируется как модуль в index.html
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Делаем кэширование необязательных ресурсов более отказоустойчивым
        const cachePromises = URLS_TO_CACHE.map(urlToCache => {
            return cache.add(urlToCache).catch(err => {
                console.warn(`Failed to cache ${urlToCache}:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        // Если ресурса нет в кэше, пробуем загрузить его из сети
        return fetch(event.request).then(
          networkResponse => {
            // Не кэшируем запросы к AI
            if (event.request.url.includes('generativelanguage.googleapis.com')) {
                return networkResponse;
            }
            // Кэшируем успешные GET-запросы
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(() => {
            // Обработка ошибок сети. Можно вернуть страницу-заглушку для офлайн-режима, если нужно.
        });
      }
    )
  );
});