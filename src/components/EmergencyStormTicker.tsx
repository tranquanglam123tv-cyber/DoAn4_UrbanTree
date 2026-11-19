import React, { useState, useEffect } from 'react';
import { CloudRain, X, AlertTriangle, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { isSirenSoundEnabled, setSirenSoundEnabled, playEmergencySirenSound } from '../utils/soundAndAlertUtils';
import { StormCampaign } from '../types';

interface EmergencyStormTickerProps {
  onOpenAction: () => void;
  neededCount?: number;
  highUrgencyCount?: number;
  campaign?: StormCampaign | null;
}

export const EmergencyStormTicker: React.FC<EmergencyStormTickerProps> = ({
  onOpenAction,
  neededCount = 0,
  highUrgencyCount = 0,
  campaign = null,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [sirenOn, setSirenOn] = useState(() => isSirenSoundEnabled());

  // Tính toán trạng thái dựa trên Persistent Campaign từ SQLite hoặc fallback in-memory count
  const remainingTrees = campaign ? campaign.remainingTrees : neededCount;
  const totalTrees = campaign ? campaign.totalDetectedTrees : (neededCount || 5424);
  const resolvedTrees = campaign ? campaign.resolvedTrees : (totalTrees - remainingTrees);
  const progressPercent = totalTrees > 0 ? Math.round((resolvedTrees / totalTrees) * 100) : 100;

  const isResolved = campaign
    ? campaign.status === 'RESOLVED' || campaign.remainingTrees === 0
    : neededCount === 0;

  const isNearCompletion = !isResolved && (
    (campaign && campaign.status === 'NEAR_COMPLETION') ||
    (remainingTrees > 0 && remainingTrees <= 50)
  );

  const isInProgress = !isResolved && !isNearCompletion && (
    (campaign && (campaign.status === 'IN_PROGRESS' || campaign.inProgressTrees > 0 || campaign.assignedTrees > 0 || campaign.resolvedTrees > 0)) ||
    resolvedTrees > 0
  );

  // Tự động tắt còi khi chiến dịch đã hoàn tất (RESOLVED)
  useEffect(() => {
    if (isResolved && sirenOn) {
      setSirenOn(false);
      setSirenSoundEnabled(false);
    }
  }, [isResolved, sirenOn]);

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
    return (
      <div className="fixed bottom-20 sm:bottom-5 left-4 sm:left-5 z-40">
        <button
          onClick={() => setIsDismissed(false)}
          title={isResolved ? 'Xem giám sát an toàn đô thị' : 'Mở lại Báo động Mùa Bão'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-800 dark:text-slate-100 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isResolved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isResolved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <span>
            {isResolved
              ? 'Đô Thị: An Toàn Tuyệt Đối'
              : isInProgress
              ? `Đang Triển Khai (Còn ${remainingTrees} cây)`
              : `Báo Động Bão (${remainingTrees} cây)`}
          </span>
        </button>
      </div>
    );
  }

  // Thông điệp động theo 4 giai đoạn vòng đời chiến dịch
  let message = '';
  let badgeText = '';

  if (isResolved) {
    badgeText = 'ĐÃ HOÀN THÀNH';
    message = `Chiến dịch mùa bão đã hoàn thành: ${totalTrees}/${totalTrees} cây nguy cơ cao đã được rà soát, cắt tỉa an toàn và lưu nhật ký Smart Contract. Toàn thành phố bình yên!`;
  } else if (isNearCompletion) {
    badgeText = 'SẮP HOÀN THÀNH';
    message = `Chiến dịch sắp hoàn thành: Đã xử lý ${resolvedTrees}/${totalTrees} cây (${progressPercent}%). Chỉ còn ${remainingTrees} cây đang chờ hoàn tất và nghiệm thu ngoài hiện trường!`;
  } else if (isInProgress) {
    badgeText = 'ĐANG TRIỂN KHAI';
    message = `Chiến dịch mùa bão đang thi công: Đã xử lý & nghiệm thu ${resolvedTrees}/${totalTrees} cây (${progressPercent}%) — Còn ${remainingTrees} cây đang được các tổ KTV cắt tỉa hạ tán trên tuyến.`;
  } else {
    badgeText = 'BÁO ĐỘNG MÙA BÃO';
    message = `Chiến dịch cắt tỉa hạ độ cao đón mùa mưa bão: Hệ thống phát hiện ${remainingTrees} cây loại 2 & 3 cao trên 7m chưa được cắt tỉa quá 180 ngày (có ${highUrgencyCount} cây nguy cơ cao). Đề nghị các tổ KTV xử lý ngay!`;
  }

  return (
    <div className="relative z-0 w-full max-w-[1440px] mx-auto transition-all duration-300">
      {/* 🏛️ Enterprise Glass White Container */}
      <div className="relative overflow-hidden rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs backdrop-blur-md px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2.5 marquee-container transition-colors duration-300">
        
        {/* Left: Minimalist Status Badge with 1 subtle amber indicator dot */}
        <div className="flex items-center gap-2 shrink-0 z-10 px-2.5 py-0.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isResolved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isResolved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase whitespace-nowrap text-slate-700 dark:text-slate-200">
            {badgeText}
          </span>
        </div>

        {/* Center: Running Marquee Ticker */}
        <div className="flex-1 overflow-hidden relative cursor-default select-none mx-1 sm:mx-2">
          <div className="animate-marquee flex items-center gap-8 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2">
              {isResolved ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 inline" />
              )}
              <span>{message}</span>
            </span>
            <span className="flex items-center gap-2">
              {isResolved ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 inline" />
              )}
              <span>{message}</span>
            </span>
          </div>
        </div>

        {/* Right: Clean Action Button Hierarchy */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          {/* Subtle Siren Sound Icon Toggle (no loud pink box) */}
          {!isResolved && (
            <button
              onClick={handleToggleSiren}
              className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                sirenOn
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={sirenOn ? 'Âm thanh còi hú đang BẬT (bấm để tắt tiếng)' : 'Âm thanh còi hú đang TẮT (bấm để bật)'}
            >
              {sirenOn ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Primary Action Button (Emerald Green, Clean Text Only) */}
          <button
            onClick={onOpenAction}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
            title={isResolved ? 'Xem chi tiết kết quả chiến dịch' : 'Mở điều hành xử lý cắt tỉa'}
          >
            <span>{isResolved ? 'Xem kết quả' : 'Xử lý ngay'}</span>
          </button>

          {/* Close / Dismiss Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Ẩn thông báo này"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
