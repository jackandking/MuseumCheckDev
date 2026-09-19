/**
 * MuseumCheck — 馆图/镇馆之宝图片纠错 · 提交侧 (M1)
 *
 * 用户在任务详情弹窗里发现图片不对（博物馆门口/封面图 或 镇馆之宝图片），
 * 可点击图片下方的「图片不对？反馈」按钮举报并上传一张更好的替代照。
 * 提交进入待审 KV 队列 museumcheck-photo-candidates（status: 'pending'），
 * 需管理员审核通过（M2/M3）后写回 museum-data-<id>（image 或 collections[i].imageUrl）上线。
 *
 * 设计约束（来自 docs/guides/museum-photo-correction-design.md）：
 *  - 候选照**必须上传**（走 /image/upload），不接受用户粘贴 URL。
 *  - 存上传返回的 URL，不存 base64。
 *  - 提交侧 KV 写入无鉴权（反正待审）；"发布写回"在 M2/M3 走后端 KV_ADMIN_KEY。
 *
 * 交互约定（2026-09-19 用户反馈）：
 *  - 按钮不再全局悬浮，而是内联在任务弹窗图片正下方。
 *  - 反馈目标跟随当前展示的图片：馆图（门口打卡任务）或镇馆之宝图片。
 *  - 弹窗内没有图片时不显示按钮（此时已有「上传照片」贡献入口引导用户补图）。
 *
 * 本模块完全自包含，不依赖 museum-checkin.js 的内部作用域，避免与 WIP 改动冲突。
 */
