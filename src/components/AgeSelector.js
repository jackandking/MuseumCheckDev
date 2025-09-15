/**
 * AgeSelector Component - Handles age group selection and management
 * 
 * Responsibilities:
 * - Initialize age selector visual state
 * - Handle age group changes
 * - Manage age group persistence
 * - Provide age group utilities
 */

export class AgeSelector {
    constructor(app) {
        this.app = app; // Reference to main MuseumCheckApp instance
        this.currentAge = '7-12'; // Default age group
        this.ageGroupLabels = {
            '3-6': '3-6岁 (学龄前)',
            '7-12': '7-12岁 (小学)', 
            '13-18': '13-18岁 (中学)'
        };
    }

    /**
     * Initialize age selector with saved state
     * @param {string} savedAge - Previously saved age group
     */
    initialize(savedAge = '7-12') {
        this.currentAge = savedAge;
        this.initializeVisualState();
        this.setupEventListeners();
    }

    /**
     * Initialize the visual state of age selector
     */
    initializeVisualState() {
        // Set the radio button to match the saved age group
        const savedAgeRadio = document.querySelector(`input[name="ageGroup"][value="${this.currentAge}"]`);
        if (savedAgeRadio) {
            savedAgeRadio.checked = true;
        }
        
        // Set initial selected state for browsers that don't support :has()
        const checkedRadio = document.querySelector('input[name="ageGroup"]:checked');
        if (checkedRadio) {
            // Remove previous selected states
            document.querySelectorAll('.age-option').forEach(option => {
                option.classList.remove('selected');
            });
            // Add selected state to the current radio
            checkedRadio.closest('.age-option').classList.add('selected');
        }
    }

    /**
     * Setup event listeners for age group selection
     */
    setupEventListeners() {
        // Age group selector - handle radio button changes
        document.querySelectorAll('input[name="ageGroup"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.handleAgeChange(e.target.value);
                }
            });
        });
    }

    /**
     * Handle age group change
     * @param {string} newAge - New age group value
     */
    handleAgeChange(newAge) {
        const oldAge = this.currentAge;
        this.currentAge = newAge;
        
        // Update main app's current age
        this.app.currentAge = newAge;
        
        // Save to storage
        this.app.storageService.saveAgeGroup(newAge);
        
        // Update visual state for browsers that don't support :has()
        this.updateVisualState();
        
        // Re-render museums with new age-appropriate content
        this.app.museumGrid.render();
        
        // Track age group change
        this.app.analyticsService.trackAgeGroupChange(oldAge, newAge);
    }

    /**
     * Update visual state of age selector
     */
    updateVisualState() {
        document.querySelectorAll('.age-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const checkedRadio = document.querySelector('input[name="ageGroup"]:checked');
        if (checkedRadio) {
            checkedRadio.closest('.age-option').classList.add('selected');
        }
    }

    /**
     * Set age group from URL parameters
     * @param {string} ageGroup - Age group from URL
     * @returns {boolean} Whether the age group was valid and set
     */
    setAgeFromURL(ageGroup) {
        if (!ageGroup || !['3-6', '7-12', '13-18'].includes(ageGroup)) {
            return false;
        }

        this.currentAge = ageGroup;
        this.app.currentAge = ageGroup;
        
        const ageRadio = document.querySelector(`input[name="ageGroup"][value="${ageGroup}"]`);
        if (ageRadio) {
            ageRadio.checked = true;
            this.updateVisualState();
        }
        
        return true;
    }

    /**
     * Get current age group
     * @returns {string} Current age group
     */
    getCurrentAge() {
        return this.currentAge;
    }

    /**
     * Get age group display label
     * @param {string} ageGroup - Age group to get label for (optional, uses current if not provided)
     * @returns {string} Display label for age group
     */
    getAgeGroupLabel(ageGroup = null) {
        const age = ageGroup || this.currentAge;
        return this.ageGroupLabels[age] || age;
    }

    /**
     * Get all available age groups
     * @returns {Array} Array of age group objects with value and label
     */
    getAvailableAgeGroups() {
        return Object.entries(this.ageGroupLabels).map(([value, label]) => ({
            value,
            label
        }));
    }

    /**
     * Check if an age group is valid
     * @param {string} ageGroup - Age group to validate
     * @returns {boolean} Whether the age group is valid
     */
    isValidAgeGroup(ageGroup) {
        return ['3-6', '7-12', '13-18'].includes(ageGroup);
    }

    /**
     * Get age-appropriate content guidance
     * @param {string} ageGroup - Age group (optional, uses current if not provided)
     * @returns {Object} Age-appropriate guidance information
     */
    getAgeGuidance(ageGroup = null) {
        const age = ageGroup || this.currentAge;
        
        const guidance = {
            '3-6': {
                focus: 'observation and basic exploration',
                timeLimit: '1-2 hours maximum',
                approach: 'sensory and interactive',
                attention: '15-20 minute intervals'
            },
            '7-12': {
                focus: 'learning and structured activities',
                timeLimit: '2-3 hours comfortable',
                approach: 'educational and engaging',
                attention: '30-45 minute intervals'
            },
            '13-18': {
                focus: 'analysis and independent research',
                timeLimit: '3-4 hours comfortable',
                approach: 'analytical and project-based',
                attention: 'sustained attention possible'
            }
        };
        
        return guidance[age] || guidance['7-12'];
    }

    /**
     * Reset to default age group
     */
    resetToDefault() {
        this.handleAgeChange('7-12');
    }

    /**
     * Get age-specific museum counts (for statistics)
     * @returns {Object} Statistics for current age group
     */
    getAgeSpecificStats() {
        // This would integrate with the museum grid to get filtered counts
        // For now, return basic structure
        return {
            ageGroup: this.currentAge,
            label: this.getAgeGroupLabel(),
            totalMuseums: this.app.museumGrid ? this.app.museumGrid.getFilteredMuseums().length : 0,
            visitedMuseums: this.app.visitedMuseums ? this.app.visitedMuseums.length : 0
        };
    }

    /**
     * Export age selector state for backup/restore
     * @returns {Object} Age selector state
     */
    exportState() {
        return {
            currentAge: this.currentAge
        };
    }

    /**
     * Import age selector state from backup
     * @param {Object} state - State to import
     */
    importState(state) {
        if (state && state.currentAge && this.isValidAgeGroup(state.currentAge)) {
            this.handleAgeChange(state.currentAge);
        }
    }
}