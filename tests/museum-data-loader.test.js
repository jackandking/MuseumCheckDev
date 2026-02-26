const { MuseumDataLoader } = require('../js/museum-data-loader.js');

global.fetch = jest.fn();

const localStorageMock = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

global.localStorage = localStorageMock;

const sampleMuseums = [
  {
    id: 'forbidden-city',
    name: '故宫博物院',
    location: '北京',
    description: '世界上现存规模最大、保存最为完整的木质结构古建筑群。',
    tags: ['历史', '建筑', '文化'],
    collections: [
      {
        name: '翠玉白菜',
        imageUrl: 'https://example.com/jadeite-cabbage.jpg',
        description: '清代玉器，以翠玉雕成白菜形状。'
      }
    ],
    checklists: {
      parent: {
        '3-6': ['数一数有多少个宫灯'],
        '7-12': ['记录紫禁城的主要门楼'],
        '13-18': ['调研明清两朝宫廷制度差异']
      },
      child: {
        '3-6': ['找出最多的金色装饰'],
        '7-12': ['识别不同朝代的服饰'],
        '13-18': ['比较古今博物馆展陈方式差异']
      }
    }
  },
  {
    id: 'national-museum',
    name: '中国国家博物馆',
    location: '北京',
    description: '展示中国历史文化精髓的综合性国家博物馆。',
    tags: ['历史', '艺术', '文化'],
    collections: [
      {
        name: '司母戊鼎',
        imageUrl: 'https://example.com/simu-wu-tripod.jpg',
        description: '商代青铜器之王，国家级藏品。'
      }
    ],
    checklists: {
      parent: {
        '3-6': ['观察青铜器的纹饰'],
        '7-12': ['记录展厅中各时期的服饰变化'],
        '13-18': ['追踪博物馆文物修复的流程']
      },
      child: {
        '3-6': ['认识其中一件陶器'],
        '7-12': ['描述一个王朝的代表文物'],
        '13-18': ['讨论文物保护与现代技术结合的方式']
      }
    }
  }
];

global.MUSEUMS = sampleMuseums;
window.MUSEUMS = sampleMuseums;

describe('MuseumDataLoader', () => {
  let loader;

  beforeEach(() => {
    localStorageMock.clear();
    global.fetch.mockClear();
    loader = new MuseumDataLoader();
  });

  describe('loadFromKVStore', () => {
    test('loads museum data when KV store responds with JSON', async () => {
      const payload = { id: 'forbidden-city', name: '故宫博物院' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: JSON.stringify(payload) })
      });

      const museum = await loader.loadFromKVStore('forbidden-city');

      expect(museum).toEqual(payload);
      expect(fetch).toHaveBeenCalledTimes(1);
      const url = fetch.mock.calls[0][0];
      expect(url).toContain('key=museum-data-forbidden-city');
      expect(url).toContain('sortKey=museum');
    });

    test('returns null when KV store returns non-OK response', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await loader.loadFromKVStore('missing');
      expect(result).toBeNull();
    });

    test('returns null when KV value is not JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: 'not-json' })
      });

      const result = await loader.loadFromKVStore('forbidden-city');
      expect(result).toBeNull();
    });
  });

  describe('loadMuseum', () => {
    test('caches successful KV loads', async () => {
      const payload = { id: 'forbidden-city', name: '故宫博物院' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: JSON.stringify(payload) })
      });

      const first = await loader.loadMuseum('forbidden-city');
      const second = await loader.loadMuseum('forbidden-city');

      expect(first).toEqual(payload);
      expect(second).toEqual(payload);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('honors cacheBypass flag', async () => {
      const payload = { id: 'forbidden-city', name: '故宫博物院' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: JSON.stringify(payload) })
      });

      await loader.loadMuseum('forbidden-city');
      await loader.loadMuseum('forbidden-city', false);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('returns null when KV fails', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      const result = await loader.loadMuseum('unknown');
      expect(result).toBeNull();
    });
  });

  describe('KV store helpers', () => {
    test('saveToKVStore sends POST payload', async () => {
      const payload = { id: 'test', name: '测试' };
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

      const success = await loader.saveToKVStore('test', payload);

      expect(success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    test('deleteFromKVStore handles success', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      expect(await loader.deleteFromKVStore('test')).toBe(true);
    });

    test('saveToKVStore handles failures', async () => {
      global.fetch.mockRejectedValueOnce(new Error('network down'));
      expect(await loader.saveToKVStore('test', {})).toBe(false);
    });
  });

  describe('loadAllMuseums', () => {
    test('returns current MUSEUMS array', async () => {
      const museums = await loader.loadAllMuseums();
      expect(museums).toHaveLength(sampleMuseums.length);
    });

    test('returns empty array when fallback data missing', async () => {
      const original = global.MUSEUMS;
      delete global.MUSEUMS;
      delete window.MUSEUMS;

      const museums = await loader.loadAllMuseums();

      expect(museums).toEqual([]);

      global.MUSEUMS = original;
      window.MUSEUMS = original;
    });
  });

  describe('getMuseumImageUrl', () => {
    beforeEach(() => {
      // Ensure image URL cache keys are clean before each test
      window.localStorage.removeItem('museum-image-url-forbidden-city');
      window.localStorage.removeItem('museum-image-url-missing-museum');
    });

    test('fetches image URL from KV Store and caches result', async () => {
      const payload = { id: 'forbidden-city', name: '故宫博物院', image: 'https://example.com/kv-image.jpg' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: JSON.stringify(payload) })
      });

      const url = await loader.getMuseumImageUrl('forbidden-city');
      expect(url).toBe('https://example.com/kv-image.jpg');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should use cached URL without fetching again
      const url2 = await loader.getMuseumImageUrl('forbidden-city');
      expect(url2).toBe('https://example.com/kv-image.jpg');
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    test('returns cached image URL without fetching KV Store again', async () => {
      const payload = { id: 'forbidden-city', name: '故宫博物院', image: 'https://example.com/cached.jpg' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ value: JSON.stringify(payload) })
      });

      // First call caches the URL
      await loader.getMuseumImageUrl('forbidden-city');
      global.fetch.mockClear();

      // Second call should use localStorage cache, no new fetch
      const url = await loader.getMuseumImageUrl('forbidden-city');
      expect(url).toBe('https://example.com/cached.jpg');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('re-fetches when cache is expired', async () => {
      const oldTimestamp = Date.now() - ((loader.cacheExpirationDays + 1) * 24 * 60 * 60 * 1000);
      window.localStorage.setItem('museum-image-url-forbidden-city', JSON.stringify({ url: 'https://old.jpg', timestamp: oldTimestamp }));
      const payload = { id: 'forbidden-city', name: '故宫博物院', image: 'https://example.com/new-image.jpg' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: JSON.stringify(payload) })
      });

      const url = await loader.getMuseumImageUrl('forbidden-city');

      expect(url).toBe('https://example.com/new-image.jpg');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('returns null when KV Store has no image field', async () => {
      const payload = { id: 'forbidden-city', name: '故宫博物院' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: JSON.stringify(payload) })
      });

      const url = await loader.getMuseumImageUrl('forbidden-city');

      expect(url).toBeNull();
    });

    test('returns null when KV Store fetch fails', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const url = await loader.getMuseumImageUrl('missing-museum');

      expect(url).toBeNull();
    });
  });
});
