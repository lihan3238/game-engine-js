// -----------------
// 1. 游戏对象 (GameObjects for the Demo)
// -----------------

// 玩家
class Player extends GameObject {
    constructor(x, y, size, color, speed) {
        super(x, y, size, size, color);
        this.speed = speed;
    }

    update(deltaTime) {
        let dx = 0;
        let dy = 0;

        // 从引擎获取输入管理器
        const input = this.engine.input;

        // 根据按键更新移动方向 (支持 WASD 和方向键)
        if (input.isKeyDown('arrowup') || input.isKeyDown('w')) dy = -1;
        if (input.isKeyDown('arrowdown') || input.isKeyDown('s')) dy = 1;
        if (input.isKeyDown('arrowleft') || input.isKeyDown('a')) dx = -1;
        if (input.isKeyDown('arrowright') || input.isKeyDown('d')) dx = 1;

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
// 2. UI 元素 (UI Elements for the Demo)
// -----------------

class PlayerCoordsUI extends UIElement {
    constructor(playerToTrack) {
        super();
        this.player = playerToTrack;
        this.x = 15; // 屏幕坐标 X
        this.y = 35; // 屏幕坐标 Y
        this.color = 'grey';
        this.font = '24px Arial';
    }

    draw(ctx) {
        const playerX = this.player.x.toFixed(0);
        const playerY = this.player.y.toFixed(0);
        const text = `Player Coords: (${playerX}, ${playerY})`;

        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.fillText(text, this.x, this.y);
    }
}

// -----------------
// 3. 初始化游戏 (Initialize the Game)
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

// 创建并添加UI元素
const coordsDisplay = new PlayerCoordsUI(player);
engine.addUiElement(coordsDisplay);

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