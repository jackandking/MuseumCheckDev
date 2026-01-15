/**
 * MuseumCheck Core - 统一入口文件
 * 导入并初始化所有核心模块
 */

/**
 * 获取默认的 meta endpoint（支持子目录部署）
 */
function getDefaultMetaEndpoint() {
  if (typeof window === 'undefined') return '/data/museums-meta.json';
  
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(p => p);
  
  let basePath = '';
  if (pathParts.length > 0) {
    const firstPart = pathParts[0];
    if (!firstPart.endsWith('.html') && 
        !['admin', 'quiz', 'survey', 'tests', 'core', 'js', 'css', 'data'].includes(firstPart)) {
      basePath = '/' + firstPart;
    }
  }
  
  return basePath + '/data/museums-meta.json';
}

// 导入适配器基类
if (typeof StorageAdapter === 'undefined') {
  console.error('[Core] StorageAdapter not loaded');
}

// 导入具体适配器
if (typeof LocalStorageAdapter === 'undefined') {
  console.error('[Core] LocalStorageAdapter not loaded');
}

if (typeof KVAdapter === 'undefined') {
  console.error('[Core] KVAdapter not loaded');
}

if (typeof SQLAdapter === 'undefined') {
  console.error('[Core] SQLAdapter not loaded');
}

if (typeof FileAdapter === 'undefined') {
  console.error('[Core] FileAdapter not loaded');
}

// 导入核心管理器
if (typeof EventBus === 'undefined') {
  console.error('[Core] EventBus not loaded');
}

if (typeof OverlayManager === 'undefined') {
  console.error('[Core] OverlayManager not loaded');
}

if (typeof DataManager === 'undefined') {
  console.error('[Core] DataManager not loaded');
}

if (typeof MultiCloudConfig === 'undefined') {
  console.error('[Core] MultiCloudConfig not loaded');
}

if (typeof VersionManager === 'undefined') {
  console.error('[Core] VersionManager not loaded');
}

/**
 * 初始化 MuseumCheck 核心系统
 * @param {Object} config - 配置选项
 * @returns {Object} - 核心系统实例
 */
async function initializeMuseumCheckCore(config = {}) {
  console.log('[Core] Initializing MuseumCheck Core...');
  
  try {
    // 1. 初始化事件总线
    const eventBus = EventBus.getInstance();
    
    // 2. 初始化多云配置
    const multiCloudConfig = new MultiCloudConfig({
      letmetryKV: config.letmetryKV,
      letmetryMySQL: config.letmetryMySQL,
      letmetryCDN: config.letmetryCDN,
      enableLetmetry: config.enableLetmetry,
      enableCloudflare: config.enableCloudflare,
      autoHealthCheck: config.autoHealthCheck
    });
    
    // 3. 获取当前活跃的云服务提供商
    const activeProvider = await multiCloudConfig.getActiveProvider();
    console.log(`[Core] Active provider: ${activeProvider.name}`);
    
    // 4. 初始化 DataManager
    const dataManager = DataManager.getInstance({
      eventBus,
      userId: config.userId,
      localStorage: {
        enabled: true,
        prefix: config.localStoragePrefix || 'museumcheck_'
      },
      kvStore: {
        enabled: true,
        endpoint: activeProvider.kvEndpoint
      },
      mysql: {
        enabled: true,
        endpoint: activeProvider.mysqlEndpoint
      },
      fileStorage: {
        enabled: true,
        baseUrl: activeProvider.cdnBaseUrl
      }
    });
    
    // 5. 初始化版本管理器
    const versionManager = new VersionManager({
      metaEndpoint: config.metaEndpoint || getDefaultMetaEndpoint(),
      autoCheck: config.autoVersionCheck !== false
    });
    
    // 6. 监听版本更新事件
    eventBus.on('version:update-available', (data) => {
      console.log('[Core] New version available:', data);
      
      if (config.autoPromptUpdate !== false) {
        versionManager.promptUpdate();
      }
    });
    
    // 7. 暴露到全局
    window.MuseumCheckCore = {
      eventBus,
      dataManager,
      multiCloudConfig,
      versionManager,
      version: '1.0.0'
    };
    
    console.log('[Core] MuseumCheck Core initialized successfully');
    
    return window.MuseumCheckCore;
  } catch (error) {
    console.error('[Core] Initialization failed:', error);
    throw error;
  }
}

// 自动初始化（如果配置了）
if (typeof window !== 'undefined' && window.MUSEUMCHECK_AUTO_INIT) {
  document.addEventListener('DOMContentLoaded', () => {
    initializeMuseumCheckCore(window.MUSEUMCHECK_CONFIG || {});
  });
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeMuseumCheckCore };
}

if (typeof window !== 'undefined') {
  window.initializeMuseumCheckCore = initializeMuseumCheckCore;
}
