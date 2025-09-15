/**
 * MuseumModal Component - Handles museum modal dialog functionality
 * 
 * Responsibilities:
 * - Render museum modal with tabs (expert, parent, child, share)
 * - Handle tab switching and navigation
 * - Manage modal opening/closing
 * - Generate expert guidance content
 * - Setup poster generation functionality
 */

import { EXPERT_GUIDANCE, MULTIPLE_INTELLIGENCE_STRATEGIES, ASSESSMENT_TOOLS } from '../data/index.js';

export class MuseumModal {
    constructor(app) {
        this.app = app; // Reference to main MuseumCheckApp instance
        this.currentMuseum = null;
        this.activeTab = 'parent';
        
        this.ageLabels = {
            '3-6': '3-6岁 (学龄前)',
            '7-12': '7-12岁 (小学)',
            '13-18': '13-18岁 (中学)'
        };
    }

    /**
     * Initialize modal event listeners
     */
    initialize() {
        this.setupModalEventListeners();
    }

    /**
     * Setup modal-related event listeners
     */
    setupModalEventListeners() {
        // Modal close button
        document.querySelector('#museumModal .close').addEventListener('click', () => {
            this.close();
        });

        // Click outside modal to close
        document.getElementById('museumModal').addEventListener('click', (e) => {
            if (e.target.id === 'museumModal') {
                this.close();
            }
        });
    }

