import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

export const TreeGrowthShowcase: React.FC = () => {
  // Continuous growth progress from 0 (seed) to 1 (full canopy tree)
  const [progress, setProgress] = useState<number>(0.05);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cycleOpacity, setCycleOpacity] = useState<number>(1.0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const holdTimerRef = useRef<number>(0);
  const fadeInTimerRef = useRef<number>(1.0);

  // Smooth biological growth loop with poetic lifecycle (Grow -> Hold -> Fade out -> Baby Rebirth -> Fade in)
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setProgress((prev) => {
        // Giai đoạn đạt 100% Cổ Thụ: Giữ ngắm 2.0s, sau đó mờ dần trong 1.0s rồi biến mất
        if (prev >= 1.0) {
          holdTimerRef.current += dt;

          // 1. Giữ nguyên 100% chiêm ngưỡng trong 2.0 giây đầu
          if (holdTimerRef.current < 2.0) {
            setCycleOpacity(1.0);
            return 1.0;
          }

          // 2. Trong 1.0 giây tiếp theo: Mờ dần rồi biến mất hoàn toàn (1.0 -> 0.0)
          if (holdTimerRef.current < 3.0) {
            const fadeProgress = (holdTimerRef.current - 2.0) / 1.0;
            setCycleOpacity(Math.max(0, 1.0 - fadeProgress));
            return 1.0;
          }

          // 3. Tái sinh! Khởi động lại ở mầm non cây con
          holdTimerRef.current = 0;
          fadeInTimerRef.current = 0;
          setCycleOpacity(0);
          return 0.03; // Bắt đầu lại chu trình mới với cây con mầm xanh
        }

        // Giai đoạn cây con mới tái sinh: Hào quang xanh và mầm non hiện dần (0.0 -> 1.0 trong 0.6s)
        if (fadeInTimerRef.current < 0.6) {
          fadeInTimerRef.current += dt;
          setCycleOpacity(Math.min(1.0, fadeInTimerRef.current / 0.6));
        } else {
          setCycleOpacity(1.0);
        }

        // Tốc độ lớn sinh học: Chu kỳ lớn dần đều trong 7.5 giây
        const next = prev + dt / 7.5;
        return Math.min(next, 1.0);
      });

      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  // Perfectly synchronized biological scaling factors matching progress 1:1:
  // 1. Underground roots grow as tree matures
  const rootGrowth = Math.min(progress / 0.75, 1.0);
  const seedFade = Math.max(0, 1.0 - progress / 0.25);

  // 2. Trunk growth: scales smoothly and steadily from 0.12 (tiny sprout) to 1.0 (majestic tree)
  const trunkScaleY = 0.12 + progress * 0.88; // 1:1 synchronized with progress bar
  const trunkScaleX = 0.28 + progress * 0.72; // trunk thickens steadily

  // 3. Branches: sprout after 20% progress and branch out proportionally
  const branchProgress = Math.max(0, (progress - 0.2) / 0.8);
  const branchScale = branchProgress;

  // 4. Foliage: ALWAYS lush and green, scales 1:1 in lockstep with the progress bar
  const foliageScale = 0.15 + progress * 0.85; // 0.15 at seed, 1.0 at full tree
  const foliageOpacity = Math.min(1.0, 0.4 + progress * 0.6);

  // 5. Mature extras (QR identification badge, glowing eco-spores) appear in Cổ Thụ stage (>0.75)
  const matureFactor = Math.max(0, (progress - 0.75) / 0.25);

  // 🌟 Dynamic Ethereal Aura / Halo (ĐỘ CAO HÀO QUANG ĐƯỢC KHÓA 1:1 THEO TỌA ĐỘ TÁN CÂY VƯƠN CAO)
  // Gốc cây tại y=245. Ngọn thân tại 245 - trunkScaleY*165. Trọng tâm tán lá tại:
  const canopyCenterY = 245 - trunkScaleY * 160 - foliageScale * 12; // Tọa độ Y vector trong SVG (223px khi là mầm -> 73px khi là đại thụ)
  const canopyCenterPercent = (canopyCenterY / 280) * 100; // Tỷ lệ % chính xác tuyệt đối trên khung hiển thị
  const haloScale = 0.35 + progress * 1.35; // Hào quang phóng to từ 0.35 (mầm con) đến 1.7 (cổ thụ tráng lệ)
  const haloOpacity = (0.45 + progress * 0.55) * cycleOpacity; // Tăng dần theo cây lớn và mờ dần khi chuyển vòng đời

  // 4 Equal Stages across the 0 -> 1 timeline (25% each):
  // 0% -> 25%: Mầm | 25% -> 50%: Chồi | 50% -> 75%: Cây | 75% -> 100%: Cổ Thụ
  const stageIndex = progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.75 ? 2 : 3;

  const STAGE_META = [
    {
      title: 'Hạt Mầm Ươm Tạo',
      desc: 'Hạt giống bén rễ sâu vào đất phù sa Cần Thơ',
      tag: 'GIAI ĐOẠN 1: HẠT MẦM',
      color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-500/30',
    },
    {
      title: 'Chồi Non Vươn Thẳng',
      desc: 'Thân vươn cao, tán lá non xanh mướt đung đưa đón nắng',
      tag: 'GIAI ĐOẠN 2: CHỒI NON',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-500/30',
    },
    {
      title: 'Cây Sinh Trưởng & Vươn Nhánh',
      desc: 'Phân nhánh xum xuê, tạo bóng mát vỉa hè tuyến phố',
      tag: 'GIAI ĐOẠN 3: SINH TRƯỞNG',
      color: 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-300 dark:bg-teal-950/60 dark:border-teal-500/30',
    },
    {
      title: 'Đại Thụ Đô Thị 4.0',
      desc: 'Tán xum xuê che mát phố, định danh QR & Blockchain',
      tag: 'GIAI ĐOẠN 4: CỔ THỤ GIS',
      color: 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-200 dark:bg-emerald-900/60 dark:border-emerald-400/40',
    },
  ];

  const currentMeta = STAGE_META[stageIndex];

  // Interpolated metrics (strictly proportional to progress)
  const currentHeight = (0.2 + progress * 11.6).toFixed(1);
  const currentCanopy = (0.1 + progress * 8.4).toFixed(1);
  const currentCo2 = (0.1 + progress * 48.1).toFixed(1);

  const handleSeek = (targetProgress: number) => {
    setProgress(targetProgress);
    setIsPlaying(false);
    setCycleOpacity(1.0);
    holdTimerRef.current = 0;
    fadeInTimerRef.current = 1.0;
  };

  return (
    <div className="relative flex flex-col items-center justify-center text-center p-3 sm:p-5 max-w-sm sm:max-w-md w-full mx-auto select-none animate-fade-in">
      {/* 🏷️ Header: Dynamic Stage Badge */}
      <div className="mb-2 space-y-1">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest shadow-2xs transition-colors duration-500 ${currentMeta.color}`}>
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{currentMeta.tag}</span>
        </div>
        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center justify-center gap-2">
          <span>{currentMeta.title}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-xs">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* 🌿 Main Botanical Canvas: Beautiful Living Tree */}
      <div className="relative w-72 h-64 sm:w-80 sm:h-72 flex items-end justify-center overflow-visible">
        {/* 🌟 HÀO QUANG MÀU XANH LAN TỎA RỘNG & ĐẬM ĐÀ RỰC RỠ VỪA ĐẸP (RỘNG HƠN, TÔN NỔI TÁN CÂY) */}
        {/* Layer 1: Hào quang khí quyển lan tỏa diện rộng, vươn xa ra ngoài */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: `${canopyCenterPercent}%`,
            left: '50%',
            width: `${140 + foliageScale * 440}px`,
            height: `${140 + foliageScale * 440}px`,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(5,150,105,0.32) 38%, rgba(4,120,87,0.12) 65%, transparent 85%)',
            filter: 'blur(36px)',
            opacity: (0.45 + foliageScale * 0.45) * cycleOpacity,
            transition: isPlaying ? 'none' : 'all 300ms ease-out',
          }}
        />

        {/* Layer 2: Hào quang năng lượng lõi sáng tươi tắn ôm phía sau tán */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: `${canopyCenterPercent}%`,
            left: '50%',
            width: `${80 + foliageScale * 280}px`,
            height: `${80 + foliageScale * 280}px`,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(52,211,153,0.55) 0%, rgba(16,185,129,0.28) 45%, transparent 75%)',
            filter: 'blur(20px)',
            opacity: (0.35 + foliageScale * 0.35) * cycleOpacity,
            transition: isPlaying ? 'none' : 'all 300ms ease-out',
          }}
        />

        {/* Layer 3: Hào quang năng lượng đất mẹ dưới gốc cây (Soil Base Aura) */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
          style={{
            width: `${90 + progress * 110}px`,
            height: `${16 + progress * 22}px`,
            background:
              'radial-gradient(ellipse, rgba(16,185,129,0.5) 0%, rgba(4,120,87,0.22) 50%, transparent 80%)',
            filter: 'blur(10px)',
            opacity: (0.35 + progress * 0.45) * cycleOpacity,
            transition: isPlaying ? 'none' : 'all 300ms ease-out',
          }}
        />

        {/* Floating eco-spores (active when tree is lush, with smooth lifecycle fade) */}
        {foliageScale > 0.3 && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ opacity: cycleOpacity, transition: isPlaying ? 'none' : 'opacity 300ms ease-out' }}
          >
            <span className="absolute left-1/4 top-1/4 w-2 h-2 rounded-full bg-amber-300/80 dark:bg-amber-300 animate-ping" style={{ animationDuration: '3s' }} />
            <span className="absolute right-1/4 top-1/3 w-2.5 h-2.5 rounded-full bg-emerald-400/80 dark:bg-emerald-400 animate-pulse" style={{ animationDuration: '2s' }} />
            <span className="absolute left-1/3 top-1/6 w-1.5 h-1.5 rounded-full bg-teal-300/90 dark:bg-teal-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
            <span className="absolute right-1/3 top-1/5 w-2 h-2 rounded-full bg-emerald-300/70 dark:bg-emerald-300 animate-ping" style={{ animationDuration: '4s' }} />
          </div>
        )}

        {/* 🎨 Scalable Vector Graphic (Living Tree Art) */}
        <svg
          viewBox="0 0 320 280"
          className="w-full h-full relative z-10 overflow-visible"
        >
          <defs>
            {/* Organic Bark / Wood Trunk Gradient */}
            <linearGradient id="barkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="35%" stopColor="#542e0c" />
              <stop offset="70%" stopColor="#3d1e03" />
              <stop offset="100%" stopColor="#1f0f02" />
            </linearGradient>

            {/* Lush Canopy Deep Gradient */}
            <linearGradient id="canopyBackGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="60%" stopColor="#047857" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Lush Canopy Front/Bright Gradient */}
            <linearGradient id="canopyFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Leaflet Highlight */}
            <linearGradient id="leafHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Glowing Root Glow */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Ethereal Canopy Halo Filter (Làm mờ mềm mại, không đè vỡ hình ảnh) */}
            <filter id="canopyBloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            </filter>

            {/* Dynamic Canopy Background Halo Gradient inside SVG (Lan tỏa thoáng đãng & tươi sáng) */}
            <radialGradient id="canopyAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#34d399" stopOpacity="0.55" />
              <stop offset="68%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="coreAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#34d399" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 🌟 Group chứa cây và hào quang với hiệu ứng mờ dần chuyển giao chu kỳ */}
          <g style={{ opacity: cycleOpacity, transition: isPlaying ? 'none' : 'opacity 300ms ease-out' }}>
            {/* 1. GROUND MOUND & SOIL BASE */}
            <ellipse cx="160" cy="242" rx="90" ry="14" className="fill-emerald-100 dark:fill-emerald-950/80 transition-colors" />
            <ellipse cx="160" cy="245" rx="70" ry="9" className="fill-emerald-700/25 dark:fill-emerald-600/35 transition-colors" />
            <ellipse cx="160" cy="247" rx="40" ry="5" className="fill-emerald-900/40 dark:fill-emerald-500/40 transition-colors" />

            {/* Grass Tufts at Root Base */}
            <path d="M135 240 Q130 230 126 226 Q133 234 137 240 Z" fill="#10b981" />
            <path d="M142 242 Q140 232 138 227 Q143 235 145 242 Z" fill="#34d399" />
            <path d="M182 242 Q185 231 189 226 Q185 235 180 242 Z" fill="#10b981" />
            <path d="M174 241 Q176 233 179 229 Q176 235 172 241 Z" fill="#059669" />

            {/* 2. UNDERGROUND ROOTS (Smoothly branching) */}
            <g opacity={Math.max(0.25, 1.0 - progress * 0.6)}>
              {/* Primary Taproot */}
              <path
                d={`M160 245 Q158 ${245 + rootGrowth * 18} 156 ${245 + rootGrowth * 32}`}
                stroke="#059669"
                strokeWidth={2 + rootGrowth * 1.5}
                fill="none"
                strokeLinecap="round"
              />
              {/* Left Lateral Root */}
              <path
                d={`M160 246 Q145 ${246 + rootGrowth * 12} ${160 - rootGrowth * 36} ${246 + rootGrowth * 22}`}
                stroke="#10b981"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
              />
              {/* Right Lateral Root */}
              <path
                d={`M160 246 Q175 ${246 + rootGrowth * 12} ${160 + rootGrowth * 38} ${246 + rootGrowth * 20}`}
                stroke="#10b981"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
              />
              {/* Golden seed embryo */}
              {seedFade > 0 && (
                <circle cx="160" cy="245" r={4.5 * seedFade} fill="#f59e0b" filter="url(#glowEffect)" />
              )}
            </g>

            {/* 3. TRUNK & BARK (Smoothly growing upwards) */}
            <g
              style={{
                transformOrigin: '160px 245px',
                transform: `scale(${trunkScaleX}, ${trunkScaleY})`,
              }}
            >
              {/* Organic Trunk with smooth curve and root flare */}
              <path
                d="M148 245 C150 210 146 175 152 140 C156 115 154 95 160 75 C166 95 164 115 168 140 C174 175 170 210 172 245 C165 244 155 244 148 245 Z"
                fill="url(#barkGradient)"
              />

              {/* Left Primary Branch */}
              <path
                d={`M154 150 C140 135 125 125 ${160 - branchScale * 55} ${145 - branchScale * 25} C122 136 138 148 153 162 Z`}
                fill="url(#barkGradient)"
                opacity={branchScale}
              />

              {/* Right Primary Branch */}
              <path
                d={`M166 145 C180 130 196 122 ${160 + branchScale * 56} ${140 - branchScale * 22} C198 134 182 145 167 158 Z`}
                fill="url(#barkGradient)"
                opacity={branchScale}
              />

              {/* Upper secondary boughs */}
              {branchScale > 0.4 && (
                <>
                  <path d="M156 110 C146 95 132 86 120 80 C130 92 142 102 156 118 Z" fill="url(#barkGradient)" opacity={branchScale} />
                  <path d="M164 105 C174 90 188 82 200 78 C190 90 178 98 164 114 Z" fill="url(#barkGradient)" opacity={branchScale} />
                </>
              )}

              {/* QR Aluminum Physical Badge mounted on trunk */}
              {matureFactor > 0.1 && (
                <g style={{ opacity: matureFactor }}>
                  <rect
                    x="154"
                    y="180"
                    width="12"
                    height="14"
                    rx="2"
                    fill="#ffffff"
                    stroke="#059669"
                    strokeWidth="1.2"
                    filter="url(#glowEffect)"
                  />
                  <rect x="156.5" y="182.5" width="3" height="3" fill="#064e3b" />
                  <rect x="160.5" y="182.5" width="3" height="3" fill="#064e3b" />
                  <rect x="156.5" y="186.5" width="3" height="3" fill="#064e3b" />
                  <rect x="161.5" y="187.5" width="2" height="2" fill="#10b981" />
                </g>
              )}
            </g>

            {/* 4. ALWAYS-LUSH GREEN FOLIAGE (Attaches directly to stem/branches and blooms seamlessly!) */}
            {foliageScale > 0 && (
              <g
                style={{
                  // Anchor position follows the top of the trunk as it rises
                  transformOrigin: `160px ${245 - trunkScaleY * 165}px`,
                  transform: `scale(${foliageScale})`,
                  opacity: foliageOpacity,
                }}
              >
                {/* 🌟 VÒNG HÀO QUANG LAN TỎA RỘNG & ĐẬM ĐÀ VỪA PHẢI SAU TÁN (RỘNG RÃI, KHÔNG CHE KHUẤT CÀNH LÁ) */}
                <circle
                  cx="160"
                  cy="92"
                  r="165"
                  fill="url(#canopyAuraGrad)"
                  filter="url(#canopyBloom)"
                  opacity="0.65"
                  className="pointer-events-none"
                />
                <circle
                  cx="160"
                  cy="92"
                  r="120"
                  fill="url(#coreAuraGrad)"
                  filter="url(#canopyBloom)"
                  opacity="0.7"
                  className="pointer-events-none"
                />

                {/* Back Shadow Canopy Clouds */}
                <circle cx="160" cy="85" r="58" fill="url(#canopyBackGrad)" opacity="0.95" />
                <circle cx="115" cy="115" r="48" fill="url(#canopyBackGrad)" opacity="0.92" />
                <circle cx="205" cy="110" r="50" fill="url(#canopyBackGrad)" opacity="0.92" />

                {/* Midtone Vibrant Foliage Clouds */}
                <circle cx="140" cy="95" r="46" fill="url(#canopyFrontGrad)" />
                <circle cx="180" cy="90" r="48" fill="url(#canopyFrontGrad)" />
                <circle cx="160" cy="60" r="42" fill="url(#canopyFrontGrad)" />
                <circle cx="105" cy="130" r="38" fill="url(#canopyFrontGrad)" />
                <circle cx="215" cy="125" r="39" fill="url(#canopyFrontGrad)" />

                {/* Sun-dappled Leaf Clusters (Bright Highlights) */}
                <circle cx="135" cy="72" r="26" fill="url(#leafHighlight)" opacity="0.85" />
                <circle cx="185" cy="68" r="24" fill="url(#leafHighlight)" opacity="0.8" />
                <circle cx="160" cy="100" r="32" fill="url(#leafHighlight)" opacity="0.75" />
                <circle cx="120" cy="118" r="22" fill="#a7f3d0" opacity="0.7" />
                <circle cx="200" cy="115" r="22" fill="#a7f3d0" opacity="0.7" />

                {/* Fluttering Edge Leaflets */}
                <ellipse cx="78" cy="115" rx="10" ry="6" fill="#34d399" transform="rotate(-30 78 115)" />
                <ellipse cx="242" cy="110" rx="10" ry="6" fill="#10b981" transform="rotate(30 242 110)" />
                <ellipse cx="160" cy="22" rx="12" ry="7" fill="#6ee7b7" />
                <ellipse cx="115" cy="55" rx="9" ry="5" fill="#34d399" transform="rotate(-40 115 55)" />
                <ellipse cx="205" cy="52" rx="9" ry="5" fill="#6ee7b7" transform="rotate(40 205 52)" />
              </g>
            )}

            {/* Special young leaves cluster for sprout stage (guarantees green lushness even when tiny!) */}
            {foliageScale < 0.45 && (
              <g
                style={{
                  transformOrigin: `160px ${245 - trunkScaleY * 165}px`,
                  opacity: 1 - foliageScale * 2,
                }}
              >
                {/* Hào quang mầm non rực rỡ vừa phải */}
                <circle
                  cx="160"
                  cy={245 - trunkScaleY * 168}
                  r="36"
                  fill="url(#coreAuraGrad)"
                  filter="url(#canopyBloom)"
                  opacity="0.65"
                  className="pointer-events-none"
                />
                <ellipse cx="150" cy={245 - trunkScaleY * 165} rx="16" ry="10" fill="#34d399" transform={`rotate(-28 150 ${245 - trunkScaleY * 165})`} />
                <ellipse cx="170" cy={245 - trunkScaleY * 165} rx="16" ry="10" fill="#10b981" transform={`rotate(28 170 ${245 - trunkScaleY * 165})`} />
                <ellipse cx="160" cy={245 - trunkScaleY * 178} rx="14" ry="16" fill="#6ee7b7" />
              </g>
            )}
          </g>
        </svg>

        {/* 📊 Live Metrics Pill Overlay (Solid high-contrast, no subpixel raster blur) */}
        <div className="absolute -bottom-2 z-20 px-4 py-1.5 bg-white dark:bg-[#07130c] rounded-full border border-emerald-300 dark:border-emerald-500/60 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center gap-3 text-[11px] font-bold text-slate-900 dark:text-emerald-100 whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cao: <strong className="font-extrabold text-slate-950 dark:text-white">{currentHeight}m</strong></span>
          </span>
          <span className="text-slate-300 dark:text-emerald-800">|</span>
          <span className="text-teal-700 dark:text-teal-300">Tán: <strong className="font-extrabold text-slate-950 dark:text-white">{currentCanopy}m</strong></span>
          <span className="text-slate-300 dark:text-emerald-800">|</span>
          <span className="text-emerald-700 dark:text-emerald-400">CO₂: <strong className="font-extrabold text-slate-950 dark:text-white">{currentCo2} kg/năm</strong></span>
        </div>
      </div>

      {/* Description caption */}
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-4 max-w-xs leading-relaxed line-clamp-2 text-center">
        {currentMeta.desc}
      </p>

      {/* 🎛️ Continuous Progress Scrubber Bar */}
      <div className="w-full max-w-xs mt-3 space-y-2">
        <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-300 dark:border-emerald-500/40 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.9)] ${
              isPlaying ? 'transition-none' : 'transition-all duration-300 ease-out'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>

        {/* 4 Clickable Quick Stage Buttons */}
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={() => handleSeek(0.12)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              stageIndex === 0
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-400'
                : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 dark:bg-[#0c1812] dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            🌱 Mầm
          </button>
          <button
            onClick={() => handleSeek(0.37)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              stageIndex === 1
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-400'
                : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 dark:bg-[#0c1812] dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            🌿 Chồi
          </button>
          <button
            onClick={() => handleSeek(0.62)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              stageIndex === 2
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-400'
                : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 dark:bg-[#0c1812] dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            🌳 Cây
          </button>
          <button
            onClick={() => handleSeek(0.95)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              stageIndex === 3
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-400'
                : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 dark:bg-[#0c1812] dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            🌲 Cổ Thụ
          </button>

          {/* Play / Replay / Pause */}
          <button
            onClick={() => {
              if (progress >= 1.0) {
                setProgress(0.03);
                setCycleOpacity(1.0);
                holdTimerRef.current = 0;
                fadeInTimerRef.current = 1.0;
              }
              lastTimeRef.current = performance.now();
              setIsPlaying(!isPlaying);
            }}
            title={isPlaying ? 'Tạm dừng xem chi tiết' : 'Bật tự động sinh trưởng'}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#0c1812] dark:hover:bg-slate-800 dark:text-emerald-300 dark:border-emerald-500/40 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            ) : progress >= 1.0 ? (
              <RotateCcw className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            ) : (
              <Play className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
