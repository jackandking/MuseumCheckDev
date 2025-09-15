/**
 * MuseumCheck - Bundled Application
 * Generated on 2025-09-15T22:15:31.447Z
 * 
 * This file contains all application modules bundled for browser compatibility.
 * Original ES6 modules are preserved in the src/ directory.
 */

// Module System Polyfill for older browsers
if (!window.moduleSystem) {
    window.moduleSystem = {
        modules: {},
        exports: {},
        register: function(name, factory) {
            this.modules[name] = factory;
        },
        require: function(name) {
            if (!this.exports[name]) {
                if (this.modules[name]) {
                    this.exports[name] = this.modules[name]();
                } else {
                    throw new Error('Module not found: ' + name);
                }
            }
            return this.exports[name];
        }
    };
}


// ================================================
// Module: index
// Path: src/data/index.js
// ================================================

/**
 * Data Module Index
 * Centralized exports for all data modules
 */

// Exported:  EXPERT_GUIDANCE  from './expertGuidance.js';
// Exported:  ASSESSMENT_TOOLS  from './assessmentTools.js';
// Exported:  CRISIS_MANAGEMENT  from './crisisManagement.js';
// Exported:  MULTIPLE_INTELLIGENCE_STRATEGIES  from './multipleIntelligenceStrategies.js';
// Exported:  CONVERSATION_TECHNIQUES  from './conversationTechniques.js';
// Exported:  MUSEUMS, MUSEUM_COUNT  from './museums.js';

// Re-export everything for easy importing
export * from './expertGuidance.js';
export * from './assessmentTools.js';
export * from './crisisManagement.js';
export * from './multipleIntelligenceStrategies.js';
export * from './conversationTechniques.js';
export * from './museums.js';


// ================================================
// Module: index
// Path: src/services/index.js
// ================================================

/**
 * Services Index - Central import/export for all services
 * 
 * This file provides a single entry point for importing all services,
 * making it easier to manage service dependencies and initialization.
 */

// Service imports
// Exported:  StorageService  from './StorageService.js';
// Exported:  AnalyticsService  from './AnalyticsService.js';

// Service factory function for easier initialization
const createServices = () => {
    return {
        storageService: new StorageService(),
        analyticsService: new AnalyticsService()
    };
};

// Service initialization helper
const initializeServices = async () => {
    const services = createServices();
    
    // Initialize services that need async setup
    await services.storageService.initIndexedDB();
    
    return services;
};


// ================================================
// Module: index
// Path: src/components/index.js
// ================================================

/**
 * Components Index - Central import/export for all components
 * 
 * This file provides a single entry point for importing all components,
 * making it easier to manage component dependencies and avoid circular imports.
 */

// Component imports
// Exported:  MuseumGrid  from './MuseumGrid.js';
// Exported:  MuseumModal  from './MuseumModal.js';
// Exported:  AgeSelector  from './AgeSelector.js';
// Exported:  ChecklistRenderer  from './ChecklistRenderer.js';

// Component factory functions for easier initialization
const createComponents = (app) => {
    return {
        museumGrid: new MuseumGrid(app),
        museumModal: new MuseumModal(app),
        ageSelector: new AgeSelector(app),
        checklistRenderer: new ChecklistRenderer(app)
    };
};

// Component initialization helper
const initializeComponents = (app) => {
    const components = createComponents(app);
    
    // Initialize components that need setup
    components.museumGrid.initialize();
    components.museumModal.initialize();
    components.ageSelector.initialize(app.currentAge);
    components.checklistRenderer.setupEventListeners();
    
    return components;
};

