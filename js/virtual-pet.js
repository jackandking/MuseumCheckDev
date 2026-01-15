/**
 * Virtual Pet System - 电子宠物系统 (积分养宠重构版)
 * 
 * Features:
 * - Pet adoption for child mode users
 * - Pet only appears when points change (task completion, photo upload, game completion)
 * - Points from check-in tasks (5 XP), photos (10 XP), games (15-30 XP)
 * - Feed pet with points (reduced cost: 5 points)
 * - Upgrade attack/defense stats with points
 * - Pet LEVEL system based on total points spent (affects animation quality)
 * - Higher level pets have cooler animations during check-in
 * - Intelligence increases with completed tasks
 * - Pet dies after extended time without feeding (0.1% hunger decrease per minute)
 * - Dead pet can be revived with 5 points (reduced cost)
 * - Reset and adopt a new pet for 50 points (new feature)
 * 
 * NEW - Daily Check-in System:
 * - Daily check-in: 5 XP base reward
 * - Daily tasks with additional XP rewards:
 *   - Feed pet task: 3 XP
 *   - Visit museum task: 3 XP
 *   - Complete checklist task: 5 XP
 * - Streak tracking for consecutive daily check-ins
 * 
 * Points Earning:
 * - Check-in task: 5 XP
 * - Photo upload: 10 XP  
 * - Puzzle game completion: 15 XP
 * - Maze game completion: 20 XP
 * - Shooting game: score/10 XP (min 10, max 30)
 * - Space Invaders: score/10 XP (min 15, max 30)
 * - Tank Battle: score/5 XP (min 20, max 30)
 * - Minesweeper: (100-time)*0.3 XP (min 10, max 25)
 * 
 * Pet Levels (100 levels total with progressive tier system):
 * - Levels 1-10 (新手-资深): 0-1000 XP - bounce animation
 * - Levels 11-25 (精英-超凡): 1100-3000 XP - spin animation
 * - Levels 26-45 (传说-神话): 3200-7000 XP - glow-spin animation
 * - Levels 46-70 (神话-永恒): 7200-14000 XP - rainbow-flip animation
 * - Levels 71-100 (至尊-传奇): 17000-23000 XP - fireworks-dance animation
 * 
 * Level progression formula:
 * - Levels 1-5: Original thresholds (backward compatible)
 * - Levels 6-20: Linear +100 XP per level
 * - Levels 21-50: Moderate +200 XP per level
 * - Levels 51-100: Steeper +300 XP per level
 * 
 * Hunger System (slower rate for better user experience):
 * - Hunger decreases by 0.1% per minute (was 1% per minute)
 * - Time to empty hunger: ~1000 minutes (~16.7 hours)
 * - Grace period before death: 30 minutes after hunger reaches 0
 */

class VirtualPet {
    constructor() {
        this.petData = this.loadPetData();
        this.dailyCheckinData = this.loadDailyCheckinData();
        this.isVisible = false;
        this.animationTimeout = null;
        this.celebrationAnimationId = null;
        this.hungerTimerId = null;
        this.initializeUI();
        
        // Check pet status on load
        this.checkPetStatus();
        
        // Start hunger timer to update every minute
        this.startHungerTimer();
        
        // Reset daily tasks if it's a new day
        this.checkDailyReset();
    }

    // ===== CONSTANTS =====
    static get HUNGER_DEATH_DAYS() { return 90; } // 3 months = ~90 days
    // Note: XP rewards are configured in script.js achievement system (5 XP for tasks, 10 XP for photos)
    // Pet uses the same XP/points system for feeding and upgrades
    // Reduced costs to make pet more accessible during a typical museum visit (2-3 hours)
    static get FEED_COST() { return 5; } // Points to feed pet (reduced from 10)
    static get ATTACK_UPGRADE_COST() { return 25; } // Points to increase attack (reduced from 50)
    static get DEFENSE_UPGRADE_COST() { return 25; } // Points to increase defense (reduced from 50)
    static get REVIVE_COST() { return 5; } // Points to revive dead pet (changed from 50 to 5)
    static get RESET_COST() { return 50; } // Points to reset and adopt a new pet
    static get HUNGER_DECREASE_PER_MINUTE() { return 0.1; } // Hunger decreases by 0.1% per minute (slower rate)
    static get MAX_HUNGER() { return 100; }
    static get HUNGER_GRACE_PERIOD_MINUTES() { return 30; } // Grace period after hunger reaches 0 before death
    // Cached calculation: minutes needed for hunger to reach 0 (MAX_HUNGER / HUNGER_DECREASE_PER_MINUTE)
    static get MINUTES_TO_ZERO_HUNGER() { return 1000; } // 100 / 0.1 = 1000 minutes (~16.7 hours)
    static get INTELLIGENCE_PER_TASK() { return 1; } // Intelligence increases by 1 per task
    
    // Daily check-in task XP rewards
    static get DAILY_CHECKIN_XP() { return 5; } // Base XP for daily check-in
    static get DAILY_TASK_XP() { return 3; } // XP for completing each daily task
    
    // Daily tasks definitions - small tasks that can be completed each day
    static get DAILY_TASKS() {
        return [
            { id: 'feed_pet', name: '喂养宠物', description: '给宠物喂一次食', xp: 3, emoji: '🍖' },
            { id: 'visit_museum', name: '浏览博物馆', description: '点击查看任意一个博物馆', xp: 3, emoji: '🏛️' },
            { id: 'complete_checklist', name: '完成清单', description: '完成一项任务清单', xp: 5, emoji: '✅' }
        ];
    }
    
    // Game completion XP rewards
    static get GAME_XP_REWARDS() {
        return {
            puzzle: { base: 15, name: '拼图游戏' },
            maze: { base: 20, name: '迷宫游戏' },
            shooting: { min: 10, max: 30, divisor: 10, name: '射击游戏' },
            'space-invaders': { min: 15, max: 30, divisor: 10, name: '小蜜蜂' },
            'tank-battle': { min: 20, max: 30, divisor: 5, name: '坦克大战' },
            minesweeper: { min: 10, max: 25, timeBonus: true, name: '扫雷' },
            'pet-adventure': { min: 10, max: 25, divisor: 10, name: '宠物冒险' },
            'snake': { min: 10, max: 30, divisor: 10, name: '宠物贪食蛇', levelBonus: true }
        };
    }
    
