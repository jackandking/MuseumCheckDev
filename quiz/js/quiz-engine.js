/**
 * Quiz Engine
 * 答题引擎核心
 * 
 * Manages quiz sessions, answer checking, scoring, and wrong question tracking
 */

class QuizEngine {
    constructor() {
        this.currentSession = null;
        this.wrongQuestions = this.loadWrongQuestions();
        this.sessionHistory = this.loadSessionHistory();
    }
    
    /**
     * Start a new quiz session
     * @param {string} museumId - Museum ID (null for random mode)
     * @param {string} ageGroup - Age group
     * @param {string} mode - 'normal', 'daily', 'random', 'wrong'
     * @returns {Object} Session object or error object if blocked
     */
    startSession(museumId, ageGroup = '7-12', mode = 'normal') {
        // Check if questions are exhausted (all answered, no wrong questions)
        // Skip this check for 'wrong' mode since that's specifically for reviewing mistakes
        if (mode !== 'wrong' && typeof QuizLimit !== 'undefined' && typeof QuizData !== 'undefined') {
            const totalQuestions = QuizData.getAllAvailableQuestions(ageGroup).length;
            const wrongCount = this.getWrongQuestions(true).length;
            const exhaustedStatus = QuizLimit.checkQuestionsExhausted(ageGroup, totalQuestions, wrongCount);
            
            if (exhaustedStatus.exhausted) {
                return {
                    blocked: true,
                    reason: 'questions_exhausted',
                    title: '今日题目已全部完成',
                    message: '太棒了！你今天已经把所有题目都答过了，而且没有错题需要复习。\n\n去探索新的博物馆，明天会有更多题目哦~ 🎉'
                };
            }
        }
        
        let questions = [];
        
        if (mode === 'daily') {
            // Daily challenge: 5 random questions
            questions = QuizData.getRandomQuestions(5, ageGroup);
        } else if (mode === 'random') {
            // Random mode: 10 random questions from all visited museums
            questions = QuizData.getRandomQuestions(10, ageGroup);
        } else if (mode === 'wrong') {
            // Wrong questions mode: review mistakes
            questions = this.getWrongQuestions().slice(0, 10);
        } else if (museumId) {
            // Specific museum mode
            questions = QuizData.generateQuestionsForMuseum(museumId, ageGroup);
            // Shuffle and take up to 10 questions
            questions = questions.sort(() => Math.random() - 0.5).slice(0, 10);
        }
        
        // Create session
        this.currentSession = {
            id: this.generateSessionId(),
            museumId: museumId,
            ageGroup: ageGroup,
            mode: mode,
            questions: questions,
            currentIndex: 0,
            answers: [],
            correctCount: 0,
            streak: 0,
            bestStreak: 0,
            sessionPoints: 0,
            startTime: Date.now(),
            endTime: null
        };
        
        return this.currentSession;
    }
    
    /**
     * Get current question
     * @returns {Object|null} Current question or null if session complete
     */
    getCurrentQuestion() {
        if (!this.currentSession) return null;
        
        const { questions, currentIndex } = this.currentSession;
        if (currentIndex >= questions.length) return null;
        
        return questions[currentIndex];
    }
    
    /**
     * Submit answer for current question
     * @param {number} answerIndex - Selected answer index
     * @returns {Object} Result object with feedback
     */
    submitAnswer(answerIndex) {
        if (!this.currentSession) {
            throw new Error('No active session');
        }
        
        const question = this.getCurrentQuestion();
        if (!question) {
            throw new Error('No current question');
        }
        
        const isCorrect = answerIndex === question.correctAnswer;
        const points = isCorrect ? question.points : 0;
        
        // Update streak
        if (isCorrect) {
            this.currentSession.streak++;
            this.currentSession.bestStreak = Math.max(
                this.currentSession.bestStreak,
                this.currentSession.streak
            );
        } else {
            this.currentSession.streak = 0;
            // Add to wrong questions
            this.addWrongQuestion(question, answerIndex);
        }
        
        // Update counters
        if (isCorrect) {
            this.currentSession.correctCount++;
        }
        
        // Calculate points with streak bonus
        let earnedPoints = points;
        if (isCorrect && this.currentSession.streak >= 5) {
            // Bonus for 5+ streak
            earnedPoints += 10;
        }
        
        this.currentSession.sessionPoints += earnedPoints;
        
        // Record answer
        this.currentSession.answers.push({
            questionId: question.id,
            selectedAnswer: answerIndex,
            correctAnswer: question.correctAnswer,
            isCorrect: isCorrect,
            points: earnedPoints,
            timestamp: Date.now()
        });
        
        // Record question ID for daily deduplication
        if (typeof QuizLimit !== 'undefined') {
            QuizLimit.recordAnsweredQuestion(question.id, this.currentSession.ageGroup);
        }
        
        return {
            isCorrect: isCorrect,
            correctAnswer: question.correctAnswer,
            points: earnedPoints,
            explanation: question.explanation,
            streak: this.currentSession.streak
        };
    }
    
    /**
     * Move to next question
     */
    nextQuestion() {
        if (!this.currentSession) return;
        this.currentSession.currentIndex++;
    }
    
    /**
     * Check if session is complete
     * @returns {boolean}
     */
    isSessionComplete() {
        if (!this.currentSession) return true;
        return this.currentSession.currentIndex >= this.currentSession.questions.length;
    }
    
