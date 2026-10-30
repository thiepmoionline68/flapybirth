/**
 * background.js - Parallax Retro Background & Animated Ground
 */
class Background {
    constructor(canvasWidth, canvasHeight, groundHeight = 110) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.groundHeight = groundHeight;
        this.groundY = canvasHeight - groundHeight;

        this.groundOffset = 0;
        this.cloudOffset = 0;
        this.cityOffset = 0;

        // Định vị các đám mây cố định tương đối
        this.clouds = [
            { x: 30, y: 70, scale: 0.9, speed: 0.3 },
            { x: 190, y: 110, scale: 0.65, speed: 0.25 },
            { x: 320, y: 50, scale: 0.8, speed: 0.28 }
        ];

        // Thành phố đường chân trời
        this.buildings = [
            { w: 35, h: 65, color: '#97d8b2' },
            { w: 25, h: 85, color: '#88cca3' },
            { w: 40, h: 50, color: '#97d8b2' },
            { w: 30, h: 100, color: '#7ebb97' },
            { w: 45, h: 70, color: '#88cca3' },
            { w: 35, h: 80, color: '#97d8b2' },
            { w: 28, h: 60, color: '#7ebb97' },
            { w: 42, h: 90, color: '#88cca3' },
            { w: 32, h: 75, color: '#97d8b2' },
            { w: 38, h: 95, color: '#7ebb97' }
        ];
    }

    update(speed, isMoving = true) {
        if (!isMoving) return;
        
        this.groundOffset = (this.groundOffset + speed) % 24;
        this.cityOffset = (this.cityOffset + speed * 0.3) % 350;

        // Cập nhật vị trí mây
        for (let cloud of this.clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x + 80 * cloud.scale < 0) {
                cloud.x = this.width + 40;
            }
        }
    }

    draw(ctx) {
        this.drawSky(ctx);
        this.drawClouds(ctx);
        this.drawCity(ctx);
        this.drawGround(ctx);
    }

    drawSky(ctx) {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGradient.addColorStop(0, '#4ec0ca');
        skyGradient.addColorStop(0.7, '#7cd8e0');
        skyGradient.addColorStop(1, '#a8eaf0');

        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.groundY);
    }

    drawClouds(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.save();
        for (let cloud of this.clouds) {
            this.drawSingleCloud(ctx, cloud.x, cloud.y, cloud.scale);
        }
        ctx.restore();
    }

    drawSingleCloud(ctx, x, y, s) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.beginPath();
        ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
        ctx.arc(x + 18 * s, y - 10 * s, 26 * s, 0, Math.PI * 2);
        ctx.arc(x + 42 * s, y - 6 * s, 22 * s, 0, Math.PI * 2);
        ctx.arc(x + 58 * s, y + 2 * s, 16 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawCity(ctx) {
        ctx.save();
        const baseLineY = this.groundY;
        let startX = -this.cityOffset;

        // Vẽ 2 vòng lặp để nối liên tục không bị gián đoạn
        for (let loop = 0; loop < 3; loop++) {
            let curX = startX + loop * 350;
            for (let b of this.buildings) {
                ctx.fillStyle = b.color;
                ctx.fillRect(curX, baseLineY - b.h, b.w, b.h);
                // Viền nhẹ
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(curX, baseLineY - b.h, 2, b.h);
                // Vài ô cửa sổ nhỏ
                ctx.fillStyle = 'rgba(255, 255, 220, 0.45)';
                for (let wy = baseLineY - b.h + 10; wy < baseLineY - 12; wy += 16) {
                    for (let wx = curX + 6; wx < curX + b.w - 8; wx += 10) {
                        ctx.fillRect(wx, wy, 4, 6);
                    }
                }
                curX += b.w;
            }
        }
        ctx.restore();
    }

    drawGround(ctx) {
        const y = this.groundY;
        const h = this.groundHeight;

        // 1. Nền đất chính
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, y, this.width, h);

        // 2. Viền cỏ xanh phía trên
        ctx.fillStyle = '#73be2e';
        ctx.fillRect(0, y, this.width, 14);

        // Lớp cỏ sáng highlight
        ctx.fillStyle = '#9ce659';
        ctx.fillRect(0, y, this.width, 3);

        // Ranh giới cỏ và đất
        ctx.fillStyle = '#558822';
        ctx.fillRect(0, y + 14, this.width, 3);

        // 3. Họa tiết vạch chéo kinh điển của đất cuộn
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y + 17, this.width, h - 17);
        ctx.clip();

        ctx.fillStyle = '#c8b066';
        const stripeWidth = 12;
        const patternWidth = 24;
        const totalStripes = Math.ceil(this.width / patternWidth) + 3;

        for (let i = -2; i < totalStripes; i++) {
            const sx = i * patternWidth - this.groundOffset;
            ctx.beginPath();
            ctx.moveTo(sx, y + 17);
            ctx.lineTo(sx + stripeWidth, y + 17);
            ctx.lineTo(sx + stripeWidth - 14, y + h);
            ctx.lineTo(sx - 14, y + h);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // Viền trên cùng ngăn cách
        ctx.fillStyle = '#402a10';
        ctx.fillRect(0, y, this.width, 2);
    }
}

window.Background = Background;
