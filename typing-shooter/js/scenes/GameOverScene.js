/**
 * 游戏结束/结算场景
 */
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory || false;
        this.finalScore = data.score || 0;
        this.kills = data.kills || 0;
        this.accuracy = data.accuracy || 0;
        this.maxCombo = data.maxCombo || 0;
        this.levelConfig = data.levelConfig;
        this.isCustom = data.isCustom || false;
    }

    create() {
        const { width, height } = this.cameras.main;
        const theme = ThemesData.getCurrentTheme();
        this.cameras.main.setBackgroundColor(theme.bgColor);

        // 星空背景
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 1.5), theme.particleColor, Phaser.Math.FloatBetween(0.1, 0.5));
        }

        if (this.victory) {
            this.showVictoryScreen(width, height);
        } else {
            this.showDefeatScreen(width, height);
        }
    }

    showVictoryScreen(width, height) {
        // 胜利标题
        const title = this.add.text(width / 2, 70, '🎉 关卡通过!', {
            font: 'bold 40px Arial',
            fill: '#ffcc00',
            stroke: '#664400',
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });

        // 关卡名称
        this.add.text(width / 2, 120, this.levelConfig.name, {
            font: '18px Arial',
            fill: '#aabbcc'
        }).setOrigin(0.5);

        // 统计数据卡片
        this.createStatsCard(width, height);

        // 按钮区域
        const btnY = 400;

        if (!this.isCustom) {
            const nextLevel = LevelsData.getNextLevel(this.levelConfig.major, this.levelConfig.minor);
            if (nextLevel) {
                this.createActionButton(width / 2, btnY, '▶  下一关', '#00cc66', () => {
                    this.scene.start('GameScene', { major: nextLevel.major, minor: nextLevel.minor });
                });
            } else {
                this.add.text(width / 2, btnY, '🏆 全部通关！恭喜你！', {
                    font: 'bold 20px Arial',
                    fill: '#ffcc00'
                }).setOrigin(0.5);
            }
        }

        this.createActionButton(width / 2, btnY + 55, '🔄  重玩本关', '#00aaff', () => {
            if (this.isCustom) {
                this.scene.start('GameScene', { customLevel: this.levelConfig });
            } else {
                this.scene.start('GameScene', { major: this.levelConfig.major, minor: this.levelConfig.minor });
            }
        });

        this.createActionButton(width / 2, btnY + 110, '📋  关卡选择', '#ff9900', () => {
            this.scene.start('LevelSelectScene');
        });

        this.createActionButton(width / 2, btnY + 165, '🏠  主菜单', '#888888', () => {
            this.scene.start('MenuScene');
        });
    }

    showDefeatScreen(width, height) {
        // 失败标题
        const title = this.add.text(width / 2, 70, '💥 游戏结束', {
            font: 'bold 40px Arial',
            fill: '#ff4444',
            stroke: '#440000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 关卡名称
        this.add.text(width / 2, 120, this.levelConfig.name, {
            font: '18px Arial',
            fill: '#aabbcc'
        }).setOrigin(0.5);

        // 统计数据
        this.createStatsCard(width, height);

        // 按钮
        const btnY = 400;

        this.createActionButton(width / 2, btnY, '🔄  重试本关', '#00aaff', () => {
            if (this.isCustom) {
                this.scene.start('GameScene', { customLevel: this.levelConfig });
            } else {
                this.scene.start('GameScene', { major: this.levelConfig.major, minor: this.levelConfig.minor });
            }
        });

        this.createActionButton(width / 2, btnY + 55, '📋  关卡选择', '#ff9900', () => {
            this.scene.start('LevelSelectScene');
        });

        this.createActionButton(width / 2, btnY + 110, '🏠  主菜单', '#888888', () => {
            this.scene.start('MenuScene');
        });
    }

    createStatsCard(width, height) {
        const cardX = width / 2 - 160;
        const cardY = 150;
        const cardW = 320;
        const cardH = 220;

        // 卡片背景
        const bg = this.add.graphics();
        bg.fillStyle(0x112233, 0.7);
        bg.lineStyle(2, 0x334466, 0.5);
        bg.fillRoundedRect(cardX, cardY, cardW, cardH, 12);
        bg.strokeRoundedRect(cardX, cardY, cardW, cardH, 12);

        const stats = [
            { label: '总得分', value: `${this.finalScore}`, color: '#ffcc00', size: 'bold 28px Arial' },
            { label: '击落敌机', value: `${this.kills}`, color: '#66ccff' },
            { label: '打字准确率', value: `${this.accuracy}%`, color: '#66ff88' },
            { label: '最高连击', value: `${this.maxCombo}`, color: '#ff9966' }
        ];

        let sy = cardY + 25;
        stats.forEach((stat, i) => {
            const font = stat.size || '16px Arial';

            if (i === 0) {
                // 总得分 - 大号显示
                this.add.text(width / 2, sy, stat.label, {
                    font: '14px Arial',
                    fill: '#8899aa'
                }).setOrigin(0.5);
                this.add.text(width / 2, sy + 30, stat.value, {
                    font: stat.size,
                    fill: stat.color,
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
                sy += 65;
            } else {
                // 其他统计 - 左右排列
                this.add.text(cardX + 25, sy, stat.label, {
                    font: '15px Arial',
                    fill: '#8899aa'
                });
                this.add.text(cardX + cardW - 25, sy, stat.value, {
                    font: 'bold 16px Arial',
                    fill: stat.color
                }).setOrigin(1, 0);
                sy += 35;
            }
        });
    }

    createActionButton(x, y, text, color, callback) {
        const btnW = 220;
        const btnH = 42;
        const colorNum = Phaser.Display.Color.HexStringToColor(color).color;

        const bg = this.add.graphics();
        bg.fillStyle(colorNum, 0.15);
        bg.lineStyle(2, colorNum, 0.5);
        bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
        bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);

        const btnText = this.add.text(x, y, text, {
            font: 'bold 16px Arial',
            fill: color
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(colorNum, 0.3);
            bg.lineStyle(2, colorNum, 0.8);
            bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
            bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
            btnText.setScale(1.05);
        });

        zone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(colorNum, 0.15);
            bg.lineStyle(2, colorNum, 0.5);
            bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
            bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 10);
            btnText.setScale(1);
        });

        zone.on('pointerup', callback);
    }
}
