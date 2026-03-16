/**
 * Beta: 存档管理场景
 * 支持3个存档位、昵称编辑、导入/导出
 */
class SaveScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SaveScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        const theme = ThemesData.getCurrentTheme();
        this.cameras.main.setBackgroundColor(theme.bgColor);

        // 星空背景
        for (let i = 0; i < 40; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.FloatBetween(0.5, 1.5),
                theme.particleColor,
                Phaser.Math.FloatBetween(0.2, 0.5)
            );
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 0.6 },
                duration: Phaser.Math.Between(1500, 3000),
                yoyo: true, repeat: -1
            });
        }

        // 标题
        this.add.text(width / 2, 40, '💾 存档管理', {
            font: 'bold 28px Arial', fill: '#00ccff',
            stroke: '#003366', strokeThickness: 3
        }).setOrigin(0.5);

        // 存档列表
        this.slots = ProgressData.getAllSlots();
        this.activeSlot = ProgressData.getActiveSlot();
        this.slotCards = [];

        for (let i = 0; i < 3; i++) {
            this.createSlotCard(width / 2, 100 + i * 120, i);
        }

        // 底部按钮
        const btnY = 470;

        // 导出按钮
        this.createSmallButton(width / 2 - 90, btnY, '📤 导出存档', '#44bb88', () => {
            const json = ProgressData.exportSave();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `keyboard-fighter-save-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('存档已导出！');
        });

        // 导入按钮
        this.createSmallButton(width / 2 + 90, btnY, '📥 导入存档', '#4488bb', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (ProgressData.importSave(ev.target.result)) {
                        this.showToast('存档导入成功！');
                        this.scene.restart();
                    } else {
                        this.showToast('存档格式错误！');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        // 返回按钮
        this.createSmallButton(width / 2, btnY + 45, '🔙 返回主菜单', '#8888aa', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * 创建存档卡片
     */
    createSlotCard(x, y, index) {
        const slot = this.slots[index];
        const isActive = this.activeSlot === index;
        const cardW = 340, cardH = 100;
        const cx = x - cardW / 2, cy = y - cardH / 2;

        const card = this.add.graphics();
        const borderColor = isActive ? 0x00ccff : 0x445566;
        const fillAlpha = isActive ? 0.2 : 0.1;
        card.fillStyle(borderColor, fillAlpha);
        card.fillRoundedRect(cx, cy, cardW, cardH, 10);
        card.lineStyle(2, borderColor, isActive ? 0.8 : 0.4);
        card.strokeRoundedRect(cx, cy, cardW, cardH, 10);

        // 存档号
        this.add.text(cx + 12, cy + 8, `存档 ${index + 1}`, {
            font: 'bold 14px Arial', fill: isActive ? '#00ccff' : '#667788'
        });

        // 活跃标记
        if (isActive) {
            this.add.text(cx + cardW - 12, cy + 8, '✔ 当前', {
                font: 'bold 12px Arial', fill: '#44ff88'
            }).setOrigin(1, 0);
        }

        if (slot.progress) {
            // 有数据的存档
            const stats = this._calcSlotStats(slot.progress);
            this.add.text(cx + 12, cy + 30, `👤 ${slot.nickname}`, {
                font: '15px Arial', fill: '#ccddee'
            });
            this.add.text(cx + 12, cy + 52, `通关: ${stats.completed}/${stats.total}  |  完成率: ${stats.rate}%`, {
                font: '12px Arial', fill: '#8899aa'
            });
            if (slot.lastSave) {
                const d = new Date(slot.lastSave);
                this.add.text(cx + 12, cy + 72, `最后保存: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`, {
                    font: '11px Arial', fill: '#667788'
                });
            }

            // 加载按钮
            if (!isActive) {
                this._createMiniBtn(cx + cardW - 125, cy + 68, '加载', '#44aaff', () => {
                    ProgressData.loadFromSlot(index);
                    this.scene.restart();
                });
            }

            // 删除按钮
            this._createMiniBtn(cx + cardW - 60, cy + 68, '删除', '#ff6655', () => {
                ProgressData.deleteSlot(index);
                this.scene.restart();
            });
        } else {
            // 空存档
            this.add.text(x, cy + 42, '- 空存档 -', {
                font: '14px Arial', fill: '#556677'
            }).setOrigin(0.5);

            // 新建按钮
            this._createMiniBtn(cx + cardW / 2 - 25, cy + 68, '新建', '#44cc66', () => {
                const slots = ProgressData.getAllSlots();
                slots[index] = {
                    nickname: `玩家${index + 1}`,
                    created: new Date().toISOString(),
                    progress: ProgressData.getDefaultProgress()
                };
                ProgressData.saveAllSlots(slots);
                ProgressData.setActiveSlot(index);
                ProgressData.saveProgress(slots[index].progress);
                this.scene.restart();
            });
        }

        // 点击卡片区域切换存档
        const zone = this.add.zone(x, y, cardW, cardH).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => {
            if (slot.progress && !isActive) {
                ProgressData.loadFromSlot(index);
                this.scene.restart();
            }
        });

        this.slotCards.push(card);
    }

    _calcSlotStats(progress) {
        let completed = 0, total = 0;
        Object.values(progress).forEach(p => {
            total++;
            if (p.completed) completed++;
        });
        return { completed, total, rate: total > 0 ? Math.round(completed / total * 100) : 0 };
    }

    _createMiniBtn(x, y, text, color, callback) {
        const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
        const bg = this.add.graphics();
        bg.fillStyle(colorNum, 0.2);
        bg.fillRoundedRect(x, y, 50, 22, 5);
        bg.lineStyle(1, colorNum, 0.5);
        bg.strokeRoundedRect(x, y, 50, 22, 5);
        const t = this.add.text(x + 25, y + 11, text, {
            font: '11px Arial', fill: color
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        t.on('pointerover', () => t.setScale(1.1));
        t.on('pointerout', () => t.setScale(1));
        t.on('pointerup', callback);
    }

    createSmallButton(x, y, text, color, callback) {
        const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
        const w = 150, h = 36;
        const bg = this.add.graphics();
        bg.fillStyle(colorNum, 0.15);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        bg.lineStyle(1.5, colorNum, 0.5);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

        const t = this.add.text(x, y, text, {
            font: '14px Arial', fill: color
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => { t.setScale(1.05); });
        zone.on('pointerout', () => { t.setScale(1); });
        zone.on('pointerup', callback);
    }

    showToast(msg) {
        const { width, height } = this.cameras.main;
        const toast = this.add.text(width / 2, height / 2, msg, {
            font: 'bold 18px Arial', fill: '#ffffff',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({
            targets: toast, alpha: 0, y: '-=40',
            duration: 1500, delay: 800,
            onComplete: () => toast.destroy()
        });
    }
}
