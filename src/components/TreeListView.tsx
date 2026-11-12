import React, { useState, useMemo, useEffect } from 'react';
import {
  Trees,
  Search,
  Filter,
  Plus,
  QrCode,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ClipboardList,
  Edit,
  LayoutGrid,
  List,
  Navigation,
  Radio,
  Layers,
  Sparkles,
  ChevronRight,
  Route,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Cpu,
  Scissors,
  Ruler,
  RefreshCw,
} from 'lucide-react';
import { Tree, TreeHealthStatus } from '../types';
import { storage } from '../db/storage';
import {
  calculateISATraqRating,
  getTreeCorridor,
  getTreeMilestone,
  getTreeStreetCode,
  getTreeFullDisplayLabel,
  getTreeGeneralArea,
  calculateHaversineDistance,
  findNearestTree,
  STREET_CORRIDORS_LIST,
} from '../utils/treeUtils';
import {
  NATIONAL_PROVINCES,
  getTreeProvinceId,
  getTreeZoneId,
  getZonesByProvince,
} from '../utils/zoneUtils';
import { CorridorWorkOrderModal } from './CorridorWorkOrderModal';

interface TreeListViewProps {
  onSelectTree: (tree: Tree) => void;
  onOpenQrModal: (tree: Tree) => void;
  onOpenAddTree: () => void;
  onOpenEditTree: (tree: Tree) => void;
  onOpenCareModal: (treeId: string) => void;
  onOpenPublicView: (tree: Tree) => void;
}

