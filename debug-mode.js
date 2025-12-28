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
  if (param || isDebugEnabledStored()) {
    // expose a global flag
    window.__MC_DEBUG = true;
    // small helper to toggle
    window.MC_debug = { enable: ()=>{ setDebugStored(true); loadVConsole(); }, disable: ()=>{ setDebugStored(false); if(window.vConsole){ try{vConsole.destroy();}catch(e){} } } };
    // Load vConsole asynchronously
    loadVConsole();
  }
})();
