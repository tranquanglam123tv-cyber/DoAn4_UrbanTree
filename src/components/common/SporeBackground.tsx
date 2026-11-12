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

    // Hạt phấn hoa & neon glow
    const colors = isDark
      ? ['#00FF9D', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
      : ['#059669', '#10B981', '#34D399', '#FBBF24', '#6EE7B7'];
    const totalParticles = window.innerWidth < 768 ? 30 : 120;

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
        if (isDark) {
          ctx.shadowColor = this.color;
          ctx.shadowBlur = 6;
        }
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
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-80"
    />
  );
};

