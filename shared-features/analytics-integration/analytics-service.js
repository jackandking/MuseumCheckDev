/**
 * AnalyticsIntegrationService
 * 最小化的分析埋点骨架：收集事件、可选立即分发；不直接调用外部网络。
 */
class AnalyticsIntegrationService {
  constructor({ eventBus } = {}) {
    this.eventBus = eventBus || (typeof EventBus !== 'undefined' ? EventBus.getInstance() : null);
    this.queue = [];
    this.maxQueueSize = 100;
  }

  /**
   * 记录事件到内存队列；后续可接入真实上报逻辑。
   * @param {string} name
   * @param {Object} payload
   */
  trackEvent(name, payload = {}) {
    if (!name) return false;

    const event = { name, payload, timestamp: Date.now() };
    this.queue.push(event);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }

    if (this.eventBus) {
      this.eventBus.emit('analytics:event', event);
    }

    return true;
  }

  /**
   * 取出当前队列（不会清空），方便外部上报或调试。
   * @returns {Array}
   */
  getQueue() {
    return [...this.queue];
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsIntegrationService;
}

if (typeof window !== 'undefined') {
  window.AnalyticsIntegrationService = AnalyticsIntegrationService;
}
