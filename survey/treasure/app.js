/**
 * MuseumCheck Application - Treasure Survey functionality
 * Handles user interaction for museum treasure identification quiz
 */

/**
 * Configuration object for the survey
 */
const surveyConfig = {
    title: "猜猜哪个是首都博物馆的镇馆之宝？",
    question: "以下哪个是首都博物馆的镇馆之宝？",
    museumId: "beijing-capital-museum",
    storageKey: "capitalMuseumTreasure.data",
    kvStoreEndpoint: "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore",
    kvStoreKeyPrefix: "museum-data-"
};

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
let currentQuestion = 1;
let voteData = {};
let museumData = null;
let allTreasures = [];

/**
 * Initializes the application
 */
async function initializeApp() {
    try {
        checkUrlParameters();
        await loadMuseumData();
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
 * Loads museum data from dynamic source (KV store) or static file
 */
async function loadMuseumData() {
    try {
        // Try loading from KV store first (Tier 2 - dynamic data)
        const key = `${surveyConfig.kvStoreKeyPrefix}${surveyConfig.museumId}`;
        const sortKey = 'museum';
        const url = `${surveyConfig.kvStoreEndpoint}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
        
        const response = await fetch(url, { method: 'GET' });
        if (response.ok) {
            const result = await response.json();
            if (result && result.value) {
                museumData = JSON.parse(result.value);
                console.log('Loaded museum data from KV store (dynamic)');
                return;
            }
        }
    } catch (error) {
        console.log('KV store fetch failed, trying static file:', error);
    }
    
    // Fallback to static file (Tier 1)
    try {
        const response = await fetch(`/museums/${surveyConfig.museumId}.json`);
        if (response.ok) {
            museumData = await response.json();
            console.log('Loaded museum data from static file');
            return;
        }
    } catch (error) {
        console.log('Static file fetch failed:', error);
    }
    
    // Final fallback: use hardcoded data
    museumData = getDefaultMuseumData();
    console.log('Using default museum data');
}

/**
 * Gets default museum data as fallback
 */
function getDefaultMuseumData() {
    return {
        id: "beijing-capital-museum",
        name: "首都博物馆",
        image: "https://upload.wikimedia.org/wikipedia/commons/3/36/Capital_Museum_in_Beijing.jpg",
        collections: [
            {
                name: "元代景德镇窑青花凤首扁壶",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/65/%E6%99%AF%E5%BE%B7%E9%95%87%E7%AA%91%E9%9D%92%E8%8A%B1%E5%87%A4%E9%A6%96%E6%89%81%E5%A3%B609124.jpg",
                description: "元代青花瓷代表作"
            },
            {
                name: "堇鼎",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Western_Zhou_Bronze_Jin_Ding_%289890625245%29.jpg",
                description: "西周早期青铜器"
            },
            {
                name: "伯矩鬲",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/28/%E4%BC%AF%E7%9F%A9%E9%AC%B2.jpg",
                description: "西周初期青铜器"
            }
        ]
    };
}

/**
 * Default distractor treasures as fallback
 */
const defaultDistractors = [
    {
        name: "《清明上河图》",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Along_the_River_During_the_Qingming_Festival_%28detail_of_original%29.jpg",
        description: "北宋画家张择端作品，中国十大传世名画之一",
        museumId: "forbidden-city",
        museumName: "故宫博物院"
    },
    {
        name: "后母戊鼎",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Houmuwu_Ding.jpg/600px-Houmuwu_Ding.jpg",
        description: "世界上现存最大最重的青铜器",
        museumId: "national-museum",
        museumName: "中国国家博物馆"
    },
    {
        name: "大克鼎",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/70/Da_Ke_ding.jpg",
        description: "西周晚期青铜器，铭文290字",
        museumId: "shanghai-museum",
        museumName: "上海博物馆"
    }
];

/**
 * Loads treasures from other museums for distractor options
 */
async function loadDistractorTreasures() {
    const otherMuseums = [
        'forbidden-city',
        'national-museum',
        'shanghai-museum'
    ];
    
    const distractors = [];
    
    for (const museumId of otherMuseums) {
        try {
            // Try KV store first
            const key = `${surveyConfig.kvStoreKeyPrefix}${museumId}`;
            const url = `${surveyConfig.kvStoreEndpoint}?key=${encodeURIComponent(key)}&sortKey=museum`;
            
            let data = null;
            const response = await fetch(url, { method: 'GET' });
            if (response.ok) {
                const result = await response.json();
                if (result && result.value) {
                    data = JSON.parse(result.value);
                }
            }
            
            // Fallback to static file
            if (!data) {
                const staticResponse = await fetch(`/museums/${museumId}.json`);
                if (staticResponse.ok) {
                    data = await staticResponse.json();
                }
            }
            
            if (data && data.collections && data.collections.length > 0) {
                // Take first treasure from each museum
                distractors.push({
                    ...data.collections[0],
                    museumId: museumId,
                    museumName: data.name
                });
            }
        } catch (error) {
            console.log(`Failed to load distractors from ${museumId}:`, error);
        }
    }
    
    // If no distractors loaded, use default fallback
    if (distractors.length === 0) {
        console.log('Using default distractor treasures');
        return [...defaultDistractors];
    }
    
    return distractors;
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
async function setupPageContent() {
    // Set page title
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) {
        titleElement.textContent = surveyConfig.title;
    }

    // Set museum image
    const museumImage = document.getElementById('museumImage');
    if (museumImage && museumData && museumData.image) {
        museumImage.src = museumData.image;
        museumImage.alt = museumData.name || '首都博物馆';
    }

    // Set question text
    const questionElement = document.getElementById('questionText');
    if (questionElement) {
        questionElement.textContent = surveyConfig.question;
    }

    // Load distractors and generate options
    const distractors = await loadDistractorTreasures();
    
    // Build options: 1 correct answer + distractors
    allTreasures = [];
    
    // Add the correct answer (first treasure from Capital Museum)
    if (museumData && museumData.collections && museumData.collections.length > 0) {
        const correctTreasure = museumData.collections[0];
        allTreasures.push({
            ...correctTreasure,
            isCorrect: true,
            museumId: surveyConfig.museumId,
            museumName: museumData.name
        });
    }
    
    // Add distractors (up to 3)
    for (let i = 0; i < Math.min(3, distractors.length); i++) {
        allTreasures.push({
            ...distractors[i],
            isCorrect: false
        });
    }
    
    // Shuffle the options
    shuffleArray(allTreasures);
    
    // Initialize vote data
    initializeVoteData();
    
    // Generate option cards
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        generateTreasureOptions(optionsContainer);
    }
}

/**
 * Shuffles an array in place
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Initializes vote data structure
 */
function initializeVoteData() {
    allTreasures.forEach(treasure => {
        voteData[treasure.name] = 0;
    });
}

/**
 * Generates treasure option cards
 * @param {HTMLElement} container - The container element for options
 */
function generateTreasureOptions(container) {
    container.innerHTML = '';
    
    allTreasures.forEach((treasure, index) => {
        const optionCard = document.createElement('div');
        optionCard.className = 'treasure-option';
        optionCard.onclick = () => selectTreasure(index);
        
        const img = document.createElement('img');
        img.src = treasure.imageUrl;
        img.alt = treasure.name;
        img.className = 'treasure-image';
        img.onerror = function() {
            this.src = FALLBACK_IMAGE;
        };
        
        const nameLabel = document.createElement('p');
        nameLabel.className = 'treasure-name';
        nameLabel.textContent = treasure.name;
        
        optionCard.appendChild(img);
        optionCard.appendChild(nameLabel);
        container.appendChild(optionCard);
    });
}

/**
 * Handles treasure selection
 * @param {number} index - Selected treasure index
 */
function selectTreasure(index) {
    const selectedTreasure = allTreasures[index];
    if (!selectedTreasure) {
        console.error('Invalid treasure selection');
        return;
    }

    try {
        // Process the vote
        processVote(selectedTreasure.name, selectedTreasure.isCorrect);

        // Hide current question
        const currentQuestionElement = document.getElementById('question1');
        if (currentQuestionElement) {
            currentQuestionElement.style.display = 'none';
        }

        // Hide museum section
        const museumSection = document.getElementById('museumSection');
        if (museumSection) {
            museumSection.style.display = 'none';
        }

        // Show result button
        const showResultBtn = document.getElementById('showResultBtn');
        if (showResultBtn) {
            showResultBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error processing selection:', error);
    }
}

/**
 * Processes the user's vote
 * @param {string} selectedName - The selected treasure name
 * @param {boolean} isCorrect - Whether the selection is correct
 */
function processVote(selectedName, isCorrect) {
    // Read current voting results
    getConfig(surveyConfig.storageKey, (data) => {
        try {
            // Update vote data
            if (data !== null && typeof data === 'object') {
                voteData = { ...data };
            }
            
            // Ensure all treasures have entries
            allTreasures.forEach(treasure => {
                if (!(treasure.name in voteData)) {
                    voteData[treasure.name] = 0;
                }
            });
            
            // Increment vote for selected option
            voteData[selectedName] = (voteData[selectedName] || 0) + 1;

            // Save updated voting results
            updateConfig(surveyConfig.storageKey, voteData);
            
            console.log('Vote recorded:', selectedName, 'Correct:', isCorrect, voteData);
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
            url: "/pages/rewardedWebview/rewardedWebview?target=survey/treasure&flow=rewarded",
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
    const museumSection = document.getElementById('museumSection');
    const result = document.getElementById('result');
    const showResultBtn = document.getElementById('showResultBtn');
    
    if (questionnaire) questionnaire.style.display = 'none';
    if (museumSection) museumSection.style.display = 'none';
    if (showResultBtn) showResultBtn.style.display = 'none';
    if (result) result.style.display = 'block';
    
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
 * Displays voting results with improved UX
 * @param {Object} voteData - Object containing vote counts for each option
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
    
    // Add header with better styling
    const header = document.createElement('div');
    header.className = 'result-header';
    header.innerHTML = `
        <h2>🎯 全网用户统计结果</h2>
        <p class="result-subtitle">以下是所有参与用户的选择分布</p>
    `;
    resultDiv.appendChild(header);

    // Create improved bar chart with treasure images
    const chartContainer = createImprovedChart(voteData);
    resultDiv.appendChild(chartContainer);
    
    // Add answer reveal section
    const answerSection = createAnswerSection();
    resultDiv.appendChild(answerSection);
    
    // Add summary statistics
    addImprovedStatistics(resultDiv, voteData);
}

/**
 * Creates an improved chart with treasure images
 * @param {Object} voteData - Vote data object
 * @returns {HTMLElement} Chart container element
 */
function createImprovedChart(voteData) {
    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";

    const total = Object.values(voteData).reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...Object.values(voteData), 1);

    // Create horizontal bar chart for better mobile UX
    const barChart = document.createElement("div");
    barChart.className = "horizontal-bar-chart";

    for (const [treasureName, count] of Object.entries(voteData)) {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const barWidth = total > 0 ? (count / maxCount) * 100 : 0;
        
        // Find the treasure data
        const treasureInfo = allTreasures.find(t => t.name === treasureName) || {};
        const isCorrect = treasureInfo.isCorrect || false;
        
        const barRow = document.createElement("div");
        barRow.className = `bar-row ${isCorrect ? 'correct-answer' : ''}`;
        
        // Treasure info (image + name)
        const treasureCell = document.createElement("div");
        treasureCell.className = "treasure-cell";
        
        if (treasureInfo.imageUrl) {
            const thumbImg = document.createElement("img");
            thumbImg.src = treasureInfo.imageUrl;
            thumbImg.alt = treasureName;
            thumbImg.className = "result-thumbnail";
            thumbImg.onerror = function() {
                this.style.display = 'none';
            };
            treasureCell.appendChild(thumbImg);
        }
        
        const nameSpan = document.createElement("span");
        nameSpan.className = "result-treasure-name";
        nameSpan.textContent = treasureName;
        if (isCorrect) {
            nameSpan.innerHTML += ' <span class="correct-badge">✓ 正确答案</span>';
        }
        treasureCell.appendChild(nameSpan);
        
        // Bar container
        const barCell = document.createElement("div");
        barCell.className = "bar-cell";
        
        const barWrapper = document.createElement("div");
        barWrapper.className = "bar-wrapper";
        
        const bar = document.createElement("div");
        bar.className = `horizontal-bar ${isCorrect ? 'correct-bar' : ''}`;
        bar.style.width = `${barWidth}%`;
        
        const barLabel = document.createElement("span");
        barLabel.className = "bar-stats";
        barLabel.textContent = `${count}人 (${percentage}%)`;
        
        barWrapper.appendChild(bar);
        barWrapper.appendChild(barLabel);
        barCell.appendChild(barWrapper);
        
        barRow.appendChild(treasureCell);
        barRow.appendChild(barCell);
        barChart.appendChild(barRow);
    }

    chartContainer.appendChild(barChart);
    return chartContainer;
}

/**
 * Creates the answer reveal section
 * @returns {HTMLElement} Answer section element
 */
function createAnswerSection() {
    const answerSection = document.createElement("div");
    answerSection.className = "answer-section";
    
    // Find the correct treasure
    const correctTreasure = allTreasures.find(t => t.isCorrect);
    
    if (correctTreasure) {
        answerSection.innerHTML = `
            <div class="answer-card">
                <h3>🏆 正确答案</h3>
                <div class="answer-content">
                    <img src="${correctTreasure.imageUrl}" alt="${correctTreasure.name}" class="answer-image" onerror="this.style.display='none'">
                    <div class="answer-info">
                        <p class="answer-name">${correctTreasure.name}</p>
                        <p class="answer-museum">来自：${correctTreasure.museumName || '首都博物馆'}</p>
                        ${correctTreasure.description ? `<p class="answer-desc">${correctTreasure.description}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    return answerSection;
}

/**
 * Adds improved summary statistics to result display
 * @param {HTMLElement} container - Container element
 * @param {Object} voteData - Vote data object
 */
function addImprovedStatistics(container, voteData) {
    const total = Object.values(voteData).reduce((a, b) => a + b, 0);
    
    // Find correct answer percentage
    const correctTreasure = allTreasures.find(t => t.isCorrect);
    const correctCount = correctTreasure ? (voteData[correctTreasure.name] || 0) : 0;
    const correctPercentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    const statsSection = document.createElement("div");
    statsSection.className = "stats-section";
    statsSection.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-number">${total}</span>
                <span class="stat-label">总参与人数</span>
            </div>
            <div class="stat-card highlight">
                <span class="stat-number">${correctPercentage}%</span>
                <span class="stat-label">答对率</span>
            </div>
        </div>
        <p class="stats-timestamp">统计时间: ${new Date().toLocaleString('zh-CN')}</p>
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
            const museumSection = document.getElementById('museumSection');
            const result = document.getElementById('result');
            
            if (questionnaire) questionnaire.style.display = 'none';
            if (museumSection) museumSection.style.display = 'none';
            if (result) result.style.display = 'block';
            
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
