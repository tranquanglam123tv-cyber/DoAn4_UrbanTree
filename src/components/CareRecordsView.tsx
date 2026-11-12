import React, { useState, useMemo } from 'react';
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
  Truck,
  Wrench,
  MapPin,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { storage } from '../db/storage';
import { CareActionType, CareRecord, TreeHealthStatus } from '../types';
import {
  getTreeCorridor,
  getTreeMilestone,
  getTreeStreetCode,
  getTreeGeneralArea,
} from '../utils/treeUtils';
import { NATIONAL_PROVINCES, getTreeProvinceId } from '../utils/zoneUtils';
import { BulkCareModal } from './BulkCareModal';

interface CareRecordsViewProps {
  onOpenCareModal: (treeId?: string) => void;
  onSelectTree: (tree: any) => void;
}

export const CareRecordsView: React.FC<CareRecordsViewProps> = ({
  onOpenCareModal,
  onSelectTree,
}) => {
  const [dataVersion, setDataVersion] = useState(0);
  const careRecords = useMemo(() => storage.getCareRecords(), [dataVersion]);
  const trees = useMemo(() => storage.getTrees(), [dataVersion]);
  const treeTypes = useMemo(() => storage.getTreeTypes(), []);

  // Filter States - Đồng bộ chuẩn hóa y như Hồ Sơ Cây (TreeListView)
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedHealthAfter, setSelectedHealthAfter] = useState<string>('ALL');

  // Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Danh sách Địa phương / Khu vực
  const availableAreas = useMemo(() => {
    const counts: { [area: string]: number } = {};
    trees.forEach((t) => {
      if (selectedProvince !== 'all' && getTreeProvinceId(t) !== selectedProvince) return;
      const a = getTreeGeneralArea(t);
      counts[a] = (counts[a] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [trees, selectedProvince]);

  // Danh sách Tuyến đường
  const availableCorridors = useMemo(() => {
    const counts: { [c: string]: number } = {};
    trees.forEach((t) => {
      if (selectedProvince !== 'all' && getTreeProvinceId(t) !== selectedProvince) return;
      if (selectedArea !== 'ALL' && getTreeGeneralArea(t) !== selectedArea) return;
      const c = getTreeCorridor(t);
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [trees, selectedProvince, selectedArea]);

  // Bộ lọc dữ liệu chăm sóc
  const filteredCare = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return careRecords.filter((care) => {
      const tree = trees.find((t) => t.id === care.treeId);

      // 1. Lọc theo Tỉnh / Toàn quốc
      if (selectedProvince !== 'all') {
        if (!tree || getTreeProvinceId(tree) !== selectedProvince) return false;
      }

      // 2. Lọc theo Địa phương / Khu vực
      if (selectedArea !== 'ALL') {
        if (!tree || getTreeGeneralArea(tree) !== selectedArea) return false;
      }

      // 3. Lọc theo Tuyến đường
      if (selectedCorridor !== 'ALL') {
        if (!tree || getTreeCorridor(tree) !== selectedCorridor) return false;
      }

      // 4. Lọc theo Loại hoạt động chăm sóc
      if (selectedAction !== 'ALL' && care.actionType !== selectedAction) {
        return false;
      }

      // 5. Lọc theo Loài cây
      if (selectedType !== 'ALL') {
        if (!tree || tree.treeTypeId !== selectedType) return false;
      }

      // 6. Lọc theo Tình trạng sau chăm sóc
      if (selectedHealthAfter !== 'ALL' && care.healthAfter !== selectedHealthAfter) {
        return false;
      }

      // 7. Tìm kiếm tự do
      if (searchLower) {
        const publicCode = tree?.publicCode?.toLowerCase() || '';
        const streetCode = tree ? getTreeStreetCode(tree).toLowerCase() : '';
        const displayName = tree?.displayName?.toLowerCase() || '';
        const milestone = tree ? getTreeMilestone(tree).toLowerCase() : '';
        const notes = care.notes?.toLowerCase() || '';
        const staff = care.staffName?.toLowerCase() || '';
        const equip = care.equipmentUsed?.toLowerCase() || '';
        const chem = care.chemicalsUsed?.toLowerCase() || '';

        const match =
          publicCode.includes(searchLower) ||
          streetCode.includes(searchLower) ||
          displayName.includes(searchLower) ||
          milestone.includes(searchLower) ||
          notes.includes(searchLower) ||
          staff.includes(searchLower) ||
          equip.includes(searchLower) ||
          chem.includes(searchLower);

        if (!match) return false;
      }

      return true;
    });
  }, [
    careRecords,
    trees,
    search,
    selectedProvince,
    selectedArea,
    selectedCorridor,
    selectedAction,
    selectedType,
    selectedHealthAfter,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedProvince('all');
    setSelectedArea('ALL');
    setSelectedCorridor('ALL');
    setSelectedAction('ALL');
    setSelectedType('ALL');
    setSelectedHealthAfter('ALL');
  };

  const isFiltered =
    search ||
    selectedProvince !== 'all' ||
    selectedArea !== 'ALL' ||
    selectedCorridor !== 'ALL' ||
    selectedAction !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedHealthAfter !== 'ALL';

  return (
    <div className="space-y-5">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#174B36] dark:text-[#00FF9D] flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#347A50] dark:text-emerald-400" />
            <span>Nhật ký Chăm sóc &amp; Bảo dưỡng Cây xanh</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý tiến trình cắt tỉa, tưới nước bồn, phun sinh học và cơ giới hóa thực địa. Neo dữ liệu bất biến EVM Blockchain.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút Chăm Sóc Hàng Loạt Theo Tuyến */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            title="Duy tu cơ giới hóa hàng loạt cho toàn bộ cây trên tuyến phố / địa bàn"
          >
            <Truck className="w-4 h-4 text-amber-300" />
            <span>🚜 Chăm sóc hàng loạt theo tuyến</span>
          </button>

          {/* Nút Ghi Chăm Sóc Đơn Lẻ */}
          <button
            onClick={() => onOpenCareModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174B36] hover:bg-[#347A50] text-white text-xs font-semibold rounded-xl transition-all shadow-xs self-start sm:self-auto dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi chăm sóc mới</span>
          </button>
        </div>
      </div>

      {/* 🧭 BỘ LỌC ĐA CHIỀU (CHUẨN HÓA ĐỒNG BỘ 100% VỚI HỒ SƠ CÂY) */}
      <div className="p-3.5 sm:p-4 bg-white dark:bg-[#0c1812] rounded-2xl border border-[#E0EBDD] dark:border-slate-800 shadow-2xs space-y-3">
        {/* HÀNG 1: TÌM KIẾM + TỈNH / ĐỊA PHƯƠNG / TUYẾN ĐƯỜNG */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Tìm kiếm văn bản */}
          <div className="relative sm:col-span-5">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã cây [HB-01], mốc số nhà, KTV, thiết bị, ghi chú..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700/80 rounded-xl focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/90 text-slate-900 dark:text-white"
            />
          </div>

          {/* Tỉnh / Toàn quốc */}
          <div className="sm:col-span-2">
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setSelectedArea('ALL');
                setSelectedCorridor('ALL');
              }}
              className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">🌐 Toàn quốc</option>
              {NATIONAL_PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Địa phương / Quận huyện */}
          <div className="sm:col-span-2">
            <select
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setSelectedCorridor('ALL');
              }}
              className="w-full px-2.5 py-2 text-xs font-bold border border-emerald-300 dark:border-emerald-700/80 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-[#00FF9D]"
            >
              <option value="ALL">📍 Tất cả địa phương</option>
              {availableAreas.map(([area, count]) => (
                <option key={area} value={area}>
                  {area} ({count} cây)
                </option>
              ))}
            </select>
          </div>

          {/* Tuyến đường liên hoàn */}
          <div className="sm:col-span-3">
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">🛣️ Tất cả tuyến đường</option>
              {availableCorridors.map(([c, count]) => (
                <option key={c} value={c}>
                  {c} ({count} cây)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* HÀNG 2: LOẠI HOẠT ĐỘNG, SỨC KHỎE SAU CHĂM SÓC, LOÀI CÂY & ĐẶT LẠI */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc theo Loại hoạt động */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedAction !== 'ALL'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#00FF9D]'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <option value="ALL">🛠️ Tất cả hoạt động</option>
              <option value="WATERING">Tưới nước xe bồn (WATERING)</option>
              <option value="PRUNING">Cắt tỉa hạ tán bão (PRUNING)</option>
              <option value="FERTILIZING">Bón phân vi sinh NPK (FERTILIZING)</option>
              <option value="PEST_CONTROL">Xử lý sâu bệnh &amp; nấm (PEST_CONTROL)</option>
              <option value="SURVEY">Khảo sát Arbotom/nghiêng (SURVEY)</option>
              <option value="TREATMENT">Bôi keo sẹo / Quét vôi (TREATMENT)</option>
              <option value="SUPPORT_STAKE">Chống cọc đỡ &amp; giằng (SUPPORT_STAKE)</option>
            </select>

            {/* Lọc theo Loài cây */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">🌿 Tất cả loài cây</option>
              {treeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Lọc theo Chuyển biến sức khỏe */}
            <select
              value={selectedHealthAfter}
              onChange={(e) => setSelectedHealthAfter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">❤️ Sức khỏe sau chăm sóc (Tất cả)</option>
              <option value="GOOD">Tốt (GOOD)</option>
              <option value="FAIR">Bình thường (FAIR)</option>
              <option value="POOR">Kém (POOR)</option>
            </select>

            {/* Nút đặt lại bộ lọc */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Đặt lại bộ lọc về mặc định"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <span className="text-xs text-emerald-700 dark:text-[#00FF9D] font-mono font-bold whitespace-nowrap pl-2">
            Hiển thị {filteredCare.length} / {careRecords.length} lượt chăm sóc
          </span>
        </div>
      </div>

      {/* Care Records Feed / Timeline Feed */}
      {filteredCare.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c1812] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
          Không có bản ghi chăm sóc nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCare.map((care) => {
            const tree = trees.find((t) => t.id === care.treeId);
            const streetCode = tree ? getTreeStreetCode(tree) : 'CT';
            const milestone = tree ? getTreeMilestone(tree) : '';
            const corridor = tree ? getTreeCorridor(tree) : '';

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
                        className="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-700 shadow-2xs hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Bấm để mở hồ sơ chi tiết cây"
                      >
                        [{streetCode}] {tree.publicCode}
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

                  {/* Cột mốc số nhà & tuyến đường */}
                  {milestone && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span><strong>{milestone}</strong> · <span>{corridor}</span></span>
                    </div>
                  )}

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">{care.notes}</p>

                  {/* 🚜 Hiển thị Cơ giới & Vật tư nếu có */}
                  {(care.equipmentUsed || care.chemicalsUsed) && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] space-y-1">
                      {care.equipmentUsed && (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Cơ giới huy động: <strong className="text-slate-900 dark:text-slate-100">{care.equipmentUsed}</strong></span>
                        </div>
                      )}
                      {care.chemicalsUsed && (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Vật tư lâm sinh: <strong className="text-slate-900 dark:text-slate-100">{care.chemicalsUsed}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

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

      {/* Modal Chăm Sóc Hàng Loạt */}
      {showBulkModal && (
        <BulkCareModal
          initialArea={selectedArea !== 'ALL' ? selectedArea : undefined}
          initialCorridor={selectedCorridor !== 'ALL' ? selectedCorridor : undefined}
          onClose={() => setShowBulkModal(false)}
          onSaved={() => {
            setDataVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
};

