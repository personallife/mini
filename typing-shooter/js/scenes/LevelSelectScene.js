/**
 * 关卡选择场景
 * 支持 3×10=30 关，带滚动和解锁全部按钮
 */
class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 星空背景
        this.createStarBackground();

        // 标题
        this.add.text(width / 2, 30, '📋 关卡选择', {
            font: 'bold 28px Arial',
            fill: '#00ccff',
            stroke: '#003366',
            strokeThickness: 3
        }).setOrigin(0.5);

        // 总进度
        const stats = ProgressData.getOverallStats();
        this.add.text(width / 2, 55, `总进度: ${stats.completedLevels}/${stats.totalLevels} (${stats.completionRate}%)`, {
            font: '12px Arial',
            fill: '#6699aa'
        }).setOrigin(0.5);

        // 创建可滚动容器
        // 每个大级别区块高度：标题30 + 两行卡片(60+8+60) + 间距20 ≈ 178
        const contentHeight = LevelsData.MAJOR_LEVELS.length * 185 + 40;
        const visibleHeight = height - 110; // 减去顶部标题和底部按钮区域

        this.scrollY = 0;
        this.maxScrollY = Math.max(0, contentHeight - visibleHeight);
        this.scrollContainer = this.add.container(0, 75);

        // 裁剪遮罩（只显示中间可滚动区域）
        const maskShape = this.make.graphics();
        maskShape.fillRect(0, 75, width, visibleHeight);
        const mask = maskShape.createGeometryMask();
        this.scrollContainer.setMask(mask);

        // 渲染3大级别区域
        let currentY = 0;

        LevelsData.MAJOR_LEVELS.forEach((majorLevel, majorIdx) => {
            currentY = this.createMajorLevelSection(majorLevel, majorIdx, width, currentY);
            currentY += 15; // 间距
        });

        // 鼠标滚轮滚动
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScrollY);
            this.scrollContainer.y = 75 - this.scrollY;
        });

        // 底部按钮区域
        this.createBottomButtons(width, height);
    }

    /**
     * 创建大级别区块（每行5个卡片，共2行）
     */
    createMajorLevelSection(majorLevel, majorIdx, width, y) {
        const colorNum = Phaser.Display.Color.HexStringToColor(majorLevel.color).color;

        // 级别标题背景
        const titleBg = this.add.graphics();
        titleBg.fillStyle(colorNum, 0.12);
        titleBg.fillRoundedRect(15, y, width - 30, 26, { tl: 8, tr: 8, bl: 0, br: 0 });
        this.scrollContainer.add(titleBg);

        // 级别标题
        const titleText = this.add.text(30, y + 13, `${majorLevel.name} (${majorLevel.nameEn})`, {
            font: 'bold 14px Arial',
            fill: majorLevel.color
        }).setOrigin(0, 0.5);
        this.scrollContainer.add(titleText);

        // 级别类型说明
        const typeLabels = { letter: '单字母', short: '短单词 3-4位', long: '长单词 5+位' };
        const typeText = this.add.text(width - 30, y + 13, typeLabels[majorLevel.wordType], {
            font: '11px Arial',
            fill: '#667788'
        }).setOrigin(1, 0.5);
        this.scrollContainer.add(typeText);

        // 小关卡网格（2行5列）
        const levels = LevelsData.getLevelsByMajor(majorIdx);
        const cardsPerRow = 5;
        const cardGap = 6;
        const totalCardWidth = width - 50;
        const cardWidth = (totalCardWidth - (cardsPerRow - 1) * cardGap) / cardsPerRow;
        const cardHeight = 56;
        const cardStartX = 25;
        let cardY = y + 30;

        levels.forEach((level, idx) => {
            const row = Math.floor(idx / cardsPerRow);
            const col = idx % cardsPerRow;
            const cx = cardStartX + col * (cardWidth + cardGap);
            const cy = cardY + row * (cardHeight + cardGap);

            this.createLevelCard(level, cx, cy, cardWidth, cardHeight, majorLevel.color, colorNum);
        });

        const rowCount = Math.ceil(levels.length / cardsPerRow);
        return y + 30 + rowCount * (cardHeight + cardGap);
    }

    /**
     * 创建单个关卡卡片（紧凑版）
     */
    createLevelCard(level, x, y, w, h, color, colorNum) {
        const stats = ProgressData.getLevelStats(level.major, level.minor);
        const unlocked = stats.unlocked;
        const completed = stats.completed;

        // 卡片背景
        const bg = this.add.graphics();
        if (unlocked) {
            bg.fillStyle(colorNum, completed ? 0.2 : 0.08);
            bg.lineStyle(1.5, colorNum, completed ? 0.7 : 0.3);
        } else {
            bg.fillStyle(0x333344, 0.25);
            bg.lineStyle(1, 0x444466, 0.2);
        }
        bg.fillRoundedRect(x, y, w, h, 6);
        bg.strokeRoundedRect(x, y, w, h, 6);
        this.scrollContainer.add(bg);

        const cx = x + w / 2;

        if (unlocked) {
            // 关卡编号 + 状态
            const label = completed ? `✅ 第${level.minor + 1}关` : `▶ 第${level.minor + 1}关`;
            const cardText = this.add.text(cx, y + 16, label, {
                font: 'bold 12px Arial',
                fill: color
            }).setOrigin(0.5);
            this.scrollContainer.add(cardText);

            // 最高分或参数
            const infoStr = stats.highScore > 0 ? `🏆${stats.highScore}` : `⚡${level.speed}`;
            const infoText = this.add.text(cx, y + 36, infoStr, {
                font: '9px Arial',
                fill: '#8899aa'
            }).setOrigin(0.5);
            this.scrollContainer.add(infoText);

            // 可点击区域
            const hitZone = this.add.zone(cx, y + h / 2, w, h).setInteractive({ useHandCursor: true });
            this.scrollContainer.add(hitZone);

            hitZone.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(colorNum, 0.3);
                bg.lineStyle(2, colorNum, 0.9);
                bg.fillRoundedRect(x, y, w, h, 6);
                bg.strokeRoundedRect(x, y, w, h, 6);
            });

            hitZone.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(colorNum, completed ? 0.2 : 0.08);
                bg.lineStyle(1.5, colorNum, completed ? 0.7 : 0.3);
                bg.fillRoundedRect(x, y, w, h, 6);
                bg.strokeRoundedRect(x, y, w, h, 6);
            });

            hitZone.on('pointerup', () => {
                this.scene.start('GameScene', { major: level.major, minor: level.minor });
            });
        } else {
            // 锁定状态
            const lockText = this.add.text(cx, y + 16, `🔒 第${level.minor + 1}关`, {
                font: '11px Arial',
                fill: '#556677'
            }).setOrigin(0.5);
            this.scrollContainer.add(lockText);

            const lockInfo = this.add.text(cx, y + 36, '未解锁', {
                font: '9px Arial',
                fill: '#445566'
            }).setOrigin(0.5);
            this.scrollContainer.add(lockInfo);
        }
    }

    /**
     * 创建底部按钮区域
     */
    createBottomButtons(width, height) {
        const btnY = height - 25;

        // 返回按钮
        const backText = this.add.text(width / 2 - 100, btnY, '← 返回主菜单', {
            font: 'bold 14px Arial',
            fill: '#6699cc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backText.on('pointerover', () => backText.setColor('#00ccff'));
        backText.on('pointerout', () => backText.setColor('#6699cc'));
        backText.on('pointerup', () => this.scene.start('MenuScene'));

        // 解锁全部按钮（测试用）
        const unlockText = this.add.text(width / 2 + 100, btnY, '🔓 解锁全部', {
            font: 'bold 14px Arial',
            fill: '#ff6644'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        unlockText.on('pointerover', () => unlockText.setColor('#ff9900'));
        unlockText.on('pointerout', () => unlockText.setColor('#ff6644'));
        unlockText.on('pointerup', () => {
            ProgressData.unlockAllLevels();
            this.scene.restart(); // 刷新显示
        });
    }

    createStarBackground() {
        const { width, height } = this.cameras.main;
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 1.5);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
            this.add.circle(x, y, size, 0xffffff, alpha);
        }
    }
}
