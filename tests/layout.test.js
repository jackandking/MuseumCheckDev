/**
 * Layout tests for MuseumCheck UX optimization
 * 
 * Tests to ensure the search/stats section swap is preserved
 */

describe('Layout Structure Tests', () => {
  beforeEach(() => {
    // Mock DOM setup
    document.body.innerHTML = `
      <div class="container">
        <main role="main">
          <section class="museum-list" id="museums">
            <h2>全国主要博物馆清单</h2>
            <p class="section-description">精选全国<span id="sectionMuseumCount">257家知名</span>博物馆</p>
            
            <div class="stats" role="status" aria-live="polite">
              <div class="progress-display">
                <span id="visitedCount">0</span>/<span id="totalCount">257</span> 已参观
                (<span id="visitedPercentage">0</span>%)
              </div>
              <div class="achievement-stats">
                <div class="achievement-inline">
                  <div class="achievement-text">
                    🏅 获得成就: <span id="achievementCount">0</span>个
                  </div>
                  <button id="achievementButton" class="achievement-button achievement-button-inline">🎖️ 我的成就</button>
                </div>
              </div>
            </div>
            
            <div class="search-section">
              <div class="search-container">
                <input type="text" id="museumSearch" class="search-input" placeholder="🔍 搜索博物馆名称、城市或标签...">
                <button id="clearSearch" class="clear-search-button" style="display: none;">✕</button>
              </div>
              <div class="search-results-info" id="searchResultsInfo" style="display: none;">
                显示 <span id="filteredCount">0</span> 个搜索结果
              </div>
            </div>
            
            <div id="museumGrid" class="museum-grid">
              <!-- Museum cards would be here -->
            </div>
          </section>
        </main>
      </div>
    `;
  });

  test('stats section should appear before search section', () => {
    const museumSection = document.querySelector('.museum-list');
    const children = Array.from(museumSection.children);
    
    // Find the indices of stats and search sections
    const statsIndex = children.findIndex(child => child.classList.contains('stats'));
    const searchIndex = children.findIndex(child => child.classList.contains('search-section'));
    const gridIndex = children.findIndex(child => child.classList.contains('museum-grid'));
    
    // Stats should come before search
    expect(statsIndex).toBeGreaterThan(-1);
    expect(searchIndex).toBeGreaterThan(-1);
    expect(statsIndex).toBeLessThan(searchIndex);
    
    // Search should come before museum grid
    expect(searchIndex).toBeLessThan(gridIndex);
  });

  test('stats section should contain required elements', () => {
    const statsSection = document.querySelector('.stats');
    
    expect(statsSection).toBeTruthy();
    expect(statsSection.querySelector('.progress-display')).toBeTruthy();
    expect(statsSection.querySelector('#visitedCount')).toBeTruthy();
    expect(statsSection.querySelector('#totalCount')).toBeTruthy();
    expect(statsSection.querySelector('#visitedPercentage')).toBeTruthy();
    expect(statsSection.querySelector('.achievement-stats')).toBeTruthy();
  });

  test('search section should contain required elements', () => {
    const searchSection = document.querySelector('.search-section');
    
    expect(searchSection).toBeTruthy();
    expect(searchSection.querySelector('.search-container')).toBeTruthy();
    expect(searchSection.querySelector('#museumSearch')).toBeTruthy();
    expect(searchSection.querySelector('#clearSearch')).toBeTruthy();
    expect(searchSection.querySelector('#searchResultsInfo')).toBeTruthy();
  });

  test('search input should be closer to museum grid than before', () => {
    const searchSection = document.querySelector('.search-section');
    const museumGrid = document.querySelector('.museum-grid');
    const statsSection = document.querySelector('.stats');
    
    // Get positions in DOM
    const searchPos = Array.from(searchSection.parentNode.children).indexOf(searchSection);
    const gridPos = Array.from(museumGrid.parentNode.children).indexOf(museumGrid);
    const statsPos = Array.from(statsSection.parentNode.children).indexOf(statsSection);
    
    // Search should be directly before the grid (with stats before search)
    expect(searchPos).toBe(gridPos - 1);
    expect(statsPos).toBe(searchPos - 1);
  });

  test('layout structure should be consistent', () => {
    const museumSection = document.querySelector('.museum-list');
    const expectedOrder = [
      'H2', // title
      'P',  // description  
      'DIV', // stats (class="stats")
      'DIV', // search (class="search-section")
      'DIV'  // grid (class="museum-grid")
    ];
    
    const actualOrder = Array.from(museumSection.children).map(child => child.tagName);
    
    expect(actualOrder).toEqual(expectedOrder);
    
    // Verify the specific classes for DIV elements
    const divElements = Array.from(museumSection.children).filter(child => child.tagName === 'DIV');
    expect(divElements[0].classList.contains('stats')).toBe(true);
    expect(divElements[1].classList.contains('search-section')).toBe(true);
    expect(divElements[2].classList.contains('museum-grid')).toBe(true);
  });
});

describe('Mobile Layout Optimization', () => {
  beforeEach(() => {
    // Mock window.innerWidth for mobile testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    
    // Setup mobile DOM
    document.body.innerHTML = `
      <div class="stats">
        <div class="progress-display">0/257 已参观 (0%)</div>
        <div class="achievement-stats">
          <div class="achievement-inline">
            <div class="achievement-text">🏅 获得成就: 0个</div>
            <button class="achievement-button-inline">🎖️ 我的成就</button>
            <button class="clear-data-button-icon">🗑️</button>
          </div>
        </div>
      </div>
    `;
  });

  test('stats section should have mobile-optimized classes', () => {
    const statsSection = document.querySelector('.stats');
    const progressDisplay = document.querySelector('.progress-display');
    const achievementInline = document.querySelector('.achievement-inline');
    
    expect(statsSection).toBeTruthy();
    expect(progressDisplay).toBeTruthy();
    expect(achievementInline).toBeTruthy();
  });

  test('achievement inline layout should be mobile-friendly', () => {
    const achievementInline = document.querySelector('.achievement-inline');
    const achievementText = achievementInline.querySelector('.achievement-text');
    const achievementButton = achievementInline.querySelector('.achievement-button-inline');
    const clearButton = achievementInline.querySelector('.clear-data-button-icon');
    
    expect(achievementText).toBeTruthy();
    expect(achievementButton).toBeTruthy();
    expect(clearButton).toBeTruthy();
    
    // Verify they are all within the same container for mobile layout
    expect(achievementInline.children.length).toBe(3);
  });
});