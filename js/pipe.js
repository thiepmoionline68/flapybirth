/**
 * pipe.js - Pipe Generation, Classic Tube Rendering & Collision Detection
 */
class PipePair {
    constructor(x, groundY, gap = 130, width = 52) {
        this.x = x;
        this.width = width;
        this.groundY = groundY;
        this.gap = gap;
        this.passed = false;

        // Chiều cao ngẫu nhiên hợp lý cho khe hở
        const minHeight = 60;
        const availableSpace = groundY - gap - minHeight * 2;
        this.topHeight = minHeight + Math.floor(Math.random() * Math.max(10, availableSpace));
        this.bottomY = this.topHeight + this.gap;
        this.bottomHeight = groundY - this.bottomY;

        this.capHeight = 24;
        this.capLip = 3; // Mép gờ ống nhô ra 3px mỗi bên
    }

    update(speed) {
        this.x -= speed;
    }

    // Kiểm tra va chạm với hitbox của chim
    checkCollision(hitbox) {
        // 1. Va chạm ống trên
        if (this.rectIntersect(
            hitbox.x, hitbox.y, hitbox.width, hitbox.height,
            this.x, 0, this.width, this.topHeight
        )) {
            return true;
        }

        // 2. Va chạm ống dưới
        if (this.rectIntersect(
            hitbox.x, hitbox.y, hitbox.width, hitbox.height,
            this.x, this.bottomY, this.width, this.bottomHeight
        )) {
            return true;
        }

        return false;
    }

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return (
            x1 < x2 + w2 &&
            x1 + w1 > x2 &&
            y1 < y2 + h2 &&
            y1 + h1 > y2
        );
    }

    draw(ctx) {
        // 1. Vẽ ống trên (chúc xuống)
        this.drawPipeSection(ctx, this.x, 0, this.width, this.topHeight, true);

        // 2. Vẽ ống dưới (chổng lên)
        this.drawPipeSection(ctx, this.x, this.bottomY, this.width, this.bottomHeight, false);
    }

    drawPipeSection(ctx, x, y, w, h, isTop) {
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';

        // A. Thân ống
        const bodyY = isTop ? 0 : y + this.capHeight;
        const bodyH = isTop ? h - this.capHeight : h - this.capHeight;

        if (bodyH > 0) {
            // Nền xanh lá chính
            ctx.fillStyle = '#73be2e';
            ctx.fillRect(x, bodyY, w, bodyH);
            ctx.strokeRect(x, bodyY, w, bodyH);

            // Vạch sáng viền trái (Highlight)
            ctx.fillStyle = '#9ce659';
            ctx.fillRect(x + 3, bodyY, 6, bodyH);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(x + 5, bodyY, 2, bodyH);

            // Bóng tối bên phải (Shadow)
            ctx.fillStyle = '#558822';
            ctx.fillRect(x + w - 8, bodyY, 6, bodyH);
        }

        // B. Nắp miệng ống (Cap)
        const capY = isTop ? h - this.capHeight : y;
        const capX = x - this.capLip;
        const capW = w + this.capLip * 2;

        ctx.fillStyle = '#73be2e';
        ctx.fillRect(capX, capY, capW, this.capHeight);
        ctx.strokeRect(capX, capY, capW, this.capHeight);

        // Vệt sáng nắp
        ctx.fillStyle = '#9ce659';
        ctx.fillRect(capX + 4, capY, 7, this.capHeight);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(capX + 6, capY, 2, this.capHeight);

        // Bóng tối nắp
        ctx.fillStyle = '#558822';
        ctx.fillRect(capX + capW - 9, capY, 7, this.capHeight);

        ctx.restore();
    }
}

class PipeManager {
    constructor(canvasWidth, canvasHeight, groundY) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.groundY = groundY;

        this.pipes = [];
        this.speed = 2.1;
        this.spawnDistance = 175;
        this.lastSpawnX = 0;
    }

    reset() {
        this.pipes = [];
        this.lastSpawnX = this.canvasWidth + 60;
        this.spawnPipe(this.lastSpawnX);
    }

    spawnPipe(x) {
        this.pipes.push(new PipePair(x, this.groundY, 132, 52));
        this.lastSpawnX = x;
    }

    update(bird, onScore) {
        // Cập nhật vị trí từng ống
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.update(this.speed);

            // Kiểm tra tính điểm khi chim bay qua ống
            if (!pipe.passed && bird.x > pipe.x + pipe.width) {
                pipe.passed = true;
                if (onScore) onScore();
            }

            // Xóa ống khi đã đi khỏi mép trái màn hình
            if (pipe.x + pipe.width + 10 < 0) {
                this.pipes.splice(i, 1);
            }
        }

        // Tự động sinh ống mới khi ống cuối cùng đã đi được khoảng cách spawnDistance
        const lastPipe = this.pipes[this.pipes.length - 1];
        if (lastPipe && lastPipe.x <= this.canvasWidth - this.spawnDistance) {
            this.spawnPipe(this.canvasWidth);
        }
    }

    checkCollision(bird) {
        const hitbox = bird.getHitbox();
        for (let pipe of this.pipes) {
            if (pipe.checkCollision(hitbox)) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        for (let pipe of this.pipes) {
            pipe.draw(ctx);
        }
    }
}

window.PipeManager = PipeManager;
