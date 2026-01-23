/**
 * Shared Menu Component
 * 统一的功能导航菜单，在所有页面复用
 * 
 * Usage:
 * 1. Include this script: <script src="/js/shared-menu.js"></script>
 * 2. Call SharedMenu.init() after DOM ready
 * 3. Optionally pass config: SharedMenu.init({ showHome: true, showMuseumFireworks: false })
 */
(function() {
    'use strict';

    const MENU_ITEMS = [
        { action: 'achievements', icon: '🏆', text: '我的成就', alwaysShow: true },
        { action: 'everyoneAchievements', icon: '👥', text: '大家的成就', alwaysShow: true },
        { action: 'museumFireworks', icon: '🎆', text: '本馆烟花墙', id: 'sharedMenuMuseumFireworks', defaultHidden: true, className: 'fireworks-menu-item' },
        { action: 'fireworks', icon: '🎇', text: '烟花记录', id: 'sharedMenuFireworks', defaultHidden: true, className: 'fireworks-menu-item' },
        { action: 'leaderboard', icon: '🏅', text: '排行榜', alwaysShow: true },
        { action: 'quiz', icon: '🎓', text: '考一考', alwaysShow: true },
        { action: 'surveyIndex', icon: '🎯', text: '统一统', alwaysShow: true },
        { action: 'eventWall', icon: '📋', text: '事件墙', alwaysShow: true },
        { action: 'home', icon: '🏠', text: '返回主页', showOnSubPages: true }
    ];

    function isSubPage() {
        const path = window.location.pathname;
        return path !== '/' && path !== '/index.html' && !path.endsWith('/index.html');
    }

    function createMenuItems(config = {}) {
        const isOnSubPage = isSubPage();
        
        return MENU_ITEMS
            .filter(item => {
                // Filter based on config and page context
                if (item.showOnSubPages && !isOnSubPage && !config.showHome) return false;
                if (item.action === 'museumFireworks' && !config.showMuseumFireworks) return false;
                return true;
            })
            .map(item => {
                const hidden = item.defaultHidden && !config[`show_${item.action}`];
                const style = hidden ? ' style="display: none;"' : '';
                const className = item.className ? ` ${item.className}` : '';
                const id = item.id ? ` id="${item.id}"` : '';
                
                return `<button class="mobile-menu-item${className}" data-action="${item.action}"${id}${style}>
                    <span class="menu-icon">${item.icon}</span>
                    <span class="menu-text">${item.text}</span>
                </button>`;
            })
            .join('\n');
    }

    function handleMenuAction(action) {
        switch(action) {
            case 'achievements':
                window.location.href = getBasePath() + 'achievements.html';
                break;
            case 'everyoneAchievements':
                window.location.href = getBasePath() + 'everyone-achievements.html';
                break;
            case 'leaderboard':
                // Navigate to standalone leaderboard page
                window.location.href = getBasePath() + 'leaderboard.html';
                break;
            case 'quiz':
                window.location.href = getBasePath() + 'quiz/index.html';
                break;
            case 'surveyIndex':
                window.open(getBasePath() + 'survey/index.html', '_blank');
                break;
            case 'eventWall':
                window.open(getBasePath() + 'event-wall.html', '_blank');
                break;
            case 'fireworks':
                window.location.href = getBasePath() + 'fireworks-wall.html';
                break;
            case 'museumFireworks':
                // Dispatch event for page-specific handling
                document.dispatchEvent(new CustomEvent('sharedmenu:museumFireworks'));
                break;
            case 'home':
                window.location.href = getBasePath() + 'index.html';
                break;
            default:
                // Dispatch custom event for page-specific actions
                document.dispatchEvent(new CustomEvent('sharedmenu:action', { detail: { action } }));
        }
    }

    function getBasePath() {
        // Determine base path based on current location
        const path = window.location.pathname;
        if (path.includes('/quiz/') || path.includes('/survey/')) {
            return '../';
        }
        return '';
    }

    function injectMenuItems(containerId, config) {
        const container = document.getElementById(containerId) || document.querySelector('.mobile-menu-items');
        if (!container) {
            console.warn('[SharedMenu] Menu container not found:', containerId);
            return false;
        }
        
        container.innerHTML = createMenuItems(config);
        
        // Bind click handlers
        container.querySelectorAll('.mobile-menu-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                handleMenuAction(action);
                // Close menu modal if exists
                closeMenuModal();
            });
        });
        
        return true;
    }

    function closeMenuModal() {
        // Try common modal patterns
        const modals = [
            document.getElementById('mobileMenuModal'),
            document.getElementById('menuModal')
        ];
        modals.forEach(modal => {
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
            }
        });
    }

    // Public API
    window.SharedMenu = {
        /**
         * Initialize shared menu
         * @param {Object} config - Configuration options
         * @param {string} config.containerId - ID of menu items container
         * @param {boolean} config.showHome - Show home button (default: auto-detect)
         * @param {boolean} config.showMuseumFireworks - Show museum-specific fireworks button
         */
        init: function(config = {}) {
            const containerId = config.containerId || 'sharedMenuItems';
            
            // Try to inject into specified container or find existing
            if (!injectMenuItems(containerId, config)) {
                // If container doesn't exist, try common selectors
                const fallbackContainers = [
                    '.mobile-menu-items',
                    '#menuModal .modal-body',
                    '#mobileMenuModal .modal-body'
                ];
                
                for (const selector of fallbackContainers) {
                    const el = document.querySelector(selector);
                    if (el) {
                        el.innerHTML = `<div class="mobile-menu-items" id="${containerId}">${createMenuItems(config)}</div>`;
                        // Rebind handlers
                        el.querySelectorAll('.mobile-menu-item').forEach(btn => {
                            btn.addEventListener('click', () => {
                                handleMenuAction(btn.dataset.action);
                                closeMenuModal();
                            });
                        });
                        break;
                    }
                }
            }
            
            console.log('[SharedMenu] Initialized');
        },

        /**
         * Show/hide a specific menu item
         * @param {string} action - The action name of the menu item
         * @param {boolean} visible - Whether to show the item
         */
        setItemVisible: function(action, visible) {
            const btn = document.querySelector(`.mobile-menu-item[data-action="${action}"]`);
            if (btn) {
                btn.style.display = visible ? '' : 'none';
            }
        },

        /**
         * Get menu items HTML (for custom integration)
         * @param {Object} config - Configuration options
         * @returns {string} HTML string of menu items
         */
        getMenuHTML: function(config = {}) {
            return createMenuItems(config);
        },

        /**
         * Handle a menu action programmatically
         * @param {string} action - The action to handle
         */
        handleAction: handleMenuAction,

        /**
         * Menu items definition (for reference)
         */
        MENU_ITEMS: MENU_ITEMS
    };
})();