export const TreeListView: React.FC<TreeListViewProps> = ({
  onSelectTree,
  onOpenQrModal,
  onOpenAddTree,
  onOpenEditTree,
  onOpenCareModal,
  onOpenPublicView,
}) => {
  const trees = storage.getTrees();
  const treeTypes = storage.getTreeTypes();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');
  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState<string>('ALL');
  // 📏🌲✂️ Bộ lọc lâm sinh & kỹ thuật cây xanh
  const [selectedHeight, setSelectedHeight] = useState<string>('ALL');
  const [selectedDiameter, setSelectedDiameter] = useState<string>('ALL');
  const [selectedPruning, setSelectedPruning] = useState<string>('ALL');
  // ⚡ Ma trận ISA TRAQ, góc nghiêng & độ rỗng thân
  const [selectedTraq, setSelectedTraq] = useState<string>('ALL');
  const [selectedTilt, setSelectedTilt] = useState<string>('ALL');
  const [selectedHollow, setSelectedHollow] = useState<string>('ALL');
  const [workOrderCorridor, setWorkOrderCorridor] = useState<string | null>(null);
  const currentUser = storage.getActiveUser();
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'corridor'>('corridor');

  // Lấy danh sách lịch sử chăm sóc để xác định ngày chưa cắt tỉa
  const careRecords = useMemo(() => storage.getCareRecords(), []);

  // Map treeId -> số ngày trôi qua kể từ lần cắt tỉa cành (PRUNING) gần nhất
  const treePruningDaysMap = useMemo(() => {
    const map = new Map<string, number>();
    const now = Date.now();
    careRecords.forEach((c) => {
      if (c.actionType === 'PRUNING' && c.performedAt) {
        const time = new Date(c.performedAt).getTime();
        if (!isNaN(time)) {
          const days = Math.max(0, Math.floor((now - time) / (24 * 60 * 60 * 1000)));
          const currentMinDays = map.get(c.treeId);
          if (currentMinDays === undefined || days < currentMinDays) {
            map.set(c.treeId, days);
          }
        }
      }
    });
    return map;
  }, [careRecords]);

  // ⚡ Debounce 300ms: Tối ưu chống đơ lag khi tìm kiếm trên tập 5,000+ cây
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Pagination State (Tối ưu DOM không quá tải: 30 / 60 / 100 cây/trang)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);

  // GPS Radar State
  const [isScanningGps, setIsScanningGps] = useState(false);
  const [radarNearestTree, setRadarNearestTree] = useState<{ tree: Tree; distanceM: number } | null>(null);
  const [radarUserLocation, setRadarUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radarToast, setRadarToast] = useState<string | null>(null);

  // 🌐 Cây theo Tỉnh / Thành phố
  const provinceTrees = useMemo(() => {
    if (selectedProvince === 'all') return trees;
    return trees.filter((t) => getTreeProvinceId(t) === selectedProvince);
  }, [trees, selectedProvince]);

  // 🗺️ Danh sách Địa phương / Khu vực tổng quát (Quận Ninh Kiều, Cái Răng, Bình Thủy, Đà Nẵng...)
  const availableAreas = useMemo(() => {
    const counts: { [area: string]: number } = {};
    provinceTrees.forEach((t) => {
      const a = getTreeGeneralArea(t);
      counts[a] = (counts[a] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [provinceTrees]);

  // 🛣️ Danh sách Tuyến đường / Dãy cây theo khu vực đang chọn
  const availableCorridors = useMemo(() => {
    const counts: { [corridor: string]: number } = {};
    provinceTrees.forEach((t) => {
      if (selectedArea !== 'ALL' && getTreeGeneralArea(t) !== selectedArea) return;
      const c = getTreeCorridor(t);
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [provinceTrees, selectedArea]);

  // Reset trang về 1 khi bất kỳ bộ lọc nào thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    selectedProvince,
    selectedArea,
    selectedCorridorFilter,
    selectedType,
    selectedHealth,
    selectedHeight,
    selectedDiameter,
    selectedPruning,
    selectedTraq,
    selectedTilt,
    selectedHollow,
    viewMode,
  ]);

  // Filtered Trees (Tối ưu Fast-Path Short Circuit: kiểm tra thuộc tính trực tiếp trước khi tính toán chuỗi)
  const filteredTrees = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase().trim();

    return provinceTrees.filter((tree) => {
      // 1. Fast checks (Direct property match O(1))
      if (selectedHealth !== 'ALL' && tree.healthStatus !== selectedHealth) return false;
      if (selectedType !== 'ALL' && tree.treeTypeId !== selectedType) return false;

      // 1.1 ISA TRAQ Risk Rating
      if (selectedTraq !== 'ALL') {
        const traq = calculateISATraqRating(tree);
        if (traq.rating !== selectedTraq) return false;
      }

      // 1.2 Độ nghiêng thân cây (tiltAngleDeg)
      if (selectedTilt !== 'ALL') {
        const tilt = tree.tiltAngleDeg ?? 0;
        if (selectedTilt === 'DANGEROUS' && !(tilt >= 15)) return false;
        if (selectedTilt === 'WARNING' && !(tilt >= 8 && tilt < 15)) return false;
        if (selectedTilt === 'SAFE' && !(tilt < 8)) return false;
      }

      // 1.3 Độ rỗng ruột thân cây Arbotom (hollowRatioPercent)
      if (selectedHollow !== 'ALL') {
        const hollow = tree.hollowRatioPercent ?? 0;
        if (selectedHollow === 'HOLLOW' && !(hollow >= 40)) return false;
        if (selectedHollow === 'DECAY' && !(hollow >= 20 && hollow < 40)) return false;
        if (selectedHollow === 'SOLID' && !(hollow < 20)) return false;
      }

      // 2. Chiều cao cây (heightM)
      if (selectedHeight !== 'ALL') {
        const h = tree.heightM ?? 0;
        if (selectedHeight === '<6' && !(h < 6)) return false;
        if (selectedHeight === '6-12' && !(h >= 6 && h <= 12)) return false;
        if (selectedHeight === '12-20' && !(h > 12 && h <= 20)) return false;
        if (selectedHeight === '>20' && !(h > 20)) return false;
      }

      // 3. Độ to thân cây (diameterCm)
      if (selectedDiameter !== 'ALL') {
        const d = tree.diameterCm ?? 0;
        if (selectedDiameter === '<20' && !(d < 20)) return false;
        if (selectedDiameter === '20-50' && !(d >= 20 && d <= 50)) return false;
        if (selectedDiameter === '50-100' && !(d > 50 && d <= 100)) return false;
        if (selectedDiameter === '>100' && !(d > 100)) return false;
      }

      // 4. Ngày chưa cắt tỉa (Pruning)
      if (selectedPruning !== 'ALL') {
        const daysSince = treePruningDaysMap.get(tree.id); // undefined nếu chưa từng cắt tỉa
        if (selectedPruning === 'NEVER' && daysSince !== undefined) return false;
        if (selectedPruning === '>30' && (daysSince !== undefined && daysSince <= 30)) return false;
        if (selectedPruning === '>60' && (daysSince !== undefined && daysSince <= 60)) return false;
        if (selectedPruning === '>90' && (daysSince !== undefined && daysSince <= 90)) return false;
        if (selectedPruning === '>180' && (daysSince !== undefined && daysSince <= 180)) return false;
        if (selectedPruning === '<=30' && (daysSince === undefined || daysSince > 30)) return false;
      }

      // 5. Area & Corridor checks
      if (selectedArea !== 'ALL' && getTreeGeneralArea(tree) !== selectedArea) return false;
      if (selectedCorridorFilter !== 'ALL' && getTreeCorridor(tree) !== selectedCorridorFilter) return false;

      // 6. Search query check (chỉ tính toán chuỗi khi người dùng gõ tìm kiếm)
      if (!searchLower) return true;

      if (
        tree.publicCode.toLowerCase().includes(searchLower) ||
        tree.displayName.toLowerCase().includes(searchLower) ||
        tree.address.toLowerCase().includes(searchLower)
      ) {
        return true;
      }

      const streetCode = getTreeStreetCode(tree).toLowerCase();
      if (streetCode.includes(searchLower)) return true;

      const corridor = getTreeCorridor(tree).toLowerCase();
      if (corridor.includes(searchLower)) return true;

      const milestone = getTreeMilestone(tree).toLowerCase();
      return milestone.includes(searchLower);
    });
  }, [
    provinceTrees,
    debouncedSearch,
    selectedArea,
    selectedCorridorFilter,
    selectedType,
    selectedHealth,
    selectedHeight,
    selectedDiameter,
    selectedPruning,
    selectedTraq,
    selectedTilt,
    selectedHollow,
    treePruningDaysMap,
  ]);

  // Paginated Trees for Grid & Table
  const totalPages = Math.max(1, Math.ceil(filteredTrees.length / pageSize));
  const paginatedTrees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrees.slice(start, start + pageSize);
  }, [filteredTrees, currentPage, pageSize]);

  // Grouped by corridor for 'corridor' view
  const groupedCorridors = useMemo(() => {
    const groups: { [corridorName: string]: Tree[] } = {};

    filteredTrees.forEach((tree) => {
      const c = getTreeCorridor(tree);
      if (!groups[c]) groups[c] = [];
      groups[c].push(tree);
    });

    // Sắp xếp các cây trong từng tuyến theo thứ tự sequenceNumber hoặc streetCode
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const seqA = a.sequenceNumber || parseInt(a.publicCode.replace(/\D/g, '') || '0', 10);
        const seqB = b.sequenceNumber || parseInt(b.publicCode.replace(/\D/g, '') || '0', 10);
        return seqA - seqB;
      });
    });

    return groups;
  }, [filteredTrees]);

  // 📍 RADAR GPS AUTO-DETECT FUNCTION
  const handleTriggerGpsRadar = () => {
    setIsScanningGps(true);
    setRadarToast('Đang kết nối vệ tinh GNSS & đo khoảng cách đến các gốc cây xung quanh...');

    const processLocation = (lat: number, lng: number, isSimulated = false) => {
      setRadarUserLocation({ lat, lng });
      const nearest = findNearestTree(lat, lng, trees);

      if (nearest) {
        setRadarNearestTree(nearest);
        const streetCode = getTreeStreetCode(nearest.tree);
        const milestone = getTreeMilestone(nearest.tree);
        setRadarToast(
          `🎯 ĐÃ NHẬN DIỆN CÂY GẦN NHẤT: [${streetCode}] (${nearest.distanceM}m) · ${milestone}`
        );

        // Cuộn đến cây gần nhất nếu có trong DOM
        setTimeout(() => {
          const el = document.getElementById(`tree-card-${nearest.tree.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
      setIsScanningGps(false);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          processLocation(pos.coords.latitude, pos.coords.longitude, false);
        },
        (err) => {
          // Fallback sang toạ độ mô phỏng trung tâm Cần Thơ (Đại lộ Hòa Bình: 10.0368° N, 105.7825° E)
          console.warn('GPS permission denied or unavailable, using Can Tho field center simulation:', err);
          processLocation(10.036829, 105.782541, true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    } else {
      processLocation(10.036829, 105.782541, true);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* 📡 Radar GPS Notification Banner */}
      {radarToast && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl border border-emerald-400/50 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="text-xs font-medium">
              <span>{radarToast}</span>
            </div>
          </div>
          {radarNearestTree && (
            <button
              onClick={() => onSelectTree(radarNearestTree.tree)}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
            >
              Mở cây này
            </button>
          )}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#174B36] dark:text-[#00FF9D] flex items-center gap-2 tracking-tight">
            <Trees className="w-6 h-6 text-[#347A50] dark:text-emerald-400" />
            <span>Hồ Sơ Cây Xanh &amp; Quản Lý Tuyến Phố</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quy tắc đặt mã theo Tuyến Phố <strong>[HB-01, 30T4-02]</strong> kèm mốc số nhà &amp; Radar GPS nhận diện chính xác 100%.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 📍 Radar GPS Quick Trigger */}
          <button
            onClick={handleTriggerGpsRadar}
            disabled={isScanningGps}
            title="Định vị cây gần nhất bằng GPS"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer border border-emerald-400/40"
          >
            <LocateFixed className={`w-4 h-4 ${isScanningGps ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isScanningGps ? 'Đang quét Radar...' : '📍 Radar GPS Cây Gần Nhất'}</span>
          </button>

          {/* View Mode Toggle Switcher */}
          <div className="bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('corridor')}
              title="Giao diện Dãy Cây / Tuyến Phố (Khuyên dùng)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'corridor'
                  ? 'bg-white text-emerald-800 shadow-xs dark:bg-[#0c1812] dark:text-[#00FF9D] dark:border dark:border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tuyến Phố</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Chế độ lưới ô"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#174B36] shadow-xs dark:bg-[#0c1812] dark:text-[#00FF9D] dark:border dark:border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Chế độ bảng dữ liệu"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#174B36] shadow-xs dark:bg-[#0c1812] dark:text-[#00FF9D] dark:border dark:border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddTree}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174B36] hover:bg-[#347A50] text-white text-xs font-semibold rounded-xl transition-all shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm cây</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bento-card space-y-2.5 dark:bg-[#0c1812] dark:border-slate-800">
        {/* HÀNG 1: TÌM KIẾM & ĐỊA BÀN TUYẾN ĐƯỜNG */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã tuyến [HB-01], số nhà mốc, tên cây, đường phố..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 dark:border-slate-700/80 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500 transition-all shadow-2xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* 🏙️ Lọc theo Tỉnh / Thành phố (Toàn quốc, Cần Thơ, Đà Nẵng, TP.HCM, Hà Nội...) */}
          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedArea('ALL');
              setSelectedCorridorFilter('ALL');
            }}
            className="px-3 py-2 text-xs font-bold border border-blue-300 dark:border-blue-700/80 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            {NATIONAL_PROVINCES.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.shortName}
              </option>
            ))}
          </select>

          {/* 📍 Lọc theo Khu Vực / Địa Phương Tổng Quát (Quận Ninh Kiều, Cái Răng, Bình Thủy, Đà Nẵng...) */}
          <select
            value={selectedArea}
            onChange={(e) => {
              setSelectedArea(e.target.value);
              setSelectedCorridorFilter('ALL');
            }}
            className="px-3 py-2 text-xs font-bold border border-emerald-300 dark:border-emerald-700/80 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-[#00FF9D] focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="ALL">📍 Tất cả địa phương ({availableAreas.length} khu vực)</option>
            {availableAreas.map(([areaName, count]) => (
              <option key={areaName} value={areaName}>
                {areaName} ({count} cây)
              </option>
            ))}
          </select>

          {/* 🛣️ Lọc theo Tuyến Đường / Công Viên Đô Thị */}
          <select
            value={selectedCorridorFilter}
            onChange={(e) => setSelectedCorridorFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="ALL">
              🛣️ {selectedArea !== 'ALL' ? `Tất cả tuyến ở ${selectedArea.split('(')[0].trim()}` : 'Tất cả tuyến đường'} ({availableCorridors.length})
            </option>
            {availableCorridors.map(([cName, count]) => (
              <option key={cName} value={cName}>
                {cName} ({count} cây)
              </option>
            ))}
          </select>
        </div>

        {/* HÀNG 2: THÔNG SỐ LÂM SINH (CHIỀU CAO, ĐỘ TO THÂN, CẮT TỈA, LOÀI CÂY, SỨC KHỎE) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* 📏 LỌC THEO CHIỀU CAO CÂY */}
            <select
              value={selectedHeight}
              onChange={(e) => setSelectedHeight(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedHeight !== 'ALL'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#00FF9D]'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <option value="ALL">📏 Tất cả chiều cao</option>
              <option value="<6">&lt; 6m (Cây thấp / mới trồng)</option>
              <option value="6-12">6m - 12m (Loại 1 - Trung bình)</option>
              <option value="12-20">12m - 20m (Loại 2 - Cây cao)</option>
              <option value=">20">&gt; 20m (Cây đại thụ / Tán lớn)</option>
            </select>

            {/* 🌳 LỌC THEO ĐỘ TO THÂN CÂY (ĐƯỜNG KÍNH DBH) */}
            <select
              value={selectedDiameter}
              onChange={(e) => setSelectedDiameter(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedDiameter !== 'ALL'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-[#00FF9D]'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <option value="ALL">🌳 Tất cả độ to thân (Đk)</option>
              <option value="<20">&lt; 20cm (Thân mảnh / cây non)</option>
              <option value="20-50">20cm - 50cm (Thân vừa)</option>
              <option value="50-100">50cm - 100cm (Thân to)</option>
              <option value=">100">&gt; 100cm (Cổ thụ &gt; 1m)</option>
            </select>

            {/* ✂️ LỌC THEO NGÀY CHƯA CẮT TỈA */}
            <select
              value={selectedPruning}
              onChange={(e) => setSelectedPruning(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedPruning !== 'ALL'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <option value="ALL">✂️ Tất cả kỳ cắt tỉa</option>
              <option value=">30">Chưa tỉa &gt; 30 ngày (1 tháng)</option>
              <option value=">60">Chưa tỉa &gt; 60 ngày (2 tháng)</option>
              <option value=">90">Chưa tỉa &gt; 90 ngày (1 quý)</option>
              <option value=">180">Chưa tỉa &gt; 180 ngày (6 tháng - Cần tỉa)</option>
              <option value="NEVER">Chưa từng có hồ sơ tỉa cành</option>
              <option value="<=30">Đã tỉa gần đây (≤ 30 ngày)</option>
            </select>

            {/* Lọc loài cây */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Tất cả loài cây</option>
              {treeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Lọc sức khỏe */}
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Tất cả sức khỏe</option>
              <option value="GOOD">Tốt (GOOD)</option>
              <option value="FAIR">Bình thường (FAIR)</option>
              <option value="POOR">Kém (POOR)</option>
              <option value="CRITICAL">Nguy cấp (CRITICAL)</option>
            </select>

            {/* ⚡ LỌC THEO MA TRẬN RỦI RO QUỐC TẾ ISA TRAQ */}
            <select
              value={selectedTraq}
              onChange={(e) => setSelectedTraq(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedTraq !== 'ALL'
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <option value="ALL">🛡️ Rủi ro ISA TRAQ (Tất cả)</option>
              <option value="EXTREME">🛑 EXTREME (Nguy hiểm tột cùng)</option>
              <option value="HIGH">⚠️ HIGH (Rủi ro cao)</option>
              <option value="MODERATE">🟡 MODERATE (Trung bình)</option>
              <option value="LOW">🟢 LOW (An toàn)</option>
            </select>

            {/* 📐 LỌC THEO GÓC NGHIÊNG THÂN CÂY */}
            <select
              value={selectedTilt}
              onChange={(e) => setSelectedTilt(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedTilt !== 'ALL'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <option value="ALL">📐 Góc nghiêng (Tất cả)</option>
              <option value="DANGEROUS">⚠️ Nghiêng &ge; 15° (Nguy cơ bão)</option>
              <option value="WARNING">Nghiêng 8° - 14° (Cần chú ý)</option>
              <option value="SAFE">Thẳng đứng (&lt; 8°)</option>
            </select>

            {/* 🪵 LỌC THEO ĐỘ RỖNG THÂN SIÊU ÂM ARBOTOM */}
            <select
              value={selectedHollow}
              onChange={(e) => setSelectedHollow(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedHollow !== 'ALL'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <option value="ALL">🪵 Rỗng ruột Arbotom (Tất cả)</option>
              <option value="HOLLOW">⚠️ Rỗng ruột &ge; 40% (Mục rỗng)</option>
              <option value="DECAY">Chớm thoái hóa (20% - 39%)</option>
              <option value="SOLID">Thân đặc (&lt; 20%)</option>
            </select>

            {/* Nút Xóa bộ lọc nếu có điều kiện đang active */}
            {(searchInput ||
              selectedProvince !== 'all' ||
              selectedArea !== 'ALL' ||
              selectedCorridorFilter !== 'ALL' ||
              selectedType !== 'ALL' ||
              selectedHealth !== 'ALL' ||
              selectedHeight !== 'ALL' ||
              selectedDiameter !== 'ALL' ||
              selectedPruning !== 'ALL' ||
              selectedTraq !== 'ALL' ||
              selectedTilt !== 'ALL' ||
              selectedHollow !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSelectedProvince('all');
                  setSelectedArea('ALL');
                  setSelectedCorridorFilter('ALL');
                  setSelectedType('ALL');
                  setSelectedHealth('ALL');
                  setSelectedHeight('ALL');
                  setSelectedDiameter('ALL');
                  setSelectedPruning('ALL');
                  setSelectedTraq('ALL');
                  setSelectedTilt('ALL');
                  setSelectedHollow('ALL');
                }}
                className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Xóa toàn bộ bộ lọc về mặc định"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          <span className="text-xs text-emerald-700 dark:text-[#00FF9D] font-mono font-bold whitespace-nowrap pl-2">
            {filteredTrees.length}/{trees.length} cây
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🛣️ VIEW MODE 1: STREET CORRIDOR VIEW (GIAO DIỆN TUYẾN PHỐ / DÃY CÂY)     */}
      {/* ========================================================================= */}
      {filteredTrees.length === 0 ? (
        <div className="p-12 text-center bento-card border-dashed text-slate-400 dark:text-slate-500 text-xs dark:bg-[#0c1812] dark:border-slate-800">
          Không tìm thấy cây xanh nào phù hợp với bộ lọc tìm kiếm.
        </div>
      ) : viewMode === 'corridor' ? (
        <div className="space-y-6">
          {Object.entries(groupedCorridors).map(([corridorName, corridorTrees]) => {
            const firstTree = corridorTrees[0];
            const prefix = getTreeStreetCode(firstTree).split('-')[0] || 'CT';
            const goodCount = corridorTrees.filter((t) => t.healthStatus === 'GOOD').length;
            const criticalCount = corridorTrees.filter(
              (t) => t.healthStatus === 'CRITICAL' || t.healthStatus === 'POOR'
            ).length;

            return (
              <div
                key={corridorName}
                className="bento-card rounded-3xl p-5 sm:p-6 dark:bg-[#0c1812] dark:border-slate-800 space-y-5 shadow-sm"
              >
                {/* Corridor Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-mono font-black text-sm border border-emerald-300 dark:border-emerald-700/60 shadow-xs shrink-0">
                      {prefix}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {corridorName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                          {prefix}-01 ➔ {prefix}-{String(corridorTrees.length).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Quận Ninh Kiều, Cần Thơ · Đoạn tuyến phân định theo số nhà mốc</span>
                      </p>
                    </div>
                  </div>

                  {/* Corridor Telemetry Badges & Action Buttons */}
                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      onClick={() => setWorkOrderCorridor(corridorName)}
                      className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                      title="Xuất Lệnh Điều Động Công Tác Ca Trực Khổ A4 Cho Toàn Dãy Tuyến Này"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Phiếu Lệnh Ca Trực (A4)</span>
                    </button>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      {corridorTrees.length} Cây Trên Dãy
                    </span>
                    {criticalCount > 0 && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold animate-pulse">
                        ⚠️ {criticalCount} Cần Duy Tu
                      </span>
                    )}
                  </div>
                </div>

                {/* Linear Sequential Tree Cards Along the Corridor */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {corridorTrees.slice(0, 24).map((tree, idx) => {
                    const streetCode = getTreeStreetCode(tree);
                    const milestone = getTreeMilestone(tree);
                    const treeType = treeTypes.find((t) => t.id === tree.treeTypeId);
                    const isRadarTarget = radarNearestTree?.tree.id === tree.id;

                    return (
                      <div
                        key={tree.id}
                        id={`tree-card-${tree.id}`}
                        onClick={() => onSelectTree(tree)}
                        className={`relative rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-900/60 border transition-all cursor-pointer group flex flex-col justify-between ${
                          isRadarTarget
                            ? 'ring-4 ring-emerald-500 border-emerald-500 dark:ring-emerald-400 shadow-xl dark:shadow-[0_0_25px_rgba(16,185,129,0.3)] bg-emerald-50/50 dark:bg-emerald-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-md'
                        }`}
                      >
                        {/* Radar Target Pill */}
                        {isRadarTarget && (
                          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 animate-bounce">
                            <Radio className="w-2.5 h-2.5" />
                            <span>CÂY GẦN BẠN NHẤT ({radarNearestTree.distanceM}M)</span>
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Card Top: Sequential Street Tag + Health */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs font-black tracking-wider shadow-2xs border border-slate-700">
                                [{streetCode}]
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                                #{idx + 1}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                tree.healthStatus === 'GOOD'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : tree.healthStatus === 'FAIR'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {tree.healthStatus}
                            </span>
                          </div>

                          {/* Tree Name & Biological Type */}
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-[#00FF9D] transition-colors">
                              {tree.displayName}
                            </div>
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium italic">
                              {treeType?.scientificName || 'Thực vật đô thị'}
                            </div>
                          </div>

                          {/* Milestone House Number Landmark */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>CỘT MỐC SỐ NHÀ THỰC ĐỊA:</span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {milestone}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              GPS: {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
                            </div>
                          </div>

                          {/* Metrics summary */}
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-1">
                            <span>Đk: <strong className="text-slate-800 dark:text-slate-200">{tree.diameterCm || 28}cm</strong></span>
                            <span>•</span>
                            <span>Cao: <strong className="text-slate-800 dark:text-slate-200">{tree.heightM || 7.5}m</strong></span>
                            <span>•</span>
                            <span>Trồng: <strong>{tree.plantedAt ? new Date(tree.plantedAt).getFullYear() : 2021}</strong></span>
                          </div>

                          {/* Pruning Telemetry */}
                          {(() => {
                            const daysSincePruned = treePruningDaysMap.get(tree.id);
                            return (
                              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                  <Scissors className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>Kỳ cắt tỉa cành:</span>
                                </span>
                                <span
                                  className={`font-semibold ${
                                    daysSincePruned === undefined || daysSincePruned > 180
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {daysSincePruned !== undefined
                                    ? `${daysSincePruned} ngày trước`
                                    : 'Chưa có hồ sơ tỉa'}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Lâm sinh thực địa & ISA TRAQ Telemetry */}
                          {(() => {
                            const traq = calculateISATraqRating(tree);
                            return (
                              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                  <span>Nghiêng: <strong className={tree.tiltAngleDeg && tree.tiltAngleDeg >= 15 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>{tree.tiltAngleDeg ?? 0}°</strong></span>
                                  <span>·</span>
                                  <span>Rỗng: <strong className={tree.hollowRatioPercent && tree.hollowRatioPercent >= 40 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>{tree.hollowRatioPercent ?? 0}%</strong></span>
                                </span>
                                <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                  traq.rating === 'EXTREME'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                    : traq.rating === 'HIGH'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                }`}>
                                  ISA: {traq.rating}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Action buttons on card footer */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/70 dark:border-slate-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenQrModal(tree);
                            }}
                            className="text-xs text-[#174B36] dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Biển số nhôm</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCareModal(tree.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ClipboardList className="w-3 h-3" />
                            <span>Chăm sóc</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {corridorTrees.length > 24 && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">
                      ⚡ Đang hiển thị 24 cây tiêu biểu (Tuyến này có tổng cộng <strong>{corridorTrees.length}</strong> cây).
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCorridorFilter(corridorName);
                        setViewMode('grid');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
                    >
                      Xem toàn bộ {corridorTrees.length} cây trên tuyến này →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* 📦 VIEW MODE 2: BENTO GRID VIEW                                           */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedTrees.map((tree) => {
            const treeType = treeTypes.find((t) => t.id === tree.treeTypeId);
            const streetCode = getTreeStreetCode(tree);
            const milestone = getTreeMilestone(tree);
            const corridor = getTreeCorridor(tree);
            const isRadarTarget = radarNearestTree?.tree.id === tree.id;

            return (
              <div
                key={tree.id}
                id={`tree-card-${tree.id}`}
                className={`bento-card overflow-hidden flex flex-col justify-between group cursor-pointer dark:bg-[#0c1812] dark:border-slate-800 transition-all ${
                  isRadarTarget
                    ? 'ring-4 ring-emerald-500 border-emerald-500 shadow-2xl dark:shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                    : 'dark:hover:border-emerald-500/40 dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                }`}
                onClick={() => onSelectTree(tree)}
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="h-44 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                    <img
                      src={
                        tree.imageUrl ||
                        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={tree.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Dual Code Badge: [HB-01] + TREE-001 */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md text-amber-300 font-mono text-xs font-black shadow-md border border-slate-700">
                        [{streetCode}]
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-slate-200 font-mono text-[10px]">
                        {tree.publicCode}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                          tree.healthStatus === 'GOOD'
                            ? 'bg-emerald-500/90 text-white dark:bg-emerald-950/80 dark:text-[#00FF9D] dark:border dark:border-emerald-500/40'
                            : tree.healthStatus === 'FAIR'
                            ? 'bg-slate-700/80 text-white dark:bg-slate-800/80 dark:text-slate-200 dark:border dark:border-slate-700'
                            : tree.healthStatus === 'POOR'
                            ? 'bg-amber-500/90 text-white dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-500/40'
                            : 'bg-rose-600/90 text-white dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-500/40'
                        }`}
                      >
                        {tree.healthStatus}
                      </span>
                    </div>

                    {isRadarTarget && (
                      <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold font-mono rounded-lg flex items-center justify-between">
                        <span>🎯 CÂY GẦN BẠN NHẤT</span>
                        <span>CÁCH {radarNearestTree.distanceM}M</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-[#00FF9D] transition-colors">
                        {tree.displayName}
                      </h3>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium italic mt-0.5">
                        {treeType?.scientificName || 'Thực vật đô thị'}
                      </div>

                      {/* Prominent Milestone */}
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{milestone}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                          {corridor}
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800/80" />

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Đường kính</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {tree.diameterCm || 28} cm
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Chiều cao</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {tree.heightM || 7.5} m
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Kỳ cắt tỉa</span>
                        {(() => {
                          const days = treePruningDaysMap.get(tree.id);
                          return (
                            <span
                              className={`font-bold font-mono text-[11px] block truncate ${
                                days === undefined || days > 180
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {days !== undefined ? `${days} ngày` : 'Chưa tỉa'}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 pb-5 pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQrModal(tree);
                    }}
                    className="text-xs text-[#174B36] hover:text-[#347A50] dark:text-[#00FF9D] dark:hover:text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Biển số nhôm</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCareModal(tree.id);
                      }}
                      title="Ghi nhật ký chăm sóc"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditTree(tree);
                      }}
                      title="Sửa thông tin cây"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* 📊 VIEW MODE 3: HIGH-DENSITY TABLE VIEW                                    */
        /* ========================================================================= */
        <div className="bg-white dark:bg-[#0c1812] rounded-2xl border border-[#E0EBDD] dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#08120c] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã Tuyến &amp; QR</th>
                  <th className="py-3 px-4">Tên &amp; Loài Cây</th>
                  <th className="py-3 px-4">Cột Mốc Số Nhà (Tuyến Phố)</th>
                  <th className="py-3 px-4">Sức Khỏe</th>
                  <th className="py-3 px-4">Kích Thước</th>
                  <th className="py-3 px-4">On-Chain</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedTrees.map((tree) => {
                  const treeType = treeTypes.find((t) => t.id === tree.treeTypeId);
                  const streetCode = getTreeStreetCode(tree);
                  const milestone = getTreeMilestone(tree);
                  const corridor = getTreeCorridor(tree);
                  const isRadarTarget = radarNearestTree?.tree.id === tree.id;

                  return (
                    <tr
                      key={tree.id}
                      id={`tree-card-${tree.id}`}
                      className={`transition-colors ${
                        isRadarTarget
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/50 font-semibold'
                          : 'hover:bg-[#F8FAF8] dark:hover:bg-[#102017]/70'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-amber-300 font-mono text-[11px] font-black">
                            [{streetCode}]
                          </span>
                          <button
                            onClick={() => onOpenQrModal(tree)}
                            className="font-mono text-slate-500 hover:text-emerald-700 dark:text-slate-400 text-[10px]"
                          >
                            {tree.publicCode}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{tree.displayName}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{treeType?.name}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{milestone}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{corridor}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            tree.healthStatus === 'GOOD'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-[#00FF9D]'
                              : tree.healthStatus === 'FAIR'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : tree.healthStatus === 'POOR'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}
                        >
                          {tree.healthStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div>Đk: {tree.diameterCm || 28}cm · Cao: {tree.heightM || 7.5}m</div>
                        {(() => {
                          const days = treePruningDaysMap.get(tree.id);
                          return (
                            <div className={`text-[10px] flex items-center gap-1 ${days === undefined || days > 180 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400'}`}>
                              <Scissors className="w-2.5 h-2.5" />
                              <span>{days !== undefined ? `Tỉa: ${days} ngày trước` : 'Chưa có hồ sơ tỉa'}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-[#00FF9D] font-semibold font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-[#00FF9D]" />
                          <span>CONFIRMED</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => onSelectTree(tree)}
                          className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded text-[11px] font-medium cursor-pointer"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() => onOpenCareModal(tree.id)}
                          className="px-2.5 py-1 bg-[#174B36] text-white hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded text-[11px] font-medium cursor-pointer"
                        >
                          Chăm sóc
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📄 BỘ ĐIỀU KHIỂN PHÂN TRANG HIỆU NĂNG CAO (SMART PAGINATION CONTROLS) */}
      {viewMode !== 'corridor' && totalPages > 1 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bento-card dark:bg-[#0c1812] dark:border-slate-800 text-xs shadow-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Đang xem cây thứ <span className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> – <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredTrees.length)}</span> trên tổng số <span className="font-bold text-emerald-600 dark:text-[#00FF9D]">{filteredTrees.length.toLocaleString('vi-VN')}</span> cây
          </div>

          <div className="flex items-center gap-2 self-center lg:self-auto flex-wrap">
            {/* Nút Đầu trang */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              title="Về trang đầu tiên"
            >
              ⇤ Đầu
            </button>

            {/* Nút Trang trước */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
            >
              ← Trước
            </button>

            <span className="px-3.5 py-1.5 font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl">
              Trang {currentPage} / {totalPages}
            </span>

            {/* Nút Trang sau */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
            >
              Sau →
            </button>

            {/* Nút Cuối trang */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              title="Đến trang cuối cùng"
            >
              Cuối ⇥
            </button>

            {/* 🎯 Form Nhảy nhanh đến trang bất kỳ */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const p = parseInt(jumpPageInput, 10);
                if (!isNaN(p) && p >= 1 && p <= totalPages) {
                  setCurrentPage(p);
                  setJumpPageInput('');
                }
              }}
              className="flex items-center gap-1 ml-1"
            >
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder="Số trang..."
                className="w-16 px-2 py-1.5 text-xs text-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-2xs"
              >
                Đến
              </button>
            </form>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="ml-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value={30}>30 cây / trang</option>
              <option value={60}>60 cây / trang</option>
              <option value={100}>100 cây / trang</option>
            </select>
          </div>
        </div>
      )}

      {/* Modal Lệnh Công Tác Ca Trực Khổ A4 Tuyến Đường Liên Hoàn */}
      {workOrderCorridor && (
        <CorridorWorkOrderModal
          corridorName={workOrderCorridor}
          trees={groupedCorridors[workOrderCorridor] || []}
          currentUser={currentUser}
          onClose={() => setWorkOrderCorridor(null)}
        />
      )}
    </div>
  );
};
