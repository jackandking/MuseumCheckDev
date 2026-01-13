/**
 * MuseumCheck Application - Museum Popularity Survey functionality
 * Handles user interaction for voting on which museum they think is most popular
 * 
 * Users are shown 5 random museums and asked to vote for the one they think
 * is most popular. Results are aggregated to help determine default museum ordering.
 * 
 * Dependencies: ../util.js (provides getConfig, updateConfig functions)
 */

/**
 * Configuration object for the survey
 */
const surveyConfig = {
    title: "你猜哪个博物馆最受欢迎？",
    question: "以下5个博物馆中，你认为哪个最受大众欢迎？",
    storageKey: "museumPopularity.data",
    museumsPerRound: 5,
    kvStoreEndpoint: "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
};

/**
 * Check if util.js functions are available
 * @returns {boolean} True if utility functions are available
 */
function checkUtilFunctions() {
    if (typeof getConfig !== 'function' || typeof updateConfig !== 'function') {
        console.error('Required utility functions (getConfig, updateConfig) are not available. Ensure util.js is loaded.');
        return false;
    }
    return true;
}

/**
 * Fallback image for when museum images fail to load
 */
const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
    '<rect fill="#f0f8ff" width="100" height="100"/>' +
    '<text x="50" y="45" text-anchor="middle" dy=".3em" fill="#4a90e2" font-size="24">🏛️</text>' +
    '<text x="50" y="70" text-anchor="middle" fill="#666" font-size="10">博物馆</text>' +
    '</svg>'
);

/**
 * Application state
 */
let voteData = {};
let selectedMuseums = [];
let allMuseums = [];

/**
 * Initializes the application
 */
async function initializeApp() {
    try {
        checkUrlParameters();
        await loadMuseumsData();
        selectRandomMuseums();
        setupPageContent();
        handleResultDisplay();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('加载失败，请刷新页面重试');
    }
}

/**
 * Shows error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = `<p class="error-text">${message}</p>`;
    }
}

/**
 * Loads museums data from various sources
 */
async function loadMuseumsData() {
    // Try to fetch museums metadata from JSON endpoint (primary source)
    try {
        const response = await fetch('/data/museums-meta.json');
        if (response.ok) {
            allMuseums = (await response.json()).filter(m => m && m.id && m.name);
            console.log('Loaded museums from /data/museums-meta.json:', allMuseums.length);
            return;
        }
    } catch (error) {
        console.error('Failed to fetch /data/museums-meta.json:', error);
    }
    
    // Try legacy MUSEUMS_META global (backward compatibility)
    if (typeof window !== 'undefined' && window.MUSEUMS_META && Array.isArray(window.MUSEUMS_META)) {
        allMuseums = window.MUSEUMS_META.filter(m => m && m.id && m.name);
        console.log('Loaded museums from MUSEUMS_META global:', allMuseums.length);
        return;
    }
    
    // Fallback: use a default set of popular museums
    allMuseums = getDefaultMuseums();
    console.log('Using default museums list:', allMuseums.length);
}

/**
 * Gets a default list of popular museums as fallback
 * @returns {Array} Array of museum objects
 */
function getDefaultMuseums() {
    return [
        { id: 'forbidden-city', name: '故宫博物院', location: '北京', image: '' },
        { id: 'national-museum', name: '中国国家博物馆', location: '北京', image: '' },
        { id: 'shanghai-museum', name: '上海博物馆', location: '上海', image: '' },
        { id: 'terracotta-warriors', name: '秦始皇帝陵博物院', location: '西安', image: '' },
        { id: 'nanjing-museum', name: '南京博物院', location: '南京', image: '' },
        { id: 'hubei-museum', name: '湖北省博物馆', location: '武汉', image: '' },
        { id: 'shaanxi-history-museum', name: '陕西历史博物馆', location: '西安', image: '' },
        { id: 'china-science-museum', name: '中国科学技术馆', location: '北京', image: '' },
        { id: 'suzhou-museum', name: '苏州博物馆', location: '苏州', image: '' },
        { id: 'zhejiang-museum', name: '浙江省博物馆', location: '杭州', image: '' },
        { id: 'guangdong-museum', name: '广东省博物馆', location: '广州', image: '' },
        { id: 'sichuan-museum', name: '四川博物院', location: '成都', image: '' },
        { id: 'henan-museum', name: '河南博物院', location: '郑州', image: '' },
        { id: 'liaoning-museum', name: '辽宁省博物馆', location: '沈阳', image: '' },
        { id: 'shandong-museum', name: '山东博物馆', location: '济南', image: '' }
    ];
}

