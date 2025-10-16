/**
 * Firework Animation System
 * Provides particle effects and firework animations for the LetMeTryAI application
 */

/**
 * Extracts URL parameter value by name
 * @param {string} name - The parameter name to extract
 * @returns {string} The decoded parameter value or empty string if not found
 */
function getUrlParameter(name) {
    if (!name || typeof name !== 'string') {
        return '';
    }
    
    const escapedName = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + escapedName + '=([^&#]*)');
    const results = regex.exec(location.search);
    
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * Particle class for firework explosion effects
 */
class Particle {
    /**
     * Creates a new particle
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {string} color - RGB color string (e.g., "255, 0, 0")
     */
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Reduced velocity for more controlled animation
        this.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        };
        
        this.alpha = 1;
        this.friction = 0.98; // Higher friction for slower decay
        this.gravity = 0.01;  // Lower gravity for floating effect
        this.size = 2; // Default size, can be overridden
    }

    /**
     * Renders the particle on the canvas
     */
    draw() {
        if (!ctx) return;
        
        const baseSize = this.size || 2;
        
        // Add glow effect for more visual impact
        ctx.save();
        
        // Outer glow (larger, more transparent)
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize * 2, 0, Math.PI * 2);
        const glowAlpha = this.alpha * 0.3;
        ctx.fillStyle = `rgba(${this.color}, ${glowAlpha})`;
        ctx.fill();
        
        // Middle glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize * 1.5, 0, Math.PI * 2);
        const midGlowAlpha = this.alpha * 0.5;
        ctx.fillStyle = `rgba(${this.color}, ${midGlowAlpha})`;
        ctx.fill();
        
        // Core particle (bright)
        ctx.beginPath();
        ctx.arc(this.x, this.y, baseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
        
        // Add white sparkle in center for twinkle effect
        if (this.alpha > 0.7) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, baseSize * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * Updates particle position and properties
     */
    update() {
        // Apply physics
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Fade out slowly
        this.alpha -= 0.005;
    }
}


/**
 * Firework class for animated firework effects
 */
class Firework {
    /**
     * Creates a new firework
     * @param {number} startX - Starting x position
     * @param {number} targetX - Target x position for explosion
     * @param {number} targetY - Target y position for explosion
     * @param {string} fireworkString - Text to display with the firework
     * @param {string} fireworkType - Type of firework shape ('heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly', 'rose', 'sunburst', 'cascade', 'ring', 'crosshatch', 'minecraft')
     */
    constructor(startX, targetX, targetY, fireworkString = 'test', fireworkType = 'heart') {
        // Validate canvas exists
        if (!canvas) {
            console.error('Canvas not initialized for firework');
            return;
        }

        // Position and target
        this.x = startX;
        this.y = canvas.height;
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Display properties
        this.fireworkString = fireworkString || 'test';
        this.textAlpha = 1;
        this.showText = true;
        
        // Firework type (determines explosion shape)
        this.fireworkType = fireworkType || 'heart';
        
        // Explosion properties
        this.explosionX = targetX;
        this.explosionY = targetY;
        
        // Movement properties
        this.speed = 2; // Controlled launch speed
        this.angle = Math.atan2(targetY - this.y, targetX - startX);
        this.velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed
        };
        
