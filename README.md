# Flappy Bird Web Game 🐤

Dự án game **Flappy Bird** cổ điển được xây dựng hoàn toàn bằng **HTML5 Canvas, CSS3 và Vanilla JavaScript (ES6+)**.

---

## 🌟 Tính Năng Nổi Bật

- **Đồ họa Canvas Vector/Pixel sắc nét:** Không dùng ảnh ngoài, không sợ vỡ hình hay giật lag trên các màn hình Retina / 4K.
- **Hệ thống âm thanh Retro (Web Audio API):** Tự động tổng hợp âm thanh 8-bit (tiếng vỗ cánh, ghi điểm, va chạm, rơi tự do) trực tiếp bằng mã lệnh, không cần file `.mp3` ngoài.
- **Vật lý chim chân thực:** Gia tốc trọng lực, lực nhảy, hiệu ứng xoay góc ngẩng/chúc đầu mượt mà, hoạt ảnh đập cánh 3 khung hình.
- **Hiệu ứng thị giác (VFX):**
  - Màn hình nền Parallax cuộn mây, thành phố và mặt đất.
  - Hiệu ứng hạt bụi (puff) khi chim vỗ cánh.
  - Hiệu ứng lóe sáng (flash) và rung màn hình (shake) khi va chạm.
  - Hiệu ứng pháo sáng (sparks) khi ghi điểm.
- **Bảng điểm & Huy chương:**
  - Hiển thị điểm số hiện tại và điểm kỷ lục (**Best Score**).
  - Tự động lưu kỷ lục vào `localStorage`.
  - Huy chương theo mốc điểm: **Đồng** (≥5), **Bạc** (≥10), **Vàng** (≥25), **Bạch kim** (≥40).
- **Hỗ trợ đa nền tảng (Desktop & Mobile):**
  - **Máy tính:** Phím `Space`, phím `Mũi tên lên (↑)` hoặc Click chuột trái.
  - **Điện thoại / Tablet:** Chạm (Tap) ngón tay bất kỳ đâu trên màn hình.
  - Nút bật/tắt âm thanh tiện lợi ở góc trên bên phải.

---

## 🎮 Cách Chơi

1. **Cách mở game:**
   - Bạn chỉ cần **nhấp đúp chuột vào file `index.html`** để mở trực tiếp trong trình duyệt web (Chrome, Edge, Firefox, Safari,...).
   - Không cần cài đặt Node.js hay bất kỳ phần mềm/server nào khác!
2. **Bắt đầu chơi:**
   - Nhấn phím `Space`, click chuột hoặc chạm màn hình để chim bay lên.
   - Luồn lách qua các khe hở giữa các ống cống màu xanh.
   - Mỗi lần vượt qua 1 cặp ống, bạn được cộng 1 điểm.
   - Nếu chim va vào ống cống hoặc rơi chạm đất, trò chơi sẽ kết thúc.
3. **Chơi lại:**
   - Nhấn vào nút **CHƠI LẠI** hoặc bấm lại phím `Space` / chạm màn hình.

---

## 📁 Cấu Trúc Mã Nguồn

```
game/
├── index.html           # Khung HTML và điểm gắn kết Canvas
├── README.md            # Hướng dẫn chi tiết
├── css/
│   └── style.css        # Giao diện responsive, giả lập máy Arcade
└── js/
    ├── audio.js         # Bộ tổng hợp âm thanh Web Audio API
    ├── background.js    # Nền mây, đường chân trời và mặt đất Parallax
    ├── bird.js          # Vật lý chim, chuyển động cánh và hitbox
    ├── pipe.js          # Hệ thống sinh ống ngẫu nhiên & kiểm tra va chạm
    └── game.js          # Vòng lặp game, quản lý trạng thái & UI bảng điểm
```
