/**
 * MuseumAttribution - 图片版权署名块渲染助手
 *
 * 用途：在藏品图 / 馆照下方渲染轻量署名块（CC BY / CC BY-SA 等许可的法定署名义务）。
 * 数据来源：museums-meta.js / KV museum-data-<id> 中的
 *   藏品级: attribution / sourceUrl / license / sourceType
 *   馆照级: imageAttribution / imageSourceUrl / imageLicense / imageSourceType
 *
 * 规则：
 *  - 无任何署名信息时返回空字符串（不渲染，例如用户自己贡献的照片）。
 *  - sourceType 为 unsplash / pexels 时自动加「示意图 · 非官方建筑照」前缀。
 */
(function () {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 生成署名块 HTML。
     * @param {Object} item - 含 attribution/sourceUrl 或 imageAttribution/imageSourceUrl 的数据对象
     * @param {Object} [opts] - { prefix: '自定义前缀' }
     * @returns {string} HTML 字符串（无署名信息时为 ''）
     */
    function html(item, opts) {
        if (!item) return '';
        opts = opts || {};
        const attribution = item.attribution || item.imageAttribution || '';
        const sourceUrl = item.sourceUrl || item.imageSourceUrl || '';
        if (!attribution && !sourceUrl) return '';

        const parts = [];
        const prefix = opts.prefix ||
            (item.sourceType === 'unsplash' || item.sourceType === 'pexels' ? '示意图 · 非官方建筑照' : '');
        if (prefix) parts.push(esc(prefix));
        if (attribution) parts.push(esc(attribution));
        let inner = parts.join(' · ');
        if (sourceUrl) {
            inner += ' <a href="' + esc(sourceUrl) + '" target="_blank" rel="noopener noreferrer" ' +
                'class="img-attribution-link">来源</a>';
        }
        return '<div class="img-attribution">' + inner + '</div>';
    }

    window.MuseumAttribution = { html: html, esc: esc };
})();
