/**
 * Jest setup file for MuseumCheck tests
 * 
 * This file sets up the testing environment to mimic browser behavior
 * for our client-side JavaScript application.
 */

// Mock localStorage for testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Google Analytics gtag function
global.gtag = jest.fn();

// Mock window.GA_MEASUREMENT_ID
Object.defineProperty(window, 'GA_MEASUREMENT_ID', {
  value: 'GA_MEASUREMENT_ID'
});

// Mock HTMLCanvasElement and 2D context for testing
class MockCanvasRenderingContext2D {
  constructor() {
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'start';
  }

  fillRect() {}
  strokeRect() {}
  fillText() {}
  drawImage() {}
  getImageData() {
    return { data: new Uint8ClampedArray([255, 0, 0, 255]) };
  }
  clearRect() {}
  save() {}
  restore() {}
}

// Mock canvas element
HTMLCanvasElement.prototype.getContext = jest.fn((type) => {
  if (type === '2d') {
    return new MockCanvasRenderingContext2D();
  }
  return null;
});

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');

// Mock createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = jest.fn((tagName) => {
  const element = originalCreateElement(tagName);
  if (tagName === 'canvas') {
    element.width = 300;
    element.height = 150;
  }
  return element;
});

// Reset localStorage mock before each test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Create a minimal DOM structure for testing
  setupMinimalDOM() {
    document.body.innerHTML = `
      <div class="container">
        <select id="ageGroup">
          <option value="3-6">3-6岁</option>
          <option value="7-12">7-12岁</option>
          <option value="13-18">13-18岁</option>
        </select>
        <div id="museumGrid"></div>
        <div id="stats"></div>
        <span id="versionBadge">v0.0.0</span>
        <span id="currentVersion">v0.0.0</span>
        <span id="lastUpdated">...</span>
        <div id="changesList"></div>
      </div>
    `;
  },

  // Create mock museum data for testing
  getMockMuseumData() {
    return [
      {
        id: 'forbidden-city',
        name: '故宫博物院',
        location: '北京',
        description: '世界上现存规模最大、保存最为完整的木质结构古建筑群，收藏有大量珍贵文物',
        tags: ['历史', '建筑', '文物'],
        checklists: {
          parent: {
            '3-6': ['准备任务1', '准备任务2'],
            '7-12': ['准备任务3', '准备任务4'],
            '13-18': ['准备任务5', '准备任务6']
          },
          child: {
            '3-6': ['孩子任务1', '孩子任务2'],
            '7-12': ['孩子任务3', '孩子任务4'],
            '13-18': ['孩子任务5', '孩子任务6']
          }
        }
      },
      {
        id: 'national-museum',
        name: '中国国家博物馆',
        location: '北京',
        description: '综合性历史艺术博物馆，展示中华民族悠久文化历史',
        tags: ['历史', '文化', '艺术'],
        checklists: {
          parent: {
            '3-6': ['准备任务1', '准备任务2'],
            '7-12': ['准备任务3', '准备任务4'],
            '13-18': ['准备任务5', '准备任务6']
          },
          child: {
            '3-6': ['孩子任务1', '孩子任务2'],
            '7-12': ['孩子任务3', '孩子任务4'],
            '13-18': ['孩子任务5', '孩子任务6']
          }
        }
      },
      {
        id: 'shanghai-museum',
        name: '上海博物馆',
        location: '上海',
        description: '以古代艺术为主的综合性博物馆，被誉为"中华艺术宫"',
        tags: ['艺术', '文物', '收藏'],
        checklists: {
          parent: {
            '3-6': ['准备任务1', '准备任务2'],
            '7-12': ['准备任务3', '准备任务4'],
            '13-18': ['准备任务5', '准备任务6']
          },
          child: {
            '3-6': ['孩子任务1', '孩子任务2'],
            '7-12': ['孩子任务3', '孩子任务4'],
            '13-18': ['孩子任务5', '孩子任务6']
          }
        }
      }
    ];
  }
};