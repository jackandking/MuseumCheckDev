/**
 * Tests for Enhanced XP Notification System
 * Validates milestone celebrations and improved emotional feedback
 */

// Load the AchievementGamification class
const AchievementGamification = require('../achievement-gamification.js');

describe('Enhanced XP Notification System', () => {
    let gamification;
    
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Create notification container
        const container = document.createElement('div');
        container.id = 'achievement-notification-container';
        document.body.appendChild(container);
        
        // Initialize gamification system
        gamification = new AchievementGamification();
    });
    
    afterEach(() => {
        const container = document.getElementById('achievement-notification-container');
        if (container) {
            container.remove();
        }
    });
    
    describe('XP Gain Notifications', () => {
        test('should show notification with encouragement based on XP amount', () => {
            // Small reward (5 XP)
            gamification.showXPGainNotification(5, '完成任务');
            let notifications = document.querySelectorAll('.xp-gain-notification');
            expect(notifications.length).toBeGreaterThan(0);
            expect(notifications[0].textContent).toContain('很好！✨');
            
            // Clear
            notifications.forEach(n => n.remove());
            
            // Medium reward (10 XP)
            gamification.showXPGainNotification(10, '上传照片');
            notifications = document.querySelectorAll('.xp-gain-notification');
            expect(notifications[0].textContent).toContain('真不错！👍');
            
            // Clear
            notifications.forEach(n => n.remove());
            
            // Large reward (20 XP)
            gamification.showXPGainNotification(20, '贡献宝物');
            notifications = document.querySelectorAll('.xp-gain-notification');
            expect(notifications[0].textContent).toContain('太棒了！🎉');
        });
        
        test('should display current total XP and level', () => {
            gamification.addXP(50);
            gamification.showXPGainNotification(10, '测试');
            
            const notification = document.querySelector('.xp-gain-notification');
            expect(notification).toBeTruthy();
            expect(notification.textContent).toContain('总积分');
            expect(notification.textContent).toContain('等级');
        });
        
        test('should show milestone hint when approaching level up', () => {
            // Add XP to get close to next level (Level 1 needs 100 XP for Level 2)
            gamification.addXP(90);
            
            // Now add 5 more (95 total = 95% progress)
            gamification.showXPGainNotification(5, '测试');
            
            const notification = document.querySelector('.xp-gain-notification');
            expect(notification.textContent).toContain('快要升级了');
        });
    });
    
    describe('Milestone Celebrations', () => {
        test('should trigger milestone celebration at 100 XP', () => {
            gamification.addXP(100);
            
            const milestone = document.querySelector('.milestone-celebration');
            expect(milestone).toBeTruthy();
            expect(milestone.textContent).toContain('100');
            expect(milestone.textContent).toContain('里程碑');
        });
        
        test('should trigger milestone celebration at 500 XP', () => {
            // Start at 400, add 100 to cross the 500 milestone
            gamification.xpData.totalXP = 400;
            gamification.addXP(100);
            
            const milestone = document.querySelector('.milestone-celebration');
            expect(milestone).toBeTruthy();
            expect(milestone.textContent).toContain('500');
        });
        
        test('should trigger milestone celebration at 1000 XP', () => {
            // Start at 900, add 100 to cross the 1000 milestone
            gamification.xpData.totalXP = 900;
            gamification.addXP(100);
            
            const milestone = document.querySelector('.milestone-celebration');
            expect(milestone).toBeTruthy();
            expect(milestone.textContent).toContain('1000');
            expect(milestone.textContent).toContain('重要里程碑');
        });
        
        test('should trigger special celebration at 5000 XP', () => {
            // Start at 4900, add 100 to cross the 5000 milestone
            gamification.xpData.totalXP = 4900;
            gamification.addXP(100);
            
            const milestone = document.querySelector('.milestone-celebration');
            expect(milestone).toBeTruthy();
            expect(milestone.textContent).toContain('5000');
            expect(milestone.textContent).toContain('大师级');
        });
        
        test('should trigger legendary celebration at 10000 XP', () => {
            // Start at 9900, add 100 to cross the 10000 milestone
            gamification.xpData.totalXP = 9900;
            gamification.addXP(100);
            
            const milestone = document.querySelector('.milestone-celebration');
            expect(milestone).toBeTruthy();
            expect(milestone.textContent).toContain('10000');
            expect(milestone.textContent).toContain('传奇');
        });
        
        test('should only celebrate one milestone when crossing multiple at once', () => {
            // Start at 50, add 500 (crosses 100 and 500)
            gamification.xpData.totalXP = 50;
            gamification.addXP(500);
            
            const milestones = document.querySelectorAll('.milestone-celebration');
            // Should only show one milestone (the first one crossed: 100)
            expect(milestones.length).toBe(1);
            expect(milestones[0].textContent).toContain('100');
        });
        
        test('should not trigger milestone if already passed', () => {
            // Already at 200 XP
            gamification.xpData.totalXP = 200;
            gamification.saveXPData();
            
            // Add 50 more (doesn't cross any milestone)
            gamification.addXP(50);
            
            const milestone = document.querySelector('.milestone-celebration');
            expect(milestone).toBeFalsy();
        });
    });
    
    describe('Error Reporting Achievements', () => {
        test('should define first error report achievement', () => {
            const definitions = gamification.getMicroAchievementDefinitions();
            expect(definitions.first_error_report).toBeDefined();
            expect(definitions.first_error_report[0].id).toBe('micro_first_error_report');
            expect(definitions.first_error_report[0].xp).toBe(15);
        });
        
        test('should define error report milestone achievements', () => {
            const definitions = gamification.getMicroAchievementDefinitions();
            
            // 5 reports
            expect(definitions.error_report_5).toBeDefined();
            expect(definitions.error_report_5[0].id).toBe('error_reporter_5');
            expect(definitions.error_report_5[0].xp).toBe(30);
            
            // 20 reports
            expect(definitions.error_report_20).toBeDefined();
            expect(definitions.error_report_20[0].id).toBe('error_reporter_20');
            expect(definitions.error_report_20[0].xp).toBe(80);
        });
    });
    
    describe('XP System Integration', () => {
        test('should save XP data after adding XP', () => {
            gamification.addXP(25);
            
            const saved = JSON.parse(localStorage.getItem('museumcheck_xp_data'));
            expect(saved.totalXP).toBe(25);
            expect(saved.xpHistory.length).toBe(1);
            expect(saved.xpHistory[0].amount).toBe(25);
        });
        
        test('should trigger level up when crossing level threshold', () => {
            // Level 1->2 requires 100 XP
            gamification.addXP(100);
            
            const xpData = gamification.xpData;
            expect(xpData.level).toBe(2);
        });
        
        test('should track XP history', () => {
            gamification.addXP(10);
            gamification.addXP(20);
            gamification.addXP(15);
            
            expect(gamification.xpData.xpHistory.length).toBe(3);
            expect(gamification.xpData.xpHistory[0].amount).toBe(10);
            expect(gamification.xpData.xpHistory[1].amount).toBe(20);
            expect(gamification.xpData.xpHistory[2].amount).toBe(15);
        });
    });
});
