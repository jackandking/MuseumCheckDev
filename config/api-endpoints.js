/**
 * API Endpoints Configuration
 * 
 * 集中管理所有 API 端点配置，方便切换环境
 * 修改 BASE_URL 即可切换所有服务的目标地址
 */

(function(root) {
  'use strict';

  // ============================================
  // 主配置 - 只需修改这里即可切换环境
  // ============================================
  
  // 自动检测环境：如果是本地开发，使用 localhost；生产环境使用 letmetry.cloud
  const isLocalDevelopment = window && window.location && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname === '0.0.0.0');
  
  const BASE_URL = isLocalDevelopment ? 'http://localhost:3000' : 'https://letmetry.cloud';
  
  // 手动覆盖（取消注释切换）
  // const BASE_URL = 'https://letmetry.cloud';
  // const BASE_URL = 'http://localhost:3000';

  // ============================================
  // API 端点定义
  // ============================================
  const API_ENDPOINTS = {
    // 基础 URL
    BASE_URL: BASE_URL,

    // MySQL 相关
    MYSQL: {
      BASE: `${BASE_URL}/mysql`,
      QUERY: `${BASE_URL}/mysql/query`,
      INSERT: `${BASE_URL}/mysql/insert`,
      UPDATE: `${BASE_URL}/mysql/update`,
      DELETE: `${BASE_URL}/mysql/delete`
    },

    // 文件/图片上传
    FILE: {
      UPLOAD: `${BASE_URL}/file/upload`,
      LIST: `${BASE_URL}/file/list`
    },

    IMAGE: {
      UPLOAD: `${BASE_URL}/image/upload`,
      SEARCH: `${BASE_URL}/image/search`
    },

    // 博物馆服务
    MUSEUM: {
      SEARCH: `${BASE_URL}/museum/search`
    },

    // CDN
    CDN: {
      BASE: `${BASE_URL}/cdn`,
      IMAGES: `${BASE_URL}/images`
    },

    // 健康检查
    HEALTH: `${BASE_URL}/health`,

    // KV Store (AWS - 独立于 BASE_URL)
    KV_STORE: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore'
  };

  // ============================================
  // 辅助方法
  // ============================================
  
  /**
   * 获取完整的图片 URL
   * @param {string} filename - 文件名
   * @returns {string} 完整 URL
   */
  API_ENDPOINTS.getImageUrl = function(filename) {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `${this.CDN.IMAGES}/${encodeURIComponent(filename)}`;
  };

  /**
   * 切换 BASE_URL（运行时动态切换）
   * @param {string} newBaseUrl - 新的基础 URL
   */
  API_ENDPOINTS.switchBaseUrl = function(newBaseUrl) {
    if (!newBaseUrl) return;
    const base = newBaseUrl.replace(/\/+$/, '');
    
    this.BASE_URL = base;
    this.MYSQL.BASE = `${base}/mysql`;
    this.MYSQL.QUERY = `${base}/mysql/query`;
    this.MYSQL.INSERT = `${base}/mysql/insert`;
    this.MYSQL.UPDATE = `${base}/mysql/update`;
    this.MYSQL.DELETE = `${base}/mysql/delete`;
    this.FILE.UPLOAD = `${base}/file/upload`;
    this.FILE.LIST = `${base}/file/list`;
    this.IMAGE.UPLOAD = `${base}/image/upload`;
    this.IMAGE.SEARCH = `${base}/image/search`;
    this.MUSEUM.SEARCH = `${base}/museum/search`;
    this.CDN.BASE = `${base}/cdn`;
    this.CDN.IMAGES = `${base}/images`;
    this.HEALTH = `${base}/health`;
    
    console.log(`[API_ENDPOINTS] Switched to: ${base}`);
  };

  // ============================================
  // 导出
  // ============================================
  
  // Browser
  if (typeof window !== 'undefined') {
    window.API_ENDPOINTS = API_ENDPOINTS;
  }

  // Node.js / CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_ENDPOINTS;
  }

  // AMD
  if (typeof define === 'function' && define.amd) {
    define(function() { return API_ENDPOINTS; });
  }

})(this);
