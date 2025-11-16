/**
 * Tests for v2 bug fixes
 * Issue: Fix photo upload, duplicate tasks, and treasure image display
 * 
 * Three bugs fixed:
 * 1. Photo capture changed to file upload (removed capture="environment")
 * 2. Capital Museum duplicate tasks removed
 * 3. Pinghu Museum treasure images now display (fixed imageUrl property lookup)
 */

const fs = require('fs');
const path = require('path');

describe('v2 Bug Fixes', () => {
    let htmlContent;
    
    beforeAll(() => {
        htmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'museum-checkin.html'), 
            'utf8'
        );
    });

    describe('Photo Upload Fix', () => {
        test('should not have capture attribute on photo input', () => {
            // The capture="environment" attribute forces camera on mobile
            // We removed it to allow users to choose between camera and gallery
            expect(htmlContent).not.toContain('capture="environment"');
        });

        test('should have file input with accept image/*', () => {
            expect(htmlContent).toContain('type="file"');
            expect(htmlContent).toContain('accept="image/*"');
        });

        test('should show upload label instead of capture label', () => {
            expect(htmlContent).toContain('上传照片（可选）');
            expect(htmlContent).not.toContain('拍照留念（可选）');
        });

        test('should show re-upload button text instead of retake', () => {
            expect(htmlContent).toContain('重新上传');
            expect(htmlContent).not.toContain('重新拍照');
        });
    });

    describe('Duplicate Tasks Fix', () => {
        test('should not append collection tasks if custom checklist exists', () => {
            // The fix checks for hasCustomChecklist before appending collection-derived tasks
            expect(htmlContent).toContain('hasCustomChecklist');
            expect(htmlContent).toContain('!hasCustomChecklist && Array.isArray(currentMuseum.collections)');
        });

        test('should check for existing custom checklist before auto-generating tasks', () => {
            const checklistCheckPattern = /currentMuseum\.checklists\.child\[ageGroup\].*length\s*>\s*0/;
            expect(htmlContent).toMatch(checklistCheckPattern);
        });

        test('should have comment explaining the fix', () => {
            expect(htmlContent).toContain('Museums with custom checklists');
            expect(htmlContent).toContain('ONLY if no custom checklist exists');
        });
    });

    describe('Treasure Image Display Fix', () => {
        test('should look for both imageUrl and url properties in collections', () => {
            // Fixed to support both property names (imageUrl for pinghu-museum.js, url for others)
            const imageUrlPattern = /found\.imageUrl\s*\|\|\s*found\.url/;
            expect(htmlContent).toMatch(imageUrlPattern);
        });

        test('should have imageUrl check in task card rendering', () => {
            // Around line 958 - task card image lookup
            const cardImagePattern = /found\s*&&\s*\(found\.imageUrl\s*\|\|\s*found\.url\)/;
            expect(htmlContent).toMatch(cardImagePattern);
        });

        test('should have imageUrl check in modal image rendering', () => {
            // Around line 1074 - modal image lookup
            const modalImagePattern = /found\s*&&\s*\(found\.imageUrl\s*\|\|\s*found\.url\)/;
            expect(htmlContent).toMatch(modalImagePattern);
        });
    });

    describe('Integration - All Fixes Working Together', () => {
        test('should have all three fixes applied in the same file', () => {
            // Photo upload fix
            expect(htmlContent).not.toContain('capture="environment"');
            
            // Duplicate tasks fix
            expect(htmlContent).toContain('hasCustomChecklist');
            
            // Image display fix
            const imageUrlPattern = /found\.imageUrl\s*\|\|\s*found\.url/;
            expect(htmlContent).toMatch(imageUrlPattern);
        });
    });
});

describe('Museum Data Files', () => {
    describe('Pinghu Museum', () => {
        test('should have imageUrl property in collections', () => {
            const pinghuContent = fs.readFileSync(
                path.join(__dirname, '..', 'museums', 'pinghu-museum.js'),
                'utf8'
            );
            
            // Check that collections use imageUrl property
            expect(pinghuContent).toContain('imageUrl:');
            expect(pinghuContent).toContain('唐铸铁佛头');
            expect(pinghuContent).toContain('新石器时代崧泽文化夹砂红陶鼎');
            expect(pinghuContent).toContain('新石器时代良渚文化黑皮陶盉');
        });
    });

    describe('Capital Museum', () => {
        test('should have custom checklist to prevent duplicates', () => {
            const capitalContent = fs.readFileSync(
                path.join(__dirname, '..', 'museums', 'capital-museum.js'),
                'utf8'
            );
            
            // Check that it has custom checklists defined
            expect(capitalContent).toContain('checklists:');
            expect(capitalContent).toContain('child:');
            expect(capitalContent).toContain('元代景德镇窑青花凤首扁壶');
            expect(capitalContent).toContain('乾隆款金嵌珍珠天球仪');
            expect(capitalContent).toContain('明代金丝翼善冠');
            expect(capitalContent).toContain('神兽玉佩');
        });

        test('should have collections array for workflow generation', () => {
            const capitalContent = fs.readFileSync(
                path.join(__dirname, '..', 'museums', 'capital-museum.js'),
                'utf8'
            );
            
            expect(capitalContent).toContain('collections:');
            expect(capitalContent).toContain('imageUrl:');
        });
    });
});
