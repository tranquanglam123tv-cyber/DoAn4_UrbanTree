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
          return 0.03; // Bắt đầu lại chu trình mới với mầm xanh
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

  // Perfectly synchronized biological scaling factors:
  // Stage 1 (Sprout): 0 -> 0.22
  // Stage 2 (Sapling): 0.22 -> 0.48
  // Stage 3 (Young Tree): 0.48 -> 0.75
  // Stage 4 (Heritage Tree): 0.75 -> 1.0
  const isSproutStage = progress < 0.22;
  const sproutFactor = Math.min(1.0, progress / 0.22);
  const treeProgress = Math.max(0, (progress - 0.18) / 0.82); // Smooth handover 0 -> 1

  const rootGrowth = Math.min(progress / 0.75, 1.0);
  const trunkScaleY = 0.25 + treeProgress * 0.75;
  const trunkScaleX = 0.35 + treeProgress * 0.65;
  const foliageScale = 0.2 + treeProgress * 0.8;
  const foliageOpacity = Math.min(1.0, 0.4 + treeProgress * 0.6);
  const matureFactor = Math.max(0, (progress - 0.7) / 0.3);

  // Dynamic Ethereal Aura / Halo center calculation
  const canopyCenterY = isSproutStage ? 225 : 245 - trunkScaleY * 155 - foliageScale * 15;
  const canopyCenterPercent = (canopyCenterY / 280) * 100;

  // 4 Equal Stages across the 0 -> 1 timeline
  const stageIndex = progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.75 ? 2 : 3;

  const SPECIES_CONFIG = {
    conifer: {
      name: 'Tùng Tháp Đô Thị',
      sub: 'Dáng ngọn lửa tháp uy nghi, tán kim xếp lớp ngọc bích',
      matureTitle: 'Tùng Tháp Cổ Thụ 4.0',
      tagColor: 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-200 dark:bg-emerald-950/70',
      auraHue: 'emerald',
    },
    pagoda: {
      name: 'Bàng Đài Loan Tuyến Phố',
      sub: 'Thân vươn thẳng, tán 4 tầng mái chùa thanh thoát',
      matureTitle: 'Bàng Tầng Cổ Thụ 4.0',
      tagColor: 'text-teal-800 bg-teal-100 border-teal-300 dark:text-teal-200 dark:bg-teal-950/70',
      auraHue: 'teal',
    },
    palm: {
      name: 'Cọ Dừa Miền Tây',
      sub: 'Thân cong duyên dáng ven sông Hậu, tàu lá dừa rủ mềm',
      matureTitle: 'Dừa Lão Sông Hậu 4.0',
      tagColor: 'text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-200 dark:bg-amber-950/70',
      auraHue: 'palm',
    },
    flamboyant: {
      name: 'Phượng Vĩ Hoa Đỏ',
      sub: 'Vòm dù che mát tỏa rộng, rực rỡ chùm hoa đỏ cam mùa hè',
      matureTitle: 'Phượng Vĩ Cổ Thụ 4.0',
      tagColor: 'text-rose-800 bg-rose-100 border-rose-300 dark:text-rose-200 dark:bg-rose-950/70',
      auraHue: 'flamboyant',
    },
  };

  const activeSpecies = SPECIES_CONFIG[treeSpecies];

  const STAGE_META = [
    {
      title: 'Hạt Mầm Ươm Tạo',
      desc: 'Hạt giống nảy mầm, hai lá non vươn đón nắng đất phù sa Cần Thơ',
      tag: 'GIAI ĐOẠN 1: HẠT MẦM',
      color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-500/30',
    },
    {
      title: 'Chồi Non Vươn Thẳng',
      desc: 'Cây non cao ~2m, cọc tre chống đỡ đô thị, cành lá mới nhú xum xuê',
      tag: 'GIAI ĐOẠN 2: CHỒI NON',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-500/30',
    },
    {
      title: 'Cây Sinh Trưởng & Phân Tán',
      desc: 'Tán mở rộng che mát vỉa hè, gắn thẻ định danh QR chuẩn hóa',
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
  const currentHeight = (0.3 + progress * 11.5).toFixed(1);
  const currentCanopy = (0.2 + progress * 8.3).toFixed(1);
  const currentCo2 = (0.2 + progress * 48.0).toFixed(1);

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
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs font-black'
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
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs font-black'
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
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs font-black'
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
              ? 'bg-rose-600 dark:bg-rose-500 text-white shadow-xs font-black'
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
        {/* 🌟 HÀO QUANG MÀU XANH / ĐỎ LAN TỎA KHÔNG GIAN TỰ NHIÊN */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: `${canopyCenterPercent}%`,
            left: '50%',
            width: `${140 + foliageScale * 400}px`,
            height: `${140 + foliageScale * 400}px`,
            transform: 'translate(-50%, -50%)',
            background:
              treeSpecies === 'flamboyant' && progress > 0.4
                ? 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, rgba(249,115,22,0.2) 35%, rgba(16,185,129,0.1) 60%, transparent 85%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(5,150,105,0.28) 38%, rgba(4,120,87,0.1) 65%, transparent 85%)',
            filter: 'blur(36px)',
            opacity: (0.4 + foliageScale * 0.45) * cycleOpacity,
            transition: isPlaying ? 'none' : 'all 300ms ease-out',
          }}
        />

        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: `${canopyCenterPercent}%`,
            left: '50%',
            width: `${80 + foliageScale * 260}px`,
            height: `${80 + foliageScale * 260}px`,
            transform: 'translate(-50%, -50%)',
            background:
              treeSpecies === 'flamboyant' && progress > 0.4
                ? 'radial-gradient(circle, rgba(254,205,211,0.55) 0%, rgba(251,146,60,0.3) 45%, transparent 75%)'
                : 'radial-gradient(circle, rgba(52,211,153,0.5) 0%, rgba(16,185,129,0.25) 45%, transparent 75%)',
            filter: 'blur(20px)',
            opacity: (0.35 + foliageScale * 0.35) * cycleOpacity,
            transition: isPlaying ? 'none' : 'all 300ms ease-out',
          }}
        />

        {/* Soil Base Aura */}
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

        {/* Floating eco-spores / bioluminescence */}
        {foliageScale > 0.35 && (
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
            {/* Trunk Woody Shading Gradients */}
            <linearGradient id="trunkWoodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3d2413" />
              <stop offset="35%" stopColor="#6b4423" />
              <stop offset="70%" stopColor="#8e5b3a" />
              <stop offset="100%" stopColor="#3d2413" />
            </linearGradient>

            <linearGradient id="branchWoodGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a2e1b" />
              <stop offset="100%" stopColor="#7a4e28" />
            </linearGradient>

            {/* Palm Trunk Ring Gradient */}
            <linearGradient id="palmTrunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#54331d" />
              <stop offset="40%" stopColor="#8a532e" />
              <stop offset="75%" stopColor="#ad6e3e" />
              <stop offset="100%" stopColor="#4d2c17" />
            </linearGradient>

            {/* Palm Fronds Green Gradients */}
            <linearGradient id="palmFrondDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e5430" />
              <stop offset="100%" stopColor="#0f331c" />
            </linearGradient>

            <linearGradient id="palmFrondLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="60%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            {/* Lush Royal Poinciana (Phượng Vĩ) Foliage Gradients */}
            <linearGradient id="phuongDarkCanopy" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#052e16" />
            </linearGradient>

            <linearGradient id="phuongMidCanopy" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            <linearGradient id="phuongBrightCanopy" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>

            {/* Authentic Flamboyant Blossom (Hoa Phượng) Gradients */}
            <linearGradient id="poincianaBlossomRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d2e" />
              <stop offset="45%" stopColor="#ef233c" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            <linearGradient id="poincianaBlossomOrange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9f1c" />
              <stop offset="60%" stopColor="#ff5722" />
              <stop offset="100%" stopColor="#e63946" />
            </linearGradient>

            {/* Bàng Đài Loan (Terminalia Mantaly) Tier Gradients */}
            <linearGradient id="bangTierDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id="bangTierMid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            <linearGradient id="bangTierLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="60%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Conifer / Tùng Tháp Layer Gradients */}
            <linearGradient id="tungShadeDark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id="tungMidGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <linearGradient id="tungSunlitGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Sprout Cotyledon Leaf Gradient */}
            <linearGradient id="sproutLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="40%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>

            {/* Glowing Root Glow */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Canopy Aura Bloom Filter */}
            <filter id="canopyBloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            </filter>

            {/* Soft Shadow Filter for Natural Canopy Depth */}
            <filter id="subtleDropShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#022c22" floodOpacity="0.25" />
            </filter>

            {/* Dynamic Canopy Aura Gradient inside SVG */}
            <radialGradient id="canopyAuraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#34d399" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 🌟 Group chứa toàn bộ cây và hào quang với hiệu ứng mờ chu kỳ */}
          <g style={{ opacity: cycleOpacity, transition: isPlaying ? 'none' : 'opacity 300ms ease-out' }}>
            {/* 1. MOUND & SOIL BASE */}
            <ellipse cx="160" cy="242" rx="92" ry="14" className="fill-emerald-100 dark:fill-emerald-950/80 transition-colors" />
            <ellipse cx="160" cy="245" rx="72" ry="9" className="fill-emerald-700/25 dark:fill-emerald-600/35 transition-colors" />
            <ellipse cx="160" cy="247" rx="42" ry="5" className="fill-emerald-900/40 dark:fill-emerald-500/40 transition-colors" />

            {/* Tufts of Green Grass at Base */}
            <path d="M132 242 Q126 230 122 225 Q130 234 135 242 Z" fill="#10b981" />
            <path d="M140 244 Q138 232 135 227 Q141 236 143 244 Z" fill="#34d399" />
            <path d="M184 243 Q188 231 192 226 Q187 236 182 243 Z" fill="#10b981" />
            <path d="M176 242 Q179 233 182 229 Q178 236 174 242 Z" fill="#059669" />

            {/* 2. UNDERGROUND ROOTS & BIO-ENERGY */}
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
            </g>

            {/* ============================================================== */}
            {/* GIAI ĐOẠN 1: HẠT MẦM ƯƠM TẠO (CHUYÊN BIỆT CHO MẦM NON THẬT SỰ) */}
            {/* ============================================================== */}
            {isSproutStage && (
              <g className="animate-in fade-in duration-300">
                {/* Hạt giống nứt vỏ trong lòng đất */}
                <ellipse cx="160" cy="244" rx={7 * (1 - sproutFactor * 0.3)} ry={5 * (1 - sproutFactor * 0.3)} fill="#78350f" stroke="#92400e" strokeWidth="1" />
                <path d="M157 244 Q160 242 163 244" stroke="#fbbf24" strokeWidth="1.2" fill="none" />

                {/* Thân mầm non xanh tơ vươn lên */}
                <path
                  d={`M160 244 Q159 ${244 - sproutFactor * 25} 160 ${244 - sproutFactor * 52}`}
                  stroke="#34d399"
                  strokeWidth={3.2}
                  fill="none"
                  strokeLinecap="round"
                />

                {/* 2 Lá mầm non (Cotyledons) xòe đón nắng */}
                <g style={{ transformOrigin: `160px ${244 - sproutFactor * 52}px` }}>
                  {/* Lá mầm bên trái */}
                  <path
                    d={`M160 ${244 - sproutFactor * 52} C140 ${244 - sproutFactor * 62} 132 ${244 - sproutFactor * 48} 128 ${244 - sproutFactor * 54} C134 ${244 - sproutFactor * 68} 150 ${244 - sproutFactor * 62} 160 ${244 - sproutFactor * 52} Z`}
                    fill="url(#sproutLeafGrad)"
                    stroke="#16a34a"
                    strokeWidth="0.8"
                  />
                  {/* Gân lá mầm trái */}
                  <path
                    d={`M160 ${244 - sproutFactor * 52} Q144 ${244 - sproutFactor * 57} 131 ${244 - sproutFactor * 54}`}
                    stroke="#bbf7d0"
                    strokeWidth="0.7"
                    fill="none"
                  />
                  {/* Giọt sương mai đầu lá */}
                  <circle cx="128" cy={244 - sproutFactor * 54} r="1.8" fill="#f0fdf4" filter="url(#glowEffect)" />

                  {/* Lá mầm bên phải */}
                  <path
                    d={`M160 ${244 - sproutFactor * 52} C180 ${244 - sproutFactor * 62} 188 ${244 - sproutFactor * 48} 192 ${244 - sproutFactor * 54} C186 ${244 - sproutFactor * 68} 170 ${244 - sproutFactor * 62} 160 ${244 - sproutFactor * 52} Z`}
                    fill="url(#sproutLeafGrad)"
                    stroke="#16a34a"
                    strokeWidth="0.8"
                  />
                  {/* Gân lá mầm phải */}
                  <path
                    d={`M160 ${244 - sproutFactor * 52} Q176 ${244 - sproutFactor * 57} 189 ${244 - sproutFactor * 54}`}
                    stroke="#bbf7d0"
                    strokeWidth="0.7"
                    fill="none"
                  />

                  {/* Chồi đỉnh non tơ nhú giữa 2 lá */}
                  {sproutFactor > 0.4 && (
                    <path
                      d={`M159 ${244 - sproutFactor * 52} Q160 ${244 - sproutFactor * 66} 160 ${244 - sproutFactor * 70} Q161 ${244 - sproutFactor * 66} 161 ${244 - sproutFactor * 52} Z`}
                      fill="#86efac"
                    />
                  )}
                </g>
              </g>
            )}

            {/* ============================================================== */}
            {/* GIAI ĐOẠN 2, 3 & 4: CÂY TRƯỞNG THÀNH THEO 4 LOÀI THỰC TẾ      */}
            {/* ============================================================== */}
            {!isSproutStage && (
              <g className="animate-in fade-in duration-300">
                {/* 🌟 Hào quang vòm tán bên trong SVG */}
                <circle
                  cx="160"
                  cy={treeSpecies === 'conifer' ? '110' : treeSpecies === 'palm' ? '100' : '95'}
                  r={treeSpecies === 'conifer' ? '145' : '160'}
                  fill="url(#canopyAuraGrad)"
                  filter="url(#canopyBloom)"
                  opacity="0.6"
                  className="pointer-events-none"
                />

                {/* ------------------------------------------------------------ */}
                {/* DÁNG 1: 🌲 TÙNG THÁP ĐÔ THỊ (CUPRESSUS / CONICAL THUJA)      */}
                {/* ------------------------------------------------------------ */}
                {treeSpecies === 'conifer' && (
                  <g>
                    {/* Thân cây gốc */}
                    <path
                      d={`M154 245 L157 ${245 - trunkScaleY * 160} L163 ${245 - trunkScaleY * 160} L166 245 Z`}
                      fill="url(#trunkWoodGrad)"
                    />

                    {/* Tán Tùng Tháp Đa Tầng Lớp Vảy Hình Ngọn Lửa (Flame-like Silhouette) */}
                    <g
                      style={{
                        transformOrigin: '160px 245px',
                        transform: `scale(${foliageScale})`,
                      }}
                      filter="url(#subtleDropShadow)"
                    >
                      {/* Lớp nền bóng râm sâu bên trái (Deep Shade Back Layer) */}
                      <path
                        d="M160 35 
                           C140 70 130 110 148 140 
                           C125 160 120 200 142 225 
                           C122 235 125 250 160 250
                           L160 35 Z"
                        fill="url(#tungShadeDark)"
                      />

                      {/* Lớp trung gian bên phải đón sáng (Sunlit Emerald Mid Layer) */}
                      <path
                        d="M160 35 
                           C180 70 190 110 172 140 
                           C195 160 200 200 178 225 
                           C198 235 195 250 160 250
                           L160 35 Z"
                        fill="url(#tungMidGreen)"
                      />

                      {/* Tầng đáy (Tier 4: Vảy lá xếp lớp xòe rộng dưới gốc) */}
                      <path
                        d="M160 180 
                           C135 185 110 205 105 230 
                           C125 228 145 224 160 228 
                           C175 224 195 228 215 230 
                           C210 205 185 185 160 180 Z"
                        fill="url(#tungMidGreen)"
                      />
                      <path
                        d="M160 185 
                           C142 195 125 212 120 226 
                           C138 223 152 221 160 225 
                           C168 221 182 223 200 226 
                           C195 212 178 195 160 185 Z"
                        fill="url(#tungSunlitGreen)"
                        opacity="0.9"
                      />

                      {/* Tầng 3 (Tier 3: Tầng giữa xum xuê) */}
                      <path
                        d="M160 125 
                           C138 135 120 155 115 178 
                           C135 174 150 172 160 176 
                           C170 172 185 174 205 178 
                           C200 155 182 135 160 125 Z"
                        fill="url(#tungMidGreen)"
                      />
                      <path
                        d="M160 130 
                           C145 142 132 160 128 174 
                           C142 171 154 170 160 173 
                           C166 170 178 171 192 174 
                           C188 160 175 142 160 130 Z"
                        fill="url(#tungSunlitGreen)"
                        opacity="0.92"
                      />

                      {/* Tầng 2 (Tier 2: Thon gọn vươn cao) */}
                      <path
                        d="M160 75 
                           C142 88 132 108 128 128 
                           C142 124 154 123 160 126 
                           C166 123 178 124 192 128 
                           C188 108 178 88 160 75 Z"
                        fill="url(#tungMidGreen)"
                      />
                      <path
                        d="M160 80 
                           C148 94 140 110 136 124 
                           C148 121 156 121 160 123 
                           C164 121 172 121 184 124 
                           C180 110 172 94 160 80 Z"
                        fill="url(#tungSunlitGreen)"
                        opacity="0.95"
                      />

                      {/* Tầng 1 (Chóp ngọn nhọn kiêu hãnh - Spire Peak) */}
                      <path
                        d="M160 30 
                           C148 45 142 62 140 78 
                           C150 75 156 74 160 76 
                           C164 74 170 75 180 78 
                           C178 62 172 45 160 30 Z"
                        fill="url(#tungSunlitGreen)"
                      />
                      <path
                        d="M160 26 L158 52 L160 55 L162 52 Z"
                        fill="#a7f3d0"
                      />

                      {/* Đường gân dọc đón sáng trung tâm (Vertical Volumetric Ridge) */}
                      <path
                        d="M160 30 L160 230"
                        stroke="#6ee7b7"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity="0.4"
                      />
                    </g>
                  </g>
                )}

                {/* ------------------------------------------------------------ */}
                {/* DÁNG 2: 🌳 BÀNG ĐÀI LOAN (TERMINALIA MANTALY - TÁN PHÂN 4 TẦNG)*/}
                {/* ------------------------------------------------------------ */}
                {treeSpecies === 'pagoda' && (
                  <g>
                    {/* Thân cây chính: Thẳng đứng thanh mảnh, phân đốt cành ngang */}
                    <path
                      d="M154 245 L157 65 L163 65 L166 245 Z"
                      fill="url(#trunkWoodGrad)"
                    />

                    {/* Cành ngang đối xứng nâng đỡ từng tầng lá */}
                    {/* Tầng 4 (Cành dưới cùng xòe rộng nhất) */}
                    <path d="M158 190 Q110 192 75 198" stroke="url(#branchWoodGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M162 190 Q210 192 245 198" stroke="url(#branchWoodGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />

                    {/* Tầng 3 */}
                    <path d="M158 145 Q120 147 92 152" stroke="url(#branchWoodGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M162 145 Q200 147 228 152" stroke="url(#branchWoodGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                    {/* Tầng 2 */}
                    <path d="M158 105 Q130 106 112 110" stroke="url(#branchWoodGrad)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    <path d="M162 105 Q190 106 208 110" stroke="url(#branchWoodGrad)" strokeWidth="2.2" fill="none" strokeLinecap="round" />

                    {/* Tầng 1 (Đỉnh) */}
                    <path d="M159 75 Q140 76 130 78" stroke="url(#branchWoodGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <path d="M161 75 Q180 76 190 78" stroke="url(#branchWoodGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round" />

                    {/* 4 ĐĨA TÁN LÁ BÀNG TẦNG XẾP LỚP (PAGODA FOLIAGE TIERS) */}
                    <g
                      style={{
                        transformOrigin: '160px 245px',
                        transform: `scale(${foliageScale})`,
                      }}
                      filter="url(#subtleDropShadow)"
                    >
                      {/* Tầng 4 (Dưới cùng: Rộng nhất ~190px, viền lượn sóng mềm mại) */}
                      <g>
                        <path
                          d="M65 196 C70 185 100 180 160 180 C220 180 250 185 255 196 C250 208 220 214 160 214 C100 214 70 208 65 196 Z"
                          fill="url(#bangTierDark)"
                        />
                        <path
                          d="M72 194 C76 186 105 182 160 182 C215 182 244 186 248 194 C242 203 215 208 160 208 C105 208 78 203 72 194 Z"
                          fill="url(#bangTierMid)"
                        />
                        <path
                          d="M85 191 C92 186 115 183 160 183 C205 183 228 186 235 191 C228 197 205 201 160 201 C115 201 92 197 85 191 Z"
                          fill="url(#bangTierLight)"
                          opacity="0.85"
                        />
                      </g>

                      {/* Tầng 3 (Tầng giữa: Rộng ~150px) */}
                      <g>
                        <path
                          d="M82 150 C86 140 112 136 160 136 C208 136 234 140 238 150 C234 160 208 166 160 166 C112 166 86 160 82 150 Z"
                          fill="url(#bangTierDark)"
                        />
                        <path
                          d="M89 148 C94 141 118 138 160 138 C202 138 226 141 231 148 C225 156 202 161 160 161 C118 161 95 156 89 148 Z"
                          fill="url(#bangTierMid)"
                        />
                        <path
                          d="M102 146 C108 141 126 139 160 139 C194 139 212 141 218 146 C212 151 194 154 160 154 C126 154 108 151 102 146 Z"
                          fill="url(#bangTierLight)"
                          opacity="0.9"
                        />
                      </g>

                      {/* Tầng 2 (Tầng trên: Rộng ~110px) */}
                      <g>
                        <path
                          d="M104 108 C108 100 128 96 160 96 C192 96 212 100 216 108 C212 116 192 121 160 121 C128 121 108 116 104 108 Z"
                          fill="url(#bangTierDark)"
                        />
                        <path
                          d="M110 106 C114 100 132 98 160 98 C188 98 206 100 210 106 C205 113 188 117 160 117 C132 117 115 113 110 106 Z"
                          fill="url(#bangTierMid)"
                        />
                        <path
                          d="M120 104 C125 100 138 99 160 99 C182 99 195 100 200 104 C195 109 182 112 160 112 C138 112 125 109 120 104 Z"
                          fill="url(#bangTierLight)"
                          opacity="0.92"
                        />
                      </g>

                      {/* Tầng 1 (Chóp đỉnh: Rộng ~70px và búp ngọn xanh) */}
                      <g>
                        <path
                          d="M125 76 C128 70 140 68 160 68 C180 68 192 70 195 76 C192 82 180 86 160 86 C140 86 128 82 125 76 Z"
                          fill="url(#bangTierDark)"
                        />
                        <path
                          d="M130 74 C134 70 144 69 160 69 C176 69 186 70 190 74 C186 79 176 82 160 82 C144 82 134 79 130 74 Z"
                          fill="url(#bangTierLight)"
                        />
                        {/* Búp ngọn vươn cao */}
                        <circle cx="160" cy="58" r="6" fill="#6ee7b7" />
                        <path d="M160 50 L158 59 L162 59 Z" fill="#a7f3d0" />
                      </g>
                    </g>
                  </g>
                )}

                {/* ------------------------------------------------------------ */}
                {/* DÁNG 3: 🌴 CỌ DỪA MIỀN TÂY (COCOS NUCIFERA - DÁNG VEN SÔNG HẬU)*/}
                {/* ------------------------------------------------------------ */}
                {treeSpecies === 'palm' && (
                  <g>
                    {/* Thân dừa cong tự nhiên mềm mại với từng đốt ngấn sẹo lá */}
                    <g filter="url(#subtleDropShadow)">
                      <path
                        d="M 152 245 
                           C 150 200, 138 155, 144 110 
                           C 148 78, 156 65, 158 52
                           L 164 52
                           C 161 65, 154 78, 150 110
                           C 144 155, 158 200, 168 245 Z"
                        fill="url(#palmTrunkGrad)"
                      />
                      {/* Vòng ngấn đốt thân dừa (Bark rings) */}
                      <path d="M 148 100 Q 152 103 156 101" stroke="#4d2c17" strokeWidth="1.5" fill="none" opacity="0.7" />
                      <path d="M 146 125 Q 151 128 156 126" stroke="#4d2c17" strokeWidth="1.8" fill="none" opacity="0.7" />
                      <path d="M 145 152 Q 150 156 157 153" stroke="#4d2c17" strokeWidth="2" fill="none" opacity="0.7" />
                      <path d="M 147 182 Q 153 186 160 183" stroke="#4d2c17" strokeWidth="2.2" fill="none" opacity="0.7" />
                      <path d="M 151 215 Q 158 219 165 216" stroke="#4d2c17" strokeWidth="2.5" fill="none" opacity="0.7" />
                    </g>

                    {/* TÀU LÁ DỪA (7 PINNATE FRONDS VỚI LÁ CHÉT RẼ XƯƠNG CÁ THỰC TẾ) */}
                    <g
                      style={{
                        transformOrigin: '161px 52px',
                        transform: `scale(${foliageScale})`,
                      }}
                      filter="url(#subtleDropShadow)"
                    >
                      {/* Tàu 1: Rủ sâu sang trái (Left Drooping) */}
                      <g>
                        <path d="M 160 52 C 120 40, 75 60, 45 105 C 32 125, 20 155, 15 180" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 135 48 Q 115 58 100 80 Q 120 68 135 48" fill="url(#palmFrondDark)" />
                        <path d="M 105 56 Q 85 70 70 98 Q 90 82 105 56" fill="url(#palmFrondLight)" />
                        <path d="M 75 72 Q 55 90 40 125 Q 60 105 75 72" fill="url(#palmFrondDark)" />
                        <path d="M 50 95 Q 32 118 25 155 Q 42 130 50 95" fill="url(#palmFrondLight)" />
                      </g>

                      {/* Tàu 2: Vươn cong ngang trái (Mid-Left Arch) */}
                      <g>
                        <path d="M 160 50 C 125 15, 75 22, 45 52 C 32 68, 22 92, 16 115" fill="none" stroke="#16a34a" strokeWidth="3.2" strokeLinecap="round" />
                        <path d="M 135 28 Q 115 28 95 48 Q 115 42 135 28" fill="url(#palmFrondLight)" />
                        <path d="M 105 22 Q 80 25 60 52 Q 82 42 105 22" fill="url(#palmFrondDark)" />
                        <path d="M 72 30 Q 52 38 35 68 Q 55 55 72 30" fill="url(#palmFrondLight)" />
                        <path d="M 48 48 Q 30 62 22 92 Q 38 78 48 48" fill="url(#palmFrondDark)" />
                      </g>

                      {/* Tàu 3: Đọt non vươn đỉnh trời (Center Skyward) */}
                      <g>
                        <path d="M 161 50 C 160 10, 161 -5, 161 -20" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 161 35 Q 142 28 132 10 Q 146 22 161 35" fill="url(#palmFrondDark)" />
                        <path d="M 161 15 Q 142 8 134 -8 Q 147 2 161 15" fill="url(#palmFrondLight)" />
                        <path d="M 161 30 Q 180 22 190 5 Q 176 18 161 30" fill="url(#palmFrondLight)" />
                        <path d="M 161 10 Q 180 2 188 -14 Q 175 -3 161 10" fill="url(#palmFrondDark)" />
                      </g>

                      {/* Tàu 4: Vươn cong ngang phải (Mid-Right Arch) */}
                      <g>
                        <path d="M 162 50 C 195 15, 245 22, 275 52 C 288 68, 298 92, 304 115" fill="none" stroke="#16a34a" strokeWidth="3.2" strokeLinecap="round" />
                        <path d="M 188 28 Q 208 28 228 48 Q 208 42 188 28" fill="url(#palmFrondDark)" />
                        <path d="M 218 22 Q 242 25 262 52 Q 240 42 218 22" fill="url(#palmFrondLight)" />
                        <path d="M 250 30 Q 270 38 288 68 Q 268 55 250 30" fill="url(#palmFrondDark)" />
                        <path d="M 274 48 Q 292 62 300 92 Q 284 78 274 48" fill="url(#palmFrondLight)" />
                      </g>

                      {/* Tàu 5: Rủ sâu sang phải (Right Drooping) */}
                      <g>
                        <path d="M 162 52 C 202 40, 248 60, 278 105 C 290 125, 302 155, 306 180" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 188 48 Q 208 58 222 80 Q 202 68 188 48" fill="url(#palmFrondLight)" />
                        <path d="M 218 56 Q 238 70 252 98 Q 232 82 218 56" fill="url(#palmFrondDark)" />
                        <path d="M 248 72 Q 268 90 282 125 Q 262 105 248 72" fill="url(#palmFrondLight)" />
                        <path d="M 272 95 Q 290 118 297 155 Q 280 130 272 95" fill="url(#palmFrondDark)" />
                      </g>

                      {/* Tàu 6: Tàu lá phía trước phủ qua gốc (Foreground Over-Droop) */}
                      <g>
                        <path d="M 160 55 C 160 85, 154 110, 142 135" fill="none" stroke="#4ade80" strokeWidth="2.8" strokeLinecap="round" />
                        <path d="M 159 65 Q 140 72 128 88 Q 144 78 159 65" fill="url(#palmFrondLight)" />
                        <path d="M 155 85 Q 136 94 124 110 Q 140 100 155 85" fill="url(#palmFrondDark)" />
                        <path d="M 161 68 Q 180 75 192 90 Q 176 82 161 68" fill="url(#palmFrondDark)" />
                        <path d="M 157 88 Q 176 96 188 112 Q 172 104 157 88" fill="url(#palmFrondLight)" />
                      </g>

                      {/* Buồng dừa xiêm xanh biếc trĩu quả Cần Thơ (Coconut Cluster with 3D Depth) */}
                      <g id="coconutCluster" transform="translate(160, 56)">
                        <circle cx="-9" cy="8" r="7.5" fill="#14532d" stroke="#22c55e" strokeWidth="0.8" />
                        <circle cx="9" cy="8" r="7.5" fill="#166534" stroke="#22c55e" strokeWidth="0.8" />
                        <circle cx="0" cy="14" r="8.5" fill="#15803d" stroke="#4ade80" strokeWidth="1" />
                        {/* Highlights on coconuts */}
                        <circle cx="-11" cy="6" r="2" fill="#86efac" opacity="0.6" />
                        <circle cx="-2" cy="11" r="2.5" fill="#bbf7d0" opacity="0.7" />
                        <circle cx="7" cy="6" r="2" fill="#86efac" opacity="0.6" />
                      </g>
                    </g>
                  </g>
                )}

                {/* ------------------------------------------------------------ */}
                {/* DÁNG 4: 🌺 PHƯỢNG VĨ HOA ĐỎ (DELONIX REGIA - VÒM DÙ RỰC RỠ)  */}
                {/* ------------------------------------------------------------ */}
                {treeSpecies === 'flamboyant' && (
                  <g>
                    {/* Thân cây cổ thụ gân guốc & các cành lớn phân nhánh dạng VÒM DÙ */}
                    <g filter="url(#subtleDropShadow)">
                      {/* Thân chính */}
                      <path
                        d="M 148 245 
                           C 150 205, 154 175, 160 148 
                           C 166 175, 170 205, 172 245 Z"
                        fill="url(#trunkWoodGrad)"
                      />

                      {/* Cành lớn vươn sang trái đỡ vòm dù (Left Major Bough) */}
                      <path
                        d="M 156 160 
                           C 135 140, 100 125, 60 115 
                           C 90 128, 125 145, 154 170 Z"
                        fill="url(#branchWoodGrad)"
                      />

                      {/* Cành lớn vươn sang phải đỡ vòm dù (Right Major Bough) */}
                      <path
                        d="M 164 160 
                           C 185 140, 220 125, 260 115 
                           C 230 128, 195 145, 166 170 Z"
                        fill="url(#branchWoodGrad)"
                      />

                      {/* Cành giữa vươn lên đỉnh vòm */}
                      <path
                        d="M 158 148 C 156 120, 154 95, 158 75 C 162 95, 164 120, 162 148 Z"
                        fill="url(#branchWoodGrad)"
                      />
                    </g>

                    {/* VÒM DÙ LÁ XANH & CHÙM HOA PHƯỢNG ĐỎ RỰC RỠ (ORGANIC BLOSSOMS) */}
                    <g
                      style={{
                        transformOrigin: '160px 145px',
                        transform: `scale(${foliageScale})`,
                      }}
                      filter="url(#subtleDropShadow)"
                    >
                      {/* 1. Lớp tán nền lá kép xanh sẫm (Deep Background Green Canopy) */}
                      <path
                        d="M 45 125 
                           C 30 100, 40 70, 75 60 
                           C 95 40, 130 35, 160 42 
                           C 190 35, 225 40, 245 60 
                           C 280 70, 290 100, 275 125 
                           C 255 150, 220 155, 190 148 
                           C 160 155, 130 152, 100 148 
                           C 70 155, 55 145, 45 125 Z"
                        fill="url(#phuongDarkCanopy)"
                      />

                      {/* 2. Lớp tán lá giữa mịn màng (Lush Midground Foliage) */}
                      <path
                        d="M 58 115 
                           C 48 95, 60 75, 88 68 
                           C 108 52, 135 48, 160 52 
                           C 185 48, 212 52, 232 68 
                           C 260 75, 272 95, 262 115 
                           C 245 135, 215 140, 190 134 
                           C 160 140, 130 138, 105 134 
                           C 80 140, 68 132, 58 115 Z"
                        fill="url(#phuongMidCanopy)"
                      />

                      {/* 3. Lớp tán đón sáng (Sunlit Canopy Highlights) */}
                      <path
                        d="M 75 95 
                           C 70 82, 82 72, 100 70 
                           C 115 60, 135 58, 160 62 
                           C 185 58, 205 60, 220 70 
                           C 238 72, 250 82, 245 95 
                           C 235 110, 210 115, 190 108 
                           C 160 115, 135 112, 115 108 
                           C 95 115, 80 108, 75 95 Z"
                        fill="url(#phuongBrightCanopy)"
                        opacity="0.85"
                      />

                      {/* 4. CHÙM HOA PHƯỢNG RỰC ĐỎ (BLOSSOM CLOUDS HUGGING THE DOME) */}
                      {/* Chùm hoa đỉnh vòm */}
                      <g>
                        <path
                          d="M 140 55 C 135 42, 150 35, 160 38 C 170 35, 185 42, 180 55 C 190 65, 180 78, 168 76 C 160 82, 145 80, 142 72 C 130 68, 132 58, 140 55 Z"
                          fill="url(#poincianaBlossomRed)"
                        />
                        <path
                          d="M 148 50 C 145 42, 155 38, 160 40 C 168 38, 175 42, 172 50 C 178 56, 172 65, 165 64 C 160 68, 152 66, 150 62 C 142 58, 145 52, 148 50 Z"
                          fill="url(#poincianaBlossomOrange)"
                        />
                        {/* Nhụy vàng óng */}
                        <circle cx="160" cy="52" r="2.8" fill="#fef08a" />
                      </g>

                      {/* Chùm hoa sườn trái đón nắng */}
                      <g>
                        <path
                          d="M 75 90 C 68 78, 82 68, 95 72 C 105 66, 118 75, 115 88 C 122 98, 112 110, 100 108 C 90 114, 78 108, 76 98 C 68 96, 70 85, 75 90 Z"
                          fill="url(#poincianaBlossomRed)"
                        />
                        <path
                          d="M 82 85 C 78 78, 88 72, 96 75 C 102 72, 110 78, 108 86 C 112 92, 105 100, 98 98 C 92 102, 85 98, 84 92 C 78 90, 80 84, 82 85 Z"
                          fill="url(#poincianaBlossomOrange)"
                        />
                        <circle cx="95" cy="85" r="2.5" fill="#fef08a" />
                      </g>

                      {/* Chùm hoa sườn phải đón nắng */}
                      <g>
                        <path
                          d="M 225 90 C 218 78, 232 68, 245 72 C 255 66, 268 75, 265 88 C 272 98, 262 110, 250 108 C 240 114, 228 108, 226 98 C 218 96, 220 85, 225 90 Z"
                          fill="url(#poincianaBlossomRed)"
                        />
                        <path
                          d="M 232 85 C 228 78, 238 72, 246 75 C 252 72, 260 78, 258 86 C 262 92, 255 100, 248 98 C 242 102, 235 98, 234 92 C 228 90, 230 84, 232 85 Z"
                          fill="url(#poincianaBlossomOrange)"
                        />
                        <circle cx="245" cy="85" r="2.5" fill="#fef08a" />
                      </g>

                      {/* Cụm hoa điểm xuyết trung tâm vòm */}
                      <g>
                        <path
                          d="M 118 72 C 114 65, 124 58, 132 62 C 140 58, 148 65, 145 74 C 150 82, 142 90, 134 88 C 126 92, 118 88, 117 80 Z"
                          fill="url(#poincianaBlossomOrange)"
                        />
                        <circle cx="132" cy="74" r="2.2" fill="#fef08a" />
                      </g>
                      <g>
                        <path
                          d="M 172 72 C 168 65, 178 58, 186 62 C 194 58, 202 65, 199 74 C 204 82, 196 90, 188 88 C 180 92, 172 88, 171 80 Z"
                          fill="url(#poincianaBlossomRed)"
                        />
                        <circle cx="186" cy="74" r="2.2" fill="#fef08a" />
                      </g>

                      {/* Cánh hoa phượng rơi nhẹ trong gió bay xuống vỉa hè (Falling Petals) */}
                      <g className="floating-petals" opacity="0.85">
                        <ellipse cx="65" cy="145" rx="4" ry="2" fill="#ef4444" transform="rotate(-25 65 145)" />
                        <ellipse cx="110" cy="170" rx="3.5" ry="1.8" fill="#f97316" transform="rotate(20 110 170)" />
                        <ellipse cx="215" cy="165" rx="4" ry="2" fill="#ef4444" transform="rotate(35 215 165)" />
                        <ellipse cx="260" cy="140" rx="3.5" ry="1.8" fill="#f97316" transform="rotate(-15 260 140)" />
                      </g>
                    </g>
                  </g>
                )}

                {/* ------------------------------------------------------------ */}
                {/* CỌC GỖ CHỐNG ĐÔ THỊ (URBAN SAPLING STAKES ĐẶC TRƯNG GIAI ĐOẠN 2)*/}
                {/* ------------------------------------------------------------ */}
                {stageIndex === 1 && (
                  <g className="animate-in fade-in duration-300">
                    {/* Cọc chống trái */}
                    <line x1="140" y1="245" x2="157" y2="195" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Cọc chống phải */}
                    <line x1="180" y1="245" x2="163" y2="195" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Đai buộc cao su giữ thân cây */}
                    <rect x="154" y="193" width="12" height="4" rx="2" fill="#475569" stroke="#334155" strokeWidth="0.8" />
                  </g>
                )}

                {/* ------------------------------------------------------------ */}
                {/* BIỂN HỢP KIM QR NEO BLOCKCHAIN ĐÓNG THÂN (GIAI ĐOẠN 3 & 4)   */}
                {/* ------------------------------------------------------------ */}
                {matureFactor > 0.05 && (
                  <g style={{ opacity: matureFactor }} filter="url(#glowEffect)">
                    <rect
                      x="154"
                      y={treeSpecies === 'palm' ? '185' : '178'}
                      width="12"
                      height="15"
                      rx="2"
                      fill="#ffffff"
                      stroke="#059669"
                      strokeWidth="1.2"
                    />
                    {/* Điểm định danh QR tinh tế */}
                    <rect x="156.5" y={treeSpecies === 'palm' ? '187.5' : '180.5'} width="3" height="3" fill="#064e3b" />
                    <rect x="160.5" y={treeSpecies === 'palm' ? '187.5' : '180.5'} width="3" height="3" fill="#064e3b" />
                    <rect x="156.5" y={treeSpecies === 'palm' ? '192.5' : '185.5'} width="3" height="3" fill="#064e3b" />
                    <rect x="161.5" y={treeSpecies === 'palm' ? '193.5' : '186.5'} width="2" height="2" fill="#10b981" />
                  </g>
                )}
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
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            🌱 Mầm
          </button>
          <button
            onClick={() => handleSeek(0.37)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 1
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            🌿 Chồi
          </button>
          <button
            onClick={() => handleSeek(0.62)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 2
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black'
                : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            🌳 Cây
          </button>
          <button
            onClick={() => handleSeek(0.95)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              stageIndex === 3
                ? 'bg-emerald-700 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black'
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
