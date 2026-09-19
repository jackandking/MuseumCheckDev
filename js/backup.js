/**
 * MuseumCheck 存档码（Backup & Migration）
 * -------------------------------------------------------
 * 阶段 0：纯前端数据备份 / 跨设备迁移，零后端、零合规成本。
 * 解决两个正在流血的痛点：
 *   1) 换机 / 清缓存丢失全部打卡记录、宠物、烟花、成就；
 *   2) 付费权益（微信支付订单）当前挂在客户端自造的 user_id 上，
 *      换设备即丢——导出 user_id 可在新设备认领同一身份。
 *
 * 安全：导出时排除敏感 / 噪声 key（API key、调试开关等），
 * 存档码不上传任何服务器，仅在本机 localStorage 间搬运。
 */
(function (global) {
    'use strict';

    // 这些 key 不应进入可分享的存档码
    var DENYLIST = ['deepseekApiKey', 'letmetry_api_key', 'test_key1', 'mc_debug'];

    function isAllowedKey(key) {
        return DENYLIST.indexOf(key) === -1;
    }

    function utf8ToBase64(str) {
        if (typeof btoa === 'function') {
            return btoa(unescape(encodeURIComponent(str)));
        }
        // Node fallback (for tests)
        return Buffer.from(str, 'utf-8').toString('base64');
    }

    function base64ToUtf8(b64) {
        if (typeof atob === 'function') {
            return decodeURIComponent(escape(atob(b64)));
        }
        // Node fallback (for tests)
        return Buffer.from(b64, 'base64').toString('utf-8');
    }

    // 收集所有允许导出的 key/value
    function collectData() {
        var data = {};
        var total = 0;
        try {
            total = localStorage.length;
        } catch (e) {
            return data;
        }
        for (var i = 0; i < total; i++) {
            var key = null;
            try {
                key = localStorage.key(i);
            } catch (e) {
                continue;
            }
            if (!key || !isAllowedKey(key)) {
                continue;
            }
            try {
                data[key] = localStorage.getItem(key);
            } catch (e) {
                /* 忽略不可读项 */
            }
        }
        return data;
    }

    /**
     * 导出存档码（UTF-8 安全 base64 封装）。
     * @returns {string} 存档码
     */
    function exportSaveCode() {
        var payload = {
            v: 1,
            app: 'museumcheck',
            exportedAt: new Date().toISOString(),
            data: collectData()
        };
        return utf8ToBase64(JSON.stringify(payload));
    }

    /**
     * 导入存档码。
     * @param {string} code
     * @returns {{ok:boolean, imported:number, skipped:number, error:?string, exportedAt:?string}}
     */
    function importSaveCode(code) {
        var result = { ok: false, imported: 0, skipped: 0, error: null, exportedAt: null };

        if (!code || typeof code !== 'string') {
            result.error = '存档码为空';
            return result;
        }

        // 容错：允许 URL-safe base64（- _）与标准 base64（+ /）
        var trimmed = code.trim().replace(/-/g, '+').replace(/_/g, '/');

        var json;
        try {
            json = base64ToUtf8(trimmed);
        } catch (e) {
            result.error = '存档码无法解析（不是有效的备份码）';
            return result;
        }

        var payload;
        try {
            payload = JSON.parse(json);
        } catch (e) {
            result.error = '存档码内容损坏';
            return result;
        }

        if (!payload || typeof payload !== 'object' ||
            !payload.data || typeof payload.data !== 'object') {
            result.error = '存档码格式不正确';
            return result;
        }

        var imported = 0;
        var skipped = 0;
        Object.keys(payload.data).forEach(function (key) {
            if (!isAllowedKey(key)) {
                skipped++;
                return;
            }
            try {
                localStorage.setItem(key, payload.data[key]);
                imported++;
            } catch (e) {
                skipped++;
            }
        });

        result.ok = true;
        result.imported = imported;
        result.skipped = skipped;
        result.exportedAt = payload.exportedAt || null;
        return result;
    }

    var Backup = {
        DENYLIST: DENYLIST,
        isAllowedKey: isAllowedKey,
        collectData: collectData,
        exportSaveCode: exportSaveCode,
        importSaveCode: importSaveCode,
        utf8ToBase64: utf8ToBase64,
        base64ToUtf8: base64ToUtf8
    };

    // ---- 页面 UI 绑定（仅浏览器环境；Node 单测中 document 不存在，跳过）----
    function setStatus(msg, type) {
        var el = document.getElementById('backupStatus');
        if (!el) {
            return;
        }
        el.textContent = msg || '';
        // 用内联颜色，不依赖各页面各自的 CSS 类，保证首页/打卡页表现一致
        if (type === 'error') {
            el.style.color = '#dc3545';
        } else if (type === 'success') {
            el.style.color = '#28a745';
        } else {
            el.style.color = '';
        }
    }

    function initUI() {
        var exportBtn = document.getElementById('backupExportBtn');
        var copyBtn = document.getElementById('backupCopyBtn');
        var importBtn = document.getElementById('backupImportBtn');
        var codeArea = document.getElementById('backupCode');
        if (!exportBtn || !copyBtn || !importBtn || !codeArea) {
            return;
        }

        exportBtn.addEventListener('click', function () {
            var code = exportSaveCode();
            codeArea.value = code;
            copyBtn.disabled = false;
            importBtn.disabled = false;
            var count = Object.keys(collectData()).length;
            setStatus('已生成存档码，包含 ' + count + ' 项本地数据。建议立即复制保存。', 'success');
        });

        copyBtn.addEventListener('click', function () {
            var code = codeArea.value;
            if (!code) {
                return;
            }
            var fallback = function () {
                codeArea.focus();
                codeArea.select();
                try {
                    document.execCommand('copy');
                    setStatus('已复制到剪贴板。', 'success');
                } catch (e) {
                    setStatus('复制失败，请手动长按选中文本复制。', 'error');
                }
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(function () {
                    setStatus('已复制到剪贴板。', 'success');
                }, fallback);
            } else {
                fallback();
            }
        });

        importBtn.addEventListener('click', function () {
            var code = codeArea.value.trim();
            if (!code) {
                setStatus('请先粘贴存档码。', 'error');
                return;
            }
            if (!window.confirm('导入会覆盖当前设备上的同名数据（不影响未包含在存档码里的数据）。确定继续？')) {
                return;
            }
            var res = importSaveCode(code);
            if (!res.ok) {
                setStatus('导入失败：' + res.error, 'error');
                return;
            }
            var when = res.exportedAt ? '（导出于 ' + res.exportedAt + '）' : '';
            setStatus('导入成功：恢复 ' + res.imported + ' 项' +
                (res.skipped ? '，跳过 ' + res.skipped + ' 项' : '') +
                '。建议刷新页面查看最新数据。' + when, 'success');
        });
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initUI);
        } else {
            initUI();
        }
    }

    global.MuseumCheckBackup = Backup;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Backup;
    }
})(typeof window !== 'undefined' ? window : this);
