/**
 * Poster Reward Test
 * 测试发布海报获得100积分奖励的功能
 */

// Mock dependencies
global.EventBus = class EventBus {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
};

// Import PetRewardManager
const PetRewardManager = require('../../shared-features/pet-reward-system/pet-reward-manager.js');

describe('Poster Reward System', () => {
  let eventBus;
  let petRewardManager;
  
  beforeEach(() => {
    eventBus = new EventBus();
    petRewardManager = new PetRewardManager({ eventBus });
  });
  
  test('should reward 100 points for poster publishing', () => {
    const posterData = {
      posterId: 'poster-123',
      title: '我的博物馆海报',
      userId: 'user-456',
      timestamp: Date.now()
    };
    
    const reward = petRewardManager.rewardForPoster(posterData);
    
    expect(reward.type).toBe('poster');
    expect(reward.points).toBe(100);
    expect(reward.posterId).toBe('poster-123');
    expect(reward.title).toBe('我的博物馆海报');
    expect(reward.userId).toBe('user-456');
  });
  
  test('should emit pet:xp:added event when poster is published', () => {
    const posterData = {
      posterId: 'poster-789',
      title: '测试海报',
      userId: 'user-123'
    };
    
    let emittedReward = null;
    eventBus.on('pet:xp:added', (reward) => {
      emittedReward = reward;
    });
    
    petRewardManager.rewardForPoster(posterData);
    
    expect(emittedReward).not.toBeNull();
    expect(emittedReward.type).toBe('poster');
    expect(emittedReward.points).toBe(100);
  });
  
  test('should listen to poster:published events', () => {
    const posterEvent = {
      title: '我的博物馆之旅',
      imageUrl: 'https://example.com/poster.jpg',
      userId: 'user-789',
      timestamp: Date.now()
    };
    
    let rewardCalled = false;
    const originalRewardForPoster = petRewardManager.rewardForPoster;
    petRewardManager.rewardForPoster = (data) => {
      rewardCalled = true;
      expect(data.title).toBe(posterEvent.title);
      expect(data.userId).toBe(posterEvent.userId);
      return originalRewardForPoster.call(petRewardManager, data);
    };
    
    eventBus.emit('poster:published', posterEvent);
    
    expect(rewardCalled).toBe(true);
  });
  
  test('should record poster reward in history', () => {
    const posterData = {
      posterId: 'poster-456',
      title: '历史博物馆海报',
      userId: 'user-111'
    };
    
    petRewardManager.rewardForPoster(posterData);
    const recentRewards = petRewardManager.getRecentRewards();
    
    const posterReward = recentRewards.find(r => r.type === 'poster');
    expect(posterReward).toBeDefined();
    expect(posterReward.points).toBe(100);
    expect(posterReward.title).toBe('历史博物馆海报');
  });
  
  test('should allow custom points for poster rewards', () => {
    const posterData = {
      posterId: 'special-poster',
      title: '特别海报',
      userId: 'user-999',
      points: 150
    };
    
    const reward = petRewardManager.rewardForPoster(posterData);
    
    expect(reward.points).toBe(150);
  });
});
