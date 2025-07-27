
// -----------------
// 1. 游戏引擎核心 (The "Engine" Core)
// -----------------
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gameObjects = [];
        this.uiElements = [];
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

    // 添加UI元素到引擎
    addUiElement(ui) {
        ui.engine = this;
        this.uiElements.push(ui);
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

        // 更新UI元素
        for (const ui of this.uiElements) {
            if (ui.update) {
                ui.update(deltaTime);
            }
        }

        // 更新摄像头（例如，跟随玩家）
        if (this.camera) {
            this.camera.update(deltaTime);
        }

        // 2. 处理物理和碰撞
        this.checkCollisions();

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

        // 4. 绘制所有UI元素 (在屏幕空间)
        for (const ui of this.uiElements) {
            if (ui.draw) {
                ui.draw(this.ctx);
            }
        }

        // 请求下一帧
        requestAnimationFrame(this.gameLoop);
    }

    // 碰撞检测循环
    checkCollisions() {
        // 这是一个简单的 O(n^2) 检查，对于少量物体是OK的
        for (let i = 0; i < this.gameObjects.length; i++) {
            for (let j = i + 1; j < this.gameObjects.length; j++) {
                const objA = this.gameObjects[i];
                const objB = this.gameObjects[j];

                // 只有带 shape 属性的对象才参与碰撞
                if (!objA.shape || !objB.shape) continue;

                let collided = false;
                if (objA.shape === 'rect' && objB.shape === 'rect') {
                    collided = Collision.checkAABB(objA, objB);
                } else if (objA.shape === 'circle' && objB.shape === 'rect') {
                    collided = Collision.checkCircleRect(objA, objB);
                } else if (objA.shape === 'rect' && objB.shape === 'circle') {
                    collided = Collision.checkCircleRect(objB, objA);
                }
                // (可以继续添加 circle-circle 等其他检查)

                if (collided) {
                    // 通知两个对象它们发生了碰撞
                    if (objA.onCollision) objA.onCollision(objB);
                    if (objB.onCollision) objB.onCollision(objA);
                }
            }
        }
    }

    // 启动游戏
    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
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
        this.shape = null; // 'rect', 'circle', etc.
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // update(deltaTime) 将在子类中实现，可以通过 this.engine 访问引擎
    // onCollision(other) 将在子类中实现
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

// -----------------
// 5. UI元素基类 (Base UI Element)
// -----------------
class UIElement {
    constructor() {
        this.engine = null; // 将在addUiElement时被引擎设置
    }

    // update(deltaTime) 和 draw(ctx) 将在子类中实现
}

// -----------------
// 6. 碰撞检测工具类 (Collision Utilities)
// -----------------
class Collision {
    // AABB (Axis-Aligned Bounding Box) 矩形与矩形碰撞
    static checkAABB(rectA, rectB) {
        return (
            rectA.x < rectB.x + rectB.width &&
            rectA.x + rectA.width > rectB.x &&
            rectA.y < rectB.y + rectB.height &&
            rectA.y + rectA.height > rectB.y
        );
    }

    // 圆形与矩形碰撞
    static checkCircleRect(circle, rect) {
        // 找到矩形上离圆心最近的点
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        // 计算该点与圆心的距离
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        // 如果距离的平方小于半径的平方，则发生碰撞
        return distanceSquared < (circle.radius * circle.radius);
    }
}