        // Visual properties
        this.particles = [];
        this.color = this._generateRandomColor();
    }

    /**
     * Generates a vibrant child-friendly color
     * @private
     * @returns {string} RGB color values as comma-separated string
     */
    _generateRandomColor() {
        // Child-friendly vibrant colors - brighter and more saturated
        const brightColors = [
            '255, 50, 100',   // Hot Pink
            '255, 100, 50',   // Orange Red
            '255, 200, 0',    // Golden Yellow
            '100, 255, 100',  // Bright Green
            '50, 200, 255',   // Sky Blue
            '150, 100, 255',  // Purple
            '255, 50, 200',   // Magenta
            '50, 255, 200',   // Turquoise
            '255, 150, 50',   // Orange
            '200, 50, 255'    // Violet
        ];
        return brightColors[Math.floor(Math.random() * brightColors.length)];
    }

    /**
     * Renders the firework on the canvas
     */
    draw() {
        if (!ctx) return;

        // Draw firework trail with glow effect
        ctx.save();
        
        // Outer glow trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.velocity.x * 2, this.y - this.velocity.y * 2);
        ctx.strokeStyle = `rgba(${this.color}, 0.3)`;
        ctx.lineWidth = 12;
        ctx.stroke();
        
        // Middle glow trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.velocity.x * 1.5, this.y - this.velocity.y * 1.5);
        ctx.strokeStyle = `rgba(${this.color}, 0.6)`;
        ctx.lineWidth = 10;
        ctx.stroke();
        
        // Main trail (bright)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.velocity.x, this.y - this.velocity.y);
        ctx.strokeStyle = `rgb(${this.color})`;
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.restore();

        // Draw text overlay if active
        this._drawText();
    }

    /**
     * Draws the firework text overlay with animations
     * @private
     */
    _drawText() {
        if (!this.showText || this.textAlpha <= 0) return;

        ctx.save();
        
        // Add pulsing effect for first 2 seconds
        const timeSinceExplosion = Date.now() - (this.explosionTime || Date.now());
        let scale = 1;
        if (timeSinceExplosion < 2000) {
            scale = 1 + Math.sin(timeSinceExplosion / 200) * 0.1; // Pulsing effect
        }
        
        // Add colorful outline/shadow for better visibility
        ctx.shadowColor = `rgba(${this.color}, ${this.textAlpha * 0.8})`;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw text with scale
        ctx.translate(this.explosionX, this.explosionY);
        ctx.scale(scale, scale);
        
        // Outline for better readability
        ctx.strokeStyle = `rgba(0, 0, 0, ${this.textAlpha * 0.8})`;
        ctx.lineWidth = 4;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(this.fireworkString, 0, 0);
        
        // Main text with gradient-like effect
        ctx.fillStyle = `rgba(255, 255, 255, ${this.textAlpha})`;
        ctx.fillText(this.fireworkString, 0, 0);
        
        // Fade out text slowly
        this.textAlpha -= 0.002;
        ctx.restore();
    }

    /**
     * Updates firework position
     */
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    /**
     * Generates points along a heart shape
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of heart shape points
     */
    _generateHeartShape(pointCount) {
        const heartPoints = [];
        
        for (let i = 0; i < pointCount; i++) {
            const t = (i / pointCount) * Math.PI * 2;
            // Heart shape parametric equations
            const x = 8 * Math.pow(Math.sin(t), 3);
            const y = 6.5 * Math.cos(t) - 2.5 * Math.cos(2*t) - 1 * Math.cos(3*t) - 0.5 * Math.cos(4*t);
            heartPoints.push({x: x, y: y});
        }
        
        return heartPoints;
    }

    /**
     * Generates points in a circular/burst pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of circle shape points
     */
    _generateCircleShape(pointCount) {
        const circlePoints = [];
        
        for (let i = 0; i < pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            const radius = 8; // Consistent with heart shape scale
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            circlePoints.push({x: x, y: y});
        }
        
        return circlePoints;
    }

    /**
     * Generates points in a star pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of star shape points
     */
    _generateStarShape(pointCount) {
        const starPoints = [];
        const spikes = 5; // Five-pointed star
        
        for (let i = 0; i < pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            // Alternate between outer and inner radius for star effect
            const cycle = (i / pointCount) * spikes;
            const isOuter = Math.sin(cycle * Math.PI * 2) > 0;
            const radius = isOuter ? 8 : 4; // Outer and inner radius
            
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            starPoints.push({x: x, y: y});
        }
        
        return starPoints;
    }

    /**
     * Generates points in a diamond/rhombus pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of diamond shape points
     */
    _generateDiamondShape(pointCount) {
        const diamondPoints = [];
        
        for (let i = 0; i < pointCount; i++) {
            const t = (i / pointCount) * Math.PI * 2;
            // Diamond/rhombus shape using absolute value of sine/cosine
            const radius = 8 / (Math.abs(Math.cos(t)) + Math.abs(Math.sin(t)));
            const x = radius * Math.cos(t);
            const y = radius * Math.sin(t);
            diamondPoints.push({x: x, y: y});
        }
        
        return diamondPoints;
    }

    /**
     * Generates points in a spiral/galaxy pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of spiral shape points
     */
    _generateSpiralShape(pointCount) {
        const spiralPoints = [];
        const arms = 3; // Three spiral arms
        
        for (let i = 0; i < pointCount; i++) {
            const progress = i / pointCount;
            const angle = progress * Math.PI * 4; // Two full rotations
            const radius = 8 * progress; // Expanding radius
            
            // Create multiple spiral arms
            for (let arm = 0; arm < arms; arm++) {
                const armAngle = angle + (arm * Math.PI * 2 / arms);
                const x = radius * Math.cos(armAngle);
                const y = radius * Math.sin(armAngle);
                spiralPoints.push({x: x, y: y});
            }
        }
        
        return spiralPoints;
    }

    /**
     * Generates points in a butterfly pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of butterfly shape points
     */
    _generateButterflyShape(pointCount) {
        const butterflyPoints = [];
        
        for (let i = 0; i < pointCount; i++) {
            const t = (i / pointCount) * Math.PI * 2;
            // Butterfly curve (polar rose variant)
            const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
            const scale = 2.5; // Scale to match other shapes
            const x = scale * r * Math.sin(t);
            const y = scale * r * Math.cos(t);
            butterflyPoints.push({x: x, y: y});
        }
        
        return butterflyPoints;
    }

    /**
     * Generates points in a rose pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of rose shape points
     */
    _generateRoseShape(pointCount) {
        const rosePoints = [];
        const petals = 5; // Five petals for the rose
        
        for (let i = 0; i < pointCount; i++) {
            const t = (i / pointCount) * Math.PI * 2;
            // Rose curve using polar equation: r = cos(k*theta)
            const r = 8 * Math.cos(petals * t);
            const x = Math.abs(r) * Math.cos(t);
            const y = Math.abs(r) * Math.sin(t);
            rosePoints.push({x: x, y: y});
        }
        
        return rosePoints;
    }

    /**
     * Generates points in a sunburst pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of sunburst shape points
     */
    _generateSunburstShape(pointCount) {
        const sunburstPoints = [];
        const rays = 12; // Number of rays
        
        for (let i = 0; i < pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            // Varying ray lengths create sunburst effect
            const rayIndex = Math.floor((i / pointCount) * rays);
            const rayProgress = ((i / pointCount) * rays) - rayIndex;
            // Alternate between long and short rays with smooth transitions
            const radiusMultiplier = 0.5 + 0.5 * (1 - Math.abs(Math.sin(rayIndex * Math.PI)));
            const radius = 4 + 4 * radiusMultiplier * (1 - rayProgress);
            
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            sunburstPoints.push({x: x, y: y});
        }
        
        return sunburstPoints;
    }

    /**
     * Generates points in a cascade/willow pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of cascade shape points
     */
    _generateCascadeShape(pointCount) {
        const cascadePoints = [];
        const streamCount = 8; // Number of cascading streams
        
        for (let i = 0; i < pointCount; i++) {
            const streamIndex = i % streamCount;
            const streamProgress = Math.floor(i / streamCount) / Math.floor(pointCount / streamCount);
            const angle = (streamIndex / streamCount) * Math.PI * 2;
            
            // Start wide at top, curve downward like a willow
            const radius = 8 * (1 - streamProgress * 0.5);
            const dropFactor = streamProgress * 10;
            
            const x = radius * Math.cos(angle) * (1 - streamProgress * 0.3);
            const y = radius * Math.sin(angle) * (1 - streamProgress * 0.3) - dropFactor;
            cascadePoints.push({x: x, y: y});
        }
        
        return cascadePoints;
    }

    /**
     * Generates points in a ring pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of ring shape points
     */
    _generateRingShape(pointCount) {
        const ringPoints = [];
        const rings = 3; // Number of concentric rings
        
        for (let i = 0; i < pointCount; i++) {
            const ringIndex = i % rings;
            const angleProgress = Math.floor(i / rings) / Math.floor(pointCount / rings);
            const angle = angleProgress * Math.PI * 2;
            const radius = 3 + (ringIndex + 1) * 2; // Expanding rings
            
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            ringPoints.push({x: x, y: y});
        }
        
        return ringPoints;
    }

    /**
     * Generates points in a crosshatch/grid pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of crosshatch shape points
     */
    _generateCrosshatchShape(pointCount) {
        const crosshatchPoints = [];
        const lines = 6; // Number of lines in each direction
        
        for (let i = 0; i < pointCount; i++) {
            const progress = i / pointCount;
            const isVertical = Math.floor(progress * lines * 2) % 2 === 0;
            const lineIndex = Math.floor(progress * lines * 2);
            const lineProgress = (progress * lines * 2) - lineIndex;
            
            if (isVertical) {
                // Vertical lines
                const x = -8 + (lineIndex / 2) * (16 / lines);
                const y = -8 + lineProgress * 16;
                crosshatchPoints.push({x: x, y: y});
            } else {
                // Horizontal lines
                const x = -8 + lineProgress * 16;
                const y = -8 + ((lineIndex - 1) / 2) * (16 / lines);
                crosshatchPoints.push({x: x, y: y});
            }
        }
        
        return crosshatchPoints;
    }

    /**
     * Generates points in a Minecraft-style blocky/pixelated pattern
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of Minecraft shape points
     */
    _generateMinecraftShape(pointCount) {
        const minecraftPoints = [];
        const blockSize = 1.5; // Size of each "block" in the pattern
        const gridSize = 8; // Number of blocks in each direction from center
        
        // Create a blocky explosion pattern with multiple layers
        // This creates a cubic/blocky feel like Minecraft blocks exploding
        const layers = 3; // Number of block layers
        
        for (let layer = 0; layer < layers; layer++) {
            const layerRadius = 3 + layer * 2.5; // Expanding layers
            const blocksInLayer = Math.floor(pointCount / (layers * 4)); // Blocks per layer face
            
            // Create blocks on 4 main faces (top, bottom, left, right)
            for (let i = 0; i < blocksInLayer; i++) {
                const progress = i / blocksInLayer;
                const angle = progress * Math.PI * 2;
                
                // Create blocky positions (quantized to grid)
                const rawX = layerRadius * Math.cos(angle);
                const rawY = layerRadius * Math.sin(angle);
                
                // Quantize to block grid for pixelated look
                const blockX = Math.round(rawX / blockSize) * blockSize;
                const blockY = Math.round(rawY / blockSize) * blockSize;
                
                minecraftPoints.push({x: blockX, y: blockY});
                
                // Add some random blocks around each position for texture
                if (Math.random() > 0.5) {
                    minecraftPoints.push({
                        x: blockX + (Math.random() > 0.5 ? blockSize : -blockSize),
                        y: blockY
                    });
                }
                if (Math.random() > 0.5) {
                    minecraftPoints.push({
                        x: blockX,
                        y: blockY + (Math.random() > 0.5 ? blockSize : -blockSize)
                    });
                }
            }
        }
        
        // Add some central explosion blocks
        const centralBlocks = 20;
        for (let i = 0; i < centralBlocks; i++) {
            const angle = (i / centralBlocks) * Math.PI * 2;
            const radius = 2 + Math.random() * 2;
            const x = Math.round((radius * Math.cos(angle)) / blockSize) * blockSize;
            const y = Math.round((radius * Math.sin(angle)) / blockSize) * blockSize;
            minecraftPoints.push({x: x, y: y});
        }
        
        return minecraftPoints;
    }

    /**
     * Gets the shape points based on the selected firework type
     * @private
     * @param {number} pointCount - Number of points to generate
     * @returns {Array<{x: number, y: number}>} Array of shape points
     */
    _getShapePoints(pointCount) {
        // Use instance firework type instead of localStorage
        const fireworkType = this.fireworkType || 'heart';

        // Generate points based on type
        switch (fireworkType) {
            case 'circle':
                return this._generateCircleShape(pointCount);
            case 'star':
                return this._generateStarShape(pointCount);
            case 'diamond':
                return this._generateDiamondShape(pointCount);
            case 'spiral':
                return this._generateSpiralShape(pointCount);
            case 'butterfly':
                return this._generateButterflyShape(pointCount);
            case 'rose':
                return this._generateRoseShape(pointCount);
            case 'sunburst':
                return this._generateSunburstShape(pointCount);
            case 'cascade':
                return this._generateCascadeShape(pointCount);
            case 'ring':
                return this._generateRingShape(pointCount);
            case 'crosshatch':
                return this._generateCrosshatchShape(pointCount);
            case 'minecraft':
                return this._generateMinecraftShape(pointCount);
            case 'heart':
            default:
                return this._generateHeartShape(pointCount);
        }
    }

    /**
     * Creates an explosion effect at the firework's current position
     */
    explode() {
        // Store explosion coordinates and time
        this.explosionX = this.x;
        this.explosionY = this.y;
        this.explosionTime = Date.now();
        
        // Determine effect tier based on firework type
        const isBasicTier = this._isBasicTierFirework();
        
        // Tier-based particle count: basic tier gets simpler effects
        const particleCount = isBasicTier ? 150 : 400;
        const shapePoints = this._getShapePoints(particleCount);

        // Premium tier gets initial flash effect particles (bright white burst)
        if (!isBasicTier) {
            this._addFlashEffect();
        }

        // Create main shape particles with size variation
        for (let i = 0; i < particleCount; i++) {
            const scale = 0.1 + Math.random() * 0.25;
            const particle = new Particle(this.x, this.y, this.color);
            const point = shapePoints[i % shapePoints.length]; // Use modulo to wrap around if needed
            
            // Scale and randomize the velocity based on shape
            particle.velocity.x = point.x * scale;
            particle.velocity.y = -point.y * scale;  // Negative to flip shape right side up
            
            // Add some randomness to make it more natural
            particle.velocity.x += (Math.random() - 0.5) * 0.5;
            particle.velocity.y += (Math.random() - 0.5) * 0.5;
            
            // Vary particle properties for more visual interest
            particle.gravity = 0.01 + Math.random() * 0.005;
            particle.friction = 0.97 + Math.random() * 0.02;
            
            // Add size property for varied particle sizes
            particle.size = 1.5 + Math.random() * 1.5;
            
            this.particles.push(particle);
        }
        
        // Play explosion sound if available
        this._playExplosionSound();

        // Add text display
        this.showText = true;
        setTimeout(() => {
            this.showText = false;
        }, 10000); // Show text for 10 seconds

        // Premium tier gets multiple layers of sparkle effects for more magical feel
        if (!isBasicTier) {
            this._addSparkleEffect();
            
            // Add trailing sparkles with delay for cascading effect
            setTimeout(() => {
                this._addTrailingSparkles();
            }, 200);
        }
    }

    /**
     * Determines if this firework is basic tier (simple effects)
     * @private
     * @returns {boolean} True if basic tier (heart, circle, star), false if premium tier
     */
    _isBasicTierFirework() {
        const basicTierTypes = ['heart', 'circle', 'star'];
        return basicTierTypes.includes(this.fireworkType);
    }

    /**
     * Plays explosion sound effect
     * @private
     */
    _playExplosionSound() {
        try {
            if (typeof explosionSound !== 'undefined' && explosionSound) {
                explosionSound.currentTime = 0;
                explosionSound.play();
            }
        } catch (error) {
            console.warn('Could not play explosion sound:', error);
        }
    }

    /**
     * Adds initial flash effect for explosion
     * @private
     */
    _addFlashEffect() {
        // Create bright white flash particles for initial burst
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            const particle = new Particle(this.x, this.y, '255, 255, 255');
            
            particle.velocity.x = Math.cos(angle) * speed;
            particle.velocity.y = Math.sin(angle) * speed;
            particle.gravity = 0.02;
            particle.friction = 0.95;
            particle.alpha = 1;
            particle.size = 2 + Math.random() * 2;
            
            this.particles.push(particle);
        }
    }

    /**
     * Adds sparkle particles around the explosion
     * @private
     */
    _addSparkleEffect() {
        // More sparkles for magical effect
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            
            // Mix of colored sparkles and white sparkles
            const isWhiteSparkle = Math.random() > 0.5;
            const sparkleColor = isWhiteSparkle ? '255, 255, 255' : this.color;
            const particle = new Particle(this.x, this.y, sparkleColor);
            
            particle.velocity.x = Math.cos(angle) * speed;
            particle.velocity.y = Math.sin(angle) * speed;
            particle.gravity = 0.005;
            particle.friction = 0.995;
            particle.alpha = 0.8;
            particle.size = 1 + Math.random();
            
            this.particles.push(particle);
        }
    }

    /**
     * Adds trailing sparkle particles with delayed effect
     * @private
     */
    _addTrailingSparkles() {
        // Add secondary wave of sparkles for cascading magical effect
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * 0.8;
            const particle = new Particle(this.explosionX, this.explosionY, '255, 255, 200');
            
            particle.velocity.x = Math.cos(angle) * speed;
            particle.velocity.y = Math.sin(angle) * speed;
            particle.gravity = 0.003;
            particle.friction = 0.997;
            particle.alpha = 0.6;
            particle.size = 0.5 + Math.random() * 0.5;
            
            this.particles.push(particle);
        }
    }
}

