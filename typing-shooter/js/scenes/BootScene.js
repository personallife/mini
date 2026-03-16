/**
 * 引导场景 - 加载资源和初始化
 * Beta 版：高质量矢量素材绘制
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222255, 0.8);
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);
        const progressBar = this.add.graphics();
        const loadingText = this.add.text(width / 2, height / 2 - 40, '正在加载...', {
            font: '20px Arial', fill: '#ffffff'
        }).setOrigin(0.5);
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ccff, 1);
            progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 6);
        });
        this.load.on('complete', () => {
            progressBar.destroy(); progressBox.destroy(); loadingText.destroy();
        });
        this.createGameTextures();
    }

    create() { this.scene.start('MenuScene'); }

    createGameTextures() {
        this.createPlayerTexture();
        this.createEnemyTexture();
        this.createFastEnemyTexture();
        this.createArmoredEnemyTexture();
        this.createArmoredDamagedTexture();
        this.createZigzagEnemyTexture();
        this.createBoss1Texture();
        this.createBoss2Texture();
        this.createBoss3Texture();
        this.createBulletTexture();
        this.createBulletOrangeTexture();
        this.createBulletFireTexture();
        this.createBulletLightningTexture();
        this.createPowerupShieldTexture();
        this.createPowerupSlowTexture();
        this.createPowerupBombTexture();
        this.createParticleTexture();
        this.createHeartTexture();
        this.createStarTexture();
    }

    // ==================== 玩家飞机 ====================
    createPlayerTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        // 机翼阴影
        g.fillStyle(0x003366, 0.9);
        g.beginPath();
        g.moveTo(50*s,2*s); g.lineTo(88*s,65*s); g.lineTo(100*s,80*s);
        g.lineTo(60*s,68*s); g.lineTo(56*s,92*s); g.lineTo(44*s,92*s);
        g.lineTo(40*s,68*s); g.lineTo(0,80*s); g.lineTo(12*s,65*s);
        g.closePath(); g.fillPath();
        // 机身主体 - 蓝色
        g.fillStyle(0x1177cc, 1);
        g.beginPath();
        g.moveTo(50*s,4*s); g.lineTo(85*s,64*s); g.lineTo(97*s,78*s);
        g.lineTo(58*s,66*s); g.lineTo(55*s,90*s); g.lineTo(45*s,90*s);
        g.lineTo(42*s,66*s); g.lineTo(3*s,78*s); g.lineTo(15*s,64*s);
        g.closePath(); g.fillPath();
        // 机身亮色层
        g.fillStyle(0x33aaee, 0.8);
        g.beginPath();
        g.moveTo(50*s,8*s); g.lineTo(70*s,55*s); g.lineTo(58*s,65*s);
        g.lineTo(55*s,88*s); g.lineTo(45*s,88*s); g.lineTo(42*s,65*s); g.lineTo(30*s,55*s);
        g.closePath(); g.fillPath();
        // 中线高光
        g.fillStyle(0x88ddff, 0.6);
        g.beginPath();
        g.moveTo(50*s,10*s); g.lineTo(56*s,50*s); g.lineTo(52*s,85*s);
        g.lineTo(48*s,85*s); g.lineTo(44*s,50*s);
        g.closePath(); g.fillPath();
        // 尾翼
        g.fillStyle(0x0055aa, 1);
        g.fillRect(43*s,82*s,3*s,12*s); g.fillRect(54*s,82*s,3*s,12*s);
        // 驾驶舱
        g.fillStyle(0x66ccff, 0.9); g.fillCircle(50*s,30*s,7*s);
        g.fillStyle(0xaaeeff, 0.7); g.fillCircle(49*s,28*s,4*s);
        g.fillStyle(0xffffff, 0.5); g.fillCircle(47*s,27*s,2*s);
        // 翼尖灯
        g.fillStyle(0x00ff88, 1); g.fillCircle(4*s,78*s,3*s);
        g.fillStyle(0x00ff88, 0.3); g.fillCircle(4*s,78*s,6*s);
        g.fillStyle(0xff3344, 1); g.fillCircle(96*s,78*s,3*s);
        g.fillStyle(0xff3344, 0.3); g.fillCircle(96*s,78*s,6*s);
        // 引擎尾焰
        g.fillStyle(0xff4400, 0.6); g.fillCircle(50*s,95*s,8*s);
        g.fillStyle(0xff6600, 1); g.fillCircle(50*s,94*s,5*s);
        g.fillStyle(0xffcc00, 1); g.fillCircle(50*s,93*s,3*s);
        g.fillStyle(0xffffff, 0.8); g.fillCircle(50*s,92*s,1.5*s);
        g.generateTexture('player', 100*s, 100*s);
        g.destroy();
    }

    // ==================== 普通敌机 ====================
    createEnemyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 60, h = 60;
        g.fillStyle(0x881111, 0.8);
        g.beginPath();
        g.moveTo(w/2*s,h*s-2*s); g.lineTo(0,14*s); g.lineTo(14*s,22*s);
        g.lineTo(w/2*s,2*s); g.lineTo((w-14)*s,22*s); g.lineTo(w*s,14*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xee3333, 1);
        g.beginPath();
        g.moveTo(w/2*s,(h-4)*s); g.lineTo(3*s,16*s); g.lineTo(16*s,23*s);
        g.lineTo(w/2*s,4*s); g.lineTo((w-16)*s,23*s); g.lineTo((w-3)*s,16*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xff7766, 0.5);
        g.beginPath();
        g.moveTo(w/2*s,(h-8)*s); g.lineTo((w/2+8)*s,26*s);
        g.lineTo(w/2*s,8*s); g.lineTo((w/2-8)*s,26*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xffcc44, 0.8); g.fillCircle(w/2*s,38*s,5*s);
        g.fillStyle(0xffffff, 0.4); g.fillCircle(w/2*s-1*s,37*s,2.5*s);
        g.fillStyle(0xffaa00, 1);
        g.fillCircle(3*s,16*s,2*s); g.fillCircle((w-3)*s,16*s,2*s);
        g.generateTexture('enemy', w*s, h*s);
        g.destroy();
    }

    // ==================== 快速敌机 ====================
    createFastEnemyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 50, h = 55;
        g.fillStyle(0xaa6600, 0.7);
        g.beginPath();
        g.moveTo(25*s,53*s); g.lineTo(2*s,18*s); g.lineTo(12*s,22*s);
        g.lineTo(25*s,2*s); g.lineTo(38*s,22*s); g.lineTo(48*s,18*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xffaa22, 1);
        g.beginPath();
        g.moveTo(25*s,52*s); g.lineTo(4*s,20*s); g.lineTo(13*s,24*s);
        g.lineTo(25*s,3*s); g.lineTo(37*s,24*s); g.lineTo(46*s,20*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xffdd66, 0.6);
        g.beginPath();
        g.moveTo(25*s,48*s); g.lineTo(32*s,26*s);
        g.lineTo(25*s,6*s); g.lineTo(18*s,26*s);
        g.closePath(); g.fillPath();
        // 速度条纹
        g.lineStyle(1*s, 0xffee88, 0.4);
        g.beginPath(); g.moveTo(18*s,15*s); g.lineTo(20*s,45*s); g.strokePath();
        g.beginPath(); g.moveTo(32*s,15*s); g.lineTo(30*s,45*s); g.strokePath();
        g.fillStyle(0xff6600, 0.9); g.fillCircle(25*s,34*s,4*s);
        g.fillStyle(0xffffff, 0.4); g.fillCircle(24*s,33*s,2*s);
        g.generateTexture('enemy_fast', w*s, h*s);
        g.destroy();
    }

    // ==================== 装甲敌机 ====================
    createArmoredEnemyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 70, h = 65;
        g.fillStyle(0x444444, 0.9);
        g.beginPath();
        g.moveTo(35*s,63*s); g.lineTo(0,20*s); g.lineTo(10*s,10*s);
        g.lineTo(35*s,2*s); g.lineTo(60*s,10*s); g.lineTo(70*s,20*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0x888899, 1);
        g.beginPath();
        g.moveTo(35*s,60*s); g.lineTo(3*s,22*s); g.lineTo(12*s,12*s);
        g.lineTo(35*s,4*s); g.lineTo(58*s,12*s); g.lineTo(67*s,22*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xaaaabb, 0.5);
        g.beginPath();
        g.moveTo(35*s,55*s); g.lineTo(15*s,22*s);
        g.lineTo(35*s,8*s); g.lineTo(55*s,22*s);
        g.closePath(); g.fillPath();
        // 铆钉
        g.fillStyle(0xccccdd, 0.8);
        g.fillCircle(20*s,25*s,2*s); g.fillCircle(50*s,25*s,2*s);
        g.fillCircle(25*s,40*s,2*s); g.fillCircle(45*s,40*s,2*s);
        // 驾驶舱
        g.fillStyle(0x66aacc, 0.8); g.fillCircle(35*s,30*s,6*s);
        g.fillStyle(0x88ccee, 0.5); g.fillCircle(34*s,28*s,3*s);
        // 护甲条
        g.lineStyle(2*s, 0x6688aa, 0.6);
        g.strokeRect(10*s,15*s,50*s,35*s);
        g.generateTexture('enemy_armored', w*s, h*s);
        g.destroy();
    }

    // ==================== 装甲敌机（受损） ====================
    createArmoredDamagedTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 70, h = 65;
        g.fillStyle(0x332222, 0.9);
        g.beginPath();
        g.moveTo(35*s,63*s); g.lineTo(0,20*s); g.lineTo(10*s,10*s);
        g.lineTo(35*s,2*s); g.lineTo(60*s,10*s); g.lineTo(70*s,20*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0x886666, 1);
        g.beginPath();
        g.moveTo(35*s,60*s); g.lineTo(3*s,22*s); g.lineTo(12*s,12*s);
        g.lineTo(35*s,4*s); g.lineTo(58*s,12*s); g.lineTo(67*s,22*s);
        g.closePath(); g.fillPath();
        // 裂纹
        g.lineStyle(1.5*s, 0xff4444, 0.7);
        g.beginPath(); g.moveTo(20*s,15*s); g.lineTo(35*s,35*s); g.lineTo(28*s,50*s); g.strokePath();
        g.beginPath(); g.moveTo(50*s,12*s); g.lineTo(40*s,30*s); g.lineTo(48*s,45*s); g.strokePath();
        // 火花
        g.fillStyle(0xff6600, 0.8); g.fillCircle(25*s,25*s,3*s); g.fillCircle(45*s,35*s,2.5*s);
        g.fillStyle(0xffaa00, 0.6); g.fillCircle(30*s,45*s,2*s);
        g.fillStyle(0xcc6644, 0.8); g.fillCircle(35*s,30*s,6*s);
        g.fillStyle(0xff8866, 0.5); g.fillCircle(34*s,28*s,3*s);
        g.generateTexture('enemy_armored_damaged', w*s, h*s);
        g.destroy();
    }

    // ==================== 曲线敌机 ====================
    createZigzagEnemyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 60, h = 60;
        g.fillStyle(0x332266, 0.8);
        g.beginPath();
        g.moveTo(30*s,58*s); g.lineTo(0,25*s); g.lineTo(8*s,15*s);
        g.lineTo(30*s,2*s); g.lineTo(52*s,15*s); g.lineTo(60*s,25*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0x7755cc, 1);
        g.beginPath();
        g.moveTo(30*s,56*s); g.lineTo(2*s,27*s); g.lineTo(10*s,16*s);
        g.lineTo(30*s,4*s); g.lineTo(50*s,16*s); g.lineTo(58*s,27*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xaa88ee, 0.5);
        g.beginPath();
        g.moveTo(30*s,50*s); g.lineTo(18*s,25*s);
        g.lineTo(30*s,8*s); g.lineTo(42*s,25*s);
        g.closePath(); g.fillPath();
        // 波纹
        g.lineStyle(1.5*s, 0xcc99ff, 0.4);
        g.beginPath();
        g.moveTo(10*s,30*s); g.lineTo(20*s,20*s); g.lineTo(30*s,30*s);
        g.lineTo(40*s,20*s); g.lineTo(50*s,30*s); g.strokePath();
        g.fillStyle(0xbb88ff, 0.9); g.fillCircle(30*s,32*s,5*s);
        g.fillStyle(0xddbbff, 0.5); g.fillCircle(29*s,31*s,2.5*s);
        // 翼尖发光
        g.fillStyle(0xaa66ff, 1); g.fillCircle(3*s,27*s,2.5*s);
        g.fillStyle(0xaa66ff, 0.3); g.fillCircle(3*s,27*s,5*s);
        g.fillStyle(0xaa66ff, 1); g.fillCircle(57*s,27*s,2.5*s);
        g.fillStyle(0xaa66ff, 0.3); g.fillCircle(57*s,27*s,5*s);
        g.generateTexture('enemy_zigzag', w*s, h*s);
        g.destroy();
    }

    // ==================== Boss 1 - 字母大王 ====================
    createBoss1Texture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 180, h = 160;
        // 阴影
        g.fillStyle(0x661111, 0.8);
        g.beginPath();
        g.moveTo(90*s,158*s); g.lineTo(10*s,70*s); g.lineTo(0,50*s);
        g.lineTo(20*s,20*s); g.lineTo(90*s,5*s); g.lineTo(160*s,20*s);
        g.lineTo(180*s,50*s); g.lineTo(170*s,70*s);
        g.closePath(); g.fillPath();
        // 主体
        g.fillStyle(0xcc2222, 1);
        g.beginPath();
        g.moveTo(90*s,155*s); g.lineTo(15*s,68*s); g.lineTo(5*s,50*s);
        g.lineTo(22*s,22*s); g.lineTo(90*s,8*s); g.lineTo(158*s,22*s);
        g.lineTo(175*s,50*s); g.lineTo(165*s,68*s);
        g.closePath(); g.fillPath();
        // 高光
        g.fillStyle(0xff5544, 0.5);
        g.beginPath();
        g.moveTo(90*s,145*s); g.lineTo(40*s,60*s);
        g.lineTo(90*s,15*s); g.lineTo(140*s,60*s);
        g.closePath(); g.fillPath();
        // 皇冠
        g.fillStyle(0xffcc00, 1);
        g.beginPath();
        g.moveTo(60*s,15*s); g.lineTo(65*s,2*s); g.lineTo(75*s,12*s);
        g.lineTo(90*s,0); g.lineTo(105*s,12*s); g.lineTo(115*s,2*s); g.lineTo(120*s,15*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xff0000, 1); g.fillCircle(90*s,10*s,3*s);
        g.fillStyle(0x00ff00, 1); g.fillCircle(75*s,11*s,2*s); g.fillCircle(105*s,11*s,2*s);
        // 驾驶舱
        g.fillStyle(0xffdd44, 0.9); g.fillCircle(90*s,70*s,15*s);
        g.fillStyle(0xffee88, 0.5); g.fillCircle(87*s,67*s,8*s);
        // 翼尖武器
        g.fillStyle(0xffaa00, 1); g.fillRect(0,45*s,8*s,15*s); g.fillRect(172*s,45*s,8*s,15*s);
        g.fillStyle(0xff6600, 1); g.fillCircle(4*s,60*s,4*s); g.fillCircle(176*s,60*s,4*s);
        // 引擎
        g.fillStyle(0xff4400, 0.7); g.fillCircle(70*s,150*s,10*s); g.fillCircle(110*s,150*s,10*s);
        g.fillStyle(0xffaa00, 1); g.fillCircle(70*s,150*s,6*s); g.fillCircle(110*s,150*s,6*s);
        g.generateTexture('boss1', w*s, h*s);
        g.destroy();
    }

    // ==================== Boss 2 - 单词霸主 ====================
    createBoss2Texture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 200, h = 170;
        g.fillStyle(0x114433, 0.8);
        g.beginPath();
        g.moveTo(100*s,168*s); g.lineTo(10*s,80*s); g.lineTo(0,55*s);
        g.lineTo(15*s,25*s); g.lineTo(100*s,5*s); g.lineTo(185*s,25*s);
        g.lineTo(200*s,55*s); g.lineTo(190*s,80*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0x228866, 1);
        g.beginPath();
        g.moveTo(100*s,165*s); g.lineTo(15*s,78*s); g.lineTo(4*s,55*s);
        g.lineTo(18*s,28*s); g.lineTo(100*s,8*s); g.lineTo(182*s,28*s);
        g.lineTo(196*s,55*s); g.lineTo(185*s,78*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0x44bb88, 0.4);
        g.beginPath();
        g.moveTo(100*s,155*s); g.lineTo(35*s,65*s);
        g.lineTo(100*s,15*s); g.lineTo(165*s,65*s);
        g.closePath(); g.fillPath();
        // 铆钉
        g.fillStyle(0x66ddaa, 0.7);
        for (let i = 0; i < 5; i++) {
            g.fillCircle((50+i*25)*s,45*s,3*s); g.fillCircle((50+i*25)*s,90*s,3*s);
        }
        // 核心
        g.fillStyle(0x00ffaa, 0.9); g.fillCircle(100*s,75*s,18*s);
        g.fillStyle(0x88ffcc, 0.5); g.fillCircle(97*s,72*s,10*s);
        g.fillStyle(0xffffff, 0.3); g.fillCircle(94*s,69*s,5*s);
        // 炮台
        g.fillStyle(0x116644, 1); g.fillRect(0,50*s,12*s,20*s); g.fillRect(188*s,50*s,12*s,20*s);
        g.fillStyle(0x00ff88, 0.8); g.fillCircle(6*s,70*s,5*s); g.fillCircle(194*s,70*s,5*s);
        // 引擎
        g.fillStyle(0x00aa66, 0.7);
        g.fillCircle(70*s,160*s,12*s); g.fillCircle(100*s,162*s,10*s); g.fillCircle(130*s,160*s,12*s);
        g.fillStyle(0x00ffaa, 1);
        g.fillCircle(70*s,160*s,7*s); g.fillCircle(100*s,162*s,5*s); g.fillCircle(130*s,160*s,7*s);
        g.generateTexture('boss2', w*s, h*s);
        g.destroy();
    }

    // ==================== Boss 3 - 键盘魔王 ====================
    createBoss3Texture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2, w = 220, h = 180;
        g.fillStyle(0x220033, 0.9);
        g.beginPath();
        g.moveTo(110*s,178*s); g.lineTo(5*s,85*s); g.lineTo(0,55*s);
        g.lineTo(15*s,20*s); g.lineTo(110*s,2*s); g.lineTo(205*s,20*s);
        g.lineTo(220*s,55*s); g.lineTo(215*s,85*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0x6633aa, 1);
        g.beginPath();
        g.moveTo(110*s,175*s); g.lineTo(10*s,82*s); g.lineTo(4*s,55*s);
        g.lineTo(18*s,22*s); g.lineTo(110*s,5*s); g.lineTo(202*s,22*s);
        g.lineTo(216*s,55*s); g.lineTo(210*s,82*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0x8855cc, 0.5);
        g.beginPath();
        g.moveTo(110*s,165*s); g.lineTo(35*s,70*s);
        g.lineTo(110*s,12*s); g.lineTo(185*s,70*s);
        g.closePath(); g.fillPath();
        // 能量核心
        g.fillStyle(0xff00ff, 0.3); g.fillCircle(110*s,80*s,30*s);
        g.fillStyle(0xcc44ff, 0.9); g.fillCircle(110*s,80*s,20*s);
        g.fillStyle(0xee88ff, 0.6); g.fillCircle(107*s,77*s,12*s);
        g.fillStyle(0xffffff, 0.4); g.fillCircle(104*s,74*s,6*s);
        // 恶魔角
        g.fillStyle(0x9944ff, 1);
        g.beginPath(); g.moveTo(50*s,20*s); g.lineTo(40*s,0); g.lineTo(65*s,15*s); g.closePath(); g.fillPath();
        g.beginPath(); g.moveTo(170*s,20*s); g.lineTo(180*s,0); g.lineTo(155*s,15*s); g.closePath(); g.fillPath();
        // 武器阵列
        g.fillStyle(0x4422aa, 1); g.fillRect(0,50*s,15*s,25*s); g.fillRect(205*s,50*s,15*s,25*s);
        g.fillStyle(0xff44ff, 0.8); g.fillCircle(7*s,75*s,6*s); g.fillCircle(213*s,75*s,6*s);
        g.fillStyle(0xff88ff, 0.4); g.fillCircle(7*s,75*s,10*s); g.fillCircle(213*s,75*s,10*s);
        // 能量纹路
        g.lineStyle(2*s, 0xaa55ff, 0.3);
        g.beginPath(); g.moveTo(60*s,40*s); g.lineTo(110*s,80*s); g.lineTo(160*s,40*s); g.strokePath();
        g.beginPath(); g.moveTo(50*s,100*s); g.lineTo(110*s,80*s); g.lineTo(170*s,100*s); g.strokePath();
        // 引擎
        const engineX = [70,90,130,150];
        for (const ex of engineX) {
            g.fillStyle(0x8800ff, 0.7); g.fillCircle(ex*s,172*s,10*s);
            g.fillStyle(0xcc66ff, 1); g.fillCircle(ex*s,172*s,6*s);
            g.fillStyle(0xffffff, 0.5); g.fillCircle(ex*s,171*s,3*s);
        }
        g.generateTexture('boss3', w*s, h*s);
        g.destroy();
    }

    // ==================== 普通子弹 ====================
    createBulletTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        g.fillStyle(0x00ffff, 0.15); g.fillCircle(5*s,10*s,8*s);
        g.fillStyle(0x00eeff, 1); g.fillRoundedRect(3*s,0,4*s,20*s,2*s);
        g.fillStyle(0xffffff, 0.9); g.fillRoundedRect(4*s,2*s,2*s,16*s,1*s);
        g.fillStyle(0xffffff, 0.8); g.fillCircle(5*s,2*s,2*s);
        g.generateTexture('bullet', 10*s, 20*s);
        g.destroy();
    }

    // ==================== 橙色子弹（5连击） ====================
    createBulletOrangeTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        g.fillStyle(0xff8800, 0.15); g.fillCircle(5*s,10*s,8*s);
        g.fillStyle(0xff8800, 1); g.fillRoundedRect(3*s,0,4*s,20*s,2*s);
        g.fillStyle(0xffcc44, 0.9); g.fillRoundedRect(4*s,2*s,2*s,16*s,1*s);
        g.fillStyle(0xffffff, 0.8); g.fillCircle(5*s,2*s,2*s);
        g.generateTexture('bullet_orange', 10*s, 20*s);
        g.destroy();
    }

    // ==================== 火焰子弹（10连击） ====================
    createBulletFireTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        g.fillStyle(0xff4400, 0.12); g.fillCircle(7*s,12*s,12*s);
        g.fillStyle(0xff6600, 0.6);
        g.beginPath(); g.moveTo(2*s,28*s); g.lineTo(7*s,15*s); g.lineTo(12*s,28*s); g.closePath(); g.fillPath();
        g.fillStyle(0xff4400, 1); g.fillRoundedRect(4*s,0,6*s,24*s,3*s);
        g.fillStyle(0xffcc00, 0.9); g.fillRoundedRect(5.5*s,2*s,3*s,20*s,1.5*s);
        g.fillStyle(0xffffff, 0.8); g.fillCircle(7*s,3*s,2.5*s);
        g.generateTexture('bullet_fire', 14*s, 30*s);
        g.destroy();
    }

    // ==================== 闪电子弹（20连击） ====================
    createBulletLightningTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        g.fillStyle(0xaa00ff, 0.15); g.fillCircle(7*s,14*s,14*s);
        g.fillStyle(0xcc44ff, 1);
        g.beginPath();
        g.moveTo(7*s,0); g.lineTo(12*s,10*s); g.lineTo(9*s,10*s);
        g.lineTo(13*s,22*s); g.lineTo(8*s,14*s); g.lineTo(11*s,14*s);
        g.lineTo(5*s,28*s); g.lineTo(6*s,16*s); g.lineTo(3*s,16*s);
        g.lineTo(5*s,8*s); g.lineTo(3*s,8*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xeeccff, 0.7);
        g.beginPath();
        g.moveTo(7*s,2*s); g.lineTo(9*s,10*s); g.lineTo(7*s,14*s); g.lineTo(5*s,10*s);
        g.closePath(); g.fillPath();
        g.fillStyle(0xffffff, 0.8); g.fillCircle(7*s,3*s,2*s);
        g.generateTexture('bullet_lightning', 14*s, 30*s);
        g.destroy();
    }

    // ==================== 道具：护盾 ====================
    createPowerupShieldTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        g.fillStyle(0x0088ff, 0.15); g.fillCircle(24*s,24*s,24*s);
        g.fillStyle(0x2299ff, 0.7); g.fillCircle(24*s,24*s,20*s);
        g.fillStyle(0x66ccff, 0.5); g.fillCircle(20*s,20*s,12*s);
        g.fillStyle(0xffffff, 0.7); g.fillCircle(16*s,16*s,5*s);
        g.fillStyle(0xffffff, 0.4); g.fillCircle(28*s,28*s,3*s);
        // 盾牌图标
        g.fillStyle(0xffffff, 0.5);
        g.beginPath();
        g.moveTo(24*s,14*s); g.lineTo(32*s,18*s); g.lineTo(32*s,26*s);
        g.lineTo(24*s,34*s); g.lineTo(16*s,26*s); g.lineTo(16*s,18*s);
        g.closePath(); g.fillPath();
        g.generateTexture('powerup_shield', 48*s, 48*s);
        g.destroy();
    }

    // ==================== 道具：减速 ====================
    createPowerupSlowTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        g.fillStyle(0x0066cc, 0.15); g.fillCircle(24*s,24*s,24*s);
        g.fillStyle(0x3388cc, 0.8); g.fillCircle(24*s,24*s,20*s);
        g.fillStyle(0xaaddff, 0.6); g.fillCircle(24*s,24*s,16*s);
        // 刻度
        g.fillStyle(0x1166aa, 0.8);
        g.fillRect(23*s,10*s,2*s,4*s); g.fillRect(23*s,34*s,2*s,4*s);
        g.fillRect(10*s,23*s,4*s,2*s); g.fillRect(34*s,23*s,4*s,2*s);
        // 指针
        g.lineStyle(2*s, 0x1155aa, 1);
        g.beginPath(); g.moveTo(24*s,24*s); g.lineTo(24*s,15*s); g.strokePath();
        g.lineStyle(1.5*s, 0x2277cc, 1);
        g.beginPath(); g.moveTo(24*s,24*s); g.lineTo(32*s,20*s); g.strokePath();
        g.fillStyle(0x0044aa, 1); g.fillCircle(24*s,24*s,2*s);
        g.generateTexture('powerup_slow', 48*s, 48*s);
        g.destroy();
    }

    // ==================== 道具：炸弹 ====================
    createPowerupBombTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        g.fillStyle(0xff2200, 0.15); g.fillCircle(24*s,26*s,24*s);
        g.fillStyle(0xcc2211, 0.9); g.fillCircle(24*s,28*s,18*s);
        g.fillStyle(0xff5544, 0.5); g.fillCircle(20*s,24*s,10*s);
        g.fillStyle(0xffffff, 0.4); g.fillCircle(17*s,21*s,4*s);
        // 引线
        g.lineStyle(2.5*s, 0x665544, 1);
        g.beginPath(); g.moveTo(24*s,10*s); g.lineTo(28*s,5*s); g.lineTo(32*s,3*s); g.strokePath();
        g.fillStyle(0xffaa00, 1); g.fillCircle(33*s,3*s,3*s);
        g.fillStyle(0xffdd44, 0.8); g.fillCircle(33*s,3*s,1.5*s);
        g.generateTexture('powerup_bomb', 48*s, 48*s);
        g.destroy();
    }

    // ==================== 爆炸粒子 ====================
    createParticleTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6);
        g.fillStyle(0xffffff, 0.5); g.fillCircle(6, 6, 4);
        g.generateTexture('particle', 12, 12);
        g.destroy();
    }

    // ==================== 心形图标 ====================
    createHeartTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xee2233, 1);
        g.fillCircle(8, 7, 7); g.fillCircle(20, 7, 7);
        g.fillTriangle(1, 10, 27, 10, 14, 26);
        g.fillStyle(0xff8888, 0.5); g.fillCircle(8, 6, 4);
        g.fillStyle(0xffffff, 0.3); g.fillCircle(7, 5, 2);
        g.generateTexture('heart', 28, 28);
        g.destroy();
        const g2 = this.make.graphics({ x: 0, y: 0, add: false });
        g2.fillStyle(0x444455, 1);
        g2.fillCircle(8, 7, 7); g2.fillCircle(20, 7, 7);
        g2.fillTriangle(1, 10, 27, 10, 14, 26);
        g2.fillStyle(0x555566, 0.5); g2.fillCircle(8, 6, 4);
        g2.generateTexture('heart_gray', 28, 28);
        g2.destroy();
    }

    // ==================== 星星背景 ====================
    createStarTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1); g.fillCircle(3, 3, 3);
        g.fillStyle(0xffffff, 0.3); g.fillCircle(3, 3, 5);
        g.generateTexture('star', 10, 10);
        g.destroy();
    }
}
