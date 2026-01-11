/**
 * Quiz Limit Manager
 * 答题限制管理器（防沉迷）
 * 
 * Enforces daily question limits for different age groups
 */

class QuizLimit {
    /**
     * Daily question limits by age group
     */
    static get DAILY_LIMITS() {
        return {
            '3-6': 20,
            '7-12': 30,
            '13-18': 40
        };
    }
    
    /**
     * Check daily limit for an age group
     * @param {string} ageGroup - Age group
     * @returns {Object} Limit status
     */
    static checkDailyLimit(ageGroup) {
        const limit = this.DAILY_LIMITS[ageGroup] || 30;
        const answered = this.getTodayAnsweredCount(ageGroup);
        const remaining = Math.max(0, limit - answered);
        
        return {
            limit: limit,
            answered: answered,
            remaining: remaining,
            canAnswer: remaining > 0,
            canEarnPoints: remaining > 0,
            percentage: Math.min(100, (answered / limit * 100)).toFixed(1)
        };
    }
    
    /**
     * Get number of questions answered today
     * @param {string} ageGroup - Age group
     * @returns {number} Count of questions answered today
     */
    static getTodayAnsweredCount(ageGroup) {
        const dailyData = this.loadDailyData();
        const today = this.getTodayKey();
        
        if (!dailyData[today] || !dailyData[today][ageGroup]) {
            return 0;
        }
        
        return dailyData[today][ageGroup].count || 0;
    }
    
    /**
     * Increment daily question count
     * @param {string} ageGroup - Age group
     * @returns {number} New count
     */
    static incrementDailyCount(ageGroup) {
        const dailyData = this.loadDailyData();
        const today = this.getTodayKey();
        
        // Initialize today's data if needed
        if (!dailyData[today]) {
            dailyData[today] = {};
        }
        
        if (!dailyData[today][ageGroup]) {
            dailyData[today][ageGroup] = {
                count: 0,
                startTime: Date.now()
            };
        }
        
        dailyData[today][ageGroup].count++;
        dailyData[today][ageGroup].lastUpdate = Date.now();
        
        this.saveDailyData(dailyData);
        
        return dailyData[today][ageGroup].count;
    }
    
    /**
     * Get today's key (YYYY-MM-DD format)
     * @private
     */
    static getTodayKey() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    /**
     * Load daily data from localStorage
     * @private
     */
    static loadDailyData() {
        const stored = localStorage.getItem('quizDailyLimit');
        if (!stored) return {};
        
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse daily limit data:', e);
            return {};
        }
    }
    
    /**
     * Save daily data to localStorage
     * @private
     */
    static saveDailyData(data) {
        // Clean up old data (keep only last 7 days)
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const cutoffKey = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;
        
        const cleaned = {};
        Object.keys(data).forEach(key => {
            if (key >= cutoffKey) {
                cleaned[key] = data[key];
            }
        });
        
        localStorage.setItem('quizDailyLimit', JSON.stringify(cleaned));
    }
    
    /**
     * Get daily usage statistics for the week
     * @param {string} ageGroup - Age group
     * @returns {Array} Array of daily usage data
     */
    static getWeeklyUsage(ageGroup) {
        const dailyData = this.loadDailyData();
        const usage = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            const count = dailyData[key] && dailyData[key][ageGroup] 
                ? dailyData[key][ageGroup].count 
                : 0;
            
            usage.push({
                date: key,
                count: count,
                limit: this.DAILY_LIMITS[ageGroup] || 30,
                percentage: (count / (this.DAILY_LIMITS[ageGroup] || 30) * 100).toFixed(1)
            });
        }
        
        return usage;
    }
    
    /**
     * Check if user should see a warning
     * @param {string} ageGroup - Age group
     * @returns {Object|null} Warning object or null
     */
    static getWarning(ageGroup) {
        const status = this.checkDailyLimit(ageGroup);
        
        if (!status.canAnswer) {
            return {
                type: 'limit_reached',
                title: '今日答题已达上限',
                message: `今天已经答了${status.answered}道题，已达到${status.limit}题的每日上限。\n\n明天再来继续学习吧！适度学习，保护视力哦~ 😊`,
                showContinueOption: false
            };
        }
        
        if (status.remaining <= 5) {
            return {
                type: 'approaching_limit',
                title: '接近每日上限',
                message: `今天还可以答${status.remaining}道题就达到上限啦！\n\n合理安排答题时间，劳逸结合哦~ 💪`,
                showContinueOption: true
            };
        }
        
        return null;
    }
    
    /**
     * Reset daily count (for testing purposes)
     * @param {string} ageGroup - Age group
     */
    static resetDailyCount(ageGroup) {
        const dailyData = this.loadDailyData();
        const today = this.getTodayKey();
        
        if (dailyData[today] && dailyData[today][ageGroup]) {
            delete dailyData[today][ageGroup];
            this.saveDailyData(dailyData);
        }
    }
    
    /**
     * Get total questions answered across all time
     * @param {string} ageGroup - Age group
     * @returns {number} Total count
     */
    static getTotalAnswered(ageGroup) {
        const dailyData = this.loadDailyData();
        let total = 0;
        
        Object.keys(dailyData).forEach(date => {
            if (dailyData[date][ageGroup]) {
                total += dailyData[date][ageGroup].count || 0;
            }
        });
        
        return total;
    }
    
    /**
     * Get average daily questions
     * @param {string} ageGroup - Age group
     * @returns {number} Average count
     */
    static getAverageDailyCount(ageGroup) {
        const dailyData = this.loadDailyData();
        const dates = Object.keys(dailyData);
        
        if (dates.length === 0) return 0;
        
        let total = 0;
        dates.forEach(date => {
            if (dailyData[date][ageGroup]) {
                total += dailyData[date][ageGroup].count || 0;
            }
        });
        
        return (total / dates.length).toFixed(1);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizLimit;
}
