(function(root) {
  'use strict';

  const CONFIG = {
    VISIT_SIGNAL_KEY: 'museumcheck-visit-signals',
    DEFAULT_RANGE: '7d',
    TARGETS: {
      activationRate: 70,
      firstTaskCompletionRate: 40,
      notHelpfulRate: 20
    }
  };

  const RANGE_MS = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const SIGNAL_LABELS = {
    checkin_open: '打开打卡页',
    first_task_cta_visible: '首任务按钮可见',
    first_task_cta_click: '点击首任务按钮',
    task_open: '打开任务',
    task_complete: '完成任务',
    first_task_complete: '完成首任务',
    all_tasks_complete: '完成全部任务',
    checkin_exit_incomplete: '未完成离开',
    visit_feedback: '提交反馈',
    visit_feedback_comment_opened: '打开反馈输入'
  };

  const state = {
    allSignals: [],
    filteredSignals: [],
    summary: null
  };

  const qs = new URLSearchParams(root.location ? root.location.search : '');
  const isAdmin = qs.get('admin') === '1';

  function getEndpoint() {
    if (root.API_ENDPOINTS && root.API_ENDPOINTS.KV_STORE) return root.API_ENDPOINTS.KV_STORE;
    return 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
  }

  function extractItemsFromKvResponse(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.Items)) return data.Items;

    if (typeof data.value === 'string') {
      try {
        const parsed = JSON.parse(data.value);
        return Array.isArray(parsed) ? parsed : [data];
      } catch (error) {
        return [data];
      }
    }

    if (data.value && typeof data.value === 'object') return [data];
    return [];
  }

  function parseSignalItem(item) {
    if (!item) return null;
    let value = item.value;

    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (error) {
        return null;
      }
    }

    if (!value || typeof value !== 'object') return null;
    if (value.type !== 'visit_signal') return null;
    if (!value.signalType || typeof value.signalType !== 'string') return null;

    const timestamp = normalizeTimestamp(value.timestamp);
    if (!timestamp) return null;

    return {
      type: 'visit_signal',
      signalType: value.signalType,
      page: safeString(value.page),
      museumId: safeString(value.museumId),
      museumName: safeString(value.museumName),
      ageGroup: safeString(value.ageGroup),
      sessionId: safeString(value.sessionId),
      completedCount: normalizeNumber(value.completedCount),
      totalTasks: normalizeNumber(value.totalTasks),
      secondsSinceOpen: normalizeNumber(value.secondsSinceOpen),
      timestamp,
      parameters: sanitizeParameters(value.parameters),
      _sortKey: safeString(item.sortKey || item.sk)
    };
  }

  function normalizeTimestamp(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 0;
    return number < 100000000000 ? number * 1000 : number;
  }

  function normalizeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function safeString(value) {
    return value == null ? '' : String(value);
  }

  function sanitizeParameters(parameters) {
    if (!parameters || typeof parameters !== 'object') return {};
    const allowed = [
      'taskIndex',
      'taskNumber',
      'taskTitle',
      'taskDescription',
      'isFirstTask',
      'rating',
      'comment',
      'completionMethod',
      'taskCount',
      'restoredCompletedCount',
      'openedTaskCount',
      'completedCount',
      'hasPhoto',
      'gameRewardShown',
      'reportedTreasureName',
      'source',
      'ctaText',
      'viewportWidth',
      'viewportHeight'
    ];
    const sanitized = {};
    allowed.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(parameters, key)) {
        sanitized[key] = parameters[key];
      }
    });
    return sanitized;
  }

  function parseSignalsFromKvResponse(data) {
    return extractItemsFromKvResponse(data)
      .map(parseSignalItem)
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  function filterSignals(signals, options = {}) {
    const range = options.range || CONFIG.DEFAULT_RANGE;
    const museumQuery = safeString(options.museumQuery).trim().toLowerCase();
    const cutoff = range === 'all' ? 0 : Date.now() - (RANGE_MS[range] || RANGE_MS[CONFIG.DEFAULT_RANGE]);

    return signals.filter(signal => {
      if (cutoff && signal.timestamp < cutoff) return false;
      if (!museumQuery) return true;
      return `${signal.museumId} ${signal.museumName}`.toLowerCase().includes(museumQuery);
    });
  }

  function createSessionKey(signal) {
    if (signal.sessionId) return signal.sessionId;
    if (signal._sortKey) return signal._sortKey;
    return `${signal.museumId || 'unknown'}-${signal.timestamp}`;
  }

  function summarizeSignals(signals) {
    const sessions = new Map();
    const museums = new Map();
    const feedback = [];
    const signalCounts = {};

    signals.forEach(signal => {
      signalCounts[signal.signalType] = (signalCounts[signal.signalType] || 0) + 1;
      const sessionKey = createSessionKey(signal);
      if (!sessions.has(sessionKey)) {
        sessions.set(sessionKey, {
          opened: false,
          taskOpened: false,
          firstTaskCompleted: false,
          allTasksCompleted: false,
          feedback: false,
          notHelpfulFeedback: false,
          maxCompletedCount: 0,
          museumId: signal.museumId,
          museumName: signal.museumName,
          ageGroup: signal.ageGroup,
          firstSeenAt: signal.timestamp,
          lastSeenAt: signal.timestamp
        });
      }

      const session = sessions.get(sessionKey);
      session.firstSeenAt = Math.min(session.firstSeenAt, signal.timestamp);
      session.lastSeenAt = Math.max(session.lastSeenAt, signal.timestamp);
      session.maxCompletedCount = Math.max(session.maxCompletedCount, signal.completedCount || 0);
      if (!session.museumId && signal.museumId) session.museumId = signal.museumId;
      if (!session.museumName && signal.museumName) session.museumName = signal.museumName;
      if (!session.ageGroup && signal.ageGroup) session.ageGroup = signal.ageGroup;

      if (signal.signalType === 'checkin_open') session.opened = true;
      if (signal.signalType === 'task_open') session.taskOpened = true;
      if (signal.signalType === 'first_task_complete') {
        session.firstTaskCompleted = true;
        session.maxCompletedCount = Math.max(session.maxCompletedCount, 1);
      }
      if (signal.signalType === 'all_tasks_complete') session.allTasksCompleted = true;
      if (signal.signalType === 'visit_feedback') {
        session.feedback = true;
        if (signal.parameters.rating === 'not_helpful') session.notHelpfulFeedback = true;
        feedback.push(signal);
      }
    });

    const sessionList = [...sessions.values()];
    sessionList.forEach(session => {
      const key = session.museumId || session.museumName || 'unknown';
      if (!museums.has(key)) {
        museums.set(key, {
          museumId: session.museumId || 'unknown',
          museumName: session.museumName || '未知博物馆',
          sessions: 0,
          taskOpened: 0,
          firstTaskCompleted: 0,
          feedback: 0,
          notHelpfulFeedback: 0
        });
      }
      const museum = museums.get(key);
      museum.sessions += session.opened ? 1 : 0;
      museum.taskOpened += session.taskOpened ? 1 : 0;
      museum.firstTaskCompleted += session.firstTaskCompleted ? 1 : 0;
      museum.feedback += session.feedback ? 1 : 0;
      museum.notHelpfulFeedback += session.notHelpfulFeedback ? 1 : 0;
    });

    const checkinOpenSessions = sessionList.filter(session => session.opened).length;
    const taskOpenSessions = sessionList.filter(session => session.taskOpened).length;
    const firstTaskCompletedSessions = sessionList.filter(session => session.firstTaskCompleted).length;
    const feedbackSessions = sessionList.filter(session => session.feedback).length;
    const notHelpfulFeedbackSessions = sessionList.filter(session => session.notHelpfulFeedback).length;

    return {
      signals,
      sessions: sessionList,
      signalCounts,
      totalSignals: signals.length,
      checkinOpenSessions,
      taskOpenSessions,
      firstTaskCompletedSessions,
      feedbackSessions,
      notHelpfulFeedbackSessions,
      activationRate: percentage(taskOpenSessions, checkinOpenSessions),
      firstTaskCompletionRate: percentage(firstTaskCompletedSessions, checkinOpenSessions),
      notHelpfulRate: percentage(notHelpfulFeedbackSessions, feedbackSessions),
      museums: [...museums.values()]
        .sort((a, b) => {
          const aRate = percentage(a.firstTaskCompleted, a.sessions);
          const bRate = percentage(b.firstTaskCompleted, b.sessions);
          if (aRate !== bRate) return aRate - bRate;
          return b.sessions - a.sessions;
        }),
      feedback: feedback.sort((a, b) => b.timestamp - a.timestamp),
      depthBuckets: buildDepthBuckets(sessionList)
    };
  }

  function buildDepthBuckets(sessions) {
    const openedSessions = sessions.filter(session => session.opened);
    const buckets = [
      { id: '0', label: '0', description: '打开后没有完成任务', count: 0 },
      { id: '1', label: '1', description: '完成首个任务', count: 0 },
      { id: '2-3', label: '2-3', description: '完成多个轻量任务', count: 0 },
      { id: '4+', label: '4+', description: '深度参与', count: 0 },
      { id: 'all', label: 'all', description: '完成全部任务', count: 0 }
    ];
    openedSessions.forEach(session => {
      const count = session.maxCompletedCount || 0;
      if (session.allTasksCompleted) buckets[4].count += 1;
      else if (count === 0) buckets[0].count += 1;
      else if (count === 1) buckets[1].count += 1;
      else if (count <= 3) buckets[2].count += 1;
      else buckets[3].count += 1;
    });
    return buckets.map(bucket => ({
      ...bucket,
      rate: percentage(bucket.count, openedSessions.length)
    }));
  }

  function percentage(numerator, denominator) {
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 1000) / 10;
  }

  function formatRate(value) {
    return `${Number.isFinite(value) ? value : 0}%`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('zh-CN').format(value || 0);
  }

  function formatTime(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function render() {
    const range = getElement('rangeSelect').value || CONFIG.DEFAULT_RANGE;
    const museumQuery = getElement('museumFilter').value || '';
    state.filteredSignals = filterSignals(state.allSignals, { range, museumQuery });
    state.summary = summarizeSignals(state.filteredSignals);

    renderMetricCards(state.summary);
    renderFunnel(state.summary);
    renderMuseums(state.summary.museums);
    renderFeedback(state.summary.feedback);
    renderDepth(state.summary.depthBuckets);
    renderRecentSignals(state.summary.signals.slice(0, 80));
    setStatus(`已加载 ${formatNumber(state.summary.totalSignals)} 条信号`, 'ok');
  }

  function renderMetricCards(summary) {
    setText('checkinOpenValue', formatNumber(summary.checkinOpenSessions));
    setText('activationRateValue', formatRate(summary.activationRate));
    setText('firstCompletionRateValue', formatRate(summary.firstTaskCompletionRate));
    setText('notHelpfulRateValue', summary.feedbackSessions ? formatRate(summary.notHelpfulRate) : '-');

    const badge = getElement('northStarBadge');
    if (summary.firstTaskCompletionRate >= CONFIG.TARGETS.firstTaskCompletionRate) {
      badge.className = 'rate-badge';
      badge.textContent = '首任务达标';
    } else if (summary.checkinOpenSessions === 0) {
      badge.className = 'rate-badge warn';
      badge.textContent = '等待真实数据';
    } else {
      badge.className = 'rate-badge bad';
      badge.textContent = '优先优化首任务';
    }
  }

  function renderFunnel(summary) {
    const steps = [
      {
        label: 'Check-in opened',
        value: summary.checkinOpenSessions,
        caption: '进入博物馆打卡页',
        rate: 100
      },
      {
        label: 'Task opened',
        value: summary.taskOpenSessions,
        caption: `Activation ${formatRate(summary.activationRate)} / 目标 ${CONFIG.TARGETS.activationRate}%`,
        rate: summary.activationRate
      },
      {
        label: 'First task complete',
        value: summary.firstTaskCompletedSessions,
        caption: `Completion ${formatRate(summary.firstTaskCompletionRate)} / 目标 ${CONFIG.TARGETS.firstTaskCompletionRate}%`,
        rate: summary.firstTaskCompletionRate
      }
    ];

    const container = getElement('funnelSteps');
    container.textContent = '';
    steps.forEach(step => {
      const node = document.createElement('div');
      node.className = 'funnel-step';
      node.innerHTML = `
        <strong>${formatNumber(step.value)}</strong>
        <span>${escapeHtml(step.label)}</span>
        <span>${escapeHtml(step.caption)}</span>
        <div class="bar" aria-hidden="true"><div class="bar-fill" style="width:${Math.min(100, Math.max(0, step.rate))}%"></div></div>
      `;
      container.appendChild(node);
    });
  }

  function renderMuseums(museums) {
    const list = getElement('museumList');
    list.textContent = '';
    const visible = museums.slice(0, 8);
    if (!visible.length) {
      list.appendChild(emptyItem('暂无博物馆维度数据'));
      return;
    }

    visible.forEach(museum => {
      const completionRate = percentage(museum.firstTaskCompleted, museum.sessions);
      const activationRate = percentage(museum.taskOpened, museum.sessions);
      const item = document.createElement('li');
      item.className = 'target-item';
      item.innerHTML = `
        <div class="target-top">
          <div>
            <div class="target-title">${escapeHtml(museum.museumName || museum.museumId)}</div>
            <div class="target-meta mono">${escapeHtml(museum.museumId)}</div>
          </div>
          <span class="${rateClass(completionRate, CONFIG.TARGETS.firstTaskCompletionRate)}">${formatRate(completionRate)}</span>
        </div>
        <div class="target-meta">
          ${formatNumber(museum.sessions)} opens · activation ${formatRate(activationRate)} · feedback ${formatNumber(museum.feedback)}
        </div>
        <div class="bar" aria-hidden="true"><div class="bar-fill" style="width:${completionRate}%"></div></div>
      `;
      list.appendChild(item);
    });
  }

  function renderFeedback(feedbackSignals) {
    const list = getElement('feedbackList');
    list.textContent = '';
    const negative = feedbackSignals.filter(signal => signal.parameters.rating === 'not_helpful');
    const prioritized = negative.length ? negative : feedbackSignals;
    const visible = prioritized.slice(0, 8);

    if (!visible.length) {
      list.appendChild(emptyItem('暂无反馈。先继续收集首任务反馈。'));
      return;
    }

    visible.forEach(signal => {
      const item = document.createElement('li');
      item.className = 'feedback-item';
      const rating = signal.parameters.rating === 'not_helpful' ? '不顺' : '有帮助';
      const comment = safeString(signal.parameters.comment).trim();
      item.innerHTML = `
        <div class="feedback-top">
          <div>
            <div class="feedback-title">${escapeHtml(rating)} · ${escapeHtml(signal.parameters.taskTitle || '未知任务')}</div>
            <div class="feedback-meta">${escapeHtml(signal.museumName || signal.museumId || '未知博物馆')} · ${formatTime(signal.timestamp)}</div>
          </div>
          <span class="${signal.parameters.rating === 'not_helpful' ? 'rate-badge bad' : 'rate-badge'}">${escapeHtml(rating)}</span>
        </div>
        <div class="feedback-meta">${comment ? escapeHtml(comment) : '没有文字补充'}</div>
      `;
      list.appendChild(item);
    });
  }

  function renderDepth(buckets) {
    const body = getElement('depthTableBody');
    body.textContent = '';
    buckets.forEach(bucket => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="mono">${escapeHtml(bucket.label)}</td>
        <td>${formatNumber(bucket.count)}</td>
        <td>${formatRate(bucket.rate)}</td>
        <td class="muted">${escapeHtml(bucket.description)}</td>
      `;
      body.appendChild(row);
    });
  }

  function renderRecentSignals(signals) {
    const body = getElement('signalTableBody');
    body.textContent = '';
    if (!signals.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" class="empty-state">暂无信号</td>';
      body.appendChild(row);
      return;
    }

    signals.forEach(signal => {
      const task = signal.parameters.taskTitle || signal.parameters.reportedTreasureName || '';
      const note = signal.signalType === 'visit_feedback'
        ? `${signal.parameters.rating || ''}${signal.parameters.comment ? ': ' + signal.parameters.comment : ''}`
        : signal.parameters.completionMethod || '';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatTime(signal.timestamp)}</td>
        <td>${escapeHtml(SIGNAL_LABELS[signal.signalType] || signal.signalType)}</td>
        <td>${escapeHtml(signal.museumName || signal.museumId || '-')}</td>
        <td>${escapeHtml(signal.ageGroup || '-')}</td>
        <td>${escapeHtml(task || '-')}</td>
        <td>${escapeHtml(note || '-')}</td>
      `;
      body.appendChild(row);
    });
  }

  function emptyItem(text) {
    const item = document.createElement('li');
    item.className = 'empty-state';
    item.textContent = text;
    return item;
  }

  function rateClass(value, target) {
    if (value >= target) return 'rate-badge';
    if (value === 0) return 'rate-badge bad';
    return 'rate-badge warn';
  }

  function setStatus(text, stateName = 'neutral') {
    const pill = getElement('statusPill');
    pill.textContent = text;
    pill.className = 'status-pill';
    if (stateName === 'error') pill.style.color = '#b42318';
    else pill.style.color = '';
  }

  function setLoading(isLoading) {
    getElement('reloadButton').disabled = isLoading;
    getElement('exportButton').disabled = isLoading;
  }

  async function loadSignals() {
    setLoading(true);
    setStatus('加载中');
    try {
      const url = `${getEndpoint()}?key=${encodeURIComponent(CONFIG.VISIT_SIGNAL_KEY)}&sortKey=*`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`KV read failed: ${response.status}`);
      const data = await response.json();
      state.allSignals = parseSignalsFromKvResponse(data);
      getElement('lastLoaded').textContent = `最近加载 ${new Date().toLocaleString('zh-CN', { hour12: false })}`;
      render();
    } catch (error) {
      state.allSignals = [];
      state.filteredSignals = [];
      state.summary = summarizeSignals([]);
      render();
      setStatus(`加载失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  function exportSummary() {
    const summary = state.summary || summarizeSignals([]);
    const lines = [
      'MuseumCheck Visit Metrics',
      `Range: ${getElement('rangeSelect').value}`,
      `Museum filter: ${getElement('museumFilter').value || 'all'}`,
      `Signals: ${summary.totalSignals}`,
      `Check-in opens: ${summary.checkinOpenSessions}`,
      `Task opens: ${summary.taskOpenSessions}`,
      `First task completions: ${summary.firstTaskCompletedSessions}`,
      `Activation rate: ${formatRate(summary.activationRate)}`,
      `First task completion rate: ${formatRate(summary.firstTaskCompletionRate)}`,
      `Feedback sessions: ${summary.feedbackSessions}`,
      `Not helpful rate: ${summary.feedbackSessions ? formatRate(summary.notHelpfulRate) : '-'}`
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `museumcheck-visit-metrics-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return safeString(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function getElement(id) {
    return root.document.getElementById(id);
  }

  function setText(id, value) {
    getElement(id).textContent = value;
  }

  function init() {
    const app = getElement('app');
    const unauthorized = getElement('unauthorized');
    if (!app || !unauthorized) return;

    if (!isAdmin) {
      unauthorized.hidden = false;
      return;
    }

    app.hidden = false;
    getElement('rangeSelect').addEventListener('change', render);
    getElement('museumFilter').addEventListener('input', render);
    getElement('reloadButton').addEventListener('click', loadSignals);
    getElement('exportButton').addEventListener('click', exportSummary);
    loadSignals();
  }

  root.VisitMetricsDashboard = {
    extractItemsFromKvResponse,
    parseSignalItem,
    parseSignalsFromKvResponse,
    filterSignals,
    summarizeSignals,
    percentage
  };

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(window);
