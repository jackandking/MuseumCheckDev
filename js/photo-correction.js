/**
 * MuseumCheck — 馆图纠错 · 提交侧 (M1)
 *
 * 用户发现某馆的封面/门口照片不对，可在此举报并上传一张更好的替代照。
 * 提交进入待审 KV 队列 museumcheck-photo-candidates（status: 'pending'），
 * 需管理员审核通过（M2/M3）后才写回 museum-data-<id>.image 上线。
 *
 * 设计约束（来自 docs/guides/museum-photo-correction-design.md）：
 *  - 候选照**必须上传**（走 /image/upload），不接受用户粘贴 URL。
 *  - 存上传返回的 URL，不存 base64。
 *  - 提交侧 KV 写入无鉴权（反正待审）；"发布写回"在 M2/M3 走后端 KV_ADMIN_KEY。
 *
 * 本模块完全自包含，不依赖 museum-checkin.js 的内部作用域，避免与 WIP 改动冲突。
 */
(function () {
  'use strict';

  var KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
  var CANDIDATES_KEY = 'museumcheck-photo-candidates';
  var TIMESTAMP_2124 = 4866674732; // 远未来时间戳（与 museum-checkin.js 保持一致）
  var NS = 'mcPhotoCorrection';

  function getMuseumId() {
    try {
      var p = new URLSearchParams(window.location.search);
      return p.get('id') || p.get('museum') || null;
    } catch (e) { return null; }
  }

  function getSubmitterId() {
    try { return localStorage.getItem('user_id') || 'anonymous'; }
    catch (e) { return 'anonymous'; }
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  // 复制自 museum-checkin.js 的 kvPut：写一条 KV（匿名，待审）。
  function kvPut(key, sortKey, valueObj) {
    var body = JSON.stringify({
      key: key,
      sortKey: sortKey,
      value: JSON.stringify(valueObj),
      expireAt: TIMESTAMP_2124
    });
    try {
      fetch(KV_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* 网络失败也不阻塞 UI */ }
  }

  // Best-effort 抓取当前线上馆图 URL，作为 originalImageUrl 快照供审核追溯。
  function fetchCurrentMuseumImage(museumId) {
    return new Promise(function (resolve) {
      var url = KV_ENDPOINT + '?key=' + encodeURIComponent('museum-data-' + museumId) + '&sortKey=*';
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 5000) : null;
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return resolve('');
          var rows = Array.isArray(data) ? data
            : (data && Array.isArray(data.value) ? data.value
              : (data && typeof data.value === 'string' ? safeParse(data.value, []) : []));
          var first = (rows || []).map(function (r) {
            var v = r && r.value !== undefined ? r.value : r;
            return (typeof v === 'string') ? safeParse(v, null) : v;
          }).filter(Boolean)[0];
          resolve((first && first.image) || '');
        })
        .catch(function () { resolve(''); })
        .then(function () { if (timer) clearTimeout(timer); });
    });
  }

  function safeParse(s, fallback) {
    try { return JSON.parse(s); } catch (e) { return fallback; }
  }

  // 注入悬浮反馈按钮
  function injectButton(museumId) {
    if (document.getElementById(NS + '-btn')) return;
    var btn = document.createElement('button');
    btn.id = NS + '-btn';
    btn.type = 'button';
    btn.textContent = '📷 反馈馆图';
    btn.setAttribute('aria-label', '反馈馆图问题');
    btn.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:16px', 'z-index:99990',
      'padding:8px 14px', 'border:none', 'border-radius:999px',
      'background:#2b6cb0', 'color:#fff', 'font-size:13px', 'font-weight:600',
      'box-shadow:0 2px 8px rgba(0,0,0,.25)', 'cursor:pointer'
    ].join(';');
    btn.addEventListener('click', function () { openModal(museumId, btn); });
    document.body.appendChild(btn);
  }

  function openModal(museumId, btn) {
    if (document.getElementById(NS + '-modal')) return;
    var backdrop = document.createElement('div');
    backdrop.id = NS + '-modal';
    backdrop.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99991', 'display:flex',
      'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,.5)', 'padding:16px'
    ].join(';');

    var card = document.createElement('div');
    card.style.cssText = [
      'background:#fff', 'border-radius:14px', 'max-width:420px', 'width:100%',
      'padding:20px', 'box-shadow:0 10px 40px rgba(0,0,0,.3)', 'font-family:system-ui,sans-serif'
    ].join(';');

    card.innerHTML =
      '<h3 style="margin:0 0 4px;font-size:17px;">反馈馆图问题</h3>' +
      '<p style="margin:0 0 14px;font-size:13px;color:#666;">发现这张馆图不对？上传一张更好的照片，审核通过后会更新。必须上传照片，不支持外链。</p>' +
      '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">馆图哪里不对？</label>' +
      '<textarea id="' + NS + '-reason" rows="3" placeholder="例如：这不是正门 / 图片过旧 / 模糊不清" ' +
      'style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:13px;resize:vertical;"></textarea>' +
      '<label style="display:block;font-size:13px;font-weight:600;margin:12px 0 6px;">上传替代照片 *</label>' +
      '<input id="' + NS + '-file" type="file" accept="image/*" style="width:100%;font-size:13px;" />' +
      '<div id="' + NS + '-preview" style="margin-top:8px;"></div>' +
      '<div id="' + NS + '-status" style="margin-top:10px;font-size:13px;min-height:18px;color:#c53030;"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;">' +
      '<button id="' + NS + '-cancel" type="button" style="padding:8px 16px;border:1px solid #ccc;background:#fff;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>' +
      '<button id="' + NS + '-submit" type="button" style="padding:8px 16px;border:none;background:#2b6cb0;color:#fff;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">提交</button>' +
      '</div>';

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    var reasonEl = backdrop.querySelector('#' + NS + '-reason');
    var fileEl = backdrop.querySelector('#' + NS + '-file');
    var previewEl = backdrop.querySelector('#' + NS + '-preview');
    var statusEl = backdrop.querySelector('#' + NS + '-status');
    var submitEl = backdrop.querySelector('#' + NS + '-submit');
    var cancelEl = backdrop.querySelector('#' + NS + '-cancel');

    fileEl.addEventListener('change', function () {
      var f = fileEl.files && fileEl.files[0];
      if (!f) { previewEl.innerHTML = ''; return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        previewEl.innerHTML = '<img src="' + e.target.result + '" style="max-width:100%;max-height:160px;border-radius:8px;" />';
      };
      reader.readAsDataURL(f);
    });

    function close() { if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); }
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
    cancelEl.addEventListener('click', close);

    submitEl.addEventListener('click', function () {
      var reason = reasonEl.value.trim();
      var file = fileEl.files && fileEl.files[0];
      if (!reason) { statusEl.style.color = '#c53030'; statusEl.textContent = '请填写馆图哪里不对'; return; }
      if (!file) { statusEl.style.color = '#c53030'; statusEl.textContent = '请上传一张替代照片'; return; }
      submitEl.disabled = true; submitEl.textContent = '上传中…'; statusEl.style.color = '#666'; statusEl.textContent = '正在上传照片…';

      if (typeof window.imageUploader === 'undefined' || !window.imageUploader.uploadImage) {
        statusEl.style.color = '#c53030'; statusEl.textContent = '图片上传暂不可用，请稍后重试';
        submitEl.disabled = false; submitEl.textContent = '提交'; return;
      }

      window.imageUploader.uploadImage(file, { compress: true })
        .then(function (candidateImageUrl) {
          statusEl.textContent = '已上传，提交审核中…';
          return fetchCurrentMuseumImage(museumId).then(function (originalImageUrl) {
            var candidate = {
              id: uuid(),
              museumId: museumId,
              submitterId: getSubmitterId(),
              submittedAt: new Date().toISOString(),
              originalImageUrl: originalImageUrl || '',
              candidateImageUrl: candidateImageUrl,
              source: 'upload',
              reason: reason,
              status: 'pending'
            };
            kvPut(CANDIDATES_KEY, museumId + ':' + candidate.id, candidate);
            statusEl.style.color = '#2f855a';
            statusEl.textContent = '✓ 已提交，审核通过后会更新馆图，感谢反馈！';
            submitEl.textContent = '已提交';
            if (btn) { btn.textContent = '✓ 已反馈'; btn.disabled = true; }
            setTimeout(close, 1800);
          });
        })
        .catch(function (err) {
          statusEl.style.color = '#c53030';
          statusEl.textContent = (err && err.message) ? err.message : '上传失败，请稍后重试';
          submitEl.disabled = false; submitEl.textContent = '提交';
        });
    });
  }

  function init() {
    if (typeof document === 'undefined') return;
    var museumId = getMuseumId();
    if (!museumId) return; // 仅在有明确馆 ID 的页面显示
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { injectButton(museumId); });
    } else {
      injectButton(museumId);
    }
  }

  init();

  // 暴露给 e2e / 调试
  if (typeof window !== 'undefined') {
    window.MuseumPhotoCorrection = { getMuseumId: getMuseumId, CANDIDATES_KEY: CANDIDATES_KEY };
  }
})();
