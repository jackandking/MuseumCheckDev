/**
 * MuseumCheck - Integrated Application (Phase 3)
 * 
 * This is the refactored main application file that uses the extracted components
 * and services. It demonstrates the new modular architecture while maintaining
 * all original functionality.
 */

// Import all data constants
import { MUSEUMS, EXPERT_GUIDANCE, ASSESSMENT_TOOLS, CRISIS_MANAGEMENT, LEARNING_STRATEGIES } from './src/data/index.js';

// Import services
import { StorageService, AnalyticsService, initializeServices } from './src/services/index.js';

// Import components
import { MuseumGrid, MuseumModal, AgeSelector, ChecklistRenderer, initializeComponents } from './src/components/index.js';

/**
 * Main Application Class (Refactored)
 * 
 * This class now serves as the main coordinator, delegating specific responsibilities
 * to specialized components while maintaining the overall application state.
 */
class MuseumCheckApp {
    constructor() {
        // Core application state
        this.currentAge = '7-12'; // Default age group
        this.searchQuery = '';
        this.filteredMuseums = MUSEUMS;
        
        // Services (will be injected)
        this.storageService = null;
        this.analyticsService = null;
        
        // Components (will be injected)  
        this.components = null;
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application with services and components
     */
    async init() {
        try {
            // Initialize services
            console.log('🔄 Initializing services...');
            const services = await initializeServices();
            this.storageService = services.storageService;
            this.analyticsService = services.analyticsService;
            
            // Load saved state from storage
            await this.loadApplicationState();
            
            // Initialize components with dependency injection
            console.log('🔄 Initializing components...');
            this.components = initializeComponents(this);
            
            // Set up application-level event listeners
            this.setupEventListeners();
            
            // Initial render
            this.render();
            
            // Handle URL parameters for direct links
            this.handleURLParameters();
            
            console.log('✅ MuseumCheck initialized successfully');
            
            // Track successful initialization
            this.analyticsService.trackEvent('app_initialized', {
                museums_count: MUSEUMS.length,
                age_group: this.currentAge
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize MuseumCheck:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Load application state from persistent storage
     */
    async loadApplicationState() {
        try {
            // Load age group preference
            const savedAge = await this.storageService.getItem('currentAge');
            if (savedAge && ['3-6', '7-12', '13-18'].includes(savedAge)) {
                this.currentAge = savedAge;
            }
            
            console.log(`📱 Loaded age group: ${this.currentAge}`);
        } catch (error) {
            console.warn('⚠️ Could not load application state:', error.message);
        }
    }

    /**
     * Set up application-level event listeners
     */
    setupEventListeners() {
        // Age group change handler
        document.addEventListener('ageGroupChanged', (event) => {
            this.handleAgeGroupChange(event.detail.ageGroup);
        });

        // Museum selection handler
        document.addEventListener('museumSelected', (event) => {
            this.handleMuseumSelection(event.detail.museum);
        });

        // Search query change handler  
        document.addEventListener('searchQueryChanged', (event) => {
            this.handleSearchQueryChange(event.detail.query);
        });

        // Modal close handler
        document.addEventListener('modalClosed', () => {
            this.handleModalClose();
        });

        // Checklist item change handler
        document.addEventListener('checklistItemChanged', (event) => {
            this.handleChecklistItemChange(event.detail);
        });

        // Museum visit toggle handler
        document.addEventListener('museumVisitToggled', (event) => {
            this.handleMuseumVisitToggle(event.detail);
        });
    }

    /**
     * Handle age group changes
     */
    async handleAgeGroupChange(newAgeGroup) {
        console.log(`📅 Age group changed to: ${newAgeGroup}`);
        
        this.currentAge = newAgeGroup;
        
        // Save to storage
        try {
            await this.storageService.setItem('currentAge', newAgeGroup);
        } catch (error) {
            console.warn('⚠️ Could not save age group:', error.message);
        }
        
        // Track analytics
        this.analyticsService.trackEvent('age_group_changed', {
            new_age_group: newAgeGroup
        });
        
        // Re-render components that depend on age
        this.components.museumGrid.updateAgeGroup(newAgeGroup);
        if (this.components.museumModal.isOpen()) {
            this.components.museumModal.updateContent();
        }
    }

    /**
     * Handle museum selection
     */
    handleMuseumSelection(museum) {
        console.log(`🏛️ Museum selected: ${museum.name}`);
        
        // Track analytics
        this.analyticsService.trackEvent('museum_opened', {
            museum_id: museum.id,
            museum_name: museum.name,
            age_group: this.currentAge
        });
        
        // Open museum modal through component
        this.components.museumModal.openMuseum(museum);
    }

    /**
     * Handle search query changes
     */
    handleSearchQueryChange(query) {
        console.log(`🔍 Search query changed: "${query}"`);
        
        this.searchQuery = query;
        
        // Update filtered museums
        this.updateFilteredMuseums();
        
        // Track analytics for search
        if (query.length > 0) {
            this.analyticsService.trackEvent('search_performed', {
                query: query,
                results_count: this.filteredMuseums.length
            });
        }
    }

    /**
     * Update filtered museums based on search query
     */
    updateFilteredMuseums() {
        if (!this.searchQuery.trim()) {
            this.filteredMuseums = MUSEUMS;
        } else {
            const query = this.searchQuery.toLowerCase();
            this.filteredMuseums = MUSEUMS.filter(museum => 
                museum.name.toLowerCase().includes(query) ||
                museum.location.toLowerCase().includes(query) ||
                museum.description.toLowerCase().includes(query) ||
                museum.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }
        
        // Update museum grid
        this.components.museumGrid.updateFilteredMuseums(this.filteredMuseums);
    }

    /**
     * Handle modal close events
     */
    handleModalClose() {
        console.log('🔒 Modal closed');
        
        // Clean up URL parameters
        const url = new URL(window.location);
        url.searchParams.delete('museum');
        url.searchParams.delete('type');
        url.searchParams.delete('age');
        window.history.replaceState({}, '', url);
    }

    /**
     * Handle checklist item changes
     */
    async handleChecklistItemChange(changeData) {
        const { museumId, type, itemIndex, checked, ageGroup } = changeData;
        
        console.log(`☑️ Checklist item ${checked ? 'checked' : 'unchecked'}:`, {
            museumId, type, itemIndex, ageGroup
        });
        
        // Track analytics
        this.analyticsService.trackEvent('checklist_item_toggled', {
            museum_id: museumId,
            checklist_type: type,
            item_index: itemIndex,
            checked: checked,
            age_group: ageGroup
        });
    }

    /**
     * Handle museum visit toggle
     */
    async handleMuseumVisitToggle(toggleData) {
        const { museumId, visited } = toggleData;
        
        console.log(`🎯 Museum ${visited ? 'visited' : 'unvisited'}: ${museumId}`);
        
        // Track analytics
        this.analyticsService.trackEvent('museum_visit_toggled', {
            museum_id: museumId,
            visited: visited,
            age_group: this.currentAge
        });
        
        // Update statistics
        this.updateStats();
    }

    /**
     * Handle URL parameters for direct museum/checklist sharing
     */
    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const museumId = urlParams.get('museum');
        const checklistType = urlParams.get('type');
        const ageGroup = urlParams.get('age');

        if (museumId) {
            const museum = MUSEUMS.find(m => m.id === museumId);
            if (museum) {
                // Set age group if provided
                if (ageGroup && ['3-6', '7-12', '13-18'].includes(ageGroup)) {
                    this.currentAge = ageGroup;
                    this.components.ageSelector.setAgeGroup(ageGroup);
                }

                // Open museum modal with slight delay to ensure DOM is ready
                setTimeout(() => {
                    this.components.museumModal.openMuseum(museum, checklistType);
                }, 100);

                // Track shared link access
                this.analyticsService.trackEvent('shared_link_accessed', {
                    museum_id: museumId,
                    checklist_type: checklistType || 'none',
                    age_group: ageGroup || this.currentAge
                });
            }
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        // Delegate to components
        this.components.museumGrid.updateStats();
        
        // Update achievement system if needed
        this.updateAchievements();
    }

    /**
     * Update achievements based on current progress
     */
    updateAchievements() {
        // This would integrate with the achievement system
        // Implementation would depend on the specific achievement logic
        console.log('🏆 Updating achievements...');
    }

    /**
     * Main render method - coordinates all component rendering
     */
    render() {
        console.log('🎨 Rendering application...');
        
        // Render all components
        this.components.ageSelector.render();
        this.components.museumGrid.render();
        
        // Update statistics
        this.updateStats();
    }

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        console.error('💥 Application initialization failed:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-banner';
        errorMessage.innerHTML = `
            <div class="error-content">
                <h3>⚠️ 应用启动失败</h3>
                <p>抱歉，MuseumCheck 无法正常启动。请尝试刷新页面。</p>
                <button onclick="window.location.reload()">🔄 刷新页面</button>
            </div>
        `;
        
        document.body.insertBefore(errorMessage, document.body.firstChild);
    }

    /**
     * Get current application state for debugging
     */
    getDebugInfo() {
        return {
            currentAge: this.currentAge,
            searchQuery: this.searchQuery,
            filteredMuseumsCount: this.filteredMuseums.length,
            totalMuseumsCount: MUSEUMS.length,
            componentsLoaded: !!this.components,
            servicesLoaded: !!(this.storageService && this.analyticsService)
        };
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
    
    // Track error if analytics is available
    if (window.app && window.app.analyticsService) {
        window.app.analyticsService.trackEvent('javascript_error', {
            message: event.error.message,
            filename: event.filename,
            lineno: event.lineno
        });
    }
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing MuseumCheck (Integrated Version)...');
    window.app = new MuseumCheckApp();
});

// Export for potential external use
export default MuseumCheckApp;