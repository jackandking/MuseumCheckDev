/**
 * StorageAdapter - 存储适配器基类
 * 定义统一的存储接口，所有具体适配器必须实现这些方法
 */

class StorageAdapter {
  constructor(config = {}) {
    this.name = config.name || 'unknown';
    this.writable = config.writable !== false; // 默认可写
    this.priority = config.priority || 0; // 优先级，数字越小优先级越高
    this.config = config;
    this.healthy = true;
    this.lastHealthCheck = Date.now();
  }

  /**
   * 读取数据
   * @param {string} key - 数据键
   * @param {Object} options - 选项
   * @returns {Promise<*>} - 数据值，不存在返回 null
   */
  async get(key, options = {}) {
    throw new Error(`${this.name}: get() method not implemented`);
  }

  /**
   * 写入数据
   * @param {string} key - 数据键
   * @param {*} value - 数据值
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} - 是否成功
   */
  async set(key, value, options = {}) {
    if (!this.writable) {
      throw new Error(`${this.name}: Adapter is read-only`);
    }
    throw new Error(`${this.name}: set() method not implemented`);
  }

  /**
   * 删除数据
   * @param {string} key - 数据键
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} - 是否成功
   */
  async delete(key, options = {}) {
    if (!this.writable) {
      throw new Error(`${this.name}: Adapter is read-only`);
    }
    throw new Error(`${this.name}: delete() method not implemented`);
  }

  /**
   * 查询数据
   * @param {Object} condition - 查询条件
   * @param {Object} options - 选项
   * @returns {Promise<Array>} - 查询结果
   */
  async query(condition = {}, options = {}) {
    throw new Error(`${this.name}: query() method not implemented`);
  }

  /**
   * 批量读取
   * @param {Array<string>} keys - 键数组
   * @param {Object} options - 选项
   * @returns {Promise<Map>} - 键值对 Map
   */
  async batchGet(keys, options = {}) {
    const results = new Map();
    
    for (const key of keys) {
      try {
        const value = await this.get(key, options);
        if (value !== null) {
          results.set(key, value);
        }
      } catch (error) {
        console.error(`[${this.name}] batchGet error for key ${key}:`, error);
      }
    }
    
    return results;
  }

  /**
   * 批量写入
   * @param {Map|Object} items - 键值对
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 成功和失败的键
   */
  async batchSet(items, options = {}) {
    const success = [];
    const failed = [];
    
    const entries = items instanceof Map ? items.entries() : Object.entries(items);
    
    for (const [key, value] of entries) {
      try {
        const result = await this.set(key, value, options);
        if (result) {
          success.push(key);
        } else {
          failed.push(key);
        }
      } catch (error) {
        console.error(`[${this.name}] batchSet error for key ${key}:`, error);
        failed.push(key);
      }
    }
    
    return { success, failed };
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} - 是否健康
   */
  async isHealthy() {
    const now = Date.now();
    
    // 避免频繁健康检查（1分钟内只检查一次）
    if (now - this.lastHealthCheck < 60000) {
      return this.healthy;
    }
    
    this.lastHealthCheck = now;
    
    try {
      // 尝试写入和读取测试键
      const testKey = `__health_check_${this.name}__`;
      const testValue = { timestamp: now };
      
      await this.set(testKey, testValue, { skipValidation: true });
      const result = await this.get(testKey, { skipValidation: true });
      
      this.healthy = result !== null;
      
      // 清理测试键
      try {
        await this.delete(testKey, { skipValidation: true });
      } catch (e) {
        // 忽略删除错误
      }
      
      return this.healthy;
    } catch (error) {
      console.error(`[${this.name}] Health check failed:`, error);
      this.healthy = false;
      return false;
    }
  }

  /**
   * 获取适配器信息
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      writable: this.writable,
      priority: this.priority,
      healthy: this.healthy,
      lastHealthCheck: this.lastHealthCheck
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageAdapter;
}

if (typeof window !== 'undefined') {
  window.StorageAdapter = StorageAdapter;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageAdapter;
}

if (typeof window !== 'undefined') {
  window.StorageAdapter = StorageAdapter;
}
