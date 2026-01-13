/**
 * MuseumCheck Debug Mode - Global Debug System
 * 
 * Provides unified debug mode across all public pages with:
 * - URL parameter activation (?debug=true or ?debug=1)
 * - localStorage persistence (mc_debug)
 * - VConsole mobile debugging integration
 * - Extensible test features API
 * 
 * Usage:
 *   - Activate: Add ?debug=true to any page URL
 *   - Check: window.MC_debugMode.isEnabled()
 *   - Enable programmatically: window.MC_debug.enable()
 *   - Access test features: window.MC_debugMode.testFeatures.*
 * 
 * @version 2.0.0
 * @date 2026-01-13
 */
(function() {
  'use strict';

  // ===== CORE DEBUG DETECTION =====
  
  function hasDebugParam() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('debug') === 'true' || params.get('debug') === '1';
    } catch (e) { 
      return false; 
    }
  }

  function isDebugEnabledStored() {
    try { 
      return localStorage.getItem('mc_debug') === '1'; 
    } catch(e) {
      return false;
    }
  }

  function setDebugStored(on) {
    try { 
      if (on) {
        localStorage.setItem('mc_debug','1');
      } else {
        localStorage.removeItem('mc_debug');
      }
    } catch(e) {
      console.warn('[MC_debug] Cannot access localStorage', e);
    }
  }

  // ===== VCONSOLE INTEGRATION =====
  
  async function loadVConsole() {
    if (window.__MC_VCONSOLE_LOADED) {
      return;
    }
    window.__MC_VCONSOLE_LOADED = true;
    
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/vconsole@3.9.0/dist/vconsole.min.js';
      
      script.onload = function() {
        try {
          // eslint-disable-next-line no-undef
          window.vConsole = new VConsole({ 
            maxLogNumber: 1000,
            onReady: function() {
              console.info('[MC_debug] ✅ VConsole enabled');
            }
          });
        } catch(e) { 
          console.warn('[MC_debug] VConsole init failed', e); 
        }
      };
      
      script.onerror = function() {
        console.warn('[MC_debug] Failed to load VConsole script from CDN');
      };
      
      document.head.appendChild(script);
    } catch (e) { 
      console.warn('[MC_debug] loadVConsole error', e); 
    }
  }

  // ===== TEST FEATURES API =====
  
  const testFeatures = {
    /**
     * Performance Monitor - Display performance metrics overlay
     */
    performanceMonitor: {
      enabled: false,
      overlay: null,
      
      enable() {
        if (this.enabled) return;
        this.enabled = true;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'mc-debug-performance';
        this.overlay.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.8);
          color: #0f0;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 12px;
          z-index: 999999;
          max-width: 300px;
        `;
        document.body.appendChild(this.overlay);
        
        this.update();
        console.info('[MC_debug] Performance monitor enabled');
      },
      
      disable() {
        if (!this.enabled) return;
        this.enabled = false;
        
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        console.info('[MC_debug] Performance monitor disabled');
      },
      
      update() {
        if (!this.enabled || !this.overlay) return;
        
        const perf = performance.getEntriesByType('navigation')[0];
        const memory = performance.memory;
        
        let html = '<strong>⚡ Performance</strong><br>';
        if (perf) {
          html += `Load: ${Math.round(perf.loadEventEnd - perf.fetchStart)}ms<br>`;
          html += `DOM: ${Math.round(perf.domContentLoadedEventEnd - perf.fetchStart)}ms<br>`;
        }
        if (memory) {
          html += `Memory: ${Math.round(memory.usedJSHeapSize / 1048576)}MB<br>`;
        }
        html += `localStorage: ${Object.keys(localStorage).length} keys`;
        
        this.overlay.innerHTML = html;
      }
    },
    
    /**
     * localStorage Inspector - View and edit localStorage data
     */
    localStorageInspector: {
      enabled: false,
      
      enable() {
        if (this.enabled) return;
        this.enabled = true;
        console.group('[MC_debug] 📦 localStorage Inspector');
        console.table(localStorage);
        console.log('Total keys:', Object.keys(localStorage).length);
        console.log('Use window.MC_debugMode.testFeatures.localStorageInspector.view() to refresh');
        console.groupEnd();
      },
      
      disable() {
        if (!this.enabled) return;
        this.enabled = false;
        console.info('[MC_debug] localStorage inspector disabled');
      },
      
      view() {
        console.group('[MC_debug] 📦 localStorage Contents');
        console.table(localStorage);
        console.groupEnd();
      },
      
      clear(keyPattern) {
        if (!keyPattern) {
          console.warn('[MC_debug] Use localStorageInspector.clear("pattern") to clear specific keys');
          return;
        }
        
        const keys = Object.keys(localStorage);
        const matched = keys.filter(k => k.includes(keyPattern));
        console.log(`[MC_debug] Clearing ${matched.length} keys matching "${keyPattern}":`, matched);
        matched.forEach(k => localStorage.removeItem(k));
      }
    },
    
    /**
     * Network Logger - Log fetch/XHR requests
     */
    networkLogger: {
      enabled: false,
      originalFetch: null,
      
      enable() {
        if (this.enabled) return;
        this.enabled = true;
        
        // Intercept fetch
        this.originalFetch = window.fetch;
        window.fetch = (...args) => {
          const url = typeof args[0] === 'string' ? args[0] : args[0].url;
          console.log('[MC_debug] 🌐 Fetch:', url, args[1]);
          return this.originalFetch.apply(window, args)
            .then(response => {
              console.log('[MC_debug] 🌐 Response:', url, response.status);
              return response;
            })
            .catch(err => {
              console.error('[MC_debug] 🌐 Error:', url, err);
              throw err;
            });
        };
        
        console.info('[MC_debug] Network logger enabled');
      },
      
      disable() {
        if (!this.enabled) return;
        this.enabled = false;
        
        if (this.originalFetch) {
          window.fetch = this.originalFetch;
          this.originalFetch = null;
        }
        
        console.info('[MC_debug] Network logger disabled');
      }
    },
    
    /**
     * Error Tracker - Enhanced error logging
     */
    errorTracker: {
      enabled: false,
      errors: [],
      
      enable() {
        if (this.enabled) return;
        this.enabled = true;
        
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
        
        console.info('[MC_debug] Error tracker enabled');
      },
      
      disable() {
        if (!this.enabled) return;
        this.enabled = false;
        
        window.removeEventListener('error', this.handleError);
        window.removeEventListener('unhandledrejection', this.handleRejection);
        
        console.info('[MC_debug] Error tracker disabled');
      },
      
      handleError(event) {
        const error = {
          type: 'error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString()
        };
        this.errors.push(error);
        console.error('[MC_debug] 🔴 Error captured:', error);
      },
      
      handleRejection(event) {
        const error = {
          type: 'unhandledRejection',
          reason: event.reason,
          timestamp: new Date().toISOString()
        };
        this.errors.push(error);
        console.error('[MC_debug] 🔴 Unhandled rejection:', error);
      },
      
      getErrors() {
        return this.errors;
      },
      
      clearErrors() {
        this.errors = [];
        console.log('[MC_debug] Error log cleared');
      }
    }
  };

  // ===== CONTROL PANEL UI =====
  
  function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'mc-debug-control-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 70px;
      right: 10px;
      background: #fff;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      max-width: 280px;
    `;
    
    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
        <span>🔧 Debug Tools</span>
        <button id="mc-debug-close" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="mc-debug-perf" style="margin-right: 8px;">
          <span>Performance Monitor</span>
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="mc-debug-storage" style="margin-right: 8px;">
          <span>localStorage Inspector</span>
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="mc-debug-network" style="margin-right: 8px;">
          <span>Network Logger</span>
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="mc-debug-errors" style="margin-right: 8px;">
          <span>Error Tracker</span>
        </label>
      </div>
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
        <button id="mc-debug-disable-all" style="width: 100%; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Disable Debug Mode
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Bind controls
    document.getElementById('mc-debug-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });
    
    document.getElementById('mc-debug-perf').addEventListener('change', (e) => {
      if (e.target.checked) {
        testFeatures.performanceMonitor.enable();
      } else {
        testFeatures.performanceMonitor.disable();
      }
    });
    
    document.getElementById('mc-debug-storage').addEventListener('change', (e) => {
      if (e.target.checked) {
        testFeatures.localStorageInspector.enable();
      } else {
        testFeatures.localStorageInspector.disable();
      }
    });
    
    document.getElementById('mc-debug-network').addEventListener('change', (e) => {
      if (e.target.checked) {
        testFeatures.networkLogger.enable();
      } else {
        testFeatures.networkLogger.disable();
      }
    });
    
    document.getElementById('mc-debug-errors').addEventListener('change', (e) => {
      if (e.target.checked) {
        testFeatures.errorTracker.enable();
      } else {
        testFeatures.errorTracker.disable();
      }
    });
    
    document.getElementById('mc-debug-disable-all').addEventListener('click', () => {
      if (confirm('Disable debug mode and reload page?')) {
        window.MC_debug.disable();
        location.reload();
      }
    });
    
    return panel;
  }

  // ===== INITIALIZATION =====
  
  const hasParam = hasDebugParam();
  if (hasParam) {
    setDebugStored(true);
  }

  // Expose simple user control API
  window.MC_debug = {
    enable() {
      setDebugStored(true);
      console.info('[MC_debug] Enabling debug mode (user action)');
      loadVConsole();
      if (!document.getElementById('mc-debug-control-panel')) {
        createControlPanel();
      }
    },
    
    disable() {
      setDebugStored(false);
      console.info('[MC_debug] Disabling debug mode (user action)');
      
      if (window.vConsole) {
        try {
          vConsole.destroy();
        } catch(e) {
          console.warn('[MC_debug] Error destroying vConsole', e);
        }
      }
      
      const panel = document.getElementById('mc-debug-control-panel');
      if (panel && panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    }
  };

  // Expose centralized debug API
  window.MC_debugMode = {
    /**
     * Check if debug mode is enabled
     * @param {boolean} verbose - Log detailed status
     * @returns {boolean}
     */
    isEnabled(verbose) {
      try {
        const viaWindow = !!window.__MC_DEBUG;
        const viaParam = hasDebugParam();
        const viaStored = isDebugEnabledStored();
        const result = viaWindow || viaParam || viaStored;
        
        if (verbose) {
          console.info('[MC_debugMode] Status check:', { 
            viaWindow, 
            viaParam, 
            viaStored, 
            result 
          });
        }
        
        return result;
      } catch (e) { 
        console.warn('[MC_debugMode] isEnabled error', e); 
        return false; 
      }
    },
    
    /**
     * Log debug mode status with context
     * @param {string} context - Context description
     * @returns {boolean}
     */
    logStatus(context) {
      try {
        const enabled = this.isEnabled(true);
        console.info('[MC_debugMode] Status for context:', context || '(unknown)', { enabled });
        return enabled;
      } catch(e) { 
        console.warn('[MC_debugMode] logStatus error', e); 
        return false; 
      }
    },
    
    /**
     * Access to test features API
     */
    testFeatures: testFeatures
  };

  // Set compatibility flag
  if (hasParam || isDebugEnabledStored()) {
    window.__MC_DEBUG = true;
    console.info('[MC_debug] ✅ Debug mode enabled (via URL param or stored flag)');
    
    // Auto-load VConsole and control panel
    loadVConsole();
    
    // Create control panel after DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createControlPanel);
    } else {
      createControlPanel();
    }
  } else {
    window.__MC_DEBUG = false;
    console.debug('[MC_debug] Debug mode not enabled');
  }
  
  // Expose version info
  window.MC_debugMode.version = '2.0.0';
  console.log('[MC_debug] Debug system v2.0.0 loaded');

})();
