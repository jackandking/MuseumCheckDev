/**
 * MuseumCheck Application - National Treasures Survey
 * Allows users to select which of China's top 10 national treasures they've seen
 */

/**
 * Configuration object for the survey
 */
const surveyConfig = {
    title: "中国十大国宝，你见过几件？",
    storageKey: "nationalTreasures.survey.data"
    // Note: KV store endpoint is managed by util.js functions (updateConfig/getConfig)
};

/**
 * China's Top 10 National Treasures
 */
const NATIONAL_TREASURES = [
    {
        id: 'qingming-scroll',
        name: '《清明上河图》',
        museum: '故宫博物院',
        museumId: 'forbidden-city',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Along_the_River_During_the_Qingming_Festival_%28detail_of_original%29.jpg',
        description: '北宋画家张择端作品，全长528厘米，画了814个人物。是中国十大传世名画之一'
    },
    {
        id: 'houmuwu-ding',
        name: '后母戊鼎',
        museum: '中国国家博物馆',
        museumId: 'national-museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/HouMuWuDingFullView.jpg',
        description: '世界上现存最大最重的青铜器，重832.84公斤，是商朝青铜器的巅峰之作'
    },
    {
        id: 'terracotta-warriors',
        name: '兵马俑',
        museum: '秦始皇帝陵博物院',
        museumId: 'terracotta-army',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Terracotta_army_xian_embedded_warrior.jpg',
        description: '秦始皇陵的地下军队，约有8000件陶俑，被誉为"世界第八大奇迹"'
    },
    {
        id: 'zenghouyi-bells',
        name: '曾侯乙编钟',
        museum: '湖北省博物馆',
        museumId: 'hubei-museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Bianzhong_of_Marquis_Yi_of_Zeng_Wuhan.jpg',
        description: '战国早期大型礼乐重器，共65件编钟，距今2400多年仍能演奏乐曲'
    },
    {
        id: 'goujian-sword',
        name: '越王勾践剑',
        museum: '湖北省博物馆',
        museumId: 'hubei-museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Sword_of_Goujian%2C_2019-06-15_02.jpg',
        description: '春秋晚期越国青铜宝剑，出土时锋利如新，千年不锈'
    },
    {
        id: 'jadeite-cabbage',
        name: '翠玉白菜',
        museum: '故宫博物院',
        museumId: 'forbidden-city',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Jade_cabbage_closeup.jpg',
        description: '光绪皇帝瑾妃的嫁妆，运用巧雕技法，形态逼真，是清代玉雕的代表作'
    },
    {
        id: 'dake-ding',
        name: '大克鼎',
        museum: '上海博物馆',
        museumId: 'shanghai-museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Da_Ke_ding.jpg',
        description: '西周晚期青铜器，铭文290字，是研究西周历史的重要文物'
    },
    {
        id: 'agate-cup',
        name: '镶金兽首玛瑙杯',
        museum: '陕西历史博物馆',
        museumId: 'shaanxi-history-museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/%E5%94%90-%E7%8E%9B%E7%91%99%E5%85%BD%E9%A6%96%E6%9D%AF.jpg',
        description: '唐代酒器，用一整块红色玛瑙雕琢而成，是中外文化交流的见证'
    },
    {
        id: 'tri-color-camel',
        name: '唐三彩骆驼载乐俑',
        museum: '中国国家博物馆',
        museumId: 'national-museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Tang_Sancai_Camel_%26_Rider.jpg',
        description: '唐代陶器精品，展现了丝绸之路上的胡人乐队形象'
    },
    {
        id: 'jade-burial-suit',
        name: '金缕玉衣',
        museum: '河北博物院',
        museumId: 'hebei-museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Jade_burial_suit_in_Henan_Provincial_Museum.jpg',
        description: '汉代最高等级的丧葬殓服，由2498片玉片和约1100克金丝编缀而成'
    }
];

/**
 * Fallback image for when treasure images fail to load
 */
const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
    '<rect fill="#f0f0f0" width="100" height="100"/>' +
    '<text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">图片加载失败</text>' +
    '</svg>'
);

/**
 * Application state
 */
let selectedTreasures = [];
let surveyData = {};

/**
 * Initializes the application
 */
