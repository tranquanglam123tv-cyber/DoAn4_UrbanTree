import React, { useState, useEffect } from 'react';
import { CloudRain, ArrowRight, X, AlertTriangle, ShieldCheck, CheckCircle2, Scissors, Leaf, Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-lg border cursor-pointer transition-transform hover:scale-105 ${
            isResolved
              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400'
              : isInProgress
              ? 'bg-blue-600 hover:bg-blue-700 border-blue-400 animate-pulse'
              : 'bg-amber-500 hover:bg-amber-600 border-amber-300 animate-bounce'
          }`}
        >
          {isResolved ? <ShieldCheck className="w-4 h-4" /> : <CloudRain className="w-4 h-4" />}
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
  let containerBg = '';
  let badgeBg = '';

  if (isResolved) {
    badgeText = '🛡️ ĐÃ HOÀN THÀNH';
    message = `✅ CHIẾN DỊCH MÙA BÃO ĐÃ HOÀN THÀNH: ${totalTrees}/${totalTrees} cây nguy cơ cao đã được rà soát, cắt tỉa cành an toàn và lưu nhật ký Smart Contract. Toàn thành phố bình yên đón mùa mưa bão!`;
    containerBg = 'bg-gradient-to-r from-emerald-50/95 via-teal-50/90 to-emerald-50/95 dark:from-slate-900/95 dark:via-emerald-950/50 dark:to-slate-900/95 border-emerald-400/70 dark:border-emerald-600/60 shadow-emerald-950/10';
    badgeBg = 'bg-emerald-500/20 dark:bg-emerald-900/60 border-emerald-400/70 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-200';
  } else if (isNearCompletion) {
    badgeText = '⏳ SẮP HOÀN THÀNH';
    message = `🟡 CHIẾN DỊCH SẮP HOÀN THÀNH: Đã xử lý ${resolvedTrees}/${totalTrees} cây (${progressPercent}%). Chỉ còn ${remainingTrees} cây đang chờ hoàn tất và nghiệm thu ngoài hiện trường!`;
    containerBg = 'bg-gradient-to-r from-amber-50/95 via-yellow-50/90 to-amber-50/95 dark:from-slate-900/95 dark:via-amber-950/50 dark:to-slate-900/95 border-amber-400/60 dark:border-amber-600/50 shadow-amber-950/5';
    badgeBg = 'bg-amber-500/20 dark:bg-amber-900/60 border-amber-400/60 dark:border-amber-500/50 text-amber-950 dark:text-amber-200';
  } else if (isInProgress) {
    badgeText = '⚡ ĐANG TRIỂN KHAI';
    message = `🟠 CHIẾN DỊCH MÙA BÃO ĐANG THI CÔNG: Đã xử lý & nghiệm thu ${resolvedTrees}/${totalTrees} cây (${progressPercent}%) — Còn ${remainingTrees} cây đang được các tổ KTV cắt tỉa hạ tán trên tuyến.`;
    containerBg = 'bg-gradient-to-r from-orange-50/95 via-amber-50/90 to-orange-50/95 dark:from-slate-900/95 dark:via-orange-950/50 dark:to-slate-900/95 border-orange-400/60 dark:border-orange-600/50 shadow-orange-950/5';
    badgeBg = 'bg-orange-500/20 dark:bg-orange-900/60 border-orange-400/60 dark:border-orange-500/50 text-orange-950 dark:text-orange-200';
  } else {
    badgeText = '⛈️ BÁO ĐỘNG MÙA BÃO';
    message = `Chiến Dịch Rà Soát Cắt Tỉa Hạ Độ Cao Đón Mùa Mưa Bão (Tháng 5 – Tháng 11): Hệ thống phát hiện ${remainingTrees} cây loại 2 & loại 3 cao trên 7m chưa được cắt tỉa quá 180 ngày (có ${highUrgencyCount} cây nguy cơ cao). Đề nghị các tổ KTV điều động xe thang xử lý ngay!`;
    containerBg = 'bg-gradient-to-r from-amber-50/95 via-rose-50/90 to-amber-50/95 dark:from-slate-900/95 dark:via-rose-950/50 dark:to-slate-900/95 border-amber-400/60 dark:border-rose-600/50 shadow-amber-950/5';
    badgeBg = 'bg-amber-500/20 dark:bg-amber-900/60 border-amber-400/60 dark:border-amber-500/50 text-amber-950 dark:text-amber-200';
  }

  return (
    <div className="relative z-0 w-full max-w-[1440px] mx-auto transition-all duration-300">
      <div className={`relative overflow-hidden rounded-full border shadow-sm backdrop-blur-xl px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2.5 marquee-container transition-colors duration-500 ${containerBg}`}>
        {/* Left: Status Badge */}
        <div className={`flex items-center gap-1.5 shrink-0 z-10 px-2.5 py-0.5 rounded-full border transition-all duration-300 ${badgeBg}`}>
          {isResolved ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : isNearCompletion ? (
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-spin" />
          ) : (
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isInProgress ? 'bg-orange-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isInProgress ? 'bg-orange-500' : 'bg-amber-500'}`} />
            </span>
          )}
          <span className="text-[10px] sm:text-[11px] font-black tracking-wide uppercase whitespace-nowrap">
            {badgeText}
          </span>
        </div>

        {/* Center: Running Marquee Ticker */}
        <div className="flex-1 overflow-hidden relative cursor-default select-none mx-1 sm:mx-2">
          <div className={`animate-marquee flex items-center gap-8 py-0.5 text-xs font-semibold ${
            isResolved
              ? 'text-emerald-900 dark:text-emerald-200'
              : isInProgress
              ? 'text-orange-950 dark:text-orange-200'
              : 'text-amber-950 dark:text-amber-200'
          }`}>
            <span className="flex items-center gap-2">
              {isResolved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
              ) : isNearCompletion ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 inline" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 inline" />
              )}
              {message}
            </span>
            <span className="flex items-center gap-2">
              {isResolved ? (
                <Leaf className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 inline" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0 inline" />
              )}
              {message}
            </span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
          {!isResolved && (
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
              isResolved
                ? 'bg-emerald-600'
                : isNearCompletion
                ? 'bg-amber-600'
                : isInProgress
                ? 'bg-orange-600'
                : 'bg-amber-500'
            }`}
          >
            {isResolved
              ? '✅ 100% An Toàn'
              : isInProgress
              ? `Đã Xử Lý: ${progressPercent}% (Còn ${remainingTrees})`
              : `${remainingTrees} Cây Cần Hạ Tán`}
          </span>

          <button
            onClick={onOpenAction}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-white font-bold text-[11px] sm:text-xs transition-all flex items-center gap-1 shadow-xs hover:shadow-sm active:scale-95 cursor-pointer whitespace-nowrap ${
              isResolved
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : isNearCompletion
                ? 'bg-amber-600 hover:bg-amber-700'
                : isInProgress
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
            title={isResolved ? 'Xem chi tiết kết quả chiến dịch' : 'Mở điều hành xử lý cắt tỉa'}
          >
            {isResolved ? (
              <>
                <span>Xem kết quả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>{isInProgress ? 'Vào ca xử lý' : 'Xử lý cắt tỉa ngay'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className={`p-1 rounded-full transition-colors cursor-pointer ${
              isResolved
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
