
// -----------------
// 1. 游戏引擎核心 (The "Engine" Core)
// -----------------
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gameObjects = [];
        this.input = new InputManager();
        this.camera = new Camera();
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

        // 更新摄像头（例如，跟随玩家）
        if (this.camera) {
            this.camera.update(deltaTime);
        }

        // 2. 处理物理和碰撞
        // this.checkCollisions();

        // 2. 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 3. 绘制所有游戏对象
        // --- 应用摄像头变换 ---
        this.ctx.save(); // 保存默认状态
        if (this.camera) {
            this.camera.applyTransforms(this.ctx);
        }

        for (const obj of this.gameObjects) {
            if (obj.draw) {
                obj.draw(this.ctx);
            }
        }

        this.ctx.restore(); // 恢复默认状态，以便绘制UI等
        // 请求下一帧
        requestAnimationFrame(this.gameLoop);
    }

    // 启动游戏
    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
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
// 2. 摄像头 (Camera)
// -----------------
class Camera {
    constructor(x = 0, y = 0, zoom = 1) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
        this.target = null; // 要跟随的游戏对象
        this.lerpFactor = 0.08; // 平滑移动的插值因子 (0 to 1)
    }

    // 设置摄像头跟随的目标
    follow(gameObject) {
        this.target = gameObject;
    }

    // 更新摄像头位置以平滑跟随目标
    update(deltaTime) {
        if (!this.target) return;

        // 目标中心点
        const targetX = this.target.x + this.target.width / 2;
        const targetY = this.target.y + this.target.height / 2;

        // 使用线性插值 (lerp) 实现平滑跟随
        this.x += (targetX - this.x) * this.lerpFactor;
        this.y += (targetY - this.y) * this.lerpFactor;
    }

    // 将摄像头的变换应用到画布上
    applyTransforms(ctx) {
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }
}

// -----------------
// 3. 游戏对象基类 (Base GameObject)
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

// -----------------
// 4. 输入管理器 (Input Manager)
// -----------------
class InputManager {
    constructor() {
        this.keys = new Set();

        document.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
        });

        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });
    }

    isKeyDown(key) {
        return this.keys.has(key.toLowerCase());
    }
}