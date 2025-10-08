/**
 * Tests for Firework Effect Tiering
 * Issue: 烟花效果分级 - 前三种烟花保留简单实现，后面几种更加酷炫
 * 
 * Validates that firework effects are properly tiered:
 * - Basic tier (heart, circle, star): Simple effects, fewer particles
 * - Premium tier (diamond, spiral, butterfly, rose, sunburst, cascade, ring, crosshatch): 
 *   Enhanced effects with multi-stage explosions
 */

const fs = require('fs');
const path = require('path');

// Load firework.js content to verify implementation
const fireworkContent = fs.readFileSync(path.join(__dirname, '..', 'firework.js'), 'utf8');
const fireworksWallContent = fs.readFileSync(path.join(__dirname, '..', 'fireworks-wall.html'), 'utf8');

describe('Firework Effect Tiering System', () => {
    describe('Basic Tier Detection Method', () => {
        test('firework.js should have _isBasicTierFirework method', () => {
            expect(fireworkContent).toContain('_isBasicTierFirework()');
            expect(fireworkContent).toContain('Determines if this firework is basic tier');
        });

        test('fireworks-wall.html should have _isBasicTierFirework method', () => {
            expect(fireworksWallContent).toContain('_isBasicTierFirework()');
            expect(fireworksWallContent).toContain('Determines if this firework is basic tier');
        });

        test('_isBasicTierFirework should identify heart, circle, star as basic tier', () => {
            expect(fireworkContent).toContain("const basicTierTypes = ['heart', 'circle', 'star']");
            expect(fireworkContent).toContain('return basicTierTypes.includes(this.fireworkType)');
        });

        test('fireworks-wall.html should identify same basic tier types', () => {
            expect(fireworksWallContent).toContain("const basicTierTypes = ['heart', 'circle', 'star']");
            expect(fireworksWallContent).toContain('return basicTierTypes.includes(this.fireworkType)');
        });
    });

    describe('Explode Method Tiering Logic', () => {
        test('firework.js explode() should check effect tier', () => {
            // Should call the tier detection method
            expect(fireworkContent).toContain('const isBasicTier = this._isBasicTierFirework()');
        });

        test('fireworks-wall.html explode() should check effect tier', () => {
            expect(fireworksWallContent).toContain('const isBasicTier = this._isBasicTierFirework()');
        });

        test('firework.js should use different particle counts for different tiers', () => {
            // Basic tier: 150 particles, Premium tier: 400 particles
            expect(fireworkContent).toContain('const particleCount = isBasicTier ? 150 : 400');
        });

        test('fireworks-wall.html should use different particle counts for different tiers', () => {
            // Basic tier: 100 particles, Premium tier: 150 particles (wall is less intensive)
            expect(fireworksWallContent).toContain('const particleCount = isBasicTier ? 100 : 150');
        });
    });

    describe('Basic Tier Effects (Heart, Circle, Star)', () => {
        test('firework.js basic tier should skip flash effect', () => {
            // Flash effect should only run for premium tier
            const explodeMethod = fireworkContent.match(/explode\(\)\s*\{[\s\S]*?(?=\n\s{4}\/\*\*|\n\s{4}_)/);
            expect(explodeMethod).toBeTruthy();
            
            // Should conditionally add flash effect
            expect(fireworkContent).toContain('if (!isBasicTier) {');
            expect(fireworkContent).toContain('this._addFlashEffect()');
        });

        test('fireworks-wall.html basic tier should skip flash effect', () => {
            expect(fireworksWallContent).toContain('if (!isBasicTier) {');
            expect(fireworksWallContent).toContain('this._addFlashEffect()');
        });

        test('firework.js basic tier should skip sparkle effects', () => {
            // Sparkle and trailing effects should only run for premium tier
            const explodeContent = fireworkContent.match(/explode\(\)\s*\{[\s\S]*?(?=\n\s{4}\/\*\*|\n\s{4}_)/);
            expect(explodeContent).toBeTruthy();
            
            // Should conditionally add sparkle effects
            expect(explodeContent[0]).toContain('if (!isBasicTier) {');
            expect(explodeContent[0]).toContain('this._addSparkleEffect()');
            expect(explodeContent[0]).toContain('this._addTrailingSparkles()');
        });

        test('fireworks-wall.html basic tier should skip sparkle effects', () => {
            expect(fireworksWallContent).toContain('if (!isBasicTier) {');
            expect(fireworksWallContent).toContain('this._addSparkleEffect()');
            expect(fireworksWallContent).toContain('this._addTrailingSparkles()');
        });
    });

    describe('Premium Tier Effects (Diamond, Spiral, Butterfly, Rose, etc.)', () => {
        test('firework.js should have all premium firework types', () => {
            const premiumTypes = ['diamond', 'spiral', 'butterfly', 'rose', 'sunburst', 'cascade', 'ring', 'crosshatch'];
            
            premiumTypes.forEach(type => {
                expect(fireworkContent).toContain(`case '${type}':`);
            });
        });

        test('fireworks-wall.html should have all premium firework types', () => {
            const premiumTypes = ['diamond', 'spiral', 'butterfly', 'rose', 'sunburst', 'cascade', 'ring', 'crosshatch'];
            
            premiumTypes.forEach(type => {
                expect(fireworksWallContent).toContain(`case '${type}':`);
            });
        });

        test('premium tier should get more particles than basic tier', () => {
            // firework.js: 400 vs 150
            expect(fireworkContent).toContain('isBasicTier ? 150 : 400');
            
            // fireworks-wall.html: 150 vs 100
            expect(fireworksWallContent).toContain('isBasicTier ? 100 : 150');
        });

        test('premium tier should include all effect stages', () => {
            // Premium tier gets: flash + main + sparkle + trailing
            expect(fireworkContent).toContain('_addFlashEffect');
            expect(fireworkContent).toContain('_addSparkleEffect');
            expect(fireworkContent).toContain('_addTrailingSparkles');
        });
    });

    describe('Particle Count Validation', () => {
        test('basic tier particle count should be significantly lower', () => {
            // firework.js: 150 for basic vs 400 for premium (37.5%)
            const mainParticleMatch = fireworkContent.match(/isBasicTier \? (\d+) : (\d+)/);
            expect(mainParticleMatch).toBeTruthy();
            
            const basicCount = parseInt(mainParticleMatch[1]);
            const premiumCount = parseInt(mainParticleMatch[2]);
            
            expect(basicCount).toBeLessThan(premiumCount);
            expect(basicCount / premiumCount).toBeLessThan(0.5); // Less than 50%
        });

        test('wall particle count should be lower than main page', () => {
            // Wall is less intensive due to multiple simultaneous fireworks
            const mainMatch = fireworkContent.match(/isBasicTier \? (\d+) : (\d+)/);
            const wallMatch = fireworksWallContent.match(/isBasicTier \? (\d+) : (\d+)/);
            
            expect(mainMatch).toBeTruthy();
            expect(wallMatch).toBeTruthy();
            
            const mainBasic = parseInt(mainMatch[1]);
            const mainPremium = parseInt(mainMatch[2]);
            const wallBasic = parseInt(wallMatch[1]);
            const wallPremium = parseInt(wallMatch[2]);
            
            // Wall counts should be lower
            expect(wallBasic).toBeLessThanOrEqual(mainBasic);
            expect(wallPremium).toBeLessThanOrEqual(mainPremium);
        });
    });

    describe('Effect Methods Existence', () => {
        test('firework.js should have all effect methods', () => {
            expect(fireworkContent).toContain('_addFlashEffect()');
            expect(fireworkContent).toContain('_addSparkleEffect()');
            expect(fireworkContent).toContain('_addTrailingSparkles()');
        });

        test('fireworks-wall.html should have all effect methods', () => {
            expect(fireworksWallContent).toContain('_addFlashEffect()');
            expect(fireworksWallContent).toContain('_addSparkleEffect()');
            expect(fireworksWallContent).toContain('_addTrailingSparkles()');
        });
    });

    describe('Code Consistency', () => {
        test('both files should use same basic tier types', () => {
            const mainBasicTypes = fireworkContent.match(/const basicTierTypes = \[(.*?)\]/);
            const wallBasicTypes = fireworksWallContent.match(/const basicTierTypes = \[(.*?)\]/);
            
            expect(mainBasicTypes).toBeTruthy();
            expect(wallBasicTypes).toBeTruthy();
            
            // Should have identical basic tier type arrays
            expect(mainBasicTypes[1]).toBe(wallBasicTypes[1]);
        });

        test('tiering logic should be consistent', () => {
            // Both should check isBasicTier before effects
            expect(fireworkContent).toContain('if (!isBasicTier)');
            expect(fireworksWallContent).toContain('if (!isBasicTier)');
        });
    });

    describe('Premium Features Documentation', () => {
        test('code should document tiering for monetization', () => {
            // Comments should explain the tiering system
            expect(fireworkContent).toContain('basic tier');
            expect(fireworkContent).toContain('premium tier') || 
                expect(fireworkContent).toContain('Premium tier');
        });

        test('tier determination should be clearly documented', () => {
            expect(fireworkContent).toContain('Determines if this firework is basic tier');
            expect(fireworksWallContent).toContain('Determines if this firework is basic tier');
        });
    });

    describe('Backward Compatibility', () => {
        test('default firework type should still work', () => {
            // Default is 'heart', which is basic tier
            expect(fireworkContent).toContain("fireworkType = 'heart'");
            expect(fireworkContent).toContain("['heart', 'circle', 'star']");
        });

        test('all existing shape generation methods should remain', () => {
            const shapeTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly', 
                               'rose', 'sunburst', 'cascade', 'ring', 'crosshatch'];
            
            shapeTypes.forEach(shape => {
                const methodName = `_generate${shape.charAt(0).toUpperCase() + shape.slice(1)}Shape`;
                expect(fireworkContent).toContain(methodName);
            });
        });
    });
});
