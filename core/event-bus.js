/**
 * EventBus - 事件总线
 * 用于模块间解耦通信
 */

class EventBus {
  static instance = null;

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }
    
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    
    EventBus.instance = this;
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} - 取消订阅函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
    
    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 取消订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    
    // 如果没有监听器了，删除事件
    if (callbacks.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    // 记录事件历史
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in listener for ${event}:`, error);
      }
    });
  }

  /**
   * 异步触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   * @returns {Promise<Array>} - 所有回调的返回值
   */
  async emitAsync(event, data) {
    // 记录事件历史
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    if (!this.listeners.has(event)) return [];
    
    const callbacks = this.listeners.get(event);
    const results = await Promise.allSettled(
      callbacks.map(callback => {
        try {
          return Promise.resolve(callback(data));
        } catch (error) {
          console.error(`[EventBus] Error in async listener for ${event}:`, error);
          return Promise.reject(error);
        }
      })
    );
    
    return results;
  }

  /**
   * 一次性订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const wrappedCallback = (data) => {
      callback(data);
      this.off(event, wrappedCallback);
    };
    
    this.on(event, wrappedCallback);
  }

  /**
   * 清空所有监听器
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * 获取事件历史
   * @param {string} [event] - 可选，筛选特定事件
   * @returns {Array} - 事件历史
   */
  getHistory(event) {
    if (event) {
      return this.eventHistory.filter(item => item.event === event);
    }
    return [...this.eventHistory];
  }

  /**
   * 获取所有已注册的事件名称
   * @returns {Array<string>}
   */
  getEvents() {
    return Array.from(this.listeners.keys());
  }

  /**
   * 获取特定事件的监听器数量
   * @param {string} event - 事件名称
   * @returns {number}
   */
  getListenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }
}

// 导出单例
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventBus;
}

if (typeof window !== 'undefined') {
  window.EventBus = EventBus;
}
