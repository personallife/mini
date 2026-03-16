/**
 * 场景主题配置
 * Beta 版：3种视觉主题
 */
const ThemesData = {
    THEMES: {
        space: {
            name: '🌌 星空',
            key: 'space',
            bgColor: 0x0a0a2e,
            particleType: 'star',      // 星点
            particleColor: 0xffffff,
            particleCount: 60,
            particleAlphaMin: 0.2,
            particleAlphaMax: 0.7,
            hudColor: '#00ccff',
            accentColor: '#4488ff',
            btnColor: '#223355',
            btnBorder: '#445577'
        },
        ocean: {
            name: '🌊 海洋',
            key: 'ocean',
            bgColor: 0x0a1e2e,
            particleType: 'bubble',    // 气泡
            particleColor: 0x66ccff,
            particleCount: 40,
            particleAlphaMin: 0.1,
            particleAlphaMax: 0.4,
            hudColor: '#44ddff',
            accentColor: '#22aacc',
            btnColor: '#1a3344',
            btnBorder: '#336688'
        },
        forest: {
            name: '🌲 森林',
            key: 'forest',
            bgColor: 0x0a1e0a,
            particleType: 'leaf',      // 树叶
            particleColor: 0x88cc44,
            particleCount: 35,
            particleAlphaMin: 0.15,
            particleAlphaMax: 0.5,
            hudColor: '#88ee44',
            accentColor: '#44aa22',
            btnColor: '#1a3322',
            btnBorder: '#336644'
        }
    },

    /**
     * 获取当前主题
     */
    getCurrentTheme() {
        const key = localStorage.getItem('typing_shooter_theme') || 'space';
        return this.THEMES[key] || this.THEMES.space;
    },

    /**
     * 设置主题
     */
    setTheme(key) {
        if (this.THEMES[key]) {
            localStorage.setItem('typing_shooter_theme', key);
        }
    },

    /**
     * 获取所有主题列表
     */
    getAllThemes() {
        return Object.values(this.THEMES);
    }
};
