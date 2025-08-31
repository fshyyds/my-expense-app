const CACHE_NAME = 'expense-app-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
    console.log('SW: 安装中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('SW: 缓存文件');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('SW: 缓存失败', error);
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
    console.log('SW: 激活中...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: 清理旧缓存', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
    console.log('SW: 获取资源', event.request.url);
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 如果缓存中有，直接返回缓存
                if (response) {
                    console.log('SW: 从缓存返回', event.request.url);
                    return response;
                }
                
                // 否则去网络获取
                console.log('SW: 从网络获取', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // 检查是否有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // 克隆响应，因为响应只能消费一次
                        const responseToCache = response.clone();
                        
                        // 缓存新的响应
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('SW: 网络请求失败', error);
                        
                        // 如果请求HTML页面且网络失败，返回离线页面
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        // 其他资源返回离线提示
                        return new Response('离线模式', {
                            status: 200,
                            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                        });
                    });
            })
    );
});

// 处理后台同步
self.addEventListener('sync', (event) => {
    console.log('SW: 后台同步', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 后台同步函数
async function doBackgroundSync() {
    try {
        // 这里可以处理离线时的数据同步
        console.log('SW: 执行后台同步任务');
        // 例如：同步离线时创建的待办事项到服务器
    } catch (error) {
        console.error('SW: 后台同步失败', error);
    }
}

// 推送通知处理
self.addEventListener('push', (event) => {
    console.log('SW: 收到推送消息', event);
    
    const options = {
        body: event.data ? event.data.text() : '您有新的通知',
        icon: './icon-192x192.png',
        badge: './icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: './icon-72x72.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: './icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('记账本提醒', options)
    );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
    console.log('SW: 通知被点击', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // 打开应用
        event.waitUntil(
            clients.openWindow('./')
        );
    } else {
        // 关闭通知
        console.log('SW: 通知已关闭');
    }
});

// 监听消息
self.addEventListener('message', (event) => {
    console.log('SW: 收到消息', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 错误处理
self.addEventListener('error', (event) => {
    console.error('SW: 发生错误', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('SW: 未处理的Promise拒绝', event.reason);
});
