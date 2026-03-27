/**
 * 古代容器猜猜看 - 闯关模式
 * 展示博物馆容器类文物，用户猜容器类型，猜对继续，猜错结束
 */

const surveyConfig = {
    title: '古代容器猜猜看',
    storageKey: 'vesselQuiz.data',
    kvStoreEndpoint: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore'
};

/**
 * 容器类型知识库
 */
const VESSEL_TYPES = {
    '鼎': { emoji: '🏺', desc: '三足或四足的烹煮器/礼器，古代最重要的礼器' },
    '尊': { emoji: '🍶', desc: '大口圆腹的盛酒器，常用于祭祀' },
    '壶': { emoji: '🫖', desc: '长颈有盖的盛酒或盛水器' },
    '盘': { emoji: '🍽️', desc: '浅圆形的盛水器或承器' },
    '杯': { emoji: '🥂', desc: '单手持的饮酒器' },
    '瓶': { emoji: '🏺', desc: '窄口长颈的储存器，也用于陈设观赏' },
    '钟': { emoji: '🔔', desc: '青铜打击乐器，成套使用称为编钟' },
    '灯': { emoji: '🪔', desc: '古代照明用器具' },
    '炉': { emoji: '🔥', desc: '焚香或取暖用器' }
};

/**
 * 题库 - 来自已有博物馆藏品数据
 */
