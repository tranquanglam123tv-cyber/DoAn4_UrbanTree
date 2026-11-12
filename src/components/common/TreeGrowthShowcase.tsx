import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

export type TreeSpeciesSilhouette = 'conifer' | 'pagoda' | 'palm' | 'flamboyant';

export const TreeGrowthShowcase: React.FC = () => {
  // Continuous growth progress from 0 (seed) to 1 (full canopy tree)
  const [progress, setProgress] = useState<number>(0.05);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cycleOpacity, setCycleOpacity] = useState<number>(1.0);

  // 🌲 Selected Tree Silhouette (MẶC ĐỊNH: Cây Tùng Tháp / Thông Đô Thị)
  const [treeSpecies, setTreeSpecies] = useState<TreeSpeciesSilhouette>('conifer');

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
  const rootGrowth = Math.min(progress / 0.75, 1.0);
  const seedFade = Math.max(0, 1.0 - progress / 0.25);
  const trunkScaleY = 0.12 + progress * 0.88;
  const trunkScaleX = 0.28 + progress * 0.72;
  const branchProgress = Math.max(0, (progress - 0.2) / 0.8);
  const branchScale = branchProgress;
  const foliageScale = 0.15 + progress * 0.85;
  const foliageOpacity = Math.min(1.0, 0.4 + progress * 0.6);
  const matureFactor = Math.max(0, (progress - 0.75) / 0.25);

  // Dynamic Ethereal Aura / Halo
  const canopyCenterY = 245 - trunkScaleY * 160 - foliageScale * 12;
  const canopyCenterPercent = (canopyCenterY / 280) * 100;

  // 4 Equal Stages across the 0 -> 1 timeline
  const stageIndex = progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.75 ? 2 : 3;

  const SPECIES_CONFIG = {
    conifer: {
      name: 'Tùng Tháp Đô Thị',
      sub: 'Dáng chóp nón thẳng tắp, tán lá kim ngọc bích',
      matureTitle: 'Tùng Tháp Cổ Thụ 4.0',
      tagColor: 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-200 dark:bg-emerald-950/70',
      canopyColor: '#047857',
    },
    pagoda: {
      name: 'Bàng Đài Loan Tuyến Phố',
      sub: 'Tán phân 3 tầng mái chùa thanh thoát Hòa Bình',
      matureTitle: 'Bàng Tầng Cổ Thụ 4.0',
      tagColor: 'text-teal-800 bg-teal-100 border-teal-300 dark:text-teal-200 dark:bg-teal-950/70',
      canopyColor: '#059669',
    },
    palm: {
      name: 'Cọ Dừa Miền Tây',
      sub: 'Tàu lá dừa nhiệt đới đung đưa ven sông Cần Thơ',
      matureTitle: 'Dừa Lão Sông Hậu 4.0',
      tagColor: 'text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-200 dark:bg-amber-950/70',
      canopyColor: '#10b981',
    },
    flamboyant: {
      name: 'Phượng Vĩ Hoa Đỏ',
      sub: 'Vòm dù che mát nở rực hoa đỏ cam mùa hè',
      matureTitle: 'Phượng Vĩ Cổ Thụ 4.0',
      tagColor: 'text-rose-800 bg-rose-100 border-rose-300 dark:text-rose-200 dark:bg-rose-950/70',
      canopyColor: '#ef4444',
    },
  };

  const activeSpecies = SPECIES_CONFIG[treeSpecies];

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
      title: activeSpecies.matureTitle,
      desc: activeSpecies.sub,
      tag: 'GIAI ĐOẠN 4: CỔ THỤ GIS',
      color: activeSpecies.tagColor,
    },
  ];

  const currentMeta = STAGE_META[stageIndex];

  // Interpolated metrics
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
      {/* 🌲 DÁNG CÂY ĐÔ THỊ (SILHOUETTE SELECTOR: TÙNG THÁP MẶC ĐỊNH & CÁC CÂY KHÁC) */}
      <div className="flex items-center justify-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-emerald-500/20 text-[10px] font-bold shadow-xs mb-2">
        <button
          type="button"
          onClick={() => setTreeSpecies('conifer')}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            treeSpecies === 'conifer'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🌲 Tùng Tháp</span>
        </button>
        <button
          type="button"
          onClick={() => setTreeSpecies('pagoda')}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            treeSpecies === 'pagoda'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🌳 Bàng Tầng</span>
        </button>
        <button
          type="button"
          onClick={() => setTreeSpecies('palm')}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            treeSpecies === 'palm'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🌴 Dừa Cần Thơ</span>
        </button>
        <button
          type="button"
          onClick={() => setTreeSpecies('flamboyant')}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            treeSpecies === 'flamboyant'
              ? 'bg-rose-600 dark:bg-rose-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🌺 Phượng Đỏ</span>
        </button>
      </div>

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
        {/* 🌟 HÀO QUANG MÀU XANH LAN TỎA RỘNG & ĐẬM ĐÀ RỰC RỠ VỪA ĐẸP */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: `${canopyCenterPercent}%`,
            left: '50%',
            width: `${140 + foliageScale * 440}px`,
            height: `${140 + foliageScale * 440}px`,
            transform: 'translate(-50%, -50%)',
            background:
              treeSpecies === 'flamboyant'
                ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(249,115,22,0.25) 35%, rgba(16,185,129,0.15) 60%, transparent 85%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(5,150,105,0.32) 38%, rgba(4,120,87,0.12) 65%, transparent 85%)',
            filter: 'blur(36px)',
            opacity: (0.45 + foliageScale * 0.45) * cycleOpacity,
            transition: isPlaying ? 'none' : 'all 300ms ease-out',
          }}
        />

        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: `${canopyCenterPercent}%`,
            left: '50%',
            width: `${80 + foliageScale * 280}px`,
            height: `${80 + foliageScale * 280}px`,
            transform: 'translate(-50%, -50%)',
            background:
              treeSpecies === 'flamboyant'
                ? 'radial-gradient(circle, rgba(254,205,211,0.6) 0%, rgba(251,146,60,0.35) 45%, transparent 75%)'
                : 'radial-gradient(circle, rgba(52,211,153,0.55) 0%, rgba(16,185,129,0.28) 45%, transparent 75%)',
            filter: 'blur(20px)',
            opacity: (0.35 + foliageScale * 0.35) * cycleOpacity,
            transition: isPlaying ? 'none' : 'all 300ms ease-out',
          }}
        />

        {/* Layer 3: Soil Base Aura */}
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

        {/* Floating eco-spores */}
        {foliageScale > 0.3 && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ opacity: cycleOpacity, transition: isPlaying ? 'none' : 'opacity 300ms ease-out' }}
          >
            <span className="absolute left-1/4 top-1/4 w-1.5 h-1.5 rounded-full bg-emerald-400/80 dark:bg-emerald-300 animate-ping" style={{ animationDuration: '3s' }} />
            <span className="absolute right-1/4 top-1/3 w-1 h-1 rounded-full bg-teal-300/80 dark:bg-teal-200 animate-pulse" />
            <span className="absolute right-1/3 top-1/5 w-2 h-2 rounded-full bg-emerald-300/70 dark:bg-emerald-300 animate-ping" style={{ animationDuration: '4s' }} />
          </div>
        )}

        {/* 🎨 Scalable Vector Graphic (Living Tree Art) */}
        <svg
          viewBox="0 0 320 280"
          className="w-full h-full relative z-10 overflow-visible"
        >
          <defs>
            {/* Bark Gradient */}
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

            {/* Conifer Pine Dark Teal/Emerald Gradient */}
            <linearGradient id="pineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="35%" stopColor="#059669" />
              <stop offset="85%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>

            <linearGradient id="pineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="45%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Palm Leaf Gradient */}
            <linearGradient id="palmFrondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="30%" stopColor="#34d399" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            {/* Flamboyant Flower Gradient */}
            <radialGradient id="flamboyantGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>

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

            {/* Ethereal Canopy Halo Filter */}
            <filter id="canopyBloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            </filter>

            {/* Dynamic Canopy Background Halo Gradient inside SVG */}
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

          {/* 🌟 Group chứa cây và hào quang */}
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

            {/* 2. UNDERGROUND ROOTS */}
            <g opacity={Math.max(0.25, 1.0 - progress * 0.6)}>
              <path
                d={`M160 245 Q158 ${245 + rootGrowth * 18} 156 ${245 + rootGrowth * 32}`}
                stroke="#059669"
                strokeWidth={2 + rootGrowth * 1.5}
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M160 246 Q145 ${246 + rootGrowth * 12} ${160 - rootGrowth * 36} ${246 + rootGrowth * 22}`}
                stroke="#10b981"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M160 246 Q175 ${246 + rootGrowth * 12} ${160 + rootGrowth * 38} ${246 + rootGrowth * 20}`}
                stroke="#10b981"
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
              />
              {seedFade > 0 && (
                <circle cx="160" cy="245" r={4.5 * seedFade} fill="#f59e0b" filter="url(#glowEffect)" />
              )}
            </g>

            {/* 3. TRUNK & BARK (Distinct to Species) */}
            <g
              style={{
                transformOrigin: '160px 245px',
                transform: `scale(${trunkScaleX}, ${trunkScaleY})`,
              }}
            >
              {treeSpecies === 'palm' ? (
                /* Thân Dừa Nhiệt Đới Cần Thơ (Cong nhẹ mềm mại) */
                <path
                  d="M152 245 C150 200 144 150 154 105 C158 85 160 70 160 60 C162 70 166 85 164 105 C158 150 162 200 168 245 Z"
                  fill="url(#barkGradient)"
                />
              ) : treeSpecies === 'conifer' ? (
                /* Thân Tùng Tháp (Thẳng đứng, kiêu hãnh) */
                <path
                  d="M152 245 C154 190 156 130 159 65 L161 65 C164 130 166 190 168 245 Z"
                  fill="url(#barkGradient)"
                />
              ) : (
                /* Thân Gỗ Đại Thụ (Bàng Đài Loan & Phượng Vĩ) */
                <>
                  <path
                    d="M148 245 C150 210 146 175 152 140 C156 115 154 95 160 75 C166 95 164 115 168 140 C174 175 170 210 172 245 C165 244 155 244 148 245 Z"
                    fill="url(#barkGradient)"
                  />
                  <path
                    d={`M154 150 C140 135 125 125 ${160 - branchScale * 55} ${145 - branchScale * 25} C122 136 138 148 153 162 Z`}
                    fill="url(#barkGradient)"
                    opacity={branchScale}
                  />
                  <path
                    d={`M166 145 C180 130 196 122 ${160 + branchScale * 56} ${140 - branchScale * 22} C198 134 182 145 167 158 Z`}
                    fill="url(#barkGradient)"
                    opacity={branchScale}
                  />
                  {branchScale > 0.4 && (
                    <>
                      <path d="M156 110 C146 95 132 86 120 80 C130 92 142 102 156 118 Z" fill="url(#barkGradient)" opacity={branchScale} />
                      <path d="M164 105 C174 90 188 82 200 78 C190 90 178 98 164 114 Z" fill="url(#barkGradient)" opacity={branchScale} />
                    </>
                  )}
                </>
              )}

              {/* QR Aluminum Physical Badge mounted on trunk */}
              {matureFactor > 0.1 && (
                <g style={{ opacity: matureFactor }}>
                  <rect
                    x="154"
                    y={treeSpecies === 'conifer' ? '195' : '180'}
                    width="12"
                    height="14"
                    rx="2"
                    fill="#ffffff"
                    stroke="#059669"
                    strokeWidth="1.2"
                    filter="url(#glowEffect)"
                  />
                  <rect x="156.5" y={treeSpecies === 'conifer' ? '197.5' : '182.5'} width="3" height="3" fill="#064e3b" />
                  <rect x="160.5" y={treeSpecies === 'conifer' ? '197.5' : '182.5'} width="3" height="3" fill="#064e3b" />
                  <rect x="156.5" y={treeSpecies === 'conifer' ? '201.5' : '186.5'} width="3" height="3" fill="#064e3b" />
                  <rect x="161.5" y={treeSpecies === 'conifer' ? '202.5' : '187.5'} width="2" height="2" fill="#10b981" />
                </g>
              )}
            </g>

            {/* 4. BOTANICAL CANOPY RENDERING (SPECIFIC TO SELECTED SILHOUETTE) */}
            {foliageScale > 0 && (
              <g
                style={{
                  transformOrigin: `160px ${245 - trunkScaleY * 165}px`,
                  transform: `scale(${foliageScale})`,
                  opacity: foliageOpacity,
                }}
              >
                {/* 🌟 VÒNG HÀO QUANG LAN TỎA SAU TÁN */}
                <circle
                  cx="160"
                  cy={treeSpecies === 'conifer' ? '110' : '92'}
                  r={treeSpecies === 'conifer' ? '150' : '165'}
                  fill="url(#canopyAuraGrad)"
                  filter="url(#canopyBloom)"
                  opacity="0.65"
                  className="pointer-events-none"
                />
                <circle
                  cx="160"
                  cy={treeSpecies === 'conifer' ? '110' : '92'}
                  r={treeSpecies === 'conifer' ? '105' : '120'}
                  fill="url(#coreAuraGrad)"
                  filter="url(#canopyBloom)"
                  opacity="0.7"
                  className="pointer-events-none"
                />

                {/* ============================================================== */}
                {/* DÁNG 1: 🌲 CÂY TÙNG THÁP / THÔNG ĐÔ THỊ (CONIFER / PYRAMIDAL) */}
                {/* ============================================================== */}
                {treeSpecies === 'conifer' && (
                  <g className="animate-in fade-in duration-300">
                    {/* Tầng đáy rộng nhất (Layer 4) */}
                    <path
                      d="M160 140 L90 205 Q125 195 160 200 Q195 195 230 205 Z"
                      fill="url(#pineGrad1)"
                    />
                    <path
                      d="M160 145 L105 198 Q132 190 160 194 Q188 190 215 198 Z"
                      fill="url(#pineGrad2)"
                      opacity="0.85"
                    />

                    {/* Tầng 3 (Layer 3) */}
                    <path
                      d="M160 100 L105 160 Q132 150 160 155 Q188 150 215 160 Z"
                      fill="url(#pineGrad1)"
                    />
                    <path
                      d="M160 105 L118 154 Q139 146 160 150 Q181 146 202 154 Z"
                      fill="url(#pineGrad2)"
                      opacity="0.9"
                    />

                    {/* Tầng 2 (Layer 2) */}
                    <path
                      d="M160 65 L120 120 Q140 112 160 116 Q180 112 200 120 Z"
                      fill="url(#pineGrad1)"
                    />
                    <path
                      d="M160 70 L130 115 Q145 108 160 111 Q175 108 190 115 Z"
                      fill="url(#pineGrad2)"
                      opacity="0.92"
                    />

                    {/* Tầng chóp nhọn trên cùng (Layer 1 - Spire Pinnacle) */}
                    <path
                      d="M160 25 L132 80 Q146 72 160 75 Q174 72 188 80 Z"
                      fill="url(#pineGrad1)"
                    />
                    <path
                      d="M160 25 L140 76 Q150 70 160 72 Q170 70 180 76 Z"
                      fill="#6ee7b7"
                      opacity="0.95"
                    />

                    {/* Điểm nhấn lá kim sáng lấp lánh như sương mai */}
                    <circle cx="160" cy="28" r="2.5" fill="#d1fae5" />
                    <circle cx="145" cy="74" r="2" fill="#a7f3d0" />
                    <circle cx="175" cy="74" r="2" fill="#a7f3d0" />
                    <circle cx="135" cy="114" r="2" fill="#a7f3d0" />
                    <circle cx="185" cy="114" r="2" fill="#a7f3d0" />
                  </g>
                )}

                {/* ============================================================== */}
                {/* DÁNG 2: 🌳 BÀNG ĐÀI LOAN (PAGODA - TÁN PHÂN 3 TẦNG MÁI CHÙA)  */}
                {/* ============================================================== */}
                {treeSpecies === 'pagoda' && (
                  <g className="animate-in fade-in duration-300">
                    {/* Tầng 3 (Dưới cùng - Xòe rộng nhất) */}
                    <g>
                      <ellipse cx="160" cy="165" rx="82" ry="24" fill="url(#canopyBackGrad)" opacity="0.95" />
                      <ellipse cx="115" cy="168" rx="42" ry="18" fill="url(#canopyFrontGrad)" />
                      <ellipse cx="205" cy="168" rx="42" ry="18" fill="url(#canopyFrontGrad)" />
                      <ellipse cx="160" cy="162" rx="55" ry="16" fill="url(#leafHighlight)" opacity="0.8" />
                    </g>

                    {/* Tầng 2 (Tầng giữa - Vừa phải) */}
                    <g>
                      <ellipse cx="160" cy="115" rx="65" ry="20" fill="url(#canopyBackGrad)" opacity="0.95" />
                      <ellipse cx="125" cy="118" rx="35" ry="15" fill="url(#canopyFrontGrad)" />
                      <ellipse cx="195" cy="118" rx="35" ry="15" fill="url(#canopyFrontGrad)" />
                      <ellipse cx="160" cy="112" rx="45" ry="13" fill="url(#leafHighlight)" opacity="0.85" />
                    </g>

                    {/* Tầng 1 (Đỉnh - Gọn gàng) */}
                    <g>
                      <ellipse cx="160" cy="65" rx="46" ry="17" fill="url(#canopyBackGrad)" opacity="0.95" />
                      <ellipse cx="140" cy="67" rx="26" ry="13" fill="url(#canopyFrontGrad)" />
                      <ellipse cx="180" cy="67" rx="26" ry="13" fill="url(#canopyFrontGrad)" />
                      <ellipse cx="160" cy="62" rx="32" ry="11" fill="url(#leafHighlight)" opacity="0.9" />
                      <circle cx="160" cy="45" r="16" fill="#6ee7b7" />
                    </g>
                  </g>
                )}

                {/* ============================================================== */}
                {/* DÁNG 3: 🌴 CỌ DỪA MIỀN TÂY (PALM - NHIỆT ĐỚI BẾN NINH KIỀU)  */}
                {/* ============================================================== */}
                {treeSpecies === 'palm' && (
                  <g className="animate-in fade-in duration-300">
                    {/* Tàu lá dừa xòe sang trái */}
                    <path
                      d="M160 65 Q110 50 60 85 Q105 70 160 65 Z"
                      fill="url(#palmFrondGrad)"
                    />
                    <path
                      d="M160 62 Q90 30 45 60 Q95 45 160 62 Z"
                      fill="url(#palmFrondGrad)"
                    />
                    <path
                      d="M160 60 Q110 20 80 15 Q120 28 160 60 Z"
                      fill="#34d399"
                    />

                    {/* Tàu lá dừa xòe đỉnh */}
                    <path
                      d="M160 58 Q140 10 160 5 Q175 12 160 58 Z"
                      fill="#6ee7b7"
                    />

                    {/* Tàu lá dừa xòe sang phải */}
                    <path
                      d="M160 60 Q210 20 240 15 Q200 28 160 60 Z"
                      fill="#34d399"
                    />
                    <path
                      d="M160 62 Q230 30 275 60 Q225 45 160 62 Z"
                      fill="url(#palmFrondGrad)"
                    />
                    <path
                      d="M160 65 Q210 50 260 85 Q215 70 160 65 Z"
                      fill="url(#palmFrondGrad)"
                    />

                    {/* Buồng dừa xanh biếc trĩu quả Cần Thơ */}
                    <circle cx="154" cy="72" r="8" fill="#047857" stroke="#10b981" strokeWidth="1" />
                    <circle cx="166" cy="72" r="8" fill="#059669" stroke="#10b981" strokeWidth="1" />
                    <circle cx="160" cy="80" r="8.5" fill="#10b981" stroke="#34d399" strokeWidth="1" />
                    <circle cx="158" cy="78" r="2.5" fill="#a7f3d0" />
                  </g>
                )}

                {/* ============================================================== */}
                {/* DÁNG 4: 🌺 PHƯỢNG VĨ MÙA HOA ĐỎ (FLAMBOYANT - VÒM DÙ RỰC RỠ)  */}
                {/* ============================================================== */}
                {treeSpecies === 'flamboyant' && (
                  <g className="animate-in fade-in duration-300">
                    {/* Tán lá xanh nền bên dưới */}
                    <circle cx="160" cy="85" r="62" fill="url(#canopyBackGrad)" opacity="0.95" />
                    <circle cx="115" cy="115" r="52" fill="url(#canopyBackGrad)" opacity="0.92" />
                    <circle cx="205" cy="110" r="54" fill="url(#canopyBackGrad)" opacity="0.92" />

                    <circle cx="140" cy="95" r="48" fill="url(#canopyFrontGrad)" />
                    <circle cx="180" cy="90" r="50" fill="url(#canopyFrontGrad)" />
                    <circle cx="160" cy="60" r="44" fill="url(#canopyFrontGrad)" />

                    {/* Chùm Hoa Phượng Vĩ Đỏ Cam Rực Rỡ Đô Thị */}
                    <circle cx="125" cy="80" r="22" fill="url(#flamboyantGrad)" />
                    <circle cx="185" cy="75" r="24" fill="url(#flamboyantGrad)" />
                    <circle cx="155" cy="55" r="26" fill="url(#flamboyantGrad)" />
                    <circle cx="100" cy="115" r="20" fill="url(#flamboyantGrad)" />
                    <circle cx="215" cy="105" r="22" fill="url(#flamboyantGrad)" />
                    <circle cx="160" cy="100" r="25" fill="url(#flamboyantGrad)" />

                    {/* Nhụy hoa vàng óng ả */}
                    <circle cx="125" cy="80" r="6" fill="#fef08a" />
                    <circle cx="185" cy="75" r="7" fill="#fef08a" />
                    <circle cx="155" cy="55" r="8" fill="#fef08a" />
                    <circle cx="160" cy="100" r="7" fill="#fef08a" />

                    {/* Cánh hoa phượng rơi đung đưa trong gió */}
                    <ellipse cx="80" cy="120" rx="8" ry="4" fill="#ef4444" transform="rotate(-30 80 120)" />
                    <ellipse cx="235" cy="115" rx="8" ry="4" fill="#f97316" transform="rotate(30 235 115)" />
                    <ellipse cx="160" cy="20" rx="9" ry="5" fill="#ef4444" />
                  </g>
                )}
              </g>
            )}

            {/* Special young leaves cluster for sprout stage */}
            {foliageScale < 0.45 && (
              <g
                style={{
                  transformOrigin: `160px ${245 - trunkScaleY * 165}px`,
                  opacity: 1 - foliageScale * 2,
                }}
              >
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

        {/* 📊 Live Metrics Pill Overlay */}
        <div className="absolute -bottom-2 z-20 px-3.5 py-1.5 bg-white/95 dark:bg-[#0c1812]/95 backdrop-blur-md rounded-full border border-emerald-200/90 dark:border-emerald-500/30 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-3 text-[10px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cao: <strong>{currentHeight}m</strong></span>
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-teal-800 dark:text-teal-300">Tán: <strong>{currentCanopy}m</strong></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-emerald-700 dark:text-emerald-400">CO₂: <strong>{currentCo2} kg/năm</strong></span>
        </div>
      </div>

      {/* Description caption */}
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 max-w-xs leading-relaxed line-clamp-2">
        {currentMeta.desc}
      </p>

      {/* 🎛️ Continuous Progress Scrubber Bar */}
      <div className="w-full max-w-xs mt-3 space-y-2">
        <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-emerald-500/30 shadow-inner">
          <div
            className={`h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)] ${
              isPlaying ? 'transition-none' : 'transition-all duration-300 ease-out'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>

        {/* 4 Clickable Quick Stage Buttons */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => handleSeek(0.12)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 0
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            🌱 Mầm
          </button>
          <button
            onClick={() => handleSeek(0.37)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 1
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            🌿 Chồi
          </button>
          <button
            onClick={() => handleSeek(0.62)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 2
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            🌳 Cây
          </button>
          <button
            onClick={() => handleSeek(0.95)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 3
                ? 'bg-emerald-700 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
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
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 dark:border-emerald-500/30 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            ) : progress >= 1.0 ? (
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
