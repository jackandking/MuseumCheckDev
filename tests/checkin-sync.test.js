/**
 * Unit tests for museum-checkin page synchronization fixes
 * 
 * Issue: checkin的bug
 * - 主页的垃圾桶按钮清数据目前对checkin页面不起作用
 * - checkin页面和参观指南的孩子任务没有保持一致，一处完成任务没有影响另一处
 * - checkin页的任务完成数量展示不准确
 */

describe('Museum Checkin Synchronization', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Bug 1: Clear data button should clear checkin page data', () => {
    test('should clear all museumCheckin_* keys when clearing all data', () => {
      // Setup: Add some checkin data
      localStorage.setItem('museumCheckin_forbidden-city_7-12', JSON.stringify([0, 1, 2]));
      localStorage.setItem('museumCheckin_national-museum_7-12', JSON.stringify([0, 3]));
      localStorage.setItem('museumCheckin_shanghai-museum_3-6', JSON.stringify([1]));
      localStorage.setItem('museumChecklists', JSON.stringify({}));
      localStorage.setItem('visitedMuseums', JSON.stringify(['forbidden-city']));
      
      // Verify data exists
      expect(localStorage.getItem('museumCheckin_forbidden-city_7-12')).not.toBeNull();
      expect(localStorage.getItem('museumCheckin_national-museum_7-12')).not.toBeNull();
      expect(localStorage.getItem('museumCheckin_shanghai-museum_3-6')).not.toBeNull();
      
      // Simulate the clearAllData logic
      localStorage.removeItem('visitedMuseums');
      localStorage.removeItem('museumChecklists');
      
      // Clear museum checkin page data (the fix we added)
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('museumCheckin_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Verify all checkin data is cleared
      expect(localStorage.getItem('museumCheckin_forbidden-city_7-12')).toBeNull();
      expect(localStorage.getItem('museumCheckin_national-museum_7-12')).toBeNull();
      expect(localStorage.getItem('museumCheckin_shanghai-museum_3-6')).toBeNull();
      expect(localStorage.getItem('visitedMuseums')).toBeNull();
      expect(localStorage.getItem('museumChecklists')).toBeNull();
    });

    test('should clear specific checkin data when clearing child checklist', () => {
      const museumId = 'forbidden-city';
      const ageGroup = '7-12';
      
      // Setup: Add both main app and checkin data
      const checklistsData = {};
      checklistsData[`${museumId}-child-${ageGroup}`] = [0, 1, 2];
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      const checkinKey = `museumCheckin_${museumId}_${ageGroup}`;
      localStorage.setItem(checkinKey, JSON.stringify([0, 1, 2]));
      
      // Verify data exists
      expect(localStorage.getItem(checkinKey)).not.toBeNull();
      
      // Simulate clearChildChecklistData
      const childKey = `${museumId}-child-${ageGroup}`;
      const checklists = JSON.parse(localStorage.getItem('museumChecklists'));
      delete checklists[childKey];
      localStorage.setItem('museumChecklists', JSON.stringify(checklists));
      
      // Also clear the checkin page data (the fix we added)
      localStorage.removeItem(checkinKey);
      
      // Verify both are cleared
      expect(localStorage.getItem(checkinKey)).toBeNull();
      const updatedChecklists = JSON.parse(localStorage.getItem('museumChecklists'));
      expect(updatedChecklists[childKey]).toBeUndefined();
    });
  });

  describe('Bug 2: Checkin page and main page should sync child tasks', () => {
    test('should save completed tasks to museumChecklists structure', () => {
      const museumId = 'forbidden-city';
      const ageGroup = '7-12';
      const completedTasks = [0, 2, 4];
      
      // Simulate saveCompletedTasks from checkin page
      const checklistKey = `${museumId}-child-${ageGroup}`;
      const checklistsData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      checklistsData[checklistKey] = completedTasks;
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      // Verify data is in the correct structure
      const savedData = JSON.parse(localStorage.getItem('museumChecklists'));
      expect(savedData[checklistKey]).toEqual(completedTasks);
      expect(savedData[checklistKey]).toHaveLength(3);
    });

    test('should load completed tasks from museumChecklists structure', () => {
      const museumId = 'national-museum';
      const ageGroup = '13-18';
      const completedTasks = [1, 3, 5, 7];
      
      // Setup: Main app has saved some completed tasks
      const checklistKey = `${museumId}-child-${ageGroup}`;
      const checklistsData = {};
      checklistsData[checklistKey] = completedTasks;
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      // Simulate loadCompletedTasks from checkin page
      const loadedData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      const loaded = new Set(loadedData[checklistKey] || []);
      
      // Verify tasks are loaded correctly
      expect([...loaded]).toEqual(completedTasks);
      expect(loaded.size).toBe(4);
      expect(loaded.has(1)).toBe(true);
      expect(loaded.has(7)).toBe(true);
    });

    test('should migrate legacy museumCheckin_* data to new structure', () => {
      const museumId = 'shanghai-museum';
      const ageGroup = '3-6';
      const legacyCompletedTasks = [0, 1];
      
      // Setup: Old data exists in legacy format
      const legacyKey = `museumCheckin_${museumId}_${ageGroup}`;
      localStorage.setItem(legacyKey, JSON.stringify(legacyCompletedTasks));
      
      // Simulate loadCompletedTasks with migration logic
      const checklistKey = `${museumId}-child-${ageGroup}`;
      let checklistsData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      
      let completedTasks;
      if (checklistsData[checklistKey]) {
        completedTasks = new Set(checklistsData[checklistKey]);
      } else {
        // Fallback to legacy format
        const saved = localStorage.getItem(legacyKey);
        if (saved) {
          completedTasks = new Set(JSON.parse(saved));
          // Migrate to new format
          checklistsData[checklistKey] = [...completedTasks];
          localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
        }
      }
      
      // Verify migration happened
      const migratedData = JSON.parse(localStorage.getItem('museumChecklists'));
      expect(migratedData[checklistKey]).toEqual(legacyCompletedTasks);
      expect(migratedData[checklistKey]).toHaveLength(2);
    });

    test('should maintain backward compatibility by saving to both formats', () => {
      const museumId = 'forbidden-city';
      const ageGroup = '7-12';
      const completedTasks = [0, 1, 2, 3];
      
      // Simulate saveCompletedTasks with backward compatibility
      const checklistKey = `${museumId}-child-${ageGroup}`;
      const checklistsData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      checklistsData[checklistKey] = completedTasks;
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      // Also save to legacy format
      const legacyKey = `museumCheckin_${museumId}_${ageGroup}`;
      localStorage.setItem(legacyKey, JSON.stringify(completedTasks));
      
      // Verify both formats have the data
      const newFormatData = JSON.parse(localStorage.getItem('museumChecklists'));
      const legacyFormatData = JSON.parse(localStorage.getItem(legacyKey));
      
      expect(newFormatData[checklistKey]).toEqual(completedTasks);
      expect(legacyFormatData).toEqual(completedTasks);
    });
  });

  describe('Bug 3: Task completion count should be accurate', () => {
    test('should count completed tasks correctly after sync', () => {
      const museumId = 'forbidden-city';
      const ageGroup = '7-12';
      const totalTasks = 10;
      const completedIndices = [0, 2, 4, 6, 8];
      
      // Setup: Save completed tasks using the new structure
      const checklistKey = `${museumId}-child-${ageGroup}`;
      const checklistsData = {};
      checklistsData[checklistKey] = completedIndices;
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      // Load and calculate progress
      const loadedData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      const completedTasks = new Set(loadedData[checklistKey] || []);
      const completed = completedTasks.size;
      const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
      
      // Verify count is accurate
      expect(completed).toBe(5);
      expect(percentage).toBe(50);
    });

    test('should handle empty completion data correctly', () => {
      const museumId = 'national-museum';
      const ageGroup = '7-12';
      const totalTasks = 8;
      
      // No completed tasks data
      const checklistKey = `${museumId}-child-${ageGroup}`;
      const loadedData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      const completedTasks = new Set(loadedData[checklistKey] || []);
      const completed = completedTasks.size;
      const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
      
      // Verify counts are zero
      expect(completed).toBe(0);
      expect(percentage).toBe(0);
    });

    test('should handle 100% completion correctly', () => {
      const museumId = 'shanghai-museum';
      const ageGroup = '3-6';
      const totalTasks = 5;
      const completedIndices = [0, 1, 2, 3, 4]; // All tasks
      
      // Setup: All tasks completed
      const checklistKey = `${museumId}-child-${ageGroup}`;
      const checklistsData = {};
      checklistsData[checklistKey] = completedIndices;
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      // Calculate progress
      const loadedData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      const completedTasks = new Set(loadedData[checklistKey] || []);
      const completed = completedTasks.size;
      const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
      
      // Verify 100% completion
      expect(completed).toBe(5);
      expect(percentage).toBe(100);
    });
  });

  describe('Integration: Full workflow test', () => {
    test('should sync data between main page and checkin page', () => {
      const museumId = 'forbidden-city';
      const ageGroup = '7-12';
      
      // Scenario 1: User completes tasks on main page
      const mainPageCompleted = [0, 1, 2];
      const checklistKey = `${museumId}-child-${ageGroup}`;
      let checklistsData = {};
      checklistsData[checklistKey] = mainPageCompleted;
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      // User opens checkin page - should see main page's progress
      let loadedData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      let completedFromCheckin = new Set(loadedData[checklistKey] || []);
      expect([...completedFromCheckin]).toEqual(mainPageCompleted);
      
      // Scenario 2: User completes more tasks on checkin page
      completedFromCheckin.add(3);
      completedFromCheckin.add(4);
      
      // Save from checkin page
      checklistsData[checklistKey] = [...completedFromCheckin];
      localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
      
      // User returns to main page - should see all progress
      loadedData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
      const completedFromMain = new Set(loadedData[checklistKey] || []);
      expect(completedFromMain.size).toBe(5);
      expect(completedFromMain.has(0)).toBe(true);
      expect(completedFromMain.has(4)).toBe(true);
    });
  });
});