    // Pet level thresholds (based on total XP spent)
    // Extended to 100 levels with progressive tier system
    // Levels 1-5 maintain backward compatibility with original thresholds
    static get PET_LEVELS() {
        return [
            { level: 1, xpRequired: 0, name: '新手', animation: 'bounce' },
            { level: 2, xpRequired: 50, name: '见习', animation: 'bounce' },
            { level: 3, xpRequired: 150, name: '熟练', animation: 'bounce' },
            { level: 4, xpRequired: 300, name: '专家', animation: 'bounce' },
            { level: 5, xpRequired: 500, name: '大师', animation: 'bounce' },
            { level: 6, xpRequired: 600, name: '资深', animation: 'bounce' },
            { level: 7, xpRequired: 700, name: '资深', animation: 'bounce' },
            { level: 8, xpRequired: 800, name: '资深', animation: 'bounce' },
            { level: 9, xpRequired: 900, name: '资深', animation: 'bounce' },
            { level: 10, xpRequired: 1000, name: '资深', animation: 'bounce' },
            { level: 11, xpRequired: 1100, name: '精英', animation: 'spin' },
            { level: 12, xpRequired: 1200, name: '精英', animation: 'spin' },
            { level: 13, xpRequired: 1300, name: '精英', animation: 'spin' },
            { level: 14, xpRequired: 1400, name: '精英', animation: 'spin' },
            { level: 15, xpRequired: 1500, name: '精英', animation: 'spin' },
            { level: 16, xpRequired: 1600, name: '卓越', animation: 'spin' },
            { level: 17, xpRequired: 1700, name: '卓越', animation: 'spin' },
            { level: 18, xpRequired: 1800, name: '卓越', animation: 'spin' },
            { level: 19, xpRequired: 1900, name: '卓越', animation: 'spin' },
            { level: 20, xpRequired: 2000, name: '卓越', animation: 'spin' },
            { level: 21, xpRequired: 2200, name: '超凡', animation: 'spin' },
            { level: 22, xpRequired: 2400, name: '超凡', animation: 'spin' },
            { level: 23, xpRequired: 2600, name: '超凡', animation: 'spin' },
            { level: 24, xpRequired: 2800, name: '超凡', animation: 'spin' },
            { level: 25, xpRequired: 3000, name: '超凡', animation: 'spin' },
            { level: 26, xpRequired: 3200, name: '传说', animation: 'glow-spin' },
            { level: 27, xpRequired: 3400, name: '传说', animation: 'glow-spin' },
            { level: 28, xpRequired: 3600, name: '传说', animation: 'glow-spin' },
            { level: 29, xpRequired: 3800, name: '传说', animation: 'glow-spin' },
            { level: 30, xpRequired: 4000, name: '传说', animation: 'glow-spin' },
            { level: 31, xpRequired: 4200, name: '史诗', animation: 'glow-spin' },
            { level: 32, xpRequired: 4400, name: '史诗', animation: 'glow-spin' },
            { level: 33, xpRequired: 4600, name: '史诗', animation: 'glow-spin' },
            { level: 34, xpRequired: 4800, name: '史诗', animation: 'glow-spin' },
            { level: 35, xpRequired: 5000, name: '史诗', animation: 'glow-spin' },
            { level: 36, xpRequired: 5200, name: '史诗', animation: 'glow-spin' },
            { level: 37, xpRequired: 5400, name: '史诗', animation: 'glow-spin' },
            { level: 38, xpRequired: 5600, name: '史诗', animation: 'glow-spin' },
            { level: 39, xpRequired: 5800, name: '史诗', animation: 'glow-spin' },
            { level: 40, xpRequired: 6000, name: '史诗', animation: 'glow-spin' },
            { level: 41, xpRequired: 6200, name: '神话', animation: 'glow-spin' },
            { level: 42, xpRequired: 6400, name: '神话', animation: 'glow-spin' },
            { level: 43, xpRequired: 6600, name: '神话', animation: 'glow-spin' },
            { level: 44, xpRequired: 6800, name: '神话', animation: 'glow-spin' },
            { level: 45, xpRequired: 7000, name: '神话', animation: 'glow-spin' },
            { level: 46, xpRequired: 7200, name: '神话', animation: 'rainbow-flip' },
            { level: 47, xpRequired: 7400, name: '神话', animation: 'rainbow-flip' },
            { level: 48, xpRequired: 7600, name: '神话', animation: 'rainbow-flip' },
            { level: 49, xpRequired: 7800, name: '神话', animation: 'rainbow-flip' },
            { level: 50, xpRequired: 8000, name: '神话', animation: 'rainbow-flip' },
            { level: 51, xpRequired: 8300, name: '不朽', animation: 'rainbow-flip' },
            { level: 52, xpRequired: 8600, name: '不朽', animation: 'rainbow-flip' },
            { level: 53, xpRequired: 8900, name: '不朽', animation: 'rainbow-flip' },
            { level: 54, xpRequired: 9200, name: '不朽', animation: 'rainbow-flip' },
            { level: 55, xpRequired: 9500, name: '不朽', animation: 'rainbow-flip' },
            { level: 56, xpRequired: 9800, name: '不朽', animation: 'rainbow-flip' },
            { level: 57, xpRequired: 10100, name: '不朽', animation: 'rainbow-flip' },
            { level: 58, xpRequired: 10400, name: '不朽', animation: 'rainbow-flip' },
            { level: 59, xpRequired: 10700, name: '不朽', animation: 'rainbow-flip' },
            { level: 60, xpRequired: 11000, name: '不朽', animation: 'rainbow-flip' },
            { level: 61, xpRequired: 11300, name: '永恒', animation: 'rainbow-flip' },
            { level: 62, xpRequired: 11600, name: '永恒', animation: 'rainbow-flip' },
            { level: 63, xpRequired: 11900, name: '永恒', animation: 'rainbow-flip' },
            { level: 64, xpRequired: 12200, name: '永恒', animation: 'rainbow-flip' },
            { level: 65, xpRequired: 12500, name: '永恒', animation: 'rainbow-flip' },
            { level: 66, xpRequired: 12800, name: '永恒', animation: 'rainbow-flip' },
            { level: 67, xpRequired: 13100, name: '永恒', animation: 'rainbow-flip' },
            { level: 68, xpRequired: 13400, name: '永恒', animation: 'rainbow-flip' },
            { level: 69, xpRequired: 13700, name: '永恒', animation: 'rainbow-flip' },
            { level: 70, xpRequired: 14000, name: '永恒', animation: 'rainbow-flip' },
            { level: 71, xpRequired: 14300, name: '至尊', animation: 'fireworks-dance' },
            { level: 72, xpRequired: 14600, name: '至尊', animation: 'fireworks-dance' },
            { level: 73, xpRequired: 14900, name: '至尊', animation: 'fireworks-dance' },
            { level: 74, xpRequired: 15200, name: '至尊', animation: 'fireworks-dance' },
            { level: 75, xpRequired: 15500, name: '至尊', animation: 'fireworks-dance' },
            { level: 76, xpRequired: 15800, name: '至尊', animation: 'fireworks-dance' },
            { level: 77, xpRequired: 16100, name: '至尊', animation: 'fireworks-dance' },
            { level: 78, xpRequired: 16400, name: '至尊', animation: 'fireworks-dance' },
            { level: 79, xpRequired: 16700, name: '至尊', animation: 'fireworks-dance' },
            { level: 80, xpRequired: 17000, name: '至尊', animation: 'fireworks-dance' },
            { level: 81, xpRequired: 17300, name: '无敌', animation: 'fireworks-dance' },
            { level: 82, xpRequired: 17600, name: '无敌', animation: 'fireworks-dance' },
            { level: 83, xpRequired: 17900, name: '无敌', animation: 'fireworks-dance' },
            { level: 84, xpRequired: 18200, name: '无敌', animation: 'fireworks-dance' },
            { level: 85, xpRequired: 18500, name: '无敌', animation: 'fireworks-dance' },
            { level: 86, xpRequired: 18800, name: '无敌', animation: 'fireworks-dance' },
            { level: 87, xpRequired: 19100, name: '无敌', animation: 'fireworks-dance' },
            { level: 88, xpRequired: 19400, name: '无敌', animation: 'fireworks-dance' },
            { level: 89, xpRequired: 19700, name: '无敌', animation: 'fireworks-dance' },
            { level: 90, xpRequired: 20000, name: '无敌', animation: 'fireworks-dance' },
            { level: 91, xpRequired: 20300, name: '传奇', animation: 'fireworks-dance' },
            { level: 92, xpRequired: 20600, name: '传奇', animation: 'fireworks-dance' },
            { level: 93, xpRequired: 20900, name: '传奇', animation: 'fireworks-dance' },
            { level: 94, xpRequired: 21200, name: '传奇', animation: 'fireworks-dance' },
            { level: 95, xpRequired: 21500, name: '传奇', animation: 'fireworks-dance' },
            { level: 96, xpRequired: 21800, name: '传奇', animation: 'fireworks-dance' },
            { level: 97, xpRequired: 22100, name: '传奇', animation: 'fireworks-dance' },
            { level: 98, xpRequired: 22400, name: '传奇', animation: 'fireworks-dance' },
            { level: 99, xpRequired: 22700, name: '传奇', animation: 'fireworks-dance' },
            { level: 100, xpRequired: 23000, name: '传奇', animation: 'fireworks-dance' }
        ];
    }
    
