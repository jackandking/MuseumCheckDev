/**
 * KVAdapter - Key-Value Store 适配器
 * 用于远程 KV 存储（DynamoDB, Cloudflare Workers KV 等）
 */

class KVAdapter extends StorageAdapter {
  constructor(config = {}) {
    super({
      name: 'kvStore',
      writable: true,
      priority: 1,
      ...config
    });
    
    this.endpoint = config.endpoint || 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
    this.timeout = config.timeout || 5000; // 5秒超时
    this.defaultExpireAt = config.defaultExpireAt || (Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年
  }

  _fetchWithTimeout(url, options = {}, timeout) {
    const controller = new AbortController();
    const opts = { ...options, signal: controller.signal };
    return Promise.race([
      fetch(url, opts),
      new Promise((_, reject) => setTimeout(() => {
        try { controller.abort(); } catch (e) {}
        const err = new Error('Timeout');
        err.name = 'AbortError';
        reject(err);
      }, timeout))
    ]);
  }

  /**
   * 读取数据
   */
  async get(key, options = {}) {
    const { sortKey = 'default', timeout = this.timeout } = options;
    
    try {
      const url = `${this.endpoint}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
      const response = await this._fetchWithTimeout(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }, timeout);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`KV Store error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理响应格式
      if (data.value) {
        try {
          return JSON.parse(data.value);
        } catch (e) {
          return data.value;
        }
      }
      
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[KVStore] Timeout for key ${key}`);
      } else {
        console.error(`[KVStore] Get error for key ${key}:`, error);
      }
      return null;
    }
  }

  /**
   * 写入数据
   */
  async set(key, value, options = {}) {
    const { 
      sortKey = 'default', 
      expireAt = this.defaultExpireAt,
      timeout = this.timeout 
    } = options;
    
    try {
      const response = await this._fetchWithTimeout(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          sortKey,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          expireAt
        })
      }, timeout);
      
      if (!response.ok) {
        throw new Error(`KV Store write error: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[KVStore] Write timeout for key ${key}`);
      } else {
        console.error(`[KVStore] Set error for key ${key}:`, error);
      }
      return false;
    }
  }

  /**
   * 删除数据
   */
  async delete(key, options = {}) {
    const { sortKey = 'default', timeout = this.timeout } = options;
    
    try {
      // 通过设置过期时间为现在来"删除"
      const response = await this._fetchWithTimeout(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          sortKey,
          value: '',
          expireAt: Math.floor(Date.now() / 1000) // 立即过期
        })
      }, timeout);
      
      return response.ok;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[KVStore] Delete timeout for key ${key}`);
      } else {
        console.error(`[KVStore] Delete error for key ${key}:`, error);
      }
      return false;
    }
  }

  /**
   * 查询数据（使用通配符）
   */
  async query(condition = {}, options = {}) {
    const { key, sortKeyPattern = '*', timeout = this.timeout } = condition;
    
    if (!key) {
      throw new Error('KVStore query requires a key');
    }
    
    try {
      const url = `${this.endpoint}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKeyPattern)}`;
      const response = await this._fetchWithTimeout(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }, timeout);
      
      if (!response.ok) {
        throw new Error(`KV Store query error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理多条记录
      if (Array.isArray(data)) {
        return data.map(item => {
          try {
            return {
              key: item.key || item.pk,
              sortKey: item.sortKey || item.sk,
              value: item.value ? JSON.parse(item.value) : item,
              expireAt: item.expireAt
            };
          } catch (e) {
            return item;
          }
        });
      }
      
      // 单条记录
      if (data.value) {
        try {
          return [{
            key: data.key || data.pk,
            sortKey: data.sortKey || data.sk,
            value: JSON.parse(data.value),
            expireAt: data.expireAt
          }];
        } catch (e) {
          return [data];
        }
      }
      
      return [];
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[KVStore] Query timeout');
      } else {
        console.error('[KVStore] Query error:', error);
      }
      return [];
    }
  }

  /**
   * 批量写入（优化版）
   */
  async batchSet(items, options = {}) {
    const { sortKey = 'default', expireAt = this.defaultExpireAt } = options;
    
    const success = [];
    const failed = [];
    
    // 并发写入（限制并发数）
    const concurrency = 5;
    const entries = items instanceof Map ? Array.from(items.entries()) : Object.entries(items);
    
    for (let i = 0; i < entries.length; i += concurrency) {
      const batch = entries.slice(i, i + concurrency);
      
      const results = await Promise.allSettled(
        batch.map(([key, value]) => 
          this.set(key, value, { sortKey, expireAt })
        )
      );
      
      results.forEach((result, index) => {
        const [key] = batch[index];
        if (result.status === 'fulfilled' && result.value) {
          success.push(key);
        } else {
          failed.push(key);
        }
      });
    }
    
    return { success, failed };
  }

  /**
   * 健康检查（优化版）
   */
  async isHealthy() {
    const now = Date.now();
    
    // 1分钟内只检查一次
    if (now - this.lastHealthCheck < 60000) {
      return this.healthy;
    }
    
    this.lastHealthCheck = now;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(this.endpoint, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      this.healthy = response.ok;
      return this.healthy;
    } catch (error) {
      console.error('[KVStore] Health check failed:', error);
      this.healthy = false;
      return false;
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KVAdapter;
}

if (typeof window !== 'undefined') {
  window.KVAdapter = KVAdapter;
}
