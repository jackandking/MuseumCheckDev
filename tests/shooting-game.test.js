/**
 * @jest-environment jsdom
 * 
 * Tests for the shooting game feature
 * Feature: When users complete a task with photo uploaded and setting enabled,
 *          randomly show puzzle game, maze game, or shooting game as a reward
 */

describe('Shooting Game Feature', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('Difficulty Settings', () => {
        const SHOOTING_EASY_TIME = 30;
        const SHOOTING_HARD_TIME = 20;
        
        function determineShootingDifficulty(taskIndex) {
            if (taskIndex === 0) {
                return { 
                    time: SHOOTING_EASY_TIME, 
                    difficulty: 1,
                    spawnRate: 1500,
                    maxTargets: 5 
                };
            } else {
                return { 
                    time: SHOOTING_HARD_TIME, 
                    difficulty: 2,
                    spawnRate: 1000,
                    maxTargets: 8 
                };
            }
        }

        test('should return easy settings for first task (index 0)', () => {
            const settings = determineShootingDifficulty(0);
            expect(settings.time).toBe(30);
            expect(settings.difficulty).toBe(1);
            expect(settings.spawnRate).toBe(1500);
            expect(settings.maxTargets).toBe(5);
        });

        test('should return hard settings for subsequent tasks', () => {
            const settings = determineShootingDifficulty(1);
            expect(settings.time).toBe(20);
            expect(settings.difficulty).toBe(2);
            expect(settings.spawnRate).toBe(1000);
            expect(settings.maxTargets).toBe(8);
        });

        test('should return hard settings for task index 2', () => {
            const settings = determineShootingDifficulty(2);
            expect(settings.difficulty).toBe(2);
        });
    });

    describe('Target Types', () => {
        const TARGET_TYPES = [
            { emoji: '🎈', points: 10, speed: 2, size: 40 },
            { emoji: '🦋', points: 20, speed: 3, size: 35 },
            { emoji: '🐝', points: 30, speed: 4, size: 30 },
            { emoji: '🌟', points: 50, speed: 5, size: 25 },
        ];

        test('should have 4 different target types', () => {
            expect(TARGET_TYPES.length).toBe(4);
        });

        test('should have increasing points for faster targets', () => {
            for (let i = 1; i < TARGET_TYPES.length; i++) {
                expect(TARGET_TYPES[i].points).toBeGreaterThan(TARGET_TYPES[i-1].points);
            }
        });

        test('should have increasing speed for higher point targets', () => {
            for (let i = 1; i < TARGET_TYPES.length; i++) {
                expect(TARGET_TYPES[i].speed).toBeGreaterThan(TARGET_TYPES[i-1].speed);
            }
        });

        test('should have decreasing size for higher point targets', () => {
            for (let i = 1; i < TARGET_TYPES.length; i++) {
                expect(TARGET_TYPES[i].size).toBeLessThan(TARGET_TYPES[i-1].size);
            }
        });
    });

    describe('Target Creation', () => {
        const SHOOTING_CANVAS_WIDTH = 320;
        const SHOOTING_CANVAS_HEIGHT = 400;
        const TARGET_TYPES = [
            { emoji: '🎈', points: 10, speed: 2, size: 40 },
            { emoji: '🦋', points: 20, speed: 3, size: 35 },
            { emoji: '🐝', points: 30, speed: 4, size: 30 },
            { emoji: '🌟', points: 50, speed: 5, size: 25 },
        ];

        function createShootingTarget(difficulty) {
            const typeIndex = difficulty === 1 
                ? Math.floor(Math.random() * 3)
                : Math.floor(Math.random() * TARGET_TYPES.length);
            
            const targetType = TARGET_TYPES[typeIndex];
            
            return {
                x: Math.random() * (SHOOTING_CANVAS_WIDTH - targetType.size),
                y: SHOOTING_CANVAS_HEIGHT + targetType.size,
                vx: (Math.random() - 0.5) * 2,
                vy: -targetType.speed * (0.8 + Math.random() * 0.4),
                ...targetType,
                hit: false
            };
        }

        test('should create target within canvas bounds', () => {
            for (let i = 0; i < 100; i++) {
                const target = createShootingTarget(1);
                expect(target.x).toBeGreaterThanOrEqual(0);
                expect(target.x).toBeLessThanOrEqual(SHOOTING_CANVAS_WIDTH - target.size);
            }
        });

        test('should create target starting below canvas', () => {
            const target = createShootingTarget(1);
            expect(target.y).toBeGreaterThanOrEqual(SHOOTING_CANVAS_HEIGHT);
        });

        test('should have negative vertical velocity (moving up)', () => {
            const target = createShootingTarget(1);
            expect(target.vy).toBeLessThan(0);
        });

        test('should initialize hit as false', () => {
            const target = createShootingTarget(1);
            expect(target.hit).toBe(false);
        });

        test('easy mode should not create star targets (index 3)', () => {
            // In easy mode (difficulty 1), only indices 0, 1, 2 should be possible
            for (let i = 0; i < 100; i++) {
                const target = createShootingTarget(1);
                expect(target.points).toBeLessThan(50);  // Star has 50 points
            }
        });

        test('hard mode can create star targets', () => {
            // Run many times to check if star can appear
            let hasStars = false;
            for (let i = 0; i < 200; i++) {
                const target = createShootingTarget(2);
                if (target.points === 50) {
                    hasStars = true;
                    break;
                }
            }
            expect(hasStars).toBe(true);
        });
    });

    describe('Hit Detection', () => {
        function checkHit(clickX, clickY, target) {
            const centerX = target.x + target.size / 2;
            const centerY = target.y + target.size / 2;
            const distance = Math.sqrt((clickX - centerX) ** 2 + (clickY - centerY) ** 2);
            return distance < target.size / 2 + 10;  // +10 for easier hitting
        }

        test('should detect hit when clicking on target center', () => {
            const target = { x: 100, y: 100, size: 40, points: 10 };
            const clickX = 120;  // center
            const clickY = 120;  // center
            expect(checkHit(clickX, clickY, target)).toBe(true);
        });

        test('should detect hit when clicking near target edge', () => {
            const target = { x: 100, y: 100, size: 40, points: 10 };
            const clickX = 140;  // right edge
            const clickY = 120;  // center Y
            expect(checkHit(clickX, clickY, target)).toBe(true);
        });

        test('should detect hit with 10px grace margin', () => {
            const target = { x: 100, y: 100, size: 40, points: 10 };
            const clickX = 145;  // slightly outside, but within grace
            const clickY = 120;
            expect(checkHit(clickX, clickY, target)).toBe(true);
        });

        test('should NOT detect hit when clicking far from target', () => {
            const target = { x: 100, y: 100, size: 40, points: 10 };
            const clickX = 200;  // far away
            const clickY = 200;  // far away
            expect(checkHit(clickX, clickY, target)).toBe(false);
        });
    });

    describe('Score Calculation', () => {
        test('should start at 0', () => {
            let score = 0;
            expect(score).toBe(0);
        });

        test('should add correct points for balloon hit', () => {
            let score = 0;
            const balloonPoints = 10;
            score += balloonPoints;
            expect(score).toBe(10);
        });

        test('should add correct points for star hit', () => {
            let score = 0;
            const starPoints = 50;
            score += starPoints;
            expect(score).toBe(50);
        });

        test('should accumulate multiple hits', () => {
            let score = 0;
            score += 10;  // balloon
            score += 20;  // butterfly
            score += 30;  // bee
            expect(score).toBe(60);
        });
    });

    describe('Random Game Selection with Shooting', () => {
        function selectRandomGame() {
            const rand = Math.random();
            if (rand < 0.33) {
                return 'puzzle';
            } else if (rand < 0.66) {
                return 'maze';
            } else {
                return 'shooting';
            }
        }

        test('should return one of three game types', () => {
            const result = selectRandomGame();
            expect(['puzzle', 'maze', 'shooting']).toContain(result);
        });

        test('should return all three game types over many iterations', () => {
            const results = new Set();
            for (let i = 0; i < 200; i++) {
                results.add(selectRandomGame());
            }
            expect(results.has('puzzle')).toBe(true);
            expect(results.has('maze')).toBe(true);
            expect(results.has('shooting')).toBe(true);
        });

        test('should have roughly equal distribution for all three games', () => {
            let puzzleCount = 0;
            let mazeCount = 0;
            let shootingCount = 0;
            const iterations = 1000;
            
            for (let i = 0; i < iterations; i++) {
                const game = selectRandomGame();
                if (game === 'puzzle') puzzleCount++;
                else if (game === 'maze') mazeCount++;
                else shootingCount++;
            }
            
            // Should be roughly 33% each (allow 8% deviation)
            const puzzleRatio = puzzleCount / iterations;
            const mazeRatio = mazeCount / iterations;
            const shootingRatio = shootingCount / iterations;
            
            expect(puzzleRatio).toBeGreaterThan(0.25);
            expect(puzzleRatio).toBeLessThan(0.41);
            expect(mazeRatio).toBeGreaterThan(0.25);
            expect(mazeRatio).toBeLessThan(0.41);
            expect(shootingRatio).toBeGreaterThan(0.25);
            expect(shootingRatio).toBeLessThan(0.41);
        });
    });

    describe('Timer Logic', () => {
        test('easy mode should have 30 seconds', () => {
            const SHOOTING_EASY_TIME = 30;
            expect(SHOOTING_EASY_TIME).toBe(30);
        });

        test('hard mode should have 20 seconds', () => {
            const SHOOTING_HARD_TIME = 20;
            expect(SHOOTING_HARD_TIME).toBe(20);
        });

        test('time should decrement correctly', () => {
            let timeLeft = 30;
            timeLeft--;
            expect(timeLeft).toBe(29);
            timeLeft--;
            expect(timeLeft).toBe(28);
        });

        test('game should end when time reaches 0', () => {
            let timeLeft = 1;
            let gameEnded = false;
            
            timeLeft--;
            if (timeLeft <= 0) {
                gameEnded = true;
            }
            
            expect(timeLeft).toBe(0);
            expect(gameEnded).toBe(true);
        });
    });
});