    /**
     * Open museum modal with specified museum and active tab
     * @param {Object} museum - Museum object
     * @param {string} activeTab - Active tab to show ('expert', 'parent', 'child', 'share')
     */
    open(museum, activeTab = 'parent') {
        this.currentMuseum = museum;
        this.activeTab = activeTab;
        
        const modal = document.getElementById('museumModal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');

        title.textContent = `${museum.name} - 亲子参观指南`;

        // Generate modal content
        content.innerHTML = this.generateModalContent(museum, activeTab);

        // Setup tab switching
        this.setupTabSwitching();
        
        // Setup share button functionality
        this.setupShareButtons();

        // Show modal
        modal.classList.remove('hidden');
        
        // Enhanced UX: Ensure modal content starts at the top
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }, 100);
        
        // Set up checklist event listeners after modal content is rendered
        this.app.addChecklistEventListeners();
        
        // Set up poster generation
        this.setupPosterGeneration(museum);
        
        // Track modal open
        this.app.analyticsService.trackModalOpen(museum.id, museum.name, this.app.currentAge, activeTab);
    }

    /**
     * Close the modal
     */
    close() {
        document.getElementById('museumModal').classList.add('hidden');
        this.currentMuseum = null;
        this.activeTab = 'parent';
    }

    /**
     * Generate the complete modal content HTML
     * @param {Object} museum - Museum object
     * @param {string} activeTab - Active tab
     * @returns {string} HTML content
     */
    generateModalContent(museum, activeTab) {
        const expertContent = this.generateExpertGuidanceContent();
        const parentContent = this.generateParentChecklistContent(museum);
        const childContent = this.generateChildChecklistContent(museum);
        const shareContent = this.generateShareContent();

        return `
            <div class="checklist-tabs">
                <button class="tab-button ${activeTab === 'expert' ? 'active' : ''}" data-target="expert">👨‍👩‍👧 专家指导</button>
                <button class="tab-button ${activeTab === 'parent' ? 'active' : ''}" data-target="parent">家长准备</button>
                <button class="tab-button ${activeTab === 'child' ? 'active' : ''}" data-target="child">孩子任务</button>
                <button class="tab-button ${activeTab === 'share' ? 'active' : ''}" data-target="share">生成海报</button>
            </div>
            ${museum.image ? `<div class="museum-image-section">
                <img src="${museum.image}" alt="${museum.name}" class="museum-image" />
            </div>` : ''}
            
            <div id="expertGuidance" class="checklist-content expert-guidance" ${activeTab !== 'expert' ? 'style="display: none;"' : ''}>
                ${expertContent}
            </div>
            
            <div id="parentChecklist" class="checklist-content" ${activeTab !== 'parent' ? 'style="display: none;"' : ''}>
                ${parentContent}
            </div>
            
            <div id="childChecklist" class="checklist-content" ${activeTab !== 'child' ? 'style="display: none;"' : ''}>
                ${childContent}
            </div>
            
            <div id="shareChecklist" class="checklist-content" ${activeTab !== 'share' ? 'style="display: none;"' : ''}>
                ${shareContent}
            </div>
        `;
    }

    /**
     * Generate expert guidance content
     * @returns {string} Expert guidance HTML
     */
    generateExpertGuidanceContent() {
        const guidance = EXPERT_GUIDANCE[this.app.currentAge];
        
        return `
            <div class="expert-header">
                <h3>🎓 ${this.ageLabels[this.app.currentAge]} 专家指导</h3>
                <div class="age-stage-info">
                    <span class="stage-label">${guidance.cognitiveStage}</span>
                </div>
            </div>
            
            <div class="expert-section relationship-focus">
                <h4>💖 亲子关系提升核心目标</h4>
                <div class="core-goal">
                    <p class="goal-statement">${guidance.relationshipFocus.coreGoal}</p>
                </div>
            </div>
            
            <div class="expert-section">
                <h4>🧠 发展特点</h4>
                <p class="developmental-traits">${guidance.developmentalTraits}</p>
            </div>
            
            <div class="expert-section">
                <h4>👥 亲子互动指导</h4>
                <ul class="expert-tips">
                    ${guidance.parentingTips.slice(0, 5).map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
            
            <div class="expert-section">
                <h4>❤️ 情感支持要点</h4>
                <ul class="emotional-support">
                    ${guidance.emotionalSupport.slice(0, 4).map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
            
            <div class="expert-section">
                <h4>💬 对话启发技巧</h4>
                <div class="dialogue-section">
                    <div class="dialogue-starters">
                        <strong>📝 推荐话题开场：</strong>
                        <ul>
                            ${guidance.dialogueStarters.slice(0, 4).map(starter => `<li>${starter}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="expert-section">
                <h4>🧩 多元智能激发</h4>
                <div class="intelligence-grid">
                    ${Object.entries(MULTIPLE_INTELLIGENCE_STRATEGIES).slice(0, 4).map(([key, value]) => `
                        <div class="intelligence-item">
                            <div class="intelligence-header">
                                <strong>${value.name}</strong>
                            </div>
                            <div class="intelligence-desc">${value.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="expert-section">
                <h4>🚨 常见挑战应对</h4>
                <div class="challenges-section">
                    ${guidance.commonChallenges.slice(0, 3).map(challenge => `
                        <div class="challenge-item">
                            <div class="challenge-situation">
                                <strong>情况：</strong>${challenge.situation}
                            </div>
                            <div class="challenge-solution">
                                <strong>应对：</strong>${challenge.solution}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${guidance.attachmentStrategies ? `
            <div class="expert-section">
                <h4>💕 依恋关系建立</h4>
                <ul class="attachment-strategies">
                    ${guidance.attachmentStrategies.map(strategy => `<li>${strategy}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${guidance.scaffoldingTechniques ? `
            <div class="expert-section">
                <h4>🏗️ 学习支架技巧</h4>
                <ul class="scaffolding-techniques">
                    ${guidance.scaffoldingTechniques.map(technique => `<li>${technique}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${guidance.autonomySupport ? `
            <div class="expert-section">
                <h4>🎯 自主性支持</h4>
                <ul class="autonomy-support">
                    ${guidance.autonomySupport.map(support => `<li>${support}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${guidance.inclusiveSupport ? `
            <div class="expert-section">
                <h4>🌈 包容性支持</h4>
                <ul class="inclusive-support">
                    ${guidance.inclusiveSupport.map(support => `<li>${support}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="expert-section">
                <h4>📊 参与度评估指标</h4>
                <div class="assessment-section">
                    <p class="assessment-intro">观察这些积极信号，了解孩子的学习状态：</p>
                    <ul class="engagement-indicators">
                        ${ASSESSMENT_TOOLS.engagementIndicators[this.app.currentAge].slice(0, 4).map(indicator => `<li>${indicator}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="expert-section">
                <h4>📚 延伸学习建议</h4>
                <div class="extension-activities">
                    <div class="activity-card">
                        <strong>🏠 回家后</strong>
                        <p>整理参观照片，制作家庭博物馆相册，分享今天的发现</p>
                    </div>
                    <div class="activity-card">
                        <strong>📖 深入阅读</strong>
                        <p>根据孩子兴趣，选择相关主题的绘本或科普读物</p>
                    </div>
                    <div class="activity-card">
                        <strong>🎨 动手实践</strong>
                        <p>制作小手工、画画或搭建模型，巩固博物馆体验</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate parent checklist content
     * @param {Object} museum - Museum object
     * @returns {string} Parent checklist HTML
     */
    generateParentChecklistContent(museum) {
        return `
            <div class="checklist-header">
                <h3>家长准备事项</h3>
                <div class="checklist-actions">
                    <button class="share-button" data-type="parent" title="分享家长准备清单">
                        🔗
                    </button>
                    <button class="clear-checklist-button clear-parent-button" data-museum="${museum.id}" data-type="parent" title="清空家长清单数据">
                        🗑️
                    </button>
                </div>
            </div>
            ${this.app.renderChecklist(museum.id, 'parent', museum.checklists.parent[this.app.currentAge])}
        `;
    }

    /**
     * Generate child checklist content
     * @param {Object} museum - Museum object
     * @returns {string} Child checklist HTML
     */
    generateChildChecklistContent(museum) {
        return `
            <div class="checklist-header">
                <h3>孩子探索任务</h3>
                <div class="checklist-actions">
                    <button class="share-button" data-type="child" title="分享孩子任务清单">
                        🔗
                    </button>
                    <button class="clear-checklist-button clear-child-button" data-museum="${museum.id}" data-type="child" title="清空孩子清单数据">
                        🗑️
                    </button>
                </div>
            </div>
            ${this.app.renderChecklist(museum.id, 'child', museum.checklists.child[this.app.currentAge])}
        `;
    }

    /**
     * Generate share content
     * @returns {string} Share content HTML
     */
    generateShareContent() {
        return `
            <h3>生成分享海报</h3>
            <div class="share-poster-section">
                <p class="share-description">📸 将已完成的任务和照片生成精美海报，方便分享朋友圈留念！</p>
                <button id="generatePoster" class="poster-button">🎨 生成海报</button>
                <canvas id="posterCanvas" style="display: none; max-width: 100%;"></canvas>
                <div id="posterPreview" class="poster-preview"></div>
                <button id="downloadPoster" class="poster-button" style="display: none;">📱 下载海报</button>
            </div>
        `;
    }

    /**
     * Setup tab switching functionality
     */
    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('#modalContent .tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const target = button.dataset.target;
                this.switchTab(target);
                
                // Track tab switching
                this.app.analyticsService.trackTabSwitch(target, this.currentMuseum.id);
            });
        });
    }

    /**
     * Switch to specified tab
     * @param {string} target - Target tab name
     */
    switchTab(target) {
        this.activeTab = target;
        
        // Update active tab button
        const tabButtons = document.querySelectorAll('#modalContent .tab-button');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-target="${target}"]`).classList.add('active');
        
        // Show corresponding content
        document.getElementById('expertGuidance').style.display = target === 'expert' ? 'block' : 'none';
        document.getElementById('parentChecklist').style.display = target === 'parent' ? 'block' : 'none';
        document.getElementById('childChecklist').style.display = target === 'child' ? 'block' : 'none';
        document.getElementById('shareChecklist').style.display = target === 'share' ? 'block' : 'none';
        
        // Enhanced UX: Smooth scroll to the content area after tab switch
        setTimeout(() => {
            this.scrollToTabContent(target);
        }, 100);
    }

    /**
     * Setup share button functionality
     */
    setupShareButtons() {
        const shareButtons = document.querySelectorAll('#modalContent .share-button');
        shareButtons.forEach(button => {
            button.addEventListener('click', () => {
                const checklistType = button.dataset.type;
                this.app.shareChecklist(this.currentMuseum, checklistType);
            });
        });
    }

    /**
     * Setup poster generation functionality
     * @param {Object} museum - Museum object
     */
    setupPosterGeneration(museum) {
        const generateButton = document.getElementById('generatePoster');
        const downloadButton = document.getElementById('downloadPoster');
        
        if (generateButton) {
            generateButton.addEventListener('click', () => {
                this.app.generatePoster(museum);
            });
        }
        
        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                this.app.downloadPoster(museum);
            });
        }
    }

    /**
     * Scroll to tab content for better UX
     * @param {string} target - Target tab
     */
    scrollToTabContent(target) {
        let targetElement;
        
        switch (target) {
            case 'expert':
                targetElement = document.getElementById('expertGuidance');
                break;
            case 'parent':
                targetElement = document.getElementById('parentChecklist');
                break;
            case 'child':
                targetElement = document.getElementById('childChecklist');
                break;
            case 'share':
                targetElement = document.getElementById('shareChecklist');
                break;
            default:
                return;
        }
        
        if (targetElement && targetElement.style.display !== 'none') {
            // Scroll to the content section header
            const header = targetElement.querySelector('h3, .checklist-header');
            const scrollTarget = header || targetElement;
            this.app.smoothScrollToElement(scrollTarget, 'start');
        }
    }

    /**
     * Get current museum
     * @returns {Object|null} Current museum object
     */
    getCurrentMuseum() {
        return this.currentMuseum;
    }

    /**
     * Get active tab
     * @returns {string} Active tab name
     */
    getActiveTab() {
        return this.activeTab;
    }

    /**
     * Check if modal is open
     * @returns {boolean} Whether modal is open
     */
    isOpen() {
        return !document.getElementById('museumModal').classList.contains('hidden');
    }
}