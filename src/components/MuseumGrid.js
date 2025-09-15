/**
 * MuseumGrid Component - Handles museum display, search, and filtering
 * 
 * Responsibilities:
 * - Render museum cards in grid layout
 * - Handle search functionality
 * - Filter museums based on search query
 * - Manage museum visit status
 * - Handle error states and loading
 */

import { MUSEUMS } from '../data/index.js';

export class MuseumGrid {
    constructor(app) {
        this.app = app; // Reference to main MuseumCheckApp instance
        this.searchQuery = '';
        this.filteredMuseums = MUSEUMS;
    }

    /**
     * Initialize the museum grid with search functionality
     */
    initialize() {
        this.setupSearchEventListeners();
        this.render();
    }

    /**
     * Setup search functionality event listeners
     */
    setupSearchEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('museumSearch');
        const clearButton = document.getElementById('clearSearch');
        
        // Search input event listener
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.filterMuseums();
            this.render();
            this.toggleClearButton();
            
            // Track search usage via main app
            if (this.searchQuery.length > 0) {
                this.app.trackEvent('search_used', {
                    'search_query_length': this.searchQuery.length
                });
            }
        });
        
        // Clear search button
        clearButton.addEventListener('click', () => {
            this.clearSearch();
            this.app.trackEvent('search_cleared');
        });
        
        // Clear search on Escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
                this.app.trackEvent('search_cleared_escape');
            }
        });
    }

    /**
     * Filter museums based on search query
     */
    filterMuseums() {
        if (!this.searchQuery) {
            this.filteredMuseums = MUSEUMS;
            return;
        }
        
        const query = this.searchQuery.toLowerCase();
        this.filteredMuseums = MUSEUMS.filter(museum => {
            // Safety check for undefined values
            const name = museum.name || '';
            const location = museum.location || '';
            const description = museum.description || '';
            const tags = museum.tags || [];
            
            return name.toLowerCase().includes(query) ||
                   location.toLowerCase().includes(query) ||
                   description.toLowerCase().includes(query) ||
                   tags.some(tag => (tag || '').toLowerCase().includes(query));
        });
    }

    /**
     * Clear search and reset filter
     */
    clearSearch() {
        this.searchQuery = '';
        document.getElementById('museumSearch').value = '';
        this.filteredMuseums = MUSEUMS;
        this.render();
        this.toggleClearButton();
    }

    /**
     * Toggle visibility of clear search button and results info
     */
    toggleClearButton() {
        const clearButton = document.getElementById('clearSearch');
        const searchResultsInfo = document.getElementById('searchResultsInfo');
        
        if (this.searchQuery.length > 0) {
            clearButton.style.display = 'block';
            searchResultsInfo.style.display = 'block';
            document.getElementById('filteredCount').textContent = this.filteredMuseums.length;
        } else {
            clearButton.style.display = 'none';
            searchResultsInfo.style.display = 'none';
        }
    }

    /**
     * Render museums grid
     */
    render() {
        try {
            const grid = document.getElementById('museumGrid');
            const loadingIndicator = document.getElementById('loadingIndicator');
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            grid.innerHTML = '';

            this.filteredMuseums.forEach(museum => {
                const museumCard = this.createMuseumCard(museum);
                grid.appendChild(museumCard);
            });

            this.app.updateStats();
            
            // If no museums were rendered, show error message
            if (grid.children.length === 0) {
                this.showError('没有找到匹配的博物馆，请尝试其他搜索关键词');
            }
        } catch (error) {
            console.error('Error rendering museums:', error);
            this.showError('博物馆数据载入出错，请刷新页面重试');
        }
    }

    /**
     * Create a museum card element
     * @param {Object} museum - Museum data object
     * @returns {HTMLElement} Museum card element
     */
    createMuseumCard(museum) {
        const isVisited = this.app.visitedMuseums.includes(museum.id);
        const card = document.createElement('div');
        card.className = `museum-card ${isVisited ? 'visited' : ''}`;
        card.innerHTML = `
            <div class="museum-header">
                <input type="checkbox" class="visit-checkbox" ${isVisited ? 'checked' : ''} 
                       data-museum="${museum.id}">
                <div class="museum-info">
                    <h3>
                        ${museum.name}
                        ${isVisited ? '<button class="assessment-button" data-museum="' + museum.id + '" title="亲子关系测评">🧡 亲子测评</button>' : ''}
                    </h3>
                    <div class="museum-location">📍 ${museum.location}</div>
                </div>
            </div>
            <p class="museum-description">${museum.description}</p>
            <div class="museum-tags">
                ${museum.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;

        // Add click event for the card (excluding checkbox and assessment button)
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('visit-checkbox') && 
                !e.target.classList.contains('assessment-button')) {
                this.app.openMuseumModal(museum);
            }
        });

        // Add checkbox event
        const checkbox = card.querySelector('.visit-checkbox');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const wasChecked = checkbox.checked;
            const result = this.app.toggleMuseumVisit(museum.id);
            
            // If toggleMuseumVisit indicates the action was cancelled (user went to modal),
            // revert the checkbox state since the museum wasn't actually marked as visited
            if (result === 'cancelled') {
                checkbox.checked = !wasChecked;
            }
        });

        // Add assessment button event
        const assessmentButton = card.querySelector('.assessment-button');
        if (assessmentButton) {
            assessmentButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.openAssessmentModal(museum.id);
            });
        }

        return card;
    }

    /**
     * Show error message in the grid
     * @param {string} message - Error message to display
     */
    showError(message) {
        const grid = document.getElementById('museumGrid');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        grid.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-button">重新载入</button>
            </div>
        `;
    }

    /**
     * Get current filtered museums
     * @returns {Array} Array of filtered museum objects
     */
    getFilteredMuseums() {
        return this.filteredMuseums;
    }

    /**
     * Get current search query
     * @returns {string} Current search query
     */
    getSearchQuery() {
        return this.searchQuery;
    }
}