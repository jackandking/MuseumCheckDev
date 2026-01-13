/**
 * CheckinAdapter
 * 负责将 checkin 场景接入核心 DataManager / EventBus，保持对外 URL 不变。
 * 设计原则：
 * - 不包含具体业务 UI，只做数据接入和事件分发。
 * - 通过依赖注入接收 DataManager / EventBus，默认单例获取。
 * - 可选接入 shared-features 下的业务能力（例如海报、分析、宠物奖励），按需注入，不强制依赖。
 */
class CheckinAdapter {
  constructor({ dataManager, eventBus, features } = {}) {
    this.dataManager = dataManager || (typeof DataManager !== 'undefined' ? DataManager.getInstance() : null);
    this.eventBus = eventBus || (typeof EventBus !== 'undefined' ? EventBus.getInstance() : null);
    this.features = features || {};
    this.initialized = false;
  }

  /**
   * 初始化适配器：设置用户、绑定事件、校验依赖。
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  async init(options = {}) {
    if (!this.dataManager) {
      console.error('[CheckinAdapter] DataManager is required');
      return false;
    }
    if (!this.eventBus) {
      console.error('[CheckinAdapter] EventBus is required');
      return false;
    }

    if (options.userId) {
      this.dataManager.setUserId(options.userId);
    }

    this._bindEvents();
    this.initialized = true;
    return true;
  }

  /**
   * 读取 checkin 相关数据。
   * @param {string} key
   * @param {Object} options
   */
  async load(key, options = {}) {
    if (!this.initialized) {
      await this.init(options);
    }
    return this.dataManager.get(key, options);
  }

  /**
   * 写入 checkin 数据，默认使用 overlay 让提交者即时可见。
   * @param {string} key
   * @param {*} value
   * @param {Object} options
   */
  async save(key, value, options = {}) {
    if (!this.initialized) {
      await this.init(options);
    }
    const result = await this.dataManager.set(key, value, { ...options, useOverlay: options.useOverlay !== false });
    if (this.eventBus) {
      this.eventBus.emit('checkin:data:saved', { key, value, userId: this.dataManager.getUserId() });
    }
    return result;
  }

  /**
   * 标记一次 checkin 完成并广播事件，便于其他特性（海报、宠物奖励等）监听。
   * @param {Object} payload
   */
  notifyCompleted(payload = {}) {
    if (!this.eventBus) return;
    this.eventBus.emit('checkin:completed', {
      ...payload,
      userId: this.dataManager ? this.dataManager.getUserId() : null,
      timestamp: Date.now()
    });
  }

  /**
   * 将 overlay 审核通过后同步的公共写入封装（便于手动触发）。
   * @param {string} key
   * @param {*} value
   * @param {Object} options
   */
  async promoteOverlay(key, value, options = {}) {
    if (!this.dataManager) return false;
    return this.dataManager.setPublic(key, value, options);
  }

  _bindEvents() {
    if (!this.eventBus) return;

    // 示例：监听海报发布完成，后续可扩展
    this.eventBus.on('poster:published', (event) => {
      if (!event) return;
      console.log('[CheckinAdapter] Poster published for checkin:', event);
    });
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CheckinAdapter;
}

if (typeof window !== 'undefined') {
  window.CheckinAdapter = CheckinAdapter;
}
