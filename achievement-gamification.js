/**
 * Achievement Gamification System
 * 成就系统游戏化升级模块
 * 
 * Features:
 * - Achievement notifications (toast popups)
 * - Micro-achievements for small actions
 * - Achievement unlock animations
 * - Streak tracking system
 * - Points/XP system
 * - Sound effects
 * - Social sharing
 * - Achievement hints
 */

class AchievementGamification {
    constructor() {
        this.notifications = [];
        this.soundEnabled = this.loadSetting('soundEnabled', true);
        this.animationsEnabled = this.loadSetting('animationsEnabled', true);
        this.streakData = this.loadStreakData();
        this.xpData = this.loadXPData();
        this.unlockedAchievements = this.loadUnlockedAchievements();
        this.initializeSounds();
        this.initializeNotificationContainer();
    }

    // ===== INITIALIZATION =====
    initializeNotificationContainer() {
        if (!document.getElementById('achievement-notification-container')) {
            const container = document.createElement('div');
            container.id = 'achievement-notification-container';
            container.className = 'achievement-notification-container';
            document.body.appendChild(container);
        }
    }

    initializeSounds() {
        // Simple sound using Web Audio API
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // ===== NOTIFICATION SYSTEM =====
    showAchievementNotification(achievement, type = 'unlock') {
        if (!this.animationsEnabled && type === 'unlock') return;

        const notification = this.createNotificationElement(achievement, type);
        const container = document.getElementById('achievement-notification-container');
        container.appendChild(notification);

        // Play sound
        if (this.soundEnabled && type === 'unlock') {
            this.playAchievementSound(achievement.level || 'basic');
        }

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-remove after duration
        const duration = type === 'unlock' ? 4000 : 3000;
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);

        // Track notification
        this.trackAchievementNotification(achievement, type);
    }

