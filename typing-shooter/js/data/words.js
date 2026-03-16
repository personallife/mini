/**
 * 单词库数据模块
 * 内置儿童英语高频词库和小学课本词汇库，支持自定义导入
 */
const WordsData = {
    // ============================================
    // 内置单词库：常用儿童英语单词（约200个高频词）
    // ============================================
    childrenWords: [
        // 动物
        'cat', 'dog', 'fish', 'bird', 'bear', 'duck', 'frog', 'pig', 'hen', 'cow',
        'lion', 'tiger', 'panda', 'rabbit', 'mouse', 'snake', 'horse', 'sheep', 'monkey', 'elephant',
        // 食物
        'apple', 'cake', 'milk', 'egg', 'rice', 'bread', 'juice', 'candy', 'pizza', 'banana',
        'orange', 'grape', 'peach', 'mango', 'lemon', 'cherry', 'cookie', 'noodle', 'chicken', 'tomato',
        // 颜色
        'red', 'blue', 'green', 'pink', 'black', 'white', 'brown', 'yellow', 'purple', 'orange',
        // 数字相关
        'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        // 家庭
        'mom', 'dad', 'baby', 'boy', 'girl', 'sister', 'brother', 'family', 'friend', 'teacher',
        // 身体
        'eye', 'ear', 'nose', 'hand', 'foot', 'head', 'face', 'mouth', 'hair', 'leg',
        // 自然
        'sun', 'moon', 'star', 'rain', 'snow', 'tree', 'flower', 'water', 'fire', 'sky',
        'cloud', 'wind', 'river', 'lake', 'sea', 'hill', 'rock', 'grass', 'leaf', 'sand',
        // 物品
        'book', 'pen', 'bag', 'ball', 'toy', 'car', 'bus', 'hat', 'cup', 'box',
        'door', 'desk', 'chair', 'bed', 'lamp', 'clock', 'phone', 'key', 'map', 'bell',
        // 动作
        'run', 'jump', 'swim', 'fly', 'eat', 'sing', 'dance', 'play', 'read', 'draw',
        'walk', 'talk', 'sleep', 'cook', 'wash', 'open', 'close', 'stop', 'go', 'come',
        // 形容词
        'big', 'small', 'hot', 'cold', 'new', 'old', 'good', 'bad', 'happy', 'sad',
        'fast', 'slow', 'tall', 'short', 'long', 'nice', 'kind', 'cute', 'soft', 'hard',
        // 日常用语
        'hello', 'sorry', 'thank', 'please', 'yes', 'no', 'home', 'school', 'park', 'shop'
    ],

    // ============================================
    // 内置单词库：小学课本词汇（按年级分类，约400个）
    // ============================================
    schoolWords: {
        // 一年级
        grade1: [
            'hi', 'am', 'is', 'my', 'you', 'it', 'a', 'the', 'to', 'and',
            'cat', 'dog', 'pen', 'bag', 'book', 'desk', 'red', 'blue', 'one', 'two',
            'mom', 'dad', 'eye', 'ear', 'nose', 'hand', 'boy', 'girl', 'big', 'small',
            'yes', 'no', 'go', 'up', 'in', 'on', 'sun', 'cup', 'bus', 'run'
        ],
        // 二年级
        grade2: [
            'apple', 'bird', 'cake', 'duck', 'fish', 'green', 'hat', 'ice', 'jump', 'kite',
            'lion', 'milk', 'night', 'open', 'pig', 'queen', 'rain', 'star', 'tree', 'under',
            'very', 'water', 'box', 'yellow', 'zoo', 'bear', 'chair', 'door', 'egg', 'five',
            'good', 'home', 'like', 'make', 'name', 'play', 'sing', 'this', 'want', 'with'
        ],
        // 三年级
        grade3: [
            'animal', 'banana', 'candle', 'dinner', 'enjoy', 'flower', 'garden', 'hungry', 'island', 'jacket',
            'kitchen', 'letter', 'mother', 'number', 'orange', 'pencil', 'rabbit', 'school', 'today', 'uncle',
            'violin', 'window', 'monkey', 'family', 'friend', 'happy', 'little', 'morning', 'please', 'sister',
            'brother', 'chicken', 'doctor', 'eraser', 'father', 'grape', 'horse', 'juice', 'lemon', 'noodle'
        ],
        // 四年级
        grade4: [
            'afternoon', 'birthday', 'classmate', 'daughter', 'elephant', 'football', 'goodbye', 'homework',
            'internet', 'january', 'kangaroo', 'library', 'mountain', 'notebook', 'outside', 'painting',
            'question', 'remember', 'sandwich', 'together', 'umbrella', 'vacation', 'weather', 'yesterday',
            'airplane', 'bathroom', 'children', 'dinosaur', 'everyday', 'favorite', 'giraffe', 'hospital',
            'sandwich', 'shopping', 'student', 'teacher', 'computer', 'practice', 'between', 'country'
        ],
        // 五年级
        grade5: [
            'adventure', 'beautiful', 'celebrate', 'dangerous', 'education', 'fantastic', 'geography', 'hamburger',
            'important', 'knowledge', 'landscape', 'magazine', 'necessary', 'operation', 'passenger', 'rectangle',
            'something', 'telephone', 'understand', 'vegetable', 'wonderful', 'excellent', 'butterfly', 'chocolate',
            'different', 'everybody', 'furniture', 'gymnasium', 'happiness', 'invisible', 'programme', 'scientist',
            'strawberry', 'temperature', 'character', 'crocodile', 'delicious', 'expensive', 'introduce', 'volunteer'
        ],
        // 六年级
        grade6: [
            'achievement', 'background', 'comfortable', 'department', 'environment', 'government', 'information',
            'basketball', 'competition', 'dictionary', 'experience', 'independent', 'photography', 'restaurant',
            'supermarket', 'traditional', 'university', 'volleyball', 'watermelon', 'atmosphere', 'communicate',
            'electricity', 'engineering', 'grandmother', 'helicopter', 'imagination', 'mathematics', 'opportunity',
            'personality', 'responsible', 'celebration', 'discovering', 'entertainment', 'interesting', 'playground',
            'relationship', 'skateboard', 'trampoline', 'understand', 'accidentally'
        ]
    },

    // ============================================
    // 当前选中的词库类型
    // ============================================
    LIBRARY_TYPES: {
        CHILDREN: 'children',    // 常用儿童英语单词
        SCHOOL: 'school',        // 小学课本词汇
        CUSTOM: 'custom'         // 自定义导入
    },

    /**
     * 获取当前选中的词库类型
     */
    getCurrentLibrary() {
        return localStorage.getItem('typing_shooter_word_library') || this.LIBRARY_TYPES.CHILDREN;
    },

    /**
     * 设置当前词库类型
     */
    setCurrentLibrary(type) {
        localStorage.setItem('typing_shooter_word_library', type);
    },

    /**
     * 获取自定义词库
     */
    getCustomWords() {
        const data = localStorage.getItem('typing_shooter_custom_words');
        return data ? JSON.parse(data) : [];
    },

    /**
     * 保存自定义词库
     */
    saveCustomWords(words) {
        localStorage.setItem('typing_shooter_custom_words', JSON.stringify(words));
    },

    /**
     * 从文本导入自定义单词
     * 支持每行一个单词 或 逗号分隔
     */
    importFromText(text) {
        const words = text
            .replace(/[,，\n\r]+/g, ',')
            .split(',')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0 && /^[a-z]+$/.test(w));

        const uniqueWords = [...new Set(words)];
        this.saveCustomWords(uniqueWords);
        return uniqueWords;
    },

    /**
     * 从 JSON 格式导入自定义单词
     * 预留格式：[{"word": "apple", "level": "easy"}, ...]
     */
    importFromJSON(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            let words = [];
            if (Array.isArray(data)) {
                words = data.map(item => {
                    if (typeof item === 'string') return item.toLowerCase().trim();
                    if (item.word) return item.word.toLowerCase().trim();
                    return '';
                }).filter(w => w.length > 0 && /^[a-z]+$/.test(w));
            }
            const uniqueWords = [...new Set(words)];
            this.saveCustomWords(uniqueWords);
            return uniqueWords;
        } catch (e) {
            console.error('JSON 导入格式错误:', e);
            return [];
        }
    },

    /**
     * 获取所有可用单词（根据当前选中的词库）
     */
    getAllWords() {
        const library = this.getCurrentLibrary();

        switch (library) {
            case this.LIBRARY_TYPES.CHILDREN:
                return [...this.childrenWords];
            case this.LIBRARY_TYPES.SCHOOL:
                // 合并所有年级的单词
                return Object.values(this.schoolWords).flat();
            case this.LIBRARY_TYPES.CUSTOM:
                const custom = this.getCustomWords();
                return custom.length > 0 ? custom : [...this.childrenWords]; // 自定义词库为空则回退到默认
            default:
                return [...this.childrenWords];
        }
    },

    /**
     * 按长度筛选单词
     * @param {string} type - 'letter'(单字母) | 'short'(3-4字母) | 'long'(5+字母)
     * @returns {string[]} 筛选后的单词数组
     */
    getWordsByLength(type) {
        const allWords = this.getAllWords();

        switch (type) {
            case 'letter':
                // 返回26个字母
                return 'abcdefghijklmnopqrstuvwxyz'.split('');
            case 'short':
                return allWords.filter(w => w.length >= 3 && w.length <= 4);
            case 'long':
                return allWords.filter(w => w.length >= 5);
            default:
                return allWords;
        }
    },

    /**
     * 随机获取一个单词
     * @param {string} type - 'letter' | 'short' | 'long'
     */
    getRandomWord(type) {
        const words = this.getWordsByLength(type);
        return words[Math.floor(Math.random() * words.length)];
    },

    /**
     * 获取学校词库的年级列表
     */
    getSchoolGrades() {
        return Object.keys(this.schoolWords).map((key, index) => ({
            key: key,
            name: `${index + 1}年级`,
            count: this.schoolWords[key].length
        }));
    },

    /**
     * 按指定年级获取学校词汇
     */
    getSchoolWordsByGrade(gradeKey) {
        return this.schoolWords[gradeKey] || [];
    }
};
