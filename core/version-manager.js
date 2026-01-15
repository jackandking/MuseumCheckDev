/**
 * VersionManager - 版本管理器
 * 管理静态文件版本，实现 CDN 缓存控制和更新检测
 */

class VersionManager {
  constructor(config = {}) {
    this.config = config;
    this.currentVersion = null;
    this.metaEndpoint = config.metaEndpoint || this._getDefaultMetaEndpoint();
    this.checkInterval = config.checkInterval || 3600000; // 1小时检查一次
    this.checkTimer = null;
    
    // 初始化版本
    this._initialize();
  }

  /**
   * 获取默认的 meta endpoint（支持子目录部署）
   */
  _getDefaultMetaEndpoint() {
    if (typeof window === 'undefined') return '/data/museums-meta.json';
    
    // 获取当前页面的基础路径
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p);
    
    // 检测是否在子目录下（如 /MuseumCheckDev/）
    // 如果路径以已知的页面文件结尾，移除它
    let basePath = '';
    if (pathParts.length > 0) {
      // 检查第一个路径段是否是项目子目录（不是 html 文件）
      const firstPart = pathParts[0];
      if (!firstPart.endsWith('.html') && 
          !['admin', 'quiz', 'survey', 'tests', 'core', 'js', 'css', 'data'].includes(firstPart)) {
        basePath = '/' + firstPart;
      }
    }
    
    return basePath + '/data/museums-meta.json';
  }

  /**
   * 初始化版本信息
   */
  async _initialize() {
    try {
      // 从 localStorage 加载缓存的版本
      const cached = localStorage.getItem('museumcheck_version');
      if (cached) {
        this.currentVersion = cached;
      }
      
      // 从服务器加载最新版本
      await this.loadVersion();
      
      // 启动定期检查
      if (this.config.autoCheck !== false) {
        this.startVersionCheck();
      }
    } catch (error) {
      console.error('[VersionManager] Initialize error:', error);
      // 使用默认版本
      this.currentVersion = '1.0.0';
    }
  }

  /**
   * 从服务器加载版本信息
   */
  async loadVersion() {
    try {
      // 禁用缓存以获取最新版本
      const response = await fetch(this.metaEndpoint + `?t=${Date.now()}`, {
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load version: ${response.status}`);
      }
      
      const meta = await response.json();
      const newVersion = meta.version || meta.lastUpdated || Date.now();
      
      if (newVersion !== this.currentVersion) {
        const oldVersion = this.currentVersion;
        this.currentVersion = newVersion;
        
        // 保存到 localStorage
        localStorage.setItem('museumcheck_version', newVersion);
        
        // 触发版本更新事件
        if (typeof EventBus !== 'undefined') {
          EventBus.getInstance().emit('version:updated', {
            oldVersion,
            newVersion
          });
        }
        
        console.log(`[VersionManager] Version updated: ${oldVersion} -> ${newVersion}`);
      }
      
      return this.currentVersion;
    } catch (error) {
      console.error('[VersionManager] Load version error:', error);
      return this.currentVersion;
    }
  }

  /**
   * 增加版本号
   */
  async bump(scope = 'patch') {
    if (!this.currentVersion) {
      this.currentVersion = '1.0.0';
    }
    
    // 尝试解析语义化版本
    const match = this.currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
    
    if (match) {
      let [, major, minor, patch] = match.map(Number);
      
      switch (scope) {
        case 'major':
          major++;
          minor = 0;
          patch = 0;
          break;
        case 'minor':
          minor++;
          patch = 0;
          break;
        default:
          patch++;
      }
      
      this.currentVersion = `${major}.${minor}.${patch}`;
    } else {
      // 如果不是语义化版本，使用时间戳
      this.currentVersion = Date.now().toString();
    }
    
    // 保存到 localStorage
    localStorage.setItem('museumcheck_version', this.currentVersion);
    
    return this.currentVersion;
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * 生成版本化 URL
   */
  versionUrl(url) {
    if (!url) return url;
    if (!this.currentVersion) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${this.currentVersion}`;
  }

  /**
   * 检查更新
   */
  async checkForUpdates() {
    const latestVersion = await this.loadVersion();
    
    if (latestVersion !== this.currentVersion) {
      console.log(`[VersionManager] Update available: ${this.currentVersion} -> ${latestVersion}`);
      
      // 触发更新可用事件
      if (typeof EventBus !== 'undefined') {
        EventBus.getInstance().emit('version:update-available', {
          current: this.currentVersion,
          latest: latestVersion
        });
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * 启动定期版本检查
   */
  startVersionCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    this.checkTimer = setInterval(async () => {
      await this.checkForUpdates();
    }, this.checkInterval);
  }

  /**
   * 停止版本检查
   */
  stopVersionCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * 强制刷新应用
   */
  forceRefresh() {
    if (typeof window !== 'undefined') {
      window.location.reload(true);
    }
  }

  /**
   * 提示用户更新
   */
  promptUpdate(message) {
    const defaultMessage = '发现新版本，是否刷新页面加载最新内容？';
    
    if (typeof window !== 'undefined' && window.confirm(message || defaultMessage)) {
      this.forceRefresh();
    }
  }

  /**
   * 获取版本信息
   */
  getVersionInfo() {
    return {
      version: this.currentVersion,
      checkInterval: this.checkInterval,
      autoCheck: this.config.autoCheck !== false
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VersionManager;
}

if (typeof window !== 'undefined') {
  window.VersionManager = VersionManager;
}
