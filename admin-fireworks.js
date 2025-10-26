(function(){
  'use strict';

  const CONFIG = {
    API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
    FIREWORK_KEY: 'museumcheck-firework',
  };

  const qs = new URLSearchParams(location.search);
  const isAdmin = qs.get('admin') === '1';

  const el = {
    app: document.getElementById('app'),
    unauthorized: document.getElementById('unauthorized'),
    reload: document.getElementById('reload'),
    deleteSelectedInvalid: document.getElementById('deleteSelectedInvalid'),
    status: document.getElementById('status'),
    counts: document.getElementById('counts'),
    retention: document.getElementById('retention'),
    saveRetention: document.getElementById('saveRetention'),
    remoteTableBody: document.querySelector('#remoteTable tbody'),
    localTableBody: document.querySelector('#localTable tbody'),
  };

  if (!isAdmin) {
    el.unauthorized.style.display = '';
    return;
  }
  el.app.style.display = '';

  // Minimal RemoteStorage client (aligned with script.js)
  const RemoteStorage = {
    async updateKeyValueStore(key, value, sortKey = 'None', expireAt = Math.floor(Date.now()/1000) + 60) {
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, sortKey, value, expireAt })
      });
      if (!res.ok) throw new Error('updateKeyValueStore failed: ' + res.status);
      return res.json();
    },
    async readKeyValueStore(key, sortKey = 'None') {
      const url = `${CONFIG.API_ENDPOINT}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('readKeyValueStore failed: ' + res.status);
      return res.json(); // { value }
    },
    async downloadFireworks() {
      const data = await RemoteStorage.readKeyValueStore(CONFIG.FIREWORK_KEY, '*');
      if (!data || !data.value) return [];
      try {
        const raw = JSON.parse(data.value);
        if (Array.isArray(raw)) {
          return raw.map(item => {
            try {
              const parsed = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
              // carry through remote metadata for display
              if (parsed && typeof parsed === 'object') {
                parsed._expireAt = item.expireAt ?? item.expire_at ?? null;
                parsed._sortKey = item.sortKey ?? null;
              }
              return parsed;
            } catch (_) { return null; }
          }).filter(Boolean);
        } else {
          const single = (typeof raw === 'string') ? JSON.parse(raw) : raw;
          if (single && typeof single === 'object') {
            single._expireAt = data.expireAt ?? data.expire_at ?? null;
            single._sortKey = data.sortKey ?? null;
          }
          return [ single ];
        }
      } catch (e) {
        console.warn('parse remote fireworks error', e);
        return [];
      }
    },
    async expireRemoteFirework(fireworkId) {
      // Write a tiny tombstone with immediate expiration
      const tombstone = JSON.stringify({ id: fireworkId, deleted: true, ts: Date.now() });
      const expireAt = Math.floor(Date.now()/1000) - 60; // already expired
      return RemoteStorage.updateKeyValueStore(CONFIG.FIREWORK_KEY, tombstone, fireworkId, expireAt);
    }
  };

  function readLocalFireworks() {
    try {
      const raw = localStorage.getItem('fireworks');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeLocalFireworks(arr) {
    try { localStorage.setItem('fireworks', JSON.stringify(arr)); } catch(_){}
  }

  const VALID_TYPES = new Set(['heart','circle','star','diamond','spiral','butterfly','rose','sunburst','cascade','ring','crosshatch','minecraft']);
  const VALID_AGE = new Set(['3-6','7-12','13-18']);

  function validateFirework(fw) {
    const errors = [];
    if (!fw || typeof fw !== 'object') { return { ok:false, errors:['not an object'] }; }
    if (!fw.id || typeof fw.id !== 'string') errors.push('missing id');
    if (!fw.museumId || typeof fw.museumId !== 'string') errors.push('missing museumId');
    if (!fw.museumName || typeof fw.museumName !== 'string') errors.push('missing museumName');
    if (!fw.ageGroup || !VALID_AGE.has(fw.ageGroup)) errors.push('invalid ageGroup');
    if (!fw.fireworkType || !VALID_TYPES.has(fw.fireworkType)) errors.push('invalid fireworkType');
    if (typeof fw.timestamp !== 'number') errors.push('missing timestamp');
    else {
      const now = Date.now();
      if (fw.timestamp > now + 5*60*1000) errors.push('timestamp in future');
      if (fw.timestamp < now - 365*24*60*60*1000) errors.push('too old (>365d)');
    }
    if (fw.taskContent && typeof fw.taskContent === 'string' && fw.taskContent.length > 200) errors.push('taskContent too long');
    if (fw.childNickname && typeof fw.childNickname === 'string' && fw.childNickname.length > 50) errors.push('childNickname too long');
    return { ok: errors.length === 0, errors };
  }

  function summarize(list) {
    const total = list.length;
    const invalid = list.filter(x => !validateFirework(x).ok).length;
    const dupMap = new Map();
    list.forEach(x => { if (x && x.id) dupMap.set(x.id, (dupMap.get(x.id)||0)+1); });
    const duplicates = [...dupMap.values()].filter(c => c>1).length;
    return { total, invalid, duplicates };
  }

  function renderCounts(remote, local) {
    const r = summarize(remote);
    const l = summarize(local);
    el.counts.innerHTML = '' +
      `<div class="count">远程：总数 ${r.total}，不合法 ${r.invalid}，重复ID ${r.duplicates}</div>` +
      `<div class="count">本地：总数 ${l.total}，不合法 ${l.invalid}，重复ID ${l.duplicates}</div>`;
  }

  function createTag(text, ok) {
    const span = document.createElement('span');
    span.className = 'tag ' + (ok ? 'ok' : 'error');
    span.textContent = text;
    return span;
  }

  function rowActionsRemote(fw) {
    const wrap = document.createElement('div');
    wrap.className = 'flex';
    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = '远程删除(过期)';
    del.onclick = async () => {
      if (!confirm(`确认删除远程烟花 ${fw.id}?`)) return;
      setStatus('正在删除远程...');
      try {
        await RemoteStorage.expireRemoteFirework(fw.id);
        await loadAll();
        setStatus('已请求过期(删除)');
      } catch(e){ setStatus('删除失败: '+ e.message); }
    };
    wrap.appendChild(del);
    return wrap;
  }

  function rowActionsLocal(fw) {
    const wrap = document.createElement('div');
    wrap.className = 'flex';
    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = '本地删除';
    del.onclick = () => {
      if (!confirm(`确认删除本地烟花 ${fw.id}?`)) return;
      const list = readLocalFireworks().filter(x => x && x.id !== fw.id);
      writeLocalFireworks(list);
      loadAll();
    };
    wrap.appendChild(del);
    return wrap;
  }

  function renderTable(body, list, isRemote) {
    body.innerHTML = '';
    list.forEach(fw => {
      const tr = document.createElement('tr');

      const tdId = document.createElement('td');
      tdId.innerHTML = `<div class=\"mono\" style=\"word-break:break-all;\">${fw.id||''}</div>` +
                       `<div class=\"muted mono\">${(fw.date||'').toString().slice(0,19)}</div>` +
                       (isRemote ? `<div class=\"muted mono\">expireAt=${formatExpireAt(fw._expireAt)}${fw._sortKey?` | sortKey=${fw._sortKey}`:''}</div>` : '');

      const tdInfo = document.createElement('td');
      const meta = [
        `museumId=${fw.museumId||''}`,
        `museumName=${fw.museumName||''}`,
        `city=${fw.museumCity||''}`,
        `age=${fw.ageGroup||''}`,
        `type=${fw.fireworkType||''}`,
        `child=${fw.childNickname||''}`,
      ].join(' | ');
      tdInfo.innerHTML = `<div class="mono">${meta}</div>` +
                         `<div class="muted">${fw.taskContent ? escapeHtml(String(fw.taskContent)).slice(0,120) : ''}</div>`;

      const tdValidation = document.createElement('td');
      const v = validateFirework(fw);
      tdValidation.appendChild(createTag(v.ok ? 'OK' : 'INVALID', v.ok));
      if (!v.ok) v.errors.forEach(e => tdValidation.appendChild(createTag(e, false)));

      const tdActions = document.createElement('td');
      tdActions.appendChild(isRemote ? rowActionsRemote(fw) : rowActionsLocal(fw));

      tr.appendChild(tdId);
      tr.appendChild(tdInfo);
      tr.appendChild(tdValidation);
      tr.appendChild(tdActions);
      body.appendChild(tr);
    });
  }

  function setStatus(text){ el.status.textContent = text || ''; }

  function escapeHtml(str){
    return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
  }

  function formatExpireAt(v){
    if (v == null || v === '') return 'N/A';
    let sec = Number(v);
    if (!Number.isFinite(sec)) return String(v);
    // If looks like ms, convert to sec
    if (sec > 1e12) sec = Math.floor(sec/1000);
    const d = new Date(sec*1000);
    const iso = d.toISOString().slice(0,19);
    const expired = Math.floor(Date.now()/1000) >= sec;
    return `${iso}${expired?' (expired)':''}`;
  }

  async function loadAll(){
    setStatus('加载中...');
    try {
      const [remote, local] = await Promise.all([
        RemoteStorage.downloadFireworks(),
        Promise.resolve(readLocalFireworks())
      ]);
      renderCounts(remote, local);
      renderTable(el.remoteTableBody, remote, true);
      renderTable(el.localTableBody, local, false);
      el.retention.value = String(Number(localStorage.getItem('fireworksRetentionTime')||'60000'));
      setStatus('');
    } catch(e) {
      setStatus('加载失败: ' + e.message);
    }
  }

  async function deleteInvalidBatch(){
    setStatus('批量删除处理中...');
    try {
      // Remote: delete invalid
      const remote = await RemoteStorage.downloadFireworks();
      const invalidRemote = remote.filter(fw => !validateFirework(fw).ok);
      for (const fw of invalidRemote) {
        try { await RemoteStorage.expireRemoteFirework(fw.id); } catch(_){}
      }
      // Local: delete invalid
      const local = readLocalFireworks();
      const kept = local.filter(fw => validateFirework(fw).ok);
      writeLocalFireworks(kept);
      await loadAll();
      setStatus(`完成：远程删除请求 ${invalidRemote.length} 个，本地清理 ${local.length - kept.length} 个`);
    } catch(e){ setStatus('批量删除失败: ' + e.message); }
  }

  // Events
  el.reload.onclick = loadAll;
  el.deleteSelectedInvalid.onclick = deleteInvalidBatch;
  el.saveRetention.onclick = () => {
    const v = Number(el.retention.value || '0');
    if (!Number.isFinite(v) || v < 1000) { alert('请输入 >= 1000 的毫秒数'); return; }
    localStorage.setItem('fireworksRetentionTime', String(v));
    setStatus('已保存保留时间(ms)');
  };

  // init
  loadAll();
})();
