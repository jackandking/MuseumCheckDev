/**
 * Image Fallback Configuration for MuseumCheck
 * 
 * This configuration provides multiple image sources and fallbacks
 * to ensure images display even if primary CDNs are blocked
 */

const IMAGE_FALLBACK_CONFIG = {
  // Enable/disable fallback system
  enabled: true,
  
  // Fallback strategies in order of preference
  strategies: [
    'primary',      // Use original imageUrl from museum data
    'wikimedia',    // Try Wikimedia Commons mirror
    'placeholder',  // Use emoji/icon placeholder
  ],
  
  // Wikimedia Commons mirror URLs (in case primary is blocked)
  wikimediaMirrors: [
    'https://upload.wikimedia.org',           // Primary
    'https://commons.wikimedia.org/wiki/Special:Redirect/file',  // Alternative redirect
  ],
  
  // Placeholder configuration
  placeholders: {
    museum: '🏛️',
    treasure: '🏺',
    artifact: '💎',
    painting: '🖼️',
    sculpture: '🗿',
    default: '📸'
  },
  
  // Timeout for image loading (milliseconds)
  loadTimeout: 5000,
  
  // Retry configuration
  retry: {
    enabled: true,
    maxAttempts: 2,
    delay: 1000  // ms between retries
  }
};

// Alternative image sources for major museum treasures
// These can be used if Wikimedia Commons URLs are blocked
const ALTERNATIVE_IMAGE_SOURCES = {
  // National Museum of China treasures
  'simuwu-ding': {
    name: '四羊方尊',
    alternatives: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Simuwu_ding.jpg/600px-Simuwu_ding.jpg',
      // Add alternative CDN sources here if needed
    ]
  },
  
  'houmuwu-ding': {
    name: '后母戊鼎',
    alternatives: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Houmuwu_Ding.jpg/600px-Houmuwu_Ding.jpg',
    ]
  },
  
  // Terracotta Warriors
  'terracotta-army': {
    name: '兵马俑',
    alternatives: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Terracotta_Army_Pit_1.jpg/800px-Terracotta_Army_Pit_1.jpg',
    ]
  },
  
  // Add more treasure alternative sources as needed
};

// Image proxy configuration (if needed for CORS)
const IMAGE_PROXY_CONFIG = {
  enabled: false,  // Set to true if CORS issues occur
  proxyUrl: '',    // e.g., 'https://cors-anywhere.herokuapp.com/'
  excludeDomains: [
    'localhost',
    'github.io',
    'museumcheck.cn'
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    IMAGE_FALLBACK_CONFIG,
    ALTERNATIVE_IMAGE_SOURCES,
    IMAGE_PROXY_CONFIG
  };
}
