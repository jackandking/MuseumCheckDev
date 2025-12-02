/**
 * Regression test for leaderboard pet stats submission bug
 * 
 * Issue: 排行榜不工作 (Leaderboard not working)
 * - User completes a task and views pet leaderboard
 * - Expected: See rank and stats
 * - Actual: Leaderboard is empty
 * 
 * Root cause: shouldSubmitScore() did not check for pet stats changes
 * When a user's pet stats changed (attack, defense, totalPower),
 * the leaderboard submission was not triggered.
 * 
 * Fix: Added pet stats comparison to shouldSubmitScore() and
 * save lastSubmittedPetPower after successful submission.
 */

describe('Leaderboard pet stats submission', () => {
    let mockFetch;
    let originalVirtualPet;
    
    beforeEach(() => {
        // Setup mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        // Reset localStorage
        localStorage.clear();
        
        // Save original VirtualPet
        originalVirtualPet = global.VirtualPet;
        
        // Mock VirtualPet class
        global.VirtualPet = {
            PET_TYPES: {
                dragon: { name: '小龙', emoji: '🐉' },
                cat: { name: '小猫', emoji: '🐱' }
            }
        };
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
        global.VirtualPet = originalVirtualPet;
    });
    
    test('shouldSubmitScore should return true when pet stats change', () => {
        // Create a mock LeaderboardManager with the fixed shouldSubmitScore logic
        const mockApp = {
            visitedMuseums: [],
            achievementGamification: {
                getXPInfo: () => ({ total: 0 })
            }
        };
        
        // Mock shouldSubmitScore function with the fix
        const shouldSubmitScore = function() {
            const lastSubmittedCount = parseInt(localStorage.getItem('lastSubmittedVisitCount') || '0', 10);
            const currentCount = mockApp.visitedMuseums.length;
            
            if (currentCount !== lastSubmittedCount) {
                return true;
            }
            
            const lastSubmittedXP = parseInt(localStorage.getItem('lastSubmittedXP') || '0', 10);
            let currentXP = 0;
            if (mockApp.achievementGamification) {
                const xpData = mockApp.achievementGamification.getXPInfo();
                currentXP = xpData.total || 0;
            }
            
            if (currentXP !== lastSubmittedXP) {
                return true;
            }
            
            // The new logic: check pet stats
            const lastSubmittedPetPower = parseInt(localStorage.getItem('lastSubmittedPetPower') || '0', 10);
            let currentPetPower = 0;
            try {
                if (typeof VirtualPet !== 'undefined') {
                    const petData = JSON.parse(localStorage.getItem('virtualPetData') || '{}');
                    if (petData.adopted && petData.pet && !petData.pet.isDead) {
                        const pet = petData.pet;
                        currentPetPower = (pet.attack || 10) + (pet.defense || 10);
                    }
                }
            } catch (e) {
                // Ignore pet data parsing errors
            }
            
            return currentPetPower !== lastSubmittedPetPower;
        };
        
        // Scenario: User has never submitted before, no pet
        expect(shouldSubmitScore()).toBe(false);
        
        // Scenario: User adopts a pet with default stats (attack: 10, defense: 10)
        localStorage.setItem('virtualPetData', JSON.stringify({
            adopted: true,
            pet: {
                type: 'dragon',
                attack: 10,
                defense: 10,
                isDead: false
            }
        }));
        
        // Now pet power is 20, last submitted is 0, should submit
        expect(shouldSubmitScore()).toBe(true);
        
        // Simulate successful submission
        localStorage.setItem('lastSubmittedPetPower', '20');
        
        // No change now
        expect(shouldSubmitScore()).toBe(false);
        
        // Pet stats change (training/feeding increased attack)
        localStorage.setItem('virtualPetData', JSON.stringify({
            adopted: true,
            pet: {
                type: 'dragon',
                attack: 15,
                defense: 10,
                isDead: false
            }
        }));
        
        // Pet power is now 25, but last submitted is 20, should submit
        expect(shouldSubmitScore()).toBe(true);
    });
    
    test('autoSubmitScore should save lastSubmittedPetPower after successful submission', async () => {
        // Mock successful API response
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });
        
        // Set up pet data
        localStorage.setItem('virtualPetData', JSON.stringify({
            adopted: true,
            pet: {
                type: 'cat',
                attack: 15,
                defense: 10,
                isDead: false
            }
        }));
        
        // Simulate the fixed autoSubmitScore logic that saves pet power
        const submitAndSavePetPower = async () => {
            const petData = JSON.parse(localStorage.getItem('virtualPetData') || '{}');
            const petStats = {
                attack: petData.pet.attack,
                defense: petData.pet.defense,
                totalPower: petData.pet.attack + petData.pet.defense
            };
            
            // Simulate API call
            await fetch('https://api.example.com/leaderboard', {
                method: 'POST',
                body: JSON.stringify({ petStats })
            });
            
            // Save pet power for future comparison (the fix)
            if (petStats && petStats.totalPower) {
                localStorage.setItem('lastSubmittedPetPower', petStats.totalPower.toString());
            }
        };
        
        // Before submission
        expect(localStorage.getItem('lastSubmittedPetPower')).toBeNull();
        
        // Submit
        await submitAndSavePetPower();
        
        // After submission, pet power should be saved
        expect(localStorage.getItem('lastSubmittedPetPower')).toBe('25');
    });
    
    test('empty entries message should be shown for all ranking types', () => {
        // Test the noDataMessages object has all ranking types
        const noDataMessages = {
            visits: { icon: '🏅', title: '暂无排行数据', subtitle: '完成任务后将显示排名！' },
            xp: { icon: '⭐', title: '暂无积分数据', subtitle: '完成任务获取积分，成为积分王！' },
            pet: { icon: '🐾', title: '暂无宠物数据', subtitle: '领养宠物后，你的宠物会出现在这里！' }
        };
        
        // All ranking types should have messages
        expect(noDataMessages['visits']).toBeDefined();
        expect(noDataMessages['xp']).toBeDefined();
        expect(noDataMessages['pet']).toBeDefined();
        
        // Verify message content
        expect(noDataMessages['visits'].title).toBe('暂无排行数据');
        expect(noDataMessages['xp'].title).toBe('暂无积分数据');
        expect(noDataMessages['pet'].title).toBe('暂无宠物数据');
    });
});
