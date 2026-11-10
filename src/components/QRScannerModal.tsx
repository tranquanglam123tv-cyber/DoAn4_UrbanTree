import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Camera, ArrowRight, Image as ImageIcon, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import { storage } from '../db/storage';
import { Tree } from '../types';

interface QRScannerModalProps {
  onClose: () => void;
  onTreeScanned: (tree: Tree) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onTreeScanned }) => {
  const trees = storage.getTrees();
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Helper xử lý nội dung giải mã từ mã QR (chuẩn JSON, URL hoặc mã thô)
  const processDecodedString = (data: string) => {
    let codeToFind = data.trim();

    try {
      // 1. Thử giải mã nếu là JSON: {"app":"UrbanTree","code":"TREE-001"}
      const parsed = JSON.parse(data);
      if (parsed && parsed.code) {
        codeToFind = parsed.code;
      }
    } catch {
      // 2. Thử trích xuất nếu là URL: http://.../citizen?code=TREE-001 hoặc #tree-TREE-001
      if (data.includes('code=')) {
        const match = data.match(/code=([A-Za-z0-9-_]+)/);
        if (match && match[1]) codeToFind = match[1];
      } else if (data.includes('#tree-')) {
        const match = data.match(/#tree-([A-Za-z0-9-_]+)/);
        if (match && match[1]) codeToFind = match[1];
      }
    }

    const clean = codeToFind.trim().toUpperCase();
    const tree = storage.getTreeByPublicCode(clean);

    if (tree) {
      setScannedSuccess(tree.publicCode);
      stopCamera();
      setTimeout(() => {
        onTreeScanned(tree);
        onClose();
      }, 700);
      return true;
    } else {
      setError(`Nhận diện được mã "${codeToFind}" nhưng không tìm thấy cây trong hệ thống.`);
      return false;
    }
  };

  // Quét từng frame video bằng jsQR
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          const success = processDecodedString(code.data);
          if (success) return; // Dừng quét khi đã tìm thấy
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
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
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setCameraLoading(false);
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      console.warn('Lỗi Camera:', err);
      setCameraLoading(false);
      setCameraActive(false);
      setError('Không thể mở Camera (Có thể do chưa cấp quyền hoặc đang kết nối HTTP). Bạn có thể bấm "Chụp ảnh / Tải ảnh" hoặc nhập mã bên dưới.');
    }
  };

  // Tắt camera
  const stopCamera = () => {
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

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          processDecodedString(code.data);
        } else {
          setError('Không nhận diện được mã QR trong bức ảnh này. Vui lòng chụp rõ hơn.');
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
    onTreeScanned(tree);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl overflow-hidden border border-[#E0EBDD] animate-in fade-in zoom-in-95 duration-150 text-xs flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E0EBDD] text-[#174B36] rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#174B36]">Quét Mã QR Cây xanh</h2>
              <p className="text-[11px] text-slate-500">Mở hồ sơ kiểm chứng On-chain</p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }} 
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Real Camera Viewport */}
          <div className="relative aspect-square rounded-2xl bg-slate-950 overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800 shadow-inner">
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
            <div className="absolute inset-8 border-2 border-dashed border-[#F3E8B2]/80 rounded-2xl pointer-events-none flex items-center justify-center">
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
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10 animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse mb-2" />
                <div className="font-bold text-sm">Đã nhận diện thành công!</div>
                <div className="font-mono font-bold text-emerald-300 mt-1">{scannedSuccess}</div>
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
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors"
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
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#E0EBDD] hover:bg-[#d2e2ce] text-[#174B36] font-bold rounded-xl transition-colors shadow-2xs"
            >
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>Chụp / Chọn ảnh mã QR</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-600">Hoặc nhập mã công khai:</div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ví dụ: TREE-001"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-[#174B36] uppercase focus:outline-none focus:ring-2 focus:ring-[#174B36]/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] active:scale-95 text-white font-bold rounded-xl shrink-0 transition-transform shadow-xs"
              >
                Mở cây
              </button>
            </form>
          </div>

          {/* Quick Demo Trees Selection */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">Chọn nhanh cây mẫu thử nghiệm:</div>
            <div className="grid grid-cols-2 gap-2">
              {trees.slice(0, 4).map((tree) => (
                <button
                  key={tree.id}
                  onClick={() => handleSelectDemoTree(tree)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-[#E0EBDD] hover:text-[#174B36] text-slate-700 border border-slate-200 text-left transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-1">
                    <div className="font-mono font-bold text-[11px]">{tree.publicCode}</div>
                    <div className="text-[10px] text-slate-500 truncate">{tree.displayName}</div>
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
