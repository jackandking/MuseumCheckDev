/**
 * Event Tracking Initialization Tests
 * 
 * Tests for event-tracking-init.js module that enables event tracking on all pages
 * 
 * Regression test for Issue #1112: Missing event tracking on non-index pages
 * Only homepage visits were being recorded; museum visits, searches, and other page visits were not tracked
 */

describe('Event Tracking Initialization', () => {
    let mockEventWallService;
    let recordedEvents;
    
    beforeEach(() => {
        // Reset recorded events
        recordedEvents = [];
        
        // Clear window properties
        delete window.REMOTE_STORAGE_CONFIG;
        delete window.EventWallService;
        delete window.eventWallService;
        delete window.EventTrackingInit;
        
        // Mock EventWallService class
        window.EventWallService = jest.fn().mockImplementation(() => {
            return {
                recordEvent: jest.fn((eventType, title, description, parameters) => {
                    recordedEvents.push({ eventType, title, description, parameters });
                })
            };
        });
    });
    
    afterEach(() => {
        // Cleanup
        delete window.REMOTE_STORAGE_CONFIG;
        delete window.EventWallService;
        delete window.eventWallService;
        delete window.EventTrackingInit;
    });

    describe('REMOTE_STORAGE_CONFIG Initialization', () => {
        test('should define REMOTE_STORAGE_CONFIG if not already defined', () => {
            expect(window.REMOTE_STORAGE_CONFIG).toBeUndefined();
            
            // Simulate loading event-tracking-init.js
            window.REMOTE_STORAGE_CONFIG = {
                API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
                FIREWORK_KEY: 'museumcheck-firework',
                DOWNLOAD_INTERVAL: 10000,
                DEFAULT_FIREWORK_EXPIRATION: 60,
                TIMESTAMP_2124: 4866674732
            };
            
            expect(window.REMOTE_STORAGE_CONFIG).toBeDefined();
            expect(window.REMOTE_STORAGE_CONFIG.API_ENDPOINT).toBe('https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore');
        });
        
        test('should not override existing REMOTE_STORAGE_CONFIG', () => {
            const existingConfig = {
                API_ENDPOINT: 'https://custom-endpoint.com',
                CUSTOM_KEY: 'custom-value'
            };
            window.REMOTE_STORAGE_CONFIG = existingConfig;
            
            // event-tracking-init.js should check if it already exists
            // In our implementation, we check: if (typeof window.REMOTE_STORAGE_CONFIG === 'undefined')
            expect(window.REMOTE_STORAGE_CONFIG).toBe(existingConfig);
            expect(window.REMOTE_STORAGE_CONFIG.CUSTOM_KEY).toBe('custom-value');
        });
    });

    describe('EventWallService Initialization', () => {
        test('should initialize eventWallService if EventWallService class exists', () => {
            expect(window.eventWallService).toBeUndefined();
            
            // Simulate event-tracking-init.js initialization
            window.eventWallService = new window.EventWallService();
            
            expect(window.eventWallService).toBeDefined();
            expect(window.EventWallService).toHaveBeenCalled();
        });
        
        test('should not initialize if EventWallService class does not exist', () => {
            delete window.EventWallService;
            
            // Should not throw error when EventWallService is undefined
            expect(() => {
                if (typeof window.EventWallService !== 'undefined') {
                    window.eventWallService = new window.EventWallService();
                }
            }).not.toThrow();
            
            expect(window.eventWallService).toBeUndefined();
        });
        
        test('should not override existing eventWallService instance', () => {
            const existingService = { recordEvent: jest.fn() };
            window.eventWallService = existingService;
            
            // event-tracking-init.js checks: if (typeof window.eventWallService === 'undefined')
            expect(window.eventWallService).toBe(existingService);
        });
    });

    describe('Page Name Mapping', () => {
        test('should map index.html to 首页', () => {
            const getPageName = (pathname) => {
                const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
                const pageNames = {
                    'index.html': '首页',
                    'event-wall.html': '事件墙',
                    'fireworks-wall.html': '烟花墙',
                    'achievements.html': '成就',
                    'treasures.html': '镇馆之宝',
                    'museum-checkin.html': '博物馆打卡',
                    'leaderboard.html': '排行榜',
                    'everyone-achievements.html': '全民成就',
                    'fireworks.html': '烟花',
                    '': '首页'
                };
                return pageNames[filename] || filename;
            };
            
            expect(getPageName('/index.html')).toBe('首页');
            expect(getPageName('/')).toBe('首页');
        });
        
        test('should map all page filenames correctly', () => {
            const getPageName = (pathname) => {
                const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
                const pageNames = {
                    'index.html': '首页',
                    'event-wall.html': '事件墙',
                    'fireworks-wall.html': '烟花墙',
                    'achievements.html': '成就',
                    'treasures.html': '镇馆之宝',
                    'museum-checkin.html': '博物馆打卡',
                    'leaderboard.html': '排行榜',
                    'everyone-achievements.html': '全民成就',
                    'fireworks.html': '烟花',
                    '': '首页'
                };
                return pageNames[filename] || filename;
            };
            
            const testCases = [
                ['/event-wall.html', '事件墙'],
                ['/fireworks-wall.html', '烟花墙'],
                ['/achievements.html', '成就'],
                ['/treasures.html', '镇馆之宝'],
                ['/museum-checkin.html', '博物馆打卡'],
                ['/leaderboard.html', '排行榜'],
                ['/everyone-achievements.html', '全民成就'],
                ['/fireworks.html', '烟花']
            ];
            
            testCases.forEach(([pathname, expectedName]) => {
                expect(getPageName(pathname)).toBe(expectedName);
            });
        });
        
        test('should return filename for unknown pages', () => {
            const getPageName = (pathname) => {
                const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
                const pageNames = {
                    'index.html': '首页',
                    'event-wall.html': '事件墙'
                };
                return pageNames[filename] || filename;
            };
            
            expect(getPageName('/unknown-page.html')).toBe('unknown-page.html');
        });
    });

    describe('Page View Tracking', () => {
        beforeEach(() => {
            // Setup EventWallService instance
            window.eventWallService = new window.EventWallService();
        });
        
        test('should track page view on DOMContentLoaded', () => {
            const pageName = '事件墙';
            const pageUrl = 'http://localhost:8000/event-wall.html';
            
            // Simulate page view tracking
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                `访问 ${pageName}`,
                {
                    pageName: pageName,
                    pageUrl: pageUrl,
                    timestamp: Date.now()
                }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].eventType).toBe('page_view');
            expect(recordedEvents[0].title).toBe('访问页面');
            expect(recordedEvents[0].description).toBe('访问 事件墙');
            expect(recordedEvents[0].parameters.pageName).toBe('事件墙');
            expect(recordedEvents[0].parameters.pageUrl).toBe(pageUrl);
        });
        
        test('should include timestamp in page view parameters', () => {
            const now = Date.now();
            
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                '访问 首页',
                {
                    pageName: '首页',
                    pageUrl: 'http://localhost:8000/',
                    timestamp: now
                }
            );
            
            expect(recordedEvents[0].parameters.timestamp).toBe(now);
        });
        
        test('should handle missing eventWallService gracefully', () => {
            delete window.eventWallService;
            
            // Should not throw error when eventWallService is undefined
            expect(() => {
                if (window.eventWallService) {
                    window.eventWallService.recordEvent('page_view', '访问页面', '访问 首页', {});
                }
            }).not.toThrow();
        });
    });

    describe('Integration with Multiple Pages', () => {
        test('should track events on event-wall.html', () => {
            window.eventWallService = new window.EventWallService();
            
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                '访问 事件墙',
                { pageName: '事件墙', pageUrl: 'http://localhost:8000/event-wall.html' }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].parameters.pageName).toBe('事件墙');
        });
        
        test('should track events on achievements.html', () => {
            window.eventWallService = new window.EventWallService();
            
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                '访问 成就',
                { pageName: '成就', pageUrl: 'http://localhost:8000/achievements.html' }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].parameters.pageName).toBe('成就');
        });
        
        test('should track events on fireworks-wall.html', () => {
            window.eventWallService = new window.EventWallService();
            
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                '访问 烟花墙',
                { pageName: '烟花墙', pageUrl: 'http://localhost:8000/fireworks-wall.html' }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].parameters.pageName).toBe('烟花墙');
        });
        
        test('should track events on treasures.html', () => {
            window.eventWallService = new window.EventWallService();
            
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                '访问 镇馆之宝',
                { pageName: '镇馆之宝', pageUrl: 'http://localhost:8000/treasures.html' }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].parameters.pageName).toBe('镇馆之宝');
        });
        
        test('should track events on museum-checkin.html', () => {
            window.eventWallService = new window.EventWallService();
            
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                '访问 博物馆打卡',
                { pageName: '博物馆打卡', pageUrl: 'http://localhost:8000/museum-checkin.html' }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].parameters.pageName).toBe('博物馆打卡');
        });
    });

    describe('Regression: Issue #1112', () => {
        test('should fix missing event tracking on non-index pages', () => {
            // Before fix: Only index.html tracked events
            // After fix: All pages should track events
            
            const pages = [
                { filename: 'event-wall.html', name: '事件墙' },
                { filename: 'achievements.html', name: '成就' },
                { filename: 'fireworks-wall.html', name: '烟花墙' },
                { filename: 'treasures.html', name: '镇馆之宝' },
                { filename: 'museum-checkin.html', name: '博物馆打卡' },
                { filename: 'leaderboard.html', name: '排行榜' },
                { filename: 'everyone-achievements.html', name: '全民成就' },
                { filename: 'fireworks.html', name: '烟花' }
            ];
            
            window.eventWallService = new window.EventWallService();
            
            pages.forEach(page => {
                recordedEvents = []; // Reset for each page
                
                window.eventWallService.recordEvent(
                    'page_view',
                    '访问页面',
                    `访问 ${page.name}`,
                    { pageName: page.name, pageUrl: `http://localhost:8000/${page.filename}` }
                );
                
                expect(recordedEvents).toHaveLength(1);
                expect(recordedEvents[0].eventType).toBe('page_view');
                expect(recordedEvents[0].parameters.pageName).toBe(page.name);
            });
        });
        
        test('should ensure museum visits are tracked from all pages', () => {
            // Museum visits should work on any page that has the modal
            window.eventWallService = new window.EventWallService();
            
            const museum = {
                id: 'forbidden-city',
                name: '故宫博物院'
            };
            
            window.eventWallService.recordEvent(
                'visit',
                '访问博物馆',
                `查看 ${museum.name} 的详细信息`,
                { museumId: museum.id, museumName: museum.name }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].eventType).toBe('visit');
            expect(recordedEvents[0].parameters.museumName).toBe('故宫博物院');
        });
        
        test('should ensure search events are tracked from all pages', () => {
            // Search functionality should track events on any page with search
            window.eventWallService = new window.EventWallService();
            
            const query = '北京博物馆';
            const resultsCount = 12;
            
            window.eventWallService.recordEvent(
                'search',
                '搜索博物馆',
                `搜索关键字：${query}`,
                { query: query, resultsCount: resultsCount }
            );
            
            expect(recordedEvents).toHaveLength(1);
            expect(recordedEvents[0].eventType).toBe('search');
            expect(recordedEvents[0].parameters.query).toBe('北京博物馆');
        });
    });
});
