(function(root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuseumCheckFamilyPhotos = api;
})(typeof window !== 'undefined' ? window : null, function(root) {
  'use strict';

  const EVENT_KEY = 'museumcheck-together-photo-shares';
  const REVIEW_KEY = 'museumcheck-family-photo-review';
  const EVENT_TTL = 14 * 24 * 60 * 60;
  const REVIEW_TTL = 365 * 24 * 60 * 60;
  const EVENT_PATTERN = /^[a-z0-9][a-z0-9-]{2,39}$/;
  function contributionStore() { return root && root.MuseumCheckContributions; }

  function text(value, max) { return String(value || '').trim().replace(/[<>]/g, '').slice(0, max); }
  function safeImageUrl(value) {
    try { const url = new URL(String(value || '')); return url.protocol === 'https:' ? url.toString() : ''; } catch (_) { return ''; }
  }
  function normalizeContribution(value) {
    const input = value || {};
    const eventId = String(input.eventId || '').toLowerCase();
    return {
      id: text(input.id, 120), eventId: EVENT_PATTERN.test(eventId) ? eventId : '', museumId:text(input.museumId, 80),
      taskIndex:Number.isInteger(input.taskIndex) && input.taskIndex >= 0 ? input.taskIndex : 0,
      taskTitle:text(input.taskTitle, 100), imageUrl:safeImageUrl(input.imageUrl), publishedAt:Number(input.publishedAt) || 0,
      reviewStatus:['pending', 'approved', 'rejected'].includes(input.reviewStatus) ? input.reviewStatus : 'pending'
    };
  }
  function parse(payload) {
    let list = payload && payload.value;
    if (typeof list === 'string') { try { list = JSON.parse(list); } catch (_) { list = []; } }
    return Array.isArray(list) ? list.map(item => {
      try { return normalizeContribution(typeof item.value === 'string' ? JSON.parse(item.value) : item.value); } catch (_) { return null; }
    }).filter(item => item && item.id && item.imageUrl) : [];
  }
  function endpoint() { return root && root.API_ENDPOINTS && root.API_ENDPOINTS.KV_STORE; }
  function fetchRecords(key) {
    if (!root || !root.fetch || !endpoint()) return Promise.resolve([]);
    return root.fetch(`${endpoint()}?key=${encodeURIComponent(key)}&sortKey=*`, { cache:'no-store' })
      .then(response => response.ok ? response.json() : null).then(parse).catch(() => []);
  }
  function writeRecord(key, record, ttl) {
    if (!root || !root.fetch || !endpoint()) return Promise.reject(new Error('分享服务暂时不可用'));
    const now = Date.now();
    return root.fetch(endpoint(), { method:'POST', headers:{'Content-Type':'application/json'}, keepalive:true,
      body:JSON.stringify({ key, sortKey:record.id, value:JSON.stringify(record), expireAt:Math.floor(now / 1000) + ttl })
    }).then(response => { if (!response.ok) throw new Error(`分享服务暂时不可用（${response.status}）`); return record; });
  }
  function dataUrlToFile(dataUrl) {
    return root.fetch(dataUrl).then(response => response.blob()).then(blob => new File([blob], `museumcheck-family-${Date.now()}.jpg`, { type:blob.type || 'image/jpeg' }));
  }
  async function publish(options) {
    const value = options || {};
    if (!value.shareWithEvent && !value.submitForReview) return [];
    if (!safeImageUrl(value.imageUrl) && !value.imageDataUrl) throw new Error('请先选择一张照片');
    const eventId = EVENT_PATTERN.test(String(value.eventId || '').toLowerCase()) ? String(value.eventId).toLowerCase() : '';
    if (value.shareWithEvent && !eventId) throw new Error('这张照片只能分享给已加入的同行活动');
    let imageUrl = safeImageUrl(value.imageUrl);
    if (!imageUrl) {
      if (!root || typeof root.ImageUploader !== 'function') throw new Error('图片上传暂时不可用');
      const file = await dataUrlToFile(value.imageDataUrl);
      imageUrl = await new root.ImageUploader({ targetWidth:1200, targetHeight:1200, quality:.82 }).uploadImage(file);
    }
    const base = normalizeContribution({ id:`family-photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, eventId, museumId:value.museumId,
      taskIndex:value.taskIndex, taskTitle:value.taskTitle, imageUrl, publishedAt:Date.now(), reviewStatus:'pending' });
    // New contributions use the cross-page contract. Keep the legacy keys only as a
    // read fallback, so existing event photos remain visible during this migration.
    const records = contributionStore();
    if (records) {
      const record = records.create({ id:base.id, kind:'task_photo', museum:{ id:base.museumId }, target:{ taskIndex:base.taskIndex, taskTitle:base.taskTitle },
        content:{ imageUrl:base.imageUrl }, provenance:{ source:'task_photo', capturedAt:base.publishedAt },
        consent:{ eventScope:value.shareWithEvent ? 'event' : 'private', publicScope:value.submitForReview ? 'review' : 'none', eventId }, review:{ status:'pending' } });
      return Promise.all([records.write(record)]);
    }
    const writes = [];
    if (value.shareWithEvent) writes.push(writeRecord(EVENT_KEY, base, EVENT_TTL));
    if (value.submitForReview) writes.push(writeRecord(REVIEW_KEY, base, REVIEW_TTL));
    return Promise.all(writes);
  }
  function eventPhotos(eventId) {
    const records = contributionStore();
    const canonical = records ? records.list({ eventId }).then(items => items.filter(item => item.consent.eventScope === 'event').map(item => normalizeContribution({ id:item.id, eventId:item.consent.eventId, museumId:item.museum.id, taskIndex:item.target.taskIndex, taskTitle:item.target.taskTitle, imageUrl:item.content.imageUrl, publishedAt:item.createdAt, reviewStatus:item.review.status }))) : Promise.resolve([]);
    return Promise.all([canonical, fetchRecords(EVENT_KEY)]).then(([modern, legacy]) => modern.length ? modern : legacy.filter(item => item.eventId === eventId).sort((a,b) => b.publishedAt - a.publishedAt));
  }
  function approvedTaskPhotos(museumId, taskIndex) {
    const records = contributionStore();
    const canonical = records ? records.list({ museumId, taskIndex, reviewStatus:'approved' }).then(items => items.map(item => normalizeContribution({ id:item.id, museumId:item.museum.id, taskIndex:item.target.taskIndex, taskTitle:item.target.taskTitle, imageUrl:item.content.imageUrl, publishedAt:item.createdAt, reviewStatus:item.review.status }))) : Promise.resolve([]);
    return Promise.all([canonical, fetchRecords(REVIEW_KEY)]).then(([modern, legacy]) => modern.length ? modern : legacy.filter(item => item.reviewStatus === 'approved' && item.museumId === museumId && item.taskIndex === taskIndex).sort((a,b) => b.publishedAt - a.publishedAt));
  }
  function createImageCard(photo, label) {
    const figure = root.document.createElement('figure'); figure.className = 'family-discovery-card';
    const image = root.document.createElement('img'); image.src = photo.imageUrl; image.alt = label || '家庭参观记录'; image.loading = 'lazy';
    const caption = root.document.createElement('figcaption'); caption.textContent = label || '家庭参观记录';
    figure.append(image, caption); return figure;
  }
  function renderEventPhotos(container, eventId) {
    if (!container || !eventId) return Promise.resolve([]);
    return eventPhotos(eventId).then(photos => { container.replaceChildren(...photos.slice(0, 6).map(photo => createImageCard(photo, photo.taskTitle || '本场发现'))); return photos; });
  }
  function renderApprovedTaskPhotos(container, museumId, taskIndex) {
    if (!container) return Promise.resolve([]);
    return approvedTaskPhotos(museumId, taskIndex).then(photos => { container.replaceChildren(...photos.slice(0, 6).map(photo => createImageCard(photo, '家庭发现（已审核）'))); return photos; });
  }
  return { EVENT_KEY, REVIEW_KEY, normalizeContribution, parse, publish, eventPhotos, approvedTaskPhotos, renderEventPhotos, renderApprovedTaskPhotos };
});
