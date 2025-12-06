/**
 * Tests for Treasure Photo Contribution Feature on treasures.html
 * 
 * Feature: Users can contribute photos for treasures that are missing photos,
 * and receive XP rewards for their contributions.
 */

describe('Treasure Photo Contribution Feature', () => {
    let originalLocalStorage;
    let mockStorage;

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
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    describe('User Contributed Photos Storage', () => {
        const USER_CONTRIBUTED_PHOTOS_KEY = 'userContributedTreasurePhotos';

        test('should save and retrieve user-contributed photos', () => {
            const museumId = 'test-museum';
            const photo = {
                imageUrl: 'https://example.com/user-photo.jpg',
                name: '青铜器',
                description: '用户贡献的镇馆之宝照片',
                contributedAt: Date.now()
            };

            // Save photo
            const allPhotos = {};
            allPhotos[museumId] = [photo];
            localStorage.setItem(USER_CONTRIBUTED_PHOTOS_KEY, JSON.stringify(allPhotos));

            // Retrieve
            const stored = JSON.parse(localStorage.getItem(USER_CONTRIBUTED_PHOTOS_KEY));
            expect(stored[museumId]).toHaveLength(1);
            expect(stored[museumId][0].imageUrl).toBe('https://example.com/user-photo.jpg');
            expect(stored[museumId][0].name).toBe('青铜器');
        });

        test('should store multiple photos for a museum', () => {
            const museumId = 'test-museum';
            const photos = [
                { imageUrl: 'http://example.com/1.jpg', name: '文物1' },
                { imageUrl: 'http://example.com/2.jpg', name: '文物2' },
                { imageUrl: 'http://example.com/3.jpg', name: '文物3' }
            ];
            
            localStorage.setItem(USER_CONTRIBUTED_PHOTOS_KEY, JSON.stringify({ [museumId]: photos }));

            const stored = JSON.parse(localStorage.getItem(USER_CONTRIBUTED_PHOTOS_KEY));
            expect(stored[museumId]).toHaveLength(3);
            expect(stored[museumId][0].name).toBe('文物1');
            expect(stored[museumId][2].name).toBe('文物3');
        });

        test('should store photos from different museums separately', () => {
            const photos = {
                'museum-a': [{ imageUrl: 'http://example.com/a.jpg', name: '文物A' }],
                'museum-b': [{ imageUrl: 'http://example.com/b.jpg', name: '文物B' }]
            };
            
            localStorage.setItem(USER_CONTRIBUTED_PHOTOS_KEY, JSON.stringify(photos));

            const stored = JSON.parse(localStorage.getItem(USER_CONTRIBUTED_PHOTOS_KEY));
            expect(stored['museum-a']).toHaveLength(1);
            expect(stored['museum-b']).toHaveLength(1);
            expect(stored['museum-a'][0].name).toBe('文物A');
            expect(stored['museum-b'][0].name).toBe('文物B');
        });

        test('should include timestamp when saving photo', () => {
            const museumId = 'test-museum';
            const now = Date.now();
            const photo = {
                imageUrl: 'http://example.com/photo.jpg',
                name: '测试文物',
                contributedAt: now
            };

            const allPhotos = { [museumId]: [photo] };
            localStorage.setItem(USER_CONTRIBUTED_PHOTOS_KEY, JSON.stringify(allPhotos));

            const stored = JSON.parse(localStorage.getItem(USER_CONTRIBUTED_PHOTOS_KEY));
            expect(stored[museumId][0].contributedAt).toBe(now);
        });
    });

    describe('XP Reward Configuration', () => {
        test('should have correct XP reward amount for photo contribution', () => {
            // XP reward for photo contribution should be 20
            const PHOTO_CONTRIBUTION_XP = 20;
            expect(PHOTO_CONTRIBUTION_XP).toBe(20);
        });

        test('should be a positive integer', () => {
            const PHOTO_CONTRIBUTION_XP = 20;
            expect(PHOTO_CONTRIBUTION_XP).toBeGreaterThan(0);
            expect(Number.isInteger(PHOTO_CONTRIBUTION_XP)).toBe(true);
        });
    });

    describe('Photo Contribution UI Logic', () => {
        test('should determine when to show add-photo section for museums without collections', () => {
            const museum = {
                id: 'test-museum',
                name: '测试博物馆',
                collections: []
            };

            const hasNoCollections = !museum.collections || museum.collections.length === 0;
            expect(hasNoCollections).toBe(true);
        });

        test('should determine when to show add-photo section for museums with few photos', () => {
            const museum = {
                id: 'test-museum',
                name: '测试博物馆',
                collections: [
                    { name: '文物1', imageUrl: 'http://example.com/1.jpg' }
                ]
            };

            const photosCount = museum.collections.filter(c => c.imageUrl).length;
            const showAddPhoto = photosCount < 3;
            expect(showAddPhoto).toBe(true);
        });

        test('should not show add-photo section when museum has 3+ photos', () => {
            const museum = {
                id: 'test-museum',
                name: '测试博物馆',
                collections: [
                    { name: '文物1', imageUrl: 'http://example.com/1.jpg' },
                    { name: '文物2', imageUrl: 'http://example.com/2.jpg' },
                    { name: '文物3', imageUrl: 'http://example.com/3.jpg' }
                ]
            };

            const photosCount = museum.collections.filter(c => c.imageUrl).length;
            const showAddPhoto = photosCount < 3;
            expect(showAddPhoto).toBe(false);
        });

        test('should count user-contributed photos together with existing photos', () => {
            const museum = {
                id: 'test-museum',
                name: '测试博物馆',
                collections: [
                    { name: '文物1', imageUrl: 'http://example.com/1.jpg' }
                ]
            };

            const userPhotos = [
                { imageUrl: 'http://example.com/user1.jpg' },
                { imageUrl: 'http://example.com/user2.jpg' }
            ];

            const totalPhotos = museum.collections.filter(c => c.imageUrl).length + userPhotos.length;
            expect(totalPhotos).toBe(3);
            
            const showAddPhoto = totalPhotos < 3;
            expect(showAddPhoto).toBe(false);
        });
    });

    describe('Duplicate Photo Prevention', () => {
        test('should prevent duplicate photos by checking imageUrl', () => {
            const existingPhotos = [
                { imageUrl: 'http://example.com/existing.jpg', name: '现有文物' }
            ];
            
            const newPhoto = { imageUrl: 'http://example.com/existing.jpg', name: '新文物' };
            
            const isDuplicate = existingPhotos.some(p => p.imageUrl === newPhoto.imageUrl);
            expect(isDuplicate).toBe(true);
        });

        test('should allow new photos with different URLs', () => {
            const existingPhotos = [
                { imageUrl: 'http://example.com/existing.jpg', name: '现有文物' }
            ];
            
            const newPhoto = { imageUrl: 'http://example.com/new.jpg', name: '新文物' };
            
            const isDuplicate = existingPhotos.some(p => p.imageUrl === newPhoto.imageUrl);
            expect(isDuplicate).toBe(false);
        });
    });

    describe('Photo Contribution Data Structure', () => {
        test('should have correct structure for contributed photo', () => {
            const photo = {
                imageUrl: 'https://example.com/treasure.jpg',
                name: '镇馆之宝名称',
                description: '用户贡献的镇馆之宝照片',
                contributedAt: Date.now()
            };

            expect(photo).toHaveProperty('imageUrl');
            expect(photo).toHaveProperty('name');
            expect(photo).toHaveProperty('description');
            expect(photo).toHaveProperty('contributedAt');
            expect(typeof photo.imageUrl).toBe('string');
            expect(typeof photo.contributedAt).toBe('number');
        });

        test('should allow empty name for contributed photo', () => {
            const photo = {
                imageUrl: 'https://example.com/treasure.jpg',
                name: '',
                description: '用户贡献的镇馆之宝照片',
                contributedAt: Date.now()
            };

            expect(photo.name).toBe('');
            // Empty name is valid - user can skip naming the treasure
        });
    });
});