const QUIZ_QUESTIONS = [
    {
        name: '后母戊鼎',
        type: '鼎',
        museum: '中国国家博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/%E5%90%8E%E6%AF%8D%E6%88%8A%E9%BC%8E.png/960px-%E5%90%8E%E6%AF%8D%E6%88%8A%E9%BC%8E.png',
        tip: '世界上最重的青铜器（832公斤），商代铸造，是母亲的纪念礼器'
    },
    {
        name: '大克鼎',
        type: '鼎',
        museum: '上海博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Da_Ke_ding.jpg/960px-Da_Ke_ding.jpg',
        tip: '西周青铜重器，内刻290字铭文，"海内三宝"之一'
    },
    {
        name: '大盂鼎',
        type: '鼎',
        museum: '中国国家博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Da_Yu_ding.jpg/960px-Da_Yu_ding.jpg',
        tip: '西周青铜器，291字铭文记录周康王赏赐贵族盂的故事'
    },
    {
        name: '西周太保鼎',
        type: '鼎',
        museum: '天津博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/%E5%A4%A9%E6%B4%A5%E5%8D%9A%E7%89%A9%E9%A6%86.png/960px-%E5%A4%A9%E6%B4%A5%E5%8D%9A%E7%89%A9%E9%A6%86.png',
        tip: '"梁山七器"中唯一留在中国的四足方鼎'
    },
    {
        name: '四羊方尊',
        type: '尊',
        museum: '中国国家博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Square_zun_with_four_sheep_01.jpg',
        tip: '商代最大的青铜方尊，四角各有一只卷角羊'
    },
    {
        name: '曾侯乙尊盘（尊）',
        type: '尊',
        museum: '湖北省博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/%E6%9B%BE%E4%BE%AF%E4%B9%99%E9%9D%92%E9%93%9C%E5%B0%8A%E7%9B%98%EF%BC%8C2015-04-06_01.jpg/960px-%E6%9B%BE%E4%BE%AF%E4%B9%99%E9%9D%92%E9%93%9C%E5%B0%8A%E7%9B%98%EF%BC%8C2015-04-06_01.jpg',
        tip: '上面的酒壶部分，失蜡法铸造的青铜巅峰之作'
    },
    {
        name: '鎏金舞马衔杯纹银壶',
        type: '壶',
        museum: '陕西历史博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Tang_Gold_and_Silver_Flask_with_Dancing_Horse_%289949851325%29.jpg/960px-Tang_Gold_and_Silver_Flask_with_Dancing_Horse_%289949851325%29.jpg',
        tip: '唐代银壶，刻有舞马叼杯祝寿图案，形似游牧民族皮囊壶'
    },
    {
        name: '青釉提梁倒注壶',
        type: '壶',
        museum: '陕西历史博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/%E9%9D%92%E9%87%89%E6%8F%90%E6%A2%81%E5%80%92%E6%B3%A8%E7%93%B7%E5%A3%B6_20140502.JPG/960px-%E9%9D%92%E9%87%89%E6%8F%90%E6%A2%81%E5%80%92%E6%B3%A8%E7%93%B7%E5%A3%B6_20140502.JPG',
        tip: '从底部灌水正放不漏的900年"黑科技"，利用虹吸原理'
    },
    {
        name: '金瓯永固杯',
        type: '杯',
        museum: '故宫博物院',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/%E9%87%91%E7%93%AF%E6%B0%B8%E5%9B%BA%E6%9D%AF_%E6%95%85%E5%AE%AB%E7%8F%8D%E5%AE%9D%E9%A6%86.jpg/960px-%E9%87%91%E7%93%AF%E6%B0%B8%E5%9B%BA%E6%9D%AF_%E6%95%85%E5%AE%AB%E7%8F%8D%E5%AE%9D%E9%A6%86.jpg',
        tip: '乾隆皇帝元旦喝"屠苏酒"的黄金杯，三只象鼻做杯脚'
    },
    {
        name: '兽首玛瑙杯',
        type: '杯',
        museum: '陕西历史博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/%E5%94%90-%E7%8E%9B%E7%91%99%E5%85%BD%E9%A6%96%E6%9D%AF.jpg/960px-%E5%94%90-%E7%8E%9B%E7%91%99%E5%85%BD%E9%A6%96%E6%9D%AF.jpg',
        tip: '唐代来通杯，整块红色缠丝玛瑙雕成，禁止出境展览'
    },
    {
        name: '元青花四爱图梅瓶',
        type: '瓶',
        museum: '湖北省博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/%E5%85%83%E9%9D%92%E8%8A%B1%E5%9B%9B%E7%88%B1%E5%9B%BE%E6%A2%85%E7%93%B6.jpg/960px-%E5%85%83%E9%9D%92%E8%8A%B1%E5%9B%9B%E7%88%B1%E5%9B%BE%E6%A2%85%E7%93%B6.jpg',
        tip: '元代极品青花瓷，画王羲之爱兰、陶渊明爱菊等四爱图'
    },
    {
        name: '曾侯乙编钟',
        type: '钟',
        museum: '湖北省博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Bianzhong_of_Marquis_Yi_of_Zeng_Wuhan.jpg/960px-Bianzhong_of_Marquis_Yi_of_Zeng_Wuhan.jpg',
        tip: '65件编钟共2.5吨，每钟能敲出两个音，2400年前的交响乐团'
    },
    {
        name: '晋侯稣编钟',
        type: '钟',
        museum: '上海博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bells_of_Marquis_Su_of_Jin.jpg/960px-Bells_of_Marquis_Su_of_Jin.jpg',
        tip: '西周16件编钟，刻有355字最长铭文'
    },
    {
        name: '错银铜牛灯',
        type: '灯',
        museum: '南京博物院',
        image: '',
        tip: '汉代环保油灯，烟经牛角导管进入牛腹水中过滤'
    },
    {
        name: '商鞅方升',
        type: '量器',
        museum: '上海博物馆',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/%E5%95%86%E9%9E%85%E6%96%B9%E5%8D%87_163919.jpg/960px-%E5%95%86%E9%9E%85%E6%96%B9%E5%8D%87_163919.jpg',
        tip: '秦国标准量杯，商鞅变法统一度量衡的实物证据'
    }
];

// Add 量器 to VESSEL_TYPES
VESSEL_TYPES['量器'] = { emoji: '📏', desc: '古代标准计量容器，用于统一度量衡' };

