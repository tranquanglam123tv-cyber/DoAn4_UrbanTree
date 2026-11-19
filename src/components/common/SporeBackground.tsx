import React, { useEffect, useRef } from 'react';

interface SporeBackgroundProps {
  isDark?: boolean;
}

// 🌟 Bảng màu đom đóm trong Dark Mode (Chuyển đổi mượt qua lại giữa 3 tông)
const COLOR_EMERALD = { r: 52, g: 211, b: 153 }; // #34d399 (Xanh ngọc hiện tại)
const COLOR_LIME = { r: 190, g: 242, b: 100 };    // #bef264 (Vàng ánh xanh / Vàng chanh)
const COLOR_YELLOW = { r: 253, g: 224, b: 71 };   // #fde047 (Vàng ấm dịu)

/**
 * Hàm nội suy màu mượt mà qua lại giữa 3 nấc: Emerald -> Lime -> Yellow -> Lime -> Emerald
 * @param t Giá trị dao động liên tục từ 0.0 đến 1.0
 */
function interpolateFireflyColor(t: number): string {
  let r: number, g: number, b: number;
  if (t <= 0.5) {
    // Pha 1: Từ Xanh ngọc (#34d399) sang Vàng chanh (#bef264)
    const k = t / 0.5;
    r = Math.round(COLOR_EMERALD.r + (COLOR_LIME.r - COLOR_EMERALD.r) * k);
    g = Math.round(COLOR_EMERALD.g + (COLOR_LIME.g - COLOR_EMERALD.g) * k);
    b = Math.round(COLOR_EMERALD.b + (COLOR_LIME.b - COLOR_EMERALD.b) * k);
  } else {
    // Pha 2: Từ Vàng chanh (#bef264) sang Vàng ấm (#fde047)
    const k = (t - 0.5) / 0.5;
    r = Math.round(COLOR_LIME.r + (COLOR_YELLOW.r - COLOR_LIME.r) * k);
    g = Math.round(COLOR_LIME.g + (COLOR_YELLOW.g - COLOR_LIME.g) * k);
    b = Math.round(COLOR_LIME.b + (COLOR_YELLOW.b - COLOR_LIME.b) * k);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export const SporeBackground: React.FC<SporeBackgroundProps> = ({ isDark = false }) => {
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

    // Bảng màu cho Light Mode
    const lightColors = ['#059669', '#10B981', '#34D399', '#FBBF24', '#6EE7B7'];
    const totalParticles = window.innerWidth < 768 ? 40 : 85;

    class FireflyParticle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      wobble: number;
      wobbleSpeed: number;
      wobbleOffset: number;

      // Chu kỳ chuyển màu (5s - 9s) và pha ban đầu lệch nhau
      colorPhase: number;
      colorSpeed: number;
      currentColor: string;

      // Chu kỳ dao động độ trong suốt (opacity từ 0.25 đến 0.75)
      opacityPhase: number;
      opacitySpeed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.8 + 1.2;
        this.speedY = -(Math.random() * 0.3 + 0.08); // Bay lững lờ nhẹ từ dưới lên
        this.wobble = Math.random() * 1.8 + 0.6; // Biên độ lắc ngang
        this.wobbleSpeed = Math.random() * 0.015 + 0.006;
        this.wobbleOffset = Math.random() * Math.PI * 2;

        // Pha ban đầu ngẫu nhiên giúp các đốm sáng chuyển màu lệch pha nhau (Staggered)
        this.colorPhase = Math.random() * Math.PI * 2;
        // Chu kỳ từ 5s đến 9s (tính theo 60 FPS: (5..9)*60 khung hình/chu kỳ)
        const cycleSeconds = 5.0 + Math.random() * 4.0;
        this.colorSpeed = (Math.PI * 2) / (cycleSeconds * 60);

        // Chu kỳ thở độ sáng (opacity breathing) 4s - 7s
        this.opacityPhase = Math.random() * Math.PI * 2;
        this.opacitySpeed = (Math.PI * 2) / ((4.0 + Math.random() * 3.0) * 60);

        if (isDark) {
          const s = (Math.sin(this.colorPhase) + 1) / 2;
          this.currentColor = interpolateFireflyColor(s);
          this.opacity = 0.25 + (Math.sin(this.opacityPhase) * 0.5 + 0.5) * 0.5;
        } else {
          this.currentColor = lightColors[Math.floor(Math.random() * lightColors.length)];
          this.opacity = 0.3 + Math.random() * 0.4;
        }
      }

      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * this.wobbleSpeed + this.wobbleOffset) * 0.45;

        // Tái tạo khi bay quá mép trên màn hình
        if (this.y < -20) {
          this.y = h + Math.random() * 25;
          this.x = Math.random() * w;
        }

        // Cập nhật chuyển màu đom đóm trong Dark Mode
        if (isDark) {
          this.colorPhase += this.colorSpeed;
          this.opacityPhase += this.opacitySpeed;

          // Giá trị dao động hình sin êm dịu (ease-in-out alternate) từ 0 đến 1
          const s = (Math.sin(this.colorPhase) + 1) / 2;
          this.currentColor = interpolateFireflyColor(s);

          // Độ trong suốt dao động êm trong khoảng 0.25 đến 0.75, dịu mắt và không chói
          this.opacity = 0.25 + (Math.sin(this.opacityPhase) * 0.5 + 0.5) * 0.5;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.currentColor;

        if (isDark) {
          // Ánh sáng tỏa ra xung quanh (shadowColor) đổi đồng bộ theo màu hạt để phát quang tự nhiên
          ctx.shadowColor = this.currentColor;
          ctx.shadowBlur = this.size * 3.5 + 4;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = Array.from({ length: totalParticles }, () => new FireflyParticle());

    const loop = () => {
      // Tự động tạm dừng animation nếu tab đang ẩn trong nền để tiết kiệm 100% CPU/Pin
      if (document.hidden) {
        animId = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-85"
    />
  );
};
