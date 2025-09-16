
// ===== APPLICATION CONSTANTS =====
// UI Timing Constants
const UI_CONSTANTS = {
    ANIMATION: {
        HIGHLIGHT_DURATION: 2000,           // Duration for element highlighting (ms)
        TRANSITION_DURATION: 300,           // Standard transition duration (ms)
        MODAL_OPEN_DELAY: 500,             // Delay before opening modal (ms)
        NOTIFICATION_DURATION: 2500,        // Default notification display duration (ms)
        NOTIFICATION_DURATION_LARGE: 3500   // Extended notification duration for large content (ms)
    },
    
    COLORS: {
        HIGHLIGHT_DEFAULT: 'rgba(59, 130, 246, 0.2)',  // Default highlight color
        TRANSITION_PROPERTY: 'background-color 0.3s ease-in-out'  // Standard transition
    }
};

// DOM Selector Constants for better maintainability
const DOM_SELECTORS = {
    AGE_GROUP: {
        RADIO_BUTTONS: 'input[name="ageGroup"]',
        CHECKED_RADIO: 'input[name="ageGroup"]:checked',
        OPTIONS: '.age-option',
        SELECTED_OPTION: '.age-option.selected'
    },
    
    SEARCH: {
        INPUT: '#museumSearch',
        CLEAR_BUTTON: '#clearSearch'
    },
    
    MODALS: {
        MUSEUM_MODAL: '#museumModal',
        MUSEUM_MODAL_CLOSE: '#museumModal .close',
        ACHIEVEMENT_MODAL: '#achievementModal',
        ACHIEVEMENT_MODAL_CLOSE: '#achievementModal .close',
        ASSESSMENT_HISTORY_MODAL: '#assessmentHistoryModal',
        ASSESSMENT_HISTORY_MODAL_CLOSE: '#assessmentHistoryModal .close'
    },
    
    BUTTONS: {
        ACHIEVEMENT: '#achievementButton',
        ASSESSMENT_HISTORY: '#assessmentHistoryButton'
    },
    
    ELEMENTS: {
        NOTIFICATION: '#notification',
        MUSEUM_GRID: '#museumGrid'
    }
};

// Application Configuration Constants
const APP_CONFIG = {
    LOCAL_STORAGE_KEYS: {
        VISITED_MUSEUMS: 'visitedMuseums',
        MUSEUM_CHECKLISTS: 'museumChecklists',
        CURRENT_AGE: 'currentAge',
        ASSESSMENT_HISTORY: 'museumCheckAssessmentHistory',
        SHARING_STATE: 'museumCheckSharingState'
    },
    
    AGE_GROUPS: ['3-6', '7-12', '13-18'],   // Supported age groups
    DEFAULT_AGE: '7-12',                    // Default age group for new users
    
    SEARCH: {
        MIN_QUERY_LENGTH: 0,                // Minimum characters to trigger search
        DEBOUNCE_DELAY: 300                 // Search input debounce delay (ms)
    }
};

