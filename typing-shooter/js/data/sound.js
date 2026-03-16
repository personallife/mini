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
     * 开始背景音乐 - 简单的低频环境音
     */
    startBGM() {
        if (!this.enabled || !this.bgmEnabled || !this.audioCtx || this.bgmOscillator) return;
        this.resume();

        // 使用低频振荡器 + LFO 制造简单的环境氛围
        this.bgmOscillator = this.audioCtx.createOscillator();
        this.bgmGain = this.audioCtx.createGain();
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();

        this.bgmOscillator.type = 'sine';
        this.bgmOscillator.frequency.setValueAtTime(80, this.audioCtx.currentTime);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.3, this.audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(15, this.audioCtx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(this.bgmOscillator.frequency);

        this.bgmGain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);

        this.bgmOscillator.connect(this.bgmGain);
        this.bgmGain.connect(this.audioCtx.destination);

        this.bgmOscillator.start();
        lfo.start();
    },

    /**
     * 停止背景音乐
     */
    stopBGM() {
        if (this.bgmOscillator) {
            try {
                this.bgmOscillator.stop();
            } catch (e) {}
            this.bgmOscillator = null;
        }
        this.bgmGain = null;
    }
};
