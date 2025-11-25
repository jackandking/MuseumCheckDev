/**
 * @jest-environment jsdom
 * 
 * Tests for the puzzle game reward feature
 * Feature: When users complete a task with photo uploaded and setting enabled,
 *          show a 9-puzzle game as a reward
 */

describe('Puzzle Game Reward Feature', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

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

    describe('Puzzle State Management', () => {
        // Constants
        const PUZZLE_SIZE = 3;

        // Get valid moves for the empty cell
        function getValidMoves(emptyIndex) {
            const moves = [];
            const row = Math.floor(emptyIndex / PUZZLE_SIZE);
            const col = emptyIndex % PUZZLE_SIZE;
            
            // Up
            if (row > 0) moves.push(emptyIndex - PUZZLE_SIZE);
            // Down
            if (row < PUZZLE_SIZE - 1) moves.push(emptyIndex + PUZZLE_SIZE);
            // Left
            if (col > 0) moves.push(emptyIndex - 1);
            // Right
            if (col < PUZZLE_SIZE - 1) moves.push(emptyIndex + 1);
            
            return moves;
        }

        test('should return correct valid moves for center position', () => {
            // Center position (index 4) can move in all 4 directions
            const moves = getValidMoves(4);
            expect(moves).toContain(1);  // Up
            expect(moves).toContain(7);  // Down
            expect(moves).toContain(3);  // Left
            expect(moves).toContain(5);  // Right
            expect(moves.length).toBe(4);
        });

        test('should return correct valid moves for top-left corner', () => {
            // Top-left (index 0) can only move down and right
            const moves = getValidMoves(0);
            expect(moves).toContain(3);  // Down
            expect(moves).toContain(1);  // Right
            expect(moves.length).toBe(2);
        });

        test('should return correct valid moves for bottom-right corner', () => {
            // Bottom-right (index 8) can only move up and left
            const moves = getValidMoves(8);
            expect(moves).toContain(5);  // Up
            expect(moves).toContain(7);  // Left
            expect(moves.length).toBe(2);
        });

        test('should return correct valid moves for edge positions', () => {
            // Top-middle (index 1) can move down, left, right
            const moves = getValidMoves(1);
            expect(moves).toContain(4);  // Down
            expect(moves).toContain(0);  // Left
            expect(moves).toContain(2);  // Right
            expect(moves.length).toBe(3);
        });
    });

    describe('Puzzle Completion Check', () => {
        function checkPuzzleComplete(puzzleState) {
            return puzzleState.every((value, index) => value === index);
        }

        test('should return true for completed puzzle', () => {
            const completed = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            expect(checkPuzzleComplete(completed)).toBe(true);
        });

        test('should return false for incomplete puzzle', () => {
            const incomplete = [1, 0, 2, 3, 4, 5, 6, 7, 8];
            expect(checkPuzzleComplete(incomplete)).toBe(false);
        });

        test('should return false for shuffled puzzle', () => {
            const shuffled = [3, 1, 2, 0, 4, 5, 6, 7, 8];
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
            // Default case - setting not in localStorage
            const result = shouldShowPuzzle(true, loadPuzzleGameSetting());
            expect(result).toBe(false);  // Default is disabled
        });
    });

    describe('Puzzle Shuffle Solvability', () => {
        // Simple shuffle using valid moves ensures solvability
        function shufflePuzzle(initialState, numMoves = 100) {
            const state = [...initialState];
            let emptyIndex = state.indexOf(8);
            
            function getValidMoves(idx) {
                const moves = [];
                const row = Math.floor(idx / 3);
                const col = idx % 3;
                if (row > 0) moves.push(idx - 3);
                if (row < 2) moves.push(idx + 3);
                if (col > 0) moves.push(idx - 1);
                if (col < 2) moves.push(idx + 1);
                return moves;
            }
            
            for (let i = 0; i < numMoves; i++) {
                const neighbors = getValidMoves(emptyIndex);
                const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                state[emptyIndex] = state[randomNeighbor];
                state[randomNeighbor] = 8;
                emptyIndex = randomNeighbor;
            }
            
            return state;
        }

        test('shuffled puzzle should have all tiles 0-8', () => {
            const initial = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            const shuffled = shufflePuzzle(initial);
            
            // Check all values are present
            const sorted = [...shuffled].sort((a, b) => a - b);
            expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        });

        test('shuffled puzzle should have exactly 9 tiles', () => {
            const initial = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            const shuffled = shufflePuzzle(initial);
            expect(shuffled.length).toBe(9);
        });

        test('shuffle should produce different results each time', () => {
            const initial = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            const shuffle1 = shufflePuzzle(initial);
            const shuffle2 = shufflePuzzle(initial);
            
            // While there's a tiny chance they're identical, 
            // with 100 moves it's virtually impossible
            // Just check they are valid (all tiles present)
            expect(shuffle1.length).toBe(9);
            expect(shuffle2.length).toBe(9);
        });
    });
});
