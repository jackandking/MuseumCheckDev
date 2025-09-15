/**
 * AnalyticsService - Handles all Google Analytics tracking
 * 
 * Responsibilities:
 * - Abstract Google Analytics gtag calls
 * - Provide consistent tracking API
 * - Handle analytics initialization and configuration
 * - Track user interactions and events
 */

export class AnalyticsService {
    constructor() {
        this.isGtagAvailable = typeof gtag !== 'undefined';
        this.hasValidMeasurementId = window.GA_MEASUREMENT_ID && window.GA_MEASUREMENT_ID !== 'GA_MEASUREMENT_ID';
    }

    /**
     * Track an event with Google Analytics
     * @param {string} eventName - Name of the event
     * @param {Object} parameters - Event parameters
     */
    trackEvent(eventName, parameters = {}) {
        if (this.isGtagAvailable && this.hasValidMeasurementId) {
            try {
                gtag('event', eventName, parameters);
            } catch (error) {
                console.warn('Failed to track event:', eventName, error);
            }
        }
    }

    /**
     * Track museum visit toggle
     * @param {string} museumId - Museum ID
     * @param {string} museumName - Museum name
     * @param {string} museumLocation - Museum location
     * @param {boolean} visited - Whether museum is visited
     * @param {string} ageGroup - Current age group
     * @param {boolean} forceCheckin - Whether it was a force check-in
     */
    trackMuseumVisit(museumId, museumName, museumLocation, visited, ageGroup, forceCheckin = false) {
        this.trackEvent('museum_visit_toggled', {
            'museum_id': museumId,
            'museum_name': museumName,
            'museum_location': museumLocation,
            'visited': visited,
            'age_group': ageGroup,
            'force_checkin': forceCheckin
        });
    }

    /**
     * Track checklist item completion
     * @param {string} museumId - Museum ID
     * @param {string} checklistType - Type of checklist (parent/child)
     * @param {string} ageGroup - Age group
     * @param {boolean} checked - Whether item was checked
     */
    trackChecklistItem(museumId, checklistType, ageGroup, checked) {
        this.trackEvent('checklist_item_toggled', {
            'museum_id': museumId,
            'checklist_type': checklistType,
            'age_group': ageGroup,
            'checked': checked
        });
    }

    /**
     * Track search usage
     * @param {number} queryLength - Length of search query
     */
    trackSearch(queryLength) {
        this.trackEvent('search_used', {
            'search_query_length': queryLength
        });
    }

    /**
     * Track search clearing
     * @param {string} method - Method used to clear ('button' or 'escape')
     */
    trackSearchClear(method = 'button') {
        this.trackEvent(method === 'escape' ? 'search_cleared_escape' : 'search_cleared');
    }

    /**
     * Track modal opening
     * @param {string} museumId - Museum ID
     * @param {string} museumName - Museum name
     * @param {string} ageGroup - Current age group
     * @param {string} directTab - Direct tab if opened via URL
     */
    trackModalOpen(museumId, museumName, ageGroup, directTab = null) {
        this.trackEvent('museum_modal_opened', {
            'museum_id': museumId,
            'museum_name': museumName,
            'age_group': ageGroup,
            'direct_tab': directTab
        });
    }

    /**
     * Track tab switching in modal
     * @param {string} tabType - Type of tab (parent/child/share)
     * @param {string} museumId - Museum ID
     */
    trackTabSwitch(tabType, museumId) {
        this.trackEvent('modal_tab_switched', {
            'tab_type': tabType,
            'museum_id': museumId
        });
    }

    /**
     * Track age group changes
     * @param {string} oldAge - Previous age group
     * @param {string} newAge - New age group
     */
    trackAgeGroupChange(oldAge, newAge) {
        this.trackEvent('age_group_changed', {
            'old_age_group': oldAge,
            'new_age_group': newAge
        });
    }

    /**
     * Track photo upload
     * @param {string} taskKey - Task key
     * @param {number} fileSize - File size in bytes
     * @param {string} fileType - File type
     */
    trackPhotoUpload(taskKey, fileSize, fileType) {
        this.trackEvent('photo_uploaded', {
            'task_key': taskKey,
            'file_size': fileSize,
            'file_type': fileType
        });
    }

    /**
     * Track assessment completion
     * @param {string} museumId - Museum ID
     * @param {string} ageGroup - Age group
     * @param {number} parentScore - Parent assessment score
     * @param {number} childScore - Child assessment score
     */
    trackAssessmentComplete(museumId, ageGroup, parentScore, childScore) {
        this.trackEvent('assessment_completed', {
            'museum_id': museumId,
            'age_group': ageGroup,
            'parent_score': parentScore,
            'child_score': childScore,
            'total_score': parentScore + childScore
        });
    }

    /**
     * Track custom checklist item addition
     * @param {string} checklistKey - Checklist key
     */
    trackCustomItemAdd(checklistKey) {
        this.trackEvent('custom_item_added', {
            'checklist_key': checklistKey
        });
    }

    /**
     * Track sharing actions
     * @param {string} shareType - Type of share (url/social)
     * @param {string} museumId - Museum ID
     * @param {string} checklistType - Checklist type
     */
    trackShare(shareType, museumId, checklistType) {
        this.trackEvent('content_shared', {
            'share_type': shareType,
            'museum_id': museumId,
            'checklist_type': checklistType
        });
    }

    /**
     * Track data clearing actions
     * @param {string} clearType - Type of data cleared
     * @param {string} museumId - Museum ID (if applicable)
     */
    trackDataClear(clearType, museumId = null) {
        const eventData = {
            'clear_type': clearType
        };
        
        if (museumId) {
            eventData.museum_id = museumId;
        }
        
        this.trackEvent('data_cleared', eventData);
    }

    /**
     * Track achievement viewing
     * @param {number} visitedCount - Number of visited museums
     * @param {number} completedTasks - Number of completed tasks
     */
    trackAchievementView(visitedCount, completedTasks) {
        this.trackEvent('achievement_viewed', {
            'visited_museums': visitedCount,
            'completed_tasks': completedTasks
        });
    }

    /**
     * Track error occurrences
     * @param {string} errorType - Type of error
     * @param {string} errorMessage - Error message
     * @param {string} context - Context where error occurred
     */
    trackError(errorType, errorMessage, context = '') {
        this.trackEvent('error_occurred', {
            'error_type': errorType,
            'error_message': errorMessage,
            'context': context
        });
    }

    /**
     * Track page performance metrics
     * @param {Object} metrics - Performance metrics
     */
    trackPerformance(metrics) {
        this.trackEvent('performance_metrics', metrics);
    }

    /**
     * Check if analytics is properly configured
     * @returns {boolean} Whether analytics is available
     */
    isAnalyticsAvailable() {
        return this.isGtagAvailable && this.hasValidMeasurementId;
    }

    /**
     * Initialize Google Analytics with measurement ID
     * This method is mainly for documentation - actual gtag initialization 
     * happens in the HTML file
     */
    static initializeGoogleAnalytics(measurementId) {
        if (typeof gtag === 'undefined') {
            console.warn('Google Analytics gtag not available');
            return false;
        }
        
        try {
            gtag('config', measurementId, {
                'send_page_view': true,
                'anonymize_ip': true,
                'allow_ad_personalization_signals': false
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize Google Analytics:', error);
            return false;
        }
    }
}