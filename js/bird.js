/**
 * bird.js - Flappy Bird Physics, Animation & Vector Rendering
 */
class Bird {
    constructor(x, y, groundY) {
        this.startX = x;
        this.startY = y;
        this.groundY = groundY;

        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 24;

        this.velocity = 0;
        this.gravity = 0.28;
        this.jumpForce = -6.2;
        this.maxVelocity = 9.5;

        this.rotation = 0;
        this.alive = true;

        // Hoạt ảnh vỗ cánh (0: giữa, 1: lên, 2: giữa, 3: xuống)
        this.wingFrame = 0;
        this.wingTimer = 0;
        this.hoverTick = 0;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocity = 0;
        this.rotation = 0;
        this.alive = true;
        this.wingFrame = 0;
        this.wingTimer = 0;
        this.hoverTick = 0;
    }

    flap() {
        if (!this.alive) return;
        this.velocity = this.jumpForce;
        this.rotation = -0.42; // Hướng mỏ lên ~24 độ
        if (window.soundManager) {
            window.soundManager.playFlap();
        }
    }

    // Hoạt ảnh bồng bềnh ở màn hình chờ READY
    updateHover() {
        this.hoverTick += 0.08;
        this.y = this.startY + Math.sin(this.hoverTick) * 5;
        this.rotation = 0;
        
        // Vỗ cánh nhịp nhàng
        this.wingTimer++;
        if (this.wingTimer % 7 === 0) {
            this.wingFrame = (this.wingFrame + 1) % 4;
        }
    }

    update() {
        if (!this.alive) {
            // Khi đã chết chỉ rơi tự do xuống đất
            if (this.y + 12 < this.groundY) {
                this.velocity += this.gravity * 1.5;
                this.y += this.velocity;
                this.rotation = Math.min(Math.PI / 2, this.rotation + 0.1);
            } else {
                this.y = this.groundY - 12;
            }
            return;
        }

        // Tác dụng trọng lực
        this.velocity += this.gravity;
        if (this.velocity > this.maxVelocity) {
            this.velocity = this.maxVelocity;
        }
        this.y += this.velocity;

        // Cập nhật góc chúc đầu mượt mà
        if (this.velocity < 0) {
            this.rotation = -0.38;
        } else if (this.velocity > 1.2) {
            this.rotation += 0.055;
            if (this.rotation > 1.35) { // Tối đa chúc xuống ~77 độ
                this.rotation = 1.35;
            }
        }

        // Chạm trần
        if (this.y - 12 < 0) {
            this.y = 12;
            this.velocity = 0;
        }

        // Hoạt ảnh vỗ cánh phụ thuộc vận tốc
        if (this.velocity < 2.5) {
            this.wingTimer++;
            if (this.wingTimer % 6 === 0) {
                this.wingFrame = (this.wingFrame + 1) % 4;
            }
        } else {
            this.wingFrame = 0; // Giữ cánh cố định khi đang lao dốc
        }
    }

    // Hitbox thu nhỏ nhẹ để công bằng, không ức chế người chơi
    getHitbox() {
        return {
            x: this.x - 13,
            y: this.y - 10,
            width: 26,
            height: 20
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // 1. Thân chim (Hình oval vàng với bóng cam)
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#f8e038'; // Vàng tươi Flappy

        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Bóng đổ nửa thân dưới
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#e0aa10';
        ctx.beginPath();
        ctx.ellipse(-2, 5, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Mắt to đặc trưng
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(7, -5, 6, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Con ngươi & ánh sáng
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(9.5, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(10.5, -6.5, 1, 0, Math.PI * 2);
        ctx.fill();

        // 3. Mỏ vịt / môi cam
        ctx.fillStyle = '#f85820';
        ctx.beginPath();
        ctx.moveTo(9, -1);
        ctx.lineTo(19, 2);
        ctx.lineTo(8, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Viền chia đôi mỏ
        ctx.beginPath();
        ctx.moveTo(10, 2.5);
        ctx.lineTo(18, 2.5);
        ctx.stroke();

        // 4. Cánh chim theo các trạng thái (wingFrame)
        // 0: giữa, 1: vểnh lên, 2: giữa, 3: cụp xuống
        const wingWingModes = [0, -1, 0, 1];
        const mode = wingWingModes[this.wingFrame];

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (mode === -1) {
            // Cánh chếch lên
            ctx.ellipse(-6, -6, 7.5, 4.5, -0.4, 0, Math.PI * 2);
        } else if (mode === 1) {
            // Cánh cụp xuống
            ctx.ellipse(-6, 3, 7.5, 4.5, 0.4, 0, Math.PI * 2);
        } else {
            // Cánh ngang
            ctx.ellipse(-6, -1, 7.5, 5, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

window.Bird = Bird;
