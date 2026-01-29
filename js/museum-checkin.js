        // Configuration
        const REMOTE_STORAGE_CONFIG = {
            API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore',
            FIREWORK_KEY: 'museumcheck-firework',
            CHECKIN_KEY_PREFIX: 'museumcheck-checkin-',
            TREASURE_REPORT_KEY: 'museumcheck-treasure-report',
            IMAGE_ERROR_REPORT_KEY: 'museumcheck-image-error-report',
            // Far future timestamp: year 2124 in Unix seconds
            // Calculated as: new Date('2124-01-01T00:00:00Z').getTime() / 1000
            // Used to set data that should persist indefinitely
            TIMESTAMP_2124: 4866674732
        };

        // Get museum ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const museumId = urlParams.get('id') || urlParams.get('museum') || 'forbidden-city';
        // Use saved age group from localStorage first, then URL parameter as fallback
        const savedAgeGroup = localStorage.getItem('ageGroup');
        const ageGroup = savedAgeGroup || urlParams.get('age') || '7-12';
        const editMode = urlParams.get('edit') === 'true';

        // =====================================================
        // EventWallService moved to event-wall-service.js (shared module)
        // Ensure the shared file is loaded before this inline script. Initialize instance below.

        // Initialize Event Wall Service
        const eventWallService = new EventWallService();

        // State management
        let currentMuseum = null;
        let childTasks = [];
        let completedTasks = new Set();
        let reportedTasks = new Set(); // Tasks completed by reporting "不存在" (treasure not found)
        let currentTaskIndex = null;
        let treasureReports = {}; // Cache for treasure not-found reports

        // =====================================================
        // 镇馆之宝不存在报告功能
        // Treasure Not Found Report Feature
        // =====================================================
        
        // Thresholds for report counts
        const TREASURE_WARNING_THRESHOLD = 3;  // Yellow border when 3+ reports
        const TREASURE_UNAVAILABLE_THRESHOLD = 5;  // Red border when 5+ reports
        
        // Task type identifier for treasure tasks (for internationalization)
        const TREASURE_TASK_IDENTIFIER = '镇馆之宝';

        /**
         * Generate a unique sort key for a treasure report
         * @param {string} museumId - Museum ID
         * @param {string} treasureName - Treasure name
         * @returns {string} Sort key
         */
        function getTreasureReportSortKey(museumId, treasureName) {
            // Use Base64 encoding to avoid special characters in sortKey
            // encodeURIComponent handles Unicode, then we convert to Base64
            const combined = `${museumId}:${treasureName}`;
            // Use TextEncoder for proper Unicode to bytes conversion
            const encoder = new TextEncoder();
            const bytes = encoder.encode(combined);
            // Convert bytes to a string for btoa
            const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
            return 'treasure-' + btoa(binaryString);
        }

        /**
         * Load all treasure reports from KV store
         * @returns {Promise<Object>} Object with treasure reports keyed by sortKey
         */
        async function loadTreasureReports() {
            try {
                const url = `${REMOTE_STORAGE_CONFIG.API_ENDPOINT}?key=${encodeURIComponent(REMOTE_STORAGE_CONFIG.TREASURE_REPORT_KEY)}&sortKey=*`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        return {};
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const reports = {};
                
                const itemsArray = data.items || data.Items || [];
                for (const item of itemsArray) {
                    const sortKey = item.sortKey || item.sk || '';
                    if (!sortKey.startsWith('treasure-')) continue;
                    
                    try {
                        const parsed = JSON.parse(item.value);
                        reports[sortKey] = parsed;
                    } catch (e) {
                        console.warn('Failed to parse treasure report:', e);
                    }
                }
                
                console.log('Loaded treasure reports:', reports);
                return reports;
            } catch (error) {
                console.error('Error loading treasure reports:', error);
                return {};
            }
        }

        /**
         * Get the report count for a specific treasure
         * @param {string} treasureName - Name of the treasure
         * @returns {number} Report count
         */
        function getTreasureReportCount(treasureName) {
            const sortKey = getTreasureReportSortKey(museumId, treasureName);
            const report = treasureReports[sortKey];
            return report ? (report.reportCount || 0) : 0;
        }

        /**
         * Fetch a single treasure report from KV store
         * @param {string} sortKey - Sort key for the treasure report
         * @returns {Promise<Object|null>} The report object or null if not found
         */
        async function fetchTreasureReportFromKV(sortKey) {
            try {
                const keyParam = encodeURIComponent(REMOTE_STORAGE_CONFIG.TREASURE_REPORT_KEY);
                const sortKeyParam = encodeURIComponent(sortKey);
                const url = `${REMOTE_STORAGE_CONFIG.API_ENDPOINT}?key=${keyParam}&sortKey=${sortKeyParam}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        return null;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (data && data.value) {
                    return JSON.parse(data.value);
                }
                return null;
            } catch (error) {
                console.error('Error fetching treasure report from KV:', error);
                return null;
            }
        }

        /**
         * Automatically delete a treasure from museum data when it reaches 5+ reports
         * @param {string} treasureName - Name of the treasure to delete
         * @returns {Promise<boolean>} Success status
         */
        async function autoDeleteTreasure(treasureName) {
            try {
                if (!window.museumDataLoader || !currentMuseum) {
                    console.error('Museum data loader or current museum not available');
                    return false;
                }

                // Load fresh museum data
                const museumData = await window.museumDataLoader.loadMuseum(museumId, false);
                if (!museumData || !museumData.collections) {
                    console.error('Failed to load museum data for auto-deletion');
                    return false;
                }

                // Find and remove the treasure from collections
                const originalCount = museumData.collections.length;
                museumData.collections = museumData.collections.filter(t => t.name !== treasureName);
                const newCount = museumData.collections.length;

                if (originalCount === newCount) {
                    console.log(`Treasure "${treasureName}" not found in museum collections, skipping deletion`);
                    return false;
                }

                // Save updated museum data to KV store
                const success = await window.museumDataLoader.saveToKVStore(museumId, museumData);
                
                if (success) {
                    console.log(`Successfully auto-deleted treasure "${treasureName}" from museum ${museumId}`);
                    
                    // Log deletion for admin tracking
                    const deletionLog = {
                        museumId: museumId,
                        museumName: currentMuseum.name,
                        treasureName: treasureName,
                        deletedAt: Date.now(),
                        reason: 'auto-delete-5plus-reports'
                    };
                    
                    // Store deletion log in localStorage for admin review
                    const deletionLogs = JSON.parse(localStorage.getItem('treasureDeletionLogs') || '[]');
                    deletionLogs.push(deletionLog);
                    // Keep only last 100 deletion logs
                    if (deletionLogs.length > 100) {
                        deletionLogs.shift();
                    }
                    localStorage.setItem('treasureDeletionLogs', JSON.stringify(deletionLogs));
                    
                    // Update current museum data in memory
                    currentMuseum.collections = museumData.collections;
                    
                    return true;
                } else {
                    console.error('Failed to save updated museum data after treasure deletion');
                    return false;
                }
            } catch (error) {
                console.error('Error auto-deleting treasure:', error);
                return false;
            }
        }

        /**
         * Report a treasure as not found
         * @param {string} treasureName - Name of the treasure
         * @returns {Promise<boolean>} Success status
         */
        async function reportTreasureNotFound(treasureName) {
            try {
                const sortKey = getTreasureReportSortKey(museumId, treasureName);
                
                // Get user ID from localStorage or generate new one
                let userId = localStorage.getItem('treasureReportUserId');
                if (!userId) {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                    localStorage.setItem('treasureReportUserId', userId);
                }
                
                // CRITICAL FIX: Fetch latest report from KV store to avoid race conditions
                // When multiple users report simultaneously from different browsers,
                // each browser's local cache may have stale data. Fetching fresh data
                // ensures we increment the correct count.
                const latestReport = await fetchTreasureReportFromKV(sortKey);
                const existingReport = latestReport || treasureReports[sortKey] || {};
                
                // Check if user already reported this treasure
                const reporters = existingReport.reporters || [];
                if (reporters.includes(userId)) {
                    console.log('User already reported this treasure');
                    return false;
                }
                
                // Update report with latest count from KV store
                const newReportCount = (existingReport.reportCount || 0) + 1;
                const newReporters = [...reporters, userId];
                const photoCheckins = existingReport.photoCheckins || 0;
                
                const updatedReport = {
                    museumId: museumId,
                    museumName: currentMuseum ? currentMuseum.name : '',
                    treasureName: treasureName,
                    reportCount: newReportCount,
                    reporters: newReporters,
                    photoCheckins: photoCheckins,
                    lastReportAt: Date.now()
                };
                
                // Save to KV store
                const response = await fetch(REMOTE_STORAGE_CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key: REMOTE_STORAGE_CONFIG.TREASURE_REPORT_KEY,
                        sortKey: sortKey,
                        value: JSON.stringify(updatedReport),
                        expireAt: REMOTE_STORAGE_CONFIG.TIMESTAMP_2124
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Update local cache
                treasureReports[sortKey] = updatedReport;
                
                // Save to local storage for user's reported treasures
                const localReports = JSON.parse(localStorage.getItem('myTreasureReports') || '{}');
                localReports[sortKey] = { treasureName, reportedAt: Date.now() };
                localStorage.setItem('myTreasureReports', JSON.stringify(localReports));
                
                // AUTO-DELETE: If report count reaches threshold (5+), automatically delete treasure
                // Note: If deletion fails, the report count is still saved (correct behavior).
                // The treasure will be attempted for deletion again on the next report.
                if (newReportCount >= TREASURE_UNAVAILABLE_THRESHOLD) {
                    console.log(`Auto-deleting treasure "${treasureName}" - report count: ${newReportCount}`);
                    const deletionSuccess = await autoDeleteTreasure(treasureName);
                    if (!deletionSuccess) {
                        console.warn(`Auto-delete failed for "${treasureName}", but report was saved. Will retry on next report.`);
                    }
                }
                
                console.log('Treasure reported as not found:', treasureName, updatedReport);
                return true;
            } catch (error) {
                console.error('Error reporting treasure not found:', error);
                return false;
            }
        }

        /**
         * Decrement report count when a photo check-in is done for a treasure
         * @param {string} treasureName - Name of the treasure
         * @returns {Promise<boolean>} Success status
         */
        async function recordTreasurePhotoCheckin(treasureName) {
            try {
                const sortKey = getTreasureReportSortKey(museumId, treasureName);
                
                // CRITICAL FIX: Fetch latest report from KV store to avoid race conditions
                const latestReport = await fetchTreasureReportFromKV(sortKey);
                const existingReport = latestReport || treasureReports[sortKey];
                
                if (!existingReport || existingReport.reportCount <= 0) {
                    return true; // No reports to decrement
                }
                
                // Decrement report count
                const newReportCount = Math.max(0, existingReport.reportCount - 1);
                const newPhotoCheckins = (existingReport.photoCheckins || 0) + 1;
                
                const updatedReport = {
                    ...existingReport,
                    reportCount: newReportCount,
                    photoCheckins: newPhotoCheckins,
                    lastPhotoCheckinAt: Date.now()
                };
                
                // Save to KV store
                const response = await fetch(REMOTE_STORAGE_CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key: REMOTE_STORAGE_CONFIG.TREASURE_REPORT_KEY,
                        sortKey: sortKey,
                        value: JSON.stringify(updatedReport),
                        expireAt: REMOTE_STORAGE_CONFIG.TIMESTAMP_2124
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Update local cache
                treasureReports[sortKey] = updatedReport;
                
                console.log('Photo check-in recorded for treasure:', treasureName, updatedReport);
                return true;
            } catch (error) {
                console.error('Error recording treasure photo check-in:', error);
                return false;
            }
        }

        /**
         * Check if a treasure is a warning state (3+ reports)
         * @param {string} treasureName - Name of the treasure
         * @returns {boolean}
         */
        function isTreasureWarning(treasureName) {
            const count = getTreasureReportCount(treasureName);
            return count >= TREASURE_WARNING_THRESHOLD && count < TREASURE_UNAVAILABLE_THRESHOLD;
        }

        /**
         * Check if a treasure is unavailable (5+ reports)
         * @param {string} treasureName - Name of the treasure
         * @returns {boolean}
         */
        function isTreasureUnavailable(treasureName) {
            return getTreasureReportCount(treasureName) >= TREASURE_UNAVAILABLE_THRESHOLD;
        }

        /**
         * Check if user has already reported this treasure
         * @param {string} treasureName - Name of the treasure
         * @returns {boolean}
         */
        function hasUserReportedTreasure(treasureName) {
            const sortKey = getTreasureReportSortKey(museumId, treasureName);
            const localReports = JSON.parse(localStorage.getItem('myTreasureReports') || '{}');
            return !!localReports[sortKey];
        }

        // =====================================================
        // 图片错误报告功能
        // Image Error Report Feature
        // =====================================================
        
        // Thresholds for image error report counts
        const IMAGE_ERROR_THRESHOLD = 3;  // Allow upload when 3+ reports
        
        // Cache for image error reports
        let imageErrorReports = {};

        /**
         * Generate a unique sort key for an image error report
         * @param {string} museumId - Museum ID
         * @param {string} taskTitle - Task title
         * @returns {string} Sort key
         */
        function getImageErrorReportSortKey(museumId, taskTitle) {
            const combined = `${museumId}:${taskTitle}`;
            const encoder = new TextEncoder();
            const bytes = encoder.encode(combined);
            const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
            return 'image-error-' + btoa(binaryString);
        }

        /**
         * Load all image error reports from KV store
         * @returns {Promise<Object>} Image error reports
         */
        async function loadImageErrorReports() {
            try {
                const response = await fetch(
                    `${REMOTE_STORAGE_CONFIG.API_ENDPOINT}?key=${encodeURIComponent(REMOTE_STORAGE_CONFIG.IMAGE_ERROR_REPORT_KEY)}&sortKey=*`,
                    { method: 'GET' }
                );
                
                if (!response.ok) {
                    console.error('Failed to load image error reports');
                    return {};
                }
                
                const data = await response.json();
                const reports = {};
                
                if (data.items && Array.isArray(data.items)) {
                    for (const item of data.items) {
                        if (item.value) {
                            const reportData = JSON.parse(item.value);
                            reports[item.sortKey] = reportData;
                        }
                    }
                }
                
                imageErrorReports = reports;
                return reports;
            } catch (error) {
                console.error('Error loading image error reports:', error);
                return {};
            }
        }

        /**
         * Fetch a specific image error report from KV store
         * @param {string} sortKey - Sort key
         * @returns {Promise<Object|null>} Report data or null
         */
        async function fetchImageErrorReportFromKV(sortKey) {
            try {
                const response = await fetch(
                    `${REMOTE_STORAGE_CONFIG.API_ENDPOINT}?key=${encodeURIComponent(REMOTE_STORAGE_CONFIG.IMAGE_ERROR_REPORT_KEY)}&sortKey=${encodeURIComponent(sortKey)}`,
                    { method: 'GET' }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.items && data.items.length > 0 && data.items[0].value) {
                        return JSON.parse(data.items[0].value);
                    }
                }
                return null;
            } catch (error) {
                console.error('Error fetching image error report from KV:', error);
                return null;
            }
        }

        /**
         * Get image error report count for a task
         * @param {string} taskTitle - Task title
         * @returns {number} Report count
         */
        function getImageErrorCount(taskTitle) {
            const sortKey = getImageErrorReportSortKey(museumId, taskTitle);
            const report = imageErrorReports[sortKey];
            return report ? (report.reportCount || 0) : 0;
        }

        /**
         * Report an image error for a task
         * @param {string} taskTitle - Task title
         * @param {string} imageUrl - Image URL
         * @returns {Promise<boolean>} Success status
         */
        async function reportImageError(taskTitle, imageUrl) {
            try {
                const sortKey = getImageErrorReportSortKey(museumId, taskTitle);
                
                // Get user ID from localStorage or generate new one
                let userId = localStorage.getItem('imageErrorReportUserId');
                if (!userId) {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                    localStorage.setItem('imageErrorReportUserId', userId);
                }
                
                // Fetch latest report from KV store to avoid race conditions
                const latestReport = await fetchImageErrorReportFromKV(sortKey);
                const existingReport = latestReport || imageErrorReports[sortKey] || {};
                
                // Check if user already reported this image
                const reporters = existingReport.reporters || [];
                if (reporters.includes(userId)) {
                    console.log('User already reported this image error');
                    return false;
                }
                
                // Update report with latest count from KV store
                const newReportCount = (existingReport.reportCount || 0) + 1;
                const newReporters = [...reporters, userId];
                
                const updatedReport = {
                    museumId: museumId,
                    museumName: currentMuseum ? currentMuseum.name : '',
                    taskTitle: taskTitle,
                    imageUrl: imageUrl,
                    reportCount: newReportCount,
                    reporters: newReporters,
                    replacementImages: existingReport.replacementImages || [],
                    lastReportAt: Date.now()
                };
                
                // Save to KV store
                const response = await fetch(REMOTE_STORAGE_CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key: REMOTE_STORAGE_CONFIG.IMAGE_ERROR_REPORT_KEY,
                        sortKey: sortKey,
                        value: JSON.stringify(updatedReport),
                        expireAt: REMOTE_STORAGE_CONFIG.TIMESTAMP_2124
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Update local cache
                imageErrorReports[sortKey] = updatedReport;
                
                // Save to local storage for user's reported images
                const localReports = JSON.parse(localStorage.getItem('myImageErrorReports') || '{}');
                localReports[sortKey] = { taskTitle, imageUrl, reportedAt: Date.now() };
                localStorage.setItem('myImageErrorReports', JSON.stringify(localReports));
                
                console.log('Image error reported:', taskTitle, updatedReport);
                return true;
            } catch (error) {
                console.error('Error reporting image error:', error);
                return false;
            }
        }

        /**
         * Check if user has already reported this image error
         * @param {string} taskTitle - Task title
         * @returns {boolean}
         */
        function hasUserReportedImageError(taskTitle) {
            const sortKey = getImageErrorReportSortKey(museumId, taskTitle);
            const localReports = JSON.parse(localStorage.getItem('myImageErrorReports') || '{}');
            return !!localReports[sortKey];
        }

        /**
         * Upload replacement image for a task
         * @param {string} taskTitle - Task title
         * @param {string} imageDataUrl - Image data URL (base64)
         * @returns {Promise<boolean>} Success status
         */
        async function uploadReplacementImage(taskTitle, imageDataUrl) {
            try {
                const sortKey = getImageErrorReportSortKey(museumId, taskTitle);
                
                // Get user ID
                let userId = localStorage.getItem('imageErrorReportUserId');
                if (!userId) {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                    localStorage.setItem('imageErrorReportUserId', userId);
                }
                
                // Fetch latest report
                const latestReport = await fetchImageErrorReportFromKV(sortKey);
                const existingReport = latestReport || imageErrorReports[sortKey] || {};
                
                // Add replacement image
                const replacementImages = existingReport.replacementImages || [];
                replacementImages.push({
                    imageUrl: imageDataUrl,
                    uploadedBy: userId,
                    uploadedAt: Date.now(),
                    approved: false
                });
                
                const updatedReport = {
                    ...existingReport,
                    replacementImages: replacementImages,
                    lastReplacementAt: Date.now()
                };
                
                // Save to KV store
                const response = await fetch(REMOTE_STORAGE_CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key: REMOTE_STORAGE_CONFIG.IMAGE_ERROR_REPORT_KEY,
                        sortKey: sortKey,
                        value: JSON.stringify(updatedReport),
                        expireAt: REMOTE_STORAGE_CONFIG.TIMESTAMP_2124
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Update local cache
                imageErrorReports[sortKey] = updatedReport;
                
                console.log('Replacement image uploaded:', taskTitle);
                return true;
            } catch (error) {
                console.error('Error uploading replacement image:', error);
                return false;
            }
        }

        // =====================================================
        // 镇馆之宝打卡配置常量和核心函数
        // Treasure check-in configuration constants and core functions
        // =====================================================
        
        // Minimum treasures required for check-in
        const MIN_TREASURES_REQUIRED = 3;

        /**
         * Load treasure check-in configuration from localStorage
         * @returns {Object} Configuration object with museum ID as keys
         */
        function loadTreasureCheckinConfig() {
            try {
                const saved = localStorage.getItem('treasureCheckinConfig');
                return saved ? JSON.parse(saved) : {};
            } catch (error) {
                console.error('Failed to load treasure check-in config:', error);
                return {};
            }
        }

        /**
         * Get the selected treasures for the current museum
         * Returns default first 3 treasures if no configuration exists
         * Excludes treasures with 5+ reports by default (unless manually selected)
         * @returns {Array} Array of treasure names
         */
        function getSelectedTreasuresForMuseum() {
            if (!currentMuseum || !currentMuseum.collections || !Array.isArray(currentMuseum.collections)) {
                return [];
            }
            
            const config = loadTreasureCheckinConfig();
            const selectedTreasures = config[museumId];
            
            // If no configuration exists, return first 3 available treasures as default
            // Exclude treasures with 5+ reports (unavailable)
            if (!selectedTreasures || !Array.isArray(selectedTreasures) || selectedTreasures.length === 0) {
                const availableTreasures = currentMuseum.collections.filter(t => {
                    const reportCount = getTreasureReportCount(t.name);
                    return reportCount < TREASURE_UNAVAILABLE_THRESHOLD;
                });
                return availableTreasures.slice(0, Math.min(3, availableTreasures.length)).map(t => t.name);
            }
            
            return selectedTreasures;
        }

        // Initialize the application
        async function init() {
            if (editMode) {
                document.getElementById('editModeIndicator').classList.add('show');
            }

            // Check if child mode is enabled and hide settings button
            applyChildMode();
            
            // Initialize achievement gamification system
            if (typeof AchievementGamification !== 'undefined') {
                window.achievementGamification = new AchievementGamification();
            }
            
            // Initialize virtual pet system (auto-initializes when child mode toggle exists)
            // Note: Virtual pet is automatically initialized in virtual-pet.js on DOMContentLoaded

            updatePageTitle();
            
            // Check if this is a first-time user and show nickname onboarding modal
            if (!hasSetNickname()) {
                // Show nickname onboarding modal for first-time users after a short delay
                setTimeout(() => {
                    showNicknameOnboardingModal();
                }, 800); // Slightly longer delay to ensure page is fully loaded
            }
            
            // Load museum data first (await ensures tasks/render have data)
            await loadMuseumData();
            
            // Then load treasure reports and image error reports in parallel
            const [treasureReportsData, imageErrorReportsData] = await Promise.all([
                loadTreasureReports(),
                loadImageErrorReports()
            ]);
            treasureReports = treasureReportsData || {};
            imageErrorReports = imageErrorReportsData || {};
            
            setupEventListeners();
            loadCompletedTasks();
            loadPhotos(); // Load saved photos
            
            // Show fireworks menu items only in debug mode
            if (window.MC_debugMode && window.MC_debugMode.isEnabled()) {
                document.querySelectorAll('.fireworks-menu-item').forEach(item => {
                    item.style.display = 'flex';
                });
            }
            // Re-render after loading persisted completion state so counts and badges reflect correctly
            renderTasks();
            updateProgress();
            checkCompletion(); // Check if all tasks complete
            
            // Pet adoption prompt moved to checkCompletion() - only show after all tasks complete
        }

        // Apply child mode settings - hide settings button when child mode is enabled
        function applyChildMode() {
            try {
                const childModeEnabled = localStorage.getItem('childModeEnabled') === 'true';
                if (childModeEnabled) {
                    const settingsButton = document.getElementById('settingsButton');
                    if (settingsButton) {
                        settingsButton.style.display = 'none';
                    }
                }
            } catch (error) {
                console.warn('Error checking child mode:', error);
            }
        }

        // Load museum data with dynamic data priority support
        async function loadMuseumData() {
            // Load museum data via tiered loader (Tier2 -> Tier1). Tier3 is deprecated.
            let museum = null;
            if (window.museumDataLoader && typeof window.museumDataLoader.loadMuseum === 'function') {
                try {
                    museum = await window.museumDataLoader.loadMuseum(museumId, false); // Don't use cache
                    console.log(`Loaded museum ${museumId} via museumDataLoader`);
                } catch (error) {
                    console.warn('Error loading museum with museumDataLoader:', error);
                }
            }

            if (!museum) {
                console.warn(`Museum ${museumId} not found via loader (Tier2/Tier1), trying fallback to local data`);
                
                // Fallback to local MUSEUMS_META data
                if (window.MUSEUMS_META && Array.isArray(window.MUSEUMS_META)) {
                    museum = window.MUSEUMS_META.find(m => m.id === museumId);
                    if (museum) {
                        console.log(`✓ Found museum ${museumId} in local MUSEUMS_META fallback`);
                    }
                }
                
                if (!museum) {
                    console.warn(`Museum ${museumId} not found in fallback data either`);
                    document.getElementById('museumName').textContent = '博物馆未找到';
                    document.getElementById('taskGrid').innerHTML = '<div class="loading">未找到该博物馆的信息</div>';
                    currentMuseum = null;
                    return;
                }
            }

            currentMuseum = museum;

            // Merge user-added treasures from localStorage into currentMuseum.collections
            // This ensures user-added treasures are available even if KV store save failed
            const userTreasures = loadUserAddedTreasures(museumId);
            if (userTreasures && userTreasures.length > 0) {
                if (!currentMuseum.collections) {
                    currentMuseum.collections = [];
                }
                // Add user treasures if not already in collections
                userTreasures.forEach(ut => {
                    const exists = currentMuseum.collections.some(c => c.name === ut.name);
                    if (!exists) {
                        currentMuseum.collections.push({
                            ...ut,
                            isUserAdded: true
                        });
                    }
                });
                console.debug(`Merged ${userTreasures.length} user-added treasures into museum collections`);
            }

            document.getElementById('museumName').textContent = currentMuseum.name;
            
            // Get child tasks for the age group
            if (currentMuseum.checklists && currentMuseum.checklists.child) {
                childTasks = currentMuseum.checklists.child[ageGroup] || [];
            }
            // Append collection-derived tasks (top 3) ONLY if no custom checklist exists
            // Museums with custom checklists (like capital-museum.js, pinghu-museum.js) already include treasure tasks
            const hasCustomChecklist = currentMuseum.checklists && 
                                      currentMuseum.checklists.child && 
                                      currentMuseum.checklists.child[ageGroup] && 
                                      currentMuseum.checklists.child[ageGroup].length > 0;
            
            if (!hasCustomChecklist && Array.isArray(currentMuseum.collections) && currentMuseum.collections.length) {
                const extras = currentMuseum.collections.slice(0, 3).map(c => `🏺 镇馆之宝：找到「${c.name}」并合影`);
                childTasks = childTasks.concat(extras);
            }
            
            // Treasure hunt workflow pattern for ALL museums with collections (门口打卡 + 找镇馆之宝 + 亲子合影)
            // Automatically applied to any museum that has collections data
            // Uses selected treasures from configuration, defaults to first 3
            const totalTreasuresNeeded = 3;
            const collections = currentMuseum.collections || [];
            
            if (Array.isArray(collections) && collections.length >= totalTreasuresNeeded) {
                // Museum has 3+ treasures - use standard treasure hunt workflow
                // Get selected treasures from configuration (defaults to first 3)
                const selectedTreasureNames = getSelectedTreasuresForMuseum();
                const selectedCollections = collections.filter(c => selectedTreasureNames.includes(c.name));
                
                // If no valid selections, fall back to first 3
                const colls = selectedCollections.length >= MIN_TREASURES_REQUIRED 
                    ? selectedCollections 
                    : collections.slice(0, Math.min(3, collections.length));
                
                // Use the shared helper with selected collections
                childTasks = buildTreasureWorkflowTasks(colls);
            } else {
                // Museum has 0-2 treasures - show mix of treasure tasks and "add treasure" tasks
                // This allows incremental discovery: as users add treasures, tasks update
                // Use the shared helper to build the task list
                childTasks = buildTreasureWorkflowTasks(collections);
            }

            renderTasks();
            updateProgress();
            
            // 预加载当前博物馆的藏品图片到缓存
            // Preload museum collection images for faster subsequent access
            if (typeof MuseumImageCache !== 'undefined' && currentMuseum) {
                MuseumImageCache.preloadMuseumImages(museumId, currentMuseum.collections).catch(e => {
                    console.warn('图片预加载失败:', e);
                });
            }
        }

        // Render task cards
        function renderTasks() {
            const taskGrid = document.getElementById('taskGrid');
            if (!taskGrid) {
                console.warn('Task grid element not found, skipping renderTasks');
                return;
            }
            
            taskGrid.innerHTML = '';

            if (childTasks.length === 0) {
                taskGrid.innerHTML = '<div class="loading">暂无任务</div>';
                return;
            }

            childTasks.forEach((task, index) => {
                const card = createTaskCard(task, index);
                taskGrid.appendChild(card);
            });

            // Add poster card at the end
            const posterCard = createPosterCard();
            taskGrid.appendChild(posterCard);

            // Add "add task" card in edit mode
            if (editMode) {
                const addCard = document.createElement('div');
                addCard.className = 'task-card add-task-card';
                addCard.innerHTML = `
                    <div class="task-icon">➕</div>
                    <div class="task-title">添加任务</div>
                `;
                addCard.onclick = () => addNewTask();
                taskGrid.appendChild(addCard);
            }
        }

        // Create a task card element
        function createTaskCard(task, index) {
            const card = document.createElement('div');
            card.className = 'task-card';
            
            if (completedTasks.has(index)) {
                card.classList.add('completed');
            }

            // Extract icon and title from task string
            const { icon, title, subtitle } = parseTaskString(task);
            
            // Check for treasure warning/unavailable status
            let treasureName = null;
            let reportCount = 0;
            let isTreasureTask = false;
            if (title && title.includes(TREASURE_TASK_IDENTIFIER) && subtitle) {
                isTreasureTask = true;
                const nameMatch = subtitle.match(/「([^」]+)」/);
                treasureName = nameMatch && nameMatch[1];
                if (treasureName) {
                    reportCount = getTreasureReportCount(treasureName);
                    if (reportCount >= TREASURE_UNAVAILABLE_THRESHOLD) {
                        card.classList.add('treasure-unavailable');
                    } else if (reportCount >= TREASURE_WARNING_THRESHOLD) {
                        card.classList.add('treasure-warning');
                    }
                }
            }

            // Try to get collection image URL for treasure hunt tasks
            let imageUrl = '';
            let isUserPhoto = false; // Flag to indicate if image is user's photo (no need for cache)
            try {
                // Check if this is a 亲子合影 task - use user's photo if available
                if (title && title.includes('亲子合影') && taskPhotos[index]) {
                    imageUrl = taskPhotos[index];
                    isUserPhoto = true;
                }
                // Check if this is a 门口打卡 task - use museum image
                else if (currentMuseum && title && title.includes('门口打卡')) {
                    imageUrl = currentMuseum.image || '';
                }
                // Otherwise, try to match collection images for treasure hunt tasks
                else if (currentMuseum && Array.isArray(currentMuseum.collections) && subtitle) {
                    const nameMatch = subtitle.match(/「([^」]+)」/);
                    const collName = nameMatch && nameMatch[1];
                    if (collName) {
                        const found = currentMuseum.collections.find(c => c && c.name === collName);
                        imageUrl = found && (found.imageUrl || found.url) || '';
                    }
                }
            } catch(e) {}

            // Build card HTML with optional report badge
            let badgeHtml = '';
            if (isTreasureTask && reportCount >= TREASURE_UNAVAILABLE_THRESHOLD) {
                badgeHtml = `<div class="treasure-unavailable-badge">${reportCount}人报告不存在</div>`;
            } else if (isTreasureTask && reportCount >= TREASURE_WARNING_THRESHOLD) {
                badgeHtml = `<div class="treasure-warning-badge">${reportCount}人报告不存在</div>`;
            }
            
            // Check if this task was completed by reporting
            const wasReportedComplete = reportedTasks.has(index);
            const reportedBadgeHtml = wasReportedComplete ? 
                `<div class="reported-completion-badge">🙋 报告不存在</div>` : '';
            
            card.innerHTML = `
                ${badgeHtml}
                ${reportedBadgeHtml}
                <div class="completion-badge">✓</div>
                <div class="task-visual-container">
                    ${imageUrl ? `<img src="${imageUrl}" class="task-card-image" alt="${title}" style="display:none" />` : ''}
                    <div class="task-icon" ${imageUrl ? 'style="display:block"' : ''}>${icon}</div>
                </div>
                <div class="task-title">${title}</div>
                ${subtitle ? `<div class="task-subtitle">${subtitle}</div>` : ''}
            `;

            // If there's an image URL, try to load it from cache first, then fallback to direct load
            if (imageUrl) {
                const img = card.querySelector('.task-card-image');
                const iconDiv = card.querySelector('.task-icon');
                if (img && iconDiv) {
                    img.onload = function() {
                        img.style.display = 'block';
                        iconDiv.style.display = 'none';
                    };
                    img.onerror = function() {
                        img.style.display = 'none';
                        iconDiv.style.display = 'block';
                    };
                    // User photos (data URLs) don't need cache, load directly
                    if (isUserPhoto) {
                        img.src = imageUrl;
                    }
                    // 优先从缓存加载图片，提升当天打卡博物馆的访问速度
                    // Try loading from cache first for better performance
                    else if (typeof MuseumImageCache !== 'undefined') {
                        MuseumImageCache.getImage(imageUrl, museumId).then(cachedUrl => {
                            img.src = cachedUrl || imageUrl;
                        }).catch(() => {
                            img.src = imageUrl;
                        });
                    } else {
                        img.src = imageUrl;
                    }
                }
            }

            card.onclick = () => openTaskDetail(index);

            return card;
        }

        // Create poster card element
        function createPosterCard() {
            const card = document.createElement('div');
            card.className = 'task-card poster-card';
            
            // Check if all tasks are completed
            const allCompleted = childTasks.length > 0 && completedTasks.size === childTasks.length;
            
            if (allCompleted) {
                card.classList.add('completed');
            }
            
            // Try to get existing poster from localStorage
            let posterDataURL = '';
            try {
                const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
                const currentPoster = postersData[museumId];
                if (currentPoster && currentPoster.dataURL) {
                    posterDataURL = currentPoster.dataURL;
                }
            } catch (e) {
                console.warn('Failed to load poster from localStorage:', e);
            }
            
            // Check if poster is already published
            let isPublished = false;
            try {
                const publishedPosters = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
                isPublished = publishedPosters[museumId] && publishedPosters[museumId].recordId;
            } catch (e) {}
            
            card.innerHTML = `
                <div class="completion-badge">✓</div>
                <div class="task-visual-container">
                    ${posterDataURL ? `<img src="${posterDataURL}" class="task-card-image poster-thumbnail" alt="成就海报" />` : ''}
                    <div class="task-icon" ${posterDataURL ? 'style="display:none"' : ''}>🎨</div>
                </div>
                <div class="task-title">成就海报</div>
                <div class="task-subtitle">${allCompleted ? (isPublished ? '已发布' : '点击查看海报') : '完成所有任务后生成'}</div>
                ${allCompleted ? `
                <button class="poster-publish-btn ${isPublished ? 'published' : ''}" id="posterCardPublishBtn">
                    ${isPublished ? '✅ 已发布' : '📣 发布'}
                </button>
                ` : ''}
            `;
            
            if (allCompleted) {
                // Click on card image area to show fullscreen poster
                const posterImg = card.querySelector('.poster-thumbnail');
                const taskIcon = card.querySelector('.task-icon');
                const visualContainer = card.querySelector('.task-visual-container');
                
                if (visualContainer) {
                    visualContainer.style.cursor = 'pointer';
                    visualContainer.onclick = (e) => {
                        e.stopPropagation();
                        // Generate poster first if not exists, then show fullscreen
                        if (!posterDataURL) {
                            generatePoster();
                            // Wait a bit for poster generation, then show celebration
                            setTimeout(() => {
                                openPosterModal();
                            }, 500);
                        } else {
                            // Show poster in fullscreen viewer
                            openPosterFullscreen(posterDataURL);
                        }
                    };
                }
                
                // Publish button click handler
                const publishBtn = card.querySelector('#posterCardPublishBtn');
                if (publishBtn && !isPublished) {
                    publishBtn.onclick = (e) => {
                        e.stopPropagation();
                        handlePosterPublish(publishBtn);
                    };
                }
            } else {
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
            }
            
            return card;
        }
        
        // Open poster in fullscreen viewer
        function openPosterFullscreen(posterDataURL) {
            const fullscreenViewer = document.getElementById('fullscreenViewer');
            const fullscreenImage = document.getElementById('fullscreenImage');
            const fullscreenHint = document.getElementById('fullscreenHint');
            
            if (!fullscreenViewer || !fullscreenImage) {
                // Fallback to celebration modal
                openPosterModal();
                return;
            }
            
            fullscreenImage.src = posterDataURL;
            fullscreenViewer.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Show hint temporarily
            if (fullscreenHint) {
                fullscreenHint.style.display = 'block';
                setTimeout(() => {
                    if (fullscreenHint) fullscreenHint.style.display = 'none';
                }, 3000);
            }
        }
        
        // Handle poster publish from card button
        async function handlePosterPublish(btn) {
            if (!btn || btn.classList.contains('published')) return;
            
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳';
            
            try {
                await publishPosterFromCheckin();
                btn.innerHTML = '✅ 已发布';
                btn.classList.add('published');
                // Update subtitle
                const card = btn.closest('.poster-card');
                if (card) {
                    const subtitle = card.querySelector('.task-subtitle');
                    if (subtitle) subtitle.textContent = '已发布';
                }
            } catch (error) {
                console.error('Publish failed:', error);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        // Open poster modal with enhanced celebration effects
        function openPosterModal() {
            generatePoster();
            
            // Show celebration modal with animation
            const celebration = document.getElementById('completionCelebration');
            celebration.classList.add('show');
            
            // Update poster button states (check if already published)
            updatePosterButtonStates();
            
            // Create confetti particles
            createConfetti();
            
            // Create floating celebration emojis
            createCelebrationEmojis();
            
            // Launch multiple fireworks for grand celebration
            launchCelebrationFireworks();
            
            // Play celebration sound if available
            if (typeof playFireworkSound === 'function') {
                playFireworkSound();
                // Play additional sounds with delay
                setTimeout(() => playFireworkSound(), 400);
                setTimeout(() => playFireworkSound(), 800);
            }
        }

        // Create confetti particles effect
        function createConfetti() {
            const colors = ['#FF6B9D', '#C44569', '#F8B500', '#54A0FF', '#5F27CD', '#FFD93D', '#6BCF7F'];
            const confettiCount = 80;
            
            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                
                // Random shapes
                if (Math.random() > 0.5) {
                    confetti.style.borderRadius = '50%';
                } else {
                    confetti.style.width = Math.random() * 8 + 4 + 'px';
                    confetti.style.height = Math.random() * 8 + 4 + 'px';
                }
                
                document.body.appendChild(confetti);
                
                // Remove confetti after animation
                setTimeout(() => {
                    confetti.remove();
                }, 3500);
            }
        }

        // Create floating celebration emojis
        function createCelebrationEmojis() {
            const emojis = ['🎉', '🎊', '✨', '🌟', '⭐', '💫', '🎈', '🎆', '🎇', '👏', '🥳', '🏆'];
            const emojiCount = 15;
            
            for (let i = 0; i < emojiCount; i++) {
                const emoji = document.createElement('div');
                emoji.className = 'celebration-emoji';
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.left = Math.random() * 100 + '%';
                emoji.style.animationDelay = Math.random() * 1 + 's';
                emoji.style.animationDuration = (Math.random() * 2 + 3) + 's';
                
                document.body.appendChild(emoji);
                
                // Remove emoji after animation
                setTimeout(() => {
                    emoji.remove();
                }, 5000);
            }
        }

        // Launch multiple fireworks for celebration
        function launchCelebrationFireworks() {
            const canvas = document.getElementById('fireworksCanvas');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Colors in RGB format for easier alpha manipulation
            const colors = [
                '255, 107, 157',  // #FF6B9D Pink
                '196, 69, 105',   // #C44569 Deep red
                '248, 181, 0',    // #F8B500 Orange
                '84, 160, 255',   // #54A0FF Blue
                '95, 39, 205',    // #5F27CD Purple
                '255, 217, 61',   // #FFD93D Gold
                '107, 207, 127'   // #6BCF7F Green
            ];
            let allParticles = [];
            
            // Create explosion at a position
            function createExplosion(x, y, color) {
                const particleCount = 60;
                const particles = [];
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 * i) / particleCount;
                    const velocity = Math.random() * 3 + 2;
                    
                    particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * velocity,
                        vy: Math.sin(angle) * velocity,
                        color: color,
                        life: 1,
                        size: Math.random() * 3 + 2
                    });
                }
                
                return particles;
            }
            
            // Launch fireworks at different positions and times
            const fireworkPositions = [
                { x: canvas.width * 0.3, y: canvas.height * 0.3, delay: 0 },
                { x: canvas.width * 0.7, y: canvas.height * 0.25, delay: 200 },
                { x: canvas.width * 0.5, y: canvas.height * 0.35, delay: 400 },
                { x: canvas.width * 0.2, y: canvas.height * 0.4, delay: 600 },
                { x: canvas.width * 0.8, y: canvas.height * 0.35, delay: 800 },
                { x: canvas.width * 0.4, y: canvas.height * 0.28, delay: 1000 },
                { x: canvas.width * 0.6, y: canvas.height * 0.32, delay: 1200 }
            ];
            
            fireworkPositions.forEach(pos => {
                setTimeout(() => {
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const particles = createExplosion(pos.x, pos.y, color);
                    allParticles.push(...particles);
                }, pos.delay);
            });
            
            // Animation loop
            function animate() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Update and draw particles
                allParticles = allParticles.filter(p => p.life > 0);
                
                allParticles.forEach(p => {
                    // Draw particle with glow
                    ctx.save();
                    
                    // Glow effect
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color}, ${p.life * 0.3})`;
                    ctx.fill();
                    
                    // Core
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
                    ctx.fill();
                    
                    ctx.restore();
                    
                    // Update position
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.05; // Gravity
                    p.vx *= 0.99; // Air resistance
                    p.vy *= 0.99;
                    p.life -= 0.008;
                });
                
                if (allParticles.length > 0) {
                    requestAnimationFrame(animate);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            
            animate();
        }

        // Parse task string to extract icon, title, and subtitle
        function parseTaskString(taskString) {
            // Default icon
            let icon = '🎯';
            
            // Extract emoji if present at the start
            const emojiMatch = taskString.match(/^([\u{1F000}-\u{1F9FF}])/u);
            if (emojiMatch) {
                icon = emojiMatch[1];
                taskString = taskString.substring(emojiMatch[1].length).trim();
            }

            // Extract title and subtitle (split by '：' or ':')
            const parts = taskString.split(/[：:]/);
            const title = parts[0].trim();
            const subtitle = parts.slice(1).join('：').trim();

            return { icon, title, subtitle };
        }

        // Open task detail modal
        function openTaskDetail(index) {
            currentTaskIndex = index;
            const task = childTasks[index];
            const { icon, title, subtitle } = parseTaskString(task);
            const isCompleted = completedTasks.has(index);

            const modalIconEl = document.getElementById('modalIcon');
            if (modalIconEl) modalIconEl.textContent = icon;
            document.getElementById('modalTaskTitle').textContent = title;
            document.getElementById('modalDescription').textContent = subtitle || '完成这个有趣的任务吧！';
            
            // Get museum photo contributor section
            const museumPhotoSection = document.getElementById('museumPhotoContributorSection');
            
            // Try show collection image
            try {
                const imgEl = document.getElementById('modalImage');
                const m = currentMuseum;
                let matchedUrl = '';
                
                // Check if this is a 门口打卡 task - use museum image
                const isDoorCheckinTask = title && title.includes('门口打卡');
                
                if (isDoorCheckinTask && m && m.image) {
                    matchedUrl = m.image;
                }
                // Otherwise, try to match collection images for treasure hunt tasks
                else if (imgEl && m && Array.isArray(m.collections)) {
                    const nameMatch = subtitle && subtitle.match(/「([^」]+)」/);
                    const collName = nameMatch && nameMatch[1];
                    const found = m.collections.find(c => c && c.name === collName);
                    matchedUrl = found && (found.imageUrl || found.url) || '';
                }
                
                if (imgEl) {
                    if (matchedUrl) { 
                        // Hide icon when image is available to save space
                        if (modalIconEl) modalIconEl.style.display = 'none';
                        // Expand image to use saved space
                        imgEl.classList.add('expanded');
                        // 优先从缓存加载图片
                        // Load image from cache first for better performance
                        if (typeof MuseumImageCache !== 'undefined') {
                            MuseumImageCache.getImage(matchedUrl, museumId).then(cachedUrl => {
                                imgEl.src = cachedUrl || matchedUrl;
                            }).catch(() => {
                                imgEl.src = matchedUrl;
                            });
                        } else {
                            imgEl.src = matchedUrl;
                        }
                        imgEl.style.display = 'block'; 
                        if (museumPhotoSection) museumPhotoSection.style.display = 'none';
                        // Also hide treasure photo section if visible
                        const treasurePhotoSection = document.getElementById('treasurePhotoContributorSection');
                        if (treasurePhotoSection) treasurePhotoSection.style.display = 'none';
                    } else { 
                        imgEl.removeAttribute('src'); 
                        imgEl.style.display = 'none';
                        imgEl.classList.remove('expanded');
                        // Show icon when no image available
                        if (modalIconEl) modalIconEl.style.display = '';
                        
                        // Check if this is a treasure task
                        const isTreasureTask = title && title.includes(TREASURE_TASK_IDENTIFIER);
                        const nameMatch = subtitle && subtitle.match(/「([^」]+)」/);
                        const treasureName = nameMatch && nameMatch[1];
                        
                        // Show museum photo contributor section for 门口打卡 task when no image
                        if (isDoorCheckinTask && museumPhotoSection) {
                            // Check if user already contributed a photo
                            const contributedPhoto = getContributedMuseumPhoto(m.id);
                            if (contributedPhoto && contributedPhoto.imageUrl) {
                                // Show the contributed photo instead
                                imgEl.src = contributedPhoto.imageUrl;
                                imgEl.style.display = 'block';
                                museumPhotoSection.style.display = 'none';
                            } else {
                                // Show the contributor section
                                museumPhotoSection.style.display = 'block';
                                // Initialize search input with museum name
                                const searchInput = document.getElementById('modalMuseumPhotoSearch');
                                if (searchInput) searchInput.value = m.name + ' 门口 外观';
                                // Reset preview
                                const preview = document.getElementById('modalMuseumPhotoPreview');
                                if (preview) {
                                    preview.innerHTML = '📷 添加博物馆门口照片';
                                    preview.classList.remove('image-preview-thumb');
                                    preview.classList.add('image-preview-placeholder');
                                    delete preview.dataset.imageUrl;
                                }
                                // Hide submit button and badge
                                const submitBtn = document.getElementById('modalMuseumPhotoSubmitBtn');
                                const contributedBadge = document.getElementById('museumPhotoContributedBadge');
                                if (submitBtn) submitBtn.style.display = 'none';
                                if (contributedBadge) contributedBadge.style.display = 'none';
                            }
                        }
                        else if (isTreasureTask && treasureName) {
                            // Show treasure photo contributor section for treasure tasks when no image
                            const treasurePhotoSection = document.getElementById('treasurePhotoContributorSection');
                            if (treasurePhotoSection) {
                                // Check if user already contributed a photo for this treasure
                                const contributedPhoto = getContributedTreasurePhoto(m.id, treasureName);
                                if (contributedPhoto && contributedPhoto.imageUrl) {
                                    // Show the contributed photo instead
                                    imgEl.src = contributedPhoto.imageUrl;
                                    imgEl.style.display = 'block';
                                    treasurePhotoSection.style.display = 'none';
                                } else {
                                    // Show the contributor section
                                    treasurePhotoSection.style.display = 'block';
                                    treasurePhotoSection.dataset.treasureName = treasureName;
                                    
                                    // Reset preview
                                    const preview = document.getElementById('modalTreasurePhotoPreview');
                                    if (preview) {
                                        preview.innerHTML = '📷 添加镇馆之宝照片';
                                        preview.classList.remove('image-preview-thumb');
                                        preview.classList.add('image-preview-placeholder');
                                        delete preview.dataset.imageUrl;
                                    }
                                    // Hide submit button and badge
                                    document.getElementById('modalTreasurePhotoSubmitBtn').style.display = 'none';
                                    document.getElementById('treasurePhotoContributedBadge').style.display = 'none';
                                }
                            }
                        }
                        else {
                            if (museumPhotoSection) museumPhotoSection.style.display = 'none';
                            const treasurePhotoSection = document.getElementById('treasurePhotoContributorSection');
                            if (treasurePhotoSection) treasurePhotoSection.style.display = 'none';
                        }
                    }
                }
            } catch(e) {
                console.error('Error in openTaskDetail image handling:', e);
            }

            // Initialize photo preview for this task
            const photoPreview = document.getElementById('photoPreview');
            const retakeBtn = document.getElementById('retakeButton');
            const photoInput = document.getElementById('taskPhotoInput');
            
            if (taskPhotos[index]) {
                // Show existing photo
                displayPhotoPreview(taskPhotos[index]);
            } else {
                // Clear preview
                photoPreview.innerHTML = '';
                retakeBtn.style.display = 'none';
                photoInput.style.display = 'block';
                photoInput.value = '';
            }

            // Show/hide complete button based on completion status
            const completeButton = document.getElementById('completeButton');
            if (isCompleted) {
                completeButton.textContent = '已完成 ✓';
                completeButton.disabled = true;
                completeButton.style.opacity = '0.6';
            } else {
                completeButton.textContent = '完成任务 🎉';
                completeButton.disabled = false;
                completeButton.style.opacity = '1';
            }
            
            // Handle treasure report section visibility
            const reportSection = document.getElementById('treasureReportSection');
            const reportBtn = document.getElementById('treasureReportBtn');
            const reportConfirm = document.getElementById('treasureReportConfirm');
            const reportStatus = document.getElementById('treasureReportStatus');
            
            // Reset report section state
            if (reportConfirm) reportConfirm.classList.remove('show');
            if (reportStatus) reportStatus.classList.remove('show');
            
            // Check if this is a treasure task
            const isTreasureTask = title && title.includes(TREASURE_TASK_IDENTIFIER);
            if (isTreasureTask && subtitle) {
                const nameMatch = subtitle.match(/「([^」]+)」/);
                const treasureName = nameMatch && nameMatch[1];
                
                if (treasureName && reportSection) {
                    reportSection.classList.add('show');
                    reportSection.dataset.treasureName = treasureName;
                    
                    // Check if user already reported
                    if (reportBtn) {
                        if (hasUserReportedTreasure(treasureName)) {
                            reportBtn.textContent = '✅ 您已报告过此问题';
                            reportBtn.disabled = true;
                        } else {
                            reportBtn.textContent = '⚠️ 报告：找不到这个镇馆之宝';
                            reportBtn.disabled = false;
                        }
                        
                        // Show report count if any
                        const reportCount = getTreasureReportCount(treasureName);
                        if (reportCount > 0) {
                            reportBtn.textContent += ` (${reportCount}人已报告)`;
                        }
                    }
                } else if (reportSection) {
                    reportSection.classList.remove('show');
                }
            } else if (reportSection) {
                reportSection.classList.remove('show');
            }

            // Handle image error report section visibility (for tasks with images)
            const imageErrorSection = document.getElementById('imageErrorReportSection');
            const imageErrorBtn = document.getElementById('imageErrorReportBtn');
            const imageErrorConfirm = document.getElementById('imageErrorConfirm');
            const imageErrorStatus = document.getElementById('imageErrorStatus');
            const imageReplacementSection = document.getElementById('imageReplacementSection');
            
            // Reset image error section state
            if (imageErrorConfirm) imageErrorConfirm.classList.remove('show');
            if (imageErrorStatus) imageErrorStatus.classList.remove('show');
            if (imageReplacementSection) imageReplacementSection.classList.remove('show');
            
            // Check if task has an image
            const modalImage = document.getElementById('modalImage');
            const hasImage = modalImage && modalImage.src && modalImage.style.display !== 'none';
            
            if (hasImage) {
                const taskTitle = title || ''; 
                const imageUrl = modalImage.src;
                
                if (imageErrorSection) {
                    imageErrorSection.classList.add('show');
                    imageErrorSection.dataset.taskTitle = taskTitle;
                    imageErrorSection.dataset.imageUrl = imageUrl;
                }
                
                // Check if user already reported this image error
                if (imageErrorBtn) {
                    if (hasUserReportedImageError(taskTitle)) {
                        imageErrorBtn.textContent = '✅ 您已报告过此问题';
                        imageErrorBtn.disabled = true;
                    } else {
                        imageErrorBtn.textContent = '📷 报告图片错误';
                        imageErrorBtn.disabled = false;
                    }
                }
                
                // Check if threshold reached for replacement upload
                const errorCount = getImageErrorCount(taskTitle);
                if (errorCount >= IMAGE_ERROR_THRESHOLD && imageReplacementSection) {
                    imageReplacementSection.classList.add('show');
                    const errorCountEl = document.getElementById('imageErrorCount');
                    if (errorCountEl) errorCountEl.textContent = errorCount;
                } else if (errorCount > 0 && imageErrorBtn) {
                    imageErrorBtn.textContent += ` (${errorCount}人已报告)`;
                }
            } else if (imageErrorSection) {
                imageErrorSection.classList.remove('show');
            }

            // Handle treasure contributor section visibility (for "添加镇馆之宝" tasks)
            const contributorSection = document.getElementById('treasureContributorSection');
            const treasureNameInput = document.getElementById('modalTreasureName');
            const treasureImageInput = document.getElementById('modalTreasureUpload');
            const treasurePreview = document.getElementById('modalTreasurePreview');
            
            const isAddTreasureTask = title && title.includes('添加镇馆之宝');
            
            if (isAddTreasureTask) {
                contributorSection.style.display = 'block';
                // Clear previous values
                treasureNameInput.value = '';
                treasureImageInput.value = '';
                treasurePreview.textContent = '📷';
                treasurePreview.className = 'image-preview-placeholder';
                
                // Load previously saved treasure data for this task if exists
                const savedTreasureData = getContributedTreasureForTask(index);
                if (savedTreasureData) {
                    treasureNameInput.value = savedTreasureData.name || '';
                    if (savedTreasureData.imageUrl) {
                        treasureImageInput.value = savedTreasureData.imageUrl;
                        const img = document.createElement('img');
                        img.src = savedTreasureData.imageUrl;
                        img.className = 'image-preview-thumb';
                        img.alt = '预览';
                        treasurePreview.innerHTML = '';
                        treasurePreview.appendChild(img);
                    }
                }
            } else {
                contributorSection.style.display = 'none';
            }

            document.getElementById('taskModal').classList.add('show');
        }

        // Complete a task
        function loadPuzzleGameSetting() {
            try {
                const saved = localStorage.getItem('puzzleGameEnabled');
                return saved === 'true';
            } catch (error) {
                console.error('Failed to load puzzle game setting:', error);
                return true;
            }
        }

        function savePuzzleGameSetting(enabled) {
            try {
                localStorage.setItem('puzzleGameEnabled', enabled ? 'true' : 'false');
            } catch (error) {
                console.error('Failed to save puzzle game setting:', error);
            }
        }

        // Expose helpers for any global handlers that expect them
        window.loadPuzzleGameSetting = loadPuzzleGameSetting;
        window.savePuzzleGameSetting = savePuzzleGameSetting;

        async function completeTask() {
            if (currentTaskIndex === null) return;

            // Check if this is an "添加镇馆之宝" task and validate/save data
            const task = childTasks[currentTaskIndex];
            const { title, subtitle } = parseTaskString(task);
            const isAddTreasureTask = title && title.includes('添加镇馆之宝');
            
            if (isAddTreasureTask) {
                const treasureName = document.getElementById('modalTreasureName').value.trim();
                const treasureImage = document.getElementById('modalTreasureUpload').value.trim();
                
                // Validate: treasure name is required
                if (!treasureName) {
                    alert('请输入镇馆之宝的名称！');
                    document.getElementById('modalTreasureName').focus();
                    return;
                }
                
                // Save the contributed treasure data (also saves to KV store)
                await saveContributedTreasure(currentTaskIndex, {
                    name: treasureName,
                    imageUrl: treasureImage || '',
                    taskIndex: currentTaskIndex,
                    museumId: museumId,
                    museumName: currentMuseum ? currentMuseum.name : '',
                    timestamp: Date.now()
                });
            }

            // Check if game should be shown (has photo and setting enabled)
            // Ensure we process any pending file selected in the input but not yet stored
            try {
                const photoInputEl = document.getElementById('taskPhotoInput');
                if (!taskPhotos[currentTaskIndex] && photoInputEl && photoInputEl.files && photoInputEl.files[0]) {
                    // If user selected a file but FileReader/compression hasn't finished yet,
                    // synchronously compress and read it here so the completion flow sees the photo.
                    try {
                        const compressedFile = await compressPhoto(photoInputEl.files[0]);
                        const reader = new FileReader();
                        const dataUrl = await new Promise((resolve, reject) => {
                            reader.onload = (e) => resolve(e.target.result);
                            reader.onerror = () => reject(new Error('读取图片失败'));
                            reader.readAsDataURL(compressedFile);
                        });
                        taskPhotos[currentTaskIndex] = dataUrl;
                        savePhotos();
                        displayPhotoPreview(dataUrl);
                    } catch (e) {
                        console.warn('未能在完成前处理选中的照片：', e);
                    }
                }
            } catch (e) {
                console.error('处理待处理照片时出错：', e);
            }

            const hasPhoto = !!taskPhotos[currentTaskIndex];
            const puzzleEnabled = loadPuzzleGameSetting();
            const showGame = hasPhoto && puzzleEnabled;

            completedTasks.add(currentTaskIndex);
            saveCompletedTasks();
            
            // ===== EVENT WALL TRACKING: Task Completion =====
            // Track individual task completion to event wall
            if (eventWallService && currentMuseum && task) {
                const { title, subtitle } = parseTaskString(task);
                const taskDescription = title + (subtitle ? ` - ${subtitle}` : '');
                eventWallService.trackTaskComplete(
                    museumId,
                    currentMuseum.name,
                    'child',  // museum-checkin.html only has child tasks
                    taskDescription,
                    ageGroup
                );
            }
            // ===== END EVENT WALL TRACKING =====
            
            // Award XP for task completion and show notification
            const taskXP = hasPhoto ? 10 : 5; // More XP for tasks with photos
            if (window.achievementGamification) {
                window.achievementGamification.addXP(taskXP);
                window.achievementGamification.showXPGainNotification(taskXP, hasPhoto ? '任务完成 (含照片)' : '任务完成');
            }
            
            // Notify virtual pet about task completion (pet adoption prompt moved to checkCompletion)
            if (window.virtualPet && window.virtualPet.isPetAlive()) {
                window.virtualPet.onTaskCompleted();
            }
            
            // If task has photo and is a treasure task, record photo check-in to decrement report count
            if (hasPhoto) {
                const task = childTasks[currentTaskIndex];
                const { title, subtitle } = parseTaskString(task);
                if (title && title.includes(TREASURE_TASK_IDENTIFIER) && subtitle) {
                    const nameMatch = subtitle.match(/「([^」]+)」/);
                    const treasureName = nameMatch && nameMatch[1];
                    if (treasureName) {
                        recordTreasurePhotoCheckin(treasureName);
                    }
                }
            }
            
            // Close modal
            document.getElementById('taskModal').classList.remove('show');
            
            // Show fireworks celebration
            celebrateWithFireworks();
            
            // If this was an "add treasure" task, regenerate task list to show the new treasure
            if (isAddTreasureTask) {
                regenerateTasksWithNewTreasures();
            } else {
                // Just re-render existing tasks
                renderTasks();
                updateProgress();
            }

            // Upload firework to remote
            uploadFireworkEvent(currentTaskIndex);
            
            // Check if all tasks complete
            checkCompletion();

            // Show game as reward if photo was uploaded and setting is enabled
            // Randomly select between unified games (maze, space invaders, tank battle, snake)
            if (showGame) {
                // Delay slightly to let fireworks animation start
                // Store current task index for closure
                const taskIndexForGame = currentTaskIndex;
                const gameType = selectRandomGame();
                const options = {}; // Initialize options for GameManager
                
                setTimeout(() => {
                    // Use unified architecture; legacy fallback removed
                    if (typeof GameManager !== 'undefined') {
                        GameManager.startGame(gameType, taskIndexForGame, options);
                    }
                }, 800);
            }
        }

        // Celebrate with fireworks animation
        function celebrateWithFireworks() {
            const canvas = document.getElementById('fireworksCanvas');
            if (!canvas) return; // Guard against missing canvas
            
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Simple particle-based firework celebration (no dependency on global Firework class)
            let particles = [];
            
            function explode() {
                const colors = ['#FF6B9D', '#C44569', '#F8B500', '#54A0FF', '#5F27CD'];
                for (let i = 0; i < 50; i++) {
                    particles.push({
                        x: canvas.width / 2,
                        y: canvas.height / 3,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        life: 1
                    });
                }
            }

            function animate() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                particles = particles.filter(p => p.life > 0);
                particles.forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.fillRect(p.x, p.y, 3, 3);
                    
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.2;
                    p.life -= 0.02;
                });

                if (particles.length > 0) {
                    requestAnimationFrame(animate);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }

            explode();
            animate();

            // Play sound if available
            if (typeof playFireworkSound === 'function') {
                playFireworkSound();
            }
        }

        // Upload firework event to remote storage
        function uploadFireworkEvent(taskIndex) {
            const task = childTasks[taskIndex];
            const { title } = parseTaskString(task);
            
            // Load child nickname from localStorage
            let childNickname = '小朋友'; // Default nickname
            try {
                const savedNickname = localStorage.getItem('childNickname');
                if (savedNickname && savedNickname.trim()) {
                    childNickname = savedNickname.trim();
                }
            } catch (error) {
                console.error('Error loading child nickname:', error);
            }
            
            // Load firework type from localStorage
            let fireworkType = 'heart'; // Default type
            try {
                const savedType = localStorage.getItem('fireworkType');
                if (savedType) {
                    fireworkType = savedType;
                }
            } catch (error) {
                console.error('Error loading firework type:', error);
            }
            
            const timestamp = Date.now();
            const fireworkData = {
                id: `${museumId}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                museumId: museumId,
                museumName: currentMuseum.name,
                museumCity: currentMuseum.city,
                taskContent: task,
                ageGroup: ageGroup,
                childNickname: childNickname,
                fireworkType: fireworkType,
                timestamp: timestamp,
                date: new Date(timestamp).toISOString()
            };

            // Save to local storage
            const localFireworks = JSON.parse(localStorage.getItem('museumCheckFireworks') || '[]');
            localFireworks.push(fireworkData);
            localStorage.setItem('museumCheckFireworks', JSON.stringify(localFireworks));

            // Upload to remote storage
            uploadToRemoteStorage(fireworkData);
        }

        // Upload to remote KV store
        function uploadToRemoteStorage(fireworkData) {
            const url = REMOTE_STORAGE_CONFIG.API_ENDPOINT;
            const key = REMOTE_STORAGE_CONFIG.FIREWORK_KEY;
            
            // Load fireworks retention time from localStorage (in milliseconds)
            let retentionTimeMs = 60000; // Default: 1 minute
            try {
                const saved = localStorage.getItem('fireworksRetentionTime');
                if (saved) {
                    retentionTimeMs = parseInt(saved, 10);
                }
            } catch (error) {
                console.error('Error loading fireworks retention time:', error);
            }
            
            // Convert milliseconds to seconds for TTL
            const ttlSeconds = Math.round(retentionTimeMs / 1000);
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: key,
                    sortKey: fireworkData.id,
                    value: JSON.stringify(fireworkData),
                    expireAt: Math.floor(fireworkData.timestamp / 1000) + ttlSeconds  // Convert to seconds: timestamp in ms / 1000 + TTL in seconds
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Firework uploaded successfully:', data);
            })
            .catch(error => {
                console.error('Error uploading firework:', error);
            });
        }

        // Update progress display
        function updateProgress() {
            const completed = completedTasks.size;
            const total = childTasks.length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Update text - with null check
            const completedCountElement = document.getElementById('completedCount');
            if (completedCountElement) {
                completedCountElement.textContent = completed;
            }
            
            // Update progress bar - with null check
            const progressFillElement = document.getElementById('progressFill');
            if (progressFillElement) {
                progressFillElement.style.width = percentage + '%';
            }
            
            // Update stars display - with null check
            const starsContainer = document.getElementById('progressStars');
            if (starsContainer && total > 0) {
                let starsHTML = '';
                for (let i = 0; i < total; i++) {
                    const isCompleted = i < completed;
                    starsHTML += `<span class="progress-star ${isCompleted ? 'completed' : ''}">⭐</span>`;
                }
                starsContainer.innerHTML = starsHTML;
            }
            
            // Update text based on completion
            const progressText = document.getElementById('progressText');
            if (progressText) {
                if (completed === total && total > 0) {
                    progressText.innerHTML = '🎉 太棒了！全部完成！';
                } else {
                    progressText.innerHTML = `已完成 <span id="completedCount">${completed}</span> 个任务`;
                }
            }
        }

        // Save completed tasks to local storage
        function saveCompletedTasks() {
            // Use the same structure as the main app: museumChecklists
            const checklistKey = `${museumId}-child-${ageGroup}`;
            const checklistsData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
            checklistsData[checklistKey] = [...completedTasks];
            localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
            
            // Also save to legacy format for backward compatibility (temporary)
            const legacyKey = `museumCheckin_${museumId}_${ageGroup}`;
            localStorage.setItem(legacyKey, JSON.stringify([...completedTasks]));
        }

        // Save reported tasks (completed by reporting "不存在") to local storage
        function saveReportedTasks() {
            const reportedKey = `reportedTasks_${museumId}_${ageGroup}`;
            localStorage.setItem(reportedKey, JSON.stringify([...reportedTasks]));
        }

        // Load reported tasks from local storage
        function loadReportedTasks() {
            try {
                const reportedKey = `reportedTasks_${museumId}_${ageGroup}`;
                const saved = localStorage.getItem(reportedKey);
                if (saved) {
                    reportedTasks = new Set(JSON.parse(saved));
                }
            } catch (error) {
                console.error('Error loading reported tasks:', error);
                reportedTasks = new Set();
            }
        }

        // Photo storage
        let taskPhotos = {}; // Store photos by task index
        
        /**
         * Photo compression configuration
         * @property {number} MAX_WIDTH - Maximum photo width in pixels (800px reduces ~2MB photos to ~100-200KB)
         * @property {number} QUALITY - JPEG compression quality (0.0-1.0, where 1.0 is highest quality)
         */
        const PHOTO_CONFIG = {
            MAX_WIDTH: 800,    // Maximum width in pixels for compressed photos
            QUALITY: 0.65      // JPEG quality (0.65 provides good balance of quality vs size)
        };

        // Load photos from localStorage
        function loadPhotos() {
            try {
                const photosKey = `museumPhotos_${museumId}_${ageGroup}`;
                const saved = localStorage.getItem(photosKey);
                if (saved) {
                    taskPhotos = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Error loading photos:', error);
                taskPhotos = {};
            }
        }

        // Save photos to localStorage
        function savePhotos() {
            try {
                const photosKey = `museumPhotos_${museumId}_${ageGroup}`;
                localStorage.setItem(photosKey, JSON.stringify(taskPhotos));
            } catch (error) {
                console.error('Error saving photos:', error);
            }
        }

        // Compress photo to reduce size
        async function compressPhoto(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const maxWidth = PHOTO_CONFIG.MAX_WIDTH;
                        const scale = Math.min(1, maxWidth / img.width);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        canvas.toBlob((blob) => {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        }, 'image/jpeg', PHOTO_CONFIG.QUALITY);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Handle photo capture
        async function handlePhotoCapture() {
            const input = document.getElementById('taskPhotoInput');
            const file = input.files[0];
            
            if (!file) return;
            
            try {
                // Compress photo
                const compressedFile = await compressPhoto(file);
                
                // Convert to data URL for storage
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Store photo for current task
                    taskPhotos[currentTaskIndex] = e.target.result;
                    savePhotos();
                    
                    // Display preview
                    displayPhotoPreview(e.target.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error processing photo:', error);
                alert('照片处理失败，请重试');
            }
        }

        // Display photo preview
        function displayPhotoPreview(dataUrl) {
            const preview = document.getElementById('photoPreview');
            const retakeBtn = document.getElementById('retakeButton');
            const photoInput = document.getElementById('taskPhotoInput');
            
            preview.innerHTML = `<img src="${dataUrl}" alt="Task photo">`;
            retakeBtn.style.display = 'block';
            photoInput.style.display = 'none';
        }

        // Clear photo preview
        function clearPhotoPreview() {
            const preview = document.getElementById('photoPreview');
            const retakeBtn = document.getElementById('retakeButton');
            const input = document.getElementById('taskPhotoInput');
            
            preview.innerHTML = '';
            retakeBtn.style.display = 'none';
            input.style.display = 'block';
            input.value = '';
            
            // Remove photo from storage
            if (currentTaskIndex !== null && taskPhotos[currentTaskIndex]) {
                delete taskPhotos[currentTaskIndex];
                savePhotos();
            }
        }

        // ===== Contributed Treasures Storage Functions =====
        
        // Get the storage key for contributed treasures
        function getContributedTreasuresKey() {
            return `contributedTreasures_${museumId}_${ageGroup}`;
        }
        
        // Save a contributed treasure for a specific task
        async function saveContributedTreasure(taskIndex, treasureData) {
            try {
                const key = getContributedTreasuresKey();
                const allTreasures = JSON.parse(localStorage.getItem(key) || '{}');
                allTreasures[taskIndex] = treasureData;
                localStorage.setItem(key, JSON.stringify(allTreasures));
                
                // Also save to the global contributed treasures list
                saveToGlobalContributedTreasures(treasureData);
                
                // Add to current museum's collections and save to KV store (Tier 2)
                // This ensures the treasure is persisted remotely like the settings page does
                if (currentMuseum && treasureData.name) {
                    const newTreasure = {
                        name: treasureData.name,
                        imageUrl: treasureData.imageUrl || '',
                        description: '用户添加的镇馆之宝',
                        isUserAdded: true,
                        addedAt: treasureData.timestamp || Date.now()
                    };
                    
                    // Initialize collections if not exists
                    if (!currentMuseum.collections) {
                        currentMuseum.collections = [];
                    }
                    
                    // Check if treasure already exists in collections
                    const existsInCollections = currentMuseum.collections.some(c => c.name === newTreasure.name);
                    if (!existsInCollections) {
                        currentMuseum.collections.push(newTreasure);
                        
                        // Also save to user treasures localStorage (for user-specific tracking)
                        const userTreasures = loadUserAddedTreasures(museumId);
                        const existsInUserTreasures = userTreasures.some(t => t.name === newTreasure.name);
                        if (!existsInUserTreasures) {
                            userTreasures.push(newTreasure);
                            saveUserAddedTreasures(userTreasures);
                        }
                        
                        // Save to KV store (remote persistence)
                        const saveSuccess = await saveMuseumWithUserTreasuresToRemote();
                        if (saveSuccess) {
                            console.log(`Contributed treasure "${treasureData.name}" saved to KV store`);
                        } else {
                            console.warn(`Contributed treasure "${treasureData.name}" saved locally only (KV store unavailable)`);
                        }
                    }
                }
            } catch (e) {
                console.error('Error saving contributed treasure:', e);
            }
        }
        
        // Get contributed treasure for a specific task
        function getContributedTreasureForTask(taskIndex) {
            try {
                const key = getContributedTreasuresKey();
                const allTreasures = JSON.parse(localStorage.getItem(key) || '{}');
                return allTreasures[taskIndex] || null;
            } catch (e) {
                console.error('Error loading contributed treasure:', e);
                return null;
            }
        }
        
        // Save to global list of contributed treasures (for potential future sync)
        function saveToGlobalContributedTreasures(treasureData) {
            try {
                const globalKey = 'allContributedTreasures';
                const allTreasures = JSON.parse(localStorage.getItem(globalKey) || '[]');
                
                // Add new treasure if not already exists
                const exists = allTreasures.some(t => 
                    t.museumId === treasureData.museumId && 
                    t.name === treasureData.name
                );
                
                if (!exists) {
                    allTreasures.push(treasureData);
                    localStorage.setItem(globalKey, JSON.stringify(allTreasures));
                }
            } catch (e) {
                console.error('Error saving to global contributed treasures:', e);
            }
        }

        // ===== Museum Entrance Photo Contributor Functions =====
        
        // Local storage key for contributed museum photos
        // NOTE: This key must match APP_CONFIG.LOCAL_STORAGE_KEYS.CONTRIBUTED_MUSEUM_PHOTOS in script.js
        // Duplicated here since museum-checkin.html is a standalone page that doesn't import script.js config
        const CONTRIBUTED_MUSEUM_PHOTOS_KEY = 'contributedMuseumPhotos';
        
        // Get contributed museum entrance photo
        function getContributedMuseumPhoto(musId) {
            try {
                const all = JSON.parse(localStorage.getItem(CONTRIBUTED_MUSEUM_PHOTOS_KEY) || '{}');
                return all[musId] || null;
            } catch (e) {
                console.error('Error getting contributed museum photo:', e);
                return null;
            }
        }
        
        // Save contributed museum entrance photo
        function saveContributedMuseumPhoto(musId, photoData) {
            try {
                const all = JSON.parse(localStorage.getItem(CONTRIBUTED_MUSEUM_PHOTOS_KEY) || '{}');
                all[musId] = {
                    ...photoData,
                    contributedAt: Date.now()
                };
                localStorage.setItem(CONTRIBUTED_MUSEUM_PHOTOS_KEY, JSON.stringify(all));
                console.log('Museum photo contributed successfully:', musId);
                
                // Also update currentMuseum.image so it shows immediately
                if (currentMuseum && currentMuseum.id === musId) {
                    currentMuseum.image = photoData.imageUrl;
                }
                
                return true;
            } catch (e) {
                console.error('Error saving contributed museum photo:', e);
                return false;
            }
        }
        
        // Handle museum photo search (wiki or baidu)
        async function handleMuseumPhotoSearch(source) {
            const searchInput = document.getElementById('modalMuseumPhotoSearch');
            const query = searchInput ? searchInput.value.trim() : '';
            
            if (!query) {
                alert('请输入搜索关键词');
                return;
            }
            
            if (source === 'wiki') {
                // Use existing Wiki search modal pattern
                try {
                    // Set callback context for wiki search
                    window.currentImageInputId = null;  // Not using input field
                    window.currentPreviewId = 'modalMuseumPhotoPreview';
                    // Copy name to search input
                    const wikiSearchInput = document.getElementById('wikiSearchInput');
                    if (wikiSearchInput) {
                        wikiSearchInput.value = query;
                    }
                    openWikiSearch();
                } catch (e) {
                    console.error('Wiki search error:', e);
                    alert('搜索失败，请重试');
                }
            } else if (source === 'baidu') {
                // Open Baidu image search in new tab
                window.open(`https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(query)}`, '_blank');
                // Show prompt to paste URL
                const url = prompt('在百度图片中找到合适的图片后，右键复制图片地址并粘贴到此处：');
                if (url && url.trim()) {
                    showMuseumPhotoPreview(url.trim());
                }
            }
        }
        
        // Show museum photo preview
        function showMuseumPhotoPreview(imageUrl) {
            const preview = document.getElementById('modalMuseumPhotoPreview');
            if (!preview || !imageUrl) return;
            
            // Replace placeholder with image
            preview.innerHTML = `<img src="${imageUrl}" alt="博物馆门口" class="image-preview-thumb">`;
            preview.classList.remove('image-preview-placeholder');
            preview.classList.add('image-preview-thumb');
            preview.dataset.imageUrl = imageUrl;
            
            // Show submit button
            document.getElementById('modalMuseumPhotoSubmitBtn').style.display = 'block';
        }
        
        // Handle museum photo submit
        function handleMuseumPhotoSubmit() {
            const preview = document.getElementById('modalMuseumPhotoPreview');
            if (!preview) return;
            
            const imageUrl = preview.dataset.imageUrl;
            if (!imageUrl) {
                alert('请先添加博物馆门口照片');
                return;
            }
            
            // Save the photo
            const success = saveContributedMuseumPhoto(museumId, {
                imageUrl: imageUrl,
                description: `由亲子探索者贡献于${new Date().toLocaleDateString('zh-CN')}`
            });
            
            if (success) {
                // Hide contributor section, show the photo
                document.getElementById('museumPhotoContributorSection').style.display = 'none';
                const imgEl = document.getElementById('modalImage');
                if (imgEl) {
                    imgEl.src = imageUrl;
                    imgEl.style.display = 'block';
                }
                
                // Show success badge briefly
                document.getElementById('museumPhotoContributedBadge').style.display = 'block';
                
                // Update the task card on the main page
                updateTaskCardImage(0, imageUrl);
                
                // Play celebration sound if available
                if (typeof playSuccessSound === 'function') playSuccessSound();
            }
        }
        
        // Update task card image after contribution
        function updateTaskCardImage(taskIndex, imageUrl) {
            const taskCards = document.querySelectorAll('.task-card');
            if (taskCards[taskIndex]) {
                const card = taskCards[taskIndex];
                const visualContainer = card.querySelector('.task-visual-container');
                if (visualContainer) {
                    const iconDiv = visualContainer.querySelector('.task-icon');
                    let imgEl = visualContainer.querySelector('.task-card-image');
                    if (!imgEl) {
                        imgEl = document.createElement('img');
                        imgEl.className = 'task-card-image';
                        visualContainer.insertBefore(imgEl, iconDiv);
                    }
                    imgEl.src = imageUrl;
                    imgEl.style.display = 'block';
                    if (iconDiv) iconDiv.style.display = 'none';
                }
            }
        }
        
        // ===== End Museum Entrance Photo Contributor Functions =====
        
        // ===== Treasure Photo Contributor Functions =====
        const CONTRIBUTED_TREASURE_PHOTOS_KEY = 'contributedTreasurePhotos';
        
        // Get contributed treasure photo for a specific museum and treasure name
        function getContributedTreasurePhoto(musId, treasureName) {
            try {
                const all = JSON.parse(localStorage.getItem(CONTRIBUTED_TREASURE_PHOTOS_KEY) || '{}');
                const museumPhotos = all[musId] || {};
                return museumPhotos[treasureName] || null;
            } catch (e) {
                console.error('Error getting contributed treasure photo:', e);
                return null;
            }
        }
        
        // Save contributed treasure photo
        // NOTE: This function has a side effect - it updates currentMuseum.collections
        // to ensure the newly contributed photo is immediately visible in the UI
        function saveContributedTreasurePhoto(musId, treasureName, photoData) {
            try {
                const all = JSON.parse(localStorage.getItem(CONTRIBUTED_TREASURE_PHOTOS_KEY) || '{}');
                if (!all[musId]) {
                    all[musId] = {};
                }
                all[musId][treasureName] = {
                    ...photoData,
                    contributedAt: Date.now()
                };
                localStorage.setItem(CONTRIBUTED_TREASURE_PHOTOS_KEY, JSON.stringify(all));
                console.log('Treasure photo contributed successfully:', musId, treasureName);
                
                // Side effect: Update currentMuseum.collections for immediate UI update
                // This allows the photo to be displayed without page reload
                if (currentMuseum && currentMuseum.id === musId) {
                    if (!currentMuseum.collections) {
                        currentMuseum.collections = [];
                    }
                    // Find existing collection or add new one
                    const existing = currentMuseum.collections.find(c => c.name === treasureName);
                    if (existing) {
                        existing.imageUrl = photoData.imageUrl;
                    } else {
                        currentMuseum.collections.push({
                            name: treasureName,
                            imageUrl: photoData.imageUrl,
                            description: photoData.description || '由亲子探索者贡献'
                        });
                    }
                }
                
                return true;
            } catch (e) {
                console.error('Error saving contributed treasure photo:', e);
                return false;
            }
        }
        
        // Show treasure photo preview
        function showTreasurePhotoPreview(imageUrl) {
            const preview = document.getElementById('modalTreasurePhotoPreview');
            if (!preview || !imageUrl) return;
            
            // Replace placeholder with image
            preview.innerHTML = `<img src="${imageUrl}" alt="镇馆之宝" class="image-preview-thumb">`;
            preview.classList.remove('image-preview-placeholder');
            preview.classList.add('image-preview-thumb');
            preview.dataset.imageUrl = imageUrl;
            
            // Show submit button
            document.getElementById('modalTreasurePhotoSubmitBtn').style.display = 'block';
        }
        
        // Handle treasure photo submit
        async function handleTreasurePhotoSubmit() {
            const preview = document.getElementById('modalTreasurePhotoPreview');
            if (!preview) return;
            
            const imageUrl = preview.dataset.imageUrl;
            if (!imageUrl) {
                alert('请先添加镇馆之宝照片');
                return;
            }
            
            // Get treasure name from current task
            const treasurePhotoSection = document.getElementById('treasurePhotoContributorSection');
            const treasureName = treasurePhotoSection.dataset.treasureName;
            if (!treasureName) {
                alert('无法获取镇馆之宝名称');
                return;
            }
            
            // Get museum ID (use currentMuseum.id if available, fallback to global museumId)
            const musId = (currentMuseum && currentMuseum.id) || museumId;
            if (!musId) {
                alert('无法获取博物馆信息');
                return;
            }
            
            // Save the photo
            const success = saveContributedTreasurePhoto(musId, treasureName, {
                imageUrl: imageUrl,
                description: `由亲子探索者贡献于${new Date().toLocaleDateString('zh-CN')}`
            });
            
            if (success) {
                // Hide contributor section, show the photo
                treasurePhotoSection.style.display = 'none';
                const imgEl = document.getElementById('modalImage');
                if (imgEl) {
                    imgEl.src = imageUrl;
                    imgEl.style.display = 'block';
                }
                
                // Show success badge
                document.getElementById('treasurePhotoContributedBadge').style.display = 'block';
                
                // Update the task card on the main page
                if (currentTaskIndex !== null) {
                    updateTaskCardImage(currentTaskIndex, imageUrl);
                }
                
                // Award XP using achievement gamification system
                if (typeof window.achievementGamification !== 'undefined' && window.achievementGamification) {
                    window.achievementGamification.addXP(20);
                    window.achievementGamification.showXPGainNotification(20, `贡献「${treasureName}」照片`);
                } else {
                    // Fallback: show simple notification
                    showNotification('✅ 照片贡献成功！获得 +20 XP', 3000);
                }
                
                // Play celebration sound if available
                if (typeof playSuccessSound === 'function') playSuccessSound();
            }
        }
        
        // Handle treasure photo upload
        async function handleTreasurePhotoUploadChange(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Validate file
            if (!validateImageFile(file)) {
                return;
            }
            
            // Check if imageUploader is available
            if (typeof imageUploader === 'undefined') {
                alert('图片上传功能暂时不可用');
                return;
            }
            
            try {
                // Show uploading indicator
                const uploadLabel = document.getElementById('modalTreasurePhotoUploadLabel');
                if (uploadLabel) {
                    setUploadingState(uploadLabel);
                }
                
                // Upload image
                const imageUrl = await imageUploader.uploadImage(file, {
                    compress: true,
                    onProgress: (stage, progress) => {
                        console.log(`Upload ${stage}: ${progress}%`);
                    }
                });
                
                if (imageUrl) {
                    showTreasurePhotoPreview(imageUrl);
                }
                
                // Reset upload button
                if (uploadLabel) {
                    resetUploadButton(uploadLabel, (e) => handleTreasurePhotoUploadChange(e));
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('上传失败: ' + error.message);
                
                // Reset upload button
                const uploadLabel = document.getElementById('modalTreasurePhotoUploadLabel');
                if (uploadLabel) {
                    resetUploadButton(uploadLabel, (e) => handleTreasurePhotoUploadChange(e));
                }
            }
        }
        
        // ===== End Treasure Photo Contributor Functions =====
        
        // ===== Photo Upload Handler Functions =====
        // Constants for upload UI
        const UPLOAD_BUTTON_TEXT = '📤 选择文件';
        const MAX_FILE_SIZE_MB = 10;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
        
        /**
         * Validate image file for upload
         * @param {File} file - File to validate
         * @returns {boolean} - True if valid, false otherwise
         */
        function validateImageFile(file) {
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件');
                return false;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                alert(`图片文件太大，请选择小于${MAX_FILE_SIZE_MB}MB的图片`);
                return false;
            }
            return true;
        }
        
        /**
         * Set upload button to uploading state
         * @param {HTMLElement} uploadLabel - The upload button label element
         */
        function setUploadingState(uploadLabel) {
            if (uploadLabel) {
                const inputHtml = uploadLabel.querySelector('input') ? uploadLabel.querySelector('input').outerHTML : '';
                uploadLabel.classList.add('uploading');
                uploadLabel.innerHTML = '<span>⏳ 上传中...</span>' + inputHtml;
            }
        }
        
        /**
         * Reset upload button to default state
         * @param {HTMLElement} uploadLabel - The upload button label element
         * @param {Function} changeHandler - Event handler for the file input change event
         */
        function resetUploadButton(uploadLabel, changeHandler) {
            if (uploadLabel) {
                const inputHtml = uploadLabel.querySelector('input') ? uploadLabel.querySelector('input').outerHTML : '';
                uploadLabel.classList.remove('uploading');
                uploadLabel.innerHTML = UPLOAD_BUTTON_TEXT + inputHtml;
                // Re-attach the input event handler
                const newInput = uploadLabel.querySelector('input');
                if (newInput && changeHandler) {
                    newInput.addEventListener('change', changeHandler);
                }
            }
        }
        
        /**
         * Update preview element with progress message
         * @param {HTMLElement} preview - Preview element
         * @param {string} stage - Upload stage ('compressing' or 'uploading')
         */
        function updateUploadProgress(preview, stage) {
            if (preview) {
                if (stage === 'compressing') {
                    preview.innerHTML = '<span class="upload-progress">🗜️ 压缩中...</span>';
                } else if (stage === 'uploading') {
                    preview.innerHTML = '<span class="upload-progress">⬆️ 上传中...</span>';
                }
            }
        }
        
        /**
         * Handle photo upload and compression using ImageUploader
         * @param {Event} e - File input change event
         * @param {string} imageInputId - ID of the text input to store the URL
         * @param {string} previewId - ID of the preview element
         */
        async function handlePhotoUpload(e, imageInputId, previewId) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            
            const preview = document.getElementById(previewId);
            const imageInput = document.getElementById(imageInputId);
            const uploadLabel = e.target.parentElement;
            
            // Validate file
            if (!validateImageFile(file)) return;
            
            // Show uploading state
            setUploadingState(uploadLabel);
            
            // Show loading in preview
            if (preview) {
                preview.innerHTML = '<span class="upload-progress">⏳ 压缩上传中...</span>';
                preview.className = 'image-preview-placeholder';
            }
            
            try {
                // Use ImageUploader if available
                if (typeof imageUploader !== 'undefined') {
                    const url = await imageUploader.uploadImage(file, {
                        compress: true,
                        onProgress: (stage, progress) => updateUploadProgress(preview, stage)
                    });
                    
                    // Update the image input with the URL
                    if (imageInput) {
                        imageInput.value = url;
                        // Trigger input event to update any dependent UI
                        imageInput.dispatchEvent(new Event('input'));
                    }
                    
                    // Update preview with the uploaded image
                    if (preview) {
                        const img = document.createElement('img');
                        img.src = url;
                        img.className = 'image-preview-thumb';
                        img.alt = '已上传';
                        preview.innerHTML = '';
                        preview.className = 'image-preview-container';
                        preview.appendChild(img);
                    }
                    
                    console.log('✅ 图片上传成功:', url);
                } else {
                    throw new Error('图片上传服务不可用');
                }
            } catch (error) {
                console.error('图片上传失败:', error);
                alert('图片上传失败：' + (error.message || '未知错误'));
                
                // Reset preview
                if (preview) {
                    preview.innerHTML = '📷';
                    preview.className = 'image-preview-placeholder';
                }
            } finally {
                // Reset upload button state
                resetUploadButton(uploadLabel, (ev) => handlePhotoUpload(ev, imageInputId, previewId));
                // Reset file input to allow re-uploading the same file
                e.target.value = '';
            }
        }
        
        /**
         * Handle museum entrance photo upload
         * @param {Event} e - File input change event
         */
        async function handleMuseumPhotoUploadChange(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            
            const preview = document.getElementById('modalMuseumPhotoPreview');
            const submitBtn = document.getElementById('modalMuseumPhotoSubmitBtn');
            const uploadLabel = e.target.parentElement;
            
            // Validate file
            if (!validateImageFile(file)) return;
            
            // Show uploading state
            setUploadingState(uploadLabel);
            
            // Show loading in preview
            if (preview) {
                preview.innerHTML = '<span class="upload-progress">⏳ 压缩上传中...</span>';
            }
            
            try {
                // Use ImageUploader if available
                if (typeof imageUploader !== 'undefined') {
                    const url = await imageUploader.uploadImage(file, {
                        compress: true,
                        onProgress: (stage, progress) => updateUploadProgress(preview, stage)
                    });
                    
                    // Update preview with the uploaded image
                    if (preview) {
                        const img = document.createElement('img');
                        img.src = url;
                        img.className = 'image-preview-thumb';
                        img.alt = '博物馆门口照片';
                        preview.innerHTML = '';
                        preview.appendChild(img);
                        preview.dataset.imageUrl = url;
                    }
                    
                    // Show submit button
                    if (submitBtn) {
                        submitBtn.style.display = 'block';
                    }
                    
                    console.log('✅ 博物馆照片上传成功:', url);
                } else {
                    throw new Error('图片上传服务不可用');
                }
            } catch (error) {
                console.error('博物馆照片上传失败:', error);
                alert('图片上传失败：' + (error.message || '未知错误'));
                
                // Reset preview
                if (preview) {
                    preview.innerHTML = '📷 添加博物馆门口照片';
                }
            } finally {
                // Reset upload button state
                resetUploadButton(uploadLabel, handleMuseumPhotoUploadChange);
                // Reset file input
                e.target.value = '';
            }
        }
        // ===== End Photo Upload Handler Functions =====

        // Helper function: Draw Minecraft-style corner decorations
        function drawMinecraftCorners(ctx, width, height) {
            const blockSize = 16;
            const cornerColors = ['#4a7c2f', '#8b4513', '#7c4a2f'];
            
            // Draw pixelated corner blocks (3x3 blocks)
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const color = cornerColors[Math.floor(Math.random() * cornerColors.length)];
                    ctx.fillStyle = color;
                    
                    // Top-left corner
                    ctx.fillRect(20 + i * blockSize, 20 + j * blockSize, blockSize - 2, blockSize - 2);
                    // Top-right corner
                    ctx.fillRect(width - 20 - (i + 1) * blockSize, 20 + j * blockSize, blockSize - 2, blockSize - 2);
                    // Bottom-left corner
                    ctx.fillRect(20 + i * blockSize, height - 20 - (j + 1) * blockSize, blockSize - 2, blockSize - 2);
                    // Bottom-right corner
                    ctx.fillRect(width - 20 - (i + 1) * blockSize, height - 20 - (j + 1) * blockSize, blockSize - 2, blockSize - 2);
                }
            }
        }

        // Generate poster with all photos
        function generatePoster() {
            const canvas = document.getElementById('posterCanvas');
            const preview = document.getElementById('posterPreview');
            if (!canvas || !preview) return;
            
            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            
            // Get completed tasks text with index information for reported task detection
            const completedTasksIndices = Array.from(completedTasks).sort((a, b) => a - b);
            const completedTasksList = completedTasksIndices
                .map(idx => childTasks[idx])
                .filter(Boolean);
            
            // Collect all photos
            const photos = Object.keys(taskPhotos).sort().map(key => taskPhotos[key]);
            
            // Helper function to convert museum ID to QR code filename
            const getQRCodeFilename = (musId) => {
                if (!musId) return null;
                // Convert museum-id format to PascalCase: pinghu-museum -> PinghuMuseum
                const pascalCase = musId.split('-')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join('');
                return `assets/qrcodes/MuseumCheck_QRCode_${pascalCase}.png`;
            };
            
            // Try to load museum-specific QR code or fallback to generic WeChat QR
            const loadQRCode = () => new Promise((resolve) => {
                const qrImg = new Image();
                qrImg.crossOrigin = 'anonymous';
                
                // First try museum-specific QR code
                const museumQRFile = getQRCodeFilename(museumId);
                qrImg.onload = () => resolve(qrImg);
                qrImg.onerror = () => {
                    // Fallback to generic WeChat mini-program QR code
                    const fallbackQR = new Image();
                    fallbackQR.crossOrigin = 'anonymous';
                    fallbackQR.onload = () => resolve(fallbackQR);
                    fallbackQR.onerror = () => resolve(null);
                    fallbackQR.src = 'assets/qrcodes/MuseumCheck_QRCode_WX.jpg';
                };
                qrImg.src = museumQRFile;
            });
            
            // Load all photos as images
            const loadImage = (dataUrl) => new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = dataUrl;
            });
            
            // Load photos and QR code in parallel
            Promise.all([...photos.map(loadImage), loadQRCode()]).then(results => {
                const qrImage = results.pop(); // Last item is QR code
                const validImages = results.filter(img => img !== null);
                
                // Pre-calculate required canvas height to avoid canvas clearing
                // Updated: Changed from 260 to 210 after removing duplicate museum name line
                let currentY = 210;
                
                // Height for completed tasks section (with extra space for reported tasks)
                if (completedTasksList.length > 0) {
                    currentY += 35; // Section title
                    // Count reported tasks for extra height calculation
                    const reportedCount = completedTasksIndices.filter(idx => reportedTasks.has(idx)).length;
                    const normalCount = completedTasksList.length - reportedCount;
                    currentY += normalCount * 28; // Normal task list
                    currentY += reportedCount * 40; // Reported tasks need extra height for annotation
                    currentY += 20; // Space after tasks
                }
                
                // Height for photos section
                let photoSectionHeight = 0;
                if (validImages.length > 0) {
                    let photoSize = 280;
                    let cols = 2;
                    let padding = 20;
                    
                    if (validImages.length <= 2) {
                        cols = 2;
                        photoSize = 280;
                    } else if (validImages.length <= 4) {
                        cols = 2;
                        photoSize = 200;
                        padding = 15;
                    } else {
                        cols = 3;
                        photoSize = 180;
                        padding = 12;
                    }
                    
                    const rows = Math.ceil(validImages.length / cols);
                    photoSectionHeight = 40 + rows * (photoSize + padding); // Header + grid
                }
                
                // Calculate total required height
                const contentEndY = currentY + photoSectionHeight + 40;
                const qrHeight = qrImage ? 180 : 0;
                const requiredHeight = Math.max(contentEndY + 100, Math.max(contentEndY, canvas.height - 180) + qrHeight);
                
                // Set canvas height BEFORE drawing to avoid clearing
                if (requiredHeight > canvas.height) {
                    canvas.height = requiredHeight;
                }
                
                const H = canvas.height;
                
                // Now draw everything on the correctly-sized canvas
                // Background gradient
                const grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0, '#a8d8ea');
                grad.addColorStop(1, '#5ab4d1');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);
                
                // Minecraft corner decorations
                drawMinecraftCorners(ctx, W, H);
                
                // Title - v2 format: Museum Name + 探索
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 44px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                const museumTitle = currentMuseum ? `${currentMuseum.name}探索` : '博物馆探索';
                ctx.fillText(museumTitle, 40, 100);
                
                // Nickname - moved up to remove duplicate museum name line
                const nickname = getChildNickname();
                ctx.font = '28px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                ctx.fillText(`${nickname} 今天完成了所有挑战！`, 40, 160);
                
                // Reset currentY for actual drawing - adjusted for removed line
                currentY = 210;
                
                // Section title for completed tasks
                if (completedTasksList.length > 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                    ctx.textAlign = 'left';
                    ctx.fillText('✅ 完成的任务：', 40, currentY);
                    currentY += 35;
                    
                    // Draw completed tasks with compact layout
                    ctx.font = '20px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                    ctx.fillStyle = 'rgba(255,255,255,0.95)';
                    
                    completedTasksList.forEach((task, idx) => {
                        // Get original task index to check if it was reported
                        const originalIdx = completedTasksIndices[idx];
                        const wasReported = reportedTasks.has(originalIdx);
                        
                        // Remove emoji from task text for cleaner display
                        const taskText = task.replace(/^[\u{1F000}-\u{1F9FF}]\s*/u, '');
                        // Truncate long tasks
                        const displayText = taskText.length > 30 ? taskText.substring(0, 28) + '...' : taskText;
                        
                        // Add indicator for tasks completed via reporting
                        if (wasReported) {
                            ctx.fillText(`${idx + 1}. ${displayText} 🙋`, 50, currentY);
                            // Draw small annotation below
                            ctx.save();
                            ctx.font = '14px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                            ctx.fillStyle = 'rgba(255,255,255,0.7)';
                            ctx.fillText('（报告不存在，为大家好）', 60, currentY + 16);
                            ctx.restore();
                            currentY += 40; // Extra space for annotation
                        } else {
                            ctx.fillText(`${idx + 1}. ${displayText}`, 50, currentY);
                            currentY += 28;
                        }
                    });
                    
                    currentY += 20; // Space before photos
                }
                
                // Draw photos if available
                if (validImages.length > 0) {
                    let photoSize = 280;
                    let cols = 2;
                    let padding = 20;
                    
                    if (validImages.length <= 2) {
                        cols = 2;
                        photoSize = 280;
                    } else if (validImages.length <= 4) {
                        cols = 2;
                        photoSize = 200;
                        padding = 15;
                    } else {
                        cols = 3;
                        photoSize = 180;
                        padding = 12;
                    }
                    
                    // Photos section header
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                    ctx.textAlign = 'left';
                    ctx.fillText('📸 精彩瞬间：', 40, currentY);
                    currentY += 40;
                    
                    const startY = currentY;
                    
                    // Draw photos in grid
                    validImages.forEach((img, idx) => {
                        const row = Math.floor(idx / cols);
                        const col = idx % cols;
                        const x = 40 + col * (photoSize + padding);
                        const y = startY + row * (photoSize + padding);
                        
                        // White border
                        ctx.fillStyle = 'rgba(255,255,255,0.6)';
                        ctx.fillRect(x - 6, y - 6, photoSize + 12, photoSize + 12);
                        
                        // Draw photo with aspect ratio
                        const scale = Math.min(photoSize / img.width, photoSize / img.height);
                        const scaledW = img.width * scale;
                        const scaledH = img.height * scale;
                        const offsetX = (photoSize - scaledW) / 2;
                        const offsetY = (photoSize - scaledH) / 2;
                        
                        ctx.drawImage(img, x + offsetX, y + offsetY, scaledW, scaledH);
                    });
                    
                    const rows = Math.ceil(validImages.length / cols);
                    currentY = startY + rows * (photoSize + padding) + 40;
                } else if (photos.length > 0) {
                    // Photos exist but failed to load - show message
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.font = '20px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                    ctx.textAlign = 'left';
                    ctx.fillText('📸 照片加载中...', 40, currentY);
                    currentY += 40;
                } else if (currentMuseum && currentMuseum.image) {
                    // No user photos - try to use museum artifact image as fallback
                    const museumImg = new Image();
                    try {
                        const imgUrl = new URL(currentMuseum.image, window.location.origin);
                        if (imgUrl.origin !== window.location.origin) {
                            museumImg.crossOrigin = 'anonymous';
                        }
                    } catch(e) {
                        // Invalid URL, continue without crossOrigin
                    }
                    
                    museumImg.onload = function(){
                        // Draw artifact section header
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                        ctx.textAlign = 'left';
                        ctx.fillText('🏛️ 馆藏精选：', 40, currentY);
                        currentY += 40;
                        
                        // Draw museum image
                        const imgWidth = 640;
                        const imgHeight = 360;
                        const imgX = (W - imgWidth) / 2;
                        const imgY = currentY;
                        
                        // White border around image
                        ctx.fillStyle = 'rgba(255,255,255,0.6)';
                        ctx.fillRect(imgX - 6, imgY - 6, imgWidth + 12, imgHeight + 12);
                        
                        // Draw image with rounded corners
                        ctx.save();
                        ctx.beginPath();
                        const radius = 12;
                        ctx.moveTo(imgX + radius, imgY);
                        ctx.lineTo(imgX + imgWidth - radius, imgY);
                        ctx.arcTo(imgX + imgWidth, imgY, imgX + imgWidth, imgY + radius, radius);
                        ctx.lineTo(imgX + imgWidth, imgY + imgHeight - radius);
                        ctx.arcTo(imgX + imgWidth, imgY + imgHeight, imgX + imgWidth - radius, imgY + imgHeight, radius);
                        ctx.lineTo(imgX + radius, imgY + imgHeight);
                        ctx.arcTo(imgX, imgY + imgHeight, imgX, imgY + imgHeight - radius, radius);
                        ctx.lineTo(imgX, imgY + radius);
                        ctx.arcTo(imgX, imgY, imgX + radius, imgY, radius);
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(museumImg, imgX, imgY, imgWidth, imgHeight);
                        ctx.restore();
                        
                        // Add text overlay
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(imgX, imgY + imgHeight - 50, imgWidth, 50);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '20px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                        ctx.fillText('藏品照片 · 馆藏精选', imgX + 20, imgY + imgHeight - 20);
                        
                        // Update currentY for footer positioning
                        currentY = imgY + imgHeight + 40;
                        
                        // Re-draw footer at correct position
                        const footerY = Math.max(currentY, H - 180);
                        
                        if (qrImage) {
                            const qrSize = 120;
                            const qrX = W - qrSize - 40;
                            const qrY = footerY;
                            
                            // Draw white background for QR code
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 50);
                            
                            // Draw QR code
                            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
                            
                            // Add text below QR code
                            ctx.fillStyle = '#2c5aa0';
                            ctx.font = '18px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                            ctx.textAlign = 'center';
                            ctx.fillText('扫码体验更多', qrX + qrSize / 2, qrY + qrSize + 25);
                        }
                        
                        // Draw date and branding
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                        ctx.textAlign = 'left';
                        const date = new Date().toLocaleDateString('zh-CN');
                        ctx.fillText(`MuseumCheck · ${date}`, 40, currentY + 50);
                        
                        // Update preview and SAVE TO GALLERY
                        const posterDataURL = canvas.toDataURL('image/jpeg', 0.7);
                        preview.innerHTML = `<img src="${posterDataURL}" style="max-width:100%;border-radius:12px;">`;
                        
                        // CRITICAL FIX: Save poster to localStorage for gallery view (was missing in async callback)
                        savePosterToGallery(posterDataURL);
                    };
                    
                    museumImg.onerror = function(){
                        // Fallback to message if museum image fails to load
                        ctx.fillStyle = 'rgba(255,255,255,0.8)';
                        ctx.font = '20px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                        ctx.textAlign = 'left';
                        ctx.fillText('期待您拍摄更多精彩瞬间！', 40, currentY);
                        currentY += 40;
                        
                        // Update preview and SAVE TO GALLERY
                        const posterDataURL = canvas.toDataURL('image/jpeg', 0.7);
                        preview.innerHTML = `<img src="${posterDataURL}" style="max-width:100%;border-radius:12px;">`;
                        
                        // CRITICAL FIX: Save poster to localStorage for gallery view (was missing in error callback)
                        savePosterToGallery(posterDataURL);
                    };
                    
                    museumImg.src = currentMuseum.image;
                    return; // Exit early as museum image loads asynchronously
                }
                
                // Footer area - QR code
                const footerY = Math.max(currentY, H - 180);
                
                if (qrImage) {
                    const qrSize = 120;
                    const qrX = W - qrSize - 40;
                    const qrY = footerY;
                    
                    // Draw white background for QR code
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 50);
                    
                    // Draw QR code
                    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
                    
                    // Add text below QR code
                    ctx.fillStyle = '#2c5aa0';
                    ctx.font = '18px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                    ctx.textAlign = 'center';
                    ctx.fillText('扫码体验更多', qrX + qrSize / 2, qrY + qrSize + 25);
                }
                
                // Draw date and branding on the left side
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                ctx.textAlign = 'left';
                const date = new Date().toLocaleDateString('zh-CN');
                ctx.fillText(`MuseumCheck · ${date}`, 40, currentY + 50);
                
                // Display preview - always update, even if no photos
                const posterDataURL = canvas.toDataURL('image/jpeg', 0.7);
                preview.innerHTML = `<img src="${posterDataURL}" style="max-width:100%;border-radius:12px;">`;
                
                // Save poster to localStorage for gallery view
                savePosterToGallery(posterDataURL);
            }).catch(error => {
                // Fallback: even if everything fails, show a basic poster
                console.error('Error generating poster:', error);
                const H = canvas.height;
                
                // Background gradient
                const grad = ctx.createLinearGradient(0, 0, 0, H);
                grad.addColorStop(0, '#a8d8ea');
                grad.addColorStop(1, '#5ab4d1');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);
                
                // Title - v2 format: Museum Name + 探索
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 44px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                const museumTitle = currentMuseum ? `${currentMuseum.name}探索` : '博物馆探索';
                ctx.fillText(museumTitle, 40, 100);
                
                // Nickname - moved up to remove duplicate museum name line
                const nickname = getChildNickname();
                ctx.font = '28px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                ctx.fillText(`${nickname} 今天完成了所有挑战！`, 40, 160);
                
                // Completion message
                ctx.font = '24px -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC';
                ctx.fillText('🎉 恭喜完成所有任务！', 40, 250);
                
                // Display basic poster
                const posterDataURL = canvas.toDataURL('image/jpeg', 0.7);
                preview.innerHTML = `<img src="${posterDataURL}" style="max-width:100%;border-radius:12px;">`;
                
                // Save poster to localStorage for gallery view
                savePosterToGallery(posterDataURL);
            });
        }

        // Save poster to localStorage for gallery view in main app
        function savePosterToGallery(posterDataURL) {
            try {
                // Load existing posters
                const raw = localStorage.getItem('museumPosters');
                let postersData;
                try {
                    postersData = JSON.parse(raw || '{}');
                } catch (e) {
                    console.error('[savePosterToGallery] Failed to parse museumPosters JSON, resetting to {}', e);
                    postersData = {};
                }
                
                // Get museum name for display
                const museumName = currentMuseum ? currentMuseum.name : '未知博物馆';
                
                // Save poster data with metadata
                postersData[museumId] = {
                    dataURL: posterDataURL,
                    museumId: museumId,
                    museumName: museumName,
                    ageGroup: ageGroup,
                    timestamp: Date.now(),
                    date: new Date().toLocaleDateString('zh-CN')
                };
                
                // Save to localStorage
                try {
                    localStorage.setItem('museumPosters', JSON.stringify(postersData));
                    console.log('[savePosterToGallery] ✅ Saved:', museumName, '| Total:', Object.keys(postersData).length);
                } catch (e) {
                    throw e;
                }
            } catch (error) {
                console.error('Error saving poster to gallery:', error);
                // If localStorage quota exceeded, try to remove oldest posters first
                if (error.name === 'QuotaExceededError') {
                    console.warn('Storage quota exceeded, trying to remove oldest posters');
                    try {
                        // Load existing posters and sort by timestamp (oldest first)
                        const raw = localStorage.getItem('museumPosters');
                        let existingPosters = {};
                        try {
                            existingPosters = JSON.parse(raw || '{}');
                        } catch (e) {
                            existingPosters = {};
                        }
                        
                        // Get entries sorted by timestamp (oldest first)
                        const entries = Object.entries(existingPosters);
                        entries.sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
                        
                        // Try removing oldest posters one by one until we have space
                        let saved = false;
                        let removedCount = 0;
                        const newPoster = {
                            dataURL: posterDataURL,
                            museumId: museumId,
                            museumName: currentMuseum ? currentMuseum.name : '未知博物馆',
                            ageGroup: ageGroup,
                            timestamp: Date.now(),
                            date: new Date().toLocaleDateString('zh-CN')
                        };
                        
                        // Keep at least 5 recent posters (including the new one)
                        const minToKeep = 4;
                        
                        while (entries.length > minToKeep && !saved) {
                            // Remove oldest entry
                            const removed = entries.shift();
                            removedCount++;
                            console.log('Removing oldest poster:', removed[0]);
                            
                            // Rebuild postersData
                            const reducedPosters = {};
                            entries.forEach(([key, value]) => {
                                reducedPosters[key] = value;
                            });
                            reducedPosters[museumId] = newPoster;
                            
                            try {
                                localStorage.setItem('museumPosters', JSON.stringify(reducedPosters));
                                console.log('✅ Poster saved after removing oldest. Remaining:', Object.keys(reducedPosters).length);
                                saved = true;
                            } catch (e) {
                                // Still not enough space, continue removing
                                console.log('Still not enough space, continuing...');
                            }
                        }
                        
                        // Last resort: only keep this poster
                        if (!saved) {
                            const lastResort = {};
                            lastResort[museumId] = newPoster;
                            localStorage.setItem('museumPosters', JSON.stringify(lastResort));
                            console.log('✅ Poster saved as only entry (last resort)');
                            removedCount = entries.length; // All were removed
                        }
                        
                        // Notify user about removed posters and suggest publishing
                        if (removedCount > 0) {
                            setTimeout(() => {
                                alert(`📢 存储空间不足，已清理 ${removedCount} 张旧海报。\n\n💡 提示：点击"发布海报"可永久保存到云端，不受本地空间限制！`);
                            }, 500);
                        }
                    } catch (e) {
                        console.error('Still failed after clearing:', e);
                    }
                }
            }
        }

        // Publish poster from check-in page to everyone's achievements
        async function publishPosterFromCheckin() {
            const publishBtn = document.getElementById('publishPosterButton');
            const deleteBtn = document.getElementById('deletePosterButton');
            
            if (!publishBtn) return;
            
            // Check if already published
            const publishedPosters = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
            if (publishedPosters[museumId] && publishedPosters[museumId].recordId) {
                alert('此海报已经发布过了！');
                return;
            }
            
            const originalText = publishBtn.textContent;
            
            try {
                publishBtn.disabled = true;
                publishBtn.innerHTML = '<span>⏳</span><span>发布中...</span>';
                
                // Get current poster data from localStorage
                const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
                const currentPoster = postersData[museumId];
                
                if (!currentPoster || !currentPoster.dataURL) {
                    throw new Error('海报数据未找到，请先生成海报');
                }
                
                // Get user name
                const userName = localStorage.getItem('museumcheck_user_name') || 
                                localStorage.getItem('profileName') || 
                                localStorage.getItem('childNickname') || 
                                '匿名';
                
                // Generate unique filename to avoid 409 conflicts
                // Format: museumId_userId_timestamp.png
                // This ensures different users and multiple visits create unique files
                // Using museumId instead of Chinese name to avoid URL-encoding issues
                const userId = localStorage.getItem('userId') || 
                              localStorage.getItem('museumcheck_user_id') || 
                              `user_${Math.random().toString(36).substring(2, 11)}`;
                const timestamp = Date.now();
                const museumIdForFilename = (currentPoster.museumId || museumId || 'poster');
                const uniqueFilename = `${museumIdForFilename}_${userId}_${timestamp}.png`;
                
                // Convert dataURL to blob
                const response = await fetch(currentPoster.dataURL);
                const blob = await response.blob();
                let file = new File([blob], uniqueFilename, { 
                    type: blob.type || 'image/png' 
                });
                
                // Upload image with retry on 409 conflict
                let imageUrl;
                let uploadAttempts = 0;
                const MAX_UPLOAD_ATTEMPTS = 3;
                
                while (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
                    try {
                        if (typeof imageUploader !== 'undefined' && imageUploader.uploadImage) {
                            imageUrl = await imageUploader.uploadImage(file, { compress: true });
                        } else if (typeof LetmetryAPI !== 'undefined' && LetmetryAPI.uploadImage) {
                            const upload = await LetmetryAPI.uploadImage(file);
                            imageUrl = upload.url;
                        } else {
                            throw new Error('上传服务不可用');
                        }
                        break; // Success, exit retry loop
                    } catch (uploadError) {
                        uploadAttempts++;
                        
                        // Check if it's a 409 conflict error
                        const is409 = uploadError.message && uploadError.message.includes('409');
                        const isConflict = is409 || 
                                         uploadError.message && uploadError.message.toLowerCase().includes('conflict');
                        
                        if (isConflict && uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
                            console.warn(`Upload attempt ${uploadAttempts} failed with conflict, retrying...`);
                            // Generate new filename with additional random suffix
                            const retryFilename = `${museumIdForFilename}_${userId}_${timestamp}_retry${uploadAttempts}_${Math.random().toString(36).substring(2, 8)}.png`;
                            const retryFile = new File([blob], retryFilename, { type: blob.type || 'image/png' });
                            file = retryFile;  // Update file for next attempt
                            continue;  // Retry
                        }
                        
                        // Not a conflict error or max retries reached, throw
                        if (is409) {
                            throw new Error('文件名冲突，已尝试多次仍然失败。请稍后重试或联系管理员。');
                        }
                        throw uploadError;
                    }
                }
                
                if (!imageUrl) {
                    throw new Error('上传未返回图片地址');
                }
                
                // Normalize image URL
                const rawImageUrl = (typeof imageUrl === 'object' && imageUrl.url) ? imageUrl.url : imageUrl;
                const safeImageUrl = (typeof rawImageUrl === 'string') ? encodeURI(rawImageUrl) : rawImageUrl;
                
                // Publish poster record to MySQL database
                const title = `${currentPoster.museumName || '打卡'} 海报`;
                let recordId = null;
                
                if (typeof LetmetryAPI !== 'undefined' && LetmetryAPI.insertRecord) {
                    const record = {
                        image_url: safeImageUrl,
                        title: title,
                        user_name: userName,
                        visibility: 'public',
                        museum_id: museumId,
                        age_group: ageGroup
                        // created_at will be set automatically by MySQL DEFAULT CURRENT_TIMESTAMP
                    };
                    
                    try {
                        const result = await LetmetryAPI.insertRecord('achievement_posters', record);
                        recordId = result && result.insertId;
                        
                        console.log('Poster published successfully, record ID:', recordId);
                    } catch (dbError) {
                        // Check if it's a "table doesn't exist" error (case-insensitive)
                        const errorMsg = (dbError.message || dbError.sqlMessage || String(dbError)).toLowerCase();
                        const isTableMissing = errorMsg.includes("doesn't exist") || 
                                             errorMsg.includes("unknown column") ||
                                             (errorMsg.includes("table") && errorMsg.includes("not found"));
                        
                        if (isTableMissing) {
                            console.error('Database table not initialized:', dbError);
                            throw new Error(
                                '数据库表未初始化。\n\n' +
                                '请联系管理员运行以下命令初始化数据库：\n' +
                                'node init-achievement-posters-table.js\n\n' +
                                '您的海报图片已成功上传，但未能保存到数据库记录。'
                            );
                        }
                        
                        // Other database errors
                        console.error('Database insert error:', dbError);
                        throw new Error(`数据库操作失败：${dbError.message || dbError.sqlMessage || dbError}`);
                    }
                }
                
                // Save published poster info to localStorage
                publishedPosters[museumId] = {
                    recordId: recordId,
                    imageUrl: safeImageUrl,
                    title: title,
                    userName: userName,
                    publishedAt: Date.now()
                };
                localStorage.setItem('publishedPosters', JSON.stringify(publishedPosters));
                
                // Update button states
                publishBtn.classList.add('published');
                publishBtn.innerHTML = '<span>✅</span><span>已发布</span>';
                publishBtn.disabled = true;
                
                if (deleteBtn) {
                    deleteBtn.style.display = 'flex';
                }
                
                alert('🎉 已成功发布到大家的成就！感谢分享。\n\n🏆 获得100积分奖励！');
                
                // Trigger poster published event for reward system
                if (typeof EventBus !== 'undefined' && EventBus.getInstance()) {
                    EventBus.getInstance().emit('poster:published', {
                        posterId: recordId,
                        title: title,
                        imageUrl: safeImageUrl,
                        userId: userName,
                        museumId: museumId,
                        timestamp: Date.now()
                    });
                }
                
                if (confirm('是否打开「大家的成就」查看？')) {
                    window.open('everyone-achievements.html', '_blank');
                }
                
                // Analytics tracking
                if (typeof gtag === 'function') {
                    gtag('event', 'achievement_poster_published_checkin', {
                        museum_id: museumId,
                        museum_name: currentPoster.museumName
                    });
                }
                
            } catch (error) {
                console.error('Publish failed:', error);
                alert('发布失败：' + (error.message || error));
                publishBtn.disabled = false;
                publishBtn.innerHTML = originalText;
            }
        }
        
        // Delete published poster
        async function deletePublishedPoster() {
            const deleteBtn = document.getElementById('deletePosterButton');
            const publishBtn = document.getElementById('publishPosterButton');
            
            if (!deleteBtn) return;
            
            // Check if poster is published
            const publishedPosters = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
            const publishedPoster = publishedPosters[museumId];
            
            if (!publishedPoster || !publishedPoster.recordId) {
                alert('未找到已发布的海报记录');
                return;
            }
            
            if (!confirm('确定要删除已发布的海报吗？删除后将从「大家的成就」中移除。')) {
                return;
            }
            
            const originalText = deleteBtn.textContent;
            
            try {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span>⏳</span><span>删除中...</span>';
                
                // Delete from database
                if (typeof LetmetryAPI !== 'undefined' && LetmetryAPI.deleteRecord) {
                    await LetmetryAPI.deleteRecord('achievement_posters', publishedPoster.recordId);
                    console.log('Poster deleted from database, record ID:', publishedPoster.recordId);
                }
                
                // Remove from localStorage
                delete publishedPosters[museumId];
                localStorage.setItem('publishedPosters', JSON.stringify(publishedPosters));
                
                // Update button states
                deleteBtn.style.display = 'none';
                
                if (publishBtn) {
                    publishBtn.classList.remove('published');
                    publishBtn.innerHTML = '<span>📣</span><span>发布到大家的成就</span>';
                    publishBtn.disabled = false;
                }
                
                alert('已成功删除发布的海报');
                
                // Analytics tracking
                if (typeof gtag === 'function') {
                    gtag('event', 'achievement_poster_deleted', {
                        museum_id: museumId
                    });
                }
                
            } catch (error) {
                console.error('Delete failed:', error);
                alert('删除失败：' + (error.message || error));
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalText;
            }
        }
        
        // Check and update button states when celebration modal opens
        function updatePosterButtonStates() {
            const publishBtn = document.getElementById('publishPosterButton');
            const deleteBtn = document.getElementById('deletePosterButton');
            
            if (!publishBtn || !deleteBtn) return;
            
            const publishedPosters = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
            const publishedPoster = publishedPosters[museumId];
            
            if (publishedPoster && publishedPoster.recordId) {
                // Already published - show published state
                publishBtn.classList.add('published');
                publishBtn.innerHTML = '<span>✅</span><span>已发布</span>';
                publishBtn.disabled = true;
                deleteBtn.style.display = 'flex';
            } else {
                // Not published - show publish button
                publishBtn.classList.remove('published');
                publishBtn.innerHTML = '<span>📣</span><span>发布到大家的成就</span>';
                publishBtn.disabled = false;
                deleteBtn.style.display = 'none';
            }
        }

        // Get child nickname
        function getChildNickname() {
            try {
                const v = localStorage.getItem('childNickname');
                if (v && v.trim()) return v.trim();
            } catch (e) {}
            return '小小探险家';
        }

        // Check if all tasks are complete and update poster card
        function checkCompletion() {
            if (childTasks && childTasks.length > 0 && completedTasks && completedTasks.size === childTasks.length) {
                // Auto-mark museum as visited when all tasks are completed
                markMuseumAsVisited();
                
                // Re-render tasks to update poster card to completed state
                renderTasks();
                // Generate poster in background (for quick loading when opened)
                setTimeout(() => {
                    generatePoster();
                }, 500);
                
                // Show pet adoption prompt only after ALL tasks are completed
                // This avoids interrupting the task flow
                setTimeout(() => {
                    if (typeof VirtualPet !== 'undefined') {
                        VirtualPet.showAdoptionPromptIfNeeded('checkin');
                    }
                }, 1500); // Delay to let poster generate first
            }
        }
        
        // Mark the museum as visited in localStorage (syncs with main app)
        function markMuseumAsVisited() {
            try {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                if (!visitedMuseums.includes(museumId)) {
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                    console.log('Museum auto-marked as visited:', museumId);
                    
                    // 主动更新排行榜数据
                    updateLeaderboardAfterCheckin();
                }
            } catch (error) {
                console.error('Error marking museum as visited:', error);
            }
        }

        // 主动更新排行榜数据（打卡后）
        function updateLeaderboardAfterCheckin() {
            try {
                // 打卡后，排行榜数据会在下次访问时自动更新
                // 不需要模态框相关的刷新逻辑
                console.log('[MuseumCheckin] Museum checked in, leaderboard will be updated on next visit');
                
                // 触发排行榜数据更新事件
                const leaderboardUpdateEvent = new CustomEvent('leaderboard:update', {
                    detail: { 
                        type: 'museum_checkin',
                        museumId: museumId,
                        timestamp: Date.now()
                    }
                });
                document.dispatchEvent(leaderboardUpdateEvent);
                
                console.log('[Leaderboard] Update event triggered after check-in');
            } catch (error) {
                console.error('Error updating leaderboard after check-in:', error);
            }
        }

        // Load completed tasks from local storage
        function loadCompletedTasks() {
            // First try to load from main app's structure
            const checklistKey = `${museumId}-child-${ageGroup}`;
            const checklistsData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
            
            if (checklistsData[checklistKey]) {
                // Load from main app's structure
                completedTasks = new Set(checklistsData[checklistKey]);
            } else {
                // Fallback to legacy format for migration
                const legacyKey = `museumCheckin_${museumId}_${ageGroup}`;
                const saved = localStorage.getItem(legacyKey);
                if (saved) {
                    completedTasks = new Set(JSON.parse(saved));
                    // Migrate to new format
                    saveCompletedTasks();
                }
            }
            
            // Also load reported tasks
            loadReportedTasks();
        }

        // Setup event listeners
        function setupEventListeners() {
            // Set up inline nickname editing on new unified header nickname display
            const nicknameDisplay = document.getElementById('nicknameDisplay');
            if (nicknameDisplay) {
                nicknameDisplay.addEventListener('click', (e) => {
                    e.stopPropagation();
                    startInlineNicknameEditOnTitle(nicknameDisplay);
                });
            }
            
            // Set up inline nickname editing on legacy page title click
            const pageTitleElement = document.getElementById('pageTitle');
            if (pageTitleElement) {
                pageTitleElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    startInlineNicknameEditOnTitle(pageTitleElement);
                });
            }
            
            // Close modal buttons
            const closeModalBtn = document.getElementById('closeModal');
            const cancelBtn = document.getElementById('cancelButton');
            const completeBtn = document.getElementById('completeButton');
            const taskPhotoInput = document.getElementById('taskPhotoInput');
            const retakeBtn = document.getElementById('retakeButton');
            const taskModal = document.getElementById('taskModal');
            
            if (closeModalBtn) {
                closeModalBtn.onclick = () => {
                    if (taskModal) taskModal.classList.remove('show');
                };
            }

            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    if (taskModal) taskModal.classList.remove('show');
                };
            }

            if (completeBtn) completeBtn.onclick = completeTask;

            // Photo capture
            if (taskPhotoInput) taskPhotoInput.onchange = handlePhotoCapture;

            if (retakeBtn) retakeBtn.onclick = clearPhotoPreview;

            // Modal treasure contributor search buttons
            const modalSearchWikiBtn = document.getElementById('modalSearchWikiBtn');
            const modalSearchBaiduBtn = document.getElementById('modalSearchBaiduBtn');
            const modalTreasureNameInput = document.getElementById('modalTreasureName');
            const modalTreasureImageInput = document.getElementById('modalTreasureUpload');
            
            if (modalSearchWikiBtn) {
                modalSearchWikiBtn.onclick = () => {
                    const treasureName = modalTreasureNameInput.value.trim();
                    if (!treasureName) {
                        alert('请先输入镇馆之宝名称');
                        modalTreasureNameInput.focus();
                        return;
                    }
                    // Copy name to search input and open wiki search modal
                    const wikiSearchInput = document.getElementById('wikiSearchInput');
                    if (wikiSearchInput) {
                        wikiSearchInput.value = treasureName;
                    }
                    // Set callback for wiki search to update modal image input
                    window.currentImageInputId = 'modalTreasureUpload';
                    window.currentPreviewId = 'modalTreasurePreview';
                    openWikiSearch();
                };
            }
            
            if (modalSearchBaiduBtn) {
                modalSearchBaiduBtn.onclick = () => {
                    const treasureName = modalTreasureNameInput.value.trim();
                    if (!treasureName) {
                        alert('请先输入镇馆之宝名称');
                        modalTreasureNameInput.focus();
                        return;
                    }
                    // Set callback context for baidu search
                    window.currentImageInputId = 'modalTreasureUpload';
                    window.currentPreviewId = 'modalTreasurePreview';
                    // Copy name to search input and perform baidu search
                    const wikiSearchInput = document.getElementById('wikiSearchInput');
                    if (wikiSearchInput) {
                        wikiSearchInput.value = treasureName;
                    }
                    performBaiduSearch();
                };
            }
            
            // Sync treasure name to image search input
            if (modalTreasureNameInput) {
                modalTreasureNameInput.addEventListener('input', () => {
                    modalTreasureImageInput.placeholder = modalTreasureNameInput.value.trim() 
                        ? '点击搜索按钮查找图片' 
                        : '输入名称后点击搜索';
                });
            }
            
            // Update preview when image URL is entered
            if (modalTreasureImageInput) {
                modalTreasureImageInput.addEventListener('input', () => {
                    const url = modalTreasureImageInput.value.trim();
                    const preview = document.getElementById('modalTreasurePreview');
                    if (!preview) return;
                    if (url) {
                        const img = document.createElement('img');
                        img.src = url;
                        img.className = 'image-preview-thumb';
                        img.alt = '预览';
                        img.onerror = function() { if (preview) preview.textContent = '❌'; };
                        preview.innerHTML = '';
                        preview.appendChild(img);
                    } else {
                        preview.textContent = '📷';
                        preview.className = 'image-preview-placeholder';
                    }
                });
            }

            // ===== Museum Entrance Photo Contributor Event Listeners =====
            const museumPhotoSearchWikiBtn = document.getElementById('modalMuseumPhotoSearchWikiBtn');
            const museumPhotoSearchBaiduBtn = document.getElementById('modalMuseumPhotoSearchBaiduBtn');
            const museumPhotoSubmitBtn = document.getElementById('modalMuseumPhotoSubmitBtn');
            
            if (museumPhotoSearchWikiBtn) {
                museumPhotoSearchWikiBtn.onclick = () => handleMuseumPhotoSearch('wiki');
            }
            
            if (museumPhotoSearchBaiduBtn) {
                museumPhotoSearchBaiduBtn.onclick = () => handleMuseumPhotoSearch('baidu');
            }
            
            if (museumPhotoSubmitBtn) {
                museumPhotoSubmitBtn.onclick = handleMuseumPhotoSubmit;
            }
            // ===== End Museum Photo Contributor Event Listeners =====
            
            // ===== Treasure Photo Contributor Event Listeners =====
            const treasurePhotoUploadBtn = document.getElementById('modalTreasurePhotoUpload');
            const treasurePhotoSubmitBtn = document.getElementById('modalTreasurePhotoSubmitBtn');
            
            if (treasurePhotoUploadBtn) {
                treasurePhotoUploadBtn.addEventListener('change', (e) => handleTreasurePhotoUploadChange(e));
            }
            
            if (treasurePhotoSubmitBtn) {
                treasurePhotoSubmitBtn.onclick = handleTreasurePhotoSubmit;
            }
            // ===== End Treasure Photo Contributor Event Listeners =====
            
            // ===== Photo Upload Event Listeners =====
            // Handler for modal treasure photo upload
            const modalTreasureUpload = document.getElementById('modalTreasureUpload');
            if (modalTreasureUpload) {
                modalTreasureUpload.addEventListener('change', (e) => handlePhotoUpload(e, 'modalTreasureUpload', 'modalTreasurePreview'));
            }
            
            // Handler for new treasure photo upload (settings page)
            const newTreasureUpload = document.getElementById('newTreasureUpload');
            if (newTreasureUpload) {
                newTreasureUpload.addEventListener('change', (e) => handlePhotoUpload(e, 'newTreasureImage', 'newTreasurePreview'));
            }
            
            // Handler for museum entrance photo upload
            const modalMuseumPhotoUpload = document.getElementById('modalMuseumPhotoUpload');
            if (modalMuseumPhotoUpload) {
                modalMuseumPhotoUpload.addEventListener('change', (e) => handleMuseumPhotoUploadChange(e));
            }
            // ===== End Photo Upload Event Listeners =====

            // Celebration close button
            const closeCelebrationBtn = document.getElementById('closeCelebration');
            if (closeCelebrationBtn) {
                closeCelebrationBtn.onclick = () => {
                    const celebration = document.getElementById('completionCelebration');
                    if (celebration) celebration.classList.remove('show');
                };
            }

            // Menu button
            const menuButton = document.getElementById('menuButton');
            if (menuButton) {
                menuButton.onclick = () => {
                    const menuModal = document.getElementById('menuModal');
                    if (menuModal) menuModal.classList.add('show');
                };
            }

            const closeMenuBtn = document.getElementById('closeMenu');
            if (closeMenuBtn) {
                closeMenuBtn.onclick = () => {
                    const menuModal = document.getElementById('menuModal');
                    if (menuModal) menuModal.classList.remove('show');
                };
            }

            // Settings button
            const settingsButton = document.getElementById('settingsButton');
            if (settingsButton) {
                settingsButton.onclick = () => {
                    openSettings();
                };
            }

            const closeSettingsBtn = document.getElementById('closeSettings');
            if (closeSettingsBtn) {
                closeSettingsBtn.onclick = () => {
                    const settingsModal = document.getElementById('settingsModal');
                    if (settingsModal) settingsModal.classList.remove('show');
                };
            }

            // Click outside modal to close
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) settingsModal.onclick = (e) => {
                if (e.target.id === 'settingsModal') {
                    document.getElementById('settingsModal').classList.remove('show');
                }
            };

            // Auto-save nickname on blur
            const nicknameInput = document.getElementById('childNicknameInput');
            if (nicknameInput) {
                nicknameInput.addEventListener('blur', () => {
                    const nickname = nicknameInput.value.trim();
                    if (nickname) {
                        saveChildNickname(nickname);
                    }
                });
            }

            // Handle age group change
            const ageGroupSelector = document.getElementById('ageGroupSelector');
            if (ageGroupSelector) {
                ageGroupSelector.addEventListener('change', (e) => {
                    const newAgeGroup = e.target.value;
                    saveAgeGroup(newAgeGroup);
                    // Reload page without age parameter (will use localStorage)
                    const url = new URL(window.location);
                    url.searchParams.delete('age');
                    window.location.href = url.toString();
                });
            }

            // Menu actions - 由 SharedMenu 组件处理
            // 监听 SharedMenu 派发的本馆烟花墙事件
            document.addEventListener('sharedmenu:museumFireworks', () => {
                window.location.href = `fireworks-wall.html?museum=${museumId}`;
            });

            const parentTasksLink = document.getElementById('parentTasksLink');
            if (parentTasksLink) {
                parentTasksLink.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = `index.html?museum=${museumId}&type=parent&age=${ageGroup}`;
                };
            }

            // Settings actions
            const clearCheckinDataBtn = document.getElementById('clearCheckinData');
            if (clearCheckinDataBtn) {
                clearCheckinDataBtn.onclick = () => {
                    clearCheckinData();
                };
            }

            // Puzzle game settings toggle
            const puzzleToggle = document.getElementById('puzzleGameToggle');
            if (puzzleToggle) {
                puzzleToggle.addEventListener('change', (e) => {
                    savePuzzleGameSetting(e.target.checked);
                    updateGameSelectionVisibility(e.target.checked);
                });
            }

            // Individual game toggles
            const gameToggles = document.querySelectorAll('.game-toggle');
            gameToggles.forEach(toggle => {
                toggle.addEventListener('change', handleGameToggleChange);
            });

            // Puzzle game controls
            const exitPuzzleBtn = document.getElementById('exitPuzzle');
            if (exitPuzzleBtn) {
                exitPuzzleBtn.onclick = () => window.closeUnifiedGame();
            }

            const resetPuzzleBtn = document.getElementById('resetPuzzle');
            if (resetPuzzleBtn) {
                if (typeof isDebugMode === 'function' && !isDebugMode()) {
                    resetPuzzleBtn.onclick = () => window.closeUnifiedGame();
                } else {
                    // Check if new game system is available
                    if (typeof GameManager !== 'undefined' && GameManager.getCurrentGame()) {
                        // Let the new system handle the button
                        console.log('Using new game system for reset button');
                    } else {
                        // Fall back to old system
                        resetPuzzleBtn.onclick = resetPuzzle;
                    }
                }
            }

            const toggleRefBtn = document.getElementById('toggleReference');
            if (toggleRefBtn) {
                // Reference image toggling is handled by the unified puzzle game
                // toggleRefBtn.onclick = toggleReferenceImage;
            }

            // Maze game controls
            const exitMazeBtn = document.getElementById('exitMaze');
            if (exitMazeBtn) {
                exitMazeBtn.onclick = () => window.closeUnifiedGame();
            }

            const resetMazeBtn = document.getElementById('resetMaze');
            if (resetMazeBtn) {
                if (typeof isDebugMode === 'function' && !isDebugMode()) {
                    resetMazeBtn.style.display = 'none';
                    resetMazeBtn.onclick = () => window.closeUnifiedGame();
                } else {
                    resetMazeBtn.style.display = '';
                    resetMazeBtn.onclick = resetMaze;
                }
            }

            // Maze direction buttons
            const mazeUpBtn = document.getElementById('mazeUp');
            if (mazeUpBtn) {
                mazeUpBtn.onclick = () => {
                    // Check if new game system is active
                    if (typeof GameManager !== 'undefined' && GameManager.isGameActive() && GameManager.getCurrentGame()?.gameType === 'maze') {
                        // Use new system movement
                        const currentGame = GameManager.getCurrentGame();
                        const currentPos = currentGame.playerPos;
                        const newPos = { x: currentPos.x, y: currentPos.y - 1 };
                        
                        if (currentGame.canMoveTo(newPos.x, newPos.y)) {
                            currentGame.movePlayer(newPos.x, newPos.y);
                        }
                        return;
                    }
                    // Fall back to old system
                    movePlayer(0, -1);
                };
            }

            const mazeDownBtn = document.getElementById('mazeDown');
            if (mazeDownBtn) {
                mazeDownBtn.onclick = () => {
                    // Check if new game system is active
                    if (typeof GameManager !== 'undefined' && GameManager.isGameActive() && GameManager.getCurrentGame()?.gameType === 'maze') {
                        // Use new system movement
                        const currentGame = GameManager.getCurrentGame();
                        const currentPos = currentGame.playerPos;
                        const newPos = { x: currentPos.x, y: currentPos.y + 1 };
                        
                        if (currentGame.canMoveTo(newPos.x, newPos.y)) {
                            currentGame.movePlayer(newPos.x, newPos.y);
                        }
                        return;
                    }
                    // Fall back to old system
                    movePlayer(0, 1);
                };
            }

            const mazeLeftBtn = document.getElementById('mazeLeft');
            if (mazeLeftBtn) {
                mazeLeftBtn.onclick = () => {
                    // Check if new game system is active
                    if (typeof GameManager !== 'undefined' && GameManager.isGameActive() && GameManager.getCurrentGame()?.gameType === 'maze') {
                        // Use new system movement
                        const currentGame = GameManager.getCurrentGame();
                        const currentPos = currentGame.playerPos;
                        const newPos = { x: currentPos.x - 1, y: currentPos.y };
                        
                        if (currentGame.canMoveTo(newPos.x, newPos.y)) {
                            currentGame.movePlayer(newPos.x, newPos.y);
                        }
                        return;
                    }
                    // Fall back to old system
                    movePlayer(-1, 0);
                };
            }

            const mazeRightBtn = document.getElementById('mazeRight');
            if (mazeRightBtn) {
                mazeRightBtn.onclick = () => {
                    // Check if new game system is active
                    if (typeof GameManager !== 'undefined' && GameManager.isGameActive() && GameManager.getCurrentGame()?.gameType === 'maze') {
                        // Use new system movement
                        const currentGame = GameManager.getCurrentGame();
                        const currentPos = currentGame.playerPos;
                        const newPos = { x: currentPos.x + 1, y: currentPos.y };
                        
                        if (currentGame.canMoveTo(newPos.x, newPos.y)) {
                            currentGame.movePlayer(newPos.x, newPos.y);
                        }
                        return;
                    }
                    // Fall back to old system
                    movePlayer(1, 0);
                };
            }

            // Close modals on background click
            window.onclick = (event) => {
                if (event.target.classList.contains('modal')) {
                    event.target.classList.remove('show');
                }
            };
            
            // Setup self-service treasure addition listeners
            setupSelfServiceTreasureListeners();
            
            // Treasure not-found report listeners
            const treasureReportBtn = document.getElementById('treasureReportBtn');
            if (treasureReportBtn) {
                treasureReportBtn.onclick = () => {
                    document.getElementById('treasureReportConfirm').classList.add('show');
                    treasureReportBtn.style.display = 'none';
                };
            }
            
            const treasureReportNo = document.getElementById('treasureReportNo');
            if (treasureReportNo) {
                treasureReportNo.onclick = () => {
                    document.getElementById('treasureReportConfirm').classList.remove('show');
                    document.getElementById('treasureReportBtn').style.display = 'block';
                };
            }
            
            const treasureReportYes = document.getElementById('treasureReportYes');
            if (treasureReportYes) {
                treasureReportYes.onclick = async () => {
                    const reportSection = document.getElementById('treasureReportSection');
                    const treasureName = reportSection.dataset.treasureName;
                    
                    if (!treasureName) return;
                    
                    // Show loading state
                    treasureReportYes.disabled = true;
                    treasureReportYes.textContent = '提交中...';
                    
                    const success = await reportTreasureNotFound(treasureName);
                    
                    // Hide confirm section
                    document.getElementById('treasureReportConfirm').classList.remove('show');
                    
                    if (success) {
                        // Show success status
                        document.getElementById('treasureReportStatus').classList.add('show');
                        document.getElementById('treasureReportBtn').style.display = 'none';
                        
                        // AUTO-COMPLETE: Mark the task as completed via reporting
                        if (currentTaskIndex !== null) {
                            // Mark task as completed
                            completedTasks.add(currentTaskIndex);
                            saveCompletedTasks();
                            
                            // Mark task as completed via reporting
                            reportedTasks.add(currentTaskIndex);
                            saveReportedTasks();
                            
                            // Award XP for helping the community
                            const reportXP = 5; // Community contribution XP
                            if (window.achievementGamification) {
                                window.achievementGamification.addXP(reportXP);
                                window.achievementGamification.showXPGainNotification(reportXP, '感谢报告，帮助他人');
                            }
                            
                            // Close modal
                            document.getElementById('taskModal').classList.remove('show');
                            
                            // Show fireworks celebration
                            celebrateWithFireworks();
                            
                            // Update progress
                            updateProgress();
                        }
                        
                        // Re-render tasks to update visual state
                        renderTasks();
                        
                        // Check if all tasks complete
                        checkCompletion();
                    } else {
                        // Show button again
                        const btn = document.getElementById('treasureReportBtn');
                        btn.style.display = 'block';
                        btn.textContent = '✅ 您已报告过此问题';
                        btn.disabled = true;
                    }
                    
                    // Reset button state
                    treasureReportYes.disabled = false;
                    treasureReportYes.textContent = '确认报告';
                };
            }

            // Image Error Report Event Listeners
            const imageErrorReportBtn = document.getElementById('imageErrorReportBtn');
            if (imageErrorReportBtn) {
                imageErrorReportBtn.onclick = () => {
                    document.getElementById('imageErrorConfirm').classList.add('show');
                    imageErrorReportBtn.style.display = 'none';
                };
            }
            
            const imageErrorNo = document.getElementById('imageErrorNo');
            if (imageErrorNo) {
                imageErrorNo.onclick = () => {
                    document.getElementById('imageErrorConfirm').classList.remove('show');
                    document.getElementById('imageErrorReportBtn').style.display = 'block';
                };
            }
            
            const imageErrorYes = document.getElementById('imageErrorYes');
            if (imageErrorYes) {
                imageErrorYes.onclick = async () => {
                    const errorSection = document.getElementById('imageErrorReportSection');
                    const taskTitle = errorSection.dataset.taskTitle;
                    const imageUrl = errorSection.dataset.imageUrl;
                    
                    if (!taskTitle || !imageUrl) return;
                    
                    // Show loading state
                    imageErrorYes.disabled = true;
                    imageErrorYes.textContent = '提交中...';
                    
                    const success = await reportImageError(taskTitle, imageUrl);
                    
                    // Hide confirm section
                    document.getElementById('imageErrorConfirm').classList.remove('show');
                    
                    if (success) {
                        // Show success status
                        document.getElementById('imageErrorStatus').classList.add('show');
                        document.getElementById('imageErrorReportBtn').style.display = 'none';
                        
                        // Check if threshold reached for replacement upload
                        const errorCount = getImageErrorCount(taskTitle);
                        if (errorCount >= IMAGE_ERROR_THRESHOLD) {
                            // Show replacement upload section
                            document.getElementById('imageReplacementSection').classList.add('show');
                            document.getElementById('imageErrorCount').textContent = errorCount;
                        }
                        
                        // Award XP for helping improve quality
                        const reportXP = 3;
                        if (window.achievementGamification) {
                            window.achievementGamification.addXP(reportXP);
                            window.achievementGamification.showXPGainNotification(reportXP, '感谢反馈图片问题');
                        }
                    } else {
                        // Show button again
                        const btn = document.getElementById('imageErrorReportBtn');
                        btn.style.display = 'block';
                        btn.textContent = '✅ 您已报告过此问题';
                        btn.disabled = true;
                    }
                    
                    // Reset button state
                    imageErrorYes.disabled = false;
                    imageErrorYes.textContent = '确认报告';
                };
            }

            // Image Replacement Upload Event Listeners
            const imageReplacementInput = document.getElementById('imageReplacementInput');
            const imageReplacementPreview = document.getElementById('imageReplacementPreview');
            const imageReplacementSubmit = document.getElementById('imageReplacementSubmit');
            
            if (imageReplacementInput) {
                imageReplacementInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            // Show preview
                            imageReplacementPreview.innerHTML = `<img src="${event.target.result}" alt="替换图片预览">`;
                            imageReplacementPreview.style.display = 'block';
                            imageReplacementSubmit.style.display = 'block';
                            imageReplacementSubmit.disabled = false;
                            imageReplacementSubmit.dataset.imageData = event.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                };
            }
            
            if (imageReplacementSubmit) {
                imageReplacementSubmit.onclick = async () => {
                    const imageData = imageReplacementSubmit.dataset.imageData;
                    const errorSection = document.getElementById('imageErrorReportSection');
                    const taskTitle = errorSection.dataset.taskTitle;
                    
                    if (!imageData || !taskTitle) return;
                    
                    // Show loading state
                    imageReplacementSubmit.disabled = true;
                    imageReplacementSubmit.textContent = '上传中...';
                    
                    const success = await uploadReplacementImage(taskTitle, imageData);
                    
                    if (success) {
                        imageReplacementSubmit.textContent = '✅ 上传成功！';
                        
                        // Award XP for contributing
                        const uploadXP = 10;
                        if (window.achievementGamification) {
                            window.achievementGamification.addXP(uploadXP);
                            window.achievementGamification.showXPGainNotification(uploadXP, '感谢上传正确图片！');
                        }
                        
                        // Hide replacement section after 2 seconds
                        setTimeout(() => {
                            document.getElementById('imageReplacementSection').classList.remove('show');
                        }, 2000);
                    } else {
                        imageReplacementSubmit.textContent = '❌ 上传失败';
                        imageReplacementSubmit.disabled = false;
                    }
                };
            }
        }

        // Add new task (edit mode)
        function addNewTask() {
            const taskText = prompt('请输入新任务内容（格式：🎯 任务名称：任务描述）');
            if (taskText && taskText.trim()) {
                childTasks.push(taskText.trim());
                saveTasksToRemote();
                renderTasks();
                updateProgress();
            }
        }

        // Save tasks to remote storage (edit mode)
        function saveTasksToRemote() {
            const url = REMOTE_STORAGE_CONFIG.API_ENDPOINT;
            const key = `${REMOTE_STORAGE_CONFIG.CHECKIN_KEY_PREFIX}${museumId}_${ageGroup}`;
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: key,
                    sortKey: 'tasks',
                    value: JSON.stringify(childTasks)
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Tasks saved successfully:', data);
            })
            .catch(error => {
                console.error('Error saving tasks:', error);
            });
        }

        // Update page title with child nickname
        function updatePageTitle() {
            const nickname = loadChildNickname();
            const title = `${nickname}的任务`;
            
            // Update new unified header nickname display
            const nicknameDisplay = document.getElementById('nicknameDisplay');
            if (nicknameDisplay) {
                nicknameDisplay.textContent = nickname;
            }
            
            // Update legacy h1 title (kept for compatibility)
            const pageTitleElement = document.getElementById('pageTitle');
            if (pageTitleElement) {
                pageTitleElement.textContent = title;
            }
            
            // Update page title tag
            document.title = `${nickname}的孩子任务 - 博物馆打卡`;
        }

        // Settings management functions
        function loadChildNickname() {
            try {
                const saved = localStorage.getItem('childNickname');
                if (saved) {
                    return saved;
                }
                
                // Generate random nickname for new users and save it immediately
                const newNickname = generateRandomNickname();
                // Save the default nickname so it's available for poster generation
                // This prevents users from being marked as anonymous when using default nickname
                localStorage.setItem('childNickname', newNickname);
                return newNickname;
            } catch (error) {
                console.error('Failed to load child nickname:', error);
                return generateRandomNickname();
            }
        }
        
        function generateRandomNickname() {
            // Generate UUID and take a substring to create unique but shorter nickname
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            // Take last 6 characters of UUID (without hyphens) for shorter display
            const shortId = uuid.replace(/-/g, '').slice(-6);
            return `用户${shortId}`;
        }
        
        function hasSetNickname() {
            try {
                return localStorage.getItem('nicknameHasBeenSet') === 'true';
            } catch (error) {
                return false;
            }
        }
        
        function markNicknameAsSet() {
            try {
                localStorage.setItem('nicknameHasBeenSet', 'true');
            } catch (error) {
                console.error('Failed to mark nickname as set:', error);
            }
        }

        // Show nickname onboarding modal for first-time users
        function showNicknameOnboardingModal() {
            const modal = document.getElementById('nicknameOnboardingModal');
            const input = document.getElementById('onboardingNicknameInput');
            const confirmBtn = document.getElementById('confirmOnboardingNickname');
            const skipBtn = document.getElementById('skipOnboardingNickname');
            
            if (!modal) return;
            
            // Show modal
            modal.style.display = 'flex';
            
            // Focus input after a short delay
            setTimeout(() => {
                if (input) input.focus();
            }, 100);
            
            // Handle confirm button
            const handleConfirm = () => {
                const nickname = input.value.trim();
                if (nickname) {
                    saveChildNickname(nickname);
                }
                closeOnboardingModal();
            };
            
            // Handle skip button
            const handleSkip = () => {
                // Mark as set so we don't show again
                markNicknameAsSet();
                closeOnboardingModal();
            };
            
            // Close modal function
            const closeOnboardingModal = () => {
                modal.style.display = 'none';
                // Clean up event listeners
                confirmBtn.removeEventListener('click', handleConfirm);
                skipBtn.removeEventListener('click', handleSkip);
                input.removeEventListener('keydown', handleKeydown);
            };
            
            // Handle enter key
            const handleKeydown = (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                }
            };
            
            // Add event listeners
            confirmBtn.addEventListener('click', handleConfirm);
            skipBtn.addEventListener('click', handleSkip);
            input.addEventListener('keydown', handleKeydown);
        }

        function saveChildNickname(nickname) {
            try {
                if (!nickname || nickname.trim() === '') {
                    return { success: false, message: '昵称不能为空' };
                }
                
                localStorage.setItem('childNickname', nickname.trim());
                
                // Mark nickname as explicitly set by user
                markNicknameAsSet();
                
                // Update page title after saving nickname
                updatePageTitle();
                
                return { success: true, message: '昵称保存成功！' };
            } catch (error) {
                console.error('Failed to save child nickname:', error);
                return { success: false, message: '保存失败，请重试' };
            }
        }
        
        // Inline nickname editing for the page title
        function startInlineNicknameEditOnTitle(titleElement) {
            // Prevent multiple editing sessions
            if (titleElement.querySelector('input')) {
                return;
            }
            
            // Check if this is the new unified header nickname display (only shows nickname)
            const isNicknameDisplayOnly = titleElement.id === 'nicknameDisplay';
            
            const currentText = titleElement.textContent.trim();
            // Extract nickname - for nicknameDisplay it's just the text, for pageTitle it's "nickname的任务"
            const currentNickname = isNicknameDisplayOnly ? currentText : currentText.replace('的任务', '');
            
            // Create input element
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentNickname;
            input.maxLength = 10;
            input.style.cssText = `
                font-size: inherit;
                font-weight: inherit;
                color: inherit;
                background: rgba(255, 255, 255, 0.9);
                border: 2px solid #2c5aa0;
                border-radius: 8px;
                padding: 8px 16px;
                text-align: center;
                outline: none;
                box-shadow: 0 0 0 3px rgba(44, 90, 160, 0.1);
                width: auto;
                min-width: 200px;
                max-width: 90%;
            `;
            
            // Store original value for cancel
            const originalNickname = currentNickname;
            
            // Replace text with input
            titleElement.textContent = '';
            titleElement.appendChild(input);
            
            // Add hint text below
            const hintElement = document.createElement('div');
            hintElement.style.cssText = `
                font-size: 14px;
                color: #666;
                margin-top: 10px;
                text-align: center;
            `;
            hintElement.textContent = '修改昵称后按回车确认，按Esc取消';
            titleElement.appendChild(hintElement);
            
            // Focus and select text
            input.focus();
            input.select();
            
            // Helper to format display text based on element type
            const formatDisplay = (nickname) => isNicknameDisplayOnly ? nickname : `${nickname}的任务`;
            
            // Handle save on Enter key
            const handleSave = () => {
                const newNickname = input.value.trim();
                
                if (newNickname === '') {
                    // Restore original if empty
                    titleElement.textContent = formatDisplay(originalNickname);
                    return;
                }
                
                if (newNickname !== originalNickname) {
                    // Save nickname
                    const result = saveChildNickname(newNickname);
                    
                    if (result.success) {
                        // Update display
                        titleElement.textContent = formatDisplay(newNickname);
                        
                        // Also update page title
                        updatePageTitle();
                        
                        // Show brief success feedback
                        titleElement.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                        setTimeout(() => {
                            titleElement.style.backgroundColor = '';
                        }, 500);
                    } else {
                        // Show error and restore original
                        alert(result.message);
                        titleElement.textContent = formatDisplay(originalNickname);
                    }
                } else {
                    // No change, just restore display
                    titleElement.textContent = formatDisplay(originalNickname);
                }
            };
            
            // Handle cancel on Escape key
            const handleCancel = () => {
                titleElement.textContent = formatDisplay(originalNickname);
            };
            
            // Event listeners
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                }
            });
            
            // Handle blur (when user clicks outside)
            input.addEventListener('blur', () => {
                setTimeout(handleSave, 100); // Small delay to allow Enter key to process first
            });
        }

        function saveAgeGroup(ageGroup) {
            try {
                localStorage.setItem('ageGroup', ageGroup);
                return { success: true };
            } catch (error) {
                console.error('Failed to save age group:', error);
                return { success: false };
            }
        }

        function clearCheckinData() {
            // Get current museum name for confirmation message
            const museumName = currentMuseum ? currentMuseum.name : '本博物馆';
            
            // Show confirmation dialog
            const confirmMessage = 
                `⚠️ 清空打卡数据 ⚠️\n\n` +
                `您即将清空「${museumName}」的所有打卡数据。\n\n` +
                `清空后：\n` +
                `✓ 可以重新完成所有任务\n` +
                `✓ 所有任务将回到未完成状态\n` +
                `✗ 此操作不可撤销\n\n` +
                `确定要清空吗？`;
            
            if (!confirm(confirmMessage)) {
                return;
            }
            
            try {
                // Clear from main app's structure
                const checklistKey = `${museumId}-child-${ageGroup}`;
                const checklistsData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                delete checklistsData[checklistKey];
                localStorage.setItem('museumChecklists', JSON.stringify(checklistsData));
                
                // Also clear from legacy format for backward compatibility
                const legacyKey = `museumCheckin_${museumId}_${ageGroup}`;
                localStorage.removeItem(legacyKey);
                
                // Clear in-memory state
                completedTasks.clear();
                
                // Re-render UI
                renderTasks();
                updateProgress();
                
                // Close settings modal
                document.getElementById('settingsModal').classList.remove('show');
                
                // Show success message
                alert('✅ 打卡数据已成功清空！\n\n您现在可以重新完成所有任务了。');
                
                console.log('Check-in data cleared successfully for:', museumName);
            } catch (error) {
                console.error('Failed to clear check-in data:', error);
                alert('❌ 清空数据失败，请重试');
            }
        }

        // =====================================================
        // Treasure Check-in Configuration Functions (Parent Mode)
        // 镇馆之宝打卡配置功能 - Settings Modal UI Functions
        // Note: Core functions (MIN_TREASURES_REQUIRED, getSelectedTreasuresForMuseum, 
        // loadTreasureCheckinConfig) are defined earlier in the file for use in loadMuseumData
        // =====================================================

        /**
         * Show treasure selection checkboxes for the current museum
         * Default: first 3 treasures are selected
         */
        function showTreasureSelectionForCurrentMuseum() {
            const checkboxList = document.getElementById('v2TreasureCheckboxList');
            if (!checkboxList || !currentMuseum) return;

            // Merge museum collections with user-added treasures
            const userTreasures = loadUserAddedTreasures(museumId);
            const allCollections = [...(currentMuseum.collections || [])];
            
            // Add user treasures if not already in collections
            userTreasures.forEach(ut => {
                const exists = allCollections.some(c => c.name === ut.name);
                if (!exists) {
                    allCollections.push({
                        ...ut,
                        isUserAdded: true
                    });
                }
            });

            if (!allCollections || !Array.isArray(allCollections) || allCollections.length === 0) {
                checkboxList.innerHTML = '<div class="empty-config-hint">该博物馆暂无镇馆之宝信息</div>';
                updateSelectedTreasureCountV2();
                return;
            }

            // Load current selection for this museum, or use default first 3
            const currentConfig = loadTreasureCheckinConfig();
            let selectedTreasures = currentConfig[museumId];
            
            // Default: select first 3 available treasures if no config exists
            // Exclude treasures with 5+ reports from default selection
            if (!selectedTreasures || !Array.isArray(selectedTreasures) || selectedTreasures.length === 0) {
                const availableTreasures = allCollections.filter(t => {
                    const reportCount = getTreasureReportCount(t.name);
                    return reportCount < TREASURE_UNAVAILABLE_THRESHOLD;
                });
                selectedTreasures = availableTreasures.slice(0, Math.min(3, availableTreasures.length)).map(t => t.name);
                // Save the default selection
                saveTreasureSelectionSilently(selectedTreasures);
            }

            // Build checkbox list
            let html = '';
            allCollections.forEach((treasure, index) => {
                const isSelected = selectedTreasures.includes(treasure.name);
                const imageHtml = treasure.imageUrl 
                    ? `<img src="${treasure.imageUrl}" alt="${treasure.name}" class="treasure-item-image" loading="lazy" onerror="this.style.display='none'">`
                    : '';
                const userBadge = treasure.isUserAdded ? '<span style="color:#0369a1;font-size:11px;margin-left:4px;">👤</span>' : '';
                
                // Get report count for this treasure
                const reportCount = getTreasureReportCount(treasure.name);
                const isUnavailable = reportCount >= TREASURE_UNAVAILABLE_THRESHOLD;
                const isWarning = reportCount >= TREASURE_WARNING_THRESHOLD && reportCount < TREASURE_UNAVAILABLE_THRESHOLD;
                
                // Build CSS classes
                let itemClasses = 'treasure-checkbox-item';
                if (isSelected) itemClasses += ' selected';
                if (isUnavailable) itemClasses += ' treasure-unavailable';
                else if (isWarning) itemClasses += ' treasure-warning';
                
                // Build report count badge
                let reportBadgeHtml = '';
                if (isUnavailable) {
                    reportBadgeHtml = `<span class="treasure-report-count-badge unavailable">${reportCount}人报告不存在</span>`;
                } else if (isWarning) {
                    reportBadgeHtml = `<span class="treasure-report-count-badge warning">${reportCount}人报告不存在</span>`;
                }
                
                html += `
                    <label class="${itemClasses}" data-index="${index}">
                        <input type="checkbox" 
                               value="${treasure.name}" 
                               ${isSelected ? 'checked' : ''}
                               data-museum="${museumId}">
                        <div class="treasure-item-info">
                            <div class="treasure-item-name">🏺 ${treasure.name}${userBadge}${reportBadgeHtml}</div>
                            <div class="treasure-item-description">${treasure.description || '镇馆之宝'}</div>
                        </div>
                        ${imageHtml}
                    </label>
                `;
            });

            checkboxList.innerHTML = html;

            // Add click handlers for immediate save with validation
            checkboxList.querySelectorAll('.treasure-checkbox-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                    // Validate and save immediately
                    handleTreasureSelectionChange();
                });
            });

            updateSelectedTreasureCountV2();
        }

        /**
         * Handle treasure selection change - validate and save immediately
         */
        function handleTreasureSelectionChange() {
            const checkboxList = document.getElementById('v2TreasureCheckboxList');
            if (!checkboxList || !museumId) return;

            // Get currently selected treasures
            const selectedTreasures = [];
            checkboxList.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                selectedTreasures.push(checkbox.value);
            });

            const count = selectedTreasures.length;
            const isValid = count >= MIN_TREASURES_REQUIRED;

            // Update count display
            updateSelectedTreasureCountV2();

            // Show/hide error message
            const errorEl = document.getElementById('v2TreasureSelectionError');
            const countContainer = document.getElementById('v2TreasureSelectionCount');
            
            if (errorEl) {
                if (isValid) {
                    errorEl.classList.remove('show');
                } else {
                    errorEl.classList.add('show');
                }
            }
            
            if (countContainer) {
                if (isValid) {
                    countContainer.classList.remove('error');
                } else {
                    countContainer.classList.add('error');
                }
            }

            // Only save if valid (at least 3 selected)
            if (isValid) {
                saveTreasureSelectionSilently(selectedTreasures);
                // Refresh the task list to reflect the change
                refreshTasksWithSelectedTreasures();
            }
        }

        /**
         * Save treasure selection silently (no notification)
         */
        function saveTreasureSelectionSilently(selectedTreasures) {
            try {
                const config = loadTreasureCheckinConfig();
                
                if (selectedTreasures.length > 0) {
                    config[museumId] = selectedTreasures;
                } else {
                    delete config[museumId];
                }

                localStorage.setItem('treasureCheckinConfig', JSON.stringify(config));
            } catch (error) {
                console.error('Failed to save treasure selection:', error);
            }
        }

        /**
         * Refresh the task list based on selected treasures
         */
        function refreshTasksWithSelectedTreasures() {
            // Re-load and render tasks with the new treasure selection
            const userTreasures = loadUserAddedTreasures(museumId);
            const baseCollections = currentMuseum ? (currentMuseum.collections || []) : [];
            
            // Merge base collections with user-added treasures
            const allCollections = [...baseCollections];
            userTreasures.forEach(ut => {
                const exists = allCollections.some(c => c.name === ut.name);
                if (!exists) {
                    allCollections.push({
                        ...ut,
                        isUserAdded: true
                    });
                }
            });
            
            if (allCollections.length > 0) {
                const selectedTreasures = getSelectedTreasuresForMuseum();
                
                // Filter collections to only selected ones
                const selectedCollections = allCollections.filter(c => selectedTreasures.includes(c.name));
                
                // Build new task list
                const start = '📸 门口打卡：家长给孩子在博物馆门口拍一张照片';
                const collTasks = selectedCollections.map(c => `🏺 镇馆之宝：找到「${c && c.name ? c.name : '镇馆之宝'}」并合影`);
                const end = '📸 亲子合影：和家长比心/拥抱/击掌等动作合影';
                childTasks = [start].concat(collTasks, [end]);
                
                // Re-render tasks
                renderTasks();
                updateProgress();
            }
        }

        /**
         * Build treasure workflow task list based on available collections
         * @param {Array} collections - Array of treasure/collection objects
         * @returns {Array} Array of task strings
         */
        function buildTreasureWorkflowTasks(collections) {
            const totalTreasuresNeeded = 3;
            const start = '📸 门口打卡：家长给孩子在博物馆门口拍一张照片';
            const end = '📸 亲子合影：和家长比心/拥抱/击掌等动作合影';
            
            if (collections.length >= totalTreasuresNeeded) {
                // All 3 treasures available - standard treasure hunt
                const colls = collections.slice(0, totalTreasuresNeeded);
                const treasureTasks = colls.map(c => `🏺 镇馆之宝：找到「${c && c.name ? c.name : '镇馆之宝'}」并合影`);
                return [start].concat(treasureTasks, [end]);
            } else {
                // Mix of treasure hunt and "add treasure" tasks
                const existingTreasureCount = collections.length;
                const addTreasuresNeeded = totalTreasuresNeeded - existingTreasureCount;
                
                // Create treasure hunt tasks for existing treasures
                const treasureTasks = collections.slice(0, existingTreasureCount).map(c => 
                    `🏺 镇馆之宝：找到「${c && c.name ? c.name : '镇馆之宝'}」并合影`
                );
                
                // Create "add treasure" tasks for remaining slots
                const addTreasureTasks = Array.from({length: addTreasuresNeeded}, (_, i) => 
                    `✨ 添加镇馆之宝 ${existingTreasureCount + i + 1}/${totalTreasuresNeeded}：找到你最喜欢的展品，拍照并记录名称`
                );
                
                return [start].concat(treasureTasks, addTreasureTasks, [end]);
            }
        }

        /**
         * Regenerate task list after adding a new treasure
         * Creates a mix of treasure hunt tasks and "add treasure" tasks based on available treasures
         */
        function regenerateTasksWithNewTreasures() {
            if (!currentMuseum) return;
            
            const collections = currentMuseum.collections || [];
            childTasks = buildTreasureWorkflowTasks(collections);
            
            renderTasks();
            updateProgress();
        }

        /**
         * Update the selected treasure count display
         */
        function updateSelectedTreasureCountV2() {
            const countDisplay = document.getElementById('v2SelectedTreasureCount');
            const checkboxList = document.getElementById('v2TreasureCheckboxList');
            
            if (countDisplay && checkboxList) {
                const checkedCount = checkboxList.querySelectorAll('input[type="checkbox"]:checked').length;
                countDisplay.textContent = checkedCount;
            }
        }

        /**
         * Alias for backward compatibility
         * @returns {Object} Configuration object with museum ID as keys
         */
        function loadTreasureCheckinConfigV2() {
            return loadTreasureCheckinConfig();
        }

        /**
         * Save treasure check-in configuration to localStorage (legacy function, kept for compatibility)
         */
        function saveTreasureCheckinConfigV2() {
            // Now handled by handleTreasureSelectionChange
            handleTreasureSelectionChange();
        }

        /**
         * Show notification message
         */
        function showNotification(message, duration = 2000) {
            // Try to use the existing notification system or create a simple one
            if (typeof alert === 'function') {
                // Create a toast-like notification
                const existingToast = document.getElementById('v2Toast');
                if (existingToast) {
                    existingToast.remove();
                }
                
                const toast = document.createElement('div');
                toast.id = 'v2Toast';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                `;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }
        }

        // =====================================================
        // Self-service Treasure Addition Functions
        // 用户自助添加镇馆之宝功能
        // =====================================================

        // Default image for user-added treasures
        const DEFAULT_TREASURE_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/COLLECTIE_TROPENMUSEUM_Wajangpop_voorstellende_Batara_Kresna_TMnr_H-683.jpg/220px-COLLECTIE_TROPENMUSEUM_Wajangpop_voorstellende_Batara_Kresna_TMnr_H-683.jpg';

        /**
         * Load user-added treasures for a specific museum
         * @param {string} museumId - Museum identifier
         * @returns {Array} Array of user-added treasure objects
         */
        function loadUserAddedTreasures(musId) {
            try {
                const key = `userAddedTreasures_${musId || museumId}`;
                const saved = localStorage.getItem(key);
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                console.error('Failed to load user-added treasures:', error);
                return [];
            }
        }

        /**
         * Save user-added treasures for a specific museum
         * @param {Array} treasures - Array of treasure objects
         */
        function saveUserAddedTreasures(treasures) {
            try {
                const key = `userAddedTreasures_${museumId}`;
                localStorage.setItem(key, JSON.stringify(treasures));
                return true;
            } catch (error) {
                console.error('Failed to save user-added treasures:', error);
                return false;
            }
        }

        /**
         * Check if a treasure name already exists (deduplication)
         * @param {string} name - Treasure name to check
         * @returns {boolean} True if name exists
         */
        function treasureNameExists(name) {
            if (!name) return false;
            const normalizedName = name.trim().toLowerCase();
            
            // Check existing museum collections
            if (currentMuseum && currentMuseum.collections && Array.isArray(currentMuseum.collections)) {
                const existsInMuseum = currentMuseum.collections.some(t => 
                    t.name && t.name.trim().toLowerCase() === normalizedName
                );
                if (existsInMuseum) return true;
            }
            
            // Check user-added treasures
            const userTreasures = loadUserAddedTreasures(museumId);
            const existsInUserAdded = userTreasures.some(t => 
                t.name && t.name.trim().toLowerCase() === normalizedName
            );
            
            return existsInUserAdded;
        }

        /**
         * Validate treasure name and show error if duplicate
         * @param {string} name - Treasure name to validate
         * @returns {boolean} True if valid
         */
        function validateTreasureName(name) {
            const nameInput = document.getElementById('newTreasureName');
            const errorEl = document.getElementById('treasureNameError');
            const addBtn = document.getElementById('addTreasureBtn');
            
            if (!name || !name.trim()) {
                nameInput.classList.remove('error');
                errorEl.classList.remove('show');
                addBtn.disabled = true;
                return false;
            }
            
            if (treasureNameExists(name)) {
                nameInput.classList.add('error');
                errorEl.classList.add('show');
                addBtn.disabled = true;
                return false;
            }
            
            nameInput.classList.remove('error');
            errorEl.classList.remove('show');
            addBtn.disabled = false;
            return true;
        }

        /**
         * Add a new user treasure
         */
        async function addUserTreasure() {
            const nameInput = document.getElementById('newTreasureName');
            const imageInput = document.getElementById('newTreasureImage');
            const successEl = document.getElementById('addTreasureSuccess');
            
            const name = nameInput.value.trim();
            const imageUrl = imageInput.value.trim() || DEFAULT_TREASURE_IMAGE;
            
            if (!name) {
                showNotification('请输入镇馆之宝名称');
                return;
            }
            
            if (treasureNameExists(name)) {
                showNotification('该名称已存在，请使用不同的名称');
                return;
            }
            
            // Create treasure object
            const newTreasure = {
                name: name,
                imageUrl: imageUrl,
                description: '用户添加的镇馆之宝',
                isUserAdded: true,
                addedAt: Date.now()
            };
            
            // Add to user treasures list
            const userTreasures = loadUserAddedTreasures(museumId);
            userTreasures.push(newTreasure);
            
            // Save locally
            saveUserAddedTreasures(userTreasures);
            
            // Also add to current museum's collections for immediate use
            if (currentMuseum) {
                if (!currentMuseum.collections) {
                    currentMuseum.collections = [];
                }
                currentMuseum.collections.push(newTreasure);
            }
            
            // Save to remote KV store (Tier 2)
            await saveMuseumWithUserTreasuresToRemote();
            
            // Auto-select the new treasure
            autoSelectNewTreasure(name);
            
            // Clear form
            nameInput.value = '';
            imageInput.value = '';
            document.getElementById('newTreasurePreview').innerHTML = '📷';
            document.getElementById('addTreasureBtn').disabled = true;
            
            // Show success message
            successEl.classList.add('show');
            setTimeout(() => successEl.classList.remove('show'), 3000);
            
            // Refresh treasure displays
            showTreasureSelectionForCurrentMuseum();
            renderUserAddedTreasures();
            
            // Refresh tasks
            refreshTasksWithSelectedTreasures();
            
            console.log('Added user treasure:', name);
        }

        /**
         * Auto-select a newly added treasure
         */
        function autoSelectNewTreasure(treasureName) {
            const config = loadTreasureCheckinConfig();
            let selectedTreasures = config[museumId] || [];
            
            // Add the new treasure to selection
            if (!selectedTreasures.includes(treasureName)) {
                selectedTreasures.push(treasureName);
                config[museumId] = selectedTreasures;
                localStorage.setItem('treasureCheckinConfig', JSON.stringify(config));
            }
        }

        /**
         * Save museum data with user treasures to remote KV store
         */
        async function saveMuseumWithUserTreasuresToRemote() {
            if (!window.museumDataLoader || !currentMuseum) {
                console.warn('Cannot save to remote: museumDataLoader or currentMuseum not available');
                return false;
            }
            
            try {
                // Prepare museum data with user-added treasures
                const museumData = { ...currentMuseum };
                
                // Mark user-added treasures
                if (museumData.collections) {
                    museumData.collections = museumData.collections.map(t => ({
                        ...t,
                        isUserAdded: t.isUserAdded || false
                    }));
                }
                
                // Save to KV store
                const success = await window.museumDataLoader.saveToKVStore(museumId, museumData);
                
                if (success) {
                    console.log('Saved museum with user treasures to remote storage');
                }
                
                return success;
            } catch (error) {
                console.error('Failed to save museum with user treasures:', error);
                return false;
            }
        }

        /**
         * Remove a user-added treasure
         */
        async function removeUserTreasure(treasureName) {
            if (!confirm(`确定要删除「${treasureName}」吗？`)) {
                return;
            }
            
            // Remove from user treasures
            let userTreasures = loadUserAddedTreasures(museumId);
            userTreasures = userTreasures.filter(t => t.name !== treasureName);
            saveUserAddedTreasures(userTreasures);
            
            // Remove from current museum collections
            if (currentMuseum && currentMuseum.collections) {
                currentMuseum.collections = currentMuseum.collections.filter(t => t.name !== treasureName);
            }
            
            // Remove from selection
            const config = loadTreasureCheckinConfig();
            if (config[museumId]) {
                config[museumId] = config[museumId].filter(name => name !== treasureName);
                localStorage.setItem('treasureCheckinConfig', JSON.stringify(config));
            }
            
            // Save to remote
            await saveMuseumWithUserTreasuresToRemote();
            
            // Refresh displays
            showTreasureSelectionForCurrentMuseum();
            renderUserAddedTreasures();
            refreshTasksWithSelectedTreasures();
            
            showNotification('镇馆之宝已删除');
        }

        /**
         * Render user-added treasures list
         */
        function renderUserAddedTreasures() {
            const listEl = document.getElementById('userAddedTreasuresList');
            if (!listEl) return;
            
            const userTreasures = loadUserAddedTreasures(museumId);
            
            if (userTreasures.length === 0) {
                listEl.innerHTML = '';
                return;
            }
            
            let html = '<div style="margin-top: 12px; font-size: 13px; color: #0369a1; font-weight: 600;">我添加的镇馆之宝：</div>';
            
            userTreasures.forEach(treasure => {
                const imgSrc = treasure.imageUrl || DEFAULT_TREASURE_IMAGE;
                html += `
                    <div class="user-added-treasure-item">
                        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(treasure.name)}" class="treasure-thumb" onerror="this.src='${DEFAULT_TREASURE_IMAGE}'">
                        <div class="treasure-info">
                            <div class="treasure-name">${escapeHtml(treasure.name)}</div>
                            <div class="treasure-badge">👤 我添加的</div>
                        </div>
                        <button class="remove-treasure-btn" onclick="removeUserTreasure('${escapeHtml(treasure.name)}')" title="删除">×</button>
                    </div>
                `;
            });
            
            listEl.innerHTML = html;
        }

        /**
         * Update image preview for new treasure
         */
        function updateNewTreasurePreview(imageUrl) {
            const previewEl = document.getElementById('newTreasurePreview');
            if (!previewEl) return;
            
            if (!imageUrl || !imageUrl.trim()) {
                previewEl.innerHTML = '📷';
                previewEl.className = 'image-preview-placeholder';
                return;
            }
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'image-preview-thumb';
            img.onerror = function() {
                previewEl.innerHTML = '❌';
                previewEl.className = 'image-preview-placeholder';
            };
            img.onload = function() {
                previewEl.innerHTML = '';
                previewEl.className = '';
                previewEl.appendChild(img);
            };
        }

        /**
         * Open Wiki image search modal
         */
        function openWikiSearch() {
            const modal = document.getElementById('wikiSearchModal');
            const searchInput = document.getElementById('wikiSearchInput');
            const resultsEl = document.getElementById('wikiSearchResults');
            
            // Pre-fill with treasure name if available
            const treasureName = document.getElementById('newTreasureName').value.trim();
            if (treasureName) {
                searchInput.value = treasureName;
            }
            
            // Clear previous results
            resultsEl.innerHTML = '<div class="wiki-search-empty">输入关键词开始搜索</div>';
            
            // Show modal
            modal.classList.add('show');
            
            // Focus search input
            setTimeout(() => searchInput.focus(), 100);
        }

        /**
         * Close Wiki image search modal
         */
        function closeWikiSearch() {
            document.getElementById('wikiSearchModal').classList.remove('show');
        }

        /**
         * Perform Wiki image search
         */
        async function performWikiSearch() {
            const searchInput = document.getElementById('wikiSearchInput');
            const resultsEl = document.getElementById('wikiSearchResults');
            const query = searchInput.value.trim();
            
            if (!query) {
                resultsEl.innerHTML = '<div class="wiki-search-empty">请输入搜索关键词</div>';
                return;
            }
            
            // Show loading
            resultsEl.innerHTML = '<div class="wiki-search-loading">正在搜索...</div>';
            
            try {
                // Use WikimediaImageSearch if available
                let results = [];
                
                if (typeof WikimediaImageSearch !== 'undefined') {
                    const searcher = new WikimediaImageSearch();
                    results = await searcher.searchTreasurePhotos(currentMuseum?.name || '', query);
                } else {
                    // Fallback: Direct API call
                    const params = new URLSearchParams({
                        action: 'query',
                        format: 'json',
                        generator: 'search',
                        gsrnamespace: '6',
                        gsrsearch: query,
                        gsrlimit: '12',
                        prop: 'imageinfo',
                        iiprop: 'url|size',
                        iiurlwidth: '200',
                        origin: '*'
                    });
                    
                    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
                    const data = await response.json();
                    
                    if (data.query && data.query.pages) {
                        results = Object.values(data.query.pages)
                            .filter(page => page.imageinfo && page.imageinfo.length > 0)
                            .map(page => ({
                                url: page.imageinfo[0].url,
                                thumbnailUrl: page.imageinfo[0].thumburl || page.imageinfo[0].url,
                                name: page.title.replace('File:', '')
                            }));
                    }
                }
                
                if (results.length === 0) {
                    resultsEl.innerHTML = `
                        <div class="wiki-search-empty">
                            <div>Wiki未找到相关图片</div>
                            <div style="margin-top: 8px; font-size: 13px; color: #666;">
                                Wiki的中国文物图片较少，推荐使用百度搜索
                            </div>
                            <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                                <button class="baidu-search-inline-btn" onclick="performBaiduSearch()">
                                    🔍 搜索百度图片
                                </button>
                                <button class="baidu-search-inline-btn secondary" onclick="openBaiduImagePage()">
                                    ↗️ 去百度搜索
                                </button>
                            </div>
                        </div>
                    `;
                    return;
                }
                
                // Render results
                let html = '';
                results.forEach((img, idx) => {
                    html += `
                        <div class="wiki-search-result-item" data-url="${escapeHtml(img.url)}" onclick="selectWikiImage('${escapeHtml(img.url)}')">
                            <img src="${escapeHtml(img.thumbnailUrl || img.url)}" alt="${escapeHtml(img.name)}" loading="lazy" onerror="this.style.display='none'">
                            <div class="result-name">${escapeHtml(img.name)}</div>
                        </div>
                    `;
                });
                
                resultsEl.innerHTML = html;
                
            } catch (error) {
                console.error('Wiki search failed:', error);
                resultsEl.innerHTML = '<div class="wiki-search-empty">搜索失败，请重试。您可以尝试使用百度搜索。</div>';
            }
        }

        /**
         * Select an image from wiki search results
         * Note: Uses window.currentImageInputId and window.currentPreviewId for target element IDs
         * This allows the same selectWikiImage function to work with both the settings modal
         * and the task modal treasure contributor section.
         */
        function selectWikiImage(imageUrl) {
            // Use configurable input ID (for task modal or settings modal)
            const inputId = window.currentImageInputId || 'newTreasureImage';
            const previewId = window.currentPreviewId || 'newTreasurePreview';
            
            try {
                // Update input field
                const imageInput = document.getElementById(inputId);
                if (imageInput) {
                    imageInput.value = imageUrl;
                }
                
                // Update preview using DOM methods to prevent XSS
                const preview = document.getElementById(previewId);
                if (preview) {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.className = 'image-preview-thumb';
                    img.alt = '预览';
                    preview.textContent = '';
                    preview.appendChild(img);
                    // Store image URL for museum photo submission
                    preview.dataset.imageUrl = imageUrl;
                    
                    // Show museum photo submit button if this is museum photo preview
                    if (previewId === 'modalMuseumPhotoPreview') {
                        const submitBtn = document.getElementById('modalMuseumPhotoSubmitBtn');
                        if (submitBtn) submitBtn.style.display = 'block';
                    }
                }
                // Also update settings modal preview if we're using that one
                if (inputId === 'newTreasureImage') {
                    updateNewTreasurePreview(imageUrl);
                }
                
                // Highlight selected item
                document.querySelectorAll('.wiki-search-result-item').forEach(item => {
                    item.classList.remove('selected');
                    if (item.dataset.url === imageUrl) {
                        item.classList.add('selected');
                    }
                });
                
                // Close modal after short delay
                setTimeout(() => closeWikiSearch(), 300);
            } finally {
                // Always clear the configurable IDs after use
                window.currentImageInputId = null;
                window.currentPreviewId = null;
            }
        }

        // ===== Baidu Image Search Functions =====
        
        /**
         * Perform Baidu inline image search
         * Uses the BaiduImageSearch library to fetch images directly
         */
        async function performBaiduSearch() {
            const treasureNameInput = document.getElementById('newTreasureName');
            const resultsEl = document.getElementById('wikiSearchResults');
            const searchInput = document.getElementById('wikiSearchInput');
            
            // Get search query from treasure name input first, then from search modal input
            const treasureName = treasureNameInput ? treasureNameInput.value.trim() : '';
            const modalSearchQuery = searchInput ? searchInput.value.trim() : '';
            const searchQuery = modalSearchQuery || treasureName;
            
            if (!searchQuery) {
                alert('请先输入镇馆之宝名称');
                return;
            }
            
            // Open the wiki modal for results display
            const modal = document.getElementById('wikiSearchModal');
            modal.classList.add('show');
            
            // Set search input value to the treasure name if it's empty
            if (searchInput && !modalSearchQuery) {
                searchInput.value = treasureName;
            }
            
            // Update modal title for Baidu search
            const modalTitle = modal.querySelector('.wiki-search-title');
            if (modalTitle) {
                modalTitle.textContent = '🔍 百度图片搜索';
            }
            
            // Show loading
            resultsEl.innerHTML = `
                <div class="wiki-search-loading">正在从百度搜索图片...</div>
                <div style="text-align: center; margin-top: 8px; color: #666; font-size: 13px;">
                    如果加载较慢，可点击"去百度搜索"手动查找
                </div>
            `;
            
            try {
                // Use BaiduImageSearch library
                if (typeof BaiduImageSearch === 'undefined') {
                    throw new Error('百度图片搜索库未加载');
                }
                
                const baiduSearcher = new BaiduImageSearch();
                const museumNameForSearch = (currentMuseum && currentMuseum.name) || '';
                const results = await baiduSearcher.searchTreasurePhotos(museumNameForSearch, searchQuery);
                
                if (!results || results.length === 0) {
                    resultsEl.innerHTML = `
                        <div class="wiki-search-empty">
                            <div>百度未找到相关图片</div>
                            <div style="margin-top: 8px; font-size: 13px; color: #666;">
                                尝试使用不同的关键词，或点击下方按钮手动搜索
                            </div>
                            <button class="baidu-search-inline-btn" style="margin-top: 12px;" onclick="openBaiduImagePage()">
                                ↗️ 去百度搜索
                            </button>
                        </div>
                    `;
                    return;
                }
                
                // Display copyright warning and results
                let html = `
                    <div style="margin-bottom: 12px; padding: 8px 12px; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px; font-size: 12px;">
                        ⚠️ <strong>百度图片搜索结果</strong> - 点击图片即可使用
                    </div>
                `;
                
                results.forEach(img => {
                    html += `
                        <div class="wiki-search-result-item" data-url="${escapeHtml(img.url)}" onclick="selectWikiImage('${escapeHtml(img.url)}')">
                            <img src="${escapeHtml(img.thumbnailUrl || img.url)}" alt="${escapeHtml(img.name)}" loading="lazy" onerror="this.style.display='none'">
                            <div class="result-name">${escapeHtml(img.name || '百度图片')}</div>
                        </div>
                    `;
                });
                
                resultsEl.innerHTML = html;
                
            } catch (error) {
                console.error('Baidu search failed:', error);
                resultsEl.innerHTML = `
                    <div class="wiki-search-empty">
                        <div>百度搜索失败</div>
                        <div style="margin-top: 8px; font-size: 13px; color: #666;">
                            ${escapeHtml(error.message)}
                        </div>
                        <button class="baidu-search-inline-btn" style="margin-top: 12px;" onclick="openBaiduImagePage()">
                            ↗️ 去百度搜索
                        </button>
                    </div>
                `;
            }
        }
        
        /**
         * Open Baidu Image search in a new tab
         * Allows user to manually search and copy image URLs
         */
        function openBaiduImagePage() {
            const treasureNameInput = document.getElementById('newTreasureName');
            const searchInput = document.getElementById('wikiSearchInput');
            
            // Get search query from treasure name input first, then from search modal input
            const treasureName = treasureNameInput ? treasureNameInput.value.trim() : '';
            const modalSearchQuery = searchInput ? searchInput.value.trim() : '';
            const searchQuery = modalSearchQuery || treasureName;
            
            if (!searchQuery) {
                alert('请先输入镇馆之宝名称');
                return;
            }
            
            // Build optimized search query
            const museumName = (currentMuseum && currentMuseum.name) || '';
            const optimizedQuery = museumName 
                ? `${searchQuery} ${museumName} 文物 高清`
                : `${searchQuery} 文物 高清`;
            
            // Generate Baidu image search URL
            const encodedQuery = encodeURIComponent(optimizedQuery);
            const baiduUrl = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodedQuery}`;
            
            // Open in new tab
            window.open(baiduUrl, '_blank');
        }

        /**
         * Setup self-service treasure addition event listeners
         */
        function setupSelfServiceTreasureListeners() {
            // Name input validation
            const nameInput = document.getElementById('newTreasureName');
            if (nameInput) {
                nameInput.addEventListener('input', function() {
                    validateTreasureName(this.value);
                });
            }
            
            // Image URL preview
            const imageInput = document.getElementById('newTreasureImage');
            if (imageInput) {
                imageInput.addEventListener('input', function() {
                    updateNewTreasurePreview(this.value);
                });
            }
            
            // Add button
            const addBtn = document.getElementById('addTreasureBtn');
            if (addBtn) {
                addBtn.addEventListener('click', addUserTreasure);
            }
            
            // Wiki search button
            const searchWikiBtn = document.getElementById('searchWikiBtn');
            if (searchWikiBtn) {
                searchWikiBtn.addEventListener('click', openWikiSearch);
            }
            
            // Baidu search button - performs inline search
            const searchBaiduBtn = document.getElementById('searchBaiduBtn');
            if (searchBaiduBtn) {
                searchBaiduBtn.addEventListener('click', performBaiduSearch);
            }
            
            // Open Baidu button - opens Baidu in new tab
            const openBaiduBtn = document.getElementById('openBaiduBtn');
            if (openBaiduBtn) {
                openBaiduBtn.addEventListener('click', openBaiduImagePage);
            }
            
            // Wiki search modal
            const closeWikiSearchBtn = document.getElementById('closeWikiSearch');
            if (closeWikiSearchBtn) {
                closeWikiSearchBtn.addEventListener('click', closeWikiSearch);
            }
            
            const wikiSearchBtn = document.getElementById('wikiSearchBtn');
            if (wikiSearchBtn) {
                wikiSearchBtn.addEventListener('click', performWikiSearch);
            }
            
            // Baidu search button inside modal
            const baiduSearchBtn = document.getElementById('baiduSearchBtn');
            if (baiduSearchBtn) {
                baiduSearchBtn.addEventListener('click', performBaiduSearch);
            }
            
            // Open Baidu button inside modal
            const openBaiduInModalBtn = document.getElementById('openBaiduInModalBtn');
            if (openBaiduInModalBtn) {
                openBaiduInModalBtn.addEventListener('click', openBaiduImagePage);
            }
            
            const wikiSearchInput = document.getElementById('wikiSearchInput');
            if (wikiSearchInput) {
                wikiSearchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        performWikiSearch();
                    }
                });
            }
            
            // Close modal on outside click
            const wikiModal = document.getElementById('wikiSearchModal');
            if (wikiModal) {
                wikiModal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        closeWikiSearch();
                    }
                });
            }
            
        }

        // Helper function to escape HTML
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function openSettings() {
            // Load current settings
            const nickname = loadChildNickname();
            const nicknameInput = document.getElementById('childNicknameInput');
            if (nicknameInput) {
                nicknameInput.value = nickname;
            }

            // Display current age group
            const ageGroupMap = {
                '3-6': '3-6岁 (学龄前)',
                '7-12': '7-12岁 (小学)',
                '13-18': '13-18岁 (中学)'
            };
            document.getElementById('currentAgeGroupDisplay').textContent = ageGroupMap[ageGroup] || ageGroup;

            // Set age group selector
            const ageGroupSelector = document.getElementById('ageGroupSelector');
            if (ageGroupSelector) {
                ageGroupSelector.value = ageGroup;
            }

            // Load puzzle game toggle state
            const puzzleGameEnabled = loadPuzzleGameSetting();
            const puzzleToggle = document.getElementById('puzzleGameToggle');
            if (puzzleToggle) {
                puzzleToggle.checked = puzzleGameEnabled;
            }

            // Initialize treasure check-in configuration for parent mode
            showTreasureSelectionForCurrentMuseum();
            
            // Render user-added treasures list
            renderUserAddedTreasures();
            
            // Load individual game settings
            updateGameSelectionUI();
            
            // Update game selection visibility based on main toggle
            updateGameSelectionVisibility(puzzleGameEnabled);

            // Show modal
            document.getElementById('settingsModal').classList.add('show');
        }
        
        // Show/hide game selection section based on main toggle
        function updateGameSelectionVisibility(enabled) {
            const gameSelectionSection = document.getElementById('gameSelectionSection');
            if (gameSelectionSection) {
                gameSelectionSection.style.display = enabled ? 'block' : 'none';
            }
        }

        // ===== Individual Game Settings =====
        // All games enabled by default (puzzle removed for better child experience)
        const ALL_GAMES = ['maze', 'space-invaders', 'tank-battle', 'snake'];

        function loadEnabledGames() {
            try {
                const saved = localStorage.getItem('enabledGames');
                if (saved === null) {
                    // Default: all games enabled
                    return [...ALL_GAMES];
                }
                const parsed = JSON.parse(saved);
                // Ensure we return at least one game
                return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...ALL_GAMES];
            } catch (error) {
                console.error('Failed to load enabled games:', error);
                return [...ALL_GAMES];
            }
        }

        function saveEnabledGames(games) {
            try {
                // Ensure at least one game is enabled
                const toSave = games.length > 0 ? games : [...ALL_GAMES];
                localStorage.setItem('enabledGames', JSON.stringify(toSave));
                return true;
            } catch (error) {
                console.error('Failed to save enabled games:', error);
                return false;
            }
        }

        function updateGameSelectionUI() {
            const enabledGames = loadEnabledGames();
            const gameToggles = document.querySelectorAll('.game-toggle');
            gameToggles.forEach(toggle => {
                const game = toggle.dataset.game;
                toggle.checked = enabledGames.includes(game);
            });
        }

        function handleGameToggleChange() {
            const gameToggles = document.querySelectorAll('.game-toggle');
            const enabledGames = [];
            gameToggles.forEach(toggle => {
                if (toggle.checked) {
                    enabledGames.push(toggle.dataset.game);
                }
            });
            
            // Ensure at least one game is enabled
            if (enabledGames.length === 0) {
                // Re-enable the one that was just unchecked
                event.target.checked = true;
                enabledGames.push(event.target.dataset.game);
                alert('至少需要选择一个游戏！');
            }
            
            saveEnabledGames(enabledGames);
        }

        // ===== Game Reward Manager =====
        // Unified game reward system - prevents XP farming by only awarding once per session
        // All games use this single interface for consistent reward handling
        const GameRewardManager = {
            _sessionRewarded: false,
            
            // Call when a new game session starts (from task completion)
            startNewSession() {
                this._sessionRewarded = false;
            },
            
            // Call when game completes - returns true if XP was awarded
            awardCompletion(gameType, score = 0, timeSeconds = 0) {
                if (this._sessionRewarded) {
                    return false; // Already rewarded this session
                }
                
                const xp = this._calculateXP(gameType, score, timeSeconds);
                const gameName = this._getGameName(gameType);
                
                // Award XP via achievement system
                if (window.achievementGamification) {
                    window.achievementGamification.addXP(xp);
                    window.achievementGamification.showXPGainNotification(xp, `${gameName}完成`);
                }
                
                // Notify virtual pet about game completion (pet adoption prompt only after all tasks)
                if (typeof VirtualPet !== 'undefined') {
                    VirtualPet.notifyGameCompleted(gameType, score, timeSeconds);
                }
                
                this._sessionRewarded = true;
                return true;
            },
            
            // Calculate XP based on game type and performance
            _calculateXP(gameType, score, timeSeconds) {
                if (typeof VirtualPet === 'undefined' || !VirtualPet.GAME_XP_REWARDS) {
                    return this._getFallbackXP(gameType, score, timeSeconds);
                }
                
                const rewards = VirtualPet.GAME_XP_REWARDS[gameType];
                if (!rewards) {
                    return 10; // Default XP
                }
                
                // Fixed XP games (puzzle, maze)
                if (rewards.base) {
                    return rewards.base;
                }
                
                // Score-based games (shooting, space-invaders, tank-battle, snake)
                if (rewards.divisor) {
                    return Math.max(rewards.min, Math.min(rewards.max, Math.floor(score / rewards.divisor)));
                }
                
                // Time-based games (minesweeper)
                if (rewards.timeBonus) {
                    const bonusXP = Math.floor((100 - Math.min(timeSeconds, 100)) * 0.3);
                    return Math.max(rewards.min, Math.min(rewards.max, bonusXP));
                }
                
                return rewards.min || 10;
            },
            
            // Fallback XP calculation when VirtualPet not available
            _getFallbackXP(gameType, score, timeSeconds) {
                const fallbacks = {
                    'puzzle': 15,
                    'maze': 20,
                    'space-invaders': Math.max(15, Math.min(30, Math.floor(score / 10))),
                    'tank-battle': Math.max(20, Math.min(30, Math.floor(score / 5))),
                    'snake': Math.max(10, Math.min(30, Math.floor(score / 10)))
                };
                return fallbacks[gameType] || 10;
            },
            
            // Get display name for game type
            _getGameName(gameType) {
                const names = {
                    'puzzle': '拼图游戏',
                    'maze': '迷宫游戏',
                    'space-invaders': '小蜜蜂游戏',
                    'tank-battle': '坦克大战',
                    'snake': '贪食蛇'
                };
                return names[gameType] || '游戏';
            },
            
            // Check if current session has been rewarded (for UI feedback)
            isSessionRewarded() {
                return this._sessionRewarded;
            }
        };

        // ===== Random Game Selection =====
        // Randomly select from enabled games only
        function selectRandomGame() {
            const enabledGames = loadEnabledGames();
            // Fallback to all games if somehow none are enabled
            const games = enabledGames.length > 0 ? enabledGames : ALL_GAMES;
            const randomIndex = Math.floor(Math.random() * games.length);
            return games[randomIndex];
        }

        // ===== Fullscreen Image Viewer =====
        // Global state for fullscreen viewer
        let currentScale = 1;
        let isFullscreenOpen = false;
        let lastTapTime = 0;
        let touchStartDistance = 0;
        let initialScale = 1;

        // Initialize fullscreen viewer
        function initFullscreenViewer() {
            const modalImage = document.getElementById('modalImage');
            const fullscreenViewer = document.getElementById('fullscreenViewer');
            const fullscreenImage = document.getElementById('fullscreenImage');
            const fullscreenCloseBtn = document.getElementById('fullscreenCloseBtn');
            const fullscreenHint = document.getElementById('fullscreenHint');
            const zoomInBtn = document.getElementById('zoomInBtn');
            const zoomOutBtn = document.getElementById('zoomOutBtn');
            const zoomResetBtn = document.getElementById('zoomResetBtn');

            if (!modalImage || !fullscreenViewer || !fullscreenImage) {
                console.warn('Fullscreen viewer elements not found');
                return;
            }

            // Open fullscreen when clicking modal image
            modalImage.addEventListener('click', function(e) {
                if (modalImage.style.display !== 'none' && modalImage.src) {
                    e.stopPropagation();
                    openFullscreen(modalImage.src);
                }
            });

            // Close fullscreen
            function closeFullscreen() {
                fullscreenViewer.classList.remove('show');
                isFullscreenOpen = false;
                currentScale = 1;
                fullscreenImage.style.transform = 'scale(1)';
                document.body.style.overflow = '';
            }

            // Open fullscreen
            function openFullscreen(imageSrc) {
                fullscreenImage.src = imageSrc;
                fullscreenViewer.classList.add('show');
                isFullscreenOpen = true;
                currentScale = 1;
                fullscreenImage.style.transform = 'scale(1)';
                document.body.style.overflow = 'hidden';

                // Show hint temporarily
                if (fullscreenHint) {
                    fullscreenHint.style.display = 'block';
                    setTimeout(() => {
                        if (fullscreenHint) fullscreenHint.style.display = 'none';
                    }, 3000);
                }
            }

            // Close button
            if (fullscreenCloseBtn) {
                fullscreenCloseBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    closeFullscreen();
                });
            }

            // Click background to close
            fullscreenViewer.addEventListener('click', function(e) {
                if (e.target === fullscreenViewer) {
                    closeFullscreen();
                }
            });

            // ESC key to close
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && isFullscreenOpen) {
                    closeFullscreen();
                }
            });

            // Zoom functions
            function zoomIn() {
                currentScale = Math.min(currentScale + 0.5, 4);
                fullscreenImage.style.transform = `scale(${currentScale})`;
            }

            function zoomOut() {
                currentScale = Math.max(currentScale - 0.5, 0.5);
                fullscreenImage.style.transform = `scale(${currentScale})`;
            }

            function zoomReset() {
                currentScale = 1;
                fullscreenImage.style.transform = 'scale(1)';
            }

            // Zoom controls
            if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
            if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
            if (zoomResetBtn) zoomResetBtn.addEventListener('click', zoomReset);

            // Double-tap to zoom on mobile
            fullscreenImage.addEventListener('touchend', function(e) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;
                
                if (tapLength < 300 && tapLength > 0) {
                    e.preventDefault();
                    if (currentScale === 1) {
                        currentScale = 2;
                    } else {
                        currentScale = 1;
                    }
                    fullscreenImage.style.transform = `scale(${currentScale})`;
                }
                lastTapTime = currentTime;
            });

            // Pinch to zoom on mobile
            fullscreenImage.addEventListener('touchstart', function(e) {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    touchStartDistance = Math.hypot(
                        touch1.clientX - touch2.clientX,
                        touch1.clientY - touch2.clientY
                    );
                    initialScale = currentScale;
                }
            });

            fullscreenImage.addEventListener('touchmove', function(e) {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const touchCurrentDistance = Math.hypot(
                        touch1.clientX - touch2.clientX,
                        touch1.clientY - touch2.clientY
                    );
                    
                    if (touchStartDistance > 0) {
                        const scaleFactor = touchCurrentDistance / touchStartDistance;
                        currentScale = Math.max(0.5, Math.min(4, initialScale * scaleFactor));
                        fullscreenImage.style.transform = `scale(${currentScale})`;
                    }
                }
            });

            // Mouse wheel zoom on desktop
            fullscreenImage.addEventListener('wheel', function(e) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }, { passive: false });

            console.log('Fullscreen image viewer initialized');
        }

        // Initialize on page load
        window.addEventListener('DOMContentLoaded', function() {
            init();
            initFullscreenViewer();
        });
