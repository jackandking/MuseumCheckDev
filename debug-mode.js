// debug-mode.js -- enable debug mode (vConsole) when URL contains debug=true
(function(){
  function hasDebugParam() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('debug') === 'true' || params.get('debug') === '1';
    } catch (e) { return false; }
  }

  function isDebugEnabledStored() {
    try { return localStorage.getItem('mc_debug') === '1'; } catch(e){return false;}
  }

  function setDebugStored(on) {
    try { if (on) localStorage.setItem('mc_debug','1'); else localStorage.removeItem('mc_debug'); } catch(e){}
  }

  async function loadVConsole() {
    if (window.__MC_VCONSOLE_LOADED) return;
    window.__MC_VCONSOLE_LOADED = true;
    try {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/vconsole@3.9.0/dist/vconsole.min.js';
      s.onload = function(){
        try {
          // eslint-disable-next-line no-undef
          window.vConsole = new VConsole({ maxLogNumber: 1000 });
          console.info('vConsole enabled (mc_debug)');
        } catch(e) { console.warn('vConsole init failed', e); }
      };
      s.onerror = function(){ console.warn('Failed to load vConsole script'); };
      document.head.appendChild(s);
    } catch (e) { console.warn('loadVConsole error', e); }
  }

  // Activate debug mode if URL param present, or if stored flag exists.
  const param = hasDebugParam();
  if (param) setDebugStored(true);

  // Expose MC_debug helper
  window.MC_debug = {
    enable: ()=>{ setDebugStored(true); console.info('mc_debug: enabling debug (user)'); loadVConsole(); },
    disable: ()=>{ setDebugStored(false); console.info('mc_debug: disabling debug (user)'); if(window.vConsole){ try{vConsole.destroy();}catch(e){} } }
  };

  // expose a simple flag for compatibility
  if (param || isDebugEnabledStored()) {
    window.__MC_DEBUG = true;
    console.info('mc_debug: Debug mode enabled at load (via URL param or stored flag)');
  } else {
    window.__MC_DEBUG = false;
    console.debug('mc_debug: Debug mode not enabled at load');
  }

  // Centralized debug API
  window.MC_debugMode = {
    isEnabled(verbose){
      try {
        const viaWindow = !!window.__MC_DEBUG;
        let viaParam = false;
        let viaStored = false;
        try { const p = new URLSearchParams(window.location.search); viaParam = p.get('debug') === 'true' || p.get('debug') === '1'; } catch (e) {}
        try { viaStored = isDebugEnabledStored(); } catch(e) { viaStored = false; }
        const result = viaWindow || viaParam || viaStored;
        if (verbose) console.info('MC_debugMode.isEnabled:', { viaWindow, viaParam, viaStored, result });
        return result;
      } catch (e) { console.warn('MC_debugMode.isEnabled error', e); return false; }
    },
    logStatus(context){
      try {
        const enabled = this.isEnabled(true);
        console.info('MC_debugMode.logStatus', { context: context || '(unknown)', enabled });
        return enabled;
      } catch(e){ console.warn('MC_debugMode.logStatus error', e); return false; }
    }
  };

  // Load vConsole asynchronously if debug active
  if (window.MC_debugMode && window.MC_debugMode.isEnabled(true)) {
    loadVConsole();
  }
})();
