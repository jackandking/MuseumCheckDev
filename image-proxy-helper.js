/**
 * Image Proxy Helper for MuseumCheck
 * 
 * This utility provides image proxy functionality to bypass CORS
 * and ad-blocker restrictions for museum treasure images.
 */

const IMAGE_PROXY = {
  /**
   * Available proxy services
   * These are public proxy services that can help load blocked images
   */
  services: {
    // weserv.nl - Free image cache & resize service
    weserv: {
      url: 'https://images.weserv.nl/',
      buildUrl: (originalUrl) => `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=800&q=85`,
      description: 'Free, fast, and reliable image proxy with resizing'
    },
    
    // Cloudflare Images (requires account)
    // cloudflare: {
    //   url: 'https://example.com/cdn-cgi/image/',
    //   buildUrl: (originalUrl) => `https://example.com/cdn-cgi/image/width=800,quality=85/${originalUrl}`,
    //   description: 'Cloudflare image optimization (requires setup)'
    // },
    
    // Direct loading (no proxy)
    direct: {
      url: '',
      buildUrl: (originalUrl) => originalUrl,
      description: 'Load images directly without proxy'
    }
  },
  
  /**
   * Current active proxy service
   */
  activeService: 'direct',  // Default to direct loading
  
  /**
   * Get proxied image URL
   * @param {string} originalUrl - Original image URL
   * @param {string} serviceName - Proxy service to use (optional)
   * @returns {string} - Proxied or original URL
   */
  getProxiedUrl(originalUrl, serviceName = this.activeService) {
    if (!originalUrl) return '';
    
    // Check if URL is already a data URL or local
    if (originalUrl.startsWith('data:') || originalUrl.startsWith('/') || originalUrl.startsWith('./')) {
      return originalUrl;
    }
    
    const service = this.services[serviceName];
    if (!service) {
      console.warn(`Unknown proxy service: ${serviceName}, using direct`);
      return originalUrl;
    }
    
    return service.buildUrl(originalUrl);
  },
  
  /**
   * Set active proxy service
   * @param {string} serviceName - Name of the service to use
   */
  setActiveService(serviceName) {
    if (this.services[serviceName]) {
      this.activeService = serviceName;
      console.log(`Image proxy set to: ${serviceName}`);
    } else {
      console.error(`Invalid proxy service: ${serviceName}`);
    }
  },
  
  /**
   * Try loading image with fallback to proxy
   * @param {string} originalUrl - Original image URL
   * @returns {Promise<string>} - Working image URL
   */
  async loadWithFallback(originalUrl) {
    // Try direct loading first
    try {
      await this.testImageLoad(originalUrl);
      return originalUrl;
    } catch (error) {
      console.log(`Direct load failed for: ${originalUrl}, trying proxy...`);
    }
    
    // Try with proxy
    const proxiedUrl = this.getProxiedUrl(originalUrl, 'weserv');
    try {
      await this.testImageLoad(proxiedUrl);
      console.log(`✅ Proxy load successful: ${proxiedUrl}`);
      return proxiedUrl;
    } catch (error) {
      console.error(`❌ Both direct and proxy load failed for: ${originalUrl}`);
      throw error;
    }
  },
  
  /**
   * Test if an image URL can be loaded
   * @param {string} url - Image URL to test
   * @returns {Promise<void>}
   */
  testImageLoad(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = '';
        reject(new Error('Image load timeout'));
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load error'));
      };
      
      img.src = url;
    });
  },
  
  /**
   * Batch convert URLs to proxied versions
   * @param {Array<Object>} museums - Array of museum objects
   * @param {string} serviceName - Proxy service to use
   * @returns {Array<Object>} - Museums with proxied image URLs
   */
  convertMuseumImages(museums, serviceName = 'weserv') {
    return museums.map(museum => ({
      ...museum,
      image: museum.image ? this.getProxiedUrl(museum.image, serviceName) : museum.image,
      collections: museum.collections ? museum.collections.map(collection => ({
        ...collection,
        imageUrl: this.getProxiedUrl(collection.imageUrl, serviceName)
      })) : museum.collections
    }));
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IMAGE_PROXY;
}

/**
 * USAGE EXAMPLES:
 * 
 * // Example 1: Get proxied URL for a single image
 * const proxiedUrl = IMAGE_PROXY.getProxiedUrl('https://upload.wikimedia.org/...', 'weserv');
 * 
 * // Example 2: Set default proxy service
 * IMAGE_PROXY.setActiveService('weserv');
 * 
 * // Example 3: Try loading with automatic fallback
 * IMAGE_PROXY.loadWithFallback('https://upload.wikimedia.org/...')
 *   .then(workingUrl => console.log('Use this URL:', workingUrl))
 *   .catch(error => console.error('All methods failed'));
 * 
 * // Example 4: Convert all museum images in data
 * const proxiedMuseums = IMAGE_PROXY.convertMuseumImages(MUSEUMS, 'weserv');
 * 
 * // Example 5: Test if an image is accessible
 * IMAGE_PROXY.testImageLoad('https://example.com/image.jpg')
 *   .then(() => console.log('✅ Image is accessible'))
 *   .catch(() => console.log('❌ Image is blocked or unavailable'));
 */
