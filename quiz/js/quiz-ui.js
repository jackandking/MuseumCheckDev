/**
 * Quiz UI Helpers
 * 答题界面辅助函数
 * 
 * Provides UI utility functions for quiz pages
 */

const QuizUI = {
    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },
    
    /**
     * Show notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'info', 'warning'
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `quiz-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    /**
     * Show loading spinner
     * @param {string} message - Loading message
     * @returns {HTMLElement} Loading element
     */
    showLoading(message = '加载中...') {
        const loading = document.createElement('div');
        loading.className = 'quiz-loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        document.body.appendChild(loading);
        return loading;
    },
    
    /**
     * Hide loading spinner
     * @param {HTMLElement} loading - Loading element
     */
    hideLoading(loading) {
        if (loading && loading.parentNode) {
            loading.remove();
        }
    },
    
    /**
     * Create progress bar
     * @param {number} current - Current value
     * @param {number} total - Total value
     * @returns {string} HTML for progress bar
     */
    createProgressBar(current, total) {
        const percentage = Math.min(100, (current / total * 100)).toFixed(0);
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
                <div class="progress-text">${current}/${total}</div>
            </div>
        `;
    },
    
    /**
     * Create star rating display
     * @param {number} stars - Number of stars (0-5)
     * @returns {string} HTML for star rating
     */
    createStarRating(stars) {
        const fullStars = Math.floor(stars);
        const hasHalfStar = stars % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let html = '';
        for (let i = 0; i < fullStars; i++) {
            html += '⭐';
        }
        if (hasHalfStar) {
            html += '✨';
        }
        for (let i = 0; i < emptyStars; i++) {
            html += '☆';
        }
        
        return html;
    },
    
    /**
     * Create accuracy badge
     * @param {number} accuracy - Accuracy percentage
     * @returns {string} HTML for accuracy badge
     */
    createAccuracyBadge(accuracy) {
        let className = 'low';
        let emoji = '📝';
        
        if (accuracy >= 90) {
            className = 'excellent';
            emoji = '🏆';
        } else if (accuracy >= 75) {
            className = 'good';
            emoji = '👍';
        } else if (accuracy >= 60) {
            className = 'fair';
            emoji = '💪';
        }
        
        return `<span class="accuracy-badge ${className}">${emoji} ${accuracy}%</span>`;
    },
    
    /**
     * Shuffle array
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    /**
     * Get museum name from ID
     * @param {string} museumId - Museum ID
     * @returns {string} Museum name
     */
    getMuseumName(museumId) {
        if (!museumId) return '随机答题';
        
        const museum = QuizData.getMuseumById(museumId);
        return museum ? museum.name : museumId;
    },
    
    /**
     * Create confetti animation
     */
    showConfetti() {
        const confettiCount = 50;
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    },
    
    /**
     * Animate number counting
     * @param {HTMLElement} element - Element to animate
     * @param {number} target - Target number
     * @param {number} duration - Duration in ms
     */
    animateNumber(element, target, duration = 1000) {
        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                element.textContent = Math.round(target);
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, 16);
    },
    
    /**
     * Shake element animation
     * @param {HTMLElement} element - Element to shake
     */
    shake(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    },
    
    /**
     * Bounce element animation
     * @param {HTMLElement} element - Element to bounce
     */
    bounce(element) {
        element.classList.add('bounce');
        setTimeout(() => {
            element.classList.remove('bounce');
        }, 500);
    },
    
    /**
     * Create modal dialog
     * @param {string} title - Modal title
     * @param {string} content - Modal content (HTML)
     * @param {Array} buttons - Array of button objects {text, onClick, className}
     * @returns {HTMLElement} Modal element
     */
    createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'quiz-modal';
        
        let buttonsHTML = '';
        buttons.forEach((button, index) => {
            buttonsHTML += `<button class="modal-btn ${button.className || ''}" data-index="${index}">${button.text}</button>`;
        });
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">${buttonsHTML}</div>
            </div>
        `;
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.remove();
        });
        
        buttons.forEach((button, index) => {
            const btn = modal.querySelector(`[data-index="${index}"]`);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (button.onClick) {
                        button.onClick();
                    }
                    modal.remove();
                });
            }
        });
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        return modal;
    },
    
    /**
     * Format date to readable string
     * @param {number} timestamp - Timestamp in milliseconds
     * @returns {string} Formatted date
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        if (date >= today) {
            return '今天';
        } else if (date >= yesterday) {
            return '昨天';
        } else {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizUI;
}
