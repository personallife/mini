/**
 * 自定义模式场景（无尽模式）
 * 选项持久化到 localStorage，不会因 restart 丢失
 */
class CustomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CustomScene' });
    }

    static STORAGE_KEY = 'typing_shooter_custom_params';

    /**
     * 读取持久化的自定义参数
     */
    static loadParams() {
        const saved = localStorage.getItem(CustomScene.STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return {
            wordType: 'letter',
            speed: 5,
            frequency: 5,
            maxEnemies: 5,
            lives: 5,
            showKeyboard: true,
            wordLibrary: 'children',
            soundEnabled: true
        };
    }

    /**
     * 保存自定义参数到 localStorage
     */
    static saveParams(params) {
        localStorage.setItem(CustomScene.STORAGE_KEY, JSON.stringify(params));
    }

    create() {
        const { width, height } = this.cameras.main;

        // 星空背景
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 1.5), 0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
        }

        // 标题
        this.add.text(width / 2, 35, '♾️ 无尽模式', {
            font: 'bold 28px Arial',
            fill: '#ff9900',
            stroke: '#443300',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(width / 2, 58, '自定义参数，无通关条件，挑战最高分！', {
            font: '12px Arial',
            fill: '#887744'
        }).setOrigin(0.5);

        // 从 localStorage 读取持久化参数
        this.customParams = CustomScene.loadParams();

        // 配置区域起始Y
        let cy = 85;
        const gap = 50;

        // 1. 内容类型选择
        this.createOptionSelector(width / 2, cy, '内容类型', [
            { key: 'letter', label: '字母' },
            { key: 'short', label: '短单词' },
            { key: 'long', label: '长单词' }
        ], 'wordType');
        cy += gap;

        // 2. 速度滑块
        this.createSlider(width / 2, cy, '敌机速度', 1, 10, 'speed');
        cy += gap;

        // 4. 频率滑块
        this.createSlider(width / 2, cy, '生成频率', 1, 10, 'frequency');
        cy += gap;

        // 5. 同屏最大数量
        this.createSlider(width / 2, cy, '同屏敌机', 1, 15, 'maxEnemies');
        cy += gap;

        // 6. 生命值
        this.createSlider(width / 2, cy, '生命值', 1, 10, 'lives');
        cy += gap;

        // 7. 键盘提示开关
        this.createOptionSelector(width / 2, cy, '键盘提示', [
            { key: true, label: '显示' },
            { key: false, label: '隐藏' }
        ], 'showKeyboard');
        cy += gap;

        // 单词库选择
        this.createOptionSelector(width / 2, cy, '单词库', [
            { key: 'children', label: '儿童词库' },
            { key: 'school', label: '课本词汇' },
            { key: 'custom', label: '自定义' }
        ], 'wordLibrary');
        cy += gap;

        // Beta: 主题选择
        this.createThemeSelector(width / 2, cy);
        cy += gap;

        // Beta: 音效开关
        this.createOptionSelector(width / 2, cy, '音效', [
            { key: true, label: '开启' },
            { key: false, label: '关闭' }
        ], 'soundEnabled');
        cy += gap + 10;

        // 开始游戏按钮
        this.createStartButton(width / 2, cy);

        // 返回按钮
        const backText = this.add.text(width / 2, height - 20, '← 返回主菜单', {
            font: 'bold 14px Arial',
            fill: '#6699cc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backText.on('pointerover', () => backText.setColor('#00ccff'));
        backText.on('pointerout', () => backText.setColor('#6699cc'));
        backText.on('pointerup', () => this.scene.start('MenuScene'));
    }

    /**
     * 创建选项切换器（点击即切换，不刷新场景）
     */
    createOptionSelector(x, y, label, options, paramKey) {
        const leftX = x - 180;

        // 标签
        this.add.text(leftX, y, label, {
            font: 'bold 14px Arial',
            fill: '#aabbcc'
        }).setOrigin(0, 0.5);

        // 选项按钮
        const btnWidth = 80;
        const totalWidth = options.length * (btnWidth + 8);
        const startX = x + 60 - totalWidth / 2;

        const btnGroup = []; // 存储所有按钮引用，用于切换

        options.forEach((opt, i) => {
            const bx = startX + i * (btnWidth + 8);
            const bg = this.add.graphics();
            const currentVal = this.customParams[paramKey];
            const isActive = currentVal === opt.key;

            this.drawOptionBtn(bg, bx, y - 14, btnWidth, 28, isActive);

            const text = this.add.text(bx + btnWidth / 2, y, opt.label, {
                font: '13px Arial',
                fill: isActive ? '#ffffff' : '#889999'
            }).setOrigin(0.5);

            const zone = this.add.zone(bx + btnWidth / 2, y, btnWidth, 28).setInteractive({ useHandCursor: true });

            btnGroup.push({ bg, text, opt, bx });

            zone.on('pointerup', () => {
                // 更新参数
                this.customParams[paramKey] = opt.key;

                // 同步更新单词库设置
                if (paramKey === 'wordLibrary') {
                    WordsData.setCurrentLibrary(opt.key);
                }

                // 持久化
                CustomScene.saveParams(this.customParams);

                // 更新所有按钮的视觉状态（无需 restart）
                btnGroup.forEach(b => {
                    const active = this.customParams[paramKey] === b.opt.key;
                    b.bg.clear();
                    this.drawOptionBtn(b.bg, b.bx, y - 14, btnWidth, 28, active);
                    b.text.setColor(active ? '#ffffff' : '#889999');
                });
            });
        });
    }

    drawOptionBtn(g, x, y, w, h, active) {
        if (active) {
            g.fillStyle(0x00aaff, 0.4);
            g.lineStyle(2, 0x00aaff, 0.8);
        } else {
            g.fillStyle(0x333355, 0.3);
            g.lineStyle(1, 0x556677, 0.4);
        }
        g.fillRoundedRect(x, y, w, h, 6);
        g.strokeRoundedRect(x, y, w, h, 6);
    }

    /**
     * 创建简易滑块
     */
    createSlider(x, y, label, min, max, paramKey) {
        const leftX = x - 180;
        const sliderX = x - 20;
        const sliderWidth = 200;

        // 标签
        this.add.text(leftX, y, label, {
            font: 'bold 14px Arial',
            fill: '#aabbcc'
        }).setOrigin(0, 0.5);

        // 滑块轨道
        const track = this.add.graphics();
        track.fillStyle(0x333355, 0.5);
        track.fillRoundedRect(sliderX, y - 3, sliderWidth, 6, 3);

        // 当前值
        const currentVal = this.customParams[paramKey] || min;
        const ratio = (currentVal - min) / (max - min);
        const handleX = sliderX + ratio * sliderWidth;

        // 已填充部分
        const fillTrack = this.add.graphics();
        fillTrack.fillStyle(0x00aaff, 0.6);
        fillTrack.fillRoundedRect(sliderX, y - 3, ratio * sliderWidth, 6, 3);

        // 滑块手柄
        const handle = this.add.circle(handleX, y, 10, 0x00ccff, 1).setInteractive({ useHandCursor: true, draggable: true });

        // 数值显示
        const valueText = this.add.text(sliderX + sliderWidth + 25, y, `${currentVal}`, {
            font: 'bold 14px Arial',
            fill: '#00ccff'
        }).setOrigin(0.5);

        // 拖动逻辑
        this.input.setDraggable(handle);
        handle.on('drag', (pointer, dragX) => {
            const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
            handle.x = clampedX;
            const newRatio = (clampedX - sliderX) / sliderWidth;
            const newVal = Math.round(min + newRatio * (max - min));
            this.customParams[paramKey] = newVal;
            valueText.setText(`${newVal}`);

            fillTrack.clear();
            fillTrack.fillStyle(0x00aaff, 0.6);
            fillTrack.fillRoundedRect(sliderX, y - 3, newRatio * sliderWidth, 6, 3);

            // 持久化
            CustomScene.saveParams(this.customParams);
        });
    }

    /**
     * Beta: 创建主题选择器
     */
    createThemeSelector(x, y) {
        const leftX = x - 180;
        this.add.text(leftX, y, '场景主题', {
            font: 'bold 14px Arial', fill: '#aabbcc'
        }).setOrigin(0, 0.5);

        const themes = ThemesData.getAllThemes();
        const currentTheme = ThemesData.getCurrentTheme();
        const btnWidth = 80;
        const totalWidth = themes.length * (btnWidth + 8);
        const startX = x + 60 - totalWidth / 2;
        const btnGroup = [];

        themes.forEach((theme, i) => {
            const bx = startX + i * (btnWidth + 8);
            const isActive = currentTheme.key === theme.key;
            const bg = this.add.graphics();
            this.drawOptionBtn(bg, bx, y - 14, btnWidth, 28, isActive);
            const text = this.add.text(bx + btnWidth / 2, y, theme.name, {
                font: '13px Arial', fill: isActive ? '#ffffff' : '#889999'
            }).setOrigin(0.5);
            const zone = this.add.zone(bx + btnWidth / 2, y, btnWidth, 28).setInteractive({ useHandCursor: true });
            btnGroup.push({ bg, text, theme, bx });
            zone.on('pointerup', () => {
                ThemesData.setTheme(theme.key);
                btnGroup.forEach(b => {
                    const active = theme.key === b.theme.key;
                    b.bg.clear();
                    this.drawOptionBtn(b.bg, b.bx, y - 14, btnWidth, 28, active);
                    b.text.setColor(active ? '#ffffff' : '#889999');
                });
            });
        });
    }

    /**
     * 创建开始游戏按钮
     */
    createStartButton(x, y) {
        const btnW = 200;
        const btnH = 44;

        const bg = this.add.graphics();
        bg.fillStyle(0xff9900, 0.25);
        bg.lineStyle(2, 0xff9900, 0.7);
        bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
        bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);

        const text = this.add.text(x, y, '🎮  开始无尽模式', {
            font: 'bold 18px Arial',
            fill: '#ff9900'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0xff9900, 0.4);
            bg.lineStyle(2, 0xff9900, 1);
            bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
            bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
        });

        zone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0xff9900, 0.25);
            bg.lineStyle(2, 0xff9900, 0.7);
            bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
            bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
        });

        zone.on('pointerup', () => {
            // 同步词库设置
            WordsData.setCurrentLibrary(this.customParams.wordLibrary);
            const levelConfig = LevelsData.createCustomLevel(this.customParams);
            this.scene.start('GameScene', { customLevel: levelConfig });
        });
    }
}
