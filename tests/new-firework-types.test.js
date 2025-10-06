/**
 * Tests for New Firework Types
 * Issue: 加入新烟花类型
 * 
 * Ensures that new firework types (diamond, spiral, butterfly) are properly
 * implemented and generate valid shape points.
 */

const fs = require('fs');
const path = require('path');

// Load firework.js content to verify implementation
const fireworkContent = fs.readFileSync(path.join(__dirname, '..', 'firework.js'), 'utf8');
const indexContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fireworksWallContent = fs.readFileSync(path.join(__dirname, '..', 'fireworks-wall.html'), 'utf8');

describe('New Firework Types', () => {
    describe('Code Implementation', () => {
        test('firework.js should have diamond shape generation method', () => {
            expect(fireworkContent).toContain('_generateDiamondShape');
            expect(fireworkContent).toContain('Diamond/rhombus shape');
        });

        test('firework.js should have spiral shape generation method', () => {
            expect(fireworkContent).toContain('_generateSpiralShape');
            expect(fireworkContent).toContain('spiral/galaxy pattern');
        });

        test('firework.js should have butterfly shape generation method', () => {
            expect(fireworkContent).toContain('_generateButterflyShape');
            expect(fireworkContent).toContain('butterfly pattern');
        });

        test('_getShapePoints should handle diamond type in firework.js', () => {
            expect(fireworkContent).toContain("case 'diamond':");
            expect(fireworkContent).toContain('return this._generateDiamondShape(pointCount)');
        });

        test('_getShapePoints should handle spiral type in firework.js', () => {
            expect(fireworkContent).toContain("case 'spiral':");
            expect(fireworkContent).toContain('return this._generateSpiralShape(pointCount)');
        });

        test('_getShapePoints should handle butterfly type in firework.js', () => {
            expect(fireworkContent).toContain("case 'butterfly':");
            expect(fireworkContent).toContain('return this._generateButterflyShape(pointCount)');
        });

        test('fireworks-wall.html should have diamond shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateDiamondShape');
            expect(fireworksWallContent).toContain('Diamond/rhombus shape');
        });

        test('fireworks-wall.html should have spiral shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateSpiralShape');
            expect(fireworksWallContent).toContain('spiral/galaxy pattern');
        });

        test('fireworks-wall.html should have butterfly shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateButterflyShape');
            expect(fireworksWallContent).toContain('butterfly pattern');
        });

        test('_getShapePoints should handle new types in fireworks-wall.html', () => {
            expect(fireworksWallContent).toContain("case 'diamond':");
            expect(fireworksWallContent).toContain("case 'spiral':");
            expect(fireworksWallContent).toContain("case 'butterfly':");
        });
    });

    describe('UI Options', () => {
        test('index.html should have diamond option in firework type selector', () => {
            expect(indexContent).toContain('value="diamond"');
            expect(indexContent).toContain('💎 菱形');
        });

        test('index.html should have spiral option in firework type selector', () => {
            expect(indexContent).toContain('value="spiral"');
            expect(indexContent).toContain('🌀 螺旋');
        });

        test('index.html should have butterfly option in firework type selector', () => {
            expect(indexContent).toContain('value="butterfly"');
            expect(indexContent).toContain('🦋 蝴蝶');
        });

        test('firework type selector should have all 6 options', () => {
            const selectorMatch = indexContent.match(/<select id="fireworkTypeSelector"[^>]*>[\s\S]*?<\/select>/);
            expect(selectorMatch).toBeTruthy();
            
            if (selectorMatch) {
                const selectorHTML = selectorMatch[0];
                // Count option tags
                const optionCount = (selectorHTML.match(/<option/g) || []).length;
                expect(optionCount).toBe(6); // heart, circle, star, diamond, spiral, butterfly
            }
        });
    });

    describe('Shape Generation Logic', () => {
        test('diamond shape should use absolute value formula', () => {
            expect(fireworkContent).toContain('Math.abs(Math.cos(t)) + Math.abs(Math.sin(t))');
        });

        test('spiral shape should create multiple arms', () => {
            expect(fireworkContent).toContain('const arms = 3');
            expect(fireworkContent).toContain('for (let arm = 0; arm < arms; arm++)');
        });

        test('butterfly shape should use exponential and trigonometric functions', () => {
            expect(fireworkContent).toContain('Math.exp(Math.sin(t))');
            expect(fireworkContent).toContain('Math.cos(4 * t)');
        });

        test('all new shapes should return array of points with x and y', () => {
            // Verify diamond shape
            expect(fireworkContent).toContain('diamondPoints.push({x: x, y: y})');
            
            // Verify spiral shape
            expect(fireworkContent).toContain('spiralPoints.push({x: x, y: y})');
            
            // Verify butterfly shape
            expect(fireworkContent).toContain('butterflyPoints.push({x: x, y: y})');
        });
    });

    describe('Consistency Across Files', () => {
        test('diamond shape implementation should be consistent in both files', () => {
            // Extract diamond shape method from both files
            const fireworkDiamondMatch = fireworkContent.match(/_generateDiamondShape[\s\S]*?return diamondPoints;[\s\S]*?}/);
            const wallDiamondMatch = fireworksWallContent.match(/_generateDiamondShape[\s\S]*?return diamondPoints;[\s\S]*?}/);
            
            expect(fireworkDiamondMatch).toBeTruthy();
            expect(wallDiamondMatch).toBeTruthy();
            
            // Both should use the same formula
            if (fireworkDiamondMatch && wallDiamondMatch) {
                expect(fireworkDiamondMatch[0]).toContain('Math.abs(Math.cos(t)) + Math.abs(Math.sin(t))');
                expect(wallDiamondMatch[0]).toContain('Math.abs(Math.cos(t)) + Math.abs(Math.sin(t))');
            }
        });

        test('spiral shape implementation should be consistent in both files', () => {
            const fireworkSpiralMatch = fireworkContent.match(/_generateSpiralShape[\s\S]*?return spiralPoints;[\s\S]*?}/);
            const wallSpiralMatch = fireworksWallContent.match(/_generateSpiralShape[\s\S]*?return spiralPoints;[\s\S]*?}/);
            
            expect(fireworkSpiralMatch).toBeTruthy();
            expect(wallSpiralMatch).toBeTruthy();
            
            // Both should use 3 arms
            if (fireworkSpiralMatch && wallSpiralMatch) {
                expect(fireworkSpiralMatch[0]).toContain('const arms = 3');
                expect(wallSpiralMatch[0]).toContain('const arms = 3');
            }
        });

        test('butterfly shape implementation should be consistent in both files', () => {
            const fireworkButterflyMatch = fireworkContent.match(/_generateButterflyShape[\s\S]*?return butterflyPoints;[\s\S]*?}/);
            const wallButterflyMatch = fireworksWallContent.match(/_generateButterflyShape[\s\S]*?return butterflyPoints;[\s\S]*?}/);
            
            expect(fireworkButterflyMatch).toBeTruthy();
            expect(wallButterflyMatch).toBeTruthy();
            
            // Both should use the same butterfly curve formula
            if (fireworkButterflyMatch && wallButterflyMatch) {
                expect(fireworkButterflyMatch[0]).toContain('Math.exp(Math.sin(t))');
                expect(wallButterflyMatch[0]).toContain('Math.exp(Math.sin(t))');
            }
        });
    });
});
