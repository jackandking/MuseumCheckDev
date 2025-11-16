/**
 * Test for Forbidden City treasure discovery workflow
 * Verifies the new workflow matches Pinghu pattern
 */

const fs = require('fs');
const path = require('path');

describe('Forbidden City treasure discovery workflow', () => {
  let museum;
  let workflows;

  beforeAll(() => {
    // Load museum data from museums-data.js
    const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
    delete require.cache[museumsDataPath];
    require(museumsDataPath);
    museum = global.MUSEUMS && global.MUSEUMS.find(m => m.id === 'forbidden-city');
    
    // Load workflows from workflows-data.js
    const workflowsDataPath = path.join(__dirname, '..', 'workflows-data.js');
    delete require.cache[workflowsDataPath];
    require(workflowsDataPath);
    workflows = global.WORKFLOWS && global.WORKFLOWS['forbidden-city'];
  });

  test('should have treasure-discovery workflow as first workflow', () => {
    expect(workflows).toBeDefined();
    expect(workflows.length).toBeGreaterThanOrEqual(2);
    
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    expect(treasureWorkflow).toBeDefined();
    expect(treasureWorkflow.name).toBe('镇馆之宝探索');
    expect(treasureWorkflow.description).toContain('镇馆之宝');
  });

  test('treasure-discovery workflow should support all age groups', () => {
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    expect(treasureWorkflow.ages).toEqual(['3-6', '7-12', '13-18']);
  });

  test('treasure-discovery workflow should have 6 tasks', () => {
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    expect(treasureWorkflow.tasks).toHaveLength(6);
  });

  test('treasure-discovery workflow should have gate photo as first task', () => {
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    const firstTask = treasureWorkflow.tasks[0];
    
    expect(firstTask.id).toBe('gate-photo');
    expect(firstTask.role).toBe('parent');
    expect(firstTask.type).toBe('photo');
    expect(firstTask.title).toBe('门口打卡');
  });

  test('treasure-discovery workflow should have 3 treasure-finding tasks with images', () => {
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    
    // Tasks 2-4 should be treasure finding
    const treasureTasks = treasureWorkflow.tasks.slice(1, 4);
    
    treasureTasks.forEach((task, idx) => {
      expect(task.role).toBe('child');
      expect(task.type).toBe('photo');
      expect(task.title).toBe(`镇馆之宝 ${idx + 1}/3`);
      expect(task.imageUrl).toBeDefined();
      expect(task.imageUrl).toContain('http');
    });
  });

  test('treasure-discovery workflow should reference the 3 major treasures', () => {
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    
    const task1 = treasureWorkflow.tasks[1];
    const task2 = treasureWorkflow.tasks[2];
    const task3 = treasureWorkflow.tasks[3];
    
    expect(task1.subtitle).toContain('清明上河图');
    expect(task2.subtitle).toContain('金瓯永固杯');
    expect(task3.subtitle).toContain('酗亚方尊');
  });

  test('treasure-discovery workflow should have victory photo and poster tasks', () => {
    const treasureWorkflow = workflows.find(wf => wf.id === 'treasure-discovery');
    
    const victoryTask = treasureWorkflow.tasks[4];
    const posterTask = treasureWorkflow.tasks[5];
    
    expect(victoryTask.id).toBe('victory-photo');
    expect(victoryTask.role).toBe('parent');
    expect(victoryTask.type).toBe('photo');
    expect(victoryTask.title).toBe('完成合影');
    expect(victoryTask.subtitle).toContain('比心/拥抱/击掌');
    
    expect(posterTask.id).toBe('poster');
    expect(posterTask.role).toBe('parent');
    expect(posterTask.type).toBe('poster');
    expect(posterTask.title).toBe('成就海报');
  });

  test('parent checklists should emphasize parent-child relationship', () => {
    // Check 3-6 age group
    const parent36 = museum.checklists.parent['3-6'];
    expect(parent36.length).toBeGreaterThan(0);
    
    // Should contain emotional connection keywords
    const allText = parent36.join(' ');
    expect(allText).toMatch(/拥抱|牵手|温柔|真诚|倾听/);
    expect(allText).toMatch(/出发仪式感/);
    expect(allText).toMatch(/睡前回忆/);
  });

  test('parent checklists for 7-12 should emphasize partnership and encouragement', () => {
    const parent712 = museum.checklists.parent['7-12'];
    expect(parent712.length).toBeGreaterThan(0);
    
    const allText = parent712.join(' ');
    expect(allText).toMatch(/探索伙伴|平等|鼓励|庆祝|倾听/);
    expect(allText).toMatch(/探索伙伴/);
  });

  test('parent checklists for 13-18 should emphasize respect and dialogue', () => {
    const parent1318 = forbiddenCity.checklists.parent['13-18'];
    expect(parent1318.length).toBeGreaterThan(0);
    
    const allText = parent1318.join(' ');
    expect(allText).toMatch(/尊重|平等|倾听|独立|思想/);
    expect(allText).toMatch(/尊重独立/);
  });

  test('child checklists should focus on finding treasures with photos', () => {
    // All age groups should have similar treasure-finding tasks
    ['3-6', '7-12', '13-18'].forEach(age => {
      const childTasks = forbiddenCity.checklists.child[age];
      expect(childTasks).toHaveLength(5);
      
      // Should contain gate photo
      expect(childTasks[0]).toContain('门口打卡');
      expect(childTasks[0]).toContain('午门');
      
      // Should contain 3 treasure-finding tasks
      expect(childTasks[1]).toContain('清明上河图');
      expect(childTasks[2]).toContain('金瓯永固杯');
      expect(childTasks[3]).toContain('酗亚方尊');
      
      // Should contain victory photo
      expect(childTasks[4]).toContain('亲子合影');
      expect(childTasks[4]).toContain('比心/拥抱/击掌');
    });
  });

  test('should still have the other two original workflows', () => {
    const workflows = forbiddenCity.workflows;
    
    const easyTour = workflows.find(wf => wf.id === 'easy-family-tour');
    const deepTour = workflows.find(wf => wf.id === 'curation-deep');
    
    expect(easyTour).toBeDefined();
    expect(easyTour.name).toBe('亲子轻松游');
    
    expect(deepTour).toBeDefined();
    expect(deepTour.name).toBe('三大殿精华');
  });

  test('treasure images should match collections URLs', () => {
    const treasureWorkflow = forbiddenCity.workflows.find(wf => wf.id === 'treasure-discovery');
    const collections = forbiddenCity.collections;
    
    // Check that task image URLs match collection URLs
    expect(treasureWorkflow.tasks[1].imageUrl).toBe(collections[0].imageUrl);
    expect(treasureWorkflow.tasks[2].imageUrl).toBe(collections[1].imageUrl);
    expect(treasureWorkflow.tasks[3].imageUrl).toBe(collections[2].imageUrl);
  });
});
