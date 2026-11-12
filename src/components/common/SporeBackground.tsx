import React, { useEffect, useRef } from 'react';

interface SporeBackgroundProps {
  isDark?: boolean;
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

    // Hạt phấn hoa sinh thái lung linh (Cân bằng hiệu năng cao & hiệu ứng thẩm mỹ)
    const colors = isDark
      ? ['#00FF9D', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
      : ['#059669', '#10B981', '#34D399', '#FBBF24', '#6EE7B7'];
    const totalParticles = window.innerWidth < 768 ? 35 : 95;

    class Particle {
      x = Math.random() * w;
      y = Math.random() * h;
      size = Math.random() * 2.5 + 1.0;
      speedY = -(Math.random() * 0.35 + 0.1); // Bay nhẹ nhàng từ dưới lên trên
      wobble = Math.random() * 1.6; // Biên độ lắc ngang
      wobbleSpeed = Math.random() * 0.02 + 0.006;
      opacity = Math.random() * 0.55 + 0.25;
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
        if (isDark) {
          ctx.shadowColor = this.color;
          ctx.shadowBlur = 5;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = Array.from({ length: totalParticles }, () => new Particle());

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
      className="pointer-events-none fixed inset-0 z-0 opacity-80"
    />
  );
};

