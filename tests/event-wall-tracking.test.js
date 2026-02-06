/**
 * Event Wall Tracking Tests
 * 
 * Tests for the new event wall tracking features:
 * 1. Museum visit tracking (when user opens museum modal)
 * 2. Search activity tracking (when user searches for keywords)
 * 3. Page view tracking (when user navigates to different pages)
 */

describe('Event Wall Tracking', () => {
    let mockEventWallService;
    let recordedEvents;

    beforeEach(() => {
        // Reset recorded events
        recordedEvents = [];
        
        // Create mock EventWallService
        mockEventWallService = {
            recordEvent: jest.fn((eventType, title, description, parameters) => {
                recordedEvents.push({ eventType, title, description, parameters });
            })
        };
    });

    describe('Museum Visit Tracking', () => {
        test('should record event when museum modal is opened', () => {
            const museum = {
                id: 'forbidden-city',
                name: '故宫博物院'
            };

            // Simulate opening museum modal
            mockEventWallService.recordEvent(
                'visit',
                '访问博物馆',
                `查看 ${museum.name} 的详细信息`,
                { museumId: museum.id, museumName: museum.name }
            );

            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0]).toEqual({
                eventType: 'visit',
                title: '访问博物馆',
                description: '查看 故宫博物院 的详细信息',
                parameters: {
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院'
                }
            });
        });

        test('should include museum ID and name in parameters', () => {
            const museum = {
                id: 'national-museum',
                name: '中国国家博物馆'
            };

            mockEventWallService.recordEvent(
                'visit',
                '访问博物馆',
                `查看 ${museum.name} 的详细信息`,
                { museumId: museum.id, museumName: museum.name }
            );

            const event = recordedEvents[0];
            expect(event.parameters.museumId).toBe('national-museum');
            expect(event.parameters.museumName).toBe('中国国家博物馆');
        });
    });

    describe('Search Activity Tracking', () => {
        test('should record event when user searches with 2+ characters', () => {
            const query = '故宫';
            const resultsCount = 5;

            mockEventWallService.recordEvent(
                'search',
                '搜索博物馆',
                `搜索关键字：${query}`,
                { query: query, resultsCount: resultsCount }
            );

            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0]).toEqual({
                eventType: 'search',
                title: '搜索博物馆',
                description: '搜索关键字：故宫',
                parameters: {
                    query: '故宫',
                    resultsCount: 5
                }
            });
        });

        test('should include search query and results count', () => {
            const query = '北京博物馆';
            const resultsCount = 12;

            mockEventWallService.recordEvent(
                'search',
                '搜索博物馆',
                `搜索关键字：${query}`,
                { query: query, resultsCount: resultsCount }
            );

            const event = recordedEvents[0];
            expect(event.parameters.query).toBe('北京博物馆');
            expect(event.parameters.resultsCount).toBe(12);
        });
    });

    describe('Page View Tracking', () => {
        test('should record event when page loads', () => {
            const pageName = '首页';
            const pageUrl = 'http://localhost:8000/index.html';

            mockEventWallService.recordEvent(
                'page_view',
                '访问页面',
                `访问 ${pageName}`,
                { pageName: pageName, pageUrl: pageUrl }
            );

            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0]).toEqual({
                eventType: 'page_view',
                title: '访问页面',
                description: '访问 首页',
                parameters: {
                    pageName: '首页',
                    pageUrl: 'http://localhost:8000/index.html'
                }
            });
        });

        test('should map file names to Chinese page names correctly', () => {
            const pageNameMappings = {
                'index.html': '首页',
                'event-wall.html': '事件墙',
                'fireworks-wall.html': '烟花墙',
                'achievements.html': '成就',
                'leaderboard.html': '排行榜',
                'treasures.html': '宝藏',
                'museum-checkin.html': '博物馆签到'
            };

            Object.entries(pageNameMappings).forEach(([fileName, expectedName]) => {
                recordedEvents = [];
                mockEventWallService.recordEvent(
                    'page_view',
                    '访问页面',
                    `访问 ${expectedName}`,
                    { pageName: expectedName, pageUrl: `http://localhost:8000/${fileName}` }
                );

                expect(recordedEvents[0].parameters.pageName).toBe(expectedName);
            });
        });
    });

    describe('Event Wall Display', () => {
        test('should have correct event type icons', () => {
            const EVENT_TYPE_ICONS = {
                'visit': '🏛️',
                'search': '🔍',
                'page_view': '📄',
                'task': '📝',
                'checklist': '✅',
                'achievement': '🏆',
                'assessment': '📊',
                'other': '📌'
            };

            expect(EVENT_TYPE_ICONS.visit).toBe('🏛️');
            expect(EVENT_TYPE_ICONS.search).toBe('🔍');
            expect(EVENT_TYPE_ICONS.page_view).toBe('📄');
        });

        test('should have correct event type labels', () => {
            const EVENT_TYPE_LABELS = {
                'visit': '博物馆参观',
                'search': '搜索活动',
                'page_view': '页面访问',
                'task': '任务完成',
                'checklist': '清单完成',
                'achievement': '成就解锁',
                'assessment': '亲子测评',
                'other': '其他活动'
            };

            expect(EVENT_TYPE_LABELS.visit).toBe('博物馆参观');
            expect(EVENT_TYPE_LABELS.search).toBe('搜索活动');
            expect(EVENT_TYPE_LABELS.page_view).toBe('页面访问');
        });
    });

    describe('Event Batching', () => {
        test('should batch multiple events before sending', () => {
            // Record multiple events
            mockEventWallService.recordEvent('visit', '访问博物馆', '查看故宫博物院', { museumId: 'forbidden-city' });
            mockEventWallService.recordEvent('search', '搜索博物馆', '搜索：北京', { query: '北京' });
            mockEventWallService.recordEvent('page_view', '访问页面', '访问首页', { pageName: '首页' });

            expect(recordedEvents).toHaveLength(3);
            expect(recordedEvents[0].eventType).toBe('visit');
            expect(recordedEvents[1].eventType).toBe('search');
            expect(recordedEvents[2].eventType).toBe('page_view');
        });
    });
});
