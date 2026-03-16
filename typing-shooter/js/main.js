/**
 * 打字射击游戏 - 主入口
 * 配置 Phaser 游戏实例，注册所有场景
 */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 400,
            height: 300
        },
        max: {
            width: 1200,
            height: 900
        }
    },
    scene: [
        BootScene,
        MenuScene,
        LevelSelectScene,
        CustomScene,
        WordLibScene,
        GameScene,
        GameOverScene
    ]
};

const game = new Phaser.Game(config);

// 监听窗口大小变化，动态调整画布
window.addEventListener('resize', () => {
    game.scale.refresh();
});
