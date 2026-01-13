/**
 * 核心模块单元测试
 * 测试 EventBus, DataManager, OverlayManager 等核心功能
 */

describe('Core Modules', () => {
  // EventBus 测试
  describe('EventBus', () => {
    let eventBus;

    beforeEach(() => {
      eventBus = EventBus.getInstance();
      eventBus.clear();
    });

    test('should be a singleton', () => {
      const instance1 = EventBus.getInstance();
      const instance2 = EventBus.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should emit and receive events', () => {
      const callback = jest.fn();
      eventBus.on('test-event', callback);
      
      eventBus.emit('test-event', { message: 'hello' });
      
      expect(callback).toHaveBeenCalledWith({ message: 'hello' });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should support multiple listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.on('test-event', callback1);
      eventBus.on('test-event', callback2);
      
      eventBus.emit('test-event', { data: 'test' });
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('should unsubscribe events', () => {
      const callback = jest.fn();
      eventBus.on('test-event', callback);
      
      eventBus.off('test-event', callback);
      eventBus.emit('test-event', {});
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should support once()', () => {
      const callback = jest.fn();
      eventBus.once('test-event', callback);
      
      eventBus.emit('test-event', {});
      eventBus.emit('test-event', {});
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should handle async events', async () => {
      const callback = jest.fn().mockResolvedValue('result');
      eventBus.on('async-event', callback);
      
      const results = await eventBus.emitAsync('async-event', { data: 'test' });
      
      expect(callback).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('fulfilled');
    });
  });

  // OverlayManager 测试
  describe('OverlayManager', () => {
    let overlayManager;
    const userId = 'test-user-123';

    beforeEach(() => {
      overlayManager = new OverlayManager();
      localStorage.clear();
    });

    test('should create overlay', async () => {
      await overlayManager.set('test-key', { data: 'test' }, userId);
      
      const value = await overlayManager.get('test-key', userId);
      expect(value).toEqual({ data: 'test' });
    });

    test('should return null for non-existent overlay', async () => {
      const value = await overlayManager.get('non-existent', userId);
      expect(value).toBeNull();
    });

    test('should delete overlay', async () => {
      await overlayManager.set('test-key', { data: 'test' }, userId);
      
      const deleted = await overlayManager.delete('test-key', userId);
      expect(deleted).toBe(true);
      
      const value = await overlayManager.get('test-key', userId);
      expect(value).toBeNull();
    });

    test('should approve overlay', async () => {
      await overlayManager.set('test-key', { data: 'test' }, userId);
      
      const item = await overlayManager.approve('test-key', userId);
      
      expect(item.status).toBe('approved');
      expect(item.approvedAt).toBeDefined();
    });

    test('should reject overlay', async () => {
      await overlayManager.set('test-key', { data: 'test' }, userId);
      
      const item = await overlayManager.reject('test-key', userId, 'Invalid data');
      
      expect(item.status).toBe('rejected');
      expect(item.rejectReason).toBe('Invalid data');
    });

    test('should list user overlays', async () => {
      await overlayManager.set('key1', { data: '1' }, userId);
      await overlayManager.set('key2', { data: '2' }, userId);
      
      const overlays = await overlayManager.listByUser(userId);
      
      expect(overlays).toHaveLength(2);
    });

    test('should filter overlays by status', async () => {
      await overlayManager.set('key1', { data: '1' }, userId);
      await overlayManager.set('key2', { data: '2' }, userId);
      await overlayManager.approve('key1', userId);
      
      const pending = await overlayManager.listByUser(userId, { status: 'pending' });
      const approved = await overlayManager.listByUser(userId, { status: 'approved' });
      
      expect(pending).toHaveLength(1);
      expect(approved).toHaveLength(1);
    });

    test('should persist to localStorage', async () => {
      await overlayManager.set('test-key', { data: 'test' }, userId);
      
      const stored = localStorage.getItem(`museumcheck_overlay_${userId}`);
      expect(stored).toBeDefined();
      
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(1);
    });
  });

  // LocalStorageAdapter 测试
  describe('LocalStorageAdapter', () => {
    let adapter;

    beforeEach(() => {
      adapter = new LocalStorageAdapter({ prefix: 'test_' });
      localStorage.clear();
    });

    test('should get and set data', async () => {
      await adapter.set('key1', { data: 'value1' });
      
      const value = await adapter.get('key1');
      expect(value).toEqual({ data: 'value1' });
    });

    test('should return null for non-existent key', async () => {
      const value = await adapter.get('non-existent');
      expect(value).toBeNull();
    });

    test('should delete data', async () => {
      await adapter.set('key1', { data: 'value1' });
      await adapter.delete('key1');
      
      const value = await adapter.get('key1');
      expect(value).toBeNull();
    });

    test('should handle string values', async () => {
      await adapter.set('key1', 'string-value');
      
      const value = await adapter.get('key1');
      expect(value).toBe('string-value');
    });

    test('should use prefix', async () => {
      await adapter.set('key1', { data: 'value1' });
      
      const rawValue = localStorage.getItem('test_key1');
      expect(rawValue).toBeDefined();
    });

    test('should query with pattern', async () => {
      await adapter.set('user-1', { name: 'User 1' });
      await adapter.set('user-2', { name: 'User 2' });
      await adapter.set('museum-1', { name: 'Museum 1' });
      
      const results = await adapter.query({ pattern: 'user-' });
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    test('should get storage info', async () => {
      await adapter.set('key1', { data: 'value1' });
      await adapter.set('key2', { data: 'value2' });
      
      const info = await adapter.getStorageInfo();
      
      expect(info.itemCount).toBeGreaterThanOrEqual(2);
      expect(info.totalSize).toBeGreaterThan(0);
    });
  });

  // DataManager 测试
  describe('DataManager', () => {
    let dataManager;
    const userId = 'test-user-123';

    beforeEach(() => {
      localStorage.clear();
      
      // 创建模拟适配器
      const mockLocalStorage = new LocalStorageAdapter({ prefix: 'test_' });
      
      dataManager = new DataManager({
        userId,
        localStorage: { enabled: true, prefix: 'test_' }
      });
    });

    test('should initialize as singleton', () => {
      const instance1 = DataManager.getInstance();
      const instance2 = DataManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    test('should get and set data', async () => {
      await dataManager.set('test-key', { data: 'value' });
      
      const value = await dataManager.get('test-key');
      expect(value).toEqual({ data: 'value' });
    });

    test('should use overlay for user data', async () => {
      await dataManager.set('test-key', { data: 'user-value' }, { 
        userId, 
        useOverlay: true 
      });
      
      const value = await dataManager.get('test-key', { userId });
      expect(value).toEqual({ data: 'user-value' });
    });

    test('should support localStorage convenience methods', async () => {
      await dataManager.setLocal('settings', { theme: 'dark' });
      
      const settings = await dataManager.getLocal('settings');
      expect(settings).toEqual({ theme: 'dark' });
    });

    test('should delete data', async () => {
      await dataManager.set('test-key', { data: 'value' });
      await dataManager.delete('test-key');
      
      const value = await dataManager.get('test-key');
      expect(value).toBeNull();
    });

    test('should batch get data', async () => {
      await dataManager.set('key1', { data: 'value1' });
      await dataManager.set('key2', { data: 'value2' });
      
      const results = await dataManager.batchGet(['key1', 'key2']);
      
      expect(results.size).toBe(2);
      expect(results.get('key1')).toEqual({ data: 'value1' });
      expect(results.get('key2')).toEqual({ data: 'value2' });
    });

    test('should get adapter health', async () => {
      const health = await dataManager.getAdaptersHealth();
      
      expect(Array.isArray(health)).toBe(true);
      expect(health.length).toBeGreaterThan(0);
    });

    test('should get stats', async () => {
      const stats = await dataManager.getStats();
      
      expect(stats.adapters).toBeDefined();
      expect(stats.overlay).toBeDefined();
    });
  });
});
