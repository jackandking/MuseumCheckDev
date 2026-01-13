const EventBus = require('../../core/event-bus.js');

describe('AnalyticsIntegrationService', () => {
  let AnalyticsIntegrationService;
  let eventBus;

  beforeAll(() => {
    AnalyticsIntegrationService = require('../../shared-features/analytics-integration/analytics-service.js');
    global.EventBus = EventBus;
  });

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  test('trackEvent pushes into queue and emits analytics:event', () => {
    const service = new AnalyticsIntegrationService({ eventBus });
    const spy = jest.fn();
    eventBus.on('analytics:event', spy);

    const ok = service.trackEvent('checkin_open', { museumId: 'pinghu' });
    expect(ok).toBe(true);
    const q = service.getQueue();
    expect(q.length).toBe(1);
    expect(q[0].name).toBe('checkin_open');
    expect(spy).toHaveBeenCalledTimes(1);
    const evt = spy.mock.calls[0][0];
    expect(evt.name).toBe('checkin_open');
    expect(evt.payload.museumId).toBe('pinghu');
  });
});
