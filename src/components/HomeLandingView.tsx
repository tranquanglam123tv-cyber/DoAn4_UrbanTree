import React, { useState, useEffect } from 'react';
import {
  Trees,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  Plus,
  QrCode,
  MapPin,
  ExternalLink,
  Sparkles,
  Activity,
  Layers,
  Search,
  LogIn,
  Sliders,
  ChevronRight,
  Building2,
  PhoneCall,
  Clock,
  HelpCircle,
  FileCheck2,
  Camera,
  Compass,
  Cpu,
  Database,
  Radio,
  Send,
  Users,
  Shield,
  Zap,
  LocateFixed,
  Navigation,
} from 'lucide-react';
import { storage } from '../db/storage';
import { blockchainService } from '../services/blockchainService';
import { Tree, User } from '../types';
import { calculateHaversineDistance, findNearestTree } from '../utils/treeUtils';
import { CAN_THO_ZONES } from '../utils/zoneUtils';
import { HudBadge } from './common/HudBadge';
import { PerspectiveTiltShowcase } from './common/PerspectiveTiltShowcase';
import { TreeGrowthShowcase } from './common/TreeGrowthShowcase';

interface HomeLandingViewProps {
  currentUser?: User;
  onOpenMap: () => void;
  onOpenReport: () => void;
  onOpenQrScanner: () => void;
  onOpenAdminDashboard: () => void;
  onOpenLogin: () => void;
  onSelectTree: (tree: Tree) => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  currentUser,
  onOpenMap,
  onOpenReport,
  onOpenQrScanner,
  onOpenAdminDashboard,
  onOpenLogin,
  onSelectTree,
}) => {
  const stats = storage.getDashboardStats();
  const trees = storage.getTrees();
  const incidents = storage.getIncidents();
  const anchors = blockchainService.getAllAnchors().slice(0, 5);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // 📍 GPS Live Radar States
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [nearestTreeInfo, setNearestTreeInfo] = useState<{ tree: Tree; distanceM: number } | null>(null);
  const [currentZoneName, setCurrentZoneName] = useState<string>('Quận Ninh Kiều (Trung tâm TP)');

  // Auto trigger GPS detection on mount (or fallback gracefully to central Cần Thơ)
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });

          // Find nearest tree
          const nearest = findNearestTree(lat, lng, trees);
          if (nearest) setNearestTreeInfo(nearest);

          // Identify zone
          if (lat < 10.02) {
            setCurrentZoneName('Quận Cái Răng (Cửa ngõ phía Nam)');
          } else if (lat > 10.05) {
            setCurrentZoneName('Quận Bình Thủy (Vùng Cảng & Sân bay)');
          } else {
            setCurrentZoneName('Quận Ninh Kiều (Đô thị Trung tâm)');
          }
        },
        () => {
          // If denied, fallback to Ninh Kiều coordinate center
          const defaultLat = 10.0355;
          const defaultLng = 105.7825;
          setUserCoords({ lat: defaultLat, lng: defaultLng });
          const nearest = findNearestTree(defaultLat, defaultLng, trees);
          if (nearest) setNearestTreeInfo(nearest);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    }
  }, [trees]);

  const handleRefreshGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });

        const nearest = findNearestTree(lat, lng, trees);
        if (nearest) setNearestTreeInfo(nearest);

        if (lat < 10.02) {
          setCurrentZoneName('Quận Cái Răng (Cửa ngõ phía Nam)');
        } else if (lat > 10.05) {
          setCurrentZoneName('Quận Bình Thủy (Vùng Cảng & Sân bay)');
        } else {
          setCurrentZoneName('Quận Ninh Kiều (Đô thị Trung tâm)');
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsError('Không thể lấy tọa độ hiện tại: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const healthyPercent = stats.totalTrees > 0 ? Math.round((stats.healthyTrees / stats.totalTrees) * 100) : 0;
  // Use nearest tree if GPS located, otherwise fallback to first tree
  const sampleTree = nearestTreeInfo ? nearestTreeInfo.tree : trees[0] || null;

  const faqs = [
    {
      q: 'Người dân có cần tạo tài khoản hoặc đăng nhập để báo cáo cây ngã đổ không?',
      a: 'Hoàn toàn KHÔNG! Để đảm bảo phản ứng nhanh trước giông lốc bão lũ, mọi người dân đều có thể bấm gửi phản ánh ngay hoặc quét mã QR trên thân cây là hệ thống chuyển thẳng vào form báo cáo sự cố có định vị GPS, không đòi hỏi mật khẩu hay đăng nhập.',
    },
    {
      q: 'Quét mã QR gắn trên thân cây sẽ hiển thị những gì?',
      a: 'Khi quét mã QR bằng camera điện thoại, hệ thống sẽ mở trực tiếp trang thông tin của cây (tên loài, năm trồng, chiều cao, tọa độ) kèm ngay mẫu gửi phản ánh sự cố khẩn cấp cho chính cây đó. Nếu là cán bộ đăng nhập thì sẽ mở trang cập nhật nhật ký chăm sóc.',
    },
    {
      q: 'Thời gian tiếp nhận và xử lý sự cố nguy hiểm là bao lâu?',
      a: 'Với các sự cố ở mức NGUY CẤP (CRITICAL) như cây bật gốc, nghiêng trên 15 độ, cành lớn vướng lưới điện sinh hoạt, đội phản ứng nhanh đô thị sẽ có mặt tại hiện trường trong vòng 60-120 phút kể từ khi tiếp nhận.',
    },
    {
      q: 'Tại sao lại cần công nghệ Blockchain để quản lý cây xanh?',
      a: 'Blockchain (Chuẩn SHA-256 Canonical JSON v1) giúp lưu trữ lịch sử cắt tỉa cành, nhật ký chăm sóc và biên bản giải quyết sự cố một cách bất biến, không thể bị xóa sửa hay làm giả, đảm bảo tính minh bạch tài chính và an toàn sinh thái cho ngân sách đô thị.',
    },
    {
      q: 'Cán bộ và Kỹ thuật viên đăng nhập vào hệ thống ở đâu?',
      a: 'Cán bộ quản trị và Kỹ thuật viên bấm vào nút "Đăng nhập Cán bộ" ở góc trên cùng bên phải hoặc nút "Vào Dashboard Quản Trị". Sau khi xác thực, hệ thống sẽ mở toàn bộ phân hệ điều hành, thêm cây, ghi chăm sóc và kiểm toán On-Chain.',
    },
  ];

  return (
    <div className="space-y-16 animate-fade-in pb-20">
      {/* 🌟 1. HERO SECTION - PUBLIC PORTAL */}
      <div className="flex flex-col items-center text-center pt-4 sm:pt-8 px-2 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Automark HUD Corner-dot Tagline Badge */}
        <HudBadge label="CỔNG THÔNG TIN CÂY XANH ĐÔ THỊ THÔNG MINH TP. CẦN THƠ" />

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15]">
          Bảo Tồn &amp; Phát Triển{' '}
          <span className="text-emerald-600 dark:text-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Sinh Quyển Đô Thị
          </span>{' '}
          Bằng AI &amp; Chuỗi Khối
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Nền tảng số hóa không gian địa lý GIS bảo tồn từng cá thể cây xanh tại Cần Thơ. Hỗ trợ người dân tra cứu thông tin bằng mã QR, gửi phản ánh sự cố khẩn cấp <strong className="text-emerald-700 dark:text-emerald-400">không cần đăng nhập</strong> và bảo chứng nhật ký chăm sóc trên sổ cái Blockchain bất biến.
        </p>

        {/* Action Button Group cho Đại chúng / Người dân */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          {/* 1. Nút mở Bản đồ Cây xanh */}
          <button
            onClick={onOpenMap}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 dark:shadow-emerald-500/20 active:scale-95 group cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-200 dark:text-slate-900" />
            <span>Khám Phá Bản Đồ Cây GIS</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* 2. Nút Báo cáo sự cố người dân (Không cần đăng nhập) */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-xs sm:text-sm border border-rose-200 dark:border-rose-500/30 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Phản Ánh Sự Cố Cây (Dân Gửi)</span>
          </button>

          {/* 3. Nút Quét QR thân cây */}
          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-slate-50 dark:bg-[#0c1812] dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200/90 dark:border-emerald-500/30 transition-all shadow-sm shadow-slate-900/5 active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Quét Mã QR Cây</span>
          </button>
        </div>
      </div>

      {/* 🚀 2. AUTOMARK 3D PERSPECTIVE SCROLL TILT SHOWCASE (TỪ NẰM SANG ĐỨNG) */}
      <PerspectiveTiltShowcase
        urlBarText={userCoords ? `urbantree.cantho.gov.vn/gis/live-radar?lat=${userCoords.lat.toFixed(4)}&lng=${userCoords.lng.toFixed(4)}` : 'urbantree.cantho.gov.vn/gis/live-radar'}
        badgeText={userCoords ? 'RADAR GPS ĐANG KẾT NỐI TRỰC TIẾP' : 'RADAR TRỰC TIẾP GIS CẦN THƠ'}
      >
        <div className="relative min-h-[380px] sm:min-h-[480px] p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-50 dark:from-[#091510] dark:via-[#0c1a14] dark:to-[#070e0a]">
          {/* Background Map Visual Simulation */}
          <div className="absolute inset-0 opacity-25 dark:opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Left Hero Card - Quick Stats tự đổi theo Vùng GPS */}
          <div className="relative z-10 w-full lg:max-w-xs bg-white dark:bg-[#0c1812] p-5 rounded-2xl border border-slate-200 dark:border-emerald-500/30 shadow-xl dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] space-y-4 text-left shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Lưới GIS Cần Thơ
                </span>
              </div>

              <button
                type="button"
                onClick={handleRefreshGps}
                disabled={isLocating}
                title="Cập nhật lại GPS của tôi"
                className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-500' : ''}`} />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentZoneName}</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats.totalTrees}{' '}
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">Cây số hóa</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Độ phủ xanh đạt <strong className="text-slate-900 dark:text-white font-bold">{healthyPercent}%</strong> ở mức sinh trưởng tốt.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {stats.healthyTrees} Khỏe mạnh
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                {stats.activeIncidents} Cần xử lý
              </span>
            </div>

            <button
              onClick={onOpenMap}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Xem Bản đồ chi tiết</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 🌿 CENTER: LIVING TREE GROWTH ANIMATION (TỪ HẠT MẦM ĐẾN ĐẠI THỤ 4.0) */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-2 w-full">
            <TreeGrowthShowcase />
          </div>

          {/* Right Hero Card - Tự động đổi sang Cây gần vị trí GPS nhất */}
          {sampleTree && (
            <div className="relative z-10 w-full lg:max-w-xs bg-white dark:bg-[#0c1812] p-4 rounded-2xl border border-slate-200 dark:border-emerald-500/30 shadow-xl dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] text-left space-y-3 shrink-0 hidden md:block">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-500/30">
                  {sampleTree.publicCode}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <LocateFixed className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  {nearestTreeInfo ? `Cách bạn ~${nearestTreeInfo.distanceM}m` : 'Cây mẫu theo GPS'}
                </span>
              </div>

              <div className="w-full h-32 rounded-xl overflow-hidden relative">
                <img
                  src={sampleTree.imageUrl}
                  alt={sampleTree.displayName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="text-xs font-bold truncate">{sampleTree.displayName}</div>
                  <div className="text-[10px] text-emerald-200 truncate">{sampleTree.address}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                <span>Chiều cao: <strong className="text-slate-900 dark:text-white font-bold">{sampleTree.heightM}m</strong></span>
                <span>Đường kính: <strong className="text-slate-900 dark:text-white font-bold">{sampleTree.diameterCm}cm</strong></span>
              </div>

              <button
                onClick={() => onSelectTree(sampleTree)}
                className="w-full py-2 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Tra cứu chi tiết cây này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </PerspectiveTiltShowcase>

      {/* 📢 3. HƯỚNG DẪN NGƯỜI DÂN BÁO CÁO SỰ CỐ (ĐẶT NGAY SAU RADAR ĐỂ DÂN DỄ THẤY) */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 dark:from-[#05130b] dark:via-[#091b12] dark:to-[#041009] text-white rounded-3xl p-6 sm:p-12 relative overflow-hidden shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-transparent dark:border-emerald-500/20">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 dark:bg-emerald-900/60 border border-emerald-600/50 dark:border-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>DÀNH CHO NGƯỜI DÂN &amp; CỘNG ĐỒNG</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Hướng Dẫn Gửi Phản Ánh Cây Nguy Hiểm
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed">
              Bạn phát hiện cây nghiêng, cành khô vướng dây điện hoặc nứt rễ? Chỉ mất chưa đầy 30 giây để gửi thông tin cho đội cứu hộ - <strong className="text-emerald-300 underline underline-offset-4">hoàn toàn KHÔNG cần tạo tài khoản hay đăng nhập</strong>.
            </p>
          </div>

          {/* 4 Bước trực quan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-white/10 dark:bg-[#0c1812]/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 dark:border-emerald-500/20 space-y-3 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Quét QR Hoặc Bấm Nút
              </h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Đưa camera điện thoại quét mã QR đóng trên thân cây. Hệ thống sẽ tự nhận diện đúng cây đó. Hoặc bấm trực tiếp nút "Phản Ánh Sự Cố".
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 dark:bg-[#0c1812]/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 dark:border-emerald-500/20 space-y-3 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                2
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                Chụp Ảnh Hiện Trường
              </h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Chụp 1-2 bức ảnh rõ cành gãy, thân nghiêng hoặc vỏ cây bị mối mọt để cán bộ kỹ thuật đánh giá phương án xe nâng cắt tỉa.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 dark:bg-[#0c1812]/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 dark:border-emerald-500/20 space-y-3 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                3
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Xác Nhận Vị Trí GPS
              </h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Hệ thống tự động điền địa chỉ và vị trí bản đồ Cần Thơ. Bạn có thể để lại số điện thoại (tùy chọn) để nhận SMS thông báo khi hoàn thành.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white/10 dark:bg-[#0c1812]/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 dark:border-emerald-500/20 space-y-3 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                4
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Nhận Mã &amp; Xử Lý
              </h3>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Nhận ngay Mã phản ánh (Ví dụ: <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-300 font-mono">INC-71044</code>). Đội cứu hộ sẽ đến hiện trường xử lý.
              </p>
            </div>
          </div>

          {/* Action CTA Box */}
          <div className="p-6 bg-white/10 dark:bg-[#0c1812]/90 backdrop-blur-md rounded-2xl border border-white/20 dark:border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-base font-bold text-white">Bạn đang ở gần một cây có nguy cơ mất an toàn?</div>
              <div className="text-xs text-emerald-200">Gửi ngay thông tin để bảo vệ an toàn cho người tham gia giao thông.</div>
            </div>
            <button
              onClick={onOpenReport}
              className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Gửi Phản Ánh Ngay (Không Cần Đăng Nhập)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 🏢 4. VỀ TỔ CHỨC CHỦ QUẢN & SỨ MỆNH PHÁT TRIỂN CẦN THƠ */}
      <section className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-100 dark:border-emerald-500/30">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CƠ QUAN CHỦ QUẢN VẬN HÀNH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Ban Quản Lý Công Viên &amp; Cây Xanh Đô Thị TP. Cần Thơ
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Trực thuộc Sở Xây Dựng TP. Cần Thơ. Chịu trách nhiệm quy hoạch, trồng mới, chăm sóc, cắt tỉa và bảo tồn mạng lưới cây xanh cổ thụ, cây di sản và cảnh quan sinh thái trên toàn địa bàn các quận Ninh Kiều, Cái Răng, Bình Thủy, Ô Môn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-500/20 text-left space-y-1">
              <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Đường dây nóng 24/7
              </div>
              <div className="text-lg font-black text-emerald-950 dark:text-emerald-200 font-mono">0292.3838.114</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Cứu hộ cây ngã đổ bão lũ</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left space-y-1">
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Trụ sở điều hành
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Số 01 Đại lộ Hòa Bình</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">P. Tân An, Q. Ninh Kiều, Cần Thơ</div>
            </div>
          </div>
        </div>

        {/* 3 Giá trị cốt lõi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0f1f17]/60 border border-slate-200/80 dark:border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Trees className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Bảo Tồn Sinh Quyển Tây Đô</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mỗi cá thể cây xanh là một tài sản sinh thái quý báu. Hệ thống hướng đến mục tiêu đạt tỷ lệ che phủ xanh 12m²/người dân đô thị theo tiêu chuẩn quốc gia.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0f1f17]/60 border border-slate-200/80 dark:border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Phản Ứng Khẩn Cấp Thần Tốc</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Đội cơ động phản ứng nhanh trực chiến 24/7 trong mùa mưa dông Tây Nam Bộ, tiếp nhận phản ánh của người dân và xử lý an toàn dưới 2 giờ.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0f1f17]/60 border border-slate-200/80 dark:border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Minh Bạch Công Vụ Với Dân</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Toàn bộ kinh phí duy tu, lịch sử cắt tỉa và xử lý sự cố đều được ký số SHA-256 và công khai trên sổ cái Blockchain bất biến, không thể bị xóa sửa.
            </p>
          </div>
        </div>
      </section>

      {/* ⚙️ 4. VỀ CÁCH THỨC HOẠT ĐỘNG CỦA HỆ SINH THÁI URBANTREE 4.0 */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-100 dark:border-emerald-500/30">
            <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>KIẾN TRÚC CÔNG NGHỆ 4.0</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Cách Thức Hoạt Động Của Hệ Sinh Thái
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Sự kết hợp đồng bộ giữa bản đồ không gian GIS, mã định danh vật lý QR Code, AI phân tích hình ảnh và Blockchain A19 bảo chứng dữ liệu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Cột 1: GIS Map */}
          <div className="bg-white dark:bg-[#0c1812] p-6 rounded-3xl border border-slate-200/80 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-lg">
              01
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Số Hóa GIS Thực Địa
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Từng gốc cây được gắn tọa độ GPS chuẩn xác (vĩ độ, kinh độ), lưu trữ thông số thực địa: chiều cao, đường kính tán lá, chủng loại sinh học và hiện trạng gốc rễ.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span>Định vị vệ tinh OpenStreetMap</span>
            </div>
          </div>

          {/* Cột 2: QR Code */}
          <div className="bg-white dark:bg-[#0c1812] p-6 rounded-3xl border border-slate-200/80 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-black text-lg">
              02
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Mã QR Thân Cây Vật Lý
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Biển nhôm QR Code bền bỉ với thời tiết gắn trực tiếp ở độ cao 1.5m. Người dân quét bằng camera là mở thẳng form báo cáo sự cố ngay tại chỗ, không cần đăng nhập.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <span>Mở thẳng form phản ánh sự cố</span>
            </div>
          </div>

          {/* Cột 3: AI Gemini */}
          <div className="bg-white dark:bg-[#0c1812] p-6 rounded-3xl border border-slate-200/80 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-black text-lg">
              03
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Trí Tuệ Nhân Tạo AI
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gemini AI hỗ trợ phân tích hình ảnh tán lá, dấu hiệu rỗng ruột hoặc nấm bệnh, phân cấp rủi ro (GOOD, FAIR, POOR, CRITICAL) để ưu tiên xử lý trước mùa mưa bão.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <span>Cảnh báo nguy cơ gãy đổ sớm</span>
            </div>
          </div>

          {/* Cột 4: Blockchain */}
          <div className="bg-white dark:bg-[#0c1812] p-6 rounded-3xl border border-slate-200/80 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-lg">
              04
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Chuỗi Khối Bất Biến A19
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mọi tác vụ cắt tỉa cành, nhật ký chăm sóc và xử lý sự cố đều được băm SHA-256 Canonical JSON v1 và neo Smart Contract EVM. Dữ liệu vĩnh viễn không thể làm giả.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span>Bảo chứng mật mã học On-Chain</span>
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ 5. QUY TRÌNH VẬN HÀNH THỰC ĐỊA (DÀNH CHO ĐƠN VỊ DUY TU & KỸ THUẬT VIÊN) */}
      <section className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800">
            <ClipboardList className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>QUY TRÌNH CHUẨN CÔNG VỤ (SOP)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Quy Trình Xử Lý &amp; Cắt Tỉa Kỹ Thuật Thực Địa
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Áp dụng cho Ban Quản Lý, Đội Kỹ Thuật Viên (Staff) và Tổ Cơ Động Cắt Tỉa Cây Xanh Đô Thị.
          </p>
        </div>

        <div className="relative border-l-2 border-emerald-200 dark:border-emerald-800/60 ml-4 pl-6 sm:pl-8 space-y-8">
          {/* Step 1 */}
          <div className="relative group">
            <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center text-xs font-bold shadow-md">
              1
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Bước 1: Tiếp nhận &amp; Phân loại ưu tiên</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Tiếp nhận báo cáo từ Người dân và Tuần tra số</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                Hệ thống tự động kích hoạt vé sự cố (Incident Ticket). Trưởng ban điều hành phân công kỹ thuật viên phụ trách tuyến đường qua ứng dụng di động.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center text-xs font-bold shadow-md">
              2
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Bước 2: Xuất quân &amp; Khảo sát an toàn</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Đội kỹ thuật di chuyển cùng xe thang nâng chuyên dụng</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                Đặt rào chắn cảnh báo giao thông tạm thời. Kỹ thuật viên quét mã QR trên thân cây để xác nhận đúng cá thể và kiểm tra lịch sử cắt tỉa trước đó.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center text-xs font-bold shadow-md">
              3
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Bước 3: Thi công &amp; Chụp ảnh đối chứng</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Thực hiện hạ cành nặng, bôi vôi sát khuẩn vết cắt và dọn dẹp</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                Cắt tỉa theo đúng góc cắt chuẩn lâm nghiệp đô thị. Bắt buộc chụp ảnh hiện trường "SAU KHI XỬ LÝ" để đối chiếu với ảnh ban đầu.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative group">
            <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-emerald-700 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center text-xs font-bold shadow-md ring-4 ring-emerald-100 dark:ring-emerald-950">
              4
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Bước 4: Nghiệm thu &amp; Ký số On-Chain</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Ghi nhận nhật ký chăm sóc và neo Smart Contract</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                Kỹ thuật viên gửi biên bản nghiệm thu; thuật toán tự động băm SHA-256 nội dung và địa chỉ ví nhân viên lên Blockchain. Vé sự cố chuyển trạng thái HOÀN THÀNH (RESOLVED).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ❓ 7. CÂU HỎI THƯỜNG GẶP (FAQ) DÀNH CHO CỘNG ĐỒNG */}
      <section className="bg-slate-50/70 dark:bg-[#091510] rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-emerald-500/20 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>HỎI ĐÁP PHỔ BIẾN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Câu Hỏi Thường Gặp Của Người Dân
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Giải đáp các thắc mắc về quyền lợi báo cáo, tra cứu QR và quản lý cây đô thị Cần Thơ.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#0c1812] rounded-2xl border border-slate-200 dark:border-emerald-500/20 overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {faq.q}
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 transition-transform ${
                    activeFaq === idx ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 bg-emerald-50/30 dark:bg-emerald-950/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ⛓️ 8. SỔ CÁI BLOCKCHAIN MINH BẠCH & TỔNG ĐÀI CỨU HỘ */}
      <section className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Sổ Cái Minh Chứng Blockchain A19 Mới Nhất
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Các block mật mã bảo chứng nhật ký cây xanh và xử lý sự cố công cộng tại TP. Cần Thơ.
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 font-bold self-start sm:self-auto">
            Hợp đồng EVM: 0x71C8...12C8
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {anchors.map((anchor) => (
            <div key={anchor.txHash} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{anchor.recordType}</span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">ID: {anchor.recordId}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-mono truncate max-w-[200px] text-emerald-800 dark:text-emerald-400 font-semibold" title={anchor.txHash}>
                  TX: {anchor.txHash.slice(0, 16)}...
                </span>
                <span>{new Date(anchor.anchoredAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
