
// -----------------
// 3. 具体的游戏对象 (Specific GameObjects for Breakout)
// -----------------

// 玩家的挡板
class Paddle extends GameObject {
    constructor(x, y, width, height, color, speed) {
        super(x, y, width, height, color);
        this.speed = speed;
        this.shape = 'rect';
    }

    update(deltaTime) {
        const input = this.engine.input;
        let dx = 0;

        if (input.isKeyDown('arrowleft')) dx = -1;
        if (input.isKeyDown('arrowright')) dx = 1;

        this.x += dx * this.speed * deltaTime;

        const gameWidth = this.engine.canvas.width;
        // 边界检测
        const halfGameWidth = gameWidth / 2;
        if (this.x < -halfGameWidth) this.x = -halfGameWidth;
        if (this.x + this.width > halfGameWidth) {
            this.x = halfGameWidth - this.width;
        }
    }
}

// 小球
class Ball extends GameObject {
    constructor(x, y, radius, color, speed) {
        // GameObject需要width/height，我们用它来粗略代表球
        super(x, y, radius * 2, radius * 2, color);
        this.radius = radius;
        this.shape = 'circle';
        this.speed = speed;
        this.vx = speed; // x方向速度
        this.vy = -speed; // y方向速度
    }

    update(deltaTime) {
        // 我们将小球的中心点作为它的 x, y
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        const gameWidth = this.engine.canvas.width;
        const gameHeight = this.engine.canvas.height;
        const halfGameWidth = gameWidth / 2;
        const halfGameHeight = gameHeight / 2;

        // 边界碰撞 (基于中心点和半径)
        // 水平边界
        if (this.x - this.radius < -halfGameWidth) {
            this.x = -halfGameWidth + this.radius; // 弹出
            this.vx = -this.vx;
        } else if (this.x + this.radius > halfGameWidth) {
            this.x = halfGameWidth - this.radius; // 弹出
            this.vx = -this.vx;
        }
        // 顶部边界
        if (this.y - this.radius < -halfGameHeight) {
            this.y = -halfGameHeight + this.radius; // 弹出
            this.vy = -this.vy;
        }
        // 游戏结束的逻辑 (简化版)
        if (this.y + this.radius > halfGameHeight) {
            console.log("Game Over");
            this.x = 0; // 重置到世界中心
            this.y = 0;
            this.vy = -this.vy;
        }
    }

    onCollision(other) {
        if (other instanceof Paddle || other instanceof Brick) {
            this.vy = -this.vy; // 1. 反转垂直速度
            // 2. 将球“弹出”碰撞体。这个简化的实现假设球总是从上方撞击。
            this.y = other.y - this.radius; // 将球的底部精确地放在碰撞物体的顶部
        }
    }

    draw(ctx) {
        // 绘制时使用中心点 x, y
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

// 砖块
class Brick extends GameObject {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
        this.shape = 'rect';
        this.isVisible = true;
    }

    onCollision(other) {
        if (other instanceof Ball) {
            this.isVisible = false;
            // 从引擎中移除，以停止其 update 和 draw
            this.engine.gameObjects = this.engine.gameObjects.filter(obj => obj !== this);
        }
    }

    draw(ctx) {
        if (this.isVisible) {
            super.draw(ctx);
        }
    }
}


// -----------------
// 4. 初始化游戏 (Initialize the Game)
// -----------------
const engine = new GameEngine('gameCanvas');

// 为了适应摄像头，我们将游戏区域的中心点视为世界的 (0,0)
const gameWidth = engine.canvas.width;
const gameHeight = engine.canvas.height;

// 创建游戏对象
// 将挡板和球的位置与画布尺寸关联
const paddleWidth = 120;
const paddleHeight = 20;
const paddle = new Paddle(
    -paddleWidth / 2, // 水平居中于世界 x=0
    gameHeight / 2 - paddleHeight - 30, // 靠近世界底部
    paddleWidth,
    paddleHeight,
    'cyan',
    600
);
const ball = new Ball(
    0, // 世界中心 x=0
    gameHeight / 2 - paddleHeight - 50, // 在挡板上方
    12, // 让球大一点，更容易看清
    'magenta',
    400
);

// 添加到引擎
engine.addGameObject(paddle);
engine.addGameObject(ball);

// 创建砖块 (关卡数据)
const brickRowCount = 6;
const brickColumnCount = 11;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 5;
const brickOffsetTop = 30;
// 计算左侧偏移量以使砖块居中
const bricksTotalWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
const brickOffsetLeft = -bricksTotalWidth / 2; // 居中于世界 x=0

for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
        const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop - (gameHeight / 2); // 靠近世界顶部
        const brick = new Brick(brickX, brickY, brickWidth, brickHeight, 'orange');
        engine.addGameObject(brick);
    }
}


// 启动游戏！
engine.start();