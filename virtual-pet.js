/**
 * Virtual Pet System - 电子宠物系统
 * 
 * Features:
 * - Pet adoption for child mode users
 * - Pet only appears when points change (task completion, photo upload)
 * - Points from check-in tasks (small) and photos (more)
 * - Feed pet with points
 * - Upgrade attack/defense stats with points
 * - Intelligence increases with completed tasks
 * - Pet dies after 3 months without feeding
 * - Dead pet can be revived with points
 */

class VirtualPet {
    constructor() {
        this.petData = this.loadPetData();
        this.isVisible = false;
        this.animationTimeout = null;
        this.initializeUI();
        
        // Check pet status on load
        this.checkPetStatus();
    }

    // ===== CONSTANTS =====
    static get HUNGER_DEATH_DAYS() { return 90; } // 3 months = ~90 days
    // Note: XP rewards are configured in script.js achievement system (5 XP for tasks, 10 XP for photos)
    // Pet uses the same XP/points system for feeding and upgrades
    static get FEED_COST() { return 20; } // Points to feed pet
    static get ATTACK_UPGRADE_COST() { return 50; } // Points to increase attack
    static get DEFENSE_UPGRADE_COST() { return 50; } // Points to increase defense
    static get REVIVE_COST() { return 100; } // Points to revive dead pet
    static get HUNGER_DECREASE_PER_DAY() { return 1; } // Hunger decreases by 1 per day
    static get MAX_HUNGER() { return 100; }
    static get INTELLIGENCE_PER_TASK() { return 1; } // Intelligence increases by 1 per task
    
    // Pet types with different appearances
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

        // Calculate hunger decrease since last fed
        const now = Date.now();
        const lastFed = pet.lastFed || pet.adoptedAt;
        const daysSinceLastFed = Math.floor((now - lastFed) / (1000 * 60 * 60 * 24));
        
        // Calculate expected hunger based on days since last fed
        // Hunger starts at MAX_HUNGER when fed, decreases by HUNGER_DECREASE_PER_DAY per day
        const expectedHunger = VirtualPet.MAX_HUNGER - (daysSinceLastFed * VirtualPet.HUNGER_DECREASE_PER_DAY);
        pet.hunger = Math.max(0, expectedHunger);
        
        // Check if pet has starved (hunger = 0 for long enough)
        if (pet.hunger <= 0 && daysSinceLastFed >= VirtualPet.HUNGER_DEATH_DAYS) {
            pet.isDead = true;
            pet.deathDate = now;
            this.onPetDeath();
        }

        this.savePetData();
        this.updateUI();
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
        this.updateUI();
        this.showPetAnimation('adopted');

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
        this.updateUI();
        this.showPetAnimation('fed');

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
        this.updateUI();
        this.showPetAnimation('trained');

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
        this.updateUI();
        this.showPetAnimation('trained');

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
        pet.hunger = VirtualPet.MAX_HUNGER / 2; // Revive with half hunger
        pet.lastFed = Date.now();

        this.savePetData();
        this.updateUI();
        this.showPetAnimation('revived');

        return { 
            success: true, 
            message: `${pet.name}复活了！记得经常喂食哦！`,
            pointsUsed: VirtualPet.REVIVE_COST
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
    }

    // Called when a photo is uploaded
    onPhotoUploaded() {
        if (!this.isPetAlive()) return;

        const pet = this.petData.pet;
        pet.totalPhotosUploaded++;

        this.savePetData();
        this.showPetWithMessage('好照片！主人真厉害！');
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
            <div class="virtual-pet-panel">
                <div class="pet-header">
                    <span class="pet-title">🐾 我的宠物</span>
                    <button class="pet-close-btn" id="petCloseBtn">×</button>
                </div>
                <div class="pet-content" id="petContent">
                    <!-- Content will be populated dynamically -->
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
            floating.addEventListener('click', () => this.togglePetPanel());
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
                <button class="pet-action-btn revive-btn" id="revivePetBtn">
                    💫 复活 (${VirtualPet.REVIVE_COST}积分)
                </button>
            </div>
        `;
    }

    getAlivePetHTML() {
        const pet = this.petData.pet;
        const hungerPercent = Math.round(pet.hunger);
        const hungerStatus = hungerPercent > 70 ? '饱' : hungerPercent > 30 ? '一般' : '饿';
        const hungerClass = hungerPercent > 70 ? 'full' : hungerPercent > 30 ? 'normal' : 'hungry';

        return `
            <div class="pet-alive">
                <div class="pet-display">
                    <span class="pet-main-emoji ${this.isVisible ? 'pet-bounce' : ''}">${pet.emoji}</span>
                    <div class="pet-name-display">${pet.name}</div>
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
    }

    updateFloatingPet() {
        const floating = document.getElementById('petFloating');
        if (!floating) return;

        if (this.hasPet() && this.isPetAlive()) {
            floating.innerHTML = `<span class="floating-pet-emoji">${this.petData.pet.emoji}</span>`;
            floating.style.display = 'block';
        } else if (this.hasPet() && !this.isPetAlive()) {
            floating.innerHTML = `<span class="floating-pet-emoji dead">😢</span>`;
            floating.style.display = 'block';
        } else {
            floating.innerHTML = `<span class="floating-pet-emoji">🐾</span>`;
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

    // Check if child mode is active
    static isChildModeActive() {
        return document.body.classList.contains('child-mode');
    }
}

// Initialize virtual pet when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if child mode toggle exists (meaning the feature is available)
    const childModeToggle = document.getElementById('childModeToggle');
    if (childModeToggle) {
        window.virtualPet = new VirtualPet();
    }
});

// Make class available globally
if (typeof window !== 'undefined') {
    window.VirtualPet = VirtualPet;
}
