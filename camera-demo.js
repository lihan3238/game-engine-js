// -----------------
// 1. 游戏对象 (GameObjects for the Demo)
// -----------------

// 玩家
class Player extends GameObject {
    constructor(x, y, size, color, speed) {
        super(x, y, size, size, color);
        this.speed = speed;
        this.keys = {}; // 用于存储按键状态

        // 监听按键事件
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    }

    update(deltaTime) {
        let dx = 0;
        let dy = 0;

        // 根据按键更新移动方向 (支持 WASD 和方向键)
        if (this.keys['arrowup'] || this.keys['w']) dy = -1;
        if (this.keys['arrowdown'] || this.keys['s']) dy = 1;
        if (this.keys['arrowleft'] || this.keys['a']) dx = -1;
        if (this.keys['arrowright'] || this.keys['d']) dx = 1;

        // 归一化对角线移动速度，防止斜向移动过快
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;
    }
}

// -----------------
// 2. 初始化游戏 (Initialize the Game)
// -----------------
const engine = new GameEngine('gameCanvas');

// 创建一个巨大的世界背景作为参考
const worldSize = 2000;
const worldBounds = new GameObject(-worldSize / 2, -worldSize / 2, worldSize, worldSize, '#f0f0f0');
engine.addGameObject(worldBounds);

// 随机创建一些 "树" 作为障碍物/装饰
for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * worldSize;
    const y = (Math.random() - 0.5) * worldSize;
    const size = Math.random() * 40 + 20;
    const tree = new GameObject(x, y, size, size, 'seagreen');
    engine.addGameObject(tree);
}

// 创建玩家
const player = new Player(0, 0, 40, 'royalblue', 300);
engine.addGameObject(player);

// 让摄像头跟随玩家
engine.camera.follow(player);

// 添加鼠标滚轮缩放功能
engine.canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // 防止页面滚动
    const zoomAmount = 0.1;
    if (e.deltaY < 0) {
        // 放大
        engine.camera.zoom += zoomAmount;
    } else {
        // 缩小
        engine.camera.zoom -= zoomAmount;
    }
    // 限制缩放范围
    engine.camera.zoom = Math.max(0.3, Math.min(2.5, engine.camera.zoom));
});

// 启动游戏！
engine.start();