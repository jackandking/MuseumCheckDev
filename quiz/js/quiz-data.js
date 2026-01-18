/**
 * Quiz Data Manager
 * 题库数据管理器
 * 
 * Responsible for:
 * - Loading museum data
 * - Generating questions from museum information
 * - Managing question bank
 * - Providing questions for quiz sessions
 */

class QuizData {
    /**
     * Initialize quiz data with adapter (Tier2 -> Tier1, meta-first)
     * @param {QuizAdapter} adapter
     * @returns {Promise<void>}
     */
    static async init(adapter) {
        if (!adapter) {
            throw new Error('QuizData.init requires adapter');
        }
        this.adapter = adapter;
        if (!this.readyPromise) {
            this.readyPromise = (async () => {
                const museums = await this.adapter.init();
                this.museumsMeta = Array.isArray(museums) ? museums : [];
                this.museumCache = new Map();
                this.museumsMeta.forEach(m => this.museumCache.set(m.id, m));

                // Preload visited museums with full details for question generation
                const visitedIds = this.getVisitedMuseums();
                await this.adapter.preloadMuseums(visitedIds);
                this.adapter.getMuseums().forEach(m => this.museumCache.set(m.id, m));
            })();
        }
        return this.readyPromise;
    }

    static resetForTests() {
        this.adapter = null;
        this.readyPromise = null;
        this.museumsMeta = [];
        this.museumCache = new Map();
    }

    static ensureReady() {
        if (!this.readyPromise) {
            console.warn('QuizData used before initialization');
        }
    }

    /**
     * Get all available museums from the main data source
     * @returns {Array} Array of museum objects
     */
    static getMuseums() {
        this.ensureReady();
        return Array.from(this.museumCache.values());
    }
    
    /**
     * Get museum by ID
     * @param {string} museumId - Museum ID
     * @returns {Object|null} Museum object or null
     */
    static getMuseumById(museumId) {
        const museums = this.getMuseums();
        return museums.find(m => m.id === museumId) || null;
    }
    
    /**
     * Get visited museums from localStorage
     * @returns {Array} Array of museum IDs
     */
    static getVisitedMuseums() {
        const visited = localStorage.getItem('visitedMuseums');
        if (!visited) return [];
        
        try {
            return JSON.parse(visited);
        } catch (e) {
            console.error('Failed to parse visited museums:', e);
            return [];
        }
    }
    
    /**
     * Generate questions for a specific museum
     * @param {string} museumId - Museum ID
     * @param {string} ageGroup - Age group ('7-12')
     * @returns {Array} Array of question objects
     */
    static generateQuestionsForMuseum(museumId, ageGroup = '7-12') {
        const museum = this.getMuseumById(museumId);
        if (!museum) return [];
        
        const questions = [];
        
        // Basic info questions
        questions.push(...this.generateBasicInfoQuestions(museum, ageGroup));
        
        // Collection/treasure questions
        if (museum.collections && museum.collections.length > 0) {
            questions.push(...this.generateCollectionQuestions(museum, ageGroup));
        }
        
        // Location questions
        questions.push(...this.generateLocationQuestions(museum, ageGroup));
        
        // Tag-based questions
        if (museum.tags && museum.tags.length > 0) {
            questions.push(...this.generateTagQuestions(museum, ageGroup));
        }
        
        // Image recognition questions (guess museum by photo)
        if (museum.image) {
            questions.push(...this.generateImageQuestions(museum, ageGroup));
        }
        
        return questions;
    }
    
    /**
     * Generate basic information questions
     * @private
     */
    static generateBasicInfoQuestions(museum, ageGroup) {
        const questions = [];
        const museumId = museum.id;
        
        // Location question
        if (museum.location) {
            const locationOpts = this.shuffleOptions(this.generateLocationOptions(museum.location));
            questions.push({
                id: `${museumId}_location`,
                museumId: museumId,
                type: 'single-choice',
                difficulty: 'easy',
                question: `${museum.name}位于哪个城市？`,
                options: locationOpts.options,
                correctAnswer: locationOpts.correctAnswer,
                explanation: `${museum.name}位于${museum.location}。`,
                points: 10,
                tags: ['基础信息', '地理'],
                ageGroup: '7-12'
            });
        }
        
        // Description true/false question
        if (museum.description) {
            questions.push({
                id: `${museumId}_description_tf`,
                museumId: museumId,
                type: 'true-false',
                difficulty: 'easy',
                question: `${museum.name}${museum.description}，这个说法对吗？`,
                options: ['对', '错'],
                correctAnswer: 0,
                explanation: `正确！${museum.description}`,
                points: 10,
                tags: ['基础信息'],
                ageGroup: '7-12'
            });
        }
        
        return questions;
    }
    