const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">' +
    '<rect fill="#f5f5f5" width="200" height="150" rx="8"/>' +
    '<text x="100" y="75" text-anchor="middle" dy=".3em" fill="#999" font-size="14">🏺 图片加载中</text>' +
    '</svg>'
);

/** App State */
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let results = []; // {type, correct: bool}
let crowdData = {};

/** Initialize */
async function initializeApp() {
    checkUrlParameters();
    // Load crowd data
    getConfig(surveyConfig.storageKey, (data) => {
        if (data) crowdData = data;
    });
    startQuiz();
}

function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('finishedAd') === 'false') {
        if (typeof ks !== 'undefined' && ks.navigateBack) {
            ks.navigateBack();
        }
        return;
    }
    if (urlParams.get('finishedAd') === 'true') {
        showResultsDirectly();
    }
}

function startQuiz() {
    // Filter out questions without images, then shuffle
    questions = QUIZ_QUESTIONS.filter(q => q.image).sort(() => Math.random() - 0.5);
    currentIndex = 0;
    correctCount = 0;
    results = [];

    document.getElementById('result').style.display = 'none';
    document.getElementById('quizArea').style.display = '';
    updateProgress();
    showQuestion();
}

function updateProgress() {
    const total = questions.length;
    const pct = total > 0 ? ((currentIndex) / total * 100) : 0;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressText').textContent = `${currentIndex}/${total}`;
}

function showQuestion() {
    if (currentIndex >= questions.length) {
        endQuiz(true);
        return;
    }

    const q = questions[currentIndex];
    const img = document.getElementById('treasureImage');
    img.src = q.image || FALLBACK_IMAGE;
    img.onerror = function() { this.src = FALLBACK_IMAGE; };
    document.getElementById('treasureName').textContent = q.name;
    document.getElementById('treasureMuseum').textContent = q.museum;

    // Generate 4 options: correct + 3 random distractors
    const allTypes = Object.keys(VESSEL_TYPES);
    const distractors = allTypes.filter(t => t !== q.type).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [q.type, ...distractors].sort(() => Math.random() - 0.5);

    const container = document.getElementById('optionsContainer');
    container.innerHTML = options.map((type, i) =>
        `<button class="option-btn" onclick="selectAnswer('${type}')">
            <span class="option-emoji">${VESSEL_TYPES[type].emoji}</span>
            <span class="option-text">${type}</span>
        </button>`
    ).join('');

    document.getElementById('feedbackOverlay').style.display = 'none';
}

function selectAnswer(selectedType) {
    const q = questions[currentIndex];
    const correct = selectedType === q.type;

    results.push({ type: q.type, correct });

    // Update crowd stats
    const totalKey = q.type + '_total';
    const correctKey = q.type + '_correct';
    crowdData[totalKey] = (crowdData[totalKey] || 0) + 1;
    if (correct) {
        crowdData[correctKey] = (crowdData[correctKey] || 0) + 1;
        correctCount++;
    }

    // Save to KV Store
    updateConfig(surveyConfig.storageKey, crowdData);

    if (correct) {
        showFeedback(true, q);
        setTimeout(() => {
            currentIndex++;
            updateProgress();
            showQuestion();
        }, 1000);
    } else {
        showFeedback(false, q);
        setTimeout(() => endQuiz(false), 2500);
    }
}

function showFeedback(correct, question) {
    const overlay = document.getElementById('feedbackOverlay');
    const content = document.getElementById('feedbackContent');
    overlay.style.display = 'flex';

    if (correct) {
        content.innerHTML = `
            <div class="feedback-correct">
                <div class="feedback-icon">✅</div>
                <div class="feedback-text">答对了！连对 ${correctCount} 题</div>
            </div>`;
    } else {
        content.innerHTML = `
            <div class="feedback-wrong">
                <div class="feedback-icon">❌</div>
                <div class="feedback-text">答错了！正确答案是<strong>${question.type}</strong></div>
                <div class="feedback-tip">${VESSEL_TYPES[question.type].desc}</div>
                <div class="feedback-detail">${question.tip}</div>
            </div>`;
    }
}

