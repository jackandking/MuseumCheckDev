/**
 * PosterPublishingService
 * 负责海报发布的最小骨架：校验 -> 触发事件。实际存储/上传逻辑后续接入。
 */
class PosterPublishingService {
  constructor({ dataManager, eventBus } = {}) {
    this.dataManager = dataManager || (typeof DataManager !== 'undefined' ? DataManager.getInstance() : null);
    this.eventBus = eventBus || (typeof EventBus !== 'undefined' ? EventBus.getInstance() : null);
  }

  /**
   * 校验海报数据的最小条件。
   * @param {Object} poster
   * @returns {boolean}
   */
  validatePoster(poster = {}) {
    if (!poster) return false;
    if (!poster.title || !poster.imageUrl) return false;
    return true;
  }

  /**
   * 发布海报：目前仅做事件广播，后续可接入后端或 KV。
   * @param {Object} poster
   * @param {Object} options
   * @returns {Promise<Object>} 发布结果
   */
  async publish(poster = {}, options = {}) {
    if (!this.validatePoster(poster)) {
      return { success: false, error: 'invalid_poster' };
    }

    // 未来可写入 DataManager / KV / SQL；此处保持无副作用
    const payload = {
      ...poster,
      userId: options.userId || (this.dataManager ? this.dataManager.getUserId() : null),
      timestamp: Date.now()
    };

    if (this.eventBus) {
      this.eventBus.emit('poster:published', payload);
    }

    return { success: true, data: payload };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PosterPublishingService;
}

if (typeof window !== 'undefined') {
  window.PosterPublishingService = PosterPublishingService;
}
