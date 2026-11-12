import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, RotateCcw, Sprout, Leaf, Trees, ShieldCheck, QrCode } from 'lucide-react';

export const TreeGrowthShowcase: React.FC = () => {
  // Continuous growth progress from 0 (seed) to 1 (full canopy tree)
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const holdTimerRef = useRef<number>(0);

  // Growth loop: runs smoothly via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setProgress((prev) => {
        // If reached full tree (1.0), hold for 2.8 seconds before looping back to seed
        if (prev >= 1.0) {
          holdTimerRef.current += dt;
          if (holdTimerRef.current > 2.8) {
            holdTimerRef.current = 0;
            return 0; // restart from seed!
          }
          return 1.0;
        }

        // Smooth growth speed: complete in ~6.5 seconds
        const next = prev + dt / 6.5;
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

  // Derived growth stage info
  const stageIndex = progress < 0.25 ? 0 : progress < 0.55 ? 1 : progress < 0.82 ? 2 : 3;

  const STAGE_META = [
    {
      title: 'Hạt Mầm Ươm Tạo',
      desc: 'Hạt giống bén rễ sâu vào đất phù sa Cần Thơ',
      tag: 'GIAI ĐOẠN 1: HẠT MẦM',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      title: 'Chồi Non Vươn Thẳng',
      desc: 'Đâm chồi, mở lá mầm non xanh mướt đón nắng sông Hậu',
      tag: 'GIAI ĐOẠN 2: CHỒI NON',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Cây Sinh Trưởng & Vươn Nhánh',
      desc: 'Thân hóa gỗ vững chắc, phân nhánh tỏa bóng vỉa hè',
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

  // Easing curves for realistic biological growth
  // 1. Sprout emergence: rapid early rise
  const sproutFactor = Math.min(progress / 0.25, 1.0);
  // 2. Trunk growth: starts after sprout
  const trunkGrowth = Math.max(0, Math.min((progress - 0.15) / 0.55, 1.0));
  // 3. Foliage explosion: blooms as branches spread
  const foliageFactor = Math.max(0, Math.min((progress - 0.35) / 0.55, 1.0));
  // 4. Full maturity extras (QR tag, glowing spores)
  const matureFactor = Math.max(0, Math.min((progress - 0.75) / 0.25, 1.0));

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
          style={{ transform: `scale(${0.4 + foliageFactor * 0.8})` }}
        />

        {/* Floating eco-spores (active when foliage expands) */}
        {foliageFactor > 0.4 && (
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

          {/* 1. MOUND / GROUND BASE */}
          <ellipse cx="160" cy="242" rx="90" ry="14" fill="#dcfce7" />
          <ellipse cx="160" cy="245" rx="70" ry="9" fill="#15803d" opacity="0.25" />
          <ellipse cx="160" cy="247" rx="40" ry="5" fill="#14532d" opacity="0.4" />

          {/* Grass Tufts at Root Base */}
          <path d="M135 240 Q130 230 126 226 Q133 234 137 240 Z" fill="#10b981" />
          <path d="M142 242 Q140 232 138 227 Q143 235 145 242 Z" fill="#34d399" />
          <path d="M182 242 Q185 231 189 226 Q185 235 180 242 Z" fill="#10b981" />
          <path d="M174 241 Q176 233 179 229 Q176 235 172 241 Z" fill="#059669" />

          {/* 2. UNDERGROUND ROOTS (Pulsing and branching as seed develops) */}
          <g opacity={Math.max(0.2, 1.0 - progress * 0.7)}>
            {/* Primary Taproot */}
            <path
              d="M160 245 Q158 260 156 276"
              stroke="#059669"
              strokeWidth={2.5 + sproutFactor * 1.5}
              fill="none"
              strokeLinecap="round"
            />
            {/* Left Lateral Root */}
            <path
              d="M160 246 Q142 258 122 268"
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
            {/* Right Lateral Root */}
            <path
              d="M160 246 Q178 258 198 266"
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
            {/* Fibrous fine roots */}
            {progress < 0.4 && (
              <>
                <path d="M140 256 Q130 264 116 270" stroke="#34d399" strokeWidth="1.2" fill="none" />
                <path d="M176 256 Q188 264 204 272" stroke="#34d399" strokeWidth="1.2" fill="none" />
              </>
            )}
            {/* Golden seed embryo */}
            {progress < 0.25 && (
              <circle cx="160" cy="245" r={5 - progress * 10} fill="#f59e0b" filter="url(#glowEffect)" />
            )}
          </g>

          {/* 3. TENDER SPROUT (Active during stage 0 & 1) */}
          {progress < 0.45 && (
            <g
              style={{
                opacity: 1 - Math.max(0, (progress - 0.3) / 0.15),
                transformOrigin: '160px 244px',
              }}
            >
              {/* Green curved sprout stem */}
              <path
                d={`M160 245 C158 ${245 - sproutFactor * 35} 162 ${245 - sproutFactor * 65} 160 ${245 - sproutFactor * 85}`}
                stroke="#10b981"
                strokeWidth={3 + sproutFactor * 2}
                fill="none"
                strokeLinecap="round"
              />
              {/* Young leaves opening */}
              {sproutFactor > 0.3 && (
                <>
                  <path
                    d={`M160 ${245 - sproutFactor * 85} C150 ${245 - sproutFactor * 95} 138 ${245 - sproutFactor * 90} 142 ${245 - sproutFactor * 75} C148 ${245 - sproutFactor * 82} 158 ${245 - sproutFactor * 83} 160 ${245 - sproutFactor * 85}`}
                    fill="url(#leafHighlight)"
                  />
                  <path
                    d={`M160 ${245 - sproutFactor * 85} C170 ${245 - sproutFactor * 95} 182 ${245 - sproutFactor * 90} 178 ${245 - sproutFactor * 75} C172 ${245 - sproutFactor * 82} 162 ${245 - sproutFactor * 83} 160 ${245 - sproutFactor * 85}`}
                    fill="#10b981"
                  />
                </>
              )}
            </g>
          )}

          {/* 4. MATURE ORGANIC TRUNK & BRANCHES (Grows smoothly from 0.15 to 1.0) */}
          {progress > 0.15 && (
            <g
              style={{
                transformOrigin: '160px 245px',
                transform: `scale(${0.3 + trunkGrowth * 0.7})`,
                opacity: Math.min(1.0, (progress - 0.15) / 0.1),
              }}
            >
              {/* Organic Trunk with natural curves & bark root flare */}
              <path
                d="M148 245 C149 210 144 175 152 140 C156 115 154 95 160 75 C166 95 164 115 168 140 C176 175 171 210 172 245 C165 244 155 244 148 245 Z"
                fill="url(#barkGradient)"
              />

              {/* Left Primary Bough */}
              {trunkGrowth > 0.3 && (
                <path
                  d="M154 150 C140 135 125 125 105 120 C122 136 138 148 153 162 Z"
                  fill="url(#barkGradient)"
                />
              )}

              {/* Right Primary Bough */}
              {trunkGrowth > 0.35 && (
                <path
                  d="M166 145 C180 130 196 122 216 118 C198 134 182 145 167 158 Z"
                  fill="url(#barkGradient)"
                />
              )}

              {/* Upper secondary boughs */}
              {trunkGrowth > 0.6 && (
                <>
                  <path d="M156 110 C146 95 132 86 118 80 C130 92 142 102 156 118 Z" fill="url(#barkGradient)" />
                  <path d="M164 105 C174 90 188 82 202 78 C190 90 178 98 164 114 Z" fill="url(#barkGradient)" />
                </>
              )}

              {/* High-tech QR Physical Badge mounted on trunk */}
              {matureFactor > 0.2 && (
                <g style={{ opacity: matureFactor }}>
                  {/* Aluminum tag plate */}
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
                  {/* QR Pattern Representation */}
                  <rect x="156.5" y="182.5" width="3" height="3" fill="#064e3b" />
                  <rect x="160.5" y="182.5" width="3" height="3" fill="#064e3b" />
                  <rect x="156.5" y="186.5" width="3" height="3" fill="#064e3b" />
                  <rect x="161.5" y="187.5" width="2" height="2" fill="#10b981" />
                </g>
              )}
            </g>
          )}

          {/* 5. GORGEOUS MULTI-LAYER CANOPY (Expands dynamically like real foliage) */}
          {foliageFactor > 0.05 && (
            <g
              style={{
                transformOrigin: '160px 100px',
                transform: `scale(${0.15 + foliageFactor * 0.85})`,
                opacity: foliageFactor,
              }}
              className="transition-all duration-300"
            >
              {/* Back Shadow Canopy Clouds */}
              <circle cx="160" cy="85" r="58" fill="url(#canopyBackGrad)" opacity="0.95" />
              <circle cx="115" cy="115" r="48" fill="url(#canopyBackGrad)" opacity="0.92" />
              <circle cx="205" cy="110" r="50" fill="url(#canopyBackGrad)" opacity="0.92" />

              {/* Midtone Vibrant Clouds */}
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
            onClick={() => handleSeek(0.4)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 1
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200'
            }`}
          >
            🌿 Chồi
          </button>
          <button
            onClick={() => handleSeek(0.7)}
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
