/**
 * game.js - Core Game Loop, State Machine, Particles & UI Rendering
 */

const STATE = {
    READY: 'READY',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER'
};

class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Gravity on particle
        this.life--;
        this.size = Math.max(0, this.size - 0.05);
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class FlappyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.width = 360;
        this.height = 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.groundHeight = 110;
        this.groundY = this.height - this.groundHeight;

        // Các thực thể trong game
        this.background = new Background(this.width, this.height, this.groundHeight);
        this.bird = new Bird(90, this.groundY / 2 - 20, this.groundY);
        this.pipeManager = new PipeManager(this.width, this.height, this.groundY);

        this.particles = [];
        this.state = STATE.READY;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappy_best_score')) || 0;
        this.isNewHighScore = false;

        // Hiệu ứng hình ảnh
        this.flashAlpha = 0;
        this.shakeTimer = 0;
        this.gameOverTimer = 0;

        // Vị trí nút chơi lại trên Canvas
        this.restartBtn = {
            x: this.width / 2 - 65,
            y: 430,
            width: 130,
            height: 44
        };

        this.bindEvents();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    bindEvents() {
        const handleAction = (e) => {
            if (e) {
                // Ngăn chặn cuộn trang trên thiết bị di động
                if (e.cancelable && e.type !== 'keydown') {
                    e.preventDefault();
                }
            }

            if (this.state === STATE.READY) {
                this.startGame();
            } else if (this.state === STATE.PLAYING) {
                this.bird.flap();
                this.createFlapPuff();
            } else if (this.state === STATE.GAMEOVER && this.gameOverTimer > 30) {
                // Kiểm tra nếu click vào khu vực nút hoặc bấm phím
                this.resetGame();
            }
        };

        // Bắt phím Space và Mũi tên lên
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                handleAction(e);
            }
        });

        // Hỗ trợ chuột và cảm ứng trên Canvas
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            if (this.state === STATE.GAMEOVER && this.gameOverTimer > 25) {
                // Kiểm tra click vào nút Restart
                if (
                    clickX >= this.restartBtn.x &&
                    clickX <= this.restartBtn.x + this.restartBtn.width &&
                    clickY >= this.restartBtn.y &&
                    clickY <= this.restartBtn.y + this.restartBtn.height
                ) {
                    this.resetGame();
                    return;
                }
            }
            handleAction(e);
        });

        // Nút bật/tắt âm thanh
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isMuted = window.soundManager.toggleMute();
                soundBtn.textContent = isMuted ? '🔇' : '🔊';
                soundBtn.setAttribute('title', isMuted ? 'Bật âm thanh' : 'Tắt âm thanh');
            });
        }
    }

    startGame() {
        this.state = STATE.PLAYING;
        this.bird.flap();
        this.pipeManager.reset();
        this.createFlapPuff();
    }

    resetGame() {
        this.state = STATE.READY;
        this.score = 0;
        this.isNewHighScore = false;
        this.flashAlpha = 0;
        this.shakeTimer = 0;
        this.gameOverTimer = 0;
        this.particles = [];
        this.bird.reset();
        this.pipeManager.reset();
        if (window.soundManager) {
            window.soundManager.playSwoosh();
        }
    }

    triggerGameOver() {
        if (this.state === STATE.GAMEOVER) return;
        this.state = STATE.GAMEOVER;
        this.bird.alive = false;
        this.flashAlpha = 0.85;
        this.shakeTimer = 12;

        if (window.soundManager) {
            window.soundManager.playHit();
            setTimeout(() => {
                if (window.soundManager) window.soundManager.playFall();
            }, 120);
        }

        // Tạo hiệu ứng va chạm nổ hạt
        this.createHitSparks(this.bird.x, this.bird.y);

        // Lưu kỷ lục nếu có
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.isNewHighScore = true;
            localStorage.setItem('flappy_best_score', this.highScore.toString());
        }
    }

    addScore() {
        this.score++;
        if (window.soundManager) {
            window.soundManager.playScore();
        }
        // Hiệu ứng pháo sáng điểm
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 2;
            this.particles.push(new Particle(
                this.bird.x,
                this.bird.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffd700',
                3.5,
                25
            ));
        }
    }

    createFlapPuff() {
        for (let i = 0; i < 4; i++) {
            this.particles.push(new Particle(
                this.bird.x - 14,
                this.bird.y + 6 + Math.random() * 4,
                -1.2 - Math.random() * 1.5,
                1.0 + (Math.random() - 0.5) * 1.2,
                '#ffffff',
                3,
                18
            ));
        }
    }

    createHitSparks(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 5.5;
            const colors = ['#f85820', '#f8e038', '#ffffff', '#e02020'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1.5,
                color,
                4,
                35
            ));
        }
    }

    update() {
        // Cập nhật rung chấn màn hình
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
        }

        // Cập nhật flash trắng
        if (this.flashAlpha > 0) {
            this.flashAlpha = Math.max(0, this.flashAlpha - 0.08);
        }

        // Cập nhật hạt
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.state === STATE.READY) {
            this.background.update(2.1, true);
            this.bird.updateHover();
        } else if (this.state === STATE.PLAYING) {
            this.background.update(2.1, true);
            this.bird.update();
            this.pipeManager.update(this.bird, () => this.addScore());

            // Kiểm tra va chạm ống cống
            if (this.pipeManager.checkCollision(this.bird)) {
                this.triggerGameOver();
            }

            // Kiểm tra chạm đất
            if (this.bird.y + 12 >= this.groundY) {
                this.triggerGameOver();
            }
        } else if (this.state === STATE.GAMEOVER) {
            this.gameOverTimer++;
            this.bird.update(); // Rơi xuống đất
            this.background.update(0, false); // Dừng cuộn
        }
    }

    draw() {
        this.ctx.save();

        // Hiệu ứng rung màn hình khi đâm trúng
        if (this.shakeTimer > 0) {
            const shakeX = (Math.random() - 0.5) * 8;
            const shakeY = (Math.random() - 0.5) * 8;
            this.ctx.translate(shakeX, shakeY);
        }

        // 1. Vẽ nền (bầu trời, mây, thành phố)
        this.background.drawSky(this.ctx);
        this.background.drawClouds(this.ctx);
        this.background.drawCity(this.ctx);

        // 2. Vẽ ống cống (nằm sau mặt đất)
        this.pipeManager.draw(this.ctx);

        // 3. Vẽ mặt đất
        this.background.drawGround(this.ctx);

        // 4. Vẽ hạt particles
        for (let p of this.particles) {
            p.draw(this.ctx);
        }

        // 5. Vẽ chim
        this.bird.draw(this.ctx);

        // 6. Vẽ UI theo trạng thái
        if (this.state === STATE.READY) {
            this.drawReadyScreen();
        } else if (this.state === STATE.PLAYING) {
            this.drawScore(this.score, this.width / 2, 70, 38);
        } else if (this.state === STATE.GAMEOVER) {
            this.drawGameOverScreen();
        }

        // 7. Hiệu ứng Flash trắng màn hình
        if (this.flashAlpha > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        this.ctx.restore();
    }

    drawReadyScreen() {
        this.ctx.save();
        this.ctx.textAlign = 'center';

        // Tiêu đề game
        this.ctx.font = '900 32px "VT323", "Courier New", monospace';
        this.ctx.fillStyle = '#f8e038';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 5;
        this.ctx.strokeText('FLAPPY BIRD', this.width / 2, 160);
        this.ctx.fillText('FLAPPY BIRD', this.width / 2, 160);

        // Hướng dẫn
        this.ctx.font = '700 16px "VT323", sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('CHẠM HOẶC BẤM SPACE ĐỂ BAY', this.width / 2, 340);
        this.ctx.fillText('CHẠM HOẶC BẤM SPACE ĐỂ BAY', this.width / 2, 340);

        // Vẽ biểu tượng bàn tay / ngón tay gợi ý
        this.drawTapIcon(this.width / 2, 380);

        this.ctx.restore();
    }

    drawTapIcon(x, y) {
        const pulse = Math.sin(Date.now() * 0.006) * 4;
        this.ctx.save();
        this.ctx.translate(x, y + pulse);
        
        // Vòng tròn gợi ý chạm
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 16 + Math.abs(pulse) * 2, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawGameOverScreen() {
        this.ctx.save();
        this.ctx.textAlign = 'center';

        // 1. Dòng chữ GAME OVER
        this.ctx.font = '900 36px "VT323", "Courier New", monospace';
        this.ctx.fillStyle = '#f24822';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 6;
        this.ctx.strokeText('GAME OVER', this.width / 2, 170);
        this.ctx.fillText('GAME OVER', this.width / 2, 170);

        // 2. Hộp bảng điểm (Scoreboard Panel)
        const panelX = 35;
        const panelY = 210;
        const panelW = 290;
        const panelH = 170;

        // Bóng đổ của bảng
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.fillRect(panelX + 4, panelY + 6, panelW, panelH);

        // Khung bảng màu kem retro
        this.ctx.fillStyle = '#ded895';
        this.ctx.strokeStyle = '#553c15';
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);

        // Viền phụ bên trong
        this.ctx.strokeStyle = '#e8e2aa';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX + 4, panelY + 4, panelW - 8, panelH - 8);

        // 3. Khung Huy Chương (Medal Box)
        const medalBoxX = panelX + 22;
        const medalBoxY = panelY + 45;
        const medalBoxSize = 64;

        this.ctx.fillStyle = '#bfae70';
        this.ctx.strokeStyle = '#553c15';
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(medalBoxX, medalBoxY, medalBoxSize, medalBoxSize);
        this.ctx.strokeRect(medalBoxX, medalBoxY, medalBoxSize, medalBoxSize);

        // Chữ "MEDAL"
        this.ctx.font = '700 13px "VT323", sans-serif';
        this.ctx.fillStyle = '#e86100';
        this.ctx.strokeText('MEDAL', medalBoxX + medalBoxSize / 2, panelY + 32);
        this.ctx.fillText('MEDAL', medalBoxX + medalBoxSize / 2, panelY + 32);

        // Vẽ huy chương tương ứng với điểm
        this.drawMedal(medalBoxX + medalBoxSize / 2, medalBoxY + medalBoxSize / 2, this.score);

        // 4. Nhãn & Điểm SCORE
        this.ctx.textAlign = 'right';
        this.ctx.font = '700 14px "VT323", sans-serif';
        this.ctx.fillStyle = '#e86100';
        this.ctx.strokeText('SCORE', panelX + panelW - 24, panelY + 35);
        this.ctx.fillText('SCORE', panelX + panelW - 24, panelY + 35);

        this.drawScore(this.score, panelX + panelW - 24, panelY + 68, 26, 'right');

        // 5. Nhãn & Điểm BEST
        this.ctx.font = '700 14px "VT323", sans-serif';
        this.ctx.fillStyle = '#e86100';
        this.ctx.strokeText('BEST', panelX + panelW - 24, panelY + 105);
        this.ctx.fillText('BEST', panelX + panelW - 24, panelY + 105);

        this.drawScore(this.highScore, panelX + panelW - 24, panelY + 138, 26, 'right');

        // Huy hiệu "NEW" nếu phá kỷ lục
        if (this.isNewHighScore) {
            this.ctx.fillStyle = '#e02020';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.font = '900 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillRect(panelX + panelW - 88, panelY + 95, 36, 16);
            this.ctx.strokeRect(panelX + panelW - 88, panelY + 95, 36, 16);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('NEW', panelX + panelW - 70, panelY + 107);
        }

        // 6. Nút "CHƠI LẠI" (Play Again / Restart)
        if (this.gameOverTimer > 20) {
            const btn = this.restartBtn;
            this.ctx.fillStyle = '#e06000';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

            // Mặt nút bên trong
            this.ctx.fillStyle = '#f87818';
            this.ctx.fillRect(btn.x + 3, btn.y + 3, btn.width - 6, btn.height - 6);

            this.ctx.font = '900 20px "VT323", "Courier New", monospace';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CHƠI LẠI', this.width / 2, btn.y + 28);
        }

        this.ctx.restore();
    }

    drawMedal(cx, cy, score) {
        let color = null;
        let ringColor = null;

        if (score >= 40) {
            color = '#e5e4e2'; // Bạch kim (Platinum)
            ringColor = '#ffffff';
        } else if (score >= 25) {
            color = '#ffd700'; // Vàng (Gold)
            ringColor = '#fff275';
        } else if (score >= 10) {
            color = '#c0c0c0'; // Bạc (Silver)
            ringColor = '#ececec';
        } else if (score >= 5) {
            color = '#cd7f32'; // Đồng (Bronze)
            ringColor = '#e39952';
        }

        if (!color) return; // Dưới 5 điểm không có huy chương

        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#402a10';
        this.ctx.lineWidth = 2.5;

        // Vòng ngoài
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 21, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Viền trong lấp lánh
        this.ctx.strokeStyle = ringColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        this.ctx.stroke();

        // Điểm sáng lóe
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(cx - 7, cy - 7, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawScore(score, x, y, size = 36, align = 'center') {
        this.ctx.save();
        this.ctx.font = `900 ${size}px "VT323", "Courier New", monospace`;
        this.ctx.textAlign = align;
        this.ctx.lineWidth = Math.max(3, Math.floor(size / 7));
        this.ctx.strokeStyle = '#000000';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeText(score.toString(), x, y);
        this.ctx.fillText(score.toString(), x, y);
        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

// Khởi chạy khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
    window.game = new FlappyGame();
});
