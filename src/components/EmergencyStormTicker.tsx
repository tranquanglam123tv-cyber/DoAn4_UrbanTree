import React, { useState } from 'react';
import { CloudRain, ArrowRight, X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface EmergencyStormTickerProps {
  onNavigateTrees: () => void;
  neededCount?: number;
  highUrgencyCount?: number;
}

export const EmergencyStormTicker: React.FC<EmergencyStormTickerProps> = ({
  onNavigateTrees,
  neededCount = 985,
  highUrgencyCount = 985,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    // Mini launcher button to restore ticker if dismissed
    return (
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsDismissed(false)}
          title="Mở lại Cảnh báo Bão & Chiến dịch cắt tỉa hạ tán"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg border border-amber-300 dark:border-amber-600 animate-bounce cursor-pointer transition-transform hover:scale-105"
        >
          <CloudRain className="w-4 h-4" />
          <span>Báo động Bão ({neededCount} cây)</span>
        </button>
      </div>
    );
  }

  const alertMessage = `Chiến Dịch Rà Soát Cắt Tỉa Hạ Độ Cao Đón Mùa Mưa Bão (Tháng 5 – Tháng 11): Hệ thống phát hiện ${neededCount} cây loại 2 & loại 3 cao trên 7m chưa được cắt tỉa quá 180 ngày (có ${highUrgencyCount} cây nguy cơ cao gãy đổ khi giông lốc). Đề nghị các tổ KTV điều động xe thang kiểm tra địa bàn khẩn trương!`;

  return (
    <div className="w-full max-w-[1440px] mx-auto transition-all duration-300">
      <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-amber-50/95 dark:from-slate-900/95 dark:via-amber-950/50 dark:to-slate-900/95 border border-amber-400/60 dark:border-amber-600/50 shadow-sm shadow-amber-950/5 dark:shadow-amber-950/20 backdrop-blur-xl px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2.5 marquee-container">
        {/* Left: Pulsing Status Badge */}
        <div className="flex items-center gap-1.5 shrink-0 z-10 bg-amber-500/20 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full border border-amber-400/60 dark:border-amber-500/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <div className="flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black tracking-wide text-amber-950 dark:text-amber-200 uppercase whitespace-nowrap">
              Báo Động Mùa Bão
            </span>
          </div>
        </div>

        {/* Center: Running Marquee Ticker */}
        <div className="flex-1 overflow-hidden relative cursor-default select-none mx-1 sm:mx-2">
          <div className="animate-marquee flex items-center gap-8 py-0.5 text-xs font-semibold text-amber-950 dark:text-amber-200">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 inline" />
              {alertMessage}
            </span>
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0 inline" />
              {alertMessage}
            </span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
          <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-amber-500 text-white shadow-2xs">
            {neededCount} Cây Cần Hạ Tán
          </span>
          <button
            onClick={onNavigateTrees}
            className="px-2.5 sm:px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1 shadow-xs hover:shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
            title="Xem danh sách 985 cây cần rà soát cắt tỉa"
          >
            <span>Xem danh sách</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-100 hover:bg-amber-500/20 rounded-full transition-colors cursor-pointer"
            title="Ẩn thanh cảnh báo này"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

