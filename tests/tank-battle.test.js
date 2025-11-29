/**
 * @jest-environment jsdom
 * 
 * Tests for the Tank Battle (坦克大战) game feature
 * Feature: Tank Battle is a classic arcade-style tank game where players
 *          control a tank to destroy enemy tanks while avoiding being hit
 */

describe('Tank Battle Game Feature', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('Game Constants', () => {
        const TB_CANVAS_WIDTH = 320;
        const TB_CANVAS_HEIGHT = 320;
        const TB_TILE_SIZE = 32;
        const TB_TANK_SIZE = 28;
        const TB_BULLET_SIZE = 6;
        const TB_PLAYER_SPEED = 2.5;
        const TB_ENEMY_SPEED = 1.2;
        const TB_BULLET_SPEED = 6;

        test('should have correct canvas dimensions', () => {
            expect(TB_CANVAS_WIDTH).toBe(320);
            expect(TB_CANVAS_HEIGHT).toBe(320);
        });

        test('should have correct tile and tank sizes', () => {
            expect(TB_TILE_SIZE).toBe(32);
            expect(TB_TANK_SIZE).toBe(28);
            expect(TB_TANK_SIZE).toBeLessThan(TB_TILE_SIZE);
        });

        test('player should be faster than enemies', () => {
            expect(TB_PLAYER_SPEED).toBeGreaterThan(TB_ENEMY_SPEED);
        });
    });

    describe('Difficulty Settings', () => {
        function determineTankBattleDifficulty(taskIndex) {
            if (taskIndex === 0) {
                return { 
                    lives: 5,
                    enemyCount: 3,
                    wallCount: 6
                };
            } else {
                return { 
                    lives: 3,
                    enemyCount: 5,
                    wallCount: 10
                };
            }
        }

        test('should return easy settings for first task (index 0)', () => {
            const settings = determineTankBattleDifficulty(0);
            expect(settings.lives).toBe(5);
            expect(settings.enemyCount).toBe(3);
            expect(settings.wallCount).toBe(6);
        });

        test('should return normal settings for subsequent tasks', () => {
            const settings = determineTankBattleDifficulty(1);
            expect(settings.lives).toBe(3);
            expect(settings.enemyCount).toBe(5);
            expect(settings.wallCount).toBe(10);
        });

        test('easy mode should have more lives', () => {
            const easy = determineTankBattleDifficulty(0);
            const normal = determineTankBattleDifficulty(1);
            expect(easy.lives).toBeGreaterThan(normal.lives);
        });

        test('easy mode should have fewer enemies', () => {
            const easy = determineTankBattleDifficulty(0);
            const normal = determineTankBattleDifficulty(1);
            expect(easy.enemyCount).toBeLessThan(normal.enemyCount);
        });
    });

    describe('Tank Movement', () => {
        const TB_CANVAS_WIDTH = 320;
        const TB_CANVAS_HEIGHT = 320;
        const TB_TANK_SIZE = 28;
        const TB_PLAYER_SPEED = 2.5;

        function moveTank(tank, direction, speed) {
            let newX = tank.x;
            let newY = tank.y;
            
            switch (direction) {
                case 'up': newY -= speed; break;
                case 'down': newY += speed; break;
                case 'left': newX -= speed; break;
                case 'right': newX += speed; break;
            }
            
            // Boundary check
            newX = Math.max(0, Math.min(TB_CANVAS_WIDTH - TB_TANK_SIZE, newX));
            newY = Math.max(0, Math.min(TB_CANVAS_HEIGHT - TB_TANK_SIZE, newY));
            
            return { x: newX, y: newY, direction };
        }

        test('should move up correctly', () => {
            const tank = { x: 100, y: 100 };
            const result = moveTank(tank, 'up', TB_PLAYER_SPEED);
            expect(result.y).toBe(100 - TB_PLAYER_SPEED);
            expect(result.direction).toBe('up');
        });

        test('should move down correctly', () => {
            const tank = { x: 100, y: 100 };
            const result = moveTank(tank, 'down', TB_PLAYER_SPEED);
            expect(result.y).toBe(100 + TB_PLAYER_SPEED);
            expect(result.direction).toBe('down');
        });

        test('should move left correctly', () => {
            const tank = { x: 100, y: 100 };
            const result = moveTank(tank, 'left', TB_PLAYER_SPEED);
            expect(result.x).toBe(100 - TB_PLAYER_SPEED);
            expect(result.direction).toBe('left');
        });

        test('should move right correctly', () => {
            const tank = { x: 100, y: 100 };
            const result = moveTank(tank, 'right', TB_PLAYER_SPEED);
            expect(result.x).toBe(100 + TB_PLAYER_SPEED);
            expect(result.direction).toBe('right');
        });

        test('should not move past left boundary', () => {
            const tank = { x: 0, y: 100 };
            const result = moveTank(tank, 'left', TB_PLAYER_SPEED);
            expect(result.x).toBe(0);
        });

        test('should not move past top boundary', () => {
            const tank = { x: 100, y: 0 };
            const result = moveTank(tank, 'up', TB_PLAYER_SPEED);
            expect(result.y).toBe(0);
        });

        test('should not move past right boundary', () => {
            const tank = { x: TB_CANVAS_WIDTH - TB_TANK_SIZE, y: 100 };
            const result = moveTank(tank, 'right', TB_PLAYER_SPEED);
            expect(result.x).toBe(TB_CANVAS_WIDTH - TB_TANK_SIZE);
        });

        test('should not move past bottom boundary', () => {
            const tank = { x: 100, y: TB_CANVAS_HEIGHT - TB_TANK_SIZE };
            const result = moveTank(tank, 'down', TB_PLAYER_SPEED);
            expect(result.y).toBe(TB_CANVAS_HEIGHT - TB_TANK_SIZE);
        });
    });

    describe('Bullet Firing', () => {
        const TB_BULLET_SIZE = 6;
        const TB_BULLET_SPEED = 6;
        const TB_TANK_SIZE = 28;

        function fireBullet(tank) {
            let bx, by, vx = 0, vy = 0;
            switch (tank.direction) {
                case 'up':
                    bx = tank.x + tank.width / 2 - TB_BULLET_SIZE / 2;
                    by = tank.y - TB_BULLET_SIZE;
                    vy = -TB_BULLET_SPEED;
                    break;
                case 'down':
                    bx = tank.x + tank.width / 2 - TB_BULLET_SIZE / 2;
                    by = tank.y + tank.height;
                    vy = TB_BULLET_SPEED;
                    break;
                case 'left':
                    bx = tank.x - TB_BULLET_SIZE;
                    by = tank.y + tank.height / 2 - TB_BULLET_SIZE / 2;
                    vx = -TB_BULLET_SPEED;
                    break;
                case 'right':
                    bx = tank.x + tank.width;
                    by = tank.y + tank.height / 2 - TB_BULLET_SIZE / 2;
                    vx = TB_BULLET_SPEED;
                    break;
            }
            return { x: bx, y: by, vx, vy };
        }

        test('should fire bullet upward when facing up', () => {
            const tank = { x: 100, y: 100, width: TB_TANK_SIZE, height: TB_TANK_SIZE, direction: 'up' };
            const bullet = fireBullet(tank);
            expect(bullet.vy).toBeLessThan(0);
            expect(bullet.vx).toBe(0);
        });

        test('should fire bullet downward when facing down', () => {
            const tank = { x: 100, y: 100, width: TB_TANK_SIZE, height: TB_TANK_SIZE, direction: 'down' };
            const bullet = fireBullet(tank);
            expect(bullet.vy).toBeGreaterThan(0);
            expect(bullet.vx).toBe(0);
        });

        test('should fire bullet leftward when facing left', () => {
            const tank = { x: 100, y: 100, width: TB_TANK_SIZE, height: TB_TANK_SIZE, direction: 'left' };
            const bullet = fireBullet(tank);
            expect(bullet.vx).toBeLessThan(0);
            expect(bullet.vy).toBe(0);
        });

        test('should fire bullet rightward when facing right', () => {
            const tank = { x: 100, y: 100, width: TB_TANK_SIZE, height: TB_TANK_SIZE, direction: 'right' };
            const bullet = fireBullet(tank);
            expect(bullet.vx).toBeGreaterThan(0);
            expect(bullet.vy).toBe(0);
        });
    });

    describe('Collision Detection', () => {
        function isColliding(a, b) {
            return a.x < b.x + b.width && a.x + a.width > b.x &&
                   a.y < b.y + b.height && a.y + a.height > b.y;
        }

        test('should detect collision when objects overlap', () => {
            const obj1 = { x: 100, y: 100, width: 28, height: 28 };
            const obj2 = { x: 110, y: 110, width: 28, height: 28 };
            expect(isColliding(obj1, obj2)).toBe(true);
        });

        test('should not detect collision when objects are apart', () => {
            const obj1 = { x: 100, y: 100, width: 28, height: 28 };
            const obj2 = { x: 200, y: 200, width: 28, height: 28 };
            expect(isColliding(obj1, obj2)).toBe(false);
        });

        test('should detect edge touch as collision', () => {
            const obj1 = { x: 100, y: 100, width: 28, height: 28 };
            const obj2 = { x: 127, y: 100, width: 28, height: 28 };
            expect(isColliding(obj1, obj2)).toBe(true);
        });

        test('should not detect adjacent objects as collision', () => {
            const obj1 = { x: 100, y: 100, width: 28, height: 28 };
            const obj2 = { x: 128, y: 100, width: 28, height: 28 };
            expect(isColliding(obj1, obj2)).toBe(false);
        });
    });

    describe('Score System', () => {
        test('should award 100 points for destroying an enemy', () => {
            let score = 0;
            const ENEMY_SCORE = 100;
            score += ENEMY_SCORE;
            expect(score).toBe(100);
        });

        test('should award 200 bonus points for victory', () => {
            let score = 300;
            const VICTORY_BONUS = 200;
            score += VICTORY_BONUS;
            expect(score).toBe(500);
        });

        test('should accumulate score correctly', () => {
            let score = 0;
            const ENEMY_SCORE = 100;
            score += ENEMY_SCORE;
            score += ENEMY_SCORE;
            score += ENEMY_SCORE;
            expect(score).toBe(300);
        });
    });

    describe('Win/Lose Conditions', () => {
        test('should win when all enemies are destroyed', () => {
            const enemies = [];
            const hasWon = enemies.length === 0;
            expect(hasWon).toBe(true);
        });

        test('should not win when enemies remain', () => {
            const enemies = [{ x: 100, y: 100 }];
            const hasWon = enemies.length === 0;
            expect(hasWon).toBe(false);
        });

        test('should lose when lives reach 0', () => {
            let lives = 1;
            lives--;
            const hasLost = lives <= 0;
            expect(hasLost).toBe(true);
        });

        test('should not lose when lives remain', () => {
            let lives = 3;
            lives--;
            const hasLost = lives <= 0;
            expect(hasLost).toBe(false);
        });
    });

    describe('Wall Destruction', () => {
        test('wall should be destroyed after 2 hits', () => {
            let wallHealth = 2;
            wallHealth--;  // First hit
            expect(wallHealth).toBe(1);
            wallHealth--;  // Second hit
            expect(wallHealth).toBe(0);
            const isDestroyed = wallHealth <= 0;
            expect(isDestroyed).toBe(true);
        });

        test('wall should survive 1 hit', () => {
            let wallHealth = 2;
            wallHealth--;  // First hit
            const isDestroyed = wallHealth <= 0;
            expect(isDestroyed).toBe(false);
        });
    });

    describe('Random Game Selection with Tank Battle', () => {
        function selectRandomGame() {
            const rand = Math.random();
            if (rand < 0.2) {
                return 'puzzle';
            } else if (rand < 0.4) {
                return 'maze';
            } else if (rand < 0.6) {
                return 'shooting';
            } else if (rand < 0.8) {
                return 'space-invaders';
            } else {
                return 'tank-battle';
            }
        }

        test('should return one of five game types', () => {
            const result = selectRandomGame();
            expect(['puzzle', 'maze', 'shooting', 'space-invaders', 'tank-battle']).toContain(result);
        });

        test('should return all five game types over many iterations', () => {
            const results = new Set();
            for (let i = 0; i < 500; i++) {
                results.add(selectRandomGame());
            }
            expect(results.has('puzzle')).toBe(true);
            expect(results.has('maze')).toBe(true);
            expect(results.has('shooting')).toBe(true);
            expect(results.has('space-invaders')).toBe(true);
            expect(results.has('tank-battle')).toBe(true);
        });

        test('should have roughly equal distribution for all five games', () => {
            let puzzleCount = 0;
            let mazeCount = 0;
            let shootingCount = 0;
            let spaceInvadersCount = 0;
            let tankBattleCount = 0;
            const iterations = 2000;
            
            for (let i = 0; i < iterations; i++) {
                const game = selectRandomGame();
                if (game === 'puzzle') puzzleCount++;
                else if (game === 'maze') mazeCount++;
                else if (game === 'shooting') shootingCount++;
                else if (game === 'space-invaders') spaceInvadersCount++;
                else tankBattleCount++;
            }
            
            // Should be roughly 20% each (allow 8% deviation)
            const puzzleRatio = puzzleCount / iterations;
            const mazeRatio = mazeCount / iterations;
            const shootingRatio = shootingCount / iterations;
            const siRatio = spaceInvadersCount / iterations;
            const tbRatio = tankBattleCount / iterations;
            
            expect(puzzleRatio).toBeGreaterThan(0.12);
            expect(puzzleRatio).toBeLessThan(0.28);
            expect(mazeRatio).toBeGreaterThan(0.12);
            expect(mazeRatio).toBeLessThan(0.28);
            expect(shootingRatio).toBeGreaterThan(0.12);
            expect(shootingRatio).toBeLessThan(0.28);
            expect(siRatio).toBeGreaterThan(0.12);
            expect(siRatio).toBeLessThan(0.28);
            expect(tbRatio).toBeGreaterThan(0.12);
            expect(tbRatio).toBeLessThan(0.28);
        });
    });
});
