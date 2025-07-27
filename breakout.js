
// -----------------
// 3. 具体的游戏对象 (Specific GameObjects for Breakout)
// -----------------

// 玩家的挡板
class Paddle extends GameObject {
    constructor(x, y, width, height, color, speed) {
        super(x, y, width, height, color);
        this.speed = speed;
        this.dx = 0; // 移动方向

        // 输入处理
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.dx = -1;
            if (e.key === 'ArrowRight') this.dx = 1;
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') this.dx = 0;
        });
    }

    update(deltaTime) {
        this.x += this.dx * this.speed * deltaTime;

        // 边界检测
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.engine.canvas.width) {
            this.x = this.engine.canvas.width - this.width;
        }
    }
}

// 小球
class Ball extends GameObject {
    constructor(x, y, radius, color, speed) {
        // GameObject需要width/height，我们用它来粗略代表球
        super(x, y, radius * 2, radius * 2, color);
        this.radius = radius;
        this.speed = speed;
        this.vx = speed; // x方向速度
        this.vy = -speed; // y方向速度
    }

    update(deltaTime) {
        // 我们将小球的中心点作为它的 x, y
        // 但GameObject的x,y是左上角，这里需要注意
        // 为了简化，我们暂时忽略这个差异，因为update只移动中心点
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // 边界碰撞 (基于中心点和半径)
        if (this.x - this.radius < 0 || this.x + this.radius > this.engine.canvas.width) {
            this.vx = -this.vx;
        }
        if (this.y - this.radius < 0) {
            this.vy = -this.vy;
        }
        // 游戏结束的逻辑 (简化版)
        if (this.y + this.radius > this.engine.canvas.height) {
            console.log("Game Over");
            // 在真实引擎中，这里会触发一个状态改变
            this.x = this.engine.canvas.width / 2;
            this.y = this.engine.canvas.height / 2;
            this.vy = -this.vy;
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
        this.isVisible = true;
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

// 创建游戏对象
// 将挡板和球的位置与画布尺寸关联
const paddleWidth = 120;
const paddleHeight = 20;
const paddle = new Paddle(
    (engine.canvas.width - paddleWidth) / 2,
    engine.canvas.height - paddleHeight - 30,
    paddleWidth,
    paddleHeight,
    'cyan',
    600
);
const ball = new Ball(
    engine.canvas.width / 2,
    engine.canvas.height - paddleHeight - 50,
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
const brickOffsetLeft = (engine.canvas.width - bricksTotalWidth) / 2;

for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
        const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        const brick = new Brick(brickX, brickY, brickWidth, brickHeight, 'orange');
        engine.addGameObject(brick);
    }
}


// 启动游戏！
engine.start();