    /**
     * Generate collection/treasure questions
     * @private
     */
    static generateCollectionQuestions(museum, ageGroup) {
        const questions = [];
        const museumId = museum.id;
        
        museum.collections.forEach((collection, index) => {
            // Collection name question
            const collectionOpts = this.shuffleOptions(this.generateCollectionOptions(collection.name, museum.name));
            questions.push({
                id: `${museumId}_collection_${index}`,
                museumId: museumId,
                type: 'single-choice',
                difficulty: 'medium',
                question: `${museum.name}的镇馆之宝包括哪一件？`,
                options: collectionOpts.options,
                correctAnswer: collectionOpts.correctAnswer,
                explanation: `${collection.name}是${museum.name}的重要藏品。${collection.description || ''}`,
                points: 15,
                tags: ['藏品', '文物'],
                ageGroup: '7-12',
                image: collection.imageUrl
            });
            
            // Collection description question (if available)
            if (collection.description && collection.description.length > 20) {
                const keyInfo = this.extractKeyInfo(collection.description);
                if (keyInfo) {
                    const detailOpts = this.shuffleOptions([keyInfo, ...this.generateWrongOptions(keyInfo)]);
                    questions.push({
                        id: `${museumId}_collection_${index}_detail`,
                        museumId: museumId,
                        type: 'single-choice',
                        difficulty: 'hard',
                        question: `关于${collection.name}，以下哪个说法是正确的？`,
                        options: detailOpts.options,
                        correctAnswer: detailOpts.correctAnswer,
                        explanation: collection.description,
                        points: 20,
                        tags: ['藏品', '历史'],
                        ageGroup: '7-12',
                        image: collection.imageUrl
                    });
                }
            }
        });
        
        return questions;
    }
    
    /**
     * Generate location-related questions
     * @private
     */
    static generateLocationQuestions(museum, ageGroup) {
        const questions = [];
        
        // Only generate if we have location data
        if (!museum.location) return questions;
        
        // Museum count in same city (requires checking all museums)
        const museums = this.getMuseums();
        const sameCity = museums.filter(m => m.location === museum.location);
        
        if (sameCity.length > 2) {
            const countOpts = this.shuffleOptions(this.generateCountOptions(sameCity.length));
            questions.push({
                id: `${museum.id}_city_museums`,
                museumId: museum.id,
                type: 'single-choice',
                difficulty: 'medium',
                question: `在${museum.location}，我们收录了多少家博物馆？`,
                options: countOpts.options,
                correctAnswer: countOpts.correctAnswer,
                explanation: `在${museum.location}，我们收录了${sameCity.length}家博物馆。`,
                points: 15,
                tags: ['地理', '统计'],
                ageGroup: '7-12'
            });
        }
        
        return questions;
    }
    
    /**
     * Generate tag-based questions
     * @private
     */
    static generateTagQuestions(museum, ageGroup) {
        const questions = [];
        const museumId = museum.id;
        
        if (museum.tags && museum.tags.length > 0) {
            const tagOpts = this.shuffleOptions(this.generateTagOptions(museum.tags[0]));
            questions.push({
                id: `${museumId}_tags`,
                museumId: museumId,
                type: 'single-choice',
                difficulty: 'easy',
                question: `${museum.name}的主要类型是？`,
                options: tagOpts.options,
                correctAnswer: tagOpts.correctAnswer,
                explanation: `${museum.name}是一座${museum.tags.join('、')}类型的博物馆。`,
                points: 10,
                tags: ['分类'],
                ageGroup: '7-12'
            });
        }
        
        return questions;
    }
    
    /**
     * Generate image recognition questions (guess museum by photo)
     * @private
     */
    static generateImageQuestions(museum, ageGroup) {
        const questions = [];
        const museumId = museum.id;
        
        if (!museum.image) return questions;
        
        // Get other museums for wrong options
        const otherMuseums = this.getMuseums()
            .filter(m => m.id !== museumId && m.image)
            .slice(0, 10);
        
        if (otherMuseums.length < 3) return questions;
        
        // Shuffle and pick 3 wrong options
        const wrongOptions = otherMuseums
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(m => m.name);
        
        const imageOpts = this.shuffleOptions([museum.name, ...wrongOptions]);
        questions.push({
            id: `${museumId}_image_recognition`,
            museumId: museumId,
            type: 'image-choice',
            difficulty: 'medium',
            question: '看图猜一猜，这是哪个博物馆？',
            image: museum.image,
            options: imageOpts.options,
            correctAnswer: imageOpts.correctAnswer,
            explanation: `这是${museum.name}，位于${museum.location}。`,
            points: 15,
            tags: ['图片识别', '博物馆'],
            ageGroup: '7-12'
        });
        
        return questions;
    }
    
    /**
     * Generate location options with distractors
     * @private
     */
    static generateLocationOptions(correctLocation) {
        const cities = ['北京', '上海', '西安', '南京', '广州', '成都', '杭州', '武汉'];
        const options = [correctLocation];
        
        // Add 3 random different cities
        const otherCities = cities.filter(c => c !== correctLocation);
        for (let i = 0; i < 3 && otherCities.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * otherCities.length);
            options.push(otherCities[randomIndex]);
            otherCities.splice(randomIndex, 1);
        }
        