/**
 * Selects random museums for the current voting round
 * Prioritizes museums with images so users can vote based on appearance
 */
function selectRandomMuseums() {
    if (allMuseums.length <= surveyConfig.museumsPerRound) {
        selectedMuseums = [...allMuseums];
    } else {
        // Separate museums with and without images
        const museumsWithImages = allMuseums.filter(m => m.image && m.image.trim() !== '');
        const museumsWithoutImages = allMuseums.filter(m => !m.image || m.image.trim() === '');
        
        // Fisher-Yates shuffle both groups
        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };
        
        const shuffledWithImages = shuffleArray(museumsWithImages);
        const shuffledWithoutImages = shuffleArray(museumsWithoutImages);
        
        // Prioritize museums with images: take as many as possible from museumsWithImages first
        const withImagesCount = Math.min(shuffledWithImages.length, surveyConfig.museumsPerRound);
        const withoutImagesCount = surveyConfig.museumsPerRound - withImagesCount;
        
        selectedMuseums = [
            ...shuffledWithImages.slice(0, withImagesCount),
            ...shuffledWithoutImages.slice(0, withoutImagesCount)
        ];
    }
    
    console.log('Selected museums for voting:', selectedMuseums.map(m => m.name));
    const withImagesCount = selectedMuseums.filter(m => m.image && m.image.trim() !== '').length;
    console.log(`Museums with images: ${withImagesCount}/${selectedMuseums.length}`);
}

/**
 * Checks URL parameters for navigation control
 */
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL parameters:', urlParams);

    if (urlParams.get('finishedAd') === 'false') {
        if (typeof ks !== 'undefined' && ks.navigateBack) {
            ks.navigateBack();
        }
    }
}

/**
 * Sets up the page content dynamically
 */
function setupPageContent() {
    // Set page title
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) {
        titleElement.textContent = surveyConfig.title;
    }

    // Set intro text
    const introElement = document.getElementById('surveyIntro');
    if (introElement) {
        introElement.textContent = surveyConfig.question;
    }

    // Initialize vote data
    initializeVoteData();

    // Generate option cards
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        generateMuseumOptions(optionsContainer);
    }
}

/**
 * Initializes vote data structure
 */
function initializeVoteData() {
    selectedMuseums.forEach(museum => {
        voteData[museum.id] = 0;
    });
}

/**
 * Generates museum option cards
 * @param {HTMLElement} container - The container element for options
 */
function generateMuseumOptions(container) {
    container.innerHTML = '';
    
    selectedMuseums.forEach((museum, index) => {
        const optionCard = document.createElement('div');
        optionCard.className = 'museum-option';
        optionCard.onclick = () => selectMuseum(index);
        
        // Museum image
        const img = document.createElement('img');
        img.src = museum.image || FALLBACK_IMAGE;
        img.alt = museum.name;
        img.className = 'museum-image';
        img.onerror = function() {
            this.src = FALLBACK_IMAGE;
        };
        
        // Museum info container
        const infoDiv = document.createElement('div');
        infoDiv.className = 'museum-info';
        
        // Museum name
        const nameLabel = document.createElement('p');
        nameLabel.className = 'museum-name';
        nameLabel.textContent = museum.name;
        
        // Museum location
        const locationLabel = document.createElement('p');
        locationLabel.className = 'museum-location';
        locationLabel.textContent = museum.location || '';
        
        infoDiv.appendChild(nameLabel);
        infoDiv.appendChild(locationLabel);
        
        optionCard.appendChild(img);
        optionCard.appendChild(infoDiv);
        container.appendChild(optionCard);
    });
}

/**
 * Handles museum selection
 * @param {number} index - Selected museum index
 */
function selectMuseum(index) {
    const selectedMuseum = selectedMuseums[index];
    if (!selectedMuseum) {
        console.error('Invalid museum selection');
        return;
    }

    try {
        // Process the vote
        processVote(selectedMuseum.id, selectedMuseum.name);

        // Hide current question
        const currentQuestionElement = document.getElementById('question1');
        if (currentQuestionElement) {
            currentQuestionElement.style.display = 'none';
        }

        // Hide intro
        const introElement = document.getElementById('surveyIntro');
        if (introElement) {
            introElement.style.display = 'none';
        }

        // Immediately open ad/results for selected answer
        showAd();
    } catch (error) {
        console.error('Error processing selection:', error);
    }
}

