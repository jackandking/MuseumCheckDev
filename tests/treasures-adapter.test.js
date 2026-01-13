const TreasuresAdapter = require('../core/adapters/treasures-adapter.js');

describe('TreasuresAdapter', () => {
  test('loads full museum details and extracts treasures', async () => {
    const mockLoader = {
      async loadAllMuseums() {
        return [
          { id: 'm1', name: '博物馆A', location: '北京' },
          { id: 'm2', name: '博物馆B', location: '上海' }
        ];
      },
      async loadMuseum(id) {
        if (id === 'm1') {
          return {
            id: 'm1', name: '博物馆A', location: '北京', description: '测试A', image: '',
            collections: [{ name: '藏品1', imageUrl: 'http://example.com/1.jpg', description: '描述' }],
            checklists: {
              parent: { '3-6': ['观察镇馆之宝'], '7-12': ['了解镇馆之宝历史'], '13-18': [] },
              child: { '3-6': [], '7-12': ['寻找镇馆之宝介绍'], '13-18': ['研究镇馆之宝'] }
            }
          };
        }
        if (id === 'm2') {
          return {
            id: 'm2', name: '博物馆B', location: '上海', description: '测试B', image: '',
            collections: [],
            checklists: {
              parent: { '3-6': [], '7-12': [], '13-18': [] },
              child: { '3-6': [], '7-12': [], '13-18': [] }
            }
          };
        }
        return null;
      }
    };

    const adapter = new TreasuresAdapter(mockLoader);
    const data = await adapter.init();

    // Should include museum with collections or treasure mentions
    expect(data.length).toBe(1);
    expect(data[0].id).toBe('m1');

    // Verify treasure extraction across age groups
    expect(data[0].treasures.simple.length).toBeGreaterThanOrEqual(1);
    expect(data[0].treasures.detailed.length).toBeGreaterThanOrEqual(1);
    // '研究镇馆之宝' should be captured in academic
    expect(data[0].treasures.academic.length).toBeGreaterThanOrEqual(1);

    const stats = adapter.getStats();
    expect(stats.totalMuseums).toBe(1);
    expect(stats.totalItems).toBeGreaterThan(0);
  });

  test('search and filter work with undefined fields', async () => {
    const mockLoader = {
      async loadAllMuseums() { return [{ id: 'm3', name: 'Test', location: '其他' }]; },
      async loadMuseum() { return { id: 'm3', name: 'Test', location: '其他' }; }
    };
    const adapter = new TreasuresAdapter(mockLoader);
    await adapter.init();

    // Should not crash on missing description/treasures
    const results = adapter.search('anything');
    expect(Array.isArray(results)).toBe(true);

    const filtered = adapter.filterByRegion('其他');
    expect(Array.isArray(filtered)).toBe(true);
  });
});
