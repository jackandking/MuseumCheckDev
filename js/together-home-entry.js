(function(root) {
  'use strict';
  function render() {
    const entry = root && root.document && root.document.getElementById('togetherHomeEntry');
    const together = root && root.MuseumCheckTogether;
    if (!entry || !together) return;
    const event = (together.PUBLIC_EVENTS || []).find(item => together.publicEventState(item, Date.now()) === 'recruiting');
    if (!event) return;
    const museum = (root.MUSEUMS_META || []).find(item => item && item.id === event.museumId);
    if (!museum) return;
    const link = root.document.createElement('a');
    link.className = 'together-home-entry'; link.href = together.buildEventUrl(event);
    const label = together.humanDate(event.date, event.time);
    const age = together.AGE_GROUPS[event.ageGroup] || '亲子同行';
    link.innerHTML = `<span><span class="together-home-entry__eyebrow">本周同行探索</span><strong class="together-home-entry__title">${museum.name}</strong><span class="together-home-entry__detail">${label} · ${age}</span></span><span class="together-home-entry__cta">查看活动 →</span>`;
    entry.replaceChildren(link); entry.hidden = false;
  }
  if (root && root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', render, { once:true }); else render();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { render };
})(typeof window !== 'undefined' ? window : null);
