/**
 * 游戏上下文管理器
 * 负责在打卡页面和游戏页面之间传递数据
 * 使用 localStorage 实现，兼容微信小程序等环境
 */

class GameContextManager {
    constructor() {
        this.CONTEXT_KEY = 'museumcheck_game_context';
        this.RESULT_KEY = 'museumcheck_game_result';
    }

    /**
     * 保存游戏上下文（跳转到游戏前调用）
     * @param {Object} context - 游戏上下文数据
     */
    saveContext(context) {
        try {
            const gameContext = {
                // 基础信息
                museumId: context.museumId,
                museumName: context.museumName,
                taskIndex: context.taskIndex,
                
                // 博物馆详细信息
                museum: context.museum,
                
                // 当前任务信息
                currentTask: context.currentTask,
                
                // 用户状态
                userPoints: context.userPoints || 0,
                userLevel: context.userLevel || 1,
                
                // 打卡状态（用于返回后恢复）
                checkinState: {
                    completedTasks: context.completedTasks || [],
                    taskPhotos: context.taskPhotos || {},
                    ageGroup: context.ageGroup
                },
                
                // 游戏配置
                gameConfig: context.gameConfig || {
                    difficulty: 'normal',
                    enableQuiz: true,
                    quizReward: 10
                },
                
                // 时间戳
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.CONTEXT_KEY, JSON.stringify(gameContext));
            console.log('[GameContext] Context saved:', gameContext);
            return true;
        } catch (error) {
            console.error('[GameContext] Failed to save context:', error);
            return false;
        }
    }

    /**
     * 获取游戏上下文（游戏页面加载时调用）
     * @returns {Object|null} 游戏上下文数据
     */
    getContext() {
        try {
            const contextStr = localStorage.getItem(this.CONTEXT_KEY);
            if (!contextStr) {
                console.warn('[GameContext] No context found');
                return null;
            }
            
            const context = JSON.parse(contextStr);
            
            // 检查是否过期（超过1小时）
            const age = Date.now() - context.timestamp;
            if (age > 60 * 60 * 1000) {
                console.warn('[GameContext] Context expired');
                this.clearContext();
                return null;
            }
            
            console.log('[GameContext] Context loaded:', context);
            return context;
        } catch (error) {
            console.error('[GameContext] Failed to load context:', error);
            return null;
        }
    }

    /**
     * 清除游戏上下文
     */
    clearContext() {
        try {
            localStorage.removeItem(this.CONTEXT_KEY);
            console.log('[GameContext] Context cleared');
        } catch (error) {
            console.error('[GameContext] Failed to clear context:', error);
        }
    }

    /**
     * 保存游戏结果（游戏结束时调用）
     * @param {Object} result - 游戏结果数据
     */
    saveResult(result) {
        try {
            const gameResult = {
                gameType: result.gameType,
                score: result.score || 0,
                timeSeconds: result.timeSeconds || 0,
                
                // 扩展数据
                quizAnswered: result.quizAnswered || 0,
                quizCorrect: result.quizCorrect || 0,
                pointsEarned: result.pointsEarned || 0,
                achievements: result.achievements || [],
                
                // 游戏特定数据
                gameData: result.gameData || {},
                
                // 时间戳
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.RESULT_KEY, JSON.stringify(gameResult));
            console.log('[GameContext] Result saved:', gameResult);
            return true;
        } catch (error) {
            console.error('[GameContext] Failed to save result:', error);
            return false;
        }
    }

    /**
     * 获取游戏结果（返回打卡页面后调用）
     * @returns {Object|null} 游戏结果数据
     */
    getResult() {
        try {
            const resultStr = localStorage.getItem(this.RESULT_KEY);
            if (!resultStr) {
                return null;
            }
            
            const result = JSON.parse(resultStr);
            console.log('[GameContext] Result loaded:', result);
            return result;
        } catch (error) {
            console.error('[GameContext] Failed to load result:', error);
            return null;
        }
    }

    /**
     * 清除游戏结果
     */
    clearResult() {
        try {
            localStorage.removeItem(this.RESULT_KEY);
            console.log('[GameContext] Result cleared');
        } catch (error) {
            console.error('[GameContext] Failed to clear result:', error);
        }
    }

    /**
     * 清除所有数据
     */
    clearAll() {
        this.clearContext();
        this.clearResult();
    }
}

// 创建全局实例
window.GameContextManager = new GameContextManager();
