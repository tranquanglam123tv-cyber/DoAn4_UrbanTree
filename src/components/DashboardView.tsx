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
} from 'lucide-react';
import { storage } from '../db/storage';
import { blockchainService } from '../services/blockchainService';
import { Tree } from '../types';
import { HudBadge } from './common/HudBadge';
import { PerspectiveTiltShowcase } from './common/PerspectiveTiltShowcase';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenAddTree: () => void;
  onOpenCareModal: (treeId?: string) => void;
  onSelectTree: (tree: Tree) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddTree,
  onOpenCareModal,
  onSelectTree,
}) => {
  const stats = storage.getDashboardStats();
  const trees = storage.getTrees();
  const incidents = storage.getIncidents();
  const anchors = blockchainService.getAllAnchors().slice(0, 5);

  const healthyPercent = stats.totalTrees > 0 ? Math.round((stats.healthyTrees / stats.totalTrees) * 100) : 0;
  const sampleTree = trees[0] || null;

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* 🌟 HERO SECTION (AUTOMARK LIGHT STYLE) */}
      <div className="flex flex-col items-center text-center pt-4 sm:pt-8 px-2 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Automark HUD Corner-dot Tagline Badge */}
        <HudBadge label="HỆ THỐNG QUẢN LÝ SINH THÁI CÂY XANH ĐÔ THỊ 4.0" />

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
          Nền tảng GIS thời gian thực số hóa từng cá thể cây xanh, dự báo nguy cơ gãy đổ tự động bằng Gemini AI và minh bạch lịch sử chăm sóc trên sổ cái Blockchain bất biến.
        </p>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          <button
            onClick={() => onNavigate('map')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95 group cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-200" />
            <span>Khám Phá Bản Đồ Cây GIS</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onOpenAddTree}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200/90 transition-all shadow-sm shadow-slate-900/5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Thêm Cây Mới</span>
          </button>

          <button
            onClick={() => onOpenCareModal()}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs sm:text-sm border border-emerald-200/70 transition-all active:scale-95 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <span>Ghi Chăm Sóc</span>
          </button>
        </div>
      </div>

      {/* 🚀 AUTOMARK 3D PERSPECTIVE SCROLL TILT SHOWCASE (TỪ NẰM SANG ĐỨNG) */}
      <PerspectiveTiltShowcase
        urlBarText="urbantree.saigon.gov.vn/gis/live-radar"
        badgeText="RADAR TRỰC TIẾP GIS"
      >
        <div className="relative min-h-[360px] sm:min-h-[460px] p-4 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-50">
          {/* Background Map Visual Simulation */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Left Floating Card: Tree Quick Specs */}
          <div className="relative z-10 w-full md:w-80 bento-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                CÂY CỔ THỤ CẤP 1
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700">
                {sampleTree ? sampleTree.publicCode : '#TREE-001'}
              </span>
            </div>

            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {sampleTree ? sampleTree.displayName : 'Dầu Rái (Dipterocarpus)'}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {sampleTree ? sampleTree.address : 'Số 14 Công Xã Paris, Bến Nghé, Quận 1, TP.HCM'}
              </div>
            </div>

            <div className="w-full h-px bg-slate-100" />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-400">Tuổi cây</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">128 năm</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Chiều cao</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {sampleTree ? `${sampleTree.heightMeters} m` : '24.5 m'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Độ an toàn</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-600">98.5%</div>
              </div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/60 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-[11px] text-emerald-800 font-medium truncate font-mono">
                EVM: 0x9f8c...b412 (100% Khớp)
              </div>
            </div>
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
              "Tán lá phát triển đồng đều, thân không có vết nứt mục hoặc nấm rễ ký sinh. Đề xuất: Cắt tỉa cành vươn trước mùa mưa tháng 11."
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

      {/* 🍱 BENTO GRID KPI STATS (AUTOMARK LIGHT THEME) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Chỉ Số Sinh Thái Đô Thị</h2>
            <p className="text-xs text-slate-500">Dữ liệu thời gian thực được đồng bộ trên mạng lưới</p>
          </div>
          <button
            onClick={() => onNavigate('trees')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>Tất cả cây</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
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
            <div className="text-[11px] text-amber-600 font-medium mt-1">Sâu bệnh hoặc nghiêng</div>
          </div>

          {/* Card 4 */}
          <div className="bento-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Sự cố đang xử lý</span>
              <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tabular-nums">
              {stats.activeIncidents}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Từ phản ánh cộng đồng</div>
          </div>

          {/* Card 5 */}
          <div className="col-span-2 lg:col-span-1 bento-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Khối Blockchain</span>
              <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tabular-nums">
              {stats.totalAnchors}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
              100% SHA-256
            </div>
          </div>
        </div>
      </div>

      {/* 📊 HEALTH BREAKDOWN & PRIORITY INCIDENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health status distribution Bento */}
        <div className="bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Hiện Trạng Sức Khỏe</h2>
              <button
                onClick={() => onNavigate('trees')}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Distribution bars */}
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Tốt (Sinh trưởng khỏe mạnh)</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{stats.healthBreakdown.GOOD} cây</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.healthBreakdown.GOOD / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Bình thường (Định kỳ cắt tỉa)</span>
                  <span className="font-bold text-slate-700 tabular-nums">{stats.healthBreakdown.FAIR} cây</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.healthBreakdown.FAIR / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Kém (Lá héo / Sâu đục thân)</span>
                  <span className="font-bold text-amber-600 tabular-nums">{stats.healthBreakdown.POOR} cây</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.healthBreakdown.POOR / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Nguy cấp (Nghiêng / Nứt gốc)</span>
                  <span className="font-bold text-rose-600 tabular-nums">{stats.healthBreakdown.CRITICAL} cây</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.healthBreakdown.CRITICAL / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tiêu chuẩn: QĐ 1999/QĐ-UBND</span>
            <button
              onClick={() => onNavigate('map')}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Xem trên bản đồ</span>
            </button>
          </div>
        </div>

        {/* Priority Incidents List Bento */}
        <div className="lg:col-span-2 bento-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Sự Cố &amp; Phản Ánh Hiện Trường</h2>
              <p className="text-xs text-slate-500">Tiếp nhận trực tiếp từ người dân quét mã QR trên thân cây</p>
            </div>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Tất cả sự cố</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {incidents.slice(0, 3).map((incident) => {
              const tree = incident.treeId ? trees.find((t) => t.id === incident.treeId) : null;
              return (
                <div key={incident.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {incident.publicCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : incident.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{incident.status}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium line-clamp-1">{incident.description}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>{incident.address || 'Khu vực nội ô TP.HCM'}</span>
                      {tree && <span className="text-emerald-700 font-medium">Mã cây: {tree.publicCode}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('incidents')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-full border border-emerald-200/60 transition-colors shrink-0 cursor-pointer"
                  >
                    Xử lý
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🌲 BOTTOM ROW: RECENT TREES & BLOCKCHAIN ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trees List Bento */}
        <div className="bento-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Cây Xanh Đô Thị Tiêu Biểu</h2>
            <button
              onClick={() => onNavigate('trees')}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem danh sách</span>
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
                <span>Nhật Ký Giao Dịch Blockchain</span>
                <span className="px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                  Hardhat EVM
                </span>
              </h2>
              <p className="text-xs text-slate-500">Mọi chỉnh sửa đều được băm SHA-256 và neo lên Smart Contract</p>
            </div>
            <button
              onClick={() => onNavigate('blockchain')}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem Sổ cái</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