/**
 * Processes the user's vote
 * @param {string} museumId - The selected museum ID
 * @param {string} museumName - The selected museum name
 */
function processVote(museumId, museumName) {
    // Check if utility functions are available
    if (!checkUtilFunctions()) {
        // Still update local vote data even if remote storage unavailable
        voteData[museumId] = (voteData[museumId] || 0) + 1;
        console.log('Vote recorded locally:', museumName, '(' + museumId + ')');
        return;
    }
    
    // Read current voting results
    getConfig(surveyConfig.storageKey, (data) => {
        try {
            // Update vote data
            if (data !== null && typeof data === 'object') {
                voteData = { ...data };
            }
            
            // Increment vote for selected museum
            voteData[museumId] = (voteData[museumId] || 0) + 1;

            // Save updated voting results
            updateConfig(surveyConfig.storageKey, voteData);
            
            console.log('Vote recorded:', museumName, '(' + museumId + ')', voteData);
        } catch (error) {
            console.error('Error processing vote:', error);
        }
    });
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Navigation Functions
 * Supports both mini-program (Kuaishou) and web browser environments
 */

/**
 * Shows advertisement before displaying results
 */
function showAd() {
    if (typeof ks !== 'undefined' && ks.navigateTo) {
        ks.navigateTo({
            url: "/pages/rewardedWebview/rewardedWebview?target=survey/popularity&flow=rewarded",
        });
    } else {
        // Fallback for web browser - show results directly
        console.warn('Mini-program navigation not available, showing results directly');
        showResultsDirectly();
    }
}

/**
 * Shows results directly (fallback for web browser)
 */
function showResultsDirectly() {
    const questionnaire = document.getElementById('questionnaire');
    const introElement = document.getElementById('surveyIntro');
    const result = document.getElementById('result');
    const showResultBtn = document.getElementById('showResultBtn');
    
    if (questionnaire) questionnaire.style.display = 'none';
    if (introElement) introElement.style.display = 'none';
    if (showResultBtn) showResultBtn.style.display = 'none';
    if (result) result.style.display = 'block';
    
    // Check if utility functions are available
    if (!checkUtilFunctions()) {
        // Show local vote data
        showResult(voteData);
        return;
    }
    
    // Load and display results
    getConfig(surveyConfig.storageKey, (data) => {
        if (data) {
            showResult(data);
        } else {
            showResult(voteData);
        }
    });
}

/**
 * Navigates to index page
 */
function jumpToIndex() {
    if (typeof ks !== 'undefined' && ks.navigateTo) {
        ks.navigateTo({
            url: "/pages/index/index",
        });
    } else {
        window.location.href = '/';
    }
}

/**
 * Results Display Functions
 */

/**
 * Displays voting results with ranking
 * @param {Object} voteData - Object containing vote counts for each museum
 */
function showResult(voteData) {
    if (!voteData || typeof voteData !== 'object') {
        console.error('Invalid vote data provided');
        return;
    }

    const resultDiv = document.getElementById("result");
    if (!resultDiv) {
        console.error('Result div not found');
        return;
    }

    // Clear and set up result container
    resultDiv.innerHTML = "";
    
    // Add header
    const header = document.createElement('div');
    header.className = 'result-header';
    header.innerHTML = `
        <h2>🏆 博物馆人气排行榜</h2>
        <p class="result-subtitle">基于全网用户投票的博物馆受欢迎程度排名</p>
    `;
    resultDiv.appendChild(header);

    // Create ranking list
    const rankingContainer = createRankingList(voteData);
    resultDiv.appendChild(rankingContainer);
    
    // Add summary statistics
    addSummaryStatistics(resultDiv, voteData);
}

/**
 * Creates a ranking list from vote data
 * @param {Object} voteData - Vote data object
 * @returns {HTMLElement} Ranking container element
 */
function createRankingList(voteData) {
    const rankingContainer = document.createElement("div");
    rankingContainer.className = "ranking-container";

    // Sort museums by vote count
    const sortedMuseums = Object.entries(voteData)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Show top 10

    const total = Object.values(voteData).reduce((a, b) => a + b, 0);
    const maxCount = sortedMuseums.length > 0 ? sortedMuseums[0][1] : 1;

    sortedMuseums.forEach(([museumId, count], index) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        // Find museum info
        const museumInfo = allMuseums.find(m => m.id === museumId) || { name: museumId, location: '' };
        
        const rankItem = document.createElement("div");
        rankItem.className = `rank-item ${index < 3 ? 'top-rank' : ''}`;
        
        // Rank badge
        const rankBadge = document.createElement("div");
        rankBadge.className = "rank-badge";
        if (index === 0) {
            rankBadge.innerHTML = '🥇';
        } else if (index === 1) {
            rankBadge.innerHTML = '🥈';
        } else if (index === 2) {
            rankBadge.innerHTML = '🥉';
        } else {
            rankBadge.textContent = `${index + 1}`;
        }
        
        // Museum info
        const infoCell = document.createElement("div");
        infoCell.className = "rank-info";
        
        const nameSpan = document.createElement("span");
        nameSpan.className = "rank-museum-name";
        nameSpan.textContent = museumInfo.name;
        
        const locationSpan = document.createElement("span");
        locationSpan.className = "rank-museum-location";
        locationSpan.textContent = museumInfo.location || '';
        
        infoCell.appendChild(nameSpan);
        if (museumInfo.location) {
            infoCell.appendChild(locationSpan);
        }
        
        // Bar and stats
        const barCell = document.createElement("div");
        barCell.className = "rank-bar-cell";
        
        const barWrapper = document.createElement("div");
        barWrapper.className = "rank-bar-wrapper";
        
        const bar = document.createElement("div");
        bar.className = "rank-bar";
        bar.style.width = `${barWidth}%`;
        
        const statsSpan = document.createElement("span");
        statsSpan.className = "rank-stats";
        statsSpan.textContent = `${count}票 (${percentage}%)`;
        
        barWrapper.appendChild(bar);
        barCell.appendChild(barWrapper);
        barCell.appendChild(statsSpan);
        
        rankItem.appendChild(rankBadge);
        rankItem.appendChild(infoCell);
        rankItem.appendChild(barCell);
        rankingContainer.appendChild(rankItem);
    });

    return rankingContainer;
}

