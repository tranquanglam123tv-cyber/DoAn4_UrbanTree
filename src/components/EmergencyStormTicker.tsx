import React, { useState } from 'react';
import { CloudRain, ArrowRight, X, AlertTriangle, ShieldCheck, CheckCircle2, Scissors, Leaf, Volume2, VolumeX } from 'lucide-react';
import { isSirenSoundEnabled, setSirenSoundEnabled, playEmergencySirenSound } from '../utils/soundAndAlertUtils';

interface EmergencyStormTickerProps {
  onOpenAction: () => void;
  neededCount?: number;
  highUrgencyCount?: number;
}

export const EmergencyStormTicker: React.FC<EmergencyStormTickerProps> = ({
  onOpenAction,
  neededCount = 0,
  highUrgencyCount = 0,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [sirenOn, setSirenOn] = useState(() => isSirenSoundEnabled());

  const isAllSafe = neededCount === 0;

  const handleToggleSiren = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !sirenOn;
    setSirenOn(next);
    setSirenSoundEnabled(next);
    if (next) {
      playEmergencySirenSound(1.2);
    }
  };

  if (isDismissed) {
    // Mini launcher button to restore ticker if dismissed
    return (
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsDismissed(false)}
          title={isAllSafe ? 'Xem giám sát an toàn đô thị' : 'Mở lại Báo động Mùa Bão'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-lg border cursor-pointer transition-transform hover:scale-105 ${
            isAllSafe
              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400'
              : 'bg-amber-500 hover:bg-amber-600 border-amber-300 animate-bounce'
          }`}
        >
          {isAllSafe ? <ShieldCheck className="w-4 h-4" /> : <CloudRain className="w-4 h-4" />}
          <span>{isAllSafe ? 'Đô Thị: An Toàn Tuyệt Đối' : `Báo Động Bão (${neededCount} cây)`}</span>
        </button>
      </div>
    );
  }

  // Dòng thông báo tùy biến động theo trạng thái an toàn
  const safeMessage =
    '🌿 Giám sát không gian đô thị: Không có cảnh báo nguy hiểm nào. 100% cây xanh loại 2 & loại 3 đã được cắt tỉa hạ tán an toàn và bảo chứng trên Smart Contract. Toàn thành phố bình yên đón mùa mưa bão!';

  const dangerMessage = `Chiến Dịch Rà Soát Cắt Tỉa Hạ Độ Cao Đón Mùa Mưa Bão (Tháng 5 – Tháng 11): Hệ thống phát hiện ${neededCount} cây loại 2 & loại 3 cao trên 7m chưa được cắt tỉa quá 180 ngày (có ${highUrgencyCount} cây nguy cơ cao gãy đổ khi giông lốc). Đề nghị các tổ KTV điều động xe thang xử lý ngay!`;

  return (
    <div className="relative z-0 w-full max-w-[1440px] mx-auto transition-all duration-300">
      <div
        className={`relative overflow-hidden rounded-full border shadow-sm backdrop-blur-xl px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2.5 marquee-container transition-colors duration-500 ${
          isAllSafe
            ? 'bg-gradient-to-r from-emerald-50/95 via-teal-50/90 to-emerald-50/95 dark:from-slate-900/95 dark:via-emerald-950/50 dark:to-slate-900/95 border-emerald-400/70 dark:border-emerald-600/60 shadow-emerald-950/10'
            : 'bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-amber-50/95 dark:from-slate-900/95 dark:via-amber-950/50 dark:to-slate-900/95 border-amber-400/60 dark:border-amber-600/50 shadow-amber-950/5'
        }`}
      >
        {/* Left: Status Badge */}
        <div
          className={`flex items-center gap-1.5 shrink-0 z-10 px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
            isAllSafe
              ? 'bg-emerald-500/20 dark:bg-emerald-900/60 border-emerald-400/70 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-500/20 dark:bg-amber-900/60 border-amber-400/60 dark:border-amber-500/50 text-amber-950 dark:text-amber-200'
          }`}
        >
          {isAllSafe ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          )}
          <span className="text-[10px] sm:text-[11px] font-black tracking-wide uppercase whitespace-nowrap">
            {isAllSafe ? '🛡️ Không Có Nguy Hiểm' : '⛈️ Báo Động Mùa Bão'}
          </span>
        </div>

        {/* Center: Running Marquee Ticker */}
        <div className="flex-1 overflow-hidden relative cursor-default select-none mx-1 sm:mx-2">
          <div
            className={`animate-marquee flex items-center gap-8 py-0.5 text-xs font-semibold ${
              isAllSafe ? 'text-emerald-900 dark:text-emerald-200' : 'text-amber-950 dark:text-amber-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {isAllSafe ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 inline" />
              )}
              {isAllSafe ? safeMessage : dangerMessage}
            </span>
            <span className="flex items-center gap-2">
              {isAllSafe ? (
                <Leaf className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 inline" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0 inline" />
              )}
              {isAllSafe ? safeMessage : dangerMessage}
            </span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
          {!isAllSafe && (
            <button
              onClick={handleToggleSiren}
              className={`p-1 sm:px-2 sm:py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                sirenOn
                  ? 'bg-rose-500/20 border-rose-400 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-200/60 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-700'
              }`}
              title={sirenOn ? 'Còi hú báo động đang BẬT. Bấm để tắt tiếng' : 'Còi hú báo động đang TẮT. Bấm để bật'}
            >
              {sirenOn ? <Volume2 className="w-3 h-3 text-rose-600 animate-pulse" /> : <VolumeX className="w-3 h-3" />}
              <span className="hidden sm:inline">{sirenOn ? 'Còi Hú' : 'Tắt Còi'}</span>
            </button>
          )}

          <span
            className={`hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold text-white shadow-2xs ${
              isAllSafe ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          >
            {isAllSafe ? '✅ 100% An Toàn' : `${neededCount} Cây Cần Hạ Tán`}
          </span>

          <button
            onClick={onOpenAction}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-white font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1 shadow-xs hover:shadow-sm active:scale-95 cursor-pointer whitespace-nowrap ${
              isAllSafe ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
            title={isAllSafe ? 'Xem chi tiết trạng thái an toàn' : 'Mở bảng điều hành xử lý cắt tỉa ngay'}
          >
            {isAllSafe ? (
              <>
                <span>Xem trạng thái</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>Xử lý cắt tỉa ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className={`p-1 rounded-full transition-colors cursor-pointer ${
              isAllSafe
                ? 'text-emerald-700 hover:text-emerald-950 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'text-amber-700 hover:text-amber-950 dark:text-amber-400 hover:bg-amber-500/20'
            }`}
            title="Ẩn thanh này"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
