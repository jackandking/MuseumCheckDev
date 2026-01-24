/**
 * PetRewardManager
 * 提供宠物奖励的最小骨架：监听 checkin/achievement/poster 事件，发放经验值。
 */
class PetRewardManager {
  constructor({ eventBus } = {}) {
    this.eventBus = eventBus || (typeof EventBus !== 'undefined' ? EventBus.getInstance() : null);
    this.recentRewards = [];
    this.maxHistory = 50;
    this._bindEvents();
  }

  _bindEvents() {
    if (!this.eventBus) return;

    // 监听 checkin 完成事件
    this.eventBus.on('checkin:completed', (evt) => {
      if (!evt) return;
      this.rewardForCheckin(evt);
    });

    // 监听成就达成事件（可选）
    this.eventBus.on('achievement:earned', (evt) => {
      if (!evt) return;
      this.rewardForAchievement(evt);
    });

    // 监听海报发布事件
    this.eventBus.on('poster:published', (evt) => {
      if (!evt) return;
      this.rewardForPoster(evt);
    });
  }

  rewardForCheckin({ museumId, points = 10, userId, timestamp = Date.now() } = {}) {
    const reward = { type: 'checkin', museumId, points, userId, timestamp };
    this._recordReward(reward);
    if (this.eventBus) {
      this.eventBus.emit('pet:xp:added', reward);
    }
    return reward;
  }

  rewardForAchievement({ achievementId, points = 20, userId, timestamp = Date.now() } = {}) {
    const reward = { type: 'achievement', achievementId, points, userId, timestamp };
    this._recordReward(reward);
    if (this.eventBus) {
      this.eventBus.emit('pet:xp:added', reward);
    }
    return reward;
  }

  rewardForPoster({ posterId, title, points = 100, userId, timestamp = Date.now() } = {}) {
    const reward = { type: 'poster', posterId, title, points, userId, timestamp };
    this._recordReward(reward);
    
    // Actually add points to user's account
    if (typeof PointsManager !== 'undefined') {
      PointsManager.addPoints(points, 'poster', {
        posterId: posterId,
        title: title,
        userId: userId
      });
      console.log(`[PetRewardManager] Added ${points} points for poster publication: ${title}`);
    } else {
      console.warn('[PetRewardManager] PointsManager not available, points not added');
    }
    
    if (this.eventBus) {
      this.eventBus.emit('pet:xp:added', reward);
    }
    return reward;
  }

  _recordReward(reward) {
    this.recentRewards.push(reward);
    if (this.recentRewards.length > this.maxHistory) {
      this.recentRewards.shift();
    }
  }

  getRecentRewards() {
    return [...this.recentRewards];
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PetRewardManager;
}

if (typeof window !== 'undefined') {
  window.PetRewardManager = PetRewardManager;
}
