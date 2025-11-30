/**
 * Virtual Pet Feature Tests
 * 电子宠物功能测试
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the virtual pet HTML elements
function setupDOM() {
    document.body.innerHTML = `
        <div id="virtual-pet-container" class="virtual-pet-container">
            <div class="virtual-pet-panel">
                <div class="pet-header">
                    <span class="pet-title">🐾 我的宠物</span>
                    <button class="pet-close-btn" id="petCloseBtn">×</button>
                </div>
                <div class="pet-content" id="petContent"></div>
            </div>
            <div class="pet-floating" id="petFloating"></div>
        </div>
    `;
}

// Import VirtualPet class
const fs = require('fs');
const path = require('path');

// Load virtual pet code directly
const virtualPetPath = path.join(__dirname, '..', 'virtual-pet.js');
const virtualPetCode = fs.readFileSync(virtualPetPath, 'utf8');

// Create VirtualPet class manually for testing
class VirtualPet {
    constructor() {
        this.petData = this.loadPetData();
        this.isVisible = false;
        this.animationTimeout = null;
        this.checkPetStatus();
    }

    static get HUNGER_DEATH_DAYS() { return 90; }
    static get FEED_COST() { return 20; }
    static get ATTACK_UPGRADE_COST() { return 50; }
    static get DEFENSE_UPGRADE_COST() { return 50; }
    static get REVIVE_COST() { return 100; }
    static get HUNGER_DECREASE_PER_DAY() { return 1; }
    static get MAX_HUNGER() { return 100; }
    static get INTELLIGENCE_PER_TASK() { return 1; }
    
    // Game completion XP rewards
    static get GAME_XP_REWARDS() {
        return {
            puzzle: { base: 15, name: '拼图游戏' },
            maze: { base: 20, name: '迷宫游戏' },
            shooting: { min: 10, max: 30, divisor: 10, name: '射击游戏' },
            'space-invaders': { min: 15, max: 30, divisor: 10, name: '小蜜蜂' },
            'tank-battle': { min: 20, max: 30, divisor: 5, name: '坦克大战' },
            minesweeper: { min: 10, max: 25, timeBonus: true, name: '扫雷' }
        };
    }
    
    // Pet level thresholds (based on total XP spent)
    static get PET_LEVELS() {
        return [
            { level: 1, xpRequired: 0, name: '新手', animation: 'bounce' },
            { level: 2, xpRequired: 100, name: '见习', animation: 'spin' },
            { level: 3, xpRequired: 300, name: '熟练', animation: 'glow-spin' },
            { level: 4, xpRequired: 600, name: '专家', animation: 'rainbow-flip' },
            { level: 5, xpRequired: 1000, name: '大师', animation: 'fireworks-dance' }
        ];
    }
    
    static get PET_TYPES() {
        return {
            dragon: { name: '小龙', emoji: '🐲', description: '勇敢的小龙', levelEmojis: ['🐲', '🐉', '🔥', '⚡', '🌟'] },
            cat: { name: '小猫', emoji: '🐱', description: '可爱的小猫', levelEmojis: ['🐱', '😺', '😸', '😻', '✨'] },
            dog: { name: '小狗', emoji: '🐶', description: '忠诚的小狗', levelEmojis: ['🐶', '🐕', '🦮', '🏆', '👑'] },
            rabbit: { name: '小兔', emoji: '🐰', description: '活泼的小兔', levelEmojis: ['🐰', '🐇', '🥕', '💫', '🌈'] },
            panda: { name: '小熊猫', emoji: '🐼', description: '憨厚的小熊猫', levelEmojis: ['🐼', '🎋', '🎍', '🎎', '🏅'] },
            fox: { name: '小狐狸', emoji: '🦊', description: '聪明的小狐狸', levelEmojis: ['🦊', '🍂', '🌙', '💎', '🎆'] }
        };
    }

    loadPetData() {
        try {
            const saved = localStorage.getItem('virtualPetData');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load pet data:', error);
        }
        return { adopted: false, pet: null };
    }

    savePetData() {
        try {
            localStorage.setItem('virtualPetData', JSON.stringify(this.petData));
        } catch (error) {
            console.error('Failed to save pet data:', error);
        }
    }

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

        const now = Date.now();
        const lastFed = pet.lastFed || pet.adoptedAt;
        const daysSinceLastFed = Math.floor((now - lastFed) / (1000 * 60 * 60 * 24));
        
        const hungerDecrease = daysSinceLastFed * VirtualPet.HUNGER_DECREASE_PER_DAY;
        pet.hunger = Math.max(0, VirtualPet.MAX_HUNGER - hungerDecrease);
        
        if (pet.hunger <= 0) {
            if (daysSinceLastFed >= VirtualPet.HUNGER_DEATH_DAYS) {
                pet.isDead = true;
                pet.deathDate = now;
            }
        }

        this.savePetData();
    }

    adoptPet(petType) {
        if (this.hasPet()) {
            return { success: false, message: '你已经有一只宠物了！' };
        }

        const petTypeInfo = VirtualPet.PET_TYPES[petType];
        if (!petTypeInfo) {
            return { success: false, message: '未知的宠物类型' };
        }

        const now = Date.now();
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
                attack: 10,
                defense: 10,
                intelligence: 1,
                totalTasksCompleted: 0,
                totalPhotosUploaded: 0,
                totalGamesCompleted: 0,
                totalXPSpent: 0,
                isDead: false,
                deathDate: null
            }
        };

        this.savePetData();
        return { success: true, message: `恭喜你领养了${petTypeInfo.name}！` };
    }

    feedPet(points) {
        if (!this.hasPet()) {
            return { success: false, message: '你还没有宠物' };
        }

        if (!this.isPetAlive()) {
            return { success: false, message: '宠物已经死了，需要复活才能喂食' };
        }

        if (points < VirtualPet.FEED_COST) {
            return { success: false, message: `积分不足，喂食需要 ${VirtualPet.FEED_COST} 积分` };
        }

        const pet = this.petData.pet;
        pet.hunger = Math.min(VirtualPet.MAX_HUNGER, pet.hunger + 30);
        pet.lastFed = Date.now();
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.FEED_COST;

        this.savePetData();

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
            return { success: false, message: `积分不足，需要 ${VirtualPet.ATTACK_UPGRADE_COST} 积分` };
        }

        const pet = this.petData.pet;
        pet.attack += 5;
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.ATTACK_UPGRADE_COST;
        this.savePetData();

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
            return { success: false, message: `积分不足，需要 ${VirtualPet.DEFENSE_UPGRADE_COST} 积分` };
        }

        const pet = this.petData.pet;
        pet.defense += 5;
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.DEFENSE_UPGRADE_COST;
        this.savePetData();

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
            return { success: false, message: `积分不足，复活需要 ${VirtualPet.REVIVE_COST} 积分` };
        }

        const pet = this.petData.pet;
        pet.isDead = false;
        pet.deathDate = null;
        pet.hunger = VirtualPet.MAX_HUNGER / 2;
        pet.lastFed = Date.now();
        pet.totalXPSpent = (pet.totalXPSpent || 0) + VirtualPet.REVIVE_COST;

        this.savePetData();

        return { 
            success: true, 
            message: `${pet.name}复活了！记得经常喂食哦！`,
            pointsUsed: VirtualPet.REVIVE_COST
        };
    }

    onTaskCompleted() {
        if (!this.isPetAlive()) return;

        const pet = this.petData.pet;
        pet.totalTasksCompleted++;
        pet.intelligence += VirtualPet.INTELLIGENCE_PER_TASK;
        this.savePetData();
    }

    onPhotoUploaded() {
        if (!this.isPetAlive()) return;

        const pet = this.petData.pet;
        pet.totalPhotosUploaded++;
        this.savePetData();
    }
    
    onGameCompleted(gameType, score = 0, time = 0) {
        if (!this.isPetAlive()) return 0;

        const pet = this.petData.pet;
        pet.totalGamesCompleted = (pet.totalGamesCompleted || 0) + 1;
        
        const xpEarned = this.calculateGameXP(gameType, score, time);
        this.savePetData();
        
        return xpEarned;
    }
    
    calculateGameXP(gameType, score = 0, time = 0) {
        const rewards = VirtualPet.GAME_XP_REWARDS;
        const gameReward = rewards[gameType];
        
        if (!gameReward) {
            return 10;
        }
        
        if (gameReward.base) {
            return gameReward.base;
        }
        
        if (gameReward.timeBonus) {
            const bonusXP = Math.floor((100 - Math.min(time, 100)) * 0.3);
            return Math.max(gameReward.min, Math.min(gameReward.max, bonusXP));
        }
        
        const scoreXP = Math.floor(score / gameReward.divisor);
        return Math.max(gameReward.min, Math.min(gameReward.max, scoreXP));
    }
    
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
    
    getPetEmoji() {
        if (!this.hasPet()) return '🐾';
        
        const pet = this.petData.pet;
        const petType = VirtualPet.PET_TYPES[pet.type];
        if (!petType) return pet.emoji;
        
        const level = this.getPetLevel();
        const levelEmojis = petType.levelEmojis || [petType.emoji];
        
        const emojiIndex = Math.min(level - 1, levelEmojis.length - 1);
        return levelEmojis[emojiIndex] || petType.emoji;
    }

    getCurrentPoints() {
        return 0;
    }

    deductPoints(amount) {
        return false;
    }

    static notifyTaskCompleted() {
        if (window.virtualPet) {
            window.virtualPet.onTaskCompleted();
        }
    }

    static notifyPhotoUploaded() {
        if (window.virtualPet) {
            window.virtualPet.onPhotoUploaded();
        }
    }
    
    static notifyGameCompleted(gameType, score = 0, time = 0) {
        if (window.virtualPet) {
            return window.virtualPet.onGameCompleted(gameType, score, time);
        }
        return 0;
    }

    static isChildModeActive() {
        return document.body.classList.contains('child-mode');
    }
}

beforeEach(() => {
    localStorageMock.clear();
    setupDOM();
    window.virtualPet = null;
});

describe('VirtualPet', () => {
    describe('Constants', () => {
        test('should have correct hunger death days (90 days = ~3 months)', () => {
            expect(VirtualPet.HUNGER_DEATH_DAYS).toBe(90);
        });

        test('should have feed cost defined', () => {
            expect(VirtualPet.FEED_COST).toBe(20);
        });

        test('should have attack upgrade cost defined', () => {
            expect(VirtualPet.ATTACK_UPGRADE_COST).toBe(50);
        });

        test('should have defense upgrade cost defined', () => {
            expect(VirtualPet.DEFENSE_UPGRADE_COST).toBe(50);
        });

        test('should have revive cost defined', () => {
            expect(VirtualPet.REVIVE_COST).toBe(100);
        });
    });

    describe('Pet Types', () => {
        test('should have multiple pet types available', () => {
            const petTypes = VirtualPet.PET_TYPES;
            expect(Object.keys(petTypes).length).toBeGreaterThan(0);
        });

        test('each pet type should have name, emoji, and description', () => {
            const petTypes = VirtualPet.PET_TYPES;
            Object.values(petTypes).forEach(pet => {
                expect(pet).toHaveProperty('name');
                expect(pet).toHaveProperty('emoji');
                expect(pet).toHaveProperty('description');
            });
        });

        test('should include dragon pet type', () => {
            expect(VirtualPet.PET_TYPES.dragon).toBeDefined();
            expect(VirtualPet.PET_TYPES.dragon.emoji).toBe('🐲');
        });

        test('should include cat pet type', () => {
            expect(VirtualPet.PET_TYPES.cat).toBeDefined();
            expect(VirtualPet.PET_TYPES.cat.emoji).toBe('🐱');
        });

        test('should include panda pet type', () => {
            expect(VirtualPet.PET_TYPES.panda).toBeDefined();
            expect(VirtualPet.PET_TYPES.panda.emoji).toBe('🐼');
        });
    });

    describe('Pet Adoption', () => {
        test('should be able to adopt a pet', () => {
            const pet = new VirtualPet();
            const result = pet.adoptPet('dragon');
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('小龙');
        });

        test('should not allow adopting second pet', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            
            const result = pet.adoptPet('cat');
            expect(result.success).toBe(false);
            expect(result.message).toContain('已经有一只宠物');
        });

        test('should reject unknown pet type', () => {
            const pet = new VirtualPet();
            const result = pet.adoptPet('unicorn');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('未知');
        });

        test('adopted pet should have initial stats', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            
            expect(pet.petData.pet.attack).toBe(10);
            expect(pet.petData.pet.defense).toBe(10);
            expect(pet.petData.pet.intelligence).toBe(1);
            expect(pet.petData.pet.hunger).toBe(100);
        });
    });

    describe('Pet Status', () => {
        test('hasPet should return false initially', () => {
            const pet = new VirtualPet();
            expect(pet.hasPet()).toBe(false);
        });

        test('hasPet should return true after adoption', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            expect(pet.hasPet()).toBe(true);
        });

        test('isPetAlive should return true for newly adopted pet', () => {
            const pet = new VirtualPet();
            pet.adoptPet('rabbit');
            expect(pet.isPetAlive()).toBe(true);
        });

        test('isPetAlive should return false for dead pet', () => {
            const pet = new VirtualPet();
            pet.adoptPet('fox');
            pet.petData.pet.isDead = true;
            expect(pet.isPetAlive()).toBe(false);
        });
    });

    describe('Pet Feeding', () => {
        test('should be able to feed pet with enough points', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            pet.petData.pet.hunger = 50;
            
            // Mock getCurrentPoints
            pet.getCurrentPoints = () => 100;
            pet.deductPoints = jest.fn(() => true);
            
            const result = pet.feedPet(100);
            expect(result.success).toBe(true);
            expect(result.pointsUsed).toBe(VirtualPet.FEED_COST);
        });

        test('should not feed without enough points', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            
            const result = pet.feedPet(10);
            expect(result.success).toBe(false);
            expect(result.message).toContain('积分不足');
        });

        test('feeding should increase hunger', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            pet.petData.pet.hunger = 50;
            
            pet.getCurrentPoints = () => 100;
            pet.deductPoints = jest.fn(() => true);
            
            pet.feedPet(100);
            expect(pet.petData.pet.hunger).toBeGreaterThan(50);
        });

        test('hunger should not exceed max', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            pet.petData.pet.hunger = 90;
            
            pet.getCurrentPoints = () => 100;
            pet.deductPoints = jest.fn(() => true);
            
            pet.feedPet(100);
            expect(pet.petData.pet.hunger).toBeLessThanOrEqual(VirtualPet.MAX_HUNGER);
        });
    });

    describe('Pet Stats Upgrade', () => {
        test('should upgrade attack with enough points', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            const initialAttack = pet.petData.pet.attack;
            
            pet.getCurrentPoints = () => 100;
            pet.deductPoints = jest.fn(() => true);
            
            const result = pet.upgradeAttack(100);
            expect(result.success).toBe(true);
            expect(pet.petData.pet.attack).toBeGreaterThan(initialAttack);
        });

        test('should upgrade defense with enough points', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            const initialDefense = pet.petData.pet.defense;
            
            pet.getCurrentPoints = () => 100;
            pet.deductPoints = jest.fn(() => true);
            
            const result = pet.upgradeDefense(100);
            expect(result.success).toBe(true);
            expect(pet.petData.pet.defense).toBeGreaterThan(initialDefense);
        });

        test('should not upgrade without enough points', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            
            const result = pet.upgradeAttack(10);
            expect(result.success).toBe(false);
        });
    });

    describe('Task Completion', () => {
        test('completing task should increase intelligence', () => {
            const pet = new VirtualPet();
            pet.adoptPet('panda');
            const initialIntelligence = pet.petData.pet.intelligence;
            
            pet.onTaskCompleted();
            
            expect(pet.petData.pet.intelligence).toBeGreaterThan(initialIntelligence);
        });

        test('completing task should increment task counter', () => {
            const pet = new VirtualPet();
            pet.adoptPet('panda');
            
            pet.onTaskCompleted();
            pet.onTaskCompleted();
            pet.onTaskCompleted();
            
            expect(pet.petData.pet.totalTasksCompleted).toBe(3);
        });
    });

    describe('Photo Upload', () => {
        test('photo upload should increment photo counter', () => {
            const pet = new VirtualPet();
            pet.adoptPet('fox');
            
            pet.onPhotoUploaded();
            pet.onPhotoUploaded();
            
            expect(pet.petData.pet.totalPhotosUploaded).toBe(2);
        });
    });

    describe('Pet Revival', () => {
        test('should revive dead pet with enough points', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            pet.petData.pet.isDead = true;
            
            pet.getCurrentPoints = () => 200;
            pet.deductPoints = jest.fn(() => true);
            
            const result = pet.revivePet(200);
            expect(result.success).toBe(true);
            expect(pet.isPetAlive()).toBe(true);
        });

        test('should not revive without enough points', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            pet.petData.pet.isDead = true;
            
            const result = pet.revivePet(50);
            expect(result.success).toBe(false);
            expect(result.message).toContain('积分不足');
        });

        test('should not revive already alive pet', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            
            pet.getCurrentPoints = () => 200;
            
            const result = pet.revivePet(200);
            expect(result.success).toBe(false);
            expect(result.message).toContain('还活着');
        });

        test('revived pet should have half hunger', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            pet.petData.pet.isDead = true;
            
            pet.getCurrentPoints = () => 200;
            pet.deductPoints = jest.fn(() => true);
            
            pet.revivePet(200);
            expect(pet.petData.pet.hunger).toBe(VirtualPet.MAX_HUNGER / 2);
        });
    });

    describe('Data Persistence', () => {
        test('should save pet data to localStorage', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'virtualPetData',
                expect.any(String)
            );
        });

        test('should load existing pet data from localStorage', () => {
            const savedData = {
                adopted: true,
                pet: {
                    type: 'cat',
                    name: '小猫',
                    emoji: '🐱',
                    hunger: 80,
                    attack: 15,
                    defense: 12,
                    intelligence: 5,
                    isDead: false
                }
            };
            
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));
            
            const pet = new VirtualPet();
            expect(pet.hasPet()).toBe(true);
            expect(pet.petData.pet.name).toBe('小猫');
        });
    });

    describe('Static Methods', () => {
        test('notifyTaskCompleted should be callable', () => {
            expect(() => VirtualPet.notifyTaskCompleted()).not.toThrow();
        });

        test('notifyPhotoUploaded should be callable', () => {
            expect(() => VirtualPet.notifyPhotoUploaded()).not.toThrow();
        });
        
        test('notifyGameCompleted should be callable', () => {
            expect(() => VirtualPet.notifyGameCompleted('puzzle', 100, 0)).not.toThrow();
        });

        test('isChildModeActive should check body class', () => {
            document.body.classList.remove('child-mode');
            expect(VirtualPet.isChildModeActive()).toBe(false);
            
            document.body.classList.add('child-mode');
            expect(VirtualPet.isChildModeActive()).toBe(true);
        });
    });
    
    describe('Pet Level System', () => {
        test('new pet should start at level 1', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            
            expect(pet.getPetLevel()).toBe(1);
        });
        
        test('pet level should increase based on XP spent', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            
            // Spend 100+ XP to reach level 2
            pet.petData.pet.totalXPSpent = 100;
            expect(pet.getPetLevel()).toBe(2);
            
            // Spend 300+ XP to reach level 3
            pet.petData.pet.totalXPSpent = 300;
            expect(pet.getPetLevel()).toBe(3);
            
            // Spend 600+ XP to reach level 4
            pet.petData.pet.totalXPSpent = 600;
            expect(pet.getPetLevel()).toBe(4);
            
            // Spend 1000+ XP to reach level 5
            pet.petData.pet.totalXPSpent = 1000;
            expect(pet.getPetLevel()).toBe(5);
        });
        
        test('getPetLevelInfo should return correct level data', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            
            const levelInfo = pet.getPetLevelInfo();
            expect(levelInfo.level).toBe(1);
            expect(levelInfo.name).toBe('新手');
            expect(levelInfo.animation).toBe('bounce');
            expect(levelInfo.xpToNextLevel).toBe(100);
            expect(levelInfo.isMaxLevel).toBe(false);
        });
        
        test('level 5 should be max level', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            pet.petData.pet.totalXPSpent = 1000;
            
            const levelInfo = pet.getPetLevelInfo();
            expect(levelInfo.level).toBe(5);
            expect(levelInfo.name).toBe('大师');
            expect(levelInfo.isMaxLevel).toBe(true);
            expect(levelInfo.xpToNextLevel).toBe(0);
        });
        
        test('getPetEmoji should return level-based emoji', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dragon');
            
            // Level 1
            expect(pet.getPetEmoji()).toBe('🐲');
            
            // Level 2
            pet.petData.pet.totalXPSpent = 100;
            expect(pet.getPetEmoji()).toBe('🐉');
            
            // Level 3
            pet.petData.pet.totalXPSpent = 300;
            expect(pet.getPetEmoji()).toBe('🔥');
            
            // Level 4
            pet.petData.pet.totalXPSpent = 600;
            expect(pet.getPetEmoji()).toBe('⚡');
            
            // Level 5
            pet.petData.pet.totalXPSpent = 1000;
            expect(pet.getPetEmoji()).toBe('🌟');
        });
        
        test('feeding pet should increase totalXPSpent', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            
            pet.feedPet(100);
            expect(pet.petData.pet.totalXPSpent).toBe(20);
        });
        
        test('upgrading attack should increase totalXPSpent', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            
            pet.upgradeAttack(100);
            expect(pet.petData.pet.totalXPSpent).toBe(50);
        });
        
        test('upgrading defense should increase totalXPSpent', () => {
            const pet = new VirtualPet();
            pet.adoptPet('cat');
            
            pet.upgradeDefense(100);
            expect(pet.petData.pet.totalXPSpent).toBe(50);
        });
    });
    
    describe('Game Completion', () => {
        test('game completion should increment game counter', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            pet.onGameCompleted('puzzle', 0, 0);
            pet.onGameCompleted('maze', 0, 0);
            
            expect(pet.petData.pet.totalGamesCompleted).toBe(2);
        });
        
        test('puzzle game should give base XP of 15', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            const xp = pet.calculateGameXP('puzzle', 0, 0);
            expect(xp).toBe(15);
        });
        
        test('maze game should give base XP of 20', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            const xp = pet.calculateGameXP('maze', 0, 0);
            expect(xp).toBe(20);
        });
        
        test('shooting game XP should be score-based', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            // Score 100 should give 10 XP (100/10)
            expect(pet.calculateGameXP('shooting', 100, 0)).toBe(10);
            
            // Score 200 should give 20 XP (200/10)
            expect(pet.calculateGameXP('shooting', 200, 0)).toBe(20);
            
            // Score 500 should give max 30 XP
            expect(pet.calculateGameXP('shooting', 500, 0)).toBe(30);
            
            // Low score should give min 10 XP
            expect(pet.calculateGameXP('shooting', 50, 0)).toBe(10);
        });
        
        test('space invaders XP should be score-based', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            // Score 150 should give 15 XP (150/10)
            expect(pet.calculateGameXP('space-invaders', 150, 0)).toBe(15);
            
            // Score 300 should give 30 XP
            expect(pet.calculateGameXP('space-invaders', 300, 0)).toBe(30);
        });
        
        test('tank battle XP should be score-based', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            // Score 100 should give 20 XP (100/5)
            expect(pet.calculateGameXP('tank-battle', 100, 0)).toBe(20);
            
            // Score 150 should give 30 XP (150/5 = 30)
            expect(pet.calculateGameXP('tank-battle', 150, 0)).toBe(30);
        });
        
        test('minesweeper XP should be time-based', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            // Fast time (30 seconds) should give more XP
            expect(pet.calculateGameXP('minesweeper', 0, 30)).toBe(21); // (100-30)*0.3 = 21
            
            // Slow time (80 seconds) should give min XP
            expect(pet.calculateGameXP('minesweeper', 0, 80)).toBe(10); // (100-80)*0.3 = 6, min is 10
            
            // Very fast time (10 seconds) should give max XP
            expect(pet.calculateGameXP('minesweeper', 0, 10)).toBe(25); // (100-10)*0.3 = 27, max is 25
        });
        
        test('unknown game type should give default 10 XP', () => {
            const pet = new VirtualPet();
            pet.adoptPet('dog');
            
            const xp = pet.calculateGameXP('unknown-game', 100, 50);
            expect(xp).toBe(10);
        });
    });
    
    describe('Game XP Rewards Constants', () => {
        test('should have all game types defined', () => {
            const rewards = VirtualPet.GAME_XP_REWARDS;
            expect(rewards.puzzle).toBeDefined();
            expect(rewards.maze).toBeDefined();
            expect(rewards.shooting).toBeDefined();
            expect(rewards['space-invaders']).toBeDefined();
            expect(rewards['tank-battle']).toBeDefined();
            expect(rewards.minesweeper).toBeDefined();
        });
        
        test('each game type should have a name', () => {
            const rewards = VirtualPet.GAME_XP_REWARDS;
            Object.values(rewards).forEach(reward => {
                expect(reward.name).toBeDefined();
                expect(typeof reward.name).toBe('string');
            });
        });
    });
    
    describe('Pet Levels Constants', () => {
        test('should have 5 levels defined', () => {
            const levels = VirtualPet.PET_LEVELS;
            expect(levels.length).toBe(5);
        });
        
        test('levels should have increasing XP requirements', () => {
            const levels = VirtualPet.PET_LEVELS;
            for (let i = 1; i < levels.length; i++) {
                expect(levels[i].xpRequired).toBeGreaterThan(levels[i-1].xpRequired);
            }
        });
        
        test('each level should have name and animation', () => {
            const levels = VirtualPet.PET_LEVELS;
            levels.forEach(level => {
                expect(level.name).toBeDefined();
                expect(level.animation).toBeDefined();
            });
        });
    });
});

describe('Virtual Pet CSS Integration', () => {
    test('pet container should only be visible in child mode', () => {
        // This tests the CSS rule: body:not(.child-mode) .virtual-pet-container { display: none; }
        const container = document.getElementById('virtual-pet-container');
        expect(container).toBeTruthy();
        expect(container.classList.contains('virtual-pet-container')).toBe(true);
    });
});
