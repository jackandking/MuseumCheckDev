/**
 * Robust Image Loading Utility for MuseumCheck
 * 
 * Handles image loading with multiple fallback strategies to ensure
 * images display even when primary CDNs are blocked or unavailable
 */

class ImageLoader {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 5000,
      retryAttempts: config.retryAttempts || 2,
      retryDelay: config.retryDelay || 1000,
      placeholders: config.placeholders || {
        museum: '🏛️',
        treasure: '🏺',
        default: '📸'
      }
    };
    
    // Track loaded and failed images
    this.loadedImages = new Set();
    this.failedImages = new Set();
  }
  
  /**
   * Load image with fallback support
   * @param {string} imageUrl - Primary image URL
   * @param {Object} options - Loading options
   * @returns {Promise<string>} - Resolved image URL or placeholder
   */
  async loadImage(imageUrl, options = {}) {
    const {
      alt = '',
      fallbackType = 'default',
      onProgress = null,
      retries = this.config.retryAttempts
    } = options;
    
    // Check cache
    if (this.loadedImages.has(imageUrl)) {
      return imageUrl;
    }
    
    if (this.failedImages.has(imageUrl) && retries <= 0) {
      return this.getPlaceholder(fallbackType);
    }
    
    try {
      // Attempt to load image
      const loaded = await this.attemptLoad(imageUrl);
      if (loaded) {
        this.loadedImages.add(imageUrl);
        return imageUrl;
      }
    } catch (error) {
      console.warn(`Failed to load image: ${imageUrl}`, error);
      
      // Retry if attempts remaining
      if (retries > 0) {
        await this.delay(this.config.retryDelay);
        return this.loadImage(imageUrl, { ...options, retries: retries - 1 });
      }
      
      this.failedImages.add(imageUrl);
    }
    
    // Return placeholder if all attempts failed
    return this.getPlaceholder(fallbackType);
  }
  
  /**
   * Attempt to load a single image
   * @param {string} url - Image URL to load
   * @returns {Promise<boolean>} - True if loaded successfully
   */
  attemptLoad(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = '';  // Cancel load
        reject(new Error('Image load timeout'));
      }, this.config.timeout);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load error'));
      };
      
      img.src = url;
    });
  }
  
  /**
   * Get placeholder emoji for fallback
   * @param {string} type - Placeholder type
   * @returns {string} - Placeholder emoji
   */
  getPlaceholder(type) {
    return this.config.placeholders[type] || this.config.placeholders.default;
  }
  
  /**
   * Delay helper for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Preload multiple images
   * @param {Array<string>} urls - Array of image URLs
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Map of URL to load status
   */
  async preloadImages(urls, onProgress = null) {
    const results = {};
    let loaded = 0;
    
    for (const url of urls) {
      try {
        await this.loadImage(url);
        results[url] = 'success';
      } catch (error) {
        results[url] = 'failed';
      }
      
      loaded++;
      if (onProgress) {
        onProgress(loaded, urls.length, url);
      }
    }
    
    return results;
  }
  
  /**
   * Create image element with fallback handling
   * @param {string} imageUrl - Image URL
   * @param {Object} options - Element options
   * @returns {HTMLImageElement} - Image element with error handling
   */
  createImageElement(imageUrl, options = {}) {
    const {
      alt = '',
      className = '',
      fallbackType = 'default',
      onClick = null
    } = options;
    
    const img = document.createElement('img');
    img.alt = alt;
    if (className) img.className = className;
    if (onClick) img.onclick = onClick;
    
    // Set loading attribute for lazy loading
    img.loading = 'lazy';
    
    // Handle image load error with placeholder
    img.onerror = () => {
      // Replace with placeholder div
      const placeholder = document.createElement('div');
      placeholder.className = className + ' image-placeholder';
      placeholder.textContent = this.getPlaceholder(fallbackType);
      placeholder.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3em;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        color: #999;
      `;
      
      if (img.parentElement) {
        img.parentElement.replaceChild(placeholder, img);
      }
    };
    
    img.src = imageUrl;
    return img;
  }
  
  /**
   * Reset caches (useful for testing or manual refresh)
   */
  resetCache() {
    this.loadedImages.clear();
    this.failedImages.clear();
  }
  
  /**
   * Get loading statistics
   * @returns {Object} - Statistics about loaded/failed images
   */
  getStats() {
    return {
      loaded: this.loadedImages.size,
      failed: this.failedImages.size,
      total: this.loadedImages.size + this.failedImages.size,
      successRate: this.loadedImages.size / (this.loadedImages.size + this.failedImages.size) || 0
    };
  }
}

// Create global instance
const globalImageLoader = new ImageLoader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImageLoader, globalImageLoader };
}
