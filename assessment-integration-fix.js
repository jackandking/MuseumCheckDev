// Assessment Integration Fix
// This file contains the fixes for integrating assessment results with achievement system

class IntegratedAchievementSystem {
    constructor(museumCheckApp) {
        this.app = museumCheckApp;
        this.assessmentResults = this.loadAssessmentResults();
    }

    loadAssessmentResults() {
        try {
            return JSON.parse(localStorage.getItem('assessmentResults') || '{}');
        } catch (error) {
            console.error('Failed to load assessment results:', error);
            return {};
        }
    }

    // Fix 1: Ensure assessment score is always 0-100 scale
    normalizeAssessmentScore(parentAnswers, childAnswers) {
        const parentScore = parentAnswers.reduce((sum, answer) => sum + answer, 0);
        const childScore = childAnswers.reduce((sum, answer) => sum + answer, 0);
        
        // Each answer: 0-3 points, 5 questions per questionnaire, 2 questionnaires
        const maxPossibleScore = 5 * 2 * 3; // = 30 points total
        const totalScore = parentScore + childScore;
        
        // Ensure score is always 0-100
        return Math.round((totalScore / maxPossibleScore) * 100);
    }

    // Fix 2: Calculate integrated achievement score combining visit count and assessment quality
    calculateIntegratedAchievements(visitedCount) {
        const achievements = [];
        
        // Get assessment quality metrics
        const assessmentQuality = this.getAssessmentQuality();
        const hasHighQualityAssessments = assessmentQuality.averageScore >= 70;
        const assessmentCount = assessmentQuality.count;
        
        // 🥉 基础层：单馆探索成就（鼓励开始）
        const basicMilestones = [
            { visits: 1, name: '博物馆初探者', emoji: '🌱', description: '迈出文化探索第一步' },
            { visits: 3, name: '文化体验者', emoji: '⭐', description: '体验多元文化魅力' },
            { visits: 5, name: '探索新手', emoji: '🎯', description: '稳步深入文化世界' },
        ];
        
        // 🥈 进阶层：多馆探索 + 亲子互动成就（鼓励广度和质量）
        const intermediateMilestones = [
            { 
                visits: 10, 
                name: '亲子文化使者', 
                emoji: '🤝', 
                description: '探索10家博物馆，开始重视亲子互动质量',
                requiresAssessment: true,
                minAssessmentScore: 60
            },
            { 
                visits: 15, 
                name: '深度陪伴家长', 
                emoji: '💝', 
                description: '15家博物馆 + 高质量亲子互动',
                requiresAssessment: true,
                minAssessmentScore: 70
            },
        ];
        
        // 🥇 高级层：全方位文化教育成就（鼓励深度和持续性）
        const advancedMilestones = [
            { 
                visits: 25, 
                name: '卓越亲子教育者', 
                emoji: '🏆', 
                description: '25家博物馆 + 卓越亲子关系',
                requiresAssessment: true,
                minAssessmentScore: 80,
                minAssessmentCount: 5
            },
            { 
                visits: 50, 
                name: '文化传承大使', 
                emoji: '👑', 
                description: '深度文化探索 + 家庭教育典范',
                requiresAssessment: true,
                minAssessmentScore: 85,
                minAssessmentCount: 10
            }
        ];

        // Process all milestones
        [...basicMilestones, ...intermediateMilestones, ...advancedMilestones].forEach(milestone => {
            const visitRequirementMet = visitedCount >= milestone.visits;
            let assessmentRequirementMet = true;
            
            if (milestone.requiresAssessment) {
                assessmentRequirementMet = 
                    assessmentQuality.averageScore >= (milestone.minAssessmentScore || 0) &&
                    assessmentCount >= (milestone.minAssessmentCount || 1);
            }
            
            if (visitRequirementMet && assessmentRequirementMet) {
                achievements.push({
                    ...milestone,
                    achieved: true,
                    date: new Date().toISOString(),
                    level: milestone.visits <= 5 ? 'basic' : milestone.visits <= 15 ? 'intermediate' : 'advanced'
                });
            } else if (visitRequirementMet || (visitedCount >= milestone.visits * 0.8)) {
                // Show as goal if close to achieving
                achievements.push({
                    ...milestone,
                    achieved: false,
                    progress: visitedCount,
                    assessmentProgress: assessmentQuality,
                    requirements: {
                        visits: milestone.visits,
                        minAssessmentScore: milestone.minAssessmentScore,
                        minAssessmentCount: milestone.minAssessmentCount
                    }
                });
            }
        });

        return achievements;
    }

    // Get assessment quality metrics
    getAssessmentQuality() {
        const results = Object.values(this.assessmentResults);
        if (results.length === 0) {
            return { averageScore: 0, count: 0, trend: 'insufficient' };
        }

        const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
        const recentResults = results.slice(-5); // Last 5 assessments
        const recentAverage = recentResults.reduce((sum, result) => sum + result.score, 0) / recentResults.length;
        
        let trend = 'stable';
        if (recentResults.length >= 3) {
            const firstHalf = recentResults.slice(0, Math.floor(recentResults.length / 2));
            const secondHalf = recentResults.slice(Math.floor(recentResults.length / 2));
            const firstAvg = firstHalf.reduce((sum, result) => sum + result.score, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, result) => sum + result.score, 0) / secondHalf.length;
            
            if (secondAvg > firstAvg + 10) trend = 'improving';
            else if (firstAvg > secondAvg + 10) trend = 'declining';
        }

