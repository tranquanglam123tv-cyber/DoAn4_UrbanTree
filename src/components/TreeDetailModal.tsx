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
} from 'lucide-react';
import { CareRecord, Incident, Tree, TreeHealthStatus, VerificationResult } from '../types';
import { storage } from '../db/storage';
import { blockchainService } from '../services/blockchainService';
import { DigitalAlloyTag } from './DigitalAlloyTag';
import { getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

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
        className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col border border-[#E0EBDD] dark:border-emerald-500/30 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#174B36] dark:bg-[#091b12] dark:border-b dark:border-emerald-500/30 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 dark:bg-emerald-900/40 flex flex-col items-center justify-center text-[#F3E8B2] dark:text-emerald-400 font-mono text-xs font-black border border-white/10 dark:border-emerald-500/30 shadow-xs">
              <span>{streetCode}</span>
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black border border-emerald-400/30">
                  [{streetCode}]
                </span>
                <span>{tree.displayName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tree.healthStatus === 'GOOD'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : tree.healthStatus === 'FAIR'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : tree.healthStatus === 'POOR'
                      ? 'bg-orange-500/20 text-orange-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {tree.healthStatus}
                </span>
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                <strong className="text-amber-200">{milestone}</strong> · {corridor}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQrModal(tree)}
              title="Xem & in mã QR"
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenEditModal(tree)}
              title="Chỉnh sửa thông tin cây"
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/80 text-xs font-medium shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-[#174B36] dark:border-emerald-400 text-[#174B36] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Thông tin thực địa
          </button>
          <button
            onClick={() => setActiveTab('tag')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tag'
                ? 'border-[#174B36] dark:border-emerald-400 text-[#174B36] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Biển số nhôm vật lý Ảo</span>
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'care'
                ? 'border-[#174B36] dark:border-emerald-400 text-[#174B36] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Nhật ký chăm sóc</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">{careRecords.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'incidents'
                ? 'border-[#174B36] dark:border-emerald-400 text-[#174B36] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Sự cố</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">{incidents.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('blockchain')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'blockchain'
                ? 'border-[#174B36] dark:border-emerald-400 text-[#174B36] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#347A50] dark:text-emerald-400" />
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
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
                    <img
                      src={tree.imageUrl || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'}
                      alt={tree.displayName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded font-mono">
                      {tree.publicCode}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#174B36] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{tree.address}</div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          Tọa độ: {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Đường kính</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{tree.diameterCm || 30} cm</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Chiều cao</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{tree.heightM || 8} m</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Năm trồng</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{tree.plantedAt || '2021'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAF8] dark:bg-[#091811] rounded-xl border border-[#E0EBDD] dark:border-emerald-500/20 text-xs">
                    <div className="font-semibold text-[#174B36] dark:text-emerald-400 mb-1">Đặc tính sinh học & Hướng dẫn:</div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{treeType?.careGuide}</p>
                  </div>

                  {/* Physical Aluminum Tag Highlight Card */}
                  <div
                    onClick={() => setActiveTab('tag')}
                    className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-300 flex items-center justify-center font-mono font-black text-xs border border-slate-600 shadow-2xs">
                        {streetCode}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                          <span>Biển Số Nhôm Đóng Thân Cây Vật Lý</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-mono font-bold">
                            Alloy Tag
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Đối chiếu tại hiện trường: {milestone}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Mở biển →
                    </span>
                  </div>
                </div>
              </div>

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
