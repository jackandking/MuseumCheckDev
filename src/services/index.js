/**
 * Services Index - Central import/export for all services
 * 
 * This file provides a single entry point for importing all services,
 * making it easier to manage service dependencies and initialization.
 */

// Service imports
export { StorageService } from './StorageService.js';
export { AnalyticsService } from './AnalyticsService.js';

// Service factory function for easier initialization
export const createServices = () => {
    return {
        storageService: new StorageService(),
        analyticsService: new AnalyticsService()
    };
};

// Service initialization helper
export const initializeServices = async () => {
    const services = createServices();
    
    // Initialize services that need async setup
    await services.storageService.initIndexedDB();
    
    return services;
};