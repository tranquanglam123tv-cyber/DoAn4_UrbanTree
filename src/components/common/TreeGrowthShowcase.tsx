import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Pause, RotateCcw, Sprout, Leaf, Trees, ShieldCheck } from 'lucide-react';

interface GrowthStage {
  name: string;
  sub: string;
  age: string;
  co2: string;
  height: string;
  canopy: string;
  badge: string;
}

const STAGES: GrowthStage[] = [
  {
    name: 'Gieo Hạt Mầm',
    sub: 'Hạt giống tuyển chọn bén rễ sâu vào đất bazan Cần Thơ',
    age: 'Tuần 1 - 4',
    co2: '0.1 kg/tháng',
    height: '0.15 m',
    canopy: '0.1 m',
    badge: 'ƯƠM TẠO SINH HỌC',
  },
  {
    name: 'Chồi Non Đâm Lộc',
    sub: 'Thân mọc thẳng, 4 lá mầm đầu tiên đón nắng phù sa sông Hậu',
    age: 'Tháng 6',
    co2: '2.4 kg/năm',
    height: '1.2 m',
    canopy: '0.8 m',
    badge: 'SINH TRƯỞNG TỰ NHIÊN',
  },
  {
    name: 'Cây Trẻ Vươn Tán',
    sub: 'Phân tầng cành nhánh, chịu gió giông và hấp thụ nhiệt vỉa hè',
    age: 'Năm thứ 3',
    co2: '18.5 kg/năm',
    height: '4.5 m',
    canopy: '3.2 m',
    badge: 'ĐÃ GẮN MÃ QR THÂN',
  },
  {
    name: 'Đại Thụ Đô Thị 4.0',
    sub: 'Tán lá rộng che mát tuyến phố, giám sát bằng GIS & Smart Contract',
    age: 'Năm thứ 10+',
    co2: '48.2 kg/năm',
    height: '11.8 m',
    canopy: '8.5 m',
    badge: 'BẢO CHỨNG BLOCKCHAIN',
  },
];

