import React, { useState, useMemo, useEffect } from 'react';
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
  Route,
  ChevronDown,
  ChevronUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { storage } from '../db/storage';
import { CareActionType, CareRecord, Tree, TreeHealthStatus } from '../types';
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
  onSelectTree: (tree: Tree) => void;
}

interface CorridorCareGroup {
  corridorName: string;
  records: CareRecord[];
  uniqueTreeCount: number;
  latestPerformedAt: string;
  equipments: string[];
  actionCounts: Record<string, number>;
  staffMembers: string[];
}

export const CareRecordsView: React.FC<CareRecordsViewProps> = ({
  onOpenCareModal,
  onSelectTree,
}) => {
  const [dataVersion, setDataVersion] = useState(0);
  const careRecords = useMemo(() => storage.getCareRecords(), [dataVersion]);
  const trees = useMemo(() => storage.getTrees(), [dataVersion]);
  const treeTypes = useMemo(() => storage.getTreeTypes(), []);

  // ⚡ Tối ưu O(1) Hash Map tra cứu cây xanh (Loại bỏ triệt để trees.find làm đơ máy)
  const treeMap = useMemo(() => {
    const map = new Map<string, Tree>();
    for (let i = 0; i < trees.length; i++) {
      map.set(trees[i].id, trees[i]);
    }
    return map;
  }, [trees]);

  // Chế độ xem: 'corridor' (Theo Tuyến Đường & Ca Máy) hoặc 'timeline' (Theo Dòng Thời Gian)
  const [viewMode, setViewMode] = useState<'corridor' | 'timeline'>('corridor');

  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedHealthAfter, setSelectedHealthAfter] = useState<string>('ALL');

  // Pagination State cho chế độ Timeline (Chống quá tải DOM)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Accordion quản lý các tuyến đang mở rộng trong chế độ Corridor
  const [expandedCorridors, setExpandedCorridors] = useState<Set<string>>(new Set());

  // Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);

  // ⚡ Debounce 300ms tìm kiếm văn bản chống khựng bàn phím
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset trang về 1 khi bất kỳ bộ lọc nào thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    selectedProvince,
    selectedArea,
    selectedCorridor,
    selectedAction,
    selectedType,
    selectedHealthAfter,
    pageSize,
  ]);

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

  // Bộ lọc dữ liệu chăm sóc (Duyệt qua O(1) Map)
  const filteredCare = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();

    return careRecords.filter((care) => {
      const tree = treeMap.get(care.treeId);

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
    treeMap,
    debouncedSearch,
    selectedProvince,
    selectedArea,
    selectedCorridor,
    selectedAction,
    selectedType,
    selectedHealthAfter,
  ]);

  // 🧠 GOM NHÓM THEO TUYẾN ĐƯỜNG & CA MÁY (CORRIDOR CARE BATCHES)
  const corridorGroups = useMemo(() => {
    const map = new Map<string, CareRecord[]>();

    for (let i = 0; i < filteredCare.length; i++) {
      const care = filteredCare[i];
      const tree = treeMap.get(care.treeId);
      const corr = tree ? getTreeCorridor(tree) : 'Khu Vực Khác';
      const list = map.get(corr) || [];
      list.push(care);
      map.set(corr, list);
    }

    const groups: CorridorCareGroup[] = [];
    map.forEach((records, corridorName) => {
      const treeIdSet = new Set<string>();
      const equipSet = new Set<string>();
      const staffSet = new Set<string>();
      const actionCounts: Record<string, number> = {};
      let latestDate = '';

      records.forEach((r) => {
        treeIdSet.add(r.treeId);
        if (r.equipmentUsed) equipSet.add(r.equipmentUsed);
        if (r.staffName) staffSet.add(r.staffName);
        actionCounts[r.actionType] = (actionCounts[r.actionType] || 0) + 1;
        if (!latestDate || new Date(r.performedAt).getTime() > new Date(latestDate).getTime()) {
          latestDate = r.performedAt;
        }
      });

      groups.push({
        corridorName,
        records,
        uniqueTreeCount: treeIdSet.size,
        latestPerformedAt: latestDate,
        equipments: Array.from(equipSet),
        actionCounts,
        staffMembers: Array.from(staffSet),
      });
    });

    // Tuyến có nhiều lượt chăm sóc nhất lên đầu
    return groups.sort((a, b) => b.records.length - a.records.length);
  }, [filteredCare, treeMap]);

  // Phân trang cho chế độ Timeline
  const totalPages = Math.max(1, Math.ceil(filteredCare.length / pageSize));
  const paginatedCare = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCare.slice(start, start + pageSize);
  }, [filteredCare, currentPage, pageSize]);

  const toggleCorridorExpand = (name: string) => {
    setExpandedCorridors((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

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
            <span>Nhật ký Chăm sóc &amp; Bảo dưỡng Cơ giới Tuyến Phố</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý tiến trình cắt tỉa, tưới bồn, cơ giới hóa thực địa gom nhóm thông minh theo Tuyến Phố. Neo dữ liệu bất biến EVM Blockchain.
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
              placeholder="Tìm theo mã cây [HB-01], mốc số nhà, KTV, thiết bị..."
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

        {/* HÀNG 2: LOẠI HOẠT ĐỘNG, SỨC KHỎE SAU CHĂM SÓC, LOÀI CÂY & CHUYỂN CHẾ ĐỘ XEM */}
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

          {/* CHUYỂN ĐỔI CHẾ ĐỘ XEM: GOM NHÓM TUYẾN ĐƯỜNG vs DÒNG THỜI GIAN */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('corridor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'corridor'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Giao diện gom nhóm thông minh theo Tuyến Phố & Ca Máy cơ giới (Khuyên dùng)"
              >
                <Route className="w-3.5 h-3.5" />
                <span>Theo Tuyến Phố</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Giao diện dòng thời gian chi tiết từng lượt chăm sóc"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Dòng Thời Gian</span>
              </button>
            </div>

            <span className="text-xs text-emerald-700 dark:text-[#00FF9D] font-mono font-bold whitespace-nowrap pl-1">
              {filteredCare.length.toLocaleString('vi-VN')} lượt
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          CHẾ ĐỘ 1: GOM NHÓM THEO TUYẾN ĐƯỜNG & CA MÁY (CORRIDOR BATCHES)
         ======================================================== */}
      {viewMode === 'corridor' && (
        <div className="space-y-4">
          {corridorGroups.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0c1812] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
              Không có nhật ký chăm sóc nào phù hợp với bộ lọc.
            </div>
          ) : (
            corridorGroups.map((group) => {
              const isExpanded = expandedCorridors.has(group.corridorName);
              const previewRecords = isExpanded ? group.records : group.records.slice(0, 3);

              return (
                <div
                  key={group.corridorName}
                  className="bg-white dark:bg-[#0c1812] rounded-2xl border border-[#E0EBDD] dark:border-slate-800 hover:border-emerald-500/50 transition-all shadow-sm overflow-hidden"
                >
                  {/* Header Tuyến Phố */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Route className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {group.corridorName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-[#00FF9D] border border-emerald-300 dark:border-emerald-800">
                            {group.records.length} lượt chăm sóc ({group.uniqueTreeCount} cây)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          {group.latestPerformedAt && (
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Lần duy tu gần nhất: {new Date(group.latestPerformedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {group.equipments.length > 0 && (
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                              <Truck className="w-3.5 h-3.5 text-blue-500" />
                              {group.equipments.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown hoạt động & nút mở rộng */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        {Object.entries(group.actionCounts).map(([act, count]) => (
                          <span
                            key={act}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {act}: {count}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => toggleCorridorExpand(group.corridorName)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Thu gọn' : `Xem tất cả (${group.records.length})`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Danh Sách Các Lượt Chăm Sóc Bên Trong Tuyến */}
                  <div className="p-4 space-y-2.5">
                    {previewRecords.map((care) => {
                      const tree = treeMap.get(care.treeId);
                      const streetCode = tree ? getTreeStreetCode(tree) : 'CT';
                      const milestone = tree ? getTreeMilestone(tree) : '';

                      return (
                        <div
                          key={care.id}
                          className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {tree && (
                                <button
                                  onClick={() => onSelectTree(tree)}
                                  className="font-mono text-[11px] font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded-md hover:bg-slate-800 cursor-pointer"
                                  title="Xem hồ sơ cây"
                                >
                                  [{streetCode}] {tree.publicCode}
                                </button>
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {tree?.displayName || 'Cây xanh'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-[#00FF9D]">
                                {care.actionType}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {new Date(care.performedAt).toLocaleDateString('vi-VN')} {new Date(care.performedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {milestone && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                {milestone}
                              </p>
                            )}

                            <p className="text-slate-600 dark:text-slate-300 font-normal">{care.notes}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono">
                              KTV: <strong>{care.staffName || 'Đội cơ giới'}</strong>
                            </span>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-[#00FF9D] text-[10px] font-mono">
                              <ShieldCheck className="w-3 h-3" />
                              <span>EVM</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!isExpanded && group.records.length > 3 && (
                      <div className="text-center pt-1">
                        <button
                          onClick={() => toggleCorridorExpand(group.corridorName)}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          + Xem thêm {group.records.length - 3} lượt chăm sóc khác trên {group.corridorName}...
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          CHẾ ĐỘ 2: THEO DÒNG THỜI GIAN CÓ PHÂN TRANG (TIMELINE FEED)
         ======================================================== */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {filteredCare.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0c1812] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
              Không có bản ghi chăm sóc nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <>
              {paginatedCare.map((care) => {
                const tree = treeMap.get(care.treeId);
                const streetCode = tree ? getTreeStreetCode(tree) : 'CT';
                const milestone = tree ? getTreeMilestone(tree) : '';
                const corridor = tree ? getTreeCorridor(tree) : '';

                return (
                  <div
                    key={care.id}
                    className="bg-white dark:bg-[#0c1812] p-4 sm:p-5 rounded-2xl border border-[#E0EBDD] dark:border-slate-800 hover:border-[#347A50] dark:hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
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
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
                          <span>
                            Kỹ thuật viên: <strong className="text-slate-800 dark:text-slate-100">{care.staffName || 'Đội kỹ thuật'}</strong>
                          </span>
                        </div>

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
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-mono text-[11px] dark:bg-emerald-950/70 dark:border-emerald-500/40 dark:text-[#00FF9D]">
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

              {/* 📑 THANH PHÂN TRANG CHỐNG QUÁ TẢI DOM */}
              <div className="p-3 bg-white dark:bg-[#0c1812] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                  >
                    <option value={15}>15 dòng</option>
                    <option value={25}>25 dòng</option>
                    <option value={50}>50 dòng</option>
                    <option value={100}>100 dòng</option>
                  </select>
                  <span>trên tổng {filteredCare.length.toLocaleString('vi-VN')} bản ghi</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
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