    // Pet types with different appearances and level-specific emojis
    static get PET_TYPES() {
        return {
            dragon: { 
                name: '小龙', 
                emoji: '🐲', 
                description: '勇敢的小龙',
                levelEmojis: ['🐲', '🐉', '🔥', '⚡', '🌟']
            },
            cat: { 
                name: '小猫', 
                emoji: '🐱', 
                description: '可爱的小猫',
                levelEmojis: ['🐱', '😺', '😸', '😻', '✨']
            },
            dog: { 
                name: '小狗', 
                emoji: '🐶', 
                description: '忠诚的小狗',
                levelEmojis: ['🐶', '🐕', '🦮', '🏆', '👑']
            },
            rabbit: { 
                name: '小兔', 
                emoji: '🐰', 
                description: '活泼的小兔',
                levelEmojis: ['🐰', '🐇', '🥕', '💫', '🌈']
            },
            panda: { 
                name: '小熊猫', 
                emoji: '🐼', 
                description: '憨厚的小熊猫',
                levelEmojis: ['🐼', '🎋', '🎍', '🎎', '🏅']
            },
            fox: { 
                name: '小狐狸', 
                emoji: '🦊', 
                description: '聪明的小狐狸',
                levelEmojis: ['🦊', '🍂', '🌙', '💎', '🎆']
            }
        };
    }

    // ===== DATA MANAGEMENT =====
    loadPetData() {
        try {
            const saved = localStorage.getItem('virtualPetData');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load pet data:', error);
        }
        
        // Default state: no pet adopted
        return {
            adopted: false,
            pet: null
        };
    }

    savePetData() {
        try {
            localStorage.setItem('virtualPetData', JSON.stringify(this.petData));
        } catch (error) {
            console.error('Failed to save pet data:', error);
        }
    }

    // ===== DAILY CHECK-IN SYSTEM =====
    loadDailyCheckinData() {
        try {
            const saved = localStorage.getItem('virtualPetDailyCheckin');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load daily check-in data:', error);
        }
        return this.getDefaultDailyCheckinData();
    }

    getDefaultDailyCheckinData() {
        return {
            lastCheckinDate: null,
            completedTasks: [],
            streak: 0,
            totalCheckins: 0
        };
    }

    saveDailyCheckinData() {
        try {
            localStorage.setItem('virtualPetDailyCheckin', JSON.stringify(this.dailyCheckinData));
        } catch (error) {
            console.error('Failed to save daily check-in data:', error);
        }
    }

    // Get today's date string (YYYY-MM-DD format in local timezone)
    // Using toLocaleDateString('en-CA') for consistent YYYY-MM-DD format in local timezone
    getTodayDateString() {
        const now = new Date();
        return now.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
    }

    // Check if user has checked in today
    hasCheckedInToday() {
        const today = this.getTodayDateString();
        return this.dailyCheckinData.lastCheckinDate === today;
    }

    // Perform daily check-in and earn base XP
    performDailyCheckin() {
        if (this.hasCheckedInToday()) {
            return { success: false, message: '今天已经签到过了！' };
        }

        const today = this.getTodayDateString();
        const lastCheckin = this.dailyCheckinData.lastCheckinDate;
        
        // Check if this is a consecutive day (yesterday)
        if (lastCheckin) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            if (lastCheckin === yesterdayStr) {
                this.dailyCheckinData.streak++;
            } else {
                // Streak broken, reset to 1
                this.dailyCheckinData.streak = 1;
            }
        } else {
            // First check-in
            this.dailyCheckinData.streak = 1;
        }

        this.dailyCheckinData.lastCheckinDate = today;
        this.dailyCheckinData.completedTasks = []; // Reset completed tasks for the new day
        this.dailyCheckinData.totalCheckins++;
        this.saveDailyCheckinData();

        // Award base check-in XP
        const xpEarned = VirtualPet.DAILY_CHECKIN_XP;
        this.addPoints(xpEarned);

