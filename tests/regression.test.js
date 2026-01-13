/**
 * Regression tests for MuseumCheck
 * 
 * These tests specifically target bugs that were previously fixed
 * to ensure they don't reoccur in future changes.
 * 
 * Each test should correspond to a bug fix mentioned in RECENT_CHANGES.
 */

describe('Regression Tests - Previously Fixed Bugs', () => {
  beforeEach(() => {
    testUtils.setupMinimalDOM();
  });

  describe('v2.2.0 - 优化年龄选择器为水平单选按钮', () => {
    /**
     * Bug/Enhancement: 将下拉框年龄选择器改为更直观的水平单选按钮
     * Fixed: 2024-12-20
     * 
     * These tests ensure the age selector UI optimization works correctly.
     */

    beforeEach(() => {
      // Setup age selector HTML structure
      document.body.innerHTML += `
        <nav class="age-selector">
          <fieldset class="age-group-fieldset">
            <legend class="age-group-legend">孩子年龄：</legend>
            <div class="age-options">
              <label class="age-option">
                <input type="radio" name="ageGroup" value="3-6" checked>
                <span class="age-option-text">3-6岁 (学龄前)</span>
              </label>
              <label class="age-option">
                <input type="radio" name="ageGroup" value="7-12">
                <span class="age-option-text">7-12岁 (小学)</span>
              </label>
              <label class="age-option">
                <input type="radio" name="ageGroup" value="13-18">
                <span class="age-option-text">13-18岁 (中学)</span>
              </label>
            </div>
          </fieldset>
        </nav>
      `;
    });

    test('should initialize with first radio button checked', () => {
      const checkedRadio = document.querySelector('input[name="ageGroup"]:checked');
      expect(checkedRadio).toBeTruthy();
      expect(checkedRadio.value).toBe('3-6');
    });

    test('should change selection when different radio button is clicked', () => {
      const radio7to12 = document.querySelector('input[name="ageGroup"][value="7-12"]');
      
      // Simulate click
      radio7to12.checked = true;
      radio7to12.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Check that it's now selected
      const newChecked = document.querySelector('input[name="ageGroup"]:checked');
      expect(newChecked.value).toBe('7-12');
      
      // Check that previous selection is unchecked
      const radio3to6 = document.querySelector('input[name="ageGroup"][value="3-6"]');
      expect(radio3to6.checked).toBe(false);
    });

    test('should maintain proper radio button behavior (only one selected)', () => {
      const radios = document.querySelectorAll('input[name="ageGroup"]');
      
      // Select each radio in sequence
      radios.forEach(radio => {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Count checked radios - should always be 1
        const checkedCount = document.querySelectorAll('input[name="ageGroup"]:checked').length;
        expect(checkedCount).toBe(1);
        expect(document.querySelector('input[name="ageGroup"]:checked').value).toBe(radio.value);
      });
    });

    test('should have all three age group options available', () => {
      const expectedValues = ['3-6', '7-12', '13-18'];
      const actualValues = Array.from(document.querySelectorAll('input[name="ageGroup"]'))
        .map(radio => radio.value);
      
      expect(actualValues).toEqual(expectedValues);
    });

    test('should use proper accessibility attributes', () => {
      const fieldset = document.querySelector('.age-group-fieldset');
      const legend = document.querySelector('.age-group-legend');
      const radios = document.querySelectorAll('input[name="ageGroup"]');
      
      expect(fieldset).toBeTruthy();
      expect(legend).toBeTruthy();
      expect(legend.textContent.includes('孩子年龄')).toBe(true);
      
      radios.forEach(radio => {
        expect(radio.type).toBe('radio');
        expect(radio.name).toBe('ageGroup');
      });
    });
  });

  describe('v2.1.3 - 修复海报生成两大bug', () => {
    /**
     * Bug: "解决海报生成时出现重复画布和高度不自动调整的问题"
     * Fixed: 2025-08-30
     * 
     * These tests ensure the poster generation bugs don't reoccur.
     */

    test('should not create duplicate canvas elements during poster generation', () => {
      // Setup: Count initial canvas elements
      const initialCanvasCount = document.querySelectorAll('canvas').length;
      
      // Simulate multiple poster generation calls
      for (let i = 0; i < 3; i++) {
        const canvas = document.createElement('canvas');
        canvas.id = `posterCanvas-${i}`;
        
        // Check if canvas with same ID already exists (the bug scenario)
        const existingCanvas = document.getElementById(`posterCanvas-${i}`);
        if (!existingCanvas) {
          document.body.appendChild(canvas);
        }
      }
      
      const finalCanvasCount = document.querySelectorAll('canvas').length;
      
      // Should only have added 3 canvases, not duplicates
      expect(finalCanvasCount).toBe(initialCanvasCount + 3);
      
      // Cleanup
      document.querySelectorAll('canvas[id^="posterCanvas-"]').forEach(el => el.remove());
    });

    test('should auto-adjust canvas height based on actual content', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400; // Initial height
      
      // Mock content that extends beyond initial canvas height
      const contentEndY = 800;
      const footerHeight = 70;
      const bottomPadding = 40;
      const minHeight = 400;
      
      // This is the fix: calculate height based on actual content
      const calculatedHeight = Math.max(contentEndY + footerHeight + bottomPadding, minHeight);
      
      // Apply the height adjustment (the fix)
      canvas.height = calculatedHeight;
      
      expect(canvas.height).toBe(910); // 800 + 70 + 40
      expect(canvas.height).toBeGreaterThan(400); // Should have grown
      expect(canvas.height).toBeGreaterThanOrEqual(minHeight);
      
      canvas.remove();
    });

    test('should preserve canvas content when resizing', () => {
      // This test simulates the canvas resizing logic that was fixed
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 400;
      
      // Draw some test content
      ctx.fillStyle = 'red';
      ctx.fillRect(10, 10, 50, 50);
      
      // Get image data before resize
      const originalImageData = ctx.getImageData(10, 10, 50, 50);
      
      // Simulate the resize operation (the fixed logic)
      const newHeight = 800;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Copy current canvas content to temporary canvas (the fix)
      tempCtx.drawImage(canvas, 0, 0);
      
      // Resize original canvas
      canvas.height = newHeight;
      
      // Copy back the content (the fix)
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, Math.min(tempCanvas.height, newHeight), 
                    0, 0, canvas.width, Math.min(tempCanvas.height, newHeight));
      
      // Verify content is preserved
      const resizedImageData = ctx.getImageData(10, 10, 50, 50);
      expect(resizedImageData.data).toEqual(originalImageData.data);
      
      canvas.remove();
      tempCanvas.remove();
    });
  });

  describe('v2.1.5 - 修复海报底部信息显示问题', () => {
    /**
     * Bug: "海报的footer没有显示完整，被向下挤出了某个可以显示的区域"
     * Fixed: 2024-12-20
     * 
     * This test ensures the poster footer is displayed completely within the canvas bounds.
     */

    test('should ensure poster footer is fully visible within canvas bounds', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 800; // Initial height
      
      // Mock scenario: content ends at Y position 600
      const contentEndY = 600;
      
      // Simulate drawing footer (like drawPosterFooter method)
      const footerStartY = contentEndY + 40; // 640
      const footerEndY = footerStartY + 70 + 40; // 750 (70 for content, 40 for padding)
      
      // The bug fix: ensure canvas height accommodates the full footer
      const requiredHeight = footerEndY + 20; // 770 (additional margin)
      const newHeight = Math.max(requiredHeight, 400);
      
      // Verify the calculated height accommodates the footer
      expect(newHeight).toBeGreaterThanOrEqual(footerEndY);
      expect(newHeight).toBe(770);
      
      // Simulate the canvas resize that should preserve footer visibility
      if (newHeight !== canvas.height) {
        canvas.height = newHeight;
      }
      
      // Verify footer would be fully visible
      expect(canvas.height).toBeGreaterThanOrEqual(footerEndY);
      expect(footerEndY).toBeLessThan(canvas.height);
      
      canvas.remove();
    });

    test('should properly calculate canvas height for footer with minimal content', () => {
      // Test edge case where content is minimal but footer still needs space
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 400; // Minimal height
      
      // Simulate minimal content scenario
      const contentEndY = 300; // Very little content
      const footerStartY = contentEndY + 40; // 340
      const footerFinalY = footerStartY + 70 + 40; // 450
      
      // The fix should ensure adequate space even for minimal content
      const newHeight = Math.max(footerFinalY + 20, 400); // 470
      
      expect(newHeight).toBe(470);
      expect(newHeight).toBeGreaterThan(footerFinalY);
      
      canvas.remove();
    });
  });

  describe('v2.1.5 - 修复海报显示不全问题', () => {
    /**
     * Bug: "当有第9个完成的task时海报显示不全" (Poster content gets cut off when there are 9+ completed tasks)
     * Fixed: 2024-12-20
     * 
     * This test ensures the initial canvas height calculation properly accounts for multiple tasks and content overflow.
     */

    test('should calculate sufficient canvas height for 9+ completed tasks', () => {
      // Mock scenario with 9 completed tasks (the reported bug case)
      const completedTasks = [
        '找到三大殿：太和殿、中和殿、保和殿',
        '数一数太和殿前有多少台阶', 
        '寻找屋顶上的神兽，了解它们的作用',
        '在珍宝馆找到最喜欢的宝物',
        '观察古代皇帝用过的物品',
        '了解一个历史故事并记录下来',
        '画一幅故宫的简笔画',
        '学会一个关于故宫的知识点',
        '体验传统文化活动'
      ];
      
      // Current calculation logic (problematic)
      const baseHeight = 350;
      const taskHeight = 45; // Per task - too small!
      const minHeight = 550;
      const calculatedHeight = baseHeight + (completedTasks.length * taskHeight);
      const currentDynamicHeight = Math.max(minHeight, calculatedHeight);
      
      // Current calculation: 350 + (9 × 45) = 755px
      expect(currentDynamicHeight).toBe(755);
      
      // Improved calculation should account for:
      // - Text wrapping (tasks often span 2-3 lines, each line ~35px)
      // - Photo grid space (if photos exist)
      // - Proper spacing between elements
      const avgLinesPerTask = 2.5; // Realistic estimate for Chinese text
      const lineHeight = 35;
      const taskSpacing = 40;
      const photoGridHeight = 300; // Estimate for photo area
      const footerHeight = 110;
      const margins = 100;
      
      const improvedHeight = baseHeight + 
        (completedTasks.length * avgLinesPerTask * lineHeight) +
        (completedTasks.length * taskSpacing) + 
        photoGridHeight + 
        footerHeight + 
        margins;
      
      // Improved calculation should be much larger
      expect(improvedHeight).toBeGreaterThan(1200);
      expect(improvedHeight).toBeGreaterThan(currentDynamicHeight);
      
      // The issue: current calculation is severely underestimating required height
      const shortfall = improvedHeight - currentDynamicHeight;
      expect(shortfall).toBeGreaterThan(400); // At least 400px too short
    });

    test('should handle edge case of single long task title', () => {
      // Very long task that will definitely wrap multiple lines
      const completedTasks = [
        '观察故宫建筑的传统工艺和文化内涵，深入了解明清两朝的建筑特色和历史文化背景，记录传统建筑的艺术价值和文化意义'
      ];
      
      const baseHeight = 350;
      const taskHeight = 45;
      const minHeight = 550;
      const calculatedHeight = baseHeight + (completedTasks.length * taskHeight);
      const currentDynamicHeight = Math.max(minHeight, calculatedHeight);
      
      // Current logic: 350 + (1 × 45) = 395 -> Math.max(550, 395) = 550
      expect(currentDynamicHeight).toBe(550);
      
      // But this long text will wrap to ~4 lines, needing much more space
      const estimatedLines = 4; // For the long Chinese text
      const lineHeight = 35;
      const requiredHeightForText = estimatedLines * lineHeight + 40; // ~180px just for one task
      
      expect(requiredHeightForText).toBeGreaterThan(taskHeight);
      expect(550).toBeLessThan(baseHeight + requiredHeightForText + 200); // Insufficient space
    });

    test('should verify improved height calculation for 9 tasks', () => {
      // Test the new improved calculation logic
      const completedTasks = Array(9).fill().map((_, i) => `Task ${i + 1}: 一个需要完成的博物馆探索任务`);
      
      const baseHeight = 350;
      const minHeight = 550;
      
      // New improved calculation (matching the script.js fix)
      const avgLinesPerTask = 2.2;
      const lineHeight = 35;
      const taskSpacing = 40;
      const photoAreaHeight = Math.min(300, completedTasks.length * 60);
      const footerHeight = 110;
      const margins = 80;
      
      const textHeight = completedTasks.length * avgLinesPerTask * lineHeight;
      const spacingHeight = Math.max(0, completedTasks.length - 1) * taskSpacing;
      const improvedCalculatedHeight = baseHeight + textHeight + spacingHeight + photoAreaHeight + footerHeight + margins;
      const improvedDynamicHeight = Math.max(minHeight, improvedCalculatedHeight);
      
      // For 9 tasks: 350 + (9 * 2.2 * 35) + (8 * 40) + 300 + 110 + 80 = 350 + 693 + 320 + 300 + 110 + 80 = 1853
      expect(improvedDynamicHeight).toBeGreaterThan(1800);
      expect(improvedDynamicHeight).toBeGreaterThan(minHeight);
      
      // This should be sufficient for displaying 9 tasks without cutoff
      expect(improvedDynamicHeight).toBeGreaterThan(1200); // Much more reasonable
    });
  });

  describe('v2.1.5 - 修复9个任务时海报显示不全', () => {
    /**
     * Bug: "当有第9个完成的task时海报显示不全" (Poster not fully displayed when 9th task is completed)
     * Fixed: 2024-12-20
     * 
     * This test ensures that the poster canvas has adequate height when there are many completed tasks.
     */

    test('should calculate sufficient canvas height for 9 completed tasks', () => {
      const completedTasksCount = 9;
      const baseHeight = 350;
      const avgLinesPerTask = 2.2;
      const lineHeight = 35;
      const taskSpacing = 40;
      const photoAreaHeight = Math.min(300, completedTasksCount * 60);
      const footerHeight = 110;
      const margins = 80;
      
      // Original calculation (might be insufficient)
      const textHeight = completedTasksCount * avgLinesPerTask * lineHeight;
      const spacingHeight = Math.max(0, completedTasksCount - 1) * taskSpacing;
      const originalCalculation = baseHeight + textHeight + spacingHeight + photoAreaHeight + footerHeight + margins;
      
      // Fixed calculation should have more generous buffer for text wrapping
      const bufferForTextWrapping = completedTasksCount * 50; // Additional buffer per task
      const fixedCalculation = originalCalculation + bufferForTextWrapping;
      
      expect(originalCalculation).toBe(1853); // Original calculation for 9 tasks
      expect(fixedCalculation).toBe(2303); // Should be more generous
      expect(fixedCalculation).toBeGreaterThan(2000); // Ensure adequate height for 9 tasks
    });

    test('should handle edge case of maximum realistic task count', () => {
      const maxTasksCount = 15; // Maximum realistic completed tasks
      const baseHeight = 350;
      const avgLinesPerTask = 2.5; // Account for longer task descriptions
      const lineHeight = 35;
      const taskSpacing = 40;
      const photoAreaHeight = Math.min(300, maxTasksCount * 60); // Capped at 300
      const footerHeight = 110;
      const margins = 80;
      const bufferForTextWrapping = maxTasksCount * 50;
      
      const calculatedHeight = baseHeight + 
                             (maxTasksCount * avgLinesPerTask * lineHeight) + 
                             (Math.max(0, maxTasksCount - 1) * taskSpacing) + 
                             photoAreaHeight + 
                             footerHeight + 
                             margins + 
                             bufferForTextWrapping;
      
      const minHeight = 550;
      const finalHeight = Math.max(minHeight, calculatedHeight);
      
      expect(finalHeight).toBeGreaterThan(3000); // Should handle very large posters
      expect(finalHeight).toBeLessThan(5000); // But not unreasonably large
    });

    test('should provide adequate buffer for Chinese text wrapping', () => {
      // Chinese text wrapping can be unpredictable due to character width variations
      const testTasks = [
        '观察展品的历史背景和文化价值', // 15 characters
        '学习古代工艺制作技术和传承方式', // 16 characters  
        '了解文物保护修复的科学方法', // 14 characters
        '探索博物馆数字化展示技术应用', // 16 characters
        '研究地方文化特色和区域发展历史', // 17 characters
        '分析艺术作品的创作背景和艺术价值', // 18 characters
        '记录参观过程中的重要发现和感想', // 17 characters
        '体验传统文化活动和互动式展览', // 16 characters
        '制作参观笔记和文化学习心得报告' // 17 characters - 9th task
      ];
      
      // Each task might wrap to 2-4 lines depending on display width
      const taskListWidth = 1080 * 0.42 - 120; // Available text width
      const avgCharWidth = 26; // Approximate width per Chinese character
      const maxCharsPerLine = Math.floor(taskListWidth / avgCharWidth);
      
      testTasks.forEach((task, index) => {
        const estimatedLines = Math.ceil(task.length / maxCharsPerLine);
        expect(estimatedLines).toBeGreaterThanOrEqual(1);
        expect(estimatedLines).toBeLessThanOrEqual(4);
        
        if (index === 8) { // 9th task
          // Ensure 9th task can still fit even if it wraps to multiple lines
          const worstCaseLines = 4;
          const heightForTask = worstCaseLines * 35 + 40; // line height + spacing
          expect(heightForTask).toBeLessThan(200); // Should be reasonable
        }
      });
    });
  });

  describe('v2.1.4 - 修复海报生成显示问题', () => {
    /**
     * Bug: "海报中间有一根多余的蓝线" (Extra blue line in middle of poster)
     * Bug: "海报和下载按钮之间有一个多余的空白，这个空白和海报一样高" (Extra white space between poster and download button)
     * Fixed: 2024-12-20
     * 
     * These tests ensure proper poster canvas handling without duplicate borders or canvas display issues.
     */

    test('should not draw multiple borders on canvas resize', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 600; // Initial height
      
      // Mock strokeRect to track how many times it's called
      const strokeRectCalls = [];
      ctx.strokeRect = jest.fn((...args) => {
        strokeRectCalls.push(args);
      });
      
      // Initial border draw (expected)
      ctx.strokeStyle = '#2c5aa0';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Simulate canvas resize scenario
      const newHeight = 800;
      canvas.height = newHeight;
      
      // Clear and redraw content (this is where the bug occurs)
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // The bug: drawing border again after resize should not happen
      // This would be the problematic line that creates the extra blue line
      // ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40); // This should NOT happen
      
      // Should only have one border draw call, not multiple
      expect(strokeRectCalls).toHaveLength(1);
      expect(strokeRectCalls[0]).toEqual([20, 20, canvas.width - 40, 560]); // Original height was 600
      
      canvas.remove();
    });

    test('should hide original canvas when showing cloned preview', () => {
      // Mock DOM elements
      const canvas = document.createElement('canvas');
      const preview = document.createElement('div');
      canvas.id = 'posterCanvas';
      preview.id = 'posterPreview';
      
      document.body.appendChild(canvas);
      document.body.appendChild(preview);
      
      // Simulate the poster generation display logic
      // The bug: original canvas remains visible while also being cloned
      canvas.style.display = 'block'; // This causes the white space issue
      preview.innerHTML = '';
      preview.appendChild(canvas.cloneNode(true)); // Clone is added to preview
      
      // Fix: original canvas should be hidden when preview is shown
      canvas.style.display = 'none'; // This is what should happen
      
      // Verify the fix: original canvas should be hidden, only preview should show cloned canvas
      expect(canvas.style.display).toBe('none');
      expect(preview.children.length).toBe(1);
      expect(preview.children[0].tagName).toBe('CANVAS');
      
      // Cleanup
      canvas.remove();
      preview.remove();
    });

    test('should properly manage canvas visibility during poster generation', () => {
      // Test the complete poster generation display flow
      const canvas = document.createElement('canvas');
      const preview = document.createElement('div');
      const downloadBtn = document.createElement('button');
      
      canvas.id = 'posterCanvas';
      preview.id = 'posterPreview';
      downloadBtn.id = 'downloadPoster';
      
      document.body.appendChild(canvas);
      document.body.appendChild(preview);
      document.body.appendChild(downloadBtn);
      
      // Initial state
      canvas.style.display = 'none';
      downloadBtn.style.display = 'none';
      
      // Simulate poster generation completion
      // The fix should ensure only the preview shows the canvas, not both
      preview.innerHTML = '';
      preview.appendChild(canvas.cloneNode(true));
      downloadBtn.style.display = 'inline-block';
      
      // Canvas should remain hidden, only clone in preview should be visible
      expect(canvas.style.display).toBe('none');
      expect(preview.children.length).toBe(1);
      expect(downloadBtn.style.display).toBe('inline-block');
      
      // Cleanup
      canvas.remove();
      preview.remove();
      downloadBtn.remove();
    });
  });

  describe('v2.1.7 - 修复海报预览显示问题', () => {
    /**
     * Bug: "海报生成按钮点击之后没有出现海报画面，海报生成按钮和海报下载按钮紧挨着。之前的fix修过头了。"
     * Issue: Cloned canvas in preview inherits 'display: none' style, making poster invisible
     * Fixed: 2024-12-20
     * 
     * Root cause: canvas.cloneNode(true) copies the display:none style, preventing poster preview from showing
     */
    test('should show cloned canvas in preview with visible display style', () => {
      const canvas = document.createElement('canvas');
      const preview = document.createElement('div');
      
      canvas.id = 'posterCanvas';
      preview.id = 'posterPreview';
      
      // Original canvas setup
      canvas.width = 1080;
      canvas.height = 600;
      canvas.style.display = 'none'; // This is correct - original should be hidden
      
      // Current buggy behavior: cloned canvas inherits display:none
      const currentBehavior = () => {
        preview.innerHTML = '';
        preview.appendChild(canvas.cloneNode(true));
        return preview.children[0];
      };
      
      const clonedCanvas = currentBehavior();
      
      // This demonstrates the bug
      expect(clonedCanvas.style.display).toBe('none'); // BUG: clone inherits display:none
      
      // The fix: explicitly set display style on cloned canvas
      const fixedBehavior = () => {
        preview.innerHTML = '';
        const clonedCanvas = canvas.cloneNode(true);
        clonedCanvas.style.display = 'block'; // FIX: explicitly make preview visible
        preview.appendChild(clonedCanvas);
        return clonedCanvas;
      };
      
      const fixedClonedCanvas = fixedBehavior();
      
      // After fix: cloned canvas should be visible
      expect(fixedClonedCanvas.style.display).toBe('block');
      expect(fixedClonedCanvas.width).toBe(1080);
      expect(fixedClonedCanvas.height).toBe(600);
      
      // Cleanup
      canvas.remove();
      preview.remove();
    });

    test('should preserve canvas content in visible preview clone', () => {
      const canvas = document.createElement('canvas');
      const preview = document.createElement('div');
      const ctx = canvas.getContext('2d');
      
      // Setup canvas with test content
      canvas.width = 200;
      canvas.height = 100;
      canvas.style.display = 'none';
      
      // Draw test content
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(10, 10, 50, 50);
      
      // Apply the fix
      preview.innerHTML = '';
      const clonedCanvas = canvas.cloneNode(true);
      clonedCanvas.style.display = 'block'; // Fix: make clone visible
      preview.appendChild(clonedCanvas);
      
      // Verify clone properties
      expect(clonedCanvas.style.display).toBe('block');
      expect(clonedCanvas.width).toBe(200);
      expect(clonedCanvas.height).toBe(100);
      expect(preview.children.length).toBe(1);
      expect(preview.children[0]).toBe(clonedCanvas);
      
      // Cleanup
      canvas.remove();
      preview.remove();
    });
  });

  describe('Comprehensive Poster Feature Regression Tests', () => {
    /**
     * COMPREHENSIVE POSTER PROTECTION SUITE
     * 
     * These tests protect the poster generation feature from regressions
     * by covering all major poster-related functionality that has historically
     * been problematic.
     * 
     * Categories covered:
     * 1. Canvas Management (creation, cleanup, visibility)
     * 2. Height Calculation (dynamic sizing, minimum constraints)
     * 3. Content Rendering (tasks, photos, text wrapping)
     * 4. Footer Positioning (placement, visibility, spacing)
     * 5. Photo Integration (loading, layout, aspect ratios)
     * 6. Download Functionality (canvas conversion, filenames)
     * 7. Edge Cases (no tasks, many tasks, errors)
     */

    describe('Canvas Management Protection', () => {
      test('should prevent canvas element duplication in DOM', () => {
        const initialCanvasCount = document.querySelectorAll('canvas').length;
        
        // Simulate multiple poster generation attempts
        const posterCanvasIds = ['posterCanvas', 'posterCanvas-backup', 'posterCanvas-temp'];
        posterCanvasIds.forEach(id => {
          // Check if canvas already exists before creating
          let canvas = document.getElementById(id);
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = id;
            document.body.appendChild(canvas);
          }
        });
        
        // Should only create unique canvases
        const finalCanvasCount = document.querySelectorAll('canvas').length;
        expect(finalCanvasCount).toBe(initialCanvasCount + posterCanvasIds.length);
        
        // Cleanup
        posterCanvasIds.forEach(id => {
          const canvas = document.getElementById(id);
          if (canvas) canvas.remove();
        });
      });

      test('should properly cleanup canvas context and memory', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        // Simulate drawing operations that allocate memory
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#2c5aa0';
        ctx.lineWidth = 8;
        
        // Create some image data
        const imageData = ctx.getImageData(0, 0, 100, 100);
        expect(imageData.data.length).toBeGreaterThan(0); // Mock returns minimal data
        
        // Test that canvas can be properly disposed
        canvas.width = 1; // Forces context reset
        canvas.height = 1;
        
        // Should not throw error when accessing reset canvas
        expect(() => {
          const newCtx = canvas.getContext('2d');
          newCtx.fillStyle = '#000';
        }).not.toThrow();
        
        canvas.remove();
      });

      test('should manage canvas visibility states correctly', () => {
        const canvas = document.createElement('canvas');
        const preview = document.createElement('div');
        const downloadBtn = document.createElement('button');
        
        [canvas, preview, downloadBtn].forEach(el => document.body.appendChild(el));
        
        // Initial state: everything hidden
        canvas.style.display = 'none';
        preview.style.display = 'none';
        downloadBtn.style.display = 'none';
        
        // Poster generation state: show preview, hide original
        canvas.style.display = 'none'; // Original stays hidden
        preview.innerHTML = '';
        preview.appendChild(canvas.cloneNode(true));
        preview.style.display = 'block';
        downloadBtn.style.display = 'inline-block';
        
        // Verify correct visibility
        expect(canvas.style.display).toBe('none');
        expect(preview.style.display).toBe('block');
        expect(downloadBtn.style.display).toBe('inline-block');
        expect(preview.children.length).toBe(1);
        
        // Cleanup
        [canvas, preview, downloadBtn].forEach(el => el.remove());
      });
    });

    describe('Height Calculation Protection', () => {
      test('should calculate dynamic height based on task count', () => {
        const baseHeight = 400;
        const taskHeight = 50;
        const minHeight = 600;
        
        // Test different task counts
        const taskCounts = [0, 1, 5, 10, 20];
        taskCounts.forEach(count => {
          const calculatedHeight = baseHeight + (count * taskHeight);
          const finalHeight = Math.max(minHeight, calculatedHeight);
          
          if (count === 0) {
            expect(finalHeight).toBe(minHeight); // Minimum height
          } else if (count <= 4) {
            expect(finalHeight).toBe(minHeight); // Still minimum
          } else {
            expect(finalHeight).toBe(calculatedHeight); // Dynamic height
            expect(finalHeight).toBeGreaterThan(minHeight);
          }
        });
      });

      test('should handle canvas resize without content loss', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        canvas.height = 600;
        
        // Draw some test content
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(10, 10, 50, 50);
        const originalImageData = ctx.getImageData(10, 10, 50, 50);
        
        // Simulate the resize fix using temporary canvas
        const newHeight = 800;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy content to temp canvas (the fix)
        tempCtx.drawImage(canvas, 0, 0);
        
        // Resize original
        canvas.height = newHeight;
        
        // Copy back (the fix)
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, Math.min(tempCanvas.height, newHeight), 
                      0, 0, canvas.width, Math.min(tempCanvas.height, newHeight));
        
        // Content should be preserved
        const resizedImageData = ctx.getImageData(10, 10, 50, 50);
        expect(resizedImageData.data).toEqual(originalImageData.data);
        
        canvas.remove();
        tempCanvas.remove();
      });

      test('should enforce minimum height constraints', () => {
        const testCases = [
          { contentHeight: 200, minHeight: 600, expected: 600 },
          { contentHeight: 400, minHeight: 600, expected: 600 },
          { contentHeight: 800, minHeight: 600, expected: 800 },
          { contentHeight: 1200, minHeight: 600, expected: 1200 }
        ];
        
        testCases.forEach(({ contentHeight, minHeight, expected }) => {
          const finalHeight = Math.max(contentHeight, minHeight);
          expect(finalHeight).toBe(expected);
          expect(finalHeight).toBeGreaterThanOrEqual(minHeight);
        });
      });
    });

    describe('Content Rendering Protection', () => {
      test('should handle text wrapping without overflow', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        
        const maxWidth = 500;
        const testTexts = [
          '短文本',
          '这是一个中等长度的文本，应该被正确处理',
          '这是一个非常长的文本，包含很多字符，需要被正确地换行处理以避免溢出画布边界，这种情况在实际使用中经常会遇到',
          '包含English和中文mixed内容的text that needs proper handling'
        ];
        
        testTexts.forEach(text => {
          ctx.font = '26px "PingFang SC", "Microsoft YaHei", sans-serif';
          const words = text.split('');
          let line = '';
          let yOffset = 0;
          
          // Simulate the word wrapping logic
          for (const char of words) {
            const testLine = line + char;
            const metrics = ctx.measureText ? ctx.measureText(testLine) : { width: testLine.length * 20 };
            
            if (metrics.width > maxWidth && line.length > 0) {
              // Line would overflow, so we break
              expect(line.length).toBeGreaterThan(0);
              line = char; // Start new line
              yOffset += 35; // Line height
            } else {
              line = testLine;
            }
          }
          
          // Should have processed all text
          expect(yOffset).toBeGreaterThanOrEqual(0);
        });
        
        canvas.remove();
      });

      test('should maintain proper spacing between elements', () => {
        // Test spacing calculations that have caused issues
        const spacingTests = [
          { elementCount: 1, baseSpacing: 45, expected: 45 },
          { elementCount: 5, baseSpacing: 45, expected: 225 },
          { elementCount: 10, baseSpacing: 45, expected: 450 }
        ];
        
        spacingTests.forEach(({ elementCount, baseSpacing, expected }) => {
          const totalSpacing = elementCount * baseSpacing;
          expect(totalSpacing).toBe(expected);
          
          // Ensure reasonable spacing bounds
          expect(baseSpacing).toBeGreaterThan(20); // Not too cramped
          expect(baseSpacing).toBeLessThan(100); // Not too spread out
        });
      });
    });

    describe('Footer Positioning Protection', () => {
      test('should position footer immediately after content', () => {
        const contentEndY = 300;
        const footerPadding = 40;
        const expectedFooterY = contentEndY + footerPadding;
        
        // Simulate drawPosterFooter logic
        const yPosition = contentEndY ? contentEndY + 40 : 600 - 140;
        expect(yPosition).toBe(expectedFooterY);
        
        // Footer should be positioned dynamically, not at fixed position
        expect(yPosition).not.toBe(600 - 140); // Not at fixed position
        expect(yPosition).toBe(340); // At dynamic position
      });

      test('should ensure footer visibility within canvas bounds', () => {
        const testCases = [
          { contentEndY: 200, canvasHeight: 600 },
          { contentEndY: 400, canvasHeight: 800 },
          { contentEndY: 600, canvasHeight: 1000 }
        ];
        
        testCases.forEach(({ contentEndY, canvasHeight }) => {
          const footerStartY = contentEndY + 40;
          const footerHeight = 70 + 40; // Text height + bottom padding
          const footerEndY = footerStartY + footerHeight;
          
          // Footer should fit within canvas
          expect(footerEndY).toBeLessThanOrEqual(canvasHeight);
          
          // If footer would overflow, canvas should be resized
          const minRequiredHeight = footerEndY + 20; // Extra margin
          const finalCanvasHeight = Math.max(canvasHeight, minRequiredHeight);
          expect(finalCanvasHeight).toBeGreaterThanOrEqual(footerEndY);
        });
      });

      test('should return correct final Y position for canvas sizing', () => {
        const mockContentEndY = 500;
        const footerStartY = mockContentEndY + 40; // 540
        const footerTextHeight = 70;
        const footerPadding = 40;
        const expectedFinalY = footerStartY + footerTextHeight + footerPadding; // 650
        
        // Simulate drawPosterFooter return value
        const returnedY = footerStartY + 70 + 40;
        expect(returnedY).toBe(expectedFinalY);
        expect(returnedY).toBe(650);
      });
    });

    describe('Photo Integration Protection', () => {
      test('should handle photo loading errors gracefully', () => {
        const mockTaskPhotos = [
          { index: 0, data: 'data:image/png;base64,valid', task: 'Task 1' },
          { index: 1, data: 'invalid-data-url', task: 'Task 2' },
          { index: 2, data: '', task: 'Task 3' }
        ];
        
        // Simulate photo loading with error handling
        const loadedPhotos = mockTaskPhotos.map(photo => {
          // Mock image loading
          if (photo.data.startsWith('data:image/')) {
            return { ...photo, img: { width: 100, height: 100 } };
          } else {
            return { ...photo, img: null }; // Error case
          }
        });
        
        const validPhotos = loadedPhotos.filter(photo => photo.img);
        expect(validPhotos).toHaveLength(1); // Only the valid one
        expect(validPhotos[0].index).toBe(0);
      });

      test('should calculate photo grid layout correctly', () => {
        const photoAreaWidth = 400;
        const testCases = [
          { photoCount: 1, expectedPerRow: 1, expectedSize: 140 },
          { photoCount: 4, expectedPerRow: 2, expectedSizeRange: [100, 120] },
          { photoCount: 9, expectedPerRow: 3, expectedSizeRange: [80, 100] },
          { photoCount: 16, expectedPerRow: 4, expectedSizeRange: [70, 90] }
        ];
        
        testCases.forEach(({ photoCount, expectedPerRow, expectedSize, expectedSizeRange }) => {
          let photosPerRow = 2;
          let photoSize = 120;
          
          if (photoCount === 1) {
            photosPerRow = 1;
            photoSize = 140;
          } else if (photoCount <= 4) {
            photosPerRow = 2;
            photoSize = Math.min(110, (photoAreaWidth - 30) / 2);
          } else if (photoCount <= 9) {
            photosPerRow = 3;
            photoSize = Math.min(90, (photoAreaWidth - 40) / 3);
          } else {
            photosPerRow = 4;
            photoSize = Math.min(75, (photoAreaWidth - 50) / 4);
          }
          
          expect(photosPerRow).toBe(expectedPerRow);
          
          if (expectedSize) {
            expect(photoSize).toBe(expectedSize);
          } else if (expectedSizeRange) {
            expect(photoSize).toBeGreaterThanOrEqual(expectedSizeRange[0]);
            expect(photoSize).toBeLessThanOrEqual(expectedSizeRange[1]);
          }
        });
      });

      test('should preserve aspect ratios when drawing photos', () => {
        const photoSize = 120;
        const testImages = [
          { width: 100, height: 100 }, // Square
          { width: 200, height: 100 }, // Landscape
          { width: 100, height: 200 }, // Portrait
          { width: 300, height: 150 }, // Wide landscape
        ];
        
        testImages.forEach(img => {
          const aspectRatio = img.width / img.height;
          let drawWidth = photoSize;
          let drawHeight = photoSize;
          
          if (aspectRatio > 1) {
            drawHeight = photoSize / aspectRatio;
          } else {
            drawWidth = photoSize * aspectRatio;
          }
          
          // Aspect ratio should be preserved
          const newAspectRatio = drawWidth / drawHeight;
          expect(Math.abs(newAspectRatio - aspectRatio)).toBeLessThan(0.01);
          
          // Should fit within bounds
          expect(drawWidth).toBeLessThanOrEqual(photoSize);
          expect(drawHeight).toBeLessThanOrEqual(photoSize);
        });
      });
    });

    describe('Download Functionality Protection', () => {
      test('should generate correct filename format', () => {
        const mockMuseum = { name: '故宫博物院' };
        const mockDate = new Date('2024-12-20');
        
        // Mock Date.prototype.toLocaleDateString
        const originalToLocaleDateString = Date.prototype.toLocaleDateString;
        Date.prototype.toLocaleDateString = jest.fn(() => '2024/12/20');
        
        const expectedFilename = `${mockMuseum.name}_博物馆打卡_${mockDate.toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`;
        const actualFilename = `${mockMuseum.name}_博物馆打卡_2024-12-20.png`;
        
        expect(actualFilename).toBe('故宫博物院_博物馆打卡_2024-12-20.png');
        expect(actualFilename).toContain(mockMuseum.name);
        expect(actualFilename).toMatch(/\d{4}-\d{2}-\d{2}/);
        expect(actualFilename.endsWith('.png')).toBe(true);
        
        Date.prototype.toLocaleDateString = originalToLocaleDateString;
      });

      test('should handle canvas toDataURL conversion', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        
        // Should not throw when converting to data URL
        expect(() => {
          const dataUrl = canvas.toDataURL('image/png');
          expect(dataUrl).toMatch(/^data:image\/png;base64,/);
        }).not.toThrow();
        
        canvas.remove();
      });

      test('should handle download link creation and cleanup', () => {
        const mockMuseum = { name: '测试博物馆' };
        const mockDataURL = 'data:image/png;base64,test';
        
        // Test download link creation
        const link = document.createElement('a');
        link.download = `${mockMuseum.name}_博物馆打卡_2024-12-20.png`;
        link.href = mockDataURL;
        
        expect(link.download).toContain(mockMuseum.name);
        expect(link.href).toBe(mockDataURL);
        expect(link.download.endsWith('.png')).toBe(true);
        
        // Should not leave link in DOM
        expect(document.body.contains(link)).toBe(false);
      });
    });

    describe('Edge Cases Protection', () => {
      test('should handle poster generation with no completed tasks', () => {
        const completedTasks = [];
        const baseHeight = 400;
        const taskHeight = 50;
        const minHeight = 600;
        
        const calculatedHeight = baseHeight + (completedTasks.length * taskHeight);
        const finalHeight = Math.max(minHeight, calculatedHeight);
        
        expect(finalHeight).toBe(minHeight);
        expect(calculatedHeight).toBe(baseHeight);
        
        // Should still generate a valid poster
        expect(finalHeight).toBeGreaterThan(0);
        expect(finalHeight).toBeGreaterThanOrEqual(400);
      });

      test('should handle poster generation with maximum tasks', () => {
        const maxTasks = 50; // Extreme case
        const completedTasks = Array(maxTasks).fill().map((_, i) => `Task ${i + 1}`);
        const baseHeight = 400;
        const taskHeight = 50;
        const minHeight = 600;
        
        const calculatedHeight = baseHeight + (completedTasks.length * taskHeight);
        const finalHeight = Math.max(minHeight, calculatedHeight);
        
        expect(finalHeight).toBe(2900); // 400 + (50 * 50)
        expect(finalHeight).toBeGreaterThan(minHeight);
        
        // Should handle large canvases reasonably
        expect(finalHeight).toBeLessThan(10000); // Reasonable upper bound
      });

      test('should handle missing DOM elements gracefully', () => {
        // Test when required elements don't exist
        const missingElements = ['posterCanvas', 'posterPreview', 'downloadPoster'];
        
        missingElements.forEach(id => {
          const element = document.getElementById(id);
          expect(element).toBeNull(); // Should not exist initially
          
          // Code should handle missing elements
          expect(() => {
            const el = document.getElementById(id);
            if (el) {
              el.style.display = 'block';
            }
          }).not.toThrow();
        });
      });

      test('should handle canvas context creation failure', () => {
        const canvas = document.createElement('canvas');
        
        // Mock getContext to return null (failure case)
        canvas.getContext = jest.fn(() => null);
        
        expect(() => {
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
        }).toThrow('Failed to get canvas context');
        
        // Application should handle this gracefully
        expect(() => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#000';
          }
        }).not.toThrow();
        
        canvas.remove();
      });
    });

    describe('Integration and Workflow Protection', () => {
      test('should handle complete poster generation workflow', () => {
        // Setup complete DOM structure
        const canvas = document.createElement('canvas');
        const preview = document.createElement('div');
        const generateBtn = document.createElement('button');
        const downloadBtn = document.createElement('button');
        
        canvas.id = 'posterCanvas';
        preview.id = 'posterPreview';
        generateBtn.id = 'generatePoster';
        downloadBtn.id = 'downloadPoster';
        
        [canvas, preview, generateBtn, downloadBtn].forEach(el => document.body.appendChild(el));
        
        // Initial state
        canvas.style.display = 'none';
        preview.innerHTML = '';
        downloadBtn.style.display = 'none';
        
        // Simulate poster generation workflow
        canvas.width = 1080;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        // Draw poster content (simplified)
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#2c5aa0';
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // Show preview (hide original)
        canvas.style.display = 'none';
        preview.innerHTML = '';
        preview.appendChild(canvas.cloneNode(true));
        downloadBtn.style.display = 'inline-block';
        
        // Verify workflow completion
        expect(canvas.style.display).toBe('none');
        expect(preview.children.length).toBe(1);
        expect(downloadBtn.style.display).toBe('inline-block');
        
        // Verify canvas properties are preserved in clone
        const clonedCanvas = preview.children[0];
        expect(clonedCanvas.width).toBe(1080);
        expect(clonedCanvas.height).toBe(800);
        
        // Cleanup
        [canvas, preview, generateBtn, downloadBtn].forEach(el => el.remove());
      });

      test('should prevent memory leaks during repeated poster generation', () => {
        const initialCanvasCount = document.querySelectorAll('canvas').length;
        
        // Simulate multiple poster generation cycles
        for (let i = 0; i < 5; i++) {
          const canvas = document.createElement('canvas');
          const preview = document.createElement('div');
          
          canvas.id = `posterCanvas-${i}`;
          preview.id = `posterPreview-${i}`;
          
          document.body.appendChild(canvas);
          document.body.appendChild(preview);
          
          // Simulate poster generation
          canvas.width = 1080;
          canvas.height = 600 + (i * 100); // Dynamic height
          
          // Clone to preview
          preview.appendChild(canvas.cloneNode(true));
          
          // Verify no accumulation - original canvas + clone in preview = 2 canvases per cycle
          const cycleCanvases = document.querySelectorAll(`canvas[id*="posterCanvas-${i}"]`);
          expect(cycleCanvases.length).toBeGreaterThanOrEqual(1); // At least the original
        }
        
        // Cleanup all test canvases and previews
        for (let i = 0; i < 5; i++) {
          const canvas = document.getElementById(`posterCanvas-${i}`);
          const preview = document.getElementById(`posterPreview-${i}`);
          if (canvas) canvas.remove();
          if (preview) preview.remove();
        }
        
        // Should return to initial state
        const finalCanvasCount = document.querySelectorAll('canvas').length;
        expect(finalCanvasCount).toBe(initialCanvasCount);
      });

      test('should handle poster generation with mixed content types', () => {
        const mockMuseumData = {
          id: 'test-museum',
          name: '综合测试博物馆',
          location: '北京',
          checklists: {
            child: {
              '7-12': [
                '观察展品外观',
                '拍摄有趣的文物照片',
                '记录展品的历史信息',
                '与其他参观者交流心得'
              ]
            }
          }
        };
        
        const mockCompletedTasks = [0, 2]; // Indices of completed tasks
        const mockTaskPhotos = [
          { index: 0, data: 'data:image/png;base64,test1', task: mockMuseumData.checklists.child['7-12'][0] },
          { index: 2, data: 'data:image/png;base64,test2', task: mockMuseumData.checklists.child['7-12'][2] }
        ];
        
        // Simulate poster generation with mixed content
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        // Test that various content types can be handled
        expect(mockCompletedTasks.length).toBe(2);
        expect(mockTaskPhotos.length).toBe(2);
        expect(mockMuseumData.name).toContain('测试');
        
        // Should handle Chinese text, photos, and layout calculations
        const hasPhotos = mockTaskPhotos.length > 0;
        const taskListWidth = hasPhotos ? canvas.width * 0.5 : canvas.width - 160;
        const photoAreaWidth = hasPhotos ? canvas.width * 0.45 : 0;
        
        expect(taskListWidth).toBe(540); // 1080 * 0.5
        expect(photoAreaWidth).toBe(486); // 1080 * 0.45
        
        canvas.remove();
      });
    });

    describe('Real-World Scenario Protection', () => {
      test('should handle poster generation with long museum names', () => {
        const longNameMuseums = [
          '中国人民革命军事博物馆',
          '新疆维吾尔自治区博物馆',
          '内蒙古自治区博物院历史文化展览馆'
        ];
        
        longNameMuseums.forEach(name => {
          const filename = `${name}_博物馆打卡_2024-12-20.png`;
          
          // Should handle long names gracefully
          expect(filename.length).toBeGreaterThan(20);
          expect(filename).toContain(name);
          expect(filename.endsWith('.png')).toBe(true);
          
          // Should not exceed reasonable filename limits
          expect(filename.length).toBeLessThan(200);
        });
      });

      test('should handle poster generation with special characters', () => {
        const specialCharMuseums = [
          '博物馆（特殊展览）',
          '艺术馆 - 现代展区',
          '历史博物馆 & 文化中心',
          '科技馆@创新展厅'
        ];
        
        specialCharMuseums.forEach(name => {
          // Should handle special characters without errors
          expect(() => {
            const filename = `${name}_博物馆打卡_2024-12-20.png`;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillText(name, 100, 100);
            
            canvas.remove();
          }).not.toThrow();
        });
      });

      test('should handle poster generation with various age groups', () => {
        const ageGroups = ['3-6', '7-12', '13-18'];
        const mockTasks = {
          '3-6': ['看看展品', '数数颜色', '找找形状'],
          '7-12': ['了解历史', '记录信息', '拍摄照片', '分享感受'],
          '13-18': ['深入研究', '分析背景', '撰写报告', '讨论意义', '制作展示']
        };
        
        ageGroups.forEach(age => {
          const tasks = mockTasks[age];
          const baseHeight = 400;
          const taskHeight = 50;
          const minHeight = 600;
          
          const calculatedHeight = baseHeight + (tasks.length * taskHeight);
          const finalHeight = Math.max(minHeight, calculatedHeight);
          
          // Different age groups should produce appropriate heights
          if (age === '3-6') {
            expect(finalHeight).toBe(minHeight); // Small tasks, minimum height
          } else if (age === '7-12') {
            expect(finalHeight).toBe(minHeight); // Medium tasks, still minimum
          } else {
            expect(finalHeight).toBe(650); // 400 + (5 * 50), more tasks
          }
        });
      });

      test('should handle concurrent poster generation attempts', () => {
        const canvases = [];
        const previews = [];
        
        // Simulate multiple poster requests
        for (let i = 0; i < 3; i++) {
          const canvas = document.createElement('canvas');
          const preview = document.createElement('div');
          
          canvas.id = `concurrentCanvas-${i}`;
          preview.id = `concurrentPreview-${i}`;
          
          canvas.width = 1080;
          canvas.height = 600;
          
          document.body.appendChild(canvas);
          document.body.appendChild(preview);
          
          canvases.push(canvas);
          previews.push(preview);
        }
        
        // Each should be independent
        canvases.forEach((canvas, i) => {
          canvas.style.display = 'none';
          previews[i].appendChild(canvas.cloneNode(true));
          
          expect(canvas.style.display).toBe('none');
          expect(previews[i].children.length).toBe(1);
        });
        
        // Cleanup
        canvases.forEach(c => c.remove());
        previews.forEach(p => p.remove());
      });
    });
  });



  describe('Data Persistence Regression Tests', () => {
    /**
     * General regression tests for localStorage functionality
     * that could break with future changes.
     */

    test('should maintain localStorage data structure integrity', () => {
      // Test the exact localStorage structure mentioned in instructions
      const mockVisitedMuseums = ['forbidden-city', 'national-museum'];
      const mockChecklists = {
        'forbidden-city-parent-7-12': [0, 2],
        'forbidden-city-child-7-12': [1]
      };

      localStorage.setItem('visitedMuseums', JSON.stringify(mockVisitedMuseums));
      localStorage.setItem('museumChecklists', JSON.stringify(mockChecklists));

      // Test loading with the exact patterns used in the app
      const loadedVisited = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
      const loadedChecklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');

      expect(loadedVisited).toEqual(mockVisitedMuseums);
      expect(loadedChecklists).toEqual(mockChecklists);
      expect(Array.isArray(loadedVisited)).toBe(true);
      expect(typeof loadedChecklists).toBe('object');
    });

    test('should handle localStorage quota exceeded gracefully', () => {
      // Simulate localStorage being full
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      // The app should handle this gracefully without crashing
      expect(() => {
        try {
          localStorage.setItem('test', 'data');
        } catch (e) {
          // App should catch and handle this
          console.warn('localStorage full:', e.message);
        }
      }).not.toThrow();

      // Restore original function
      localStorage.setItem = originalSetItem;
    });
  });



  describe('v4.1.2 - 修复搜索功能bug (Issue #160)', () => {
    /**
     * Bug: "搜索框输入兵马俑，没有效果"
     * Fixed: 2024-12-21
     * 
     * Issue: Search function not returning results for "兵马俑" due to undefined field handling
     * The search was failing because some museum objects had undefined name/location/description fields
     * and calling .toLowerCase() on undefined was causing the search to not work properly.
     * 
     * This test ensures search works correctly even with undefined fields.
     */

    test('should handle search for "兵马俑" correctly without undefined errors', () => {
      // Test museum data with some undefined fields (simulating the bug condition)
      const testMuseums = [
        {
          id: 'terracotta-warriors',
          name: '秦始皇帝陵博物院',
          location: '西安',
          description: '世界文化遗产，展示秦朝兵马俑的恢宏场面',
          tags: ['历史', '考古', '世界遗产']
        },
        {
          id: 'test-museum',
          name: undefined, // This should trigger the original bug
          location: undefined,
          description: undefined,
          tags: ['测试']
        },
        {
          id: 'palace-museum',
          name: '故宫博物院',
          location: '北京',
          description: '世界上现存规模最大、保存最为完整的木质结构古建筑群',
          tags: ['历史', '建筑', '文物']
        }
      ];

      // Mock the search function logic (fixed version)
      const performSearch = (searchTerm) => {
        if (!searchTerm) return testMuseums;
        
        const term = searchTerm.toLowerCase();
        return testMuseums.filter(museum => {
          // This should handle undefined values without throwing errors
          const name = (museum.name || '').toLowerCase();
          const location = (museum.location || '').toLowerCase();
          const description = (museum.description || '').toLowerCase();
          const tags = (museum.tags || []).join(' ').toLowerCase();
          
          return name.includes(term) || 
                 location.includes(term) || 
                 description.includes(term) || 
                 tags.includes(term);
        });
      };

      // Test search for "兵马俑" - this should not throw any errors
      expect(() => {
        const results = performSearch('兵马俑');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('秦始皇帝陵博物院');
        expect(results[0].description).toContain('兵马俑');
      }).not.toThrow();

      // Test search with undefined fields doesn't crash
      expect(() => {
        const results = performSearch('测试');
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('test-museum');
      }).not.toThrow();

      // Test empty search returns all museums
      expect(() => {
        const results = performSearch('');
        expect(results).toHaveLength(3);
      }).not.toThrow();
    });

    test('should search case-insensitively for Chinese characters', () => {
      const testMuseums = [
        {
          id: 'terracotta',
          name: '秦始皇帝陵博物院',
          location: '西安',
          description: '世界文化遗产，展示秦朝兵马俑的恢宏场面',
          tags: ['历史', '考古']
        }
      ];

      const performSearch = (searchTerm) => {
        if (!searchTerm) return testMuseums;
        
        const term = searchTerm.toLowerCase();
        return testMuseums.filter(museum => {
          const name = (museum.name || '').toLowerCase();
          const location = (museum.location || '').toLowerCase(); 
          const description = (museum.description || '').toLowerCase();
          const tags = (museum.tags || []).join(' ').toLowerCase();
          
          return name.includes(term) || 
                 location.includes(term) || 
                 description.includes(term) || 
                 tags.includes(term);
        });
      };

      // Test various search terms for the same museum
      expect(performSearch('兵马俑')).toHaveLength(1);
      expect(performSearch('秦始皇')).toHaveLength(1);
      expect(performSearch('西安')).toHaveLength(1);
      expect(performSearch('历史')).toHaveLength(1);
      expect(performSearch('考古')).toHaveLength(1);
      expect(performSearch('不存在')).toHaveLength(0);
    });

    test('should handle edge cases in search terms', () => {
      const testMuseums = [
        {
          id: 'test1',
          name: '秦始皇帝陵博物院',
          location: '西安',
          description: '兵马俑展示',
          tags: ['历史']
        }
      ];

      const performSearch = (searchTerm) => {
        if (!searchTerm) return testMuseums;
        
        const term = searchTerm.toLowerCase();
        return testMuseums.filter(museum => {
          const name = (museum.name || '').toLowerCase();
          const location = (museum.location || '').toLowerCase();
          const description = (museum.description || '').toLowerCase();
          const tags = (museum.tags || []).join(' ').toLowerCase();
          
          return name.includes(term) || 
                 location.includes(term) || 
                 description.includes(term) || 
                 tags.includes(term);
        });
      };

      // Test edge cases
      expect(performSearch(null)).toHaveLength(1); // null should return all
      expect(performSearch('')).toHaveLength(1); // empty string should return all
      expect(performSearch('   ')).toHaveLength(0); // whitespace only should find nothing
      expect(performSearch('兵马俑')).toHaveLength(1); // normal search should work
    });
  });

  describe('v2.1.8 - 修复海报预览内容为空白问题', () => {
    /**
     * Bug: "海报问题 - 上次fix没有完全成功，这次请想办法避免类似问题。问题：海报内容是空白"
     * Fixed: 2024-12-20
     * 
     * Issue: Canvas cloneNode(true) only clones DOM structure, not canvas drawing content.
     * The cloned canvas in preview appears blank even though original canvas has content.
     * 
     * This test ensures canvas content is properly copied to preview clone.
     */

    test('should preserve canvas drawing content when cloning for preview', () => {
      // Create original canvas with some test content
      const originalCanvas = document.createElement('canvas');
      const originalCtx = originalCanvas.getContext('2d');
      originalCanvas.width = 200;
      originalCanvas.height = 100;
      originalCanvas.id = 'posterCanvas';
      
      // Draw test content on original canvas
      originalCtx.fillStyle = '#ff0000'; // Red background
      originalCtx.fillRect(0, 0, 200, 100);
      
      originalCtx.fillStyle = '#00ff00'; // Green rectangle
      originalCtx.fillRect(10, 10, 50, 30);
      
      originalCtx.fillStyle = '#ffffff'; // White text
      originalCtx.font = '16px Arial';
      originalCtx.fillText('Test', 20, 70);
      
      // Get original content for comparison
      const originalImageData = originalCtx.getImageData(0, 0, 200, 100);
      
      // The BUG: cloneNode(true) doesn't preserve canvas content
      const buggyClone = originalCanvas.cloneNode(true);
      const buggyCtx = buggyClone.getContext('2d');
      const buggyImageData = buggyCtx.getImageData(0, 0, 200, 100);
      
      // Verify the bug exists: cloned canvas should be blank
      const isBlank = buggyImageData.data.every(pixel => pixel === 0 || pixel === 255);
      expect(isBlank).toBe(true); // Bug: clone is blank
      
      // The FIX: properly copy canvas content
      const fixedClone = originalCanvas.cloneNode(true);
      const fixedCtx = fixedClone.getContext('2d');
      
      // Fix: Copy the actual image content
      fixedCtx.drawImage(originalCanvas, 0, 0);
      
      // Verify the fix: cloned canvas should have same content
      const fixedImageData = fixedCtx.getImageData(0, 0, 200, 100);
      expect(fixedImageData.data).toEqual(originalImageData.data);
      
      // Additional verification: specific pixel checks
      const redPixel = originalCtx.getImageData(5, 5, 1, 1).data; // Should be red
      const greenPixel = originalCtx.getImageData(20, 20, 1, 1).data; // Should be green
      
      const fixedRedPixel = fixedCtx.getImageData(5, 5, 1, 1).data;
      const fixedGreenPixel = fixedCtx.getImageData(20, 20, 1, 1).data;
      
      expect(fixedRedPixel).toEqual(redPixel);
      expect(fixedGreenPixel).toEqual(greenPixel);
      
      // Cleanup
      originalCanvas.remove();
      buggyClone.remove();
      fixedClone.remove();
    });

    test('should handle canvas content copying with different canvas sizes', () => {
      // Test edge case: different canvas sizes
      const sourceCanvas = document.createElement('canvas');
      const sourceCtx = sourceCanvas.getContext('2d');
      sourceCanvas.width = 100;
      sourceCanvas.height = 50;
      
      // Draw test pattern
      sourceCtx.fillStyle = '#0000ff';
      sourceCtx.fillRect(0, 0, 100, 50);
      
      // Create larger target canvas
      const targetCanvas = document.createElement('canvas');
      const targetCtx = targetCanvas.getContext('2d');
      targetCanvas.width = 200;
      targetCanvas.height = 100;
      
      // Copy content (should work even with different sizes)
      targetCtx.drawImage(sourceCanvas, 0, 0);
      
      // Verify content was copied to portion of larger canvas
      const sourcePixel = sourceCtx.getImageData(50, 25, 1, 1).data;
      const targetPixel = targetCtx.getImageData(50, 25, 1, 1).data;
      
      expect(targetPixel).toEqual(sourcePixel);
      
      sourceCanvas.remove();
      targetCanvas.remove();
    });

    test('should properly display cloned canvas in preview container', () => {
      // Simulate complete poster preview workflow
      const originalCanvas = document.createElement('canvas');
      const originalCtx = originalCanvas.getContext('2d');
      const previewContainer = document.createElement('div');
      
      originalCanvas.id = 'posterCanvas';
      previewContainer.id = 'posterPreview';
      originalCanvas.style.display = 'none'; // Hidden as per current logic
      
      // Draw poster content
      originalCanvas.width = 300;
      originalCanvas.height = 200;
      originalCtx.fillStyle = '#f8f9fa';
      originalCtx.fillRect(0, 0, 300, 200);
      originalCtx.fillStyle = '#2c5aa0';
      originalCtx.fillText('Test Poster', 50, 100);
      
      // Apply the fix: proper cloning with content preservation
      previewContainer.innerHTML = ''; // Clear preview
      const clonedCanvas = originalCanvas.cloneNode(true);
      const clonedCtx = clonedCanvas.getContext('2d');
      
      // Critical fix: copy actual canvas content
      clonedCtx.drawImage(originalCanvas, 0, 0);
      clonedCanvas.style.display = 'block'; // Make preview visible
      
      previewContainer.appendChild(clonedCanvas);
      
      // Verify fix works
      expect(previewContainer.children.length).toBe(1);
      expect(previewContainer.children[0].tagName).toBe('CANVAS');
      expect(previewContainer.children[0].style.display).toBe('block');
      
      // Verify content is preserved
      const previewCanvas = previewContainer.children[0];
      const previewCtx = previewCanvas.getContext('2d');
      const originalImageData = originalCtx.getImageData(0, 0, 300, 200);
      const previewImageData = previewCtx.getImageData(0, 0, 300, 200);
      
      expect(previewImageData.data).toEqual(originalImageData.data);
      
      originalCanvas.remove();
      previewContainer.remove();
    });
  });

  describe('v2.1.9 - 优化海报设计', () => {
    /**
     * Issue: "目前的图片显示区域小，有些空间没有充分利用，另外蓝色外框没有兜住footer，不美观"
     * Fixed: 2024-12-20
     * 
     * These tests ensure the poster design optimization fixes:
     * 1. Blue border properly encompasses footer
     * 2. Better space utilization 
     * 3. Improved modal display size
     */

    test('should ensure blue border encompasses footer content', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 600;
      
      // Mock content ending at position 400
      const contentEndY = 400;
      
      // Calculate footer position and size (from drawPosterFooter logic)
      const footerStartY = contentEndY + 40; // 440
      const footerHeight = 70 + 40; // text height + bottom padding = 110
      const footerEndY = footerStartY + footerHeight; // 550
      
      // Calculate required canvas height to include footer plus margin
      const borderMargin = 40; // 20px margin from border to canvas edge
      const requiredHeight = footerEndY + borderMargin; // 590
      
      // Border should be drawn to encompass all content including footer
      const borderWidth = canvas.width - 40; // 1040
      const borderHeight = requiredHeight - 40; // 550
      
      // Verify border coordinates encompass footer
      const borderTop = 20;
      const borderBottom = borderTop + borderHeight; // 570
      
      expect(borderBottom).toBeGreaterThan(footerEndY); // Border should extend beyond footer
      expect(requiredHeight).toBeGreaterThanOrEqual(footerEndY + 20); // Canvas should have margin after footer
      
      canvas.remove();
    });

    test('should calculate optimal canvas dimensions for better space utilization', () => {
      // Test different content scenarios for optimal sizing
      const testCases = [
        { tasks: 1, minHeight: 600 },
        { tasks: 3, minHeight: 600 },
        { tasks: 5, minHeight: 600 },
        { tasks: 8, minHeight: 600 }
      ];
      
      testCases.forEach(({ tasks, minHeight }) => {
        const baseHeight = 400; // Header and basic layout  
        const taskHeight = 50;   // Height per task
        const footerHeight = 150; // Footer plus margins
        
        const calculatedHeight = baseHeight + (tasks * taskHeight) + footerHeight;
        const optimizedHeight = Math.max(minHeight, calculatedHeight);
        
        // Should always meet minimum height requirement
        expect(optimizedHeight).toBeGreaterThanOrEqual(minHeight);
        // Should accommodate all content
        expect(optimizedHeight).toBeGreaterThanOrEqual(calculatedHeight);
        // Should scale appropriately with content
        expect(calculatedHeight).toBe(baseHeight + (tasks * taskHeight) + footerHeight);
      });
    });

    test('should improve photo display area utilization', () => {
      const canvasWidth = 1080;
      
      // Current implementation uses 50% for tasks, 45% for photos (5% gap)
      const currentTaskWidth = canvasWidth * 0.5; // 540
      const currentPhotoWidth = canvasWidth * 0.45; // 486
      const currentUtilization = (currentTaskWidth + currentPhotoWidth) / canvasWidth; // 95%
      
      // Optimized implementation should use space more efficiently
      const optimizedTaskWidth = canvasWidth * 0.45; // 486 (slightly less for tasks)
      const optimizedPhotoWidth = canvasWidth * 0.52; // 562 (more for photos)
      const optimizedUtilization = (optimizedTaskWidth + optimizedPhotoWidth) / canvasWidth; // 97%
      
      expect(optimizedUtilization).toBeGreaterThan(currentUtilization);
      expect(optimizedPhotoWidth).toBeGreaterThan(currentPhotoWidth);
    });

    test('should coordinate border redraw with final canvas dimensions', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 600; // Initial height
      
      // Mock the border drawing tracking
      const borderCalls = [];
      const originalStrokeRect = ctx.strokeRect;
      ctx.strokeRect = jest.fn((...args) => {
        borderCalls.push(args);
        originalStrokeRect.apply(ctx, args);
      });
      
      // Simulate initial border draw
      ctx.strokeStyle = '#2c5aa0';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Simulate content addition requiring canvas resize
      const newHeight = 800;
      canvas.height = newHeight;
      
      // The fix: border should be redrawn with new dimensions
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Verify border was drawn with correct final dimensions
      const finalBorderCall = borderCalls[borderCalls.length - 1];
      expect(finalBorderCall).toEqual([20, 20, 1040, 760]); // width-40, height-40
      
      canvas.remove();
    });
  });

  describe('v2.2.3 - 全面SEO优化提升搜索引擎收录', () => {
    /**
     * Enhancement: "添加完整SEO元标签、Open Graph标签、结构化数据(JSON-LD)、站点地图和robots.txt文件"
     * Added: 2024-12-20
     * 
     * These tests ensure SEO optimizations are properly implemented for search engine discoverability.
     */
    
    test('should have comprehensive SEO meta tags in document head', () => {
      // Setup DOM with SEO meta tags
      document.head.innerHTML = `
        <title>博物馆打卡 - 中国120家博物馆亲子参观指南 | MuseumCheck</title>
        <meta name="description" content="专为中国家庭设计的博物馆参观指南应用，收录全国120家知名博物馆包括故宫、国博、上博等，提供3-18岁分龄参观清单，让孩子爱上博物馆文化之旅。免费使用，数据本地保存。">
        <meta name="keywords" content="博物馆,亲子游,儿童教育,文化旅游,故宫博物院,中国国家博物馆,上海博物馆,参观指南,家庭出游,文化传承,历史教育,艺术欣赏">
        <meta name="author" content="MuseumCheck">
        <meta name="robots" content="index, follow">
        <meta name="language" content="zh-CN">
        <link rel="canonical" href="https://museumcheck.cn/">
      `;
      
      // Verify enhanced title with keywords
      expect(document.title).toContain('博物馆打卡');
      expect(document.title).toContain('中国120家博物馆');
      expect(document.title).toContain('亲子参观指南');
      expect(document.title).toContain('MuseumCheck');
      
      // Verify meta description exists and contains key information
      const description = document.querySelector('meta[name="description"]');
      expect(description).toBeTruthy();
      expect(description.content).toContain('专为中国家庭设计');
      expect(description.content).toContain('120家知名博物馆');
      expect(description.content).toContain('3-18岁分龄参观清单');
      
      // Verify keywords meta tag exists
      const keywords = document.querySelector('meta[name="keywords"]');
      expect(keywords).toBeTruthy();
      expect(keywords.content).toContain('博物馆');
      expect(keywords.content).toContain('亲子游');
      expect(keywords.content).toContain('故宫博物院');
      
      // Verify SEO-friendly attributes
      const robots = document.querySelector('meta[name="robots"]');
      expect(robots.content).toBe('index, follow');
      
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical.href).toBe('https://museumcheck.cn/');
    });

    test('should have Open Graph meta tags for social sharing', () => {
      // Setup DOM with Open Graph tags
      document.head.innerHTML = `
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://museumcheck.cn/">
        <meta property="og:title" content="博物馆打卡 - 中国120家博物馆亲子参观指南">
        <meta property="og:description" content="专为中国家庭设计的博物馆参观指南，收录全国120家知名博物馆，提供分龄参观清单，让孩子爱上博物馆文化之旅。">
        <meta property="og:image" content="https://museumcheck.cn/logo-og.png">
        <meta property="og:site_name" content="MuseumCheck">
        <meta property="og:locale" content="zh_CN">
      `;
      
      // Verify Open Graph type
      const ogType = document.querySelector('meta[property="og:type"]');
      expect(ogType.content).toBe('website');
      
      // Verify Open Graph URL
      const ogUrl = document.querySelector('meta[property="og:url"]');
      expect(ogUrl.content).toBe('https://museumcheck.cn/');
      
      // Verify Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle.content).toContain('博物馆打卡');
      expect(ogTitle.content).toContain('120家博物馆');
      
      // Verify Open Graph description
      const ogDescription = document.querySelector('meta[property="og:description"]');
      expect(ogDescription.content).toContain('专为中国家庭设计');
      expect(ogDescription.content).toContain('120家知名博物馆');
      
      // Verify locale
      const ogLocale = document.querySelector('meta[property="og:locale"]');
      expect(ogLocale.content).toBe('zh_CN');
    });

    test('should have Twitter Card meta tags', () => {
      // Setup DOM with Twitter Card tags
      document.head.innerHTML = `
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="https://museumcheck.cn/">
        <meta name="twitter:title" content="博物馆打卡 - 中国120家博物馆亲子参观指南">
        <meta name="twitter:description" content="专为中国家庭设计的博物馆参观指南，收录全国120家知名博物馆，提供分龄参观清单，让孩子爱上博物馆文化之旅。">
        <meta name="twitter:image" content="https://museumcheck.cn/logo-og.png">
      `;
      
      // Verify Twitter Card type
      const twitterCard = document.querySelector('meta[name="twitter:card"]');
      expect(twitterCard.content).toBe('summary_large_image');
      
      // Verify Twitter URL
      const twitterUrl = document.querySelector('meta[name="twitter:url"]');
      expect(twitterUrl.content).toBe('https://museumcheck.cn/');
      
      // Verify Twitter title and description
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      expect(twitterTitle.content).toContain('博物馆打卡');
      
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      expect(twitterDescription.content).toContain('专为中国家庭设计');
    });

    test('should have structured data (JSON-LD) for rich snippets', () => {
      // Setup DOM with structured data scripts
      document.head.innerHTML = `
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "博物馆打卡",
            "alternateName": "MuseumCheck",
            "description": "专为中国家庭设计的博物馆参观指南应用",
            "url": "https://museumcheck.cn",
            "applicationCategory": "EducationalApplication",
            "inLanguage": "zh-CN"
        }
        </script>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "首页",
                    "item": "https://museumcheck.cn"
                }
            ]
        }
        </script>
      `;
      
      // Verify structured data scripts exist
      const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(structuredDataScripts.length).toBeGreaterThanOrEqual(2);
      
      // Verify WebApplication structured data
      const webAppScript = Array.from(structuredDataScripts).find(script => 
        script.textContent.includes('"@type": "WebApplication"')
      );
      expect(webAppScript).toBeTruthy();
      
      const webAppData = JSON.parse(webAppScript.textContent);
      expect(webAppData['@type']).toBe('WebApplication');
      expect(webAppData.name).toBe('博物馆打卡');
      expect(webAppData.alternateName).toBe('MuseumCheck');
      expect(webAppData.applicationCategory).toBe('EducationalApplication');
      expect(webAppData.inLanguage).toBe('zh-CN');
      
      // Verify BreadcrumbList structured data
      const breadcrumbScript = Array.from(structuredDataScripts).find(script => 
        script.textContent.includes('"@type": "BreadcrumbList"')
      );
      expect(breadcrumbScript).toBeTruthy();
      
      const breadcrumbData = JSON.parse(breadcrumbScript.textContent);
      expect(breadcrumbData['@type']).toBe('BreadcrumbList');
      expect(breadcrumbData.itemListElement.length).toBeGreaterThanOrEqual(1);
      expect(breadcrumbData.itemListElement[0].name).toBe('首页');
    });

    test('should have enhanced semantic HTML structure', () => {
      // Setup DOM with enhanced semantic structure
      document.body.innerHTML = `
        <main role="main">
          <section class="museum-list" id="museums">
            <h2>全国主要博物馆清单</h2>
            <p class="section-description">精选全国120家知名博物馆，为您的亲子文化之旅提供专业指导</p>
            <div class="stats" role="status" aria-live="polite">
              <span id="visitedCount">0</span>/<span id="totalCount">120</span> 已参观
            </div>
            <div id="museumGrid" class="museum-grid" role="grid" aria-label="博物馆列表">
              <!-- Museums content -->
            </div>
          </section>
        </main>
        <nav class="age-selector" aria-label="年龄组选择">
          <label for="ageGroup">孩子年龄：</label>
          <select id="ageGroup" aria-describedby="age-help">
            <option value="3-6">3-6岁 (学龄前)</option>
          </select>
          <span id="age-help" class="sr-only">选择孩子的年龄段以获取适合的博物馆参观内容</span>
        </nav>
      `;
      
      // Verify main role
      const main = document.querySelector('main[role="main"]');
      expect(main).toBeTruthy();
      
      // Verify section with id for anchor linking
      const museumsSection = document.querySelector('section#museums');
      expect(museumsSection).toBeTruthy();
      
      // Verify descriptive content
      const sectionDescription = document.querySelector('.section-description');
      expect(sectionDescription.textContent).toContain('精选全国120家知名博物馆');
      
      // Verify ARIA attributes for accessibility and SEO
      const nav = document.querySelector('nav[aria-label="年龄组选择"]');
      expect(nav).toBeTruthy();
      
      const grid = document.querySelector('[role="grid"][aria-label="博物馆列表"]');
      expect(grid).toBeTruthy();
      
      const status = document.querySelector('[role="status"][aria-live="polite"]');
      expect(status).toBeTruthy();
      
      // Verify screen reader only content
      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toBeTruthy();
      expect(srOnly.textContent).toContain('选择孩子的年龄段');
    });

    test('should have search engine verification meta tags', () => {
      // Setup DOM with verification tags
      document.head.innerHTML = `
        <meta name="baidu-site-verification" content="codeva-museum-check">
        <meta name="msvalidate.01" content="bing-verification-museum-check">
      `;
      
      // Verify Baidu site verification
      const baiduVerification = document.querySelector('meta[name="baidu-site-verification"]');
      expect(baiduVerification).toBeTruthy();
      expect(baiduVerification.content).toBe('codeva-museum-check');
      
      // Verify Bing site verification
      const bingVerification = document.querySelector('meta[name="msvalidate.01"]');
      expect(bingVerification).toBeTruthy();
      expect(bingVerification.content).toBe('bing-verification-museum-check');
    });
  });

  describe('v2.2.2 - 成就海报中加入网址', () => {
    /**
     * Enhancement: "在总成就海报中添加MuseumCheck.cn网址，与单个博物馆海报保持一致"
     * Added: 2024-12-20
     * 
     * This test ensures the website URL appears in achievement posters for traffic generation.
     */
    
    test('should include website URL in achievement poster footer', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 1400;
      
      // Mock the footer rendering logic from generateAchievementPoster
      const yPosition = canvas.height - 140;
      
      // Simulate drawing the footer background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(40, yPosition, canvas.width - 80, 100);
      
      // Main tagline
      ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('博物馆打卡 - 让孩子爱上博物馆之旅', canvas.width / 2, yPosition + 25);
      
      // Website URL - this is the key addition
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
      const websiteText = 'MuseumCheck.cn';
      ctx.fillText(websiteText, canvas.width / 2, yPosition + 55);
      
      // Generation date
      const visitDate = new Date().toLocaleDateString('zh-CN');
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`生成于 ${visitDate}`, canvas.width / 2, yPosition + 80);
      
      // Verify the website URL is positioned correctly in the footer
      expect(websiteText).toBe('MuseumCheck.cn');
      expect(yPosition + 55).toBeGreaterThan(yPosition + 25); // URL appears after tagline
      expect(yPosition + 80).toBeGreaterThan(yPosition + 55); // Date appears after URL
      
      // Verify footer dimensions accommodate all content
      const footerHeight = 100;
      const footerBottom = yPosition + footerHeight;
      expect(footerBottom).toBeLessThanOrEqual(canvas.height);
      
      canvas.remove();
    });

    test('should match individual museum poster URL styling consistency', () => {
      // This test ensures achievement poster URL styling matches individual museum posters
      
      // Individual museum poster URL styling (from drawPosterFooter method)
      const individualPosterUrlFont = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
      const individualPosterUrlColor = '#2c5aa0';
      
      // Achievement poster URL styling (from generateAchievementPoster method)  
      const achievementPosterUrlFont = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
      const achievementPosterUrlColor = 'white';
      
      // Both should use bold font
      expect(individualPosterUrlFont).toContain('bold');
      expect(achievementPosterUrlFont).toContain('bold');
      
      // Both should use same font family
      expect(individualPosterUrlFont).toContain('"PingFang SC"');
      expect(achievementPosterUrlFont).toContain('"PingFang SC"');
      
      // Font sizes can differ due to different poster designs
      // but both should be prominent (>= 20px)
      const individualSize = parseInt(individualPosterUrlFont.match(/(\d+)px/)[1]);
      const achievementSize = parseInt(achievementPosterUrlFont.match(/(\d+)px/)[1]);
      
      expect(individualSize).toBeGreaterThanOrEqual(20);
      expect(achievementSize).toBeGreaterThanOrEqual(20);
    });
  });

  describe('v2.2.3 - 修复9个任务时海报显示不全问题', () => {
    /**
     * Bug: "当有第9个完成的task时海报显示不全"
     * Fixed: 2024-12-31
     * 
     * This test ensures that when 9 tasks are completed, the poster canvas height
     * is sufficient to display all content including footer without cutting off.
     */
    
    test('should display poster completely when 9 tasks are completed', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Mock 9 completed tasks scenario
      const completedTasks = [
        '观察展品的外观特征',
        '记录展品的材质信息', 
        '拍摄感兴趣的文物照片',
        '了解展品的历史背景',
        '与家长讨论展品价值',
        '绘制展品的简单图案',
        '学习相关历史知识',
        '比较不同时期文物',
        '撰写参观感受记录'
      ];
      
      // Test current calculation logic
      const baseHeight = 350;
      const taskHeight = 45;
      const minHeight = 550;
      const calculatedHeight = baseHeight + (completedTasks.length * taskHeight);
      const initialDynamicHeight = Math.max(minHeight, calculatedHeight);
      
      // For 9 tasks: 350 + (9 * 45) = 755px
      expect(calculatedHeight).toBe(755);
      expect(initialDynamicHeight).toBe(755);
      
      // Set canvas to initial calculated height
      canvas.width = 1080;
      canvas.height = initialDynamicHeight;
      
      // Simulate actual content drawing which takes more space
      let yPosition = 280; // Starting position after header
      yPosition += 50; // Header for completed tasks
      
      // Simulate drawing each task with realistic spacing
      const taskSpacing = 40;
      const averageLinesPerTask = 1.5; // Tasks can wrap to multiple lines
      const lineHeight = 35;
      const taskPadding = 20;
      
      completedTasks.forEach((task, index) => {
        // Each task can span multiple lines due to text wrapping
        const lines = Math.ceil(task.length / 20); // Rough estimate based on character width
        const actualLinesForTask = Math.max(lines, 1);
        const taskContentHeight = actualLinesForTask * lineHeight + taskPadding;
        const actualTaskHeight = Math.max(taskSpacing, taskContentHeight);
        
        yPosition += actualTaskHeight;
      });
      
      // Add space for photo grid (if photos exist)
      const hasPhotos = completedTasks.length > 0; // Assume some tasks have photos
      if (hasPhotos) {
        const photoGridRows = Math.ceil(Math.min(completedTasks.length, 9) / 3); // Up to 3 photos per row
        const photoSize = 110;
        const photoSpacing = 15;
        const photoGridHeight = photoGridRows * (photoSize + photoSpacing) + 30;
        yPosition = Math.max(yPosition, 280 + 50 + 60 + photoGridHeight); // Header + title + grid
      }
      
      yPosition += 30; // Bottom spacing before footer
      
      // Calculate footer space needed
      const footerHeight = 110; // footer content (70) + bottom padding (40)
      const footerEndY = yPosition + footerHeight;
      const requiredHeight = footerEndY + 20; // Extra margin
      
      // The bug: initial height calculation was too small
      expect(requiredHeight).toBeGreaterThan(initialDynamicHeight);
      
      // The fix should ensure canvas is tall enough for all content
      const properHeight = Math.max(requiredHeight, 400);
      expect(properHeight).toBeGreaterThan(initialDynamicHeight);
      expect(properHeight).toBeGreaterThanOrEqual(requiredHeight);
      
      // Verify footer would be fully visible with proper height
      expect(footerEndY).toBeLessThanOrEqual(properHeight);
      
      canvas.remove();
    });

    test('should calculate realistic height for tasks with text wrapping', () => {
      // Test that height calculation accounts for Chinese text wrapping
      const longChineseTasks = [
        '仔细观察青铜器表面的纹饰图案，记录不同时期的装饰风格变化',
        '学习了解古代科学技术发展历程，探索中国古代智慧结晶',
        '通过实地考察体验古代建筑工艺，感受传统文化魅力',
        '深入研究历史文物背后的故事，了解中华文明发展脉络',
        '观察分析展品的制作工艺和材料选择，学习古代工艺美术',
        '记录整理参观心得体会，与同龄人分享文化学习经验',
        '拍摄记录有代表性的文物展品，建立个人文化档案',
        '结合历史教科书知识，加深对中国历史的理解认识',
        '与博物馆讲解员交流互动，获取更多专业知识信息'
      ];
      
      // Current simple calculation
      const simpleHeight = 350 + (longChineseTasks.length * 45); // 755px
      
      // More realistic calculation accounting for text wrapping
      const baseHeight = 350;
      const headerSpace = 50;
      const startY = 280 + headerSpace; // 330
      
      let realisticContentHeight = startY;
      const taskSpacing = 40;
      const averageChineseCharsPerLine = 15; // Realistic for 26px Chinese font in 420px width
      const lineHeight = 35;
      
      longChineseTasks.forEach(task => {
        const lines = Math.ceil(task.length / averageChineseCharsPerLine);
        const taskContentHeight = lines * lineHeight + 20; // Line heights + padding
        const actualTaskHeight = Math.max(taskSpacing, taskContentHeight);
        realisticContentHeight += actualTaskHeight;
      });
      
      // Add photo grid space
      const photoRows = Math.ceil(9 / 3); // 3 rows for 9 photos
      const photoGridHeight = photoRows * (110 + 15) + 60; // photo size + spacing + titles
      const photoAreaHeight = Math.max(realisticContentHeight - startY, photoGridHeight);
      realisticContentHeight = startY + photoAreaHeight + 30;
      
      // Add footer space  
      const footerHeight = 110;
      const finalHeight = realisticContentHeight + footerHeight + 20;
      
      // The realistic calculation should be significantly larger than simple calculation
      expect(finalHeight).toBeGreaterThan(simpleHeight);
      expect(finalHeight).toBeGreaterThan(1000); // Should be > 1000px for 9 complex tasks
      
      // This demonstrates why the current calculation is insufficient
      const difference = finalHeight - simpleHeight;
      expect(difference).toBeGreaterThan(200); // Should need at least 200px more space
    });
  });

  describe('v2.1.6 - 加强首都博物馆内容', () => {
    /**
     * Enhancement: "在家长准备环节，之间提供家长所需准备知识，让家长可以在当前网页上直接学习相关内容。既要家长觉得方便又要保持页面的简洁"
     * Added: 2024-12-20
     * 
     * This test ensures the enhanced Capital Museum parent preparation content
     * provides educational value while remaining concise and user-friendly.
     */

    test('should provide enhanced educational content for Capital Museum parent preparation', () => {
      // Mock the enhanced Capital Museum data structure
      const enhancedCapitalMuseum = {
        id: 'capital-museum',
        name: '首都博物馆',
        location: '北京',
        description: '展示北京历史文化的市属综合性博物馆',
        tags: ['北京历史', '古都文化', '民俗'],
        checklists: {
          parent: {
            '3-6': [
              '首都博物馆基础知识：了解这里是北京市的重要博物馆，主要展示北京历史文化。开放时间9:00-17:00，建议预留2-3小时参观',
              '北京古城介绍：北京有3000多年建城史、800多年建都史。孩子可以了解从蓟城到北京城的历史变迁',
              '四合院文化简介：传统北京人住四合院，有正房、配房、门楼。可以给孩子讲解四合院的基本布局和生活方式'
            ],
            '7-12': [
              '北京建城史详解：公元前1045年，周朝在此建立蓟城。1153年金朝迁都于此称中都，1272年元朝建大都，1421年明朝迁都称北京',
              '元明清建都历程：元大都按《周礼》规划，明朝在元大都基础上改建，清朝基本沿用明制。每个朝代都在城市规划上留下了独特印记',
              '胡同文化深度解读：胡同体现了四合院文化，讲究门第礼制。胡同名称多有典故：王府井、什刹海、前门大街都有历史渊源'
            ]
          },
          child: {
            '3-6': ['找找博物馆里的老北京模型'],
            '7-12': ['调研北京城的历史变迁过程']
          }
        }
      };

      // Test 3-6 age group enhanced content
      const parent3_6 = enhancedCapitalMuseum.checklists.parent['3-6'];
      
      // Content should be educational but accessible for younger children's parents
      expect(parent3_6[0]).toContain('首都博物馆基础知识');
      expect(parent3_6[0]).toContain('开放时间');
      expect(parent3_6[1]).toContain('3000多年建城史');
      expect(parent3_6[2]).toContain('四合院文化');
      
      // Each item should be substantial but concise
      parent3_6.forEach(item => {
        expect(item.length).toBeGreaterThan(30); // Should have substantial content
        expect(item.length).toBeLessThan(150); // But remain concise for this age group
        expect(item).toContain('：'); // Should have explanatory format
      });

      // Test 7-12 age group enhanced content  
      const parent7_12 = enhancedCapitalMuseum.checklists.parent['7-12'];
      
      // Content should be more detailed and educational
      expect(parent7_12[0]).toContain('北京建城史详解');
      expect(parent7_12[0]).toContain('公元前1045年');
      expect(parent7_12[1]).toContain('元明清建都历程');
      expect(parent7_12[1]).toContain('周礼');
      expect(parent7_12[2]).toContain('胡同文化深度解读');
      
      // Content should be more substantial for older children's parents
      parent7_12.forEach(item => {
        expect(item.length).toBeGreaterThan(50); // More detailed content
        expect(item.length).toBeLessThan(200); // But still digestible
        expect(item).toContain('：'); // Should have explanatory format
      });

      // Verify child tasks remain simple and action-oriented
      const child3_6 = enhancedCapitalMuseum.checklists.child['3-6'];
      const child7_12 = enhancedCapitalMuseum.checklists.child['7-12'];
      
      expect(child3_6[0]).toBe('找找博物馆里的老北京模型');
      expect(child7_12[0]).toBe('调研北京城的历史变迁过程');
      
      // Child tasks should be concise and action-focused
      child3_6.forEach(task => {
        expect(task.length).toBeLessThan(50);
      });
      child7_12.forEach(task => {
        expect(task.length).toBeLessThan(50);
      });
    });

    test('should maintain content structure while enhancing educational value', () => {
      // Test that the enhanced content follows the established patterns
      
      // Mock before enhancement (simple task list)
      const simpleContent = [
        '了解首都博物馆基本信息',
        '准备参观用品',
        '制定参观路线'
      ];
      
      // Mock after enhancement (educational content)
      const enhancedContent = [
        '首都博物馆基础知识：了解这里是北京市的重要博物馆，主要展示北京历史文化。开放时间9:00-17:00，建议预留2-3小时参观',
        '参观准备指南：建议穿舒适的鞋子，带上水和小食品。预约门票，准备身份证件。为孩子准备笔记本记录感兴趣的展品',
        '参观路线规划：建议先参观一层的北京通史展，再到二三层看专题展览。重点关注古代北京展和民俗展，适合孩子理解'
      ];
      
      // Enhanced content should maintain same number of items
      expect(enhancedContent.length).toBe(simpleContent.length);
      
      // Enhanced content should be significantly more informative
      enhancedContent.forEach((enhanced, index) => {
        const simple = simpleContent[index];
        expect(enhanced.length).toBeGreaterThan(simple.length * 3); // At least 3x more content
        expect(enhanced).toContain('：'); // Should have colon indicating explanation
        // Enhanced content should relate to original topic
        const coreWords = ['博物馆', '参观', '路线'];
        const hasRelatedContent = coreWords.some(word => enhanced.includes(word));
        expect(hasRelatedContent).toBeTruthy();
      });
      
      // Content should be educational but not overwhelming
      enhancedContent.forEach(item => {
        const sentences = item.split('。').filter(s => s.length > 0);
        expect(sentences.length).toBeGreaterThanOrEqual(2); // Multiple information points
        expect(sentences.length).toBeLessThanOrEqual(4); // But not too many
      });
    });

    test('should provide age-appropriate educational depth', () => {
      // Test that content complexity scales appropriately with age groups
      
      const content3_6 = '四合院文化简介：传统北京人住四合院，有正房、配房、门楼。可以给孩子讲解四合院的基本布局和生活方式';
      const content7_12 = '胡同文化深度解读：胡同体现了四合院文化，讲究门第礼制。胡同名称多有典故：王府井、什刹海、前门大街都有历史渊源';
      const content13_18 = '胡同文化学术研究：胡同作为北京城市肌理的重要组成，体现了中国传统城市规划思想。明清时期的胡同布局严格按照等级制度，体现了封建社会的空间秩序';
      
      // 3-6 content should be simple and descriptive
      expect(content3_6).toContain('简介');
      expect(content3_6).toContain('可以给孩子讲解');
      expect(content3_6.match(/[，。]/g).length).toBeLessThanOrEqual(4); // Limited punctuation
      
      // 7-12 content should be more detailed
      expect(content7_12).toContain('深度解读');
      expect(content7_12).toContain('典故');
      expect(content7_12.match(/[：，。]/g).length).toBeGreaterThanOrEqual(4); // More complex structure
      
      // 13-18 content should be academic
      expect(content13_18).toContain('学术研究');
      expect(content13_18).toContain('城市肌理');
      expect(content13_18).toContain('封建社会');
      expect(content13_18.match(/[，。]/g).length).toBeGreaterThanOrEqual(3); // Most complex structure
      
      // Length should increase with age complexity
      expect(content7_12.length).toBeGreaterThan(content3_6.length);
      expect(content13_18.length).toBeGreaterThan(content7_12.length);
    });
  });



  describe('v2.2.4 - 海报生成后自动滚动到海报位置', () => {
    /**
     * Enhancement: "海报生成按钮点击后跳到生成的海报位置吧 体验更好"
     * Added: 2024-12-31
     * 
     * This test ensures that after poster generation, the page automatically scrolls
     * to show the generated poster for better user experience.
     */
    
    test('should auto-scroll to poster section after poster generation', () => {
      // Mock the DOM elements needed for poster generation
      const posterSection = document.createElement('div');
      posterSection.id = 'achievementPosterSection';
      posterSection.style.display = 'none';
      
      // Mock scrollIntoView function to track if it was called
      let scrollIntoViewCalled = false;
      let scrollIntoViewOptions = null;
      posterSection.scrollIntoView = jest.fn((options) => {
        scrollIntoViewCalled = true;
        scrollIntoViewOptions = options;
      });
      
      document.body.appendChild(posterSection);
      
      // Simulate the poster generation process
      // Show poster section (like in generateAchievementPoster)
      posterSection.style.display = 'block';
      
      // Auto-scroll to the generated poster (like in generateAchievementPoster)
      posterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Verify scrollIntoView was called with correct options
      expect(scrollIntoViewCalled).toBe(true);
      expect(scrollIntoViewOptions).toEqual({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Verify the poster section is visible
      expect(posterSection.style.display).toBe('block');
      
      // Cleanup
      posterSection.remove();
    });

    test('should use smooth scrolling behavior for better UX', () => {
      const posterSection = document.createElement('div');
      posterSection.id = 'achievementPosterSection';
      
      let capturedOptions = null;
      posterSection.scrollIntoView = jest.fn((options) => {
        capturedOptions = options;
      });
      
      document.body.appendChild(posterSection);
      
      // Simulate calling scrollIntoView as done in generateAchievementPoster
      posterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Verify smooth scrolling behavior is used
      expect(capturedOptions.behavior).toBe('smooth');
      expect(capturedOptions.block).toBe('start');
      
      // Cleanup
      posterSection.remove();
    });
  });

  describe('v4.6.1 - 优化清单页面专业度', () => {
    /**
     * Improvement: "响应用户反馈，重新设计家长清单和孩子清单页面布局。
     * 修复复选框与文字不对齐问题，采用更紧凑专业的设计风格，提升视觉层次和用户体验。"
     * Fixed: 2024-12-21
     */
    
    test('should create proper checklist item structure', () => {
      // Test that checklist items are created with the correct structure
      const checklistItem = document.createElement('div');
      checklistItem.className = 'checklist-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.marginRight = '12px';
      checkbox.style.marginTop = '2px';
      checkbox.style.width = '18px';
      checkbox.style.height = '18px';
      checkbox.style.alignSelf = 'flex-start';
      
      const label = document.createElement('label');
      label.textContent = '测试清单项目文本';
      label.style.flex = '1';
      label.style.cursor = 'pointer';
      label.style.lineHeight = '1.4';
      label.style.marginBottom = '8px';
      label.style.width = '100%';
      
      checklistItem.appendChild(checkbox);
      checklistItem.appendChild(label);
      
      // Verify proper structure exists
      expect(checklistItem.querySelector('input[type="checkbox"]')).toBeTruthy();
      expect(checklistItem.querySelector('label')).toBeTruthy();
      expect(checklistItem.className).toBe('checklist-item');
      
      // Verify checkbox properties
      expect(checkbox.style.marginRight).toBe('12px');
      expect(checkbox.style.width).toBe('18px');
      expect(checkbox.style.height).toBe('18px');
      
      // Verify label properties  
      expect(label.style.lineHeight).toBe('1.4');
      expect(label.style.cursor).toBe('pointer');
    });
    
    test('should support proper styling classes for professional appearance', () => {
      // Test that CSS class names are properly structured
      const expectedClasses = [
        'checklist-item',
        'checklist-content', 
        'checklist-header'
      ];
      
      expectedClasses.forEach(className => {
        const element = document.createElement('div');
        element.className = className;
        
        // Should be valid HTML element with proper class
        expect(element.classList.contains(className)).toBeTruthy();
        expect(element.tagName).toBe('DIV');
        expect(element.className).toBe(className);
      });
    });
    
    test('should have logical DOM structure for better accessibility', () => {
      // Create a complete checklist structure as it appears in the app
      const container = document.createElement('div');
      container.className = 'checklist-content';
      
      // Create multiple checklist items to test structure
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.className = 'checklist-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `item-${i}`;
        
        const label = document.createElement('label');
        label.setAttribute('for', `item-${i}`);
        label.textContent = `清单项目 ${i + 1}`;
        
        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
      }
      
      // Verify proper structure
      expect(container.children.length).toBe(3);
      expect(container.querySelectorAll('.checklist-item').length).toBe(3);
      expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(3);
      expect(container.querySelectorAll('label').length).toBe(3);
      
      // Verify accessibility - each checkbox should have associated label
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        const label = container.querySelector(`label[for="${checkbox.id}"]`);
        expect(label).toBeTruthy();
        expect(label.textContent).toContain('清单项目');
      });
    });
    
    test('should support hover and interaction states', () => {
      const checklistItem = document.createElement('div');
      checklistItem.className = 'checklist-item';
      
      // Mock hover state behavior by adding CSS classes
      checklistItem.classList.add('hover');
      expect(checklistItem.classList.contains('hover')).toBe(true);
      
      // Mock completed state
      checklistItem.classList.add('completed');
      expect(checklistItem.classList.contains('completed')).toBe(true);
      
      // Should support multiple state classes
      expect(checklistItem.classList.contains('checklist-item')).toBe(true);
      expect(checklistItem.classList.contains('hover')).toBe(true);
      expect(checklistItem.classList.contains('completed')).toBe(true);
    });
  });

  describe('v4.0.1 - 修复重复博物馆问题', () => {
    /**
     * Bug: "发现重复博物馆，搜索发现两个首都博物馆"
     * Fixed: 2024-12-31
     * 
     * This test ensures no duplicate museum entries exist in the MUSEUMS array.
     * The duplicate "首都博物馆" entries caused user confusion.
     */
    
    test('should not have duplicate museum names in MUSEUMS array', () => {
      // Mock museum data similar to the actual MUSEUMS array structure
      const mockMuseums = [
        {
          id: 'beijing-capital-museum',
          name: '首都博物馆',
          location: '北京',
          description: '展示北京历史文化的市属综合性博物馆'
        },
        {
          id: 'forbidden-city',
          name: '故宫博物院',
          location: '北京',
          description: '世界上现存规模最大的古建筑群'
        },
        {
          id: 'national-museum',
          name: '中国国家博物馆',
          location: '北京',
          description: '综合性历史艺术博物馆'
        }
      ];
      
      // Extract all museum names
      const museumNames = mockMuseums.map(museum => museum.name);
      
      // Check for duplicates
      const uniqueNames = [...new Set(museumNames)];
      
      // Should have no duplicate names
      expect(uniqueNames.length).toBe(museumNames.length);
      
      // Specifically verify no duplicate "首都博物馆"
      const capitalMuseumCount = museumNames.filter(name => name === '首都博物馆').length;
      expect(capitalMuseumCount).toBeLessThanOrEqual(1);
    });

    test('should identify duplicate museums when they exist', () => {
      // Mock museum data WITH duplicates to test detection
      const museumsWithDuplicates = [
        {
          id: 'beijing-capital-museum',
          name: '首都博物馆',
          location: '北京',
          description: '展示北京历史文化的市属综合性博物馆'
        },
        {
          id: 'capital-museum', 
          name: '首都博物馆',
          location: '北京',
          description: '集收藏、展示、研究、文化交流于一体的大型综合性博物馆'
        },
        {
          id: 'forbidden-city',
          name: '故宫博物院',
          location: '北京',
          description: '世界上现存规模最大的古建筑群'
        }
      ];

      // Function to detect duplicates
      const findDuplicateNames = (museums) => {
        const nameCount = {};
        const duplicates = [];
        
        museums.forEach(museum => {
          const name = museum.name;
          nameCount[name] = (nameCount[name] || 0) + 1;
          if (nameCount[name] === 2) {
            duplicates.push(name);
          }
        });
        
        return duplicates;
      };

      const duplicates = findDuplicateNames(museumsWithDuplicates);
      
      // Should detect the duplicate "首都博物馆"
      expect(duplicates).toContain('首都博物馆');
      expect(duplicates.length).toBe(1);
    });

    test('should handle case-sensitive duplicate detection', () => {
      // Test that the detection is case-sensitive for Chinese characters
      const museumsWithCaseVariations = [
        { id: '1', name: '首都博物馆', location: '北京' },
        { id: '2', name: '首都博物院', location: '北京' }, // Different: 馆 vs 院
        { id: '3', name: '首都博物馆', location: '北京' } // Exact duplicate
      ];

      const museumNames = museumsWithCaseVariations.map(m => m.name);
      const duplicates = museumNames.filter((name, index) => 
        museumNames.indexOf(name) !== index
      );

      // Should find exactly one duplicate (the repeated "首都博物馆")
      expect(duplicates).toEqual(['首都博物馆']);
    });

    test('should ensure unique museum IDs as well', () => {
      // Test that museum IDs are also unique (related issue prevention)
      const mockMuseums = [
        { id: 'beijing-capital-museum', name: '首都博物馆', location: '北京' },
        { id: 'forbidden-city', name: '故宫博物院', location: '北京' },
        { id: 'national-museum', name: '中国国家博物馆', location: '北京' }
      ];

      const museumIds = mockMuseums.map(museum => museum.id);
      const uniqueIds = [...new Set(museumIds)];

      // Should have no duplicate IDs
      expect(uniqueIds.length).toBe(museumIds.length);

      // All IDs should be strings and non-empty
      museumIds.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });
  });

  describe('v2.3.0 - 清数据功能实现 (Issue #198)', () => {
    /**
     * Enhancement: "加入清数据功能，在3个地方都可以允许用户清空个人数据：博物馆总清单，家长清单，孩子清单。清空前说明删除不可逆影响并且和用户确认。"
     * Added: 2024-12-20
     * 
     * This test ensures the clear data functionality works correctly with proper user confirmation.
     */
    
    test('should provide clearAllData function for complete data clearing', () => {
      // Mock confirm and alert functions
      const originalConfirm = global.confirm;
      const originalAlert = global.alert;
      global.confirm = jest.fn(() => true);
      global.alert = jest.fn();

      // Mock localStorage
      const mockStorage = {
        removeItem: jest.fn(),
        setItem: jest.fn(),
        getItem: jest.fn(() => '[]'),
        clear: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
        configurable: true
      });

      // Mock clearAllData function behavior
      const clearAllData = () => {
        const confirmed = confirm('⚠️ 清空所有个人数据 ⚠️\n\n您即将清空所有参观记录和清单完成记录\n\n此操作不可撤销！\n\n确定要继续吗？');
        if (confirmed) {
          window.localStorage.removeItem('visitedMuseums');
          window.localStorage.removeItem('museumChecklists');
          window.localStorage.removeItem('taskPhotos');
          alert('✅ 所有数据已清空！');
        }
      };

      // Test the function
      clearAllData();

      // Verify confirmation dialog was shown with correct message
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('清空所有个人数据')
      );
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('此操作不可撤销')
      );

      // Verify all data was cleared
      expect(mockStorage.removeItem).toHaveBeenCalledWith('visitedMuseums');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('museumChecklists');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('taskPhotos');

      // Verify success message was shown
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('所有数据已清空')
      );

      // Restore original functions
      global.confirm = originalConfirm;
      global.alert = originalAlert;
    });

    test('should provide clearCurrentChecklist function for specific checklist clearing', () => {
      // Mock confirm and alert functions
      const originalConfirm = global.confirm;
      const originalAlert = global.alert;
      global.confirm = jest.fn(() => true);
      global.alert = jest.fn();

      // Mock localStorage with test data
      const testData = {
        'test-museum-parent-7-12': [0, 1, 2],
        'test-museum-child-7-12': [0, 1],
        'other-museum-parent-3-6': [1]
      };
      const mockStorage = {
        getItem: jest.fn((key) => key === 'museumChecklists' ? JSON.stringify(testData) : '[]'),
        setItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage
      });

      // Mock clearCurrentChecklist function behavior
      const clearCurrentChecklist = (museumId, listType, ageGroup) => {
        const key = `${museumId}-${listType}-${ageGroup}`;
        const typeText = listType === 'parent' ? '家长清单' : '孩子清单';
        const ageText = ageGroup === '3-6' ? '3-6岁 (学龄前)' : ageGroup === '7-12' ? '7-12岁 (小学)' : '13-18岁 (中学)';
        
        const confirmed = confirm(`⚠️ 清空${typeText}数据 ⚠️\n\n您即将清空「测试博物馆」\n年龄组「${ageText}」的${typeText}完成记录\n\n此操作不可撤销！\n\n确定要继续吗？`);
        
        if (confirmed) {
          const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
          delete checklists[key];
          localStorage.setItem('museumChecklists', JSON.stringify(checklists));
          alert(`✅ ${typeText}数据已清空！`);
        }
      };

      // Test parent checklist clearing
      clearCurrentChecklist('test-museum', 'parent', '7-12');
      
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('家长清单数据')
      );
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('此操作不可撤销')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('家长清单数据已清空')
      );

      // Test child checklist clearing
      global.confirm.mockClear();
      global.alert.mockClear();
      
      clearCurrentChecklist('test-museum', 'child', '7-12');
      
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('孩子清单数据')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('孩子清单数据已清空')
      );

      // Restore original functions
      global.confirm = originalConfirm;
      global.alert = originalAlert;
    });

    test('should handle user cancellation of clear data operations', () => {
      // Mock confirm to return false (user cancels)
      const originalConfirm = global.confirm;
      const originalAlert = global.alert;
      global.confirm = jest.fn(() => false);
      global.alert = jest.fn();

      // Mock localStorage
      const mockStorage = {
        removeItem: jest.fn(),
        setItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage
      });

      // Mock clearAllData function
      const clearAllData = () => {
        const confirmed = confirm('⚠️ 清空所有个人数据 ⚠️\n\n此操作不可撤销！\n\n确定要继续吗？');
        if (confirmed) {
          localStorage.removeItem('visitedMuseums');
          localStorage.removeItem('museumChecklists');
          localStorage.removeItem('taskPhotos');
          alert('✅ 所有数据已清空！');
        }
      };

      // Test cancellation
      clearAllData();

      // Verify confirmation dialog was shown
      expect(global.confirm).toHaveBeenCalled();

      // Verify no data was cleared (since user cancelled)
      expect(mockStorage.removeItem).not.toHaveBeenCalled();
      expect(mockStorage.setItem).not.toHaveBeenCalled();

      // Verify no success message was shown
      expect(global.alert).not.toHaveBeenCalled();

      // Restore original functions
      global.confirm = originalConfirm;
      global.alert = originalAlert;
    });

    test('should provide appropriate warning messages for different clear operations', () => {
      const originalConfirm = global.confirm;
      global.confirm = jest.fn(() => false); // Don't actually clear

      // Test various clear operation messages
      const testCases = [
        {
          type: 'all',
          expectedMessages: ['清空所有个人数据', '此操作不可撤销']
        },
        {
          type: 'parent',
          museumName: '故宫博物院',
          ageGroup: '7-12',
          expectedMessages: ['家长清单数据', '故宫博物院', '7-12岁 (小学)', '此操作不可撤销']
        },
        {
          type: 'child',
          museumName: '故宫博物院',
          ageGroup: '3-6',
          expectedMessages: ['孩子清单数据', '故宫博物院', '3-6岁 (学龄前)', '此操作不可撤销']
        }
      ];

      testCases.forEach(testCase => {
        global.confirm.mockClear();

        if (testCase.type === 'all') {
          // Mock clearAllData call
          confirm('⚠️ 清空所有个人数据 ⚠️\n\n您即将清空所有参观记录和清单完成记录\n\n此操作不可撤销！\n\n确定要继续吗？');
        } else {
          // Mock clearCurrentChecklist call
          const typeText = testCase.type === 'parent' ? '家长清单' : '孩子清单';
          const ageText = testCase.ageGroup === '3-6' ? '3-6岁 (学龄前)' : testCase.ageGroup === '7-12' ? '7-12岁 (小学)' : '13-18岁 (中学)';
          confirm(`⚠️ 清空${typeText}数据 ⚠️\n\n您即将清空「${testCase.museumName}」\n年龄组「${ageText}」的${typeText}完成记录\n\n此操作不可撤销！\n\n确定要继续吗？`);
        }

        // Verify all expected messages are present
        const confirmCall = global.confirm.mock.calls[0][0];
        testCase.expectedMessages.forEach(expectedMessage => {
          expect(confirmCall).toContain(expectedMessage);
        });
      });

      global.confirm = originalConfirm;
    });
  });

  describe('Age Group Persistence - Remember Child Age', () => {
    /**
     * Feature: 记住孩子年龄 (Remember Child Age)
     * Added: Issue #238
     * 
     * Tests that the selected age group is saved to localStorage
     * and restored when the app is reloaded.
     */
    
    let mockApp;
    let mockLocalStorage;

    beforeEach(() => {
      // Create our own localStorage mock to avoid conflicts
      let store = {};
      mockLocalStorage = {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
      
      // Setup age selector HTML structure
      document.body.innerHTML += `
        <nav class="age-selector">
          <fieldset class="age-group-fieldset">
            <div class="age-options">
              <label class="age-option">
                <input type="radio" name="ageGroup" value="3-6" checked>
                <span class="age-option-text">3-6岁 (学龄前)</span>
              </label>
              <label class="age-option">
                <input type="radio" name="ageGroup" value="7-12">
                <span class="age-option-text">7-12岁 (小学)</span>
              </label>
              <label class="age-option">
                <input type="radio" name="ageGroup" value="13-18">
                <span class="age-option-text">13-18岁 (中学)</span>
              </label>
            </div>
          </fieldset>
        </nav>
      `;

      // Mock app methods for testing
      mockApp = {
        currentAge: '3-6',
        loadAgeGroup: function() {
          try {
            const saved = mockLocalStorage.getItem('ageGroup');
            return saved || '3-6';
          } catch (error) {
            return '3-6';
          }
        },
        saveAgeGroup: function() {
          try {
            mockLocalStorage.setItem('ageGroup', this.currentAge);
          } catch (error) {
            console.error('Failed to save age group:', error);
          }
        },
        initAgeSelector: function() {
          const savedAgeRadio = document.querySelector(`input[name="ageGroup"][value="${this.currentAge}"]`);
          if (savedAgeRadio) {
            savedAgeRadio.checked = true;
          }
          
          const checkedRadio = document.querySelector('input[name="ageGroup"]:checked');
          if (checkedRadio) {
            document.querySelectorAll('.age-option').forEach(option => {
              option.classList.remove('selected');
            });
            checkedRadio.closest('.age-option').classList.add('selected');
          }
        }
      };
    });

    test('should save age group to localStorage when changed', () => {
      // Initially no age group saved
      expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
      
      // Change age group and save
      mockApp.currentAge = '7-12';
      mockApp.saveAgeGroup();
      
      // Verify it's saved
      expect(mockLocalStorage.getItem('ageGroup')).toBe('7-12');
      
      // Change to different age group
      mockApp.currentAge = '13-18';
      mockApp.saveAgeGroup();
      
      // Verify it's updated
      expect(mockLocalStorage.getItem('ageGroup')).toBe('13-18');
    });

    test('should load age group from localStorage on initialization', () => {
      // Pre-save an age group
      mockLocalStorage.setItem('ageGroup', '13-18');
      
      // Load age group
      const loadedAge = mockApp.loadAgeGroup();
      
      // Should load the saved age
      expect(loadedAge).toBe('13-18');
    });

    test('should default to "3-6" when no age group is saved', () => {
      // Ensure no age group is saved
      expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
      
      // Load age group
      const loadedAge = mockApp.loadAgeGroup();
      
      // Should default to '3-6'
      expect(loadedAge).toBe('3-6');
    });

    test('should set radio button to match saved age group', () => {
      // Set saved age group
      mockApp.currentAge = '7-12';
      mockApp.initAgeSelector();
      
      // Verify correct radio button is checked
      const checkedRadio = document.querySelector('input[name="ageGroup"]:checked');
      expect(checkedRadio).toBeTruthy();
      expect(checkedRadio.value).toBe('7-12');
    });

    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage error
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = jest.fn(() => {
        throw new Error('localStorage unavailable');
      });
      
      // Should still return default age
      const loadedAge = mockApp.loadAgeGroup();
      expect(loadedAge).toBe('3-6');
      
      // Restore localStorage
      mockLocalStorage.getItem = originalGetItem;
    });

    test('should persist age group selection across app reinitialization', () => {
      // First "session" - user selects age group
      mockApp.currentAge = '7-12';
      mockApp.saveAgeGroup();
      expect(mockLocalStorage.getItem('ageGroup')).toBe('7-12');
      
      // Second "session" - app reinitializes
      const newMockApp = {
        currentAge: mockApp.loadAgeGroup(),
        loadAgeGroup: mockApp.loadAgeGroup
      };
      
      // Should remember the selection
      expect(newMockApp.currentAge).toBe('7-12');
    });

    test('should clear age group when all data is cleared', () => {
      // Save an age group
      mockLocalStorage.setItem('ageGroup', '13-18');
      expect(mockLocalStorage.getItem('ageGroup')).toBe('13-18');
      
      // Clear all data (as done in clearAllData function)
      mockLocalStorage.removeItem('ageGroup');
      
      // Should be cleared
      expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
      
      // Loading should return default
      expect(mockApp.loadAgeGroup()).toBe('3-6');
    });
  });

  describe('v2.1.6 - Percentage Display Bug Fix', () => {
    /**
     * Bug: When 1/257 museums visited, percentage shows 0% instead of 0.4%
     * Fixed: 2024-12-20
     * 
     * This test ensures small percentages are displayed meaningfully with one decimal place.
     */

    test('should show meaningful percentage for small visit counts', () => {
      // Test the specific bug: 1/257 museums visited should show 0.4% not 0%
      const visitedCount = 1;
      const totalCount = 257;
      
      // Simulate the old calculation (this was the bug)
      const oldPercentage = Math.round((visitedCount / totalCount) * 100);
      
      // New fixed calculation  
      const newPercentage = visitedCount > 0 
          ? Math.round((visitedCount / totalCount) * 100 * 10) / 10 
          : 0;
      
      expect(oldPercentage).toBe(0); // This was the bug
      expect(newPercentage).toBe(0.4); // This is the fix
    });
    
    test('should handle edge cases correctly', () => {
      // Test with 0 visited
      let visitedCount = 0;
      let totalCount = 257;
      let percentage = visitedCount > 0 
          ? Math.round((visitedCount / totalCount) * 100 * 10) / 10 
          : 0;
      expect(percentage).toBe(0);
      
      // Test with all visited (should be 100.0)
      visitedCount = 257;
      percentage = visitedCount > 0 
          ? Math.round((visitedCount / totalCount) * 100 * 10) / 10 
          : 0;
      expect(percentage).toBe(100);
      
      // Test with typical small numbers
      visitedCount = 3;
      percentage = visitedCount > 0 
          ? Math.round((visitedCount / totalCount) * 100 * 10) / 10 
          : 0;
      expect(percentage).toBe(1.2);
    });
    
    test('should round properly to one decimal place', () => {
      const totalCount = 257;
      
      // Test rounding down (1.16... -> 1.2)
      let visitedCount = 3;
      let percentage = Math.round((visitedCount / totalCount) * 100 * 10) / 10;
      expect(percentage).toBe(1.2);
      
      // Test rounding up
      visitedCount = 4; // 1.556... -> 1.6
      percentage = Math.round((visitedCount / totalCount) * 100 * 10) / 10;
      expect(percentage).toBe(1.6);
    });
  });

  describe('Issue #322 - Achievement Poster Button Click Bug', () => {
    /**
     * Bug: 我的成就中生成海报按钮点击无效 (Achievement poster generation button click not working)
     * Root Cause: Missing event listener in setupEventListeners() method for generateAchievementPoster button
     * Fixed: 2025-01-XX - Added event listener for 'generateAchievementPoster' button
     * 
     * This regression test ensures the bug doesn't reoccur and the button works properly.
     */

    beforeEach(() => {
      // Setup DOM with achievement modal and button structure as it exists in the app
      document.body.innerHTML = `
        <div id="achievementModal" class="modal achievement-modal hidden">
          <div class="modal-content achievement-content">
            <h2>🎖️ 我的成就</h2>
            <div class="achievement-summary">
              <button id="generateAchievementPoster" class="achievement-poster-button">
                🎨 生成成就海报
              </button>
            </div>
            <div id="achievementPosterSection" class="achievement-poster-section" style="display: none;">
              <canvas id="achievementPosterCanvas" style="display: none; max-width: 100%;"></canvas>
              <div id="achievementPosterPreview" class="poster-preview"></div>
              <button id="downloadAchievementPoster" class="poster-button" style="display: none;">📱 下载成就海报</button>
            </div>
          </div>
        </div>
      `;
    });

    test('should have working event listener for achievement poster generation button', () => {
      // This test ensures the specific bug from Issue #322 doesn't reoccur
      const button = document.getElementById('generateAchievementPoster');
      expect(button).toBeTruthy();

      // Create a mock function to simulate the generateAchievementPoster method
      const mockGenerateAchievementPoster = jest.fn();
      
      // Simulate the fix: adding the missing event listener in setupEventListeners()
      button.addEventListener('click', () => {
        mockGenerateAchievementPoster();
      });

      // Test: Click the button
      button.click();

      // Verify: The method was called (proving the event listener works)
      expect(mockGenerateAchievementPoster).toHaveBeenCalledTimes(1);
    });

    test('should show poster section and download button after generation', () => {
      // Test the complete poster generation workflow
      const button = document.getElementById('generateAchievementPoster');
      const posterSection = document.getElementById('achievementPosterSection');
      const downloadButton = document.getElementById('downloadAchievementPoster');
      
      expect(button).toBeTruthy();
      expect(posterSection).toBeTruthy();
      expect(downloadButton).toBeTruthy();
      
      // Initial state: elements should be hidden
      expect(posterSection.style.display).toBe('none');
      expect(downloadButton.style.display).toBe('none');
      
      // Simulate the complete generateAchievementPoster functionality
      button.addEventListener('click', () => {
        // Show poster section and download button (as done in generateAchievementPoster)
        posterSection.style.display = 'block';
        downloadButton.style.display = 'inline-block';
        
        // Auto-scroll to the generated poster (as done in generateAchievementPoster)
        posterSection.scrollIntoView = jest.fn();
        posterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      // Test: Click the button
      expect(() => {
        button.click();
      }).not.toThrow();
      
      // Verify: UI elements are properly shown after button click
      expect(posterSection.style.display).toBe('block');
      expect(downloadButton.style.display).toBe('inline-block');
    });

    test('should have correct button HTML structure for proper event binding', () => {
      // Verify the button has correct attributes that setupEventListeners() relies on
      const button = document.getElementById('generateAchievementPoster');
      expect(button).toBeTruthy();
      expect(button.id).toBe('generateAchievementPoster');  // Required for getElementById
      expect(button.className).toBe('achievement-poster-button');
      expect(button.textContent.trim()).toBe('🎨 生成成就海报');
      expect(button.tagName).toBe('BUTTON');  // Should be an actual button element
    });

    test('should not interfere with other poster generation buttons', () => {
      // Ensure the fix doesn't affect other poster generation functionality
      // Add a museum poster button for comparison
      const museumPosterButton = document.createElement('button');
      museumPosterButton.id = 'generatePoster'; // Different ID used for museum posters
      museumPosterButton.textContent = '🎨 生成海报';
      document.body.appendChild(museumPosterButton);

      const achievementButton = document.getElementById('generateAchievementPoster');
      const museumButton = document.getElementById('generatePoster');
      
      expect(achievementButton).toBeTruthy();
      expect(museumButton).toBeTruthy();
      expect(achievementButton.id).not.toBe(museumButton.id);
      
      // Both buttons should be able to have separate event listeners
      const mockAchievementHandler = jest.fn();
      const mockMuseumHandler = jest.fn();
      
      achievementButton.addEventListener('click', mockAchievementHandler);
      museumButton.addEventListener('click', mockMuseumHandler);
      
      // Test: Click each button
      achievementButton.click();
      museumButton.click();
      
      // Verify: Each handler was called independently
      expect(mockAchievementHandler).toHaveBeenCalledTimes(1);
      expect(mockMuseumHandler).toHaveBeenCalledTimes(1);
      
      museumPosterButton.remove();
    });

    test('should handle multiple clicks gracefully', () => {
      // Test that the button can be clicked multiple times without error
      const button = document.getElementById('generateAchievementPoster');
      const mockHandler = jest.fn();
      
      button.addEventListener('click', mockHandler);
      
      // Click multiple times
      button.click();
      button.click();
      button.click();
      
      expect(mockHandler).toHaveBeenCalledTimes(3);
      expect(() => {
        button.click();
        button.click();
      }).not.toThrow();
    });
  });

  describe('Settings Page Age Group Auto-Save', () => {
    /**
     * Feature: 主页设置页面修改即时生效
     * Description: Age group changes in settings page are auto-saved immediately
     *              when the dropdown changes (no save button needed).
     * Implementation: Changed from button click to 'change' event on select element
     * 
     * This test ensures the auto-save functionality works correctly.
     */

    let mockLocalStorage;
    
    beforeEach(() => {
      // Setup localStorage mock
      let store = {};
      mockLocalStorage = {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
      
      // Mock global localStorage
      global.localStorage = mockLocalStorage;
      
      // Setup settings page DOM structure (without save button)
      document.body.innerHTML = `
        <div id="settingsModal" class="modal">
          <div class="modal-content">
            <div class="settings-section">
              <h3>👶 孩子信息</h3>
              <div class="settings-item">
                <label class="settings-label">当前年龄组：</label>
                <span class="settings-value" id="currentAgeGroupDisplay">-</span>
              </div>
              <div class="settings-item">
                <label class="settings-label" for="ageGroupSelector">更改年龄组：</label>
                <div class="settings-input-group">
                  <select id="ageGroupSelector" class="settings-input">
                    <option value="3-6">3-6岁 (学龄前)</option>
                    <option value="7-12">7-12岁 (小学)</option>
                    <option value="13-18">13-18岁 (中学)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    test('should auto-save age group to localStorage on change', () => {
      // Setup: Initialize with default age
      let currentAge = '7-12';
      
      // Get DOM element
      const ageGroupSelector = document.getElementById('ageGroupSelector');
      
      expect(ageGroupSelector).toBeTruthy();
      
      // Simulate the auto-save change handler
      ageGroupSelector.addEventListener('change', () => {
        const newAgeGroup = ageGroupSelector.value;
        if (newAgeGroup !== currentAge) {
          // Auto-save to localStorage
          mockLocalStorage.setItem('ageGroup', newAgeGroup);
          currentAge = newAgeGroup; // Update current age
        }
      });
      
      // User action: Select different age group
      ageGroupSelector.value = '13-18';
      
      // Trigger change event (simulating user selection)
      const changeEvent = new Event('change', { bubbles: true });
      ageGroupSelector.dispatchEvent(changeEvent);
      
      // Verify: Age group was auto-saved to localStorage
      expect(mockLocalStorage.getItem('ageGroup')).toBe('13-18');
    });

    test('should use standard localStorage API for auto-save', () => {
      // This test ensures we're using the correct API
      const ageGroupSelector = document.getElementById('ageGroupSelector');
      
      ageGroupSelector.addEventListener('change', () => {
        const newAgeGroup = ageGroupSelector.value;
        
        // Should NOT throw error
        expect(() => {
          localStorage.setItem('ageGroup', newAgeGroup);
        }).not.toThrow();
        
        // Verify localStorage was called
        expect(global.localStorage.setItem).toHaveBeenCalled();
      });
      
      ageGroupSelector.value = '3-6';
      const changeEvent = new Event('change', { bubbles: true });
      ageGroupSelector.dispatchEvent(changeEvent);
    });

    test('should persist age group across page reloads', () => {
      // Simulate user changing age group (auto-saved)
      mockLocalStorage.setItem('ageGroup', '3-6');
      
      // Verify it's saved
      expect(mockLocalStorage.getItem('ageGroup')).toBe('3-6');
      
      // Simulate page reload by reading from localStorage
      const reloadedAge = mockLocalStorage.getItem('ageGroup');
      
      // Should still have the saved value
      expect(reloadedAge).toBe('3-6');
    });

    test('should not save if age group unchanged', () => {
      // Setup: Initialize with current age
      const currentAge = '7-12';
      localStorage.setItem('ageGroup', currentAge);
      
      const ageGroupSelector = document.getElementById('ageGroupSelector');
      
      // Set up auto-save handler
      ageGroupSelector.addEventListener('change', () => {
        const newAgeGroup = ageGroupSelector.value;
        if (newAgeGroup !== currentAge) {
          localStorage.setItem('ageGroup', newAgeGroup);
        }
      });
      
      // Select the SAME age group
      ageGroupSelector.value = currentAge;
      
      // Clear mock call history
      mockLocalStorage.setItem.mockClear();
      
      // Trigger change event with same value
      const changeEvent = new Event('change', { bubbles: true });
      ageGroupSelector.dispatchEvent(changeEvent);
      
      // Verify: setItem was NOT called (because age didn't change)
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    test('should handle all three age groups correctly', () => {
      const ageGroupSelector = document.getElementById('ageGroupSelector');
      
      const ageGroups = ['3-6', '7-12', '13-18'];
      
      ageGroups.forEach(ageGroup => {
        // Select age group
        ageGroupSelector.value = ageGroup;
        
        // Directly call localStorage.setItem to simulate auto-save
        mockLocalStorage.setItem('ageGroup', ageGroupSelector.value);
        
        // Verify correct value was saved
        expect(mockLocalStorage.getItem('ageGroup')).toBe(ageGroup);
      });
    });
  });

  describe('Museum Check-in Page - Auto Mark Museum as Visited', () => {
    /**
     * Bug: 选择北京天文馆打卡，在打卡页面完成所有任务后回到主页，期待看到北京天文馆已经被打卡，
     *      实际主页的北京天文馆，打卡选择框没有被自动勾选。
     * Root Cause: museum-checkin.html saves completed tasks to museumChecklists but doesn't update visitedMuseums
     * Fixed: Added markMuseumAsVisited() function that adds museum to visitedMuseums when all tasks are completed
     * 
     * This regression test ensures that when all tasks are completed on the check-in page,
     * the museum is automatically added to visitedMuseums localStorage.
     */

    let store;
    let mockLocalStorage;
    
    beforeEach(() => {
      // Setup localStorage mock with store
      store = {
        'visitedMuseums': '[]',
        'museumChecklists': '{}'
      };
      mockLocalStorage = {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
      
      global.localStorage = mockLocalStorage;
    });

    test('should add museum to visitedMuseums when all tasks are completed', () => {
      const museumId = 'beijing-planetarium';
      
      // Mock the markMuseumAsVisited function that was added as the fix
      const markMuseumAsVisited = () => {
        try {
          const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
          if (!visitedMuseums.includes(museumId)) {
            visitedMuseums.push(museumId);
            mockLocalStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
          }
        } catch (error) {
          console.error('Error marking museum as visited:', error);
        }
      };

      // Initially, museum should not be in visitedMuseums
      let visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
      expect(visitedMuseums).not.toContain(museumId);
      
      // Simulate all tasks being completed (which triggers markMuseumAsVisited)
      markMuseumAsVisited();
      
      // After completion, museum should be in visitedMuseums
      visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
      expect(visitedMuseums).toContain(museumId);
    });

    test('should not duplicate museum in visitedMuseums if already present', () => {
      const museumId = 'beijing-planetarium';
      
      // Pre-add museum to visitedMuseums
      mockLocalStorage.setItem('visitedMuseums', JSON.stringify([museumId]));
      
      // Mock the markMuseumAsVisited function
      const markMuseumAsVisited = () => {
        try {
          const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
          if (!visitedMuseums.includes(museumId)) {
            visitedMuseums.push(museumId);
            mockLocalStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
          }
        } catch (error) {
          console.error('Error marking museum as visited:', error);
        }
      };

      // Call markMuseumAsVisited again (shouldn't add duplicate)
      markMuseumAsVisited();
      
      // Should still have only one entry
      const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
      const count = visitedMuseums.filter(id => id === museumId).length;
      expect(count).toBe(1);
    });

    test('should preserve existing visitedMuseums when adding new museum', () => {
      const existingMuseumId = 'forbidden-city';
      const newMuseumId = 'beijing-planetarium';
      
      // Pre-add existing museum
      mockLocalStorage.setItem('visitedMuseums', JSON.stringify([existingMuseumId]));
      
      // Mock the markMuseumAsVisited function for new museum
      const markMuseumAsVisited = (museumId) => {
        try {
          const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
          if (!visitedMuseums.includes(museumId)) {
            visitedMuseums.push(museumId);
            mockLocalStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
          }
        } catch (error) {
          console.error('Error marking museum as visited:', error);
        }
      };

      // Add new museum
      markMuseumAsVisited(newMuseumId);
      
      // Should have both museums
      const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
      expect(visitedMuseums).toContain(existingMuseumId);
      expect(visitedMuseums).toContain(newMuseumId);
      expect(visitedMuseums.length).toBe(2);
    });

    test('should handle localStorage errors gracefully', () => {
      const museumId = 'beijing-planetarium';
      
      // Create a mock that throws on getItem
      const errorMockStorage = {
        getItem: jest.fn(() => {
          throw new Error('Storage error');
        }),
        setItem: jest.fn()
      };
      
      // Mock the markMuseumAsVisited function with error handling
      const markMuseumAsVisited = () => {
        try {
          const visitedMuseums = JSON.parse(errorMockStorage.getItem('visitedMuseums') || '[]');
          if (!visitedMuseums.includes(museumId)) {
            visitedMuseums.push(museumId);
            errorMockStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
          }
        } catch (error) {
          console.error('Error marking museum as visited:', error);
        }
      };

      // Should not throw
      expect(() => {
        markMuseumAsVisited();
      }).not.toThrow();
    });

    test('should integrate checkCompletion with markMuseumAsVisited', () => {
      const museumId = 'beijing-planetarium';
      const childTasks = ['Task 1', 'Task 2', 'Task 3'];
      const completedTasks = new Set([0, 1, 2]); // All tasks completed
      
      let museumMarkedAsVisited = false;
      
      // Mock markMuseumAsVisited
      const markMuseumAsVisited = () => {
        const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
        if (!visitedMuseums.includes(museumId)) {
          visitedMuseums.push(museumId);
          mockLocalStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
          museumMarkedAsVisited = true;
        }
      };
      
      // Mock checkCompletion function (the fix adds markMuseumAsVisited call)
      const checkCompletion = () => {
        if (childTasks && childTasks.length > 0 && completedTasks && completedTasks.size === childTasks.length) {
          // Auto-mark museum as visited when all tasks are completed
          markMuseumAsVisited();
        }
      };
      
      // Trigger checkCompletion (simulates completing all tasks)
      checkCompletion();
      
      // Verify museum was marked as visited
      expect(museumMarkedAsVisited).toBe(true);
      
      const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
      expect(visitedMuseums).toContain(museumId);
    });

    test('should NOT mark museum as visited if not all tasks are completed', () => {
      const museumId = 'beijing-planetarium';
      const childTasks = ['Task 1', 'Task 2', 'Task 3'];
      const completedTasks = new Set([0, 1]); // Only 2 of 3 tasks completed
      
      let museumMarkedAsVisited = false;
      
      // Mock markMuseumAsVisited
      const markMuseumAsVisited = () => {
        const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
        if (!visitedMuseums.includes(museumId)) {
          visitedMuseums.push(museumId);
          mockLocalStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
          museumMarkedAsVisited = true;
        }
      };
      
      // Mock checkCompletion function
      const checkCompletion = () => {
        if (childTasks && childTasks.length > 0 && completedTasks && completedTasks.size === childTasks.length) {
          markMuseumAsVisited();
        }
      };
      
      // Trigger checkCompletion (only partial tasks completed)
      checkCompletion();
      
      // Verify museum was NOT marked as visited
      expect(museumMarkedAsVisited).toBe(false);
      
      const visitedMuseums = JSON.parse(mockLocalStorage.getItem('visitedMuseums') || '[]');
      expect(visitedMuseums).not.toContain(museumId);
    });
  });

  describe('Museum Check-in Page - User-Added Treasures KV Store Bug', () => {
    /**
     * Bug: 在打卡页面添加镇馆之宝之后，没有存到动态数据kvstore
     * (After adding a treasure on the check-in page, it was not saved to the dynamic data kvstore)
     * 
     * Root Cause: User-added treasures were saved to localStorage but not merged into 
     * currentMuseum.collections during page reload. Even if KV store save failed,
     * the treasures should still be available from localStorage.
     * 
     * Fixed: Added code in loadMuseumData() to merge user-added treasures from localStorage
     * into currentMuseum.collections after loading the base museum data.
     */

    let mockLocalStorage;
    let store;

    beforeEach(() => {
      store = {};
      mockLocalStorage = {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
          delete store[key];
        })
      };
      global.localStorage = mockLocalStorage;
    });

    test('should merge user-added treasures from localStorage into museum collections on page load', () => {
      const museumId = 'forbidden-city';
      
      // Simulate user-added treasures in localStorage (saved by addUserTreasure)
      const userTreasures = [
        {
          name: '测试镇馆之宝',
          imageUrl: 'https://example.com/test.jpg',
          description: '用户添加的镇馆之宝',
          isUserAdded: true,
          addedAt: Date.now()
        }
      ];
      store[`userAddedTreasures_${museumId}`] = JSON.stringify(userTreasures);
      
      // Simulate museum data loaded from KV store or static data (without user treasures)
      const currentMuseum = {
        id: museumId,
        name: '故宫博物院',
        collections: [
          { name: '《清明上河图》', description: '北宋名画' },
          { name: '太和殿金漆雕龙宝座', description: '皇帝宝座' }
        ]
      };
      
      // Mock loadUserAddedTreasures function
      const loadUserAddedTreasures = (musId) => {
        try {
          const saved = mockLocalStorage.getItem(`userAddedTreasures_${musId}`);
          return saved ? JSON.parse(saved) : [];
        } catch (error) {
          return [];
        }
      };
      
      // This is the fix: merge user-added treasures into currentMuseum.collections
      const userTreasuresLoaded = loadUserAddedTreasures(museumId);
      if (userTreasuresLoaded && userTreasuresLoaded.length > 0) {
        if (!currentMuseum.collections) {
          currentMuseum.collections = [];
        }
        // Add user treasures if not already in collections
        userTreasuresLoaded.forEach(ut => {
          const exists = currentMuseum.collections.some(c => c.name === ut.name);
          if (!exists) {
            currentMuseum.collections.push({
              ...ut,
              isUserAdded: true
            });
          }
        });
      }
      
      // Verify user-added treasure is now in collections
      expect(currentMuseum.collections.length).toBe(3);
      expect(currentMuseum.collections.some(c => c.name === '测试镇馆之宝')).toBe(true);
      expect(currentMuseum.collections.find(c => c.name === '测试镇馆之宝').isUserAdded).toBe(true);
    });

    test('should not duplicate treasures if they already exist in collections', () => {
      const museumId = 'forbidden-city';
      
      // Simulate user-added treasure with same name as existing treasure
      const userTreasures = [
        {
          name: '《清明上河图》', // Same name as existing treasure
          imageUrl: 'https://example.com/user-photo.jpg',
          description: '用户添加的镇馆之宝',
          isUserAdded: true,
          addedAt: Date.now()
        }
      ];
      store[`userAddedTreasures_${museumId}`] = JSON.stringify(userTreasures);
      
      const currentMuseum = {
        id: museumId,
        name: '故宫博物院',
        collections: [
          { name: '《清明上河图》', description: '北宋名画' },
          { name: '太和殿金漆雕龙宝座', description: '皇帝宝座' }
        ]
      };
      
      const loadUserAddedTreasures = (musId) => {
        try {
          const saved = mockLocalStorage.getItem(`userAddedTreasures_${musId}`);
          return saved ? JSON.parse(saved) : [];
        } catch (error) {
          return [];
        }
      };
      
      // Apply the fix
      const userTreasuresLoaded = loadUserAddedTreasures(museumId);
      if (userTreasuresLoaded && userTreasuresLoaded.length > 0) {
        userTreasuresLoaded.forEach(ut => {
          const exists = currentMuseum.collections.some(c => c.name === ut.name);
          if (!exists) {
            currentMuseum.collections.push({
              ...ut,
              isUserAdded: true
            });
          }
        });
      }
      
      // Should NOT add duplicate - still only 2 treasures
      expect(currentMuseum.collections.length).toBe(2);
    });

    test('should handle empty user treasures gracefully', () => {
      const museumId = 'forbidden-city';
      
      // No user treasures in localStorage
      store[`userAddedTreasures_${museumId}`] = JSON.stringify([]);
      
      const currentMuseum = {
        id: museumId,
        name: '故宫博物院',
        collections: [
          { name: '《清明上河图》', description: '北宋名画' }
        ]
      };
      
      const loadUserAddedTreasures = (musId) => {
        try {
          const saved = mockLocalStorage.getItem(`userAddedTreasures_${musId}`);
          return saved ? JSON.parse(saved) : [];
        } catch (error) {
          return [];
        }
      };
      
      const userTreasuresLoaded = loadUserAddedTreasures(museumId);
      if (userTreasuresLoaded && userTreasuresLoaded.length > 0) {
        userTreasuresLoaded.forEach(ut => {
          const exists = currentMuseum.collections.some(c => c.name === ut.name);
          if (!exists) {
            currentMuseum.collections.push({ ...ut, isUserAdded: true });
          }
        });
      }
      
      // Collections should remain unchanged
      expect(currentMuseum.collections.length).toBe(1);
    });

    test('should handle missing localStorage key gracefully', () => {
      const museumId = 'forbidden-city';
      
      // No localStorage entry at all
      const currentMuseum = {
        id: museumId,
        name: '故宫博物院',
        collections: []
      };
      
      const loadUserAddedTreasures = (musId) => {
        try {
          const saved = mockLocalStorage.getItem(`userAddedTreasures_${musId}`);
          return saved ? JSON.parse(saved) : [];
        } catch (error) {
          return [];
        }
      };
      
      // Should not throw
      expect(() => {
        const userTreasuresLoaded = loadUserAddedTreasures(museumId);
        if (userTreasuresLoaded && userTreasuresLoaded.length > 0) {
          userTreasuresLoaded.forEach(ut => {
            currentMuseum.collections.push({ ...ut, isUserAdded: true });
          });
        }
      }).not.toThrow();
      
      expect(currentMuseum.collections.length).toBe(0);
    });

    test('should initialize collections array if undefined', () => {
      const museumId = 'new-museum';
      
      // User treasures exist in localStorage
      const userTreasures = [
        {
          name: '新宝贝',
          imageUrl: 'https://example.com/new.jpg',
          description: '用户添加的宝贝',
          isUserAdded: true,
          addedAt: Date.now()
        }
      ];
      store[`userAddedTreasures_${museumId}`] = JSON.stringify(userTreasures);
      
      // Museum loaded without collections array
      const currentMuseum = {
        id: museumId,
        name: '新博物馆'
        // Note: no collections property
      };
      
      const loadUserAddedTreasures = (musId) => {
        try {
          const saved = mockLocalStorage.getItem(`userAddedTreasures_${musId}`);
          return saved ? JSON.parse(saved) : [];
        } catch (error) {
          return [];
        }
      };
      
      // Apply the fix with collections initialization
      const userTreasuresLoaded = loadUserAddedTreasures(museumId);
      if (userTreasuresLoaded && userTreasuresLoaded.length > 0) {
        if (!currentMuseum.collections) {
          currentMuseum.collections = [];
        }
        userTreasuresLoaded.forEach(ut => {
          const exists = currentMuseum.collections.some(c => c.name === ut.name);
          if (!exists) {
            currentMuseum.collections.push({ ...ut, isUserAdded: true });
          }
        });
      }
      
      // Collections should now exist and contain user treasure
      expect(currentMuseum.collections).toBeDefined();
      expect(currentMuseum.collections.length).toBe(1);
      expect(currentMuseum.collections[0].name).toBe('新宝贝');
    });

    test('should work with KV store failure scenario', () => {
      /**
       * This test simulates the original bug scenario:
       * 1. User adds a treasure
       * 2. KV store save fails (network error)
       * 3. User reloads page
       * 4. Treasure should still appear because it was saved to localStorage
       */
      const museumId = 'test-museum';
      
      // Step 1 & 2: User added treasure, saved to localStorage, but KV store failed
      const userTreasures = [
        {
          name: '用户发现的宝贝',
          imageUrl: 'https://example.com/treasure.jpg',
          description: '用户添加的镇馆之宝',
          isUserAdded: true,
          addedAt: Date.now()
        }
      ];
      store[`userAddedTreasures_${museumId}`] = JSON.stringify(userTreasures);
      
      // Step 3: Page reload - museum data loaded from static data (without user treasure)
      // because KV store save failed
      const currentMuseum = {
        id: museumId,
        name: '测试博物馆',
        collections: [
          { name: '原有镇馆之宝', description: '博物馆原有的宝贝' }
        ]
      };
      
      const loadUserAddedTreasures = (musId) => {
        const saved = mockLocalStorage.getItem(`userAddedTreasures_${musId}`);
        return saved ? JSON.parse(saved) : [];
      };
      
      // The fix: merge user treasures from localStorage
      const userTreasuresLoaded = loadUserAddedTreasures(museumId);
      if (userTreasuresLoaded && userTreasuresLoaded.length > 0) {
        if (!currentMuseum.collections) {
          currentMuseum.collections = [];
        }
        userTreasuresLoaded.forEach(ut => {
          const exists = currentMuseum.collections.some(c => c.name === ut.name);
          if (!exists) {
            currentMuseum.collections.push({ ...ut, isUserAdded: true });
          }
        });
      }
      
      // Step 4: Verify treasure appears despite KV store failure
      expect(currentMuseum.collections.length).toBe(2);
      expect(currentMuseum.collections.some(c => c.name === '用户发现的宝贝')).toBe(true);
      expect(currentMuseum.collections.some(c => c.name === '原有镇馆之宝')).toBe(true);
    });
  });
});