    /**
     * Complete current session and return results
     * @returns {Object} Session results
     */
    completeSession() {
        if (!this.currentSession) {
            throw new Error('No active session');
        }
        
        this.currentSession.endTime = Date.now();
        const duration = Math.floor((this.currentSession.endTime - this.currentSession.startTime) / 1000);
        
        const results = {
            sessionId: this.currentSession.id,
            totalQuestions: this.currentSession.questions.length,
            correctCount: this.currentSession.correctCount,
            accuracy: (this.currentSession.correctCount / this.currentSession.questions.length * 100).toFixed(1),
            totalPoints: this.currentSession.sessionPoints,
            bestStreak: this.currentSession.bestStreak,
            duration: duration
        };
        
        // Save to history
        this.saveSessionToHistory(this.currentSession);
        
        // Award points
        if (this.currentSession.sessionPoints > 0) {
            PointsManager.addPoints(this.currentSession.sessionPoints, 'quiz', {
                mode: this.currentSession.mode,
                museumId: this.currentSession.museumId,
                correctCount: this.currentSession.correctCount,
                totalQuestions: this.currentSession.questions.length
            });
        }
        
        // Clear current session
        this.currentSession = null;
        
        return results;
    }
    
    /**
     * Add question to wrong questions list
     * @private
     */
    addWrongQuestion(question, selectedAnswer) {
        // Check if already in wrong questions
        const existingIndex = this.wrongQuestions.findIndex(q => q.id === question.id);
        
        const wrongEntry = {
            ...question,
            selectedAnswer: selectedAnswer,
            wrongCount: 1,
            lastAttempt: Date.now(),
            resolved: false
        };
        
        if (existingIndex >= 0) {
            // Update existing entry
            this.wrongQuestions[existingIndex].wrongCount++;
            this.wrongQuestions[existingIndex].lastAttempt = Date.now();
            this.wrongQuestions[existingIndex].resolved = false;
        } else {
            // Add new entry
            this.wrongQuestions.push(wrongEntry);
        }
        
        this.saveWrongQuestions();
    }
    
    /**
     * Mark a wrong question as resolved
     * @param {string} questionId - Question ID
     */
    resolveWrongQuestion(questionId) {
        const question = this.wrongQuestions.find(q => q.id === questionId);
        if (question) {
            question.resolved = true;
            this.saveWrongQuestions();
        }
    }
    
    /**
     * Get all wrong questions
     * @param {boolean} unresolvedOnly - Only return unresolved questions
     * @returns {Array} Wrong questions
     */
    getWrongQuestions(unresolvedOnly = true) {
        if (unresolvedOnly) {
            return this.wrongQuestions.filter(q => !q.resolved);
        }
        return this.wrongQuestions;
    }
    
    /**
     * Load wrong questions from localStorage
     * @private
     */
    loadWrongQuestions() {
        const stored = localStorage.getItem('quizWrongQuestions');
        if (!stored) return [];
        
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse wrong questions:', e);
            return [];
        }
    }
    
    /**
     * Save wrong questions to localStorage
     * @private
     */
    saveWrongQuestions() {
        localStorage.setItem('quizWrongQuestions', JSON.stringify(this.wrongQuestions));
    }
    
    /**
     * Load session history from localStorage
     * @private
     */
    loadSessionHistory() {
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
     * Save session to history
     * @private
     */
    saveSessionToHistory(session) {
        this.sessionHistory.push({
            id: session.id,
            museumId: session.museumId,
            mode: session.mode,
            totalQuestions: session.questions.length,
            correctCount: session.correctCount,
            accuracy: (session.correctCount / session.questions.length * 100).toFixed(1),
            points: session.sessionPoints,
            bestStreak: session.bestStreak,
            duration: Math.floor((session.endTime - session.startTime) / 1000),
            timestamp: session.endTime
        });
        
        // Keep only last 50 sessions
        if (this.sessionHistory.length > 50) {
            this.sessionHistory = this.sessionHistory.slice(-50);
        }
        
        localStorage.setItem('quizHistory', JSON.stringify(this.sessionHistory));
    }
    
    /**
     * Get quiz progress for a specific museum
     * @param {string} museumId - Museum ID
     * @returns {Object} Progress data
     */
    getMuseumProgress(museumId) {
        const totalQuestions = QuizData.generateQuestionsForMuseum(museumId, '7-12').length;
        const museumSessions = this.sessionHistory.filter(s => s.museumId === museumId);
        
        let answered = 0;
        let correctAnswers = 0;
        
        museumSessions.forEach(session => {
            answered += session.totalQuestions;
            correctAnswers += session.correctCount;
        });
        
        const accuracy = answered > 0 ? (correctAnswers / answered * 100).toFixed(1) : 0;
        
        // Calculate stars based on accuracy (0-3 stars)
        let stars = 0;
        if (accuracy >= 90) stars = 3;
        else if (accuracy >= 70) stars = 2;
        else if (accuracy >= 50) stars = 1;
        
        return {
            total: totalQuestions,
            answered: answered,
            accuracy: accuracy,
            stars: stars
        };
    }
    
    /**
     * Generate unique session ID
     * @private
     */
    generateSessionId() {
        return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get session history
     * @param {number} limit - Maximum number of sessions to return
     * @returns {Array} Session history
     */
    getHistory(limit = 10) {
        return this.sessionHistory.slice(-limit).reverse();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizEngine;
}
