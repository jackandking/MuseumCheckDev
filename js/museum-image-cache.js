/**
 * Museum Image Cache Service
 * 
 * 缓存当天打卡博物馆的相关照片，提升用户访问体验
 * - 使用 IndexedDB 存储图片 blob 数据
 * - 实现 LRU (最近最少使用) 淘汰策略
 * - 自动预加载当天打卡博物馆的图片
 */

const MuseumImageCache = (function() {
    'use strict';

    // 配置常量
    const CONFIG = {
        DB_NAME: 'MuseumCheckImageCache',
        DB_VERSION: 1,
        STORE_NAME: 'images',
        META_STORE_NAME: 'metadata',
        MAX_CACHE_SIZE_MB: 50,           // 最大缓存大小 (MB)
        MAX_CACHE_ITEMS: 100,            // 最大缓存条目数
        TODAY_PRIORITY_BOOST: 1000000,   // 当天打卡博物馆的优先级提升
        CACHE_EXPIRY_DAYS: 7             // 缓存过期天数
    };

    let db = null;
    let isInitialized = false;

    /**
     * 初始化 IndexedDB 数据库
     */
    async function initDB() {
        if (isInitialized && db) {
            return db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB 打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                isInitialized = true;
                console.log('图片缓存数据库初始化成功');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                // 创建图片存储
                if (!database.objectStoreNames.contains(CONFIG.STORE_NAME)) {
                    const imageStore = database.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'url' });
                    imageStore.createIndex('museumId', 'museumId', { unique: false });
                    imageStore.createIndex('lastAccess', 'lastAccess', { unique: false });
                }

                // 创建元数据存储
                if (!database.objectStoreNames.contains(CONFIG.META_STORE_NAME)) {
                    database.createObjectStore(CONFIG.META_STORE_NAME, { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * 获取今天的日期字符串 (YYYY-MM-DD)
     */
    function getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 获取当天打卡的博物馆列表
     */
    function getTodayCheckedInMuseums() {
        try {
            const todayKey = `todayCheckins_${getTodayString()}`;
            const saved = localStorage.getItem(todayKey);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('读取今日打卡记录失败:', e);
            return [];
        }
    }

    /**
     * 记录今天打卡的博物馆
     */
    function recordTodayCheckin(museumId) {
        try {
            const todayKey = `todayCheckins_${getTodayString()}`;
            const checkins = getTodayCheckedInMuseums();
            
            if (!checkins.includes(museumId)) {
                checkins.push(museumId);
                localStorage.setItem(todayKey, JSON.stringify(checkins));
            }
            
            // 清理过期的打卡记录
            cleanupOldCheckinRecords();
        } catch (e) {
            console.warn('记录今日打卡失败:', e);
        }
    }

    /**
     * 清理超过7天的打卡记录
     */
    function cleanupOldCheckinRecords() {
        try {
            const today = new Date();
            const keys = Object.keys(localStorage).filter(k => k.startsWith('todayCheckins_'));
            
            keys.forEach(key => {
                const dateStr = key.replace('todayCheckins_', '');
                const recordDate = new Date(dateStr);
                const diffDays = (today - recordDate) / (1000 * 60 * 60 * 24);
                
                if (diffDays > CONFIG.CACHE_EXPIRY_DAYS) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('清理旧打卡记录失败:', e);
        }
    }

    /**
     * 检查博物馆是否为当天打卡
     */
    function isTodayCheckin(museumId) {
        return getTodayCheckedInMuseums().includes(museumId);
    }

    /**
     * 将图片 URL 转换为 Blob
     */
    async function urlToBlob(url) {
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return await response.blob();
        } catch (e) {
            // 尝试通过代理加载
            if (typeof IMAGE_PROXY !== 'undefined') {
                const proxiedUrl = IMAGE_PROXY.getProxiedUrl(url, 'weserv');
                const response = await fetch(proxiedUrl);
                if (response.ok) {
                    return await response.blob();
                }
            }
            throw e;
        }
    }

    /**
     * 缓存单张图片
     */
    async function cacheImage(url, museumId) {
        if (!url || !isInitialized) return null;

        try {
            await initDB();
            
            // 检查是否已缓存
            const existing = await getCachedImage(url);
            if (existing) {
                // 更新访问时间
                await updateAccessTime(url, museumId);
                return existing;
            }

            // 下载图片
            const blob = await urlToBlob(url);
            const size = blob.size;

            // 检查存储空间，必要时淘汰旧缓存
            await ensureStorageSpace(size);

            // 存储图片
            const imageData = {
                url: url,
                museumId: museumId,
                blob: blob,
                size: size,
                lastAccess: Date.now(),
                createdAt: Date.now(),
                isTodayCheckin: isTodayCheckin(museumId)
            };

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const request = store.put(imageData);

                request.onsuccess = () => {
                    console.log(`图片已缓存: ${url.substring(0, 50)}...`);
                    resolve(URL.createObjectURL(blob));
                };

                request.onerror = () => {
                    console.warn('图片缓存失败:', request.error);
                    reject(request.error);
                };
            });
        } catch (e) {
            console.warn('缓存图片失败:', url, e);
            return null;
        }
    }

    /**
     * 获取缓存的图片
     */
    async function getCachedImage(url) {
        if (!url || !isInitialized) return null;

        try {
            await initDB();

            return new Promise((resolve) => {
                const transaction = db.transaction([CONFIG.STORE_NAME], 'readonly');
                const store = transaction.objectStore(CONFIG.STORE_NAME);
                const request = store.get(url);

                request.onsuccess = () => {
                    if (request.result && request.result.blob) {
                        resolve(URL.createObjectURL(request.result.blob));
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    resolve(null);
                };
            });
        } catch (e) {
            return null;
        }
    }

    /**
     * 更新图片访问时间
     */
    async function updateAccessTime(url, museumId) {
        if (!db) return;

        try {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.get(url);

            request.onsuccess = () => {
                if (request.result) {
                    const data = request.result;
                    data.lastAccess = Date.now();
                    data.isTodayCheckin = isTodayCheckin(museumId || data.museumId);
                    store.put(data);
                }
            };
        } catch (e) {
            console.warn('更新访问时间失败:', e);
        }
    }

    /**
     * 获取缓存统计信息
     */
    async function getCacheStats() {
        if (!db) {
            await initDB();
        }

        return new Promise((resolve) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result || [];
                const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
                
                resolve({
                    itemCount: items.length,
                    totalSizeBytes: totalSize,
                    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                    maxSizeMB: CONFIG.MAX_CACHE_SIZE_MB,
                    todayCheckinItems: items.filter(i => i.isTodayCheckin).length
                });
            };

            request.onerror = () => {
                resolve({ itemCount: 0, totalSizeBytes: 0, totalSizeMB: '0' });
            };
        });
    }

    /**
     * 确保有足够的存储空间 (LRU 淘汰策略)
     * 当天打卡的博物馆图片有更高的保留优先级
     */
    async function ensureStorageSpace(neededBytes) {
        if (!db) return;

        const stats = await getCacheStats();
        const currentSize = stats.totalSizeBytes;
        const maxSize = CONFIG.MAX_CACHE_SIZE_MB * 1024 * 1024;

        // 如果空间足够且条目数未超限，无需淘汰
        if (currentSize + neededBytes < maxSize && stats.itemCount < CONFIG.MAX_CACHE_ITEMS) {
            return;
        }

        // 获取所有缓存条目并按优先级排序
        return new Promise((resolve) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result || [];
                
                // 计算优先级分数 (越低越容易被淘汰)
                // 当天打卡的博物馆图片获得优先级提升
                items.forEach(item => {
                    let score = item.lastAccess || 0;
                    if (item.isTodayCheckin) {
                        score += CONFIG.TODAY_PRIORITY_BOOST;
                    }
                    item._priorityScore = score;
                });

                // 按优先级升序排序 (低优先级在前)
                items.sort((a, b) => a._priorityScore - b._priorityScore);

                // 计算需要释放的空间
                let freedSpace = 0;
                const targetFreeSpace = neededBytes + (maxSize * 0.1); // 额外释放10%空间
                const deletePromises = [];

                for (const item of items) {
                    if (freedSpace >= targetFreeSpace && stats.itemCount - deletePromises.length < CONFIG.MAX_CACHE_ITEMS) {
                        break;
                    }
                    
                    // 跳过当天打卡的图片 (除非必须释放空间)
                    if (item.isTodayCheckin && freedSpace < neededBytes) {
                        continue;
                    }

                    freedSpace += item.size || 0;
                    deletePromises.push(
                        new Promise((res) => {
                            const delReq = store.delete(item.url);
                            delReq.onsuccess = () => {
                                console.log(`淘汰缓存: ${item.url.substring(0, 40)}...`);
                                res();
                            };
                            delReq.onerror = () => res();
                        })
                    );
                }

                Promise.all(deletePromises).then(resolve);
            };

            request.onerror = () => resolve();
        });
    }

    /**
     * 预加载博物馆的所有藏品图片
     */
    async function preloadMuseumImages(museumId, collections) {
        if (!collections || !Array.isArray(collections)) return;

        // 记录今日打卡
        recordTodayCheckin(museumId);

        // 收集所有图片 URL
        const imageUrls = collections
            .map(c => c.imageUrl || c.url)
            .filter(url => url && typeof url === 'string');

        console.log(`开始预加载 ${museumId} 的 ${imageUrls.length} 张图片...`);

        // 并发预加载 (限制并发数为3)
        const concurrency = 3;
        const results = [];
        
        for (let i = 0; i < imageUrls.length; i += concurrency) {
            const batch = imageUrls.slice(i, i + concurrency);
            const batchResults = await Promise.allSettled(
                batch.map(url => cacheImage(url, museumId))
            );
            results.push(...batchResults);
        }

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`预加载完成: ${successCount}/${imageUrls.length} 张图片已缓存`);

        return successCount;
    }

    /**
     * 获取图片 (优先从缓存获取)
     */
    async function getImage(url, museumId) {
        if (!url) return url;

        try {
            // 先尝试从缓存获取
            const cached = await getCachedImage(url);
            if (cached) {
                // 更新访问时间
                updateAccessTime(url, museumId);
                return cached;
            }

            // 缓存未命中，尝试缓存并返回
            const cachedUrl = await cacheImage(url, museumId);
            return cachedUrl || url;
        } catch (e) {
            return url; // 失败时返回原始 URL
        }
    }

    /**
     * 清除所有缓存
     */
    async function clearCache() {
        if (!db) {
            await initDB();
        }

        return new Promise((resolve) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('图片缓存已清除');
                resolve(true);
            };

            request.onerror = () => {
                console.warn('清除缓存失败:', request.error);
                resolve(false);
            };
        });
    }

    /**
     * 清除过期缓存
     */
    async function clearExpiredCache() {
        if (!db) {
            await initDB();
        }

        const expiryTime = Date.now() - (CONFIG.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        return new Promise((resolve) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result || [];
                let deletedCount = 0;

                items.forEach(item => {
                    // 不删除当天打卡的图片
                    if (item.isTodayCheckin) return;
                    
                    if (item.createdAt < expiryTime) {
                        store.delete(item.url);
                        deletedCount++;
                    }
                });

                console.log(`已清除 ${deletedCount} 个过期缓存`);
                resolve(deletedCount);
            };

            request.onerror = () => resolve(0);
        });
    }

    // 初始化时清理过期缓存
    initDB().then(() => {
        clearExpiredCache();
    }).catch(e => {
        console.warn('图片缓存初始化失败，将使用直接加载:', e);
    });

    // 公开 API
    return {
        init: initDB,
        cacheImage,
        getCachedImage,
        getImage,
        preloadMuseumImages,
        getCacheStats,
        clearCache,
        clearExpiredCache,
        recordTodayCheckin,
        isTodayCheckin,
        getTodayCheckedInMuseums
    };
})();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MuseumImageCache;
}
