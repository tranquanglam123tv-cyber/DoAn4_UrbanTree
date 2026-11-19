import React from 'react';

interface AmbientSunLeavesBackgroundProps {
  isDark?: boolean;
}

export const AmbientSunLeavesBackground: React.FC<AmbientSunLeavesBackgroundProps> = ({ isDark = false }) => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ☀️ 1. ÁNH NẮNG CHIẾU TỰ NHIÊN (SUNLIGHT BEAMS & GLOW TOÀN MÀN HÌNH) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Nguồn phát sáng mặt trời ở góc trên bên phải */}
        <div
          className={`absolute -top-32 -right-32 sm:-top-48 sm:-right-48 w-[500px] sm:w-[750px] h-[500px] sm:h-[750px] rounded-full blur-3xl animate-ambient-sunglow transition-opacity duration-1000 ${
            isDark
              ? 'bg-gradient-to-br from-emerald-500/15 via-teal-400/8 to-transparent opacity-60'
              : 'bg-gradient-to-br from-amber-300/35 via-emerald-200/25 to-transparent opacity-80'
          }`}
        />

        {/* Các dải tia nắng chiếu xéo (God Rays / Light Shafts góc 130 độ) */}
        <div
          className={`absolute -top-36 -right-24 w-[140vw] sm:w-[125vw] h-[120vh] origin-top-right animate-ambient-sunbeam transition-opacity duration-1000 ${
            isDark
              ? 'opacity-25 mix-blend-screen'
              : 'opacity-45 mix-blend-soft-light'
          }`}
          style={{
            background: isDark
              ? 'repeating-linear-gradient(130deg, rgba(16, 185, 129, 0.08) 0px, transparent 80px, rgba(52, 211, 153, 0.05) 160px, transparent 240px, rgba(251, 191, 36, 0.04) 340px, transparent 420px)'
              : 'repeating-linear-gradient(130deg, rgba(254, 240, 138, 0.22) 0px, transparent 70px, rgba(253, 230, 138, 0.16) 150px, transparent 230px, rgba(167, 243, 208, 0.18) 320px, transparent 400px)',
            maskImage: 'radial-gradient(ellipse 90% 80% at 85% 10%, black 20%, rgba(0, 0, 0, 0.4) 60%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 85% 10%, black 20%, rgba(0, 0, 0, 0.4) 60%, transparent 95%)',
          }}
        />

        {/* Luồng sáng nhẹ bổ trợ phía trên bên trái */}
        <div
          className={`absolute -top-24 -left-24 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-3xl transition-opacity duration-1000 ${
            isDark
              ? 'bg-emerald-600/5 opacity-40'
              : 'bg-amber-100/40 opacity-70'
          }`}
        />
      </div>

      {/* 🍃 2. CHỈ 2 LỚP TÁN LÁ NỀN TO DƯỚI CÙNG (FULL MÀN HÌNH, PHÓNG TO 1.3 - 1.5X, BLUR 2PX, OPACITY-15) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          // Radial mask: Vùng tâm màn hình hoàn toàn trong suốt để nội dung chữ & nút nổi bật,
          // hai bên tán lá ngoài rìa hiển thị êm ái
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, transparent 28%, black 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, transparent 28%, black 78%)',
        }}
      >
        {/* Tán lá nền to bên trái: Neo sát mép trái ngoài cùng, phóng to 1.3 - 1.5x, mờ 2px, opacity 15% */}
        <div
          className="absolute -left-16 sm:-left-20 lg:-left-28 -top-8 sm:-top-12 w-[420px] sm:w-[580px] md:w-[720px] lg:w-[880px] aspect-[4/3] scale-125 sm:scale-135 lg:scale-150 origin-top-left animate-hero-leaf-bg-l"
          style={{ animationDelay: '0s' }}
        >
          <img
            src="/LA.png"
            alt=""
            className="w-full h-full object-contain object-top-left transform scale-x-[-1] opacity-[0.15] dark:opacity-[0.10] filter blur-[2px] transition-opacity duration-500"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Tán lá nền to bên phải: Neo sát mép phải ngoài cùng, phóng to 1.3 - 1.5x, mờ 2px, opacity 15% */}
        <div
          className="absolute -right-16 sm:-right-20 lg:-right-28 top-0 sm:top-4 w-[400px] sm:w-[560px] md:w-[700px] lg:w-[860px] aspect-[4/3] scale-125 sm:scale-135 lg:scale-150 origin-top-right animate-hero-leaf-bg-r"
          style={{ animationDelay: '-4s' }}
        >
          <img
            src="/LA.png"
            alt=""
            className="w-full h-full object-contain object-top-right opacity-[0.15] dark:opacity-[0.10] filter blur-[2px] transition-opacity duration-500"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
};
