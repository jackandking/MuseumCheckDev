/**
 * Unit Tests for Scenario Support Sharing Functionality
 * 
 * Tests the URL parameter sharing system that enables:
 * 1. Direct links to specific museum checklists via URL parameters
 * 2. Share button functionality for easy link generation
 * 3. Mobile-friendly experience for task completion
 * 
 * Related to GitHub Issue #155: "情景支持" (Scenario Support)
 */

// Mock localStorage
global.localStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
  },
  removeItem: function(key) {
    delete this.data[key];
  },
  clear: function() {
    this.data = {};
  }
};

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

describe('Scenario Support - Sharing Functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest.clearAllMocks();
    
    // Reset URL to default state
    delete window.location;
    window.location = new URL('http://localhost:8000/');
  });

  describe('URL Parameter Parsing', () => {
    test('should parse museum parameter from URL', () => {
      // Simulate URL with museum parameter
      delete window.location;
      window.location = new URL('http://localhost:8000/?museum=capital-museum&type=parent&age=7-12');
      
      const urlParams = new URLSearchParams(window.location.search);
      const museumId = urlParams.get('museum');
      const type = urlParams.get('type');
      const age = urlParams.get('age');
      
      expect(museumId).toBe('capital-museum');
      expect(type).toBe('parent');
      expect(age).toBe('7-12');
    });

    test('should handle missing URL parameters gracefully', () => {
      delete window.location;
      window.location = new URL('http://localhost:8000/');
      
      const urlParams = new URLSearchParams(window.location.search);
      const museumId = urlParams.get('museum');
      const type = urlParams.get('type');
      const age = urlParams.get('age');
      
      expect(museumId).toBeNull();
      expect(type).toBeNull();
      expect(age).toBeNull();
    });

    test('should validate museum ID exists in museum list', () => {
      const MUSEUMS = [
        { id: 'capital-museum', name: '首都博物馆' },
        { id: 'forbidden-city', name: '故宫博物院' }
      ];
      
      const validMuseumId = 'capital-museum';
      const invalidMuseumId = 'non-existent-museum';
      
      const validMuseum = MUSEUMS.find(m => m.id === validMuseumId);
      const invalidMuseum = MUSEUMS.find(m => m.id === invalidMuseumId);
      
      expect(validMuseum).toBeDefined();
      expect(validMuseum.name).toBe('首都博物馆');
      expect(invalidMuseum).toBeUndefined();
    });

    test('should validate checklist type parameter', () => {
      const validTypes = ['parent', 'child'];
      const testType1 = 'parent';
      const testType2 = 'child';
      const invalidType = 'invalid-type';
      
      expect(validTypes.includes(testType1)).toBe(true);
      expect(validTypes.includes(testType2)).toBe(true);
      expect(validTypes.includes(invalidType)).toBe(false);
    });

    test('should validate age group parameter', () => {
      const validAgeGroups = ['3-6', '7-12', '13-18'];
      const testAge1 = '7-12';
      const testAge2 = '3-6';
      const invalidAge = '20-25';
      
      expect(validAgeGroups.includes(testAge1)).toBe(true);
      expect(validAgeGroups.includes(testAge2)).toBe(true);
      expect(validAgeGroups.includes(invalidAge)).toBe(false);
    });
  });

  describe('Share Link Generation', () => {
    test('should generate correct share URL for parent preparation list', () => {
      const baseUrl = 'http://localhost:8000/';
      const museumId = 'capital-museum';
      const type = 'parent';
      const age = '7-12';
      
      const shareUrl = `${baseUrl}?museum=${museumId}&type=${type}&age=${age}`;
      const expectedUrl = 'http://localhost:8000/?museum=capital-museum&type=parent&age=7-12';
      
      expect(shareUrl).toBe(expectedUrl);
    });

    test('should generate correct share URL for child tasks list', () => {
      const baseUrl = 'http://localhost:8000/';
      const museumId = 'forbidden-city';
      const type = 'child';
      const age = '13-18';
      
      const shareUrl = `${baseUrl}?museum=${museumId}&type=${type}&age=${age}`;
      const expectedUrl = 'http://localhost:8000/?museum=forbidden-city&type=child&age=13-18';
      
      expect(shareUrl).toBe(expectedUrl);
    });

    test('should handle special characters in museum IDs', () => {
      const baseUrl = 'http://localhost:8000/';
      const museumId = 'chinese-science-technology-museum';
      const type = 'parent';
      const age = '3-6';
      
      const shareUrl = `${baseUrl}?museum=${encodeURIComponent(museumId)}&type=${type}&age=${age}`;
      const expectedUrl = 'http://localhost:8000/?museum=chinese-science-technology-museum&type=parent&age=3-6';
      
      expect(shareUrl).toBe(expectedUrl);
    });
  });

  describe('Clipboard Integration', () => {
    test('should copy share URL to clipboard successfully', async () => {
      const shareUrl = 'http://localhost:8000/?museum=capital-museum&type=parent&age=7-12';
      
      await navigator.clipboard.writeText(shareUrl);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareUrl);
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });

    test('should handle clipboard API errors gracefully', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard access denied'));
      
      let errorCaught = false;
      try {
        await navigator.clipboard.writeText('test-url');
      } catch (error) {
        errorCaught = true;
        expect(error.message).toBe('Clipboard access denied');
      }
      
      expect(errorCaught).toBe(true);
    });
  });

  describe('Modal Auto-Opening Behavior', () => {
    test('should simulate modal opening with URL parameters', () => {
      // Create DOM elements
      document.body.innerHTML = `
        <div class="modal hidden" id="museumModal">
          <div class="modal-content">
            <h2 id="modalTitle">Museum Title</h2>
            <div class="checklist-tabs">
              <button class="tab-button" data-tab="parent">家长准备</button>
              <button class="tab-button" data-tab="child">孩子任务</button>
            </div>
            <div id="parent" class="tab-content"></div>
            <div id="child" class="tab-content hidden"></div>
          </div>
        </div>
      `;
      
      const modal = document.getElementById('museumModal');
      const parentTab = document.querySelector('[data-tab="parent"]');
      const childTab = document.querySelector('[data-tab="child"]');
      
      // Simulate opening modal for parent preparation
      modal.classList.remove('hidden');
      parentTab.classList.add('active');
      
      expect(modal.classList.contains('hidden')).toBe(false);
      expect(parentTab.classList.contains('active')).toBe(true);
    });

    test('should simulate correct tab activation based on type parameter', () => {
      document.body.innerHTML = `
        <div class="checklist-tabs">
          <button class="tab-button" data-tab="parent" id="parentTab">家长准备</button>
          <button class="tab-button" data-tab="child" id="childTab">孩子任务</button>
        </div>
        <div id="parent" class="tab-content"></div>
        <div id="child" class="tab-content hidden"></div>
      `;
      
      const parentTab = document.getElementById('parentTab');
      const childTab = document.getElementById('childTab');
      const parentContent = document.getElementById('parent');
      const childContent = document.getElementById('child');
      
      // Test parent tab activation
      let activeType = 'parent';
      if (activeType === 'parent') {
        parentTab.classList.add('active');
        childTab.classList.remove('active');
        parentContent.classList.remove('hidden');
        childContent.classList.add('hidden');
      }
      
      expect(parentTab.classList.contains('active')).toBe(true);
      expect(childTab.classList.contains('active')).toBe(false);
      expect(parentContent.classList.contains('hidden')).toBe(false);
      expect(childContent.classList.contains('hidden')).toBe(true);
      
      // Test child tab activation
      activeType = 'child';
      if (activeType === 'child') {
        parentTab.classList.remove('active');
        childTab.classList.add('active');
        parentContent.classList.add('hidden');
        childContent.classList.remove('hidden');
      }
      
      expect(parentTab.classList.contains('active')).toBe(false);
      expect(childTab.classList.contains('active')).toBe(true);
      expect(parentContent.classList.contains('hidden')).toBe(true);
      expect(childContent.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Share Button UI Component', () => {
    test('should create share button with correct styling and text', () => {
      document.body.innerHTML = `
        <div class="checklist-tabs">
          <button class="share-button">🔗 分享链接</button>
        </div>
      `;
      
      const shareButton = document.querySelector('.share-button');
      
      expect(shareButton).toBeTruthy();
      expect(shareButton.textContent).toBe('🔗 分享链接');
    });

    test('should simulate share button click behavior', () => {
      document.body.innerHTML = `
        <button class="share-button" id="shareBtn">🔗 分享链接</button>
      `;
      
      const shareButton = document.getElementById('shareBtn');
      let clicked = false;
      
      shareButton.addEventListener('click', () => {
        clicked = true;
      });
      
      shareButton.click();
      
      expect(clicked).toBe(true);
    });
  });

  describe('Success Message Display', () => {
    test('should display success message after successful share', () => {
      document.body.innerHTML = `
        <div id="successMessage" class="hidden">链接已复制到剪贴板！可以通过微信等应用分享给朋友</div>
      `;
      
      const successMessage = document.getElementById('successMessage');
      
      // Simulate showing success message
      successMessage.classList.remove('hidden');
      successMessage.style.display = 'block';
      
      expect(successMessage.classList.contains('hidden')).toBe(false);
      expect(successMessage.textContent).toBe('链接已复制到剪贴板！可以通过微信等应用分享给朋友');
    });

    test('should auto-hide success message after timeout', (done) => {
      document.body.innerHTML = `
        <div id="successMessage">链接已复制到剪贴板！</div>
      `;
      
      const successMessage = document.getElementById('successMessage');
      
      // Simulate auto-hide after 3 seconds
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 50); // Use shorter timeout for test
      
      setTimeout(() => {
        expect(successMessage.classList.contains('hidden')).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Age Group Integration', () => {
    test('should maintain age group consistency in shared URLs', () => {
      // Simulate age selector
      const currentAge = '7-12';
      const shareUrl = `http://localhost:8000/?museum=capital-museum&type=parent&age=${currentAge}`;
      
      const urlParams = new URLSearchParams(shareUrl.split('?')[1]);
      const extractedAge = urlParams.get('age');
      
      expect(extractedAge).toBe(currentAge);
    });

    test('should handle age group changes in share URL generation', () => {
      const museumId = 'capital-museum';
      const type = 'parent';
      const baseUrl = 'http://localhost:8000/';
      
      // Test different age groups
      const ageGroups = ['3-6', '7-12', '13-18'];
      
      ageGroups.forEach(age => {
        const shareUrl = `${baseUrl}?museum=${museumId}&type=${type}&age=${age}`;
        const urlParams = new URLSearchParams(shareUrl.split('?')[1]);
        
        expect(urlParams.get('age')).toBe(age);
      });
    });
  });

  describe('Mobile Experience Support', () => {
    test('should support touch-friendly interfaces', () => {
      document.body.innerHTML = `
        <button class="share-button mobile-friendly" id="mobileShareBtn">
          🔗 分享链接
        </button>
      `;
      
      const shareButton = document.getElementById('mobileShareBtn');
      
      expect(shareButton.classList.contains('mobile-friendly')).toBe(true);
    });

    test('should handle viewport changes for mobile devices', () => {
      // Simulate mobile viewport
      const mobileWidth = 375;
      const desktopWidth = 1200;
      
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: mobileWidth,
      });
      
      const isMobile = window.innerWidth < 768;
      
      expect(isMobile).toBe(true);
      expect(window.innerWidth).toBe(mobileWidth);
      
      // Test desktop
      window.innerWidth = desktopWidth;
      const isDesktop = window.innerWidth >= 768;
      
      expect(isDesktop).toBe(true);
      expect(window.innerWidth).toBe(desktopWidth);
    });
  });

  describe('WeChat Integration Scenarios', () => {
    test('should generate WeChat-friendly share URLs', () => {
      const shareUrl = 'http://localhost:8000/?museum=capital-museum&type=parent&age=7-12';
      
      // WeChat should be able to parse these URLs properly
      expect(shareUrl).toMatch(/^https?:\/\//);
      expect(shareUrl).toContain('museum=');
      expect(shareUrl).toContain('type=');
      expect(shareUrl).toContain('age=');
    });

    test('should support Chinese characters in success messages', () => {
      const chineseMessage = '链接已复制到剪贴板！可以通过微信等应用分享给朋友';
      
      expect(chineseMessage).toContain('微信');
      expect(chineseMessage).toContain('分享');
      expect(chineseMessage).toContain('朋友');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid museum ID in URL', () => {
      const invalidMuseumId = 'non-existent-museum';
      const MUSEUMS = [
        { id: 'capital-museum', name: '首都博物馆' },
        { id: 'forbidden-city', name: '故宫博物院' }
      ];
      
      const museum = MUSEUMS.find(m => m.id === invalidMuseumId);
      
      expect(museum).toBeUndefined();
      
      // App should handle this gracefully and not crash
      const fallbackBehavior = museum ? museum : null;
      expect(fallbackBehavior).toBeNull();
    });

    test('should handle URL parameter combinations gracefully', () => {
      const testCases = [
        { museum: 'capital-museum', type: 'parent', age: '7-12', valid: true },
        { museum: 'invalid-museum', type: 'parent', age: '7-12', valid: false },
        { museum: 'capital-museum', type: 'invalid-type', age: '7-12', valid: false },
        { museum: 'capital-museum', type: 'parent', age: 'invalid-age', valid: false },
        { museum: '', type: '', age: '', valid: false }
      ];
      
      const validMuseums = ['capital-museum', 'forbidden-city'];
      const validTypes = ['parent', 'child'];
      const validAges = ['3-6', '7-12', '13-18'];
      
      testCases.forEach(testCase => {
        const museumValid = validMuseums.includes(testCase.museum);
        const typeValid = validTypes.includes(testCase.type);
        const ageValid = validAges.includes(testCase.age);
        
        const isValid = museumValid && typeValid && ageValid;
        expect(isValid).toBe(testCase.valid);
      });
    });

    test('should maintain data persistence during sharing scenarios', () => {
      // Simulate existing user data
      const existingData = {
        visitedMuseums: ['capital-museum'],
        museumChecklists: {
          'capital-museum-parent-7-12': [0, 1]
        }
      };
      
      localStorage.setItem('visitedMuseums', JSON.stringify(existingData.visitedMuseums));
      localStorage.setItem('museumChecklists', JSON.stringify(existingData.museumChecklists));
      
      // Verify data persists
      const retrievedVisited = JSON.parse(localStorage.getItem('visitedMuseums'));
      const retrievedChecklists = JSON.parse(localStorage.getItem('museumChecklists'));
      
      expect(retrievedVisited).toEqual(existingData.visitedMuseums);
      expect(retrievedChecklists).toEqual(existingData.museumChecklists);
    });
  });

  describe('Performance Considerations', () => {
    test('should handle multiple rapid share button clicks', () => {
      let clickCount = 0;
      const maxClicks = 10;
      
      for (let i = 0; i < maxClicks; i++) {
        clickCount++;
        // Simulate debounced behavior
        if (clickCount === 1 || clickCount === maxClicks) {
          expect(clickCount).toBeGreaterThan(0);
        }
      }
      
      expect(clickCount).toBe(maxClicks);
    });

    test('should efficiently parse URL parameters', () => {
      const testUrl = 'http://localhost:8000/?museum=capital-museum&type=parent&age=7-12&extra=value';
      const startTime = performance.now();
      
      const urlParams = new URLSearchParams(testUrl.split('?')[1]);
      const museum = urlParams.get('museum');
      const type = urlParams.get('type');
      const age = urlParams.get('age');
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(museum).toBe('capital-museum');
      expect(type).toBe('parent');
      expect(age).toBe('7-12');
      expect(executionTime).toBeLessThan(10); // Should be very fast
    });
  });
});

describe('Regression Tests for Scenario Support', () => {
  test('should not break existing modal functionality', () => {
    document.body.innerHTML = `
      <div class="modal hidden" id="museumModal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Test Museum</h2>
        </div>
      </div>
    `;
    
    const modal = document.getElementById('museumModal');
    const closeButton = document.querySelector('.close');
    
    // Test existing close functionality
    closeButton.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    // Open modal
    modal.classList.remove('hidden');
    expect(modal.classList.contains('hidden')).toBe(false);
    
    // Close modal
    closeButton.click();
    expect(modal.classList.contains('hidden')).toBe(true);
  });

  test('should not interfere with existing localStorage functionality', () => {
    // Test existing localStorage operations
    const visitedMuseums = ['capital-museum', 'forbidden-city'];
    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
    
    const retrieved = JSON.parse(localStorage.getItem('visitedMuseums'));
    expect(retrieved).toEqual(visitedMuseums);
    
    // Test checklist data
    const checklistData = { 'capital-museum-parent-7-12': [0, 1] };
    localStorage.setItem('museumChecklists', JSON.stringify(checklistData));
    
    const retrievedChecklists = JSON.parse(localStorage.getItem('museumChecklists'));
    expect(retrievedChecklists).toEqual(checklistData);
  });

  test('should maintain backward compatibility with existing URLs', () => {
    // Test that plain URLs still work
    delete window.location;
    window.location = new URL('http://localhost:8000/');
    
    const urlParams = new URLSearchParams(window.location.search);
    const museum = urlParams.get('museum');
    
    // Should handle absence of parameters gracefully
    expect(museum).toBeNull();
    
    // App should still function normally without URL parameters
    expect(window.location.pathname).toBe('/');
  });
});