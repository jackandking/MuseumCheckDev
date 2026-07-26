/**
 * DataManager - 统一数据管理器
 * 提供统一的数据访问接口，支持多级缓存、降级策略和私有 overlay
 */

class DataManager {
  static instance = null;

  static getInstance(config = {}) {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager(config);
    }
    return DataManager.instance;
  }

  constructor(config = {}) {
    if (DataManager.instance) {
      return DataManager.instance;
    }
    
    this.config = config;
    this.adapters = []; // 存储适配器列表，按优先级排序
    this.overlayManager = new OverlayManager(config);
    this.eventBus = config.eventBus || (typeof EventBus !== 'undefined' ? EventBus.getInstance() : null);
    this.currentUserId = config.userId || null;
    
    // 初始化适配器
    this._initializeAdapters(config);
    
    // 监听 overlay 审核事件
    this._setupEventListeners();
    
    DataManager.instance = this;
  }

  /**
   * 初始化存储适配器
   */
  _initializeAdapters(config) {
    // 默认配置
    const defaultConfig = {
      localStorage: {
        enabled: true,
        prefix: 'museumcheck_'
      },
      kvStore: {
        enabled: true,
        endpoint: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore'
      },
      mysql: {
        enabled: true,
        endpoint: (typeof API_ENDPOINTS !== 'undefined') ? API_ENDPOINTS.MYSQL.BASE : 'https://museumcheck.cn/mysql'
      },
      fileStorage: {
        enabled: true,
        baseUrl: ''
      }
    };
    
    const mergedConfig = { ...defaultConfig, ...config };
    
    // 创建适配器实例
    if (mergedConfig.localStorage.enabled && typeof LocalStorageAdapter !== 'undefined') {
      this.adapters.push(new LocalStorageAdapter(mergedConfig.localStorage));
    }
    
    if (mergedConfig.kvStore.enabled && typeof KVAdapter !== 'undefined') {
      this.adapters.push(new KVAdapter(mergedConfig.kvStore));
    }
    
    if (mergedConfig.mysql.enabled && typeof SQLAdapter !== 'undefined') {
      this.adapters.push(new SQLAdapter(mergedConfig.mysql));
    }
    
    if (mergedConfig.fileStorage.enabled && typeof FileAdapter !== 'undefined') {
      this.adapters.push(new FileAdapter(mergedConfig.fileStorage));
    }
    
    // 按优先级排序
    this.adapters.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 设置事件监听器
   */
  _setupEventListeners() {
    if (!this.eventBus) return;
    
    // 监听 overlay 审核通过事件，同步到公共层
    this.eventBus.on('overlay:approved', async (data) => {
      const { key, value, userId } = data;
      
      try {
        // 写入公共存储层（KV Store 或 MySQL）
        await this.setPublic(key, value);
        
        console.log(`[DataManager] Synced approved overlay ${key} to public storage`);
      } catch (error) {
        console.error('[DataManager] Failed to sync approved overlay:', error);
      }
    });
  }

  /**
   * 设置当前用户 ID
   */
  setUserId(userId) {
    this.currentUserId = userId;
  }

  /**
   * 获取当前用户 ID
   */
  getUserId() {
    if (this.currentUserId) {
      return this.currentUserId;
    }
    
    // 尝试从 localStorage 获取
    try {
      const userId = localStorage.getItem('userId') || 
                     localStorage.getItem('museumcheck_user_id');
      if (userId) {
        this.currentUserId = userId;
        return userId;
      }
    } catch (e) {
      // 忽略错误
    }
    
    return null;
  }

  /**
   * 统一读取接口
   * @param {string} key - 数据键
   * @param {Object} options - 选项
   * @returns {Promise<*>} - 数据值
   */
  async get(key, options = {}) {
    const userId = options.userId || this.getUserId();
    
    // 1. 检查 overlay（用户私有数据）
    if (userId) {
      const overlayData = await this.overlayManager.get(key, userId);
      if (overlayData !== null) {
        if (this.eventBus) {
          this.eventBus.emit('data:hit', { source: 'overlay', key, userId });
        }
        return overlayData;
      }
    }
    
    // 2. 按优先级遍历适配器
    for (const adapter of this.adapters) {
      try {
        const data = await adapter.get(key, options);
        if (data !== null) {
          if (this.eventBus) {
            this.eventBus.emit('data:hit', { source: adapter.name, key });
          }
          return data;
        }
      } catch (error) {
        console.warn(`[DataManager] ${adapter.name} get failed, trying next adapter:`, error);
        if (this.eventBus) {
          this.eventBus.emit('data:miss', { source: adapter.name, key, error: error.message });
        }
      }
    }
    
    // 未找到数据
    return null;
  }

  /**
   * 统一写入接口（提交者即时可见）
   * @param {string} key - 数据键
   * @param {*} value - 数据值
   * @param {Object} options - 选项
   */
  async set(key, value, options = {}) {
    const userId = options.userId || this.getUserId();
    
    // 1. 如果有用户 ID，先写入 overlay（立即可见）
    if (userId && options.useOverlay !== false) {
      await this.overlayManager.set(key, value, userId, {
        status: options.status || 'pending',
        metadata: options.metadata
      });
    }
    
    // 2. 异步写入持久化层（可写的适配器）
    const writePromises = this.adapters
      .filter(adapter => adapter.writable)
      .map(adapter => 
        adapter.set(key, value, options)
          .catch(error => {
            console.error(`[DataManager] ${adapter.name} set failed:`, error);
            return false;
          })
      );
    
    const results = await Promise.allSettled(writePromises);
    
    // 检查是否至少有一个写入成功
    const anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true);
    
    if (this.eventBus) {
      this.eventBus.emit('data:set', { 
        key, 
        userId, 
        success: anySuccess,
        adapters: this.adapters.filter(a => a.writable).map(a => a.name)
      });
    }
    
    return anySuccess;
  }

  /**
   * 写入公共存储（不使用 overlay）
   */
  async setPublic(key, value, options = {}) {
    return await this.set(key, value, { ...options, useOverlay: false });
  }

  /**
   * localStorage 便捷方法
   */
  async getLocal(key, options = {}) {
    const adapter = this.adapters.find(a => a.name === 'localStorage');
    if (!adapter) {
      throw new Error('LocalStorage adapter not found');
    }
    return await adapter.get(key, options);
  }

  async setLocal(key, value, options = {}) {
    const adapter = this.adapters.find(a => a.name === 'localStorage');
    if (!adapter) {
      throw new Error('LocalStorage adapter not found');
    }
    return await adapter.set(key, value, options);
  }

  /**
   * KV Store 便捷方法
   */
  async kvGet(key, options = {}) {
    const adapter = this.adapters.find(a => a.name === 'kvStore');
    if (!adapter) {
      throw new Error('KV Store adapter not found');
    }
    return await adapter.get(key, options);
  }

  async kvSet(key, value, options = {}) {
    const adapter = this.adapters.find(a => a.name === 'kvStore');
    if (!adapter) {
      throw new Error('KV Store adapter not found');
    }
    return await adapter.set(key, value, options);
  }

  /**
   * SQL 查询便捷方法
   */
  async query(condition, options = {}) {
    const adapter = this.adapters.find(a => a.name === 'mysql');
    if (!adapter) {
      throw new Error('SQL adapter not found');
    }
    return await adapter.query(condition, options);
  }

  /**
   * 删除数据
   */
  async delete(key, options = {}) {
    const userId = options.userId || this.getUserId();
    
    // 删除 overlay
    if (userId) {
      await this.overlayManager.delete(key, userId);
    }
    
    // 删除持久化层
    const deletePromises = this.adapters
      .filter(adapter => adapter.writable)
      .map(adapter => 
        adapter.delete(key, options)
          .catch(error => {
            console.error(`[DataManager] ${adapter.name} delete failed:`, error);
            return false;
          })
      );
    
    const results = await Promise.allSettled(deletePromises);
    const anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true);
    
    return anySuccess;
  }

  /**
   * 批量读取
   */
  async batchGet(keys, options = {}) {
    const results = new Map();
    
    for (const key of keys) {
      const value = await this.get(key, options);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  /**
   * 批量写入
   */
  async batchSet(items, options = {}) {
    const entries = items instanceof Map ? items.entries() : Object.entries(items);
    const results = { success: [], failed: [] };
    
    for (const [key, value] of entries) {
      try {
        const success = await this.set(key, value, options);
        if (success) {
          results.success.push(key);
        } else {
          results.failed.push(key);
        }
      } catch (error) {
        console.error(`[DataManager] batchSet error for key ${key}:`, error);
        results.failed.push(key);
      }
    }
    
    return results;
  }

  /**
   * Overlay 管理方法
   */
  async approveOverlay(key, userId) {
    return await this.overlayManager.approve(key, userId);
  }

  async rejectOverlay(key, userId, reason) {
    return await this.overlayManager.reject(key, userId, reason);
  }

  async listUserOverlays(userId, options) {
    return await this.overlayManager.listByUser(userId, options);
  }

  async listPendingOverlays() {
    return await this.overlayManager.listPending();
  }

  /**
   * 获取适配器健康状态
   */
  async getAdaptersHealth() {
    const health = [];
    
    for (const adapter of this.adapters) {
      const isHealthy = await adapter.isHealthy();
      health.push({
        name: adapter.name,
        healthy: isHealthy,
        priority: adapter.priority,
        writable: adapter.writable
      });
    }
    
    return health;
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    return {
      adapters: this.adapters.map(a => a.getInfo()),
      overlay: this.overlayManager.getStats()
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
}

if (typeof window !== 'undefined') {
  window.DataManager = DataManager;
}
