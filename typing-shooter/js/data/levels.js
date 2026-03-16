/**
 * 关卡数据模块
 * 定义3大级别 × 20小级 = 60个关卡的配置
 * Boss关：每隔5关一个Boss（第5/10/15/20关）
 */
const LevelsData = {
    // 大级别名称
    MAJOR_LEVELS: [
        { key: 'easy', name: '初级', nameEn: 'Easy', color: '#4CAF50', wordType: 'letter' },
        { key: 'medium', name: '中级', nameEn: 'Medium', color: '#FF9800', wordType: 'short' },
        { key: 'hard', name: '高级', nameEn: 'Hard', color: '#F44336', wordType: 'long' }
    ],

    MINOR_LEVEL_COUNT: 20, // 每个大级别的小级数量

    // Boss 配置表：boss1a ~ boss3d（每级4个Boss）
    // 难度平缓：初级超级友好，中级轻松愉快，高级适度挑战
    BOSS_TABLE: {
        // 初级 Boss（4个，超级友好，新手也能轻松击败）
        boss1a: { name: '字母守卫', texture: 'boss1', hp: 4,  wordType: 'letter', scale: 0.35,
                  bulletInterval: 8000, bulletSpeed: 20, bulletCount: 1, powerupChance: 0.60 },
        boss1b: { name: '字母队长', texture: 'boss1', hp: 5,  wordType: 'letter', scale: 0.35,
                  bulletInterval: 7500, bulletSpeed: 22, bulletCount: 1, powerupChance: 0.55 },
        boss1c: { name: '字母将军', texture: 'boss1', hp: 6,  wordType: 'letter', scale: 0.38,
                  bulletInterval: 7000, bulletSpeed: 25, bulletCount: 1, powerupChance: 0.50 },
        boss1d: { name: '字母大王', texture: 'boss1', hp: 8,  wordType: 'letter', scale: 0.40,
                  bulletInterval: 6500, bulletSpeed: 28, bulletCount: 1, powerupChance: 0.45 },
        // 中级 Boss（4个，轻松愉快）
        boss2a: { name: '单词猎手', texture: 'boss2', hp: 8,  wordType: 'short', scale: 0.30,
                  bulletInterval: 6000, bulletSpeed: 35, bulletCount: 1, powerupChance: 0.45 },
        boss2b: { name: '单词骑士', texture: 'boss2', hp: 10, wordType: 'short', scale: 0.30,
                  bulletInterval: 5500, bulletSpeed: 38, bulletCount: 1, powerupChance: 0.42 },
        boss2c: { name: '单词领主', texture: 'boss2', hp: 13, wordType: 'short', scale: 0.33,
                  bulletInterval: 5000, bulletSpeed: 42, bulletCount: 1, powerupChance: 0.40 },
        boss2d: { name: '单词霸主', texture: 'boss2', hp: 16, wordType: 'short', scale: 0.35,
                  bulletInterval: 4500, bulletSpeed: 45, bulletCount: 2, powerupChance: 0.38 },
        // 高级 Boss（4个，适度挑战，不再压迫感过强）
        boss3a: { name: '键盘刺客', texture: 'boss3', hp: 12, wordType: 'long', scale: 0.28,
                  bulletInterval: 5500, bulletSpeed: 40, bulletCount: 1, powerupChance: 0.42 },
        boss3b: { name: '键盘战神', texture: 'boss3', hp: 16, wordType: 'long', scale: 0.30,
                  bulletInterval: 5000, bulletSpeed: 45, bulletCount: 1, powerupChance: 0.38 },
        boss3c: { name: '键盘暴君', texture: 'boss3', hp: 20, wordType: 'long', scale: 0.32,
                  bulletInterval: 4500, bulletSpeed: 50, bulletCount: 2, powerupChance: 0.35 },
        boss3d: { name: '键盘魔王', texture: 'boss3', hp: 25, wordType: 'long', scale: 0.35,
                  bulletInterval: 4000, bulletSpeed: 55, bulletCount: 2, powerupChance: 0.32 }
    },

    // ============================================
    // 60个关卡配置：3大级别 × 20小级
    // 难度曲线平缓，从1~20缓和提升
    // Boss关：第5/10/15/20关（每5关一个Boss）
    // ============================================
    levels: [],

    /**
     * 初始化所有关卡（动态生成，避免手动维护60个配置）
     * 难度曲线更平缓，每关内容更充实
     */
    init() {
        this.levels = [];
        // ---- 初级 Easy（单字母，20关）----
        const easyBosses = ['boss1a', 'boss1b', 'boss1c', 'boss1d'];
        for (let i = 0; i < 20; i++) {
            const t = i / 19; // 0~1 线性
            const tEase = t * t;  // 二次缓入，前期更平缓
            const isBoss = (i + 1) % 5 === 0; // 第5/10/15/20关
            const bossIdx = Math.floor((i + 1) / 5) - 1;
            const normalRatio = Math.max(0.5, 1 - tEase * 0.5);
            const fastRatio = Math.min(0.4, tEase * 0.5);
            const level = {
                major: 0, minor: i,
                name: `初级 - 第${i + 1}关`,
                wordType: 'letter',
                speed: Math.round(15 + tEase * 40),            // 15→55
                spawnInterval: Math.round(5000 - tEase * 2800), // 5000→2200
                maxEnemies: Math.round(2 + tEase * 4),          // 2→6
                targetKills: Math.round(10 + t * 30),           // 10→40
                lives: 5,
                showKeyboard: true,
                powerupRate: +(0.15 + t * 0.10).toFixed(2),     // 15%→25%
                enemyTypes: { normal: +normalRatio.toFixed(2), fast: +fastRatio.toFixed(2) }
            };
            if (isBoss && bossIdx >= 0 && bossIdx < 4) {
                level.isBoss = true;
                level.boss = easyBosses[bossIdx];
            }
            this.levels.push(level);
        }

        // ---- 中级 Medium（短单词 3-4 字母，20关）----
        const medBosses = ['boss2a', 'boss2b', 'boss2c', 'boss2d'];
        for (let i = 0; i < 20; i++) {
            const t = i / 19;
            const tEase = t * t;
            const isBoss = (i + 1) % 5 === 0;
            const bossIdx = Math.floor((i + 1) / 5) - 1;
            const normalR = Math.max(0.15, 0.7 - tEase * 0.55);
            const fastR = +(0.15 + tEase * 0.2).toFixed(2);
            const armorR = +(0.05 + tEase * 0.2).toFixed(2);
            const zigR = +(Math.max(0, tEase * 0.2)).toFixed(2);
            const level = {
                major: 1, minor: i,
                name: `中级 - 第${i + 1}关`,
                wordType: 'short',
                speed: Math.round(14 + tEase * 40),            // 14→54
                spawnInterval: Math.round(5500 - tEase * 3000), // 5500→2500
                maxEnemies: Math.round(2 + tEase * 6),          // 2→8
                targetKills: Math.round(10 + t * 30),           // 10→40
                lives: 4,
                showKeyboard: false,
                powerupRate: +(0.18 + t * 0.10).toFixed(2),     // 18%→28%
                enemyTypes: { normal: +normalR.toFixed(2), fast: fastR, armored: armorR, zigzag: zigR }
            };
            if (isBoss && bossIdx >= 0 && bossIdx < 4) {
                level.isBoss = true;
                level.boss = medBosses[bossIdx];
            }
            this.levels.push(level);
        }

        // ---- 高级 Hard（长单词 5+ 字母，20关）----
        const hardBosses = ['boss3a', 'boss3b', 'boss3c', 'boss3d'];
        for (let i = 0; i < 20; i++) {
            const t = i / 19;
            const tEase = t * t;
            const isBoss = (i + 1) % 5 === 0;
            const bossIdx = Math.floor((i + 1) / 5) - 1;
            const normalR = Math.max(0.05, 0.35 - tEase * 0.3);
            const fastR = +(0.2 + tEase * 0.2).toFixed(2);
            const armorR = +(0.2 + tEase * 0.15).toFixed(2);
            const zigR = +(0.15 + tEase * 0.15).toFixed(2);
            const level = {
                major: 2, minor: i,
                name: `高级 - 第${i + 1}关`,
                wordType: 'long',
                speed: Math.round(12 + tEase * 40),            // 12→52
                spawnInterval: Math.round(6000 - tEase * 3500), // 6000→2500
                maxEnemies: Math.round(3 + tEase * 7),          // 3→10
                targetKills: Math.round(12 + t * 33),           // 12→45
                lives: 3,
                showKeyboard: false,
                powerupRate: +(0.20 + t * 0.12).toFixed(2),     // 20%→32%
                enemyTypes: { normal: +normalR.toFixed(2), fast: fastR, armored: armorR, zigzag: zigR }
            };
            if (isBoss && bossIdx >= 0 && bossIdx < 4) {
                level.isBoss = true;
                level.boss = hardBosses[bossIdx];
            }
            this.levels.push(level);
        }
    },

    /**
     * 获取指定关卡配置
     * @param {number} major - 大级别索引 (0-2)
     * @param {number} minor - 小级索引 (0-19)
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
            isCustom: true,
            enemyTypes: { normal: 0.4, fast: 0.25, armored: 0.2, zigzag: 0.15 }
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

// 初始化关卡数据
LevelsData.init();
