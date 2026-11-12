import React from 'react';
import {
  X,
  Trees,
  MapPin,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Leaf,
  Info,
} from 'lucide-react';
import { Tree } from '../types';
import { storage } from '../db/storage';
import { getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';
import { DigitalAlloyTag } from './DigitalAlloyTag';

interface PublicTreeModalProps {
  tree: Tree | null;
  onClose: () => void;
  onReportIncident: (tree: Tree) => void;
  onOpenManagement?: (tree: Tree) => void;
  currentUser?: { role: string; fullName: string };
}

export const PublicTreeModal: React.FC<PublicTreeModalProps> = ({
  tree,
  onClose,
  onReportIncident,
  onOpenManagement,
  currentUser,
}) => {
  if (!tree) return null;

  const [showTag, setShowTag] = React.useState(false);
  const streetCode = getTreeStreetCode(tree);
  const milestone = getTreeMilestone(tree);
  const corridor = getTreeCorridor(tree);
  const treeType = storage.getTreeTypeById(tree.treeTypeId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-lg w-full max-h-[92vh] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col border border-[#E0EBDD] dark:border-emerald-500/30 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs my-auto"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[#174B36] dark:bg-[#091b12] dark:border-b dark:border-emerald-500/30 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs font-black flex items-center justify-center border border-slate-700 shadow-md">
              {streetCode}
            </div>
            <div>
              <div className="text-[10px] text-white/70 dark:text-emerald-300/70 tracking-wider uppercase font-semibold">
                Cổng Tra cứu Cây xanh Công cộng
              </div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>{tree.displayName}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  [{streetCode}]
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto overscroll-contain space-y-4 flex-1" data-lenis-prevent>
          {/* Toggle between Tag & Details */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTag(false)}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all border cursor-pointer ${
                !showTag
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
              }`}
            >
              🌿 Thông tin sinh thái
            </button>
            <button
              onClick={() => setShowTag(true)}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all border cursor-pointer ${
                showTag
                  ? 'bg-slate-900 text-amber-300 border-slate-700 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
              }`}
            >
              🔩 Biển số nhôm vật lý
            </button>
          </div>

          {showTag ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                Mô phỏng biển số nhôm đóng trên thân cây thực tế tại <strong>{milestone}</strong>.
              </div>
              <DigitalAlloyTag tree={tree} size="md" showActions={true} />
            </div>
          ) : (
            <>
              {/* Hero Image */}
              <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
                <img
                  src={
                    tree.imageUrl ||
                    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={tree.displayName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 text-[#174B36] dark:text-emerald-400 shadow-sm backdrop-blur-xs flex items-center gap-1 border border-transparent dark:border-emerald-500/30">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{treeType?.name}</span>
                  </span>
                </div>
              </div>

              {/* Location & Milestone */}
              <div className="p-3.5 bg-[#F8FAF8] dark:bg-[#091811] rounded-xl border border-[#E0EBDD] dark:border-emerald-500/20 space-y-2.5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#174B36] dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                      {milestone}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block">{corridor}</span>
                    <div className="text-slate-400 dark:text-slate-500 font-mono text-[10px] mt-0.5">
                      Tọa độ: {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E0EBDD]/60 dark:border-slate-800 text-center">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-[#E0EBDD]/50 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Năm trồng</span>
                    <span className="font-bold text-[#174B36] dark:text-emerald-400 font-mono text-xs">
                      {tree.plantedAt ? new Date(tree.plantedAt).getFullYear() : '2021'}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-[#E0EBDD]/50 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Đường kính</span>
                    <span className="font-bold text-[#174B36] dark:text-emerald-400 font-mono text-xs">
                      {tree.diameterCm || 30} cm
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-[#E0EBDD]/50 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Chiều cao</span>
                    <span className="font-bold text-[#174B36] dark:text-emerald-400 font-mono text-xs">
                      {tree.heightM || 8} m
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Botanical description */}
          {treeType && (
            <div className="space-y-1.5">
              <span className="font-bold text-[#174B36] dark:text-emerald-400 text-xs">Thông tin loài cây:</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
                <div>
                  <strong>Tên khoa học:</strong> <em>{treeType.scientificName}</em>
                </div>
                <p>{treeType.description}</p>
              </div>
            </div>
          )}

          {/* Blockchain Integrity Seal */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-[11px]">Bảo chứng Toàn vẹn Blockchain</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono truncate max-w-[220px]">
                  Hash: {tree.payloadHash?.slice(0, 24)}...
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] font-mono border border-transparent dark:border-emerald-700/50">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
          {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF') && onOpenManagement && (
            <button
              onClick={() => {
                onOpenManagement(tree);
                onClose();
              }}
              className="w-full py-2.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Trees className="w-4 h-4" />
              <span>Chuyển sang Bảng điều khiển Quản lý ({currentUser.role})</span>
            </button>
          )}

          <button
            onClick={() => {
              onReportIncident(tree);
              onClose();
            }}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Báo cáo sự cố hoặc hư hại về cây này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
