/**
 * 音效管理模块
 * 使用 Web Audio API 合成简单音效，无需外部音频文件
 */
const SoundManager = {
    audioCtx: null,
    enabled: true,
    bgmEnabled: true,
    bgmOscillator: null,
    bgmGain: null,
    _bgmNodes: [],
    _bgmLfo: null,
    _bgmLoopTimer: null,

    STORAGE_KEY: 'typing_shooter_sound',

    /**
     * 初始化音频上下文
     */
    init() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API 不支持:', e);
            this.enabled = false;
        }
        // 读取存储的设置
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            const settings = JSON.parse(saved);
            this.enabled = settings.enabled !== undefined ? settings.enabled : true;
            this.bgmEnabled = settings.bgmEnabled !== undefined ? settings.bgmEnabled : true;
        }
    },

    /**
     * 确保音频上下文已激活（需用户交互后调用）
     */
    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    /**
     * 保存设置
     */
    saveSettings() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
            enabled: this.enabled,
            bgmEnabled: this.bgmEnabled
        }));
    },

    /**
     * 切换音效开关
     */
    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBGM();
        }
        this.saveSettings();
        return this.enabled;
    },

    /**
     * 切换背景音乐开关
     */
    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            this.startBGM();
        } else {
            this.stopBGM();
        }
        this.saveSettings();
        return this.bgmEnabled;
    },

    /**
     * 播放射击音效 - 短促的高音嘟声
     */
    playShoot() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.audioCtx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.1);
    },

    /**
     * 播放爆炸音效 - 低频噪声衰减
     */
    playExplosion() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const bufferSize = this.audioCtx.sampleRate * 0.3;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.3);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        source.start(this.audioCtx.currentTime);
    },

    /**
     * 播放错误输入音效 - 低沉的嗡声
     */
    playError() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.audioCtx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.15);
    },

    /**
     * 播放生命损失音效
     */
    playLifeLost() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.4);
    },

    /**
     * 播放通关音效 - 上升音阶
     */
    playVictory() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.15);

            gain.gain.setValueAtTime(0, this.audioCtx.currentTime + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + i * 0.15 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + i * 0.15 + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(this.audioCtx.currentTime + i * 0.15);
            osc.stop(this.audioCtx.currentTime + i * 0.15 + 0.3);
        });
    },

    /**
     * 播放连击音效
     */
    playCombo() {
        if (!this.enabled || !this.audioCtx) return;
        this.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, this.audioCtx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.2);
    },

    /**
     * Beta: 开始背景音乐（带场景类型参数）
     * @param {string} type - 'menu' | 'battle' | 'boss'
     */
    startBGM(type) {
        if (!this.enabled || !this.bgmEnabled || !this.audioCtx) return;
        this.stopBGM();
        this.resume();

        const bgmType = type || 'battle';
        this._bgmNodes = [];

        if (bgmType === 'menu') {
            this._playMenuBGM();
        } else if (bgmType === 'boss') {
            this._playBossBGM();
        } else {
            this._playBattleBGM();
        }
    },

    /**
     * 主菜单BGM - 轻松明快的旋律
     */
    _playMenuBGM() {
        // 主旋律音符：C5 E5 G5 C6 G5 E5 (循环)
        const melody = [523, 659, 784, 1047, 784, 659];
        const noteLen = 0.4;
        const loopLen = melody.length * noteLen;

        const scheduleLoop = () => {
            if (!this.bgmEnabled || !this.audioCtx) return;
            const now = this.audioCtx.currentTime;
            melody.forEach((freq, i) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * noteLen);
                gain.gain.setValueAtTime(0, now + i * noteLen);
                gain.gain.linearRampToValueAtTime(0.06, now + i * noteLen + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.9);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now + i * noteLen);
                osc.stop(now + i * noteLen + noteLen);
                this._bgmNodes.push(osc);
            });
            this._bgmLoopTimer = setTimeout(() => scheduleLoop(), loopLen * 1000);
        };
        scheduleLoop();

        // 低频pad
        this._startPad(130, 0.025);
    },

    /**
     * 战斗BGM - 有节奏感
     */
    _playBattleBGM() {
        // 节奏bass循环
        const bassNotes = [110, 110, 147, 131]; // A2 A2 D3 C3
        const noteLen = 0.5;
        const loopLen = bassNotes.length * noteLen;

        const scheduleLoop = () => {
            if (!this.bgmEnabled || !this.audioCtx) return;
            const now = this.audioCtx.currentTime;
            bassNotes.forEach((freq, i) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * noteLen);
                gain.gain.setValueAtTime(0, now + i * noteLen);
                gain.gain.linearRampToValueAtTime(0.05, now + i * noteLen + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.8);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now + i * noteLen);
                osc.stop(now + i * noteLen + noteLen);
                this._bgmNodes.push(osc);
            });
            this._bgmLoopTimer = setTimeout(() => scheduleLoop(), loopLen * 1000);
        };
        scheduleLoop();

        // 低频环境pad
        this._startPad(80, 0.02);
    },

    /**
     * Boss战BGM - 紧张激烈
     */
    _playBossBGM() {
        const bassNotes = [82, 87, 98, 87]; // E2 F2 G2 F2
        const noteLen = 0.35;
        const loopLen = bassNotes.length * noteLen;

        const scheduleLoop = () => {
            if (!this.bgmEnabled || !this.audioCtx) return;
            const now = this.audioCtx.currentTime;
            bassNotes.forEach((freq, i) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + i * noteLen);
                gain.gain.setValueAtTime(0, now + i * noteLen);
                gain.gain.linearRampToValueAtTime(0.04, now + i * noteLen + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.7);

                const filter = this.audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now + i * noteLen);
                osc.stop(now + i * noteLen + noteLen);
                this._bgmNodes.push(osc);
            });
            this._bgmLoopTimer = setTimeout(() => scheduleLoop(), loopLen * 1000);
        };
        scheduleLoop();

        this._startPad(65, 0.03);
    },

    /**
     * 低频环境pad音
     */
    _startPad(freq, vol) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.3, this.audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(10, this.audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // 渐入
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.audioCtx.currentTime + 1.0);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        lfo.start();

        this.bgmOscillator = osc;
        this.bgmGain = gain;
        this._bgmLfo = lfo;
        this._bgmNodes.push(osc, lfo);
    },

    /**
     * 播放胜利旋律
     */
    playVictoryBGM() {
        if (!this.enabled || !this.audioCtx) return;
        this.stopBGM();
        this.resume();

        const melody = [523, 659, 784, 880, 1047]; // C E G A C6
        melody.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            const t = this.audioCtx.currentTime + i * 0.2;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.5);
        });
    },

    /**
     * 播放失败旋律
     */
    playDefeatBGM() {
        if (!this.enabled || !this.audioCtx) return;
        this.stopBGM();
        this.resume();

        const melody = [440, 392, 349, 330, 262]; // A G F E C (下降)
        melody.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            const t = this.audioCtx.currentTime + i * 0.25;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.10, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.6);
        });
    },

    /**
     * 停止背景音乐（带渐出）
     */
    stopBGM() {
        // 停止循环定时器
        if (this._bgmLoopTimer) {
            clearTimeout(this._bgmLoopTimer);
            this._bgmLoopTimer = null;
        }
        // 停止pad
        if (this.bgmGain && this.audioCtx) {
            try {
                this.bgmGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
            } catch(e) {}
        }
        if (this.bgmOscillator) {
            try { this.bgmOscillator.stop(this.audioCtx.currentTime + 0.6); } catch (e) {}
            this.bgmOscillator = null;
        }
        if (this._bgmLfo) {
            try { this._bgmLfo.stop(this.audioCtx.currentTime + 0.6); } catch (e) {}
            this._bgmLfo = null;
        }
        this.bgmGain = null;
        this._bgmNodes = [];
    }
};
