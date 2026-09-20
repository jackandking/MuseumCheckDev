/**
 * Museum Live Room page (js/museum-live.js)
 *
 * 博物馆「同游现场」页面：一个博物馆一个房间。
 * 房间里只有两类内容——打卡广播（系统生成）和预设语句（家长选取）。
 * 所有数据读写都经 js/live-room-service.js，本文件只负责渲染与交互。
 *
 * ?museum=<id>  进入某座馆的现场
 * ?demo=1       渲染一组本机示例数据（不上传），用于设计评审
 */
(function () {
  'use strict';

  const POLL_MS = 20000;
  const LAST_MUSEUM_KEY = 'museumcheckLiveLastMuseum';
  const AGE_GROUP_KEY = 'ageGroup';
  const DEFAULT_AGE_GROUP = '7-12';
  const SNAPSHOT_KEY = 'museumChecklists';
  const MINUTE = 60 * 1000;

  const state = {
    museumId: '',
    museum: null,
    itemNames: [],
    done: 0,
    records: [],
    selection: null,
    bound: false,
    rendered: false,
    renderedCount: 0,
    timer: null
  };

  function byId(id) { return document.getElementById(id); }

  function Live() { return window.MuseumCheckLive; }

  function isDemo() { return new URLSearchParams(location.search).get('demo') === '1'; }

  function museums() {
    const list = Array.isArray(window.MUSEUMS_META) ? window.MUSEUMS_META : [];
    return list.filter(item => item && item.id && item.name);
  }

  function findMuseum(id) {
    return museums().find(item => item.id === id) || null;
  }

  function sanitizeMuseumId(value) {
    const clean = String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    return clean && findMuseum(clean) ? clean : '';
  }

  function readStorage(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }

  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) {}
  }

  /** 本机已完成的任务数（打卡页与首页共用 museumChecklists）。 */
  function localDone(museumId) {
    let ageGroup = readStorage(AGE_GROUP_KEY);
    try {
      const saved = JSON.parse(readStorage(SNAPSHOT_KEY) || '{}');
      const list = saved[`${museumId}-child-${ageGroup || DEFAULT_AGE_GROUP}`];
      if (Array.isArray(list)) return list.length;
    } catch (_) {}
    return 0;
  }

  function loadItemNames(museumId) {
    try {
      if (typeof MuseumDataLoader === 'undefined') return Promise.resolve([]);
      if (!window.museumDataLoader) window.museumDataLoader = new MuseumDataLoader();
      // 馆藏名单基本不变，用缓存读，避免每次进房间都打一次 KV。
      return window.museumDataLoader.loadMuseum(museumId, true)
        .then(museum => (museum && Array.isArray(museum.collections) ? museum.collections : [])
          .map(item => item && item.name)
          .filter(Boolean)
          .slice(0, 12))
        .catch(() => []);
    } catch (_) {
      return Promise.resolve([]);
    }
  }

  function setStatus(text) {
    const node = byId('feedStatus');
    if (node) node.textContent = text;
  }

  function setHint(text) {
    const node = byId('composerHint');
    if (node) node.textContent = text || '';
  }

  function showPicker() {
    const section = byId('picker');
    const room = byId('room');
    const select = byId('museumSelect');
    const enter = byId('enterRoom');
    if (!section || !select || !enter) return;
    section.hidden = false;
    if (room) room.hidden = true;
    const options = museums().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    options.forEach(museum => {
      const option = document.createElement('option');
      option.value = museum.id;
      option.textContent = museum.location ? `${museum.name}｜${museum.location}` : museum.name;
      select.appendChild(option);
    });
    const last = sanitizeMuseumId(readStorage(LAST_MUSEUM_KEY));
    if (last) select.value = last;
    const sync = () => {
      const chosen = sanitizeMuseumId(select.value);
      if (chosen) {
        enter.href = `museum-live.html?museum=${encodeURIComponent(chosen)}`;
        enter.setAttribute('aria-disabled', 'false');
      } else {
        enter.href = '#';
        enter.setAttribute('aria-disabled', 'true');
      }
    };
    select.addEventListener('change', sync);
    sync();
  }

  function enterRoom(museumId) {
    const museum = findMuseum(museumId);
    if (!museum) return showPicker();
    state.museumId = museumId;
    state.museum = museum;
    writeStorage(LAST_MUSEUM_KEY, museumId);
    byId('picker').hidden = true;
    byId('room').hidden = false;
    byId('roomTitle').textContent = museum.name;
    byId('roomEyebrow').textContent = museum.location ? `同游现场 · ${museum.location}` : '同游现场';
    const aliasInput = byId('aliasInput');
    if (aliasInput) aliasInput.value = Live().getAlias();
    document.title = `${museum.name} 同游现场｜MuseumCheck`;
    state.done = isDemo() ? 3 : localDone(museumId);
    renderCatalog();
    bindOnce();
    startPolling();
    refresh();
    loadItemNames(museumId).then(names => {
      if (state.museumId !== museumId) return;
      state.itemNames = names;
      renderCatalog();
      refresh();
    });
  }

  function bindOnce() {
    if (state.bound) return;
    state.bound = true;
    byId('sendButton').addEventListener('click', send);
    byId('refreshButton').addEventListener('click', refresh);
    byId('aliasSave').addEventListener('click', () => {
      const alias = Live().setAlias(byId('aliasInput').value);
      byId('aliasInput').value = alias;
      setHint(`代号已改为「${alias}」，只影响你还未发出的内容。`);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
  }

  function startPolling() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);
  }

  function refresh() {
    if (!state.museumId) return;
    setStatus('正在读取现场…');
    Live().readRoom(state.museumId).then(result => {
      if (!result.ok) {
        setStatus('这次没读到，20 秒后自动重试。');
        return;
      }
      let records = result.records.slice();
      if (isDemo()) records = demoRecords().concat(records);
      state.records = records;
      const trustable = Live().trustableRecords(records, { itemNames: state.itemNames });
      const summary = Live().summarize(trustable, Date.now());
      byId('statActive').textContent = String(summary.active);
      byId('statToday').textContent = String(summary.today);
      renderFeed();
      if (isDemo()) setStatus('正在显示本机示例数据（不会上传到服务器）。');
      else if (trustable.length) setStatus(`共 ${trustable.length} 条现场记录 · 不断更新`);
      else setStatus('');
    });
  }

  function isNearBottom() {
    const feed = byId('feed');
    if (!feed) return true;
    const rect = feed.getBoundingClientRect();
    return rect.bottom - window.innerHeight < 160;
  }

  function renderFeed() {
    const feed = byId('feed');
    const items = Live().buildFeed(state.records, {
      myVisitorId: Live().getVisitorId(),
      itemNames: state.itemNames
    });
    // 只在「用户在底部 + 这次真的多了新内容」时跟随到底部。
    // 首次进入不自动滚动，否则会错过最上面的在场人数。
    const stick = state.rendered && isNearBottom() && items.length > state.renderedCount;
    feed.replaceChildren.apply(feed, items.map(feedNode));
    byId('feedEmpty').hidden = items.length > 0;
    state.rendered = true;
    state.renderedCount = items.length;
    if (stick) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function feedNode(item) {
    const row = document.createElement('div');
    if (item.kind === 'broadcast') {
      row.className = 'feed-item feed-item--broadcast';
      const dot = document.createElement('span');
      dot.className = 'feed-dot';
      const body = document.createElement('div');
      body.className = 'feed-body';
      const text = document.createElement('p');
      text.className = 'feed-text';
      text.textContent = item.text;
      const time = document.createElement('span');
      time.className = 'feed-time';
      time.textContent = item.time;
      body.appendChild(text);
      body.appendChild(time);
      row.appendChild(dot);
      row.appendChild(body);
      return row;
    }
    row.className = `feed-item${item.mine ? ' feed-item--mine' : ''}`;
    const avatar = document.createElement('div');
    avatar.className = 'feed-avatar';
    avatar.textContent = item.mine ? '你' : item.who.slice(0, 1);
    const body = document.createElement('div');
    body.className = 'feed-body';
    const who = document.createElement('p');
    who.className = 'feed-who';
    who.textContent = item.who;
    const text = document.createElement('p');
    text.className = 'feed-text';
    text.textContent = item.text;
    const time = document.createElement('span');
    time.className = 'feed-time';
    time.textContent = item.time;
    body.appendChild(who);
    body.appendChild(text);
    body.appendChild(time);
    row.appendChild(avatar);
    row.appendChild(body);
    return row;
  }

  function renderCatalog() {
    const container = byId('phraseGroups');
    if (!container) return;
    const groups = Live().phraseCatalog({ itemNames: state.itemNames, done: state.done });
    container.replaceChildren.apply(container, groups.map(group => {
      const row = document.createElement('div');
      row.className = 'phrase-group';
      const label = document.createElement('span');
      label.className = 'phrase-group__label';
      label.textContent = group.label;
      row.appendChild(label);
      group.phrases.forEach(phrase => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'phrase-chip';
        chip.dataset.phraseId = phrase.id;
        chip.setAttribute('aria-pressed', 'false');
        chip.textContent = previewFor(phrase);
        chip.addEventListener('click', () => onPhraseClick(phrase));
        row.appendChild(chip);
      });
      return row;
    }));
  }

  function previewFor(phrase) {
    if (phrase.slot === 'item') return phrase.text.replace('{item}', '某件展品');
    if (phrase.slot === 'progress') return phrase.text.replace('{done}', String(state.done));
    return phrase.text;
  }

  function onPhraseClick(phrase) {
    if (phrase.slot === 'item') {
      openSlotPicker(phrase);
      return;
    }
    if (phrase.slot === 'progress') {
      select(phrase.id, { done: state.done });
      return;
    }
    select(phrase.id, null);
  }

  function openSlotPicker(phrase) {
    const picker = byId('slotPicker');
    const options = byId('slotOptions');
    byId('slotPickerLabel').textContent = '我们刚看的是哪一件？';
    options.replaceChildren.apply(options, state.itemNames.map((name, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot-option';
      button.textContent = name;
      button.addEventListener('click', () => {
        picker.hidden = true;
        select(phrase.id, { itemIndex: index });
      });
      return button;
    }));
    picker.hidden = false;
  }

  function select(phraseId, slots) {
    state.selection = { phraseId, slots };
    const text = Live().renderMessage({ kind: 'message', phraseId, slots }, { itemNames: state.itemNames });
    const preview = byId('composerPreview');
    preview.textContent = text || '先选一句';
    preview.classList.toggle('composer-preview--ready', Boolean(text));
    byId('sendButton').disabled = !text;
    document.querySelectorAll('.phrase-chip').forEach(chip => {
      chip.setAttribute('aria-pressed', chip.dataset.phraseId === phraseId ? 'true' : 'false');
    });
    setHint('');
  }

  function clearSelection() {
    state.selection = null;
    byId('slotPicker').hidden = true;
    const preview = byId('composerPreview');
    preview.textContent = '先选一句';
    preview.classList.remove('composer-preview--ready');
    byId('sendButton').disabled = true;
    document.querySelectorAll('.phrase-chip').forEach(chip => chip.setAttribute('aria-pressed', 'false'));
  }

  function send() {
    if (!state.selection) return;
    const guard = Live().canSend();
    if (!guard.ok) {
      setHint(guard.reason);
      return;
    }
    const { phraseId, slots } = state.selection;
    const button = byId('sendButton');
    button.disabled = true;
    button.textContent = '发出中…';
    Live().postMessage(state.museumId, phraseId, slots).then(ok => {
      button.textContent = '发出';
      if (!ok) {
        button.disabled = false;
        setHint('这条没发出去，检查网络后再试一次。');
        return;
      }
      Live().recordSend();
      clearSelection();
      setHint('已发到本馆现场。');
      refresh();
    });
  }

  /** 设计评审用的示例数据：只在 ?demo=1 时拼接到渲染结果前面，不写入服务器。 */
  function demoRecords() {
    const now = Date.now();
    const names = state.itemNames;
    const records = [
      { kind: 'broadcast', event: 'arrive', visitorId: 'demo-0', alias: '小满家', timestamp: now - 5 * 60 * MINUTE },
      { kind: 'broadcast', event: 'all_done', total: 7, visitorId: 'demo-0', alias: '小满家', timestamp: now - 4.5 * 60 * MINUTE },
      { kind: 'broadcast', event: 'arrive', visitorId: 'demo-1', alias: '团团家', timestamp: now - 52 * MINUTE },
      { kind: 'message', phraseId: 'greet-arrive', visitorId: 'demo-1', alias: '团团家', timestamp: now - 50 * MINUTE },
      { kind: 'broadcast', event: 'progress', done: 2, total: 7, visitorId: 'demo-1', alias: '团团家', timestamp: now - 38 * MINUTE },
      { kind: 'message', phraseId: 'route-queue', visitorId: 'demo-1', alias: '团团家', timestamp: now - 36 * MINUTE },
      { kind: 'broadcast', event: 'arrive', visitorId: 'demo-2', alias: '小小探险队', timestamp: now - 26 * MINUTE },
      { kind: 'message', phraseId: 'exhibit-worth', visitorId: 'demo-2', alias: '小小探险队', timestamp: now - 21 * MINUTE },
      { kind: 'broadcast', event: 'all_done', total: 7, visitorId: 'demo-3', alias: '豆豆家', timestamp: now - 14 * MINUTE },
      { kind: 'message', phraseId: 'ach-nice', visitorId: 'demo-2', alias: '小小探险队', timestamp: now - 11 * MINUTE },
      { kind: 'message', phraseId: 'greet-crowd', visitorId: 'demo-3', alias: '豆豆家', timestamp: now - 6 * MINUTE }
    ];
    if (names.length) {
      records.splice(5, 0, { kind: 'message', phraseId: 'exhibit-looked', slots: { itemIndex: 0 }, visitorId: 'demo-1', alias: '团团家', timestamp: now - 24 * MINUTE });
      if (names.length > 1) {
        records.push({ kind: 'message', phraseId: 'exhibit-looked', slots: { itemIndex: 1 }, visitorId: 'demo-3', alias: '豆豆家', timestamp: now - 3 * MINUTE });
      }
    }
    return records;
  }

  function init() {
    if (!window.MuseumCheckLive || !byId('app')) return;
    const requested = new URLSearchParams(location.search).get('museum');
    const museumId = sanitizeMuseumId(requested);
    if (museumId) enterRoom(museumId);
    else showPicker();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
