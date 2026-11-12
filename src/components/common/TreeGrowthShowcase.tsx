import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

export const TreeGrowthShowcase: React.FC = () => {
  // Continuous growth progress from 0 (seed) to 1 (full canopy tree)
  const [progress, setProgress] = useState<number>(0.2); // bắt đầu nhẹ từ mầm
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const holdTimerRef = useRef<number>(0);

  // Smooth biological growth loop
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setProgress((prev) => {
        // If reached full tree (1.0), hold for 3.2 seconds before gently restarting
        if (prev >= 1.0) {
          holdTimerRef.current += dt;
          if (holdTimerRef.current > 3.2) {
            holdTimerRef.current = 0;
            return 0; // restart cycle
          }
          return 1.0;
        }

        // Smooth growth speed: complete in ~8.0 seconds for super smooth observation
        const next = prev + dt / 8.0;
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

  // Cubic easing function for natural acceleration/deceleration
  const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
  const easeInOutQuad = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  // Growth factors calculated smoothly across the entire 0 -> 1 timeline (NO sudden disappearing!)
  // 1. Seed & root factor: active at start
  const rootGrowth = Math.min(progress / 0.35, 1.0);
  const seedFade = Math.max(0, 1.0 - progress / 0.3);

  // 2. Trunk growth: continuous from 0.05 to 1.0
  const trunkProgress = Math.max(0, (progress - 0.05) / 0.95);
  const trunkScaleY = easeOutCubic(trunkProgress); // 0 to 1
  const trunkScaleX = 0.35 + trunkProgress * 0.65; // thickness increases

  // 3. Branches growth: smoothly extend from 0.25 to 1.0
  const branchProgress = Math.max(0, (progress - 0.22) / 0.78);
  const branchScale = easeOutCubic(branchProgress);

  // 4. Foliage ALWAYS present once stem emerges (>0.08), growing continuously!
  const foliageProgress = Math.max(0, (progress - 0.08) / 0.92);
  const foliageScale = easeOutCubic(foliageProgress); // 0 to 1
  const foliageOpacity = Math.min(1.0, foliageProgress * 3); // fades in quickly and stays lush

  // 5. Mature extras (QR badge, glowing eco spores)
  const matureFactor = Math.max(0, (progress - 0.7) / 0.3);

  // Stage classification for labels
  const stageIndex = progress < 0.22 ? 0 : progress < 0.52 ? 1 : progress < 0.82 ? 2 : 3;

  const STAGE_META = [
    {
      title: 'Hạt Mầm Ươm Tạo',
      desc: 'Hạt giống bén rễ sâu vào đất phù sa Cần Thơ',
      tag: 'GIAI ĐOẠN 1: HẠT MẦM',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      title: 'Chồi Non Vươn Thẳng',
      desc: 'Thân vươn cao, tán lá non xanh mướt đung đưa đón nắng',
      tag: 'GIAI ĐOẠN 2: CHỒI NON',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Cây Sinh Trưởng & Vươn Nhánh',
      desc: 'Phân nhánh xum xuê, tạo bóng mát vỉa hè tuyến phố',
      tag: 'GIAI ĐOẠN 3: SINH TRƯỞNG',
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      title: 'Đại Thụ Đô Thị 4.0',
      desc: 'Tán xum xuê che mát phố, định danh QR & Blockchain',
      tag: 'GIAI ĐOẠN 4: CỔ THỤ GIS',
      color: 'text-emerald-800 bg-emerald-100 border-emerald-300',
    },
  ];

  const currentMeta = STAGE_META[stageIndex];

  // Interpolated metrics
  const currentHeight = (0.15 + progress * 11.65).toFixed(1);
  const currentCanopy = (0.1 + progress * 8.4).toFixed(1);
  const currentCo2 = (0.1 + progress * 48.1).toFixed(1);

  const handleSeek = (targetProgress: number) => {
    setProgress(targetProgress);
    setIsPlaying(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center text-center p-3 sm:p-5 max-w-sm sm:max-w-md w-full mx-auto select-none animate-fade-in">
      {/* 🏷️ Header: Dynamic Stage Badge */}
      <div className="mb-2 space-y-1">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest shadow-2xs transition-colors duration-500 ${currentMeta.color}`}>
          <Sparkles className="w-3 h-3 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{currentMeta.tag}</span>
        </div>
        <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>{currentMeta.title}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* 🌿 Main Botanical Canvas: Beautiful Living Tree */}
      <div className="relative w-72 h-64 sm:w-80 sm:h-72 flex items-end justify-center overflow-visible">
        {/* Ambient Halo behind foliage */}
        <div
          className="absolute inset-0 rounded-full bg-radial from-emerald-400/25 via-teal-300/10 to-transparent blur-2xl pointer-events-none transition-transform duration-700"
          style={{ transform: `scale(${0.3 + foliageScale * 0.9})` }}
        />

        {/* Floating eco-spores (active when tree is lush) */}
        {foliageScale > 0.3 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="absolute left-1/4 top-1/4 w-2 h-2 rounded-full bg-amber-300/80 animate-ping" style={{ animationDuration: '3s' }} />
            <span className="absolute right-1/4 top-1/3 w-2.5 h-2.5 rounded-full bg-emerald-400/80 animate-pulse" style={{ animationDuration: '2s' }} />
            <span className="absolute left-1/3 top-1/6 w-1.5 h-1.5 rounded-full bg-teal-300/90 animate-bounce" style={{ animationDuration: '2.5s' }} />
            <span className="absolute right-1/3 top-1/5 w-2 h-2 rounded-full bg-emerald-300/70 animate-ping" style={{ animationDuration: '4s' }} />
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
          </defs>

          {/* 1. GROUND MOUND & SOIL BASE */}
          <ellipse cx="160" cy="242" rx="90" ry="14" fill="#dcfce7" />
          <ellipse cx="160" cy="245" rx="70" ry="9" fill="#15803d" opacity="0.25" />
          <ellipse cx="160" cy="247" rx="40" ry="5" fill="#14532d" opacity="0.4" />

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
              <ellipse cx="150" cy={245 - trunkScaleY * 165} rx="16" ry="10" fill="#34d399" transform={`rotate(-28 150 ${245 - trunkScaleY * 165})`} />
              <ellipse cx="170" cy={245 - trunkScaleY * 165} rx="16" ry="10" fill="#10b981" transform={`rotate(28 170 ${245 - trunkScaleY * 165})`} />
              <ellipse cx="160" cy={245 - trunkScaleY * 178} rx="14" ry="16" fill="#6ee7b7" />
            </g>
          )}
        </svg>

        {/* 📊 Live Metrics Pill Overlay */}
        <div className="absolute -bottom-2 z-20 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-md flex items-center gap-3 text-[10px] font-bold text-slate-700 whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cao: <strong>{currentHeight}m</strong></span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-teal-800">Tán: <strong>{currentCanopy}m</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700">CO₂: <strong>{currentCo2} kg/năm</strong></span>
        </div>
      </div>

      {/* Description caption */}
      <p className="text-xs text-slate-600 mt-4 max-w-xs leading-relaxed line-clamp-2">
        {currentMeta.desc}
      </p>

      {/* 🎛️ Continuous Progress Scrubber Bar */}
      <div className="w-full max-w-xs mt-3 space-y-2">
        <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* 4 Clickable Quick Stage Buttons */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => handleSeek(0.1)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 0
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200'
            }`}
          >
            🌱 Mầm
          </button>
          <button
            onClick={() => handleSeek(0.38)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 1
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200'
            }`}
          >
            🌿 Chồi
          </button>
          <button
            onClick={() => handleSeek(0.68)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 2
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200'
            }`}
          >
            🌳 Cây
          </button>
          <button
            onClick={() => handleSeek(1.0)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 3
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200'
            }`}
          >
            🌲 Cổ Thụ
          </button>

          {/* Play / Replay / Pause */}
          <button
            onClick={() => {
              if (progress >= 1.0) setProgress(0);
              setIsPlaying(!isPlaying);
            }}
            title={isPlaying ? 'Tạm dừng xem chi tiết' : 'Bật tự động sinh trưởng'}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer border border-emerald-200"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-emerald-700" />
            ) : progress >= 1.0 ? (
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-700" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
