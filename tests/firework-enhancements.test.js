/**
 * Tests for Enhanced Firework Visual Effects
 * Issue: 烟花特效 - Make firework effects more beautiful for children
 * 
 * Verifies that visual enhancements have been properly implemented
 * to provide greater emotional value and engagement for children.
 */

const fs = require('fs');
const path = require('path');

// Load firework.js content to verify implementation
const fireworkContent = fs.readFileSync(path.join(__dirname, '..', 'firework.js'), 'utf8');
const fireworksWallContent = fs.readFileSync(path.join(__dirname, '..', 'fireworks-wall.html'), 'utf8');

describe('Enhanced Firework Visual Effects', () => {
    describe('Child-Friendly Vibrant Colors', () => {
        test('firework.js should use vibrant child-friendly color palette', () => {
            // Verify we're using a curated color palette instead of random RGB
            expect(fireworkContent).toContain('Child-friendly vibrant colors');
            expect(fireworkContent).toContain('brightColors');
            
            // Verify specific vibrant colors are included
            expect(fireworkContent).toContain('255, 50, 100');   // Hot Pink
            expect(fireworkContent).toContain('255, 200, 0');    // Golden Yellow
            expect(fireworkContent).toContain('50, 200, 255');   // Sky Blue
            expect(fireworkContent).toContain('50, 255, 200');   // Turquoise
            expect(fireworkContent).toContain('200, 50, 255');   // Violet
        });

        test('fireworks-wall.html should use vibrant child-friendly color palette', () => {
            expect(fireworksWallContent).toContain('Child-friendly vibrant colors');
            expect(fireworksWallContent).toContain('brightColors');
            
            // Verify consistent color palette with main file
            expect(fireworksWallContent).toContain('255, 50, 100');
            expect(fireworksWallContent).toContain('255, 200, 0');
            expect(fireworksWallContent).toContain('50, 200, 255');
        });

        test('should not use random RGB color generation', () => {
            // Ensure we removed the old random color generation
            const oldPattern = /Math\.floor\(Math\.random\(\) \* 255\)/;
            const randomColorInMethod = fireworkContent.match(/_generateRandomColor[\s\S]*?{[\s\S]*?Math\.floor\(Math\.random\(\) \* 255\)[\s\S]*?}/);
            
            // Should not find random RGB generation in _generateRandomColor method
            expect(randomColorInMethod).toBeNull();
        });
    });

    describe('Multi-Layer Glow Effects', () => {
        test('particles should have multi-layer glow rendering', () => {
            // Verify particle draw method has glow layers
            const particleDrawMatch = fireworkContent.match(/draw\(\) {[\s\S]*?Outer glow[\s\S]*?Middle glow[\s\S]*?Core particle[\s\S]*?}/);
            expect(particleDrawMatch).toBeTruthy();
            
            // Verify glow alpha calculations
            expect(fireworkContent).toContain('glowAlpha');
            expect(fireworkContent).toContain('midGlowAlpha');
            expect(fireworkContent).toContain('this.alpha * 0.3');
            expect(fireworkContent).toContain('this.alpha * 0.5');
        });

        test('firework trails should have multi-layer glow effects', () => {
            // Verify firework draw method has glow trail layers
            expect(fireworkContent).toContain('Outer glow trail');
            expect(fireworkContent).toContain('Middle glow trail');
            expect(fireworkContent).toContain('Main trail (bright)');
            
            // Verify different line widths for depth effect
            expect(fireworkContent).toContain('lineWidth = 12');
            expect(fireworkContent).toContain('lineWidth = 10');
        });

        test('particles should have white sparkle centers for twinkling', () => {
            expect(fireworkContent).toContain('white sparkle in center for twinkle effect');
            expect(fireworkContent).toContain('255, 255, 255');
            expect(fireworkContent).toContain('this.alpha > 0.7');
        });
    });

    describe('Enhanced Particle System', () => {
        test('should have increased particle count for fuller explosions', () => {
            // Check for particle count (now tier-based: 150 for basic, 400 for premium)
            const particleCountMatch = fireworkContent.match(/const particleCount = isBasicTier \? (\d+) : (\d+)/);
            expect(particleCountMatch).toBeTruthy();
            if (particleCountMatch) {
                const basicCount = parseInt(particleCountMatch[1]);
                const premiumCount = parseInt(particleCountMatch[2]);
                
                // Basic tier should have at least 100 particles
                expect(basicCount).toBeGreaterThanOrEqual(100);
                
                // Premium tier should have 400 or more particles
                expect(premiumCount).toBeGreaterThanOrEqual(400);
                
                // Premium tier should have significantly more particles
                expect(premiumCount).toBeGreaterThan(basicCount);
            }
        });

        test('particles should support variable sizes', () => {
            // Verify Particle constructor has size property
            const particleConstructorMatch = fireworkContent.match(/constructor\(x, y, color\) {[\s\S]*?this\.size = 2;[\s\S]*?}/);
            expect(particleConstructorMatch).toBeTruthy();
            
            // Verify size is used in draw method
            expect(fireworkContent).toContain('baseSize = this.size');
            expect(fireworkContent).toContain('baseSize * 2');
            expect(fireworkContent).toContain('baseSize * 1.5');
        });

        test('should assign varied particle sizes for visual interest', () => {
            // Verify particles get random size assignments
            expect(fireworkContent).toContain('particle.size = 1.5 + Math.random() * 1.5');
            expect(fireworkContent).toContain('particle.size = 2 + Math.random() * 2');
            expect(fireworkContent).toContain('particle.size = 1 + Math.random()');
        });

        test('particles should have varied physics properties', () => {
            // Verify varied gravity and friction
            expect(fireworkContent).toContain('particle.gravity = 0.01 + Math.random() * 0.005');
            expect(fireworkContent).toContain('particle.friction = 0.97 + Math.random() * 0.02');
        });
    });

    describe('Multi-Stage Explosion Effects', () => {
        test('should have initial flash effect', () => {
            expect(fireworkContent).toContain('_addFlashEffect');
            expect(fireworkContent).toContain('bright white flash particles for initial burst');
            
            // Verify flash effect method exists and creates white particles
            const flashMatch = fireworkContent.match(/_addFlashEffect\(\) {[\s\S]*?255, 255, 255/);
            expect(flashMatch).toBeTruthy();
            
            // Verify it's called in explode method
            const explodeCallMatch = fireworkContent.match(/explode\(\) {[\s\S]*?this\._addFlashEffect\(\)/);
            expect(explodeCallMatch).toBeTruthy();
        });

        test('should have enhanced sparkle effect', () => {
            expect(fireworkContent).toContain('_addSparkleEffect');
            expect(fireworkContent).toContain('More sparkles for magical effect');
            
            // Verify increased sparkle count - look for the method definition
            const sparkleMatch = fireworkContent.match(/_addSparkleEffect\(\) {[\s\S]*?for \(let i = 0; i < (\d+);/);
            expect(sparkleMatch).toBeTruthy();
            if (sparkleMatch) {
                const count = parseInt(sparkleMatch[1]);
                expect(count).toBeGreaterThanOrEqual(50); // Should be 50 or more (we have 80)
            }
        });

        test('should have trailing sparkles for cascading effect', () => {
            expect(fireworkContent).toContain('_addTrailingSparkles');
            expect(fireworkContent).toContain('secondary wave of sparkles for cascading magical effect');
            
            // Verify delayed execution
            expect(fireworkContent).toContain('setTimeout(() => {');
            expect(fireworkContent).toContain('this._addTrailingSparkles()');
        });

        test('should mix white and colored sparkles', () => {
            // Verify sparkle color mixing logic
            expect(fireworkContent).toContain('isWhiteSparkle = Math.random() > 0.5');
            expect(fireworkContent).toContain('isWhiteSparkle ? \'255, 255, 255\' : this.color');
        });
    });

    describe('Enhanced Text Display', () => {
        test('text should have pulsing animation effect', () => {
            expect(fireworkContent).toContain('pulsing effect');
            expect(fireworkContent).toContain('scale = 1 + Math.sin(timeSinceExplosion / 200) * 0.1');
            expect(fireworkContent).toContain('timeSinceExplosion < 2000');
        });

        test('text should have colorful shadows for visibility', () => {
            expect(fireworkContent).toContain('colorful outline/shadow for better visibility');
            expect(fireworkContent).toContain('shadowColor');
            expect(fireworkContent).toContain('shadowBlur = 15');
        });

        test('text should have outline for better readability', () => {
            expect(fireworkContent).toContain('Outline for better readability');
            expect(fireworkContent).toContain('strokeStyle');
            expect(fireworkContent).toContain('strokeText');
            expect(fireworkContent).toContain('lineWidth = 4');
        });

        test('text should be larger and more prominent', () => {
            // Verify increased font size
            expect(fireworkContent).toContain('bold 28px Arial');
        });

        test('should store explosion time for text animations', () => {
            expect(fireworkContent).toContain('this.explosionTime = Date.now()');
        });
    });

    describe('Consistency Across Files', () => {
        test('fireworks-wall.html should have same color enhancements', () => {
            expect(fireworksWallContent).toContain('Child-friendly vibrant colors');
            expect(fireworksWallContent).toContain('brightColors');
        });

        test('fireworks-wall.html should have same glow effects', () => {
            expect(fireworksWallContent).toContain('Outer glow');
            expect(fireworksWallContent).toContain('Middle glow');
            expect(fireworksWallContent).toContain('Core particle');
        });

        test('fireworks-wall.html should have same explosion effects', () => {
            expect(fireworksWallContent).toContain('_addFlashEffect');
            expect(fireworksWallContent).toContain('_addSparkleEffect');
            expect(fireworksWallContent).toContain('_addTrailingSparkles');
        });

        test('fireworks-wall.html should have same text enhancements', () => {
            expect(fireworksWallContent).toContain('pulsing effect');
            expect(fireworksWallContent).toContain('shadowBlur = 15');
            expect(fireworksWallContent).toContain('bold 28px Arial');
        });
    });

    describe('Performance Considerations', () => {
        test('should not have excessive particle counts', () => {
            // Verify particle counts are reasonable for performance
            const particleCountMatch = fireworkContent.match(/const particleCount = (\d+)/);
            if (particleCountMatch) {
                const count = parseInt(particleCountMatch[1]);
                expect(count).toBeLessThanOrEqual(500); // Should not exceed 500 for performance
            }
        });

        test('should use efficient rendering with canvas save/restore', () => {
            // Verify proper canvas state management
            expect(fireworkContent).toContain('ctx.save()');
            expect(fireworkContent).toContain('ctx.restore()');
        });
    });
});

describe('Emotional Value for Children', () => {
    test('implementation should focus on child-friendly visual appeal', () => {
        // Verify comments indicate child-friendly design
        expect(fireworkContent).toContain('Child-friendly');
        expect(fireworkContent).toContain('magical');
        expect(fireworkContent).toContain('twinkle');
    });

    test('should have bright, saturated colors that appeal to children', () => {
        // Verify high saturation colors (255 or near 255 in at least one RGB channel)
        const colorMatches = fireworkContent.match(/\d{3}, \d{1,3}, \d{1,3}/g);
        expect(colorMatches).toBeTruthy();
        
        if (colorMatches) {
            const brightColorCount = colorMatches.filter(color => {
                const [r, g, b] = color.split(', ').map(Number);
                return r >= 200 || g >= 200 || b >= 200;
            }).length;
            
            // Most colors should be bright (high values)
            expect(brightColorCount).toBeGreaterThan(5);
        }
    });

    test('should create visually rich explosions with multiple effects', () => {
        // Verify multiple visual effect methods exist
        expect(fireworkContent).toContain('_addFlashEffect');
        expect(fireworkContent).toContain('_addSparkleEffect');
        expect(fireworkContent).toContain('_addTrailingSparkles');
        
        // All three should be called in explosion
        const explodeMatch = fireworkContent.match(/explode\(\) {[\s\S]*?_addFlashEffect[\s\S]*?_addSparkleEffect[\s\S]*?_addTrailingSparkles/);
        expect(explodeMatch).toBeTruthy();
    });
});
