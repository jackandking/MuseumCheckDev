/**
 * MultiCloudConfig - 多云配置管理器
 * 支持多个云服务提供商，实现自动故障转移和负载均衡
 */

class MultiCloudConfig {
  constructor(config = {}) {
    this.config = config;
    this.providers = this._initializeProviders(config);
    this.activeProvider = 'primary';
    this.healthCheckInterval = config.healthCheckInterval || 60000; // 1分钟
    this.healthCheckTimer = null;
    
    // 启动健康检查
    if (config.autoHealthCheck !== false) {
      this.startHealthCheck();
    }
  }

  /**
   * 初始化云服务提供商配置
   */
  _initializeProviders(config) {
    return {
      primary: {
        name: 'MuseumCheck API',
        kvEndpoint: config.letmetryKV || 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
        mysqlEndpoint: config.letmetryMySQL || (typeof API_ENDPOINTS !== 'undefined' ? API_ENDPOINTS.MYSQL.BASE : 'https://museumcheck.cn/mysql'),
        fileEndpoint: config.letmetryFile || (typeof API_ENDPOINTS !== 'undefined' ? API_ENDPOINTS.IMAGE.UPLOAD : 'https://museumcheck.cn/image/upload'),
        cdnBaseUrl: config.letmetryCDN || (typeof API_ENDPOINTS !== 'undefined' ? API_ENDPOINTS.CDN.BASE : 'https://museumcheck.cn/cdn'),
        priority: 1,
        enabled: config.enableLetmetry !== false,
        healthCheck: async () => this.checkHealth(typeof API_ENDPOINTS !== 'undefined' ? API_ENDPOINTS.HEALTH : 'https://museumcheck.cn/health')
      },
      secondary: {
        name: 'Cloudflare',
        kvEndpoint: config.cloudflareKV || 'https://api.cloudflare.com/client/v4/accounts/:account/storage/kv',
        cdnBaseUrl: config.cloudflareCDN || 'https://cdn.museumcheck.cn',
        priority: 2,
        enabled: config.enableCloudflare === true,
        healthCheck: async () => this.checkHealth(config.cloudflareCDN + '/health')
      },
      tertiary: {
        name: 'GitHub Pages',
        cdnBaseUrl: config.githubPagesCDN || 'https://jackandking.github.io/MuseumCheck',
        priority: 3,
        enabled: true, // 始终启用作为最后的降级
        healthCheck: async () => true // GitHub Pages 视为始终可用
      }
    };
  }

  /**
   * 获取当前活跃的提供商
   */
  async getActiveProvider() {
    // 如果当前提供商健康，直接返回
    if (this.providers[this.activeProvider]?.enabled) {
      const isHealthy = await this.providers[this.activeProvider].healthCheck();
      if (isHealthy) {
        return this.providers[this.activeProvider];
      }
    }
    
    // 按优先级查找健康的提供商
    for (const [key, provider] of Object.entries(this.providers)) {
      if (!provider.enabled) continue;
      
      const isHealthy = await provider.healthCheck();
      if (isHealthy) {
        if (this.activeProvider !== key) {
          console.log(`[MultiCloudConfig] Switched provider: ${this.activeProvider} -> ${key}`);
          this.activeProvider = key;
        }
        return provider;
      }
    }
    
    // 降级到 GitHub Pages（最后的保险）
    console.warn('[MultiCloudConfig] All providers unhealthy, falling back to GitHub Pages');
    this.activeProvider = 'tertiary';
    return this.providers.tertiary;
  }

  /**
   * 健康检查
   */
  async checkHealth(url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-cache',
        method: 'HEAD'
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      // 超时或网络错误视为不健康
      return false;
    }
  }

  /**
   * 获取所有提供商的健康状态
   */
  async getProvidersHealth() {
    const health = {};
    
    for (const [key, provider] of Object.entries(this.providers)) {
      if (!provider.enabled) {
        health[key] = { healthy: false, reason: 'disabled' };
        continue;
      }
      
      const isHealthy = await provider.healthCheck();
      health[key] = {
        name: provider.name,
        healthy: isHealthy,
        priority: provider.priority,
        active: key === this.activeProvider
      };
    }
    
    return health;
  }

  /**
   * 创建适配器链（基于当前活跃提供商）
   */
  async createAdapterChain() {
    const provider = await this.getActiveProvider();
    
    const adapters = [];
    
    // LocalStorage 始终可用
    if (typeof LocalStorageAdapter !== 'undefined') {
      adapters.push(new LocalStorageAdapter({ 
        name: 'localStorage', 
        priority: 0, 
        writable: true 
      }));
    }
    
    // KV Store
    if (provider.kvEndpoint && typeof KVAdapter !== 'undefined') {
      adapters.push(new KVAdapter({ 
        name: 'kvStore', 
        endpoint: provider.kvEndpoint, 
        priority: 1, 
        writable: true 
      }));
    }
    
    // MySQL
    if (provider.mysqlEndpoint && typeof SQLAdapter !== 'undefined') {
      adapters.push(new SQLAdapter({ 
        name: 'mysql', 
        endpoint: provider.mysqlEndpoint, 
        priority: 2, 
        writable: true 
      }));
    }
    
    // File Storage
    if (provider.cdnBaseUrl && typeof FileAdapter !== 'undefined') {
      adapters.push(new FileAdapter({ 
        name: 'fileStorage', 
        baseUrl: provider.cdnBaseUrl, 
        priority: 3, 
        writable: false 
      }));
    }
    
    return adapters;
  }

  /**
   * 启动定期健康检查
   */
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      const health = await this.getProvidersHealth();
      console.log('[MultiCloudConfig] Health check:', health);
    }, this.healthCheckInterval);
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * 手动切换提供商
   */
  async switchProvider(providerKey) {
    if (!this.providers[providerKey]) {
      throw new Error(`Unknown provider: ${providerKey}`);
    }
    
    if (!this.providers[providerKey].enabled) {
      throw new Error(`Provider ${providerKey} is disabled`);
    }
    
    const isHealthy = await this.providers[providerKey].healthCheck();
    if (!isHealthy) {
      throw new Error(`Provider ${providerKey} is unhealthy`);
    }
    
    this.activeProvider = providerKey;
    console.log(`[MultiCloudConfig] Manually switched to provider: ${providerKey}`);
    
    return this.providers[providerKey];
  }

  /**
   * 获取文件上传端点
   */
  async getFileUploadEndpoint() {
    const provider = await this.getActiveProvider();
    return provider.fileEndpoint || null;
  }

  /**
   * 获取 CDN Base URL
   */
  async getCDNBaseUrl() {
    const provider = await this.getActiveProvider();
    return provider.cdnBaseUrl;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiCloudConfig;
}

if (typeof window !== 'undefined') {
  window.MultiCloudConfig = MultiCloudConfig;
}
