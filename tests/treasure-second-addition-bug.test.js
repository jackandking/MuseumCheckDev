/**
 * Regression Test: Second Treasure Addition Bug
 * 
 * Issue: When adding a second treasure task on the check-in page,
 * the dynamic storage (localStorage and/or KV store) is not updated correctly.
 * 
 * Expected behavior: Each treasure added should be saved to:
 * 1. contributedTreasures_${museumId}_${ageGroup} localStorage (by task index)
 * 2. userAddedTreasures_${museumId} localStorage (array of treasures)
 * 3. currentMuseum.collections (in-memory)
 * 4. KV store (remote persistence)
 */

describe('Treasure Second Addition Bug', () => {
    let mockStorage;
    let originalLocalStorage;
    let mockMuseumDataLoader;
    let currentMuseum;
    let museumId;
    let ageGroup;

    beforeEach(() => {
        // Mock localStorage
        mockStorage = {};
        originalLocalStorage = global.localStorage;
        global.localStorage = {
            getItem: jest.fn(key => mockStorage[key] || null),
            setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
            removeItem: jest.fn(key => { delete mockStorage[key]; }),
            clear: jest.fn(() => { mockStorage = {}; })
        };

        // Mock museum data loader
        mockMuseumDataLoader = {
            saveToKVStore: jest.fn().mockResolvedValue(true)
        };
        global.window = global.window || {};
        global.window.museumDataLoader = mockMuseumDataLoader;

        // Initialize test data
        museumId = 'test-museum';
        ageGroup = '7-12';
        currentMuseum = {
            id: museumId,
            name: 'Test Museum',
            collections: []
        };
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    // Helper function to simulate getContributedTreasuresKey
    function getContributedTreasuresKey() {
        return `contributedTreasures_${museumId}_${ageGroup}`;
    }

    // Helper function to simulate loadUserAddedTreasures
    function loadUserAddedTreasures(musId) {
        try {
            const key = `userAddedTreasures_${musId || museumId}`;
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    // Helper function to simulate saveUserAddedTreasures
    function saveUserAddedTreasures(treasures) {
        try {
            const key = `userAddedTreasures_${museumId}`;
            localStorage.setItem(key, JSON.stringify(treasures));
            return true;
        } catch (error) {
            return false;
        }
    }

    // Simulate saveMuseumWithUserTreasuresToRemote function (extracted from museum-checkin.html)
    async function saveMuseumWithUserTreasuresToRemote() {
        if (!window.museumDataLoader || !currentMuseum) {
            return false;
        }
        
        try {
            // Prepare museum data with user-added treasures
            const museumData = { ...currentMuseum };
            
            // Mark user-added treasures
            if (museumData.collections) {
                museumData.collections = museumData.collections.map(t => ({
                    ...t,
                    isUserAdded: t.isUserAdded || false
                }));
            }
            
            // Save to KV store
            const success = await window.museumDataLoader.saveToKVStore(museumId, museumData);
            return success;
        } catch (error) {
            console.error('Failed to save museum with user treasures:', error);
            return false;
        }
    }

    // Simulate saveContributedTreasure function (extracted from museum-checkin.html)
    async function saveContributedTreasure(taskIndex, treasureData) {
        try {
            const key = getContributedTreasuresKey();
            const allTreasures = JSON.parse(localStorage.getItem(key) || '{}');
            allTreasures[taskIndex] = treasureData;
            localStorage.setItem(key, JSON.stringify(allTreasures));

            // Add to current museum's collections
            if (currentMuseum && treasureData.name) {
                const newTreasure = {
                    name: treasureData.name,
                    imageUrl: treasureData.imageUrl || '',
                    description: '用户添加的镇馆之宝',
                    isUserAdded: true,
                    addedAt: treasureData.timestamp || Date.now()
                };

                // Initialize collections if not exists
                if (!currentMuseum.collections) {
                    currentMuseum.collections = [];
                }

                // Check if treasure already exists in collections
                const existsInCollections = currentMuseum.collections.some(c => c.name === newTreasure.name);
                if (!existsInCollections) {
                    currentMuseum.collections.push(newTreasure);

                    // Also save to user treasures localStorage
                    const userTreasures = loadUserAddedTreasures(museumId);
                    const existsInUserTreasures = userTreasures.some(t => t.name === newTreasure.name);
                    if (!existsInUserTreasures) {
                        userTreasures.push(newTreasure);
                        saveUserAddedTreasures(userTreasures);
                    }

                    // Save to KV store (remote persistence) using the actual function pattern
                    await saveMuseumWithUserTreasuresToRemote();
                }
            }
        } catch (e) {
            console.error('Error saving contributed treasure:', e);
        }
    }

    test('should save first treasure to all storage locations', async () => {
        const treasure1 = {
            name: '青铜鼎',
            imageUrl: 'https://example.com/ding.jpg',
            taskIndex: 1,
            museumId: museumId,
            museumName: 'Test Museum',
            timestamp: Date.now()
        };

        await saveContributedTreasure(1, treasure1);

        // Check contributedTreasures localStorage
        const contributedKey = getContributedTreasuresKey();
        const contributedData = JSON.parse(localStorage.getItem(contributedKey));
        expect(contributedData['1']).toBeDefined();
        expect(contributedData['1'].name).toBe('青铜鼎');

        // Check userAddedTreasures localStorage
        const userTreasures = loadUserAddedTreasures(museumId);
        expect(userTreasures.length).toBe(1);
        expect(userTreasures[0].name).toBe('青铜鼎');

        // Check currentMuseum.collections
        expect(currentMuseum.collections.length).toBe(1);
        expect(currentMuseum.collections[0].name).toBe('青铜鼎');

        // Check KV store was called
        expect(mockMuseumDataLoader.saveToKVStore).toHaveBeenCalledWith(
            museumId,
            expect.objectContaining({
                collections: expect.arrayContaining([
                    expect.objectContaining({ name: '青铜鼎' })
                ])
            })
        );
    });

    test('should save second treasure to all storage locations', async () => {
        // First, add the first treasure
        const treasure1 = {
            name: '青铜鼎',
            imageUrl: 'https://example.com/ding.jpg',
            taskIndex: 1,
            museumId: museumId,
            timestamp: Date.now()
        };
        await saveContributedTreasure(1, treasure1);

        // Reset mock to track second call
        mockMuseumDataLoader.saveToKVStore.mockClear();

        // Now add the second treasure
        const treasure2 = {
            name: '玉璧',
            imageUrl: 'https://example.com/bi.jpg',
            taskIndex: 2,
            museumId: museumId,
            timestamp: Date.now()
        };
        await saveContributedTreasure(2, treasure2);

        // Check contributedTreasures localStorage
        const contributedKey = getContributedTreasuresKey();
        const contributedData = JSON.parse(localStorage.getItem(contributedKey));
        expect(contributedData['1']).toBeDefined();
        expect(contributedData['2']).toBeDefined();
        expect(contributedData['2'].name).toBe('玉璧');

        // Check userAddedTreasures localStorage
        const userTreasures = loadUserAddedTreasures(museumId);
        expect(userTreasures.length).toBe(2);
        expect(userTreasures[0].name).toBe('青铜鼎');
        expect(userTreasures[1].name).toBe('玉璧');

        // Check currentMuseum.collections
        expect(currentMuseum.collections.length).toBe(2);
        expect(currentMuseum.collections[1].name).toBe('玉璧');

        // Check KV store was called for second treasure
        expect(mockMuseumDataLoader.saveToKVStore).toHaveBeenCalledWith(
            museumId,
            expect.objectContaining({
                collections: expect.arrayContaining([
                    expect.objectContaining({ name: '青铜鼎' }),
                    expect.objectContaining({ name: '玉璧' })
                ])
            })
        );
    });

    test('should handle duplicate treasure names gracefully', async () => {
        const treasure1 = {
            name: '青铜鼎',
            imageUrl: 'https://example.com/ding.jpg',
            taskIndex: 1,
            museumId: museumId,
            timestamp: Date.now()
        };
        await saveContributedTreasure(1, treasure1);

        mockMuseumDataLoader.saveToKVStore.mockClear();

        // Try to add duplicate
        const treasure2 = {
            name: '青铜鼎', // Same name
            imageUrl: 'https://example.com/ding2.jpg',
            taskIndex: 2,
            museumId: museumId,
            timestamp: Date.now()
        };
        await saveContributedTreasure(2, treasure2);

        // Collections should still have only 1 treasure (dedup by name)
        expect(currentMuseum.collections.length).toBe(1);
        
        // userAddedTreasures should also have only 1 (dedup by name)
        const userTreasures = loadUserAddedTreasures(museumId);
        expect(userTreasures.length).toBe(1);

        // KV store should NOT be called for duplicate
        expect(mockMuseumDataLoader.saveToKVStore).not.toHaveBeenCalled();
    });

    test('should preserve all treasures when KV store save fails', async () => {
        // Make KV store save fail
        mockMuseumDataLoader.saveToKVStore.mockResolvedValue(false);

        const treasure1 = {
            name: '青铜鼎',
            imageUrl: 'https://example.com/ding.jpg',
            taskIndex: 1,
            museumId: museumId,
            timestamp: Date.now()
        };
        await saveContributedTreasure(1, treasure1);

        const treasure2 = {
            name: '玉璧',
            imageUrl: 'https://example.com/bi.jpg',
            taskIndex: 2,
            museumId: museumId,
            timestamp: Date.now()
        };
        await saveContributedTreasure(2, treasure2);

        // Local storage should still have both treasures
        const userTreasures = loadUserAddedTreasures(museumId);
        expect(userTreasures.length).toBe(2);
        expect(currentMuseum.collections.length).toBe(2);
    });

    describe('Full workflow simulation with task regeneration', () => {
        let childTasks;
        let completedTasks;

        // Simulate buildTreasureWorkflowTasks function
        function buildTreasureWorkflowTasks(collections) {
            const totalTreasuresNeeded = 3;
            const start = '📸 门口打卡：家长给孩子在博物馆门口拍一张照片';
            const end = '📸 亲子合影：和家长比心/拥抱/击掌等动作合影';
            
            if (collections.length >= totalTreasuresNeeded) {
                const colls = collections.slice(0, totalTreasuresNeeded);
                const treasureTasks = colls.map(c => `🏺 镇馆之宝：找到「${c && c.name ? c.name : '镇馆之宝'}」并合影`);
                return [start].concat(treasureTasks, [end]);
            } else {
                const existingTreasureCount = collections.length;
                const addTreasuresNeeded = totalTreasuresNeeded - existingTreasureCount;
                
                const treasureTasks = collections.slice(0, existingTreasureCount).map(c => 
                    `🏺 镇馆之宝：找到「${c && c.name ? c.name : '镇馆之宝'}」并合影`
                );
                
                const addTreasureTasks = Array.from({length: addTreasuresNeeded}, (_, i) => 
                    `✨ 添加镇馆之宝 ${existingTreasureCount + i + 1}/${totalTreasuresNeeded}：找到你最喜欢的展品，拍照并记录名称`
                );
                
                return [start].concat(treasureTasks, addTreasureTasks, [end]);
            }
        }

        // Simulate regenerateTasksWithNewTreasures
        function regenerateTasksWithNewTreasures() {
            if (!currentMuseum) return;
            const collections = currentMuseum.collections || [];
            childTasks = buildTreasureWorkflowTasks(collections);
        }

        beforeEach(() => {
            childTasks = [];
            completedTasks = new Set();
            currentMuseum.collections = [];
        });

        test('should correctly regenerate tasks after adding first treasure', async () => {
            // Initial state: 0 collections
            childTasks = buildTreasureWorkflowTasks([]);
            
            // Verify initial task structure
            expect(childTasks.length).toBe(5);
            expect(childTasks[0]).toContain('门口打卡');
            expect(childTasks[1]).toContain('添加镇馆之宝 1/3');
            expect(childTasks[2]).toContain('添加镇馆之宝 2/3');
            expect(childTasks[3]).toContain('添加镇馆之宝 3/3');
            expect(childTasks[4]).toContain('亲子合影');

            // Add first treasure
            const treasure1 = { name: '青铜鼎', taskIndex: 1, museumId, timestamp: Date.now() };
            await saveContributedTreasure(1, treasure1);
            
            // Regenerate tasks
            regenerateTasksWithNewTreasures();

            // Verify new task structure
            expect(childTasks.length).toBe(5);
            expect(childTasks[0]).toContain('门口打卡');
            expect(childTasks[1]).toContain('找到「青铜鼎」');
            expect(childTasks[2]).toContain('添加镇馆之宝 2/3');
            expect(childTasks[3]).toContain('添加镇馆之宝 3/3');
            expect(childTasks[4]).toContain('亲子合影');

            // Verify storage state
            expect(currentMuseum.collections.length).toBe(1);
            expect(loadUserAddedTreasures(museumId).length).toBe(1);
        });

        test('should correctly handle second treasure addition after regeneration', async () => {
            // Start with first treasure already added
            const treasure1 = { name: '青铜鼎', taskIndex: 1, museumId, timestamp: Date.now() };
            await saveContributedTreasure(1, treasure1);
            regenerateTasksWithNewTreasures();

            // Verify state after first treasure
            expect(currentMuseum.collections.length).toBe(1);

            // Now user clicks on "添加镇馆之宝 2/3" which is at index 2
            const treasure2 = { name: '玉璧', taskIndex: 2, museumId, timestamp: Date.now() };
            await saveContributedTreasure(2, treasure2);

            // Verify BOTH treasures are saved
            expect(currentMuseum.collections.length).toBe(2);
            expect(currentMuseum.collections[0].name).toBe('青铜鼎');
            expect(currentMuseum.collections[1].name).toBe('玉璧');

            // Verify localStorage
            const userTreasures = loadUserAddedTreasures(museumId);
            expect(userTreasures.length).toBe(2);
            expect(userTreasures.map(t => t.name)).toContain('青铜鼎');
            expect(userTreasures.map(t => t.name)).toContain('玉璧');

            // Regenerate tasks after second treasure
            regenerateTasksWithNewTreasures();

            // Verify task structure reflects both treasures
            expect(childTasks.length).toBe(5);
            expect(childTasks[0]).toContain('门口打卡');
            expect(childTasks[1]).toContain('找到「青铜鼎」');
            expect(childTasks[2]).toContain('找到「玉璧」');
            expect(childTasks[3]).toContain('添加镇馆之宝 3/3');
            expect(childTasks[4]).toContain('亲子合影');
        });

        test('should handle third treasure addition correctly', async () => {
            // Add all three treasures sequentially
            const treasure1 = { name: '青铜鼎', taskIndex: 1, museumId, timestamp: Date.now() };
            await saveContributedTreasure(1, treasure1);
            regenerateTasksWithNewTreasures();

            const treasure2 = { name: '玉璧', taskIndex: 2, museumId, timestamp: Date.now() };
            await saveContributedTreasure(2, treasure2);
            regenerateTasksWithNewTreasures();

            const treasure3 = { name: '金缕玉衣', taskIndex: 3, museumId, timestamp: Date.now() };
            await saveContributedTreasure(3, treasure3);
            regenerateTasksWithNewTreasures();

            // Verify all three treasures are saved
            expect(currentMuseum.collections.length).toBe(3);

            // Verify final task structure - should have no "添加镇馆之宝" tasks
            expect(childTasks.length).toBe(5);
            expect(childTasks[0]).toContain('门口打卡');
            expect(childTasks[1]).toContain('找到「青铜鼎」');
            expect(childTasks[2]).toContain('找到「玉璧」');
            expect(childTasks[3]).toContain('找到「金缕玉衣」');
            expect(childTasks[4]).toContain('亲子合影');

            // Verify no "添加镇馆之宝" tasks remain
            const addTreasureTasks = childTasks.filter(t => t.includes('添加镇馆之宝'));
            expect(addTreasureTasks.length).toBe(0);
        });
    });
});