async function initializeApp() {
    try {
        checkUrlParameters();
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
    const gridContainer = document.getElementById('treasuresGrid');
    if (gridContainer) {
        gridContainer.innerHTML = '';
        const errorPara = document.createElement('p');
        errorPara.className = 'error-text';
        errorPara.textContent = message;
        gridContainer.appendChild(errorPara);
    }
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

    // Generate treasure cards
    const gridContainer = document.getElementById('treasuresGrid');
    if (gridContainer) {
        generateTreasureCards(gridContainer);
    }

    // Setup submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.onclick = handleSubmit;
        submitBtn.style.display = 'block';
    }
}

/**
 * Generates treasure selection cards
 * @param {HTMLElement} container - The container element for cards
 */
function generateTreasureCards(container) {
    container.innerHTML = '';
    
    NATIONAL_TREASURES.forEach((treasure, index) => {
        const card = document.createElement('div');
        card.className = 'treasure-card';
        card.dataset.treasureId = treasure.id;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `treasure-${treasure.id}`;
        checkbox.className = 'treasure-checkbox';
        checkbox.value = treasure.id;
        checkbox.onchange = () => toggleTreasureSelection(treasure.id);
        
        const label = document.createElement('label');
        label.htmlFor = `treasure-${treasure.id}`;
        label.className = 'treasure-label';
        
        const img = document.createElement('img');
        img.src = treasure.imageUrl;
        img.alt = treasure.name;
        img.className = 'treasure-image';
        img.onerror = function() {
            this.src = FALLBACK_IMAGE;
        };
        
        const info = document.createElement('div');
        info.className = 'treasure-info';
        
        const nameLabel = document.createElement('h3');
        nameLabel.className = 'treasure-name';
        nameLabel.textContent = treasure.name;
        
        const museumLabel = document.createElement('p');
        museumLabel.className = 'treasure-museum';
        museumLabel.textContent = treasure.museum;
        
        const descLabel = document.createElement('p');
        descLabel.className = 'treasure-description';
        descLabel.textContent = treasure.description;
        
        info.appendChild(nameLabel);
        info.appendChild(museumLabel);
        info.appendChild(descLabel);
        
        label.appendChild(img);
        label.appendChild(info);
        
        card.appendChild(checkbox);
        card.appendChild(label);
        container.appendChild(card);
    });
}

/**
 * Toggles treasure selection
 * @param {string} treasureId - The treasure ID
 */
