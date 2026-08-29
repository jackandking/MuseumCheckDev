(function(root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuseumCheckContributions = api;
})(typeof window !== 'undefined' ? window : null, function(root) {
  'use strict';

  // One deliberately narrow record contract for family-supplied museum material.
  // It never stores a family alias, contact detail, or child identifier.
  const KEY = 'museumcheck-contribution-records';
  const REVIEW_TTL = 365 * 24 * 60 * 60;
  const EVENT_TTL = 14 * 24 * 60 * 60;
  const EVENT_PATTERN = /^[a-z0-9][a-z0-9-]{2,39}$/;
  const KINDS = ['museum', 'entrance_photo', 'treasure_candidate', 'task_photo'];
  const REVIEW_STATES = ['pending', 'approved', 'rejected'];
  const VISIBILITIES = ['private', 'event', 'review_queue', 'public'];

  function text(value, max) { return String(value || '').trim().replace(/[<>]/g, '').slice(0, max); }
  function safeImageUrl(value) {
    try { const url = new URL(String(value || '')); return url.protocol === 'https:' ? url.toString() : ''; } catch (_) { return ''; }
  }
  function validEventId(value) {
    const eventId = String(value || '').toLowerCase();
    return EVENT_PATTERN.test(eventId) ? eventId : '';
  }
  function normalize(value) {
    const input = value || {};
    const kind = KINDS.includes(input.kind) ? input.kind : 'task_photo';
    const reviewStatus = REVIEW_STATES.includes(input.review && input.review.status) ? input.review.status
      : (REVIEW_STATES.includes(input.reviewStatus) ? input.reviewStatus : 'pending');
    const consent = input.consent || {};
    const eventId = validEventId(input.eventId || consent.eventId);
    const eventScope = consent.eventScope === 'event' && eventId ? 'event' : 'private';
    const publicScope = consent.publicScope === 'review' ? 'review' : 'none';
    // Public is a reviewer-controlled state, never something a family submission can
    // request while it is still pending.
    const requestedVisibility = VISIBILITIES.includes(input.visibility) ? input.visibility : '';
    const visibility = reviewStatus === 'approved' && requestedVisibility === 'public' ? 'public'
      : (publicScope === 'review' ? 'review_queue' : (eventScope === 'event' ? 'event' : 'private'));
    return {
      schemaVersion: 1,
      id: text(input.id, 120),
      kind,
      museum: { id:text(input.museum && input.museum.id || input.museumId, 80), name:text(input.museum && input.museum.name || input.museumName, 120), city:text(input.museum && input.museum.city || input.city, 80) },
      target: { taskIndex:Number.isInteger(input.target && input.target.taskIndex) ? input.target.taskIndex : (Number.isInteger(input.taskIndex) ? input.taskIndex : null), taskTitle:text(input.target && input.target.taskTitle || input.taskTitle, 120), treasureName:text(input.target && input.target.treasureName || input.treasureName, 120) },
      content: { imageUrl:safeImageUrl(input.content && input.content.imageUrl || input.imageUrl), text:text(input.content && input.content.text || input.text, 500) },
      provenance: { source:text(input.provenance && input.provenance.source || input.source, 50), capturedAt:Number(input.provenance && input.provenance.capturedAt || input.capturedAt || input.publishedAt) || 0 },
      consent: { eventScope, publicScope, eventId, revocable:true },
      review: { status:reviewStatus, updatedAt:Number(input.review && input.review.updatedAt) || 0 },
      visibility,
      createdAt:Number(input.createdAt || input.publishedAt) || 0
    };
  }
  function parse(payload) {
    let list = payload && payload.value;
    if (typeof list === 'string') { try { list = JSON.parse(list); } catch (_) { list = []; } }
    return Array.isArray(list) ? list.map(item => {
      try { return normalize(typeof item.value === 'string' ? JSON.parse(item.value) : item.value); } catch (_) { return null; }
    }).filter(item => item && item.id) : [];
  }
  function endpoint() { return root && root.API_ENDPOINTS && root.API_ENDPOINTS.KV_STORE; }
  function fetchRecords() {
    if (!root || !root.fetch || !endpoint()) return Promise.resolve([]);
    return root.fetch(`${endpoint()}?key=${encodeURIComponent(KEY)}&sortKey=*`, { cache:'no-store' })
      .then(response => response.ok ? response.json() : null).then(parse).catch(() => []);
  }
  function write(record) {
    if (!root || !root.fetch || !endpoint()) return Promise.reject(new Error('贡献服务暂时不可用'));
    const normalized = normalize(record);
    if (!normalized.id) return Promise.reject(new Error('贡献记录缺少标识'));
    const ttl = normalized.visibility === 'event' && normalized.consent.publicScope === 'none' ? EVENT_TTL : REVIEW_TTL;
    return root.fetch(endpoint(), { method:'POST', headers:{'Content-Type':'application/json'}, keepalive:true,
      body:JSON.stringify({ key:KEY, sortKey:normalized.id, value:JSON.stringify(normalized), expireAt:Math.floor(Date.now() / 1000) + ttl })
    }).then(response => { if (!response.ok) throw new Error(`贡献服务暂时不可用（${response.status}）`); return normalized; });
  }
  function create(input) {
    const now = Date.now();
    return normalize({ ...input, id:input && input.id || `contrib-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt:now,
      provenance:{ source:(input && input.provenance && input.provenance.source) || 'family_visit', capturedAt:now, ...(input && input.provenance || {}) } });
  }
  function list(filters) {
    const query = filters || {};
    return fetchRecords().then(items => items.filter(item => {
      if (query.eventId && item.consent.eventId !== query.eventId) return false;
      if (query.museumId && item.museum.id !== query.museumId) return false;
      if (Number.isInteger(query.taskIndex) && item.target.taskIndex !== query.taskIndex) return false;
      if (query.reviewStatus && item.review.status !== query.reviewStatus) return false;
      if (query.visibility && item.visibility !== query.visibility) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt));
  }
  return { KEY, normalize, parse, create, write, list, safeImageUrl };
});
