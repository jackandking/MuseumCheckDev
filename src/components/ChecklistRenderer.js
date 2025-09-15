/**
 * ChecklistRenderer Component - Handles checklist rendering and interactions
 * 
 * Responsibilities:
 * - Render checklist items with completion states
 * - Handle checkbox interactions and photo uploads
 * - Manage custom checklist items (add, edit, delete)
 * - Photo management for child tasks
 * - Scroll navigation and UX enhancements
 */

export class ChecklistRenderer {
    constructor(app) {
        this.app = app; // Reference to main MuseumCheckApp instance
    }

    /**
     * Render checklist items
     * @param {string} museumId - Museum ID
     * @param {string} type - Checklist type ('parent' or 'child')
     * @param {Array} items - Default checklist items
     * @returns {string} HTML string for checklist
     */
    render(museumId, type, items) {
        const checklistKey = `${museumId}-${type}-${this.app.currentAge}`;
        const completed = this.app.museumChecklists[checklistKey] || [];
        
        // Get custom checklist items if they exist, otherwise use default items
        const customItems = this.app.customChecklists[checklistKey];
        const displayItems = customItems ? customItems.map(item => item.text) : items;

        const checklistItems = displayItems.map((item, index) => {
            return this.renderChecklistItem(item, index, checklistKey, type, completed, customItems);
        }).join('');

        // Add "Add new item" button
        const addButton = this.renderAddItemButton(checklistKey);

        return checklistItems + addButton;
    }

    /**
     * Render individual checklist item
     * @param {string} item - Item text
     * @param {number} index - Item index
     * @param {string} checklistKey - Checklist key
     * @param {string} type - Checklist type
     * @param {Array} completed - Array of completed item indices
     * @param {Array} customItems - Custom items array
     * @returns {string} HTML string for checklist item
     */
    renderChecklistItem(item, index, checklistKey, type, completed, customItems) {
        const itemId = `${checklistKey}-${index}`;
        const photoKey = `${checklistKey}-${index}`;
        const isCompleted = completed.includes(index);
        const hasPhoto = this.app.taskPhotos[photoKey];
        const isCustom = customItems && customItems[index] && customItems[index].isCustom;
        
        let photoUpload = '';
        if (type === 'child' && isCompleted) {
            photoUpload = this.renderPhotoUpload(itemId, photoKey, hasPhoto);
        }
        
        return `
            <div class="checklist-item ${isCompleted ? 'completed' : ''}" data-checklist-key="${checklistKey}" data-item-index="${index}">
                <input type="checkbox" id="${itemId}" ${isCompleted ? 'checked' : ''} 
                       data-checklist="${checklistKey}" data-index="${index}">
                <label for="${itemId}" class="checklist-label" data-original-text="${item}">${item}</label>
                <div class="checklist-controls">
                    <button class="edit-item-btn" title="编辑">✏️</button>
                    <button class="delete-item-btn" title="删除" ${!isCustom && !customItems ? 'disabled' : ''}>🗑️</button>
                </div>
                ${photoUpload}
            </div>
        `;
    }

    /**
     * Render photo upload section for child tasks
     * @param {string} itemId - Item ID
     * @param {string} photoKey - Photo key
     * @param {string} hasPhoto - Existing photo data URL
     * @returns {string} Photo upload HTML
     */
    renderPhotoUpload(itemId, photoKey, hasPhoto) {
        return `
            <div class="photo-upload-section">
                <label for="photo-${itemId}" class="photo-upload-label">
                    📷 上传照片留念
                </label>
                <input type="file" id="photo-${itemId}" accept="image/*" class="photo-input" 
                       data-task-key="${photoKey}" style="display: none;">
                ${hasPhoto ? `<img src="${hasPhoto}" class="task-photo" alt="任务照片">` : ''}
            </div>
        `;
    }

    /**
     * Render add item button
     * @param {string} checklistKey - Checklist key
     * @returns {string} Add button HTML
     */
    renderAddItemButton(checklistKey) {
        return `
            <div class="add-item-section">
                <button class="add-item-btn" data-checklist-key="${checklistKey}">➕ 添加新项目</button>
            </div>
        `;
    }