/**
 * Utility Functions for Firework Animation
 */

/**
 * Sets the canvas size to match the window dimensions
 */
function setCanvasSize() {
    if (!canvas) {
        console.error('Canvas not initialized');
        return;
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * Gets the current city based on IP geolocation
 * @returns {Promise<string>} The current city name or fallback
 */
async function getCurrentCity() {
    try {
        const response = await fetch('https://api.ipapi.is/');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Location data:', data);
        
        return data.location?.city || '未知城市';
    } catch (error) {
        console.error('Error getting location:', error);
        return '未知城市';
    }
}

/**
 * Generates a UUID v4 string
 * @returns {string} A unique identifier string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Main animation loop for fireworks and particles
 */
function animate() {
    if (!ctx || !canvas) {
        console.error('Canvas or context not initialized');
        return;
    }

    requestAnimationFrame(animate);
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const fireworks = window.fireworks || [];
    
    // Update and draw fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const firework = fireworks[i];
        
        if (!firework) continue;
        
        firework.draw();
        firework.update();

        // Check if firework reached target
        const distance = Math.hypot(
            firework.x - firework.targetX,
            firework.y - firework.targetY
        );

        if (distance < 5) {
            firework.explode();
            particles = particles.concat(firework.particles);
            fireworks.splice(i, 1);
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        if (!particle) continue;
        
        particle.draw();
        particle.update();

        // Remove faded particles
        if (particle.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Draw scrolling text
    _drawScrollingText();
}

/**
 * Draws scrolling text on the canvas
 * @private
 */
function _drawScrollingText() {
    if (!ctx || !canvas || !window.texts) return;

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = window.texts[currentTextIndex] || '';
    ctx.fillText(text, canvas.width / 2, textY);

    // Update text position
    textY += 1;
    if (textY > canvas.height) {
        textY = -20;
        currentTextIndex = (currentTextIndex + 1) % window.texts.length;
    }
}


/**
 * Global Variables
 */
let canvas;
let ctx;
let particles = [];
let currentTextIndex = 0;
let textY;
let lastClickTime = 0; // Track last click time for throttling

/**
 * Application Initialization
 * Only initialize on standalone fireworks page (fireworks.html)
 * Check for presence of canvas#canvas element to determine if we're on that page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the standalone fireworks page
    // The standalone page has a canvas element with id="canvas"
    const standaloneCanvas = document.getElementById('canvas');
    if (standaloneCanvas) {
        initializeApplication();
    }
});

/**
 * Initializes the firework application
 */
function initializeApplication() {
    try {
        // Initialize global variables
        window.configId = getUrlParameter('configId');
        window.fireworks = [];
        window.texts = ["点击屏幕有惊喜"];
        
        // Initialize audio
        initializeAudio();
        
        // Setup canvas
        initializeCanvas();
        
        // Setup event handlers
        setupEventHandlers();
        
        // Start animation
        animate();
        
        // Load initial configuration and data
        loadInitialData();
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

/**
 * Initializes audio elements
 */
function initializeAudio() {
    try {
        window.fireworkSound = new Audio('launch.wav');
        window.explosionSound = new Audio('explode.wav');
        
        // Set audio properties
        window.fireworkSound.volume = 0.3;
        window.explosionSound.volume = 0.5;
    } catch (error) {
        console.warn('Error initializing audio:', error);
    }
}

/**
 * Initializes canvas and context
 */
function initializeCanvas() {
    canvas = document.getElementById('canvas');
    
    if (!canvas) {
        throw new Error('Canvas element not found');
    }
    
    ctx = canvas.getContext('2d');
    textY = canvas.height / 2;
    
    // Set initial canvas size
    setCanvasSize();
    
    // Handle window resize
    window.addEventListener('resize', setCanvasSize);
}

/**
 * Sets up event handlers for user interaction
 */
function setupEventHandlers() {
    if (!canvas) return;

    canvas.addEventListener('click', async (e) => {
        try {
            await handleCanvasClick(e);
        } catch (error) {
            console.error('Error handling canvas click:', error);
        }
    });
}

/**
 * Handles canvas click events
 * @param {MouseEvent} e - The click event
 */
async function handleCanvasClick(e) {
    // Load firework launch interval from localStorage (default: 1000ms = 1 second)
    let launchInterval = 1000;
    try {
        const saved = localStorage.getItem('fireworkLaunchInterval');
        if (saved) {
            launchInterval = parseInt(saved, 10);
        }
    } catch (error) {
        console.warn('Could not load firework launch interval, using default:', error);
    }
    
    // Throttle clicks based on the configured interval
    const currentTime = Date.now();
    if (currentTime - lastClickTime < launchInterval) {
        // Too soon, ignore this click
        return;
    }
    lastClickTime = currentTime;
    
    const startX = canvas.width * Math.random();
    const currentCity = window.currentCity || '未知城市';
    
    // Get current firework type from localStorage
    let fireworkType = 'heart';
    try {
        const saved = localStorage.getItem('fireworkType');
        if (saved) {
            fireworkType = saved;
        }
    } catch (error) {
        console.warn('Could not load firework type, using default:', error);
    }
    
    // Create new firework with the selected type
    const firework = new Firework(startX, e.clientX, e.clientY, currentCity, fireworkType);
    window.fireworks.push(firework);
    
    // Play launch sound
    playFireworkSound();
    
    // Upload firework data with firework type
    const fireworkId = generateUUID();
    uploadFirework(fireworkId, 0, e.clientX, e.clientY, currentCity, fireworkType);
}

/**
 * Plays firework launch sound
 */
function playFireworkSound() {
    try {
        if (window.fireworkSound) {
            window.fireworkSound.currentTime = 0;
            window.fireworkSound.play().catch(error => {
                console.warn('Could not play firework sound:', error);
            });
        }
    } catch (error) {
        console.warn('Error playing firework sound:', error);
    }
}
/**
 * Loads initial application data and configuration
 */
async function loadInitialData() {
    try {
        // Load current city
        window.currentCity = await getCurrentCity();
        console.log("Current city:", window.currentCity);
        
        // Load configuration
        await loadConfiguration();
        
        // Setup periodic firework downloads
        setupPeriodicDownloads();
        
        // Load initial fireworks
        await loadInitialFireworks();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

/**
 * Loads application configuration
 * @returns {Promise<void>}
 */
function loadConfiguration() {
    return new Promise((resolve) => {
        getConfig(window.configId, (config) => {
            try {
                if (config == null) {
                    console.log("Extra config is null, using default config");
                    setDefaultTexts();
                } else {
                    setCustomTexts(config);
                }
                resolve();
            } catch (error) {
                console.error('Error processing configuration:', error);
                setDefaultTexts();
                resolve();
            }
        });
    });
}

/**
 * Sets default text messages
 */
function setDefaultTexts() {
    window.texts = [
        "点击屏幕有惊喜",
        "新年快乐",
        "蛇年快乐", 
        "转发好运",
        "转发祝福",
        "点击右下角花1块钱就可以定制祝福语"
    ];
}

/**
 * Sets custom text messages from configuration
 * @param {Object} config - Configuration object
 */
function setCustomTexts(config) {
    const text1 = config.text1 || "新年快乐";
    const text2 = config.text2 || "蛇年快乐";
    const text3 = config.text3 || "转发好运";
    const text4 = config.text4 || "转发祝福";
    const text5 = "点击右下角花1块钱就可以定制祝福语";
    
    window.texts = [
        "点击屏幕有惊喜", 
        text1, 
        text2, 
        text3, 
        text4, 
        text5
    ];
}

/**
 * Sets up periodic firework downloads
 */
function setupPeriodicDownloads() {
    setInterval(async () => {
        try {
            await downloadAndCreateFireworks();
        } catch (error) {
            console.error('Error in periodic firework download:', error);
        }
    }, 10000); // Every 10 seconds
}

/**
 * Downloads fireworks data and creates firework objects
 * @returns {Promise<void>}
 */
function downloadAndCreateFireworks() {
    return new Promise((resolve) => {
        downloadFireworks((dataArray) => {
            try {
                console.log('Downloaded fireworks:', dataArray);
                
                if (dataArray && Array.isArray(dataArray)) {
                    dataArray.forEach(data => {
                        createFireworkFromData(data);
                    });
                }
                resolve();
            } catch (error) {
                console.error('Error creating fireworks from data:', error);
                resolve();
            }
        });
    });
}

/**
 * Creates a firework from downloaded data
 * @param {Object} data - Firework data object
 */
function createFireworkFromData(data) {
    if (!data || !data.x || !data.y) {
        console.warn('Invalid firework data:', data);
        return;
    }

    const startX = canvas.width * Math.random();
    // Use the firework type from the data, default to 'heart' if not specified
    const fireworkType = data.fireworkType || data.type || 'heart';
    const firework = new Firework(startX, data.x, data.y, data.string || 'Unknown', fireworkType);
    
    window.fireworks.push(firework);
    playFireworkSound();
}

/**
 * Loads initial fireworks on application start
 */
async function loadInitialFireworks() {
    try {
        await downloadAndCreateFireworks();
    } catch (error) {
        console.error('Error loading initial fireworks:', error);
    }
}

/**
 * MuseumCheck Integration API
 * Provides integration points for the main MuseumCheck application
 */

/**
 * Creates a fireworks system for a specific container (for modal usage)
 * @param {HTMLElement} container - The container element for the fireworks
 * @returns {Object} Fireworks system instance with start, stop, and launchFirework methods
 */
function createFireworksSystem(container) {
    // Create canvas element
    const localCanvas = document.createElement('canvas');
    localCanvas.style.width = '100%';
    localCanvas.style.height = '100%';
    localCanvas.style.position = 'absolute';
    localCanvas.style.top = '0';
    localCanvas.style.left = '0';
    localCanvas.style.pointerEvents = 'none';
    
    container.appendChild(localCanvas);
    
    const localCtx = localCanvas.getContext('2d');
    const localFireworks = [];
    const localParticles = [];
    let localAnimationId = null;
    let isRunning = false;
    
    // Set canvas dimensions
    const resize = () => {
        localCanvas.width = container.clientWidth;
        localCanvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Local animation loop
    function animateLocal() {
        if (!isRunning) return;
        
        localAnimationId = requestAnimationFrame(animateLocal);
        
        // Clear canvas with fade effect
        localCtx.fillStyle = 'rgba(10, 14, 39, 0.2)';
        localCtx.fillRect(0, 0, localCanvas.width, localCanvas.height);
        
        // Update and draw fireworks
        for (let i = localFireworks.length - 1; i >= 0; i--) {
            const firework = localFireworks[i];
            
            if (!firework) continue;
            
            // Set context for firework drawing
            const originalCtx = ctx;
            const originalCanvas = canvas;
            ctx = localCtx;
            canvas = localCanvas;
            
            firework.draw();
            firework.update();
            
            // Restore original context
            ctx = originalCtx;
            canvas = originalCanvas;
            
            // Check if firework reached target
            const distance = Math.hypot(
                firework.x - firework.targetX,
                firework.y - firework.targetY
            );
            
            if (distance < 5) {
                firework.explode();
                localParticles.push(...firework.particles);
                localFireworks.splice(i, 1);
            }
        }
        
        // Update and draw particles
        for (let i = localParticles.length - 1; i >= 0; i--) {
            const particle = localParticles[i];
            
            if (!particle) continue;
            
            // Set context for particle drawing
            const originalCtx = ctx;
            ctx = localCtx;
            
            particle.draw();
            particle.update();
            
            // Restore original context
            ctx = originalCtx;
            
            // Remove faded particles
            if (particle.alpha <= 0) {
                localParticles.splice(i, 1);
            }
        }
    }
    
    // Return API object
    return {
        start: function() {
            if (isRunning) return;
            isRunning = true;
            animateLocal();
        },
        
        stop: function() {
            isRunning = false;
            if (localAnimationId) {
                cancelAnimationFrame(localAnimationId);
            }
        },
        
        launchFirework: function(ageGroup, childNickname) {
            const startX = localCanvas.width * Math.random();
            const targetX = localCanvas.width * 0.3 + Math.random() * localCanvas.width * 0.4;
            const targetY = localCanvas.height * 0.1 + Math.random() * localCanvas.height * 0.4;
            
            // Create display string
            const displayText = childNickname ? `${childNickname} (${ageGroup})` : ageGroup;
            
            // Get current firework type from localStorage
            let fireworkType = 'heart';
            try {
                const saved = localStorage.getItem('fireworkType');
                if (saved) {
                    fireworkType = saved;
                }
            } catch (error) {
                console.warn('Could not load firework type, using default:', error);
            }
            
            // Set context temporarily for firework creation
            const originalCtx = ctx;
            const originalCanvas = canvas;
            ctx = localCtx;
            canvas = localCanvas;
            
            const firework = new Firework(startX, targetX, targetY, displayText, fireworkType);
            localFireworks.push(firework);
            
            // Restore context
            ctx = originalCtx;
            canvas = originalCanvas;
            
            // Play sound if available
            playFireworkSound();
        },
        
        canvas: localCanvas,
        getParticleCount: function() {
            return localParticles.length + localFireworks.length;
        }
    };
}
