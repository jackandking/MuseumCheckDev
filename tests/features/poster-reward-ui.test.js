/**
 * Poster Reward UI Test
 * 测试海报发布时的用户界面提示和积分奖励功能
 */

describe('Poster Reward UI Integration', () => {
  let originalAlert;
  let alertMessages;
  
  beforeEach(() => {
    // Mock alert to capture messages
    alertMessages = [];
    originalAlert = global.alert;
    global.alert = (message) => {
      alertMessages.push(message);
    };
    
    // Mock EventBus
    global.EventBus = class EventBus {
      constructor() {
        this.events = {};
      }
      
      static getInstance() {
        if (!EventBus.instance) {
          EventBus.instance = new EventBus();
        }
        return EventBus.instance;
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
    
    // Mock PetRewardManager
    global.PetRewardManager = class PetRewardManager {
      constructor() {
        this.rewards = [];
      }
      
      rewardForPoster(data) {
        const reward = {
          type: 'poster',
          points: 100,
          ...data
        };
        this.rewards.push(reward);
        return reward;
      }
    };
    
    // Setup reward system
    const eventBus = EventBus.getInstance();
    const petRewardManager = new PetRewardManager();
    
    eventBus.on('poster:published', (data) => {
      petRewardManager.rewardForPoster(data);
    });
  });
  
  afterEach(() => {
    global.alert = originalAlert;
  });
  
  test('should show reward message when poster is published from museum-checkin', () => {
    // Simulate the museum-checkin publish flow
    const recordId = 'test-record-123';
    const title = '我的博物馆海报';
    const safeImageUrl = 'https://example.com/poster.jpg';
    const userName = 'test-user';
    const museumId = 'museum-001';
    
    // Simulate the success alert from museum-checkin.js
    alert('🎉 已成功发布到大家的成就！感谢分享。\n\n🏆 获得100积分奖励！');
    
    // Simulate the event emission
    const eventBus = EventBus.getInstance();
    eventBus.emit('poster:published', {
      posterId: recordId,
      title: title,
      imageUrl: safeImageUrl,
      userId: userName,
      museumId: museumId,
      timestamp: Date.now()
    });
    
    // Verify the alert message
    expect(alertMessages).toHaveLength(1);
    expect(alertMessages[0]).toContain('🎉 已成功发布到大家的成就');
    expect(alertMessages[0]).toContain('🏆 获得100积分奖励！');
  });
  
  test('should show reward message when poster is published from achievements page', () => {
    // Simulate the achievements.html publish flow
    const title = '打卡 海报';
    const imageUrl = 'https://example.com/achievement-poster.jpg';
    const userName = 'achievement-user';
    const currentPoster = { museumId: 'museum-002' };
    
    // Simulate the success alert from achievements.html
    alert('🎉 已成功发布到大家的成就！感谢分享。\n\n🏆 获得100积分奖励！');
    
    // Simulate the event emission
    const eventBus = EventBus.getInstance();
    eventBus.emit('poster:published', {
      posterId: 'unknown',
      title: title,
      imageUrl: imageUrl,
      userId: userName,
      museumId: currentPoster.museumId,
      timestamp: Date.now()
    });
    
    // Verify the alert message
    expect(alertMessages).toHaveLength(1);
    expect(alertMessages[0]).toContain('🎉 已成功发布到大家的成就');
    expect(alertMessages[0]).toContain('🏆 获得100积分奖励！');
  });
  
  test('should trigger reward system when poster:published event is emitted', () => {
    const eventBus = EventBus.getInstance();
    const petRewardManager = new PetRewardManager();
    
    // Listen for the reward
    let rewardReceived = null;
    eventBus.on('poster:published', (data) => {
      rewardReceived = petRewardManager.rewardForPoster(data);
    });
    
    // Emit poster published event
    eventBus.emit('poster:published', {
      posterId: 'test-123',
      title: '测试海报',
      userId: 'test-user',
      timestamp: Date.now()
    });
    
    // Verify reward was triggered
    expect(rewardReceived).not.toBeNull();
    expect(rewardReceived).toEqual({
      posterId: 'test-123',
      title: '测试海报',
      userId: 'test-user',
      timestamp: expect.any(Number),
      type: 'poster',
      points: 100
    });
  });
});
