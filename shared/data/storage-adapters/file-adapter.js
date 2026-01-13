/**
 * FileAdapter - 文件存储适配器
 * 用于从 CDN 读取静态 JSON 文件（只读）
 */

class FileAdapter extends StorageAdapter {
  constructor(config = {}) {
    super({
      name: 'fileStorage',
      writable: false, // 只读
      priority: 3,
      ...config
    });
    
    this.baseUrl = config.baseUrl || '';
    this.cacheBusting = config.cacheBusting !== false;
    this.timeout = config.timeout || 5000;
  }

  /**
   * 读取文件
   */
  async get(key, options = {}) {
    const { path = 'museums', extension = 'json' } = options;
    
    try {
      let url = `${this.baseUrl}/${path}/${key}.${extension}`;
      
      // 添加版本号防止缓存
      if (this.cacheBusting) {
        const version = options.version || Date.now();
        url += `?v=${version}`;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: options.cache || 'default',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`File fetch error: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[FileStorage] Timeout for ${key}`);
      } else {
        console.error(`[FileStorage] Get error for ${key}:`, error);
      }
      return null;
    }
  }

  /**
   * 写入文件（不支持）
   */
  async set(key, value, options = {}) {
    throw new Error('FileAdapter is read-only. Use backfill script for updates.');
  }

  /**
   * 删除文件（不支持）
   */
  async delete(key, options = {}) {
    throw new Error('FileAdapter is read-only. Use backfill script for updates.');
  }

  /**
   * 查询文件（通过索引文件）
   */
  async query(condition = {}, options = {}) {
    const { indexFile = 'museums-meta', path = 'data' } = condition;
    
    try {
      // 读取索引文件
      const index = await this.get(indexFile, { path, extension: 'json' });
      
      if (!index || !Array.isArray(index.museums)) {
        return [];
      }
      
      // 根据条件筛选
      let results = index.museums;
      
      if (condition.filter) {
        results = results.filter(condition.filter);
      }
      
      if (condition.limit) {
        results = results.slice(0, condition.limit);
      }
      
      return results;
    } catch (error) {
      console.error('[FileStorage] Query error:', error);
      return [];
    }
  }

  /**
   * 批量读取文件
   */
  async batchGet(keys, options = {}) {
    const results = new Map();
    
    // 并发读取（限制并发数）
    const concurrency = 5;
    
    for (let i = 0; i < keys.length; i += concurrency) {
      const batch = keys.slice(i, i + concurrency);
      
      const promises = batch.map(key => 
        this.get(key, options)
          .then(value => ({ key, value }))
          .catch(error => ({ key, value: null, error }))
      );
      
      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ key, value }) => {
        if (value !== null) {
          results.set(key, value);
        }
      });
    }
    
    return results;
  }

  /**
   * 健康检查
   */
  async isHealthy() {
    const now = Date.now();
    
    if (now - this.lastHealthCheck < 60000) {
      return this.healthy;
    }
    
    this.lastHealthCheck = now;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // 尝试读取一个已知存在的文件
      const url = `${this.baseUrl}/data/museums-meta.json?v=${Date.now()}`;
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      this.healthy = response.ok;
      return this.healthy;
    } catch (error) {
      console.error('[FileStorage] Health check failed:', error);
      this.healthy = false;
      return false;
    }
  }

  /**
   * 设置 base URL
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * 获取文件 URL
   */
  getFileUrl(key, options = {}) {
    const { path = 'museums', extension = 'json' } = options;
    let url = `${this.baseUrl}/${path}/${key}.${extension}`;
    
    if (this.cacheBusting) {
      const version = options.version || Date.now();
      url += `?v=${version}`;
    }
    
    return url;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileAdapter;
}

if (typeof window !== 'undefined') {
  window.FileAdapter = FileAdapter;
}
