const EventBus = require('../../core/event-bus.js');

describe('PosterPublishingService', () => {
  let PosterPublishingService;
  let eventBus;

  beforeAll(() => {
    PosterPublishingService = require('../../shared-features/poster-publishing/poster-service.js');
    global.EventBus = EventBus;
  });

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  test('validatePoster enforces title and imageUrl', () => {
    const service = new PosterPublishingService({ eventBus });
    expect(service.validatePoster({ title: 'A', imageUrl: 'http://x' })).toBe(true);
    expect(service.validatePoster({ title: 'A' })).toBe(false);
    expect(service.validatePoster({ imageUrl: 'http://x' })).toBe(false);
    expect(service.validatePoster(null)).toBe(false);
  });

  test('publish emits poster:published on success', async () => {
    const service = new PosterPublishingService({ eventBus });
    const spy = jest.fn();
    eventBus.on('poster:published', spy);

    const result = await service.publish({ title: 'Pinghu Poster', imageUrl: 'https://img' }, { userId: 'u-1' });
    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    const evt = spy.mock.calls[0][0];
    expect(evt.title).toBe('Pinghu Poster');
    expect(evt.userId).toBe('u-1');
  });

  test('publish returns error for invalid poster', async () => {
    const service = new PosterPublishingService({ eventBus });
    const result = await service.publish({ title: 'Invalid' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_poster');
  });
});