(function () {
  'use strict';

  var KV_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
  var CANDIDATES_KEY = 'museumcheck-photo-candidates';
  var TIMESTAMP_2124 = 4866674732; // 远未来时间戳（与 museum-checkin.js 保持一致）
  var NS = 'mcPhotoCorrection';

  var currentTarget = null;   // { type: 'museum' | 'collection', name?, imageUrl }
  var submittedKeys = {};     // 本会话内已提交过的目标 → 显示"已反馈"防重复

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

  function targetKey(t) {
    if (!t) return '';
    return t.type + '|' + (t.name || '') + '|' + (t.imageUrl || '');
  }

  // 在任务弹窗 #modalImage 下方确保存在反馈按钮（惰性注入，一次即可）
  function ensureButton() {
    var wrap = document.getElementById(NS + '-btn-wrap');
    if (wrap) return wrap.querySelector('button');

    var modalImage = document.getElementById('modalImage');
    if (!modalImage || !modalImage.parentNode) return null;

    wrap = document.createElement('div');
    wrap.id = NS + '-btn-wrap';
    wrap.style.cssText = 'text-align:center;margin:6px 0 2px;';

    var btn = document.createElement('button');
    btn.id = NS + '-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', '反馈图片问题');
    btn.style.cssText = [
      'display:inline-flex', 'align-items:center', 'gap:4px',
      'padding:5px 12px', 'border:1px solid #e2e8f0', 'border-radius:999px',
      'background:#fff', 'color:#718096', 'font-size:12px', 'font-weight:500',
      'cursor:pointer'
    ].join(';');
    btn.addEventListener('click', function () { openModal(getMuseumId(), btn); });
    wrap.appendChild(btn);
    modalImage.insertAdjacentElement('afterend', wrap);
    return btn;
  }

  /**
   * 由 museum-checkin.js 在每次打开任务弹窗时调用。
   * target = { type:'museum', imageUrl } — 当前展示的是馆图（门口打卡任务）
   *        | { type:'collection', name, imageUrl } — 当前展示的是镇馆之宝图片
   *        | null — 当前没有可反馈的官方图片，隐藏按钮（已有上传贡献入口）
   */
  function setTarget(target) {
    currentTarget = (target && target.imageUrl) ? target : null;
    var btn = ensureButton();
    var wrap = document.getElementById(NS + '-btn-wrap');
    if (!btn || !wrap) return;

    if (!currentTarget) {
      wrap.style.display = 'none';
      return;
    }

    var key = targetKey(currentTarget);
    var alreadySubmitted = !!submittedKeys[key];
    btn.textContent = alreadySubmitted ? '✓ 已反馈，感谢' : (currentTarget.type === 'museum' ? '📷 馆图不对？反馈' : '📷 图片不对？反馈');
    btn.disabled = alreadySubmitted;
    btn.style.opacity = alreadySubmitted ? '0.6' : '1';
    wrap.style.display = '';
  }

  function openModal(museumId, btn) {
    if (document.getElementById(NS + '-modal')) return;
    if (!currentTarget) return;
    var isCollection = currentTarget.type === 'collection';
    var subjectLine = isCollection
      ? '发现「' + (currentTarget.name || '这件镇馆之宝') + '」的图片不对？'
      : '发现这张馆图（博物馆门口/封面照）不对？';

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
      '<h3 style="margin:0 0 4px;font-size:17px;">' + (isCollection ? '反馈镇馆之宝图片问题' : '反馈馆图问题') + '</h3>' +
      '<p style="margin:0 0 14px;font-size:13px;color:#666;">' + subjectLine + '上传一张更好的照片，审核通过后会更新。必须上传照片，不支持外链。</p>' +
      '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">图片哪里不对？</label>' +
      '<textarea id="' + NS + '-reason" rows="3" placeholder="例如：这不是正门 / 不是这件文物 / 图片过旧 / 模糊不清" ' +
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
      if (!reason) { statusEl.style.color = '#c53030'; statusEl.textContent = '请填写图片哪里不对'; return; }
      if (!file) { statusEl.style.color = '#c53030'; statusEl.textContent = '请上传一张替代照片'; return; }
      submitEl.disabled = true; submitEl.textContent = '上传中…'; statusEl.style.color = '#666'; statusEl.textContent = '正在上传照片…';

      if (typeof window.imageUploader === 'undefined' || !window.imageUploader.uploadImage) {
        statusEl.style.color = '#c53030'; statusEl.textContent = '图片上传暂不可用，请稍后重试';
        submitEl.disabled = false; submitEl.textContent = '提交'; return;
      }

      window.imageUploader.uploadImage(file, { compress: true })
        .then(function (candidateImageUrl) {
          statusEl.textContent = '已上传，提交审核中…';
          var candidate = {
            id: uuid(),
            museumId: museumId,
            submitterId: getSubmitterId(),
            submittedAt: new Date().toISOString(),
            // 反馈目标：museum=馆封面图（写回 image）；collection=镇馆之宝图片（写回 collections 中同名条目）
            target: currentTarget.type,
            collectionName: isCollection ? (currentTarget.name || '') : '',
            // 用户举报时刻看到的图片 URL 快照，供审核追溯/回滚
            originalImageUrl: currentTarget.imageUrl || '',
            candidateImageUrl: candidateImageUrl,
            source: 'upload',
            reason: reason,
            status: 'pending'
          };
          kvPut(CANDIDATES_KEY, museumId + ':' + candidate.id, candidate);
          submittedKeys[targetKey(currentTarget)] = true;
          statusEl.style.color = '#2f855a';
          statusEl.textContent = '✓ 已提交，审核通过后会更新，感谢反馈！';
          submitEl.textContent = '已提交';
          if (btn) { btn.textContent = '✓ 已反馈，感谢'; btn.disabled = true; btn.style.opacity = '0.6'; }
          setTimeout(close, 1800);
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
    // 无需页面加载即注入：按钮在首次 setTarget 时惰性注入到任务弹窗内。
    // 保留 museumId 校验语义：无馆 ID 的页面 setTarget 不会被调用（museum-checkin.js 只在有馆时打开弹窗）。
  }

  init();

  // 暴露给 museum-checkin.js / e2e / 调试
  if (typeof window !== 'undefined') {
    window.MuseumPhotoCorrection = {
      getMuseumId: getMuseumId,
      setTarget: setTarget,
      CANDIDATES_KEY: CANDIDATES_KEY
    };
  }
})();
