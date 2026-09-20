const live = require('../js/live-room-service.js');

const ITEMS = ['清明上河图', '大克鼎'];

function record(overrides) {
  return Object.assign({ visitorId: 'visitor-a', alias: '团团家', timestamp: Date.now() }, overrides);
}

describe('同游现场 · 房间数据层', () => {
  test('一座博物馆一个房间键，且不接受任意字符串', () => {
    expect(live.roomKey('forbidden-city')).toBe('museumcheck-live-forbidden-city');
    expect(live.roomKey('Shanghai-Museum!')).toBe('museumcheck-live-shanghai-museum');
    expect(live.roomKey('')).toBe('');
    expect(live.roomKey('../../etc/passwd')).toBe('museumcheck-live-etcpasswd');
  });

  test('只从目录里还原句子，未知 phraseId 一律丢弃', () => {
    expect(live.renderMessage(record({ phraseId: 'greet-arrive' }), {})).toBe('我们到了');
    expect(live.renderMessage(record({ phraseId: '注入的句子', text: '<b>x</b>' }), {})).toBeNull();
    expect(live.renderMessage(record({ phraseId: '' }), {})).toBeNull();
  });

  test('槽位只接受数字，越界或缺失就丢弃', () => {
    expect(live.renderMessage(record({ phraseId: 'exhibit-looked', slots: { itemIndex: 1 } }), { itemNames: ITEMS }))
      .toBe('我们刚看了「大克鼎」');
    expect(live.renderMessage(record({ phraseId: 'exhibit-looked', slots: { itemIndex: 77 } }), { itemNames: ITEMS }))
      .toBeNull();
    expect(live.renderMessage(record({ phraseId: 'exhibit-looked', slots: { itemIndex: '大克鼎' } }), { itemNames: ITEMS }))
      .toBeNull();
    expect(live.renderMessage(record({ phraseId: 'ach-progress', slots: { done: 3 } }), {})).toBe('我们已完成 3 项任务');
    expect(live.renderMessage(record({ phraseId: 'ach-progress', slots: { done: 0 } }), {})).toBeNull();
    expect(live.renderMessage(record({ phraseId: 'ach-progress', slots: { done: 99 } }), {})).toBeNull();
  });

  test('馆藏未加载时退化，不因为自己的网络问题隐藏别人的消息', () => {
    expect(live.renderMessage(record({ phraseId: 'exhibit-looked', slots: { itemIndex: 0 } }), { itemNames: [] }))
      .toBe('我们刚看了「一件展品」');
  });

  test('广播只认三种事件，且必须带合法数字', () => {
    expect(live.renderBroadcast(record({ event: 'arrive' }), {})).toBe('{who} 到馆了');
    expect(live.renderBroadcast(record({ event: 'progress', done: 3, total: 7 }), {})).toBe('{who} 完成了 3/7 项任务');
    expect(live.renderBroadcast(record({ event: 'all_done', total: 7 }), {})).toBe('{who} 集齐了全部 7 项任务');
    expect(live.renderBroadcast(record({ event: 'progress', done: 9, total: 2 }), {})).toBeNull();
    expect(live.renderBroadcast(record({ event: 'progress', total: 2 }), {})).toBeNull();
    expect(live.renderBroadcast(record({ event: 'all_done' }), {})).toBeNull();
    expect(live.renderBroadcast(record({ event: 'unknown' }), {})).toBeNull();
  });

  test('渲染出的条目里不出现任何外部文本', () => {
    const now = Date.now();
    const records = [
      record({ kind: 'message', phraseId: 'greet-arrive', timestamp: now - 1000 }),
      record({ kind: 'message', phraseId: 'fake', text: '<img src=x onerror=alert(1)>', timestamp: now - 900 }),
      record({ kind: 'broadcast', event: 'arrive', timestamp: now - 800 })
    ];
    const feed = live.buildFeed(records, { myVisitorId: 'visitor-b', itemNames: ITEMS, now });
    expect(feed).toHaveLength(2);
    expect(feed.map(item => item.text)).toEqual(['我们到了', '团团家 到馆了']);
  });

  test('自己的记录显示为「你们」', () => {
    const now = Date.now();
    const feed = live.buildFeed(
      [record({ kind: 'message', phraseId: 'ach-nice', visitorId: 'visitor-me', timestamp: now - 1000 })],
      { myVisitorId: 'visitor-me', now }
    );
    expect(feed[0].who).toBe('你们');
    expect(feed[0].mine).toBe(true);
  });

  test('同一个家庭连续完成多项任务只留最新一条进度', () => {
    const now = Date.now();
    const records = [];
    for (let index = 0; index < 3; index += 1) {
      records.push(record({ kind: 'broadcast', event: 'progress', done: index + 1, total: 7, timestamp: now - 30000 + index * 1000 }));
    }
    records.push(record({ kind: 'broadcast', event: 'progress', done: 1, total: 7, visitorId: 'visitor-b', alias: '豆豆家', timestamp: now - 1000 }));
    const feed = live.buildFeed(records, { now });
    expect(feed.map(item => item.text)).toEqual(['团团家 完成了 3/7 项任务', '豆豆家 完成了 1/7 项任务']);
  });

  test('在场统计只数可信记录，且使用时间窗', () => {
    const now = Date.now();
    const yesterday = now - 30 * 60 * 60 * 1000;
    const records = [
      record({ kind: 'broadcast', event: 'arrive', visitorId: 'v1', timestamp: now - 10 * 60 * 1000 }),
      record({ kind: 'broadcast', event: 'arrive', visitorId: 'v2', timestamp: now - 3 * 60 * 60 * 1000 }),
      record({ kind: 'broadcast', event: 'arrive', visitorId: 'v3', timestamp: yesterday }),
      record({ kind: 'message', phraseId: 'nope', visitorId: 'spam', timestamp: now - 60 * 1000 }),
      record({ kind: 'broadcast', event: 'progress', done: 9, total: 2, visitorId: 'spam2', timestamp: now - 60 * 1000 })
    ];
    const trustable = live.trustableRecords(records, { itemNames: ITEMS });
    expect(trustable).toHaveLength(3);
    expect(live.summarize(trustable, now)).toEqual({ today: 2, active: 1 });
  });

  test('目录随可用数据收缩：缺馆藏就不显示展品槽位句', () => {
    const full = live.phraseCatalog({ itemNames: ITEMS, done: 3 });
    expect(full.map(group => group.label)).toEqual(['招呼', '展品', '行程', '成就']);
    expect(full.find(group => group.id === 'exhibit').phrases).toHaveLength(3);
    const bare = live.phraseCatalog({});
    expect(bare.find(group => group.id === 'exhibit').phrases).toHaveLength(2);
    expect(bare.find(group => group.id === 'achievement').phrases).toHaveLength(2);
  });

  test('本地限速：20 秒冷却与每小时上限', () => {
    const now = Date.now();
    global.localStorage.setItem('museumcheckLiveSendLog', JSON.stringify([now - 5000]));
    const cooling = live.canSend(now);
    expect(cooling.ok).toBe(false);
    expect(cooling.reason).toContain('秒后可以再发');

    const many = [];
    for (let index = 0; index < live.SEND_HOURLY_CAP; index += 1) many.push(now - (index + 1) * 60 * 1000);
    global.localStorage.setItem('museumcheckLiveSendLog', JSON.stringify(many));
    const capped = live.canSend(now);
    expect(capped.ok).toBe(false);
    expect(capped.reason).toContain('够多了');

    global.localStorage.setItem('museumcheckLiveSendLog', JSON.stringify([now - 10 * 60 * 1000]));
    expect(live.canSend(now).ok).toBe(true);
  });

  test('发出后会把时间写进本地发送日志', () => {
    const now = Date.now();
    global.localStorage.setItem('museumcheckLiveSendLog', JSON.stringify([]));
    live.recordSend(now);
    expect(JSON.parse(global.localStorage.getItem('museumcheckLiveSendLog'))).toEqual([now]);
  });

  test('房间记录里不写自由文本字段', () => {
    const source = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'live-room-service.js'), 'utf8');
    const postMessage = source.slice(source.indexOf('function postMessage'), source.indexOf('function normalizeSlots'));
    expect(postMessage).not.toMatch(/text\s*:/);
  });
});
