/**
 * 引导场景 - 加载资源和初始化
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 显示加载进度
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 加载进度条背景
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222255, 0.8);
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

        // 加载进度条
        const progressBar = this.add.graphics();

        // 加载文字
        const loadingText = this.add.text(width / 2, height / 2 - 40, '正在加载...', {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 监听加载进度
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ccff, 1);
            progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 6);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // 创建游戏内用到的纹理（用代码生成，不依赖外部素材文件）
        this.createGameTextures();
    }

    create() {
        // 进入主菜单
        this.scene.start('MenuScene');
    }

    /**
     * 用代码生成游戏所需的所有纹理
     */
    createGameTextures() {
        // 玩家飞机纹理
        this.createPlayerTexture();
        // 敌机纹理
        this.createEnemyTexture();
        // 子弹纹理
        this.createBulletTexture();
        // 爆炸粒子纹理
        this.createParticleTexture();
        // 心形生命图标
        this.createHeartTexture();
        // 星星背景粒子
        this.createStarTexture();
    }

    createPlayerTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2; // 2x 分辨率
        // 机翼阴影
        g.fillStyle(0x005588, 0.8);
        g.beginPath();
        g.moveTo(50*s, 0);       // 机头
        g.lineTo(82*s, 70*s);    // 右侧
        g.lineTo(100*s, 85*s);   // 右翼尖
        g.lineTo(58*s, 70*s);    // 右翼内
        g.lineTo(42*s, 70*s);    // 左翼内
        g.lineTo(0, 85*s);       // 左翼尖
        g.lineTo(18*s, 70*s);    // 左侧
        g.closePath();
        g.fillPath();
        // 飞机机身 - 流线型
        g.fillStyle(0x0099ee, 1);
        g.beginPath();
        g.moveTo(50*s, 2*s);     // 机头
        g.lineTo(80*s, 68*s);    // 右侧
        g.lineTo(98*s, 82*s);    // 右翼尖
        g.lineTo(58*s, 68*s);    // 右翼内
        g.lineTo(56*s, 95*s);    // 右尾翼
        g.lineTo(44*s, 95*s);    // 左尾翼
        g.lineTo(42*s, 68*s);    // 左翼内
        g.lineTo(2*s, 82*s);     // 左翼尖
        g.lineTo(20*s, 68*s);    // 左侧
        g.closePath();
        g.fillPath();
        // 机身中线高光
        g.fillStyle(0x44ccff, 0.7);
        g.beginPath();
        g.moveTo(50*s, 8*s);
        g.lineTo(60*s, 55*s);
        g.lineTo(50*s, 90*s);
        g.lineTo(40*s, 55*s);
        g.closePath();
        g.fillPath();
        // 驾驶舱
        g.fillStyle(0xaaddff, 0.8);
        g.fillCircle(50*s, 30*s, 6*s);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(48*s, 28*s, 3*s);
        // 翼尖灯
        g.fillStyle(0x00ff88, 0.9);
        g.fillCircle(5*s, 82*s, 2*s);
        g.fillStyle(0xff3344, 0.9);
        g.fillCircle(95*s, 82*s, 2*s);
        // 引擎发光
        g.fillStyle(0xff6600, 1);
        g.fillCircle(50*s, 96*s, 5*s);
        g.fillStyle(0xffcc00, 1);
        g.fillCircle(50*s, 96*s, 3*s);
        g.generateTexture('player', 100*s, 100*s);
        g.destroy();
    }

    createEnemyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2; // 2x 分辨率
        const w = 60, h = 60;
        // 敌机外侧阴影
        g.fillStyle(0xaa1111, 0.7);
        g.beginPath();
        g.moveTo(w/2*s, h*s);         // 机头（朝下飞）
        g.lineTo(0, 12*s);            // 左翼尖
        g.lineTo(15*s, 20*s);         // 左内翼
        g.lineTo(w/2*s, 2*s);         // 机尾（顶部）
        g.lineTo((w-15)*s, 20*s);     // 右内翼
        g.lineTo(w*s, 12*s);          // 右翼尖
        g.closePath();
        g.fillPath();
        // 敌机机身
        g.fillStyle(0xff3333, 1);
        g.beginPath();
        g.moveTo(w/2*s, (h-2)*s);     // 机头
        g.lineTo(3*s, 14*s);          // 左翼尖
        g.lineTo(16*s, 22*s);         // 左内翼
        g.lineTo(w/2*s, 4*s);         // 机尾
        g.lineTo((w-16)*s, 22*s);     // 右内翼
        g.lineTo((w-3)*s, 14*s);      // 右翼尖
        g.closePath();
        g.fillPath();
        // 机身中心高光条
        g.fillStyle(0xff8866, 0.5);
        g.beginPath();
        g.moveTo(w/2*s, (h-5)*s);
        g.lineTo((w/2+8)*s, 25*s);
        g.lineTo(w/2*s, 8*s);
        g.lineTo((w/2-8)*s, 25*s);
        g.closePath();
        g.fillPath();
        // 驾驶舱
        g.fillStyle(0xffcc44, 0.7);
        g.fillCircle(w/2*s, 38*s, 5*s);
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(w/2*s, 36*s, 3*s);
        // 翼尖灯
        g.fillStyle(0xffaa00, 0.9);
        g.fillCircle(5*s, 14*s, 2*s);
        g.fillCircle((w-5)*s, 14*s, 2*s);
        g.generateTexture('enemy', w*s, h*s);
        g.destroy();
    }

    createBulletTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const s = 2;
        // 子弹外发光
        g.fillStyle(0x00ffff, 0.2);
        g.fillCircle(5*s, 10*s, 6*s);
        // 子弹主体
        g.fillStyle(0x00eeff, 1);
        g.fillRoundedRect(3*s, 0, 4*s, 20*s, 2*s);
        // 子弹高光
        g.fillStyle(0xffffff, 0.9);
        g.fillRoundedRect(4*s, 2*s, 2*s, 16*s, 1*s);
        g.generateTexture('bullet', 10*s, 20*s);
        g.destroy();
    }

    createParticleTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);
        g.destroy();
    }

    createHeartTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xff4444, 1);
        // 简化心形 - 用两个圆和一个三角形
        g.fillCircle(7, 6, 6);
        g.fillCircle(17, 6, 6);
        g.fillTriangle(1, 8, 23, 8, 12, 22);
        g.generateTexture('heart', 24, 24);
        g.destroy();

        // 灰色心形（失去的生命）
        const g2 = this.make.graphics({ x: 0, y: 0, add: false });
        g2.fillStyle(0x444444, 1);
        g2.fillCircle(7, 6, 6);
        g2.fillCircle(17, 6, 6);
        g2.fillTriangle(1, 8, 23, 8, 12, 22);
        g2.generateTexture('heart_gray', 24, 24);
        g2.destroy();
    }

    createStarTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(2, 2, 2);
        g.generateTexture('star', 4, 4);
        g.destroy();
    }
}