function toggleTreasureSelection(treasureId) {
    const index = selectedTreasures.indexOf(treasureId);
    if (index > -1) {
        selectedTreasures.splice(index, 1);
    } else {
        selectedTreasures.push(treasureId);
    }
    
    // Update card visual state
    const card = document.querySelector(`[data-treasure-id="${treasureId}"]`);
    if (card) {
        if (selectedTreasures.includes(treasureId)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    }
    
    console.log('Selected treasures:', selectedTreasures);
}

/**
 * Handles form submission
 */
function handleSubmit() {
    // Allow submission with 0 selections (user hasn't seen any treasures)
    // No alert needed - this is a valid choice
    
    try {
        // Process the submission
        processSubmission();

        // Hide questionnaire
        const questionnaire = document.getElementById('questionnaire');
        if (questionnaire) {
            questionnaire.style.display = 'none';
        }

        // Show result button
        const showResultBtn = document.getElementById('showResultBtn');
        if (showResultBtn) {
            showResultBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error processing submission:', error);
    }
}

/**
 * Processes the user's submission
 */
function processSubmission() {
    // Read current survey results
    getConfig(surveyConfig.storageKey, (data) => {
        try {
            // Initialize or update survey data
            if (data !== null && typeof data === 'object') {
                surveyData = { ...data };
            } else {
                surveyData = {
                    totalResponses: 0,
                    countDistribution: {},
                    treasureViews: {}
                };
            }
            
            // Ensure structure exists
            if (!surveyData.countDistribution) {
                surveyData.countDistribution = {};
            }
            if (!surveyData.treasureViews) {
                surveyData.treasureViews = {};
            }
            if (!surveyData.totalResponses) {
                surveyData.totalResponses = 0;
            }
            
            // Update total responses
            surveyData.totalResponses += 1;
            
            // Update count distribution (how many treasures seen)
            const count = selectedTreasures.length;
            surveyData.countDistribution[count] = (surveyData.countDistribution[count] || 0) + 1;
            
            // Update individual treasure view counts
            NATIONAL_TREASURES.forEach(treasure => {
                if (!surveyData.treasureViews[treasure.id]) {
                    surveyData.treasureViews[treasure.id] = {
                        name: treasure.name,
                        museum: treasure.museum,
                        count: 0
                    };
                }
            });
            
            selectedTreasures.forEach(treasureId => {
                if (surveyData.treasureViews[treasureId]) {
                    surveyData.treasureViews[treasureId].count += 1;
                }
            });

            // Save updated survey results
            updateConfig(surveyConfig.storageKey, surveyData);
            
            console.log('Submission recorded:', {
                selected: selectedTreasures,
                count: count,
                surveyData: surveyData
            });
        } catch (error) {
            console.error('Error processing submission:', error);
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
            url: "/pages/rewardedWebview/rewardedWebview?target=survey/national-treasures&flow=rewarded",
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
    const result = document.getElementById('result');
    const showResultBtn = document.getElementById('showResultBtn');
    
    if (questionnaire) questionnaire.style.display = 'none';
    if (showResultBtn) showResultBtn.style.display = 'none';
    if (result) result.style.display = 'block';
    
    // Load and display results
    getConfig(surveyConfig.storageKey, (data) => {
        if (data) {
            showResult(data);
        } else {
            showResult(surveyData);
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
 * Displays survey results
 * @param {Object} data - Survey data object
 */
function showResult(data) {
    if (!data || typeof data !== 'object') {
        console.error('Invalid survey data provided');
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
    
    const h2 = document.createElement('h2');
    h2.textContent = '🎯 全网用户统计结果';
    header.appendChild(h2);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'result-subtitle';
    subtitle.textContent = `共有 ${data.totalResponses || 0} 人参与调查`;
    header.appendChild(subtitle);
    
    resultDiv.appendChild(header);

    // Create distribution chart
    const distributionSection = createDistributionChart(data);
    resultDiv.appendChild(distributionSection);
    
    // Create popularity ranking
    const rankingSection = createPopularityRanking(data);
    resultDiv.appendChild(rankingSection);
    
    // Add summary
    addSummary(resultDiv, data);
}

/**
 * Creates distribution chart showing how many users saw N treasures
 * @param {Object} data - Survey data object
 * @returns {HTMLElement} Distribution section element
 */
function createDistributionChart(data) {
    const section = document.createElement("div");
    section.className = "distribution-section";
    
    const title = document.createElement("h3");
    title.textContent = "📊 见过国宝数量分布";
    section.appendChild(title);
    
    const chartContainer = document.createElement("div");
    chartContainer.className = "distribution-chart";
    
    const distribution = data.countDistribution || {};
    const maxCount = Math.max(...Object.values(distribution), 1);
    
    // Create bars for 0-10 treasures
    for (let i = 0; i <= 10; i++) {
        const count = distribution[i] || 0;
        const percentage = data.totalResponses > 0 ? Math.round((count / data.totalResponses) * 100) : 0;
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        const barRow = document.createElement("div");
        barRow.className = "bar-row";
        
        const label = document.createElement("div");
        label.className = "bar-label";
        label.textContent = `${i}件`;
        
        const barContainer = document.createElement("div");
        barContainer.className = "bar-container";
        
        const bar = document.createElement("div");
        bar.className = "distribution-bar";
        bar.style.width = `${barWidth}%`;
        
        const stats = document.createElement("span");
        stats.className = "bar-stats";
        stats.textContent = `${count}人 (${percentage}%)`;
        
        barContainer.appendChild(bar);
        barContainer.appendChild(stats);
        
        barRow.appendChild(label);
        barRow.appendChild(barContainer);
        chartContainer.appendChild(barRow);
    }
    
    section.appendChild(chartContainer);
    return section;
}

/**
 * Creates popularity ranking of treasures
 * @param {Object} data - Survey data object
 * @returns {HTMLElement} Ranking section element
 */
function createPopularityRanking(data) {
    const section = document.createElement("div");
    section.className = "ranking-section";
    
    const title = document.createElement("h3");
    title.textContent = "🏆 国宝知名度排行榜";
    section.appendChild(title);
    
    const subtitle = document.createElement("p");
    subtitle.className = "ranking-subtitle";
    subtitle.textContent = "（按实际见过的人数排序）";
    section.appendChild(subtitle);
    
    const treasureViews = data.treasureViews || {};
    
    // Convert to array and sort by count
    const rankings = Object.entries(treasureViews)
        .map(([id, info]) => ({
            id: id,
            name: info.name,
            museum: info.museum,
            count: info.count || 0
        }))
        .sort((a, b) => b.count - a.count);
    
    // Create ranking list
    const rankingList = document.createElement("div");
    rankingList.className = "ranking-list";
    
    rankings.forEach((item, index) => {
        const rank = index + 1;
        const percentage = data.totalResponses > 0 ? Math.round((item.count / data.totalResponses) * 100) : 0;
        
        const rankCard = document.createElement("div");
        rankCard.className = "rank-card";
        if (rank <= 3) {
            rankCard.classList.add(`rank-${rank}`);
        }
        
        // Rank number
        const rankNumber = document.createElement("div");
        rankNumber.className = "rank-number";
        rankNumber.textContent = rank;
        rankCard.appendChild(rankNumber);
        
        // Find treasure data for image
        const treasureData = NATIONAL_TREASURES.find(t => t.id === item.id);
        if (treasureData) {
            const img = document.createElement("img");
            img.src = treasureData.imageUrl;
            img.alt = item.name;
            img.className = "rank-thumbnail";
            img.onerror = function() { this.style.display = 'none'; };
            rankCard.appendChild(img);
        }
        
        // Rank info
        const rankInfo = document.createElement("div");
        rankInfo.className = "rank-info";
        
        const rankName = document.createElement("p");
        rankName.className = "rank-name";
        rankName.textContent = item.name;
        rankInfo.appendChild(rankName);
        
        const rankMuseum = document.createElement("p");
        rankMuseum.className = "rank-museum";
        rankMuseum.textContent = item.museum;
        rankInfo.appendChild(rankMuseum);
        
        rankCard.appendChild(rankInfo);
        
        // Rank stats
        const rankStats = document.createElement("div");
        rankStats.className = "rank-stats";
        
        const rankCount = document.createElement("span");
        rankCount.className = "rank-count";
        rankCount.textContent = `${item.count}人`;
        rankStats.appendChild(rankCount);
        
        const rankPercentage = document.createElement("span");
        rankPercentage.className = "rank-percentage";
        rankPercentage.textContent = `${percentage}%`;
        rankStats.appendChild(rankPercentage);
        
        rankCard.appendChild(rankStats);
        
        rankingList.appendChild(rankCard);
    });
    
    section.appendChild(rankingList);
    return section;
}

/**
 * Adds summary statistics
 * @param {HTMLElement} container - Container element
 * @param {Object} data - Survey data object
 */
function addSummary(container, data) {
    // Calculate average
    let totalSeen = 0;
    Object.entries(data.countDistribution || {}).forEach(([count, responses]) => {
        totalSeen += parseInt(count) * responses;
    });
    const average = data.totalResponses > 0 ? (totalSeen / data.totalResponses).toFixed(1) : 0;
    
    const summarySection = document.createElement("div");
    summarySection.className = "summary-section";
    
    // Summary stats container
    const summaryStats = document.createElement("div");
    summaryStats.className = "summary-stats";
    
    // Total participants card
    const totalCard = document.createElement("div");
    totalCard.className = "summary-card";
    
    const totalNumber = document.createElement("span");
    totalNumber.className = "summary-number";
    totalNumber.textContent = data.totalResponses || 0;
    totalCard.appendChild(totalNumber);
    
    const totalLabel = document.createElement("span");
    totalLabel.className = "summary-label";
    totalLabel.textContent = "总参与人数";
    totalCard.appendChild(totalLabel);
    
    summaryStats.appendChild(totalCard);
    
    // Average card
    const avgCard = document.createElement("div");
    avgCard.className = "summary-card highlight";
    
    const avgNumber = document.createElement("span");
    avgNumber.className = "summary-number";
    avgNumber.textContent = average;
    avgCard.appendChild(avgNumber);
    
    const avgLabel = document.createElement("span");
    avgLabel.className = "summary-label";
    avgLabel.textContent = "平均见过件数";
    avgCard.appendChild(avgLabel);
    
    summaryStats.appendChild(avgCard);
    summarySection.appendChild(summaryStats);
    
    // Timestamp
    const timestamp = document.createElement("p");
    timestamp.className = "summary-timestamp";
    timestamp.textContent = `统计时间: ${new Date().toLocaleString('zh-CN')}`;
    summarySection.appendChild(timestamp);
    
    container.appendChild(summarySection);
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
            const result = document.getElementById('result');
            
            if (questionnaire) questionnaire.style.display = 'none';
            if (result) result.style.display = 'block';
            
            // Load and display results
            getConfig(surveyConfig.storageKey, (data) => {
                if (data) {
                    showResult(data);
                } else {
                    console.warn('No survey data available for results');
                }
            });
        }
    }
}
