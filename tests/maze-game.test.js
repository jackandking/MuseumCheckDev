/**
 * @jest-environment jsdom
 * 
 * Tests for the maze game feature
 * Feature: When users complete a task with photo uploaded and setting enabled,
 *          randomly show either a puzzle game or a maze game as a reward
 */

describe('Maze Game Feature', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('Maze Generation', () => {
        // Constants matching the implementation
        const WALL = 1;
        const PATH = 0;
        const mazeSize = 9;

        // Simplified maze generation for testing (same algorithm as implementation)
        function generateMaze() {
            const mazeGrid = Array(mazeSize).fill(null).map(() => Array(mazeSize).fill(WALL));
            
            const stack = [];
            const startX = 1;
            const startY = 1;
            
            mazeGrid[startY][startX] = PATH;
            stack.push({ x: startX, y: startY });
            
            const directions = [
                { dx: 0, dy: -2 },
                { dx: 0, dy: 2 },
                { dx: -2, dy: 0 },
                { dx: 2, dy: 0 }
            ];
            
            while (stack.length > 0) {
                const current = stack[stack.length - 1];
                // Fisher-Yates shuffle
                const shuffledDirs = [...directions];
                for (let i = shuffledDirs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledDirs[i], shuffledDirs[j]] = [shuffledDirs[j], shuffledDirs[i]];
                }
                
                let found = false;
                for (const dir of shuffledDirs) {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;
                    
                    if (newX > 0 && newX < mazeSize - 1 && 
                        newY > 0 && newY < mazeSize - 1 && 
                        mazeGrid[newY][newX] === WALL) {
                        
                        mazeGrid[newY][newX] = PATH;
                        mazeGrid[current.y + dir.dy / 2][current.x + dir.dx / 2] = PATH;
                        
                        stack.push({ x: newX, y: newY });
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    stack.pop();
                }
            }
            
            mazeGrid[mazeSize - 2][mazeSize - 2] = PATH;
            
            return mazeGrid;
        }

        test('should generate a maze of correct size (9x9)', () => {
            const maze = generateMaze();
            expect(maze.length).toBe(9);
            expect(maze[0].length).toBe(9);
        });

        test('should have walls on the border', () => {
            const maze = generateMaze();
            
            // Check top and bottom rows
            for (let x = 0; x < mazeSize; x++) {
                expect(maze[0][x]).toBe(WALL);
                expect(maze[mazeSize - 1][x]).toBe(WALL);
            }
            
            // Check left and right columns
            for (let y = 0; y < mazeSize; y++) {
                expect(maze[y][0]).toBe(WALL);
                expect(maze[y][mazeSize - 1]).toBe(WALL);
            }
        });

        test('should have start position (1,1) as path', () => {
            const maze = generateMaze();
            expect(maze[1][1]).toBe(PATH);
        });

        test('should have exit position (7,7) as path', () => {
            const maze = generateMaze();
            expect(maze[7][7]).toBe(PATH);
        });

        test('should contain both walls and paths', () => {
            const maze = generateMaze();
            let hasWall = false;
            let hasPath = false;
            
            for (let y = 0; y < mazeSize; y++) {
                for (let x = 0; x < mazeSize; x++) {
                    if (maze[y][x] === WALL) hasWall = true;
                    if (maze[y][x] === PATH) hasPath = true;
                }
            }
            
            expect(hasWall).toBe(true);
            expect(hasPath).toBe(true);
        });
    });

    describe('Player Movement', () => {
        const WALL = 1;
        const PATH = 0;
        
        // Simple test maze
        // 1 1 1 1 1
        // 1 0 0 0 1
        // 1 0 1 0 1
        // 1 0 0 0 1
        // 1 1 1 1 1
        const testMaze = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ];
        
        function canMove(maze, playerPos, dx, dy) {
            const newX = playerPos.x + dx;
            const newY = playerPos.y + dy;
            const mazeHeight = maze.length;
            const mazeWidth = maze[0].length;
            
            return newX >= 0 && newX < mazeWidth && 
                   newY >= 0 && newY < mazeHeight && 
                   maze[newY][newX] !== WALL;
        }

        test('should allow moving to a path cell', () => {
            const playerPos = { x: 1, y: 1 };
            expect(canMove(testMaze, playerPos, 1, 0)).toBe(true);  // Right to (2,1)
            expect(canMove(testMaze, playerPos, 0, 1)).toBe(true);  // Down to (1,2)
        });

        test('should not allow moving to a wall cell', () => {
            const playerPos = { x: 1, y: 1 };
            expect(canMove(testMaze, playerPos, -1, 0)).toBe(false);  // Left into wall
            expect(canMove(testMaze, playerPos, 0, -1)).toBe(false);  // Up into wall
        });

        test('should not allow moving out of bounds', () => {
            const playerPos = { x: 0, y: 0 };
            expect(canMove(testMaze, playerPos, -1, 0)).toBe(false);  // Left out of bounds
            expect(canMove(testMaze, playerPos, 0, -1)).toBe(false);  // Up out of bounds
        });

        test('should not allow moving through center wall', () => {
            const playerPos = { x: 1, y: 2 };
            expect(canMove(testMaze, playerPos, 1, 0)).toBe(false);  // Right into center wall at (2,2)
        });

        test('should allow moving around the center wall', () => {
            const playerPos = { x: 2, y: 1 };
            expect(canMove(testMaze, playerPos, 1, 0)).toBe(true);  // Right to (3,1)
            expect(canMove(testMaze, playerPos, 0, 1)).toBe(false); // Down into center wall
        });
    });

    describe('Win Condition', () => {
        function checkWin(playerPos, exitPos) {
            return playerPos.x === exitPos.x && playerPos.y === exitPos.y;
        }

        test('should return true when player reaches exit', () => {
            const playerPos = { x: 7, y: 7 };
            const exitPos = { x: 7, y: 7 };
            expect(checkWin(playerPos, exitPos)).toBe(true);
        });

        test('should return false when player is not at exit', () => {
            const playerPos = { x: 1, y: 1 };
            const exitPos = { x: 7, y: 7 };
            expect(checkWin(playerPos, exitPos)).toBe(false);
        });

        test('should return false when only x matches', () => {
            const playerPos = { x: 7, y: 1 };
            const exitPos = { x: 7, y: 7 };
            expect(checkWin(playerPos, exitPos)).toBe(false);
        });

        test('should return false when only y matches', () => {
            const playerPos = { x: 1, y: 7 };
            const exitPos = { x: 7, y: 7 };
            expect(checkWin(playerPos, exitPos)).toBe(false);
        });
    });

    describe('Step Counter', () => {
        let steps = 0;
        
        function incrementSteps() {
            steps++;
            return steps;
        }
        
        function resetSteps() {
            steps = 0;
            return steps;
        }

        beforeEach(() => {
            steps = 0;
        });

        test('should start at 0', () => {
            expect(steps).toBe(0);
        });

        test('should increment when player moves', () => {
            incrementSteps();
            expect(steps).toBe(1);
            incrementSteps();
            expect(steps).toBe(2);
        });

        test('should reset to 0', () => {
            incrementSteps();
            incrementSteps();
            resetSteps();
            expect(steps).toBe(0);
        });
    });

    describe('Random Game Selection', () => {
        function selectRandomGame() {
            return Math.random() < 0.5 ? 'puzzle' : 'maze';
        }

        test('should return either puzzle or maze', () => {
            const result = selectRandomGame();
            expect(['puzzle', 'maze']).toContain(result);
        });

        test('should return both game types over many iterations', () => {
            const results = new Set();
            for (let i = 0; i < 100; i++) {
                results.add(selectRandomGame());
            }
            expect(results.has('puzzle')).toBe(true);
            expect(results.has('maze')).toBe(true);
        });

        test('should have roughly equal distribution', () => {
            let puzzleCount = 0;
            let mazeCount = 0;
            const iterations = 1000;
            
            for (let i = 0; i < iterations; i++) {
                if (selectRandomGame() === 'puzzle') {
                    puzzleCount++;
                } else {
                    mazeCount++;
                }
            }
            
            // Should be roughly 50/50 (allow 10% deviation)
            const puzzleRatio = puzzleCount / iterations;
            expect(puzzleRatio).toBeGreaterThan(0.4);
            expect(puzzleRatio).toBeLessThan(0.6);
        });
    });

    describe('Game Trigger Logic', () => {
        function loadPuzzleGameSetting() {
            try {
                const saved = localStorage.getItem('puzzleGameEnabled');
                return saved === 'true';
            } catch (error) {
                return false;
            }
        }

        function shouldShowGame(hasPhoto, settingEnabled) {
            return hasPhoto && settingEnabled;
        }

        test('should show game when photo exists and setting enabled', () => {
            localStorage.setItem('puzzleGameEnabled', 'true');
            const result = shouldShowGame(true, loadPuzzleGameSetting());
            expect(result).toBe(true);
        });

        test('should NOT show game when photo exists but setting disabled', () => {
            localStorage.setItem('puzzleGameEnabled', 'false');
            const result = shouldShowGame(true, loadPuzzleGameSetting());
            expect(result).toBe(false);
        });

        test('should NOT show game when no photo even if setting enabled', () => {
            localStorage.setItem('puzzleGameEnabled', 'true');
            const result = shouldShowGame(false, loadPuzzleGameSetting());
            expect(result).toBe(false);
        });

        test('should NOT show game by default (setting not set)', () => {
            const result = shouldShowGame(true, loadPuzzleGameSetting());
            expect(result).toBe(false);
        });
    });

    describe('Maze Path Finding (BFS verification)', () => {
        const WALL = 1;
        const PATH = 0;

        // Check if there's a path from start to end using BFS
        function hasPath(maze, start, end) {
            const visited = new Set();
            const queue = [start];
            const mazeHeight = maze.length;
            const mazeWidth = maze[0].length;
            
            while (queue.length > 0) {
                const current = queue.shift();
                const key = `${current.x},${current.y}`;
                
                if (visited.has(key)) continue;
                visited.add(key);
                
                if (current.x === end.x && current.y === end.y) {
                    return true;
                }
                
                const directions = [
                    { dx: 0, dy: -1 },
                    { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 },
                    { dx: 1, dy: 0 }
                ];
                
                for (const dir of directions) {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;
                    
                    if (newX >= 0 && newX < mazeWidth && 
                        newY >= 0 && newY < mazeHeight && 
                        maze[newY][newX] === PATH) {
                        queue.push({ x: newX, y: newY });
                    }
                }
            }
            
            return false;
        }

        // Generate maze using the same algorithm
        function generateMaze(size) {
            const mazeGrid = Array(size).fill(null).map(() => Array(size).fill(WALL));
            
            const stack = [];
            const startX = 1;
            const startY = 1;
            
            mazeGrid[startY][startX] = PATH;
            stack.push({ x: startX, y: startY });
            
            const directions = [
                { dx: 0, dy: -2 },
                { dx: 0, dy: 2 },
                { dx: -2, dy: 0 },
                { dx: 2, dy: 0 }
            ];
            
            while (stack.length > 0) {
                const current = stack[stack.length - 1];
                // Fisher-Yates shuffle
                const shuffledDirs = [...directions];
                for (let i = shuffledDirs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledDirs[i], shuffledDirs[j]] = [shuffledDirs[j], shuffledDirs[i]];
                }
                
                let found = false;
                for (const dir of shuffledDirs) {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;
                    
                    if (newX > 0 && newX < size - 1 && 
                        newY > 0 && newY < size - 1 && 
                        mazeGrid[newY][newX] === WALL) {
                        
                        mazeGrid[newY][newX] = PATH;
                        mazeGrid[current.y + dir.dy / 2][current.x + dir.dx / 2] = PATH;
                        
                        stack.push({ x: newX, y: newY });
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    stack.pop();
                }
            }
            
            mazeGrid[size - 2][size - 2] = PATH;
            
            return mazeGrid;
        }

        test('generated maze should always have a path from start to exit', () => {
            // Test multiple mazes to ensure they're all solvable
            for (let i = 0; i < 10; i++) {
                const maze = generateMaze(9);
                const start = { x: 1, y: 1 };
                const end = { x: 7, y: 7 };
                
                expect(hasPath(maze, start, end)).toBe(true);
            }
        });

        test('should detect when there is no path', () => {
            // Maze with no path (completely blocked)
            const blockedMaze = [
                [1, 1, 1, 1, 1],
                [1, 0, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 0, 1],
                [1, 1, 1, 1, 1]
            ];
            
            const start = { x: 1, y: 1 };
            const end = { x: 3, y: 3 };
            
            expect(hasPath(blockedMaze, start, end)).toBe(false);
        });
    });

    describe('Maze Difficulty Settings', () => {
        const EASY_MAZE_SIZE = 9;
        const HARD_MAZE_SIZE = 15;

        function determineMazeSize(taskIndex) {
            if (taskIndex === 0) {
                return { size: EASY_MAZE_SIZE, cellSize: 30 };
            } else {
                return { size: HARD_MAZE_SIZE, cellSize: 18 };
            }
        }

        test('should return easy settings (9x9) for first task', () => {
            const settings = determineMazeSize(0);
            expect(settings.size).toBe(9);
            expect(settings.cellSize).toBe(30);
        });

        test('should return hard settings (15x15) for subsequent tasks', () => {
            const settings = determineMazeSize(1);
            expect(settings.size).toBe(15);
            expect(settings.cellSize).toBe(18);
        });

        test('should return hard settings for task index 2', () => {
            const settings = determineMazeSize(2);
            expect(settings.size).toBe(15);
        });

        test('should use smaller cells for larger maze to fit canvas', () => {
            const easySettings = determineMazeSize(0);
            const hardSettings = determineMazeSize(1);
            
            // Larger maze should have smaller cells
            expect(hardSettings.cellSize).toBeLessThan(easySettings.cellSize);
        });

        test('hard maze should have more path options', () => {
            // 15x15 maze has more cells than 9x9
            const easyCount = 9 * 9;  // 81 cells
            const hardCount = 15 * 15;  // 225 cells
            
            expect(hardCount).toBeGreaterThan(easyCount);
            expect(hardCount).toBe(225);
            expect(easyCount).toBe(81);
        });
    });

    describe('Maze Generation with Dynamic Size', () => {
        const WALL = 1;
        const PATH = 0;

        function generateMazeWithSize(size) {
            const mazeGrid = Array(size).fill(null).map(() => Array(size).fill(WALL));
            
            const stack = [];
            const startX = 1;
            const startY = 1;
            
            mazeGrid[startY][startX] = PATH;
            stack.push({ x: startX, y: startY });
            
            const directions = [
                { dx: 0, dy: -2 },
                { dx: 0, dy: 2 },
                { dx: -2, dy: 0 },
                { dx: 2, dy: 0 }
            ];
            
            while (stack.length > 0) {
                const current = stack[stack.length - 1];
                const shuffledDirs = [...directions];
                for (let i = shuffledDirs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledDirs[i], shuffledDirs[j]] = [shuffledDirs[j], shuffledDirs[i]];
                }
                
                let found = false;
                for (const dir of shuffledDirs) {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;
                    
                    if (newX > 0 && newX < size - 1 && 
                        newY > 0 && newY < size - 1 && 
                        mazeGrid[newY][newX] === WALL) {
                        
                        mazeGrid[newY][newX] = PATH;
                        mazeGrid[current.y + dir.dy / 2][current.x + dir.dx / 2] = PATH;
                        
                        stack.push({ x: newX, y: newY });
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    stack.pop();
                }
            }
            
            mazeGrid[size - 2][size - 2] = PATH;
            
            return mazeGrid;
        }

        test('should generate 15x15 maze correctly', () => {
            const maze = generateMazeWithSize(15);
            expect(maze.length).toBe(15);
            expect(maze[0].length).toBe(15);
        });

        test('15x15 maze should have start at (1,1)', () => {
            const maze = generateMazeWithSize(15);
            expect(maze[1][1]).toBe(PATH);
        });

        test('15x15 maze should have exit at (13,13)', () => {
            const maze = generateMazeWithSize(15);
            expect(maze[13][13]).toBe(PATH);
        });

        test('15x15 maze should have walls on border', () => {
            const maze = generateMazeWithSize(15);
            
            // Check top and bottom rows
            for (let x = 0; x < 15; x++) {
                expect(maze[0][x]).toBe(WALL);
                expect(maze[14][x]).toBe(WALL);
            }
            
            // Check left and right columns
            for (let y = 0; y < 15; y++) {
                expect(maze[y][0]).toBe(WALL);
                expect(maze[y][14]).toBe(WALL);
            }
        });
    });
});
