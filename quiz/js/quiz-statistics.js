/**
 * Quiz Statistics
 * 答题统计分析
 * 
 * Tracks and analyzes quiz performance metrics
 */

class QuizStatistics {
    /**
     * Get overall statistics
     * @returns {Object} Statistics object
     */
    static getStatistics() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            return {
                totalSessions: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                accuracy: 0,
                totalPoints: 0,
                bestStreak: 0,
                averageAccuracy: 0,
                totalTime: 0
            };
        }
        
        let totalQuestions = 0;
        let correctAnswers = 0;
        let totalPoints = 0;
        let bestStreak = 0;
        let totalTime = 0;
        
        history.forEach(session => {
            totalQuestions += session.totalQuestions || 0;
            correctAnswers += session.correctCount || 0;
            totalPoints += session.points || 0;
            bestStreak = Math.max(bestStreak, session.bestStreak || 0);
            totalTime += session.duration || 0;
        });
        
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions * 100) : 0;
        const averageAccuracy = history.length > 0 
            ? history.reduce((sum, s) => sum + parseFloat(s.accuracy || 0), 0) / history.length 
            : 0;
        
        return {
            totalSessions: history.length,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            accuracy: accuracy.toFixed(1),
            totalPoints: totalPoints,
            bestStreak: bestStreak,
            averageAccuracy: averageAccuracy.toFixed(1),
            totalTime: totalTime
        };
    }
    
    /**
     * Get statistics for today
     * @returns {Object} Today's statistics
     */
    static getTodayStatistics() {
        const history = this.getHistory();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();
        
        const todaySessions = history.filter(session => {
            return session.timestamp >= todayTimestamp;
        });
        
        if (todaySessions.length === 0) {
            return {
                sessions: 0,
                questions: 0,
                correct: 0,
                points: 0
            };
        }
        
        let questions = 0;
        let correct = 0;
        let points = 0;
        
        todaySessions.forEach(session => {
            questions += session.totalQuestions || 0;
            correct += session.correctCount || 0;
            points += session.points || 0;
        });
        
        return {
            sessions: todaySessions.length,
            questions: questions,
            correct: correct,
            points: points
        };
    }
    
    /**
     * Get statistics by museum
     * @returns {Object} Statistics grouped by museum
     */
    static getMuseumStatistics() {
        const history = this.getHistory();
        const museumStats = {};
        
        history.forEach(session => {
            const museumId = session.museumId || 'random';
            
            if (!museumStats[museumId]) {
                museumStats[museumId] = {
                    sessions: 0,
                    totalQuestions: 0,
                    correctAnswers: 0,
                    points: 0,
                    bestStreak: 0
                };
            }
            
            museumStats[museumId].sessions++;
            museumStats[museumId].totalQuestions += session.totalQuestions || 0;
            museumStats[museumId].correctAnswers += session.correctCount || 0;
            museumStats[museumId].points += session.points || 0;
            museumStats[museumId].bestStreak = Math.max(
                museumStats[museumId].bestStreak,
                session.bestStreak || 0
            );
        });
        
        // Calculate accuracy for each museum
        Object.keys(museumStats).forEach(museumId => {
            const stats = museumStats[museumId];
            stats.accuracy = stats.totalQuestions > 0 
                ? (stats.correctAnswers / stats.totalQuestions * 100).toFixed(1)
                : 0;
        });
        
        return museumStats;
    }
    
    /**
     * Get performance trend (last 7 days)
     * @returns {Array} Daily performance data
     */
    static getPerformanceTrend() {
        const history = this.getHistory();
        const trend = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const dayStart = date.getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            
            const daySessions = history.filter(session => {
                return session.timestamp >= dayStart && session.timestamp < dayEnd;
            });
            
            let questions = 0;
            let correct = 0;
            
            daySessions.forEach(session => {
                questions += session.totalQuestions || 0;
                correct += session.correctCount || 0;
            });
            
            trend.push({
                date: date.toLocaleDateString('zh-CN'),
                sessions: daySessions.length,
                questions: questions,
                correct: correct,
                accuracy: questions > 0 ? (correct / questions * 100).toFixed(1) : 0
            });
        }
        
        return trend;
    }
    
    /**
     * Get weak areas (topics with low accuracy)
     * @returns {Array} Weak areas
     */
    static getWeakAreas() {
        const wrongQuestions = this.getWrongQuestions();
        const tagStats = {};
        
        wrongQuestions.forEach(question => {
            if (question.tags) {
                question.tags.forEach(tag => {
                    if (!tagStats[tag]) {
                        tagStats[tag] = {
                            tag: tag,
                            wrongCount: 0,
                            questions: []
                        };
                    }
                    tagStats[tag].wrongCount++;
                    tagStats[tag].questions.push(question);
                });
            }
        });
        
        // Convert to array and sort by wrong count
        return Object.values(tagStats)
            .sort((a, b) => b.wrongCount - a.wrongCount)
            .slice(0, 5); // Top 5 weak areas
    }
    
    /**
     * Get quiz history
     * @returns {Array} History array
     */
    static getHistory() {
        const stored = localStorage.getItem('quizHistory');
        if (!stored) return [];
        
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse quiz history:', e);
            return [];
        }
    }
    
    /**
     * Get wrong questions
     * @returns {Array} Wrong questions
     */
    static getWrongQuestions() {
        const stored = localStorage.getItem('quizWrongQuestions');
        if (!stored) return [];
        
        try {
            const questions = JSON.parse(stored);
            return questions.filter(q => !q.resolved);
        } catch (e) {
            console.error('Failed to parse wrong questions:', e);
            return [];
        }
    }
    
    /**
     * Get achievement milestones
     * @returns {Array} Milestones with completion status
     */
    static getMilestones() {
        const stats = this.getStatistics();
        
        return [
            {
                id: 'first_quiz',
                name: '初次尝试',
                description: '完成第一次答题',
                completed: stats.totalSessions >= 1,
                progress: Math.min(stats.totalSessions, 1),
                target: 1
            },
            {
                id: 'quiz_10',
                name: '答题新手',
                description: '完成10道题目',
                completed: stats.totalQuestions >= 10,
                progress: Math.min(stats.totalQuestions, 10),
                target: 10
            },
            {
                id: 'quiz_50',
                name: '知识探索者',
                description: '完成50道题目',
                completed: stats.totalQuestions >= 50,
                progress: Math.min(stats.totalQuestions, 50),
                target: 50
            },
            {
                id: 'quiz_100',
                name: '博物馆通',
                description: '完成100道题目',
                completed: stats.totalQuestions >= 100,
                progress: Math.min(stats.totalQuestions, 100),
                target: 100
            },
            {
                id: 'accuracy_80',
                name: '精准射手',
                description: '正确率达到80%',
                completed: parseFloat(stats.accuracy) >= 80,
                progress: Math.min(parseFloat(stats.accuracy), 80),
                target: 80
            },
            {
                id: 'streak_10',
                name: '连胜高手',
                description: '连对10题',
                completed: stats.bestStreak >= 10,
                progress: Math.min(stats.bestStreak, 10),
                target: 10
            }
        ];
    }
    
    /**
     * Export statistics as JSON
     * @returns {string} JSON string
     */
    static exportStatistics() {
        return JSON.stringify({
            overall: this.getStatistics(),
            today: this.getTodayStatistics(),
            byMuseum: this.getMuseumStatistics(),
            trend: this.getPerformanceTrend(),
            weakAreas: this.getWeakAreas(),
            milestones: this.getMilestones(),
            exportDate: new Date().toISOString()
        }, null, 2);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizStatistics;
}
