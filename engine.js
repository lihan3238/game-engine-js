
// -----------------
// 1. 游戏引擎核心 (The "Engine" Core)
// -----------------
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gameObjects = [];
        this.lastTime = 0;

        // 绑定 this
        this.gameLoop = this.gameLoop.bind(this);
        this.resizeCanvas = this.resizeCanvas.bind(this);

        // 设置初始尺寸并监听窗口变化
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas);
    }

    // 调整画布尺寸以适应窗口
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // 注意：更复杂的引擎可能会在这里重新计算所有对象的位置。
        // 目前我们的游戏对象会在自己的update中适应新尺寸，这已经足够了。
    }

    // 添加游戏对象到引擎
    addGameObject(obj) {
        // 关键一步：让游戏对象持有对引擎的引用
        // 这样，每个对象都能访问画布尺寸等全局信息
        obj.engine = this;
        this.gameObjects.push(obj);
    }

    // 游戏循环
    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000; // 转换为秒
        this.lastTime = timestamp;

        // 1. 更新游戏状态
        for (const obj of this.gameObjects) {
            if (obj.update) {
                obj.update(deltaTime);
            }
        }

        // 2. 处理物理和碰撞
        this.checkCollisions();

        // 2. 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 3. 绘制所有游戏对象
        for (const obj of this.gameObjects) {
            if (obj.draw) {
                obj.draw(this.ctx);
            }
        }

        // 请求下一帧
        requestAnimationFrame(this.gameLoop);
    }

    // 启动游戏
    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    checkCollisions() {
        const ball = this.gameObjects.find(obj => obj instanceof Ball);
        if (!ball) return;

        for (const obj of this.gameObjects) {
            if (obj === ball) continue;

            // 使用一个简单的矩形碰撞检测函数
            if (this.isColliding(ball, obj)) {
                if (obj instanceof Paddle) {
                    ball.vy = -ball.vy;
                    // 让小球从挡板上弹开，防止粘连
                    ball.y = obj.y - ball.radius * 2;

                    // 增加趣味性：根据撞击点改变小球水平速度
                    let collidePoint = ball.x - (obj.x + obj.width / 2);
                    // 标准化撞击点: -1 (左侧) to 1 (右侧)
                    let normalizedCollidePoint = collidePoint / (obj.width / 2);
                    // 改变vx，让反弹角度更丰富
                    ball.vx = normalizedCollidePoint * Math.abs(ball.speed);
                }

                if (obj instanceof Brick && obj.isVisible) {
                    obj.isVisible = false;
                    ball.vy = -ball.vy;
                    // 可以在这里添加得分逻辑
                }
            }
        }
    }

    // AABB 碰撞检测
    isColliding(objA, objB) {
        // 为了让小球的碰撞更精确，我们使用它的中心和半径来定义包围盒
        let boxA = {
            x: objA.x - objA.radius,
            y: objA.y - objA.radius,
            width: objA.radius * 2,
            height: objA.radius * 2
        };

        let boxB = {
            x: objB.x,
            y: objB.y,
            width: objB.width,
            height: objB.height
        };

        return boxA.x < boxB.x + boxB.width &&
            boxA.x + boxA.width > boxB.x &&
            boxA.y < boxB.y + boxB.height &&
            boxA.y + boxA.height > boxB.y;
    }
}

// -----------------
// 2. 游戏对象基类 (Base GameObject)
// -----------------
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.engine = null; // 对引擎的引用，将在addGameObject时被设置
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // update(deltaTime) 将在子类中实现，可以通过 this.engine 访问引擎
}