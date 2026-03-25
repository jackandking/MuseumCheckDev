// Event Wall Service - extracted standalone module
// Tracks and manages user events to KV store for event wall display
class EventWallService {
    constructor() {
        this.kvStoreEndpoint = REMOTE_STORAGE_CONFIG.API_ENDPOINT;
        this.eventKey = 'museumcheck-events';
        this.eventTTL = 2592000; // 30 days in seconds
        this.batchSize = 10; // Batch events before sending
        this.pendingEvents = [];
        this.sendTimer = null;
        this.sendDelay = 2000; // 2 seconds delay before sending batch
    }
    
    /**
     * Record an event to the event wall
     */
    recordEvent(eventType, title, description = '', parameters = {}) {
        try {
            // Get user ID from localStorage
            const userId = localStorage.getItem('user_id') || 'anonymous';
            console.log('childNickname before event:', localStorage.getItem('childNickname'));
            let childNickname = localStorage.getItem('childNickname');
            if (!childNickname || childNickname.trim() === '') {
                childNickname = '小淘气';
            }
            
            // Create event object
            const event = {
                id: this.generateEventId(),
                eventType: eventType,
                eventName: title,
                title: title,
                description: description,
                parameters: parameters,
                userId: userId,
                childNickname: childNickname,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            // Add to pending events
            this.pendingEvents.push(event);
            
            // Schedule batch send
            this.scheduleBatchSend();
            
            console.log('Event recorded for event wall:', eventType, title);
            
        } catch (error) {
            console.error('Failed to record event:', error);
        }
    }
    
    generateEventId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `event-${timestamp}-${random}`;
    }
    
    scheduleBatchSend() {
        if (this.sendTimer) {
            clearTimeout(this.sendTimer);
        }
        if (this.pendingEvents.length >= this.batchSize) {
            this.sendBatch();
            return;
        }
        this.sendTimer = setTimeout(() => {
            this.sendBatch();
        }, this.sendDelay);
    }
    
    async sendBatch() {
        if (this.pendingEvents.length === 0) return;
        const eventsToSend = [...this.pendingEvents];
        this.pendingEvents = [];
        const promises = eventsToSend.map(event => this.sendEventToKVStore(event));
        try {
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`Event batch sent: ${successful} successful, ${failed} failed`);
            if (failed > 0) {
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        this.pendingEvents.push(eventsToSend[index]);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to send event batch:', error);
            this.pendingEvents.push(...eventsToSend);
        }
    }
    
    async sendEventToKVStore(event) {
        try {
            const expireAt = Math.floor(Date.now() / 1000) + this.eventTTL;
            const response = await fetch(this.kvStoreEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: this.eventKey, sortKey: event.id, value: JSON.stringify(event), expireAt: expireAt })
            });
            if (!response.ok) throw new Error(`KV store returned ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to send event to KV store:', error);
            throw error;
        }
    }
    
    async flush() {
        if (this.sendTimer) { clearTimeout(this.sendTimer); this.sendTimer = null; }
        await this.sendBatch();
    }
    
    trackMuseumVisit(museumId, museumName) {
        this.recordEvent('visit', '参观博物馆', `${museumName}`, { museumId, museumName });
    }
    
    trackChecklistComplete(museumId, museumName, checklistType, itemCount) {
        this.recordEvent('checklist', '完成清单', `完成 ${museumName} 的${checklistType === 'parent' ? '家长准备' : '孩子任务'}清单 (${itemCount}项)`, { museumId, museumName, checklistType, itemCount });
    }
    
    trackTaskComplete(museumId, museumName, checklistType, taskDescription, ageGroup) {
        this.recordEvent('task', '完成任务', `完成 ${museumName} 的${checklistType === 'parent' ? '家长准备' : '孩子任务'}: ${taskDescription}`, { museumId, museumName, checklistType, taskDescription, ageGroup });
    }
    
    trackAchievementUnlock(achievementId, achievementName) {
        this.recordEvent('achievement', '解锁成就', `获得成就：${achievementName}`, { achievementId, achievementName });
    }
    
    trackAssessmentComplete(museumId, museumName, score, totalScore) {
        this.recordEvent('assessment', '完成亲子测评', `${museumName} - 得分 ${score}/${totalScore}`, { museumId, museumName, score, totalScore });
    }

    trackFeedback(feedbackType, content) {
        const typeLabels = { bug: '🐛 问题报告', feature: '💡 功能建议', experience: '❤️ 体验感受', museum: '🏛️ 想去的博物馆' };
        const label = typeLabels[feedbackType] || feedbackType;
        this.recordEvent('feedback', '用户反馈', `${label}：${content}`, { feedbackType, content });
    }

    trackWish(museumId, museumName) {
        this.recordEvent('wish', '想去的博物馆', `🌟 想去 ${museumName}`, { museumId, museumName });
    }
}

// Expose to global scope for pages expecting a global
window.EventWallService = EventWallService;
