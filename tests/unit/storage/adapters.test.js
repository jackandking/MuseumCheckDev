/**
 * 存储适配器单元测试
 * 测试各个存储适配器的功能
 */

describe('Storage Adapters', () => {
  // 测试基类
  describe('StorageAdapter Base Class', () => {
    test('should throw error for unimplemented methods', async () => {
      const adapter = new StorageAdapter({ name: 'test' });
      
      await expect(adapter.get('key')).rejects.toThrow();
      await expect(adapter.set('key', 'value')).rejects.toThrow();
      await expect(adapter.delete('key')).rejects.toThrow();
      await expect(adapter.query({})).rejects.toThrow();
    });

    test('should provide getInfo()', () => {
      const adapter = new StorageAdapter({ 
        name: 'test', 
        priority: 1,
        writable: true 
      });
      
      const info = adapter.getInfo();
      
      expect(info.name).toBe('test');
      expect(info.priority).toBe(1);
      expect(info.writable).toBe(true);
    });
  });

  // KVAdapter 测试（需要模拟 fetch）
  describe('KVAdapter', () => {
    let adapter;
    let originalFetch;

    beforeEach(() => {
      adapter = new KVAdapter({ endpoint: 'https://test.com/kv' });
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    test('should construct query URL correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ value: JSON.stringify({ data: 'test' }) })
      });
      
      await adapter.get('test-key', { sortKey: 'test-sort' });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.com/kv?key=test-key&sortKey=test-sort',
        expect.any(Object)
      );
    });

    test('should return null for 404', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      
      const result = await adapter.get('test-key');
      expect(result).toBeNull();
    });

    test('should handle timeout', async () => {
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 10000))
      );
      
      const result = await adapter.get('test-key', { timeout: 100 });
      expect(result).toBeNull();
    });

    test('should set data with POST', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });
      
      const success = await adapter.set('test-key', { data: 'value' });
      
      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.com/kv',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  // SQLAdapter 测试
  describe('SQLAdapter', () => {
    let adapter;
    let originalFetch;

    beforeEach(() => {
      adapter = new SQLAdapter({ endpoint: 'https://test.com/mysql' });
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    test('should build query correctly', () => {
      const { sql, params } = adapter._buildQuery({
        where: { id: 1, status: 'active' },
        orderBy: 'created_at DESC',
        limit: 10
      }, 'users');
      
      expect(sql).toContain('SELECT * FROM users');
      expect(sql).toContain('WHERE');
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(sql).toContain('LIMIT 10');
      expect(params).toEqual([1, 'active']);
    });

    test('should query with parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 1, name: 'Test' }]
      });
      
      const results = await adapter.query({
        where: { status: 'active' }
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test');
    });
  });

  // FileAdapter 测试
  describe('FileAdapter', () => {
    let adapter;
    let originalFetch;

    beforeEach(() => {
      adapter = new FileAdapter({ baseUrl: 'https://cdn.test.com' });
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    test('should construct file URL correctly', () => {
      const url = adapter.getFileUrl('museum-123', { 
        path: 'museums', 
        version: 'v1.0.0' 
      });
      
      expect(url).toBe('https://cdn.test.com/museums/museum-123.json?v=v1.0.0');
    });

    test('should fetch file from CDN', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ id: 'museum-123', name: 'Test Museum' })
      });
      
      const data = await adapter.get('museum-123');
      
      expect(data.id).toBe('museum-123');
      expect(data.name).toBe('Test Museum');
    });

    test('should be read-only', async () => {
      await expect(adapter.set('key', 'value')).rejects.toThrow('read-only');
      await expect(adapter.delete('key')).rejects.toThrow('read-only');
    });

    test('should batch get files', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: 'test' })
      });
      
      const results = await adapter.batchGet(['file1', 'file2', 'file3']);
      
      expect(results.size).toBe(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
