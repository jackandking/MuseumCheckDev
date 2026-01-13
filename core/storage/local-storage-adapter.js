/**
 * LocalStorageAdapter - localStorage 适配器
 * 用于浏览器本地存储
 */

class LocalStorageAdapter extends StorageAdapter {
  constructor(config = {}) {
    super({
      name: 'localStorage',
      writable: true,
      priority: 0,
      ...config
    });
    
    this.prefix = config.prefix || 'museumcheck_';
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * 获取完整键名（带前缀）
   */
  _getFullKey(key) {
    // 如果键已经有前缀，不重复添加
    if (key.startsWith(this.prefix)) {
      return key;
    }
    return `${this.prefix}${key}`;
  }

  /**
   * 读取数据
   */
  async get(key, options = {}) {
    try {
      const fullKey = options.skipPrefix ? key : this._getFullKey(key);
      const data = localStorage.getItem(fullKey);
      
      if (data === null) {
        return null;
      }
      
      // 尝试解析 JSON
      try {
        return JSON.parse(data);
      } catch (e) {
        // 如果不是 JSON，返回原始字符串
        return data;
      }
    } catch (error) {
      console.error(`[LocalStorage] Get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 写入数据
   */
  async set(key, value, options = {}) {
    try {
      const fullKey = options.skipPrefix ? key : this._getFullKey(key);
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      
      localStorage.setItem(fullKey, data);
      return true;
    } catch (error) {
      // 处理 QuotaExceededError
      if (error.name === 'QuotaExceededError') {
        console.warn('[LocalStorage] Quota exceeded, attempting cleanup...');
        
        await this._cleanup(options);
        
        // 重试一次
        try {
          const fullKey = options.skipPrefix ? key : this._getFullKey(key);
          const data = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(fullKey, data);
          return true;
        } catch (retryError) {
          console.error('[LocalStorage] Set failed after cleanup:', retryError);
          return false;
        }
      }
      
      console.error(`[LocalStorage] Set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除数据
   */
  async delete(key, options = {}) {
    try {
      const fullKey = options.skipPrefix ? key : this._getFullKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`[LocalStorage] Delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 查询数据（模糊匹配）
   */
  async query(condition = {}, options = {}) {
    try {
      const { pattern, limit } = condition;
      const results = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // 只处理带前缀的键
        if (!key.startsWith(this.prefix)) {
          continue;
        }
        
        // 如果有模式，检查是否匹配
        if (pattern) {
          const regex = new RegExp(pattern);
          if (!regex.test(key)) {
            continue;
          }
        }
        
        const value = await this.get(key, { skipPrefix: true });
        results.push({
          key: key.replace(this.prefix, ''),
          value
        });
        
        // 限制结果数量
        if (limit && results.length >= limit) {
          break;
        }
      }
      
      return results;
    } catch (error) {
      console.error('[LocalStorage] Query error:', error);
      return [];
    }
  }

  /**
   * 清理旧数据
   */
  async _cleanup(options = {}) {
    try {
      const items = [];
      
      // 收集所有带前缀的项
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          items.push({
            key,
            timestamp: this._getTimestamp(key)
          });
        }
      }
      
      // 按时间戳排序
      items.sort((a, b) => a.timestamp - b.timestamp);
      
      // 删除最旧的 20%
      const deleteCount = Math.ceil(items.length * 0.2);
      for (let i = 0; i < deleteCount; i++) {
        localStorage.removeItem(items[i].key);
      }
      
      console.log(`[LocalStorage] Cleaned up ${deleteCount} items`);
    } catch (error) {
      console.error('[LocalStorage] Cleanup error:', error);
    }
  }

  /**
   * 获取键的时间戳（从数据中提取或使用当前时间）
   */
  _getTimestamp(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return 0;
      
      const parsed = JSON.parse(data);
      
      // 尝试找到时间戳字段
      if (parsed.timestamp) return parsed.timestamp;
      if (parsed.createdAt) return parsed.createdAt;
      if (parsed.updatedAt) return parsed.updatedAt;
      
      return 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageInfo() {
    try {
      let totalSize = 0;
      let itemCount = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          totalSize += key.length + (value ? value.length : 0);
          itemCount++;
        }
      }
      
      return {
        itemCount,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      };
    } catch (error) {
      console.error('[LocalStorage] getStorageInfo error:', error);
      return null;
    }
  }

  /**
   * 清空所有数据
   */
  async clear() {
    try {
      const keys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => localStorage.removeItem(key));
      
      return true;
    } catch (error) {
      console.error('[LocalStorage] Clear error:', error);
      return false;
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalStorageAdapter;
}

if (typeof window !== 'undefined') {
  window.LocalStorageAdapter = LocalStorageAdapter;
}
