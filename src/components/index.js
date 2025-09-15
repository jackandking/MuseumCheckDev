/**
 * Components Index - Central import/export for all components
 * 
 * This file provides a single entry point for importing all components,
 * making it easier to manage component dependencies and avoid circular imports.
 */

// Component imports
export { MuseumGrid } from './MuseumGrid.js';
export { MuseumModal } from './MuseumModal.js';
export { AgeSelector } from './AgeSelector.js';
export { ChecklistRenderer } from './ChecklistRenderer.js';

// Component factory functions for easier initialization
export const createComponents = (app) => {
    return {
        museumGrid: new MuseumGrid(app),
        museumModal: new MuseumModal(app),
        ageSelector: new AgeSelector(app),
        checklistRenderer: new ChecklistRenderer(app)
    };
};

// Component initialization helper
export const initializeComponents = (app) => {
    const components = createComponents(app);
    
    // Initialize components that need setup
    components.museumGrid.initialize();
    components.museumModal.initialize();
    components.ageSelector.initialize(app.currentAge);
    components.checklistRenderer.setupEventListeners();
    
    return components;
};