/**
 * Event Tracking Initialization
 * 
 * Minimal initialization script to enable event tracking on any page.
 * This script:
 * 1. Defines REMOTE_STORAGE_CONFIG if not already defined
 * 2. Initializes EventWallService if not already initialized
 * 3. Tracks page view event
 * 
 * Usage: Include this script AFTER event-wall-service.js on any page
 */

(function() {
    'use strict';
    
    // Define REMOTE_STORAGE_CONFIG if not already defined
    // This is needed for EventWallService to work
    if (typeof window.REMOTE_STORAGE_CONFIG === 'undefined') {
        window.REMOTE_STORAGE_CONFIG = {
            API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
            FIREWORK_KEY: 'museumcheck-firework',
            DOWNLOAD_INTERVAL: 10000,  // 10 seconds
            DEFAULT_FIREWORK_EXPIRATION: 60, // Default: 1 minute in seconds
            TIMESTAMP_2124: 4866674732  // Default expiration timestamp (Unix timestamp in SECONDS - year 2124)
        };
    }
    
    // Initialize EventWallService if not already initialized
    if (typeof window.eventWallService === 'undefined' && typeof window.EventWallService !== 'undefined') {
        window.eventWallService = new EventWallService();
    }
    
    /**
     * Get human-readable page name from current location
     */
    function getPageName() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        
        const pageNames = {
            'index.html': '首页',
            'event-wall.html': '事件墙',
            'fireworks-wall.html': '烟花墙',
            'achievements.html': '成就',
            'treasures.html': '镇馆之宝',
            'museum-checkin.html': '博物馆打卡',
            'leaderboard.html': '排行榜',
            'everyone-achievements.html': '全民成就',
            'fireworks.html': '烟花',
            '': '首页'
        };
        
        return pageNames[filename] || filename;
    }
    
    /**
     * Track page view when page loads
     */
    function trackPageView() {
        if (window.eventWallService) {
            const pageName = getPageName();
            const pageUrl = window.location.href;
            
            console.log('[Event Tracking] Recording page view:', pageName);
            
            window.eventWallService.recordEvent(
                'page_view',
                '访问页面',
                `访问 ${pageName}`,
                { 
                    pageName: pageName, 
                    pageUrl: pageUrl,
                    timestamp: Date.now()
                }
            );
        } else {
            console.warn('[Event Tracking] EventWallService not available for page view tracking');
        }
    }
    
    // Track page view when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
        // DOM is already loaded
        trackPageView();
    }
    
    // Export for potential use by other scripts
    window.EventTrackingInit = {
        getPageName: getPageName,
        trackPageView: trackPageView
    };
    
})();
