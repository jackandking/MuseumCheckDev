/**
 * Museum Live Room Service (js/live-room-service.js)
 *
 * 博物馆「同游现场」的数据层：一个博物馆一个房间，房间内容只有两类记录。
 *
 * 1. broadcast —— 系统根据真实打卡行为生成（到馆 / 完成某项任务 / 全部完成）
 * 2. message   —— 家长从预设语句中选一句发出
 *
 * 核心安全性质：房间记录里**不存任何自由文本**。
 * 每条 message 只存 phraseId + 数字槽位，每个 broadcast 只存 event + 数字。
 * 渲染时由**读取方**用自己的语句目录还原文案，且槽位数字会被范围校验。
 * 因此即使有人直接往 KV 里写垃圾，也到不了任何人的屏幕上——他们最多能
 * 组合出目录里已有的句子。这让一个没有审核能力的哑存储（KV）也能安全承载。
 *
 * 隐私：不收集姓名、联系方式、孩子信息、实时位置。
 * 在场统计只按「今日」和「近 90 分钟」两个粗粒度时间窗计数，不显示谁在线。
 */

(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuseumCheckLive = api;
})(typeof window !== 'undefined' ? window : null, function (root) {
  'use strict';

  const ROOM_PREFIX = 'museumcheck-live-';
  const KV_FALLBACK_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
  // Shared with museum-checkin.html: the room must recognise "my own" signals.
  const VISITOR_KEY = 'museumcheckVisitVisitorId';
  const USER_KEY = 'user_id';
  const ALIAS_KEY = 'museumcheckLiveAlias';
  const SEND_LOG_KEY = 'museumcheckLiveSendLog';
  const ALIAS_MAX = 12;
  const RECORD_TTL_SECONDS = 12 * 60 * 60;
  const ACTIVE_WINDOW_MS = 90 * 60 * 1000;
  const FEED_LIMIT = 60;
  const SEND_COOLDOWN_MS = 20 * 1000;
  const SEND_HOURLY_CAP = 12;
  const ANONYMOUS_LABEL = '一个家庭';

  /**
   * 唯一的语句目录。读取方只认这里的 phraseId；不在目录里的记录一律丢弃。
   * text 里的 {task} / {done} / {total} 由发送方的数字槽位填充。
   */
  const PRESET_GROUPS = Object.freeze([
    Object.freeze({ id: 'greet', label: '招呼', phrases: Object.freeze([
      Object.freeze({ id: 'greet-arrive', text: '我们到了' }),
      Object.freeze({ id: 'greet-crowd', text: '今天馆里人多吗？' }),
      Object.freeze({ id: 'greet-anyone', text: '有人也在馆里吗？' })
    ]) }),
    Object.freeze({ id: 'exhibit', label: '展品', phrases: Object.freeze([
      Object.freeze({ id: 'exhibit-worth', text: '这件太值得看了' }),
      Object.freeze({ id: 'exhibit-together', text: '一起看这个？' }),
      Object.freeze({ id: 'exhibit-looked', text: '我们刚看了「{item}」', slot: 'item' })
    ]) }),
    Object.freeze({ id: 'route', label: '行程', phrases: Object.freeze([
      Object.freeze({ id: 'route-queue', text: '我们在排队' }),
      Object.freeze({ id: 'route-wait', text: '稍等 10 分钟' }),
      Object.freeze({ id: 'route-next', text: '我们往下一个展厅了' })
    ]) }),
    Object.freeze({ id: 'achievement', label: '成就', phrases: Object.freeze([
      Object.freeze({ id: 'ach-progress', text: '我们已完成 {done} 项任务', slot: 'progress' }),
      Object.freeze({ id: 'ach-nice', text: '干得漂亮' }),
      Object.freeze({ id: 'ach-all', text: '谁集齐了全部任务？' })
    ]) })
  ]);

  const BROADCAST_EVENTS = Object.freeze(['arrive', 'progress', 'all_done']);
  const BROADCAST_TEMPLATES = Object.freeze({
    arrive: '{who} 到馆了',
    progress: '{who} 完成了 {done}/{total} 项任务',
    all_done: '{who} 集齐了全部 {total} 项任务'
  });

  const PHRASE_BY_ID = (function buildIndex() {
    const index = Object.create(null);
    PRESET_GROUPS.forEach(group => group.phrases.forEach(phrase => { index[phrase.id] = phrase; }));
    return index;
  })();

  function cleanText(value, max) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/[<>\u0000-\u001f]/g, '')
      .trim()
      .slice(0, max);
  }

  function clampInt(value, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < min || parsed > max) return null;
    return parsed;
  }

  function randomId() {
    return Math.random().toString(36).slice(2, 10);
  }

  function storageRead(key) {
    try { return root && root.localStorage ? root.localStorage.getItem(key) : null; } catch (_) { return null; }
  }

  function storageWrite(key, value) {
    try { if (root && root.localStorage) root.localStorage.setItem(key, value); } catch (_) {}
  }

  function getUserId() {
    let userId = storageRead(USER_KEY);
    if (userId) return userId;
    if (root && root.crypto && typeof root.crypto.randomUUID === 'function') userId = root.crypto.randomUUID();
    else userId = `user-${Date.now()}-${randomId()}`;
    storageWrite(USER_KEY, userId);
    return userId;
  }

  /** Same identity the check-in page uses, so "你们" is recognised on both pages. */
  function getVisitorId() {
    let visitorId = storageRead(VISITOR_KEY);
    if (visitorId) return visitorId;
    visitorId = `visitor-${Date.now()}-${randomId()}`;
    storageWrite(VISITOR_KEY, visitorId);
    return visitorId;
  }

  /** 默认代号是设备 id 的短哈希，稳定、可区分、不含任何真实信息。 */
  function defaultAlias() {
    const tail = String(getUserId()).replace(/[^0-9a-zA-Z]/g, '').toLowerCase().slice(-4) || '0000';
    return `家庭 ${tail}`;
  }

  function getAlias() {
    return cleanText(storageRead(ALIAS_KEY), ALIAS_MAX) || defaultAlias();
  }

  function setAlias(value) {
    const alias = cleanText(value, ALIAS_MAX) || defaultAlias();
    storageWrite(ALIAS_KEY, alias);
    return alias;
  }

  function roomKey(museumId) {
    const safe = String(museumId || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    return safe ? `${ROOM_PREFIX}${safe}` : '';
  }

  function endpoint() {
    const configured = root && root.API_ENDPOINTS && root.API_ENDPOINTS.KV_STORE;
    return configured || KV_FALLBACK_ENDPOINT;
  }

  function parseRecords(payload) {
    let list = payload && payload.value;
    if (typeof list === 'string') { try { list = JSON.parse(list); } catch (_) { list = []; } }
    if (!Array.isArray(list)) return [];
    return list.map(item => {
      const raw = item && typeof item === 'object' ? item.value : null;
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (_) { return null; }
    }).filter(Boolean);
  }

  function readRoom(museumId) {
    const key = roomKey(museumId);
    if (!key || !root || typeof root.fetch !== 'function') return Promise.resolve({ ok: false, records: [] });
    return root.fetch(`${endpoint()}?key=${encodeURIComponent(key)}&sortKey=*`, { cache: 'no-store' })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => ({ ok: true, records: parseRecords(payload) }))
      .catch(() => ({ ok: false, records: [] }));
  }

  function writeRecord(museumId, record) {
    const key = roomKey(museumId);
    if (!key || !root || typeof root.fetch !== 'function') return Promise.resolve(false);
    const timestamp = Date.now();
    const payload = Object.assign({}, record, {
      museumId: String(museumId || ''),
      visitorId: getVisitorId(),
      alias: cleanText(record && record.alias, ALIAS_MAX) || getAlias(),
      timestamp
    });
    const body = JSON.stringify({
      key,
      sortKey: `${timestamp}-${randomId()}`,
      value: JSON.stringify(payload),
      expireAt: Math.floor(timestamp / 1000) + RECORD_TTL_SECONDS
    });
    return root.fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: body.length < 60000
    }).then(response => response.ok).catch(() => false);
  }

  /**
   * 发一条预设语句。phraseId 必须在目录里，槽位只接受数字。
   * 房间记录中不出现任何自由文本。
   */
  function postMessage(museumId, phraseId, slots) {
    const phrase = PHRASE_BY_ID[phraseId];
    if (!phrase) return Promise.resolve(false);
    const record = { kind: 'message', phraseId };
    const safeSlots = normalizeSlots(phrase, slots);
    if (phrase.slot && !safeSlots) return Promise.resolve(false);
    if (safeSlots) record.slots = safeSlots;
    return writeRecord(museumId, record);
  }

  function normalizeSlots(phrase, slots) {
    if (!phrase.slot) return null;
    const input = slots && typeof slots === 'object' ? slots : {};
    if (phrase.slot === 'item') {
      const itemIndex = clampInt(input.itemIndex, 0, 99);
      return itemIndex === null ? null : { itemIndex };
    }
    if (phrase.slot === 'progress') {
      const done = clampInt(input.done, 1, 50);
      return done === null ? null : { done };
    }
    return null;
  }

  /** 打卡页调用：把真实行为变成房间广播。 */
  function postBroadcast(museumId, event, details) {
    if (BROADCAST_EVENTS.indexOf(event) < 0) return Promise.resolve(false);
    const input = details && typeof details === 'object' ? details : {};
    const record = { kind: 'broadcast', event };
    if (event === 'progress') {
      const done = clampInt(input.done, 1, 50);
      const total = clampInt(input.total, 1, 50);
      if (done === null || total === null || done > total) return Promise.resolve(false);
      record.done = done;
      record.total = total;
    }
    if (event === 'all_done') {
      const total = clampInt(input.total, 1, 50);
      if (total === null) return Promise.resolve(false);
      record.total = total;
    }
    return writeRecord(museumId, record);
  }

  function sendLog(now) {
    let log = [];
    try { log = JSON.parse(storageRead(SEND_LOG_KEY) || '[]'); } catch (_) { log = []; }
    if (!Array.isArray(log)) log = [];
    return log.filter(ts => Number.isFinite(ts) && now - ts < 60 * 60 * 1000);
  }

  /** 本地限速：家长不是来刷屏的，冷启动阶段更需要克制。 */
  function canSend(now) {
    const clock = Number.isFinite(now) ? now : Date.now();
    const log = sendLog(clock);
    if (log.length >= SEND_HOURLY_CAP) return { ok: false, reason: '这一小时已经说得够多了，先专心看展吧。' };
    const last = log.length ? Math.max.apply(null, log) : 0;
    if (last && clock - last < SEND_COOLDOWN_MS) {
      const seconds = Math.ceil((SEND_COOLDOWN_MS - (clock - last)) / 1000);
      return { ok: false, reason: `刚发过一条，${seconds} 秒后可以再发。` };
    }
    return { ok: true, log };
  }

  function recordSend(now) {
    const clock = Number.isFinite(now) ? now : Date.now();
    const log = sendLog(clock);
    log.push(clock);
    storageWrite(SEND_LOG_KEY, JSON.stringify(log));
  }

  function itemLabel(itemIndex, context) {
    const names = context && Array.isArray(context.itemNames) ? context.itemNames : [];
    if (!Number.isInteger(itemIndex)) return '一件展品';
    // 本地已加载馆藏时，越界索引视为可疑并丢弃；未加载时退化为泛称。
    if (names.length > 0 && !cleanText(names[itemIndex], 30)) return null;
    return cleanText(names[itemIndex], 30) || '一件展品';
  }

  /** 用读取方自己的目录还原文案；未知 phraseId 返回 null（丢弃）。 */
  function renderMessage(record, context) {
    const phrase = record && PHRASE_BY_ID[cleanText(record.phraseId, 32)];
    if (!phrase) return null;
    const slots = record.slots && typeof record.slots === 'object' ? record.slots : {};
    const safe = normalizeSlots(phrase, slots);
    if (phrase.slot && !safe) return null;
    const item = itemLabel(safe ? safe.itemIndex : null, context);
    if (phrase.slot === 'item' && !item) return null;
    return phrase.text
      .replace('{item}', () => item || '一件展品')
      .replace('{done}', () => String(safe ? safe.done : 0))
      .replace('{total}', () => String(safe ? safe.total : 0));
  }
  function renderBroadcast(record, context) {
    const template = BROADCAST_TEMPLATES[record && record.event];
    if (!template) return null;
    const done = clampInt(record.done, 1, 50);
    const total = clampInt(record.total, 1, 50);
    if (record.event === 'progress' && (done === null || total === null || done > total)) return null;
    if (record.event === 'all_done' && total === null) return null;
    return template
      .replace('{done}', () => String(done === null ? 0 : done))
      .replace('{total}', () => String(total === null ? 0 : total));
  }

  function timeLabel(timestamp, now) {
    if (!Number.isFinite(timestamp)) return '';
    const clock = Number.isFinite(now) ? now : Date.now();
    const delta = clock - timestamp;
    if (delta < 60 * 1000) return '刚刚';
    if (delta < 60 * 60 * 1000) return `${Math.floor(delta / (60 * 1000))} 分钟前`;
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * 在场统计：只用时间窗，不显示谁在线。
   * today      —— 今天来过的设备数
   * active     —— 近 90 分钟有动作的设备数
   */
  function summarize(records, now) {
    const clock = Number.isFinite(now) ? now : Date.now();
    const dayStart = new Date(clock);
    dayStart.setHours(0, 0, 0, 0);
    const dayStartTime = dayStart.getTime();
    const today = new Set();
    const active = new Set();
    (Array.isArray(records) ? records : []).forEach(record => {
      const timestamp = record && Number(record.timestamp);
      if (!Number.isFinite(timestamp)) return;
      const identity = cleanText(record.visitorId, 64) || 'anonymous';
      if (timestamp >= dayStartTime) today.add(identity);
      if (clock - timestamp <= ACTIVE_WINDOW_MS) active.add(identity);
    });
    return { today: today.size, active: active.size };
  }

  /**
   * 一条记录是否可信：时间戳有效、类型已知、句子能在本地目录里还原。
   * 在场统计也只数这些记录，避免有人灌垃圾把「在场人数」刷上去。
   */
  function isRenderable(record, context) {
    if (!record || typeof record !== 'object') return false;
    if (!Number.isFinite(Number(record.timestamp))) return false;
    const scope = { itemNames: context && Array.isArray(context.itemNames) ? context.itemNames : [] };
    if (record.kind === 'message') return Boolean(renderMessage(record, scope));
    if (record.kind === 'broadcast') return Boolean(renderBroadcast(record, scope));
    return false;
  }

  /** 把房间记录变成可直接渲染的条目；未经目录校验的一律丢弃。 */
  function buildFeed(records, options) {
    const config = options && typeof options === 'object' ? options : {};
    const myVisitorId = config.myVisitorId || getVisitorId();
    const now = Number.isFinite(config.now) ? config.now : Date.now();
    const context = { itemNames: Array.isArray(config.itemNames) ? config.itemNames : [] };
    return (Array.isArray(records) ? records : [])
      .map(record => {
        if (!isRenderable(record, context)) return null;
        const timestamp = Number(record.timestamp);
        const mine = cleanText(record.visitorId, 64) === myVisitorId;
        const who = mine ? '你们' : (cleanText(record.alias, ALIAS_MAX) || ANONYMOUS_LABEL);
        if (record.kind === 'message') {
          const text = renderMessage(record, context);
          return { id: `${timestamp}-${record.phraseId}-${cleanText(record.visitorId, 8)}`, kind: 'message', mine, who, text, timestamp, time: timeLabel(timestamp, now) };
        }
        const text = renderBroadcast(record, context);
        return { id: `${timestamp}-${record.event}-${cleanText(record.visitorId, 8)}`, kind: 'broadcast', event: record.event, mine, who, text: text.replace('{who}', who), timestamp, time: timeLabel(timestamp, now) };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp)
      // 同一个家庭连续完成多项任务时只留最新一条进度，避免一个人刷满整屏。
      .filter((item, index, list) => {
        if (item.kind !== 'broadcast' || item.event !== 'progress') return true;
        const next = list[index + 1];
        return !next || next.kind !== 'broadcast' || next.event !== 'progress' || next.who !== item.who;
      })
      .slice(-FEED_LIMIT);
  }

  /** 只统计能被还原文案的记录，供在场计数使用。 */
  function trustableRecords(records, options) {
    const config = options && typeof options === 'object' ? options : {};
    const context = { itemNames: Array.isArray(config.itemNames) ? config.itemNames : [] };
    return (Array.isArray(records) ? records : []).filter(record => isRenderable(record, context));
  }

  /** 目录里哪些句子现在能发（槽位数据不全的不显示）。 */
  function phraseCatalog(context) {
    const info = context && typeof context === 'object' ? context : {};
    const hasItems = Array.isArray(info.itemNames) && info.itemNames.length > 0;
    const done = clampInt(info.done, 1, 50);
    const hasProgress = done !== null;
    return PRESET_GROUPS.map(group => ({
      id: group.id,
      label: group.label,
      phrases: group.phrases
        .filter(phrase => (phrase.slot === 'item' ? hasItems : phrase.slot === 'progress' ? hasProgress : true))
        .map(phrase => ({ id: phrase.id, text: phrase.text, slot: phrase.slot || null }))
    })).filter(group => group.phrases.length > 0);
  }

  return {
    ROOM_PREFIX,
    RECORD_TTL_SECONDS,
    ACTIVE_WINDOW_MS,
    SEND_COOLDOWN_MS,
    SEND_HOURLY_CAP,
    ANONYMOUS_LABEL,
    PRESET_GROUPS,
    BROADCAST_EVENTS,
    cleanText,
    getUserId,
    getVisitorId,
    getAlias,
    setAlias,
    defaultAlias,
    roomKey,
    endpoint,
    parseRecords,
    readRoom,
    postMessage,
    postBroadcast,
    itemLabel,
    renderMessage,
    renderBroadcast,
    timeLabel,
    summarize,
    buildFeed,
    isRenderable,
    trustableRecords,
    phraseCatalog,
    canSend,
    recordSend
  };
});
