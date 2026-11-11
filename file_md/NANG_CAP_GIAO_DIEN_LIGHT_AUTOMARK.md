# 🌿 BẢN ĐẶC TẢ KỸ THUẬT SIÊU CẤP & PROMPT THI CÔNG TOÀN DIỆN
## Nâng Cấp Giao Diện UrbanTree Y Hệt 100% Hiệu Ứng Template Automark (Light Theme Edition)

---

## BẢNG ĐIỀU HƯỚNG NHANH
* **[PHẦN 1: BẢN ĐỒ CẤU TRÚC 10 HIỆU ỨNG NGUYÊN BẢN CỦA AUTOMARK](#phần-1-bản-đồ-cấu-trúc-10-hiệu-ứng-nguyên-bản-của-automark)**
* **[PHẦN 2: BẢNG ÁNH XẠ NỘI DUNG TOÀN DIỆN (AUTOMARK → URBANTREE)](#phần-2-bảng-ánh-xạ-nội-dung-toàn-diện-automark--urbantree)**
* **[PHẦN 3: BẢNG THAY THẾ MÃ MÀU TOÀN DIỆN (DARK → LIGHT THEME CSS TOKENS)](#phần-3-bảng-thay-thế-mã-màu-toàn-diện-dark--light-theme-css-tokens)**
* **[PHẦN 4: GIẢI MÃ TOÁN HỌC & CODE CHI TIẾT TỪNG HIỆU ỨNG](#phần-4-giải-mã-toán-học--code-chi-tiết-từng-hiệu-ứng)**
* **[PHẦN 5: PROMPT MASTER SIÊU CHI TIẾT (COPY-PASTE ĐỂ AI CODE TỰ ĐỘNG)](#phần-5-prompt-master-siêu-chi-tiết-copy-paste-để-ai-code-tự-động)**
* **[PHẦN 6: HƯỚNG DẪN CLONE TOÀN BỘ SOURCE CODE AUTOMARK SANG URBANTREE](#phần-6-hướng-dẫn-clone-toàn-bộ-source-code-automark-sang-urbantree)**

---

## PHẦN 1: BẢN ĐỒ CẤU TRÚC 10 HIỆU ỨNG NGUYÊN BẢN CỦA AUTOMARK

Khi phân tích toàn bộ thư mục `tailieu/automark-v1.0.0`, template này sở hữu **10 hiệu ứng thị giác và tương tác vi mô độc quyền**:

```
tailieu/automark-v1.0.0
├── public/scripts/
│   ├── animations.js            --> [1] heroVideo() (3D Tilt), [2] sporesEffect(), [3] updateTrustedPartners(), [4] pricingToggle(), [5] Lenis
│   ├── particleCanvas.js        --> [6] sporeCanvas() (Hạt bay quỹ đạo Sin vật lý)
│   └── main.js                  --> [7] Mobile menu drawer, smooth anchor
└── src/styles/
    ├── animations.css           --> [8] .hero-badge-anim, [9] .badge-stars, [10] @keyframes reveal-badge-content
    ├── components.css           --> .section-box (bo góc 80px), .hasHighlight strong (gradient text)
    └── generated-theme.css      --> CSS Variables map màu
```

### Chi tiết 10 hiệu ứng:
1. **Lenis Smooth Scroll Engine**: Cuộn trang có quán tính vật lý (damping inertia), triệt tiêu hoàn toàn hiện tượng giật cục của thanh cuộn mặc định.
2. **GSAP 3D Scroll Tilt Showcase (`heroVideo()`)**:
   - Khung hình container nằm trong không gian 3D `perspective: 1200px`.
   - Vị trí ban đầu: `scale: 0.8`, `rotationX: 10deg` (Desktop) / `rotationX: 15deg` (Mobile), `top: -250px`.
   - Khi cuộn chuột: ScrollTrigger với `scrub: true` dựng khung đứng thẳng dậy `scale: 1, rotationX: 0deg, top: 0px`.
3. **Spore Particle Canvas**: 140 hạt li ti bay lơ lửng, uốn lượn theo hàm sóng `x += Math.sin(y * wobbleSpeed) * wobble`.
4. **HUD Corner-Dot Tagline Badge (`.hero-badge-anim`)**: 4 chấm vuông ở 4 góc nở bung ra ngoài theo đồ thị Bezier giật nảy `cubic-bezier(0.56, 0.02, 0.03, 1.46)`.
5. **Badge Sparkle Stars (`.badge-stars`)**: Ngôi sao 4 cánh lấp lánh xoay nhẹ và phóng to/thu nhỏ theo chu kỳ.
6. **Brand Logos Cycling Animation (`updateTrustedPartners()`)**: 7 logo ngẫu nhiên trượt từ trên xuống với `blur(10px) → blur(0px)`, dừng 3 giây rồi mờ dần đi, lặp lại liên tục.
7. **Staggered Toggle Animation (`pricingToggle()`)**: Khi gạt công tắc, các con số giá trị không đổi cái phụt mà trượt so le nhau (stagger 150ms mỗi dòng).
8. **Radial Glow & Angled Light Rays SVG**: Các chùm tia sáng chéo đa lớp tạo chiều sâu không gian quang học cho phần Hero.
9. **Bento Card Glow Hover**: Các khối thẻ bo góc lớn `rounded-[32px]`, viền mờ `1px`, khi rê chuột có quầng sáng quét quanh mép viền.
10. **Curved Giant Section Container (`.section-box`)**: Các khối nội dung lớn được bọc trong container bo cong khổng lồ `rounded-[36px] lg:rounded-[80px]` tạo nhịp điệu chuyển khối ấn tượng.

---

## PHẦN 2: BẢNG ÁNH XẠ NỘI DUNG TOÀN DIỆN (AUTOMARK → URBANTREE)

| Phần trong Automark | Nội dung gốc (SaaS Marketing) | Chuyển thành UrbanTree (Light Eco-Tech) | Thành phần UI hiển thị |
| :--- | :--- | :--- | :--- |
| **Hero Tagline Badge** | `NEW FEATURE: AI FOLLOW UP` | `HỆ THỐNG GIÁM SÁT SINH THÁI CÂY XANH ĐÔ THỊ 4.0` | Badge 4 chấm xanh ngọc bung nở |
| **Hero Title** | `The All-In-One Growth Software for Local Business Owners` | `Bảo Tồn & Phát Triển <strong>Sinh Quyển Đô Thị</strong> Bằng AI & Blockchain` | Typography 56px, chữ đậm có gradient xanh diệp lục |
| **Hero Subtitle** | `The complete automated system designed to capture more leads...` | `Nền tảng GIS thời gian thực số hóa từng cá thể cây xanh, chẩn đoán rủi ro gãy đổ tự động bằng Gemini AI và minh bạch lịch sử chăm sóc trên sổ cái bất biến.` | Text Slate 600, 20px, giãn dòng thoáng |
| **Hero CTAs** | `Start Your 14-day Free Trial` + `Book a Demo` | `Khám Phá Bản Đồ Cây GIS` + `Quét Mã QR Cây Xanh` | Nút xanh ngọc đổ bóng mềm + Nút kính trắng viền nhôm |
| **3D Showcase Frame** | Video quảng cáo phần mềm CRM nằm nghiêng rồi đứng dậy | **Bản đồ GIS Leaflet tương tác & Radar thời gian thực** (Có thẻ cây cổ thụ `#TREE-00892` và thẻ chẩn đoán **Gemini AI 98.4%**) | Khung kính bo góc `36px` 3D Perspective Tilt |
| **Main Features (Pill Group)** | 6 nỗi đau của doanh nghiệp: `Wasted Ad Spend`, `Slow Response`... | 6 chỉ số giám sát sinh thái: `Mật độ che phủ 42%`, `14,280 Cây xanh GIS`, `0 Sự cố tồn đọng`, `100% Khối Blockchain toàn vẹn`... | 2 hàng chip bo tròn `rounded-full` nền trắng viền mờ |
| **Value Propositions (Bento Cards)** | 4 khối tính năng bán hàng | **4 Khối Trụ Cột Công Nghệ UrbanTree**: 1. Bản đồ GIS 3D đa lớp; 2. Gemini AI chẩn đoán bệnh; 3. Sổ cái bất biến SHA-256; 4. Cổng QR tương tác toàn dân | Bento Cards bo tròn `rounded-3xl` |
| **Comparison Section** | So sánh thủ công vs tự động hóa | **So sánh Quản lý Cây Truyền Thống vs UrbanTree 4.0** (Sổ tay giấy tờ vs Định danh số QR; Cắt tỉa cảm tính vs AI dự báo bão; Mất dữ liệu vs Blockchain) | Bảng so sánh 2 cột với icon tích xanh/chéo đỏ |
| **Section-Box CTA** | Đăng ký dùng thử CRM | **Cổng Tiếp Nhận Báo Cáo Sự Cố Cây Xanh Toàn Dân** (Chụp ảnh hiện trường & Tự động định vị GPS gửi lực lượng cơ động) | Khung bo góc khổng lồ `rounded-[80px]` xanh pastel |

---

## PHẦN 3: BẢNG THAY THẾ MÃ MÀU TOÀN DIỆN (DARK → LIGHT THEME CSS TOKENS)

Dưới đây là bảng tra cứu chính xác từng biến màu cần thay thế trong CSS:

| Biến CSS Token | Giá trị cũ trong Automark (Dark) | Giá trị mới cho UrbanTree (Light Theme) | Ý nghĩa & Vị trí áp dụng |
| :--- | :--- | :--- | :--- |
| `--color-body` | `#03010E` (Đen vũ trụ sâu) | `#F8FAF9` (Trắng sứ sương mai) | Nền toàn bộ trang web |
| `--color-light` | `#0B0C17` (Đen bề mặt card) | `#FFFFFF` (Trắng tinh khiết) | Bề mặt tất cả Bento cards, modals, dropdowns |
| `--color-dark` | `#040404` (Đen thuần) | `#0F172A` (Slate 900 than chì) | Màu chữ tiêu đề H1, H2, H3 |
| `--color-border` | `#202128` (Xám đen viền) | `#E2E8F0` (Slate 200 viền mờ) | Đường kẻ ngăn cách, viền khung 1px |
| `--color-primary` | `#937AFF` (Tím điện tử) | `#059669` (Xanh ngọc lục bảo Emerald) | Màu thương hiệu chính, nút CTA chính, icon |
| `--color-primary-light` | `#4D36D0` (Tím đậm) | `#10B981` (Xanh bạc hà sáng) | Gradient phát sáng, hạt sương bay, pulse status |
| `--color-secondary` | `#FF5353` (Đỏ neon) | `#F59E0B` (Vàng hổ phách Amber) | Cảnh báo sự cố gãy đổ, badge chú ý |
| `--color-text` | `#DAD4DE` (Xám khói) | `#475569` (Slate 600) | Đoạn văn bản mô tả, phụ đề |
| `--color-text-dark` | `#817E84` | `#1E293B` (Slate 800) | Nhãn form, tiêu đề thẻ |
| `--spore-particle` | `#FFFFFF` (Hạt trắng) | `['#10B981', '#34D399', '#FBBF24']` | Hạt phấn hoa & diệp lục sinh quyển |

---

## PHẦN 4: GIẢI MÃ TOÁN HỌC & CODE CHI TIẾT TỪNG HIỆU ỨNG

### 🎬 4.1. Toán Học & Code Hiệu Ứng "Từ Nằm Sang Đứng" (3D Perspective Scroll Tilt)

#### Nguyên lý vật lý:
1. Thiết lập trường phối cảnh `perspective: 1200px` trên container cha để tạo chiều sâu trục Z.
2. Khung hình con được xoay quanh trục ngang `rotationX: 10deg` (mép trên đẩy xa mắt người nhìn, mép dưới gần mắt hơn), kết hợp `scale: 0.8` để thu nhỏ trong không gian.
3. Khi cuộn chuột, hàm nội suy tuyến tính (Linear Interpolation - Lerp) của GSAP ScrollTrigger đồng bộ vị trí cuộn với góc xoay:
   $$\text{rotationX} = 10 \times (1 - \text{progress})$$
   $$\text{scale} = 0.8 + (0.2 \times \text{progress})$$
   $$\text{top} = -250 \times (1 - \text{progress})$$

#### File triển khai: `src/components/common/PerspectiveTiltShowcase.tsx`
```tsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface PerspectiveTiltShowcaseProps {
  children: React.ReactNode;
  urlBarText?: string;
  badgeText?: string;
}

export const PerspectiveTiltShowcase: React.FC<PerspectiveTiltShowcaseProps> = ({
  children,
  urlBarText = 'urbantree.saigon.gov.vn/gis/live-radar',
  badgeText = 'RADAR TRỰC TIẾP',
}) => {
  const showcaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    // Màn hình Desktop (>= 1280px)
    mm.add('(min-width: 1280px)', () => {
      gsap.set(el, { scale: 0.8, rotationX: 10, top: -200 });
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: '20% 95%',
          end: '0% 30%',
          scrub: 1, // Damping quán tính 1 giây cực mượt
        },
        scale: 1,
        rotationX: 0,
        top: 0,
        ease: 'power2.out',
      });
    });

    // Màn hình Mobile/Tablet (< 1280px)
    mm.add('(max-width: 1279px)', () => {
      gsap.set(el, { scale: 0.85, rotationX: 15 });
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: '20% 95%',
          end: '0% 40%',
          scrub: 1,
        },
        scale: 1,
        rotationX: 0,
        ease: 'power2.out',
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      style={{ perspective: '1200px' }}
      className="w-full flex justify-center py-12 px-4 overflow-hidden"
    >
      <div
        ref={showcaseRef}
        data-gsap-video-showcase
        className="relative w-full max-w-6xl rounded-[36px] bg-white border border-slate-200/90 p-3.5 shadow-2xl shadow-emerald-950/10"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Thanh điều khiển Radar trung tâm */}
        <div className="flex items-center justify-between px-5 py-3.5 mb-3 bg-slate-50/90 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="ml-4 px-3 py-1 text-xs font-mono text-slate-500 bg-white rounded-md border border-slate-200">
              {urlBarText}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/70">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {badgeText}
          </div>
        </div>

        {/* Nội dung bên trong: Bản đồ Leaflet hoặc Dashboard GIS */}
        <div className="rounded-[28px] overflow-hidden border border-emerald-100/60 bg-emerald-50/30">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

### 🌊 4.2. Cấu Hình Lenis Smooth Scroll Chuẩn Mực Trong `src/App.tsx`

```tsx
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useLenisSmoothScroll() {
  useEffect(() => {
    // Khởi tạo Lenis với thông số tối ưu cho cảm giác lướt êm ái
    const lenis = new Lenis({
      duration: 1.2, // Thời gian trôi quán tính (giây)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Hàm giảm tốc số mũ mềm mại
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    // Đồng bộ từng khung hình cuộn của Lenis sang GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Ghép vòng lặp render của Lenis vào Ticker của GSAP để tiết kiệm pin và tránh lệch frame
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);
}
```

---

### 🌸 4.3. Code Spore Canvas Hạt Phấn Hoa Lơ Lửng (Light Mode Physics)

```tsx
import React, { useEffect, useRef } from 'react';

export const SporeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Bảng màu phấn hoa & diệp lục nổi bật dịu dàng trên nền sáng #F8FAF9
    const colors = ['#059669', '#10B981', '#34D399', '#FBBF24', '#6EE7B7'];
    const totalParticles = window.innerWidth < 768 ? 25 : 120;

    class Particle {
      x = Math.random() * w;
      y = Math.random() * h;
      size = Math.random() * 2.2 + 0.8;
      speedY = -(Math.random() * 0.35 + 0.1); // Bay từ dưới lên trên
      wobble = Math.random() * 1.6; // Biên độ lắc ngang
      wobbleSpeed = Math.random() * 0.02 + 0.006;
      opacity = Math.random() * 0.5 + 0.25;
      color = colors[Math.floor(Math.random() * colors.length)];

      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * this.wobbleSpeed) * this.wobble;
        // Tái tạo khi bay quá mép trên màn hình
        if (this.y < -15) {
          this.y = h + Math.random() * 20;
          this.x = Math.random() * w;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = Array.from({ length: totalParticles }, () => new Particle());

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-80"
    />
  );
};
```

---

### 💎 4.4. Code HUD Corner-Dot Badge Animation (`src/index.css`)

```css
/* ========================================================
   AUTOMARK HUD CORNER-DOT TAGLINE BADGE (LIGHT MODE)
   ======================================================== */
.hero-badge-anim {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 22px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #A7F3D0;
  box-shadow: 0 4px 16px -3px rgba(5, 150, 105, 0.12);
  backdrop-filter: blur(12px);
}

.hero-badge-anim .badge-content {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #047857;
  opacity: 0;
  animation: reveal-badge-content 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
}

.hero-badge-anim .rect-container {
  position: absolute;
  inset: -1px;
  pointer-events: none;
}

.hero-badge-anim .rectangle {
  position: absolute;
  width: 5px;
  height: 5px;
  background-color: #059669;
  border-radius: 1px;
  opacity: 0;
}

/* 4 Chấm Vuông Ở 4 Góc Bung Nở */
.hero-badge-anim .rectangle.tl {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  animation: bounce-dot 0.5s cubic-bezier(0.56, 0.02, 0.03, 1.46) 0.1s forwards;
}

.hero-badge-anim .rectangle.bl {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
  animation: bounce-dot 0.5s cubic-bezier(0.56, 0.02, 0.03, 1.46) 0.2s forwards;
}

.hero-badge-anim .rectangle.br {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
  animation: bounce-dot 0.5s cubic-bezier(0.56, 0.02, 0.03, 1.46) 0.3s forwards;
}

.hero-badge-anim .rectangle.tr {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  animation: bounce-dot 0.5s cubic-bezier(0.56, 0.02, 0.03, 1.46) 0.4s forwards;
}

@keyframes bounce-dot {
  0% { opacity: 0; transform: scale(0); filter: blur(3px); }
  60% { opacity: 1; transform: scale(1.4); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
}

@keyframes reveal-badge-content {
  0% { opacity: 0; transform: translateY(8px); filter: blur(6px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}
```

---

## PHẦN 5: PROMPT MASTER SIÊU CHI TIẾT (COPY-PASTE ĐỂ AI CODE TỰ ĐỘNG)

Dưới đây là nội dung prompt đầy đủ, chi tiết từng tham số, bạn có thể copy nguyên khối này đưa cho bất kỳ AI nào (hoặc yêu cầu mình chạy ngay):

```markdown
### YÊU CẦU LẬP TRÌNH TỐI CAO: NÂNG CẤP GIAO DIỆN URBANTREE THEO TEMPLATE AUTOMARK (LIGHT THEME)

Dự án hiện tại là UrbanTree (React 19 + Vite 6 + Tailwind CSS v4).
Tôi yêu cầu bạn triển khai bộ hiệu ứng chuyển động và thẩm mỹ từ template `tailieu/automark-v1.0.0` sang giao diện SÁNG (Light Mode "Nordic Botanical Glass").

#### YÊU CẦU 1: CÀI ĐẶT THƯ VIỆN & CẤU HÌNH CUỘN MƯỢT LENIS
1. Cài đặt các package cần thiết:
   `npm install gsap @studio-freight/lenis`
2. Trong `src/App.tsx`, tạo hook kích hoạt Lenis Smooth Scroll với các thông số:
   - `duration: 1.2`
   - `easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))`
   - Đồng bộ `lenis.on('scroll', ScrollTrigger.update)` và ghép vào `gsap.ticker.add((time) => lenis.raf(time * 1000))` với `lagSmoothing(0)`.

#### YÊU CẦU 2: HIỆU ỨNG 3D SCROLL TILT (TỪ NẰM NGỬA SANG DỰNG ĐỨNG) CHO BẢN ĐỒ
1. Tạo component `src/components/common/PerspectiveTiltShowcase.tsx`.
2. Khung cha có `style={{ perspective: "1200px" }}`.
3. Phần tử con mang thuộc tính `data-gsap-video-showcase`.
4. Logic GSAP ScrollTrigger theo đúng `heroVideo()` của Automark:
   - Desktop (>= 1280px): `gsap.set(el, { scale: 0.8, rotationX: 10, top: -200 })`. Khi cuộn từ `start: "20% 95%"` tới `end: "0% 30%"` với `scrub: 1`, xoay và phóng to về `scale: 1, rotationX: 0, top: 0`.
   - Mobile (< 1280px): `gsap.set(el, { scale: 0.85, rotationX: 15 })`, cuộn chuột sẽ đứng thẳng `scale: 1, rotationX: 0`.
5. Đặt MapView (bản đồ GIS) hoặc Dashboard vào bên trong khung hình này. Thêm thanh tiêu đề giả lập radar đô thị (`urbantree.saigon.gov.vn/gis/live-radar`) và chấm xanh nhấp nháy `RADAR TRỰC TIẾP`.

#### YÊU CẦU 3: HẠT PHẤN HOA LƠ LỬNG (SPORE CANVAS)
1. Tạo component `src/components/common/SporeBackground.tsx` kế thừa file `tailieu/automark-v1.0.0/public/scripts/particleCanvas.js`.
2. Điều chỉnh màu hạt sang Light Mode: `['#059669', '#10B981', '#34D399', '#FBBF24']` bay từ dưới lên trên với dao động hình sin `Math.sin(y * wobbleSpeed) * wobble`.
3. Đặt làm nền cố định phía sau `src/App.tsx`.

#### YÊU CẦU 4: HUD CORNER-DOT TAGLINE BADGE
1. Cập nhật `src/index.css` với keyframes `.hero-badge-anim`, `.rectangle.tl/.bl/.br/.tr` bung nở 4 góc.
2. Đặt badge này ở đầu trang với nội dung: `HỆ THỐNG QUẢN LÝ SINH THÁI CÂY XANH ĐÔ THỊ 4.0`.

#### YÊU CẦU 5: FLOATING PILL NAVBAR & BENTO GRID
1. Nâng cấp `src/components/Header.tsx` thành thanh điều hướng viên thuốc bo tròn 999px lơ lửng ở vị trí `top-4`, nền kính mờ trắng `bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md`.
2. Chuyển đổi `TreeListView.tsx` và `DashboardView.tsx` sang các thẻ Bento Card bo tròn `rounded-3xl` (`28px`), nền trắng, hover viền xanh ngọc bích `hover:border-emerald-400` và nổi nhẹ `hover:-translate-y-1.5`.

Hãy thực hiện toàn bộ code hoàn chỉnh, không dùng mã giả (placeholder), đảm bảo chạy mượt mà ngay trên Vite.
```

---

## PHẦN 6: HƯỚNG DẪN CLONE TOÀN BỘ SOURCE CODE AUTOMARK SANG URBANTREE

Nếu bạn muốn giữ **100% mã nguồn Astro của Automark** và nhúng tính năng UrbanTree vào:

1. **Bước 1: Sửa Theme**:
   - Mở `tailieu/automark-v1.0.0/src/config/theme.json`.
   - Thay toàn bộ màu Dark bằng mã màu Light trong **Phần 3** ở trên.
2. **Bước 2: Sửa Hạt Spore**:
   - Mở `tailieu/automark-v1.0.0/public/scripts/particleCanvas.js`.
   - Tìm dòng 14: `const particleColors = ["#FFFFFF"];`
   - Đổi thành: `const particleColors = ["#059669", "#10B981", "#34D399", "#FBBF24"];`
3. **Bước 3: Thay VideoShowcase bằng Bản Đồ Leaflet**:
   - Trong `src/layouts/components/VideoShowcase.astro`:
   - Thay thẻ `<video>` bằng React Island `<MapView client:only="react" />` từ thư mục `src/components/MapView.tsx` của UrbanTree!
4. **Bước 4: Thay đổi Menu & Nội dung**:
   - Sửa `src/config/menu.json` thành các tab: *Bản đồ GIS*, *Hồ sơ Cây*, *Điều phối Sự cố*, *Minh bạch Blockchain*.
   - Sửa `src/content/homepage/-index.md` theo nội dung đã chuẩn hóa trong **Phần 2**.

---

*Tài liệu được phát triển độc quyền cho dự án UrbanTree — Cập nhật ngày 11/11/2026.*
