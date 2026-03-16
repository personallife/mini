/**
 * 单词库管理场景
 * - 查看/切换内置词库
 * - 打字输入添加自定义单词（输入过程即练习）
 * - 删除单词
 * - 导入/导出
 */
class WordLibScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WordLibScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        this.w = width;
        this.h = height;

        // 星空背景
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 1.5), 0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
        }

        // 标题
        this.add.text(width / 2, 30, '📚 单词库管理', {
            font: 'bold 26px Arial',
            fill: '#00ccff',
            stroke: '#003366',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 当前词库类型
        this.currentLib = WordsData.getCurrentLibrary();

        // 顶部：词库切换选项卡
        this.createLibTabs(width, 62);

        // 中部：单词列表区域
        this.wordListY = 95;
        this.wordListH = height - 250;
        this.createWordListArea(width, this.wordListY, this.wordListH);

        // 底部：操作区（打字输入 + 按钮）
        this.createInputArea(width, height);

        // 返回按钮
        const backText = this.add.text(width / 2, height - 15, '← 返回主菜单', {
            font: 'bold 13px Arial',
            fill: '#6699cc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backText.on('pointerover', () => backText.setColor('#00ccff'));
        backText.on('pointerout', () => backText.setColor('#6699cc'));
        backText.on('pointerup', () => this.scene.start('MenuScene'));

        // 键盘输入监听
        this.input.keyboard.on('keydown', this.handleKeyDown, this);

        // 初始加载词库
        this.refreshWordList();
    }

    // ============================================
    // 词库选项卡
    // ============================================
    createLibTabs(width, y) {
        const tabs = [
            { key: 'children', label: '🐣 儿童词库' },
            { key: 'school', label: '🏫 课本词汇' },
            { key: 'custom', label: '✏️ 自定义' }
        ];

        const tabWidth = 120;
        const gap = 8;
        const totalW = tabs.length * tabWidth + (tabs.length - 1) * gap;
        const startX = (width - totalW) / 2;

        this.tabButtons = [];

        tabs.forEach((tab, i) => {
            const tx = startX + i * (tabWidth + gap);
            const isActive = this.currentLib === tab.key;

            const bg = this.add.graphics();
            this.drawTabBg(bg, tx, y - 13, tabWidth, 26, isActive);

            const text = this.add.text(tx + tabWidth / 2, y, tab.label, {
                font: 'bold 12px Arial',
                fill: isActive ? '#ffffff' : '#7788aa'
            }).setOrigin(0.5);

            const zone = this.add.zone(tx + tabWidth / 2, y, tabWidth, 26).setInteractive({ useHandCursor: true });

            this.tabButtons.push({ bg, text, tab });

            zone.on('pointerup', () => {
                this.currentLib = tab.key;
                WordsData.setCurrentLibrary(tab.key);
                // 更新选项卡样式
                this.tabButtons.forEach(b => {
                    const active = b.tab.key === this.currentLib;
                    b.bg.clear();
                    this.drawTabBg(b.bg, startX + tabs.indexOf(b.tab) * (tabWidth + gap), y - 13, tabWidth, 26, active);
                    b.text.setColor(active ? '#ffffff' : '#7788aa');
                });
                this.refreshWordList();
            });
        });
    }

    drawTabBg(g, x, y, w, h, active) {
        if (active) {
            g.fillStyle(0x00aaff, 0.35);
            g.lineStyle(2, 0x00aaff, 0.8);
        } else {
            g.fillStyle(0x223344, 0.3);
            g.lineStyle(1, 0x445566, 0.4);
        }
        g.fillRoundedRect(x, y, w, h, 6);
        g.strokeRoundedRect(x, y, w, h, 6);
    }

    // ============================================
    // 单词列表区域
    // ============================================
    createWordListArea(width, y, h) {
        // 列表背景
        this.listBg = this.add.graphics();
        this.listBg.fillStyle(0x112233, 0.5);
        this.listBg.lineStyle(1, 0x334466, 0.4);
        this.listBg.fillRoundedRect(15, y, width - 30, h, 8);
        this.listBg.strokeRoundedRect(15, y, width - 30, h, 8);

        // 统计信息
        this.statsText = this.add.text(25, y + 6, '', {
            font: '11px Arial',
            fill: '#6688aa'
        });

        // 单词容器（可滚动）
        this.wordContainer = this.add.container(0, 0);

        // 裁剪遮罩
        const maskShape = this.make.graphics();
        maskShape.fillRect(15, y + 22, width - 30, h - 28);
        this.wordContainer.setMask(maskShape.createGeometryMask());

        this.wordScrollY = 0;
        this.wordMaxScrollY = 0;

        // 鼠标滚轮滚动
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (pointer.y > y && pointer.y < y + h) {
                this.wordScrollY = Phaser.Math.Clamp(this.wordScrollY + deltaY * 0.3, 0, this.wordMaxScrollY);
                this.wordContainer.y = -this.wordScrollY;
            }
        });
    }

    refreshWordList() {
        // 清空容器
        this.wordContainer.removeAll(true);
        this.wordScrollY = 0;
        this.wordContainer.y = 0;

        let words = [];
        let readonly = true;

        if (this.currentLib === 'children') {
            words = WordsData.childrenWords;
            readonly = true;
        } else if (this.currentLib === 'school') {
            words = Object.values(WordsData.schoolWords).flat();
            readonly = true;
        } else {
            words = WordsData.getCustomWords();
            readonly = false;
        }

        this.statsText.setText(`共 ${words.length} 个单词${readonly ? '（只读）' : '（可编辑）'}`);

        // 显示单词标签
        const cols = 4;
        const startX = 25;
        const startY = this.wordListY + 26;
        const colWidth = (this.w - 50) / cols;
        const rowHeight = 28;

        words.forEach((word, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = startX + col * colWidth;
            const y = startY + row * rowHeight;

            // 单词标签背景
            const tagBg = this.add.graphics();
            tagBg.fillStyle(0x223355, 0.4);
            tagBg.fillRoundedRect(x, y, colWidth - 6, 22, 4);
            this.wordContainer.add(tagBg);

            // 单词文字
            const wordText = this.add.text(x + 6, y + 11, word, {
                font: '12px "Courier New", Courier, monospace',
                fill: '#aaccee'
            }).setOrigin(0, 0.5);
            this.wordContainer.add(wordText);

            // 自定义词库可删除
            if (!readonly) {
                const delBtn = this.add.text(x + colWidth - 14, y + 11, '×', {
                    font: 'bold 14px Arial',
                    fill: '#ff5555'
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                delBtn.on('pointerover', () => delBtn.setColor('#ff9999'));
                delBtn.on('pointerout', () => delBtn.setColor('#ff5555'));
                delBtn.on('pointerup', () => {
                    this.deleteWord(word);
                });
                this.wordContainer.add(delBtn);
            }
        });

        // 计算滚动范围
        const totalRows = Math.ceil(words.length / cols);
        const totalHeight = totalRows * rowHeight + 10;
        this.wordMaxScrollY = Math.max(0, totalHeight - this.wordListH + 30);
    }

    deleteWord(word) {
        const custom = WordsData.getCustomWords();
        const filtered = custom.filter(w => w !== word);
        WordsData.saveCustomWords(filtered);
        this.refreshWordList();
    }

    // ============================================
    // 底部操作区：打字输入添加单词
    // ============================================
    createInputArea(width, height) {
        const areaY = height - 155;

        // 分隔线
        const sep = this.add.graphics();
        sep.lineStyle(1, 0x334466, 0.5);
        sep.lineBetween(20, areaY, width - 20, areaY);

        // 提示文字
        this.add.text(width / 2, areaY + 12, '⌨️ 打字输入添加单词到自定义词库（输入过程即练习！）', {
            font: '11px Arial',
            fill: '#889988'
        }).setOrigin(0.5);

        // 输入框背景
        const inputBoxY = areaY + 30;
        this.inputBg = this.add.graphics();
        this.inputBg.fillStyle(0x112244, 0.7);
        this.inputBg.lineStyle(2, 0x4466aa, 0.6);
        this.inputBg.fillRoundedRect(30, inputBoxY, width - 120, 34, 6);
        this.inputBg.strokeRoundedRect(30, inputBoxY, width - 120, 34, 6);

        // 输入文字显示
        this.inputText = this.add.text(40, inputBoxY + 17, '', {
            font: 'bold 16px "Courier New", Courier, monospace',
            fill: '#00eeff'
        }).setOrigin(0, 0.5);

        // 光标闪烁
        this.cursor = this.add.text(40, inputBoxY + 17, '|', {
            font: '16px "Courier New", monospace',
            fill: '#00eeff'
        }).setOrigin(0, 0.5);
        this.tweens.add({
            targets: this.cursor,
            alpha: { from: 1, to: 0 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 添加按钮
        this.createSmallButton(width - 60, inputBoxY + 17, '添加', '#00cc66', () => {
            this.addCurrentInput();
        });

        // 当前输入缓冲
        this.inputBuffer = '';

        // 操作按钮行
        const btnY = areaY + 80;
        const btnGap = 10;
        const btnW = 90;
        const totalBtnW = 4 * btnW + 3 * btnGap;
        const btnStartX = (width - totalBtnW) / 2;

        // 批量导入按钮
        this.createSmallButton(btnStartX + btnW / 2, btnY, '📋 粘贴导入', '#ff9900', () => {
            this.pasteImport();
        });

        // 清空自定义词库
        this.createSmallButton(btnStartX + btnW + btnGap + btnW / 2, btnY, '🗑️ 清空', '#ff4444', () => {
            if (this.currentLib === 'custom') {
                WordsData.saveCustomWords([]);
                this.refreshWordList();
                this.showToast('已清空自定义词库');
            } else {
                this.showToast('只能清空自定义词库');
            }
        });

        // 使用该词库
        this.createSmallButton(btnStartX + 2 * (btnW + btnGap) + btnW / 2, btnY, '✅ 选为当前', '#00aaff', () => {
            WordsData.setCurrentLibrary(this.currentLib);
            this.showToast(`已选择: ${this.currentLib === 'children' ? '儿童词库' : this.currentLib === 'school' ? '课本词汇' : '自定义词库'}`);
        });

        // 导出
        this.createSmallButton(btnStartX + 3 * (btnW + btnGap) + btnW / 2, btnY, '📤 导出', '#8888ff', () => {
            this.exportWords();
        });
    }

    createSmallButton(x, y, text, color, callback) {
        const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
        const btnW = 85;
        const btnH = 28;

        const bg = this.add.graphics();
        bg.fillStyle(colorNum, 0.2);
        bg.lineStyle(1.5, colorNum, 0.5);
        bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 5);
        bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 5);

        const btnText = this.add.text(x, y, text, {
            font: 'bold 11px Arial',
            fill: color
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(colorNum, 0.4);
            bg.lineStyle(1.5, colorNum, 0.8);
            bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 5);
            bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 5);
        });

        zone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(colorNum, 0.2);
            bg.lineStyle(1.5, colorNum, 0.5);
            bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 5);
            bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 5);
        });

        zone.on('pointerup', callback);
    }

    // ============================================
    // 键盘输入处理
    // ============================================
    handleKeyDown(event) {
        const key = event.key;

        // Enter 确认添加
        if (key === 'Enter') {
            this.addCurrentInput();
            return;
        }

        // Backspace 删除
        if (key === 'Backspace') {
            if (this.inputBuffer.length > 0) {
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                this.updateInputDisplay();
            }
            return;
        }

        // Escape 返回
        if (key === 'Escape') {
            this.scene.start('MenuScene');
            return;
        }

        // 只接受字母输入
        if (/^[a-zA-Z]$/.test(key) && this.inputBuffer.length < 20) {
            this.inputBuffer += key.toLowerCase();
            this.updateInputDisplay();

            // 打字音效反馈
            SoundManager.playShoot();
        }
    }

    updateInputDisplay() {
        this.inputText.setText(this.inputBuffer);
        // 更新光标位置
        this.cursor.x = 40 + this.inputText.width;
    }

    addCurrentInput() {
        if (this.inputBuffer.length === 0) return;

        const word = this.inputBuffer.toLowerCase().trim();
        if (!/^[a-z]+$/.test(word)) {
            this.showToast('请输入纯英文字母');
            return;
        }

        // 自动切换到自定义词库
        if (this.currentLib !== 'custom') {
            this.currentLib = 'custom';
            WordsData.setCurrentLibrary('custom');
            // 更新选项卡
            this.tabButtons.forEach(b => {
                const active = b.tab.key === 'custom';
                b.text.setColor(active ? '#ffffff' : '#7788aa');
            });
        }

        const custom = WordsData.getCustomWords();
        if (custom.includes(word)) {
            this.showToast(`"${word}" 已存在`);
        } else {
            custom.push(word);
            WordsData.saveCustomWords(custom);
            this.showToast(`✅ 已添加 "${word}"`);
            SoundManager.playExplosion(); // 成功音效
        }

        this.inputBuffer = '';
        this.updateInputDisplay();
        this.refreshWordList();
    }

    // ============================================
    // 粘贴导入
    // ============================================
    async pasteImport() {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim().length > 0) {
                // 自动切换到自定义词库
                this.currentLib = 'custom';
                WordsData.setCurrentLibrary('custom');

                const imported = WordsData.importFromText(text);
                this.refreshWordList();

                // 更新选项卡
                this.tabButtons.forEach(b => {
                    const active = b.tab.key === 'custom';
                    b.text.setColor(active ? '#ffffff' : '#7788aa');
                });

                this.showToast(`✅ 导入了 ${imported.length} 个单词`);
            } else {
                this.showToast('剪贴板为空');
            }
        } catch (e) {
            this.showToast('请先复制单词文本到剪贴板');
        }
    }

    // ============================================
    // 导出
    // ============================================
    exportWords() {
        let words = [];
        if (this.currentLib === 'custom') {
            words = WordsData.getCustomWords();
        } else if (this.currentLib === 'children') {
            words = WordsData.childrenWords;
        } else {
            words = Object.values(WordsData.schoolWords).flat();
        }

        if (words.length === 0) {
            this.showToast('词库为空');
            return;
        }

        const text = words.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(`✅ 已复制 ${words.length} 个单词到剪贴板`);
        }).catch(() => {
            this.showToast('复制失败，请手动复制');
        });
    }

    // ============================================
    // Toast 提示
    // ============================================
    showToast(msg) {
        const toast = this.add.text(this.w / 2, this.h / 2, msg, {
            font: 'bold 16px Arial',
            fill: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 16, y: 10 }
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: toast.y - 40,
            duration: 1200,
            delay: 600,
            onComplete: () => toast.destroy()
        });
    }
}
