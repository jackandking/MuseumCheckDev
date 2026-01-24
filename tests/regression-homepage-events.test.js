// MuseumCheckApp from global (tests/setup.js) or direct require fallback
const scriptModule = require('../script.js');
const MuseumCheckApp = global.MuseumCheckApp || scriptModule.MuseumCheckApp;

describe('HomepageAdapter event payloads do not break rendering', () => {
  let originalGetElementById;
  let originalQuerySelector;
  let originalQuerySelectorAll;

  beforeEach(() => {
    // Minimal DOM stubs to allow setupEventListeners to run
    const createElementStub = () => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() },
      style: {},
      dataset: {},
      value: '',
      checked: false,
      querySelector: jest.fn(() => createElementStub()),
      querySelectorAll: jest.fn(() => []),
      appendChild: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      closest: jest.fn(() => null)
    });

    originalGetElementById = document.getElementById;
    originalQuerySelector = document.querySelector;
    originalQuerySelectorAll = document.querySelectorAll;

    document.getElementById = jest.fn(() => createElementStub());
    document.querySelector = jest.fn(() => createElementStub());
    document.querySelectorAll = jest.fn(() => []);

    // Mock global eventBus
    const handlers = {};
    global.window.eventBus = {
      on: (event, handler) => {
        handlers[event] = handler;
      },
      emit: (event, payload) => {
        if (handlers[event]) handlers[event](payload);
      },
    };
    global.eventBus = global.window.eventBus;
  });

  afterEach(() => {
    document.getElementById = originalGetElementById;
    document.querySelector = originalQuerySelector;
    document.querySelectorAll = originalQuerySelectorAll;
    delete global.window.eventBus;
    delete global.eventBus;
  });

  test('event payloads do not replace adapter-filtered array', () => {
    const app = Object.create(MuseumCheckApp.prototype);
    app.homepageAdapter = {
      getFilteredMuseums: jest.fn(() => [{ id: 'museum-1', name: 'Test' }])
    };
    app.renderMuseums = jest.fn();
    app.filterMuseums = jest.fn();
    app.toggleClearButton = jest.fn();
    app.setupInlineNicknameEditing = jest.fn();
    app.closeModal = jest.fn();
    app.closeCustomModal = jest.fn();
    app.toggleAssessmentVisibility = jest.fn();
    app.toggleManageButtonVisibility = jest.fn();
    app.toggleGuideButtonVisibility = jest.fn();
    app.toggleChildMode = jest.fn();
    app.saveShowOnlyMuseumsWithCollections = jest.fn();
    app.clearData = jest.fn();
    app.openTreasureReportModal = jest.fn();
    app.openAssessmentModal = jest.fn();
    app.openShareModal = jest.fn();
    app.openGuideModal = jest.fn();
    app.toggleSettingsMenu = jest.fn();
    app.updateDynamicMuseumCounts = jest.fn();
    app.refreshLeaderboard = jest.fn();
    app.trackEvent = jest.fn();
    app.openPosterPublishModal = jest.fn();
    app.openTreasureWorkflowModal = jest.fn();
    app.openGlobalFireworksWall = jest.fn();
    app.openEverybodyAchievementsModal = jest.fn();
    app.openManageAchievementsModal = jest.fn();
    app.openPetLevelModal = jest.fn();
    app.openSettingsModal = jest.fn();
    app.openSimpleModal = jest.fn();
    app.openSnakeGameModal = jest.fn();
    app.openSpaceInvadersModal = jest.fn();
    app.openMinecraftImagesModal = jest.fn();
    app.openTreasureImageUploadModal = jest.fn();
    app.openAdminPanel = jest.fn();
    app.openAchievementsModal = jest.fn();
    app.toggleAchievementGamification = jest.fn();
    app.openDownloadImageModal = jest.fn();
    app.openCheckinPetModal = jest.fn();
    app.filteredMuseums = 'not-an-array';
    app.sortBy = 'default';
    app.showOnlyMuseumsWithCollections = false;

    // Run the real event listener setup (uses global eventBus mock)
    MuseumCheckApp.prototype.setupEventListeners.call(app);

    // Emit event with a non-array payload (regression trigger)
    global.eventBus.emit('homepage:search', { searchText: 'beijing' });

    expect(app.homepageAdapter.getFilteredMuseums).toHaveBeenCalled();
    expect(Array.isArray(app.filteredMuseums)).toBe(true);
    expect(app.filteredMuseums[0].id).toBe('museum-1');
    expect(app.renderMuseums).toHaveBeenCalled();
  });
});
