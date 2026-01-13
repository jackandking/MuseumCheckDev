const EventBus = require('../../core/event-bus.js');

// Minimal mock for DataManager
class MockDataManager {
  constructor() { this._userId = 'u-123'; }
  static instance = null;
  static getInstance() { if (!MockDataManager.instance) { MockDataManager.instance = new MockDataManager(); } return MockDataManager.instance; }
  setUserId(id) { this._userId = id; }
  getUserId() { return this._userId; }
  async get(key) { return null; }
  async set(key, value) { this._lastSet = { key, value }; return true; }
  async setPublic(key, value) { this._lastSetPublic = { key, value }; return true; }
}

describe('CheckinAdapter', () => {
  let CheckinAdapter;
  let eventBus;

  beforeAll(() => {
    // Expose globals as in browser
    global.EventBus = EventBus;
    global.DataManager = MockDataManager;
    CheckinAdapter = require('../../core/adapters/checkin-adapter.js');
  });

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
    MockDataManager.instance = null;
  });

  test('init sets userId and binds events', async () => {
    const adapter = new CheckinAdapter({});
    const ok = await adapter.init({ userId: 'user-A' });
    expect(ok).toBe(true);
    expect(adapter.dataManager.getUserId()).toBe('user-A');
  });

  test('save writes via DataManager and emits event', async () => {
    const adapter = new CheckinAdapter({});
    await adapter.init({ userId: 'user-B' });

    const spy = jest.fn();
    eventBus.on('checkin:data:saved', spy);

    const res = await adapter.save('checkin:pinghu', { visited: true });
    expect(res).toBe(true);
    expect(adapter.dataManager._lastSet).toEqual({ key: 'checkin:pinghu', value: { visited: true } });
    expect(spy).toHaveBeenCalledTimes(1);
    const evt = spy.mock.calls[0][0];
    expect(evt.key).toBe('checkin:pinghu');
    expect(evt.userId).toBe('user-B');
  });

  test('notifyCompleted emits checkin:completed', async () => {
    const adapter = new CheckinAdapter({});
    await adapter.init({ userId: 'user-C' });

    const spy = jest.fn();
    eventBus.on('checkin:completed', spy);

    adapter.notifyCompleted({ museumId: 'pinghu', points: 15 });

    expect(spy).toHaveBeenCalledTimes(1);
    const evt = spy.mock.calls[0][0];
    expect(evt.museumId).toBe('pinghu');
    expect(evt.userId).toBe('user-C');
    expect(typeof evt.timestamp).toBe('number');
  });

  test('promoteOverlay forwards to setPublic', async () => {
    const adapter = new CheckinAdapter({});
    await adapter.init({ userId: 'user-D' });

    const ok = await adapter.promoteOverlay('checkin:pinghu', { visited: true });
    expect(ok).toBe(true);
    expect(adapter.dataManager._lastSetPublic).toEqual({ key: 'checkin:pinghu', value: { visited: true } });
  });
});
