/**
 * 游戏主场景 - 核心游戏玩法
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // 从场景参数获取关卡配置
        if (data.customLevel) {
            this.levelConfig = data.customLevel;
            this.isCustomMode = true;
        } else {
            this.levelConfig = LevelsData.getLevel(data.major, data.minor);
            this.isCustomMode = false;
        }

        // 游戏状态
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.kills = 0;
        this.totalShots = 0;
        this.correctShots = 0;
        this.lives = this.levelConfig.lives;
        this.isPaused = false;
        this.isGameOver = false;
        this.lockedEnemy = null;          // 当前锁定的敌机
        this.lockedLetterIndex = 0;       // 已输入到的字母索引
        this.showKeyboard = this.levelConfig.showKeyboard;
        this.enemies = [];
        this.bullets = [];
    }

    create() {
        const { width, height } = this.cameras.main;
        this.gameWidth = width;
        this.gameHeight = height;

        // 1. 星空滚动背景
        this.createScrollingStarfield();

        // 2. 玩家飞机 - 固定在底部（键盘显示时上移留出空间）
        const playerY = this.showKeyboard ? height - 145 : height - 60;
        this.player = this.add.image(width / 2, playerY, 'player');
        this.player.setScale(0.35);

        // 玩家引擎发光效果
        this.playerGlow = this.add.circle(width / 2, playerY + 20, 5, 0xff6600, 0.4);
        this.tweens.add({
            targets: this.playerGlow,
            scaleX: { from: 0.8, to: 1.3 },
            scaleY: { from: 0.8, to: 1.5 },
            alpha: { from: 0.2, to: 0.5 },
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        // 3. 创建物理分组
        this.enemyGroup = this.add.group();
        this.bulletGroup = this.add.group();

        // 4. 创建 HUD
        this.createHUD();

        // 5. 创建虚拟键盘（如果需要显示）
        this.keyboardDisplay = null;
        if (this.showKeyboard) {
            this.createKeyboardDisplay();
        }

        // 6. 敌机生成定时器
        this.spawnTimer = this.time.addEvent({
            delay: this.levelConfig.spawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // 立即生成第一个敌机
        this.time.delayedCall(500, () => this.spawnEnemy());

        // 7. 键盘输入监听
        this.input.keyboard.on('keydown', this.handleKeyDown, this);

        // 8. 关卡信息提示
        this.showLevelInfo();

        // 9. 危险警告层（最后1条命时使用）
        this.dangerOverlay = this.add.graphics();
        this.dangerOverlay.setDepth(100);
        this.dangerOverlay.setVisible(false);

        // 10. 连击特效层
        this.comboEffectGraphics = this.add.graphics();
        this.comboEffectGraphics.setDepth(99);

        // 11. 暂停菜单容器
        this.pauseContainer = null;

        // 12. 初始化音效系统
        SoundManager.init();
        SoundManager.resume();
        SoundManager.startBGM();
    }

    update(time, delta) {
        if (this.isPaused || this.isGameOver) return;

        // 更新星空滚动
        this.updateStarfield(delta);

        // 更新敌机位置
        this.updateEnemies(delta);

        // 更新子弹
        this.updateBullets(delta);

        // 更新键盘高亮
        if (this.showKeyboard && this.keyboardDisplay) {
            this.updateKeyboardHighlight();
        }
    }

    // ============================================
    // 星空背景
    // ============================================
    createScrollingStarfield() {
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const speed = size * 15;
            const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
            const star = this.add.circle(x, y, size, 0xffffff, alpha);
            star.setDepth(0);
            this.stars.push({ obj: star, speed: speed });
        }
    }

    updateStarfield(delta) {
        const dt = delta / 1000;
        this.stars.forEach(star => {
            star.obj.y += star.speed * dt;
            if (star.obj.y > this.gameHeight) {
                star.obj.y = 0;
                star.obj.x = Phaser.Math.Between(0, this.gameWidth);
            }
        });
    }

    // ============================================
    // HUD 显示
    // ============================================
    createHUD() {
        const hudDepth = 50;

        // 分数
        this.scoreText = this.add.text(15, 10, '分数: 0', {
            font: 'bold 16px Arial',
            fill: '#00ccff'
        }).setDepth(hudDepth);

        // 连击
        this.comboText = this.add.text(15, 32, '', {
            font: 'bold 14px Arial',
            fill: '#ffcc00'
        }).setDepth(hudDepth);

        // 关卡进度
        if (!this.isCustomMode) {
            this.progressText = this.add.text(this.gameWidth / 2, 10, `${this.levelConfig.name}  |  0/${this.levelConfig.targetKills}`, {
                font: '14px Arial',
                fill: '#88aacc'
            }).setOrigin(0.5, 0).setDepth(hudDepth);
        } else {
            this.progressText = this.add.text(this.gameWidth / 2, 10, `♾️ 无尽模式  |  击落: 0`, {
                font: '14px Arial',
                fill: '#ffaa44'
            }).setOrigin(0.5, 0).setDepth(hudDepth);
        }

        // 生命值 - 心形图标
        this.heartIcons = [];
        this.updateHeartsDisplay();


    }

    updateHeartsDisplay() {
        // 清除旧的
        this.heartIcons.forEach(h => h.destroy());
        this.heartIcons = [];

        const startX = this.gameWidth - 15;
        const y = 12;
        for (let i = 0; i < this.levelConfig.lives; i++) {
            const texture = i < this.lives ? 'heart' : 'heart_gray';
            const heart = this.add.image(startX - i * 26, y, texture).setOrigin(1, 0).setScale(0.9).setDepth(50);
            this.heartIcons.push(heart);
        }
    }

    // ============================================
    // 关卡信息提示
    // ============================================
    showLevelInfo() {
        const text = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 50, this.levelConfig.name, {
            font: 'bold 36px Arial',
            fill: '#ffffff',
            stroke: '#000033',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200).setAlpha(0);

        const subText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '准备开始!', {
            font: '18px Arial',
            fill: '#aaccee'
        }).setOrigin(0.5).setDepth(200).setAlpha(0);

        this.tweens.add({
            targets: [text, subText],
            alpha: { from: 0, to: 1 },
            duration: 400,
            onComplete: () => {
                this.tweens.add({
                    targets: [text, subText],
                    alpha: 0,
                    y: '-=30',
                    duration: 600,
                    delay: 1000,
                    onComplete: () => {
                        text.destroy();
                        subText.destroy();
                    }
                });
            }
        });
    }

    // ============================================
    // 敌机系统
    // ============================================
    spawnEnemy() {
        if (this.isPaused || this.isGameOver) return;

        // 检查同屏数量上限
        const aliveEnemies = this.enemies.filter(e => e.alive);
        if (aliveEnemies.length >= this.levelConfig.maxEnemies) return;

        // 获取随机单词
        const word = WordsData.getRandomWord(this.levelConfig.wordType);

        // 随机水平位置（留出边距给文字）
        const margin = 60;
        const x = Phaser.Math.Between(margin, this.gameWidth - margin);

        // 创建敌机精灵（纹理已是2x，缩小到合适大小）
        const enemy = this.add.image(x, -30, 'enemy').setScale(0.4);
        enemy.setDepth(10);

        // 文字显示在机身中心（使用等宽字体，避免 l/i 等字母混淆）
        const wordText = this.add.text(x, -30, word.toLowerCase(), {
            font: 'bold 20px "Courier New", Courier, monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(12);

        // 已输入进度文本（绿色覆盖，左对齐与wordText对齐）
        const typedText = this.add.text(0, 0, '', {
            font: 'bold 20px "Courier New", Courier, monospace',
            fill: '#00ff88',
            stroke: '#003311',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setDepth(13);
        typedText.setVisible(false);

        // 锁定高亮框
        const lockFrame = this.add.graphics();
        lockFrame.setDepth(9);
        lockFrame.setVisible(false);

        // 计算飞行方向（朝向玩家飞机）
        const targetX = this.player.x;
        const targetY = this.player.y;
        const angle = Math.atan2(targetY - (-30), targetX - x);
        const vx = Math.cos(angle) * this.levelConfig.speed;
        const vy = Math.sin(angle) * this.levelConfig.speed;

        const enemyData = {
            sprite: enemy,
            wordText: wordText,
            typedText: typedText,
            lockFrame: lockFrame,
            word: word,
            x: x,
            y: -30,
            vx: vx,
            vy: vy,
            alive: true,
            locked: false,
            typedIndex: 0  // 锁定模式下已输入到的字母索引
        };

        this.enemies.push(enemyData);
    }

    updateEnemies(delta) {
        const dt = delta / 1000;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e.alive) continue;

            // 更新位置
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.sprite.setPosition(e.x, e.y);
            e.wordText.setPosition(e.x, e.y);
            // typedText左对齐到wordText的左边缘
            e.typedText.setPosition(e.x - e.wordText.width / 2, e.y);

            // 更新锁定框位置
            if (e.locked) {
                e.lockFrame.clear();
                e.lockFrame.lineStyle(2, 0x00ff88, 0.8);
                const fw = Math.max(e.wordText.width + 16, e.sprite.displayWidth + 8);
                const fh = e.sprite.displayHeight + 12;
                e.lockFrame.strokeRoundedRect(e.x - fw / 2, e.y - fh / 2, fw, fh, 6);
                e.lockFrame.setVisible(true);
            }

            // 检查是否到达底部（碰到玩家区域）
            if (e.y >= this.player.y - 10) {
                this.enemyReachedBottom(e, i);
            }
        }
    }

    /**
     * 敌机到达底部 - 扣血
     */
    enemyReachedBottom(enemy, index) {
        // 如果是锁定的目标，解除锁定
        if (this.lockedEnemy === enemy) {
            this.lockedEnemy = null;
            this.lockedLetterIndex = 0;
        }

        this.removeEnemy(enemy, index, false);
        this.loseLife();
    }

    /**
     * 移除敌机
     */
    removeEnemy(enemy, index, explode) {
        enemy.alive = false;
        if (explode) {
            this.createExplosion(enemy.x, enemy.y);
        }
        enemy.sprite.destroy();
        enemy.wordText.destroy();
        enemy.typedText.destroy();
        enemy.lockFrame.destroy();
        this.enemies.splice(index, 1);
    }

    // ============================================
    // 键盘输入处理
    // ============================================
    handleKeyDown(event) {
        if (this.isGameOver) return;

        // ESC 暂停
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

        // 只处理字母键
        const key = event.key.toLowerCase();
        if (!/^[a-z]$/.test(key)) return;

        this.totalShots++;

        // 键盘实时反馈按下的键（无论是否命中）
        if (this.keyboardDisplay) {
            this.flashKeyPressed(key);
        }

        this.handleLockModeInput(key);
    }

    /**
     * 输入处理（锁定模式 — 逐字母输入）
     */
    handleLockModeInput(key) {
        if (this.lockedEnemy && this.lockedEnemy.alive) {
            // 已有锁定目标
            const expectedChar = this.lockedEnemy.word[this.lockedLetterIndex];

            if (key === expectedChar) {
                this.correctShots++;
                this.lockedLetterIndex++;

                // 更新已输入文字
                const typed = this.lockedEnemy.word.substring(0, this.lockedLetterIndex);
                this.lockedEnemy.typedText.setText(typed);
                this.lockedEnemy.typedText.setVisible(true);

                // 键盘高亮
                if (this.keyboardDisplay) {
                    this.flashKey(key);
                }

                // 检查是否完成整个单词
                if (this.lockedLetterIndex >= this.lockedEnemy.word.length) {
                    this.fireBullet(this.lockedEnemy);
                    this.lockedEnemy = null;
                    this.lockedLetterIndex = 0;

                    // 无需临时切换逻辑
                }
            } else {
                // 输入错误 - 视觉反馈但不解除锁定
                this.onWrongInput();
            }
        } else {
            // 没有锁定目标，寻找首字母匹配的敌机
            let closestEnemy = null;
            let closestDist = Infinity;

            for (const e of this.enemies) {
                if (!e.alive) continue;
                if (e.word[0] === key) {
                    const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = e;
                    }
                }
            }

            if (closestEnemy) {
                this.correctShots++;

                if (closestEnemy.word.length === 1) {
                    // 单字母直接击落
                    this.fireBullet(closestEnemy);
                } else {
                    // 锁定目标
                    this.lockedEnemy = closestEnemy;
                    this.lockedLetterIndex = 1;
                    closestEnemy.locked = true;
                closestEnemy.typedText.setText(key);
                    closestEnemy.typedText.setVisible(true);
                }

                if (this.keyboardDisplay) {
                    this.flashKey(key);
                }
            } else {
                this.onMissInput();
            }
        }
    }

    /**
     * 未命中（没有匹配的敌机）
     */
    onMissInput() {
        this.combo = 0;
        this.updateComboText();
        SoundManager.playError();
    }

    /**
     * 输入错误（锁定模式下输错字母）
     */
    onWrongInput() {
        this.combo = 0;
        this.updateComboText();
        SoundManager.playError();

        // 屏幕轻微红色闪烁
        const flash = this.add.graphics();
        flash.fillStyle(0xff0000, 0.15);
        flash.fillRect(0, 0, this.gameWidth, this.gameHeight);
        flash.setDepth(90);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    // ============================================
    // 子弹与射击
    // ============================================
    fireBullet(targetEnemy) {
        SoundManager.playShoot();
        const bullet = this.add.image(this.player.x, this.player.y - 20, 'bullet').setScale(0.5);
        bullet.setDepth(8);

        const bulletData = {
            sprite: bullet,
            targetEnemy: targetEnemy,
            x: this.player.x,
            y: this.player.y - 20,
            speed: 600 // 子弹速度
        };

        this.bullets.push(bulletData);
    }

    updateBullets(delta) {
        const dt = delta / 1000;

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            const target = b.targetEnemy;

            if (!target || !target.alive) {
                // 目标已不存在，移除子弹
                b.sprite.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            // 向目标飞行
            const angle = Math.atan2(target.y - b.y, target.x - b.x);
            b.x += Math.cos(angle) * b.speed * dt;
            b.y += Math.sin(angle) * b.speed * dt;
            b.sprite.setPosition(b.x, b.y);
            b.sprite.setRotation(angle + Math.PI / 2);

            // 检查命中
            const dist = Phaser.Math.Distance.Between(b.x, b.y, target.x, target.y);
            if (dist < 25) {
                this.onBulletHit(b, i);
            }

            // 超出屏幕
            if (b.y < -50 || b.y > this.gameHeight + 50) {
                b.sprite.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }

    /**
     * 子弹命中敌机
     */
    onBulletHit(bulletData, bulletIndex) {
        const enemy = bulletData.targetEnemy;

        // 移除子弹
        bulletData.sprite.destroy();
        this.bullets.splice(bulletIndex, 1);

        // 移除敌机（带爆炸效果）
        const enemyIdx = this.enemies.indexOf(enemy);
        if (enemyIdx >= 0) {
            this.removeEnemy(enemy, enemyIdx, true);
        }

        // 更新得分和连击
        this.kills++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // 计算得分（基础分 + 连击加成）
        const baseScore = enemy.word.length * 10;
        const comboBonus = Math.floor(this.combo / 3) * 5;
        this.score += baseScore + comboBonus;

        this.updateScoreText();
        this.updateComboText();
        this.updateProgressText();

        // 连击特效
        if (this.combo === 5 || this.combo === 10 || this.combo === 20) {
            this.showComboEffect(this.combo);
            SoundManager.playCombo();
        }

        // 显示得分飘字
        this.showFloatingScore(enemy.x, enemy.y, baseScore + comboBonus);

        // 检查通关（无尽模式不通关）
        if (!this.isCustomMode && this.kills >= this.levelConfig.targetKills) {
            this.onLevelComplete();
        }
    }

    // ============================================
    // 爆炸效果
    // ============================================
    createExplosion(x, y) {
        SoundManager.playExplosion();
        const colors = [0xff4444, 0xff8800, 0xffcc00, 0xffffff, 0xff6666];
        for (let i = 0; i < 12; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 1);
            particle.setDepth(15);
            const angle = (Math.PI * 2 / 12) * i + Phaser.Math.FloatBetween(-0.3, 0.3);
            const speed = Phaser.Math.Between(80, 200);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: Phaser.Math.Between(300, 600),
                onComplete: () => particle.destroy()
            });
        }
    }

    // ============================================
    // 得分与连击显示
    // ============================================
    updateScoreText() {
        this.scoreText.setText(`分数: ${this.score}`);
    }

    updateComboText() {
        if (this.combo >= 2) {
            this.comboText.setText(`🔥 ${this.combo} 连击!`);
            this.comboText.setScale(1);
            this.tweens.add({
                targets: this.comboText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true
            });
        } else {
            this.comboText.setText('');
        }
    }

    updateProgressText() {
        if (!this.isCustomMode) {
            this.progressText.setText(`${this.levelConfig.name}  |  ${this.kills}/${this.levelConfig.targetKills}`);
        } else {
            this.progressText.setText(`♾️ 无尽模式  |  击落: ${this.kills}`);
        }
    }

    showFloatingScore(x, y, score) {
        const text = this.add.text(x, y, `+${score}`, {
            font: 'bold 18px Arial',
            fill: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    showComboEffect(combo) {
        const text = this.add.text(this.gameWidth / 2, this.gameHeight / 2, `${combo} COMBO!`, {
            font: 'bold 40px Arial',
            fill: '#ffcc00',
            stroke: '#ff6600',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(110).setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1,
            scaleX: { from: 0.5, to: 1.2 },
            scaleY: { from: 0.5, to: 1.2 },
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.tweens.add({
                    targets: text,
                    alpha: 0,
                    y: '-=30',
                    duration: 400,
                    onComplete: () => text.destroy()
                });
            }
        });

        // 屏幕边缘发光
        const glow = this.add.graphics();
        glow.setDepth(99);
        const glowColor = combo >= 20 ? 0xff0000 : combo >= 10 ? 0xff9900 : 0xffcc00;
        glow.lineStyle(6, glowColor, 0.5);
        glow.strokeRect(3, 3, this.gameWidth - 6, this.gameHeight - 6);
        this.tweens.add({
            targets: glow,
            alpha: 0,
            duration: 600,
            onComplete: () => glow.destroy()
        });
    }

    // ============================================
    // 生命值系统
    // ============================================
    loseLife() {
        SoundManager.playLifeLost();
        this.lives--;
        this.combo = 0;
        this.updateComboText();
        this.updateHeartsDisplay();

        // 屏幕红色闪烁
        const flash = this.add.graphics();
        flash.fillStyle(0xff0000, 0.3);
        flash.fillRect(0, 0, this.gameWidth, this.gameHeight);
        flash.setDepth(90);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy()
        });

        // 最后1条命 - 持续危险警告
        if (this.lives === 1) {
            this.startDangerWarning();
        }

        // 生命归零
        if (this.lives <= 0) {
            this.onGameOver(false);
        }
    }

    startDangerWarning() {
        this.dangerOverlay.setVisible(true);
        this.dangerTween = this.tweens.add({
            targets: this.dangerOverlay,
            alpha: { from: 0, to: 0.3 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                this.dangerOverlay.clear();
                this.dangerOverlay.lineStyle(4, 0xff0000, this.dangerOverlay.alpha);
                this.dangerOverlay.strokeRect(2, 2, this.gameWidth - 4, this.gameHeight - 4);
            }
        });
    }

    // ============================================
    // 关卡通关 / 游戏结束
    // ============================================
    onLevelComplete() {
        this.isGameOver = true;
        this.spawnTimer.destroy();
        SoundManager.stopBGM();
        SoundManager.playVictory();

        // 停止危险警告
        if (this.dangerTween) this.dangerTween.stop();
        this.dangerOverlay.setVisible(false);

        const accuracy = this.totalShots > 0 ? Math.round((this.correctShots / this.totalShots) * 100) : 0;

        // 保存进度
        if (!this.isCustomMode) {
            ProgressData.updateLevelStats(this.levelConfig.major, this.levelConfig.minor, {
                score: this.score,
                accuracy: accuracy,
                maxCombo: this.maxCombo
            });
        }

        // 跳转到结算场景
        this.time.delayedCall(800, () => {
            this.scene.start('GameOverScene', {
                victory: true,
                score: this.score,
                kills: this.kills,
                accuracy: accuracy,
                maxCombo: this.maxCombo,
                levelConfig: this.levelConfig,
                isCustom: this.isCustomMode
            });
        });
    }

    onGameOver(victory) {
        this.isGameOver = true;
        this.spawnTimer.destroy();
        SoundManager.stopBGM();

        if (this.dangerTween) this.dangerTween.stop();
        this.dangerOverlay.setVisible(false);

        const accuracy = this.totalShots > 0 ? Math.round((this.correctShots / this.totalShots) * 100) : 0;

        this.time.delayedCall(800, () => {
            this.scene.start('GameOverScene', {
                victory: false,
                score: this.score,
                kills: this.kills,
                accuracy: accuracy,
                maxCombo: this.maxCombo,
                levelConfig: this.levelConfig,
                isCustom: this.isCustomMode
            });
        });
    }

    // ============================================
    // 暂停功能
    // ============================================
    togglePause() {
        if (this.isGameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.spawnTimer.paused = true;
            this.showPauseMenu();
        } else {
            this.spawnTimer.paused = false;
            this.hidePauseMenu();
        }
    }

    showPauseMenu() {
        if (this.pauseContainer) this.pauseContainer.destroy();

        this.pauseContainer = this.add.container(0, 0).setDepth(200);

        // 半透明遮罩
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.pauseContainer.add(overlay);

        // 暂停标题
        const title = this.add.text(this.gameWidth / 2, 160, '⏸ 游戏暂停', {
            font: 'bold 32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.pauseContainer.add(title);

        // 菜单按钮
        const buttons = [
            { text: '▶  继续游戏', callback: () => this.togglePause() },
            { text: '🔄  重试本关', callback: () => this.restartLevel() },
            { text: '🏠  返回主菜单', callback: () => { SoundManager.stopBGM(); this.scene.start('MenuScene'); } },

            { text: `${this.showKeyboard ? '⌨️ 隐藏键盘' : '⌨️ 显示键盘'}`, callback: () => this.toggleKeyboard() },
            { text: `${SoundManager.enabled ? '🔊 关闭音效' : '🔇 开启音效'}`, callback: () => { SoundManager.toggleSound(); this.togglePause(); } }
        ];

        buttons.forEach((btn, i) => {
            const y = 230 + i * 50;
            const btnText = this.add.text(this.gameWidth / 2, y, btn.text, {
                font: '18px Arial',
                fill: '#aaccee'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            btnText.on('pointerover', () => btnText.setColor('#00ccff'));
            btnText.on('pointerout', () => btnText.setColor('#aaccee'));
            btnText.on('pointerup', btn.callback);

            this.pauseContainer.add(btnText);
        });
    }

    hidePauseMenu() {
        if (this.pauseContainer) {
            this.pauseContainer.destroy();
            this.pauseContainer = null;
        }
    }

    restartLevel() {
        if (this.isCustomMode) {
            this.scene.restart({ customLevel: this.levelConfig });
        } else {
            this.scene.restart({ major: this.levelConfig.major, minor: this.levelConfig.minor });
        }
    }

    toggleKeyboard() {
        this.showKeyboard = !this.showKeyboard;
        if (this.showKeyboard && !this.keyboardDisplay) {
            this.createKeyboardDisplay();
        } else if (!this.showKeyboard && this.keyboardDisplay) {
            this.keyboardDisplay.destroy();
            this.keyboardDisplay = null;
        }
        this.togglePause();
    }

    // ============================================
    // 虚拟键盘显示 (占位 - 任务8中完善)
    // ============================================
    createKeyboardDisplay() {
        // 将在任务8中实现完整的键盘布局
        this.keyboardDisplay = this.add.container(0, 0).setDepth(40);
        this.keyboardKeys = {};

        const rows = [
            'qwertyuiop',
            'asdfghjkl',
            'zxcvbnm'
        ];

        // 键盘放在屏幕最底部，飞机上方
        const keySize = 30;
        const gap = 4;
        const keyboardHeight = 3 * (keySize + gap);
        const startY = this.gameHeight - keyboardHeight - 8;

        rows.forEach((row, rowIdx) => {
            const rowWidth = row.length * (keySize + gap);
            const startX = (this.gameWidth - rowWidth) / 2;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                const x = startX + i * (keySize + gap);
                const y = startY + rowIdx * (keySize + gap);

                // 按键背景
                const bg = this.add.graphics();
                bg.fillStyle(0x223355, 0.5);
                bg.lineStyle(1, 0x445577, 0.6);
                bg.fillRoundedRect(x, y, keySize, keySize, 4);
                bg.strokeRoundedRect(x, y, keySize, keySize, 4);

                // 按键字母
                const text = this.add.text(x + keySize / 2, y + keySize / 2, char.toUpperCase(), {
                    font: 'bold 13px "Courier New", Courier, monospace',
                    fill: '#8899aa'
                }).setOrigin(0.5);

                this.keyboardDisplay.add(bg);
                this.keyboardDisplay.add(text);

                this.keyboardKeys[char] = { bg, text, x, y, size: keySize };
            }
        });
    }

    updateKeyboardHighlight() {
        if (!this.keyboardKeys) return;

        // 重置所有按键颜色
        Object.values(this.keyboardKeys).forEach(k => {
            k.text.setColor('#8899aa');
        });

        // 高亮目标按键
        let targetChar = null;
        if (this.lockedEnemy && this.lockedEnemy.alive) {
            targetChar = this.lockedEnemy.word[this.lockedLetterIndex];
        } else {
            // 没有锁定目标，找最近敌机的首字母
            let closest = null;
            let closestDist = Infinity;
            for (const e of this.enemies) {
                if (!e.alive) continue;
                const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = e;
                }
            }
            if (closest) {
                targetChar = closest.word[0];
            }
        }

        if (targetChar && this.keyboardKeys[targetChar]) {
            this.keyboardKeys[targetChar].text.setColor('#00ff88');
        }
    }

    /**
     * 命中时的按键高亮（绿色）
     */
    flashKey(key) {
        if (!this.keyboardKeys || !this.keyboardKeys[key]) return;
        const k = this.keyboardKeys[key];

        // 绿色命中效果
        const flash = this.add.graphics();
        flash.fillStyle(0x00ff88, 0.6);
        flash.fillRoundedRect(k.x, k.y, k.size, k.size, 4);
        flash.setDepth(41);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 250,
            onComplete: () => flash.destroy()
        });
    }

    /**
     * 按下任意键时的实时反馈（白色闪烁 + 按下动画）
     */
    flashKeyPressed(key) {
        if (!this.keyboardKeys || !this.keyboardKeys[key]) return;
        const k = this.keyboardKeys[key];

        // 按下效果：白色闪烁背景
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 0.4);
        flash.fillRoundedRect(k.x, k.y, k.size, k.size, 4);
        flash.setDepth(41);

        // 文字临时变亮白色
        const originalColor = k.text.style.color;
        k.text.setColor('#ffffff');
        k.text.setScale(1.15);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 180,
            onComplete: () => {
                flash.destroy();
                k.text.setColor(originalColor);
                k.text.setScale(1);
            }
        });
    }
}