// ===== UTILITY FUNCTIONS =====
// Small utility functions for common DOM operations and data handling
const UtilityFunctions = {
    // DOM helper functions
    querySelector: (selector) => document.querySelector(selector),
    querySelectorAll: (selector) => document.querySelectorAll(selector),
    getElementById: (id) => document.getElementById(id),
    
    // Age group helper functions  
    getSelectedAgeGroup: () => {
        const checkedRadio = document.querySelector(DOM_SELECTORS.AGE_GROUP.CHECKED_RADIO);
        return checkedRadio ? checkedRadio.value : APP_CONFIG.DEFAULT_AGE;
    },
    
    setSelectedAgeGroup: (ageGroup) => {
        const targetRadio = document.querySelector(`input[name="ageGroup"][value="${ageGroup}"]`);
        if (targetRadio) {
            targetRadio.checked = true;
            // Update visual state for browsers that don't support :has()
            document.querySelectorAll(DOM_SELECTORS.AGE_GROUP.OPTIONS).forEach(option => {
                option.classList.remove('selected');
            });
            targetRadio.closest('.age-option')?.classList.add('selected');
        }
    },
    
    // Local storage helper functions
    getFromStorage: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    },
    
    setToStorage: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Error writing to localStorage key "${key}":`, error);
            return false;
        }
    },
    
    // Validation helpers
    isValidAgeGroup: (ageGroup) => APP_CONFIG.AGE_GROUPS.includes(ageGroup),
    
    isValidMuseumId: (museumId, museums) => museums.some(m => m.id === museumId),
    
    // String helpers
    sanitizeString: (str) => str ? str.trim() : '',
    
    truncateString: (str, maxLength) => {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    },
    
    // Array helpers
    shuffleArray: (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // Event handling helpers
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ===== DATA VALIDATION MODULE =====
// Centralized data validation functions for better maintainability
const DataValidator = {
    // Museum data validation
    validateMuseumData: (museums) => {
        if (!Array.isArray(museums)) {
            return { isValid: false, errors: ['Museums must be an array'] };
        }
        
        const errors = [];
        const seenIds = new Set();
        const seenNames = new Set();
        
        museums.forEach((museum, index) => {
            const prefix = `Museum ${index}: `;
            
            // Check required fields
            if (!museum.id) errors.push(`${prefix}missing id`);
            if (!museum.name) errors.push(`${prefix}missing name`);
            if (!museum.location) errors.push(`${prefix}missing location`);
            
            // Check for duplicates
            if (museum.id && seenIds.has(museum.id)) {
                errors.push(`${prefix}duplicate id "${museum.id}"`);
            }
            if (museum.name && seenNames.has(museum.name)) {
                errors.push(`${prefix}duplicate name "${museum.name}"`);
            }
            
            if (museum.id) seenIds.add(museum.id);
            if (museum.name) seenNames.add(museum.name);
            
            // Validate checklists structure
            if (museum.checklists) {
                const checklistErrors = DataValidator.validateChecklistStructure(museum.checklists, prefix);
                errors.push(...checklistErrors);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors,
            stats: {
                totalCount: museums.length,
                uniqueIds: seenIds.size,
                uniqueNames: seenNames.size
            }
        };
    },
    
    validateChecklistStructure: (checklists, prefix = '') => {
        const errors = [];
        
        if (!checklists.parent || !checklists.child) {
            errors.push(`${prefix}missing parent or child checklists`);
            return errors;
        }
        
        APP_CONFIG.AGE_GROUPS.forEach(age => {
            if (!checklists.parent[age]) {
                errors.push(`${prefix}missing parent checklist for age ${age}`);
            }
            if (!checklists.child[age]) {
                errors.push(`${prefix}missing child checklist for age ${age}`);
            }
            
            if (checklists.parent[age] && !Array.isArray(checklists.parent[age])) {
                errors.push(`${prefix}parent checklist for age ${age} must be an array`);
            }
            if (checklists.child[age] && !Array.isArray(checklists.child[age])) {
                errors.push(`${prefix}child checklist for age ${age} must be an array`);
            }
        });
        
        return errors;
    },
    
    // Local storage data validation
    validateStorageData: (key, data, expectedType = 'object') => {
        try {
            if (expectedType === 'array' && !Array.isArray(data)) {
                return { isValid: false, error: `${key} should be an array` };
            }
            if (expectedType === 'object' && (typeof data !== 'object' || data === null)) {
                return { isValid: false, error: `${key} should be an object` };
            }
            return { isValid: true };
        } catch (error) {
            return { isValid: false, error: `${key} validation failed: ${error.message}` };
        }
    },
    
    // Age group validation
    validateAgeGroup: (ageGroup) => {
        return {
            isValid: APP_CONFIG.AGE_GROUPS.includes(ageGroup),
            error: APP_CONFIG.AGE_GROUPS.includes(ageGroup) ? null : 
                  `Invalid age group: ${ageGroup}. Must be one of: ${APP_CONFIG.AGE_GROUPS.join(', ')}`
        };
    }
};

// ===== STORAGE MANAGER MODULE =====  
// Centralized local storage management with error handling and validation
const StorageManager = {
    // Enhanced storage operations with validation
    safeGet: (key, defaultValue = null, expectedType = 'object') => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            const validation = DataValidator.validateStorageData(key, parsed, expectedType);
            
            if (!validation.isValid) {
                console.warn(`Storage validation failed for ${key}:`, validation.error);
                return defaultValue;
            }
            
            return parsed;
        } catch (error) {
            console.warn(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    },
    
    safeSet: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return { success: true };
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return { 
                    success: false, 
                    error: 'Storage quota exceeded', 
                    shouldClearOldData: true 
                };
            }
            console.warn(`Error writing to localStorage key "${key}":`, error);
            return { success: false, error: error.message };
        }
    },
    
    // Specialized getters for app data
    getVisitedMuseums: () => {
        return StorageManager.safeGet(APP_CONFIG.LOCAL_STORAGE_KEYS.VISITED_MUSEUMS, [], 'array');
    },
    
    getMuseumChecklists: () => {
        return StorageManager.safeGet(APP_CONFIG.LOCAL_STORAGE_KEYS.MUSEUM_CHECKLISTS, {}, 'object');
    },
    
    getCurrentAge: () => {
        const age = StorageManager.safeGet(APP_CONFIG.LOCAL_STORAGE_KEYS.CURRENT_AGE, APP_CONFIG.DEFAULT_AGE, 'string');
        const validation = DataValidator.validateAgeGroup(age);
        return validation.isValid ? age : APP_CONFIG.DEFAULT_AGE;
    },
    
    getAssessmentHistory: () => {
        return StorageManager.safeGet(APP_CONFIG.LOCAL_STORAGE_KEYS.ASSESSMENT_HISTORY, [], 'array');
    },
    
    getSharingState: () => {
        return StorageManager.safeGet(APP_CONFIG.LOCAL_STORAGE_KEYS.SHARING_STATE, {}, 'object');
    },
    
    // Batch operations for efficiency
    batchSet: (operations) => {
        const results = [];
        for (const { key, value } of operations) {
            results.push({ key, ...StorageManager.safeSet(key, value) });
        }
        return results;
    },
    
    // Storage cleanup utilities
    getStorageUsage: () => {
        let totalSize = 0;
        const details = {};
        
        Object.values(APP_CONFIG.LOCAL_STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            const size = item ? item.length : 0;
            details[key] = size;
            totalSize += size;
        });
        
        return { totalSize, details };
    },
    
    clearExpiredData: (maxAge = 90 * 24 * 60 * 60 * 1000) => { // 90 days default
        const now = Date.now();
        const assessmentHistory = StorageManager.getAssessmentHistory();
        
        const filteredHistory = assessmentHistory.filter(entry => 
            entry.timestamp && (now - entry.timestamp) < maxAge
        );
        
        if (filteredHistory.length !== assessmentHistory.length) {
            StorageManager.safeSet(APP_CONFIG.LOCAL_STORAGE_KEYS.ASSESSMENT_HISTORY, filteredHistory);
            return { cleaned: true, removed: assessmentHistory.length - filteredHistory.length };
        }
        
        return { cleaned: false, removed: 0 };
    }
};

// ===== EXPERT GUIDANCE SYSTEM =====
// Enhanced expert guidance system for parent-child interactions based on developmental psychology
const EXPERT_GUIDANCE = {
    '3-6': {
        cognitiveStage: '具象运思期 (皮亚杰认知发展)',
        relationshipFocus: {
            coreGoal: '通过共同探索博物馆，建立安全依恋关系，增进亲子情感连接，为孩子一生的幸福奠定基础',
            relationshipMetrics: [
                '👁️ 眼神接触频率：每次参观增加30%以上的眼神交流时间',
                '🤗 身体亲密度：增加拥抱、牵手等身体接触的自然发生',
                '💬 主动分享：孩子主动向家长分享发现和感受的次数',
                '😊 共同快乐：家长和孩子同时展现快乐表情的时刻',
                '🎯 合作完成：共同完成观察任务时的默契程度',
                '💖 情感表达：孩子向家长表达爱意和感激的增加'
            ],
            relationshipBenefits: '亲子博物馆之旅能显著提升孩子的安全感、自信心和情感表达能力，同时增强家长的育儿效能感和亲子连接深度。每一次共同探索都是关系银行的存款，为青春期及成年后的良好关系打下坚实基础。'
        },
        developmentalTraits: '通过感官和具体操作学习，好奇心强，注意力短暂，喜欢重复和模仿，开始发展语言和象征思维。此阶段是建立安全依恋关系和基础认知能力的关键期。博物馆共同探索为亲子关系发展提供了理想的情境。',
        parentingTips: [
            '🧠 认知引导：用具体形象的语言描述，多用比喻和故事，避免抽象概念。每个解释都是情感连接的机会',
            '⏰ 注意力管理：参观时间控制在1-2小时内，每15-20分钟变换活动形式。关注孩子需求体现你的爱与关怀',
            '👥 互动技巧：多用"看看这个"、"数一数"、"摸摸这里"等感官引导语言，创造肌肤相亲的温暖时刻',
            '🎯 学习目标：培养观察兴趣和基础认知，重在体验而非知识灌输。共同发现比教导更能加深亲子连接',
            '💬 对话策略：开放式提问"你看到了什么颜色/形状"，而非封闭式"这是什么"。倾听回应建立信任基础',
            '🏃 身体需求：准备充足的水和健康零食，允许适当走动和休息。细致关怀让孩子感受到被爱护',
            '🎪 游戏化学习：用角色扮演、寻宝游戏等方式增加趣味性。共同游戏创造珍贵的快乐回忆',
            '📸 记忆巩固：及时拍照记录，回家后一起回顾加深印象。共同回忆强化亲子情感纽带',
            '🧘 正念陪伴：保持当下的专注，感受孩子的情绪状态，避免急躁催促。专注陪伴是最好的爱的表达',
            '🎨 创意表达：鼓励孩子用画画、动作或语言表达看到的内容。赞美每个创意展现无条件的爱'
        ],
        emotionalSupport: [
            '🤗 身体语言：用拥抱、牵手等身体接触表达爱意和安全感，每次接触都是关系的投资',
            '👏 即时鼓励：对每个小发现都给予及时赞美和肯定，让孩子感受到被看见和被欣赏',
            '😊 情绪调节：观察孩子情绪变化，及时调整参观节奏，展现对孩子内心世界的关注',
            '🛡️ 安全感建立：创造安全的探索环境，让孩子敢于表达，奠定终生信任的基石',
            '💖 无条件接纳：接受孩子的所有情绪反应，不评判不批评，让爱无条件地流淌',
            '🌈 情绪命名：帮助孩子识别和表达情绪："你现在是兴奋还是紧张？"提升情感智力和亲密度'
        ],
        attachmentStrategies: [
            '👁️ 眼神交流：经常与孩子进行眼神接触，传递专注和爱意',
            '🗣️ 情感回应：及时回应孩子的需求和信号，建立信任感',
            '🤲 共同关注：指向同一个展品，建立共享体验和连接',
            '🎵 语调温和：用温暖、平静的语调与孩子交流'
        ],
        dialogueStarters: [
            '"这个颜色像什么呀？"',
            '"你觉得这个小动物在做什么？"',
            '"如果你是古代小朋友，会用这个做什么？"',
            '"这个和我们家的什么东西很像？"',
            '"你最喜欢这里的什么？为什么？"',
            '"这个让你想到了什么有趣的事情？"'
        ],
        inclusiveSupport: [
            '🌟 个体差异：尊重每个孩子的独特节奏和兴趣点',
            '👂 感官友好：注意声音、光线、人群对敏感孩子的影响',
            '🔄 灵活调整：根据孩子状态随时调整参观计划和方式',
            '🛟 安全退路：始终准备好安静的休息或离开选择'
        ],
        commonChallenges: [
            {
                situation: '孩子注意力不集中',
                solution: '变换互动方式，增加游戏元素，及时表扬关注行为',
                preventionTips: '提前了解孩子的兴趣点，准备相关小道具或贴纸奖励'
            },
            {
                situation: '对展品不感兴趣',
                solution: '找相关的故事或生活连接，用孩子熟悉的事物做比喻',
                preventionTips: '从孩子最感兴趣的展品开始，建立正面的博物馆体验'
            },
            {
                situation: '情绪不佳或疲惫',
                solution: '立即寻找休息区，提供食物和拥抱，考虑结束参观',
                preventionTips: '观察孩子的疲劳信号，在情绪恶化前主动休息'
            },
            {
                situation: '想要触摸展品',
                solution: '温和阻止并解释原因，提供可触摸的替代体验',
                preventionTips: '提前说明博物馆规则，准备触感玩具满足触觉需求'
            },
            {
                situation: '在安静环境中大声说话',
                solution: '轻声提醒并示范小声说话，用游戏方式练习',
                preventionTips: '进入前玩"小声说话"游戏，建立安静参观的习惯'
            }
        ]
    },
    '7-12': {
        cognitiveStage: '具体运思期 (皮亚杰认知发展)',
        relationshipFocus: {
            coreGoal: '通过共同学习探索，建立平等互信的亲子关系，培养孩子的自信心和亲密沟通能力',
            relationshipMetrics: [
                '🤝 对话深度：从简单问答发展为深度对话的频率增加',
                '🎯 合作解决：共同解决问题和完成挑战的成功体验',
                '💡 创意分享：孩子主动分享创意想法并获得支持的次数',
                '👂 倾听质量：家长专注倾听孩子想法的时间和质量',
                '🏆 成就分享：孩子愿意与家长分享成功和挫折的开放度',
                '😄 幽默互动：亲子间轻松幽默互动的自然增加'
            ],
            relationshipBenefits: '这个阶段的亲子博物馆体验能建立起深度的沟通模式和互相尊重的关系基础，为青春期的良好沟通奠定基础。孩子会感受到被理解和支持，家长会更深入了解孩子的内心世界。'
        },
        developmentalTraits: '逻辑思维发展，能理解因果关系，开始分类整理，喜欢收集和比较，有强烈的求知欲。此阶段是培养学习技能、建立自我效能感和发展友谊的关键期。亲子共同探索能显著提升关系质量和互相理解。',
        parentingTips: [
            '🧠 认知引导：鼓励分类、比较、总结，培养逻辑推理能力',
            '📚 知识整合：将博物馆内容与学校知识结合，建立知识网络',
            '🤔 思维启发：多问"为什么"、"你觉得呢"、"还能想到什么"',
            '📝 记录培养：鼓励画图记录、文字描述，培养表达能力',
            '👥 社会学习：支持与同伴交流讨论，学会分享和合作',
            '🎯 成就系统：设置阶梯式挑战，及时认可努力和进步',
            '🔍 探究精神：鼓励提出假设和验证，培养科学思维',
            '🎭 角色体验：通过角色扮演深化历史文化理解',
            '⚖️ 近发展区：根据孩子能力提供恰当支持，促进独立学习',
            '🎨 多元表达：支持不同的学习和表达方式，发现孩子的优势智能'
        ],
        emotionalSupport: [
            '🎯 自主性支持：尊重孩子的选择和兴趣方向，避免过度控制',
            '🏆 能力感培养：认可孩子的独特观点，增强自信心',
            '🤝 平等对话：用讨论而非教导的方式交流，建立互信',
            '📚 内在动机：培养对学习本身的热爱，而非外在奖励',
            '🌟 成长思维：强调努力和过程而非天赋和结果',
            '👭 社交支持：帮助建立积极的同伴关系，学会合作与分享'
        ],
        scaffoldingTechniques: [
            '🏗️ 认知支架：提供思维框架帮助孩子组织复杂信息',
            '❓ 引导提问：用苏格拉底式提问引导孩子自主发现',
            '📊 可视化工具：用图表、地图等工具帮助理解抽象概念',
            '🔗 连接建构：帮助孩子将新知识与已有经验连接'
        ],
        dialogueStarters: [
            '"这让你想起了什么？"',
            '"如果你生活在那个时代会怎样？"',
            '"这个和你学过的哪个知识有关系？"',
            '"你能发现什么有趣的规律吗？"',
            '"你会如何向朋友介绍这个展品？"',
            '"这个发现改变了你的什么想法？"'
        ],
        inclusiveSupport: [
            '🎨 学习风格：识别并适应孩子的学习偏好（视觉、听觉、动觉）',
            '⏰ 个人节奏：允许孩子按自己的速度深入感兴趣的展品',
            '🔄 多样选择：提供不同的参与方式，照顾不同性格的孩子',
            '🌈 情绪调适：理解学龄期孩子的情绪波动和压力来源'
        ],
        commonChallenges: [
            {
                situation: '对某些展品表现冷淡',
                solution: '寻找与孩子兴趣的连接点，用比较法激发好奇心',
                preventionTips: '提前了解孩子的学习项目和兴趣，选择相关展品重点参观'
            },
            {
                situation: '想要快速浏览所有展品',
                solution: '引导深度观察，"慢下来"比"看得多"更有价值',
                preventionTips: '制定参观计划，选择3-5个重点展品进行深入探索'
            },
            {
                situation: '与同伴比较产生挫折感',
                solution: '强调每个人的独特发现，避免竞争式学习',
                preventionTips: '事先建立"每个人都有自己的发现"的参观原则'
            },
            {
                situation: '觉得内容太幼稚或太难',
                solution: '调整互动层次，提供适合认知水平的挑战',
                preventionTips: '准备多层次的问题，根据孩子反应灵活调整'
            },
            {
                situation: '被朋友影响注意力分散',
                solution: '建立小组合作任务，将社交转化为学习动力',
                preventionTips: '提前与其他家长协调，建立统一的参观规则'
            }
        ]
    },
    '13-18': {
        cognitiveStage: '抽象运思期 (皮亚杰认知发展)',
        relationshipFocus: {
            coreGoal: '通过深度文化探讨，建立成人般的平等关系，培养青少年的独立思考能力和亲密度表达',
            relationshipMetrics: [
                '🗣️ 开放沟通：青少年主动与家长分享深层思考和情感的频率',
                '🤝 相互尊重：家长和青少年在观点分歧时仍能保持尊重交流',
                '💭 价值探讨：共同探讨人生价值和意义的深度对话时间',
                '🌟 身份支持：家长对青少年个性发展和选择的理解与支持程度',
                '🎯 未来规划：共同讨论和规划未来的合作质量',
                '💖 情感表达：青少年愿意向家长表达真实情感的开放度'
            ],
            relationshipBenefits: '青春期的亲子博物馆体验能建立起成年后依然珍贵的深层连接，让家长成为孩子人生路上的智慧伙伴而非权威管理者。这种关系模式会影响孩子未来的人际关系和家庭建设能力。'
        },
        developmentalTraits: '抽象思维能力发展，能独立思考复杂问题，开始形成个人价值观和世界观，追求独立和认同。此阶段是建立身份认同、培养批判思维和准备成人角色的关键期。高质量的亲子关系能为这些发展任务提供最好的支持。',
        parentingTips: [
            '🧠 深度分析：引导分析历史文化的深层意义和当代价值',
            '🤝 平等对话：以合作伙伴的方式交流，尊重青少年的独立思考',
            '🎯 价值引导：通过文物历史引导思考人生意义和社会责任',
            '📊 批判思维：鼓励质疑和辩论，培养独立判断能力',
            '🌍 全球视野：连接国际文化，培养文化自信和包容胸怀',
            '📱 现代联系：引导思考传统文化与现代科技、生活的融合',
            '🎓 学术深度：支持深入研究感兴趣的专题，培养学者精神',
            '💭 哲学思考：通过文化现象思考人性、社会、价值等深层问题',
            '🦋 身份探索：支持青少年通过文化学习探索自我身份和价值观',
            '🔮 未来导向：引导思考文化传承对个人和社会未来的意义'
        ],
        emotionalSupport: [
            '🤗 理解支持：理解青春期的情绪波动和寻求独立的需要',
            '🎯 目标引导：帮助建立人生目标，支持兴趣和专长发展',
            '🗣️ 倾听尊重：认真倾听他们的想法，即使不完全赞同',
            '🌟 个性认同：支持独特个性发展，避免过度期望和控制',
            '💪 自主决策：在安全范围内支持他们做出独立选择',
            '🌈 情绪管理：教导健康的压力和情绪管理技巧'
        ],
        autonomySupport: [
            '🎯 自主选择：让青少年主导参观路线和重点内容选择',
            '📚 独立研究：鼓励他们提前研究感兴趣的展品或历史',
            '🎤 观点表达：创造机会让他们分享自己的理解和观点',
            '🤝 对等讨论：避免居高临下的教导，进行平等的学术讨论'
        ],
        dialogueStarters: [
            '"这个现象反映了什么社会问题？"',
            '"你认为这种传统在现代还有意义吗？"',
            '"如果你是博物馆馆长，会如何展示这段历史？"',
            '"这给你的人生带来了什么启发？"',
            '"这个文化现象与现代社会有什么相似之处？"',
            '"你如何看待传统与创新的关系？"'
        ],
        inclusiveSupport: [
            '🌍 文化敏感：理解不同文化背景青少年的观点差异',
            '💡 学习差异：支持不同学习能力和兴趣方向的青少年',
            '🧘 心理健康：关注青春期常见的心理压力和焦虑问题',
            '🎭 角色压力：理解学业、社交、家庭期望等多重压力'
        ],
        commonChallenges: [
            {
                situation: '表现出对传统文化的轻视',
                solution: '引导发现传统与现代的连接，避免说教式纠正',
                preventionTips: '选择与现代生活相关的展品，展示传统文化的现代价值'
            },
            {
                situation: '过于沉迷手机而忽视展品',
                solution: '引导用技术增强体验，如拍照研究、查阅资料',
                preventionTips: '事先商定手机使用规则，将数字技术作为学习工具'
            },
            {
                situation: '对家长指导表现反感',
                solution: '转变为平等讨论，给予更多独立探索空间',
                preventionTips: '建立互相尊重的参观协议，明确各自的角色和期望'
            },
            {
                situation: '觉得博物馆内容枯燥无趣',
                solution: '寻找与个人兴趣和未来规划相关的连接点',
                preventionTips: '提前了解青少年的专业兴趣和职业规划，选择相关展品'
            },
            {
                situation: '对深度讨论缺乏兴趣',
                solution: '从轻松话题开始，逐渐引入有意义的讨论',
                preventionTips: '营造轻松的氛围，避免过于严肃的学术讨论开场'
            }
        ]
    }
};

// Assessment and reflection tools for parent-child interactions
const ASSESSMENT_TOOLS = {
    engagementIndicators: {
        '3-6': [
            '✅ 孩子主动指向和询问展品',
            '✅ 能专注观察15-20分钟',
            '✅ 愿意分享自己的发现',
            '✅ 表现出好奇和兴奋',
            '✅ 能记住并重复感兴趣的内容'
        ],
        '7-12': [
            '✅ 主动提出深度问题',
            '✅ 能将展品与已学知识连接',
            '✅ 表现出独立探索的欲望',
            '✅ 愿意记录和总结观察',
            '✅ 与他人分享学习心得'
        ],
        '13-18': [
            '✅ 进行批判性思考和分析',
            '✅ 主动寻找更多相关信息',
            '✅ 表达个人观点和见解',
            '✅ 关注文化的现代意义',
            '✅ 思考个人身份和价值观'
        ]
    },
    reflectionPrompts: {
        parentSelfReflection: [
            '我今天有多少时间真正在倾听孩子？',
            '我是否给予了孩子足够的自主探索空间？',
            '我的提问是否激发了孩子的思考？',
            '我是否及时回应了孩子的情感需求？',
            '我今天学到了关于孩子的什么新东西？'
        ],
        familyReflection: [
            '今天我们最有意思的发现是什么？',
            '哪个展品让我们印象最深刻？为什么？',
            '我们学到了什么以前不知道的知识？',
            '今天的博物馆之旅让我们感觉如何？',
            '我们下次想要探索什么主题？'
        ]
    }
};

// Crisis management and behavior support strategies
const CRISIS_MANAGEMENT = {
    meltdownPrevention: [
        '🔍 观察早期信号：疲劳、饥饿、过度刺激的迹象',
        '⏰ 预防性休息：在问题出现前主动安排休息',
        '🎯 降低期望：根据孩子状态调整参观目标',
        '🆘 准备退出策略：始终有计划B和安全退路'
    ],
    meltdownResponse: [
        '🧘 保持冷静：家长情绪稳定是处理危机的基础',
        '🤗 提供安慰：身体接触和温和语言给予安全感',
        '📍 寻找安静空间：立即转移到人少的地方',
        '⏱️ 允许情绪：不急于纠正，让孩子表达情感',
        '💧 满足基本需求：检查是否饿了、渴了、累了'
    ],
    overstimulationSigns: [
        '😵 感觉标志：频繁揉眼睛、捂耳朵、说太吵太亮',
        '😤 行为标志：变得粘人、易怒、注意力涣散',
        '😰 情绪标志：突然哭闹、退缩、拒绝参与',
        '🏃 身体标志：坐立不安、想要离开、疲惫表现'
    ]
};

// Enhanced multiple intelligence activation strategies with specific activities
const MULTIPLE_INTELLIGENCE_STRATEGIES = {
    linguistic: {
        name: '语言智能',
        description: '通过讲故事、描述、讨论激发',
        activities: ['讲解展品故事', '描述观察内容', '提问和回答', '制作解说词']
    },
    logical: {
        name: '逻辑智能', 
        description: '通过分类、比较、推理培养',
        activities: ['文物分类游戏', '时间序列排列', '因果关系分析', '数据观察记录']
    },
    spatial: {
        name: '空间智能',
        description: '通过观察建筑、绘画、想象开发', 
        activities: ['建筑结构观察', '空间方位认知', '图形绘制', '立体想象']
    },
    bodily: {
        name: '肢体智能',
        description: '通过模仿、体验、动手操作发展',
        activities: ['古代动作模仿', '传统工艺体验', '手工制作', '身体测量对比']
    },
    musical: {
        name: '音乐智能',
        description: '通过节奏、韵律、音乐欣赏培养',
        activities: ['古代音乐聆听', '节拍感知', '声音模仿', '韵律诗歌']
    },
    interpersonal: {
        name: '人际智能',
        description: '通过合作、分享、交流提升',
        activities: ['团队讨论', '角色分工', '经验分享', '合作解谜']
    },
    intrapersonal: {
        name: '内省智能',
        description: '通过反思、记录、总结增强',
        activities: ['个人感受记录', '学习反思日记', '价值观思考', '自我评估']
    },
    naturalist: {
        name: '自然智能',
        description: '通过观察、分类、保护意识培养',
        activities: ['材质分类识别', '环境观察', '生态思考', '保护意识培养']
    }
};

// ===== UI MANAGEMENT MODULE =====
// Centralized UI operations and DOM manipulation functions
const UIManager = {
    // Modal management
    showModal: (modalId) => {
        const modal = UtilityFunctions.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
    },
    
    hideModal: (modalId) => {
        const modal = UtilityFunctions.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            // Restore body scroll
            document.body.style.overflow = '';
        }
    },
    
    // Notification system
    showNotification: (message, duration = UI_CONSTANTS.ANIMATION.NOTIFICATION_DURATION, type = 'info') => {
        const notification = UtilityFunctions.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, UI_CONSTANTS.ANIMATION.TRANSITION_DURATION);
        }, duration);
    },
    
    // Element visibility management
    showElement: (element) => {
        if (element) {
            element.style.display = 'block';
            element.classList.remove('hidden');
        }
    },
    
    hideElement: (element) => {
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    },
    
    toggleElement: (element) => {
        if (element) {
            const isHidden = element.classList.contains('hidden') || element.style.display === 'none';
            if (isHidden) {
                UIManager.showElement(element);
            } else {
                UIManager.hideElement(element);
            }
        }
    },
    
    // Form management
    clearForm: (formElement) => {
        if (formElement) {
            const inputs = formElement.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    },
    
    // Loading states
    setLoadingState: (element, isLoading = true, loadingText = '加载中...') => {
        if (!element) return;
        
        if (isLoading) {
            element.dataset.originalText = element.textContent;
            element.textContent = loadingText;
            element.disabled = true;
            element.classList.add('loading');
        } else {
            element.textContent = element.dataset.originalText || element.textContent;
            element.disabled = false;
            element.classList.remove('loading');
            delete element.dataset.originalText;
        }
    },
    
    // Highlighting and animations
    highlightElement: (element, duration = UI_CONSTANTS.ANIMATION.HIGHLIGHT_DURATION) => {
        if (!element) return;
        
        const originalBackground = element.style.backgroundColor;
        const originalTransition = element.style.transition;
        
        element.style.transition = UI_CONSTANTS.COLORS.TRANSITION_PROPERTY;
        element.style.backgroundColor = UI_CONSTANTS.COLORS.HIGHLIGHT_DEFAULT;
        
        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            setTimeout(() => {
                element.style.transition = originalTransition;
            }, UI_CONSTANTS.ANIMATION.TRANSITION_DURATION);
        }, duration);
    },
    
    // Text utilities
    updateCounter: (element, count, total = null, formatFn = null) => {
        if (!element) return;
        
        let text;
        if (formatFn && typeof formatFn === 'function') {
            text = formatFn(count, total);
        } else if (total !== null) {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            text = `${count}/${total} (${percentage}%)`;
        } else {
            text = count.toString();
        }
        
        element.textContent = text;
    },
    
    // Responsive utilities
    isMobileView: () => window.innerWidth <= 768,
    
    addResponsiveClass: (element, mobileClass, desktopClass) => {
        if (!element) return;
        
        const removeClass = UIManager.isMobileView() ? desktopClass : mobileClass;
        const addClass = UIManager.isMobileView() ? mobileClass : desktopClass;
        
        if (removeClass) element.classList.remove(removeClass);
        if (addClass) element.classList.add(addClass);
    },
    
    // Scroll utilities
    scrollToTop: (smooth = true) => {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },
    
    scrollToElement: (element, offset = 0, smooth = true) => {
        if (!element) return;
        
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
            top: elementTop - offset,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }
};

// Specific conversation techniques for different age groups
const CONVERSATION_TECHNIQUES = {
    '3-6': {
        questionTypes: {
            observation: ['你看到了什么颜色？', '这个像什么形状？', '你发现了几个小动物？'],
            sensory: ['摸起来会是什么感觉？', '听起来像什么声音？', '闻起来是什么味道？'],
            imagination: ['你觉得这是做什么用的？', '古代小朋友会怎么玩？', '如果是你的会怎么用？'],
            emotional: ['你喜欢这个吗？', '这让你想到什么开心的事？', '你觉得美不美？']
        },
        responseStrategies: [
            '重复孩子的话表示理解',
            '用"哇"、"真的吗"等感叹表达共鸣',
            '将孩子的观察与生活经验连接',
            '给予具体的表扬："你的眼睛真厉害"'
        ]
    },
    '7-12': {
        questionTypes: {
            analysis: ['为什么会这样设计？', '你能找出什么规律？', '这和那个有什么不同？'],
            connection: ['这让你想起了什么？', '和你学过的知识有关系吗？', '现在还有类似的吗？'],
            evaluation: ['你觉得哪个更好？为什么？', '如果是你会怎么改进？', '什么地方最有趣？'],
            creation: ['你能设计一个类似的吗？', '如果你是工匠会怎么做？', '能想出新的用法吗？']
        },
        responseStrategies: [
            '认真倾听孩子的想法',
            '用"原来如此"、"你说得有道理"回应',
            '提出延伸问题引导深入思考',
            '分享自己的观点但不强加'
        ]
    },
    '13-18': {
        questionTypes: {
            critical: ['你如何评价这种观点？', '有什么不同的角度？', '这反映了什么问题？'],
            philosophical: ['这说明了什么价值观？', '对现代有什么意义？', '你的人生感悟是什么？'],
            creative: ['如果重新设计会怎样？', '现代技术能如何改进？', '你会如何创新？'],
            social: ['这对社会有什么影响？', '不同文化会如何处理？', '未来会如何发展？']
        },
        responseStrategies: [
            '平等对话，避免权威姿态',
            '承认他们观点的价值',
            '分享而非灌输自己的见解',
            '鼓励独立思考和判断'
        ]
    }
};

// Single source of truth for museum count - automatically calculated
const MUSEUM_COUNT = MUSEUMS.length;

// ===== ASSESSMENT MANAGER MODULE =====
// AssessmentManager - Centralized parent-child assessment operations
class AssessmentManager {
    constructor(app, analyticsManager) {
        this.app = app;
        this.analyticsManager = analyticsManager;
        this.currentAssessment = null;
        this.assessmentHistory = [];
        this.loadAssessmentHistory();
    }
    
    loadAssessmentHistory() {
        try {
            const stored = localStorage.getItem('assessment_history');
            this.assessmentHistory = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load assessment history:', error);
            this.assessmentHistory = [];
        }
    }
    
    saveAssessmentHistory() {
        try {
            localStorage.setItem('assessment_history', JSON.stringify(this.assessmentHistory));
        } catch (error) {
            console.warn('Failed to save assessment history:', error);
        }
    }
    
    startAssessment(museumId, options = {}) {
        const museum = MUSEUMS.find(m => m.id === museumId);
        if (!museum) {
            throw new Error(`Museum with ID ${museumId} not found`);
        }
        
        const {
            parentAge = 35,
            childAge = 8,
            assessmentType = 'full', // 'full', 'quick', 'follow-up'
            resumeFrom = null
        } = options;
        
        this.currentAssessment = {
            id: Date.now().toString(),
            museumId: museumId,
            museumName: museum.name,
            startTime: new Date().toISOString(),
            parentAge: parentAge,
            childAge: childAge,
            assessmentType: assessmentType,
            status: 'in_progress',
            currentStep: resumeFrom || 1,
            steps: this.generateAssessmentSteps(assessmentType),
            responses: {
                parent: {},
                child: {},
                observation: {}
            },
            scores: {
                communication: 0,
                engagement: 0,
                learning: 0,
                bonding: 0,
                overall: 0
            }
        };
        
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('assessment_started', {
                museum_id: museumId,
                assessment_type: assessmentType,
                parent_age: parentAge,
                child_age: childAge,
                resume_from: resumeFrom
            });
        }
        
        return this.currentAssessment;
    }
    
    generateAssessmentSteps(assessmentType) {
        const baseSteps = [
            {
                id: 1,
                title: '参观前准备',
                type: 'parent',
                questions: [
                    '您对这次博物馆之行的期待是什么？',
                    '您希望孩子从这次参观中学到什么？',
                    '您提前做了哪些准备工作？'
                ]
            },
            {
                id: 2,
                title: '孩子期待调查',
                type: 'child',
                questions: [
                    '你对去博物馆有什么感觉？',
                    '你最想看到什么？',
                    '你有什么问题想要了解吗？'
                ]
            },
            {
                id: 3,
                title: '参观过程观察',
                type: 'observation',
                questions: [
                    '亲子互动频率如何？',
                    '孩子的参与度和兴趣程度',
                    '家长的引导方式和效果',
                    '遇到的挑战和解决方式'
                ]
            },
            {
                id: 4,
                title: '参观后反思',
                type: 'parent',
                questions: [
                    '这次参观达到了您的期望吗？',
                    '您觉得孩子有什么收获？',
                    '有什么可以改进的地方？'
                ]
            },
            {
                id: 5,
                title: '孩子感受分享',
                type: 'child',
                questions: [
                    '你最喜欢的展品是什么？',
                    '你学到了什么新知识？',
                    '下次还想来博物馆吗？'
                ]
            },
            {
                id: 6,
                title: '关系评估',
                type: 'relationship',
                questions: [
                    '这次活动增进了您与孩子的关系吗？',
                    '您们在参观过程中的沟通效果如何？',
                    '您对未来的亲子文化活动有什么计划？'
                ]
            }
        ];
        
        if (assessmentType === 'quick') {
            return baseSteps.slice(0, 4); // 只保留前4步
        } else if (assessmentType === 'follow-up') {
            return baseSteps.slice(3); // 从第4步开始
        }
        
        return baseSteps;
    }
    
    recordResponse(stepId, questionIndex, response, responseType = 'text') {
        if (!this.currentAssessment) {
            throw new Error('No active assessment found');
        }
        
        const step = this.currentAssessment.steps.find(s => s.id === stepId);
        if (!step) {
            throw new Error(`Step ${stepId} not found`);
        }
        
        if (!this.currentAssessment.responses[step.type]) {
            this.currentAssessment.responses[step.type] = {};
        }
        
        if (!this.currentAssessment.responses[step.type][stepId]) {
            this.currentAssessment.responses[step.type][stepId] = {};
        }
        
        this.currentAssessment.responses[step.type][stepId][questionIndex] = {
            response: response,
            type: responseType,
            timestamp: new Date().toISOString()
        };
        
        // Auto-save progress
        this.saveAssessmentProgress();
    }
    
    saveAssessmentProgress() {
        if (!this.currentAssessment) return;
        
        try {
            localStorage.setItem('current_assessment_progress', JSON.stringify(this.currentAssessment));
        } catch (error) {
            console.warn('Failed to save assessment progress:', error);
        }
    }
    
    loadAssessmentProgress() {
        try {
            const stored = localStorage.getItem('current_assessment_progress');
            if (stored) {
                this.currentAssessment = JSON.parse(stored);
                return this.currentAssessment;
            }
        } catch (error) {
            console.warn('Failed to load assessment progress:', error);
        }
        return null;
    }
    
    clearAssessmentProgress() {
        try {
            localStorage.removeItem('current_assessment_progress');
        } catch (error) {
            console.warn('Failed to clear assessment progress:', error);
        }
    }
    
    calculateScores() {
        if (!this.currentAssessment) {
            throw new Error('No active assessment found');
        }
        
        const responses = this.currentAssessment.responses;
        const scores = {
            communication: 0,
            engagement: 0,
            learning: 0,
            bonding: 0,
            overall: 0
        };
        
        // Basic scoring algorithm - can be enhanced with ML/AI
        let totalResponses = 0;
        let positiveResponses = 0;
        
        // Count positive indicators in responses
        Object.values(responses).forEach(typeResponses => {
            Object.values(typeResponses).forEach(stepResponses => {
                Object.values(stepResponses).forEach(response => {
                    totalResponses++;
                    
                    // Simple sentiment analysis (could be enhanced)
                    const text = response.response.toLowerCase();
                    const positiveWords = ['好', '很好', '非常', '喜欢', '开心', '有趣', '学到', '收获', '满意'];
                    const hasPositive = positiveWords.some(word => text.includes(word));
                    
                    if (hasPositive) {
                        positiveResponses++;
                    }
                });
            });
        });
        
        // Calculate base score
        const baseScore = totalResponses > 0 ? (positiveResponses / totalResponses) * 100 : 50;
        
        // Apply scores to different categories
        scores.communication = Math.min(100, baseScore + Math.random() * 10 - 5);
        scores.engagement = Math.min(100, baseScore + Math.random() * 10 - 5);
        scores.learning = Math.min(100, baseScore + Math.random() * 10 - 5);
        scores.bonding = Math.min(100, baseScore + Math.random() * 10 - 5);
        scores.overall = (scores.communication + scores.engagement + scores.learning + scores.bonding) / 4;
        
        // Round scores
        Object.keys(scores).forEach(key => {
            scores[key] = Math.round(scores[key] * 10) / 10;
        });
        
        this.currentAssessment.scores = scores;
        return scores;
    }
    
    completeAssessment() {
        if (!this.currentAssessment) {
            throw new Error('No active assessment found');
        }
        
        // Calculate final scores
        const scores = this.calculateScores();
        
        // Finalize assessment
        this.currentAssessment.status = 'completed';
        this.currentAssessment.endTime = new Date().toISOString();
        this.currentAssessment.duration = new Date(this.currentAssessment.endTime).getTime() - 
                                         new Date(this.currentAssessment.startTime).getTime();
        
        // Add to history
        this.assessmentHistory.push({ ...this.currentAssessment });
        this.saveAssessmentHistory();
        
        // Clear progress
        this.clearAssessmentProgress();
        
        // Track completion
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('assessment_completed', {
                museum_id: this.currentAssessment.museumId,
                assessment_type: this.currentAssessment.assessmentType,
                duration: this.currentAssessment.duration,
                overall_score: scores.overall,
                communication_score: scores.communication,
                engagement_score: scores.engagement,
                learning_score: scores.learning,
                bonding_score: scores.bonding
            });
        }
        
        const completedAssessment = { ...this.currentAssessment };
        this.currentAssessment = null;
        
        return completedAssessment;
    }
    
    generateRecommendations(assessment) {
        const scores = assessment.scores;
        const recommendations = [];
        
        if (scores.communication < 70) {
            recommendations.push({
                category: 'communication',
                title: '加强亲子沟通',
                suggestions: [
                    '参观时多问开放性问题，如"你觉得这个展品怎么样？"',
                    '鼓励孩子表达自己的想法和感受',
                    '认真倾听孩子的问题，及时给予回应'
                ]
            });
        }
        
        if (scores.engagement < 70) {
            recommendations.push({
                category: 'engagement',
                title: '提升孩子参与度',
                suggestions: [
                    '选择孩子感兴趣的展区先参观',
                    '使用互动式讲解方式，让孩子参与其中',
                    '适当安排休息时间，避免疲劳'
                ]
            });
        }
        
        if (scores.learning < 70) {
            recommendations.push({
                category: 'learning',
                title: '增强学习效果',
                suggestions: [
                    '参观前做适当的知识准备',
                    '参观后进行总结和分享',
                    '将博物馆知识与日常生活联系起来'
                ]
            });
        }
        
        if (scores.bonding < 70) {
            recommendations.push({
                category: 'bonding',
                title: '深化亲子关系',
                suggestions: [
                    '创造更多互动机会，如一起完成任务',
                    '分享自己的感受和经历',
                    '制定下次参观的计划'
                ]
            });
        }
        
        return recommendations;
    }
    
    getAssessmentHistory(limit = null) {
        const history = [...this.assessmentHistory].reverse(); // 最新的在前
        return limit ? history.slice(0, limit) : history;
    }
    
    getAssessmentById(assessmentId) {
        return this.assessmentHistory.find(a => a.id === assessmentId);
    }
    
    exportAssessmentData(assessmentId = null) {
        if (assessmentId) {
            const assessment = this.getAssessmentById(assessmentId);
            return assessment ? {
                export_date: new Date().toISOString(),
                assessment: assessment,
                recommendations: this.generateRecommendations(assessment)
            } : null;
        }
        
        return {
            export_date: new Date().toISOString(),
            total_assessments: this.assessmentHistory.length,
            assessments: this.assessmentHistory.map(a => ({
                ...a,
                recommendations: this.generateRecommendations(a)
            }))
        };
    }
    
    getAssessmentStats() {
        if (this.assessmentHistory.length === 0) {
            return {
                total: 0,
                averageScores: { overall: 0, communication: 0, engagement: 0, learning: 0, bonding: 0 },
                mostAssessedMuseum: null,
                assessmentFrequency: 0
            };
        }
        
        const totalAssessments = this.assessmentHistory.length;
        const averageScores = {
            overall: 0,
            communication: 0,
            engagement: 0,
            learning: 0,
            bonding: 0
        };
        
        // Calculate averages
        this.assessmentHistory.forEach(assessment => {
            Object.keys(averageScores).forEach(key => {
                averageScores[key] += assessment.scores[key];
            });
        });
        
        Object.keys(averageScores).forEach(key => {
            averageScores[key] = Math.round((averageScores[key] / totalAssessments) * 10) / 10;
        });
        
        // Find most assessed museum
        const museumCounts = {};
        this.assessmentHistory.forEach(assessment => {
            museumCounts[assessment.museumId] = (museumCounts[assessment.museumId] || 0) + 1;
        });
        
        const mostAssessedMuseumId = Object.keys(museumCounts).reduce((a, b) => 
            museumCounts[a] > museumCounts[b] ? a : b
        );
        
        const mostAssessedMuseum = MUSEUMS.find(m => m.id === mostAssessedMuseumId);
        
        return {
            total: totalAssessments,
            averageScores: averageScores,
            mostAssessedMuseum: mostAssessedMuseum,
            assessmentFrequency: totalAssessments
        };
    }
}

// ===== MUSEUM MANAGER MODULE =====
// MuseumManager - Centralized museum check-in and management operations
class MuseumManager {
    constructor(app, analyticsManager) {
        this.app = app;
        this.analyticsManager = analyticsManager;
        this.visitCache = new Set();
        this.initializeCache();
    }
    
    initializeCache() {
        const visitedMuseums = this.app.loadVisitedMuseums();
        this.visitCache = new Set(visitedMuseums);
    }
    
    checkInMuseum(museumId) {
        const museum = this.getMuseumById(museumId);
        if (!museum) {
            throw new Error(`Museum with ID ${museumId} not found`);
        }
        
        const wasAlreadyVisited = this.isMuseumVisited(museumId);
        
        if (!wasAlreadyVisited) {
            this.visitCache.add(museumId);
            const visitedArray = Array.from(this.visitCache);
            this.app.saveVisitedMuseums(visitedArray);
            
            // Track analytics
            if (this.analyticsManager) {
                this.analyticsManager.trackEvent('museum_checked_in', {
                    museum_id: museumId,
                    museum_name: museum.name,
                    museum_location: museum.location,
                    total_visited: visitedArray.length,
                    visit_date: new Date().toISOString()
                });
            }
            
            return {
                success: true,
                wasNew: true,
                totalVisited: visitedArray.length,
                museum: museum
            };
        }
        
        return {
            success: true,
            wasNew: false,
            totalVisited: this.visitCache.size,
            museum: museum
        };
    }
    
    checkOutMuseum(museumId) {
        const museum = this.getMuseumById(museumId);
        if (!museum) {
            throw new Error(`Museum with ID ${museumId} not found`);
        }
        
        const wasVisited = this.isMuseumVisited(museumId);
        
        if (wasVisited) {
            this.visitCache.delete(museumId);
            const visitedArray = Array.from(this.visitCache);
            this.app.saveVisitedMuseums(visitedArray);
            
            // Track analytics
            if (this.analyticsManager) {
                this.analyticsManager.trackEvent('museum_checked_out', {
                    museum_id: museumId,
                    museum_name: museum.name,
                    total_visited: visitedArray.length,
                    checkout_date: new Date().toISOString()
                });
            }
            
            return {
                success: true,
                wasVisited: true,
                totalVisited: visitedArray.length,
                museum: museum
            };
        }
        
        return {
            success: true,
            wasVisited: false,
            totalVisited: this.visitCache.size,
            museum: museum
        };
    }
    
    isMuseumVisited(museumId) {
        return this.visitCache.has(museumId);
    }
    
    getMuseumById(museumId) {
        return MUSEUMS.find(museum => museum.id === museumId);
    }
    
    getVisitedMuseums() {
        return Array.from(this.visitCache).map(id => this.getMuseumById(id)).filter(Boolean);
    }
    
    getUnvisitedMuseums() {
        return MUSEUMS.filter(museum => !this.isMuseumVisited(museum.id));
    }
    
    getVisitStats() {
        const totalMuseums = MUSEUMS.length;
        const visitedCount = this.visitCache.size;
        const unvisitedCount = totalMuseums - visitedCount;
        const completionPercentage = totalMuseums > 0 ? Math.round((visitedCount / totalMuseums) * 100 * 10) / 10 : 0;
        
        return {
            total: totalMuseums,
            visited: visitedCount,
            unvisited: unvisitedCount,
            completionPercentage
        };
    }
    
    searchMuseums(query, options = {}) {
        const {
            includeVisited = true,
            includeUnvisited = true,
            filterByLocation = null,
            filterByTags = [],
            sortBy = 'name' // 'name', 'location', 'visited'
        } = options;
        
        let results = MUSEUMS;
        
        // Filter by visit status
        if (!includeVisited || !includeUnvisited) {
            results = results.filter(museum => {
                const isVisited = this.isMuseumVisited(museum.id);
                return (includeVisited && isVisited) || (includeUnvisited && !isVisited);
            });
        }
        
        // Filter by location
        if (filterByLocation) {
            results = results.filter(museum => 
                museum.location.toLowerCase().includes(filterByLocation.toLowerCase())
            );
        }
        
        // Filter by tags
        if (filterByTags.length > 0) {
            results = results.filter(museum => 
                museum.tags && museum.tags.some(tag => 
                    filterByTags.some(filterTag => 
                        tag.toLowerCase().includes(filterTag.toLowerCase())
                    )
                )
            );
        }
        
        // Text search
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            results = results.filter(museum => 
                museum.name.toLowerCase().includes(searchTerm) ||
                museum.location.toLowerCase().includes(searchTerm) ||
                museum.description.toLowerCase().includes(searchTerm) ||
                (museum.tags && museum.tags.some(tag => 
                    tag.toLowerCase().includes(searchTerm)
                ))
            );
        }
        
        // Sort results
        results.sort((a, b) => {
            switch (sortBy) {
                case 'location':
                    return a.location.localeCompare(b.location, 'zh-CN');
                case 'visited':
                    const aVisited = this.isMuseumVisited(a.id) ? 1 : 0;
                    const bVisited = this.isMuseumVisited(b.id) ? 1 : 0;
                    return bVisited - aVisited; // Visited first
                case 'name':
                default:
                    return a.name.localeCompare(b.name, 'zh-CN');
            }
        });
        
        return results;
    }
    
    getRecommendations(currentMuseumId = null, count = 5) {
        const visitedMuseums = this.getVisitedMuseums();
        const unvisitedMuseums = this.getUnvisitedMuseums();
        
        if (unvisitedMuseums.length === 0) {
            return [];
        }
        
        let recommendations = [];
        
        if (visitedMuseums.length > 0) {
            // Get recommendations based on visited museums
            const visitedLocations = [...new Set(visitedMuseums.map(m => m.location))];
            const visitedTags = [...new Set(visitedMuseums.flatMap(m => m.tags || []))];
            
            // Score unvisited museums based on similarity
            const scoredMuseums = unvisitedMuseums.map(museum => {
                let score = 0;
                
                // Location similarity
                if (visitedLocations.includes(museum.location)) {
                    score += 3;
                }
                
                // Tag similarity
                const commonTags = (museum.tags || []).filter(tag => visitedTags.includes(tag));
                score += commonTags.length * 2;
                
                // Exclude current museum from recommendations
                if (currentMuseumId === museum.id) {
                    score -= 10;
                }
                
                return { ...museum, score };
            });
            
            recommendations = scoredMuseums
                .sort((a, b) => b.score - a.score)
                .slice(0, count);
        } else {
            // For new users, recommend popular/famous museums
            const famousMuseumIds = ['forbidden-city', 'national-museum', 'shanghai-museum', 'terracotta-warriors'];
            const famousMuseums = famousMuseumIds
                .map(id => unvisitedMuseums.find(m => m.id === id))
                .filter(Boolean);
            
            recommendations = [
                ...famousMuseums,
                ...unvisitedMuseums.filter(m => !famousMuseumIds.includes(m.id))
            ].slice(0, count);
        }
        
        return recommendations;
    }
    
    exportVisitData() {
        const stats = this.getVisitStats();
        const visitedMuseums = this.getVisitedMuseums();
        
        return {
            export_date: new Date().toISOString(),
            stats: stats,
            visited_museums: visitedMuseums.map(museum => ({
                id: museum.id,
                name: museum.name,
                location: museum.location,
                tags: museum.tags
            })),
            recommendations: this.getRecommendations(null, 10)
        };
    }
    
    clearAllVisits() {
        this.visitCache.clear();
        this.app.saveVisitedMuseums([]);
        
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('all_visits_cleared', {
                timestamp: new Date().toISOString()
            });
        }
    }
    
    importVisitData(visitIds) {
        if (!Array.isArray(visitIds)) {
            throw new Error('Visit data must be an array of museum IDs');
        }
        
        // Validate all museum IDs exist
        const validIds = visitIds.filter(id => this.getMuseumById(id) !== null);
        
        this.visitCache = new Set(validIds);
        this.app.saveVisitedMuseums(Array.from(this.visitCache));
        
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('visit_data_imported', {
                total_imported: validIds.length,
                invalid_ids: visitIds.length - validIds.length,
                timestamp: new Date().toISOString()
            });
        }
        
        return {
            imported: validIds.length,
            invalid: visitIds.length - validIds.length,
            total: this.visitCache.size
        };
    }
}

// ===== CHECKLIST MANAGER MODULE =====
// ChecklistManager - Centralized checklist operations and management
class ChecklistManager {
    constructor(app, analyticsManager) {
        this.app = app;
        this.analyticsManager = analyticsManager;
        this.checklistCache = new Map();
        this.completionStats = new Map();
    }
    
    getMuseumChecklist(museumId, checklistType, ageGroup) {
        const museum = MUSEUMS.find(m => m.id === museumId);
        if (!museum || !museum.checklists) {
            return [];
        }
        
        const typeChecklists = museum.checklists[checklistType];
        if (!typeChecklists) {
            return [];
        }
        
        return typeChecklists[ageGroup] || [];
    }
    
    loadChecklistProgress(museumId, checklistType, ageGroup) {
        const key = `${museumId}-${checklistType}-${ageGroup}`;
        const allChecklists = this.app.loadMuseumChecklists();
        return allChecklists[key] || [];
    }
    
    saveChecklistProgress(museumId, checklistType, ageGroup, progress) {
        const key = `${museumId}-${checklistType}-${ageGroup}`;
        const allChecklists = this.app.loadMuseumChecklists();
        allChecklists[key] = progress;
        
        // Update cache
        this.checklistCache.set(key, progress);
        
        // Save to storage
        this.app.saveMuseumChecklists(allChecklists);
        
        // Track analytics
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('checklist_progress_saved', {
                museum_id: museumId,
                checklist_type: checklistType,
                age_group: ageGroup,
                completed_items: progress.length,
                completion_percentage: this.calculateCompletionPercentage(museumId, checklistType, ageGroup, progress)
            });
        }
    }
    
    toggleChecklistItem(museumId, checklistType, ageGroup, itemIndex, checked) {
        const progress = this.loadChecklistProgress(museumId, checklistType, ageGroup);
        
        if (checked) {
            if (!progress.includes(itemIndex)) {
                progress.push(itemIndex);
            }
        } else {
            const index = progress.indexOf(itemIndex);
            if (index > -1) {
                progress.splice(index, 1);
            }
        }
        
        this.saveChecklistProgress(museumId, checklistType, ageGroup, progress);
        
        // Track individual item toggle
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('checklist_item_toggled', {
                museum_id: museumId,
                checklist_type: checklistType,
                age_group: ageGroup,
                item_index: itemIndex,
                checked: checked,
                total_completed: progress.length
            });
        }
        
        return progress;
    }
    
    calculateCompletionPercentage(museumId, checklistType, ageGroup, progress = null) {
        const checklist = this.getMuseumChecklist(museumId, checklistType, ageGroup);
        if (!checklist || checklist.length === 0) {
            return 0;
        }
        
        const currentProgress = progress || this.loadChecklistProgress(museumId, checklistType, ageGroup);
        return Math.round((currentProgress.length / checklist.length) * 100);
    }
    
    getCompletionStats(museumId, ageGroup) {
        const stats = {
            parent: {
                total: 0,
                completed: 0,
                percentage: 0,
                items: []
            },
            child: {
                total: 0,
                completed: 0,
                percentage: 0,
                items: []
            }
        };
        
        ['parent', 'child'].forEach(type => {
            const checklist = this.getMuseumChecklist(museumId, type, ageGroup);
            const progress = this.loadChecklistProgress(museumId, type, ageGroup);
            
            stats[type].total = checklist.length;
            stats[type].completed = progress.length;
            stats[type].percentage = this.calculateCompletionPercentage(museumId, type, ageGroup, progress);
            stats[type].items = checklist.map((item, index) => ({
                text: item,
                completed: progress.includes(index),
                index: index
            }));
        });
        
        return stats;
    }
    
    clearChecklistProgress(museumId, checklistType, ageGroup) {
        const key = `${museumId}-${checklistType}-${ageGroup}`;
        const allChecklists = this.app.loadMuseumChecklists();
        
        if (allChecklists[key]) {
            delete allChecklists[key];
            this.app.saveMuseumChecklists(allChecklists);
            this.checklistCache.delete(key);
            
            // Track analytics
            if (this.analyticsManager) {
                this.analyticsManager.trackEvent('checklist_cleared', {
                    museum_id: museumId,
                    checklist_type: checklistType,
                    age_group: ageGroup
                });
            }
        }
    }
    
    isChecklistCompleted(museumId, checklistType, ageGroup) {
        const completion = this.calculateCompletionPercentage(museumId, checklistType, ageGroup);
        return completion === 100;
    }
    
    getOverallProgress(ageGroup) {
        const museums = MUSEUMS;
        let totalChecklists = 0;
        let completedChecklists = 0;
        
        museums.forEach(museum => {
            ['parent', 'child'].forEach(type => {
                const checklist = this.getMuseumChecklist(museum.id, type, ageGroup);
                if (checklist.length > 0) {
                    totalChecklists++;
                    if (this.isChecklistCompleted(museum.id, type, ageGroup)) {
                        completedChecklists++;
                    }
                }
            });
        });
        
        return {
            total: totalChecklists,
            completed: completedChecklists,
            percentage: totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0
        };
    }
    
    exportChecklistData(museumId = null, ageGroup = null) {
        const data = {
            export_date: new Date().toISOString(),
            museum_id: museumId,
            age_group: ageGroup,
            checklists: {}
        };
        
        if (museumId) {
            // Export specific museum
            const museum = MUSEUMS.find(m => m.id === museumId);
            if (museum) {
                data.museum_name = museum.name;
                data.checklists[museumId] = this.getCompletionStats(museumId, ageGroup);
            }
        } else {
            // Export all museums
            MUSEUMS.forEach(museum => {
                data.checklists[museum.id] = {
                    museum_name: museum.name,
                    stats: this.getCompletionStats(museum.id, ageGroup)
                };
            });
        }
        
        return data;
    }
    
    generateChecklistReport(ageGroup) {
        const overallProgress = this.getOverallProgress(ageGroup);
        const museumStats = [];
        
        MUSEUMS.forEach(museum => {
            const stats = this.getCompletionStats(museum.id, ageGroup);
            const totalItems = stats.parent.total + stats.child.total;
            const completedItems = stats.parent.completed + stats.child.completed;
            
            if (totalItems > 0) {
                museumStats.push({
                    id: museum.id,
                    name: museum.name,
                    location: museum.location,
                    totalItems,
                    completedItems,
                    completionPercentage: Math.round((completedItems / totalItems) * 100),
                    parentProgress: stats.parent,
                    childProgress: stats.child
                });
            }
        });
        
        // Sort by completion percentage (highest first)
        museumStats.sort((a, b) => b.completionPercentage - a.completionPercentage);
        
        return {
            overall: overallProgress,
            museums: museumStats,
            age_group: ageGroup,
            generated_at: new Date().toISOString()
        };
    }
}

// ===== ANALYTICS MANAGER MODULE =====
// Analytics Manager - Centralized analytics and reporting
class AnalyticsManager {
    constructor() {
        this.isGoogleAnalyticsEnabled = false;
        this.sessionStartTime = Date.now();
        this.eventQueue = [];
        this.userMetrics = {};
        this.initializeAnalytics();
    }
    
    initializeAnalytics() {
        // Check if Google Analytics is available
        if (typeof gtag === 'function') {
            this.isGoogleAnalyticsEnabled = true;
        }
        
        // Initialize user metrics
        this.userMetrics = {
            sessionId: this.generateSessionId(),
            userId: this.getUserId(),
            visitCount: this.getVisitCount(),
            sessionStartTime: this.sessionStartTime,
            lastActivityTime: this.sessionStartTime
        };
        
        // Track session start
        this.trackEvent('session_start', {
            session_id: this.userMetrics.sessionId,
            visit_count: this.userMetrics.visitCount
        });
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    getUserId() {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }
    
    getVisitCount() {
        let count = parseInt(localStorage.getItem('visit_count')) || 0;
        count++;
        localStorage.setItem('visit_count', count.toString());
        return count;
    }
    
    trackEvent(eventName, parameters = {}) {
        // Update last activity time
        this.userMetrics.lastActivityTime = Date.now();
        
        // Enhanced event parameters
        const enrichedParams = {
            ...parameters,
            session_id: this.userMetrics.sessionId,
            user_id: this.userMetrics.userId,
            timestamp: Date.now(),
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        };
        
        // Send to Google Analytics if available
        if (this.isGoogleAnalyticsEnabled) {
            try {
                gtag('event', eventName, enrichedParams);
            } catch (error) {
                console.warn('Failed to send event to Google Analytics:', error);
            }
        }
        
        // Queue event for local analytics
        this.eventQueue.push({
            event: eventName,
            parameters: enrichedParams
        });
        
        // Maintain event queue size (keep last 100 events)
        if (this.eventQueue.length > 100) {
            this.eventQueue = this.eventQueue.slice(-100);
        }
        
        // Store critical events in localStorage
        this.storeCriticalEvent(eventName, enrichedParams);
    }
    
    storeCriticalEvent(eventName, parameters) {
        const criticalEvents = [
            'museum_visited',
            'checklist_completed',
            'assessment_completed',
            'achievement_unlocked'
        ];
        
        if (criticalEvents.includes(eventName)) {
            try {
                const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
                stored.push({ event: eventName, parameters, timestamp: Date.now() });
                
                // Keep only last 50 critical events
                const trimmed = stored.slice(-50);
                localStorage.setItem('analytics_events', JSON.stringify(trimmed));
            } catch (error) {
                console.warn('Failed to store critical event:', error);
            }
        }
    }
    
    trackPageView(pageName, additionalParams = {}) {
        this.trackEvent('page_view', {
            page_name: pageName,
            page_location: window.location.href,
            ...additionalParams
        });
    }
    
    trackUserAction(action, category, label = '', value = 0) {
        this.trackEvent('user_action', {
            action_name: action,
            action_category: category,
            action_label: label,
            action_value: value
        });
    }
    
    trackMuseumInteraction(museumId, museumName, interactionType, additionalData = {}) {
        this.trackEvent('museum_interaction', {
            museum_id: museumId,
            museum_name: museumName,
            interaction_type: interactionType,
            ...additionalData
        });
    }
    
    trackPerformanceMetric(metricName, value, unit = '') {
        this.trackEvent('performance_metric', {
            metric_name: metricName,
            metric_value: value,
            metric_unit: unit,
            timestamp: Date.now()
        });
    }
    
    trackError(errorType, errorMessage, errorContext = {}) {
        this.trackEvent('error_occurred', {
            error_type: errorType,
            error_message: errorMessage,
            error_context: JSON.stringify(errorContext),
            timestamp: Date.now()
        });
    }
    
    getSessionAnalytics() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        const events = this.eventQueue.length;
        
        return {
            sessionId: this.userMetrics.sessionId,
            sessionDuration,
            totalEvents: events,
            eventsPerMinute: events / (sessionDuration / 60000),
            lastActivityTime: this.userMetrics.lastActivityTime
        };
    }
    
    getUserAnalytics() {
        try {
            const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            const checklistData = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
            const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            
            const completedChecklists = Object.keys(checklistData).reduce((count, key) => {
                const items = checklistData[key];
                return items && items.length > 0 ? count + 1 : count;
            }, 0);
            
            return {
                userId: this.userMetrics.userId,
                totalVisits: this.userMetrics.visitCount,
                visitedMuseumsCount: visitedMuseums.length,
                completedChecklistsCount: completedChecklists,
                totalStoredEvents: storedEvents.length,
                firstVisit: storedEvents.length > 0 ? storedEvents[0].timestamp : this.sessionStartTime,
                engagementScore: this.calculateEngagementScore(visitedMuseums.length, completedChecklists, events)
            };
        } catch (error) {
            console.warn('Failed to generate user analytics:', error);
            return null;
        }
    }
    
    calculateEngagementScore(visitedCount, checklistCount, eventCount) {
        // Simple engagement scoring algorithm
        const visitScore = Math.min(visitedCount * 5, 50);  // Max 50 points for visits
        const checklistScore = Math.min(checklistCount * 3, 30);  // Max 30 points for checklists
        const activityScore = Math.min(eventCount * 1, 20);  // Max 20 points for general activity
        
        return visitScore + checklistScore + activityScore;  // Max score: 100
    }
    
    generateAnalyticsReport() {
        const sessionData = this.getSessionAnalytics();
        const userData = this.getUserAnalytics();
        
        return {
            session: sessionData,
            user: userData,
            systemInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                onLine: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled
            },
            timestamp: Date.now(),
            reportVersion: '1.0'
        };
    }
    
    exportAnalyticsData() {
        try {
            const report = this.generateAnalyticsReport();
            const dataStr = JSON.stringify(report, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `museumcheck-analytics-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Failed to export analytics data:', error);
            return false;
        }
    }
    
    // Clean up old analytics data
    cleanupOldData(maxAgeMs = 30 * 24 * 60 * 60 * 1000) { // 30 days default
        try {
            const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            const cutoff = Date.now() - maxAgeMs;
            const filtered = stored.filter(event => event.timestamp > cutoff);
            
            if (filtered.length !== stored.length) {
                localStorage.setItem('analytics_events', JSON.stringify(filtered));
            }
            
            return stored.length - filtered.length; // Return number of cleaned items
        } catch (error) {
            console.warn('Failed to cleanup old analytics data:', error);
            return 0;
        }
    }
}

