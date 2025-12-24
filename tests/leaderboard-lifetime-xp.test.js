/**
 * Tests for lifetime XP tracking in leaderboard
 * Ensures that spending points on virtual pet doesn't affect leaderboard ranking
 */

// Load the AchievementGamification class
const AchievementGamification = require('../achievement-gamification.js');

describe('Leaderboard Lifetime XP Tracking', () => {
    let gamification;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Create notification container (required by AchievementGamification)
        const container = document.createElement('div');
        container.id = 'achievement-notification-container';
        document.body.appendChild(container);
        
        // Create a fresh instance of AchievementGamification
        gamification = new AchievementGamification();
    });
    
    afterEach(() => {
        const container = document.getElementById('achievement-notification-container');
        if (container) {
            container.remove();
        }
    });

    test('should initialize lifetimeXP to 0 for new users', () => {
        expect(gamification.xpData.totalXP).toBe(0);
        expect(gamification.xpData.lifetimeXP).toBe(0);
        expect(gamification.xpData.level).toBe(1);
    });

    test('should increment both totalXP and lifetimeXP when earning XP', () => {
        // Earn 50 XP
        gamification.addXP(50);
        
        expect(gamification.xpData.totalXP).toBe(50);
        expect(gamification.xpData.lifetimeXP).toBe(50);
    });

    test('should continue incrementing lifetimeXP when earning more XP', () => {
        // Earn XP multiple times
        gamification.addXP(30);
        gamification.addXP(20);
        gamification.addXP(50);
        
        expect(gamification.xpData.totalXP).toBe(100);
        expect(gamification.xpData.lifetimeXP).toBe(100);
    });

    test('should preserve lifetimeXP when totalXP is reduced (spending)', () => {
        // Earn 100 XP
        gamification.addXP(100);
        expect(gamification.xpData.totalXP).toBe(100);
        expect(gamification.xpData.lifetimeXP).toBe(100);
        
        // Simulate spending 30 XP (like feeding a pet)
        gamification.xpData.totalXP -= 30;
        gamification.saveXPData();
        
        // totalXP should decrease, but lifetimeXP should stay the same
        expect(gamification.xpData.totalXP).toBe(70);
        expect(gamification.xpData.lifetimeXP).toBe(100); // Should NOT decrease
    });

    test('should return lifetimeXP in getXPInfo() for leaderboard submission', () => {
        // Earn 150 XP
        gamification.addXP(150);
        
        // Spend 40 XP
        gamification.xpData.totalXP -= 40;
        gamification.saveXPData();
        
        const xpInfo = gamification.getXPInfo();
        
        expect(xpInfo.total).toBe(110); // Current XP after spending
        expect(xpInfo.lifetime).toBe(150); // Lifetime XP never decreases
        expect(xpInfo.level).toBe(2); // Based on totalXP
    });

    test('should migrate existing users by initializing lifetimeXP from totalXP', () => {
        // Simulate existing user data without lifetimeXP field
        localStorage.setItem('museumcheck_xp_data', JSON.stringify({
            totalXP: 200,
            level: 2,
            xpHistory: []
        }));
        
        const newGamification = new AchievementGamification();
        
        // lifetimeXP should be initialized from totalXP
        expect(newGamification.xpData.totalXP).toBe(200);
        expect(newGamification.xpData.lifetimeXP).toBe(200);
    });

    test('should migrate existing users with pet spending data', () => {
        // Simulate existing user with pet that spent 50 XP
        localStorage.setItem('museumcheck_xp_data', JSON.stringify({
            totalXP: 150,
            level: 2,
            xpHistory: []
        }));
        
        localStorage.setItem('virtualPetData', JSON.stringify({
            adopted: true,
            pet: {
                name: 'TestPet',
                type: 'cat',
                totalXPSpent: 50,
                attack: 15,
                defense: 15
            }
        }));
        
        const newGamification = new AchievementGamification();
        
        // lifetimeXP should be totalXP + totalXPSpent
        expect(newGamification.xpData.totalXP).toBe(150);
        expect(newGamification.xpData.lifetimeXP).toBe(200); // 150 + 50
    });

    test('should handle lifetimeXP across multiple earn-spend cycles', () => {
        // Cycle 1: Earn 50, spend 20
        gamification.addXP(50);
        gamification.xpData.totalXP -= 20;
        gamification.saveXPData();
        
        expect(gamification.xpData.totalXP).toBe(30);
        expect(gamification.xpData.lifetimeXP).toBe(50);
        
        // Cycle 2: Earn 80, spend 30
        gamification.addXP(80);
        gamification.xpData.totalXP -= 30;
        gamification.saveXPData();
        
        expect(gamification.xpData.totalXP).toBe(80); // 30 + 80 - 30
        expect(gamification.xpData.lifetimeXP).toBe(130); // 50 + 80
        
        // Cycle 3: Earn 100, spend 50
        gamification.addXP(100);
        gamification.xpData.totalXP -= 50;
        gamification.saveXPData();
        
        expect(gamification.xpData.totalXP).toBe(130); // 80 + 100 - 50
        expect(gamification.xpData.lifetimeXP).toBe(230); // 130 + 100
    });

    test('should persist lifetimeXP across page reloads', () => {
        // Earn 100 XP
        gamification.addXP(100);
        
        // Spend 30 XP
        gamification.xpData.totalXP -= 30;
        gamification.saveXPData();
        
        // Simulate page reload by creating new instance
        const reloadedGamification = new AchievementGamification();
        
        expect(reloadedGamification.xpData.totalXP).toBe(70);
        expect(reloadedGamification.xpData.lifetimeXP).toBe(100);
    });

    test('should never allow lifetimeXP to decrease', () => {
        gamification.addXP(100);
        const initialLifetimeXP = gamification.xpData.lifetimeXP;
        
        // Try various operations that might decrease lifetimeXP
        gamification.xpData.totalXP = 0; // Spend all XP
        gamification.saveXPData();
        
        expect(gamification.xpData.lifetimeXP).toBe(initialLifetimeXP);
        
        // Reload and verify
        const reloadedGamification = new AchievementGamification();
        expect(reloadedGamification.xpData.lifetimeXP).toBe(initialLifetimeXP);
    });

    test('should handle edge case of spending more than earned (totalXP goes negative)', () => {
        gamification.addXP(50);
        
        // Try to spend more than available (should be prevented by application logic, but test anyway)
        gamification.xpData.totalXP = -10; // Simulate bug or direct manipulation
        gamification.saveXPData();
        
        // lifetimeXP should still be positive
        expect(gamification.xpData.lifetimeXP).toBe(50);
        expect(gamification.xpData.totalXP).toBe(-10); // Application's responsibility to prevent this
    });
});
