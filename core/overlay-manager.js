/**
 * OverlayManager - 私有数据层管理器
 * 用于管理用户提交的 UGC 内容，提交者即时可见，审核后公开
 */

class OverlayManager {
  constructor(config = {}) {
    this.config = config;
    this.overlays = new Map(); // userId -> Map<key, data>
    this.eventBus = config.eventBus || (typeof EventBus !== 'undefined' ? EventBus.getInstance() : null);
    
    // 从 localStorage 恢复数据
    this._loadFromStorage();
  }

  /**
   * 创建私有 overlay
   * @param {string} key - 数据键
   * @param {*} value - 数据值
   * @param {string} userId - 用户 ID
   * @param {Object} options - 选项
   */
  async set(key, value, userId, options = {}) {
    if (!userId) {
      throw new Error('OverlayManager.set requires userId');
    }
    
    // 确保用户的 overlay map 存在
    if (!this.overlays.has(userId)) {
      this.overlays.set(userId, new Map());
    }
    
    const userOverlay = this.overlays.get(userId);
    
    // 创建 overlay 条目
    const overlayItem = {
      value,
      timestamp: Date.now(),
      status: options.status || 'pending', // pending | approved | rejected
      metadata: options.metadata || {}
    };
    
    userOverlay.set(key, overlayItem);
    
    // 持久化到 localStorage
    this._persistToStorage(userId);
    
    // 触发事件
    if (this.eventBus) {
      this.eventBus.emit('overlay:created', {
        key,
        userId,
        status: overlayItem.status
      });
    }
    
    return true;
  }

  /**
   * 读取私有 overlay
   * @param {string} key - 数据键
   * @param {string} userId - 用户 ID
   * @returns {*} - 数据值，不存在返回 null
   */
  async get(key, userId) {
    if (!userId) {
      return null;
    }
    
    const userOverlay = this.overlays.get(userId);
    if (!userOverlay) {
      return null;
    }
    
    const item = userOverlay.get(key);
    return item ? item.value : null;
  }

  /**
   * 删除 overlay
   * @param {string} key - 数据键
   * @param {string} userId - 用户 ID
   */
  async delete(key, userId) {
    if (!userId) {
      return false;
    }
    
    const userOverlay = this.overlays.get(userId);
    if (!userOverlay) {
      return false;
    }
    
    const deleted = userOverlay.delete(key);
    
    if (deleted) {
      this._persistToStorage(userId);
      
      if (this.eventBus) {
        this.eventBus.emit('overlay:deleted', { key, userId });
      }
    }
    
    return deleted;
  }

  /**
   * 审核通过 overlay
   * @param {string} key - 数据键
   * @param {string} userId - 用户 ID
   * @returns {Object} - overlay 数据
   */
  async approve(key, userId) {
    const userOverlay = this.overlays.get(userId);
    if (!userOverlay) {
      throw new Error(`No overlay found for user ${userId}`);
    }
    
    const item = userOverlay.get(key);
    if (!item) {
      throw new Error(`No overlay found for key ${key}`);
    }
    
    // 更新状态
    item.status = 'approved';
    item.approvedAt = Date.now();
    
    this._persistToStorage(userId);
    
    // 触发事件（让 DataManager 处理同步到公共层）
    if (this.eventBus) {
      this.eventBus.emit('overlay:approved', {
        key,
        userId,
        value: item.value
      });
    }
    
    return item;
  }

  /**
   * 拒绝 overlay
   * @param {string} key - 数据键
   * @param {string} userId - 用户 ID
   * @param {string} reason - 拒绝原因
   */
  async reject(key, userId, reason = '') {
    const userOverlay = this.overlays.get(userId);
    if (!userOverlay) {
      throw new Error(`No overlay found for user ${userId}`);
    }
    
    const item = userOverlay.get(key);
    if (!item) {
      throw new Error(`No overlay found for key ${key}`);
    }
    
    // 更新状态
    item.status = 'rejected';
    item.rejectedAt = Date.now();
    item.rejectReason = reason;
    
    this._persistToStorage(userId);
    
    if (this.eventBus) {
      this.eventBus.emit('overlay:rejected', {
        key,
        userId,
        reason
      });
    }
    
    return item;
  }

  /**
   * 获取用户的所有 overlay
   * @param {string} userId - 用户 ID
   * @param {Object} options - 筛选选项
   * @returns {Array} - overlay 列表
   */
  async listByUser(userId, options = {}) {
    const userOverlay = this.overlays.get(userId);
    if (!userOverlay) {
      return [];
    }
    
    let items = Array.from(userOverlay.entries()).map(([key, item]) => ({
      key,
      ...item
    }));
    
    // 按状态筛选
    if (options.status) {
      items = items.filter(item => item.status === options.status);
    }
    
    // 排序
    if (options.sortBy === 'timestamp') {
      items.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // 限制数量
    if (options.limit) {
      items = items.slice(0, options.limit);
    }
    
    return items;
  }

  /**
   * 获取所有待审核的 overlay
   * @returns {Array} - 待审核列表
   */
  async listPending() {
    const pending = [];
    
    for (const [userId, userOverlay] of this.overlays.entries()) {
      for (const [key, item] of userOverlay.entries()) {
        if (item.status === 'pending') {
          pending.push({
            key,
            userId,
            ...item
          });
        }
      }
    }
    
    // 按时间排序
    pending.sort((a, b) => a.timestamp - b.timestamp);
    
    return pending;
  }

  /**
   * 清理已审核的 overlay（可选）
   * @param {number} maxAge - 最大保留时间（毫秒）
   */
  async cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) { // 默认 30 天
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userId, userOverlay] of this.overlays.entries()) {
      const toDelete = [];
      
      for (const [key, item] of userOverlay.entries()) {
        // 只清理已审核的（approved 或 rejected）
        if ((item.status === 'approved' || item.status === 'rejected') &&
            (now - item.timestamp > maxAge)) {
          toDelete.push(key);
        }
      }
      
      toDelete.forEach(key => {
        userOverlay.delete(key);
        cleaned++;
      });
      
      if (toDelete.length > 0) {
        this._persistToStorage(userId);
      }
    }
    
    return cleaned;
  }

  /**
   * 持久化到 localStorage
   */
  _persistToStorage(userId) {
    try {
      const userOverlay = this.overlays.get(userId);
      if (!userOverlay) return;
      
      const data = Array.from(userOverlay.entries());
      const key = `museumcheck_overlay_${userId}`;
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('[OverlayManager] Persist error:', error);
    }
  }

  /**
   * 从 localStorage 加载
   */
  _loadFromStorage() {
    try {
      // 查找所有 overlay 键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('museumcheck_overlay_')) {
          const userId = key.replace('museumcheck_overlay_', '');
          const data = localStorage.getItem(key);
          
          if (data) {
            const entries = JSON.parse(data);
            this.overlays.set(userId, new Map(entries));
          }
        }
      }
    } catch (error) {
      console.error('[OverlayManager] Load error:', error);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    
    for (const userOverlay of this.overlays.values()) {
      for (const item of userOverlay.values()) {
        total++;
        if (item.status === 'pending') pending++;
        if (item.status === 'approved') approved++;
        if (item.status === 'rejected') rejected++;
      }
    }
    
    return {
      total,
      pending,
      approved,
      rejected,
      users: this.overlays.size
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OverlayManager;
}

if (typeof window !== 'undefined') {
  window.OverlayManager = OverlayManager;
}
