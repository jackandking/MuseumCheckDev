/**
 * @jest-environment jsdom
 * 
 * Tests for the puzzle game reward feature
 * Feature: When users complete a task with photo uploaded and setting enabled,
 *          show a puzzle game as a reward
 *          - First task (门口打卡): 4-grid (2x2) puzzle
 *          - Subsequent tasks: 9-grid (3x3) puzzle
 */

describe('Puzzle Game Reward Feature', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    // Shared utility functions to reduce code duplication
    function createGetValidMoves(puzzleSize) {
        return function getValidMoves(emptyIndex) {
            const moves = [];
            const row = Math.floor(emptyIndex / puzzleSize);
            const col = emptyIndex % puzzleSize;
            
            if (row > 0) moves.push(emptyIndex - puzzleSize);
            if (row < puzzleSize - 1) moves.push(emptyIndex + puzzleSize);
            if (col > 0) moves.push(emptyIndex - 1);
            if (col < puzzleSize - 1) moves.push(emptyIndex + 1);
            
            return moves;
        };
    }

    function createShufflePuzzle(puzzleSize) {
        const emptyCell = puzzleSize * puzzleSize - 1;
        const getValidMoves = createGetValidMoves(puzzleSize);
        const numMoves = puzzleSize === 2 ? 20 : 60;
        
        return function shufflePuzzle(initialState) {
            const state = [...initialState];
            let emptyIndex = state.indexOf(emptyCell);
            
            for (let i = 0; i < numMoves; i++) {
                const neighbors = getValidMoves(emptyIndex);
                const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                state[emptyIndex] = state[randomNeighbor];
                state[randomNeighbor] = emptyCell;
                emptyIndex = randomNeighbor;
            }
            
            return state;
        };
    }

    describe('Settings Management', () => {
        // Mock functions that would exist in museum-checkin.html
        function loadPuzzleGameSetting() {
            try {
                const saved = localStorage.getItem('puzzleGameEnabled');
                return saved === 'true';  // Default is false (disabled)
            } catch (error) {
                return false;
            }
        }

        function savePuzzleGameSetting(enabled) {
            try {
                localStorage.setItem('puzzleGameEnabled', enabled ? 'true' : 'false');
                return true;
            } catch (error) {
                return false;
            }
        }

        test('should default to disabled (false) when no setting saved', () => {
            const result = loadPuzzleGameSetting();
            expect(result).toBe(false);
        });

        test('should return true when setting is enabled', () => {
            savePuzzleGameSetting(true);
            const result = loadPuzzleGameSetting();
            expect(result).toBe(true);
        });

        test('should return false when setting is disabled', () => {
            savePuzzleGameSetting(false);
            const result = loadPuzzleGameSetting();
            expect(result).toBe(false);
        });

        test('should persist setting across function calls', () => {
            savePuzzleGameSetting(true);
            expect(loadPuzzleGameSetting()).toBe(true);
            
            savePuzzleGameSetting(false);
            expect(loadPuzzleGameSetting()).toBe(false);
        });

        test('should store value as string in localStorage', () => {
            savePuzzleGameSetting(true);
            expect(localStorage.getItem('puzzleGameEnabled')).toBe('true');
            
            savePuzzleGameSetting(false);
            expect(localStorage.getItem('puzzleGameEnabled')).toBe('false');
        });
    });

    describe('Puzzle Size Determination', () => {
        // First task (门口打卡, index 0) uses 2x2 (4-grid)
        // Subsequent tasks use 3x3 (9-grid)
        function determinePuzzleSize(taskIndex) {
            return taskIndex === 0 ? 2 : 3;
        }

        test('should return 2x2 grid for first task (index 0)', () => {
            expect(determinePuzzleSize(0)).toBe(2);
        });

        test('should return 3x3 grid for second task (index 1)', () => {
            expect(determinePuzzleSize(1)).toBe(3);
        });

        test('should return 3x3 grid for third task (index 2)', () => {
            expect(determinePuzzleSize(2)).toBe(3);
        });

        test('should return 3x3 grid for any subsequent task', () => {
            expect(determinePuzzleSize(3)).toBe(3);
            expect(determinePuzzleSize(10)).toBe(3);
            expect(determinePuzzleSize(100)).toBe(3);
        });
    });

    describe('Puzzle State Management - 2x2 Grid', () => {
        const getValidMoves = createGetValidMoves(2);

        test('should return correct valid moves for top-left corner (2x2 grid)', () => {
            const moves = getValidMoves(0);
            expect(moves).toContain(2);  // Down
            expect(moves).toContain(1);  // Right
            expect(moves.length).toBe(2);
        });

        test('should return correct valid moves for top-right corner (2x2 grid)', () => {
            const moves = getValidMoves(1);
            expect(moves).toContain(3);  // Down
            expect(moves).toContain(0);  // Left
            expect(moves.length).toBe(2);
        });

        test('should return correct valid moves for bottom-left corner (2x2 grid)', () => {
            const moves = getValidMoves(2);
            expect(moves).toContain(0);  // Up
            expect(moves).toContain(3);  // Right
            expect(moves.length).toBe(2);
        });

        test('should return correct valid moves for bottom-right corner (2x2 grid)', () => {
            const moves = getValidMoves(3);
            expect(moves).toContain(1);  // Up
            expect(moves).toContain(2);  // Left
            expect(moves.length).toBe(2);
        });
    });

    describe('Puzzle State Management - 3x3 Grid', () => {
        const getValidMoves = createGetValidMoves(3);

        test('should return correct valid moves for top-left corner (3x3 grid)', () => {
            // Index 0: can move down (3) and right (1)
            const moves = getValidMoves(0);
            expect(moves).toContain(3);  // Down
            expect(moves).toContain(1);  // Right
            expect(moves.length).toBe(2);
        });

        test('should return correct valid moves for center cell (3x3 grid)', () => {
            // Index 4: can move all 4 directions
            const moves = getValidMoves(4);
            expect(moves).toContain(1);  // Up
            expect(moves).toContain(7);  // Down
            expect(moves).toContain(3);  // Left
            expect(moves).toContain(5);  // Right
            expect(moves.length).toBe(4);
        });

        test('should return correct valid moves for top-center cell (3x3 grid)', () => {
            // Index 1: can move down (4), left (0), right (2)
            const moves = getValidMoves(1);
            expect(moves).toContain(4);  // Down
            expect(moves).toContain(0);  // Left
            expect(moves).toContain(2);  // Right
            expect(moves.length).toBe(3);
        });

        test('should return correct valid moves for bottom-right corner (3x3 grid)', () => {
            // Index 8: can move up (5) and left (7)
            const moves = getValidMoves(8);
            expect(moves).toContain(5);  // Up
            expect(moves).toContain(7);  // Left
            expect(moves.length).toBe(2);
        });
    });

    describe('Puzzle Completion Check', () => {
        function checkPuzzleComplete(puzzleState) {
            return puzzleState.every((value, index) => value === index);
        }

        test('should return true for completed 2x2 puzzle', () => {
            const completed = [0, 1, 2, 3];
            expect(checkPuzzleComplete(completed)).toBe(true);
        });

        test('should return false for incomplete 2x2 puzzle', () => {
            const incomplete = [1, 0, 2, 3];
            expect(checkPuzzleComplete(incomplete)).toBe(false);
        });

        test('should return true for completed 3x3 puzzle', () => {
            const completed = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            expect(checkPuzzleComplete(completed)).toBe(true);
        });

        test('should return false for incomplete 3x3 puzzle', () => {
            const incomplete = [1, 0, 2, 3, 4, 5, 6, 7, 8];
            expect(checkPuzzleComplete(incomplete)).toBe(false);
        });

        test('should return false for shuffled 3x3 puzzle', () => {
            const shuffled = [8, 7, 6, 5, 4, 3, 2, 1, 0];
            expect(checkPuzzleComplete(shuffled)).toBe(false);
        });
    });

    describe('Feature Trigger Logic', () => {
        function loadPuzzleGameSetting() {
            try {
                const saved = localStorage.getItem('puzzleGameEnabled');
                return saved === 'true';
            } catch (error) {
                return false;
            }
        }

        function shouldShowPuzzle(hasPhoto, puzzleEnabled) {
            return hasPhoto && puzzleEnabled;
        }

        test('should show puzzle when photo exists and setting enabled', () => {
            localStorage.setItem('puzzleGameEnabled', 'true');
            const result = shouldShowPuzzle(true, loadPuzzleGameSetting());
            expect(result).toBe(true);
        });

        test('should NOT show puzzle when photo exists but setting disabled', () => {
            localStorage.setItem('puzzleGameEnabled', 'false');
            const result = shouldShowPuzzle(true, loadPuzzleGameSetting());
            expect(result).toBe(false);
        });

        test('should NOT show puzzle when no photo even if setting enabled', () => {
            localStorage.setItem('puzzleGameEnabled', 'true');
            const result = shouldShowPuzzle(false, loadPuzzleGameSetting());
            expect(result).toBe(false);
        });

        test('should NOT show puzzle when no photo and setting disabled', () => {
            localStorage.setItem('puzzleGameEnabled', 'false');
            const result = shouldShowPuzzle(false, loadPuzzleGameSetting());
            expect(result).toBe(false);
        });

        test('should NOT show puzzle by default (setting not set)', () => {
            const result = shouldShowPuzzle(true, loadPuzzleGameSetting());
            expect(result).toBe(false);
        });
    });

    describe('Puzzle Shuffle Solvability (2x2 Grid)', () => {
        const shufflePuzzle = createShufflePuzzle(2);

        test('shuffled 2x2 puzzle should have all tiles 0-3', () => {
            const initial = [0, 1, 2, 3];
            const shuffled = shufflePuzzle(initial);
            const sorted = [...shuffled].sort((a, b) => a - b);
            expect(sorted).toEqual([0, 1, 2, 3]);
        });

        test('shuffled 2x2 puzzle should have exactly 4 tiles', () => {
            const initial = [0, 1, 2, 3];
            const shuffled = shufflePuzzle(initial);
            expect(shuffled.length).toBe(4);
        });
    });

    describe('Puzzle Shuffle Solvability (3x3 Grid)', () => {
        const shufflePuzzle = createShufflePuzzle(3);

        test('shuffled 3x3 puzzle should have all tiles 0-8', () => {
            const initial = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            const shuffled = shufflePuzzle(initial);
            const sorted = [...shuffled].sort((a, b) => a - b);
            expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        });

        test('shuffled 3x3 puzzle should have exactly 9 tiles', () => {
            const initial = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            const shuffled = shufflePuzzle(initial);
            expect(shuffled.length).toBe(9);
        });

        test('shuffle should produce valid 3x3 puzzle states', () => {
            const initial = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            const shuffle1 = shufflePuzzle(initial);
            const shuffle2 = shufflePuzzle(initial);
            
            expect(shuffle1.length).toBe(9);
            expect(shuffle2.length).toBe(9);
            expect([...shuffle1].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
            expect([...shuffle2].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        });
    });

    describe('Empty Cell Calculation', () => {
        function getEmptyCell(puzzleSize) {
            return puzzleSize * puzzleSize - 1;
        }

        test('should return 3 for 2x2 grid', () => {
            expect(getEmptyCell(2)).toBe(3);
        });

        test('should return 8 for 3x3 grid', () => {
            expect(getEmptyCell(3)).toBe(8);
        });
    });
});
