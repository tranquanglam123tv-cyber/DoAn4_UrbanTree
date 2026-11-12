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
  Sliders,
  Home,
} from 'lucide-react';
import { storage } from '../db/storage';
import { blockchainService } from '../services/blockchainService';
import { Tree } from '../types';

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
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 🧭 Top Admin Dashboard Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bento-card p-5 sm:p-6 bg-gradient-to-r from-emerald-950/10 via-transparent to-transparent">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
              ADMIN CONTROL CENTER
            </span>
            <span className="text-xs text-slate-500">· Hệ thống điều hành Đô thị thông minh</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-600" />
            <span>Bảng Điều Khiển Quản Trị Hệ Thống (Admin Dashboard)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát toàn diện hạ tầng cây xanh, phân công xử lý sự cố và kiểm tra tính toàn vẹn Smart Contract.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Về Trang Chủ</span>
          </button>

          <button
            onClick={onOpenAddTree}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Cây Mới</span>
          </button>

          <button
            onClick={() => onOpenCareModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs transition-colors border border-emerald-200 shadow-xs cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            <span>Ghi Chăm Sóc</span>
          </button>
        </div>
      </div>

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

      {/* 📊 MID ROW: HEALTH BREAKDOWN + PRIORITY INCIDENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Breakdown Bento Card */}
        <div className="bento-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Phân Phối Sức Khỏe Cây</h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                Kiểm định thực địa
              </span>
            </div>

            <div className="space-y-3.5">
              {/* GOOD */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Tốt (Khỏe mạnh, tán lá dày)
                  </span>
                  <span className="font-mono text-slate-800">{stats.healthBreakdown.GOOD}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.healthBreakdown.GOOD / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* FAIR */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Bình thường (Phát triển ổn định)
                  </span>
                  <span className="font-mono text-slate-800">{stats.healthBreakdown.FAIR}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.healthBreakdown.FAIR / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* POOR */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Kém (Sâu bệnh, cành khô)
                  </span>
                  <span className="font-mono text-slate-800">{stats.healthBreakdown.POOR}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.healthBreakdown.POOR / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* CRITICAL */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Nguy cấp (Nghiêng, mục rễ, sắp đổ)
                  </span>
                  <span className="font-mono text-slate-800">{stats.healthBreakdown.CRITICAL}</span>
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
