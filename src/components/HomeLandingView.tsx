import React from 'react';
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
} from 'lucide-react';
import { storage } from '../db/storage';
import { blockchainService } from '../services/blockchainService';
import { Tree } from '../types';
import { HudBadge } from './common/HudBadge';
import { PerspectiveTiltShowcase } from './common/PerspectiveTiltShowcase';

interface HomeLandingViewProps {
  onOpenMap: () => void;
  onOpenReport: () => void;
  onOpenQrScanner: () => void;
  onOpenAdminDashboard: () => void;
  onSelectTree: (tree: Tree) => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onOpenMap,
  onOpenReport,
  onOpenQrScanner,
  onOpenAdminDashboard,
  onSelectTree,
}) => {
  const stats = storage.getDashboardStats();
  const trees = storage.getTrees();
  const incidents = storage.getIncidents();
  const anchors = blockchainService.getAllAnchors().slice(0, 5);

  const healthyPercent = stats.totalTrees > 0 ? Math.round((stats.healthyTrees / stats.totalTrees) * 100) : 0;
  const sampleTree = trees[0] || null;

  return (
    <div className="space-y-12 animate-fade-in pb-16">
      {/* 🌟 HERO SECTION - PUBLIC PORTAL */}
      <div className="flex flex-col items-center text-center pt-4 sm:pt-8 px-2 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Automark HUD Corner-dot Tagline Badge */}
        <HudBadge label="CỔNG THÔNG TIN CÂY XANH ĐÔ THỊ THÔNG MINH CẦN THƠ" />

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15]">
          Bảo Tồn &amp; Phát Triển{' '}
          <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Sinh Quyển Đô Thị
          </span>{' '}
          Bằng AI &amp; Chuỗi Khối
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Nền tảng GIS thời gian thực số hóa từng cá thể cây xanh, hỗ trợ người dân tra cứu nguồn gốc bằng mã QR, gửi phản ánh sự cố tức thời và bảo chứng lịch sử chăm sóc trên sổ cái Blockchain.
        </p>

        {/* Action Button Group cho Đại chúng / Người dân & Nút Dashboard */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          {/* 1. Nút mở Bản đồ Cây xanh */}
          <button
            onClick={onOpenMap}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95 group cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-200" />
            <span>Khám Phá Bản Đồ Cây GIS</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* 2. Nút Báo cáo sự cố người dân */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs sm:text-sm border border-rose-200 transition-all active:scale-95 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Phản Ánh Sự Cố Cây</span>
          </button>

          {/* 3. Nút Quét QR thân cây */}
          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200/90 transition-all shadow-sm shadow-slate-900/5 active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Quét Mã QR Cây</span>
          </button>

          {/* 4. Nút riêng ĐI VÀO DASHBOARD QUẢN TRỊ ADMIN */}
          <button
            onClick={onOpenAdminDashboard}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#174B36] to-[#047857] hover:from-[#133F2E] hover:to-[#065F46] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer border border-emerald-400/40"
          >
            <Sliders className="w-4 h-4 text-emerald-300" />
            <span>Vào Dashboard Quản Trị</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🚀 AUTOMARK 3D PERSPECTIVE SCROLL TILT SHOWCASE (TỪ NẰM SANG ĐỨNG) */}
      <PerspectiveTiltShowcase
        urlBarText="urbantree.cantho.gov.vn/gis/live-radar"
        badgeText="RADAR TRỰC TIẾP GIS CẦN THƠ"
      >
        <div className="relative min-h-[360px] sm:min-h-[460px] p-4 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-50">
          {/* Background Map Visual Simulation */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Left Floating Card: Tree Quick Specs */}
          <div className="relative z-10 w-full md:w-80 bento-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                CÂY CỔ THỤ ĐÔ THỊ
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700">
                {sampleTree ? sampleTree.publicCode : '#TREE-001'}
              </span>
            </div>

            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {sampleTree ? sampleTree.displayName : 'Cây Bàng Đài Loan #01'}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {sampleTree ? sampleTree.address : 'Công viên Lưu Hữu Phước, Q. Ninh Kiều, Cần Thơ'}
              </div>
            </div>

            <div className="w-full h-px bg-slate-100" />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-400">Năm trồng</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {sampleTree ? sampleTree.plantedAt : '2021'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Chiều cao</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {sampleTree ? `${sampleTree.heightM} m` : '7.5 m'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Độ an toàn</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-600">98.5%</div>
              </div>
            </div>

            <button
              onClick={onOpenMap}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xem vị trí trên bản đồ vệ tinh</span>
            </button>
          </div>

          {/* Center Pulsing Radar Hub */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/40">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/90 shadow-sm">
              <div className="text-xs font-bold text-slate-900">{stats.totalTrees} Cây Xanh Giám Sát</div>
              <div className="text-[10px] text-emerald-600 font-medium">Bảo chứng toàn vẹn dữ liệu</div>
            </div>
          </div>

          {/* Right Floating Card: Gemini AI Insight */}
          <div className="relative z-10 w-full md:w-80 bento-card p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Gemini Vision AI</div>
                <div className="text-[10px] text-indigo-600 font-medium">Chẩn đoán hình ảnh thực địa</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Tán lá phát triển đồng đều, thân không có vết nứt mục hoặc nấm rễ ký sinh. Đề xuất: Cắt tỉa cành vươn trước mùa mưa tại khu vực Ninh Kiều."
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-500">Độ tin cậy mô hình</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                98.4% Match
              </span>
            </div>
          </div>
        </div>
      </PerspectiveTiltShowcase>

      {/* 🍱 BENTO GRID KPI STATS (CÔNG KHAI) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Chỉ Số Sinh Thái Đô Thị TP. Cần Thơ</h2>
            <p className="text-xs text-slate-500">Dữ liệu thời gian thực được đồng bộ trên mạng lưới giám sát</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1 */}
          <div className="bento-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Tổng cây xanh</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Trees className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.totalTrees}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Đã cấp mã QR kim loại</div>
          </div>

          {/* Card 2 */}
          <div className="bento-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Tỷ lệ xanh tốt</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">
              {healthyPercent}%
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">{stats.healthyTrees} cây sinh trưởng tốt</div>
          </div>

          {/* Card 3 */}
          <div className="bento-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Cần bảo dưỡng</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tabular-nums">
              {stats.atRiskTrees}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Cần cắt tỉa / Gia cố cọc</div>
          </div>

          {/* Card 4 */}
          <div className="bento-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Sự cố đang xử lý</span>
              <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums">
              {stats.activeIncidents}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Tiếp nhận từ phản ánh</div>
          </div>

          {/* Card 5 */}
          <div className="bento-card p-4 sm:p-5 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Smart Contract</span>
              <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tabular-nums font-mono">
              {stats.totalAnchors}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1">Bản ghi On-chain</div>
          </div>
        </div>
      </div>

      {/* 🌲 CÂY XANH TIÊU BIỂU VÀ SỔ CÁI BLOCKCHAIN CÔNG KHAI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trees List Bento */}
        <div className="bento-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Hồ Sơ Cây Xanh Tiêu Biểu</h2>
            <button
              onClick={onOpenMap}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem trên bản đồ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {trees.slice(0, 4).map((tree) => (
              <div
                key={tree.id}
                onClick={() => onSelectTree(tree)}
                className="p-3 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 font-mono text-xs font-bold shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800">{tree.publicCode}</span>
                      <span className="text-xs font-semibold text-slate-800 truncate">{tree.displayName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{tree.address}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tree.healthStatus === 'GOOD'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tree.healthStatus === 'FAIR'
                        ? 'bg-slate-100 text-slate-700'
                        : tree.healthStatus === 'POOR'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {tree.healthStatus}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Anchors Feed Bento */}
        <div className="bento-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Nhật Ký Giao Dịch Blockchain Công Khai</span>
                <span className="px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                  Hardhat EVM
                </span>
              </h2>
              <p className="text-xs text-slate-500">Mọi hành vi chăm sóc đều được neo bằng chứng bất biến</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {anchors.map((anchor) => (
              <div key={anchor.txHash} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="font-semibold text-emerald-800">{anchor.recordType}</span>
                  <span className="font-mono text-[10px] text-slate-400">Block #{anchor.blockNumber}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 truncate mb-1">
                  Hash: {anchor.payloadHash}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="truncate max-w-[180px]">Tx: {anchor.txHash}</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    CONFIRMED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