        return options;
    }
    
    /**
     * Generate collection name options
     * @private
     */
    static generateCollectionOptions(correctName, museumName) {
        const famousTreasures = [
            '清明上河图',
            '翠玉白菜',
            '后母戊鼎',
            '越王勾践剑',
            '兵马俑',
            '金缕玉衣',
            '大克鼎',
            '毛公鼎'
        ];
        
        const options = [correctName];
        const otherTreasures = famousTreasures.filter(t => !correctName.includes(t));
        
        // Add 3 random different treasures
        for (let i = 0; i < 3 && otherTreasures.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * otherTreasures.length);
            options.push(otherTreasures[randomIndex]);
            otherTreasures.splice(randomIndex, 1);
        }
        
        return options;
    }
    
    /**
     * Generate count options
     * @private
     */
    static generateCountOptions(correctCount) {
        const options = [
            correctCount.toString(),
            (correctCount + 2).toString(),
            (correctCount - 1 > 0 ? correctCount - 1 : correctCount + 1).toString(),
            (correctCount + 5).toString()
        ];
        
        return options;
    }
    
    /**
     * Generate tag options
     * @private
     */
    static generateTagOptions(correctTag) {
        const commonTags = ['历史', '艺术', '科技', '自然', '军事', '民俗', '建筑'];
        const options = [correctTag];
        
        const otherTags = commonTags.filter(t => t !== correctTag);
        for (let i = 0; i < 3 && otherTags.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * otherTags.length);
            options.push(otherTags[randomIndex]);
            otherTags.splice(randomIndex, 1);
        }
        
        return options;
    }
    
    /**
     * Extract key information from description
     * @private
     */
    static extractKeyInfo(description) {
        // Look for sentences with specific patterns
        const sentences = description.split(/[。；]/);
        for (const sentence of sentences) {
            if (sentence.length > 10 && sentence.length < 50) {
                return sentence.trim();
            }
        }
        
        // Return first 30 characters if no good sentence found
        return description.substring(0, 30);
    }
    
    /**
     * Generate wrong options based on correct option
     * @private
     */
    static generateWrongOptions(correctOption) {
        // Generate plausible but incorrect options
        const templates = [
            '这件文物来自唐朝时期',
            '这是一件青铜器文物',
            '这件作品由清代画家创作',
            '这是明朝时期的建筑'
        ];
        
        return templates.slice(0, 3);
    }
    
    /**
     * Shuffle options and return new options array with updated correct answer index
     * @param {Array} options - Original options array (correct answer at index 0)
     * @returns {Object} { options: shuffledOptions, correctAnswer: newCorrectIndex }
     * @private
     */
    static shuffleOptions(options) {
        // Create array of {value, isCorrect} objects
        const optionsWithFlag = options.map((opt, idx) => ({
            value: opt,
            isCorrect: idx === 0
        }));
        
        // Fisher-Yates shuffle
        for (let i = optionsWithFlag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsWithFlag[i], optionsWithFlag[j]] = [optionsWithFlag[j], optionsWithFlag[i]];
        }
        
        // Find new correct answer index
        const correctAnswer = optionsWithFlag.findIndex(opt => opt.isCorrect);
        const shuffledOptions = optionsWithFlag.map(opt => opt.value);
        
        return { options: shuffledOptions, correctAnswer };
    }
    
    /**
     * Get all questions for visited museums
     * @param {string} ageGroup - Age group
     * @returns {Array} All questions
     */
    static getAllAvailableQuestions(ageGroup = '7-12') {
        const visitedMuseums = this.getVisitedMuseums();
        let allQuestions = [];
        
        visitedMuseums.forEach(museumId => {
            const questions = this.generateQuestionsForMuseum(museumId, ageGroup);
            allQuestions = allQuestions.concat(questions);
        });
        
        return allQuestions;
    }
    
    /**
     * Get random questions from all visited museums
     * Excludes questions already answered today to avoid repetition
     * @param {number} count - Number of questions
     * @param {string} ageGroup - Age group
     * @returns {Array} Random questions
     */
    static getRandomQuestions(count = 10, ageGroup = '7-12') {
        const allQuestions = this.getAllAvailableQuestions(ageGroup);
        
        // Get today's answered question IDs to avoid repetition
        const answeredIds = typeof QuizLimit !== 'undefined' 
            ? QuizLimit.getTodayAnsweredQuestionIds(ageGroup) 
            : [];
        
        // Filter out questions already answered today - never include duplicates
        const available = allQuestions.filter(q => !answeredIds.includes(q.id));
        
        // Shuffle available questions (only fresh ones, no fallback to duplicates)
        const shuffled = available.sort(() => Math.random() - 0.5);
        
        // Return up to count questions (may be fewer if not enough fresh questions)
        return shuffled.slice(0, count);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizData;
}

// Static state
QuizData.adapter = null;
QuizData.readyPromise = null;
QuizData.museumCache = new Map();
QuizData.museumsMeta = [];