// ===== PHOTO MANAGER MODULE =====
// Photo Manager - Centralized photo and file management
class PhotoManager {
    constructor() {
        this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.compressionQuality = 0.8;
        this.maxDisplayWidth = 800;
        this.maxDisplayHeight = 600;
    }
    
    validatePhotoFile(file) {
        const errors = [];
        
        if (!file) {
            errors.push('No file provided');
            return { isValid: false, errors };
        }
        
        // Check file type
        if (!this.supportedImageTypes.includes(file.type)) {
            errors.push(`Unsupported file type: ${file.type}. Supported types: ${this.supportedImageTypes.join(', ')}`);
        }
        
        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`File size too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed: ${this.maxFileSize / (1024 * 1024)}MB`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }
        };
    }
    
    async compressImage(file, targetQuality = null) {
        return new Promise((resolve, reject) => {
            const quality = targetQuality || this.compressionQuality;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = this.calculateOptimalDimensions(img.width, img.height);
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw the resized image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob with compression
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                }, file.type, quality);
                
                // Clean up
                URL.revokeObjectURL(img.src);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image for compression'));
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    calculateOptimalDimensions(originalWidth, originalHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // Resize if larger than max dimensions
        if (width > this.maxDisplayWidth || height > this.maxDisplayHeight) {
            const widthRatio = this.maxDisplayWidth / width;
            const heightRatio = this.maxDisplayHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);
            
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        return { width, height };
    }
    
    async convertToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    async processPhotoUpload(file, shouldCompress = true) {
        try {
            // Validate the file first
            const validation = this.validatePhotoFile(file);
            if (!validation.isValid) {
                throw new Error(`Photo validation failed: ${validation.errors.join(', ')}`);
            }
            
            let processedFile = file;
            
            // Compress image if needed and requested
            if (shouldCompress && file.size > 500 * 1024) { // Compress files larger than 500KB
                processedFile = await this.compressImage(file);
            }
            
            // Convert to data URL for storage
            const dataURL = await this.convertToDataURL(processedFile);
            
            return {
                success: true,
                dataURL,
                originalSize: file.size,
                processedSize: processedFile.size,
                compressionRatio: processedFile.size / file.size,
                fileName: file.name,
                fileType: file.type
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    createPhotoElement(dataURL, altText = 'Uploaded photo', className = 'uploaded-photo') {
        const img = document.createElement('img');
        img.src = dataURL;
        img.alt = altText;
        img.className = className;
        img.loading = 'lazy';
        
        return img;
    }
    
    createPhotoPreview(dataURL, onRemove = null) {
        const container = document.createElement('div');
        container.className = 'photo-preview-container';
        
        const img = this.createPhotoElement(dataURL, 'Photo preview', 'photo-preview');
        container.appendChild(img);
        
        if (onRemove && typeof onRemove === 'function') {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'photo-remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(container);
            };
            container.appendChild(removeBtn);
        }
        
        return container;
    }
    
    getPhotoFileInfo(file) {
        return {
            name: file.name,
            size: this.formatFileSize(file.size),
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleString()
        };
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Clean up object URLs to prevent memory leaks
    cleanup(urls) {
        if (Array.isArray(urls)) {
            urls.forEach(url => {
                if (typeof url === 'string' && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        } else if (typeof urls === 'string' && urls.startsWith('blob:')) {
            URL.revokeObjectURL(urls);
        }
    }
}

// ===== MODAL MANAGER MODULE =====
// Modal Manager - Centralized modal operations
class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.modalConfigs = new Map();
        this.initializeModalConfigurations();
        this.bindGlobalEvents();
    }
    
    initializeModalConfigurations() {
        // Define modal-specific configurations
        this.modalConfigs.set('museumModal', {
            closeOnOutsideClick: true,
            closeOnEscape: true,
            focusTrap: true
        });
        
        this.modalConfigs.set('achievementModal', {
            closeOnOutsideClick: true,
            closeOnEscape: true,
            focusTrap: false
        });
        
        this.modalConfigs.set('assessmentModal', {
            closeOnOutsideClick: false,
            closeOnEscape: false,
            focusTrap: true
        });
        
        this.modalConfigs.set('settingsModal', {
            closeOnOutsideClick: true,
            closeOnEscape: true,
            focusTrap: false
        });
        
        this.modalConfigs.set('assessmentHistoryModal', {
            closeOnOutsideClick: true,
            closeOnEscape: true,
            focusTrap: false
        });
    }
    
    bindGlobalEvents() {
        // Handle ESC key for closing modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
        
        // Handle outside click for closing modals
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });
    }
    
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with id '${modalId}' not found`);
            return false;
        }
        
        const config = { ...this.modalConfigs.get(modalId), ...options };
        
        // Show the modal
        modal.classList.remove('hidden');
        this.activeModals.add(modalId);
        
        // Handle focus management
        if (config.focusTrap) {
            this.setupFocusTrap(modal);
        }
        
        // Prevent body scroll when modal is open
        document.body.classList.add('modal-open');
        
        return true;
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with id '${modalId}' not found`);
            return false;
        }
        
        // Hide the modal
        modal.classList.add('hidden');
        this.activeModals.delete(modalId);
        
        // Restore body scroll if no modals are open
        if (this.activeModals.size === 0) {
            document.body.classList.remove('modal-open');
        }
        
        return true;
    }
    
    closeAllModals() {
        Array.from(this.activeModals).forEach(modalId => {
            this.closeModal(modalId);
        });
    }
    
    isModalOpen(modalId) {
        return this.activeModals.has(modalId);
    }
    
    getActiveModals() {
        return Array.from(this.activeModals);
    }
    
    handleEscapeKey() {
        // Close the most recently opened modal that allows ESC closing
        for (const modalId of Array.from(this.activeModals).reverse()) {
            const config = this.modalConfigs.get(modalId);
            if (config && config.closeOnEscape) {
                this.closeModal(modalId);
                break;
            }
        }
    }
    
    handleOutsideClick(event) {
        // Check if click is outside any modal content
        for (const modalId of this.activeModals) {
            const config = this.modalConfigs.get(modalId);
            if (!config || !config.closeOnOutsideClick) continue;
            
            const modal = document.getElementById(modalId);
            if (!modal) continue;
            
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(event.target) && modal.contains(event.target)) {
                this.closeModal(modalId);
                break;
            }
        }
    }
    
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus the first element
        firstElement.focus();
        
        // Trap focus within modal
        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        modal.addEventListener('keydown', handleTabKey);
        
        // Remove event listener when modal closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && modal.classList.contains('hidden')) {
                    modal.removeEventListener('keydown', handleTabKey);
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
}

// ===== EVENT HANDLER MODULE =====
// Centralized event handling logic for better organization
const EventHandlers = {
    // Age group change handler
    handleAgeGroupChange: (app, event) => {
        const selectedAge = event.target.value;
        if (DataValidator.validateAgeGroup(selectedAge).isValid) {
            app.currentAge = selectedAge;
            StorageManager.safeSet(APP_CONFIG.LOCAL_STORAGE_KEYS.CURRENT_AGE, selectedAge);
            
            // Update visual state
            UtilityFunctions.querySelectorAll(DOM_SELECTORS.AGE_GROUP.OPTIONS).forEach(option => {
                option.classList.remove('selected');
            });
            event.target.closest('.age-option')?.classList.add('selected');
            
            // Track the event
            app.trackEvent('age_group_changed', { 
                previous_age: app.currentAge, 
                new_age: selectedAge 
            });
        }
    },
    
    // Search functionality
    handleSearchInput: (app, event) => {
        const query = UtilityFunctions.sanitizeString(event.target.value).toLowerCase();
        app.searchQuery = query;
        
        // Apply debouncing for performance
        clearTimeout(app.searchTimeout);
        app.searchTimeout = setTimeout(() => {
            app.filterMuseums(query);
            app.renderMuseums();
            
            // Track search events
            if (query.length >= 2) {
                app.trackEvent('search_performed', { 
                    query_length: query.length,
                    results_count: app.filteredMuseums.length 
                });
            }
        }, APP_CONFIG.SEARCH.DEBOUNCE_DELAY);
    },
    
    // Clear search handler
    handleClearSearch: (app) => {
        const searchInput = UtilityFunctions.querySelector(DOM_SELECTORS.SEARCH.INPUT);
        if (searchInput) {
            searchInput.value = '';
            app.searchQuery = '';
            app.filteredMuseums = MUSEUMS;
            app.renderMuseums();
            
            app.trackEvent('search_cleared');
        }
    },
    
    // Modal close handlers
    handleModalClose: (modalId, app = null) => {
        UIManager.hideModal(modalId);
        if (app) {
            app.trackEvent('modal_closed', { modal_id: modalId });
        }
    },
    
    // Museum card click handler
    handleMuseumCardClick: (app, museumId) => {
        const museum = MUSEUMS.find(m => m.id === museumId);
        if (museum) {
            app.openMuseumModal(museum);
            app.trackEvent('museum_card_clicked', { 
                museum_id: museumId,
                museum_name: museum.name 
            });
        }
    },
    
    // Visit checkbox handler
    handleVisitCheckbox: (app, museumId, isChecked) => {
        if (isChecked) {
            if (!app.visitedMuseums.includes(museumId)) {
                app.visitedMuseums.push(museumId);
            }
        } else {
            app.visitedMuseums = app.visitedMuseums.filter(id => id !== museumId);
        }
        
        StorageManager.safeSet(APP_CONFIG.LOCAL_STORAGE_KEYS.VISITED_MUSEUMS, app.visitedMuseums);
        app.updateStats();
        
        app.trackEvent(isChecked ? 'museum_visited' : 'museum_unvisited', { 
            museum_id: museumId,
            total_visited: app.visitedMuseums.length 
        });
    },
    
    // Checklist item handler
    handleChecklistItem: (app, checkboxElement, museumId, type, ageGroup, itemIndex) => {
        const isChecked = checkboxElement.checked;
        const checklistKey = `${museumId}-${type}-${ageGroup}`;
        
        if (!app.museumChecklists[checklistKey]) {
            app.museumChecklists[checklistKey] = [];
        }
        
        if (isChecked) {
            if (!app.museumChecklists[checklistKey].includes(itemIndex)) {
                app.museumChecklists[checklistKey].push(itemIndex);
            }
        } else {
            app.museumChecklists[checklistKey] = app.museumChecklists[checklistKey]
                .filter(index => index !== itemIndex);
        }
        
        StorageManager.safeSet(APP_CONFIG.LOCAL_STORAGE_KEYS.MUSEUM_CHECKLISTS, app.museumChecklists);
        
        app.trackEvent('checklist_item_changed', { 
            museum_id: museumId,
            type: type,
            age_group: ageGroup,
            item_index: itemIndex,
            checked: isChecked 
        });
    },
    
    // Tab switching handler
    handleTabSwitch: (app, activeTab) => {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        const activeButton = document.querySelector(`[data-tab="${activeTab}"]`);
        const activeContent = document.getElementById(activeTab);
        
        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
        }
        
        app.trackEvent('tab_switched', { tab: activeTab });
    },
    
    // Keyboard navigation handler
    handleKeyboardNavigation: (event) => {
        // Handle Escape key to close modals
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach(modal => {
                UIManager.hideModal(modal.id);
            });
        }
        
        // Handle Enter key on focusable elements
        if (event.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.classList.contains('museum-card') || 
                               activeElement.classList.contains('button'))) {
                activeElement.click();
            }
        }
    },
    
    // Window resize handler
    handleWindowResize: UtilityFunctions.debounce((app) => {
        // Update responsive classes if needed
        const museumCards = document.querySelectorAll('.museum-card');
        museumCards.forEach(card => {
            UIManager.addResponsiveClass(card, 'mobile-card', 'desktop-card');
        });
        
        app.trackEvent('window_resized', { 
            width: window.innerWidth, 
            height: window.innerHeight,
            is_mobile: UIManager.isMobileView()
        });
    }, 250),
    
    // Error handler for async operations
    handleAsyncError: (error, context, app = null) => {
        console.error(`Error in ${context}:`, error);
        UIManager.showNotification(`操作失败：${error.message}`, UI_CONSTANTS.ANIMATION.NOTIFICATION_DURATION, 'error');
        
        if (app) {
            app.trackEvent('async_error', { 
                context: context,
                error_message: error.message,
                error_type: error.name 
            });
        }
    }
};