        return { 
            success: true, 
            message: `签到成功！+${xpEarned}积分`, 
            xpEarned: xpEarned,
            streak: this.dailyCheckinData.streak
        };
    }

    // Get available daily tasks for today
    getDailyTasks() {
        const allTasks = VirtualPet.DAILY_TASKS;
        const completedToday = this.dailyCheckinData.completedTasks || [];
        
        return allTasks.map(task => ({
            ...task,
            completed: completedToday.includes(task.id)
        }));
    }

    // Complete a daily task and earn XP
    completeDailyTask(taskId) {
        const tasks = VirtualPet.DAILY_TASKS;
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return { success: false, message: '未知任务' };
        }

        // Initialize completed tasks array if not exists
        if (!this.dailyCheckinData.completedTasks) {
            this.dailyCheckinData.completedTasks = [];
        }

        // Check if already completed today
        if (this.dailyCheckinData.completedTasks.includes(taskId)) {
            return { success: false, message: '今天已经完成过这个任务了' };
        }

        // Mark task as completed
        this.dailyCheckinData.completedTasks.push(taskId);
        this.saveDailyCheckinData();

        // Award task XP
        const xpEarned = task.xp || VirtualPet.DAILY_TASK_XP;
        this.addPoints(xpEarned);

        return { 
            success: true, 
            message: `完成任务「${task.name}」！+${xpEarned}积分`,
            xpEarned: xpEarned,
            task: task
        };
    }

    // Check if a specific daily task is completed today
    isDailyTaskCompleted(taskId) {
        if (!this.dailyCheckinData.completedTasks) {
            return false;
        }
        return this.dailyCheckinData.completedTasks.includes(taskId);
    }

    // Get daily check-in status summary
    getDailyCheckinStatus() {
        const tasks = this.getDailyTasks();
        const completedCount = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        
        return {
            hasCheckedIn: this.hasCheckedInToday(),
            streak: this.dailyCheckinData.streak || 0,
            totalCheckins: this.dailyCheckinData.totalCheckins || 0,
            completedTasks: completedCount,
            totalTasks: totalTasks,
            tasks: tasks
        };
    }

    // Check and reset daily tasks if it's a new day
    checkDailyReset() {
        const today = this.getTodayDateString();
        const lastCheckin = this.dailyCheckinData.lastCheckinDate;
        
        // If we have a last check-in date and it's not today, reset completed tasks
        if (lastCheckin && lastCheckin !== today) {
            this.dailyCheckinData.completedTasks = [];
            this.saveDailyCheckinData();
        }
    }

    // ===== PET STATUS =====
    hasPet() {
        return this.petData.adopted && this.petData.pet !== null;
    }

    isPetAlive() {
        if (!this.hasPet()) return false;
        return !this.petData.pet.isDead;
    }

    checkPetStatus() {
        if (!this.hasPet()) return;

        const pet = this.petData.pet;
        if (pet.isDead) return;

        // Calculate hunger decrease since last fed (per minute)
        const now = Date.now();
        const lastFed = pet.lastFed || pet.adoptedAt;
        const minutesSinceLastFed = Math.floor((now - lastFed) / (1000 * 60));
        
        // Calculate expected hunger based on minutes since last fed
        // Hunger starts at MAX_HUNGER when fed, decreases by HUNGER_DECREASE_PER_MINUTE per minute
        const expectedHunger = VirtualPet.MAX_HUNGER - (minutesSinceLastFed * VirtualPet.HUNGER_DECREASE_PER_MINUTE);
        pet.hunger = Math.max(0, expectedHunger);
        
        // Check if pet has starved (hunger = 0 for long enough - now checked based on minutes)
        // Pet dies after reaching 0 hunger plus grace period
        // Use cached constant for minutes to zero hunger
        const deathThresholdMinutes = VirtualPet.MINUTES_TO_ZERO_HUNGER + VirtualPet.HUNGER_GRACE_PERIOD_MINUTES;
        if (pet.hunger <= 0 && minutesSinceLastFed >= deathThresholdMinutes) {
            pet.isDead = true;
            pet.deathDate = now;
            this.onPetDeath();
        }

        this.savePetData();
        this.updateUI();
    }

    // Start a timer that updates hunger every minute
    startHungerTimer() {
        // Clear any existing timer
        if (this.hungerTimerId) {
            clearInterval(this.hungerTimerId);
        }
        
        // Update hunger every minute (60000 ms)
        this.hungerTimerId = setInterval(() => {
            this.checkPetStatus();
        }, 60000);
    }

    // Stop the hunger timer (for cleanup)
    stopHungerTimer() {
        if (this.hungerTimerId) {
            clearInterval(this.hungerTimerId);
            this.hungerTimerId = null;
        }
    }

    // ===== PET ACTIONS =====
    adoptPet(petType) {
        if (this.hasPet()) {
            return { success: false, message: '你已经有一只宠物了！' };
        }

        const petTypeInfo = VirtualPet.PET_TYPES[petType];
        if (!petTypeInfo) {
            return { success: false, message: '未知的宠物类型' };
        }

        const now = Date.now();
        
        // Check if there's inherited data from a previous pet
        const inherited = this.inheritedPetData || {};
        const hasInheritedData = Object.keys(inherited).length > 0;
        
        this.petData = {
            adopted: true,
            pet: {
                type: petType,
                name: petTypeInfo.name,
                emoji: petTypeInfo.emoji,
                description: petTypeInfo.description,
                adoptedAt: now,
                lastFed: now,
                hunger: VirtualPet.MAX_HUNGER,
                attack: inherited.attack || 10,
                defense: inherited.defense || 10,
                intelligence: inherited.intelligence || 1,
                totalTasksCompleted: inherited.totalTasksCompleted || 0,
                totalPhotosUploaded: inherited.totalPhotosUploaded || 0,
                totalGamesCompleted: inherited.totalGamesCompleted || 0,
                totalXPSpent: inherited.totalXPSpent || 0,
                isDead: false,
                deathDate: null
            }
        };
        
        // Clear inherited data after use
        const hadInheritedData = hasInheritedData;
        this.inheritedPetData = null;

        this.savePetData();
        this.updateUI();
        this.showPetAnimation('adopted');

        const inheritMsg = hadInheritedData ? `（继承了之前宠物的所有成长数据，当前等级 ${this.getPetLevel()}）` : '';
        return { success: true, message: `恭喜你领养了${petTypeInfo.name}！${inheritMsg}` };
    }

    feedPet(points) {
        if (!this.hasPet()) {
            return { success: false, message: '你还没有宠物' };
        }

        if (!this.isPetAlive()) {
            return { success: false, message: '宠物已经死了，需要复活才能喂食' };
        }

        if (points < VirtualPet.FEED_COST) {
            return { success: false, message: `积分不足，当前积分: ${points}，喂食需要 ${VirtualPet.FEED_COST} 积分` };
        }

        const pet = this.petData.pet;
        const oldLevel = this.getPetLevel();
        
        pet.hunger = Math.min(VirtualPet.MAX_HUNGER, pet.hunger + 30);
        pet.lastFed = Date.now();
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.FEED_COST;

        this.savePetData();
        this.updateUI();
        this.showPetAnimation('fed');
        
        // Check for level up
        const newLevel = this.getPetLevel();
        if (newLevel > oldLevel) {
            this.onLevelUp(oldLevel, newLevel);
        }

        return { 
            success: true, 
            message: `${pet.name}吃饱了！`, 
            pointsUsed: VirtualPet.FEED_COST 
        };
    }

    upgradeAttack(points) {
        if (!this.isPetAlive()) {
            return { success: false, message: '宠物需要活着才能训练' };
        }

        if (points < VirtualPet.ATTACK_UPGRADE_COST) {
            return { success: false, message: `积分不足，当前积分: ${points}，需要 ${VirtualPet.ATTACK_UPGRADE_COST} 积分` };
        }

        const pet = this.petData.pet;
        const oldLevel = this.getPetLevel();
        
        pet.attack += 5;
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.ATTACK_UPGRADE_COST;

        this.savePetData();
        this.updateUI();
        this.showPetAnimation('trained');
        
        // Check for level up
        const newLevel = this.getPetLevel();
        if (newLevel > oldLevel) {
            this.onLevelUp(oldLevel, newLevel);
        }

        return { 
            success: true, 
            message: `${pet.name}的攻击力提升了！现在攻击: ${pet.attack}`,
            pointsUsed: VirtualPet.ATTACK_UPGRADE_COST
        };
    }

    upgradeDefense(points) {
        if (!this.isPetAlive()) {
            return { success: false, message: '宠物需要活着才能训练' };
        }

        if (points < VirtualPet.DEFENSE_UPGRADE_COST) {
            return { success: false, message: `积分不足，当前积分: ${points}，需要 ${VirtualPet.DEFENSE_UPGRADE_COST} 积分` };
        }

        const pet = this.petData.pet;
        const oldLevel = this.getPetLevel();
        
        pet.defense += 5;
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.DEFENSE_UPGRADE_COST;

        this.savePetData();
        this.updateUI();
        this.showPetAnimation('trained');
        
        // Check for level up
        const newLevel = this.getPetLevel();
        if (newLevel > oldLevel) {
            this.onLevelUp(oldLevel, newLevel);
        }

        return { 
            success: true, 
            message: `${pet.name}的防御力提升了！现在防御: ${pet.defense}`,
            pointsUsed: VirtualPet.DEFENSE_UPGRADE_COST
        };
    }

    revivePet(points) {
        if (!this.hasPet()) {
            return { success: false, message: '你还没有宠物' };
        }

        if (this.isPetAlive()) {
            return { success: false, message: '宠物还活着，不需要复活' };
        }

        if (points < VirtualPet.REVIVE_COST) {
            return { success: false, message: `积分不足，当前积分: ${points}，复活需要 ${VirtualPet.REVIVE_COST} 积分` };
        }

        const pet = this.petData.pet;
        const oldLevel = this.getPetLevel();
        
        pet.isDead = false;
        pet.deathDate = null;
        pet.hunger = VirtualPet.MAX_HUNGER / 2; // Revive with half hunger
        pet.lastFed = Date.now();
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.REVIVE_COST;

        this.savePetData();
        this.updateUI();
        this.showPetAnimation('revived');
        
        // Check for level up
        const newLevel = this.getPetLevel();
        if (newLevel > oldLevel) {
            this.onLevelUp(oldLevel, newLevel);
        }

        return { 
            success: true, 
            message: `${pet.name}复活了！记得经常喂食哦！`,
            pointsUsed: VirtualPet.REVIVE_COST
        };
    }

    resetPet(points) {
        if (!this.hasPet()) {
            return { success: false, message: '你还没有宠物' };
        }

        if (points < VirtualPet.RESET_COST) {
            return { success: false, message: `积分不足，当前积分: ${points}，换宠物需要 ${VirtualPet.RESET_COST} 积分` };
        }

        // Save inherited data from old pet before clearing
        const oldPet = this.petData.pet;
        const oldPetName = oldPet.name;
        this.inheritedPetData = {
            attack: oldPet.attack || 10,
            defense: oldPet.defense || 10,
            intelligence: oldPet.intelligence || 1,
            totalTasksCompleted: oldPet.totalTasksCompleted || 0,
            totalPhotosUploaded: oldPet.totalPhotosUploaded || 0,
            totalGamesCompleted: oldPet.totalGamesCompleted || 0,
            totalXPSpent: oldPet.totalXPSpent || 0
        };

        // Clear current pet data to allow adopting a new one
        this.petData = {
            adopted: false,
            pet: null
        };

        this.savePetData();
        this.updateUI();

        return { 
            success: true, 
            message: `已与${oldPetName}告别，新宠物将继承所有成长数据！`,
            pointsUsed: VirtualPet.RESET_COST
        };
    }

    // Called when a task is completed
    onTaskCompleted() {
        if (!this.isPetAlive()) return;

        const pet = this.petData.pet;
        pet.totalTasksCompleted++;
        pet.intelligence += VirtualPet.INTELLIGENCE_PER_TASK;

        this.savePetData();
        this.showPetWithMessage('太棒了！继续加油！');
        
        // Show level-appropriate celebration animation
        this.playCelebrationAnimation();
    }

    // Called when a photo is uploaded
    onPhotoUploaded() {
        if (!this.isPetAlive()) return;

        const pet = this.petData.pet;
        pet.totalPhotosUploaded++;

        this.savePetData();
        this.showPetWithMessage('好照片！主人真厉害！');
        
        // Show level-appropriate celebration animation
        this.playCelebrationAnimation();
    }
    
    // Called when a game is completed
    onGameCompleted(gameType, score = 0, time = 0) {
        if (!this.isPetAlive()) return;

        const pet = this.petData.pet;
        pet.totalGamesCompleted = (pet.totalGamesCompleted || 0) + 1;
        
        // Calculate XP reward based on game type and performance
        const xpEarned = this.calculateGameXP(gameType, score, time);
        
        this.savePetData();
        
        // Show celebration message with XP earned
        const gameReward = VirtualPet.GAME_XP_REWARDS[gameType];
        const gameName = gameReward ? gameReward.name : '游戏';
        this.showPetWithMessage(`🎮 ${gameName}通关！+${xpEarned}积分！`, 4000);
        
        // Show special level-appropriate celebration animation
        this.playCelebrationAnimation('game-complete');
        
        return xpEarned;
    }
    
    // Calculate XP reward for game completion
    calculateGameXP(gameType, score = 0, time = 0) {
        const rewards = VirtualPet.GAME_XP_REWARDS;
        const gameReward = rewards[gameType];
        
        if (!gameReward) {
            return 10; // Default XP for unknown games
        }
        
        if (gameReward.base) {
            // Fixed reward games (puzzle, maze)
            return gameReward.base;
        }
        
        if (gameReward.timeBonus) {
            // Time-based reward (minesweeper)
            const bonusXP = Math.floor((100 - Math.min(time, 100)) * 0.3);
            return Math.max(gameReward.min, Math.min(gameReward.max, bonusXP));
        }
        
        // Score-based reward (shooting, space-invaders, tank-battle)
        const scoreXP = Math.floor(score / gameReward.divisor);
        return Math.max(gameReward.min, Math.min(gameReward.max, scoreXP));
    }
    
    // ===== PET LEVEL SYSTEM =====
    getPetLevel() {
        if (!this.hasPet()) return 1;
        
        const pet = this.petData.pet;
        const xpSpent = pet.totalXPSpent || 0;
        const levels = VirtualPet.PET_LEVELS;
        
        let currentLevel = 1;
        for (const levelData of levels) {
            if (xpSpent >= levelData.xpRequired) {
                currentLevel = levelData.level;
            } else {
                break;
            }
        }
        
        return currentLevel;
    }
    
    getPetLevelInfo() {
        const level = this.getPetLevel();
        const levels = VirtualPet.PET_LEVELS;
        const levelData = levels.find(l => l.level === level) || levels[0];
        
        const nextLevelData = levels.find(l => l.level === level + 1);
        const pet = this.petData.pet;
        const xpSpent = pet ? (pet.totalXPSpent || 0) : 0;
        
        return {
            level: levelData.level,
            name: levelData.name,
            animation: levelData.animation,
            xpSpent: xpSpent,
            xpToNextLevel: nextLevelData ? (nextLevelData.xpRequired - xpSpent) : 0,
            nextLevelXP: nextLevelData ? nextLevelData.xpRequired : null,
            isMaxLevel: !nextLevelData
        };
    }
    
    // Get pet emoji based on current level
    getPetEmoji() {
        if (!this.hasPet()) return '🐾';
        
        const pet = this.petData.pet;
        const petType = VirtualPet.PET_TYPES[pet.type];
        if (!petType) return pet.emoji;
        
        const level = this.getPetLevel();
        const levelEmojis = petType.levelEmojis || [petType.emoji];
        
        // Get emoji for current level (0-indexed array)
        const emojiIndex = Math.min(level - 1, levelEmojis.length - 1);
        return levelEmojis[emojiIndex] || petType.emoji;
    }
    
    onLevelUp(oldLevel, newLevel) {
        const levelInfo = this.getPetLevelInfo();
        const pet = this.petData.pet;
        
        // Show level up notification
        this.showPetWithMessage(`🎉 升级！${pet.name}现在是 ${levelInfo.name} (Lv.${newLevel})！`, 5000);
        
        // Play special level up animation
        this.playLevelUpAnimation(oldLevel, newLevel);
        
        // Update floating pet emoji
        this.updateFloatingPet();
    }
    
    // ===== LEVEL-BASED ANIMATIONS =====
    playCelebrationAnimation(type = 'task') {
        const level = this.getPetLevel();
        const levelInfo = this.getPetLevelInfo();
        
        // Get the celebration container or create one
        let celebrationContainer = document.getElementById('pet-celebration-overlay');
        if (!celebrationContainer) {
            celebrationContainer = document.createElement('div');
            celebrationContainer.id = 'pet-celebration-overlay';
            celebrationContainer.className = 'pet-celebration-overlay';
            document.body.appendChild(celebrationContainer);
        }
        
        // Clear any existing animation
        if (this.celebrationAnimationId) {
            cancelAnimationFrame(this.celebrationAnimationId);
        }
        celebrationContainer.innerHTML = '';
        
        // Create animation based on pet level
        switch (levelInfo.animation) {
            case 'fireworks-dance':
                this.createFireworksDanceAnimation(celebrationContainer, type);
                break;
            case 'rainbow-flip':
                this.createRainbowFlipAnimation(celebrationContainer, type);
                break;
            case 'glow-spin':
                this.createGlowSpinAnimation(celebrationContainer, type);
                break;
            case 'spin':
                this.createSpinAnimation(celebrationContainer, type);
                break;
            default:
                this.createBounceAnimation(celebrationContainer, type);
        }
        
        // Remove animation after duration
        const duration = type === 'game-complete' ? 3000 : 2000;
        setTimeout(() => {
            celebrationContainer.innerHTML = '';
        }, duration);
    }
    
    createBounceAnimation(container, type) {
        const emoji = this.getPetEmoji();
        container.innerHTML = `
            <div class="pet-celebration pet-bounce-anim level-1">
                <span class="celebration-pet">${emoji}</span>
            </div>
        `;
    }
    
    createSpinAnimation(container, type) {
        const emoji = this.getPetEmoji();
        container.innerHTML = `
            <div class="pet-celebration pet-spin-anim level-2">
                <span class="celebration-pet">${emoji}</span>
                <span class="celebration-sparkle">✨</span>
            </div>
        `;
    }
    
    createGlowSpinAnimation(container, type) {
        const emoji = this.getPetEmoji();
        container.innerHTML = `
            <div class="pet-celebration pet-glow-spin-anim level-3">
                <span class="celebration-pet">${emoji}</span>
                <span class="celebration-sparkle sparkle-1">✨</span>
                <span class="celebration-sparkle sparkle-2">⭐</span>
                <div class="glow-ring"></div>
            </div>
        `;
    }
    
    createRainbowFlipAnimation(container, type) {
        const emoji = this.getPetEmoji();
        container.innerHTML = `
            <div class="pet-celebration pet-rainbow-flip-anim level-4">
                <span class="celebration-pet">${emoji}</span>
                <span class="celebration-sparkle sparkle-1">✨</span>
                <span class="celebration-sparkle sparkle-2">⭐</span>
                <span class="celebration-sparkle sparkle-3">💫</span>
                <div class="rainbow-trail"></div>
            </div>
        `;
    }
    
    createFireworksDanceAnimation(container, type) {
        const emoji = this.getPetEmoji();
        container.innerHTML = `
            <div class="pet-celebration pet-fireworks-dance-anim level-5">
                <span class="celebration-pet">${emoji}</span>
                <span class="firework-particle p1">🎆</span>
                <span class="firework-particle p2">🎇</span>
                <span class="firework-particle p3">✨</span>
                <span class="firework-particle p4">⭐</span>
                <span class="firework-particle p5">💫</span>
                <span class="firework-particle p6">🌟</span>
                <div class="rainbow-trail"></div>
                <div class="glow-ring glow-rainbow"></div>
            </div>
        `;
    }
    
    playLevelUpAnimation(oldLevel, newLevel) {
        let celebrationContainer = document.getElementById('pet-celebration-overlay');
        if (!celebrationContainer) {
            celebrationContainer = document.createElement('div');
            celebrationContainer.id = 'pet-celebration-overlay';
            celebrationContainer.className = 'pet-celebration-overlay';
            document.body.appendChild(celebrationContainer);
        }
        
        const emoji = this.getPetEmoji();
        const levelInfo = this.getPetLevelInfo();
        
        celebrationContainer.innerHTML = `
            <div class="pet-level-up-celebration">
                <div class="level-up-glow"></div>
                <span class="level-up-pet">${emoji}</span>
                <div class="level-up-text">
                    <span class="level-up-title">🎉 升级！</span>
                    <span class="level-up-level">Lv.${newLevel} ${levelInfo.name}</span>
                </div>
                <div class="level-up-particles">
                    <span class="particle p1">⭐</span>
                    <span class="particle p2">✨</span>
                    <span class="particle p3">🌟</span>
                    <span class="particle p4">💫</span>
                    <span class="particle p5">🎆</span>
                    <span class="particle p6">🎇</span>
                </div>
            </div>
        `;
        
        // Remove after animation
        setTimeout(() => {
            celebrationContainer.innerHTML = '';
        }, 4000);
    }

    // ===== UI MANAGEMENT =====
    initializeUI() {
        // Create pet container if it doesn't exist
        if (!document.getElementById('virtual-pet-container')) {
            const container = document.createElement('div');
            container.id = 'virtual-pet-container';
            container.className = 'virtual-pet-container';
            container.innerHTML = this.getPetHTML();
            document.body.appendChild(container);
        }

        this.bindEvents();
        this.updateUI();
    }

    getPetHTML() {
        return `
            <div class="virtual-pet-panel" id="petPanelOverlay">
                <div class="virtual-pet-panel-inner">
                    <div class="pet-header">
                        <span class="pet-title">🐾 我的宠物</span>
                        <button class="pet-close-btn" id="petCloseBtn">×</button>
                    </div>
                    <div class="pet-content" id="petContent">
                        <!-- Content will be populated dynamically -->
                    </div>
                </div>
            </div>
            <div class="pet-floating" id="petFloating">
                <!-- Floating pet icon that shows on points change -->
            </div>
        `;
    }

    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('petCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePetPanel());
        }

        // Floating pet click to open panel
        const floating = document.getElementById('petFloating');
        if (floating) {
            floating.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePetPanel();
            });
        }
        
        // Click overlay background to close panel
        const overlay = document.getElementById('petPanelOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                // Only close if clicking the overlay itself, not the inner content
                if (e.target === overlay) {
                    this.hidePetPanel();
                }
            });
        }
    }

    updateUI() {
        const petContent = document.getElementById('petContent');
        if (!petContent) return;

        if (!this.hasPet()) {
            petContent.innerHTML = this.getAdoptionHTML();
            this.bindAdoptionEvents();
        } else if (!this.isPetAlive()) {
            petContent.innerHTML = this.getDeadPetHTML();
            this.bindDeadPetEvents();
        } else {
            petContent.innerHTML = this.getAlivePetHTML();
            this.bindAlivePetEvents();
        }

        // Update floating pet
        this.updateFloatingPet();
    }

    getAdoptionHTML() {
        const petOptions = Object.entries(VirtualPet.PET_TYPES).map(([type, info]) => `
            <button class="pet-adopt-btn" data-pet-type="${type}">
                <span class="pet-emoji">${info.emoji}</span>
                <span class="pet-name">${info.name}</span>
            </button>
        `).join('');

        return `
            <div class="pet-adoption">
                <div class="adoption-title">🎁 领养一只宠物吧！</div>
                <div class="adoption-desc">完成任务获得积分，照顾你的小伙伴</div>
                <div class="pet-options">
                    ${petOptions}
                </div>
            </div>
        `;
    }

    getDeadPetHTML() {
        const pet = this.petData.pet;
        return `
            <div class="pet-dead">
                <div class="pet-dead-emoji">😢</div>
                <div class="pet-dead-name">${pet.name}</div>
                <div class="pet-dead-message">你的宠物因为太久没有喂食离开了...</div>
                <div class="pet-dead-actions">
                    <button class="pet-action-btn revive-btn" id="revivePetBtn">
                        💫 复活 (${VirtualPet.REVIVE_COST}积分)
                    </button>
                    <button class="pet-action-btn reset-btn" id="resetPetBtnDead">
                        🔄 换宠物 (${VirtualPet.RESET_COST}积分)
                    </button>
                </div>
                <div class="pet-dead-note">复活当前宠物或换一只新宠物（继承成长数据）</div>
            </div>
        `;
    }

    getAlivePetHTML() {
        const pet = this.petData.pet;
        const hungerPercent = Math.round(pet.hunger);
        const hungerStatus = hungerPercent > 70 ? '饱' : hungerPercent > 30 ? '一般' : '饿';
        const hungerClass = hungerPercent > 70 ? 'full' : hungerPercent > 30 ? 'normal' : 'hungry';
        
        // Get level information
        const levelInfo = this.getPetLevelInfo();
        const petEmoji = this.getPetEmoji();
        const levelProgressPercent = levelInfo.isMaxLevel 
            ? 100 
            : Math.round(((levelInfo.xpSpent - (VirtualPet.PET_LEVELS[levelInfo.level - 1]?.xpRequired || 0)) / 
                         (levelInfo.nextLevelXP - (VirtualPet.PET_LEVELS[levelInfo.level - 1]?.xpRequired || 0))) * 100);
        
        // Get current points
        const currentPoints = this.getCurrentPoints();

        return `
            <div class="pet-alive">
                <!-- Points Display -->
                <div class="pet-points-display">
                    <span class="points-icon">⭐</span>
                    <span class="points-value">${currentPoints}</span>
                    <span class="points-label">积分</span>
                </div>
                
                <div class="pet-display">
                    <span class="pet-main-emoji ${this.isVisible ? 'pet-bounce' : ''}">${petEmoji}</span>
                    <div class="pet-name-display">${pet.name}</div>
                    <div class="pet-level-badge level-${levelInfo.level}">
                        Lv.${levelInfo.level} ${levelInfo.name}
                    </div>
                </div>
                
                <!-- Level Progress Bar -->
                <div class="pet-level-progress">
                    <div class="level-progress-label">
                        <span>等级进度</span>
                        <span>${levelInfo.isMaxLevel ? '满级' : `还需 ${levelInfo.xpToNextLevel} 积分`}</span>
                    </div>
                    <div class="level-progress-bar">
                        <div class="level-progress-fill level-${levelInfo.level}" style="width: ${levelProgressPercent}%"></div>
                    </div>
                </div>
                
                <div class="pet-stats">
                    <div class="pet-stat">
                        <span class="stat-icon">🍖</span>
                        <div class="stat-bar">
                            <div class="stat-fill hunger-fill ${hungerClass}" style="width: ${hungerPercent}%"></div>
                        </div>
                        <span class="stat-value">${hungerStatus}</span>
                    </div>
                    <div class="pet-stat-row">
                        <div class="pet-stat-item">
                            <span class="stat-icon">⚔️</span>
                            <span class="stat-value">${pet.attack}</span>
                        </div>
                        <div class="pet-stat-item">
                            <span class="stat-icon">🛡️</span>
                            <span class="stat-value">${pet.defense}</span>
                        </div>
                        <div class="pet-stat-item">
                            <span class="stat-icon">🧠</span>
                            <span class="stat-value">${pet.intelligence}</span>
                        </div>
                        <div class="pet-stat-item">
                            <span class="stat-icon">🎮</span>
                            <span class="stat-value">${pet.totalGamesCompleted || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="pet-actions">
                    <button class="pet-action-btn feed-btn" id="feedPetBtn">
                        🍖 喂食 (${VirtualPet.FEED_COST})
                    </button>
                    <button class="pet-action-btn attack-btn" id="upgradeAttackBtn">
                        ⚔️ 攻击 (${VirtualPet.ATTACK_UPGRADE_COST})
                    </button>
                    <button class="pet-action-btn defense-btn" id="upgradeDefenseBtn">
                        🛡️ 防御 (${VirtualPet.DEFENSE_UPGRADE_COST})
                    </button>
                </div>
                
                <div class="pet-reset-section">
                    <button class="pet-action-btn reset-btn" id="resetPetBtn">
                        🔄 换宠物 (${VirtualPet.RESET_COST})
                    </button>
                    <div class="pet-reset-note">换一只新宠物，继承所有成长数据</div>
                </div>
                
                <div class="pet-message" id="petMessage"></div>
            </div>
        `;
    }

    bindAdoptionEvents() {
        document.querySelectorAll('.pet-adopt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const petType = e.currentTarget.dataset.petType;
                const result = this.adoptPet(petType);
                if (result.success) {
                    this.showPetMessage(result.message);
                } else {
                    alert(result.message);
                }
            });
        });
    }

    bindDeadPetEvents() {
        const reviveBtn = document.getElementById('revivePetBtn');
        if (reviveBtn) {
            reviveBtn.addEventListener('click', () => {
                const points = this.getCurrentPoints();
                const result = this.revivePet(points);
                if (result.success) {
                    this.deductPoints(result.pointsUsed);
                    this.showPetMessage(result.message);
                } else {
                    alert(result.message);
                }
            });
        }

        const resetBtn = document.getElementById('resetPetBtnDead');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('确定要换一只新宠物吗？当前宠物将永久消失。')) {
                    const points = this.getCurrentPoints();
                    const result = this.resetPet(points);
                    if (result.success) {
                        this.deductPoints(result.pointsUsed);
                        this.showPetMessage(result.message);
                    } else {
                        alert(result.message);
                    }
                }
            });
        }
    }

    bindAlivePetEvents() {
        const feedBtn = document.getElementById('feedPetBtn');
        const attackBtn = document.getElementById('upgradeAttackBtn');
        const defenseBtn = document.getElementById('upgradeDefenseBtn');

        if (feedBtn) {
            feedBtn.addEventListener('click', () => {
                const points = this.getCurrentPoints();
                const result = this.feedPet(points);
                if (result.success) {
                    this.deductPoints(result.pointsUsed);
                    this.showPetMessage(result.message);
                } else {
                    alert(result.message);
                }
            });
        }

        if (attackBtn) {
            attackBtn.addEventListener('click', () => {
                const points = this.getCurrentPoints();
                const result = this.upgradeAttack(points);
                if (result.success) {
                    this.deductPoints(result.pointsUsed);
                    this.showPetMessage(result.message);
                } else {
                    alert(result.message);
                }
            });
        }

        if (defenseBtn) {
            defenseBtn.addEventListener('click', () => {
                const points = this.getCurrentPoints();
                const result = this.upgradeDefense(points);
                if (result.success) {
                    this.deductPoints(result.pointsUsed);
                    this.showPetMessage(result.message);
                } else {
                    alert(result.message);
                }
            });
        }

        const resetBtn = document.getElementById('resetPetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('确定要换一只新宠物吗？当前宠物将永久消失。')) {
                    const points = this.getCurrentPoints();
                    const result = this.resetPet(points);
                    if (result.success) {
                        this.deductPoints(result.pointsUsed);
                        this.showPetMessage(result.message);
                    } else {
                        alert(result.message);
                    }
                }
            });
        }
    }

    updateFloatingPet() {
        const floating = document.getElementById('petFloating');
        if (!floating) return;

        const currentPoints = this.getCurrentPoints();

        if (this.hasPet() && this.isPetAlive()) {
            // Use level-based emoji and show points
            const petEmoji = this.getPetEmoji();
            floating.innerHTML = `
                <span class="floating-pet-emoji">${petEmoji}</span>
                <span class="floating-pet-points">${currentPoints}</span>
            `;
            floating.style.display = 'block';
        } else if (this.hasPet() && !this.isPetAlive()) {
            floating.innerHTML = `
                <span class="floating-pet-emoji dead">😢</span>
                <span class="floating-pet-points">${currentPoints}</span>
            `;
            floating.style.display = 'block';
        } else {
            floating.innerHTML = `
                <span class="floating-pet-emoji">🐾</span>
                <span class="floating-pet-points">${currentPoints}</span>
            `;
            floating.style.display = 'block';
        }
    }

    // ===== ANIMATIONS & VISIBILITY =====
    showPetPanel() {
        const container = document.getElementById('virtual-pet-container');
        if (container) {
            container.classList.add('show-panel');
        }
    }

    hidePetPanel() {
        const container = document.getElementById('virtual-pet-container');
        if (container) {
            container.classList.remove('show-panel');
        }
    }

    togglePetPanel() {
        const container = document.getElementById('virtual-pet-container');
        if (container) {
            container.classList.toggle('show-panel');
        }
    }

    // Show pet with temporary message when points change
    showPetWithMessage(message, duration = 3000) {
        if (!this.isPetAlive()) return;

        this.isVisible = true;
        const container = document.getElementById('virtual-pet-container');
        const floating = document.getElementById('petFloating');
        
        if (floating) {
            floating.classList.add('pet-active');
        }

        this.showPetMessage(message);
        this.updateUI(); // Update to show bounce animation

        // Clear existing timeout
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }

        // Hide after duration
        this.animationTimeout = setTimeout(() => {
            this.isVisible = false;
            if (floating) {
                floating.classList.remove('pet-active');
            }
            this.updateUI();
        }, duration);
    }

    showPetMessage(message) {
        const messageEl = document.getElementById('petMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.classList.add('show');
            setTimeout(() => {
                messageEl.classList.remove('show');
            }, 2500);
        }
    }

    showPetAnimation(type) {
        const floating = document.getElementById('petFloating');
        if (!floating) return;

        floating.classList.add(`pet-${type}`);
        setTimeout(() => {
            floating.classList.remove(`pet-${type}`);
        }, 1000);
    }

    onPetDeath() {
        // Show sad animation
        this.showPetAnimation('death');
        
        // Show notification
        setTimeout(() => {
            if (this.hasPet()) {
                alert(`😢 很抱歉，${this.petData.pet.name}因为太久没有喂食离开了...你可以用积分复活它。`);
            }
        }, 500);
    }

    // ===== POINTS INTEGRATION =====
    // These methods integrate with the main app's gamification system
    getCurrentPoints() {
        // Get current points from the achievement gamification system
        if (window.achievementGamification) {
            const xpProgress = window.achievementGamification.getXPProgress();
            return xpProgress.totalXP || 0;
        }
        
        // Fallback to localStorage
        try {
            const data = localStorage.getItem('museumcheck_xp_data');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.totalXP || 0;
            }
        } catch (error) {
            console.error('Failed to get current points:', error);
        }
        
        return 0;
    }

    deductPoints(amount) {
        // Deduct points by directly modifying localStorage
        // Note: We don't use addXP(-amount) because the XP system may not handle negative values
        try {
            const data = localStorage.getItem('museumcheck_xp_data');
            if (data) {
                const parsed = JSON.parse(data);
                parsed.totalXP = Math.max(0, (parsed.totalXP || 0) - amount);
                localStorage.setItem('museumcheck_xp_data', JSON.stringify(parsed));
                
                // If achievement gamification exists, sync its internal state
                if (window.achievementGamification) {
                    window.achievementGamification.xpData = parsed;
                }
                return true;
            }
        } catch (error) {
            console.error('Failed to deduct points:', error);
        }
        
        return false;
    }

    addPoints(amount) {
        // Add points through the achievement gamification system
        if (window.achievementGamification) {
            window.achievementGamification.addXP(amount);
            return true;
        }
        
        return false;
    }

    // ===== PET ADOPTION PROMPT =====
    // Show a prompt to encourage pet adoption
    showPetAdoptionPrompt(reason = 'general') {
        // Only show if user doesn't have a pet
        if (this.hasPet()) return;
        
        // NEW: Only show when user has accumulated some points (minimum 10 XP)
        // This prevents the prompt from appearing immediately for brand new users
        const currentPoints = this.getCurrentPoints();
        const MINIMUM_POINTS_FOR_PROMPT = 10;
        
        if (currentPoints < MINIMUM_POINTS_FOR_PROMPT) {
            return; // Don't show prompt if user has insufficient points
        }
        
        // Don't show prompt too frequently - use sessionStorage to track
        const lastPromptKey = 'virtualPetPromptShown';
        const lastPromptTime = sessionStorage.getItem(lastPromptKey);
        const now = Date.now();
        const cooldownMs = 5 * 60 * 1000; // 5 minute cooldown between prompts
        
        if (lastPromptTime && (now - parseInt(lastPromptTime)) < cooldownMs) {
            return; // Skip if shown recently
        }
        
        // Create prompt message based on reason
        let message = '';
        let title = '🐾 来领养一只宠物吧！';
        
        switch (reason) {
            case 'checkin':
                message = '完成任务可以获得积分，用积分养一只可爱的小宠物陪你一起探索博物馆吧！';
                break;
            case 'xp_gain':
                message = '你刚刚获得了积分！领养一只宠物，用积分喂养它，看它成长吧！';
                break;
            default:
                message = '领养一只宠物，完成任务获得积分来喂养它，让它陪你一起探索博物馆！';
        }
        
        // Create and show the prompt modal
        this.showAdoptionPromptModal(title, message);
        
        // Record that we showed the prompt
        sessionStorage.setItem(lastPromptKey, now.toString());
    }
    
    showAdoptionPromptModal(title, message) {
        // Remove any existing prompt
        const existingPrompt = document.getElementById('pet-adoption-prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }
        
        // Escape HTML to prevent XSS (even though title/message are hardcoded, this is best practice)
        const escapeHtml = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };
        
        // Create the prompt element
        const prompt = document.createElement('div');
        prompt.id = 'pet-adoption-prompt';
        prompt.className = 'pet-adoption-prompt';
        prompt.innerHTML = `
            <div class="pet-adoption-prompt-content">
                <button class="pet-adoption-prompt-close" aria-label="关闭">×</button>
                <div class="pet-adoption-prompt-icon">🐾</div>
                <div class="pet-adoption-prompt-title">${escapeHtml(title)}</div>
                <div class="pet-adoption-prompt-message">${escapeHtml(message)}</div>
                <div class="pet-adoption-prompt-buttons">
                    <button class="pet-adoption-prompt-btn primary" id="petAdoptNowBtn">去领养</button>
                    <button class="pet-adoption-prompt-btn secondary" id="petAdoptLaterBtn">稍后再说</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Show with animation
        setTimeout(() => {
            prompt.classList.add('show');
        }, 10);
        
        // Bind events - elements are guaranteed to exist since we just created them
        const adoptNowBtn = document.getElementById('petAdoptNowBtn');
        const adoptLaterBtn = document.getElementById('petAdoptLaterBtn');
        const closeBtn = prompt.querySelector('.pet-adoption-prompt-close');
        
        const closePrompt = () => {
            prompt.classList.remove('show');
            setTimeout(() => {
                prompt.remove();
            }, 300);
        };
        
        adoptNowBtn.addEventListener('click', () => {
            closePrompt();
            // Open the pet panel to show adoption options
            this.showPetPanel();
        });
        
        adoptLaterBtn.addEventListener('click', closePrompt);
        closeBtn.addEventListener('click', closePrompt);
        
        // Click outside to close
        prompt.addEventListener('click', (e) => {
            if (e.target === prompt) {
                closePrompt();
            }
        });
    }
    
    // Static method to show pet adoption prompt (for external calls)
    static showAdoptionPromptIfNeeded(reason = 'general') {
        if (window.virtualPet) {
            window.virtualPet.showPetAdoptionPrompt(reason);
        }
    }

    // ===== PUBLIC API FOR INTEGRATION =====
    // Call when task is completed (from main app)
    static notifyTaskCompleted() {
        if (window.virtualPet) {
            window.virtualPet.onTaskCompleted();
        }
    }

    // Call when photo is uploaded (from main app)
    static notifyPhotoUploaded() {
        if (window.virtualPet) {
            window.virtualPet.onPhotoUploaded();
        }
    }
    
    // Call when game is completed (from museum-checkin page)
    static notifyGameCompleted(gameType, score = 0, time = 0) {
        if (window.virtualPet) {
            return window.virtualPet.onGameCompleted(gameType, score, time);
        }
        return 0;
    }

    // Check if child mode is active
    static isChildModeActive() {
        return document.body.classList.contains('child-mode');
    }
}

// Initialize virtual pet when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize if child mode toggle exists (main page) or if child mode is enabled (checkin page)
    const childModeToggle = document.getElementById('childModeToggle');
    const childModeEnabled = localStorage.getItem('childModeEnabled') === 'true';
    // Also check if we're on a checkin page (museum-checkin.html) - this page is specifically for kids
    const isCheckinPage = window.location.pathname.endsWith('museum-checkin.html');
    
    if (childModeToggle || childModeEnabled || isCheckinPage) {
        window.virtualPet = new VirtualPet();
    }
});

// Make class available globally
if (typeof window !== 'undefined') {
    window.VirtualPet = VirtualPet;
}