    createNotificationElement(achievement, type) {
        const notification = document.createElement('div');
        notification.className = `achievement-notification ${type} level-${achievement.level || 'basic'}`;
        
        const title = type === 'unlock' ? '🎉 成就解锁！' : '💡 即将达成';
        const emoji = achievement.emoji || '🏆';
        const name = achievement.name || '新成就';
        const description = achievement.description || '';
        const xpGain = this.calculateXPGain(achievement);

        notification.innerHTML = `
            <div class="notification-icon">${emoji}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-achievement-name">${name}</div>
                ${description ? `<div class="notification-description">${description}</div>` : ''}
                ${type === 'unlock' ? `<div class="notification-xp">+${xpGain} XP</div>` : ''}
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add click handler to view achievement details
        notification.addEventListener('click', (e) => {
            if (!e.target.classList.contains('notification-close')) {
                this.showAchievementDetails(achievement);
            }
        });

        return notification;
    }

    // ===== MICRO-ACHIEVEMENTS =====
    checkMicroAchievements(action, data = {}) {
        const microAchievements = this.getMicroAchievementDefinitions();
        const actionAchievements = microAchievements[action] || [];

        actionAchievements.forEach(achievementDef => {
            if (!this.isAchievementUnlocked(achievementDef.id)) {
                const unlocked = this.checkAchievementCondition(achievementDef, data);
                if (unlocked) {
                    this.unlockAchievement(achievementDef);
                }
            }
        });
    }

    getMicroAchievementDefinitions() {
        return {
            // First time actions
            'first_checklist_item': [{
                id: 'micro_first_check',
                name: '第一步',
                emoji: '✅',
                description: '完成第一个清单项目',
                level: 'micro',
                xp: 10
            }],
            'first_photo': [{
                id: 'micro_first_photo',
                name: '摄影师',
                emoji: '📷',
                description: '上传第一张博物馆照片',
                level: 'micro',
                xp: 15
            }],
            'first_assessment': [{
                id: 'micro_first_assessment',
                name: '开始评估',
                emoji: '📝',
                description: '完成第一次亲子测评',
                level: 'micro',
                xp: 20
            }],
            'first_share': [{
                id: 'micro_first_share',
                name: '分享达人',
                emoji: '🔗',
                description: '第一次分享清单给朋友',
                level: 'micro',
                xp: 15
            }],
            'first_error_report': [{
                id: 'micro_first_error_report',
                name: '纠错先锋',
                emoji: '🔍',
                description: '第一次报告数据错误',
                level: 'micro',
                xp: 15
            }],
            
            // Streak achievements
            'visit_streak_3': [{
                id: 'streak_3_days',
                name: '三日打卡',
                emoji: '🔥',
                description: '连续3天参观博物馆',
                level: 'basic',
                xp: 30
            }],
            'visit_streak_7': [{
                id: 'streak_week',
                name: '一周坚持',
                emoji: '⭐',
                description: '连续7天参观博物馆',
                level: 'intermediate',
                xp: 70
            }],
            'visit_streak_30': [{
                id: 'streak_month',
                name: '月度冠军',
                emoji: '👑',
                description: '连续30天参观博物馆',
                level: 'advanced',
                xp: 300
            }],
            
            // Checklist completion achievements
            'checklist_complete_10': [{
                id: 'checklist_complete_10',
                name: '清单小能手',
                emoji: '📋',
                description: '完成10个博物馆的所有清单项目',
                level: 'intermediate',
                xp: 50
            }],
            
            // Photo achievements
            'photo_count_10': [{
                id: 'photographer_10',
                name: '摄影爱好者',
                emoji: '📸',
                description: '上传10张博物馆照片',
                level: 'basic',
                xp: 40
            }],
            'photo_count_50': [{
                id: 'photographer_50',
                name: '摄影大师',
                emoji: '🎨',
                description: '上传50张博物馆照片',
                level: 'intermediate',
                xp: 100
            }],
            
            // Time-based achievements
            'early_bird': [{
                id: 'early_bird',
                name: '早起的鸟儿',
                emoji: '🌅',
                description: '上午9点前到达博物馆',
                level: 'micro',
                xp: 10
            }],
            'night_owl': [{
                id: 'night_owl',
                name: '夜游者',
                emoji: '🌙',
                description: '晚上参观博物馆',
                level: 'micro',
                xp: 10
            }],
            
            // Weekend achievements
            'weekend_warrior': [{
                id: 'weekend_warrior',
                name: '周末战士',
                emoji: '🎯',
                description: '周末参观博物馆',
                level: 'micro',
                xp: 15
            }],
            
            // Error reporting achievements (content building)
            'error_report_5': [{
                id: 'error_reporter_5',
                name: '质量监督员',
                emoji: '🔎',
                description: '报告5个数据错误',
                level: 'basic',
                xp: 30
            }],
            'error_report_20': [{
                id: 'error_reporter_20',
                name: '数据守护者',
                emoji: '🛡️',
                description: '报告20个数据错误',
                level: 'intermediate',
                xp: 80
            }]
        };
    }

    checkAchievementCondition(achievementDef, data) {
        // This is a simple check - in a real implementation,
        // you would check against stored data
        return true;
    }

    // ===== ACHIEVEMENT UNLOCK =====
    unlockAchievement(achievement) {
        // Mark as unlocked
        this.unlockedAchievements.add(achievement.id);
        this.saveUnlockedAchievements();

        // Add XP
        const xp = achievement.xp || this.calculateXPGain(achievement);
        this.addXP(xp);

        // Show notification
        this.showAchievementNotification(achievement, 'unlock');

        // Play celebration animation
        if (this.animationsEnabled) {
            this.playCelebrationAnimation(achievement);
        }

        // Save unlock time
        this.saveAchievementUnlockTime(achievement.id);

        return true;
    }

    isAchievementUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }

    // ===== STREAK SYSTEM =====
    loadStreakData() {
        try {
            const data = localStorage.getItem('museumcheck_streak_data');
            return data ? JSON.parse(data) : {
                currentStreak: 0,
                longestStreak: 0,
                lastVisitDate: null,
                visitDates: []
            };
        } catch (e) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastVisitDate: null,
                visitDates: []
            };
        }
    }

    saveStreakData() {
        localStorage.setItem('museumcheck_streak_data', JSON.stringify(this.streakData));
    }

    updateStreak(visitDate = new Date()) {
        const today = this.getDateString(visitDate);
        const lastVisit = this.streakData.lastVisitDate;

        if (!lastVisit) {
            // First visit
            this.streakData.currentStreak = 1;
            this.streakData.longestStreak = 1;
        } else {
            const daysSinceLastVisit = this.getDaysDifference(lastVisit, today);
            
            if (daysSinceLastVisit === 0) {
                // Same day - no change
                return;
            } else if (daysSinceLastVisit === 1) {
                // Consecutive day - increment streak
                this.streakData.currentStreak++;
                if (this.streakData.currentStreak > this.streakData.longestStreak) {
                    this.streakData.longestStreak = this.streakData.currentStreak;
                }
                
                // Check for streak achievements
                this.checkStreakAchievements(this.streakData.currentStreak);
            } else {
                // Streak broken
                this.streakData.currentStreak = 1;
            }
        }

        this.streakData.lastVisitDate = today;
        if (!this.streakData.visitDates.includes(today)) {
            this.streakData.visitDates.push(today);
        }
        this.saveStreakData();
    }

    checkStreakAchievements(streak) {
        if (streak === 3) {
            this.checkMicroAchievements('visit_streak_3');
        } else if (streak === 7) {
            this.checkMicroAchievements('visit_streak_7');
        } else if (streak === 30) {
            this.checkMicroAchievements('visit_streak_30');
        }
    }

    getStreakInfo() {
        return {
            current: this.streakData.currentStreak,
            longest: this.streakData.longestStreak,
            lastVisit: this.streakData.lastVisitDate
        };
    }

    // ===== XP SYSTEM =====
    loadXPData() {
        try {
            const data = localStorage.getItem('museumcheck_xp_data');
            const parsed = data ? JSON.parse(data) : null;
            
            if (parsed) {
                // Initialize lifetimeXP if it doesn't exist (migration for existing users)
                if (typeof parsed.lifetimeXP === 'undefined') {
                    // For existing users, initialize lifetimeXP = totalXP (current) + totalXPSpent (from pet)
                    parsed.lifetimeXP = parsed.totalXP || 0;
                    
                    // Try to get total XP spent from pet data for accurate migration
                    try {
                        const petData = localStorage.getItem('virtualPetData');
                        if (petData) {
                            const pet = JSON.parse(petData);
                            if (pet.pet && pet.pet.totalXPSpent) {
                                parsed.lifetimeXP += pet.pet.totalXPSpent;
                            }
                        }
                    } catch (e) {
                        // Ignore pet data errors during migration
                    }
                }
                return parsed;
            }
            
            return {
                totalXP: 0,
                lifetimeXP: 0,
                level: 1,
                xpHistory: []
            };
        } catch (e) {
            return {
                totalXP: 0,
                lifetimeXP: 0,
                level: 1,
                xpHistory: []
            };
        }
    }

    saveXPData() {
        localStorage.setItem('museumcheck_xp_data', JSON.stringify(this.xpData));
    }

    addXP(amount) {
        const oldTotalXP = this.xpData.totalXP;
        this.xpData.totalXP += amount;
        
        // Track lifetime XP (never decreases, always accumulates)
        this.xpData.lifetimeXP = (this.xpData.lifetimeXP || 0) + amount;
        
        this.xpData.xpHistory.push({
            amount,
            timestamp: new Date().toISOString()
        });

        // Check for milestone celebrations (100, 500, 1000, 2000, 5000, etc.)
        this.checkXPMilestones(oldTotalXP, this.xpData.totalXP);

        // Check for level up
        const newLevel = this.calculateLevel(this.xpData.totalXP);
        if (newLevel > this.xpData.level) {
            const oldLevel = this.xpData.level;
            this.xpData.level = newLevel;
            this.onLevelUp(oldLevel, newLevel);
        }

        this.saveXPData();
    }
    
    // Check and celebrate XP milestones
    checkXPMilestones(oldXP, newXP) {
        const milestones = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000];
        
        for (const milestone of milestones) {
            if (oldXP < milestone && newXP >= milestone) {
                this.celebrateMilestone(milestone);
                break; // Only celebrate one milestone at a time
            }
        }
    }
    
    // Celebrate reaching XP milestone
    celebrateMilestone(milestone) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification milestone-celebration';
        
        let emoji = '🎊';
        let title = '里程碑达成！';
        let description = '继续保持！';
        
        if (milestone >= 10000) {
            emoji = '🏆';
            title = '传奇成就！';
            description = '你是真正的博物馆探索大师！';
        } else if (milestone >= 5000) {
            emoji = '👑';
            title = '大师级成就！';
            description = '令人惊叹的成就！';
        } else if (milestone >= 1000) {
            emoji = '🌟';
            title = '重要里程碑！';
            description = '你的博物馆之旅越来越精彩！';
        }
        
        notification.innerHTML = `
            <div class="notification-icon milestone-icon-animated">${emoji}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-achievement-name milestone-xp-large">${milestone} 积分达成！</div>
                <div class="notification-description">${description}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        const container = document.getElementById('achievement-notification-container');
        if (container) {
            container.appendChild(notification);

            // Play special milestone sound
            if (this.soundEnabled) {
                this.playMilestoneSound(milestone);
            }

            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 6000); // Longer duration for milestones
        }
    }
    
    // Play special sound for milestones
    playMilestoneSound(milestone) {
        if (!this.audioContext) return;
        
        // Play ascending arpeggio based on milestone size
        let notes;
        if (milestone >= 10000) {
            notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Full octave
        } else if (milestone >= 5000) {
            notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // 6 notes
        } else if (milestone >= 1000) {
            notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // 5 notes
        } else {
            notes = [261.63, 329.63, 392.00, 523.25]; // 4 notes
        }
        
        this.playNoteSequence(notes, 120);
    }

    calculateLevel(totalXP) {
        // Level formula: level = floor(sqrt(XP / 100)) + 1
        // Level 1: 0-99 XP
        // Level 2: 100-399 XP
        // Level 3: 400-899 XP
        // etc.
        return Math.floor(Math.sqrt(totalXP / 100)) + 1;
    }

    getXPForNextLevel(currentLevel) {
        // XP required for next level
        return currentLevel * currentLevel * 100;
    }

    getXPProgress() {
        const currentLevel = this.xpData.level;
        const xpForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100;
        const xpForNextLevel = currentLevel * currentLevel * 100;
        const xpInCurrentLevel = this.xpData.totalXP - xpForCurrentLevel;
        const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
        
        return {
            level: currentLevel,
            totalXP: this.xpData.totalXP,
            currentLevelXP: xpInCurrentLevel,
            nextLevelXP: xpNeededForLevel,
            progress: (xpInCurrentLevel / xpNeededForLevel) * 100
        };
    }
    
    /**
     * Get XP information for leaderboard submission
     * @returns {Object} { total, level, lifetime }
     */
    getXPInfo() {
        return {
            total: this.xpData.totalXP || 0,
            lifetime: this.xpData.lifetimeXP || 0,
            level: this.xpData.level || 1
        };
    }

    onLevelUp(oldLevel, newLevel) {
        // Show level up notification
        this.showLevelUpNotification(oldLevel, newLevel);
        
        // Play level up sound
        if (this.soundEnabled) {
            this.playLevelUpSound();
        }
        
        // Unlock level-based achievements
        this.checkLevelAchievements(newLevel);
    }

    showLevelUpNotification(oldLevel, newLevel) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification level-up';
        notification.innerHTML = `
            <div class="notification-icon">🎊</div>
            <div class="notification-content">
                <div class="notification-title">等级提升！</div>
                <div class="notification-achievement-name">Level ${oldLevel} → Level ${newLevel}</div>
                <div class="notification-description">恭喜你解锁新等级！</div>
            </div>
        `;

        const container = document.getElementById('achievement-notification-container');
        container.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Show XP gain notification - Enhanced with more emotional feedback
    showXPGainNotification(xpAmount, reason = '任务完成') {
        const xpProgress = this.getXPProgress();
        const notification = document.createElement('div');
        notification.className = 'achievement-notification level-micro xp-gain-notification';
        
        // Determine encouragement message based on XP amount
        let encouragement = '继续加油！';
        if (xpAmount >= 20) encouragement = '太棒了！🎉';
        else if (xpAmount >= 10) encouragement = '真不错！👍';
        else if (xpAmount >= 5) encouragement = '很好！✨';
        
        // Check for milestone progress
        const progressToNextLevel = xpProgress.progress;
        let milestoneText = '';
        if (progressToNextLevel >= 90) {
            milestoneText = '⚡ 快要升级了！';
        } else if (progressToNextLevel >= 75) {
            milestoneText = '🔥 离下一级不远了';
        }
        
        notification.innerHTML = `
            <div class="notification-icon xp-icon-animated">⭐</div>
            <div class="notification-content">
                <div class="notification-title">${reason}</div>
                <div class="notification-achievement-name xp-amount-large">+${xpAmount} 积分 ${encouragement}</div>
                <div class="notification-description">
                    总积分：${xpProgress.totalXP} | 等级${xpProgress.level}
                    ${milestoneText ? '<br>' + milestoneText : ''}
                </div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        const container = document.getElementById('achievement-notification-container');
        if (container) {
            container.appendChild(notification);

            // Play sound for XP gain
            if (this.soundEnabled) {
                this.playXPSound(xpAmount);
            }

            setTimeout(() => notification.classList.add('show'), 10);
            
            // Keep notification longer for better emotional impact
            const duration = xpAmount >= 20 ? 5000 : 4000;
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }
    
    // Play sound for XP gain (different pitch based on amount)
    playXPSound(xpAmount) {
        if (!this.audioContext) return;
        
        let notes;
        if (xpAmount >= 20) {
            notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - high reward
        } else if (xpAmount >= 10) {
            notes = [523.25, 659.25]; // C5, E5 - medium reward
        } else {
            notes = [523.25]; // C5 - small reward
        }
        
        this.playNoteSequence(notes, 60);
    }

    calculateXPGain(achievement) {
        // Calculate XP based on achievement level
        const baseXP = {
            'micro': 10,
            'basic': 25,
            'intermediate': 50,
            'advanced': 100,
            'master': 200
        };
        return achievement.xp || baseXP[achievement.level || 'basic'];
    }

    checkLevelAchievements(level) {
        // Unlock achievements for reaching certain levels
        const levelMilestones = {
            5: { id: 'level_5', name: '入门者', emoji: '🌟', description: '达到5级' },
            10: { id: 'level_10', name: '探索者', emoji: '🔍', description: '达到10级' },
            25: { id: 'level_25', name: '专家', emoji: '🎓', description: '达到25级' },
            50: { id: 'level_50', name: '大师', emoji: '👑', description: '达到50级' }
        };

        if (levelMilestones[level]) {
            this.unlockAchievement({ ...levelMilestones[level], level: 'advanced' });
        }
    }

    // ===== SOUNDS =====
    playAchievementSound(level) {
        if (!this.audioContext) return;

        const frequencies = {
            'micro': [523.25, 659.25],      // C5, E5
            'basic': [523.25, 659.25, 783.99], // C5, E5, G5
            'intermediate': [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
            'advanced': [523.25, 659.25, 783.99, 1046.50, 1318.51], // C5, E5, G5, C6, E6
            'master': [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5, E5, G5, C6, E6, G6
        };

        const notes = frequencies[level] || frequencies['basic'];
        this.playNoteSequence(notes);
    }

    playLevelUpSound() {
        if (!this.audioContext) return;
        
        // Ascending scale for level up
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
        this.playNoteSequence(notes, 100);
    }

    playNoteSequence(frequencies, interval = 80) {
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.1);
            }, index * interval);
        });
    }

    playTone(frequency, duration) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // ===== ANIMATIONS =====
    playCelebrationAnimation(achievement) {
        // Create confetti or fireworks effect
        if (achievement.level === 'advanced' || achievement.level === 'master') {
            this.createConfetti();
        }
    }

    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    }

    // ===== ACHIEVEMENT HINTS =====
    getAchievementHints(visitedCount, assessmentData) {
        const hints = [];
        const allAchievements = this.getAllPossibleAchievements(visitedCount, assessmentData);

        // Find achievements that are close to being unlocked
        allAchievements.forEach(achievement => {
            if (!this.isAchievementUnlocked(achievement.id) && achievement.progress) {
                const progressPercent = (achievement.progress / achievement.target) * 100;
                if (progressPercent >= 50 && progressPercent < 100) {
                    hints.push({
                        achievement,
                        progressPercent,
                        remaining: achievement.target - achievement.progress
                    });
                }
            }
        });

        // Sort by closest to completion
        hints.sort((a, b) => b.progressPercent - a.progressPercent);

        return hints.slice(0, 3); // Return top 3 hints
    }

    getAllPossibleAchievements(visitedCount, assessmentData) {
        // This would return all possible achievements with their current progress
        // For now, returning empty array - would be populated from main achievement system
        return [];
    }

    showAchievementDetails(achievement) {
        // Show a modal or expanded view of the achievement
        console.log('Show achievement details:', achievement);
    }

    // ===== DATA PERSISTENCE =====
    loadUnlockedAchievements() {
        try {
            const data = localStorage.getItem('museumcheck_unlocked_achievements');
            return data ? new Set(JSON.parse(data)) : new Set();
        } catch (e) {
            return new Set();
        }
    }

    saveUnlockedAchievements() {
        localStorage.setItem('museumcheck_unlocked_achievements', 
            JSON.stringify([...this.unlockedAchievements]));
    }

    saveAchievementUnlockTime(achievementId) {
        try {
            const unlockTimes = JSON.parse(localStorage.getItem('museumcheck_achievement_unlock_times') || '{}');
            unlockTimes[achievementId] = new Date().toISOString();
            localStorage.setItem('museumcheck_achievement_unlock_times', JSON.stringify(unlockTimes));
        } catch (e) {
            console.error('Failed to save achievement unlock time:', e);
        }
    }

    loadSetting(key, defaultValue) {
        try {
            const value = localStorage.getItem(`museumcheck_${key}`);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    saveSetting(key, value) {
        localStorage.setItem(`museumcheck_${key}`, JSON.stringify(value));
    }

    // ===== UTILITY FUNCTIONS =====
    getDateString(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    trackAchievementNotification(achievement, type) {
        // Track in analytics if available
        if (window.gtag) {
            window.gtag('event', 'achievement_notification', {
                achievement_id: achievement.id,
                achievement_name: achievement.name,
                achievement_type: type,
                achievement_level: achievement.level
            });
        }
    }

    // ===== PUBLIC API =====
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.saveSetting('soundEnabled', this.soundEnabled);
        return this.soundEnabled;
    }

    toggleAnimations() {
        this.animationsEnabled = !this.animationsEnabled;
        this.saveSetting('animationsEnabled', this.animationsEnabled);
        return this.animationsEnabled;
    }

    getStats() {
        return {
            xp: this.xpData,
            streak: this.streakData,
            unlockedCount: this.unlockedAchievements.size,
            settings: {
                soundEnabled: this.soundEnabled,
                animationsEnabled: this.animationsEnabled
            }
        };
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementGamification;
}
