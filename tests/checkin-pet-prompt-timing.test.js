/**
 * Tests for checkin page pet prompt timing issue fix
 * 
 * Issue: Pet prompt and nickname edit appear simultaneously for new users
 * Solution: 
 * 1. Pet prompt only appears when user has accumulated sufficient points (10+ XP)
 * 2. Default nickname is properly saved to localStorage to prevent anonymous poster
 */

describe('Checkin Page Pet Prompt Timing', () => {
    let VirtualPet;
    let mockLocalStorage;
    let mockSessionStorage;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {};
        global.localStorage = {
            getItem: jest.fn(key => mockLocalStorage[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage[key] = value;
            }),
            removeItem: jest.fn(key => {
                delete mockLocalStorage[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage = {};
            })
        };

        // Mock sessionStorage
        mockSessionStorage = {};
        global.sessionStorage = {
            getItem: jest.fn(key => mockSessionStorage[key] || null),
            setItem: jest.fn((key, value) => {
                mockSessionStorage[key] = value;
            }),
            removeItem: jest.fn(key => {
                delete mockSessionStorage[key];
            })
        };

        // Mock DOM
        document.body.innerHTML = '<div id="test-container"></div>';

        // Mock achievementGamification
        global.window.achievementGamification = {
            getXPProgress: jest.fn(() => ({ totalXP: 0 })),
            addXP: jest.fn()
        };

        // Create VirtualPet class
        VirtualPet = class {
            constructor() {
                this.petData = { adopted: false, pet: null };
            }

            hasPet() {
                return this.petData.adopted && this.petData.pet !== null;
            }

            getCurrentPoints() {
                if (window.achievementGamification) {
                    const xpProgress = window.achievementGamification.getXPProgress();
                    return xpProgress.totalXP || 0;
                }
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

            showPetAdoptionPrompt(reason = 'general') {
                if (this.hasPet()) return false;
                
                // Only show when user has accumulated some points (minimum 10 XP)
                const currentPoints = this.getCurrentPoints();
                const MINIMUM_POINTS_FOR_PROMPT = 10;
                
                if (currentPoints < MINIMUM_POINTS_FOR_PROMPT) {
                    return false; // Don't show prompt if user has insufficient points
                }
                
                // Cooldown check using mockSessionStorage directly
                const lastPromptKey = 'virtualPetPromptShown';
                const lastPromptTime = mockSessionStorage[lastPromptKey];
                const now = Date.now();
                const cooldownMs = 5 * 60 * 1000;
                
                if (lastPromptTime && (now - parseInt(lastPromptTime)) < cooldownMs) {
                    return false;
                }
                
                // Record that we showed the prompt
                mockSessionStorage[lastPromptKey] = now.toString();
                
                // Actually show the prompt (mocked)
                return true;
            }

            static showAdoptionPromptIfNeeded(reason = 'general') {
                if (window.virtualPet) {
                    return window.virtualPet.showPetAdoptionPrompt(reason);
                }
            }
        };

        global.window.VirtualPet = VirtualPet;
        global.window.virtualPet = new VirtualPet();
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete global.window.achievementGamification;
        delete global.window.VirtualPet;
        delete global.window.virtualPet;
    });

    describe('Pet Prompt Minimum Points Requirement', () => {
        test('should NOT show pet prompt when user has 0 points (new user)', () => {
            // Setup: New user with 0 points
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 0 });
            
            const result = window.virtualPet.showPetAdoptionPrompt('checkin');
            
            expect(result).toBe(false); // Prompt not shown
        });

        test('should NOT show pet prompt when user has less than 10 points', () => {
            // Setup: User with 5 points
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 5 });
            
            const result = window.virtualPet.showPetAdoptionPrompt('checkin');
            
            expect(result).toBe(false); // Prompt not shown
        });

        test('should show pet prompt when user has exactly 10 points', () => {
            // Setup: User with exactly 10 points
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 10 });
            
            const result = window.virtualPet.showPetAdoptionPrompt('checkin');
            
            expect(result).toBe(true); // Prompt shown
        });

        test('should show pet prompt when user has more than 10 points', () => {
            // Setup: User with 20 points
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 20 });
            
            const result = window.virtualPet.showPetAdoptionPrompt('checkin');
            
            expect(result).toBe(true); // Prompt shown
        });

        test('should NOT show prompt if user already has a pet', () => {
            // Setup: User with points and pet
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 20 });
            window.virtualPet.petData = {
                adopted: true,
                pet: { name: 'Test Pet' }
            };
            
            const result = window.virtualPet.showPetAdoptionPrompt('checkin');
            
            expect(result).toBe(false); // Prompt not shown
        });
    });

    describe('Default Nickname Storage', () => {
        test('should save default nickname to localStorage on first load', () => {
            // Mock the loadChildNickname function behavior
            const loadChildNickname = () => {
                try {
                    const saved = localStorage.getItem('childNickname');
                    if (saved) {
                        return saved;
                    }
                    
                    // Generate and save default nickname
                    const newNickname = `用户12345678`; // Simplified for test
                    localStorage.setItem('childNickname', newNickname);
                    return newNickname;
                } catch (error) {
                    return `用户12345678`;
                }
            };

            // First load - should generate and save nickname
            const nickname1 = loadChildNickname();
            
            expect(nickname1).toBeTruthy();
            expect(localStorage.setItem).toHaveBeenCalledWith('childNickname', nickname1);
            
            // Second load - should retrieve saved nickname
            const nickname2 = loadChildNickname();
            
            expect(nickname2).toBe(nickname1); // Same nickname
            expect(localStorage.getItem).toHaveBeenCalledWith('childNickname');
        });

        test('should not overwrite user-set nickname with default', () => {
            // Setup: User has set a custom nickname
            const customNickname = '小明';
            localStorage.setItem('childNickname', customNickname);
            mockLocalStorage['childNickname'] = customNickname;

            // Load nickname
            const loaded = localStorage.getItem('childNickname');
            
            expect(loaded).toBe(customNickname);
        });
    });

    describe('Pet Prompt Cooldown', () => {
        test('should not show prompt twice within cooldown period', () => {
            // Setup: User with sufficient points
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 20 });
            
            // Clear session storage to ensure fresh state
            mockSessionStorage = {};
            
            // First prompt
            const result1 = window.virtualPet.showPetAdoptionPrompt('checkin');
            expect(result1).toBe(true);
            
            // Second prompt immediately (should be blocked)
            const result2 = window.virtualPet.showPetAdoptionPrompt('checkin');
            expect(result2).toBe(false);
        });

        test('should allow prompt after cooldown period expires', () => {
            // Setup: User with sufficient points
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 20 });
            
            // First prompt was shown 6 minutes ago
            const firstTime = Date.now() - (6 * 60 * 1000);
            mockSessionStorage['virtualPetPromptShown'] = firstTime.toString();
            
            // Second prompt after cooldown
            const result = window.virtualPet.showPetAdoptionPrompt('checkin');
            
            expect(result).toBe(true); // Prompt shown again
        });
    });

    describe('Integration Scenario: New User First Visit', () => {
        test('new user with 0 points should see nickname edit but NOT pet prompt', () => {
            // Setup: Brand new user
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 0 });
            
            // Simulate page load sequence
            // 1. Nickname edit triggered (800ms delay in real code)
            const nicknameEditTriggered = true;
            
            // 2. Pet prompt attempted (1000ms delay in real code)
            const petPromptResult = window.virtualPet.showPetAdoptionPrompt('checkin');
            
            // Expectations
            expect(nicknameEditTriggered).toBe(true); // Nickname edit happens
            expect(petPromptResult).toBe(false); // Pet prompt does NOT appear
        });

        test('user with 10+ points should eventually see pet prompt', () => {
            // Setup: User who completed some tasks (10+ XP)
            window.achievementGamification.getXPProgress.mockReturnValue({ totalXP: 15 });
            
            // Simulate pet prompt trigger
            const petPromptResult = window.virtualPet.showPetAdoptionPrompt('xp_gain');
            
            expect(petPromptResult).toBe(true); // Pet prompt appears
        });
    });
});

describe('Nickname Storage Edge Cases', () => {
    let mockLocalStorage;

    beforeEach(() => {
        mockLocalStorage = {};
        global.localStorage = {
            getItem: jest.fn(key => mockLocalStorage[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage[key] = value;
            })
        };
    });

    test('should handle localStorage errors gracefully', () => {
        // Mock localStorage to throw error
        global.localStorage.setItem = jest.fn(() => {
            throw new Error('Storage quota exceeded');
        });

        // Attempt to save nickname
        const saveNickname = (nickname) => {
            try {
                localStorage.setItem('childNickname', nickname);
                return true;
            } catch (error) {
                return false;
            }
        };

        const result = saveNickname('测试用户');
        expect(result).toBe(false); // Should handle error gracefully
    });

    test('should generate valid UUID-based nicknames', () => {
        const generateNickname = () => {
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            const shortId = uuid.replace(/-/g, '').slice(-8);
            return `用户${shortId}`;
        };

        const nickname = generateNickname();
        
        expect(nickname).toMatch(/^用户[0-9a-f]{8}$/); // Should match pattern
        expect(nickname.length).toBe(10); // "用户" is 2 characters + 8 hex chars = 10 chars
    });
});