function endQuiz(allCorrect) {
    document.getElementById('quizArea').style.display = 'none';
    // Show ad before results
    showAd();
}

function showAd() {
    if (typeof ks !== 'undefined' && ks.navigateTo) {
        ks.navigateTo({
            url: '/pages/rewardedWebview/rewardedWebview?target=survey/vessel-quiz&flow=rewarded'
        });
    } else {
        showResultsDirectly();
    }
}

function showResultsDirectly() {
    document.getElementById('quizArea').style.display = 'none';
    document.getElementById('result').style.display = 'block';

    getConfig(surveyConfig.storageKey, (data) => {
        if (data) crowdData = data;
        renderResults();
    });
}

function renderResults() {
    const total = results.length;
    const allCorrect = total > 0 && correctCount === questions.length;

    // Header
    const header = document.getElementById('resultHeader');
    if (allCorrect) {
        header.innerHTML = '<div class="result-emoji">🏆</div><div class="result-title">完美通关！你是容器大师！</div>';
    } else if (correctCount >= total * 0.7) {
        header.innerHTML = '<div class="result-emoji">👏</div><div class="result-title">很厉害！你对古代容器很了解</div>';
    } else if (correctCount > 0) {
        header.innerHTML = '<div class="result-emoji">💪</div><div class="result-title">继续加油！多逛博物馆就能认识更多</div>';
    } else {
        header.innerHTML = '<div class="result-emoji">🤔</div><div class="result-title">没关系！去博物馆看看实物就记住了</div>';
    }

    // Score
    document.getElementById('resultScore').innerHTML =
        `<div class="score-big">${correctCount}<span class="score-slash">/${total}</span></div>
         <div class="score-label">答对题数</div>`;

    // Comparison: my accuracy vs crowd average per vessel type
    const typeStats = {};
    results.forEach(r => {
        if (!typeStats[r.type]) typeStats[r.type] = { my_correct: 0, my_total: 0 };
        typeStats[r.type].my_total++;
        if (r.correct) typeStats[r.type].my_correct++;
    });

    let compHtml = '<div class="comparison-title">各容器类型猜对率</div>';
    compHtml += '<div class="comparison-grid">';
    for (const [type, stats] of Object.entries(typeStats)) {
        const myPct = stats.my_total > 0 ? Math.round(stats.my_correct / stats.my_total * 100) : 0;
        const crowdTotal = crowdData[type + '_total'] || 0;
        const crowdCorrect = crowdData[type + '_correct'] || 0;
        const crowdPct = crowdTotal > 0 ? Math.round(crowdCorrect / crowdTotal * 100) : 0;

        compHtml += `
            <div class="comparison-item">
                <div class="comparison-type">${VESSEL_TYPES[type] ? VESSEL_TYPES[type].emoji : ''} ${type}</div>
                <div class="comparison-bars">
                    <div class="comparison-bar">
                        <span class="bar-label">你</span>
                        <div class="bar-track"><div class="bar-fill bar-mine" style="width:${myPct}%"></div></div>
                        <span class="bar-pct">${myPct}%</span>
                    </div>
                    <div class="comparison-bar">
                        <span class="bar-label">大众</span>
                        <div class="bar-track"><div class="bar-fill bar-crowd" style="width:${crowdPct}%"></div></div>
                        <span class="bar-pct">${crowdPct}%</span>
                    </div>
                </div>
            </div>`;
    }
    compHtml += '</div>';
    document.getElementById('resultComparison').innerHTML = compHtml;
}

function restartQuiz() {
    startQuiz();
}

function jumpToIndex() {
    if (typeof ks !== 'undefined' && ks.navigateTo) {
        ks.navigateTo({ url: '/pages/index/index' });
    } else {
        window.location.href = '../index.html';
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
