/**
 * 游戏进度管理模块
 * 使用 localStorage 存储关卡解锁状态和历史最高分
 */
const ProgressData = {
    STORAGE_KEY: 'typing_shooter_progress',
    SAVE_SLOTS_KEY: 'typing_shooter_saves',
    ACTIVE_SLOT_KEY: 'typing_shooter_active_slot',

    // Beta: 存档系统
    getActiveSlot() {
        return parseInt(localStorage.getItem(this.ACTIVE_SLOT_KEY) || '0');
    },

    setActiveSlot(index) {
        localStorage.setItem(this.ACTIVE_SLOT_KEY, String(index));
    },

    /**
     * 获取所有存档槽信息
     */
    getAllSlots() {
        const data = localStorage.getItem(this.SAVE_SLOTS_KEY);
        if (data) return JSON.parse(data);
        return [
            { nickname: '玩家1', created: null, progress: null },
            { nickname: '玩家2', created: null, progress: null },
            { nickname: '玩家3', created: null, progress: null }
        ];
    },

    saveAllSlots(slots) {
        localStorage.setItem(this.SAVE_SLOTS_KEY, JSON.stringify(slots));
    },

    /**
     * 保存当前进度到活跃存档槽
     */
    syncToSlot() {
        const slots = this.getAllSlots();
        const idx = this.getActiveSlot();
        const progress = this.getAllProgress();
        slots[idx].progress = progress;
        slots[idx].lastSave = new Date().toISOString();
        if (!slots[idx].created) slots[idx].created = new Date().toISOString();
        this.saveAllSlots(slots);
    },

    /**
     * 从存档槽加载进度
     */
    loadFromSlot(index) {
        const slots = this.getAllSlots();
        if (slots[index] && slots[index].progress) {
            this.saveProgress(slots[index].progress);
            this.setActiveSlot(index);
            return true;
        }
        return false;
    },

    /**
     * 导出存档为 JSON
     */
    exportSave() {
        const slots = this.getAllSlots();
        const idx = this.getActiveSlot();
        this.syncToSlot();
        return JSON.stringify({
            version: '2.0-beta',
            slot: slots[idx],
            theme: localStorage.getItem('typing_shooter_theme') || 'space',
            wordLib: localStorage.getItem('typing_shooter_custom_words') || '',
            exportTime: new Date().toISOString()
        }, null, 2);
    },

    /**
     * 导入存档
     */
    importSave(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (!data.slot || !data.slot.progress) return false;
            const slots = this.getAllSlots();
            const idx = this.getActiveSlot();
            slots[idx] = data.slot;
            this.saveAllSlots(slots);
            this.saveProgress(data.slot.progress);
            if (data.theme) localStorage.setItem('typing_shooter_theme', data.theme);
            if (data.wordLib) localStorage.setItem('typing_shooter_custom_words', data.wordLib);
            return true;
        } catch (e) {
            console.error('存档导入失败:', e);
            return false;
        }
    },

    /**
     * 删除存档槽
     */
    deleteSlot(index) {
        const slots = this.getAllSlots();
        slots[index] = { nickname: `玩家${index + 1}`, created: null, progress: null };
        this.saveAllSlots(slots);
    },

    /**
     * 获取所有进度数据
     */
    getAllProgress() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
        // 默认进度：仅解锁初级-小级1
        return this.getDefaultProgress();
    },

    /**
     * 获取默认进度（首次游戏）
     */
    getDefaultProgress() {
        const progress = {};
        LevelsData.levels.forEach(level => {
            const key = `${level.major}_${level.minor}`;
            progress[key] = {
                unlocked: level.major === 0 && level.minor === 0, // 仅初级第1关解锁
                highScore: 0,
                bestAccuracy: 0,
                bestCombo: 0,
                completed: false
            };
        });
        return progress;
    },

    /**
     * 保存进度数据
     */
    saveProgress(progress) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
        // Beta: 自动同步到存档槽
        this.syncToSlot();
    },

    /**
     * 检查某关卡是否已解锁
     */
    isUnlocked(major, minor) {
        const progress = this.getAllProgress();
        const key = `${major}_${minor}`;
        return progress[key] ? progress[key].unlocked : false;
    },

    /**
     * 获取某关卡最高分
     */
    getHighScore(major, minor) {
        const progress = this.getAllProgress();
        const key = `${major}_${minor}`;
        return progress[key] ? progress[key].highScore : 0;
    },

    /**
     * 获取某关卡的完整统计数据
     */
    getLevelStats(major, minor) {
        const progress = this.getAllProgress();
        const key = `${major}_${minor}`;
        return progress[key] || { unlocked: false, highScore: 0, bestAccuracy: 0, bestCombo: 0, completed: false };
    },

    /**
     * 更新关卡成绩（通关时调用）
     * @param {number} major - 大级别
     * @param {number} minor - 小级
     * @param {object} stats - 本局统计 { score, accuracy, maxCombo }
     */
    updateLevelStats(major, minor, stats) {
        const progress = this.getAllProgress();
        const key = `${major}_${minor}`;

        if (!progress[key]) {
            progress[key] = { unlocked: true, highScore: 0, bestAccuracy: 0, bestCombo: 0, completed: false };
        }

        // 更新最高分和最佳统计
        progress[key].completed = true;
        if (stats.score > progress[key].highScore) {
            progress[key].highScore = stats.score;
        }
        if (stats.accuracy > progress[key].bestAccuracy) {
            progress[key].bestAccuracy = stats.accuracy;
        }
        if (stats.maxCombo > progress[key].bestCombo) {
            progress[key].bestCombo = stats.maxCombo;
        }

        // 解锁下一关
        const nextLevel = LevelsData.getNextLevel(major, minor);
        if (nextLevel) {
            const nextKey = `${nextLevel.major}_${nextLevel.minor}`;
            if (!progress[nextKey]) {
                progress[nextKey] = { unlocked: true, highScore: 0, bestAccuracy: 0, bestCombo: 0, completed: false };
            } else {
                progress[nextKey].unlocked = true;
            }
        }

        this.saveProgress(progress);
    },

    /**
     * 解锁指定关卡
     */
    unlockLevel(major, minor) {
        const progress = this.getAllProgress();
        const key = `${major}_${minor}`;
        if (!progress[key]) {
            progress[key] = { unlocked: true, highScore: 0, bestAccuracy: 0, bestCombo: 0, completed: false };
        } else {
            progress[key].unlocked = true;
        }
        this.saveProgress(progress);
    },

    /**
     * 解锁所有关卡（测试用）
     */
    unlockAllLevels() {
        const progress = this.getAllProgress();
        LevelsData.levels.forEach(level => {
            const key = `${level.major}_${level.minor}`;
            if (!progress[key]) {
                progress[key] = { unlocked: true, highScore: 0, bestAccuracy: 0, bestCombo: 0, completed: false };
            } else {
                progress[key].unlocked = true;
            }
        });
        this.saveProgress(progress);
    },

    /**
     * 重置所有进度
     */
    resetProgress() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * 获取总体统计信息
     */
    getOverallStats() {
        const progress = this.getAllProgress();
        let totalCompleted = 0;
        let totalLevels = LevelsData.levels.length;

        Object.values(progress).forEach(p => {
            if (p.completed) totalCompleted++;
        });

        return {
            completedLevels: totalCompleted,
            totalLevels: totalLevels,
            completionRate: Math.round((totalCompleted / totalLevels) * 100)
        };
    }
};
