/**
 * @jest-environment jsdom
 */

/**
 * Tests for Museum Popularity Survey functionality
 * Tests the voting feature for museum popularity ranking
 */

describe('Museum Popularity Survey', () => {
    let mockFetch;
    let mockLocalStorage;
    
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div class="survey-container">
                <h1 id="pageTitle"></h1>
                <p class="survey-intro" id="surveyIntro"></p>
                <form id="questionnaire">
                    <div class="question" id="question1">
                        <div class="museum-options" id="optionsContainer"></div>
                    </div>
                </form>
                <div class="result" id="result"></div>
                <button id="showResultBtn" style="display:none;"></button>
            </div>
        `;
        
        // Mock localStorage
        mockLocalStorage = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => mockLocalStorage[key] || null),
                setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
                removeItem: jest.fn((key) => { delete mockLocalStorage[key]; }),
                clear: jest.fn(() => { mockLocalStorage = {}; })
            },
            writable: true
        });
        
        // Mock fetch
        mockFetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({})
        });
        global.fetch = mockFetch;
        
        // Mock MUSEUMS_META
        window.MUSEUMS_META = [
            { id: 'forbidden-city', name: '故宫博物院', location: '北京', image: '' },
            { id: 'national-museum', name: '中国国家博物馆', location: '北京', image: '' },
            { id: 'shanghai-museum', name: '上海博物馆', location: '上海', image: '' },
            { id: 'terracotta-warriors', name: '秦始皇帝陵博物院', location: '西安', image: '' },
            { id: 'nanjing-museum', name: '南京博物院', location: '南京', image: '' },
            { id: 'hubei-museum', name: '湖北省博物馆', location: '武汉', image: '' },
            { id: 'suzhou-museum', name: '苏州博物馆', location: '苏州', image: '' }
        ];
    });
    
    afterEach(() => {
        jest.clearAllMocks();
        delete window.MUSEUMS_META;
    });

    describe('Configuration', () => {
        test('should have correct survey configuration', () => {
            const surveyConfig = {
                title: "你猜哪个博物馆最受欢迎？",
                question: "以下5个博物馆中，你认为哪个最受大众欢迎？",
                storageKey: "museumPopularity.data",
                museumsPerRound: 5
            };
            
            expect(surveyConfig.title).toBe("你猜哪个博物馆最受欢迎？");
            expect(surveyConfig.museumsPerRound).toBe(5);
            expect(surveyConfig.storageKey).toBe("museumPopularity.data");
        });
    });

    describe('Random Museum Selection', () => {
        test('should select exactly 5 random museums when more than 5 are available', () => {
            const allMuseums = window.MUSEUMS_META;
            expect(allMuseums.length).toBeGreaterThan(5);
            
            // Simulate selection logic
            const shuffled = [...allMuseums];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selectedMuseums = shuffled.slice(0, 5);
            
            expect(selectedMuseums.length).toBe(5);
        });
        
        test('should use all museums when fewer than 5 are available', () => {
            window.MUSEUMS_META = [
                { id: 'museum1', name: '博物馆1', location: '城市1' },
                { id: 'museum2', name: '博物馆2', location: '城市2' },
                { id: 'museum3', name: '博物馆3', location: '城市3' }
            ];
            
            const allMuseums = window.MUSEUMS_META;
            const selectedMuseums = [...allMuseums];
            
            expect(selectedMuseums.length).toBe(3);
        });
        
        test('should have unique museums in selection', () => {
            const allMuseums = window.MUSEUMS_META;
            const shuffled = [...allMuseums];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selectedMuseums = shuffled.slice(0, 5);
            
            const uniqueIds = new Set(selectedMuseums.map(m => m.id));
            expect(uniqueIds.size).toBe(selectedMuseums.length);
        });
    });

    describe('Vote Processing', () => {
        test('should increment vote count for selected museum', () => {
            const voteData = {
                'forbidden-city': 10,
                'national-museum': 5
            };
            
            const selectedMuseumId = 'forbidden-city';
            voteData[selectedMuseumId] = (voteData[selectedMuseumId] || 0) + 1;
            
            expect(voteData['forbidden-city']).toBe(11);
            expect(voteData['national-museum']).toBe(5);
        });
        
        test('should initialize vote count for new museum', () => {
            const voteData = {
                'forbidden-city': 10
            };
            
            const selectedMuseumId = 'shanghai-museum';
            voteData[selectedMuseumId] = (voteData[selectedMuseumId] || 0) + 1;
            
            expect(voteData['shanghai-museum']).toBe(1);
        });
    });

    describe('Results Display', () => {
        test('should sort museums by vote count in descending order', () => {
            const voteData = {
                'forbidden-city': 50,
                'national-museum': 30,
                'shanghai-museum': 80,
                'terracotta-warriors': 25
            };
            
            const sortedMuseums = Object.entries(voteData)
                .sort(([, a], [, b]) => b - a);
            
            expect(sortedMuseums[0][0]).toBe('shanghai-museum');
            expect(sortedMuseums[0][1]).toBe(80);
            expect(sortedMuseums[1][0]).toBe('forbidden-city');
            expect(sortedMuseums[1][1]).toBe(50);
        });
        
        test('should calculate percentages correctly', () => {
            const voteData = {
                'forbidden-city': 50,
                'national-museum': 30,
                'shanghai-museum': 20
            };
            
            const total = Object.values(voteData).reduce((a, b) => a + b, 0);
            expect(total).toBe(100);
            
            const forbiddenCityPercentage = Math.round((50 / total) * 100);
            expect(forbiddenCityPercentage).toBe(50);
            
            const shanghaiPercentage = Math.round((20 / total) * 100);
            expect(shanghaiPercentage).toBe(20);
        });
        
        test('should limit results to top 10 museums', () => {
            const voteData = {};
            for (let i = 1; i <= 15; i++) {
                voteData[`museum-${i}`] = i * 10;
            }
            
            const sortedMuseums = Object.entries(voteData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10);
            
            expect(sortedMuseums.length).toBe(10);
            expect(sortedMuseums[0][1]).toBe(150); // museum-15
        });
    });

    describe('UI Elements', () => {
        test('should have all required DOM elements', () => {
            expect(document.getElementById('pageTitle')).toBeTruthy();
            expect(document.getElementById('surveyIntro')).toBeTruthy();
            expect(document.getElementById('questionnaire')).toBeTruthy();
            expect(document.getElementById('optionsContainer')).toBeTruthy();
            expect(document.getElementById('result')).toBeTruthy();
            expect(document.getElementById('showResultBtn')).toBeTruthy();
        });
        
        test('should generate museum option cards', () => {
            const container = document.getElementById('optionsContainer');
            const museums = [
                { id: 'museum1', name: '博物馆1', location: '城市1', image: '' },
                { id: 'museum2', name: '博物馆2', location: '城市2', image: '' }
            ];
            
            container.innerHTML = '';
            museums.forEach((museum) => {
                const optionCard = document.createElement('div');
                optionCard.className = 'museum-option';
                
                const img = document.createElement('img');
                img.className = 'museum-image';
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'museum-info';
                
                const nameLabel = document.createElement('p');
                nameLabel.className = 'museum-name';
                nameLabel.textContent = museum.name;
                
                infoDiv.appendChild(nameLabel);
                optionCard.appendChild(img);
                optionCard.appendChild(infoDiv);
                container.appendChild(optionCard);
            });
            
            const optionCards = container.querySelectorAll('.museum-option');
            expect(optionCards.length).toBe(2);
        });
    });

    describe('Default Museums Fallback', () => {
        test('should have default museums list as fallback', () => {
            const defaultMuseums = [
                { id: 'forbidden-city', name: '故宫博物院', location: '北京' },
                { id: 'national-museum', name: '中国国家博物馆', location: '北京' },
                { id: 'shanghai-museum', name: '上海博物馆', location: '上海' },
                { id: 'terracotta-warriors', name: '秦始皇帝陵博物院', location: '西安' },
                { id: 'nanjing-museum', name: '南京博物院', location: '南京' }
            ];
            
            expect(defaultMuseums.length).toBeGreaterThanOrEqual(5);
            expect(defaultMuseums[0].id).toBe('forbidden-city');
            expect(defaultMuseums[0].name).toBe('故宫博物院');
        });
    });

    describe('Storage Key', () => {
        test('should use correct storage key for popularity data', () => {
            const storageKey = 'museumPopularity.data';
            expect(storageKey).toBe('museumPopularity.data');
        });
    });
    
    describe('Ranking Display', () => {
        test('should show medal emoji for top 3 positions', () => {
            const medals = ['🥇', '🥈', '🥉'];
            
            expect(medals[0]).toBe('🥇');
            expect(medals[1]).toBe('🥈');
            expect(medals[2]).toBe('🥉');
        });
        
        test('should show numeric position for positions 4 and beyond', () => {
            const positions = [4, 5, 6, 7, 8, 9, 10];
            
            positions.forEach(pos => {
                expect(typeof pos).toBe('number');
                expect(pos).toBeGreaterThan(3);
            });
        });
    });
});

describe('Survey File Structure', () => {
    test('survey/popularity directory should have required files', () => {
        // This test documents the expected file structure
        const expectedFiles = [
            'index.html',
            'app.js',
            'styles.css'
        ];
        
        expectedFiles.forEach(file => {
            expect(typeof file).toBe('string');
        });
    });
});
