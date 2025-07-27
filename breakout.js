
let isGameStarted = false;
let isGameOver = false;

// 添加重置游戏的函数
function resetGame() {
    // 重置游戏状态
    isGameStarted = false;
    isGameOver = false;
    
    // 重置球的位置和速度
    ball.x = -ball.width / 2;
    ball.y = gameHeight / 2 - paddleHeight - 30 - ball.height;
    ball.vx = ball.speed;
    ball.vy = -ball.speed;
    
    // 重置挡板位置
    paddle.x = -paddle.width / 2;
    
    // 重新创建所有砖块
    // 首先移除所有现有的砖块
    engine.gameObjects = engine.gameObjects.filter(obj => !(obj instanceof Brick));
    
    // 然后重新创建砖块
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop - (gameHeight / 2);
            const brick = new Brick(brickX, brickY, brickWidth, brickHeight, 'orange');
            engine.addGameObject(brick);
        }
    }
}

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
        if (!isGameStarted || isGameOver) return;

        const input = this.engine.input;
        let dx = 0;

        if (input.isKeyDown('arrowleft')) dx = -1;
        if (input.isKeyDown('arrowright')) dx = 1;

        this.x += dx * this.speed * deltaTime;

        const gameWidth = this.engine.canvas.width;
        const halfGameWidth = gameWidth / 2;
        if (this.x < -halfGameWidth) this.x = -halfGameWidth;
        if (this.x + this.width > halfGameWidth) {
            this.x = halfGameWidth - this.width;
        }
    }

}

// 小球
class Ball extends GameObject {
    constructor(x, y, size, color, speed) {
        // 现在球是一个正方形
        super(x, y, size, size, color);
        this.shape = 'rect'; // 形状是矩形，用于碰撞检测
        this.speed = speed;
        this.vx = speed; // x方向速度
        this.vy = -speed; // y方向速度
    }

    update(deltaTime) {
        if (!isGameStarted || isGameOver) return;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        const gameWidth = this.engine.canvas.width;
        const gameHeight = this.engine.canvas.height;
        const halfGameWidth = gameWidth / 2;
        const halfGameHeight = gameHeight / 2;

        // 边界碰撞检测
        if (this.x < -halfGameWidth) {
            this.x = -halfGameWidth;
            this.vx = -this.vx;
        } else if (this.x + this.width > halfGameWidth) {
            this.x = halfGameWidth - this.width;
            this.vx = -this.vx;
        }

        if (this.y < -halfGameHeight) {
            this.y = -halfGameHeight;
            this.vy = -this.vy;
        }

        if (this.y + this.height > halfGameHeight) {
            console.log("Game Over");
            isGameOver = true;
        }
    }


    onCollision(other, collisionResult) {
        if (other instanceof Paddle || other instanceof Brick) {
            this.x += collisionResult.penetration.x;
            this.y += collisionResult.penetration.y;

            // 根据碰撞的法线方向（由穿透向量体现）来反转速度
            // 这是一个更鲁棒的方法，适用于任意角度的碰撞
            const pen = collisionResult.penetration;
            if (Math.abs(pen.x) > Math.abs(pen.y)) {
                // 水平碰撞
                this.vx = -this.vx;
            } else {
                // 垂直碰撞
                this.vy = -this.vy;
            }
        }
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

class StartUI extends UIElement {
    draw(ctx) {
        if (!isGameStarted && !isGameOver) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';

            const cx = ctx.canvas.width / 2;
            const cy = ctx.canvas.height / 2;

            ctx.fillText('Press SPACE to start', cx, cy - 30);
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText('Use ← → to move', cx, cy + 20);
        } else if (isGameOver) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 64px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', ctx.canvas.width / 2, ctx.canvas.height / 2 - 30);
            
            // 修改为空格键重启提示
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText('Press SPACE to restart', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
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

const ballSize = 20; // 球的大小
const ball = new Ball(
    -ballSize / 2, // 水平居中
    gameHeight / 2 - paddleHeight - 30 - ballSize, // 在挡板正上方
    ballSize,
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

const startUI = new StartUI();
engine.addUiElement(startUI);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!isGameStarted && !isGameOver) {
            // 开始新游戏
            isGameStarted = true;
        } else if (isGameOver) {
            // 重启游戏
            resetGame();
        }
    }
});


// 启动游戏！
engine.start();