    /**
     * Setup checklist event listeners
     */
    setupEventListeners() {
        // Checkbox change events
        this.setupCheckboxEventListeners();
        
        // Photo upload events
        this.setupPhotoUploadEventListeners();
        
        // Custom item management events
        this.setupCustomItemEventListeners();
        
        // Clear checklist button events
        this.setupClearChecklistEventListeners();
    }

    /**
     * Setup checkbox event listeners
     */
    setupCheckboxEventListeners() {
        const checkboxes = document.querySelectorAll('#modalContent input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleCheckboxChange(e);
            });
        });
    }

    /**
     * Handle checkbox change event
     * @param {Event} e - Change event
     */
    handleCheckboxChange(e) {
        const checklistKey = e.target.dataset.checklist;
        const index = parseInt(e.target.dataset.index);
        
        if (!this.app.museumChecklists[checklistKey]) {
            this.app.museumChecklists[checklistKey] = [];
        }
        
        const completed = this.app.museumChecklists[checklistKey];
        const itemIndex = completed.indexOf(index);
        
        if (e.target.checked && itemIndex === -1) {
            // Item checked - add to completed
            completed.push(index);
            this.app.triggerSmallRocket();
            
            // Enhanced UX: Auto-scroll to next unchecked item after a brief celebration
            setTimeout(() => {
                this.scrollToNextUncheckedItem(e.target);
            }, 800);
            
            // Add photo upload option for child tasks
            const checklistType = this.getChecklistTypeFromKey(checklistKey);
            if (checklistType === 'child') {
                this.addPhotoUploadToItem(e.target.closest('.checklist-item'), checklistKey, index);
            }
        } else if (!e.target.checked && itemIndex !== -1) {
            // Item unchecked - remove from completed
            completed.splice(itemIndex, 1);
            
            // Remove photo upload option for child tasks
            const checklistType = this.getChecklistTypeFromKey(checklistKey);
            if (checklistType === 'child') {
                this.removePhotoUploadFromItem(e.target.closest('.checklist-item'));
            }
        }
        
        this.app.storageService.saveMuseumChecklists(this.app.museumChecklists);
        
        // Track checklist item completion
        const keyParts = checklistKey.split('-');
        const ageGroup = keyParts[keyParts.length - 1]; 
        const ageGroupStart = keyParts[keyParts.length - 2]; 
        const fullAgeGroup = `${ageGroupStart}-${ageGroup}`;
        const checklistType = keyParts[keyParts.length - 3]; 
        const museumId = keyParts.slice(0, -2).join('-');
        
        this.app.analyticsService.trackChecklistItem(museumId, checklistType, fullAgeGroup, e.target.checked);
    }

    /**
     * Setup photo upload event listeners
     */
    setupPhotoUploadEventListeners() {
        // Use event delegation for photo inputs
        document.addEventListener('change', (e) => {
            if (e.target.matches('.photo-input')) {
                this.handlePhotoUpload(e);
            }
        });
    }

    /**
     * Handle photo upload
     * @param {Event} event - Change event from file input
     */
    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Show loading indicator while processing large files
        const uploadSection = event.target.closest('.photo-upload-section');
        const loadingText = document.createElement('div');
        loadingText.className = 'photo-loading';
        loadingText.textContent = '📷 处理照片中...';
        uploadSection.appendChild(loadingText);
        
        try {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('照片文件过大，请选择小于10MB的图片');
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const taskKey = event.target.dataset.taskKey;
                    let processedImageData = e.target.result;
                    
                    // Compress image if it's too large
                    if (e.target.result.length > 500 * 1024) { // > 500KB
                        processedImageData = await this.compressImage(e.target.result, 0.7, 800);
                    }
                    
                    // Save photo using storage service
                    const success = await this.app.storageService.saveTaskPhotoAsync(taskKey, processedImageData);
                    
                    if (success) {
                        // Update in-memory cache
                        this.app.taskPhotos[taskKey] = processedImageData;
                        
                        // Update UI to show photo
                        this.displayUploadedPhoto(uploadSection, processedImageData);
                        
                        // Track photo upload
                        this.app.analyticsService.trackPhotoUpload(taskKey, file.size, file.type);
                        
                        this.app.showNotification('📷 照片上传成功！', 'success');
                    } else {
                        throw new Error('Failed to save photo');
                    }
                } catch (error) {
                    console.error('Error processing photo:', error);
                    alert('照片处理失败，请重试');
                } finally {
                    // Remove loading indicator
                    if (loadingText && loadingText.parentNode) {
                        loadingText.remove();
                    }
                }
            };
            
            reader.onerror = () => {
                alert('照片读取失败，请重试');
                if (loadingText && loadingText.parentNode) {
                    loadingText.remove();
                }
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('照片上传出错，请重试');
            if (loadingText && loadingText.parentNode) {
                loadingText.remove();
            }
        }
    }

    /**
     * Setup custom item management event listeners
     */
    setupCustomItemEventListeners() {
        // Add item buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-item-btn')) {
                this.handleAddItem(e.target.dataset.checklistKey);
            }
        });
        
        // Edit item buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.edit-item-btn')) {
                this.handleEditItem(e.target);
            }
        });
        
        // Delete item buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.delete-item-btn')) {
                this.handleDeleteItem(e.target);
            }
        });
    }

    /**
     * Setup clear checklist button event listeners
     */
    setupClearChecklistEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.clear-parent-button')) {
                const museumId = e.target.dataset.museum;
                this.app.clearParentChecklistData(museumId, this.app.currentAge);
            }
            
            if (e.target.matches('.clear-child-button')) {
                const museumId = e.target.dataset.museum;
                this.app.clearChildChecklistData(museumId, this.app.currentAge);
            }
        });
    }

    /**
     * Add photo upload to completed child task item
     * @param {HTMLElement} item - Checklist item element
     * @param {string} checklistKey - Checklist key
     * @param {number} index - Item index
     */
    addPhotoUploadToItem(item, checklistKey, index) {
        // Don't add if already exists
        if (item.querySelector('.photo-upload-section')) return;
        
        const itemId = `${checklistKey}-${index}`;
        const photoKey = `${checklistKey}-${index}`;
        const hasPhoto = this.app.taskPhotos[photoKey];
        
        const photoUploadHTML = this.renderPhotoUpload(itemId, photoKey, hasPhoto);
        item.insertAdjacentHTML('beforeend', photoUploadHTML);
    }

    /**
     * Remove photo upload from item
     * @param {HTMLElement} item - Checklist item element
     */
    removePhotoUploadFromItem(item) {
        const photoSection = item.querySelector('.photo-upload-section');
        if (photoSection) {
            photoSection.remove();
        }
    }

    /**
     * Display uploaded photo in the UI
     * @param {HTMLElement} uploadSection - Photo upload section
     * @param {string} imageData - Image data URL
     */
    displayUploadedPhoto(uploadSection, imageData) {
        let photoImg = uploadSection.querySelector('.task-photo');
        
        if (photoImg) {
            photoImg.src = imageData;
        } else {
            photoImg = document.createElement('img');
            photoImg.className = 'task-photo';
            photoImg.src = imageData;
            photoImg.alt = '任务照片';
            uploadSection.appendChild(photoImg);
        }
    }

    /**
     * Compress image to reduce file size
     * @param {string} imageData - Original image data URL
     * @param {number} quality - Compression quality (0-1)
     * @param {number} maxWidth - Maximum width
     * @returns {Promise<string>} Compressed image data URL
     */
    async compressImage(imageData, quality = 0.7, maxWidth = 800) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                const compressedData = canvas.toDataURL('image/jpeg', quality);
                
                resolve(compressedData);
            };
            
            img.src = imageData;
        });
    }

    /**
     * Handle add item button click
     * @param {string} checklistKey - Checklist key
     */
    handleAddItem(checklistKey) {
        const newText = prompt('请输入新的清单项目：');
        if (newText && newText.trim()) {
            this.app.insertChecklistItem(checklistKey, newText.trim());
            
            // Track custom item addition
            this.app.analyticsService.trackCustomItemAdd(checklistKey);
        }
    }

    /**
     * Handle edit item button click
     * @param {HTMLElement} button - Edit button element
     */
    handleEditItem(button) {
        const item = button.closest('.checklist-item');
        const label = item.querySelector('.checklist-label');
        const originalText = label.dataset.originalText || label.textContent;
        
        const newText = prompt('编辑清单项目：', originalText);
        if (newText && newText.trim() && newText.trim() !== originalText) {
            label.textContent = newText.trim();
            label.dataset.originalText = newText.trim();
            
            // Update in storage
            const checklistKey = item.dataset.checklistKey;
            const itemIndex = parseInt(item.dataset.itemIndex);
            
            if (!this.app.customChecklists[checklistKey]) {
                this.app.initializeCustomChecklist(checklistKey);
            }
            
            if (this.app.customChecklists[checklistKey][itemIndex]) {
                this.app.customChecklists[checklistKey][itemIndex].text = newText.trim();
            }
            
            this.app.storageService.saveCustomChecklists(this.app.customChecklists);
        }
    }

    /**
     * Handle delete item button click
     * @param {HTMLElement} button - Delete button element
     */
    handleDeleteItem(button) {
        if (button.disabled) return;
        
        const item = button.closest('.checklist-item');
        const label = item.querySelector('.checklist-label');
        const itemText = label.textContent;
        
        if (confirm(`确定要删除"${itemText}"吗？`)) {
            const checklistKey = item.dataset.checklistKey;
            const itemIndex = parseInt(item.dataset.itemIndex);
            
            // Remove from custom checklists
            if (this.app.customChecklists[checklistKey]) {
                this.app.customChecklists[checklistKey].splice(itemIndex, 1);
                this.app.storageService.saveCustomChecklists(this.app.customChecklists);
            }
            
            // Remove from completed items
            if (this.app.museumChecklists[checklistKey]) {
                const completedIndex = this.app.museumChecklists[checklistKey].indexOf(itemIndex);
                if (completedIndex !== -1) {
                    this.app.museumChecklists[checklistKey].splice(completedIndex, 1);
                    this.app.storageService.saveMuseumChecklists(this.app.museumChecklists);
                }
            }
            
            // Remove from DOM
            item.remove();
        }
    }

    /**
     * Scroll to next unchecked item for better UX
     * @param {HTMLElement} currentCheckbox - Currently checked checkbox
     */
    scrollToNextUncheckedItem(currentCheckbox) {
        const currentItem = currentCheckbox.closest('.checklist-item');
        const checklistContainer = currentItem.closest('.checklist-content');
        
        if (!checklistContainer) return;
        
        const allItems = checklistContainer.querySelectorAll('.checklist-item');
        const currentIndex = Array.from(allItems).indexOf(currentItem);
        
        // Find next unchecked item
        for (let i = currentIndex + 1; i < allItems.length; i++) {
            const checkbox = allItems[i].querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                this.app.smoothScrollToElement(allItems[i], 'center');
                
                // Add subtle highlight to guide user attention
                this.app.highlightElement(allItems[i], 2000, 'rgba(59, 130, 246, 0.1)');
                break;
            }
        }
    }

    /**
     * Get checklist type from checklist key
     * @param {string} checklistKey - Checklist key
     * @returns {string} Checklist type ('parent' or 'child')
     */
    getChecklistTypeFromKey(checklistKey) {
        const parts = checklistKey.split('-');
        return parts[parts.length - 3]; // Type is always third from the end
    }

    /**
     * Refresh checklist display after changes
     * @param {string} museumId - Museum ID
     */
    refresh(museumId) {
        const museum = this.app.getMuseumById(museumId);
        if (!museum) return;
        
        const parentContent = document.getElementById('parentChecklist');
        const childContent = document.getElementById('childChecklist');
        
        if (parentContent) {
            const parentHTML = `
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
                ${this.render(museum.id, 'parent', museum.checklists.parent[this.app.currentAge])}
            `;
            parentContent.innerHTML = parentHTML;
        }
        
        if (childContent) {
            const childHTML = `
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
                ${this.render(museum.id, 'child', museum.checklists.child[this.app.currentAge])}
            `;
            childContent.innerHTML = childHTML;
        }
        
        // Re-attach event listeners with a small delay to ensure DOM is updated
        setTimeout(() => {
            this.setupEventListeners();
        }, 10);
    }
}