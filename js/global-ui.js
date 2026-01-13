/**
 * 全局 UI 管理系统
 * 负责菜单和设置按钮的初始化、事件处理
 * 
 * 使用示例：
 * ```
 * const globalUI = new GlobalUI({
 *     menuButtonId: 'mobileMenuButton',
 *     settingsButtonId: 'settingsButton',
 *     menuModalId: 'mobileMenuModal',
 *     settingsModalId: 'settingsModal'
 * });
 * ```
 */

class GlobalUI {
    constructor(options = {}) {
        this.options = {
            menuButtonId: 'mobileMenuButton',
            settingsButtonId: 'settingsButton',
            menuModalId: 'mobileMenuModal',
            settingsModalId: 'settingsModal',
            ...options
        };
        
        this.onSettingsButtonClick = null;
        this.init();
    }
    
    /**
     * 初始化全局UI
     */
    init() {
        // 初始化菜单按钮（全局导航）
        this.initMenuButton();
        
        // 初始化设置按钮（页面特定）
        this.initSettingsButton();
        
        // 初始化菜单模态框
        this.initMenuModal();
        
        // 添加全局键盘事件监听
        this.initKeyboardShortcuts();
    }
    
    /**
     * 初始化菜单按钮 - 全局导航
     */
    initMenuButton() {
        const menuBtn = document.getElementById(this.options.menuButtonId);
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
        }
    }
    
    /**
     * 初始化设置按钮 - 页面级设置
     */
    initSettingsButton() {
        const settingsBtn = document.getElementById(this.options.settingsButtonId);
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 如果有自定义处理函数，调用它
                if (this.onSettingsButtonClick) {
                    this.onSettingsButtonClick();
                } else {
                    // 否则尝试打开设置模态框
                    this.openSettings();
                }
            });
        }
    }
    
    /**
     * 初始化菜单模态框
     */
    initMenuModal() {
        const modal = document.getElementById(this.options.menuModalId);
        if (!modal) return;
        
        // 菜单项点击关闭菜单
        const menuItems = modal.querySelectorAll('.menu-items a');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // 不立即关闭，让链接导航处理
                // 如果是跳转到其他页面，页面会重新加载
                // 如果是 SPA 导航，需要手动调用 closeMenu()
            });
        });
        
        // 关闭按钮
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeMenu();
            });
        }
        
        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeMenu();
            }
        });
    }
    
    /**
     * 初始化键盘快捷键
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC 键关闭菜单
            if (e.key === 'Escape' && this.isMenuOpen()) {
                this.closeMenu();
            }
            
            // Ctrl/Cmd + M 打开菜单
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.toggleMenu();
            }
        });
    }
    
    /**
     * 打开菜单
     */
    openMenu() {
        const modal = document.getElementById(this.options.menuModalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // 菜单打开时的事件
            this.emit('menuOpened');
        }
    }
    
    /**
     * 关闭菜单
     */
    closeMenu() {
        const modal = document.getElementById(this.options.menuModalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // 菜单关闭时的事件
            this.emit('menuClosed');
        }
    }
    
    /**
     * 切换菜单（打开/关闭）
     */
    toggleMenu() {
        if (this.isMenuOpen()) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    /**
     * 检查菜单是否打开
     */
    isMenuOpen() {
        const modal = document.getElementById(this.options.menuModalId);
        return modal && modal.style.display === 'flex';
    }
    
    /**
     * 打开设置
     */
    openSettings() {
        const modal = document.getElementById(this.options.settingsModalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            this.emit('settingsOpened');
        }
    }
    
    /**
     * 关闭设置
     */
    closeSettings() {
        const modal = document.getElementById(this.options.settingsModalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            this.emit('settingsClosed');
        }
    }
    
    /**
     * 检查设置是否打开
     */
    isSettingsOpen() {
        const modal = document.getElementById(this.options.settingsModalId);
        return modal && modal.style.display === 'flex';
    }
    
    /**
     * 设置页面级设置按钮的点击处理
     */
    setSettingsHandler(callback) {
        this.onSettingsButtonClick = callback;
    }
    
    /**
     * 事件系统
     */
    on(event, callback) {
        if (!this.listeners) this.listeners = {};
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (!this.listeners || !this.listeners[event]) return;
        this.listeners[event].forEach(callback => callback(data));
    }
    
    /**
     * 更新菜单项（如果需要动态菜单）
     */
    updateMenuItems(items) {
        const menuList = document.querySelector('.menu-items');
        if (!menuList) return;
        
        menuList.innerHTML = items.map(item => `
            <li><a href="${item.href}">${item.icon || ''} ${item.label}</a></li>
        `).join('');
        
        // 重新绑定事件
        this.initMenuModal();
    }
}

// 导出到全局
window.GlobalUI = GlobalUI;
