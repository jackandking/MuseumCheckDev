(function(root) {
  'use strict';

  const KEY = 'museumcheck-visit-signals';
  const STEPS = [
    ['pilot_open', '打开邀请入口'],
    ['pilot_preview_open', '查看首任务预览'],
    ['pilot_started', '开始这次参观'],
    ['checkin_open', '打开打卡页'],
    ['task_open', '打开任务'],
    ['first_task_complete', '完成首任务'],
    ['visit_feedback', '提交反馈']
  ];
  const LABELS = Object.fromEntries(STEPS);
  const state = { signals: [], selectedCode: '' };

  function endpoint() {
    return root.API_ENDPOINTS && root.API_ENDPOINTS.KV_STORE
      ? root.API_ENDPOINTS.KV_STORE
      : 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
  }

  function parseItems(payload) {
    let items = payload && payload.value;
    if (typeof items === 'string') { try { items = JSON.parse(items); } catch (_) { items = []; } }
    return Array.isArray(items) ? items : [];
  }

  function parseSignals(payload) {
    return parseItems(payload).map(item => {
      try { return typeof item.value === 'string' ? JSON.parse(item.value) : item.value; } catch (_) { return null; }
    }).filter(signal => signal && signal.type === 'visit_signal' && signal.pilotContext && /^[A-Z0-9]{6}$/.test(signal.pilotContext.inviteCode || ''))
      .map(signal => ({
        signalType: String(signal.signalType || ''),
        timestamp: Number(signal.timestamp) || 0,
        inviteCode: signal.pilotContext.inviteCode,
        session: String(signal.pilotContext.pilotSessionId || signal.sessionId || ''),
        museumName: String(signal.museumName || signal.pilotContext.museumName || ''),
        city: String(signal.pilotContext.city || ''),
        parameters: signal.parameters && typeof signal.parameters === 'object' ? signal.parameters : {}
      })).filter(signal => signal.timestamp > 0).sort((a, b) => b.timestamp - a.timestamp);
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false });
  }

  function byCode(code) { return state.signals.filter(signal => signal.inviteCode === code); }
  function count(signals, type) { return signals.filter(signal => signal.signalType === type).length; }
  function uniqueSessions(signals) { return new Set(signals.map(signal => signal.session).filter(Boolean)).size; }
  function el(id) { return root.document.getElementById(id); }
  function set(id, value) { el(id).textContent = value; }
  function status(value, isError) { const node = el('status'); node.textContent = value; node.style.background = isError ? '#fff0eb' : ''; node.style.color = isError ? '#9a321d' : ''; }

  function renderSelect() {
    const select = el('inviteSelect');
    const codes = [...new Set(state.signals.map(signal => signal.inviteCode))];
    select.textContent = '';
    if (!codes.length) { select.innerHTML = '<option value="">暂无邀请码数据</option>'; select.disabled = true; return; }
    codes.forEach(code => { const signals = byCode(code); const option = root.document.createElement('option'); option.value = code; option.textContent = `${code} · 最近 ${formatTime(signals[0].timestamp)}`; select.appendChild(option); });
    state.selectedCode = codes.includes(state.selectedCode) ? state.selectedCode : codes[0];
    select.value = state.selectedCode; select.disabled = false;
  }

  function render() {
    const signals = byCode(state.selectedCode);
    set('openCount', count(signals, 'pilot_open'));
    set('previewCount', count(signals, 'pilot_preview_open'));
    set('startCount', count(signals, 'pilot_started'));
    set('completeCount', count(signals, 'first_task_complete'));
    set('sessionCount', `${uniqueSessions(signals)} 个匿名会话`);

    const flow = el('flow'); flow.textContent = '';
    STEPS.forEach(([type, label]) => {
      const matches = signals.filter(signal => signal.signalType === type);
      const node = root.document.createElement('div');
      node.className = `flow-step ${matches.length ? 'done' : ''}`;
      node.innerHTML = `<span class="dot"></span><strong>${label}</strong><time>${matches.length ? `${matches.length} 次 · ${formatTime(matches[0].timestamp)}` : '尚未发生'}</time>`;
      flow.appendChild(node);
    });

    const timeline = el('timeline'); timeline.textContent = '';
    if (!signals.length) { timeline.innerHTML = '<li class="empty">这个邀请码还没有访问记录。</li>'; return; }
    signals.slice(0, 30).forEach(signal => {
      const detail = [signal.museumName, signal.city].filter(Boolean).join(' · ') || (signal.parameters.museumKnown === false ? '未收录馆' : '邀请页');
      const item = root.document.createElement('li'); item.className = 'event';
      item.innerHTML = `<div class="event-top"><strong>${LABELS[signal.signalType] || signal.signalType}</strong><time>${formatTime(signal.timestamp)}</time></div><p>${detail}</p>`;
      timeline.appendChild(item);
    });
  }

  async function load() {
    const reload = el('reload'); reload.disabled = true; status('加载中');
    try {
      const response = await root.fetch(`${endpoint()}?key=${encodeURIComponent(KEY)}&sortKey=*`, { cache:'no-store' });
      if (!response.ok) throw new Error(`读取失败 ${response.status}`);
      state.signals = parseSignals(await response.json());
      renderSelect(); render(); status(`已加载 ${state.signals.length} 条匿名信号`);
      set('lastLoaded', `最近加载 ${new Date().toLocaleString('zh-CN', { hour12:false })}`);
    } catch (error) { state.signals = []; renderSelect(); render(); status(error.message || '加载失败', true); }
    finally { reload.disabled = false; }
  }

  function init() {
    if (new URLSearchParams(root.location.search).get('admin') !== '1') { el('unauthorized').hidden = false; return; }
    el('app').hidden = false;
    el('inviteSelect').addEventListener('change', event => { state.selectedCode = event.target.value; render(); });
    el('reload').addEventListener('click', load); load();
  }

  root.PilotMetricsDashboard = { parseItems, parseSignals, uniqueSessions };
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})(window);
