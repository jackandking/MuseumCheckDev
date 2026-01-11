/**
 * Unified Points/XP Manager
 * 统一积分/经验值管理器
 * 
 * This module provides a consistent API for all point-earning activities:
 * - Quiz completion
 * - Museum check-ins
 * - Game completions
 * - Photo uploads
 * 
 * Integrates with the existing achievement-gamification.js system
 */

class PointsManager {
    /**
     * Get current total points
     * @returns {number} Total XP/points
     */
    static getPoints() {
        // Load from achievement gamification system if available
        if (window.achievementGamification) {
            return window.achievementGamification.xpData.totalXP || 0;
        }
        
        // Fallback to localStorage
        const xpData = localStorage.getItem('achievementXP');
        if (xpData) {
            try {
                const parsed = JSON.parse(xpData);
                return parsed.totalXP || 0;
            } catch (e) {
                console.error('Failed to parse XP data:', e);
                return 0;
            }
        }
        
        return 0;
    }
    
    /**
     * Get lifetime points (never decreases)
     * @returns {number} Lifetime XP
     */
    static getLifetimePoints() {
        if (window.achievementGamification) {
            return window.achievementGamification.xpData.lifetimeXP || 0;
        }
        
        const xpData = localStorage.getItem('achievementXP');
        if (xpData) {
            try {
                const parsed = JSON.parse(xpData);
                return parsed.lifetimeXP || 0;
            } catch (e) {
                return 0;
            }
        }
        
        return 0;
    }
    
    /**
     * Add points for an activity
     * @param {number} amount - Points to add
     * @param {string} source - Source of points ('quiz', 'checkin', 'game', 'photo')
     * @param {Object} metadata - Additional metadata about the activity
     * @returns {boolean} Success status
     */
    static addPoints(amount, source, metadata = {}) {
        if (typeof amount !== 'number' || amount === 0) {
            console.warn('Invalid points amount:', amount);
            return false;
        }
        
        // Use achievement gamification system if available
        if (window.achievementGamification) {
            window.achievementGamification.addXP(amount);
            
            // Track the source for analytics
            this.trackPointsSource(amount, source, metadata);
            
            return true;
        }
        
        // Fallback: manually update localStorage
        let xpData = { totalXP: 0, lifetimeXP: 0, level: 1, sources: {} };
        const stored = localStorage.getItem('achievementXP');
        if (stored) {
            try {
                xpData = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse XP data:', e);
            }
        }
        
        xpData.totalXP = (xpData.totalXP || 0) + amount;
        xpData.lifetimeXP = (xpData.lifetimeXP || 0) + Math.abs(amount);
        
        // Track source
        xpData.sources = xpData.sources || {};
        xpData.sources[source] = (xpData.sources[source] || 0) + amount;
        
        localStorage.setItem('achievementXP', JSON.stringify(xpData));
        
        this.trackPointsSource(amount, source, metadata);
        
        return true;
    }
    
    /**
     * Track points source for analytics
     * @private
     */
    static trackPointsSource(amount, source, metadata) {
        // Get or create points history
        let history = [];
        const stored = localStorage.getItem('pointsHistory');
        if (stored) {
            try {
                history = JSON.parse(stored);
            } catch (e) {
                history = [];
            }
        }
        
        // Add new entry
        history.push({
            amount,
            source,
            metadata,
            timestamp: Date.now()
        });
        
        // Keep only last 100 entries to prevent unbounded growth
        if (history.length > 100) {
            history = history.slice(-100);
        }
        
        localStorage.setItem('pointsHistory', JSON.stringify(history));
    }
    
    /**
     * Get points history
     * @param {string} source - Optional filter by source
     * @returns {Array} Points history entries
     */
    static getHistory(source = null) {
        const stored = localStorage.getItem('pointsHistory');
        if (!stored) return [];
        
        try {
            const history = JSON.parse(stored);
            if (source) {
                return history.filter(entry => entry.source === source);
            }
            return history;
        } catch (e) {
            console.error('Failed to parse points history:', e);
            return [];
        }
    }
    
    /**
     * Get points breakdown by source
     * @returns {Object} Points by source
     */
    static getBreakdown() {
        const history = this.getHistory();
        const breakdown = {};
        
        history.forEach(entry => {
            if (!breakdown[entry.source]) {
                breakdown[entry.source] = 0;
            }
            breakdown[entry.source] += entry.amount;
        });
        
        return breakdown;
    }
    
    /**
     * Check if user has enough points
     * @param {number} amount - Points required
     * @returns {boolean} True if user has enough points
     */
    static hasPoints(amount) {
        return this.getPoints() >= amount;
    }
    
    /**
     * Spend points (returns false if insufficient)
     * @param {number} amount - Points to spend
     * @param {string} purpose - What the points are spent on
     * @returns {boolean} Success status
     */
    static spendPoints(amount, purpose) {
        if (!this.hasPoints(amount)) {
            return false;
        }
        
        // Deduct points by adding negative amount
        return this.addPoints(-amount, 'spent', { purpose });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PointsManager;
}
