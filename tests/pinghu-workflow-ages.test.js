const fs = require('fs');
const path = require('path');

/**
 * UT: Validate Pinghu Museum workflow age group coverage
 * - Ensures the treasure-discovery workflow covers all age groups: 3-6, 7-12, 13-18
 * - Validates that all tasks within the workflow support all age groups
 * - Confirms checklists exist for all age groups
 */

describe('Pinghu Museum workflow age coverage', () => {
  let museum;
  let workflows;

  beforeAll(() => {
    // Load museum data from museums-data.js
    const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
    delete require.cache[museumsDataPath];
    require(museumsDataPath);
    museum = global.MUSEUMS && global.MUSEUMS.find(m => m.id === 'pinghu-museum');
    
    // Load workflows from workflows-data.js
    const workflowsDataPath = path.join(__dirname, '..', 'workflows-data.js');
    delete require.cache[workflowsDataPath];
    require(workflowsDataPath);
    workflows = global.WORKFLOWS && global.WORKFLOWS['pinghu-museum'];
  });

  test('treasure-discovery workflow should cover all age groups', () => {
    expect(museum).toBeTruthy();
    expect(Array.isArray(workflows)).toBe(true);
    
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    expect(treasureWorkflow).toBeTruthy();
    expect(treasureWorkflow.name).toBe('镇馆之宝探索');
    
    // Workflow should support all three age groups
    expect(Array.isArray(treasureWorkflow.ages)).toBe(true);
    expect(treasureWorkflow.ages).toContain('3-6');
    expect(treasureWorkflow.ages).toContain('7-12');
    expect(treasureWorkflow.ages).toContain('13-18');
    expect(treasureWorkflow.ages.length).toBe(3);
  });

  test('all tasks in treasure-discovery workflow should support all age groups', () => {
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    expect(Array.isArray(treasureWorkflow.tasks)).toBe(true);
    expect(treasureWorkflow.tasks.length).toBeGreaterThan(0);
    
    // All tasks should support all three age groups
    treasureWorkflow.tasks.forEach(task => {
      expect(Array.isArray(task.ages)).toBe(true);
      expect(task.ages).toContain('3-6');
      expect(task.ages).toContain('7-12');
      expect(task.ages).toContain('13-18');
    });
  });

  test('checklists should exist for all age groups', () => {
    expect(museum.checklists).toBeTruthy();
    expect(museum.checklists.parent).toBeTruthy();
    expect(museum.checklists.child).toBeTruthy();
    
    // Parent checklists for all age groups
    expect(Array.isArray(museum.checklists.parent['3-6'])).toBe(true);
    expect(museum.checklists.parent['3-6'].length).toBeGreaterThan(0);
    
    expect(Array.isArray(museum.checklists.parent['7-12'])).toBe(true);
    expect(museum.checklists.parent['7-12'].length).toBeGreaterThan(0);
    
    expect(Array.isArray(museum.checklists.parent['13-18'])).toBe(true);
    expect(museum.checklists.parent['13-18'].length).toBeGreaterThan(0);
    
    // Child checklists for all age groups
    expect(Array.isArray(museum.checklists.child['3-6'])).toBe(true);
    expect(museum.checklists.child['3-6'].length).toBeGreaterThan(0);
    
    expect(Array.isArray(museum.checklists.child['7-12'])).toBe(true);
    expect(museum.checklists.child['7-12'].length).toBeGreaterThan(0);
    
    expect(Array.isArray(museum.checklists.child['13-18'])).toBe(true);
    expect(museum.checklists.child['13-18'].length).toBeGreaterThan(0);
  });

  test('workflow age groups should match available checklist age groups', () => {
    const treasureWorkflow = museum.workflows.find(wf => wf.id === 'treasure-discovery');
    const parentAges = Object.keys(museum.checklists.parent);
    const childAges = Object.keys(museum.checklists.child);
    
    // Workflow ages should be a subset of available checklist ages
    treasureWorkflow.ages.forEach(age => {
      expect(parentAges).toContain(age);
      expect(childAges).toContain(age);
    });
  });
});
