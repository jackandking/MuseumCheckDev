/**
 * Tests for Additional Beautiful Firework Types
 * Issue: 新烟花 - Add more beautiful firework patterns
 * 
 * Ensures that the new beautiful firework types (rose, sunburst, cascade, ring, crosshatch)
 * are properly implemented and generate valid shape points.
 */

const fs = require('fs');
const path = require('path');

// Load firework.js content to verify implementation
const fireworkContent = fs.readFileSync(path.join(__dirname, '..', 'firework.js'), 'utf8');
const indexContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fireworksWallContent = fs.readFileSync(path.join(__dirname, '..', 'fireworks-wall.html'), 'utf8');

describe('Additional Beautiful Firework Types', () => {
    describe('Code Implementation in firework.js', () => {
        test('firework.js should have rose shape generation method', () => {
            expect(fireworkContent).toContain('_generateRoseShape');
            expect(fireworkContent).toContain('rose pattern');
        });

        test('firework.js should have sunburst shape generation method', () => {
            expect(fireworkContent).toContain('_generateSunburstShape');
            expect(fireworkContent).toContain('sunburst pattern');
        });

        test('firework.js should have cascade shape generation method', () => {
            expect(fireworkContent).toContain('_generateCascadeShape');
            expect(fireworkContent).toContain('cascade/willow pattern');
        });

        test('firework.js should have ring shape generation method', () => {
            expect(fireworkContent).toContain('_generateRingShape');
            expect(fireworkContent).toContain('ring pattern');
        });

        test('firework.js should have crosshatch shape generation method', () => {
            expect(fireworkContent).toContain('_generateCrosshatchShape');
            expect(fireworkContent).toContain('crosshatch/grid pattern');
        });

        test('_getShapePoints should handle rose type in firework.js', () => {
            expect(fireworkContent).toContain("case 'rose':");
            expect(fireworkContent).toContain('return this._generateRoseShape(pointCount)');
        });

        test('_getShapePoints should handle sunburst type in firework.js', () => {
            expect(fireworkContent).toContain("case 'sunburst':");
            expect(fireworkContent).toContain('return this._generateSunburstShape(pointCount)');
        });

        test('_getShapePoints should handle cascade type in firework.js', () => {
            expect(fireworkContent).toContain("case 'cascade':");
            expect(fireworkContent).toContain('return this._generateCascadeShape(pointCount)');
        });

        test('_getShapePoints should handle ring type in firework.js', () => {
            expect(fireworkContent).toContain("case 'ring':");
            expect(fireworkContent).toContain('return this._generateRingShape(pointCount)');
        });

        test('_getShapePoints should handle crosshatch type in firework.js', () => {
            expect(fireworkContent).toContain("case 'crosshatch':");
            expect(fireworkContent).toContain('return this._generateCrosshatchShape(pointCount)');
        });
    });

    describe('Code Implementation in fireworks-wall.html', () => {
        test('fireworks-wall.html should have rose shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateRoseShape');
            expect(fireworksWallContent).toContain('rose pattern');
        });

        test('fireworks-wall.html should have sunburst shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateSunburstShape');
            expect(fireworksWallContent).toContain('sunburst pattern');
        });

        test('fireworks-wall.html should have cascade shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateCascadeShape');
            expect(fireworksWallContent).toContain('cascade/willow pattern');
        });

        test('fireworks-wall.html should have ring shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateRingShape');
            expect(fireworksWallContent).toContain('ring pattern');
        });

        test('fireworks-wall.html should have crosshatch shape generation method', () => {
            expect(fireworksWallContent).toContain('_generateCrosshatchShape');
            expect(fireworksWallContent).toContain('crosshatch/grid pattern');
        });

        test('_getShapePoints should handle new types in fireworks-wall.html', () => {
            expect(fireworksWallContent).toContain("case 'rose':");
            expect(fireworksWallContent).toContain("case 'sunburst':");
            expect(fireworksWallContent).toContain("case 'cascade':");
            expect(fireworksWallContent).toContain("case 'ring':");
            expect(fireworksWallContent).toContain("case 'crosshatch':");
        });
    });

    describe('UI Options in index.html', () => {
        test('index.html should have rose option in firework type selector', () => {
            expect(indexContent).toContain('value="rose"');
            expect(indexContent).toContain('🌹 玫瑰');
        });

        test('index.html should have sunburst option in firework type selector', () => {
            expect(indexContent).toContain('value="sunburst"');
            expect(indexContent).toContain('☀️ 太阳爆发');
        });

        test('index.html should have cascade option in firework type selector', () => {
            expect(indexContent).toContain('value="cascade"');
            expect(indexContent).toContain('💧 瀑布');
        });

        test('index.html should have ring option in firework type selector', () => {
            expect(indexContent).toContain('value="ring"');
            expect(indexContent).toContain('⭕ 光环');
        });

        test('index.html should have crosshatch option in firework type selector', () => {
            expect(indexContent).toContain('value="crosshatch"');
            expect(indexContent).toContain('🔲 网格');
        });

        test('firework type selector should have all 11 options', () => {
            const selectorMatch = indexContent.match(/<select id="fireworkTypeSelector"[^>]*>[\s\S]*?<\/select>/);
            expect(selectorMatch).toBeTruthy();
            
            if (selectorMatch) {
                const selectorHTML = selectorMatch[0];
                // Count option tags
                const optionCount = (selectorHTML.match(/<option/g) || []).length;
                expect(optionCount).toBe(11); // heart, circle, star, diamond, spiral, butterfly, rose, sunburst, cascade, ring, crosshatch
            }
        });
    });

    describe('Shape Generation Logic', () => {
        test('rose shape should use polar rose equation', () => {
            expect(fireworkContent).toContain('const petals = 5');
            expect(fireworkContent).toContain('Math.cos(petals * t)');
        });

        test('sunburst shape should create rays with varying lengths', () => {
            expect(fireworkContent).toContain('const rays = 12');
            expect(fireworkContent).toContain('rayIndex');
            expect(fireworkContent).toContain('radiusMultiplier');
        });

        test('cascade shape should create cascading streams', () => {
            expect(fireworkContent).toContain('const streamCount = 8');
            expect(fireworkContent).toContain('dropFactor');
        });

        test('ring shape should create concentric rings', () => {
            expect(fireworkContent).toContain('const rings = 3');
            expect(fireworkContent).toContain('ringIndex');
        });

        test('crosshatch shape should create grid pattern', () => {
            expect(fireworkContent).toContain('const lines = 6');
            expect(fireworkContent).toContain('isVertical');
        });

        test('all new shapes should return array of points with x and y', () => {
            // Verify rose shape
            expect(fireworkContent).toContain('rosePoints.push({x: x, y: y})');
            
            // Verify sunburst shape
            expect(fireworkContent).toContain('sunburstPoints.push({x: x, y: y})');
            
            // Verify cascade shape
            expect(fireworkContent).toContain('cascadePoints.push({x: x, y: y})');
            
            // Verify ring shape
            expect(fireworkContent).toContain('ringPoints.push({x: x, y: y})');
            
            // Verify crosshatch shape
            expect(fireworkContent).toContain('crosshatchPoints.push({x: x, y: y})');
        });
    });

    describe('Consistency Across Files', () => {
        test('rose shape implementation should be consistent in both files', () => {
            const fireworkRoseMatch = fireworkContent.match(/_generateRoseShape[\s\S]*?return rosePoints;[\s\S]*?}/);
            const wallRoseMatch = fireworksWallContent.match(/_generateRoseShape[\s\S]*?return rosePoints;[\s\S]*?}/);
            
            expect(fireworkRoseMatch).toBeTruthy();
            expect(wallRoseMatch).toBeTruthy();
            
            if (fireworkRoseMatch && wallRoseMatch) {
                expect(fireworkRoseMatch[0]).toContain('const petals = 5');
                expect(wallRoseMatch[0]).toContain('const petals = 5');
            }
        });

        test('sunburst shape implementation should be consistent in both files', () => {
            const fireworkSunburstMatch = fireworkContent.match(/_generateSunburstShape[\s\S]*?return sunburstPoints;[\s\S]*?}/);
            const wallSunburstMatch = fireworksWallContent.match(/_generateSunburstShape[\s\S]*?return sunburstPoints;[\s\S]*?}/);
            
            expect(fireworkSunburstMatch).toBeTruthy();
            expect(wallSunburstMatch).toBeTruthy();
            
            if (fireworkSunburstMatch && wallSunburstMatch) {
                expect(fireworkSunburstMatch[0]).toContain('const rays = 12');
                expect(wallSunburstMatch[0]).toContain('const rays = 12');
            }
        });

        test('cascade shape implementation should be consistent in both files', () => {
            const fireworkCascadeMatch = fireworkContent.match(/_generateCascadeShape[\s\S]*?return cascadePoints;[\s\S]*?}/);
            const wallCascadeMatch = fireworksWallContent.match(/_generateCascadeShape[\s\S]*?return cascadePoints;[\s\S]*?}/);
            
            expect(fireworkCascadeMatch).toBeTruthy();
            expect(wallCascadeMatch).toBeTruthy();
            
            if (fireworkCascadeMatch && wallCascadeMatch) {
                expect(fireworkCascadeMatch[0]).toContain('const streamCount = 8');
                expect(wallCascadeMatch[0]).toContain('const streamCount = 8');
            }
        });

        test('ring shape implementation should be consistent in both files', () => {
            const fireworkRingMatch = fireworkContent.match(/_generateRingShape[\s\S]*?return ringPoints;[\s\S]*?}/);
            const wallRingMatch = fireworksWallContent.match(/_generateRingShape[\s\S]*?return ringPoints;[\s\S]*?}/);
            
            expect(fireworkRingMatch).toBeTruthy();
            expect(wallRingMatch).toBeTruthy();
            
            if (fireworkRingMatch && wallRingMatch) {
                expect(fireworkRingMatch[0]).toContain('const rings = 3');
                expect(wallRingMatch[0]).toContain('const rings = 3');
            }
        });

        test('crosshatch shape implementation should be consistent in both files', () => {
            const fireworkCrosshatchMatch = fireworkContent.match(/_generateCrosshatchShape[\s\S]*?return crosshatchPoints;[\s\S]*?}/);
            const wallCrosshatchMatch = fireworksWallContent.match(/_generateCrosshatchShape[\s\S]*?return crosshatchPoints;[\s\S]*?}/);
            
            expect(fireworkCrosshatchMatch).toBeTruthy();
            expect(wallCrosshatchMatch).toBeTruthy();
            
            if (fireworkCrosshatchMatch && wallCrosshatchMatch) {
                expect(fireworkCrosshatchMatch[0]).toContain('const lines = 6');
                expect(wallCrosshatchMatch[0]).toContain('const lines = 6');
            }
        });
    });

    describe('Backwards Compatibility', () => {
        test('original firework types should still be available', () => {
            const originalTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly'];
            
            originalTypes.forEach(type => {
                expect(indexContent).toContain(`value="${type}"`);
            });
        });

        test('_getShapePoints should still handle all original types', () => {
            expect(fireworkContent).toContain("case 'heart':");
            expect(fireworkContent).toContain("case 'circle':");
            expect(fireworkContent).toContain("case 'star':");
            expect(fireworkContent).toContain("case 'diamond':");
            expect(fireworkContent).toContain("case 'spiral':");
            expect(fireworkContent).toContain("case 'butterfly':");
        });
    });
});
