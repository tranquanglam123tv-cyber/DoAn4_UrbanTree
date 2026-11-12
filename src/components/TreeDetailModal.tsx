import React, { useState } from 'react';
import {
  X,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Edit,
  MapPin,
  Calendar,
  CheckCircle2,
  Bug,
  RefreshCw,
  ExternalLink,
  Trees,
  Compass,
  Activity,
  Truck,
  Wrench,
  FileText,
  ShieldAlert,
  Sprout,
  Users,
} from 'lucide-react';
import { CareRecord, Incident, Tree, TreeHealthStatus, VerificationResult } from '../types';
import { storage } from '../db/storage';
import { blockchainService } from '../services/blockchainService';
import { DigitalAlloyTag } from './DigitalAlloyTag';
import { calculateISATraqRating, getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

interface TreeDetailModalProps {
  tree: Tree | null;
  onClose: () => void;
  onOpenQrModal: (tree: Tree) => void;
  onOpenEditModal: (tree: Tree) => void;
  onOpenCareModal: (treeId: string) => void;
  onOpenPublicView: (tree: Tree) => void;
  onTreeUpdated: () => void;
}

export const TreeDetailModal: React.FC<TreeDetailModalProps> = ({
  tree,
  onClose,
  onOpenQrModal,
  onOpenEditModal,
  onOpenCareModal,
  onOpenPublicView,
  onTreeUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'tag' | 'care' | 'incidents' | 'blockchain'>('info');
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);

  if (!tree) return null;

  const streetCode = getTreeStreetCode(tree);
  const milestone = getTreeMilestone(tree);
  const corridor = getTreeCorridor(tree);
  const treeType = storage.getTreeTypeById(tree.treeTypeId);
  const careRecords = storage.getCareRecords(tree.id);
  const incidents = storage.getIncidents().filter((i) => i.treeId === tree.id);
  const traqResult = calculateISATraqRating(tree);
  const tiltAngle = tree.tiltAngleDeg ?? 0;
  const hollowRatio = tree.hollowRatioPercent ?? 0;
  const rootRisk = tree.rootDamageRisk ?? 'NONE';

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await blockchainService.verifyRecord('TREE_PROFILE', tree);
      setVerifyResult(result);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperTest = () => {
    // Maliciously tamper with health status without updating blockchain anchor
    const newStatus: TreeHealthStatus = tree.healthStatus === 'GOOD' ? 'POOR' : 'GOOD';
    storage.tamperTree(tree.id, newStatus);
    setTamperMessage(`Đã cố tình sửa trộm trạng thái từ "${tree.healthStatus}" thành "${newStatus}" trong cơ sở dữ liệu! Hãy bấm "Kiểm tra toàn vẹn" bên dưới để xem cảnh báo băm sai lệch (MISMATCH).`);
    onTreeUpdated();
    setVerifyResult(null);
  };

  const handleRestoreTamper = () => {
    storage.resetToDefaults();
    setTamperMessage('Đã khôi phục dữ liệu mẫu gốc từ Blockchain.');
    onTreeUpdated();
    setVerifyResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-3xl w-full max-h-[92vh] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col border border-slate-200 dark:border-emerald-500/30 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-800 via-[#174B36] to-emerald-950 dark:from-[#091b12] dark:to-[#040f09] dark:border-b dark:border-emerald-500/30 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 dark:bg-emerald-500/20 text-[#F3E8B2] dark:text-[#00FF9D] flex items-center justify-center border border-white/20 dark:border-emerald-500/40 shadow-xs shrink-0">
              <Trees className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-black/40 text-amber-300 font-mono text-xs font-black border border-amber-400/30 shadow-2xs whitespace-nowrap shrink-0">
                  [{streetCode}]
                </span>
                <h2 className="text-base font-bold text-white tracking-tight truncate">
                  {tree.displayName}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                    tree.healthStatus === 'GOOD'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                      : tree.healthStatus === 'FAIR'
                      ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/40'
                      : tree.healthStatus === 'POOR'
                      ? 'bg-orange-500/30 text-orange-200 border border-orange-400/40'
                      : 'bg-red-500/30 text-red-200 border border-red-400/40'
                  }`}
                >
                  {tree.healthStatus}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <strong className="text-amber-200">{milestone}</strong> · <span className="opacity-90">{corridor}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={() => onOpenQrModal(tree)}
              title="Xem & in mã QR"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenEditModal(tree)}
              title="Chỉnh sửa thông tin cây"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/80 text-xs font-semibold shrink-0 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-emerald-600 dark:border-[#00FF9D] text-emerald-800 dark:text-[#00FF9D]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Thông tin thực địa
          </button>
          <button
            onClick={() => setActiveTab('tag')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tag'
                ? 'border-emerald-600 dark:border-[#00FF9D] text-emerald-800 dark:text-[#00FF9D]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Biển số nhôm</span>
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'care'
                ? 'border-emerald-600 dark:border-[#00FF9D] text-emerald-800 dark:text-[#00FF9D]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Nhật ký chăm sóc</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
              {careRecords.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'incidents'
                ? 'border-emerald-600 dark:border-[#00FF9D] text-emerald-800 dark:text-[#00FF9D]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Sự cố</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
              {incidents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('blockchain')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'blockchain'
                ? 'border-emerald-600 dark:border-[#00FF9D] text-emerald-800 dark:text-[#00FF9D]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
            <span>Xác minh Blockchain</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto overscroll-contain space-y-5 flex-1" data-lenis-prevent>
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Image & Quick specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-xs">
                    <img
                      src={tree.imageUrl || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'}
                      alt={tree.displayName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[10px] rounded-md font-mono font-bold">
                      {tree.publicCode}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs shadow-2xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-[#00FF9D] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{tree.address}</div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                          Tọa độ: {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Đường kính</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">{tree.diameterCm || 30} cm</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Chiều cao</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">{tree.heightM || 8} m</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Năm trồng</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">{tree.plantedAt || '2021'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 dark:bg-[#091811] rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 text-xs shadow-2xs">
                    <div className="font-bold text-emerald-800 dark:text-[#00FF9D] mb-1">Đặc tính sinh học & Hướng dẫn:</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">{treeType?.careGuide || 'Thường xuyên kiểm tra sâu bệnh và tỉa cành định kỳ.'}</p>
                  </div>

                  {/* Physical Aluminum Tag Highlight Card (SẮC NÉT & ĐỘ TƯƠNG PHẢN CAO 100%) */}
                  <div
                    onClick={() => setActiveTab('tag')}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-emerald-500/30 bg-slate-100/90 dark:bg-[#07170f] flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-mono font-black text-xs border border-slate-700 shadow-xs shrink-0">
                        [{streetCode}]
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-[#00FF9D] flex items-center gap-2 transition-colors">
                          <span className="truncate">Biển Số Nhôm Đóng Thân Cây</span>
                          <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-[#00FF9D] rounded-full font-mono font-bold tracking-wider shrink-0 border border-emerald-300/60 dark:border-emerald-500/30">
                            ALLOY TAG
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          Đối chiếu thực địa: <strong className="text-slate-800 dark:text-slate-200">{milestone}</strong>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-[#00FF9D] flex items-center gap-1 group-hover:translate-x-1 transition-all whitespace-nowrap pl-2">
                      <span>Mở biển</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 🌲 KHỐI ĐÁNH GIÁ RỦI RO CHUẨN QUỐC TẾ ISA TRAQ & CHỈ SỐ LÂM SINH THỰC ĐỊA */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Đánh Giá Rủi Ro ISA TRAQ Quốc Tế</span>
                        <span className="text-[10px] text-slate-500 font-mono font-normal">(Tree Risk Assessment Qualification)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ma trận Xác suất đổ ngã × Mức độ tổn thương hạ tầng (Dây điện, nhà dân, lòng đường)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Điểm rủi ro: <strong className="text-slate-800 dark:text-slate-100 text-xs">{traqResult.score}/12</strong>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${traqResult.badgeClass}`}>
                      {traqResult.rating}
                    </span>
                  </div>
                </div>

                {/* 3 Đồng hồ / Thước đo Thực địa */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Chỉ số 1: Góc nghiêng thân cây */}
                  <div className="p-3 bg-white dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <Compass className="w-3.5 h-3.5 text-blue-500" />
                        <span>Góc nghiêng thân</span>
                      </span>
                      <span className={`font-mono font-bold ${tiltAngle >= 15 ? 'text-rose-600 dark:text-rose-400 font-black' : tiltAngle >= 8 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {tiltAngle}° {tiltAngle >= 15 ? '⚠️ Nguy hiểm' : tiltAngle >= 8 ? 'Cần chú ý' : 'An toàn'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${tiltAngle >= 15 ? 'bg-rose-500' : tiltAngle >= 8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (tiltAngle / 30) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>0° (Thẳng)</span>
                      <span>15° (Ngưỡng bão)</span>
                      <span>30°+</span>
                    </div>
                  </div>

                  {/* Chỉ số 2: Độ rỗng thân (Siêu âm Arbotom) */}
                  <div className="p-3 bg-white dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <Activity className="w-3.5 h-3.5 text-purple-500" />
                        <span>Rỗng thân Arbotom</span>
                      </span>
                      <span className={`font-mono font-bold ${hollowRatio >= 45 ? 'text-rose-600 dark:text-rose-400 font-black' : hollowRatio >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {hollowRatio}% {hollowRatio >= 45 ? '⚠️ Mục rỗng' : hollowRatio >= 25 ? 'Khuyết tật' : 'Thân đặc'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${hollowRatio >= 45 ? 'bg-rose-500' : hollowRatio >= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, hollowRatio)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>0% (Đặc ruột)</span>
                      <span>40% (Giới hạn gãy)</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Chỉ số 3: Tổn thương rễ vỉa hè */}
                  <div className="p-3 bg-white dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tổn thương bộ rễ</span>
                      </span>
                      <span className={`font-mono font-bold ${rootRisk === 'SEVERE' ? 'text-rose-600 dark:text-rose-400 font-black' : rootRisk === 'MODERATE' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {rootRisk === 'SEVERE' ? '⚠️ Đứt rễ cọc' : rootRisk === 'MODERATE' ? 'Nứt vỉa hè' : 'Rễ vững chắc'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-0.5">
                      {rootRisk === 'SEVERE' ? 'Đào cống hạ ngầm gây đứt rễ bạnh chính' : rootRisk === 'MODERATE' ? 'Bồn cây hẹp, rễ nổi đội bê tông' : 'Vùng bảo vệ rễ (RPZ) đạt chuẩn BS 5837'}
                    </div>
                  </div>
                </div>

                {/* Khuyến nghị hành động kỹ thuật */}
                <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">Khuyến nghị ISA:</span>
                  <span>{traqResult.actionRecommendation}</span>
                </div>
              </div>

              {/* 📜 KHỐI BIÊN BẢN CẤP PHÉP ĐỐN HẠ & KẾ HOẠCH TRỒNG BÙ HOÀN TRẢ (COMPENSATORY PLANTING) */}
              {tree.fellingPermit && (
                <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-rose-950 dark:text-rose-200 flex items-center gap-2">
                          <span>Giấy Phép Đốn Hạ Cây Nguy Hiểm & Kế Hoạch Trồng Bù</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-mono font-bold">
                            {tree.fellingPermit.permitNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-800 dark:text-rose-300">
                          Ban hành bởi: {tree.fellingPermit.issuedBy} · Ngày ký: {tree.fellingPermit.issuedDate}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold tracking-wide">
                      CHỜ HẠ THÂN CÂY
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/40 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <div><strong>Lý do kỹ thuật:</strong> {tree.fellingPermit.reason}</div>
                    <div><strong>Cán bộ thẩm định:</strong> {tree.fellingPermit.approvedByOfficer}</div>
                    {tree.fellingPermit.councilMembers && (
                      <div><strong>Hội đồng 3 bên:</strong> {tree.fellingPermit.councilMembers.join(' · ')}</div>
                    )}
                    {tree.fellingPermit.trafficControlPlan && (
                      <div className="text-amber-800 dark:text-amber-300">
                        <strong>Phương án phân luồng:</strong> {tree.fellingPermit.trafficControlPlan}
                      </div>
                    )}
                  </div>

                  {/* Kế hoạch Trồng bù Hoàn trả (Compensatory Planting) */}
                  {tree.fellingPermit.compensatoryPlanting && (
                    <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Kế Hoạch Trồng Hoàn Trả (Thông tư 20/2020/TT-BXD)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                          CAM KẾT BÙ CÂY MỚI
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                        <div>Loài cây trồng bù: <strong className="text-emerald-800 dark:text-emerald-300">{tree.fellingPermit.compensatoryPlanting.treeSpecies}</strong></div>
                        <div>Hạn chót trồng bù: <strong className="text-slate-900 dark:text-slate-100">{tree.fellingPermit.compensatoryPlanting.deadlineDate}</strong></div>
                        <div className="sm:col-span-2">Địa điểm hoàn trả: <strong className="text-slate-900 dark:text-slate-100">{tree.fellingPermit.compensatoryPlanting.targetLocation}</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => onOpenPublicView(tree)}
                  className="text-xs font-semibold text-[#174B36] dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem giao diện người dân khi quét QR</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenCareModal(tree.id)}
                    className="px-3 py-1.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Ghi chăm sóc</span>
                  </button>
                  <button
                    onClick={() => onOpenQrModal(tree)}
                    className="px-3 py-1.5 bg-[#E0EBDD] hover:bg-[#d0dfcc] dark:bg-emerald-950/60 hover:dark:bg-emerald-900/60 text-[#174B36] dark:text-emerald-300 dark:border dark:border-emerald-800/50 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Thẻ QR</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🔩 BIỂN SỐ NHÔM VẬT LÝ ẢO (DIGITAL ALLOY TAG) */}
          {activeTab === 'tag' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300">
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  <span>💡 Mô phỏng Biển Nhôm Đóng Thân Cây Thực Tế</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
                  Tại hiện trường, mỗi gốc cây được đóng một biển nhôm dập chìm chống chịu thời tiết. Kỹ thuật viên đối chiếu số hiệu <strong>[{streetCode}]</strong>, mã QR quang học và cột mốc <strong>{milestone}</strong> để xác định chính xác 100% cây cần can thiệp mà không sợ nhầm giữa các cây cùng loài trên tuyến.
                </p>
              </div>

              <DigitalAlloyTag tree={tree} size="lg" showActions={true} />
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lịch sử chăm sóc thực tế</span>
                <button
                  onClick={() => onOpenCareModal(tree.id)}
                  className="px-2.5 py-1 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  + Ghi chăm sóc mới
                </button>
              </div>

              {careRecords.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">Chưa có bản ghi chăm sóc nào cho cây này.</div>
              ) : (
                <div className="space-y-2.5">
                  {careRecords.map((care) => (
                    <div key={care.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#174B36] dark:text-emerald-400">{care.actionType}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(care.performedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{care.notes}</p>
                      {(care.equipmentUsed || care.chemicalsUsed) && (
                        <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] space-y-0.5">
                          {care.equipmentUsed && (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Cơ giới: <strong>{care.equipmentUsed}</strong></span>
                            </div>
                          )}
                          {care.chemicalsUsed && (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Vật tư: <strong>{care.chemicalsUsed}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Nhân viên: {care.staffName || 'Đội kỹ thuật'}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                          {care.healthBefore} ➔ {care.healthAfter}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sự cố liên quan cây này</span>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">Không có sự cố nào được ghi nhận.</div>
              ) : (
                <div className="space-y-2.5">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#174B36] dark:text-emerald-400">{inc.publicCode}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 dark:border dark:border-amber-800/50">
                          {inc.status}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{inc.description}</p>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        Báo cáo bởi: {inc.reporterName} · {new Date(inc.reportedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'blockchain' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#347A50] dark:text-emerald-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Bảo chứng Toàn vẹn Dữ liệu</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 dark:border dark:border-emerald-800/50 font-bold">
                    EVM Local Contract
                  </span>
                </div>

                <div className="font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="truncate">Data Hash (SHA-256): {tree.payloadHash || 'Chưa neo'}</div>
                  <div className="truncate">Tx Hash: {tree.txHash || 'Chưa ghi nhận'}</div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="px-3.5 py-1.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Đang băm lại & đối chiếu...' : 'Kiểm tra tính toàn vẹn'}</span>
                  </button>
                </div>
              </div>

              {/* Verify Result Banner */}
              {verifyResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    verifyResult.status === 'VALID'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : verifyResult.status === 'MISMATCH'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {verifyResult.status === 'VALID' && (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span>XÁC THỰC HỢP LỆ (VALID) — DỮ LIỆU NGUYÊN VẸN</span>
                      </>
                    )}
                    {verifyResult.status === 'MISMATCH' && (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span>CẢNH BÁO BĂNG SAI LỆCH (MISMATCH) — DỮ LIỆU ĐÃ BỊ THAY ĐỔI TRÁI PHÉP!</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs opacity-90">
                    {verifyResult.status === 'VALID'
                      ? 'Chuỗi băm SHA-256 tính từ cơ sở dữ liệu hiện tại hoàn toàn khớp 100% với chữ ký mã hóa đã neo trên Smart Contract.'
                      : 'Phát hiện sai lệch giữa dữ liệu hiện thời và hash đã chốt trên Blockchain! Bằng chứng tính toán không trùng khớp.'}
                  </p>

                  <div className="font-mono text-[10px] p-2 rounded bg-black/5 dark:bg-slate-900 space-y-1">
                    <div className="truncate">Hash hiện tại: {verifyResult.currentHash}</div>
                    <div className="truncate">Hash trên chuỗi: {verifyResult.onChainHash}</div>
                  </div>

                  {verifyResult.diffFields && verifyResult.diffFields.length > 0 && (
                    <div className="pt-2 border-t border-red-200/60 dark:border-red-900/60">
                      <span className="font-bold text-[11px] block mb-1">Các trường dữ liệu bị can thiệp trái phép:</span>
                      {verifyResult.diffFields.map((d) => (
                        <div key={d.field} className="font-mono text-[11px]">
                          • <span className="font-bold">{d.field}</span>: DB hiện thời = "{String(d.currentValue)}", Gốc trên chuỗi = "{String(d.anchoredValue)}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tamper Demonstration Box (Roadmap Section 10 defense scenario) */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                  <Bug className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Kịch bản Diễn tập Bảo vệ Đồ án (Tamper Simulation)</span>
                </div>
                <p className="text-amber-800 dark:text-amber-400 text-[11px] leading-relaxed">
                  Để chứng minh với hội đồng cơ chế bảo mật chống sửa dữ liệu: Nhấn nút bên dưới để cố ý sửa trộm thuộc tính cây xanh trong DB mà không có giao dịch Blockchain, sau đó kiểm tra lại để xem hệ thống phát hiện gian lận.
                </p>

                {tamperMessage && (
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-[11px]">
                    {tamperMessage}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTamperTest}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-xs cursor-pointer"
                  >
                    Thử nghiệm sửa trộm DB
                  </button>
                  <button
                    onClick={handleRestoreTamper}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors text-xs cursor-pointer"
                  >
                    Khôi phục dữ liệu gốc
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
