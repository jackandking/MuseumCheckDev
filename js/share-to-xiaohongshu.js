/*
 * share-to-xiaohongshu.js  (classic script, 全局函数，无 ES module 依赖)
 * 合规「半自动」分享到小红书：
 *   - 移动端优先 navigator.share 带图片文件（系统分享面板选「小红书」图片自动带入）
 *   - 桌面/不支持时兜底：下载图片 + 复制预填文案，引导用户去小红书 App 粘贴发布
 * 不接入任何小红书登录态 / 逆向接口，零封号风险。
 * 依赖：仅浏览器原生 API。
 */
(function (global) {
  'use strict';

  // 把标题/正文/话题拼成小红书友好文案
  function buildCaption(opts) {
    opts = opts || {};
    var title = opts.title || '';
    var body = opts.body || '';
    var tags = opts.tags || [];
    var tagStr = (tags || [])
      .map(function (t) { return '#' + String(t).replace(/^#/, ''); })
      .join(' ');
    return [title, body, tagStr].filter(Boolean).join('\n\n').trim();
  }

  // 复制到剪贴板（兼容非安全上下文 / iOS 旧内核）
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; })
        .catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  // 触发图片下载
  function downloadImage(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'poster.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /*
   * 主入口
   * @param {Object} o { imageBlob, fileName, title, body, tags }
   * @returns {Promise<{method:'system-share'|'download'|'cancel', caption:string, copied:boolean}>}
   */
  function shareToXiaohongshu(o) {
    o = o || {};
    var caption = buildCaption(o);
    var file = null;
    if (o.imageBlob && o.fileName) {
      file = new File([o.imageBlob], o.fileName, { type: o.imageBlob.type || 'image/png' });
    }
    // 1) 优先系统分享面板（移动端选「小红书」即可，图片自动带入笔记编辑页）
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], title: o.title || '', text: caption })
        .then(function () { return { method: 'system-share', caption: caption, copied: false }; })
        .catch(function (e) {
          if (e && e.name === 'AbortError') return { method: 'cancel', caption: caption, copied: false };
          // 其它错误走兜底
          return doFallback(o, caption);
        });
    }
    // 2) 兜底：下载图片 + 复制文案
    return doFallback(o, caption);
  }

  function doFallback(o, caption) {
    if (o.imageBlob) downloadImage(o.imageBlob, o.fileName || 'poster.png');
    return copyText(caption).then(function (copied) {
      return { method: 'download', caption: caption, copied: copied };
    });
  }

  // 轻量 toast（避免原生 alert，自包含样式）
  function showToast(msg, type) {
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:48px', 'transform:translateX(-50%)',
      'max-width:86%', 'padding:12px 18px', 'border-radius:12px',
      'font-size:15px', 'line-height:1.5', 'font-weight:600', 'z-index:99999',
      'box-shadow:0 8px 24px rgba(0,0,0,.18)', 'text-align:center',
      'background:' + (type === 'ok' ? '#1a9e57' : type === 'warn' ? '#c8841e' : '#2e2117'),
      'color:#fff', 'opacity:0', 'transition:opacity .25s ease'
    ].join(';');
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = '1'; });
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3200);
  }

  // 给成就海报生成小红书预填文案（按博物馆名个性化）
  function buildXhsAchievementCaption(opts) {
    opts = opts || {};
    var name = opts.museumName || '博物馆';
    return {
      title: '带娃打卡' + name + '完成探索任务🏛｜这份成就海报太有纪念意义了',
      body:
        '周末带娃去了' + name + '，用 museumcheck 做了 5 个观察任务' +
        '（门口打卡 + 3 件镇馆之宝 + 亲子合影），边看边拍边写，' +
        '娃第一次主动问"这件为什么是国之重器"🤯\n' +
        '离馆还自动出了这张成就海报，必须发出来纪念一下～\n' +
        '亲子遛娃 / 博物馆启蒙的姐妹冲，网站 museumcheck.cn',
      tags: ['亲子游', '博物馆打卡', '带娃看展', '博物馆启蒙', '周末去哪儿', '博物馆攻略', '遛娃好去处', 'museumcheck']
    };
  }

  // 暴露全局（classic script）
  global.buildCaption = buildCaption;
  global.shareToXiaohongshu = shareToXiaohongshu;
  global.buildXhsAchievementCaption = buildXhsAchievementCaption;
  global.xhsToast = showToast;
})(typeof window !== 'undefined' ? window : this);
