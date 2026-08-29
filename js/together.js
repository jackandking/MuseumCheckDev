(function(root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuseumCheckTogether = api;
})(typeof window !== 'undefined' ? window : null, function(root) {
  'use strict';
  const KEY = 'museumcheck-together-events';
  const PUBLIC_EVENT_KEY = 'museumcheck-together-public-events';
  const CREATED_EVENT_PREFIX = 'museumcheckTogetherCreated:';
  const PAGE_VERSION = 'together-20260815b';
  const TTL = 90 * 24 * 60 * 60;
  const EVENT_PATTERN = /^[a-z0-9][a-z0-9-]{2,39}$/;
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
  const AGE_GROUPS = Object.freeze({
    '3-6': '3–6 岁｜观察与发现',
    '7-12': '7–12 岁｜探索与提问',
    '13-18': '13–18 岁｜主题讨论'
  });
  // Public activities are intentionally curated in code for this first, reversible experiment.
  // A creator-generated link remains private unless a maintainer adds it here.
  const PUBLIC_EVENTS = Object.freeze([
    Object.freeze({ eventId:'shanghai-museum-aug22', museumId:'shanghai-museum', date:'2026-08-22', time:'10:30', limit:5, ageGroup:'7-12', status:'recruiting' })
  ]);
  // Old join records only saved an event id. Keep known shipped activity links
  // recoverable while new records save the complete, normalized descriptor.
  const LEGACY_EVENTS = Object.freeze([
    Object.freeze({ eventId:'shanghai-sunday-1', museumId:'shanghai-museum', date:'2026-08-16', time:'10:30', limit:5, ageGroup:'7-12' })
  ]);

  function cleanText(value, max) { return String(value || '').trim().replace(/[<>]/g, '').slice(0, max); }
  function normalizeEvent(input) {
    const value = input || {};
    const eventId = String(value.eventId || '').trim().toLowerCase();
    const museumId = cleanText(value.museumId, 80);
    const date = String(value.date || '').trim();
    const time = String(value.time || '').trim();
    const limit = Math.max(2, Math.min(8, Number.parseInt(value.limit, 10) || 5));
    const ageGroup = AGE_GROUPS[value.ageGroup] ? value.ageGroup : '';
    return {
      eventId: EVENT_PATTERN.test(eventId) ? eventId : '',
      museumId,
      date: DATE_PATTERN.test(date) ? date : '',
      time: TIME_PATTERN.test(time) ? time : '',
      limit, ageGroup
    };
  }
  function eventKey(event) { return `museumcheckTogether:${event.eventId}`; }
  function createdEventKey(event) { return `${CREATED_EVENT_PREFIX}${event.eventId}`; }
  function getMuseum(event) {
    const museums = Array.isArray(root && root.MUSEUMS_META) ? root.MUSEUMS_META : [];
    return museums.find(museum => museum && museum.id === event.museumId) || null;
  }
  function createJoinId() { return `together-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
  function createEventId() { return `visit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
  function storageGet(key) { try { return root.localStorage.getItem(key); } catch (_) { return ''; } }
  function storageSet(key, value) { try { root.localStorage.setItem(key, value); } catch (_) {} }
  function storageItems(prefix) {
    const items = [];
    try {
      for (let index = 0; index < root.localStorage.length; index += 1) {
        const key = root.localStorage.key(index);
        if (key && key.indexOf(prefix) === 0) items.push({ key, value: root.localStorage.getItem(key) });
      }
    } catch (_) {}
    return items;
  }
  function saveCreatedEvent(event) {
    const normalized = normalizeEvent(event);
    if (!eventIsReady(normalized)) return;
    storageSet(createdEventKey(normalized), JSON.stringify({ event:normalized, createdAt:Date.now() }));
  }
  function buildVisitUrl(event, museum, selectedAgeGroup, mode) {
    const params = new URLSearchParams({ museum: museum.id, format: 'friends', together: event.eventId });
    const ageGroup = AGE_GROUPS[selectedAgeGroup] ? selectedAgeGroup : event.ageGroup;
    if (ageGroup) params.set('age', ageGroup);
    if (mode === 'share') params.set('togetherMode', 'share');
    return `museum-checkin.html?${params.toString()}`;
  }
  function buildEventUrl(event) {
    const params = new URLSearchParams({ event:event.eventId, museum:event.museumId, date:event.date, time:event.time, limit:String(event.limit) });
    if (AGE_GROUPS[event.ageGroup]) params.set('ageGroup', event.ageGroup);
    params.set('v', PAGE_VERSION);
    return `together.html?${params.toString()}`;
  }
  function humanDate(date, time) {
    if (!date) return '待发起者确认';
    const value = new Date(`${date}T00:00:00`);
    const label = Number.isNaN(value.getTime()) ? date : value.toLocaleDateString('zh-CN', { month:'long', day:'numeric', weekday:'short' });
    return time ? `${label} ${time}` : label;
  }
  function eventIsReady(event) { return Boolean(event.eventId && event.museumId && event.date && event.time); }
  function parseItems(payload) {
    let value = payload && payload.value;
    if (typeof value === 'string') { try { value = JSON.parse(value); } catch (_) { value = []; } }
    return Array.isArray(value) ? value : [];
  }
  function countJoins(payload, eventId) {
    const ids = new Set();
    parseItems(payload).forEach(item => {
      try {
        const signal = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        if (signal && signal.type === 'together_join' && signal.eventId === eventId && signal.joinId) ids.add(signal.joinId);
      } catch (_) {}
    });
    return ids.size;
  }
  function publicAliases(payload, eventId) {
    const aliases = new Map();
    parseItems(payload).forEach(item => {
      try {
        const signal = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        const alias = cleanText(signal && signal.alias, 12);
        if (signal && signal.type === 'together_join' && signal.eventId === eventId && signal.joinId && signal.showAlias && alias) aliases.set(signal.joinId, alias);
      } catch (_) {}
    });
    return Array.from(aliases.values());
  }
  function publicEventsFromPayload(payload) {
    const seen = new Set();
    return parseItems(payload).map(item => {
      try { return typeof item.value === 'string' ? JSON.parse(item.value) : item.value; } catch (_) { return null; }
    }).filter(signal => signal && signal.type === 'together_public_event' && signal.event)
      .map(signal => ({ ...normalizeEvent(signal.event), status:'recruiting' }))
      .filter(event => eventIsReady(event) && !seen.has(event.eventId) && seen.add(event.eventId));
  }
  function endpoint() { return root && root.API_ENDPOINTS && root.API_ENDPOINTS.KV_STORE; }
  function writeJoin(event, joinId, mode, alias, showAlias) {
    const now = Date.now();
    const publicAlias = showAlias ? cleanText(alias, 12) : '';
    const payload = { type:'together_join', eventId:event.eventId, joinId, mode: mode === 'share' ? 'share' : 'easy', showAlias:Boolean(publicAlias), timestamp:now };
    if (publicAlias) payload.alias = publicAlias;
    const body = JSON.stringify({ key:KEY, sortKey:`join-${event.eventId}-${joinId}`, value:JSON.stringify(payload), expireAt:Math.floor(now / 1000) + TTL });
    if (!root || typeof root.fetch !== 'function' || !endpoint()) return Promise.resolve();
    return root.fetch(endpoint(), { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true }).catch(() => undefined);
  }
  function writePublicEvent(event) {
    const normalized = normalizeEvent(event);
    if (!eventIsReady(normalized) || !root || typeof root.fetch !== 'function' || !endpoint()) return Promise.resolve(false);
    const now = Date.now();
    const payload = { type:'together_public_event', event:{ ...normalized, status:'recruiting' }, timestamp:now };
    const body = JSON.stringify({ key:PUBLIC_EVENT_KEY, sortKey:`event-${normalized.eventId}`, value:JSON.stringify(payload), expireAt:Math.floor(now / 1000) + TTL });
    return root.fetch(endpoint(), { method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true })
      .then(response => response.ok).catch(() => false);
  }
  function loadPublicEvents() {
    if (!root || typeof root.fetch !== 'function' || !endpoint()) return Promise.resolve([]);
    return root.fetch(`${endpoint()}?key=${encodeURIComponent(PUBLIC_EVENT_KEY)}&sortKey=*`, {cache:'no-store'})
      .then(response => response.ok ? response.json() : null)
      .then(publicEventsFromPayload).catch(() => []);
  }
  function loadCount(event) {
    if (!root || typeof root.fetch !== 'function' || !endpoint()) return Promise.resolve(0);
    return root.fetch(`${endpoint()}?key=${encodeURIComponent(KEY)}&sortKey=*`, {cache:'no-store'})
      .then(response => response.ok ? response.json() : null)
      .then(payload => countJoins(payload, event.eventId)).catch(() => 0);
  }
  function loadAttendance(event) {
    if (!root || typeof root.fetch !== 'function' || !endpoint()) return Promise.resolve({ count:0, aliases:[] });
    return root.fetch(`${endpoint()}?key=${encodeURIComponent(KEY)}&sortKey=*`, {cache:'no-store'})
      .then(response => response.ok ? response.json() : null)
      .then(payload => ({ count:countJoins(payload, event.eventId), aliases:publicAliases(payload, event.eventId) }))
      .catch(() => ({ count:0, aliases:[] }));
  }
  function loadCounts(events) {
    if (!root || typeof root.fetch !== 'function' || !endpoint()) return Promise.resolve(new Map());
    return root.fetch(`${endpoint()}?key=${encodeURIComponent(KEY)}&sortKey=*`, {cache:'no-store'})
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        const counts = new Map();
        events.forEach(event => counts.set(event.eventId, countJoins(payload, event.eventId)));
        return counts;
      }).catch(() => new Map());
  }
  function publicEventState(event, now) {
    const parts = String(event.date || '').split('-').map(Number);
    const clock = String(event.time || '').split(':').map(Number);
    const start = parts.length === 3 && clock.length === 2
      ? new Date(parts[0], parts[1] - 1, parts[2], clock[0], clock[1]).getTime()
      : Number.NaN;
    const elapsed = Number.isNaN(start) ? -1 : now - start;
    if (elapsed >= 0 && elapsed < 5 * 60 * 60 * 1000) return 'ongoing';
    return event.status === 'recruiting' && elapsed < 0 ? 'recruiting' : 'past';
  }
  function myActivities() {
    const activities = new Map();
    const remember = (event, kind) => {
      const normalized = normalizeEvent(event);
      if (!eventIsReady(normalized) || activities.has(normalized.eventId)) return;
      activities.set(normalized.eventId, { event:normalized, kind });
    };
    storageItems(CREATED_EVENT_PREFIX).forEach(item => {
      try { remember(JSON.parse(item.value).event, '我发起的活动'); } catch (_) {}
    });
    storageItems('museumcheckTogether:').forEach(item => {
      try {
        const saved = JSON.parse(item.value);
        if (saved && saved.event) remember(saved.event, '已报名');
        else {
          const legacy = PUBLIC_EVENTS.concat(LEGACY_EVENTS).find(event => event.eventId === item.key.slice('museumcheckTogether:'.length));
          if (legacy) remember(legacy, '已报名');
        }
      } catch (_) {}
    });
    return Array.from(activities.values()).sort((a, b) => `${a.event.date}${a.event.time}`.localeCompare(`${b.event.date}${b.event.time}`));
  }
  function buildActivityRow(event, museum, count, state, tagOverride) {
    const isPast = state === 'past';
    const row = root.document.createElement(state === 'recruiting' ? 'a' : 'article');
    row.className = `activity-row${state === 'ongoing' ? ' activity-row--ongoing' : ''}${isPast ? ' activity-row--past' : ''}`;
    if (state === 'recruiting') row.href = buildEventUrl(event);
    const capacity = Math.max(0, event.limit - count);
    const tag = tagOverride || (isPast ? '已结束' : state === 'ongoing' ? '正在进行 · 匿名旁观' : '正在招募');
    const detail = isPast
      ? `${humanDate(event.date, event.time)} · ${AGE_GROUPS[event.ageGroup] || '亲子同行'}`
      : state === 'ongoing'
        ? `已有 ${count} 组家庭加入，正各自从第一张任务开始。`
        : `${humanDate(event.date, event.time)} · ${AGE_GROUPS[event.ageGroup] || '亲子同行'}`;
    const callout = isPast
      ? (count ? `共 ${count} 组家庭参与` : '活动已结束')
      : state === 'ongoing' ? '仅看进度' : (capacity ? `还可加入 ${capacity} 组` : '本场已满');
    const sideBottom = isPast ? '活动已结束' : state === 'recruiting' && capacity ? '查看活动 →' : '不展示成员';
    row.innerHTML = `<div><span class="activity-row__tag">${tag}</span><h3>${museum.name}</h3><p>${detail}</p></div><div class="activity-row__side"><span>${callout}</span><span>${sideBottom}</span></div>`;
    return row;
  }
  function renderLobby(byId) {
    const lobby = byId('activityLobby'); const emptyCard = byId('emptyCard');
    if (!lobby || !emptyCard) return;
    lobby.hidden = false;
    const host = byId('createHost'); if (host) host.appendChild(emptyCard);
    emptyCard.hidden = false;
    const savedActivities = myActivities();
    const myList = byId('myActivityList'); const mySection = byId('myActivities');
    if (myList && mySection) {
      const myRows = savedActivities.map(item => {
        const museum = getMuseum(item.event);
        return museum ? buildActivityRow(item.event, museum, 0, 'recruiting', item.kind) : null;
      }).filter(Boolean);
      myList.replaceChildren(...myRows);
      mySection.hidden = myRows.length === 0;
    }
    loadPublicEvents().then(remoteEvents => {
      const events = new Map();
      PUBLIC_EVENTS.forEach(event => events.set(event.eventId, { ...event, ...normalizeEvent(event) }));
      remoteEvents.forEach(event => { if (!events.has(event.eventId)) events.set(event.eventId, event); });
      const visible = Array.from(events.values()).map(event => ({ event, museum:getMuseum(event) })).filter(item => item.museum);
      return loadCounts(visible.map(item => item.event)).then(counts => ({ visible, counts }));
    }).then(({ visible, counts }) => {
      const now = Date.now(); const recruiting = []; const ongoing = []; const past = [];
      visible.forEach(item => {
        const state = publicEventState(item.event, now);
        if (state === 'recruiting') recruiting.push({...item, state});
        else if (state === 'ongoing') ongoing.push({...item, state});
        else past.push({...item, state:'past'});
      });
      // Sort past events newest first
      past.sort((a, b) => `${b.event.date}${b.event.time}`.localeCompare(`${a.event.date}${a.event.time}`));
      const recruitingList = byId('recruitingList'); const ongoingList = byId('ongoingList'); const pastList = byId('pastList');
      const pastHeading = byId('pastHeading');
      if (recruitingList) {
        recruitingList.replaceChildren(...recruiting.map(item => buildActivityRow(item.event, item.museum, counts.get(item.event.eventId) || 0, item.state)));
        if (!recruiting.length) recruitingList.innerHTML = '<p class="empty-state">暂时没有公开招募的活动。可以发起一场专属同行探索。</p>';
      }
      if (ongoingList) {
        ongoingList.replaceChildren(...ongoing.map(item => buildActivityRow(item.event, item.museum, counts.get(item.event.eventId) || 0, item.state)));
        if (!ongoing.length) ongoingList.innerHTML = '<p class="empty-state">暂时没有进行中的场次；活动开始后，这里只会显示匿名进度。</p>';
      }
      if (pastList) {
        pastList.replaceChildren(...past.map(item => buildActivityRow(item.event, item.museum, counts.get(item.event.eventId) || 0, item.state)));
        if (pastHeading) pastHeading.hidden = past.length === 0;
        if (past.length) {
          const pastSummary = byId('pastSummary');
          if (pastSummary) pastSummary.textContent = `${past.length} 场已结束`;
        }
      }
      const householdTotal = recruiting.concat(ongoing).reduce((sum, item) => sum + (counts.get(item.event.eventId) || 0), 0);
      const lobbySummary = byId('lobbySummary');
      if (lobbySummary) lobbySummary.textContent = `${recruiting.length} 场招募中 · ${householdTotal} 组家庭已加入`;
    });
  }
  function init() {
    if (!root || !root.document) return;
    if (!root.document.getElementById('app')) return;
    const params = new URLSearchParams(root.location.search);
    let event = normalizeEvent({ eventId:params.get('event'), museumId:params.get('museum'), date:params.get('date'), time:params.get('time'), limit:params.get('limit'), ageGroup:params.get('ageGroup') });
    // Public links sent before age bands were introduced keep working and inherit
    // the current curated activity's primary age band.
    const configuredEvent = PUBLIC_EVENTS.find(item => item.eventId === event.eventId);
    if (!event.ageGroup && configuredEvent && AGE_GROUPS[configuredEvent.ageGroup]) event = { ...event, ageGroup:configuredEvent.ageGroup };
    const museum = getMuseum(event);
    const ready = eventIsReady(event) && museum;
    const byId = id => root.document.getElementById(id);
    const eventCard = byId('eventCard'); const joinCard = byId('joinCard'); const joinedCard = byId('joinedCard'); const emptyCard = byId('emptyCard');
    if (!ready) {
      renderLobby(byId);
      const createMuseum = byId('createMuseum');
      const museums = Array.isArray(root.MUSEUMS_META) ? root.MUSEUMS_META : [];
      museums.filter(museum => museum && museum.id && museum.name).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')).forEach(museum => {
        const option = root.document.createElement('option'); option.value = museum.id; option.textContent = `${museum.name}${museum.location ? `｜${museum.location}` : ''}`; createMuseum.appendChild(option);
      });
      const dateInput = byId('createDate');
      dateInput.min = new Date().toISOString().slice(0, 10);
      byId('createForm').addEventListener('submit', async function(eventObject) {
        eventObject.preventDefault();
        const error = byId('createError'); const museumId = createMuseum.value; const date = dateInput.value; const time = byId('createTime').value; const limit = byId('createLimit').value; const ageGroup = byId('createAgeGroup').value;
        if (!museumId || !DATE_PATTERN.test(date) || !TIME_PATTERN.test(time) || !AGE_GROUPS[ageGroup]) { error.textContent = '选好博物馆、日期、时间和主要适龄段后就能生成。'; error.hidden = false; return; }
        const created = normalizeEvent({ eventId:createEventId(), museumId, date, time, limit, ageGroup });
        saveCreatedEvent(created);
        if (byId('createPublicEvent').checked) {
          const button = eventObject.currentTarget.querySelector('button[type="submit"]');
          button.disabled = true; button.textContent = '正在发布到活动广场…';
          const published = await writePublicEvent(created);
          button.disabled = false; button.textContent = '生成活动报名链接';
          if (!published) { error.textContent = '暂时没能发布到活动广场，请检查网络后重试；活动已保留在"我的活动"。'; error.hidden = false; return; }
        }
        root.location.assign(buildEventUrl(created));
      });
      return;
    }
    eventCard.hidden = false;
    byId('eventName').textContent = `${museum.name} · 同行探索`;
    byId('museumName').textContent = museum.name;
    byId('eventTime').textContent = humanDate(event.date, event.time);
    byId('eventAge').textContent = AGE_GROUPS[event.ageGroup] || '发起者未限定';
    byId('eventLimit').textContent = `最多 ${event.limit} 组家庭`;
    byId('eventSummary').textContent = event.ageGroup
      ? `在${museum.name}，以 ${AGE_GROUPS[event.ageGroup].split('｜')[0]} 的孩子为主；每家仍按自己的节奏逛，最后可选地把一件"孩子发现"拼成共同地图。`
      : `在${museum.name}，各家按自己的节奏逛；最后可选地把一件"孩子发现"拼成共同地图。`;
    const storageKey = eventKey(event); let saved = null;
    try { saved = JSON.parse(storageGet(storageKey) || 'null'); } catch (_) {}
    function renderAttendance() {
      loadAttendance(event).then(attendance => {
        byId('attendance').textContent = attendance.count ? `目前有 ${attendance.count} 组家庭加入这场同行探索。` : '你是第一组加入的家庭。';
        const rollcall = byId('familyRollcall'); const aliases = byId('familyAliases');
        if (!rollcall || !aliases) return;
        aliases.replaceChildren(...attendance.aliases.map(alias => {
          const chip = root.document.createElement('span'); chip.className = 'family-alias'; chip.textContent = alias; return chip;
        }));
        rollcall.hidden = attendance.aliases.length === 0;
      });
    }
    renderAttendance();
    function renderJoined() {
      joinCard.hidden = true; joinedCard.hidden = false;
      const alias = cleanText(saved && saved.alias, 12) || '你们';
      byId('joinedTitle').textContent = `${alias}，先按自己的节奏出发。`;
      byId('startVisit').href = buildVisitUrl(event, museum, saved && saved.ageGroup, saved && saved.mode);
      renderAttendance();
      const discoveries = byId('eventDiscoveries'); const grid = byId('eventDiscoveriesGrid');
      if (discoveries && grid && root.MuseumCheckFamilyPhotos) {
        root.MuseumCheckFamilyPhotos.renderEventPhotos(grid, event.eventId).then(photos => { discoveries.hidden = photos.length === 0; });
      }
    }
    if (saved && saved.joinId) { renderJoined(); return; }
    joinCard.hidden = false;
    if (AGE_GROUPS[event.ageGroup]) byId('joinAgeGroup').value = event.ageGroup;
    byId('joinForm').addEventListener('submit', function(eventObject) {
      eventObject.preventDefault();
      const alias = cleanText(byId('familyAlias').value, 12); const error = byId('formError');
      if (!alias) { error.textContent = '留一个方便自己辨认的家庭代号就可以。'; error.hidden = false; return; }
      error.hidden = true;
      const mode = root.document.querySelector('input[name="mode"]:checked').value;
      const ageGroup = AGE_GROUPS[byId('joinAgeGroup').value] ? byId('joinAgeGroup').value : event.ageGroup;
      const showAlias = byId('showAlias').checked;
      saved = { alias, ageGroup, mode, showAlias, joinId:createJoinId(), joinedAt:Date.now(), event }; storageSet(storageKey, JSON.stringify(saved));
      writeJoin(event, saved.joinId, mode, alias, showAlias).finally(renderJoined);
    });
  }
  if (root && root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
  }
  return { AGE_GROUPS, PAGE_VERSION, normalizeEvent, eventIsReady, countJoins, publicAliases, publicEventsFromPayload, myActivities, buildVisitUrl, buildEventUrl, humanDate, createEventId, publicEventState, PUBLIC_EVENTS, LEGACY_EVENTS };
});
