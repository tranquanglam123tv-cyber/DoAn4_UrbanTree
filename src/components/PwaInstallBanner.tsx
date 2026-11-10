import React, { useEffect, useState } from 'react';
import { Download, Share2, X, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem ứng dụng đã đang chạy ở chế độ Standalone (đã cài đặt) chưa
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    // 2. Nhận diện thiết bị iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !('MSStream' in window);
    setIsIOS(isIOSDevice);

    // 3. Kiểm tra xem người dùng đã bấm tắt thông báo chưa
    const isDismissed = localStorage.getItem('urbantree_pwa_banner_dismissed') === 'true';
    setDismissed(isDismissed);

    // 4. Bắt sự kiện beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Không hiển thị nếu đã ở dạng standalone hoặc đã dismiss
  if (isStandalone || dismissed) {
    return null;
  }

  // Không hiển thị nếu không có prompt trên Android và cũng không phải iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('urbantree_pwa_banner_dismissed', 'true');
  };

  return (
    <>
      {/* Floating Modern Pill on Bottom Right / Bottom Center on Mobile */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-bounce-short">
        <div className="bg-[#174B36] text-white rounded-2xl p-3.5 shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
              <Smartphone className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Cài đặt Ứng dụng UrbanTree</h4>
              <p className="text-[11px] text-emerald-200/90 truncate">Mở toàn màn hình, mượt mà như Native App</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#0A261B] text-xs font-bold rounded-lg transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </button>
            <button
              onClick={handleDismiss}
              title="Đóng thông báo"
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white text-[#1E2922] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#E0EBDD] animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#174B36] flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4 text-emerald-300" />
                </div>
                <h3 className="font-bold text-sm text-[#174B36]">Cài đặt trên iPhone/iPad</h3>
              </div>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-gray-600">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E0EBDD] text-[#174B36] font-bold shrink-0 text-[10px]">1</span>
                <p>
                  Nhấn vào nút <span className="inline-flex items-center gap-1 font-semibold text-[#174B36] bg-gray-100 px-1.5 py-0.5 rounded"><Share2 className="w-3 h-3" /> Chia sẻ (Share)</span> ở thanh dưới cùng Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E0EBDD] text-[#174B36] font-bold shrink-0 text-[10px]">2</span>
                <p>
                  Cuộn xuống danh sách tác vụ và chọn <strong className="text-gray-800">"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E0EBDD] text-[#174B36] font-bold shrink-0 text-[10px]">3</span>
                <p>
                  Nhấn <strong className="text-gray-800">"Thêm" (Add)</strong> ở góc trên bên phải để hoàn tất.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Icon độc lập màn hình chính
              </span>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="px-4 py-1.5 bg-[#174B36] text-white text-xs font-semibold rounded-xl hover:bg-[#123929]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

