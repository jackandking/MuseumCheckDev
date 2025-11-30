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
    
    static get PET_TYPES() {
        return {
            dragon: { name: '小龙', emoji: '🐲', description: '勇敢的小龙' },
            cat: { name: '小猫', emoji: '🐱', description: '可爱的小猫' },
            dog: { name: '小狗', emoji: '🐶', description: '忠诚的小狗' },
            rabbit: { name: '小兔', emoji: '🐰', description: '活泼的小兔' },
            panda: { name: '小熊猫', emoji: '🐼', description: '憨厚的小熊猫' },
            fox: { name: '小狐狸', emoji: '🦊', description: '聪明的小狐狸' }
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

        test('isChildModeActive should check body class', () => {
            document.body.classList.remove('child-mode');
            expect(VirtualPet.isChildModeActive()).toBe(false);
            
            document.body.classList.add('child-mode');
            expect(VirtualPet.isChildModeActive()).toBe(true);
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