        return {
            averageScore: Math.round(averageScore),
            count: results.length,
            trend: trend,
            recentAverage: Math.round(recentAverage)
        };
    }

    // Fix 3: Generate integrated achievement display with clear progression
    generateIntegratedAchievementHTML() {
        const visitedCount = this.app.visitedMuseums.length;
        const achievements = this.calculateIntegratedAchievements(visitedCount);
        const assessmentQuality = this.getAssessmentQuality();

        return `
            <div class="integrated-achievement-summary">
                <h3>🎯 我的文化探索成就</h3>
                <div class="achievement-overview">
                    <div class="metric-card">
                        <div class="metric-number">${visitedCount}</div>
                        <div class="metric-label">博物馆探索</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-number">${assessmentQuality.averageScore}</div>
                        <div class="metric-label">亲子互动质量</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-number">${achievements.filter(a => a.achieved).length}</div>
                        <div class="metric-label">获得成就</div>
                    </div>
                </div>
                
                <div class="achievement-progression">
                    <h4>📈 成就进阶路径</h4>
                    <div class="progression-levels">
                        ${this.generateProgressionLevelsHTML(achievements)}
                    </div>
                </div>
                
                <div class="next-goals">
                    <h4>🎯 下一个目标</h4>
                    ${this.generateNextGoalsHTML(achievements, visitedCount, assessmentQuality)}
                </div>
            </div>
        `;
    }

    generateProgressionLevelsHTML(achievements) {
        const levels = {
            basic: { name: '🥉 探索入门', color: '#cd7f32', achievements: [] },
            intermediate: { name: '🥈 深度体验', color: '#c0c0c0', achievements: [] },
            advanced: { name: '🥇 文化大师', color: '#ffd700', achievements: [] }
        };

        achievements.forEach(achievement => {
            if (levels[achievement.level]) {
                levels[achievement.level].achievements.push(achievement);
            }
        });

        return Object.entries(levels).map(([level, data]) => `
            <div class="level-section ${level}">
                <div class="level-header" style="border-left: 4px solid ${data.color}">
                    <h5>${data.name}</h5>
                    <span class="level-count">${data.achievements.filter(a => a.achieved).length}/${data.achievements.length}</span>
                </div>
                <div class="level-achievements">
                    ${data.achievements.map(a => `
                        <div class="achievement-item ${a.achieved ? 'achieved' : 'pending'}">
                            <span class="achievement-emoji">${a.emoji}</span>
                            <div class="achievement-details">
                                <div class="achievement-name">${a.name}</div>
                                <div class="achievement-description">${a.description}</div>
                                ${!a.achieved && a.requirements ? this.generateRequirementsHTML(a.requirements, a.progress, a.assessmentProgress) : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    generateRequirementsHTML(requirements, visitProgress, assessmentProgress) {
        return `
            <div class="requirements">
                <div class="requirement">
                    📍 博物馆: ${visitProgress || 0}/${requirements.visits}
                </div>
                ${requirements.minAssessmentScore ? `
                    <div class="requirement">
                        💝 亲子质量: ${assessmentProgress ? assessmentProgress.averageScore : 0}/${requirements.minAssessmentScore}
                    </div>
                ` : ''}
                ${requirements.minAssessmentCount ? `
                    <div class="requirement">
                        📊 测评次数: ${assessmentProgress ? assessmentProgress.count : 0}/${requirements.minAssessmentCount}
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateNextGoalsHTML(achievements, visitedCount, assessmentQuality) {
        const nextGoal = achievements.find(a => !a.achieved);
        if (!nextGoal) {
            return `
                <div class="congratulations">
                    <div class="congrat-icon">🎊</div>
                    <h5>恭喜！您已经成为文化教育的典范！</h5>
                    <p>继续保持这种高质量的亲子文化探索，让文化传承在家庭中开花结果。</p>
                </div>
            `;
        }

        const visitGap = Math.max(0, nextGoal.visits - visitedCount);
        const assessmentGap = nextGoal.minAssessmentScore ? Math.max(0, nextGoal.minAssessmentScore - assessmentQuality.averageScore) : 0;
        const assessmentCountGap = nextGoal.minAssessmentCount ? Math.max(0, nextGoal.minAssessmentCount - assessmentQuality.count) : 0;

        return `
            <div class="next-goal">
                <div class="goal-icon">${nextGoal.emoji}</div>
                <div class="goal-details">
                    <h5>${nextGoal.name}</h5>
                    <p>${nextGoal.description}</p>
                    <div class="goal-progress">
                        ${visitGap > 0 ? `<div class="progress-item">📍 还需参观 <strong>${visitGap}家</strong> 博物馆</div>` : ''}
                        ${assessmentGap > 0 ? `<div class="progress-item">💝 需提升亲子互动质量 <strong>${assessmentGap}分</strong></div>` : ''}
                        ${assessmentCountGap > 0 ? `<div class="progress-item">📊 还需完成 <strong>${assessmentCountGap}次</strong> 亲子测评</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

// Export for integration into main application
window.IntegratedAchievementSystem = IntegratedAchievementSystem;