import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  ShieldCheck,
  Trees,
  CheckCircle2,
  Calendar,
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { storage } from '../db/storage';
import { CareActionType, CareRecord, TreeHealthStatus } from '../types';

interface CareRecordsViewProps {
  onOpenCareModal: (treeId?: string) => void;
  onSelectTree: (tree: any) => void;
}

export const CareRecordsView: React.FC<CareRecordsViewProps> = ({
  onOpenCareModal,
  onSelectTree,
}) => {
  const careRecords = storage.getCareRecords();
  const trees = storage.getTrees();

  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const filteredCare = careRecords.filter((care) => {
    const tree = trees.find((t) => t.id === care.treeId);
    const matchesSearch =
      (tree && tree.publicCode.toLowerCase().includes(search.toLowerCase())) ||
      (tree && tree.displayName.toLowerCase().includes(search.toLowerCase())) ||
      care.notes.toLowerCase().includes(search.toLowerCase()) ||
      (care.staffName && care.staffName.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = selectedAction === 'ALL' || care.actionType === selectedAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#174B36] dark:text-[#00FF9D] flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#347A50] dark:text-emerald-400" />
            <span>Nhật ký Chăm sóc &amp; Bảo dưỡng Cây xanh</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ghi nhận tiến trình cắt tỉa, tưới nước, bón phân, phòng trừ sâu bệnh. Dữ liệu được băm SHA-256 chống sửa đổi.
          </p>
        </div>

        <button
          onClick={() => onOpenCareModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174B36] hover:bg-[#347A50] text-white text-xs font-semibold rounded-xl transition-all shadow-xs self-start sm:self-auto dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi chăm sóc mới</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="p-3.5 bg-white dark:bg-[#0c1812] rounded-2xl border border-[#E0EBDD] dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã cây, tên nhân viên, ghi chú..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700/80 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Hoạt động:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700/80 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">Tất cả hoạt động</option>
            <option value="WATERING">Tưới nước</option>
            <option value="PRUNING">Cắt tỉa cành</option>
            <option value="FERTILIZING">Bón phân</option>
            <option value="PEST_CONTROL">Xử lý sâu bệnh</option>
            <option value="SURVEY">Khảo sát độ nghiêng/sâu mọt</option>
            <option value="SUPPORT_STAKE">Chống cọc đỡ</option>
          </select>
        </div>
      </div>

      {/* Care Records Feed / Timeline Feed */}
      {filteredCare.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c1812] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
          Chưa có bản ghi chăm sóc nào phù hợp.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCare.map((care) => {
            const tree = trees.find((t) => t.id === care.treeId);
            return (
              <div
                key={care.id}
                className="bg-white dark:bg-[#0c1812] p-4 sm:p-5 rounded-2xl border border-[#E0EBDD] dark:border-slate-800 hover:border-[#347A50] dark:hover:border-emerald-500/40 dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {tree && (
                      <button
                        onClick={() => onSelectTree(tree)}
                        className="font-mono text-xs font-bold text-[#174B36] bg-[#E0EBDD] px-2.5 py-0.5 rounded-full hover:bg-[#d0dfcc] dark:text-[#00FF9D] dark:bg-emerald-950/80 dark:border dark:border-emerald-500/30 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                      >
                        {tree.publicCode}
                      </button>
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {tree?.displayName || 'Cây xanh đô thị'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#174B36] text-white dark:bg-emerald-500/20 dark:text-[#00FF9D] dark:border dark:border-emerald-500/40 font-mono">
                      {care.actionType}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(care.performedAt).toLocaleDateString('vi-VN')} {new Date(care.performedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">{care.notes}</p>

                  {/* Staff attribution chips & before/after health pills */}
                  <div className="flex items-center gap-3 text-[11px] pt-1 flex-wrap">
                    {/* Staff attribution chip */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
                      <span>
                        Kỹ thuật viên: <strong className="text-slate-800 dark:text-slate-100">{care.staffName || 'Đội kỹ thuật'}</strong>
                      </span>
                    </div>

                    {/* Before/after health pills */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <span>Chuyển biến:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700">
                        {care.healthBefore}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-[#00FF9D] border border-emerald-300/60 dark:border-emerald-500/40">
                        {care.healthAfter}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Blockchain Badge on Right */}
                <div className="shrink-0 flex md:flex-col items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-mono text-[11px] dark:bg-emerald-950/70 dark:border-emerald-500/40 dark:text-[#00FF9D] dark:shadow-[0_0_10px_rgba(0,255,157,0.15)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
                    <span>CONFIRMED</span>
                  </div>
                  {care.txHash && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[130px]" title={care.txHash}>
                      {care.txHash}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
