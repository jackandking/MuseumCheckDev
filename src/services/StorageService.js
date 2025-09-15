/**
 * StorageService - Handles all data persistence operations
 * 
 * Responsibilities:
 * - Abstract localStorage and IndexedDB operations
 * - Handle data loading and saving
 * - Manage storage errors and fallbacks
 * - Provide consistent API for data access
 */

export class StorageService {
    constructor() {
        this.indexedDBSupported = false;
        this.db = null;
    }

    /**
     * Initialize IndexedDB if available
     */
    async initIndexedDB() {
        if (!window.indexedDB) {
            console.log('IndexedDB not supported, using localStorage for all data');
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MuseumCheckDB', 1);

            request.onerror = () => {
                console.log('IndexedDB failed to open, using localStorage for photos');
                resolve();
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.indexedDBSupported = true;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // Create photos store if it doesn't exist
                if (!this.db.objectStoreNames.contains('photos')) {
                    const photosStore = this.db.createObjectStore('photos', { keyPath: 'taskKey' });
                    photosStore.createIndex('taskKey', 'taskKey', { unique: true });
                }
            };
        });
    }

    /**
     * Load visited museums from localStorage
     * @returns {Array} Array of visited museum IDs
     */
    loadVisitedMuseums() {
        try {
            const saved = localStorage.getItem('visitedMuseums');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load visited museums:', error);
            return [];
        }
    }

    /**
     * Save visited museums to localStorage
     * @param {Array} visitedMuseums - Array of visited museum IDs
     */
    saveVisitedMuseums(visitedMuseums) {
        try {
            localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
        } catch (error) {
            console.error('Failed to save visited museums:', error);
        }
    }

    /**
     * Load museum checklists from localStorage
     * @returns {Object} Museum checklists data
     */
    loadMuseumChecklists() {
        try {
            const saved = localStorage.getItem('museumChecklists');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load museum checklists:', error);
            return {};
        }
    }

    /**
     * Save museum checklists to localStorage
     * @param {Object} museumChecklists - Museum checklists data
     */
    saveMuseumChecklists(museumChecklists) {
        try {
            localStorage.setItem('museumChecklists', JSON.stringify(museumChecklists));
        } catch (error) {
            console.error('Failed to save museum checklists:', error);
        }
    }

    /**
     * Load custom checklists from localStorage
     * @returns {Object} Custom checklists data
     */
    loadCustomChecklists() {
        try {
            const saved = localStorage.getItem('customChecklists');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load custom checklists:', error);
            return {};
        }
    }

    /**
     * Save custom checklists to localStorage
     * @param {Object} customChecklists - Custom checklists data
     */
    saveCustomChecklists(customChecklists) {
        try {
            localStorage.setItem('customChecklists', JSON.stringify(customChecklists));
        } catch (error) {
            console.error('Failed to save custom checklists:', error);
        }
    }

    /**
     * Load age group from localStorage
     * @returns {string} Current age group
     */
    loadAgeGroup() {
        try {
            const saved = localStorage.getItem('ageGroup');
            return saved || '7-12';
        } catch (error) {
            console.error('Failed to load age group:', error);
            return '7-12';
        }
    }

    /**
     * Save age group to localStorage
     * @param {string} ageGroup - Age group to save
     */
    saveAgeGroup(ageGroup) {
        try {
            localStorage.setItem('ageGroup', ageGroup);
        } catch (error) {
            console.error('Failed to save age group:', error);
        }
    }

    /**
     * Load task photos from localStorage (fallback method)
     * @returns {Object} Task photos data
     */
    loadTaskPhotos() {
        try {
            const saved = localStorage.getItem('taskPhotos');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load task photos:', error);
            return {};
        }
    }

    /**
     * Load photos from IndexedDB if available, fallback to localStorage
     * @returns {Promise<Object>} Task photos data
     */
    async loadTaskPhotosAsync() {
        if (this.indexedDBSupported) {
            try {
                return await this.getAllPhotosFromIndexedDB();
            } catch (error) {
                console.error('Failed to load photos from IndexedDB:', error);
                return this.loadTaskPhotos(); // Fallback to localStorage
            }
        } else {
            return this.loadTaskPhotos();
        }
    }

    /**
     * Save task photos to localStorage (fallback method)
     * @param {Object} taskPhotos - Task photos data
     */
    saveTaskPhotos(taskPhotos) {
        try {
            localStorage.setItem('taskPhotos', JSON.stringify(taskPhotos));
        } catch (error) {
            console.error('Failed to save task photos:', error);
            // Handle localStorage quota exceeded or other errors
            if (error.name === 'QuotaExceededError') {
                alert('存储空间不足，无法保存更多照片。请尝试删除一些旧照片。');
            } else {
                alert('保存照片时发生错误，请重试。');
            }
        }
    }

    /**
     * Save individual photo using IndexedDB if available
     * @param {string} taskKey - Task key identifier
     * @param {string} photoData - Photo data URL
     * @returns {Promise<boolean>} Success status
     */
    async saveTaskPhotoAsync(taskKey, photoData) {
        if (this.indexedDBSupported) {
            try {
                await this.storePhotoInIndexedDB(taskKey, photoData);
                return true;
            } catch (error) {
                console.error('Failed to save photo to IndexedDB:', error);
                return false;
            }
        } else {
            // Fallback to localStorage
            const taskPhotos = this.loadTaskPhotos();
            taskPhotos[taskKey] = photoData;
            this.saveTaskPhotos(taskPhotos);
            return true;
        }
    }

    /**
     * Store photo in IndexedDB
     * @param {string} taskKey - Task key identifier
     * @param {string} photoData - Photo data URL
     * @returns {Promise} Promise that resolves when photo is stored
     */
    async storePhotoInIndexedDB(taskKey, photoData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            const photoObject = {
                taskKey: taskKey,
                data: photoData,
                timestamp: Date.now()
            };
            
            const request = store.put(photoObject);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all photos from IndexedDB
     * @returns {Promise<Object>} All photos data
     */
    async getAllPhotosFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const photos = {};
                request.result.forEach(photo => {
                    photos[photo.taskKey] = photo.data;
                });
                resolve(photos);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete photo from IndexedDB
     * @param {string} taskKey - Task key identifier
     * @returns {Promise} Promise that resolves when photo is deleted
     */
    async deletePhotoFromIndexedDB(taskKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            const request = store.delete(taskKey);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Migrate existing localStorage photos to IndexedDB
     * @returns {Promise} Promise that resolves when migration is complete
     */
    async migratePhotosToIndexedDB() {
        if (!this.indexedDBSupported) return;
        
        try {
            const localStoragePhotos = this.loadTaskPhotos();
            
            if (Object.keys(localStoragePhotos).length === 0) return;
            
            console.log('Migrating photos from localStorage to IndexedDB...');
            
            for (const [taskKey, photoData] of Object.entries(localStoragePhotos)) {
                await this.storePhotoInIndexedDB(taskKey, photoData);
            }
            
            // Clear localStorage photos after successful migration
            localStorage.removeItem('taskPhotos');
            console.log('Photo migration completed successfully');
            
        } catch (error) {
            console.error('Error migrating photos to IndexedDB:', error);
        }
    }

    /**
     * Clear all data from localStorage
     */
    clearAllData() {
        if (confirm('⚠️ 确定要清空所有数据吗？这将删除所有参观记录、完成的清单和上传的照片。此操作无法撤销！')) {
            try {
                // Clear localStorage
                localStorage.removeItem('visitedMuseums');
                localStorage.removeItem('museumChecklists'); 
                localStorage.removeItem('customChecklists');
                localStorage.removeItem('taskPhotos');
                
                // Clear IndexedDB if supported
                if (this.indexedDBSupported && this.db) {
                    const transaction = this.db.transaction(['photos'], 'readwrite');
                    const store = transaction.objectStore('photos');
                    store.clear();
                }
                
                alert('✅ 所有数据已清空！页面将刷新。');
                location.reload();
                
            } catch (error) {
                console.error('Error clearing data:', error);
                alert('❌ 清空数据时出现错误，请手动刷新页面重试。');
            }
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Object} Storage usage information
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            const items = {};
            
            // Calculate localStorage usage
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const value = localStorage.getItem(key);
                    const size = new Blob([value]).size;
                    items[key] = size;
                    totalSize += size;
                }
            }
            
            return {
                totalSize,
                items,
                formatted: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            return { totalSize: 0, items: {}, formatted: '0 B' };
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}