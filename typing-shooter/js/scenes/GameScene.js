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

        // Beta: Boss 战状态
        this.isBossLevel = !this.isCustomMode && !!this.levelConfig.isBoss;
        this.boss = null;           // Boss 对象
        this.bossHP = 0;
        this.bossMaxHP = 0;
        this.bossEnraged = false;   // 狂暴阶段（<50%血量）
        this.bossFinalForm = false; // 最终形态（<25%血量）
        this.bossWord = null;       // Boss 当前单词
        this.bossTypedIndex = 0;    // Boss 已输入索引
        this.bossHitsNeeded = 0;
        this.bossHitsLanded = 0;
        this.bossActive = false;
        this.bossBullets = [];       // Boss 子弹列表
        this.bossBulletTimer = 0;    // Boss 射击计时器
        this.bossMovementPhase = 0;  // Boss 左右移动相位

        // Beta: 道具系统状态
        this.powerups = [];              // 活跃道具列表
        this.shieldActive = false;       // 护盾状态
        this.shieldTimer = 0;
        this.slowActive = false;         // 减速状态
        this.slowTimer = 0;
        this.slowSpeedFactor = 0.25;     // 减速系数（越小越慢）
        this.freezeActive = false;       // 冰冻状态
        this.freezeTimer = 0;
        this.doubleScoreActive = false;  // 双倍得分状态
        this.doubleScoreTimer = 0;
        this.magnetActive = false;       // 磁铁状态
        this.magnetTimer = 0;
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
        SoundManager.startBGM('battle');

        // 13. Beta: Boss 关卡初始化
        if (this.isBossLevel) {
            this.time.delayedCall(2000, () => this.startBossFight());
        }
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

        // Beta: 更新 Boss
        if (this.bossActive && this.boss) {
            this.updateBoss(delta);
            this.updateBossBullets(delta);
        }

        // Beta: 更新道具
        this.updatePowerups(delta);
        this.updatePowerupTimers(delta);

        // Beta: 护盾跟随玩家
        if (this.shieldActive && this.shieldVisual) {
            this.shieldVisual.setPosition(this.player.x, this.player.y);
        }
    }

    // ============================================
    // Beta: 道具系统
    // ============================================

    /**
     * 生成道具
     */
    spawnPowerup(x, y) {
        // 加权随机道具（减速/冰冻/护盾更常见，修复较少）
        const typesPool = [
            'shield', 'shield',
            'slow', 'slow', 'slow',
            'bomb',
            'freeze', 'freeze', 'freeze',
            'double', 'double',
            'heal',
            'magnet'
        ];
        const type = Phaser.Utils.Array.GetRandom(typesPool);
        const textureMap = {
            shield: 'powerup_shield', slow: 'powerup_slow', bomb: 'powerup_bomb',
            freeze: 'powerup_freeze', double: 'powerup_double',
            heal: 'powerup_heal', magnet: 'powerup_magnet'
        };
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const collectLetter = letters[Phaser.Math.Between(0, 25)];

        const sprite = this.add.image(x, y, textureMap[type]).setScale(0.3).setDepth(11);
        const letterText = this.add.text(x, y + 30, collectLetter, {
            font: 'bold 18px "Courier New", Courier, monospace',
            fill: '#ffff00', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        // 缓慢飘落动画
        const powerup = {
            sprite: sprite,
            letterText: letterText,
            type: type,
            collectLetter: collectLetter,
            x: x,
            y: y,
            speed: this.levelConfig.speed * 0.5,
            alive: true
        };
        this.powerups.push(powerup);
    }

    /**
     * 更新道具位置
     */
    updatePowerups(delta) {
        const dt = delta / 1000;
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (!p.alive) continue;

            // Beta: 磁铁效果 - 道具自动飞向玩家
            if (this.magnetActive && this.player) {
                const dx = this.player.x - p.x;
                const dy = this.player.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const magnetSpeed = 180; // 磁铁吸引速度
                    p.x += (dx / dist) * magnetSpeed * dt;
                    p.y += (dy / dist) * magnetSpeed * dt;
                    // 磁铁模式：靠近玩家自动收集
                    if (dist < 50) {
                        this.collectPowerup(p, i);
                        continue;
                    }
                }
            } else {
                p.y += p.speed * dt;
            }

            p.sprite.setPosition(p.x, p.y);
            p.letterText.setPosition(p.x, p.y + 30);
            // 飘落到底部移除
            if (p.y > this.gameHeight + 20) {
                p.sprite.destroy();
                p.letterText.destroy();
                this.powerups.splice(i, 1);
            }
        }
    }

    /**
     * 更新道具效果计时器
     */
    updatePowerupTimers(delta) {
        const dt = delta / 1000;
        // 护盾倒计时
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimerText) this.shieldTimerText.setText(`🛡️ ${Math.ceil(this.shieldTimer)}s`);
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                if (this.shieldVisual) { this.shieldVisual.destroy(); this.shieldVisual = null; }
                if (this.shieldTimerText) { this.shieldTimerText.destroy(); this.shieldTimerText = null; }
            }
        }
        // 减速倒计时
        if (this.slowActive) {
            this.slowTimer -= dt;
            if (this.slowTimerText) this.slowTimerText.setText(`🐢 ${Math.ceil(this.slowTimer)}s`);
            if (this.slowTimer <= 0) {
                this.slowActive = false;
                if (this.slowTimerText) { this.slowTimerText.destroy(); this.slowTimerText = null; }
                if (this.slowOverlay) { this.slowOverlay.destroy(); this.slowOverlay = null; }
                // 恢复敌机速度（使用记录的原始速度）
                this.enemies.forEach(e => {
                    if (e.alive && !this.freezeActive && e._originalVx !== undefined) {
                        e.vx = e._originalVx;
                        e.vy = e._originalVy;
                        delete e._originalVx;
                        delete e._originalVy;
                        if (e.sprite) e.sprite.clearTint();
                    }
                });
            }
        }
        // 磁铁倒计时
        if (this.magnetActive) {
            this.magnetTimer -= dt;
            if (this.magnetTimerText) this.magnetTimerText.setText(`🧲 ${Math.ceil(this.magnetTimer)}s`);
            if (this.magnetTimer <= 0) {
                this.magnetActive = false;
                if (this.magnetTimerText) { this.magnetTimerText.destroy(); this.magnetTimerText = null; }
                if (this.magnetOverlay) { this.magnetOverlay.destroy(); this.magnetOverlay = null; }
            }
        }
        // 冰冻倒计时
        if (this.freezeActive) {
            this.freezeTimer -= dt;
            if (this.freezeTimerText) this.freezeTimerText.setText(`❄️ ${Math.ceil(this.freezeTimer)}s`);
            if (this.freezeTimer <= 0) {
                this.freezeActive = false;
                if (this.freezeTimerText) { this.freezeTimerText.destroy(); this.freezeTimerText = null; }
                if (this.freezeOverlay) { this.freezeOverlay.destroy(); this.freezeOverlay = null; }
                // 恢复敌机速度和颜色
                this.enemies.forEach(e => {
                    if (e.alive) {
                        if (e._frozenVx !== undefined) {
                            const factor = this.slowActive ? this.slowSpeedFactor : 1;
                            e.vx = e._frozenVx * factor;
                            e.vy = e._frozenVy * factor;
                            // 如果减速仍在，保留原始速度记录
                            if (this.slowActive) {
                                e._originalVx = e._frozenVx;
                                e._originalVy = e._frozenVy;
                                if (e.sprite) e.sprite.setTint(0x44ddcc); // 减速色
                            } else {
                                if (e.sprite) e.sprite.clearTint();
                            }
                            delete e._frozenVx;
                            delete e._frozenVy;
                        } else {
                            if (e.sprite) e.sprite.clearTint();
                        }
                    }
                });
            }
        }
        // 双倍得分倒计时
        if (this.doubleScoreActive) {
            this.doubleScoreTimer -= dt;
            if (this.doubleTimerText) this.doubleTimerText.setText(`✨x2 ${Math.ceil(this.doubleScoreTimer)}s`);
            if (this.doubleScoreTimer <= 0) {
                this.doubleScoreActive = false;
                if (this.doubleTimerText) { this.doubleTimerText.destroy(); this.doubleTimerText = null; }
                if (this.doubleOverlay) { this.doubleOverlay.destroy(); this.doubleOverlay = null; }
            }
        }
    }

    /**
     * 尝试收集道具（输入匹配）
     */
    tryCollectPowerup(key) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (p.alive && p.collectLetter === key) {
                this.collectPowerup(p, i);
                return true;
            }
        }
        return false;
    }

    /**
     * 收集道具并触发效果
     */
    collectPowerup(powerup, index) {
        powerup.alive = false;
        powerup.sprite.destroy();
        powerup.letterText.destroy();
        this.powerups.splice(index, 1);

        SoundManager.playCombo();

        // 全屏闪光
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 0.25);
        flash.fillRect(0, 0, this.gameWidth, this.gameHeight);
        flash.setDepth(90);
        this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

        switch (powerup.type) {
            case 'shield': this.activateShield(); break;
            case 'slow': this.activateSlow(); break;
            case 'bomb': this.activateBomb(); break;
            case 'freeze': this.activateFreeze(); break;
            case 'double': this.activateDoubleScore(); break;
            case 'heal': this.activateHeal(); break;
            case 'magnet': this.activateMagnet(); break;
        }
    }

    /**
     * 激活护盾
     */
    activateShield() {
        this.shieldActive = true;
        this.shieldTimer = 10;
        // 护盾视觉
        if (this.shieldVisual) this.shieldVisual.destroy();
        this.shieldVisual = this.add.circle(this.player.x, this.player.y, 35, 0x2299ff, 0.2).setDepth(25);
        this.shieldVisual.setStrokeStyle(2, 0x44bbff, 0.6);
        this.tweens.add({ targets: this.shieldVisual, scaleX: { from: 0.9, to: 1.1 }, scaleY: { from: 0.9, to: 1.1 }, duration: 600, yoyo: true, repeat: -1 });
        // HUD 倒计时
        if (this.shieldTimerText) this.shieldTimerText.destroy();
        this.shieldTimerText = this.add.text(this.gameWidth - 15, 35, `🛡️ 10s`, {
            font: 'bold 13px Arial', fill: '#44bbff'
        }).setOrigin(1, 0).setDepth(50);
    }

    /**
     * 激活减速（增强版：使用记录原速方式避免精度丢失）
     */
    activateSlow() {
        this.slowActive = true;
        this.slowTimer = 10;
        const factor = this.slowSpeedFactor; // 0.25
        // 记录并减速所有敌机
        this.enemies.forEach(e => {
            if (e.alive && !this.freezeActive) {
                if (e._originalVx === undefined) {
                    e._originalVx = e.vx;
                    e._originalVy = e.vy;
                }
                e.vx = e._originalVx * factor;
                e.vy = e._originalVy * factor;
                // 减速视觉：敌机变蓝绿色
                if (e.sprite) e.sprite.setTint(0x44ddcc);
            }
        });
        // 视觉效果：更明显的屏幕覆盖 + 波纹边框
        if (this.slowOverlay) this.slowOverlay.destroy();
        this.slowOverlay = this.add.graphics().setDepth(88);
        this.slowOverlay.fillStyle(0x00aaff, 0.12);
        this.slowOverlay.fillRect(0, 0, this.gameWidth, this.gameHeight);
        // 脉冲边框效果
        this.slowOverlay.lineStyle(3, 0x44ccff, 0.4);
        this.slowOverlay.strokeRect(2, 2, this.gameWidth - 4, this.gameHeight - 4);
        // 提示文字闪现
        const hint = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, '🐢 减速！', {
            font: 'bold 24px Arial', fill: '#44ddff',
            stroke: '#003366', strokeThickness: 3
        }).setOrigin(0.5).setDepth(95).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 1, duration: 200, yoyo: true, hold: 400, onComplete: () => hint.destroy() });
        // HUD 倒计时
        if (this.slowTimerText) this.slowTimerText.destroy();
        this.slowTimerText = this.add.text(this.gameWidth - 15, 55, `🐢 10s`, {
            font: 'bold 13px Arial', fill: '#44ccff'
        }).setOrigin(1, 0).setDepth(50);
    }

    /**
     * 激活炸弹
     */
    activateBomb() {
        // 全屏闪白
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 0.5);
        flash.fillRect(0, 0, this.gameWidth, this.gameHeight);
        flash.setDepth(95);
        this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
        this.cameras.main.shake(300, 0.02);

        // 炸掉所有敌机
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.alive) {
                this.createExplosion(e.x, e.y);
                e.alive = false;
                e.sprite.destroy();
                e.wordText.destroy();
                e.typedText.destroy();
                e.lockFrame.destroy();
            }
        }
        this.enemies = [];
        // 解除锁定
        if (this.lockedEnemy) {
            this.lockedEnemy = null;
            this.lockedLetterIndex = 0;
        }
    }

    /**
     * 激活冰冻：完全冻住所有敌机 5 秒
     */
    activateFreeze() {
        this.freezeActive = true;
        this.freezeTimer = 5;
        // 保存原速度并冻住
        this.enemies.forEach(e => {
            if (e.alive) {
                e._frozenVx = e.vx;
                e._frozenVy = e.vy;
                e.vx = 0;
                e.vy = 0;
                // 变蓝特效
                if (e.sprite) e.sprite.setTint(0x66ccff);
            }
        });
        // 视觉效果：淡蓝冻结覆盖
        if (this.freezeOverlay) this.freezeOverlay.destroy();
        this.freezeOverlay = this.add.graphics().setDepth(88);
        this.freezeOverlay.fillStyle(0x00ccff, 0.12);
        this.freezeOverlay.fillRect(0, 0, this.gameWidth, this.gameHeight);
        // 屏幕边缘冰霜效果（多层）
        this.freezeOverlay.lineStyle(4, 0x88eeff, 0.5);
        this.freezeOverlay.strokeRect(2, 2, this.gameWidth - 4, this.gameHeight - 4);
        this.freezeOverlay.lineStyle(2, 0xaaeeff, 0.3);
        this.freezeOverlay.strokeRect(6, 6, this.gameWidth - 12, this.gameHeight - 12);
        // 提示文字闪现
        const hint = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, '❄️ 冰冻！', {
            font: 'bold 26px Arial', fill: '#88eeff',
            stroke: '#003355', strokeThickness: 3
        }).setOrigin(0.5).setDepth(95).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 1, duration: 200, yoyo: true, hold: 500, onComplete: () => hint.destroy() });
        // HUD
        if (this.freezeTimerText) this.freezeTimerText.destroy();
        this.freezeTimerText = this.add.text(this.gameWidth - 15, 75, `❄️ 5s`, {
            font: 'bold 13px Arial', fill: '#88eeff'
        }).setOrigin(1, 0).setDepth(50);
    }

    /**
     * 激活治疗：恢复1点生命值
     */
    activateHeal() {
        if (this.lives < this.levelConfig.lives) {
            this.lives++;
        }
        this.updateHeartsDisplay();
        // 绿色闪光效果
        const flash = this.add.graphics().setDepth(95);
        flash.fillStyle(0x44ff88, 0.2);
        flash.fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.tweens.add({ targets: flash, alpha: 0, duration: 600, onComplete: () => flash.destroy() });
        // 提示文字
        const hint = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, '💚 +1 生命', {
            font: 'bold 24px Arial', fill: '#44ff88',
            stroke: '#003322', strokeThickness: 3
        }).setOrigin(0.5).setDepth(95).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 1, duration: 200, yoyo: true, hold: 500, onComplete: () => hint.destroy() });
    }

    /**
     * 激活磁铁：8秒内道具自动飞向玩家
     */
    activateMagnet() {
        this.magnetActive = true;
        this.magnetTimer = 8;
        // 视觉覆盖
        if (this.magnetOverlay) this.magnetOverlay.destroy();
        this.magnetOverlay = this.add.graphics().setDepth(88);
        this.magnetOverlay.fillStyle(0xff44ff, 0.05);
        this.magnetOverlay.fillRect(0, 0, this.gameWidth, this.gameHeight);
        // 提示文字
        const hint = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, '🧲 磁铁！', {
            font: 'bold 24px Arial', fill: '#ff88ff',
            stroke: '#330033', strokeThickness: 3
        }).setOrigin(0.5).setDepth(95).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 1, duration: 200, yoyo: true, hold: 400, onComplete: () => hint.destroy() });
        // HUD
        if (this.magnetTimerText) this.magnetTimerText.destroy();
        this.magnetTimerText = this.add.text(this.gameWidth - 15, 115, `🧲 8s`, {
            font: 'bold 13px Arial', fill: '#ff88ff'
        }).setOrigin(1, 0).setDepth(50);
    }

    /**
     * 激活双倍得分：12 秒内得分×2
     */
    activateDoubleScore() {
        this.doubleScoreActive = true;
        this.doubleScoreTimer = 12;
        // 视觉效果：金色光芒覆盖
        if (this.doubleOverlay) this.doubleOverlay.destroy();
        this.doubleOverlay = this.add.graphics().setDepth(88);
        this.doubleOverlay.fillStyle(0xffaa00, 0.06);
        this.doubleOverlay.fillRect(0, 0, this.gameWidth, this.gameHeight);
        // HUD
        if (this.doubleTimerText) this.doubleTimerText.destroy();
        this.doubleTimerText = this.add.text(this.gameWidth - 15, 95, `✨x2 12s`, {
            font: 'bold 13px Arial', fill: '#ffcc00'
        }).setOrigin(1, 0).setDepth(50);
    }

    // ============================================
    // 爆炸效果
    // ============================================
    createScrollingStarfield() {
        // Beta: 根据主题生成不同粒子
        const theme = ThemesData.getCurrentTheme();
        this.currentTheme = theme;
        this.cameras.main.setBackgroundColor(theme.bgColor);

        this.stars = [];
        const count = theme.particleCount;
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const size = Phaser.Math.FloatBetween(0.5, 2.5);
            const speed = size * 15;
            const alpha = Phaser.Math.FloatBetween(theme.particleAlphaMin, theme.particleAlphaMax);

            let particle;
            if (theme.particleType === 'bubble') {
                // 海洋气泡 - 向上飘
                particle = this.add.circle(x, y, size + 1, theme.particleColor, alpha);
                particle.setStrokeStyle(0.5, 0x88ddff, alpha * 0.5);
                this.stars.push({ obj: particle, speed: -speed * 0.6, drift: Phaser.Math.FloatBetween(-5, 5) });
            } else if (theme.particleType === 'leaf') {
                // 森林树叶 - 向下飘落+水平飘动
                const leafColors = [0x88cc44, 0x66aa33, 0xaadd55, 0xccee66];
                const color = Phaser.Utils.Array.GetRandom(leafColors);
                particle = this.add.ellipse(x, y, size * 2.5, size * 1.2, color, alpha);
                particle.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
                this.stars.push({ obj: particle, speed: speed * 0.4, drift: Phaser.Math.FloatBetween(-10, 10), rotSpeed: Phaser.Math.FloatBetween(-1, 1) });
            } else {
                // 星空星点
                particle = this.add.circle(x, y, size, theme.particleColor, alpha);
                this.stars.push({ obj: particle, speed: speed });
            }
            particle.setDepth(0);
        }

        // 森林主题额外萤火虫效果
        if (theme.particleType === 'leaf') {
            for (let i = 0; i < 15; i++) {
                const fx = Phaser.Math.Between(0, this.gameWidth);
                const fy = Phaser.Math.Between(0, this.gameHeight);
                const firefly = this.add.circle(fx, fy, 2, 0xffff44, 0.3).setDepth(1);
                this.tweens.add({
                    targets: firefly,
                    alpha: { from: 0.1, to: 0.6 },
                    x: fx + Phaser.Math.Between(-50, 50),
                    y: fy + Phaser.Math.Between(-30, 30),
                    duration: Phaser.Math.Between(2000, 4000),
                    yoyo: true, repeat: -1
                });
                this.stars.push({ obj: firefly, speed: 0 });
            }
        }
    }

    updateStarfield(delta) {
        const dt = delta / 1000;
        const theme = this.currentTheme;
        this.stars.forEach(star => {
            if (star.speed === 0) return; // 萤火虫由tween控制
            star.obj.y += star.speed * dt;
            if (star.drift) star.obj.x += star.drift * dt;
            if (star.rotSpeed) star.obj.rotation += star.rotSpeed * dt;

            // 边界重置
            if (theme && theme.particleType === 'bubble') {
                if (star.obj.y < -10) {
                    star.obj.y = this.gameHeight + 10;
                    star.obj.x = Phaser.Math.Between(0, this.gameWidth);
                }
            } else {
                if (star.obj.y > this.gameHeight + 10) {
                    star.obj.y = -10;
                    star.obj.x = Phaser.Math.Between(0, this.gameWidth);
                }
                if (star.obj.y < -10) {
                    star.obj.y = this.gameHeight + 10;
                    star.obj.x = Phaser.Math.Between(0, this.gameWidth);
                }
            }
            // 水平边界
            if (star.obj.x < -20) star.obj.x = this.gameWidth + 10;
            if (star.obj.x > this.gameWidth + 20) star.obj.x = -10;
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
    /**
     * 根据关卡配置的概率随机选择敌机类型
     */
    pickEnemyType() {
        const types = this.levelConfig.enemyTypes || { normal: 1 };
        const rand = Math.random();
        let cumulative = 0;
        for (const [type, prob] of Object.entries(types)) {
            cumulative += prob;
            if (rand <= cumulative) return type;
        }
        return 'normal';
    }

    /**
     * 获取敌机类型对应的纹理和缩放
     */
    getEnemyConfig(type) {
        const configs = {
            normal:  { texture: 'enemy',           scale: 0.4, speedMul: 1.0 },
            fast:    { texture: 'enemy_fast',       scale: 0.38, speedMul: 1.7 },
            armored: { texture: 'enemy_armored',    scale: 0.42, speedMul: 0.7 },
            zigzag:  { texture: 'enemy_zigzag',     scale: 0.4, speedMul: 0.8 }
        };
        return configs[type] || configs.normal;
    }

    spawnEnemy() {
        if (this.isPaused || this.isGameOver) return;

        // 检查同屏数量上限
        const aliveEnemies = this.enemies.filter(e => e.alive);
        if (aliveEnemies.length >= this.levelConfig.maxEnemies) return;

        // 选择敌机类型
        const enemyType = this.pickEnemyType();
        const config = this.getEnemyConfig(enemyType);

        // 获取随机单词（快速敌机用较短单词）
        let wordType = this.levelConfig.wordType;
        if (enemyType === 'fast' && wordType !== 'letter') {
            wordType = 'short'; // 快速敌机强制使用短单词
        }
        const word = WordsData.getRandomWord(wordType);

        // 随机水平位置
        const margin = 60;
        const x = Phaser.Math.Between(margin, this.gameWidth - margin);

        // 创建敌机精灵
        const enemy = this.add.image(x, -30, config.texture).setScale(config.scale);
        enemy.setDepth(10);

        // 文字显示在机身中心
        const wordText = this.add.text(x, -30, word.toLowerCase(), {
            font: 'bold 20px "Courier New", Courier, monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(12);

        // 已输入进度文本
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

        // 计算飞行方向
        const targetX = this.player.x;
        const targetY = this.player.y;
        const angle = Math.atan2(targetY - (-30), targetX - x);
        const speed = this.levelConfig.speed * config.speedMul;
        const slowFactor = this.freezeActive ? 0 : (this.slowActive ? this.slowSpeedFactor : 1.0); // Beta: 冰冻/减速道具影响
        const vx = Math.cos(angle) * speed * slowFactor;
        const vy = Math.sin(angle) * speed * slowFactor;

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
            typedIndex: 0,
            enemyType: enemyType,       // Beta: 敌机类型
            armorHits: enemyType === 'armored' ? 2 : 1,  // Beta: 装甲敌机需2次命中
            zigzagPhase: Math.random() * Math.PI * 2,     // Beta: 曲线敌机初始相位
            zigzagAmplitude: 80,         // Beta: 曲线幅度
            zigzagFrequency: 2,          // Beta: 曲线频率
            baseX: x                     // Beta: 基准X坐标（曲线敌机用）
        };

        this.enemies.push(enemyData);

        // Beta: 减速期间新生成的敌机记录原始速度
        if (this.slowActive && !this.freezeActive) {
            enemyData._originalVx = Math.cos(angle) * speed;
            enemyData._originalVy = Math.sin(angle) * speed;
            if (enemyData.sprite) enemyData.sprite.setTint(0x44ddcc);
        }

        // Beta: 冰冻期间新生成的敌机也要冻住
        if (this.freezeActive) {
            enemyData._frozenVx = Math.cos(angle) * speed;
            enemyData._frozenVy = Math.sin(angle) * speed;
            if (this.slowActive) {
                enemyData._originalVx = enemyData._frozenVx;
                enemyData._originalVy = enemyData._frozenVy;
            }
            if (enemyData.sprite) enemyData.sprite.setTint(0x66ccff);
        }
    }

    updateEnemies(delta) {
        const dt = delta / 1000;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e.alive) continue;

            // 曲线敌机特殊移动
            if (e.enemyType === 'zigzag') {
                if (!this.freezeActive) {
                    e.zigzagPhase += e.zigzagFrequency * dt;
                }
                e.y += e.vy * dt;
                e.x = e.baseX + Math.sin(e.zigzagPhase) * e.zigzagAmplitude;
                // 边界限制
                e.x = Phaser.Math.Clamp(e.x, 30, this.gameWidth - 30);
            } else {
                e.x += e.vx * dt;
                e.y += e.vy * dt;
            }

            e.sprite.setPosition(e.x, e.y);
            e.wordText.setPosition(e.x, e.y);
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

            // 检查是否到达底部
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
        // Beta: Boss 战输入优先
        if (this.bossActive && !this.lockedEnemy) {
            // 优先尝试收集道具（回血/护盾等）
            if (this.tryCollectPowerup(key)) return;
            // 再尝试抵消Boss子弹
            if (this.tryDestroyBossBullet(key)) return;
            // 最后处理Boss单词输入
            if (this.handleBossInput(key)) return;
            return; // Boss战中不处理其他逻辑
        }

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
                // Beta: 尝试收集道具
                if (!this.tryCollectPowerup(key)) {
                    this.onMissInput();
                }
            }
        }
    }

    /**
     * 未命中（没有匹配的敌机）
     */
    onMissInput() {
        this.showComboBreak();
        this.combo = 0;
        this.updateComboText();
        SoundManager.playError();
    }

    /**
     * 输入错误（锁定模式下输错字母）
     */
    onWrongInput() {
        this.showComboBreak();
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
        // Beta: 根据连击等级选择子弹纹理
        let bulletTex = 'bullet';
        let bulletScale = 0.5;
        if (this.combo >= 20) { bulletTex = 'bullet_lightning'; bulletScale = 0.55; }
        else if (this.combo >= 10) { bulletTex = 'bullet_fire'; bulletScale = 0.52; }
        else if (this.combo >= 5) { bulletTex = 'bullet_orange'; bulletScale = 0.5; }

        const bullet = this.add.image(this.player.x, this.player.y - 20, bulletTex).setScale(bulletScale);
        bullet.setDepth(8);

        const bulletData = {
            sprite: bullet,
            targetEnemy: targetEnemy,
            x: this.player.x,
            y: this.player.y - 20,
            speed: 600
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

        // Beta: 装甲敌机需多次命中
        if (enemy.armorHits > 1) {
            enemy.armorHits--;
            // 播放护甲破碎效果
            this.createArmorBreakEffect(enemy.x, enemy.y);
            // 切换为受损纹理
            enemy.sprite.setTexture('enemy_armored_damaged');
            // 重置单词（生成新单词供第二次输入）
            const newWord = WordsData.getRandomWord(this.levelConfig.wordType);
            enemy.word = newWord;
            enemy.wordText.setText(newWord.toLowerCase());
            enemy.typedText.setText('');
            enemy.typedText.setVisible(false);
            enemy.typedIndex = 0;
            enemy.locked = false;
            enemy.lockFrame.setVisible(false);
            // 解除锁定
            if (this.lockedEnemy === enemy) {
                this.lockedEnemy = null;
                this.lockedLetterIndex = 0;
            }
            SoundManager.playExplosion();
            return;
        }

        // 移除敌机（带爆炸效果）
        const enemyIdx = this.enemies.indexOf(enemy);
        if (enemyIdx >= 0) {
            this.removeEnemy(enemy, enemyIdx, true);
        }

        // 更新得分和连击
        this.kills++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // 计算得分（基础分 + 连击加成 + 类型加成）
        let baseScore = enemy.word.length * 10;
        if (enemy.enemyType === 'fast') baseScore += 5;
        if (enemy.enemyType === 'armored') baseScore += 15;
        if (enemy.enemyType === 'zigzag') baseScore += 10;
        // Beta: 连击分数倍率
        let comboMultiplier = 1.0;
        if (this.combo >= 20) comboMultiplier = 3.0;
        else if (this.combo >= 10) comboMultiplier = 2.0;
        else if (this.combo >= 5) comboMultiplier = 1.5;
        const finalScore = Math.floor(baseScore * comboMultiplier * (this.doubleScoreActive ? 2 : 1));
        this.score += finalScore;

        this.updateScoreText();
        this.updateComboText();
        this.updateProgressText();

        // 连击特效
        if (this.combo === 5 || this.combo === 10 || this.combo === 20) {
            this.showComboEffect(this.combo);
            SoundManager.playCombo();
        }

        // 显示得分飘字
        this.showFloatingScore(enemy.x, enemy.y, finalScore);

        // Beta: 道具掉落（根据关卡配置的概率）
        const dropRate = this.levelConfig.powerupRate || 0.20;
        if (Math.random() < dropRate) {
            this.spawnPowerup(enemy.x, enemy.y);
        }

        // 检查通关（无尽模式不通关）
        if (!this.isCustomMode && this.kills >= this.levelConfig.targetKills) {
            this.onLevelComplete();
        }
    }

    /**
     * 装甲破碎特效
     */
    createArmorBreakEffect(x, y) {
        const colors = [0x888899, 0xaaaabb, 0xccccdd, 0x6688aa];
        for (let i = 0; i < 8; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            const particle = this.add.rectangle(x, y,
                Phaser.Math.Between(4, 8), Phaser.Math.Between(4, 8),
                color, 0.9);
            particle.setDepth(15);
            const angle = (Math.PI * 2 / 8) * i;
            const speed = Phaser.Math.Between(60, 140);
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                rotation: Phaser.Math.FloatBetween(-2, 2),
                duration: Phaser.Math.Between(300, 500),
                onComplete: () => particle.destroy()
            });
        }
    }

    // ============================================
    // Beta: Boss 战斗系统
    // ============================================

    /**
     * 开始 Boss 战
     */
    startBossFight() {
        if (this.isGameOver) return;
        // Beta: 切换Boss战BGM
        SoundManager.startBGM('boss');

        const bossKey = this.levelConfig.boss || 'boss1a';
        const cfg = LevelsData.BOSS_TABLE[bossKey];
        if (!cfg) {
            console.error('Boss配置未找到:', bossKey);
            return;
        }
        this.bossMaxHP = cfg.hp;
        this.bossHP = cfg.hp;
        this.bossHitsNeeded = cfg.hp;
        this.bossHitsLanded = 0;
        this.bossBullets = [];
        this.bossBulletTimer = 0;
        this.bossMovementPhase = 0;

        // \u6e05\u9664\u6240\u6709\u666e\u901a\u654c\u673a
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.removeEnemy(this.enemies[i], i, false);
        }
        // \u505c\u6b62\u666e\u901a\u654c\u673a\u751f\u6210
        if (this.spawnTimer) this.spawnTimer.destroy();

        // Boss \u51fa\u573a\u52a8\u753b
        const bossSprite = this.add.image(this.gameWidth / 2, -100, cfg.texture).setScale(cfg.scale).setDepth(10);

        // Boss \u540d\u79f0\u663e\u793a
        const bossNameText = this.add.text(this.gameWidth / 2, 20, `\u2620\ufe0f ${cfg.name}`, {
            font: 'bold 22px Arial', fill: '#ff4444', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(55).setAlpha(0);

        // Boss \u8840\u91cf\u6761\u80cc\u666f\uff08\u5e26\u523b\u5ea6\u7ebf\uff09
        const hpBarBg = this.add.graphics().setDepth(54);
        hpBarBg.fillStyle(0x333333, 0.8);
        hpBarBg.fillRoundedRect(this.gameWidth / 2 - 120, 45, 240, 16, 4);
        hpBarBg.lineStyle(1, 0x666666, 0.6);
        for (let qi = 1; qi < 4; qi++) {
            const sx = this.gameWidth / 2 - 118 + 236 * (qi / 4);
            hpBarBg.lineBetween(sx, 47, sx, 59);
        }

        // Boss \u8840\u91cf\u6761
        const hpBar = this.add.graphics().setDepth(55);

        // Boss HP \u6570\u503c\u6587\u5b57
        const hpText = this.add.text(this.gameWidth / 2, 53, `${cfg.hp}/${cfg.hp}`, {
            font: 'bold 10px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(56).setAlpha(0);

        // Boss \u5355\u8bcd\u6587\u672c
        const bossWordText = this.add.text(this.gameWidth / 2, 0, '', {
            font: 'bold 24px "Courier New", Courier, monospace',
            fill: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(12).setAlpha(0);

        // Boss \u5df2\u8f93\u5165\u6587\u672c
        const bossTypedText = this.add.text(0, 0, '', {
            font: 'bold 24px "Courier New", Courier, monospace',
            fill: '#00ff88', stroke: '#003311', strokeThickness: 5
        }).setOrigin(0, 0.5).setDepth(13).setVisible(false);

        this.boss = {
            sprite: bossSprite,
            nameText: bossNameText,
            hpBarBg: hpBarBg,
            hpBar: hpBar,
            hpText: hpText,
            wordText: bossWordText,
            typedText: bossTypedText,
            config: cfg,
            targetY: 100,
            x: this.gameWidth / 2,
            y: -100
        };

        // \u51fa\u573a\u52a8\u753b\uff1a\u7f13\u7f13\u964d\u4e0b
        this.tweens.add({
            targets: bossSprite,
            y: 100,
            duration: 2000,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                this.boss.y = bossSprite.y;
                bossWordText.setPosition(this.boss.x, bossSprite.y + bossSprite.displayHeight / 2 + 20);
            },
            onComplete: () => {
                this.bossActive = true;
                bossNameText.setAlpha(1);
                hpText.setAlpha(1);
                this.updateBossHPBar();
                this.generateBossWord();

                // \u663e\u793a "BOSS\u6218" \u63d0\u793a
                const bossAlert = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 40, '\u2694\ufe0f BOSS \u6218 \u2694\ufe0f', {
                    font: 'bold 32px Arial', fill: '#ff4444',
                    stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(100).setAlpha(0);
                this.tweens.add({
                    targets: bossAlert, alpha: 1, duration: 300, yoyo: true,
                    hold: 800, onComplete: () => bossAlert.destroy()
                });
            }
        });

        // Boss \u540d\u5b57\u6de1\u5165
        this.tweens.add({ targets: bossNameText, alpha: 1, duration: 1000, delay: 500 });
    }

    /**
     * \u751f\u6210 Boss \u5355\u8bcd
     */
    generateBossWord() {
        if (!this.boss) return;
        const word = WordsData.getRandomWord(this.boss.config.wordType);
        this.bossWord = word;
        this.bossTypedIndex = 0;
        this.boss.wordText.setText(word.toLowerCase()).setAlpha(1);
        this.boss.typedText.setText('').setVisible(false);
    }

    /**
     * \u66f4\u65b0 Boss \u8840\u91cf\u6761
     */
    updateBossHPBar() {
        if (!this.boss) return;
        const hpBar = this.boss.hpBar;
        hpBar.clear();
        const ratio = this.bossHP / this.bossMaxHP;
        const color = ratio > 0.5 ? 0xff4444 : ratio > 0.25 ? 0xff8800 : 0xff0000;
        hpBar.fillStyle(color, 1);
        hpBar.fillRoundedRect(this.gameWidth / 2 - 118, 47, 236 * ratio, 12, 3);
        // \u66f4\u65b0HP\u6570\u503c\u6587\u5b57
        if (this.boss.hpText) {
            this.boss.hpText.setText(`${this.bossHP}/${this.bossMaxHP}`);
        }
    }

    /**
     * Boss \u53d1\u5c04\u5b50\u5f39\uff08\u5e26\u5b57\u6bcd\uff0c\u73a9\u5bb6\u9700\u8f93\u5165\u62b5\u6d88\uff09
     */
    fireBossBullet() {
        if (this.isPaused || this.isGameOver || !this.bossActive || !this.boss) return;
        const cfg = this.boss.config;
        const count = this.bossFinalForm ? cfg.bulletCount + 1 : (this.bossEnraged ? cfg.bulletCount : Math.max(1, cfg.bulletCount - 1));
        const bSpeed = this.bossFinalForm ? cfg.bulletSpeed * 1.3 : (this.bossEnraged ? cfg.bulletSpeed * 1.15 : cfg.bulletSpeed);

        for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 300, () => {
                if (!this.bossActive || !this.boss) return;
                // \u968f\u673a\u751f\u6210\u4e00\u4e2a\u5b57\u6bcd
                const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)).toLowerCase();
                // \u5b50\u5f39\u4f4d\u7f6e\uff1aBoss\u5e95\u90e8\u968f\u673a\u504f\u79fb
                const bx = this.boss.x + Phaser.Math.Between(-40, 40);
                const by = this.boss.y + (this.boss.sprite.displayHeight / 2);
                // \u7784\u51c6\u73a9\u5bb6\u65b9\u5411 + \u968f\u673a\u504f\u79fb
                const px = this.player ? this.player.x : this.gameWidth / 2;
                const py = this.player ? this.player.y : this.gameHeight - 60;
                const angle = Math.atan2(py - by, px - bx) + Phaser.Math.FloatBetween(-0.2, 0.2);
                const vx = Math.cos(angle) * bSpeed;
                const vy = Math.sin(angle) * bSpeed;

                // \u521b\u5efa\u5b50\u5f39\u7cbe\u7075
                const bulletSprite = this.add.circle(bx, by, 10, 0xff3333, 0.9).setDepth(20);
                // \u5b57\u6bcd\u6587\u672c
                const bulletText = this.add.text(bx, by, letter, {
                    font: 'bold 14px Arial', fill: '#ffffff', stroke: '#660000', strokeThickness: 2
                }).setOrigin(0.5).setDepth(21);

                this.bossBullets.push({
                    x: bx, y: by, vx: vx, vy: vy,
                    letter: letter, sprite: bulletSprite, text: bulletText, alive: true
                });

                // \u53d1\u5c04\u58f0\u97f3
                SoundManager.playShoot();
            });
        }
    }

    /**
     * \u66f4\u65b0 Boss \u5b50\u5f39
     */
    updateBossBullets(delta) {
        const dt = delta / 1000;
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const b = this.bossBullets[i];
            if (!b.alive) continue;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.sprite.setPosition(b.x, b.y);
            b.text.setPosition(b.x, b.y);

            // \u78b0\u5230\u73a9\u5bb6\u533a\u57df\uff08\u5e95\u90e8\uff09
            if (this.player && Math.abs(b.x - this.player.x) < 40 && Math.abs(b.y - this.player.y) < 40) {
                b.alive = false;
                b.sprite.destroy();
                b.text.destroy();
                this.bossBullets.splice(i, 1);
                this.loseLife();
                continue;
            }

            // \u8d85\u51fa\u5c4f\u5e55
            if (b.y > this.gameHeight + 20 || b.y < -20 || b.x < -20 || b.x > this.gameWidth + 20) {
                b.alive = false;
                b.sprite.destroy();
                b.text.destroy();
                this.bossBullets.splice(i, 1);
            }
        }
    }

    /**
     * \u73a9\u5bb6\u8f93\u5165\u5b57\u6bcd\u62b5\u6d88 Boss \u5b50\u5f39
     */
    tryDestroyBossBullet(key) {
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const b = this.bossBullets[i];
            if (b.alive && b.letter === key) {
                b.alive = false;
                // \u5c0f\u7206\u70b8\u6548\u679c
                this.tweens.add({
                    targets: [b.sprite, b.text],
                    alpha: 0, scaleX: 2, scaleY: 2, duration: 200,
                    onComplete: () => { b.sprite.destroy(); b.text.destroy(); }
                });
                this.bossBullets.splice(i, 1);
                this.score += 5;
                this.updateScoreText();
                return true;
            }
        }
        return false;
    }

    /**
     * \u66f4\u65b0 Boss (\u6bcf\u5e27) - \u5de6\u53f3\u79fb\u52a8 + \u5b50\u5f39\u53d1\u5c04
     */
    updateBoss(delta) {
        if (!this.boss) return;
        const dt = delta / 1000;
        const b = this.boss;
        const cfg = b.config;

        // Boss \u5de6\u53f3\u7f13\u6162\u79fb\u52a8
        this.bossMovementPhase += dt * (this.bossEnraged ? 1.5 : 0.8);
        const moveRange = this.bossEnraged ? 120 : 80;
        b.x = this.gameWidth / 2 + Math.sin(this.bossMovementPhase) * moveRange;
        b.sprite.setPosition(b.x, b.sprite.y);
        b.wordText.setPosition(b.x, b.sprite.y + b.sprite.displayHeight / 2 + 20);
        b.typedText.setPosition(b.x - b.wordText.width / 2, b.wordText.y);

        // Boss \u5b50\u5f39\u53d1\u5c04\u8ba1\u65f6
        const interval = this.bossFinalForm ? cfg.bulletInterval * 0.6 : (this.bossEnraged ? cfg.bulletInterval * 0.75 : cfg.bulletInterval);
        this.bossBulletTimer += delta;
        if (this.bossBulletTimer >= interval) {
            this.bossBulletTimer = 0;
            this.fireBossBullet();
        }
    }

    /**
     * Boss \u53d7\u5230\u4f24\u5bb3
     */
    onBossHit() {
        this.bossHP--;
        this.bossHitsLanded++;
        this.updateBossHPBar();

        // \u53d7\u51fb\u89c6\u89c9\u53cd\u9988
        this.tweens.add({
            targets: this.boss.sprite,
            alpha: 0.3, duration: 80, yoyo: true, repeat: 2
        });
        this.createExplosion(this.boss.x + Phaser.Math.Between(-40, 40), this.boss.y + Phaser.Math.Between(-20, 20));

        // Boss\u53d7\u4f24\u65f6\u6982\u7387\u6389\u843d\u9053\u5177\uff08\u56de\u8840/\u62a4\u76fe\uff09
        const dropChance = this.boss.config.powerupChance || 0.25;
        if (Math.random() < dropChance) {
            this.spawnBossPowerup(this.boss.x + Phaser.Math.Between(-60, 60), this.boss.y + 40);
        }

        // \u72c2\u66b4\u9636\u6bb5\u68c0\u67e5 (50%)
        if (!this.bossEnraged && this.bossHP <= this.bossMaxHP * 0.5) {
            this.bossEnraged = true;
            this.boss.nameText.setText(`\u2620\ufe0f ${this.boss.config.name} \u203c\ufe0f\u72c2\u66b4`);
            this.boss.nameText.setColor('#ff0000');
            this.cameras.main.shake(500, 0.01);
            // \u72c2\u66b4\u63d0\u793a
            const rageText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, '\u203c\ufe0f Boss \u72c2\u66b4\u4e86\uff01', {
                font: 'bold 26px Arial', fill: '#ff4400',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(100).setAlpha(0);
            this.tweens.add({
                targets: rageText, alpha: 1, duration: 200, yoyo: true,
                hold: 600, onComplete: () => rageText.destroy()
            });
        }

        // \u6700\u7ec8\u5f62\u6001\u68c0\u67e5 (25%)
        if (!this.bossFinalForm && this.bossHP <= this.bossMaxHP * 0.25) {
            this.bossFinalForm = true;
            this.boss.nameText.setText(`\u2620\ufe0f ${this.boss.config.name} \u2620\ufe0f\u7edd\u5883`);
            this.boss.nameText.setColor('#ff00ff');
            this.boss.sprite.setTint(0xff4444);
            this.cameras.main.shake(800, 0.02);
            // \u7edd\u5883\u63d0\u793a
            const finalText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, '\u2620\ufe0f \u7edd\u5883\u6a21\u5f0f\uff01', {
                font: 'bold 28px Arial', fill: '#ff00ff',
                stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(100).setAlpha(0);
            this.tweens.add({
                targets: finalText, alpha: 1, duration: 200, yoyo: true,
                hold: 800, onComplete: () => finalText.destroy()
            });
        }

        if (this.bossHP <= 0) {
            this.onBossDefeated();
        } else {
            // \u751f\u6210\u65b0\u5355\u8bcd
            this.generateBossWord();
        }

        SoundManager.playExplosion();
    }

    /**
     * Boss\u6218\u4e13\u7528\u9053\u5177\u6389\u843d\uff08\u53ea\u6389\u56de\u8840\u548c\u62a4\u76fe\uff09
     */
    spawnBossPowerup(x, y) {
        const types = ['heal', 'heal', 'shield', 'shield', 'heal'];
        const type = Phaser.Utils.Array.GetRandom(types);
        const textureMap = {
            shield: 'powerup_shield', heal: 'powerup_heal'
        };
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)).toLowerCase();
        const sprite = this.add.image(x, y, textureMap[type]).setScale(0.35).setDepth(15);
        const letterText = this.add.text(x, y + 30, letter, {
            font: 'bold 16px Arial', fill: '#ffff00',
            stroke: '#333', strokeThickness: 3
        }).setOrigin(0.5).setDepth(16);

        this.powerups.push({
            x: x, y: y, collectLetter: letter, type: type,
            sprite: sprite, letterText: letterText,
            speed: 35, alive: true
        });
    }

    /**
     * Boss \u88ab\u51fb\u8d25
     */
    onBossDefeated() {
        this.bossActive = false;
        // \u6e05\u9664\u6240\u6709Boss\u5b50\u5f39
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const b = this.bossBullets[i];
            if (b.sprite) b.sprite.destroy();
            if (b.text) b.text.destroy();
        }
        this.bossBullets = [];

        // \u5927\u578b\u7206\u70b8\u52a8\u753b
        const cx = this.boss.x, cy = this.boss.y;
        for (let wave = 0; wave < 3; wave++) {
            this.time.delayedCall(wave * 500, () => {
                this.createExplosion(cx + Phaser.Math.Between(-60, 60), cy + Phaser.Math.Between(-40, 40));
                this.cameras.main.shake(300, 0.02);
            });
        }

        // Boss \u7cbe\u7075\u6de1\u51fa
        this.tweens.add({
            targets: [this.boss.sprite, this.boss.nameText, this.boss.wordText, this.boss.typedText],
            alpha: 0, duration: 1500, delay: 1000
        });
        this.tweens.add({
            targets: [this.boss.hpBarBg, this.boss.hpBar],
            alpha: 0, duration: 800
        });

        // \u6e05\u9664\u6240\u6709\u5c0f\u654c\u673a
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.removeEnemy(this.enemies[i], i, true);
        }

        // \u80dc\u5229\u63d0\u793a + \u989d\u5916\u5956\u52b1
        this.time.delayedCall(800, () => {
            const bonusScore = this.bossMaxHP * 50;
            this.score += bonusScore;
            this.updateScoreText();
            const victoryText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 40, '\ud83c\udfc6 BOSS \u51fb\u8d25\uff01', {
                font: 'bold 36px Arial', fill: '#ffcc00',
                stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(100).setAlpha(0);
            const bonusText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 10, `+${bonusScore} \u5956\u52b1\u5206\uff01`, {
                font: 'bold 20px Arial', fill: '#88ff88',
                stroke: '#003300', strokeThickness: 3
            }).setOrigin(0.5).setDepth(100).setAlpha(0);
            this.tweens.add({ targets: victoryText, alpha: 1, y: this.gameHeight / 2 - 60, duration: 600 });
            this.tweens.add({ targets: bonusText, alpha: 1, duration: 600, delay: 300 });
        });

        // 3\u79d2\u540e\u901a\u5173
        this.time.delayedCall(3000, () => {
            this.onLevelComplete();
        });
    }

    /**
     * \u5904\u7406 Boss \u6218\u4e2d\u7684\u952e\u76d8\u8f93\u5165
     */
    handleBossInput(key) {
        if (!this.bossActive || !this.bossWord) return false;

        const expectedChar = this.bossWord[this.bossTypedIndex];
        if (key === expectedChar) {
            this.correctShots++;
            this.bossTypedIndex++;
            // \u66f4\u65b0\u5df2\u8f93\u5165\u6587\u672c
            const typed = this.bossWord.substring(0, this.bossTypedIndex);
            this.boss.typedText.setText(typed).setVisible(true);

            if (this.keyboardDisplay) this.flashKey(key);

            if (this.bossTypedIndex >= this.bossWord.length) {
                // \u5b8c\u6210\u5355\u8bcd\uff0c\u5bf9 Boss \u9020\u6210\u4f24\u5bb3
                this.combo++;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                this.score += this.bossWord.length * 15;
                this.updateScoreText();
                this.updateComboText();
                this.showFloatingScore(this.boss.x, this.boss.y, this.bossWord.length * 15);
                this.onBossHit();
            }
            return true;
        }
        return false;
    }

    // ============================================
    // \u7206\u70b8\u6548\u679c
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
        // Beta: 三级连击特效
        let msg, fill, stroke;
        if (combo >= 20) {
            msg = '\ud83d\udca5 \u65e0\u654c\u8fde\u51fb!'; fill = '#ff44ff'; stroke = '#aa00aa';
        } else if (combo >= 10) {
            msg = '\u26a1 \u8d85\u7ea7\u8fde\u51fb!'; fill = '#ffaa00'; stroke = '#884400';
        } else {
            msg = '\ud83d\udd25 \u8fde\u51fb!'; fill = '#ffcc00'; stroke = '#ff6600';
        }

        const text = this.add.text(this.gameWidth / 2, this.gameHeight / 2, `${combo} ${msg}`, {
            font: 'bold 38px Arial', fill: fill, stroke: stroke, strokeThickness: 4
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
                    targets: text, alpha: 0, y: '-=30', duration: 400,
                    onComplete: () => text.destroy()
                });
            }
        });

        // 屏幕边缘发光
        const glow = this.add.graphics().setDepth(99);
        const glowColor = combo >= 20 ? 0xff00ff : combo >= 10 ? 0xff9900 : 0xffcc00;
        const thickness = combo >= 20 ? 10 : combo >= 10 ? 8 : 6;
        glow.lineStyle(thickness, glowColor, 0.5);
        glow.strokeRect(3, 3, this.gameWidth - 6, this.gameHeight - 6);
        this.tweens.add({ targets: glow, alpha: 0, duration: 800, onComplete: () => glow.destroy() });
    }

    /**
     * Beta: 连击中断效果
     */
    showComboBreak() {
        if (this.combo >= 5) {
            const text = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 40, `${this.combo} \u8fde\u51fb\u7ec8\u6b62`, {
                font: 'bold 24px Arial', fill: '#ff6666', stroke: '#440000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(110).setAlpha(1);
            this.tweens.add({
                targets: text, alpha: 0, scaleX: 1.5, scaleY: 1.5, y: '-=40',
                duration: 800, onComplete: () => text.destroy()
            });
        }
    }

    // ============================================
    // 生命值系统
    // ============================================
    loseLife() {
        // Beta: 护盾抵挡
        if (this.shieldActive) {
            this.shieldActive = false;
            this.shieldTimer = 0;
            if (this.shieldVisual) { this.shieldVisual.destroy(); this.shieldVisual = null; }
            if (this.shieldTimerText) { this.shieldTimerText.destroy(); this.shieldTimerText = null; }
            // 护盾破碎效果
            const shieldBreak = this.add.circle(this.player.x, this.player.y, 30, 0x2299ff, 0.5).setDepth(90);
            this.tweens.add({ targets: shieldBreak, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, onComplete: () => shieldBreak.destroy() });
            SoundManager.playExplosion();
            return;
        }

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
        SoundManager.playVictoryBGM();

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
        SoundManager.playDefeatBGM();

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