/**
 * Adds summary statistics to result display
 * @param {HTMLElement} container - Container element
 * @param {Object} voteData - Vote data object
 */
function addSummaryStatistics(container, voteData) {
    const total = Object.values(voteData).reduce((a, b) => a + b, 0);
    const museumCount = Object.keys(voteData).length;
    
    const statsSection = document.createElement("div");
    statsSection.className = "stats-section";
    statsSection.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-number">${total}</span>
                <span class="stat-label">总投票数</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${museumCount}</span>
                <span class="stat-label">参与博物馆</span>
            </div>
        </div>
        <p class="stats-timestamp">统计时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p class="stats-note">💡 投票结果将用于优化博物馆默认排序</p>
    `;
    container.appendChild(statsSection);
}

/**
 * Handles URL parameters for result display
 */
function handleResultDisplay() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('finishedAd') !== null) {
        const finishedAd = urlParams.get('finishedAd') === 'true';

        if (finishedAd) {
            // Hide questionnaire and show results
            const questionnaire = document.getElementById('questionnaire');
            const introElement = document.getElementById('surveyIntro');
            const result = document.getElementById('result');
            
            if (questionnaire) questionnaire.style.display = 'none';
            if (introElement) introElement.style.display = 'none';
            if (result) result.style.display = 'block';
            
            // Check if utility functions are available
            if (!checkUtilFunctions()) {
                // Show local vote data if available
                if (Object.keys(voteData).length > 0) {
                    showResult(voteData);
                } else {
                    console.warn('No vote data available for results');
                }
                return;
            }
            
            // Load and display results
            getConfig(surveyConfig.storageKey, (data) => {
                if (data) {
                    showResult(data);
                } else {
                    console.warn('No vote data available for results');
                }
            });
        }
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        surveyConfig,
        getDefaultMuseums,
        selectRandomMuseums: () => {
            selectRandomMuseums();
            return selectedMuseums;
        },
        initializeVoteData,
        processVote,
        createRankingList,
        addSummaryStatistics
    };
}
