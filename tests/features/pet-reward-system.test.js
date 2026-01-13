const EventBus = require('../../core/event-bus.js');

describe('PetRewardManager', () => {
  let PetRewardManager;
  let eventBus;

  beforeAll(() => {
    PetRewardManager = require('../../shared-features/pet-reward-system/pet-reward-manager.js');
    global.EventBus = EventBus;
  });

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  test('rewards on checkin:completed and emits pet:xp:added', () => {
    const manager = new PetRewardManager({ eventBus });
    const spy = jest.fn();
    eventBus.on('pet:xp:added', spy);

    // Simulate checkin completed
    eventBus.emit('checkin:completed', { museumId: 'pinghu', points: 12, userId: 'u-9' });

    const rewards = manager.getRecentRewards();
    expect(rewards.length).toBe(1);
    expect(rewards[0].type).toBe('checkin');
    expect(rewards[0].museumId).toBe('pinghu');
    expect(spy).toHaveBeenCalledTimes(1);
    const evt = spy.mock.calls[0][0];
    expect(evt.points).toBe(12);
    expect(evt.userId).toBe('u-9');
  });

  test('rewards on achievement:earned', () => {
    const manager = new PetRewardManager({ eventBus });
    eventBus.emit('achievement:earned', { achievementId: 'first-visit', points: 25, userId: 'u-2' });

    const rewards = manager.getRecentRewards();
    expect(rewards.length).toBe(1); // new instance, separate history
    expect(rewards[0].type).toBe('achievement');
    expect(rewards[0].achievementId).toBe('first-visit');
    expect(rewards[0].points).toBe(25);
  });
});