export const TreeGrowthShowcase: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<number>(3); // Mặc định ở Cổ Thụ hoặc lặp
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Auto cycle stages
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % STAGES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const stage = STAGES[currentStage];

  // Visual scaling factors based on current stage (0 to 3)
  const scaleProgress = [0.35, 0.55, 0.78, 1.0][currentStage];
  const foliageScale = [0.15, 0.45, 0.75, 1.0][currentStage];
  const foliageOpacity = [0.2, 0.6, 0.9, 1.0][currentStage];
  const rootGlow = [1.0, 0.7, 0.5, 0.3][currentStage];

  return (
    <div className="relative flex flex-col items-center justify-center text-center p-3 sm:p-5 max-w-sm sm:max-w-md w-full mx-auto select-none">
      {/* Stage Badge & Title */}
      <div className="mb-2 sm:mb-3 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[10px] font-extrabold uppercase tracking-widest shadow-2xs">
          <Sparkles className="w-3 h-3 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{stage.badge}</span>
        </div>
        <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>{stage.name}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
            {stage.age}
          </span>
        </div>
      </div>

      {/* SVG Living Tree Animation Canvas */}
      <div className="relative w-64 h-56 sm:w-72 sm:h-64 flex items-end justify-center">
        {/* Ambient Spores Halo */}
        <div
          className="absolute inset-0 rounded-full bg-radial from-emerald-400/20 via-teal-200/10 to-transparent blur-xl pointer-events-none transition-all duration-1000"
          style={{ transform: `scale(${0.6 + scaleProgress * 0.5})` }}
        />

        {/* Tree SVG Graphic */}
        <svg
          viewBox="0 0 300 280"
          className="w-full h-full relative z-10 overflow-visible transition-transform duration-700 ease-out"
        >
          <defs>
            {/* Trunk Gradient */}
            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#291407" />
            </linearGradient>

            {/* Lush Foliage Gradient */}
            <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="leafGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            {/* Glowing Root Filter */}
            <filter id="rootPulse" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 🌿 Ground Mound & Soil */}
          <ellipse cx="150" cy="245" rx="80" ry="12" fill="#dcfce7" />
          <ellipse cx="150" cy="248" rx="60" ry="8" fill="#14532d" opacity="0.3" />

          {/* 🌱 ROOTS UNDERGROUND (Growing downwards) */}
          <g opacity={rootGlow}>
            <path
              d="M150 245 Q135 260 120 270 M150 245 Q165 260 180 272 M150 247 Q148 265 152 278"
              stroke="#059669"
              strokeWidth={currentStage === 0 ? "2.5" : "1.8"}
              fill="none"
              strokeLinecap="round"
              filter="url(#rootPulse)"
              className="transition-all duration-700"
            />
            {currentStage === 0 && (
              <circle cx="150" cy="245" r="4.5" fill="#f59e0b" className="animate-pulse" />
            )}
          </g>

          {/* 🌳 MAIN TRUNK & BRANCHES */}
          <g
            className="transition-all duration-700 ease-out origin-bottom"
            style={{ transform: `scale(${0.4 + scaleProgress * 0.6})`, transformOrigin: '150px 245px' }}
          >
            {/* Main Trunk */}
            <path
              d="M142 245 C143 200 138 160 148 120 C151 160 157 200 158 245 Z"
              fill="url(#trunkGrad)"
            />

            {/* Left Main Branch */}
            {currentStage >= 2 && (
              <path
                d="M144 170 Q120 150 100 142 Q120 160 144 180 Z"
                fill="url(#trunkGrad)"
                className="transition-all duration-700"
              />
            )}

            {/* Right Main Branch */}
            {currentStage >= 2 && (
              <path
                d="M154 165 Q180 145 202 138 Q180 158 154 178 Z"
                fill="url(#trunkGrad)"
                className="transition-all duration-700"
              />
            )}

            {/* Bark Ring / QR Badge on Trunk */}
            {currentStage >= 2 && (
              <rect
                x="146"
                y="190"
                width="8"
                height="10"
                rx="2"
                fill="#ecfdf5"
                stroke="#059669"
                strokeWidth="1"
              />
            )}
          </g>

          {/* 🍃 FOLIAGE CROWNS (Bung tỏa tán lá) */}
          <g
            className="transition-all duration-1000 ease-out origin-center"
            style={{
              transform: `scale(${foliageScale})`,
              transformOrigin: '150px 110px',
              opacity: foliageOpacity,
            }}
          >
            {/* Center Crown Back */}
            <circle cx="150" cy="95" r="54" fill="url(#leafGrad2)" opacity="0.95" />

            {/* Left Crown */}
            <circle cx="115" cy="118" r="44" fill="url(#leafGrad1)" />

            {/* Right Crown */}
            <circle cx="185" cy="115" r="45" fill="url(#leafGrad1)" />

            {/* Top Center Crown High */}
            <circle cx="150" cy="72" r="40" fill="url(#leafGrad2)" />

            {/* Highlights / Leaf Clusters */}
            <circle cx="132" cy="85" r="26" fill="#6ee7b7" opacity="0.6" />
            <circle cx="168" cy="80" r="24" fill="#a7f3d0" opacity="0.5" />
            <circle cx="150" cy="112" r="28" fill="#34d399" opacity="0.7" />

            {/* Floating Energy Spores Around Foliage */}
            <circle cx="95" cy="80" r="2.5" fill="#facc15" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="205" cy="90" r="3" fill="#6ee7b7" className="animate-pulse" />
            <circle cx="150" cy="35" r="2" fill="#38bdf8" className="animate-bounce" />
          </g>

          {/* Seed stage specific leaf sprout */}
          {currentStage === 0 && (
            <g className="animate-bounce" style={{ animationDuration: '2s' }}>
              <path d="M150 240 Q142 225 140 220 Q148 223 150 240 Z" fill="#10b981" />
              <path d="M150 240 Q158 225 160 220 Q152 223 150 240 Z" fill="#34d399" />
            </g>
          )}

          {/* Sprout stage (1) specific tender shoots */}
          {currentStage === 1 && (
            <g className="animate-pulse" style={{ animationDuration: '2.5s' }}>
              <ellipse cx="135" cy="195" rx="14" ry="8" fill="#34d399" transform="rotate(-25 135 195)" />
              <ellipse cx="165" cy="190" rx="14" ry="8" fill="#10b981" transform="rotate(25 165 190)" />
              <ellipse cx="150" cy="170" rx="18" ry="10" fill="#6ee7b7" />
            </g>
          )}
        </svg>

        {/* Floating Metrics Pill (Bottom Overlay) */}
        <div className="absolute -bottom-2 z-20 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200 shadow-md flex items-center gap-3 text-[10px] font-bold text-slate-700 whitespace-nowrap">
          <span className="flex items-center gap-1 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Cao: {stage.height}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-teal-700">Tán: {stage.canopy}</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700">CO₂: {stage.co2}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mt-4 max-w-xs leading-relaxed line-clamp-2">
        {stage.sub}
      </p>

      {/* Interactive Stage Step Controls */}
      <div className="flex items-center gap-1.5 mt-3">
        {STAGES.map((s, idx) => (
          <button
            key={s.name}
            onClick={() => {
              setCurrentStage(idx);
              setIsPlaying(false);
            }}
            title={`${s.name} (${s.age})`}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              currentStage === idx
                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                : 'bg-white/80 hover:bg-emerald-50 text-slate-600 border border-slate-200'
            }`}
          >
            {idx === 0 && '🌱 Mầm'}
            {idx === 1 && '🌿 Chồi'}
            {idx === 2 && '🌳 Cây'}
            {idx === 3 && '🌲 Đại Thụ'}
          </button>
        ))}

        {/* Play / Pause Toggle */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Tạm dừng chu kỳ tự động' : 'Bật tự động sinh trưởng'}
          className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer ml-1"
        >
          {isPlaying ? <Pause className="w-3 h-3 text-emerald-700" /> : <Play className="w-3 h-3 text-slate-700" />}
        </button>
      </div>
    </div>
  );
};

