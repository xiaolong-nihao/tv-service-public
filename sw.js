
// 缓存名称和版本
const CACHE_NAME = 'device-manager-v1.0.0';
const urlsToCache = [
  './',
  './admin_tools.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// 安装事件 - 缓存核心文件
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存核心文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('所有资源缓存成功');
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker 激活');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 已准备好处理请求');
      return self.clients.claim();
    })
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', event => {
  // 只缓存同源请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，返回缓存
        if (response) {
          return response;
        }

        // 否则从网络获取
        return fetch(event.request).then(response => {
          // 检查是否有效的响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应
          const responseToCache = response.clone();

          // 将新请求添加到缓存
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // 网络请求失败时，可以返回一个离线页面
        return new Response('网络连接失败，请检查网络连接', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// 接收来自页面的消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
