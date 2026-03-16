/**
 * 主菜单场景
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 初始化音效系统（需要用户首次交互后才能激活）
        SoundManager.init();

        // Beta: 播放主菜单BGM
        SoundManager.startBGM('menu');

        // 星空背景（Beta: 根据主题）
        this.createStarBackground();

        // 游戏标题
        const titleText = this.add.text(width / 2, 90, '✈️ 键盘大作战 ✈️', {
            font: 'bold 44px Arial',
            fill: '#00ccff',
            stroke: '#003366',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 标题发光动画
        this.tweens.add({
            targets: titleText,
            alpha: { from: 0.8, to: 1 },
            scaleX: { from: 0.98, to: 1.02 },
            scaleY: { from: 0.98, to: 1.02 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // 副标题
        this.add.text(width / 2, 140, 'KEYBOARD FIGHTER', {
            font: '16px "Courier New", monospace',
            fill: '#6699cc',
            letterSpacing: 6
        }).setOrigin(0.5);

        // 描述
        this.add.text(width / 2, 170, '用键盘打字击落敌机，在战斗中提升打字速度！', {
            font: '14px Arial',
            fill: '#8899aa'
        }).setOrigin(0.5);

        // 菜单按钮
        const buttonY = 220;
        const buttonGap = 48;

        this.createButton(width / 2, buttonY, '🚀  开始战斗', '#00aaff', () => {
            // 从第一个未完成的关卡开始
            this.startFromProgress();
        });

        this.createButton(width / 2, buttonY + buttonGap, '📋  关卡选择', '#44bb44', () => {
            this.scene.start('LevelSelectScene');
        });

        this.createButton(width / 2, buttonY + buttonGap * 2, '♾️  无尽挑战', '#ff9900', () => {
            this.scene.start('CustomScene');
        });

        this.createButton(width / 2, buttonY + buttonGap * 3, '📚  单词库', '#bb66ff', () => {
            this.scene.start('WordLibScene');
        });

        this.createButton(width / 2, buttonY + buttonGap * 4, '💾  存档管理', '#ff8844', () => {
            SoundManager.stopBGM();
            this.scene.start('SaveScene');
        });

        // 操作说明
        const helpY = 470;
        this.add.text(width / 2, helpY, '— 操作说明 —', {
            font: 'bold 14px Arial',
            fill: '#6677aa'
        }).setOrigin(0.5);

        const helpLines = [
            '🎯 输入正确字母/单词发射子弹击落敌机',
            '⌨️ 仅使用 A-Z 字母键  |  ESC 暂停游戏'
        ];
        helpLines.forEach((line, i) => {
            this.add.text(width / 2, helpY + 22 + i * 20, line, {
                font: '12px Arial',
                fill: '#556688'
            }).setOrigin(0.5);
        });

        // 底部版本信息
        this.add.text(width / 2, height - 15, 'v2.0 Beta  |  Powered by Phaser.js', {
            font: '11px Arial',
            fill: '#334455'
        }).setOrigin(0.5);
    }

    /**
     * 创建星空背景
     */
    createStarBackground() {
        const { width, height } = this.cameras.main;
        const theme = ThemesData.getCurrentTheme();
        this.cameras.main.setBackgroundColor(theme.bgColor);

        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
            const star = this.add.circle(x, y, size, theme.particleColor, alpha);
            // 闪烁动画
            this.tweens.add({
                targets: star,
                alpha: { from: alpha * 0.3, to: alpha },
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }

    /**
     * 创建美观的菜单按钮
     */
    createButton(x, y, text, color, callback) {
        const btnWidth = 260;
        const btnHeight = 48;
        const colorNum = Phaser.Display.Color.HexStringToColor(color).color;

        // 按钮背景
        const bg = this.add.graphics();
        bg.fillStyle(colorNum, 0.15);
        bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
        bg.lineStyle(2, colorNum, 0.6);
        bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);

        // 按钮文字
        const btnText = this.add.text(x, y, text, {
            font: 'bold 18px Arial',
            fill: color
        }).setOrigin(0.5);

        // 交互区域
        const hitArea = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(colorNum, 0.3);
            bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
            bg.lineStyle(2, colorNum, 1);
            bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
            btnText.setScale(1.05);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(colorNum, 0.15);
            bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
            bg.lineStyle(2, colorNum, 0.6);
            bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
            btnText.setScale(1);
        });

        hitArea.on('pointerdown', () => {
            btnText.setScale(0.95);
        });

        hitArea.on('pointerup', () => {
            btnText.setScale(1);
            callback();
        });

        return { bg, btnText, hitArea };
    }

    /**
     * 从进度继续开始游戏
     */
    startFromProgress() {
        const progress = ProgressData.getAllProgress();
        // 找到第一个未完成的已解锁关卡
        for (const level of LevelsData.levels) {
            const key = `${level.major}_${level.minor}`;
            const p = progress[key];
            if (p && p.unlocked && !p.completed) {
                this.scene.start('GameScene', { major: level.major, minor: level.minor });
                return;
            }
        }
        // 全部通关，从第一关开始
        this.scene.start('GameScene', { major: 0, minor: 0 });
    }
}
