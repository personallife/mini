/**
 * 关卡数据模块
 * 定义3大级别 × 10小级 = 30个关卡的配置
 */
const LevelsData = {
    // 大级别名称
    MAJOR_LEVELS: [
        { key: 'easy', name: '初级', nameEn: 'Easy', color: '#4CAF50', wordType: 'letter' },
        { key: 'medium', name: '中级', nameEn: 'Medium', color: '#FF9800', wordType: 'short' },
        { key: 'hard', name: '高级', nameEn: 'Hard', color: '#F44336', wordType: 'long' }
    ],

    MINOR_LEVEL_COUNT: 10, // 每个大级别的小级数量

    // ============================================
    // 30个关卡配置：3大级别 × 10小级
    // ============================================
    levels: [
        // ---- 初级 Easy（单字母）----
        { major: 0, minor: 0, name: '初级 - 第1关', wordType: 'letter', speed: 25, spawnInterval: 4000, maxEnemies: 2, targetKills: 6, lives: 5, showKeyboard: true },
        { major: 0, minor: 1, name: '初级 - 第2关', wordType: 'letter', speed: 30, spawnInterval: 3600, maxEnemies: 3, targetKills: 8, lives: 5, showKeyboard: true },
        { major: 0, minor: 2, name: '初级 - 第3关', wordType: 'letter', speed: 35, spawnInterval: 3200, maxEnemies: 3, targetKills: 10, lives: 5, showKeyboard: true },
        { major: 0, minor: 3, name: '初级 - 第4关', wordType: 'letter', speed: 38, spawnInterval: 2900, maxEnemies: 3, targetKills: 12, lives: 5, showKeyboard: true },
        { major: 0, minor: 4, name: '初级 - 第5关', wordType: 'letter', speed: 42, spawnInterval: 2600, maxEnemies: 4, targetKills: 14, lives: 5, showKeyboard: true },
        { major: 0, minor: 5, name: '初级 - 第6关', wordType: 'letter', speed: 46, spawnInterval: 2400, maxEnemies: 4, targetKills: 16, lives: 5, showKeyboard: true },
        { major: 0, minor: 6, name: '初级 - 第7关', wordType: 'letter', speed: 50, spawnInterval: 2200, maxEnemies: 4, targetKills: 18, lives: 5, showKeyboard: true },
        { major: 0, minor: 7, name: '初级 - 第8关', wordType: 'letter', speed: 54, spawnInterval: 2000, maxEnemies: 5, targetKills: 20, lives: 5, showKeyboard: true },
        { major: 0, minor: 8, name: '初级 - 第9关', wordType: 'letter', speed: 58, spawnInterval: 1800, maxEnemies: 5, targetKills: 22, lives: 5, showKeyboard: true },
        { major: 0, minor: 9, name: '初级 - 第10关', wordType: 'letter', speed: 62, spawnInterval: 1600, maxEnemies: 6, targetKills: 25, lives: 5, showKeyboard: true },

        // ---- 中级 Medium（短单词 3-4 字母）----
        { major: 1, minor: 0, name: '中级 - 第1关', wordType: 'short', speed: 22, spawnInterval: 4500, maxEnemies: 2, targetKills: 6, lives: 4, showKeyboard: false },
        { major: 1, minor: 1, name: '中级 - 第2关', wordType: 'short', speed: 26, spawnInterval: 4200, maxEnemies: 3, targetKills: 8, lives: 4, showKeyboard: false },
        { major: 1, minor: 2, name: '中级 - 第3关', wordType: 'short', speed: 30, spawnInterval: 3800, maxEnemies: 3, targetKills: 10, lives: 4, showKeyboard: false },
        { major: 1, minor: 3, name: '中级 - 第4关', wordType: 'short', speed: 34, spawnInterval: 3500, maxEnemies: 4, targetKills: 12, lives: 4, showKeyboard: false },
        { major: 1, minor: 4, name: '中级 - 第5关', wordType: 'short', speed: 38, spawnInterval: 3200, maxEnemies: 4, targetKills: 14, lives: 4, showKeyboard: false },
        { major: 1, minor: 5, name: '中级 - 第6关', wordType: 'short', speed: 42, spawnInterval: 2900, maxEnemies: 5, targetKills: 16, lives: 4, showKeyboard: false },
        { major: 1, minor: 6, name: '中级 - 第7关', wordType: 'short', speed: 46, spawnInterval: 2600, maxEnemies: 5, targetKills: 18, lives: 4, showKeyboard: false },
        { major: 1, minor: 7, name: '中级 - 第8关', wordType: 'short', speed: 50, spawnInterval: 2300, maxEnemies: 6, targetKills: 20, lives: 4, showKeyboard: false },
        { major: 1, minor: 8, name: '中级 - 第9关', wordType: 'short', speed: 54, spawnInterval: 2000, maxEnemies: 7, targetKills: 22, lives: 4, showKeyboard: false },
        { major: 1, minor: 9, name: '中级 - 第10关', wordType: 'short', speed: 58, spawnInterval: 1800, maxEnemies: 8, targetKills: 25, lives: 4, showKeyboard: false },

        // ---- 高级 Hard（长单词 5+ 字母）----
        { major: 2, minor: 0, name: '高级 - 第1关', wordType: 'long', speed: 20, spawnInterval: 5000, maxEnemies: 3, targetKills: 6, lives: 3, showKeyboard: false },
        { major: 2, minor: 1, name: '高级 - 第2关', wordType: 'long', speed: 24, spawnInterval: 4600, maxEnemies: 3, targetKills: 8, lives: 3, showKeyboard: false },
        { major: 2, minor: 2, name: '高级 - 第3关', wordType: 'long', speed: 28, spawnInterval: 4200, maxEnemies: 4, targetKills: 10, lives: 3, showKeyboard: false },
        { major: 2, minor: 3, name: '高级 - 第4关', wordType: 'long', speed: 32, spawnInterval: 3800, maxEnemies: 4, targetKills: 12, lives: 3, showKeyboard: false },
        { major: 2, minor: 4, name: '高级 - 第5关', wordType: 'long', speed: 36, spawnInterval: 3500, maxEnemies: 5, targetKills: 14, lives: 3, showKeyboard: false },
        { major: 2, minor: 5, name: '高级 - 第6关', wordType: 'long', speed: 40, spawnInterval: 3200, maxEnemies: 6, targetKills: 16, lives: 3, showKeyboard: false },
        { major: 2, minor: 6, name: '高级 - 第7关', wordType: 'long', speed: 44, spawnInterval: 2900, maxEnemies: 7, targetKills: 18, lives: 3, showKeyboard: false },
        { major: 2, minor: 7, name: '高级 - 第8关', wordType: 'long', speed: 48, spawnInterval: 2600, maxEnemies: 8, targetKills: 20, lives: 3, showKeyboard: false },
        { major: 2, minor: 8, name: '高级 - 第9关', wordType: 'long', speed: 52, spawnInterval: 2300, maxEnemies: 9, targetKills: 22, lives: 3, showKeyboard: false },
        { major: 2, minor: 9, name: '高级 - 第10关', wordType: 'long', speed: 56, spawnInterval: 2000, maxEnemies: 10, targetKills: 25, lives: 3, showKeyboard: false }
    ],

    /**
     * 获取指定关卡配置
     * @param {number} major - 大级别索引 (0-2)
     * @param {number} minor - 小级索引 (0-9)
     */
    getLevel(major, minor) {
        return this.levels.find(l => l.major === major && l.minor === minor);
    },

    /**
     * 获取关卡在数组中的索引
     */
    getLevelIndex(major, minor) {
        return this.levels.findIndex(l => l.major === major && l.minor === minor);
    },

    /**
     * 获取下一关卡
     * @returns {object|null} 下一关配置，如果已是最后一关则返回 null
     */
    getNextLevel(major, minor) {
        const currentIndex = this.getLevelIndex(major, minor);
        if (currentIndex < 0 || currentIndex >= this.levels.length - 1) return null;
        return this.levels[currentIndex + 1];
    },

    /**
     * 判断是否为某个大级别的最后一个小级
     */
    isLastMinorLevel(major, minor) {
        return minor === this.MINOR_LEVEL_COUNT - 1;
    },

    /**
     * 判断是否为游戏最后一关
     */
    isLastLevel(major, minor) {
        return major === 2 && minor === this.MINOR_LEVEL_COUNT - 1;
    },

    /**
     * 获取某个大级别下的所有关卡
     */
    getLevelsByMajor(major) {
        return this.levels.filter(l => l.major === major);
    },

    /**
     * 自定义难度模式（无尽模式）- 根据滑块值生成配置
     * @param {object} params - 自定义参数
     */
    createCustomLevel(params) {
        return {
            major: -1,
            minor: -1,
            name: '无尽模式',
            wordType: params.wordType || 'letter',
            speed: this.mapSliderToSpeed(params.speed || 5),
            spawnInterval: this.mapSliderToInterval(params.frequency || 5),
            maxEnemies: params.maxEnemies || 5,
            targetKills: Infinity,  // 无尽模式没有通关条件
            lives: params.lives || 5,
            showKeyboard: params.showKeyboard !== undefined ? params.showKeyboard : true,
            isCustom: true
        };
    },

    /**
     * 速度滑块值(1-10)映射到实际速度(px/s)
     */
    mapSliderToSpeed(value) {
        return 20 + (value - 1) * (80 / 9);
    },

    /**
     * 频率滑块值(1-10)映射到生成间隔(ms)
     */
    mapSliderToInterval(value) {
        return 5000 - (value - 1) * (4200 / 9);
    }
};
