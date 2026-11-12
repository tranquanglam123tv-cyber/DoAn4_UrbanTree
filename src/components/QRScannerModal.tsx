import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Camera,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Link2,
} from 'lucide-react';
import jsQR from 'jsqr';
import { storage } from '../db/storage';
import { Tree } from '../types';

interface QRScannerModalProps {
  currentUser?: { role: string; fullName: string };
  onClose: () => void;
  onTreeScanned: (tree: Tree, userRole?: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  currentUser,
  onClose,
  onTreeScanned,
}) => {
  const activeUser = currentUser || storage.getActiveUser();
  const trees = storage.getTrees();
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);
  const [unmatchedQrData, setUnmatchedQrData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);
  const barcodeDetectorRef = useRef<any>(null);

  // Initialize native BarcodeDetector if supported by browser (Brave, Chrome, Edge)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });
      } catch (e) {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  // Helper xử lý nội dung giải mã từ mã QR
  const processDecodedString = (data: string): boolean => {
    if (!data || !data.trim()) return false;
    const raw = data.trim();

    let codeToFind = raw;

    try {
      // 1. Thử giải mã nếu là JSON: {"app":"UrbanTree","code":"TREE-001"}
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.code || parsed.publicCode)) {
        codeToFind = parsed.code || parsed.publicCode;
      }
    } catch {
      // 2. Thử trích xuất nếu là URL: http://.../citizen?code=TREE-001 hoặc #tree-TREE-001
      if (raw.includes('code=')) {
        const match = raw.match(/code=([A-Za-z0-9-_]+)/);
        if (match && match[1]) codeToFind = match[1];
      } else if (raw.includes('#tree-')) {
        const match = raw.match(/#tree-([A-Za-z0-9-_]+)/);
        if (match && match[1]) codeToFind = match[1];
      } else if (raw.includes('#report-')) {
        const match = raw.match(/#report-([A-Za-z0-9-_]+)/);
        if (match && match[1]) codeToFind = match[1];
      }
    }

    const clean = codeToFind.trim().toUpperCase();

    // Check against all trees by publicCode or ID
    const tree =
      storage.getTreeByPublicCode(clean) ||
      trees.find(
        (t) =>
          t.publicCode.toUpperCase() === clean ||
          t.id.toUpperCase() === clean ||
          raw.toUpperCase().includes(t.publicCode.toUpperCase())
      );

    if (tree) {
      setScannedSuccess(`[${tree.publicCode}] ${tree.displayName}`);
      setError(null);
      setUnmatchedQrData(null);
      stopCamera();

      // Trigger slight haptic feedback on mobile if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(100);
      }

      setTimeout(() => {
        onTreeScanned(tree, activeUser.role);
        onClose();
      }, 700);
      return true;
    } else {
      // Nhận diện được mã QR hợp lệ nhưng không phải mã UrbanTree (ví dụ mã Vietcombank, Momo, link web...)
      // Hiển thị thông báo nhận diện thành công và cho phép người dùng mở cây mẫu thử nghiệm ngay!
      setUnmatchedQrData(raw);
      setError(null);
      return false;
    }
  };

  // Quét từng frame video bằng BarcodeDetector hoặc jsQR
  const scanVideoFrame = async () => {
    if (!isScanningRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const now = performance.now();

    // Throttle to every 80ms for optimal 12fps scanning with 0% CPU lag
    if (now - lastScanTimeRef.current > 80 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      lastScanTimeRef.current = now;

      try {
        let detectedText: string | null = null;

        // Phương thức 1: Sử dụng Native BarcodeDetector (GPU accelerated) nếu có
        if (barcodeDetectorRef.current) {
          try {
            const barcodes = await barcodeDetectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detectedText = barcodes[0].rawValue;
            }
          } catch {
            // fallback to jsQR
          }
        }

        // Phương thức 2: Fallback tối ưu bằng jsQR với downscaled canvas
        if (!detectedText && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            // Downscale to max 640px for 10x faster decoding and lower memory
            const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              detectedText = code.data;
            }
          }
        }

        // Xử lý khi tìm thấy mã
        if (detectedText) {
          const matched = processDecodedString(detectedText);
          if (matched) return; // Đã tìm thấy cây và dừng
        }
      } catch (err) {
        console.warn('Lỗi xử lý frame QR:', err);
      }
    }

    if (isScanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  // Khởi động Camera thật của thiết bị
  const startCamera = async () => {
    setError(null);
    setCameraLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh trực tiếp qua kết nối này.');
      }

      // Ưu tiên camera sau (facingMode: environment)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();

        isScanningRef.current = true;
        setCameraActive(true);
        setCameraLoading(false);

        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      console.warn('Lỗi Camera:', err);
      isScanningRef.current = false;
      setCameraLoading(false);
      setCameraActive(false);
      setError(
        'Không thể mở Camera (Có thể do chưa cấp quyền hoặc trình duyệt chặn). Bạn có thể bấm "Chụp / Chọn ảnh" hoặc chọn nhanh cây mẫu bên dưới.'
      );
    }
  };

  // Tắt camera
  const stopCamera = () => {
    isScanningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Tự động mở camera khi modal xuất hiện
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Xử lý quét mã QR qua ảnh chụp / upload từ thiết bị
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Downscale for fast reliable scanning
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          processDecodedString(code.data);
        } else {
          setError('Không nhận diện được mã QR trong bức ảnh này. Vui lòng chụp vuông góc và rõ nét hơn.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Nhập mã thủ công
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    processDecodedString(manualCode);
  };

  // Chọn cây mẫu demo nhanh
  const handleSelectDemoTree = (tree: Tree) => {
    stopCamera();
    onTreeScanned(tree, activeUser.role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden border border-[#E0EBDD] dark:border-emerald-500/30 dark:text-slate-100 text-xs flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400 dark:border dark:border-emerald-800/50 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#174B36] dark:text-emerald-400">
                Quét Mã QR Cây xanh
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Đang quét với tư cách:
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeUser.role === 'ADMIN'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 dark:border dark:border-purple-800/50'
                      : activeUser.role === 'STAFF'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 dark:border dark:border-emerald-800/50'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 dark:border dark:border-blue-800/50'
                  }`}
                >
                  {activeUser.role === 'ADMIN'
                    ? '👑 Quản trị viên (ADMIN)'
                    : activeUser.role === 'STAFF'
                    ? '🛠️ Nhân viên (STAFF)'
                    : '👤 Người dân (CITIZEN)'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Real Camera Viewport */}
          <div className="relative aspect-square rounded-2xl bg-slate-950 overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800 dark:border-emerald-500/30 shadow-inner">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {/* Hidden Canvas for Frame Processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Viewfinder Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
              {/* Laser Scan Animation */}
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />
            </div>

            {/* Corner Indicators */}
            <div className="absolute top-6 left-6 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl pointer-events-none" />
            <div className="absolute top-6 right-6 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr pointer-events-none" />
            <div className="absolute bottom-6 left-6 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl pointer-events-none" />
            <div className="absolute bottom-6 right-6 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br pointer-events-none" />

            {/* Scanned Success Overlay */}
            {scannedSuccess && (
              <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 animate-fade-in p-4 text-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-pulse mb-2" />
                <div className="font-bold text-sm">Đã nhận diện thành công!</div>
                <div className="font-mono font-bold text-emerald-300 mt-1 text-sm bg-black/40 px-3 py-1 rounded-lg border border-emerald-500/40">
                  {scannedSuccess}
                </div>
                <div className="text-[11px] text-emerald-200/80 mt-2">
                  Đang mở hồ sơ quản trị &amp; tra cứu...
                </div>
              </div>
            )}

            {/* Camera Loading State */}
            {cameraLoading && !cameraActive && (
              <div className="flex flex-col items-center gap-2 text-white/70">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span>Đang kết nối máy ảnh thiết bị...</span>
              </div>
            )}

            {/* Camera Fallback State (When camera is blocked / unsupported) */}
            {!cameraActive && !cameraLoading && (
              <div className="p-4 text-center text-white space-y-3 z-10">
                <Camera className="w-10 h-10 text-white/40 mx-auto" />
                <div className="font-semibold text-xs text-white/90">Máy ảnh chưa sẵn sàng</div>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Thử lại máy ảnh
                </button>
              </div>
            )}
          </div>

          {/* Quick Action: Take/Upload Photo Button */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#E0EBDD] hover:bg-[#d2e2ce] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-[#174B36] dark:text-emerald-300 dark:border dark:border-emerald-800/50 font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Chụp / Chọn ảnh mã QR</span>
            </button>
          </div>

          {/* 🌟 THÔNG BÁO THÔNG MINH KHI QUÉT ĐƯỢC MÃ QR THỰC TẾ (NHƯ VIETCOMBANK / MÃ NGOÀI) */}
          {unmatchedQrData && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/70 border-2 border-emerald-400 text-emerald-950 dark:text-emerald-200 text-xs space-y-2.5 animate-fade-in shadow-md">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Máy ảnh đã đọc thành công mã QR!</span>
              </div>
              <div className="font-mono text-[11px] bg-white/80 dark:bg-black/50 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 break-all text-slate-800 dark:text-slate-200 max-h-16 overflow-y-auto">
                {unmatchedQrData}
              </div>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
                Mã này chưa được gán trong hệ thống UrbanTree. Bạn có thể mở ngay cây mẫu để xem quy trình quản trị thực tế:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectDemoTree(trees[0])}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Mở Cây Mẫu [TREE-001]</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Hoặc nhập mã công khai:
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ví dụ: TREE-001"
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[#174B36] dark:text-emerald-400 bg-white dark:bg-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#174B36]/20 dark:focus:ring-emerald-500/30"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shrink-0 transition-transform shadow-xs cursor-pointer"
              >
                Mở cây
              </button>
            </form>
          </div>

          {/* Quick Demo Trees Selection */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Chọn nhanh cây mẫu thử nghiệm:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {trees.slice(0, 4).map((tree) => (
                <button
                  key={tree.id}
                  onClick={() => handleSelectDemoTree(tree)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-[#E0EBDD] dark:hover:bg-emerald-950/60 hover:text-[#174B36] dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-left transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 pr-1">
                    <div className="font-mono font-bold text-[11px] text-slate-900 dark:text-slate-100">
                      {tree.publicCode}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {tree.displayName}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
