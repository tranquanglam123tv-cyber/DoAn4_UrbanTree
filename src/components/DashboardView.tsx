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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#174B36] to-[#347A50] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 card-interactive">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-xs text-[#F3E8B2] font-medium mb-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Đô thị thông minh</span>
            <span>·</span>
            <span>Hạ tầng Cây xanh TP.HCM</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hệ thống Giám sát & Quản lý Cây xanh</h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Tích hợp mã QR định danh cho từng cây, số hóa nhật ký chăm sóc, tiếp nhận phản ánh người dân và bảo chứng toàn vẹn dữ liệu bằng Blockchain EVM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAddTree}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F3E8B2] text-[#174B36] hover:bg-[#eae0a5] text-xs font-semibold rounded-lg transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm cây mới</span>
          </button>
          <button
            onClick={() => onOpenCareModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-all backdrop-blur-xs border border-white/20 active:scale-95"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Ghi chăm sóc</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E0EBDD] shadow-xs card-interactive">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng cây xanh</span>
            <Trees className="w-4 h-4 text-[#174B36]" />
          </div>
          <div className="text-2xl font-bold text-[#174B36] tabular-nums">{stats.totalTrees}</div>
          <div className="text-[11px] text-slate-500 mt-1">Đã cấp mã QR định danh</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E0EBDD] shadow-xs card-interactive">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tỷ lệ xanh tốt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">{healthyPercent}%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">{stats.healthyTrees} cây sinh trưởng tốt</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E0EBDD] shadow-xs card-interactive">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Cây cần chăm sóc</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums">{stats.atRiskTrees}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Kém hoặc nguy cấp</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E0EBDD] shadow-xs card-interactive">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sự cố đang xử lý</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 tabular-nums">{stats.activeIncidents}</div>
          <div className="text-[11px] text-slate-500 mt-1">Từ phản ánh của người dân</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-[#E0EBDD] shadow-xs card-interactive">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Bản ghi Blockchain</span>
            <ShieldCheck className="w-4 h-4 text-[#347A50]" />
          </div>
          <div className="text-2xl font-bold text-[#174B36] tabular-nums">{stats.totalAnchors}</div>
          <div className="text-[11px] text-[#347A50] font-medium mt-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping"></span>
            100% bảo chứng SHA-256
          </div>
        </div>
      </div>

      {/* Middle Row: Health breakdown & Active incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health status distribution */}
        <div className="bg-white p-5 rounded-xl border border-[#E0EBDD] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#174B36]">Hiện trạng Sức khỏe Cây xanh</h2>
              <button
                onClick={() => onNavigate('trees')}
                className="text-xs font-semibold text-[#347A50] hover:underline flex items-center gap-1"
              >
                <span>Chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Distribution bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Tốt (Sinh trưởng khỏe mạnh)</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{stats.healthBreakdown.GOOD} cây</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(stats.healthBreakdown.GOOD / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Bình thường (Cần tỉa cành định kỳ)</span>
                  <span className="font-bold text-slate-700 tabular-nums">{stats.healthBreakdown.FAIR} cây</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-400 h-2 rounded-full"
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
                    className="bg-amber-400 h-2 rounded-full"
                    style={{ width: `${(stats.healthBreakdown.POOR / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Nguy cấp (Nghiêng / Nứt toác gốc)</span>
                  <span className="font-bold text-red-600 tabular-nums">{stats.healthBreakdown.CRITICAL} cây</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(stats.healthBreakdown.CRITICAL / (stats.totalTrees || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tiêu chuẩn đánh giá: QĐ 1999/QĐ-UBND</span>
            <button
              onClick={() => onNavigate('map')}
              className="text-[#174B36] font-semibold hover:underline flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Xem trên bản đồ</span>
            </button>
          </div>
        </div>

        {/* Priority Incidents List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#E0EBDD] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#174B36]">Sự cố & Phản ánh Cần Xử lý</h2>
              <p className="text-xs text-slate-500">Tiếp nhận trực tiếp từ người dân quét mã QR</p>
            </div>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs font-semibold text-[#347A50] hover:underline flex items-center gap-1"
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
                      <span className="font-mono text-xs font-bold text-[#174B36] bg-[#E0EBDD] px-2 py-0.5 rounded">
                        {incident.publicCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : incident.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{incident.status}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium line-clamp-1">{incident.description}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>{incident.address || 'Khu vực nội ô'}</span>
                      {tree && <span className="text-[#347A50]">Mã cây: {tree.publicCode}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('incidents')}
                    className="px-2.5 py-1 text-xs font-medium text-[#174B36] hover:bg-[#E0EBDD] rounded-md transition-colors shrink-0"
                  >
                    Xử lý
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Trees & Blockchain Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trees List */}
        <div className="bg-white p-5 rounded-xl border border-[#E0EBDD] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#174B36]">Cây Xanh Đô Thị Nổi Bật</h2>
            <button
              onClick={() => onNavigate('trees')}
              className="text-xs font-semibold text-[#347A50] hover:underline flex items-center gap-1"
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
                className="p-2.5 rounded-lg border border-slate-100 hover:border-[#347A50] hover:bg-[#F8FAF8] transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#E0EBDD] flex items-center justify-center text-[#174B36] font-mono text-xs font-bold shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#174B36]">{tree.publicCode}</span>
                      <span className="text-xs font-semibold text-slate-800 truncate">{tree.displayName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{tree.address}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      tree.healthStatus === 'GOOD'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tree.healthStatus === 'FAIR'
                        ? 'bg-slate-100 text-slate-700'
                        : tree.healthStatus === 'POOR'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tree.healthStatus}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#174B36]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Anchors Feed */}
        <div className="bg-white p-5 rounded-xl border border-[#E0EBDD] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#174B36] flex items-center gap-2">
                <span>Nhật ký Giao dịch Blockchain</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-full">
                  Hardhat Local EVM
                </span>
              </h2>
              <p className="text-xs text-slate-500">Mỗi thay đổi được băm SHA-256 và neo lên Smart Contract</p>
            </div>
            <button
              onClick={() => onNavigate('blockchain')}
              className="text-xs font-semibold text-[#347A50] hover:underline flex items-center gap-1"
            >
              <span>Xem Sổ cái</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {anchors.map((anchor) => (
              <div key={anchor.txHash} className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="font-semibold text-[#174B36]">{anchor.recordType}</span>
                  <span className="font-mono text-[10px]">Block #{anchor.blockNumber}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 truncate mb-1">
                  Hash: {anchor.payloadHash}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="truncate max-w-[200px]">Tx: {anchor.txHash}</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
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
