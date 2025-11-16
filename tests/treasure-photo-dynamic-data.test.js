/**
 * Test: Treasure Photo Display with Dynamic Data Priority
 * 
 * Issue: When users set dynamic data priority and update treasure photos in KV store,
 * the new photos don't display in museum-checkin.html
 * 
 * Root cause: museum-checkin.html was not merging KV store data (with new photos)
 * with Tier 3 data (with checklists)
 */

describe('Treasure Photo Display with Dynamic Data Priority', () => {
    let mockMuseumDataLoader;
    let mockMUSEUMS;
    
    beforeEach(() => {
        // Mock MUSEUMS array (Tier 3 - complete data with checklists)
        mockMUSEUMS = [
            {
                id: 'shanghai-museum',
                name: '上海博物馆',
                location: '上海',
                description: '以古代艺术为主的综合性博物馆',
                tags: ['艺术', '文物'],
                image: 'https://old-image.com/museum.jpg',
                collections: [
                    {
                        name: '大克鼎',
                        imageUrl: 'https://old-image.com/dake-ding.jpg',
                        description: '西周晚期青铜器'
                    },
                    {
                        name: '商鞅方升',
                        imageUrl: 'https://old-image.com/shang-yang.jpg',
                        description: '战国时期秦国的标准量器'
                    }
                ],
                checklists: {
                    parent: {
                        '3-6': ['准备事项1', '准备事项2'],
                        '7-12': ['准备事项A', '准备事项B'],
                        '13-18': ['准备事项X', '准备事项Y']
                    },
                    child: {
                        '3-6': ['任务1', '任务2'],
                        '7-12': ['任务A', '任务B'],
                        '13-18': ['任务X', '任务Y']
                    }
                }
            }
        ];
        
        // Mock museum data loader
        mockMuseumDataLoader = {
            loadMuseum: jest.fn()
        };
        
        // Set up global mocks
        global.MUSEUMS = mockMUSEUMS;
        global.window = global.window || {};
        global.window.museumDataLoader = mockMuseumDataLoader;
    });
    
    test('should merge KV store data (new photos) with Tier 3 data (checklists)', async () => {
        // Simulate KV store data (Tier 2) - has updated images but no checklists
        const kvStoreData = {
            id: 'shanghai-museum',
            name: '上海博物馆',
            location: '上海',
            description: '以古代艺术为主的综合性博物馆',
            tags: ['艺术', '文物'],
            image: 'https://new-image.com/museum-updated.jpg', // NEW IMAGE
            collections: [
                {
                    name: '大克鼎',
                    imageUrl: 'https://new-image.com/dake-ding-updated.jpg', // NEW PHOTO
                    description: '西周晚期青铜器，高93.1厘米'
                },
                {
                    name: '商鞅方升',
                    imageUrl: 'https://new-image.com/shang-yang-updated.jpg', // NEW PHOTO
                    description: '战国时期秦国的标准量器，长18.7厘米'
                }
            ]
            // NOTE: No checklists in KV store data!
        };
        
        mockMuseumDataLoader.loadMuseum.mockResolvedValue(kvStoreData);
        
        // Simulate the logic from museum-checkin.html loadMuseumData()
        let museum = null;
        if (window.museumDataLoader && typeof window.museumDataLoader.loadMuseum === 'function') {
            museum = await window.museumDataLoader.loadMuseum('shanghai-museum', false);
        }
        
        let currentMuseum;
        if (museum) {
            const tier3Museum = MUSEUMS.find(m => m.id === 'shanghai-museum');
            if (tier3Museum) {
                // Merge: Tier 3 data as base, override with loaded data
                currentMuseum = { ...tier3Museum, ...museum };
            } else {
                currentMuseum = museum;
            }
        }
        
        // Verify merged data has BOTH new photos AND checklists
        expect(currentMuseum).toBeDefined();
        expect(currentMuseum.id).toBe('shanghai-museum');
        
        // Check new photos are present (from KV store)
        expect(currentMuseum.image).toBe('https://new-image.com/museum-updated.jpg');
        expect(currentMuseum.collections).toHaveLength(2);
        expect(currentMuseum.collections[0].imageUrl).toBe('https://new-image.com/dake-ding-updated.jpg');
        expect(currentMuseum.collections[1].imageUrl).toBe('https://new-image.com/shang-yang-updated.jpg');
        
        // Check checklists are present (from Tier 3)
        expect(currentMuseum.checklists).toBeDefined();
        expect(currentMuseum.checklists.parent).toBeDefined();
        expect(currentMuseum.checklists.child).toBeDefined();
        expect(currentMuseum.checklists.child['7-12']).toEqual(['任务A', '任务B']);
    });
    
    test('should use Tier 3 data directly when loader returns null', async () => {
        mockMuseumDataLoader.loadMuseum.mockResolvedValue(null);
        
        // Simulate the logic from museum-checkin.html loadMuseumData()
        let museum = null;
        if (window.museumDataLoader && typeof window.museumDataLoader.loadMuseum === 'function') {
            museum = await window.museumDataLoader.loadMuseum('shanghai-museum', false);
        }
        
        let currentMuseum;
        if (!museum) {
            museum = MUSEUMS.find(m => m.id === 'shanghai-museum');
        }
        
        if (museum) {
            const tier3Museum = MUSEUMS.find(m => m.id === 'shanghai-museum');
            if (tier3Museum) {
                currentMuseum = { ...tier3Museum, ...museum };
            } else {
                currentMuseum = museum;
            }
        }
        
        // Should fall back to Tier 3 data
        expect(currentMuseum).toBeDefined();
        expect(currentMuseum.id).toBe('shanghai-museum');
        expect(currentMuseum.image).toBe('https://old-image.com/museum.jpg');
        expect(currentMuseum.collections[0].imageUrl).toBe('https://old-image.com/dake-ding.jpg');
        expect(currentMuseum.checklists).toBeDefined();
    });
    
    test('should preserve KV store data when Tier 3 museum not found', async () => {
        // Simulate a new museum only in KV store, not in Tier 3
        const newMuseumData = {
            id: 'new-test-museum',
            name: '测试博物馆',
            location: '北京',
            collections: [
                {
                    name: '测试文物',
                    imageUrl: 'https://new-image.com/test.jpg'
                }
            ]
        };
        
        mockMuseumDataLoader.loadMuseum.mockResolvedValue(newMuseumData);
        
        // Simulate the logic
        let museum = null;
        if (window.museumDataLoader && typeof window.museumDataLoader.loadMuseum === 'function') {
            museum = await window.museumDataLoader.loadMuseum('new-test-museum', false);
        }
        
        let currentMuseum;
        if (museum) {
            const tier3Museum = MUSEUMS.find(m => m.id === 'new-test-museum');
            if (tier3Museum) {
                currentMuseum = { ...tier3Museum, ...museum };
            } else {
                currentMuseum = museum;
            }
        }
        
        // Should use KV store data directly since not in Tier 3
        expect(currentMuseum).toBeDefined();
        expect(currentMuseum.id).toBe('new-test-museum');
        expect(currentMuseum.collections[0].imageUrl).toBe('https://new-image.com/test.jpg');
    });
    
    test('should handle treasure image extraction from merged data', () => {
        // Simulate merged museum data
        const mergedMuseum = {
            id: 'shanghai-museum',
            name: '上海博物馆',
            collections: [
                {
                    name: '大克鼎',
                    imageUrl: 'https://new-image.com/dake-ding-updated.jpg'
                },
                {
                    name: '商鞅方升',
                    imageUrl: 'https://new-image.com/shang-yang-updated.jpg'
                }
            ]
        };
        
        // Simulate treasure task subtitle
        const subtitle = '找到「大克鼎」并合影';
        
        // Extract collection image URL (logic from museum-checkin.html)
        let imageUrl = '';
        if (mergedMuseum && Array.isArray(mergedMuseum.collections) && subtitle) {
            const nameMatch = subtitle.match(/「([^」]+)」/);
            const collName = nameMatch && nameMatch[1];
            if (collName) {
                const found = mergedMuseum.collections.find(c => c && c.name === collName);
                imageUrl = found && (found.imageUrl || found.url) || '';
            }
        }
        
        // Should find the new photo URL
        expect(imageUrl).toBe('https://new-image.com/dake-ding-updated.jpg');
    });
    
    test('should handle case where KV store has complete data including checklists', async () => {
        // Some KV store entries might have complete data
        const completeKVData = {
            id: 'shanghai-museum',
            name: '上海博物馆',
            collections: [
                {
                    name: '大克鼎',
                    imageUrl: 'https://new-image.com/dake-ding-updated.jpg'
                }
            ],
            checklists: {
                parent: {
                    '7-12': ['新的准备事项']
                },
                child: {
                    '7-12': ['新的任务']
                }
            }
        };
        
        mockMuseumDataLoader.loadMuseum.mockResolvedValue(completeKVData);
        
        // Simulate the logic
        let museum = null;
        if (window.museumDataLoader && typeof window.museumDataLoader.loadMuseum === 'function') {
            museum = await window.museumDataLoader.loadMuseum('shanghai-museum', false);
        }
        
        let currentMuseum;
        if (museum) {
            const tier3Museum = MUSEUMS.find(m => m.id === 'shanghai-museum');
            if (tier3Museum) {
                currentMuseum = { ...tier3Museum, ...museum };
            } else {
                currentMuseum = museum;
            }
        }
        
        // KV store data should override Tier 3 data
        expect(currentMuseum.collections[0].imageUrl).toBe('https://new-image.com/dake-ding-updated.jpg');
        expect(currentMuseum.checklists.child['7-12']).toEqual(['新的任务']);
    });
});