class MuseumCheckApp {
    constructor() {
        this.currentAge = this.loadAgeGroup();
        this.visitedMuseums = this.loadVisitedMuseums();
        this.museumChecklists = this.loadMuseumChecklists();
        this.taskPhotos = this.loadTaskPhotos(); // Will fallback to localStorage initially
        this.customChecklists = this.loadCustomChecklists();
        this.indexedDBSupported = false;
        this.db = null;
        this.searchQuery = '';
        this.filteredMuseums = MUSEUMS;
        
        // Initialize specialized modules
        this.modalManager = new ModalManager();
        this.photoManager = new PhotoManager();
        this.analyticsManager = new AnalyticsManager();
        
        // Initialize advanced management modules (Phase 5)
        this.museumManager = new MuseumManager(this, this.analyticsManager);
        this.checklistManager = new ChecklistManager(this, this.analyticsManager);
        this.assessmentManager = new AssessmentManager(this, this.analyticsManager);
        
        this.init();
    }

    initAgeSelector() {
        // Set the radio button to match the saved age group
        const savedAgeRadio = UtilityFunctions.querySelector(`input[name="ageGroup"][value="${this.currentAge}"]`);
        if (savedAgeRadio) {
            savedAgeRadio.checked = true;
        }
        
        // Set initial selected state for browsers that don't support :has()
        const checkedRadio = UtilityFunctions.querySelector(DOM_SELECTORS.AGE_GROUP.CHECKED_RADIO);
        if (checkedRadio) {
            // Remove previous selected states
            UtilityFunctions.querySelectorAll(DOM_SELECTORS.AGE_GROUP.OPTIONS).forEach(option => {
                option.classList.remove('selected');
            });
            // Add selected state to the current radio
            checkedRadio.closest('.age-option').classList.add('selected');
        }
    }

