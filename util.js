/**
 * Utility Functions for Firework Application
 * Provides configuration and data management functions
 */

/**
 * Gets configuration by config ID
 * @param {string} configId - The configuration identifier
 * @param {function} callback - Callback function to receive config data
 */
function getConfig(configId, callback) {
    // For now, return null to use default configuration
    // This allows firework.js to use its default texts
    if (typeof callback === 'function') {
        callback(null);
    }
}

/**
 * Downloads fireworks data from server
 * @param {function} callback - Callback function to receive fireworks array
 */
function downloadFireworks(callback) {
    // Stub implementation - returns empty array
    // In production, this would fetch from a server
    if (typeof callback === 'function') {
        callback([]);
    }
}

/**
 * Uploads a firework event to server
 * @param {string} fireworkId - Unique identifier for the firework
 * @param {number} timestamp - Timestamp of the event
 * @param {number} x - X coordinate of the firework
 * @param {number} y - Y coordinate of the firework
 * @param {string} city - City where the firework was created
 */
function uploadFirework(fireworkId, timestamp, x, y, city) {
    // Stub implementation - logs to console
    // In production, this would send to a server
    console.log('Firework created:', {
        id: fireworkId,
        timestamp: timestamp,
        x: x,
        y: y,
        city: city
    });
}
