/**
 * Tests for leaderboard rank change notification feature
 * 
 * When a museum is checked in (auto or manual), the leaderboard should be updated
 * and a notification should show the user's rank change.
 */

// Helper function to extract method body from script content
function extractMethodBody(scriptContent, methodSignature, endMarkers = ['\n    }', '\n}']) {
    const methodStart = scriptContent.indexOf(methodSignature);
    if (methodStart === -1) return null;
    
    // Find the end of the method by looking for closing brace at the right indentation level
    let endPos = scriptContent.length;
    for (const marker of endMarkers) {
        const pos = scriptContent.indexOf(marker, methodStart + methodSignature.length);
        if (pos !== -1 && pos < endPos) {
            endPos = pos + marker.length;
        }
    }
    
    return scriptContent.substring(methodStart, endPos);
}

describe('Leaderboard Rank Change Notification', () => {
    let scriptContent;
    
    beforeAll(() => {
        const fs = require('fs');
        const path = require('path');
        const scriptPath = path.join(__dirname, '..', 'script.js');
        scriptContent = fs.readFileSync(scriptPath, 'utf8');
    });
    
    describe('autoSubmitScore method returns rank info', () => {
        test('autoSubmitScore method should return rank change information', () => {
            // Find the autoSubmitScore method
            const methodStart = scriptContent.indexOf('async autoSubmitScore()');
            expect(methodStart).toBeGreaterThan(0);
            
            // Get the LeaderboardManager class section (autoSubmitScore is in LeaderboardManager)
            const classStart = scriptContent.indexOf('class LeaderboardManager');
            const classEnd = scriptContent.indexOf('class MuseumCheckApp');
            const leaderboardSection = scriptContent.substring(classStart, classEnd);
            
            // Check that autoSubmitScore fetches old rank before submitting
            expect(leaderboardSection).toContain('oldRank');
            
            // Check that it fetches new rank after submitting
            expect(leaderboardSection).toContain('newRank');
            
            // Check that it calculates rank change
            expect(leaderboardSection).toContain('rankChange');
            
            // Check that it returns success and rank info
            expect(leaderboardSection).toContain('success: true');
            expect(leaderboardSection).toContain('isNewEntry');
        });
        
        test('autoSubmitScore should handle first-time entry', () => {
            // Get the LeaderboardManager class section
            const classStart = scriptContent.indexOf('class LeaderboardManager');
            const classEnd = scriptContent.indexOf('class MuseumCheckApp');
            const leaderboardSection = scriptContent.substring(classStart, classEnd);
            
            // Check for handling of new entry (no old rank)
            expect(leaderboardSection).toContain('isNewEntry: !oldRank && newRank');
        });
        
        test('autoSubmitScore should calculate rank improvement correctly', () => {
            // Get the LeaderboardManager class section
            const classStart = scriptContent.indexOf('class LeaderboardManager');
            const classEnd = scriptContent.indexOf('class MuseumCheckApp');
            const leaderboardSection = scriptContent.substring(classStart, classEnd);
            
            // Check for rank change calculation (oldRank - newRank, so #5 to #3 = 2)
            expect(leaderboardSection).toContain('oldRank - newRank');
        });
    });
    
    describe('showAutoCheckinNotification method', () => {
        test('should exist and show rank change info', () => {
            // Check for method definition
            expect(scriptContent).toContain('showAutoCheckinNotification(museum, rankResult)');
        });
        
        test('should show first-time ranking message', () => {
            // Find the showAutoCheckinNotification method and verify it contains expected content
            const methodStart = scriptContent.indexOf('showAutoCheckinNotification(museum, rankResult)');
            expect(methodStart).toBeGreaterThan(0);
            
            // Extract a reasonable chunk of the method (next ~1000 chars should cover the method body)
            const methodChunk = scriptContent.substring(methodStart, methodStart + 1000);
            
            // Check for first-time ranking message
            expect(methodChunk).toContain('首次登榜');
            expect(methodChunk).toContain('isNewEntry');
        });
        
        test('should show rank improvement message', () => {
            const methodStart = scriptContent.indexOf('showAutoCheckinNotification(museum, rankResult)');
            const methodChunk = scriptContent.substring(methodStart, methodStart + 1000);
            
            // Check for rank improvement message
            expect(methodChunk).toContain('排名上升');
            expect(methodChunk).toContain('rankChange > 0');
        });
        
        test('should show rank maintained message', () => {
            const methodStart = scriptContent.indexOf('showAutoCheckinNotification(museum, rankResult)');
            const methodChunk = scriptContent.substring(methodStart, methodStart + 1000);
            
            // Check for rank maintained message
            expect(methodChunk).toContain('保持第');
            expect(methodChunk).toContain('rankChange === 0');
        });
    });
    
    describe('showManualCheckinRankNotification method', () => {
        test('should exist for manual check-in', () => {
            // Check for method definition
            expect(scriptContent).toContain('showManualCheckinRankNotification(museum, rankResult)');
        });
        
        test('should show first-time ranking message for manual check-in', () => {
            const methodStart = scriptContent.indexOf('showManualCheckinRankNotification(museum, rankResult)');
            expect(methodStart).toBeGreaterThan(0);
            
            // Extract a reasonable chunk of the method
            const methodChunk = scriptContent.substring(methodStart, methodStart + 1200);
            
            // Check for first-time ranking message
            expect(methodChunk).toContain('首次登上排行榜');
            expect(methodChunk).toContain('isNewEntry');
        });
        
        test('should show rank improvement for manual check-in', () => {
            const methodStart = scriptContent.indexOf('showManualCheckinRankNotification(museum, rankResult)');
            const methodChunk = scriptContent.substring(methodStart, methodStart + 1200);
            
            // Check for rank improvement message
            expect(methodChunk).toContain('排名上升');
            expect(methodChunk).toContain('rankChange');
        });
    });
    
    describe('Auto check-in uses rank notification', () => {
        test('checkAutoCheckin should call showAutoCheckinNotification', () => {
            // Find the checkAutoCheckin method
            const methodStart = scriptContent.indexOf('checkAutoCheckin(museumId, museum, ageGroup)');
            expect(methodStart).toBeGreaterThan(0);
            
            // Find showAutoCheckinNotification call after checkAutoCheckin definition
            const notificationCall = scriptContent.indexOf('showAutoCheckinNotification(museum, result)', methodStart);
            
            // The showAutoCheckinNotification should be called after checkAutoCheckin is defined
            expect(notificationCall).toBeGreaterThan(methodStart);
        });
        
        test('checkAutoCheckin should await leaderboard submission', () => {
            // Find the checkAutoCheckin method
            const methodStart = scriptContent.indexOf('checkAutoCheckin(museumId, museum, ageGroup)');
            
            // Extract a reasonable chunk of the method (covers the auto-checkin logic)
            const methodChunk = scriptContent.substring(methodStart, methodStart + 4000);
            
            // Check for proper async handling of leaderboard submission
            expect(methodChunk).toContain('.then(result =>');
            expect(methodChunk).toContain('autoSubmitScore()');
        });
    });
    
    describe('Manual check-in uses rank notification', () => {
        test('toggleMuseumVisit should call showManualCheckinRankNotification', () => {
            // Find toggleMuseumVisit method
            const methodStart = scriptContent.indexOf('toggleMuseumVisit(museumId)');
            expect(methodStart).toBeGreaterThan(0);
            
            // Check that showManualCheckinRankNotification is called after toggleMuseumVisit
            const notificationCall = scriptContent.indexOf('showManualCheckinRankNotification(museum, result)', methodStart);
            expect(notificationCall).toBeGreaterThan(methodStart);
        });
    });
});