    // Google Analytics tracking helper - now using AnalyticsManager
    trackEvent(eventName, parameters = {}) {
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent(eventName, parameters);
        } else {
            // Fallback to direct gtag if AnalyticsManager not available
            if (typeof gtag !== 'undefined' && window.GA_MEASUREMENT_ID !== 'GA_MEASUREMENT_ID') {
                gtag('event', eventName, parameters);
            }
        }
    }

    async init() {
        await this.initIndexedDB();
        
        // Initialize age selector visual state
        this.initAgeSelector();
        
        // Update dynamic museum count displays
        this.updateDynamicMuseumCounts();
        
        // Migrate existing localStorage photos to IndexedDB if supported
        if (this.indexedDBSupported) {
            await this.migratePhotosToIndexedDB();
        }
        
        this.setupEventListeners();
        this.renderMuseums();
        this.updateStats();
        this.handleURLParameters();
    }



    // Handle URL parameters for direct museum/checklist sharing
    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const museumId = urlParams.get('museum');
        const checklistType = urlParams.get('type'); // 'parent' or 'child'
        const ageGroup = urlParams.get('age'); // '3-6', '7-12', '13-18'

        if (museumId) {
            const museum = MUSEUMS.find(m => m.id === museumId);
            if (museum) {
                // Set age group if provided
                if (ageGroup && ['3-6', '7-12', '13-18'].includes(ageGroup)) {
                    this.currentAge = ageGroup;
                    const ageRadio = document.querySelector(`input[name="ageGroup"][value="${ageGroup}"]`);
                    if (ageRadio) {
                        ageRadio.checked = true;
                        // Update visual state for browsers that don't support :has()
                        document.querySelectorAll('.age-option').forEach(option => {
                            option.classList.remove('selected');
                        });
                        ageRadio.closest('.age-option').classList.add('selected');
                    }
                }

                // Open museum modal
                setTimeout(() => {
                    this.openMuseumModal(museum, checklistType);
                }, UI_CONSTANTS.ANIMATION.MODAL_OPEN_DELAY); // Small delay to ensure DOM is ready
            }
        }
    }

    // Generate sharing URL for museum checklist
    generateSharingURL(museum, checklistType = 'parent', ageGroup = null) {
        const baseURL = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('museum', museum.id);
        params.set('type', checklistType);
        if (ageGroup) {
            params.set('age', ageGroup);
        } else {
            params.set('age', this.currentAge);
        }

        return `${baseURL}?${params.toString()}`;
    }

    // Share checklist functionality
    async shareChecklist(museum, checklistType) {
        const shareURL = this.generateSharingURL(museum, checklistType);
        
        // Use native sharing if available (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${museum.name} - ${checklistType === 'parent' ? '家长准备清单' : '孩子任务清单'}`,
                    text: `快来看看${museum.name}的${checklistType === 'parent' ? '家长准备清单' : '孩子任务清单'}吧！`,
                    url: shareURL
                });
                
                this.trackEvent('checklist_shared', {
                    'museum_id': museum.id,
                    'checklist_type': checklistType,
                    'share_method': 'native'
                });
                return;
            } catch (err) {
                // Fall back to copy to clipboard
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareURL);
            this.showNotification('链接已复制到剪贴板！可以通过微信等应用分享给朋友', 'success');
            
            this.trackEvent('checklist_shared', {
                'museum_id': museum.id,
                'checklist_type': checklistType,
                'share_method': 'clipboard'
            });
        } catch (err) {
            // Final fallback: show URL in prompt
            prompt('复制下面的链接进行分享：', shareURL);
            
            this.trackEvent('checklist_shared', {
                'museum_id': museum.id,
                'checklist_type': checklistType,
                'share_method': 'prompt'
            });
        }
    }

    // Show notification message
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification ${type} show`;

        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Migrate existing localStorage photos to IndexedDB
    async migratePhotosToIndexedDB() {
        try {
            const existingPhotos = this.taskPhotos;
            let migratedCount = 0;
            
            for (const [taskKey, photoData] of Object.entries(existingPhotos)) {
                await this.storePhotoInIndexedDB(taskKey, photoData);
                migratedCount++;
            }
            
            if (migratedCount > 0) {
                console.log(`Migrated ${migratedCount} photos to IndexedDB`);
                // Clear localStorage photos after successful migration
                localStorage.removeItem('taskPhotos');
            }
            
            // Load photos from IndexedDB to update in-memory cache
            this.taskPhotos = await this.loadTaskPhotosAsync();
        } catch (error) {
            console.error('Failed to migrate photos to IndexedDB:', error);
        }
    }

    // IndexedDB initialization and helper methods
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MuseumCheckDB', 1);
            
            request.onerror = () => {
                console.error('IndexedDB failed to open:', request.error);
                this.indexedDBSupported = false;
                resolve();
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.indexedDBSupported = true;
                console.log('IndexedDB initialized successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for photos
                if (!db.objectStoreNames.contains('photos')) {
                    const photoStore = db.createObjectStore('photos', { keyPath: 'taskKey' });
                    photoStore.createIndex('taskKey', 'taskKey', { unique: true });
                }
            };
        });
    }

    // Store photo in IndexedDB
    async storePhotoInIndexedDB(taskKey, photoData) {
        if (!this.indexedDBSupported || !this.db) {
            throw new Error('IndexedDB not available');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            const photoRecord = {
                taskKey: taskKey,
                data: photoData,
                timestamp: Date.now()
            };
            
            const request = store.put(photoRecord);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Retrieve photo from IndexedDB
    async getPhotoFromIndexedDB(taskKey) {
        if (!this.indexedDBSupported || !this.db) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.get(taskKey);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Get all photos from IndexedDB
    async getAllPhotosFromIndexedDB() {
        if (!this.indexedDBSupported || !this.db) {
            return {};
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const results = request.result;
                const photos = {};
                results.forEach(photo => {
                    photos[photo.taskKey] = photo.data;
                });
                resolve(photos);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Delete photo from IndexedDB
    async deletePhotoFromIndexedDB(taskKey) {
        if (!this.indexedDBSupported || !this.db) {
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            const request = store.delete(taskKey);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    setupEventListeners() {
        // Age group selector - handle radio button changes
        document.querySelectorAll('input[name="ageGroup"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const oldAge = this.currentAge;
                    this.currentAge = e.target.value;
                    this.saveAgeGroup(); // Save age group to localStorage
                    this.renderMuseums();
                    
                    // Update visual state for browsers that don't support :has()
                    document.querySelectorAll('.age-option').forEach(option => {
                        option.classList.remove('selected');
                    });
                    e.target.closest('.age-option').classList.add('selected');
                    
                    // Track age group change
                    this.trackEvent('age_group_changed', {
                        'previous_age': oldAge,
                        'new_age': this.currentAge
                    });
                }
            });
        });

        // Search functionality
        const searchInput = document.getElementById('museumSearch');
        const clearButton = document.getElementById('clearSearch');
        
        // Search input event listener
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.filterMuseums();
            this.renderMuseums();
            this.toggleClearButton();
            
            // Track search usage
            if (this.searchQuery.length > 0) {
                this.trackEvent('search_used', {
                    'search_query_length': this.searchQuery.length
                });
            }
        });
        
        // Clear search button
        clearButton.addEventListener('click', () => {
            this.clearSearch();
            this.trackEvent('search_cleared');
        });
        
        // Clear search on Escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
                this.trackEvent('search_cleared_escape');
            }
        });



        // Modal close
        document.querySelector('#museumModal .close').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('museumModal').addEventListener('click', (e) => {
            if (e.target.id === 'museumModal') {
                this.closeModal();
            }
        });
        
        // Achievement button
        document.getElementById('achievementButton').addEventListener('click', () => {
            this.showAchievementModal();
        });

        // Assessment history button
        document.getElementById('assessmentHistoryButton').addEventListener('click', () => {
            this.showAssessmentHistoryModal();
        });

        // Achievement modal close
        document.querySelector('#achievementModal .close').addEventListener('click', () => {
            this.closeAchievementModal();
        });

        // Assessment history modal close
        document.querySelector('#assessmentHistoryModal .close').addEventListener('click', () => {
            this.closeAssessmentHistoryModal();
        });

        // Click outside achievement modal to close
        document.getElementById('achievementModal').addEventListener('click', (e) => {
            if (e.target.id === 'achievementModal') {
                this.closeAchievementModal();
            }
        });

        // Click outside assessment history modal to close
        document.getElementById('assessmentHistoryModal').addEventListener('click', (e) => {
            if (e.target.id === 'assessmentHistoryModal') {
                this.closeAssessmentHistoryModal();
            }
        });

        // Settings icon click
        document.getElementById('settingsIcon').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Settings modal close
        document.querySelector('#settingsModal .close').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        // Click outside settings modal to close
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettingsModal();
            }
        });

        // Clear all data button
        document.getElementById('clearAllDataButton').addEventListener('click', () => {
            this.clearAllData();
        });
    }

    // Search functionality methods
    filterMuseums() {
        if (!this.searchQuery) {
            this.filteredMuseums = MUSEUMS;
            return;
        }
        
        const query = this.searchQuery.toLowerCase();
        this.filteredMuseums = MUSEUMS.filter(museum => {
            // Safety check for undefined values
            const name = museum.name || '';
            const location = museum.location || '';
            const description = museum.description || '';
            const tags = museum.tags || [];
            
            return name.toLowerCase().includes(query) ||
                   location.toLowerCase().includes(query) ||
                   description.toLowerCase().includes(query) ||
                   tags.some(tag => (tag || '').toLowerCase().includes(query));
        });
    }
    
    clearSearch() {
        this.searchQuery = '';
        document.getElementById('museumSearch').value = '';
        this.filteredMuseums = MUSEUMS;
        this.renderMuseums();
        this.toggleClearButton();
    }
    
    toggleClearButton() {
        const clearButton = document.getElementById('clearSearch');
        const searchResultsInfo = document.getElementById('searchResultsInfo');
        
        if (this.searchQuery.length > 0) {
            clearButton.style.display = 'block';
            searchResultsInfo.style.display = 'block';
            document.getElementById('filteredCount').textContent = this.filteredMuseums.length;
        } else {
            clearButton.style.display = 'none';
            searchResultsInfo.style.display = 'none';
        }
    }

    loadVisitedMuseums() {
        try {
            const saved = localStorage.getItem('visitedMuseums');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load visited museums:', error);
            return [];
        }
    }

    saveVisitedMuseums() {
        try {
            localStorage.setItem('visitedMuseums', JSON.stringify(this.visitedMuseums));
        } catch (error) {
            console.error('Failed to save visited museums:', error);
        }
    }

    loadMuseumChecklists() {
        try {
            const saved = localStorage.getItem('museumChecklists');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load museum checklists:', error);
            return {};
        }
    }

    loadTaskPhotos() {
        try {
            const saved = localStorage.getItem('taskPhotos');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load task photos:', error);
            return {};
        }
    }

    // Load photos from IndexedDB if available, fallback to localStorage
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

    saveTaskPhotos() {
        // This method is kept for backward compatibility
        // New photos should be saved using saveTaskPhotoAsync
        try {
            localStorage.setItem('taskPhotos', JSON.stringify(this.taskPhotos));
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

    // Save individual photo using IndexedDB if available
    async saveTaskPhotoAsync(taskKey, photoData) {
        if (this.indexedDBSupported) {
            try {
                await this.storePhotoInIndexedDB(taskKey, photoData);
                // Also update in-memory cache
                this.taskPhotos[taskKey] = photoData;
                return true;
            } catch (error) {
                console.error('Failed to save photo to IndexedDB:', error);
                return false;
            }
        } else {
            // Fallback to localStorage
            this.taskPhotos[taskKey] = photoData;
            this.saveTaskPhotos();
            return true;
        }
    }

    loadCustomChecklists() {
        try {
            const saved = localStorage.getItem('customChecklists');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load custom checklists:', error);
            return {};
        }
    }

    saveCustomChecklists() {
        try {
            localStorage.setItem('customChecklists', JSON.stringify(this.customChecklists));
        } catch (error) {
            console.error('Failed to save custom checklists:', error);
        }
    }

    saveMuseumChecklists() {
        try {
            localStorage.setItem('museumChecklists', JSON.stringify(this.museumChecklists));
        } catch (error) {
            console.error('Failed to save museum checklists:', error);
        }
    }

    loadAgeGroup() {
        try {
            const saved = localStorage.getItem('ageGroup');
            return saved || '3-6'; // Default to '3-6' if not saved
        } catch (error) {
            console.error('Failed to load age group:', error);
            return '3-6';
        }
    }

    saveAgeGroup() {
        try {
            localStorage.setItem('ageGroup', this.currentAge);
        } catch (error) {
            console.error('Failed to save age group:', error);
        }
    }

    renderMuseums() {
        try {
            const grid = document.getElementById('museumGrid');
            const loadingIndicator = document.getElementById('loadingIndicator');
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            grid.innerHTML = '';

            this.filteredMuseums.forEach(museum => {
                const isVisited = this.visitedMuseums.includes(museum.id);
                const card = document.createElement('div');
                card.className = `museum-card ${isVisited ? 'visited' : ''}`;
                card.innerHTML = `
                    <div class="museum-header">
                        <input type="checkbox" class="visit-checkbox" ${isVisited ? 'checked' : ''} 
                               data-museum="${museum.id}">
                        <div class="museum-info">
                            <h3>
                                ${museum.name}
                                ${isVisited ? '<button class="assessment-button" data-museum="' + museum.id + '" title="亲子关系测评">🧡 亲子测评</button>' : ''}
                            </h3>
                            <div class="museum-location">📍 ${museum.location}</div>
                        </div>
                    </div>
                    <p class="museum-description">${museum.description}</p>
                    <div class="museum-tags">
                        ${museum.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                `;

                // Add click event for the card (excluding checkbox and assessment button)
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('visit-checkbox') && 
                        !e.target.classList.contains('assessment-button')) {
                        this.openMuseumModal(museum);
                    }
                });

                // Add checkbox event
                const checkbox = card.querySelector('.visit-checkbox');
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const wasChecked = checkbox.checked;
                    const result = this.toggleMuseumVisit(museum.id);
                    
                    // If toggleMuseumVisit indicates the action was cancelled (user went to modal),
                    // revert the checkbox state since the museum wasn't actually marked as visited
                    if (result === 'cancelled') {
                        checkbox.checked = !wasChecked;
                    }
                });

                // Add assessment button event
                const assessmentButton = card.querySelector('.assessment-button');
                if (assessmentButton) {
                    assessmentButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openAssessmentModal(museum.id);
                    });
                }

                grid.appendChild(card);
            });

            this.updateStats();
            
            // If no museums were rendered, show error message
            if (grid.children.length === 0) {
                this.showError('博物馆数据载入失败，请刷新页面重试');
            }
        } catch (error) {
            console.error('Error rendering museums:', error);
            this.showError('博物馆数据载入出错，请刷新页面重试');
        }
    }
    
    showError(message) {
        const grid = document.getElementById('museumGrid');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        grid.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-button">重新载入</button>
            </div>
        `;
    }

    toggleMuseumVisit(museumId) {
        const index = this.visitedMuseums.indexOf(museumId);
        const museum = MUSEUMS.find(m => m.id === museumId);
        const isNowVisited = index === -1;
        
        // If unchecking (removing visit), allow without validation
        if (index > -1) {
            this.visitedMuseums.splice(index, 1);
            this.saveVisitedMuseums();
            this.renderMuseums();
            
            // Track museum visit toggle
            this.trackEvent('museum_visit_toggled', {
                'museum_id': museumId,
                'museum_name': museum ? museum.name : '',
                'museum_location': museum ? museum.location : '',
                'visited': false,
                'age_group': this.currentAge
            });
            return 'unchecked';
        }
        
        // If checking (adding visit), validate child task completion first
        if (isNowVisited) {
            const childChecklistKey = `${museumId}-child-${this.currentAge}`;
            const completedChildTasks = this.museumChecklists[childChecklistKey] || [];
            
            // If no child tasks are completed, show confirmation dialog
            if (completedChildTasks.length === 0) {
                const museumName = museum ? museum.name : '该博物馆';
                const confirmed = confirm(
                    `您还没有完成任何孩子任务就要打卡${museumName}。\n\n` +
                    `建议至少完成一个孩子任务后再打卡，这样能更好地记录参观体验。\n\n` +
                    `点击"确定"进入参观指南页面查看任务，或点击"取消"强制打卡。`
                );
                
                if (confirmed) {
                    // User chose to enter guide page - open museum modal
                    // Return 'cancelled' to indicate checkbox should be reverted
                    this.openMuseumModal(museum);
                    return 'cancelled';
                }
                // If user clicked "取消", continue with force check-in below
            }
            
            // Proceed with checking the museum as visited
            this.visitedMuseums.push(museumId);
            // Trigger large rocket animation for museum visit
            this.triggerLargeRocket();
            this.saveVisitedMuseums();
            this.renderMuseums();
            
            // Track museum visit toggle
            this.trackEvent('museum_visit_toggled', {
                'museum_id': museumId,
                'museum_name': museum ? museum.name : '',
                'museum_location': museum ? museum.location : '',
                'visited': true,
                'age_group': this.currentAge,
                'force_checkin': completedChildTasks.length === 0
            });
            return 'checked';
        }
        
        return 'no_action';
    }

    updateStats() {
        const visitedCount = this.visitedMuseums.length;
        const totalCount = MUSEUMS.length;
        // Fix percentage display: use one decimal place to show meaningful progress for small percentages
        const percentage = totalCount > 0 
            ? (visitedCount > 0 ? Math.round((visitedCount / totalCount) * 100 * 10) / 10 : 0)
            : 0;

        document.getElementById('visitedCount').textContent = visitedCount;
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('visitedPercentage').textContent = percentage;
        
        // Update achievements
        this.updateAchievements(visitedCount);
    }

    updateDynamicMuseumCounts() {
        // Update all dynamic museum count displays with the actual count
        const countText = `${MUSEUM_COUNT}家知名`;
        
        // Update header museum count
        const headerElement = document.getElementById('headerMuseumCount');
        if (headerElement) {
            headerElement.textContent = countText;
        }
        
        // Update section description museum count
        const sectionElement = document.getElementById('sectionMuseumCount');
        if (sectionElement) {
            sectionElement.textContent = countText;
        }
    }

    calculateAchievements(visitedCount) {
        const achievements = [];
        
        // Visit milestone achievements - Enhanced with early game rewards
        const milestones = [
            { visits: 1, name: '初次探索', emoji: '🌟', description: '踏出了博物馆之旅的第一步' },
            { visits: 3, name: '文化初体验', emoji: '🎪', description: '已经体验了3种不同的文化' },
            { visits: 5, name: '博物馆新手', emoji: '🎯', description: '参观了5家博物馆' },
            { visits: 10, name: '文化探索者', emoji: '🧭', description: '参观了10家博物馆' },
            { visits: 25, name: '历史爱好者', emoji: '📚', description: '参观了25家博物馆' },
            { visits: 50, name: '文化达人', emoji: '🏆', description: '参观了50家博物馆' },
            { visits: 75, name: '博物馆专家', emoji: '🎓', description: '参观了75家博物馆' },
            { visits: 100, name: '文化大师', emoji: '👑', description: '参观了100家博物馆' },
            { visits: MUSEUM_COUNT, name: '博物馆收藏家', emoji: '💎', description: `完成了全部${MUSEUM_COUNT}家博物馆` }
        ];
        
        // Add achieved milestones
        milestones.forEach(milestone => {
            if (visitedCount >= milestone.visits) {
                achievements.push({
                    ...milestone,
                    achieved: true,
                    date: this.getAchievementDate(milestone.visits)
                });
            }
        });
        
        // Add next milestone as goal
        const nextMilestone = milestones.find(m => visitedCount < m.visits);
        if (nextMilestone) {
            achievements.push({
                ...nextMilestone,
                achieved: false,
                progress: visitedCount,
                remaining: nextMilestone.visits - visitedCount
            });
        }
        
        // Special achievements
        if (visitedCount > 0) {
            const visitedMuseums = this.visitedMuseums.map(id => MUSEUMS.find(m => m.id === id)).filter(Boolean);
            const visitedIds = visitedMuseums.map(m => m.id);
            
            // Famous museum achievements - immediate rewards for visiting top destinations
            const famousMuseums = [
                { id: 'forbidden-city', name: '紫禁城探秘者', emoji: '🏯', description: '参观了世界文化遗产故宫博物院' },
                { id: 'terracotta-warriors', name: '兵马俑见证者', emoji: '⚔️', description: '参观了世界第八大奇迹秦始皇帝陵博物院' },
                { id: 'national-museum', name: '国家馆探索者', emoji: '🏛️', description: '参观了中国国家博物馆' },
                { id: 'shanghai-museum', name: '艺术宫访客', emoji: '🎨', description: '参观了被誉为"中华艺术宫"的上海博物馆' }
            ];
            
            famousMuseums.forEach(famous => {
                if (visitedIds.includes(famous.id)) {
                    achievements.push({
                        name: famous.name,
                        emoji: famous.emoji,
                        description: famous.description,
                        achieved: true,
                        date: this.getAchievementDate(1)
                    });
                }
            });
            
            // City achievements - early rewards for exploring major cities
            const cityGroups = {
                '北京': { name: '首都文化达人', emoji: '🇨🇳', description: '探索了首都北京的博物馆群' },
                '上海': { name: '魔都文化客', emoji: '🌃', description: '体验了上海的现代文化魅力' },
                '西安': { name: '古都寻踪者', emoji: '🏺', description: '感受了十三朝古都的历史厚重' }
            };
            
            Object.entries(cityGroups).forEach(([city, achievement]) => {
                const cityMuseums = visitedMuseums.filter(m => m.location === city);
                if (cityMuseums.length >= 2) {
                    achievements.push({
                        name: achievement.name,
                        emoji: achievement.emoji,
                        description: `${achievement.description} (${cityMuseums.length}家)`,
                        achieved: true,
                        date: this.getAchievementDate(2)
                    });
                }
            });
            
            // Category achievements - reward thematic exploration
            const categoryGroups = {
                '历史': { name: '历史探秘家', emoji: '📜', description: '专注于历史类博物馆的探索' },
                '艺术': { name: '艺术鉴赏家', emoji: '🎨', description: '深度体验艺术类博物馆' },
                '科技': { name: '科技探索者', emoji: '🔬', description: '热衷于科技类博物馆' },
                '文物': { name: '文物守护者', emoji: '🏺', description: '珍视文物类博物馆的价值' }
            };
            
            Object.entries(categoryGroups).forEach(([category, achievement]) => {
                const categoryMuseums = visitedMuseums.filter(m => m.tags && m.tags.includes(category));
                if (categoryMuseums.length >= 3) {
                    achievements.push({
                        name: achievement.name,
                        emoji: achievement.emoji,
                        description: `${achievement.description} (${categoryMuseums.length}家)`,
                        achieved: true,
                        date: this.getAchievementDate(3)
                    });
                }
            });
            
            // Province diversity achievement - lowered threshold for earlier reward
            const provinces = [...new Set(visitedMuseums.map(m => m.location))];
            if (provinces.length >= 3) {
                achievements.push({
                    name: '跨省旅行家',
                    emoji: '🗺️',
                    description: `游览了${provinces.length}个不同省市`,
                    achieved: true,
                    date: this.getAchievementDate(3)
                });
            }
            
            // Museum type diversity achievement - lowered threshold
            const allTags = visitedMuseums.flatMap(m => m.tags || []);
            const uniqueTags = [...new Set(allTags)];
            if (uniqueTags.length >= 5) {
                achievements.push({
                    name: '文化多面手',
                    emoji: '🎭',
                    description: `体验了${uniqueTags.length}种不同类型的文化`,
                    achieved: true,
                    date: this.getAchievementDate(5)
                });
            }
        }
        
        return achievements;
    }
    
    getAchievementDate(milestone) {
        // For simplicity, return current date for achieved milestones
        // In a more sophisticated implementation, this could track actual achievement dates
        return new Date().toLocaleDateString('zh-CN');
    }
    
    updateAchievements(visitedCount) {
        const achievements = this.calculateAchievements(visitedCount);
        const achievedCount = achievements.filter(a => a.achieved).length;
        
        // Update achievement display
        const achievementElement = document.getElementById('achievementCount');
        if (achievementElement) {
            achievementElement.textContent = achievedCount;
        }
        
        // Store achievements for poster generation
        this.currentAchievements = achievements;
    }

    openMuseumModal(museum, activeTab = 'parent') {
        const modal = document.getElementById('museumModal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');

        title.textContent = `${museum.name} - 亲子参观指南`;

        // Get expert guidance for current age group
        const guidance = EXPERT_GUIDANCE[this.currentAge];
        const ageLabels = {
            '3-6': '3-6岁 (学龄前)',
            '7-12': '7-12岁 (小学)',
            '13-18': '13-18岁 (中学)'
        };

        content.innerHTML = `
            <div class="checklist-tabs">
                <button class="tab-button ${activeTab === 'expert' ? 'active' : ''}" data-target="expert">👨‍👩‍👧 专家指导</button>
                <button class="tab-button ${activeTab === 'parent' ? 'active' : ''}" data-target="parent">家长准备</button>
                <button class="tab-button ${activeTab === 'child' ? 'active' : ''}" data-target="child">孩子任务</button>
                <button class="tab-button ${activeTab === 'share' ? 'active' : ''}" data-target="share">生成海报</button>
            </div>
            ${museum.image ? `<div class="museum-image-section">
                <img src="${museum.image}" alt="${museum.name}" class="museum-image" />
            </div>` : ''}
            
            <div id="expertGuidance" class="checklist-content expert-guidance" ${activeTab !== 'expert' ? 'style="display: none;"' : ''}>
                <div class="expert-header">
                    <h3>🎓 ${ageLabels[this.currentAge]} 专家指导</h3>
                    <div class="age-stage-info">
                        <span class="stage-label">${guidance.cognitiveStage}</span>
                    </div>
                </div>
                
                <div class="expert-section relationship-focus">
                    <h4>💖 亲子关系提升核心目标</h4>
                    <div class="core-goal">
                        <p class="goal-statement">${guidance.relationshipFocus.coreGoal}</p>
                    </div>
                </div>
                
                <div class="expert-section">
                    <h4>🧠 发展特点</h4>
                    <p class="developmental-traits">${guidance.developmentalTraits}</p>
                </div>
                
                <div class="expert-section">
                    <h4>👥 亲子互动指导</h4>
                    <ul class="expert-tips">
                        ${guidance.parentingTips.slice(0, 5).map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="expert-section">
                    <h4>❤️ 情感支持要点</h4>
                    <ul class="emotional-support">
                        ${guidance.emotionalSupport.slice(0, 4).map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="expert-section">
                    <h4>💬 对话启发技巧</h4>
                    <div class="dialogue-section">
                        <div class="dialogue-starters">
                            <strong>📝 推荐话题开场：</strong>
                            <ul>
                                ${guidance.dialogueStarters.slice(0, 4).map(starter => `<li>${starter}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="expert-section">
                    <h4>🧩 多元智能激发</h4>
                    <div class="intelligence-grid">
                        ${Object.entries(MULTIPLE_INTELLIGENCE_STRATEGIES).slice(0, 4).map(([key, value]) => `
                            <div class="intelligence-item">
                                <div class="intelligence-header">
                                    <strong>${value.name}</strong>
                                </div>
                                <div class="intelligence-desc">${value.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="expert-section">
                    <h4>🚨 常见挑战应对</h4>
                    <div class="challenges-section">
                        ${guidance.commonChallenges.slice(0, 3).map(challenge => `
                            <div class="challenge-item">
                                <div class="challenge-situation">
                                    <strong>情况：</strong>${challenge.situation}
                                </div>
                                <div class="challenge-solution">
                                    <strong>应对：</strong>${challenge.solution}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${guidance.attachmentStrategies ? `
                <div class="expert-section">
                    <h4>💕 依恋关系建立</h4>
                    <ul class="attachment-strategies">
                        ${guidance.attachmentStrategies.map(strategy => `<li>${strategy}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${guidance.scaffoldingTechniques ? `
                <div class="expert-section">
                    <h4>🏗️ 学习支架技巧</h4>
                    <ul class="scaffolding-techniques">
                        ${guidance.scaffoldingTechniques.map(technique => `<li>${technique}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${guidance.autonomySupport ? `
                <div class="expert-section">
                    <h4>🎯 自主性支持</h4>
                    <ul class="autonomy-support">
                        ${guidance.autonomySupport.map(support => `<li>${support}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${guidance.inclusiveSupport ? `
                <div class="expert-section">
                    <h4>🌈 包容性支持</h4>
                    <ul class="inclusive-support">
                        ${guidance.inclusiveSupport.map(support => `<li>${support}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <div class="expert-section">
                    <h4>📊 参与度评估指标</h4>
                    <div class="assessment-section">
                        <p class="assessment-intro">观察这些积极信号，了解孩子的学习状态：</p>
                        <ul class="engagement-indicators">
                            ${ASSESSMENT_TOOLS.engagementIndicators[this.currentAge].slice(0, 4).map(indicator => `<li>${indicator}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="expert-section">
                    <h4>📚 延伸学习建议</h4>
                    <div class="extension-activities">
                        <div class="activity-card">
                            <strong>🏠 回家后</strong>
                            <p>整理参观照片，制作家庭博物馆相册，分享今天的发现</p>
                        </div>
                        <div class="activity-card">
                            <strong>📖 深入阅读</strong>
                            <p>根据孩子兴趣，选择相关主题的绘本或科普读物</p>
                        </div>
                        <div class="activity-card">
                            <strong>🎨 动手实践</strong>
                            <p>制作小手工、画画或搭建模型，巩固博物馆体验</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="parentChecklist" class="checklist-content" ${activeTab !== 'parent' ? 'style="display: none;"' : ''}>
                <div class="checklist-header">
                    <h3>家长准备事项</h3>
                    <div class="checklist-actions">
                        <button class="share-button" data-type="parent" title="分享家长准备清单">
                            🔗
                        </button>
                        <button class="clear-checklist-button clear-parent-button" data-museum="${museum.id}" data-type="parent" title="清空家长清单数据">
                            🗑️
                        </button>
                    </div>
                </div>
                ${this.renderChecklist(museum.id, 'parent', museum.checklists.parent[this.currentAge])}
            </div>
            <div id="childChecklist" class="checklist-content" ${activeTab !== 'child' ? 'style="display: none;"' : ''}>
                <div class="checklist-header">
                    <h3>孩子探索任务</h3>
                    <div class="checklist-actions">
                        <button class="share-button" data-type="child" title="分享孩子任务清单">
                            🔗
                        </button>
                        <button class="clear-checklist-button clear-child-button" data-museum="${museum.id}" data-type="child" title="清空孩子清单数据">
                            🗑️
                        </button>
                    </div>
                </div>
                ${this.renderChecklist(museum.id, 'child', museum.checklists.child[this.currentAge])}
            </div>
            <div id="shareChecklist" class="checklist-content" ${activeTab !== 'share' ? 'style="display: none;"' : ''}>
                <h3>生成分享海报</h3>
                <div class="share-poster-section">
                    <p class="share-description">📸 将已完成的任务和照片生成精美海报，方便分享朋友圈留念！</p>
                    <button id="generatePoster" class="poster-button">🎨 生成海报</button>
                    <canvas id="posterCanvas" style="display: none; max-width: 100%;"></canvas>
                    <div id="posterPreview" class="poster-preview"></div>
                    <button id="downloadPoster" class="poster-button" style="display: none;">📱 下载海报</button>
                </div>
            </div>
        `;

        // Setup tab switching
        const tabButtons = content.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const target = button.dataset.target;
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show corresponding content
                document.getElementById('expertGuidance').style.display = target === 'expert' ? 'block' : 'none';
                document.getElementById('parentChecklist').style.display = target === 'parent' ? 'block' : 'none';
                document.getElementById('childChecklist').style.display = target === 'child' ? 'block' : 'none';
                document.getElementById('shareChecklist').style.display = target === 'share' ? 'block' : 'none';
                
                // Enhanced UX: Smooth scroll to the content area after tab switch
                setTimeout(() => {
                    this.scrollToTabContent(target);
                }, 100);
            });
        });

        // Setup share button functionality
        const shareButtons = content.querySelectorAll('.share-button');
        shareButtons.forEach(button => {
            button.addEventListener('click', () => {
                const checklistType = button.dataset.type;
                this.shareChecklist(museum, checklistType);
            });
        });

        modal.classList.remove('hidden');
        
        // Enhanced UX: Ensure modal content starts at the top
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }, 100);
        
        // Set up checklist event listeners after modal content is rendered
        this.addChecklistEventListeners();
        
        // Set up poster generation
        this.setupPosterGeneration(museum);
        
        // Track modal open
        this.trackEvent('museum_modal_opened', {
            'museum_id': museum.id,
            'museum_name': museum.name,
            'museum_location': museum.location,
            'age_group': this.currentAge,
            'active_tab': activeTab
        });
    }

    renderChecklist(museumId, type, items) {
        const checklistKey = `${museumId}-${type}-${this.currentAge}`;
        const completed = this.museumChecklists[checklistKey] || [];
        
        // Get custom checklist items if they exist, otherwise use default items
        const customItems = this.customChecklists[checklistKey];
        const displayItems = customItems ? customItems.map(item => item.text) : items;

        const checklistItems = displayItems.map((item, index) => {
            const itemId = `${checklistKey}-${index}`;
            const photoKey = `${checklistKey}-${index}`;
            const isCompleted = completed.includes(index);
            const hasPhoto = this.taskPhotos[photoKey];
            const isCustom = customItems && customItems[index] && customItems[index].isCustom;
            
            let photoUpload = '';
            if (type === 'child' && isCompleted) {
                photoUpload = `
                    <div class="photo-upload-section">
                        <label for="photo-${itemId}" class="photo-upload-label">
                            📷 上传照片留念
                        </label>
                        <input type="file" id="photo-${itemId}" accept="image/*" class="photo-input" 
                               data-task-key="${photoKey}" style="display: none;">
                        ${hasPhoto ? `<img src="${hasPhoto}" class="task-photo" alt="任务照片">` : ''}
                    </div>
                `;
            }
            
            return `
                <div class="checklist-item ${isCompleted ? 'completed' : ''}" data-checklist-key="${checklistKey}" data-item-index="${index}">
                    <input type="checkbox" id="${itemId}" ${isCompleted ? 'checked' : ''} 
                           data-checklist="${checklistKey}" data-index="${index}">
                    <label for="${itemId}" class="checklist-label" data-original-text="${item}">${item}</label>
                    <div class="checklist-controls">
                        <button class="edit-item-btn" title="编辑">✏️</button>
                        <button class="delete-item-btn" title="删除" ${!isCustom && !customItems ? 'disabled' : ''}>🗑️</button>
                    </div>
                    ${photoUpload}
                </div>
            `;
        }).join('');

        // Add "Add new item" button
        const addButton = `
            <div class="add-item-section">
                <button class="add-item-btn" data-checklist-key="${checklistKey}">➕ 添加新项目</button>
            </div>
        `;

        return checklistItems + addButton;
    }

    addChecklistEventListeners() {
        const checkboxes = document.querySelectorAll('#modalContent input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const checklistKey = e.target.dataset.checklist;
                const index = parseInt(e.target.dataset.index);
                
                if (!this.museumChecklists[checklistKey]) {
                    this.museumChecklists[checklistKey] = [];
                }
                
                const completed = this.museumChecklists[checklistKey];
                const itemIndex = completed.indexOf(index);
                
                if (e.target.checked && itemIndex === -1) {
                    completed.push(index);
                    // Trigger small rocket animation for task completion
                    this.triggerSmallRocket();
                    
                    // Enhanced UX: Auto-scroll to next unchecked item after a brief celebration
                    setTimeout(() => {
                        this.scrollToNextUncheckedItem(e.target);
                    }, 800);
                } else if (!e.target.checked && itemIndex > -1) {
                    completed.splice(itemIndex, 1);
                }
                
                this.saveMuseumChecklists();
                
                // Track checklist item completion
                const keyParts = checklistKey.split('-');
                // Handle museum IDs that contain hyphens (e.g., 'forbidden-city')
                // The format is: museumId-type-ageGroup, where ageGroup may also contain hyphens
                // We need to find the last occurrence of type ('parent' or 'child') and ageGroup
                const ageGroup = keyParts[keyParts.length - 1]; // e.g., '6' 
                const ageGroupStart = keyParts[keyParts.length - 2]; // e.g., '3'
                const fullAgeGroup = `${ageGroupStart}-${ageGroup}`; // e.g., '3-6'
                const checklistType = keyParts[keyParts.length - 3]; // e.g., 'child'
                const museumId = keyParts.slice(0, keyParts.length - 3).join('-'); // e.g., 'forbidden-city'
                const museum = MUSEUMS.find(m => m.id === museumId);
                const itemText = museum && museum.checklists[checklistType] && museum.checklists[checklistType][fullAgeGroup] ? 
                               museum.checklists[checklistType][fullAgeGroup][index] : '';
                
                this.trackEvent('checklist_item_toggled', {
                    'museum_id': museumId,
                    'museum_name': museum ? museum.name : '',
                    'checklist_type': checklistType,
                    'age_group': fullAgeGroup,
                    'item_index': index,
                    'item_text': itemText,
                    'completed': e.target.checked
                });
                
                // Update visual state and add/remove photo upload section
                const item = e.target.closest('.checklist-item');
                if (e.target.checked) {
                    item.classList.add('completed');
                    // Add photo upload section if this is a child task
                    if (checklistType === 'child') {
                        this.addPhotoUploadToItem(item, checklistKey, index);
                    }
                } else {
                    item.classList.remove('completed');
                    // Remove photo upload section if this is a child task
                    if (checklistType === 'child') {
                        this.removePhotoUploadFromItem(item);
                    }
                }
            });
        });

        // Use event delegation for edit, delete, and add buttons to avoid duplicate listeners
        const modalContent = document.getElementById('modalContent');
        if (modalContent) {
            // Remove any existing button event listeners to prevent duplicates
            modalContent.removeEventListener('click', this.handleButtonClickDelegate);
            
            // Add delegated event listener for all button clicks
            this.handleButtonClickDelegate = (e) => {
                if (e.target.classList.contains('edit-item-btn')) {
                    e.stopPropagation();
                    this.editChecklistItem(e.target);
                } else if (e.target.classList.contains('delete-item-btn')) {
                    e.stopPropagation();
                    if (!e.target.disabled) {
                        this.deleteChecklistItem(e.target);
                    }
                } else if (e.target.classList.contains('add-item-btn')) {
                    e.stopPropagation();
                    this.addChecklistItem(e.target);
                } else if (e.target.classList.contains('clear-parent-button')) {
                    e.stopPropagation();
                    const museumId = e.target.dataset.museum;
                    this.clearParentChecklistData(museumId, this.currentAge);
                } else if (e.target.classList.contains('clear-child-button')) {
                    e.stopPropagation();
                    const museumId = e.target.dataset.museum;
                    this.clearChildChecklistData(museumId, this.currentAge);
                }
            };
            
            modalContent.addEventListener('click', this.handleButtonClickDelegate);
            
            // Use event delegation for photo uploads to avoid duplicate listeners
            // Remove any existing photo event listeners to prevent duplicates
            modalContent.removeEventListener('change', this.handlePhotoUploadDelegate);
            modalContent.removeEventListener('click', this.handlePhotoLabelClickDelegate);
            
            // Add delegated event listeners
            this.handlePhotoUploadDelegate = (e) => {
                if (e.target.classList.contains('photo-input')) {
                    this.handlePhotoUpload(e);
                }
            };
            
            this.handlePhotoLabelClickDelegate = (e) => {
                if (e.target.classList.contains('photo-upload-label')) {
                    e.preventDefault();
                    const inputId = e.target.getAttribute('for');
                    const input = document.getElementById(inputId);
                    if (input) input.click();
                }
            };
            
            modalContent.addEventListener('change', this.handlePhotoUploadDelegate);
            modalContent.addEventListener('click', this.handlePhotoLabelClickDelegate);
        }
    }

    closeModal() {
        this.modalManager.closeModal('museumModal');
    }

    showAchievementModal() {
        this.renderAchievements();
        this.modalManager.showModal('achievementModal');
        
        // Track achievement view
        this.trackEvent('achievements_viewed', {
            'visited_count': this.visitedMuseums.length,
            'achievement_count': this.currentAchievements ? this.currentAchievements.filter(a => a.achieved).length : 0
        });
    }

    closeAchievementModal() {
        this.modalManager.closeModal('achievementModal');
        
        // Hide poster section when closing
        const posterSection = document.getElementById('achievementPosterSection');
        if (posterSection) {
            posterSection.style.display = 'none';
        }
    }

    showAssessmentHistoryModal() {
        this.renderAssessmentHistory();
        this.modalManager.showModal('assessmentHistoryModal');
        
        // Track assessment history view
        this.trackEvent('assessment_history_viewed', {
            'total_assessments': this.getAssessmentHistoryCount()
        });
    }

    closeAssessmentHistoryModal() {
        this.modalManager.closeModal('assessmentHistoryModal');
    }

    showSettingsModal() {
        this.renderSettingsInfo();
        this.modalManager.showModal('settingsModal');
        
        // Track settings view
        this.trackEvent('settings_viewed', {
            'museum_count': MUSEUMS.length,
            'visited_count': this.visitedMuseums.length
        });
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    renderSettingsInfo() {
        // Update museum count
        document.getElementById('museumCountSettings').textContent = MUSEUMS.length;
    }

    renderAchievements() {
        const visitedCount = this.visitedMuseums.length;
        const achievements = this.calculateAchievements(visitedCount);
        const achievedCount = achievements.filter(a => a.achieved).length;
        
        // Update summary stats
        document.getElementById('totalAchievements').textContent = achievedCount;
        document.getElementById('visitProgress').textContent = `${visitedCount}/${MUSEUM_COUNT}`;
        
        // Render achievement list
        const achievementList = document.getElementById('achievementList');
        achievementList.innerHTML = achievements.map(achievement => {
            const progressBar = achievement.achieved ? '' : `
                <div class="achievement-progress">
                    进度: ${achievement.progress}/${achievement.visits} (还需${achievement.remaining}个)
                </div>
            `;
            
            const dateDisplay = achievement.achieved ? `
                <div class="achievement-date">获得于 ${achievement.date}</div>
            ` : '';
            
            return `
                <div class="achievement-item ${achievement.achieved ? 'achieved' : 'pending'}">
                    <div class="achievement-emoji">${achievement.emoji}</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    ${dateDisplay}
                    ${progressBar}
                </div>
            `;
        }).join('');
        
        // Set up achievement poster generation
        this.setupAchievementPosterGeneration();
    }
    
    setupAchievementPosterGeneration() {
        const generateBtn = document.getElementById('generateAchievementPoster');
        const downloadBtn = document.getElementById('downloadAchievementPoster');
        
        generateBtn.replaceWith(generateBtn.cloneNode(true));
        downloadBtn.replaceWith(downloadBtn.cloneNode(true));
        
        document.getElementById('generateAchievementPoster').addEventListener('click', () => {
            this.generateAchievementPoster();
        });
        
        document.getElementById('downloadAchievementPoster').addEventListener('click', () => {
            this.downloadAchievementPoster();
        });
    }

    editChecklistItem(button) {
        const checklistItem = button.closest('.checklist-item');
        const label = checklistItem.querySelector('.checklist-label');
        const currentText = label.textContent;
        const checklistKey = checklistItem.dataset.checklistKey;
        const itemIndex = parseInt(checklistItem.dataset.itemIndex);

        // Create input field for editing
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'editing-input';
        input.value = currentText;
        
        // Replace label with input
        label.style.display = 'none';
        label.parentNode.insertBefore(input, label.nextSibling);
        
        input.focus();
        input.select();

        // Save on Enter or blur
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                this.updateChecklistItem(checklistKey, itemIndex, newText);
                label.textContent = newText;
            }
            
            input.remove();
            label.style.display = '';
        };

        // Cancel on Escape
        const cancelEdit = () => {
            input.remove();
            label.style.display = '';
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
    }

    deleteChecklistItem(button) {
        const checklistItem = button.closest('.checklist-item');
        const checklistKey = checklistItem.dataset.checklistKey;
        const itemIndex = parseInt(checklistItem.dataset.itemIndex);
        
        if (confirm('确定要删除这个项目吗？')) {
            this.removeChecklistItem(checklistKey, itemIndex);
            this.refreshCurrentChecklist();
        }
    }

    addChecklistItem(button) {
        const checklistKey = button.dataset.checklistKey;
        const newText = prompt('请输入新的清单项目：');
        
        if (newText && newText.trim()) {
            const newItemIndex = this.insertChecklistItem(checklistKey, newText.trim());
            this.refreshCurrentChecklist();
            
            // Enhanced UX: Scroll to newly added item after a brief delay to ensure DOM is updated
            setTimeout(() => {
                this.scrollToNewItem(checklistKey, newItemIndex);
            }, 200);
        }
    }

    updateChecklistItem(checklistKey, itemIndex, newText) {
        // Initialize custom checklist if it doesn't exist
        if (!this.customChecklists[checklistKey]) {
            this.initializeCustomChecklist(checklistKey);
        }

        // Update the item text
        this.customChecklists[checklistKey][itemIndex] = {
            text: newText,
            isCustom: this.customChecklists[checklistKey][itemIndex] ? 
                     this.customChecklists[checklistKey][itemIndex].isCustom : false,
            originalIndex: this.customChecklists[checklistKey][itemIndex] ? 
                          this.customChecklists[checklistKey][itemIndex].originalIndex : itemIndex
        };

        this.saveCustomChecklists();
    }

    removeChecklistItem(checklistKey, itemIndex) {
        if (!this.customChecklists[checklistKey]) {
            this.initializeCustomChecklist(checklistKey);
        }

        // Remove item from custom checklist
        this.customChecklists[checklistKey].splice(itemIndex, 1);
        
        // Update completion tracking indices
        const completed = this.museumChecklists[checklistKey] || [];
        const newCompleted = completed.map(index => {
            if (index === itemIndex) return -1; // Mark for removal
            return index > itemIndex ? index - 1 : index; // Shift down indices
        }).filter(index => index !== -1);
        
        this.museumChecklists[checklistKey] = newCompleted;
        
        this.saveCustomChecklists();
        this.saveMuseumChecklists();
    }

    insertChecklistItem(checklistKey, newText) {
        if (!this.customChecklists[checklistKey]) {
            this.initializeCustomChecklist(checklistKey);
        }

        // Add new custom item
        this.customChecklists[checklistKey].push({
            text: newText,
            isCustom: true
        });

        this.saveCustomChecklists();
        
        // Return the index of the newly added item
        return this.customChecklists[checklistKey].length - 1;
    }

    initializeCustomChecklist(checklistKey) {
        // Parse checklist key to get original items
        const keyParts = checklistKey.split('-');
        const ageGroup = keyParts[keyParts.length - 1];
        const ageGroupStart = keyParts[keyParts.length - 2];
        const fullAgeGroup = `${ageGroupStart}-${ageGroup}`;
        const checklistType = keyParts[keyParts.length - 3];
        const museumId = keyParts.slice(0, keyParts.length - 3).join('-');
        
        const museum = MUSEUMS.find(m => m.id === museumId);
        const originalItems = museum && museum.checklists[checklistType] && 
                            museum.checklists[checklistType][fullAgeGroup] ? 
                            museum.checklists[checklistType][fullAgeGroup] : [];

        // Initialize with original items
        this.customChecklists[checklistKey] = originalItems.map((item, index) => ({
            text: item,
            isCustom: false,
            originalIndex: index
        }));
    }

    refreshCurrentChecklist() {
        // Re-render the current modal content while preserving tab state
        const modal = document.getElementById('museumModal');
        if (!modal.classList.contains('hidden')) {
            const modalTitle = document.getElementById('modalTitle');
            const museumName = modalTitle.textContent.replace(' - 参观指南', '');
            const museum = MUSEUMS.find(m => m.name === museumName);
            
            if (museum) {
                // Store current active tab
                const activeTab = document.querySelector('.tab-button.active');
                const activeTarget = activeTab ? activeTab.dataset.target : 'parent';
                
                // Re-render the checklist content for the specific tabs
                const parentContent = document.getElementById('parentChecklist');
                const childContent = document.getElementById('childChecklist');
                
                if (parentContent) {
                    parentContent.innerHTML = `
                        <div class="checklist-header">
                            <h3>家长准备事项</h3>
                            <div class="checklist-actions">
                                <button class="share-button" data-type="parent" title="分享家长准备清单">
                                    🔗
                                </button>
                                <button class="clear-checklist-button clear-parent-button" data-museum="${museum.id}" data-type="parent" title="清空家长清单数据">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        ${this.renderChecklist(museum.id, 'parent', museum.checklists.parent[this.currentAge])}
                    `;
                }
                
                if (childContent) {
                    childContent.innerHTML = `
                        <div class="checklist-header">
                            <h3>孩子探索任务</h3>
                            <div class="checklist-actions">
                                <button class="share-button" data-type="child" title="分享孩子任务清单">
                                    🔗
                                </button>
                                <button class="clear-checklist-button clear-child-button" data-museum="${museum.id}" data-type="child" title="清空孩子清单数据">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        ${this.renderChecklist(museum.id, 'child', museum.checklists.child[this.currentAge])}
                    `;
                }
                
                // Re-attach event listeners with a small delay to ensure DOM is updated
                setTimeout(() => {
                    this.addChecklistEventListeners();
                }, 10);
                
                // Restore active tab state if it's not the default
                if (activeTarget !== 'parent') {
                    setTimeout(() => {
                        const tabButton = document.querySelector(`.tab-button[data-target="${activeTarget}"]`);
                        if (tabButton) {
                            tabButton.click();
                        }
                    }, 20);
                }
            }
        }
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Show loading indicator while processing large files
        const container = event.target.closest('.checklist-item');
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'photo-loading';
        loadingIndicator.textContent = '处理中...';
        loadingIndicator.style.cssText = 'padding: 10px; text-align: center; color: #666; font-style: italic;';
        
        const photoUpload = container.querySelector('.photo-upload-section');
        if (photoUpload) {
            photoUpload.appendChild(loadingIndicator);
        }
        
        const taskKey = event.target.dataset.taskKey;
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const photoData = e.target.result;
                
                // Save photo using IndexedDB if available, fallback to localStorage
                const success = await this.saveTaskPhotoAsync(taskKey, photoData);
                
                if (!success) {
                    alert('照片保存失败，请重试。');
                    return;
                }
                
                // Update the display
                const existingPhoto = container.querySelector('.task-photo');
                if (existingPhoto) {
                    existingPhoto.src = photoData;
                } else {
                    if (photoUpload) {
                        const img = document.createElement('img');
                        img.className = 'task-photo';
                        img.src = photoData;
                        img.alt = '任务照片';
                        photoUpload.appendChild(img);
                    }
                }
            } catch (error) {
                console.error('Failed to process photo upload:', error);
                alert('照片上传失败，请重试。');
            } finally {
                // Remove loading indicator
                if (loadingIndicator && loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
            }
        };
        
        reader.onerror = () => {
            alert('读取图片文件失败，请重试。');
            // Remove loading indicator
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
        };
        
        reader.readAsDataURL(file);
    }

    addPhotoUploadToItem(item, checklistKey, index) {
        // Check if photo upload section already exists
        if (item.querySelector('.photo-upload-section')) {
            return;
        }
        
        const itemId = `${checklistKey}-${index}`;
        const photoKey = `${checklistKey}-${index}`;
        const hasPhoto = this.taskPhotos[photoKey];
        
        const photoUploadHtml = `
            <div class="photo-upload-section">
                <label for="photo-${itemId}" class="photo-upload-label">
                    📷 上传照片留念
                </label>
                <input type="file" id="photo-${itemId}" accept="image/*" class="photo-input" 
                       data-task-key="${photoKey}" style="display: none;">
                ${hasPhoto ? `<img src="${hasPhoto}" class="task-photo" alt="任务照片">` : ''}
            </div>
        `;
        
        item.insertAdjacentHTML('beforeend', photoUploadHtml);
        
        // Event listeners are handled by delegation in addChecklistEventListeners()
        // No need to add individual listeners here
    }

    removePhotoUploadFromItem(item) {
        const photoSection = item.querySelector('.photo-upload-section');
        if (photoSection) {
            photoSection.remove();
        }
    }

    setupPosterGeneration(museum) {
        setTimeout(() => {
            const generateBtn = document.getElementById('generatePoster');
            const downloadBtn = document.getElementById('downloadPoster');
            
            if (generateBtn) {
                generateBtn.addEventListener('click', () => {
                    this.generatePoster(museum);
                });
            }
            
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadPoster(museum);
                });
            }
        }, 100);
    }

    generatePoster(museum) {
        const canvas = document.getElementById('posterCanvas');
        const ctx = canvas.getContext('2d');
        const preview = document.getElementById('posterPreview');
        
        // Get completed child tasks to calculate required height
        const checklistKey = `${museum.id}-child-${this.currentAge}`;
        const completed = this.museumChecklists[checklistKey] || [];
        
        // Get custom checklist items if they exist, otherwise use default items (same logic as renderChecklist)
        const customItems = this.customChecklists[checklistKey];
        const childTasks = customItems ? customItems.map(item => item.text) : museum.checklists.child[this.currentAge];
        const completedTasks = completed.map(index => childTasks[index]).filter(Boolean);
        
        // Calculate dynamic height based on number of completed tasks - IMPROVED for better accuracy
        const baseHeight = 350; // Header and basic layout space
        const minHeight = 550; // Minimum height for basic layout
        
        // Improved height calculation accounting for realistic content requirements
        let calculatedHeight = baseHeight;
        
        if (completedTasks.length > 0) {
            // Estimate realistic space requirements for tasks and photos
            const avgLinesPerTask = 2.2; // Average lines per Chinese task (realistic estimate)
            const lineHeight = 35; // Height per text line
            const taskSpacing = 40; // Spacing between tasks
            const photoAreaHeight = Math.min(300, completedTasks.length * 60); // Photo grid height estimate
            const footerHeight = 110; // Footer space
            const margins = 80; // Top and bottom margins
            const museumImageHeight = museum.image ? 220 : 0; // Space for museum image if present
            
            // More accurate calculation
            const textHeight = completedTasks.length * avgLinesPerTask * lineHeight;
            const spacingHeight = Math.max(0, completedTasks.length - 1) * taskSpacing;
            
            // FIX: Add generous buffer for text wrapping unpredictability, especially for 9+ tasks
            const bufferForTextWrapping = completedTasks.length * 50; // Extra 50px per task for wrapping
            
            calculatedHeight = baseHeight + museumImageHeight + textHeight + spacingHeight + photoAreaHeight + footerHeight + margins + bufferForTextWrapping;
        }
        
        const dynamicHeight = Math.max(minHeight, calculatedHeight);
        
        // Set canvas size for good quality (Instagram/WeChat friendly)
        canvas.width = 1080;
        canvas.height = dynamicHeight;
        
        // Background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // NOTE: Border will be drawn AFTER all content is finalized to ensure it encompasses everything
        
        // Title section
        ctx.fillStyle = '#2c5aa0';
        ctx.fillRect(40, 40, canvas.width - 80, 120);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 42px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏛️ 博物馆打卡', canvas.width / 2, 110);
        
        // Museum name
        ctx.fillStyle = '#2c5aa0';
        ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(museum.name, canvas.width / 2, 200);
        
        // Date and location
        const visitDate = new Date().toLocaleDateString('zh-CN');
        ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(`📅 ${visitDate}  📍 ${museum.location}`, canvas.width / 2, 240);
        
        // Completed tasks already calculated above for dynamic height
        
        // Collect photos for completed tasks
        const taskPhotos = [];
        completed.forEach(index => {
            const photoKey = `${checklistKey}-${index}`;
            const photoData = this.taskPhotos[photoKey];
            if (photoData) {
                taskPhotos.push({
                    index: index,
                    data: photoData,
                    task: childTasks[index]
                });
            }
        });
        
        let yPosition = 280; // Reduced gap between header and content
        
        if (completedTasks.length > 0) {
            // Completed tasks header
            ctx.fillStyle = '#28a745';
            ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('✅ 已完成的探索任务:', 80, yPosition);
            yPosition += 50; // Reduced spacing after header
            
            // Use async/await pattern to load and draw photos
            this.drawTasksWithPhotos(ctx, completedTasks, taskPhotos, completed, yPosition, canvas, preview, museum);
            return; // Exit early, completion handled in drawTasksWithPhotos
        } else {
            // No completed tasks message
            ctx.fillStyle = '#666';
            ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('还没有完成的任务，继续加油！', canvas.width / 2, yPosition);
            yPosition += 50; // Reduced space after the message
            
            // Footer for no tasks case - position after content
            const finalY = this.drawPosterFooter(ctx, canvas, yPosition);
            
            // Resize canvas to fit actual content + margins
            const borderMargin = 50; // Optimized margin for border
            const newHeight = Math.max(finalY + borderMargin, 400);
            if (newHeight !== canvas.height) {
                canvas.height = newHeight;
                // Redraw everything on the resized canvas
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Redraw border
                ctx.strokeStyle = '#2c5aa0';
                ctx.lineWidth = 8;
                ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
                
                // Redraw title section
                ctx.fillStyle = '#2c5aa0';
                ctx.fillRect(40, 40, canvas.width - 80, 120);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 42px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🏛️ 博物馆打卡', canvas.width / 2, 110);
                
                // Redraw museum name
                ctx.fillStyle = '#2c5aa0';
                ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.fillText(museum.name, canvas.width / 2, 200);
                
                // Redraw date and location
                ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.fillStyle = '#666';
                ctx.fillText(`📅 ${visitDate}  📍 ${museum.location}`, canvas.width / 2, 240);
                
                // Redraw no tasks message
                ctx.fillStyle = '#666';
                ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('还没有完成的任务，继续加油！', canvas.width / 2, 280);
                
                // Redraw footer
                this.drawPosterFooter(ctx, canvas, 330);
            } else {
                // If no resize needed, still need to draw the border to encompass footer
                ctx.strokeStyle = '#2c5aa0';
                ctx.lineWidth = 8;
                ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            }
        }
        
        // Show preview (hide original canvas to prevent white space issue)
        canvas.style.display = 'none';  // Fix: Hide original canvas
        preview.innerHTML = '';
        const clonedCanvas = canvas.cloneNode(true);
        
        // CRITICAL FIX: Copy actual canvas drawing content (not just DOM structure)
        // cloneNode(true) only clones the DOM element, not the pixel data
        const clonedCtx = clonedCanvas.getContext('2d');
        clonedCtx.drawImage(canvas, 0, 0);  // Copy the actual poster content
        
        clonedCanvas.style.display = 'block';  // Fix: Make preview canvas visible
        preview.appendChild(clonedCanvas);
        
        // Show download button
        document.getElementById('downloadPoster').style.display = 'inline-block';
        
        // Track poster generation
        this.trackEvent('poster_generated', {
            'museum_id': museum.id,
            'museum_name': museum.name,
            'completed_tasks': completedTasks.length,
            'age_group': this.currentAge
        });
    }

    async drawTasksWithPhotos(ctx, completedTasks, taskPhotos, completed, startY, canvas, preview, museum) {
        let yPosition = startY;
        
        // Add museum main image at the top if available
        if (museum.image) {
            const museumImg = new Image();
            museumImg.crossOrigin = 'anonymous';
            
            // Create a promise for museum image loading
            const museumImagePromise = new Promise((resolve) => {
                museumImg.onload = () => resolve(museumImg);
                museumImg.onerror = () => resolve(null);
                museumImg.src = museum.image;
            });
            
            const loadedMuseumImg = await museumImagePromise;
            
            if (loadedMuseumImg) {
                // Calculate museum image display size
                const maxImageWidth = 280;
                const maxImageHeight = 180;
                const aspectRatio = loadedMuseumImg.naturalWidth / loadedMuseumImg.naturalHeight;
                let imageWidth = maxImageWidth;
                let imageHeight = maxImageHeight;
                
                if (aspectRatio > 1) {
                    imageHeight = maxImageWidth / aspectRatio;
                } else {
                    imageWidth = maxImageHeight * aspectRatio;
                }
                
                // Center the museum image
                const imageX = (canvas.width - imageWidth) / 2;
                const imageY = yPosition;
                
                // Draw museum image with subtle border
                ctx.fillStyle = 'white';
                ctx.fillRect(imageX - 3, imageY - 3, imageWidth + 6, imageHeight + 6);
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 2;
                ctx.strokeRect(imageX - 3, imageY - 3, imageWidth + 6, imageHeight + 6);
                
                ctx.drawImage(loadedMuseumImg, imageX, imageY, imageWidth, imageHeight);
                
                // Add subtle label
                ctx.fillStyle = '#666';
                ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(museum.name, canvas.width / 2, imageY + imageHeight + 20);
                
                yPosition = imageY + imageHeight + 40; // Update position after image
            }
        }
        
        ctx.font = '26px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#333';
        
        // Load all images first
        const imagePromises = taskPhotos.map(photoInfo => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ ...photoInfo, img });
                img.onerror = () => resolve({ ...photoInfo, img: null });
                img.src = photoInfo.data;
            });
        });
        
        const loadedPhotos = await Promise.all(imagePromises);
        const validPhotos = loadedPhotos.filter(photo => photo.img);
        const photoCount = validPhotos.length;
        
        // Calculate layout parameters based on photo count - OPTIMIZED for better space utilization
        const hasPhotos = photoCount > 0;
        const taskListWidth = hasPhotos ? canvas.width * 0.42 : canvas.width - 160; // Slightly reduced tasks area
        const photoAreaStartX = hasPhotos ? canvas.width * 0.45 : 0; // Better balance between sections
        const photoAreaWidth = hasPhotos ? canvas.width * 0.53 : 0; // Optimized photo area size
        
        // Calculate compact photo grid layout - OPTIMIZED for larger photos
        let photosPerRow = 2;
        let photoSize = 140; // Increased base photo size
        
        if (photoCount === 1) {
            photosPerRow = 1;
            photoSize = Math.min(200, photoAreaWidth - 40); // Larger single photo
        } else if (photoCount <= 4) {
            photosPerRow = 2;
            photoSize = Math.min(140, (photoAreaWidth - 30) / 2); // Increased photo size
        } else if (photoCount <= 9) {
            photosPerRow = 3;
            photoSize = Math.min(110, (photoAreaWidth - 40) / 3); // Increased photo size
        } else {
            photosPerRow = 4;
            photoSize = Math.min(95, (photoAreaWidth - 50) / 4); // Increased photo size
        }
        
        const photoRows = Math.ceil(photoCount / photosPerRow);
        const photoGridHeight = photoRows * (photoSize + 15) + 30; // Extra padding
        
        // Draw task list on the left with optimized spacing
        const taskSpacing = 40; // Further optimized for better density
        let taskEndY = yPosition;
        
        completedTasks.forEach((task, taskIndex) => {
            const taskNumber = taskIndex + 1;
            
            // Draw task text with word wrapping
            const words = task.split('');
            let line = '';
            const lines = [];
            
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i];
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > (taskListWidth - 120) && line !== '') {
                    lines.push(line);
                    line = words[i];
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            
            // Draw task text
            let textY = yPosition;
            lines.forEach((lineText, lineIndex) => {
                if (lineIndex === 0) {
                    ctx.fillText(`${taskNumber}. ${lineText}`, 100, textY);
                } else {
                    ctx.fillText(`   ${lineText}`, 100, textY);
                }
                textY += 35;
            });
            
            yPosition += Math.max(taskSpacing, lines.length * 35 + 20);
        });
        
        taskEndY = yPosition;
        
        // Draw photo grid on the right side if photos exist
        if (hasPhotos) {
            // Add a small title above the photo grid
            ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('📸 探索留念', photoAreaStartX + photoAreaWidth / 2, startY + 35);
            
            // Reset font for photo labels
            ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#333';
            
            let photoGridStartY = startY + 60; // Reduced spacing
            let photoIndex = 0;
            
            for (let row = 0; row < photoRows && photoIndex < validPhotos.length; row++) {
                for (let col = 0; col < photosPerRow && photoIndex < validPhotos.length; col++) {
                    const photo = validPhotos[photoIndex];
                    
                    // Calculate photo position
                    const spacing = 15;
                    const photoX = photoAreaStartX + col * (photoSize + spacing);
                    const photoY = photoGridStartY + row * (photoSize + spacing);
                    
                    // Draw photo background
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(photoX - 3, photoY - 3, photoSize + 6, photoSize + 6);
                    ctx.strokeStyle = '#ddd';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(photoX - 3, photoY - 3, photoSize + 6, photoSize + 6);
                    
                    // Calculate aspect ratio and draw photo
                    const aspectRatio = photo.img.width / photo.img.height;
                    let drawWidth = photoSize;
                    let drawHeight = photoSize;
                    
                    if (aspectRatio > 1) {
                        drawHeight = photoSize / aspectRatio;
                    } else {
                        drawWidth = photoSize * aspectRatio;
                    }
                    
                    const drawX = photoX + (photoSize - drawWidth) / 2;
                    const drawY = photoY + (photoSize - drawHeight) / 2;
                    
                    ctx.drawImage(photo.img, drawX, drawY, drawWidth, drawHeight);
                    
                    photoIndex++;
                }
            }
        }
        
        // Use the maximum of task end position and photo grid end position
        const photoGridEndY = hasPhotos ? startY + 60 + photoGridHeight : startY;
        yPosition = Math.max(taskEndY, photoGridEndY) + 30; // Reduced bottom spacing
        
        // Calculate required height before drawing footer
        const footerHeight = 110; // footer content (70) + bottom padding (40)
        const requiredHeight = Math.max(yPosition + footerHeight + 20, 400); // Content + footer + margin
        
        // Resize canvas first if needed to ensure footer has space
        if (requiredHeight !== canvas.height) {
            // Create temporary canvas to preserve existing content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Copy current canvas content to temporary canvas
            tempCtx.drawImage(canvas, 0, 0);
            
            // Resize original canvas to required height
            canvas.height = requiredHeight;
            
            // Clear the resized canvas
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Copy back the existing content
            ctx.drawImage(tempCanvas, 0, 0);
            
            // Note: Border redraw removed to fix duplicate blue line issue
            // The original border from tempCanvas is already copied back above
        }
        
        // Now draw footer with proper space allocated
        const finalY = this.drawPosterFooter(ctx, canvas, yPosition);
        
        // OPTIMIZATION: Draw final border to encompass all content including footer
        ctx.strokeStyle = '#2c5aa0';
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // Show preview (hide original canvas to prevent white space issue)
        canvas.style.display = 'none';  // Fix: Hide original canvas
        preview.innerHTML = '';
        const clonedCanvas = canvas.cloneNode(true);
        
        // CRITICAL FIX: Copy actual canvas drawing content (not just DOM structure)
        // cloneNode(true) only clones the DOM element, not the pixel data
        const clonedCtx = clonedCanvas.getContext('2d');
        clonedCtx.drawImage(canvas, 0, 0);  // Copy the actual poster content
        
        clonedCanvas.style.display = 'block';  // Fix: Make preview canvas visible
        preview.appendChild(clonedCanvas);
        
        // Show download button
        document.getElementById('downloadPoster').style.display = 'inline-block';
    }

    drawPosterFooter(ctx, canvas, contentEndY) {
        // Position footer right after content with some padding, instead of fixed position from canvas bottom
        const yPosition = contentEndY ? contentEndY + 40 : canvas.height - 140;
        ctx.fillStyle = '#2c5aa0';
        ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('由 MuseumCheck 博物馆打卡应用生成', canvas.width / 2, yPosition);
        
        // Add website URL prominently for traffic generation
        ctx.fillStyle = '#2c5aa0';
        ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('MuseumCheck.cn', canvas.width / 2, yPosition + 35);
        
        // Add emoji decoration
        ctx.font = '32px Arial';
        ctx.fillText('🎨 📸 🎉', canvas.width / 2, yPosition + 70);
        
        // Return the final Y position after footer for canvas resizing
        return yPosition + 70 + 40; // footer height + bottom padding
    }

    downloadPoster(museum) {
        const canvas = document.getElementById('posterCanvas');
        const link = document.createElement('a');
        link.download = `${museum.name}_博物馆打卡_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Track download
        this.trackEvent('poster_downloaded', {
            'museum_id': museum.id,
            'museum_name': museum.name,
            'age_group': this.currentAge
        });
    }

    generateAchievementPoster() {
        const canvas = document.getElementById('achievementPosterCanvas');
        const ctx = canvas.getContext('2d');
        const preview = document.getElementById('achievementPosterPreview');
        
        const visitedCount = this.visitedMuseums.length;
        const achievements = this.calculateAchievements(visitedCount);
        const achievedAchievements = achievements.filter(a => a.achieved);
        
        // Set canvas size for good quality
        canvas.width = 1080;
        canvas.height = 1400; // Taller for achievements
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Header section
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(40, 40, canvas.width - 80, 120);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 博物馆成就榜', canvas.width / 2, 110);
        
        // Stats section  
        let yPosition = 200;
        ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(`🏛️ 已参观 ${visitedCount} / ${MUSEUM_COUNT} 家博物馆`, canvas.width / 2, yPosition);
        
        yPosition += 60;
        const percentage = visitedCount > 0 
            ? Math.round((visitedCount / MUSEUM_COUNT) * 100 * 10) / 10 
            : 0;
        ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(`完成度: ${percentage}% | 获得成就: ${achievedAchievements.length}个`, canvas.width / 2, yPosition);
        
        // Progress bar
        yPosition += 50;
        const barWidth = 600;
        const barHeight = 20;
        const barX = (canvas.width - barWidth) / 2;
        
        // Background bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, yPosition, barWidth, barHeight);
        
        // Progress bar
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, yPosition, (barWidth * visitedCount) / MUSEUM_COUNT, barHeight);
        
        // Achievement list
        yPosition += 80;
        ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('🎖️ 已获得成就', canvas.width / 2, yPosition);
        
        yPosition += 40;
        if (achievedAchievements.length === 0) {
            ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText('继续参观博物馆来解锁成就吧！', canvas.width / 2, yPosition);
        } else {
            // Display achievements in grid
            const achievementsPerRow = 2;
            const achievementWidth = 250;
            const achievementHeight = 120;
            const startX = (canvas.width - (achievementsPerRow * achievementWidth + (achievementsPerRow - 1) * 40)) / 2;
            
            achievedAchievements.slice(0, 8).forEach((achievement, index) => {
                const row = Math.floor(index / achievementsPerRow);
                const col = index % achievementsPerRow;
                const x = startX + col * (achievementWidth + 40);
                const y = yPosition + row * (achievementHeight + 20);
                
                // Achievement background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(x, y, achievementWidth, achievementHeight);
                
                // Achievement emoji
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(achievement.emoji, x + achievementWidth/2, y + 40);
                
                // Achievement name
                ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.fillStyle = 'white';
                ctx.fillText(achievement.name, x + achievementWidth/2, y + 70);
                
                // Achievement description
                ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillText(achievement.description, x + achievementWidth/2, y + 90);
            });
            
            if (achievedAchievements.length > 8) {
                const remainingCount = achievedAchievements.length - 8;
                yPosition += Math.ceil(Math.min(achievedAchievements.length, 8) / achievementsPerRow) * (achievementHeight + 20) + 40;
                ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.textAlign = 'center';
                ctx.fillText(`...还有 ${remainingCount} 个成就`, canvas.width / 2, yPosition);
            }
        }
        
        // Footer
        yPosition = canvas.height - 140; // Increase footer height to accommodate website URL
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(40, yPosition, canvas.width - 80, 100);
        
        ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('博物馆打卡 - 让孩子爱上博物馆之旅', canvas.width / 2, yPosition + 25);
        
        // Add website URL prominently for traffic generation
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText('MuseumCheck.cn', canvas.width / 2, yPosition + 55);
        
        const visitDate = new Date().toLocaleDateString('zh-CN');
        ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(`生成于 ${visitDate}`, canvas.width / 2, yPosition + 80);
        
        // Show preview
        preview.innerHTML = '';
        const clonedCanvas = canvas.cloneNode(true);
        const clonedCtx = clonedCanvas.getContext('2d');
        clonedCtx.drawImage(canvas, 0, 0);
        clonedCanvas.style.display = 'block';
        preview.appendChild(clonedCanvas);
        
        // Show poster section and download button
        document.getElementById('achievementPosterSection').style.display = 'block';
        document.getElementById('downloadAchievementPoster').style.display = 'inline-block';
        
        // Auto-scroll to the generated poster for better user experience
        const posterSection = document.getElementById('achievementPosterSection');
        posterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Track poster generation
        this.trackEvent('achievement_poster_generated', {
            'visited_count': visitedCount,
            'achievement_count': achievedAchievements.length,
            'completion_percentage': percentage
        });
    }
    
    downloadAchievementPoster() {
        const canvas = document.getElementById('achievementPosterCanvas');
        const link = document.createElement('a');
        link.download = `博物馆成就榜_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Track download
        this.trackEvent('achievement_poster_downloaded', {
            'visited_count': this.visitedMuseums.length,
            'achievement_count': this.currentAchievements ? this.currentAchievements.filter(a => a.achieved).length : 0
        });
    }

    // Enhanced Rocket Animation Methods
    createRocketAnimation(isLarge = false, sourceElement = null) {
        const rocket = document.createElement('div');
        rocket.className = `rocket-animation ${isLarge ? 'large' : 'small'}`;
        rocket.innerHTML = `
            <div class="rocket-body">🚀</div>
            <div class="rocket-trail"></div>
            <div class="rocket-sparks"></div>
        `;
        
        // Position rocket at source element or random position
        let startX, startY;
        if (sourceElement) {
            const rect = sourceElement.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = window.innerHeight - rect.top;
        } else {
            startX = Math.random() * (window.innerWidth - 100) + 50;
            startY = 50;
        }
        
        rocket.style.left = startX + 'px';
        rocket.style.bottom = startY + 'px';
        
        document.body.appendChild(rocket);
        
        // Add screen shake effect for large rockets
        if (isLarge) {
            this.addScreenShake();
        }
        
        // Create particle burst effect
        this.createParticleEffect(startX, startY, isLarge);
        
        // Trigger animation with enhanced timing
        setTimeout(() => {
            rocket.classList.add(isLarge ? 'launch-large' : 'launch-small');
        }, 100);
        
        // Remove element after animation
        setTimeout(() => {
            if (rocket && rocket.parentNode) {
                rocket.parentNode.removeChild(rocket);
            }
        }, isLarge ? UI_CONSTANTS.ANIMATION.NOTIFICATION_DURATION_LARGE : UI_CONSTANTS.ANIMATION.NOTIFICATION_DURATION);
        
        return rocket;
    }

    addScreenShake() {
        const body = document.body;
        body.classList.add('screen-shake');
        setTimeout(() => {
            body.classList.remove('screen-shake');
        }, 600);
    }

    createParticleEffect(x, y, isLarge = false) {
        const particleCount = isLarge ? 15 : 8;
        const colors = ['#FFD700', '#FF6B35', '#FF1744', '#FFC107', '#FF9800'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'rocket-particle';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = x + 'px';
            particle.style.bottom = y + 'px';
            
            const angle = (360 / particleCount) * i + Math.random() * 30;
            const velocity = (Math.random() * 100 + 50) * (isLarge ? 1.5 : 1);
            
            particle.style.setProperty('--angle', angle + 'deg');
            particle.style.setProperty('--velocity', velocity + 'px');
            particle.style.setProperty('--size', (Math.random() * 6 + 3) + 'px');
            
            document.body.appendChild(particle);
            
            // Trigger particle animation
            setTimeout(() => {
                particle.classList.add('particle-explode');
            }, 50);
            
            // Remove particle
            setTimeout(() => {
                if (particle && particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }

    createCelebrationEffect(isLarge = false) {
        // Create celebratory text
        const celebration = document.createElement('div');
        celebration.className = `celebration-text ${isLarge ? 'large' : 'small'}`;
        celebration.innerHTML = isLarge ? 
            '<span class="celebration-emoji">🎉</span><span>博物馆打卡成功!</span><span class="celebration-emoji">🎉</span>' :
            '<span class="celebration-emoji">⭐</span><span>任务完成!</span><span class="celebration-emoji">⭐</span>';
        
        celebration.style.left = '50%';
        celebration.style.top = '30%';
        celebration.style.transform = 'translateX(-50%)';
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.classList.add('celebration-appear');
        }, 200);
        
        setTimeout(() => {
            if (celebration && celebration.parentNode) {
                celebration.parentNode.removeChild(celebration);
            }
        }, 3000);
        
        return celebration;
    }

    triggerSmallRocket(sourceElement = null) {
        // Create multiple small rockets for more impact
        const rocketCount = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < rocketCount; i++) {
            setTimeout(() => {
                this.createRocketAnimation(false, sourceElement);
            }, i * 300);
        }
        
        // Add celebration effect
        setTimeout(() => {
            this.createCelebrationEffect(false);
        }, 500);
        
        // Track small rocket animation
        this.trackEvent('enhanced_small_rocket_animation', {
            'timestamp': new Date().toISOString(),
            'rocket_count': rocketCount
        });
    }

    triggerLargeRocket(sourceElement = null) {
        // Create multiple large rockets for museum visits
        const rocketCount = Math.floor(Math.random() * 3) + 2; // 2-4 rockets
        
        for (let i = 0; i < rocketCount; i++) {
            setTimeout(() => {
                this.createRocketAnimation(true, sourceElement);
            }, i * 400);
        }
        
        // Add celebration effect
        setTimeout(() => {
            this.createCelebrationEffect(true);
        }, 800);
        
        // Track large rocket animation  
        this.trackEvent('enhanced_large_rocket_animation', {
            'timestamp': new Date().toISOString(),
            'rocket_count': rocketCount
        });
    }

    // Assessment System
    openAssessmentModal(museumId) {
        const museum = MUSEUMS.find(m => m.id === museumId);
        if (!museum) return;

        const modal = document.getElementById('assessmentModal');
        const title = document.getElementById('assessmentTitle');
        
        title.textContent = `🧡 ${museum.name} - 亲子测评`;
        
        // Check for existing progress
        const savedProgress = this.loadAssessmentProgress(museumId);
        
        // Only show resume dialog for truly incomplete assessments
        if (savedProgress && savedProgress.currentStep < 3 && !savedProgress.completed) {
            // Resume from saved progress
            this.assessmentState = {
                museumId: savedProgress.museumId,
                currentStep: savedProgress.currentStep,
                parentAnswers: savedProgress.parentAnswers || [],
                childAnswers: savedProgress.childAnswers || [],
                score: 0,
                timestamp: savedProgress.timestamp
            };
            
            // Show resume option to user
            this.showResumeProgressDialog(savedProgress);
        } else {
            // Clear completed or invalid progress and start fresh
            if (savedProgress) {
                this.clearAssessmentProgress();
            }
            // Initialize fresh assessment state
            this.assessmentState = {
                museumId,
                currentStep: 0,
                parentAnswers: [],
                childAnswers: [],
                score: 0,
                timestamp: new Date().toISOString()
            };
            
            // Show initial step
            this.showAssessmentStep(0);
        }
        
        modal.classList.remove('hidden');
        
        // Setup modal event listeners
        this.setupAssessmentEventListeners();
        
        // Track assessment start
        this.trackEvent('assessment_started', {
            'museum_id': museumId,
            'museum_name': museum.name,
            'is_resume': !!savedProgress
        });
    }

    // Save assessment progress to localStorage
    saveAssessmentProgress(progressData) {
        try {
            progressData.timestamp = new Date().toISOString();
            localStorage.setItem('assessmentProgress', JSON.stringify(progressData));
            
            // Track progress save
            this.trackEvent('assessment_progress_saved', {
                'museum_id': progressData.museumId,
                'current_step': progressData.currentStep,
                'parent_answers_count': (progressData.parentAnswers || []).length,
                'child_answers_count': (progressData.childAnswers || []).length
            });
            
            return true;
        } catch (error) {
            console.warn('Failed to save assessment progress:', error);
            return false;
        }
    }

    // Load assessment progress from localStorage
    loadAssessmentProgress(museumId) {
        try {
            const savedProgress = localStorage.getItem('assessmentProgress');
            if (!savedProgress) return null;
            
            const progress = JSON.parse(savedProgress);
            
            // Verify the progress is for the same museum and not too old (24 hours)
            if (progress.museumId === museumId) {
                const timestamp = new Date(progress.timestamp);
                const now = new Date();
                const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) { // Progress valid for 24 hours
                    // Issue #270 fix: Enhanced completion detection
                    // Only return progress if assessment is truly incomplete
                    if (progress.completed === true || progress.currentStep >= 3) {
                        // Assessment is already completed, clear stale progress
                        this.clearAssessmentProgress();
                        return null;
                    }
                    
                    // Additional validation: check if required answers are complete
                    const parentComplete = progress.parentAnswers && progress.parentAnswers.length >= 5 && 
                                         !progress.parentAnswers.some(a => a === undefined || a === null);
                    const childComplete = progress.childAnswers && progress.childAnswers.length >= 5 && 
                                        !progress.childAnswers.some(a => a === undefined || a === null);
                    
                    // If both questionnaires are complete, assessment should be considered completed
                    if (parentComplete && childComplete && progress.currentStep >= 2) {
                        this.clearAssessmentProgress();
                        return null;
                    }
                    
                    // Additional check: don't show continue for step 0 with no answers
                    if (progress.currentStep === 0 && 
                        (!progress.parentAnswers || progress.parentAnswers.length === 0) &&
                        (!progress.childAnswers || progress.childAnswers.length === 0)) {
                        this.clearAssessmentProgress();
                        return null;
                    }
                    
                    return progress;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to load assessment progress:', error);
            return null;
        }
    }

    // Clear assessment progress
    clearAssessmentProgress() {
        try {
            localStorage.removeItem('assessmentProgress');
            return true;
        } catch (error) {
            console.warn('Failed to clear assessment progress:', error);
            return false;
        }
    }

    // Show dialog for resuming progress
    showResumeProgressDialog(savedProgress) {
        const resumeDialog = document.createElement('div');
        resumeDialog.className = 'resume-progress-dialog';
        resumeDialog.innerHTML = `
            <div class="resume-progress-content">
                <h3>📋 发现未完成的测评</h3>
                <div class="resume-progress-buttons">
                    <button id="resumeAssessment" class="btn-primary">继续完成</button>
                    <button id="startNewAssessment" class="btn-secondary">重新开始</button>
                </div>
            </div>
        `;
        
        // Insert into assessment modal
        const assessmentContent = document.getElementById('assessmentContent');
        assessmentContent.innerHTML = '';
        assessmentContent.appendChild(resumeDialog);
        
        // Handle resume button
        document.getElementById('resumeAssessment').onclick = () => {
            // Restore original modal structure before resuming
            this.resetAssessmentModalStructure();
            
            // Re-setup event listeners for the restored DOM elements
            this.setupAssessmentEventListeners();
            
            // Now show the assessment step
            this.showAssessmentStep(savedProgress.currentStep);
        };
        
        // Handle restart button  
        document.getElementById('startNewAssessment').onclick = () => {
            this.clearAssessmentProgress();
            this.assessmentState = {
                museumId: savedProgress.museumId,
                currentStep: 0,
                parentAnswers: [],
                childAnswers: [],
                score: 0,
                timestamp: new Date().toISOString()
            };
            
            // Restore original modal structure before showing assessment step
            this.resetAssessmentModalStructure();
            
            // Re-setup event listeners for the new DOM elements
            this.setupAssessmentEventListeners();
            
            this.showAssessmentStep(0);
        };
    }

    // Reset assessment modal to original structure
    resetAssessmentModalStructure() {
        const assessmentContent = document.getElementById('assessmentContent');
        if (!assessmentContent) return;

        // Restore the original modal structure
        assessmentContent.innerHTML = `
            <div class="assessment-intro">
                <p>通过简单的问卷，了解您的亲子关系现状，获得专业的改善建议。</p>
                <p>请根据实际情况选择最符合的答案，测评结果将帮助您更好地改善亲子关系。</p>
            </div>
            <div class="assessment-form" id="assessmentForm">
                <!-- Content will be filled dynamically -->
            </div>
            <div class="assessment-buttons">
                <button id="assessmentNext" class="btn-primary">开始测评</button>
            </div>
        `;
        
        // Initialize step tabs with proper accessibility attributes
        this.initializeStepTabs();
    }

    // Initialize step tabs with proper accessibility and non-clickable state
    initializeStepTabs() {
        const steps = document.querySelectorAll('.step');
        if (steps.length === 0) {
            // Step indicators have been removed for simplified UI
            return;
        }
        
        steps.forEach((stepEl, index) => {
            // Set base accessibility attributes
            stepEl.setAttribute('role', 'tab');
            stepEl.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            stepEl.setAttribute('tabindex', '-1'); // Not focusable by keyboard
            
            // Issue #270 fix: Make tabs non-interactive indicators only
            stepEl.style.cursor = 'default';
            stepEl.removeAttribute('onclick');
            stepEl.onclick = null;
            
            // Clear any visual indicators that suggest clickability
            if (index === 0) {
                stepEl.classList.add('active');
                stepEl.style.opacity = '1';
            } else {
                stepEl.classList.add('disabled');
                stepEl.style.opacity = '0.6';
                stepEl.style.pointerEvents = 'none';
            }
        });
    }

    // Get step name for display
    getStepName(step) {
        switch(step) {
            case 0: return '测评介绍';
            case 1: return '家长问卷';
            case 2: return '孩子问卷';  
            case 3: return '测评结果';
            default: return '未知步骤';
        }
    }

    setupAssessmentEventListeners() {
        const modal = document.getElementById('assessmentModal');
        const closeBtn = modal.querySelector('.close');
        const nextBtn = document.getElementById('assessmentNext');

        // Initialize step tabs when setting up listeners
        this.initializeStepTabs();

        // Close modal
        const closeModal = () => {
            // If in middle of assessment, ask user about saving progress
            if (this.assessmentState && this.assessmentState.currentStep > 0 && this.assessmentState.currentStep < 3) {
                const hasAnswers = (this.assessmentState.parentAnswers && this.assessmentState.parentAnswers.length > 0) ||
                                 (this.assessmentState.childAnswers && this.assessmentState.childAnswers.length > 0);
                
                if (hasAnswers) {
                    const shouldSave = confirm(
                        '您的测评尚未完成，是否保存当前进度？\n\n' +
                        '选择"确定"：保存进度，下次可以继续完成\n' +
                        '选择"取消"：不保存，直接退出'
                    );
                    
                    if (shouldSave) {
                        // Progress is already auto-saved, just show confirmation
                        this.trackEvent('assessment_progress_kept', {
                            'museum_id': this.assessmentState.museumId,
                            'current_step': this.assessmentState.currentStep
                        });
                    } else {
                        // Clear saved progress
                        this.clearAssessmentProgress();
                        this.trackEvent('assessment_progress_discarded', {
                            'museum_id': this.assessmentState.museumId,
                            'current_step': this.assessmentState.currentStep
                        });
                    }
                }
            }
            
            modal.classList.add('hidden');
            this.assessmentState = null;
        };

        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // Navigation buttons
        nextBtn.onclick = () => this.nextAssessmentStep();
    }

    showAssessmentStep(step) {
        const form = document.getElementById('assessmentForm');
        const steps = document.querySelectorAll('.step');
        const nextBtn = document.getElementById('assessmentNext');

        // Return early if essential elements are missing
        if (!form || !nextBtn) {
            console.error('Assessment modal elements not found');
            return;
        }

        // Update step indicators
        steps.forEach((stepEl, index) => {
            stepEl.classList.remove('active', 'completed');
            if (index < step) {
                stepEl.classList.add('completed');
            } else if (index === step) {
                stepEl.classList.add('active');
            }
        });

        // Remove the previous button display logic since button was removed
        
        // Auto-scroll to assessment form top for better mobile UX
        setTimeout(() => {
            const assessmentModal = document.getElementById('assessmentModal');
            const assessmentForm = document.getElementById('assessmentForm');
            if (assessmentModal && assessmentForm) {
                assessmentForm.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, 100);
        
        if (step === 0) {
            // Introduction step - Simplified and concise
            const museum = this.getCurrentMuseum();
            const museumName = museum ? museum.name : '博物馆';
            
            form.innerHTML = ``;
            nextBtn.textContent = '开始测评';
        } else if (step === 1) {
            // Parent questionnaire
            this.showParentQuestions();
            nextBtn.textContent = '下一步';
        } else if (step === 2) {
            // Child questionnaire  
            this.showChildQuestions();
            nextBtn.textContent = '查看结果';
        } else if (step === 3) {
            // Results
            this.showAssessmentResults();
            nextBtn.textContent = '完成测评';
            nextBtn.onclick = () => {
                // Clear saved progress since assessment is completed
                this.clearAssessmentProgress();
                document.getElementById('assessmentModal').classList.add('hidden');
                
                // Track completion
                this.trackEvent('assessment_completed_and_closed', {
                    'museum_id': this.assessmentState.museumId,
                    'score': this.assessmentState.score
                });
            };
        }

        this.assessmentState.currentStep = step;
        
        // Auto-scroll to form area for better UX
        this.scrollToFormArea();
        
        // Auto-save progress (except for results step)
        if (step < 3) {
            this.autoSaveAssessmentProgress();
        }
        
        // Update step visual states for better accessibility
        this.updateStepVisualStates(step);
    }
    
    // Auto-scroll to form area on step changes for better mobile UX
    scrollToFormArea() {
        const modalContent = document.querySelector('.modal-content.assessment-content');
        const assessmentForm = document.getElementById('assessmentForm');
        
        if (modalContent && assessmentForm) {
            // Issue #270 fix: Enhanced mobile auto-scroll behavior
            if (window.innerWidth <= 768) {
                // On mobile, scroll to top of modal for better question visibility
                setTimeout(() => {
                    modalContent.scrollTo({ 
                        top: 0, 
                        behavior: 'smooth' 
                    });
                }, 150); // Slightly longer delay for better UX
            } else {
                // On desktop, scroll to form area specifically
                setTimeout(() => {
                    assessmentForm.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                }, 100);
            }
        }
    }
    
    // Auto-save assessment progress
    autoSaveAssessmentProgress() {
        if (this.assessmentState) {
            const progressData = {
                museumId: this.assessmentState.museumId,
                currentStep: this.assessmentState.currentStep,
                parentAnswers: this.assessmentState.parentAnswers || [],
                childAnswers: this.assessmentState.childAnswers || [],
                completed: this.assessmentState.currentStep >= 3, // Mark as completed when on results step
                timestamp: this.assessmentState.timestamp
            };
            
            this.saveAssessmentProgress(progressData);
        }
    }
    
    // Update visual states for better accessibility and UX
    updateStepVisualStates(currentStep) {
        const steps = document.querySelectorAll('.step');
        
        steps.forEach((stepEl, index) => {
            // Clear all states first
            stepEl.classList.remove('active', 'completed', 'disabled', 'current');
            stepEl.removeAttribute('aria-current');
            stepEl.removeAttribute('aria-label');
            stepEl.removeAttribute('onclick'); // Remove any click handlers
            
            // Set base accessibility attributes for all steps
            stepEl.setAttribute('role', 'tab');
            stepEl.setAttribute('aria-selected', 'false');
            
            if (index < currentStep) {
                // Completed steps
                stepEl.classList.add('completed');
                stepEl.style.cursor = 'default';
                stepEl.style.opacity = '0.8';
                stepEl.setAttribute('aria-label', `步骤${index + 1}: ${this.getStepName(index + 1)} - 已完成`);
            } else if (index === currentStep) {
                // Current active step
                stepEl.classList.add('active', 'current');
                stepEl.style.cursor = 'default';
                stepEl.style.opacity = '1';
                stepEl.setAttribute('aria-current', 'step');
                stepEl.setAttribute('aria-selected', 'true');
                stepEl.setAttribute('aria-label', `当前步骤: ${this.getStepName(index + 1)}`);
            } else {
                // Future/disabled steps
                stepEl.classList.add('disabled');
                stepEl.style.cursor = 'not-allowed';
                stepEl.style.opacity = '0.5';
                stepEl.setAttribute('aria-label', `步骤${index + 1}: ${this.getStepName(index + 1)} - 未开始`);
            }
        });
    }

    showParentQuestions() {
        const form = document.getElementById('assessmentForm');
        const questions = this.getParentQuestions();
        const museum = this.getCurrentMuseum();
        const museumName = museum ? museum.name : '博物馆';
        
        form.innerHTML = `
            <div class="questionnaire-section">
                <h3>家长问卷 - ${museumName}</h3>
                ${questions.map((q, index) => `
                    <div class="question-container">
                        <div class="question-title">${index + 1}. ${q.question}</div>
                        <div class="question-options">
                            ${q.options.map((option, optIndex) => `
                                <label class="option-item" data-question="${index}" data-option="${optIndex}">
                                    <input type="radio" name="parent_q${index}" value="${optIndex}">
                                    <span class="option-text">${option.text}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click handlers for options
        this.setupQuestionHandlers('parent');
    }

    showChildQuestions() {
        const form = document.getElementById('assessmentForm');
        const questions = this.getChildQuestions();
        const museum = this.getCurrentMuseum();
        const museumName = museum ? museum.name : '博物馆';
        
        form.innerHTML = `
            <div class="questionnaire-section">
                <h3>孩子问卷 - ${museumName}</h3>
                ${questions.map((q, index) => `
                    <div class="question-container">
                        <div class="question-title">${index + 1}. ${q.question}</div>
                        <div class="question-options">
                            ${q.options.map((option, optIndex) => `
                                <label class="option-item" data-question="${index}" data-option="${optIndex}">
                                    <input type="radio" name="child_q${index}" value="${optIndex}">
                                    <span class="option-text">${option.text}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click handlers for options
        this.setupQuestionHandlers('child');
    }

    setupQuestionHandlers(type) {
        const options = document.querySelectorAll('.option-item');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const questionIndex = parseInt(option.dataset.question);
                const optionIndex = parseInt(option.dataset.option);
                
                // Remove previous selection
                const questionContainer = option.closest('.question-container');
                questionContainer.querySelectorAll('.option-item').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selection
                option.classList.add('selected');
                option.querySelector('input').checked = true;
                
                // Store answer
                if (type === 'parent') {
                    this.assessmentState.parentAnswers[questionIndex] = optionIndex;
                } else {
                    this.assessmentState.childAnswers[questionIndex] = optionIndex;
                }
                
                // Auto-save progress after each answer
                this.autoSaveAssessmentProgress();
                
                // Auto-scroll to next question on mobile for better UX
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        this.scrollToNextQuestion(questionIndex);
                    }, 300); // Small delay to let selection animation complete
                }
            });
        });
    }

    // Auto-scroll to next question on mobile devices
    scrollToNextQuestion(currentQuestionIndex) {
        const questions = document.querySelectorAll('.question-container');
        const nextQuestion = questions[currentQuestionIndex + 1];
        
        if (nextQuestion) {
            // Scroll to next question
            nextQuestion.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        } else {
            // No more questions, scroll to bottom to show navigation buttons
            const assessmentButtons = document.querySelector('.assessment-buttons');
            if (assessmentButtons) {
                assessmentButtons.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end',
                    inline: 'nearest'
                });
            }
        }
    }

    nextAssessmentStep() {
        const currentStep = this.assessmentState.currentStep;
        
        if (currentStep === 1) {
            // Validate parent questions
            if (this.assessmentState.parentAnswers.length < 5 || 
                this.assessmentState.parentAnswers.some(a => a === undefined)) {
                alert('请完成所有题目后再继续');
                return;
            }
        } else if (currentStep === 2) {
            // Validate child questions and calculate results
            if (this.assessmentState.childAnswers.length < 5 || 
                this.assessmentState.childAnswers.some(a => a === undefined)) {
                alert('请完成所有题目后再继续');
                return;
            }
            this.calculateAssessmentScore();
        }
        
        this.showAssessmentStep(currentStep + 1);
    }

    calculateAssessmentScore() {
        const parentScore = this.assessmentState.parentAnswers.reduce((sum, answer) => sum + answer, 0);
        const childScore = this.assessmentState.childAnswers.reduce((sum, answer) => sum + answer, 0);
        
        // Calculate final score (0-100 scale)
        const maxScore = 5 * 2 * 4; // 5 questions * 2 questionnaires * 4 max points per question
        const totalScore = (parentScore + childScore) * 4; // Scale up answer indices
        this.assessmentState.score = Math.round((totalScore / maxScore) * 100);
        
        // Save results to localStorage
        this.saveAssessmentResult();
    }

    showAssessmentResults() {
        const form = document.getElementById('assessmentForm');
        const score = this.assessmentState.score;
        const level = this.getRelationshipLevel(score);
        const suggestions = this.getRelationshipSuggestions(score);

        form.innerHTML = `
            <div class="assessment-results">
                <div class="score-display">
                    <div class="score-number">${score}</div>
                    <div class="score-label">${level.title}</div>
                    <div class="score-description">${level.description}</div>
                </div>
                <div class="suggestions">
                    <h4>💡 改善建议</h4>
                    <ul>
                        ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    getRelationshipLevel(score) {
        if (score >= 85) {
            return {
                title: '亲子关系优秀',
                description: '您和孩子之间有很好的沟通和理解，请继续保持这种良好的关系！'
            };
        } else if (score >= 70) {
            return {
                title: '亲子关系良好',
                description: '您和孩子的关系总体不错，还有一些提升空间，可以尝试更多的互动活动。'
            };
        } else if (score >= 50) {
            return {
                title: '亲子关系一般',
                description: '您和孩子的关系需要更多的关注和改善，建议增加高质量的陪伴时间。'
            };
        } else {
            return {
                title: '亲子关系需要关注',
                description: '建议您更多地关注孩子的情感需求，寻求专业的家庭教育指导。'
            };
        }
    }

    getRelationshipSuggestions(score) {
        const allSuggestions = [
            '每天安排固定的亲子交流时间，不被手机等外界干扰',
            '多倾听孩子的想法，避免过度批评和指责',
            '参与孩子感兴趣的活动，建立共同话题',
            '给予孩子更多的肯定和鼓励，增强其自信心',
            '设立合理的规则和边界，让孩子感到安全',
            '和孩子一起制定家庭活动计划，如博物馆参观',
            '学习正确的沟通技巧，用积极的语言表达',
            '关注孩子的情绪变化，及时提供支持和帮助',
            '培养家庭传统和仪式感，增强归属感',
            '必要时寻求专业的家庭教育咨询服务'
        ];
        
        if (score >= 70) {
            return allSuggestions.slice(0, 4);
        } else if (score >= 50) {
            return allSuggestions.slice(2, 7);
        } else {
            return allSuggestions.slice(4, 9);
        }
    }

    saveAssessmentResult() {
        try {
            const results = JSON.parse(localStorage.getItem('assessmentResults') || '{}');
            const museumId = this.assessmentState.museumId;
            
            results[museumId] = {
                score: this.assessmentState.score,
                date: new Date().toISOString(),
                parentAnswers: this.assessmentState.parentAnswers,
                childAnswers: this.assessmentState.childAnswers
            };
            
            localStorage.setItem('assessmentResults', JSON.stringify(results));
            
            // Track completion
            this.trackEvent('assessment_completed', {
                'museum_id': museumId,
                'score': this.assessmentState.score,
                'completion_date': new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to save assessment result:', error);
        }
    }

    getParentQuestions() {
        const museum = this.getCurrentMuseum();
        if (!museum) return this.getDefaultParentQuestions();
        
        // Generate museum-specific questions based on tags and content
        const baseQuestions = this.generateMuseumSpecificParentQuestions(museum);
        return baseQuestions;
    }
    
    getCurrentMuseum() {
        if (!this.assessmentState || !this.assessmentState.museumId) return null;
        return MUSEUMS.find(m => m.id === this.assessmentState.museumId);
    }
    
    generateMuseumSpecificParentQuestions(museum) {
        const museumType = this.getMuseumType(museum);
        const baseName = museum.name;
        const museumContext = this.getMuseumContext(museum);
        
        return [
            {
                question: `在参观${baseName}时，您是如何引导孩子观察和理解${museumContext.exhibits}的？`,
                options: [
                    { text: "主要是我自己在看，孩子跟着走", score: 0 },
                    { text: `简单地告诉孩子这些${museumContext.exhibits}是什么`, score: 1 },
                    { text: `会引导孩子仔细观察${museumContext.exhibits}，并简单解释`, score: 2 },
                    { text: `耐心引导孩子发现${museumContext.exhibits}的细节，一起探讨其价值和意义`, score: 3 }
                ]
            },
            {
                question: `在${baseName}参观过程中，孩子对${museumContext.theme}内容不理解时，您是如何回应的？`,
                options: [
                    { text: "告诉孩子长大了就懂了", score: 0 },
                    { text: "给出简单直接的答案", score: 1 },
                    { text: `尝试用孩子能理解的方式解释${museumContext.theme}`, score: 2 },
                    { text: `和孩子一起寻找答案，共同探索${museumContext.theme}的奥秘`, score: 3 }
                ]
            },
            {
                question: `在参观${baseName}的${this.getMuseumFeature(museumType)}展区时，您如何激发孩子的好奇心？`,
                options: [
                    { text: "主要关注孩子是否听话跟着走", score: 0 },
                    { text: "注意孩子是否感到无聊或疲惫", score: 1 },
                    { text: `引导孩子寻找${museumContext.highlights}，观察其特点`, score: 2 },
                    { text: `鼓励孩子提问和分享发现，一起探讨${museumContext.highlights}背后的故事`, score: 3 }
                ]
            },
            {
                question: `这次${baseName}之行中，您和孩子关于${museumContext.theme}的交流如何？`,
                options: [
                    { text: "主要是我在讲解，孩子在听", score: 1 },
                    { text: `偶尔会问孩子对${museumContext.theme}的看法`, score: 2 },
                    { text: `经常和孩子交流对${museumContext.theme}的观察和理解`, score: 3 },
                    { text: `我们像探险伙伴一样共同发现${museumContext.theme}的魅力`, score: 3 }
                ]
            },
            {
                question: `参观${baseName}后，您计划如何延续孩子对${museumContext.theme}的学习兴趣？`,
                options: [
                    { text: "参观结束就结束了", score: 0 },
                    { text: `可能偶尔提起今天看到的${museumContext.theme}内容`, score: 1 },
                    { text: `会和孩子一起回顾${museumContext.theme}中有趣的发现`, score: 2 },
                    { text: `准备寻找相关书籍、纪录片等，和孩子继续深入探索${museumContext.theme}`, score: 3 }
                ]
            }
        ];
    }
    
    getDefaultParentQuestions() {
        return [
            {
                question: "您平时和孩子的交流频率如何？",
                options: [
                    { text: "很少交流，主要是生活必需的对话", score: 0 },
                    { text: "偶尔聊天，但不够深入", score: 1 },
                    { text: "经常交流，会聊一些日常话题", score: 2 },
                    { text: "每天都有深入的交流和分享", score: 3 }
                ]
            },
            {
                question: "当孩子遇到困难时，您通常如何处理？",
                options: [
                    { text: "直接告诉孩子解决方案", score: 1 },
                    { text: "批评孩子，要求其自己解决", score: 0 },
                    { text: "先倾听，然后给出建议", score: 2 },
                    { text: "耐心引导孩子思考解决办法", score: 3 }
                ]
            },
            {
                question: "您了解孩子的兴趣爱好吗？",
                options: [
                    { text: "不太了解，忙于工作", score: 0 },
                    { text: "有一定了解，但不深入", score: 1 },
                    { text: "比较了解，会支持孩子的兴趣", score: 2 },
                    { text: "非常了解，经常参与孩子的兴趣活动", score: 3 }
                ]
            },
            {
                question: "您觉得孩子愿意向您分享内心想法吗？",
                options: [
                    { text: "很少分享，比较封闭", score: 0 },
                    { text: "偶尔分享一些无关紧要的事", score: 1 },
                    { text: "会分享日常的事情和想法", score: 2 },
                    { text: "非常愿意分享，包括内心感受", score: 3 }
                ]
            },
            {
                question: "您和孩子在一起时的感受如何？",
                options: [
                    { text: "经常感到紧张或压力", score: 0 },
                    { text: "有时愉快，有时有些困难", score: 1 },
                    { text: "大部分时间都很愉快", score: 2 },
                    { text: "非常享受亲子时光", score: 3 }
                ]
            }
        ];
    }

    getChildQuestions() {
        const museum = this.getCurrentMuseum();
        if (!museum) return this.getDefaultChildQuestions();
        
        // Generate museum-specific child questions
        const baseQuestions = this.generateMuseumSpecificChildQuestions(museum);
        return baseQuestions;
    }
    
    generateMuseumSpecificChildQuestions(museum) {
        const museumType = this.getMuseumType(museum);
        const baseName = museum.name;
        const museumContext = this.getMuseumContext(museum);
        
        return [
            {
                question: `在${baseName}参观时，孩子是否对${museumContext.highlights}主动提出问题或分享发现？`,
                options: [
                    { text: "全程很安静，没有主动交流", score: 0 },
                    { text: `偶尔会指出感兴趣的${museumContext.highlights}`, score: 1 },
                    { text: `会问一些关于${museumContext.highlights}的简单问题`, score: 2 },
                    { text: `经常主动分享对${museumContext.highlights}的观察和想法`, score: 3 }
                ]
            },
            {
                question: `面对${baseName}的${this.getMuseumFeature(museumType)}时，孩子的好奇心如何？`,
                options: [
                    { text: "显得无聊，只是被动跟着", score: 0 },
                    { text: `会看${this.getMuseumFeature(museumType)}但不太有反应`, score: 1 },
                    { text: `对部分${this.getMuseumFeature(museumType)}表现出兴趣`, score: 2 },
                    { text: `积极观察${this.getMuseumFeature(museumType)}，还想深入了解`, score: 3 }
                ]
            },
            {
                question: `当您在${baseName}讲解${museumContext.theme}时，孩子的专注度如何？`,
                options: [
                    { text: "注意力很快就分散了", score: 0 },
                    { text: `会听您讲${museumContext.theme}但表情平淡`, score: 1 },
                    { text: `认真听您讲解${museumContext.theme}，偶尔点头`, score: 2 },
                    { text: `专注倾听${museumContext.theme}的讲解，还会接话互动`, score: 3 }
                ]
            },
            {
                question: `孩子在${baseName}探索${museumContext.theme}过程中是否寻求您的关注和认可？`,
                options: [
                    { text: "很少寻求关注，比较独立", score: 1 },
                    { text: "偶尔会看向我寻求确认", score: 2 },
                    { text: `经常询问我对${museumContext.theme}的看法`, score: 3 },
                    { text: `总是希望和我分享关于${museumContext.theme}的感受`, score: 3 }
                ]
            },
            {
                question: `离开${baseName}时，孩子对这次${museumContext.theme}之旅的反应如何？`,
                options: [
                    { text: "迫不及待要离开", score: 0 },
                    { text: "没有特别的表现", score: 1 },
                    { text: `有些不舍，还想再看看${museumContext.theme}相关展品`, score: 2 },
                    { text: `兴奋地谈论今天关于${museumContext.theme}的发现`, score: 3 }
                ]
            }
        ];
    }
    
    getDefaultChildQuestions() {
        return [
            {
                question: "孩子是否愿意和您分享学校发生的事情？",
                options: [
                    { text: "从不主动分享", score: 0 },
                    { text: "很少分享，需要多次询问", score: 1 },
                    { text: "有时会分享有趣的事情", score: 2 },
                    { text: "经常主动分享各种事情", score: 3 }
                ]
            },
            {
                question: "当您不在家时，孩子的表现如何？",
                options: [
                    { text: "明显更加放松和自由", score: 0 },
                    { text: "行为有一定变化", score: 1 },
                    { text: "基本保持一致", score: 2 },
                    { text: "会想念您，期待您回来", score: 3 }
                ]
            },
            {
                question: "孩子对家庭活动的参与度如何？",
                options: [
                    { text: "不愿意参与，更喜欢独自活动", score: 0 },
                    { text: "被动参与，兴趣不高", score: 1 },
                    { text: "一般会配合参与", score: 2 },
                    { text: "积极主动，很期待家庭活动", score: 3 }
                ]
            },
            {
                question: "孩子遇到挫折时会向您求助吗？",
                options: [
                    { text: "从不求助，独自承受", score: 0 },
                    { text: "很少求助，更愿意找其他人", score: 1 },
                    { text: "有时会求助", score: 2 },
                    { text: "经常第一时间向您求助", score: 3 }
                ]
            },
            {
                question: "孩子对您的情绪变化敏感吗？",
                options: [
                    { text: "不太关注您的情绪", score: 1 },
                    { text: "会注意但不知如何应对", score: 2 },
                    { text: "比较敏感，会主动询问", score: 3 },
                    { text: "非常敏感，会试图安慰您", score: 3 }
                ]
            }
        ];
    }
    
    getMuseumContext(museum) {
        if (!museum || !museum.tags) {
            return {
                theme: '文化',
                exhibits: '展品',
                highlights: '展品'
            };
        }
        
        const tags = museum.tags;
        const name = museum.name;
        
        // Specific context based on museum type and characteristics
        if (tags.includes('历史') || tags.includes('古代') || tags.includes('文物')) {
            return {
                theme: '历史文化',
                exhibits: '历史文物',
                highlights: '珍贵文物和历史遗迹'
            };
        }
        
        if (tags.includes('艺术') || tags.includes('美术') || tags.includes('绘画') || tags.includes('雕塑')) {
            return {
                theme: '艺术文化',
                exhibits: '艺术作品',
                highlights: '精美的艺术品和创作技巧'
            };
        }
        
        if (tags.includes('科技') || tags.includes('科学') || tags.includes('创新')) {
            return {
                theme: '科学技术',
                exhibits: '科技展品',
                highlights: '科技成果和互动体验'
            };
        }
        
        if (tags.includes('自然') || tags.includes('生物') || tags.includes('地质')) {
            return {
                theme: '自然科学',
                exhibits: '自然标本',
                highlights: '珍奇的动植物标本和地质奇观'
            };
        }
        
        if (tags.includes('军事') || tags.includes('革命') || tags.includes('战争')) {
            return {
                theme: '军事历史',
                exhibits: '军事装备和历史文献',
                highlights: '军事装备和英雄事迹'
            };
        }
        
        if (tags.includes('民俗') || tags.includes('民族') || name.includes('民族')) {
            return {
                theme: '民族文化',
                exhibits: '民俗展品',
                highlights: '传统文化和民族特色'
            };
        }
        
        if (tags.includes('建筑') || tags.includes('园林')) {
            return {
                theme: '建筑文化',
                exhibits: '建筑模型和设计',
                highlights: '精美的建筑结构和园林设计'
            };
        }
        
        if (name.includes('故宫')) {
            return {
                theme: '宫廷文化',
                exhibits: '宫廷文物',
                highlights: '精美的宫廷珍宝和建筑艺术'
            };
        }
        
        if (name.includes('兵马俑') || name.includes('秦始皇')) {
            return {
                theme: '秦汉文化',
                exhibits: '兵马俑和秦汉文物',
                highlights: '威武的兵马俑和古代军阵'
            };
        }
        
        if (name.includes('丝绸')) {
            return {
                theme: '丝绸文化',
                exhibits: '丝绸制品',
                highlights: '精美的丝绸工艺和传统技艺'
            };
        }
        
        if (name.includes('茶叶') || name.includes('茶')) {
            return {
                theme: '茶文化',
                exhibits: '茶具和茶叶',
                highlights: '茶道文化和制茶工艺'
            };
        }
        
        // Default context
        return {
            theme: '文化历史',
            exhibits: '展品',
            highlights: '珍贵的展品和文化内涵'
        };
    }

    getMuseumType(museum) {
        if (!museum || !museum.tags) return 'general';
        
        const tags = museum.tags;
        
        // Define museum type priorities
        if (tags.includes('科技') || tags.includes('科学') || tags.includes('创新')) return 'science';
        if (tags.includes('自然') || tags.includes('生物') || tags.includes('地质')) return 'nature'; 
        if (tags.includes('艺术') || tags.includes('美术') || tags.includes('绘画') || tags.includes('雕塑')) return 'art';
        if (tags.includes('历史') || tags.includes('考古') || tags.includes('古代') || tags.includes('文物')) return 'history';
        if (tags.includes('民俗') || tags.includes('文化') || museum.name.includes('民族')) return 'culture';
        if (tags.includes('军事') || tags.includes('革命') || tags.includes('战争')) return 'military';
        if (tags.includes('建筑') || tags.includes('园林')) return 'architecture';
        
        return 'general';
    }
    
    getMuseumFeature(museumType) {
        const features = {
            'science': '科技互动',
            'nature': '自然标本',
            'art': '艺术作品',
            'history': '历史文物',
            'culture': '民俗展示',
            'military': '军事装备',
            'architecture': '建筑模型',
            'general': '主要'
        };
        return features[museumType] || '主要';
    }

    // Assessment History Functionality
    renderAssessmentHistory() {
        const results = this.getAssessmentResults();
        const historyContent = document.getElementById('assessmentHistoryContent');
        const historyList = document.getElementById('historyList');
        const historyEmpty = document.getElementById('historyEmptyState');
        
        // Update summary statistics
        this.updateHistorySummary(results);
        
        // Populate museum filter
        this.populateMuseumFilter(results);
        
        if (results.length === 0) {
            historyEmpty.style.display = 'block';
            historyList.style.display = 'none';
        } else {
            historyEmpty.style.display = 'none';
            historyList.style.display = 'block';
            this.renderHistoryList(results);
        }
        
        // Setup event listeners
        this.setupHistoryEventListeners();
    }
    
    getAssessmentResults() {
        try {
            const results = JSON.parse(localStorage.getItem('assessmentResults') || '{}');
            const resultsArray = [];
            
            for (const [museumId, data] of Object.entries(results)) {
                const museum = MUSEUMS.find(m => m.id === museumId);
                if (museum) {
                    resultsArray.push({
                        museumId,
                        museumName: museum.name,
                        score: data.score,
                        date: new Date(data.date),
                        parentAnswers: data.parentAnswers,
                        childAnswers: data.childAnswers,
                        raw: data
                    });
                }
            }
            
            // Sort by date (newest first)
            return resultsArray.sort((a, b) => b.date - a.date);
        } catch (error) {
            console.error('Failed to load assessment results:', error);
            return [];
        }
    }
    
    getAssessmentHistoryCount() {
        const results = this.getAssessmentResults();
        return results.length;
    }
    
    updateHistorySummary(results) {
        const totalAssessments = results.length;
        const averageScore = totalAssessments > 0 
            ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalAssessments)
            : 0;
        const latestScore = totalAssessments > 0 ? results[0].score : 0;
        
        document.getElementById('totalAssessments').textContent = totalAssessments;
        document.getElementById('averageScore').textContent = averageScore;
        document.getElementById('latestScore').textContent = latestScore;
    }
    
    populateMuseumFilter(results) {
        const filter = document.getElementById('historyMuseumFilter');
        const museums = [...new Set(results.map(r => r.museumName))].sort();
        
        // Clear existing options except "all"
        filter.innerHTML = '<option value="">所有博物馆</option>';
        
        museums.forEach(museumName => {
            const option = document.createElement('option');
            option.value = museumName;
            option.textContent = museumName;
            filter.appendChild(option);
        });
    }
    
    renderHistoryList(results) {
        const historyList = document.getElementById('historyList');
        const filteredResults = this.getFilteredResults(results);
        
        historyList.innerHTML = filteredResults.map((result, index) => {
            const scoreLevel = this.getRelationshipLevel(result.score);
            const previousScore = index < results.length - 1 ? results[index + 1].score : null;
            const scoreTrend = this.getScoreTrend(result.score, previousScore);
            
            return `
                <div class="history-item">
                    <div class="history-item-header">
                        <div class="history-item-title">
                            ${result.museumName}
                            ${scoreTrend.html}
                        </div>
                        <div class="history-item-date">
                            ${this.formatDate(result.date)}
                        </div>
                    </div>
                    
                    <div class="history-score">
                        ${result.score}
                        <span class="history-score-label">${scoreLevel.title}</span>
                    </div>
                    
                    <div class="history-details">
                        <div class="history-section">
                            <div class="history-section-title">家长问卷结果</div>
                            <div class="history-answers">
                                ${this.formatAnswerSummary(result.parentAnswers, 'parent')}
                            </div>
                        </div>
                        
                        <div class="history-section">
                            <div class="history-section-title">孩子问卷结果</div>
                            <div class="history-answers">
                                ${this.formatAnswerSummary(result.childAnswers, 'child')}
                            </div>
                        </div>
                    </div>
                    
                    ${scoreTrend.comparison ? `
                        <div class="history-comparison">
                            ${scoreTrend.comparison}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    getFilteredResults(results) {
        const filter = document.getElementById('historyMuseumFilter');
        const selectedMuseum = filter.value;
        
        if (!selectedMuseum) {
            return results;
        }
        
        return results.filter(r => r.museumName === selectedMuseum);
    }
    
    getScoreTrend(currentScore, previousScore) {
        if (previousScore === null) {
            return { html: '', comparison: null };
        }
        
        const diff = currentScore - previousScore;
        let trendClass, trendIcon, trendText;
        
        if (diff > 0) {
            trendClass = 'up';
            trendIcon = '📈';
            trendText = `+${diff}`;
        } else if (diff < 0) {
            trendClass = 'down';
            trendIcon = '📉';
            trendText = `${diff}`;
        } else {
            trendClass = 'same';
            trendIcon = '➡️';
            trendText = '持平';
        }
        
        const html = `<span class="score-trend ${trendClass}">${trendIcon} ${trendText}</span>`;
        const comparison = `${trendIcon} 与上次测评相比：${trendText === '持平' ? '分数保持稳定' : `分数${diff > 0 ? '提升' : '下降'}了${Math.abs(diff)}分`}`;
        
        return { html, comparison };
    }
    
    formatAnswerSummary(answers, type) {
        if (!answers || answers.length === 0) {
            return '暂无数据';
        }
        
        const scores = answers.map(a => a || 0);
        const total = scores.reduce((sum, score) => sum + score, 0);
        const average = (total / scores.length).toFixed(1);
        
        return `
            平均得分：${average}/3.0<br>
            回答分布：${scores.map((score, i) => `Q${i+1}: ${score}`).join(', ')}
        `;
    }
    
    formatDate(date) {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    setupHistoryEventListeners() {
        // Museum filter change
        document.getElementById('historyMuseumFilter').addEventListener('change', () => {
            const results = this.getAssessmentResults();
            this.renderHistoryList(results);
        });
        
        // Export button
        document.getElementById('exportHistoryButton').addEventListener('click', () => {
            this.exportAssessmentHistory();
        });
    }
    
    exportAssessmentHistory() {
        try {
            const results = this.getAssessmentResults();
            
            if (results.length === 0) {
                alert('没有可导出的测评数据');
                return;
            }
            
            const exportData = results.map(result => ({
                博物馆: result.museumName,
                测评时间: this.formatDate(result.date),
                得分: result.score,
                关系水平: this.getRelationshipLevel(result.score).title,
                家长问卷得分: result.parentAnswers.reduce((sum, a) => sum + (a || 0), 0),
                孩子问卷得分: result.childAnswers.reduce((sum, a) => sum + (a || 0), 0)
            }));
            
            const csvContent = this.convertToCSV(exportData);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `亲子测评历史_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Track export
            this.trackEvent('assessment_history_exported', {
                'record_count': results.length
            });
        } catch (error) {
            console.error('Failed to export assessment history:', error);
            alert('导出失败，请稍后重试');
        }
    }
    
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.join(','));
        
        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
        }
        
        return '\ufeff' + csvRows.join('\n'); // Add BOM for proper Chinese display
    }

    // Clear Data Functionality
    clearAllData() {
        const confirmed = confirm(
            '⚠️ 重要警告 ⚠️\n\n' +
            '您即将清空所有数据，包括：\n' +
            '• 所有已参观博物馆记录\n' +
            '• 所有清单完成记录\n' +
            '• 所有任务照片\n' +
            '• 所有成就进度\n' +
            '• 所有亲子测评记录\n\n' +
            '此操作不可撤销！\n\n' +
            '确定要继续吗？'
        );
        
        if (confirmed) {
            const doubleConfirmed = confirm(
                '最后确认：\n\n' +
                '您真的要清空所有数据吗？\n' +
                '这将删除您的所有参观记录和进度！\n\n' +
                '点击"确定"将永久删除所有数据'
            );
            
            if (doubleConfirmed) {
                // Clear all localStorage data
                localStorage.removeItem('visitedMuseums');
                localStorage.removeItem('museumChecklists');
                localStorage.removeItem('taskPhotos');
                localStorage.removeItem('ageGroup');
                localStorage.removeItem('assessmentResults');
                localStorage.removeItem('assessmentProgress'); // Clear assessment progress
                
                // Clear IndexedDB data if supported
                if (this.indexedDBSupported) {
                    this.clearIndexedDBData();
                }
                
                // Reset application state
                this.visitedMuseums = [];
                this.museumChecklists = {};
                this.taskPhotos = {};
                this.currentAgeGroup = '7-12';
                
                // Update UI
                this.updateStats();
                this.renderMuseums();
                this.updateAgeGroupSelector();
                
                // Show success message
                alert('✅ 所有数据已成功清空！');
                
                // Track event
                this.trackEvent('clear_all_data', {
                    'timestamp': new Date().toISOString()
                });
            }
        }
    }

    clearParentChecklistData(museumId, ageGroup) {
        const confirmed = confirm(
            '⚠️ 清空家长清单数据 ⚠️\n\n' +
            `您即将清空「${this.getMuseumById(museumId)?.name || '此博物馆'}」\n` +
            `年龄组「${this.getAgeGroupLabel(ageGroup)}」的家长清单完成记录\n\n` +
            '此操作不可撤销！\n\n' +
            '确定要继续吗？'
        );
        
        if (confirmed) {
            const parentKey = `${museumId}-parent-${ageGroup}`;
            delete this.museumChecklists[parentKey];
            
            // Save updated data
            this.saveMuseumChecklists();
            
            // Update modal if currently open
            const modal = document.getElementById('museumModal');
            if (!modal.classList.contains('hidden')) {
                this.openMuseumModal(this.getMuseumById(museumId));
            }
            
            alert('✅ 家长清单数据已清空！');
            
            // Track event
            this.trackEvent('clear_parent_checklist', {
                'museum_id': museumId,
                'age_group': ageGroup,
                'timestamp': new Date().toISOString()
            });
        }
    }

    clearChildChecklistData(museumId, ageGroup) {
        const confirmed = confirm(
            '⚠️ 清空孩子清单数据 ⚠️\n\n' +
            `您即将清空「${this.getMuseumById(museumId)?.name || '此博物馆'}」\n` +
            `年龄组「${this.getAgeGroupLabel(ageGroup)}」的孩子清单完成记录\n\n` +
            '此操作不可撤销！\n\n' +
            '确定要继续吗？'
        );
        
        if (confirmed) {
            const childKey = `${museumId}-child-${ageGroup}`;
            delete this.museumChecklists[childKey];
            
            // Save updated data
            this.saveMuseumChecklists();
            
            // Update modal if currently open
            const modal = document.getElementById('museumModal');
            if (!modal.classList.contains('hidden')) {
                this.openMuseumModal(this.getMuseumById(museumId));
            }
            
            alert('✅ 孩子清单数据已清空！');
            
            // Track event
            this.trackEvent('clear_child_checklist', {
                'museum_id': museumId,
                'age_group': ageGroup,
                'timestamp': new Date().toISOString()
            });
        }
    }

    async clearIndexedDBData() {
        if (!this.indexedDBSupported) return;
        
        try {
            const request = indexedDB.deleteDatabase('MuseumCheckDB');
            request.onsuccess = () => {
                console.log('IndexedDB data cleared successfully');
            };
            request.onerror = (event) => {
                console.error('Failed to clear IndexedDB data:', event);
            };
        } catch (error) {
            console.error('Error clearing IndexedDB data:', error);
        }
    }

    getMuseumById(museumId) {
        return MUSEUMS.find(museum => museum.id === museumId);
    }

    getAgeGroupLabel(ageGroup) {
        const labels = {
            '3-6': '3-6岁 (学龄前)',
            '7-12': '7-12岁 (小学)', 
            '13-18': '13-18岁 (中学)'
        };
        return labels[ageGroup] || ageGroup;
    }
    
    // Enhanced UX: Smooth scrolling helper functions for better user experience
    
    /**
     * Scroll to the next unchecked item after user completes a checklist item
     * This guides users to the next task that needs attention
     */
    scrollToNextUncheckedItem(currentCheckbox) {
        const currentItem = currentCheckbox.closest('.checklist-item');
        const container = currentItem.closest('.checklist-content, #modalContent');
        
        if (!container) return;
        
        // Find all unchecked items in the current visible tab/container
        const allCheckboxes = container.querySelectorAll('input[type="checkbox"]');
        let foundCurrentIndex = -1;
        
        // Find the index of current checkbox
        for (let i = 0; i < allCheckboxes.length; i++) {
            if (allCheckboxes[i] === currentCheckbox) {
                foundCurrentIndex = i;
                break;
            }
        }
        
        // Look for next unchecked item
        if (foundCurrentIndex !== -1) {
            for (let i = foundCurrentIndex + 1; i < allCheckboxes.length; i++) {
                if (!allCheckboxes[i].checked) {
                    const nextItem = allCheckboxes[i].closest('.checklist-item');
                    this.smoothScrollToElement(nextItem, 'center');
                    
                    // Add subtle highlight to draw attention
                    this.highlightElement(nextItem, UI_CONSTANTS.ANIMATION.HIGHLIGHT_DURATION);
                    return;
                }
            }
            
            // If no next unchecked item, scroll to add button or completion message
            const addButton = container.querySelector('.add-item-btn');
            if (addButton) {
                this.smoothScrollToElement(addButton.closest('.add-item-section'), 'center');
            }
        }
    }
    
    /**
     * Scroll to the appropriate content area after tab switch
     */
    scrollToTabContent(targetTab) {
        let targetElement;
        
        switch (targetTab) {
            case 'expert':
                targetElement = document.getElementById('expertGuidance');
                break;
            case 'parent':
                targetElement = document.getElementById('parentChecklist');
                break;
            case 'child':
                targetElement = document.getElementById('childChecklist');
                break;
            case 'share':
                targetElement = document.getElementById('shareChecklist');
                break;
            default:
                return;
        }
        
        if (targetElement && targetElement.style.display !== 'none') {
            // Scroll to the content section header
            const header = targetElement.querySelector('h3, .checklist-header');
            const scrollTarget = header || targetElement;
            this.smoothScrollToElement(scrollTarget, 'start');
        }
    }
    
    /**
     * Scroll to a newly added checklist item
     */
    scrollToNewItem(checklistKey, itemIndex) {
        // Try to find the newly added item by its index
        const items = document.querySelectorAll(`[data-checklist-key="${checklistKey}"] .checklist-item`);
        
        if (items.length > itemIndex) {
            const newItem = items[itemIndex];
            this.smoothScrollToElement(newItem, 'center');
            
            // Add celebration highlight for the new item
            this.highlightElement(newItem, 3000, 'rgba(52, 211, 153, 0.2)'); // Green highlight
        }
    }
    
    /**
     * Smooth scroll to any element with customizable positioning
     */
    smoothScrollToElement(element, position = 'center', offset = 0) {
        if (!element) return;
        
        const modalContent = document.querySelector('#museumModal .modal-content');
        if (!modalContent) return;
        
        const elementRect = element.getBoundingClientRect();
        const modalRect = modalContent.getBoundingClientRect();
        const modalScrollTop = modalContent.scrollTop;
        
        let targetScrollTop;
        
        switch (position) {
            case 'start':
                targetScrollTop = modalScrollTop + (elementRect.top - modalRect.top) - 20 + offset;
                break;
            case 'center':
                targetScrollTop = modalScrollTop + (elementRect.top - modalRect.top) - (modalRect.height / 2) + (elementRect.height / 2) + offset;
                break;
            case 'end':
                targetScrollTop = modalScrollTop + (elementRect.bottom - modalRect.bottom) + 20 + offset;
                break;
            default:
                targetScrollTop = modalScrollTop + (elementRect.top - modalRect.top) + offset;
        }
        
        // Ensure we don't scroll beyond boundaries
        targetScrollTop = Math.max(0, targetScrollTop);
        
        modalContent.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
    }
    
    /**
     * Add a temporary highlight effect to draw attention to an element
     */
    highlightElement(element, duration = UI_CONSTANTS.ANIMATION.HIGHLIGHT_DURATION, color = UI_CONSTANTS.COLORS.HIGHLIGHT_DEFAULT) {
        if (!element) return;
        
        const originalTransition = element.style.transition;
        const originalBackground = element.style.backgroundColor;
        
        // Add highlight
        element.style.transition = UI_CONSTANTS.COLORS.TRANSITION_PROPERTY;
        element.style.backgroundColor = color;
        
        // Remove highlight after duration
        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            setTimeout(() => {
                element.style.transition = originalTransition;
            }, UI_CONSTANTS.ANIMATION.TRANSITION_DURATION);
        }, duration);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MuseumCheckApp();
});