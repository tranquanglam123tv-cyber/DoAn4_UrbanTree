import React, { useState, useMemo, useEffect } from 'react';
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
  Activity,
  Layers,
  Sliders,
  BarChart3,
  TrendingUp,
  Droplets,
  Scissors,
  Sprout,
  Users,
  FileText,
  Printer,
  X,
  ChevronDown,
} from 'lucide-react';
import { storage } from '../db/storage';
import { blockchainService } from '../services/blockchainService';
import { hasPermission, assertPermission } from '../utils/permissionUtils';
import { useEscapeOverlay } from '../hooks/useEscapeOverlay';
import { Tree } from '../types';
import {
  calculateAllometricCarbon,
  getTreeClassification,
  calculateIncidentSLA,
} from '../utils/treeUtils';

interface DashboardViewProps {
  onNavigate: (tab: string, filterParams?: any) => void;
  onOpenAddTree: () => void;
  onOpenCareModal: (treeId?: string) => void;
  onSelectTree: (tree: Tree) => void;
  onOpenStaffManagement?: () => void;
}

interface WeeklyCareItem {
  day: string;
  label: string;
  dateStr: string;
  count: number;
  watering: number;
  pruning: number;
  fertilizing: number;
  treatment: number;
  mainStreet: string;
}

const HEALTH_LABEL: Record<string, string> = {
  GOOD: 'Khỏe mạnh',
  FAIR: 'Bình thường',
  POOR: 'Kém',
  CRITICAL: 'Nguy cấp',
};

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: 'Khẩn cấp',
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
};

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Mới tiếp nhận',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xong',
  REJECTED: 'Đã hủy',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddTree,
  onOpenCareModal,
  onSelectTree,
  onOpenStaffManagement,
}) => {
  const currentUser = storage.getActiveUser();
  const [dataVersion, setDataVersion] = useState(0);

  // Trạng thái đóng/mở các mục phụ (Mặc định thu gọn cho thoáng mắt)
  const [showEcoSection, setShowEcoSection] = useState(false);
  const [showChartSection, setShowChartSection] = useState(false);
  const [showDetailsSection, setShowDetailsSection] = useState(false);

  useEffect(() => {
    const handleSync = () => setDataVersion((v) => v + 1);
    window.addEventListener('urbantree:care-records-synced', handleSync);
    window.addEventListener('urbantree:work-orders-synced', handleSync);
    window.addEventListener('urbantree:incidents-synced', handleSync);
    window.addEventListener('urbantree:campaign-updated', handleSync);
    return () => {
      window.removeEventListener('urbantree:care-records-synced', handleSync);
      window.removeEventListener('urbantree:work-orders-synced', handleSync);
      window.removeEventListener('urbantree:incidents-synced', handleSync);
      window.removeEventListener('urbantree:campaign-updated', handleSync);
    };
  }, []);

  const trees = storage.getTrees();
  const incidents = storage.getIncidents();
  const careRecords = storage.getCareRecords();
  const stats = useMemo(() => storage.getDashboardStats(), [trees, incidents, careRecords, dataVersion]);
  const anchors = useMemo(() => blockchainService.getAllAnchors().slice(0, 5), []);

  const [activeChartTab, setActiveChartTab] = useState<'timeline' | 'category'>('timeline');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const [showOfficialReportModal, setShowOfficialReportModal] = useState<boolean>(false);
  const [telemetryData, setTelemetryData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/dashboard/maintenance-telemetry')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setTelemetryData(json.data);
        }
      })
      .catch((err) => console.warn('Telemetry fetch error:', err));
  }, [dataVersion, careRecords.length]);

  useEscapeOverlay('dashboard-official-report-modal', showOfficialReportModal, () => {
    setShowOfficialReportModal(false);
  });

  const healthyPercent = stats.totalTrees > 0 ? Math.round((stats.healthyTrees / stats.totalTrees) * 100) : 0;

  const incidentSlaStats = useMemo(() => {
    let onTimeCount = 0;
    let overdueCount = 0;
    let criticalCount = 0;

    incidents.forEach((inc) => {
      if (inc.severity === 'CRITICAL' && inc.status !== 'RESOLVED' && inc.status !== 'REJECTED') {
        criticalCount++;
      }
      const sla = calculateIncidentSLA(inc);
      if (inc.status === 'RESOLVED') {
        if (sla.isOverdue) overdueCount++;
        else onTimeCount++;
      } else if (sla.isOverdue) {
        overdueCount++;
      }
    });

    const total = onTimeCount + overdueCount;
    const rate = total > 0 ? Math.round((onTimeCount / total) * 100) : 100;
    return { onTimeCount, overdueCount, criticalCount, complianceRate: rate };
  }, [incidents]);

  const ecoAllometricStats = useMemo(() => {
    let totalBiomass = 0;
    let totalCo2Year = 0;
    let totalO2Year = 0;
    let type1Count = 0;
    let type2Count = 0;
    let heritageCount = 0;

    trees.forEach((t) => {
      const calc = calculateAllometricCarbon(t);
      totalBiomass += calc.biomassKg;
      totalCo2Year += calc.co2SequestrationKgYear;
      totalO2Year += calc.oxygenProductionKgYear;

      const cls = getTreeClassification(t);
      if (cls.key === 'HERITAGE') heritageCount++;
      else if (cls.key === 'TYPE_2') type2Count++;
      else type1Count++;
    });

    return {
      totalBiomassTon: (totalBiomass / 1000).toFixed(2),
      totalCo2TonYear: (totalCo2Year / 1000).toFixed(2),
      totalO2TonYear: (totalO2Year / 1000).toFixed(2),
      type1Count,
      type2Count,
      heritageCount,
    };
  }, [trees]);

  const weeklyCareData = useMemo<WeeklyCareItem[]>(() => {
    if (telemetryData?.timeline && Array.isArray(telemetryData.timeline)) {
      return telemetryData.timeline.map((d: any) => ({
        day: d.day,
        label: d.label,
        dateStr: d.dateStr,
        count: d.count,
        watering: d.watering,
        pruning: d.pruning,
        fertilizing: d.fertilizing,
        treatment: d.treatment,
        mainStreet: d.mainStreet,
      }));
    }

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const fullDayLabels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const now = new Date();
    const daysArr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const dayIdx = d.getDay();
      daysArr.push({
        iso,
        day: dayNames[dayIdx],
        label: fullDayLabels[dayIdx],
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
      });
    }

    return daysArr.map((d) => {
      const recordsOnDay = careRecords.filter((c) => ((c as any).actionDate || c.createdAt || '').startsWith(d.iso));
      const watering = recordsOnDay.filter((c) => c.actionType === 'WATERING' || (c.actionType as any) === 'Tưới nước').length;
      const pruning = recordsOnDay.filter((c) => c.actionType === 'PRUNING' || (c.actionType as any) === 'Cắt tỉa').length;
      const fertilizing = recordsOnDay.filter((c) => c.actionType === 'FERTILIZING' || (c.actionType as any) === 'Bón phân').length;
      const treatment = recordsOnDay.filter((c) => c.actionType === 'PEST_CONTROL' || (c.actionType as any) === 'Trị sâu bệnh').length;
      return {
        day: d.day,
        label: d.label,
        dateStr: d.dateStr,
        count: recordsOnDay.length,
        watering,
        pruning,
        fertilizing,
        treatment,
        mainStreet: 'Quận Ninh Kiều, TP. Cần Thơ',
      };
    });
  }, [telemetryData, careRecords]);

  const totalWeeklyCare = useMemo(() => weeklyCareData.reduce((acc, d) => acc + d.count, 0), [weeklyCareData]);
  const maxWeeklyCount = useMemo(() => Math.max(...weeklyCareData.map((d) => d.count), 10), [weeklyCareData]);
  const peakDay = useMemo(
    () => weeklyCareData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), weeklyCareData[0]),
    [weeklyCareData]
  );

  const actionPercentages = useMemo(() => {
    if (telemetryData?.actionDistribution) {
      return {
        watering: telemetryData.actionDistribution.watering.percent,
        pruning: telemetryData.actionDistribution.pruning.percent,
        fertilizing: telemetryData.actionDistribution.fertilizing.percent,
        treatment: telemetryData.actionDistribution.treatment.percent,
      };
    }
    const total = Math.max(1, totalWeeklyCare);
    const sumWatering = weeklyCareData.reduce((acc, d) => acc + d.watering, 0);
    const sumPruning = weeklyCareData.reduce((acc, d) => acc + d.pruning, 0);
    const sumFert = weeklyCareData.reduce((acc, d) => acc + d.fertilizing, 0);
    const sumTreat = weeklyCareData.reduce((acc, d) => acc + d.treatment, 0);
    return {
      watering: Number(((sumWatering / total) * 100).toFixed(1)),
      pruning: Number(((sumPruning / total) * 100).toFixed(1)),
      fertilizing: Number(((sumFert / total) * 100).toFixed(1)),
      treatment: Number(((sumTreat / total) * 100).toFixed(1)),
    };
  }, [telemetryData, weeklyCareData, totalWeeklyCare]);

  const categoryCareData = useMemo(() => {
    const counts: Record<string, number> = {
      WATERING: 0,
      PRUNING: 0,
      FERTILIZING: 0,
      PEST_CONTROL: 0,
      SURVEY: 0,
      SUPPORT_STAKE: 0,
    };
    careRecords.forEach((c) => {
      counts[c.actionType] = (counts[c.actionType] || 0) + 1;
    });

    const labels: Record<string, { name: string; icon: any }> = {
      WATERING: { name: 'Tưới nước', icon: Droplets },
      PRUNING: { name: 'Cắt tỉa cành', icon: Scissors },
      FERTILIZING: { name: 'Bón phân', icon: Sprout },
      PEST_CONTROL: { name: 'Trị sâu bệnh', icon: AlertTriangle },
      SURVEY: { name: 'Kiểm tra gốc rễ', icon: Activity },
      SUPPORT_STAKE: { name: 'Gia cố cọc chống', icon: ShieldCheck },
    };

    return Object.entries(counts).map(([type, count]) => ({
      type,
      name: labels[type]?.name || type,
      icon: labels[type]?.icon || ClipboardList,
      count,
    }));
  }, [careRecords]);

  return (
    <div className="space-y-6 pb-14">
      {/* 1. HEADER TỐI GIẢN */}
      <div className="bento-card p-5 dark:bg-[#0c1812] dark:border-emerald-500/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <span>Tổng Quan Quản Lý Cây Xanh</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi nhanh tình trạng cây xanh, sự cố hiện trường và công việc chăm sóc tại TP. Cần Thơ.
          </p>
        </div>

        {/* Cụm nút thao tác nhanh */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (assertPermission(currentUser, 'EXPORT_REPORT', 'Xuất báo cáo A4')) {
                setShowOfficialReportModal(true);
              }
            }}
            className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo</span>
          </button>

          {onOpenStaffManagement && hasPermission(currentUser, 'STAFF_MANAGE') && (
            <button
              onClick={onOpenStaffManagement}
              className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhân Sự</span>
            </button>
          )}

          <button
            onClick={() => {
              if (assertPermission(currentUser, 'CARE_WRITE', 'Ghi nhật ký chăm sóc')) {
                onOpenCareModal();
              }
            }}
            className="h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Ghi Chăm Sóc</span>
          </button>

          <button
            onClick={onOpenAddTree}
            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Cây Mới</span>
          </button>
        </div>
      </div>

      {/* 2. 5 THẺ CHỈ SỐ CHÍNH (LUÔN HIỂN THỊ) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Tổng cây */}
        <button
          onClick={() => onNavigate('trees', { health: 'ALL' })}
          className="text-left bento-card p-4 dark:bg-[#0c1812] dark:border-emerald-500/20 hover:border-emerald-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng số cây</span>
            <Trees className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.totalTrees}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Đã gắn mã QR</div>
        </button>

        {/* Tỷ lệ khỏe mạnh */}
        <button
          onClick={() => onNavigate('trees', { health: 'HEALTHY' })}
          className="text-left bento-card p-4 dark:bg-[#0c1812] dark:border-emerald-500/20 hover:border-emerald-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cây khỏe mạnh</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{healthyPercent}%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{stats.healthyTrees} cây phát triển tốt</div>
        </button>

        {/* Cần chăm sóc */}
        <button
          onClick={() => onNavigate('trees', { health: 'AT_RISK' })}
          className="text-left bento-card p-4 dark:bg-[#0c1812] dark:border-amber-500/20 hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cần bảo dưỡng</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.atRiskTrees}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cần cắt tỉa, gia cố</div>
        </button>

        {/* Sự cố đang xử lý */}
        <button
          onClick={() => onNavigate('incidents', { status: 'ACTIVE' })}
          className="text-left bento-card p-4 dark:bg-[#0c1812] dark:border-rose-500/20 hover:border-rose-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sự cố đang xử lý</span>
            <ClipboardList className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">{stats.activeIncidents}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tin báo từ người dân</div>
        </button>

        {/* Dữ liệu xác thực */}
        <button
          onClick={() => onNavigate('blockchain')}
          className="text-left bento-card p-4 col-span-2 lg:col-span-1 dark:bg-[#0c1812] dark:border-indigo-500/20 hover:border-indigo-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dữ liệu xác thực</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{stats.totalAnchors}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Bản ghi minh bạch</div>
        </button>
      </div>

      {/* 3. TÌNH TRẠNG SỨC KHỎE & SỰ CỐ CẦN XỬ LÝ (LUÔN HIỂN THỊ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sức khỏe cây */}
        <div className="bento-card p-5 flex flex-col justify-between dark:bg-[#0c1812] dark:border-emerald-500/20">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tình Trạng Cây Xanh</h2>
              <button
                onClick={() => onNavigate('map')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Bản đồ</span>
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Khỏe mạnh', count: stats.healthBreakdown.GOOD, color: 'bg-emerald-500' },
                { label: 'Bình thường', count: stats.healthBreakdown.FAIR, color: 'bg-slate-400' },
                { label: 'Kém (Sâu bệnh, cành khô)', count: stats.healthBreakdown.POOR, color: 'bg-amber-500' },
                { label: 'Nguy cấp (Nghiêng, mục rễ)', count: stats.healthBreakdown.CRITICAL, color: 'bg-rose-500' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{row.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${row.color} h-1.5 rounded-full transition-all duration-300`}
                      style={{ width: `${(row.count / (stats.totalTrees || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sự cố hiện trường */}
        <div className="lg:col-span-2 bento-card p-5 dark:bg-[#0c1812] dark:border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sự Cố & Phản Ánh Mới Nhất</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tin báo trực tiếp từ người dân</p>
            </div>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>

            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {incidents.slice(0, 3).map((incident) => {
              const tree = incident.treeId ? trees.find((t) => t.id === incident.treeId) : null;
              return (
                <div key={incident.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded dark:text-emerald-300 dark:bg-emerald-950/70">
                        {incident.publicCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${incident.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                          : incident.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          }`}
                      >
                        Mức độ: {SEVERITY_LABEL[incident.severity] || incident.severity}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        · {STATUS_LABEL[incident.status] || incident.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">{incident.description}</p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="truncate">{incident.address || 'TP. Cần Thơ'}</span>
                      {tree && <span className="text-emerald-600 dark:text-emerald-400 shrink-0">· Mã cây: {tree.publicCode}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('incidents')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors shrink-0 cursor-pointer dark:text-emerald-300 dark:hover:bg-emerald-950/60 dark:border-emerald-500/30"
                  >
                    Xử lý
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MỤC THU GỌN 1: PHÂN LOẠI CÂY & LỢI ÍCH MÔI TRƯỜNG */}
      <div className="bento-card dark:bg-[#0c1812] dark:border-emerald-500/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEcoSection(!showEcoSection)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Phân Loại Cây & Lợi Ích Môi Trường</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cây cổ thụ: {ecoAllometricStats.heritageCount} · Hấp thụ {ecoAllometricStats.totalCo2TonYear} tấn CO₂/năm · Tạo {ecoAllometricStats.totalO2TonYear} tấn Oxy/năm
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${showEcoSection ? 'rotate-180' : ''}`}
          />
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${showEcoSection ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-4">
              {/* Phân loại cây */}
              <div className="space-y-3 md:pr-6 lg:pr-8 md:border-r md:border-slate-200/90 dark:md:border-slate-800/90">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-purple-500 rounded-full shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Phân loại theo kích thước
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="h-full min-h-[96px] p-2.5 sm:p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 flex flex-col items-center justify-between text-center transition-all hover:shadow-xs">
                    <div className="text-lg sm:text-xl font-bold text-purple-700 dark:text-purple-300 leading-tight">
                      {ecoAllometricStats.heritageCount}
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-purple-900 dark:text-purple-200 mt-1 leading-tight">
                      Cây cổ thụ
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Bảo vệ nghiêm ngặt
                    </div>
                  </div>
                  <div className="h-full min-h-[96px] p-2.5 sm:p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 flex flex-col items-center justify-between text-center transition-all hover:shadow-xs">
                    <div className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                      {ecoAllometricStats.type2Count}
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-emerald-900 dark:text-emerald-200 mt-1 leading-tight">
                      Trưởng thành
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Cắt tỉa định kỳ
                    </div>
                  </div>
                  <div className="h-full min-h-[96px] p-2.5 sm:p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 flex flex-col items-center justify-between text-center transition-all hover:shadow-xs">
                    <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300 leading-tight">
                      {ecoAllometricStats.type1Count}
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-blue-900 dark:text-blue-200 mt-1 leading-tight">
                      Mới trồng
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Chống cọc & tưới
                    </div>
                  </div>
                </div>
              </div>

              {/* Lợi ích môi trường */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 md:border-t-0 md:pt-0 md:pl-2 lg:pl-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ước tính giá trị sinh thái hàng năm
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="h-full min-h-[96px] p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex flex-col items-center justify-between text-center transition-all hover:shadow-xs">
                    <div className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
                      {ecoAllometricStats.totalBiomassTon} <span className="text-xs font-medium">tấn</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-tight">
                      Tổng sinh khối
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Khối lượng gỗ ước tính
                    </div>
                  </div>
                  <div className="h-full min-h-[96px] p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex flex-col items-center justify-between text-center transition-all hover:shadow-xs">
                    <div className="text-lg sm:text-xl font-bold text-teal-700 dark:text-teal-400 leading-tight">
                      {ecoAllometricStats.totalCo2TonYear} <span className="text-xs font-medium">tấn</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-tight">
                      CO₂ hấp thụ
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Mỗi năm / cây xanh
                    </div>
                  </div>
                  <div className="h-full min-h-[96px] p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex flex-col items-center justify-between text-center transition-all hover:shadow-xs">
                    <div className="text-lg sm:text-xl font-bold text-cyan-700 dark:text-cyan-400 leading-tight">
                      {ecoAllometricStats.totalO2TonYear} <span className="text-xs font-medium">tấn</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-tight">
                      Oxy tạo ra
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Thanh lọc khí quyển
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MỤC THU GỌN 2: BIỂU ĐỒ CHĂM SÓC 7 NGÀY */}
      <div className="bento-card dark:bg-[#0c1812] dark:border-emerald-500/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowChartSection(!showChartSection)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Biểu Đồ Chăm Sóc 7 Ngày Qua</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tổng {totalWeeklyCare} lượt chăm sóc · Cao điểm: {peakDay?.label} ({peakDay?.count} lượt)
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${showChartSection ? 'rotate-180' : ''}`}
          />
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${showChartSection ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
              {/* Thanh chuyển tab & link sổ chăm sóc */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setActiveChartTab('timeline')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${activeChartTab === 'timeline'
                      ? 'bg-white text-emerald-700 dark:bg-emerald-500 dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Theo ngày</span>
                  </button>
                  <button
                    onClick={() => setActiveChartTab('category')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${activeChartTab === 'category'
                      ? 'bg-white text-emerald-700 dark:bg-emerald-500 dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Theo công việc</span>
                  </button>
                </div>

                <button
                  onClick={() => onNavigate('care')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem sổ chăm sóc</span>
                </button>
              </div>

              {activeChartTab === 'timeline' ? (
                <div className="space-y-4">
                  {/* Bộ lọc đơn giản */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    {[
                      { key: null, label: 'Tất cả', dot: '' },
                      { key: 'watering', label: `Tưới nước (${actionPercentages.watering}%)`, dot: 'bg-cyan-400' },
                      { key: 'pruning', label: `Cắt tỉa (${actionPercentages.pruning}%)`, dot: 'bg-emerald-500' },
                      { key: 'fertilizing', label: `Bón phân (${actionPercentages.fertilizing}%)`, dot: 'bg-lime-500' },
                      { key: 'treatment', label: `Trị sâu bệnh (${actionPercentages.treatment}%)`, dot: 'bg-amber-500' },
                    ].map((f) => (
                      <button
                        key={String(f.key)}
                        onClick={() => setHighlightedCategory(highlightedCategory === f.key ? null : f.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border flex items-center gap-1.5 ${highlightedCategory === f.key
                          ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-slate-950'
                          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700'
                          }`}
                      >
                        {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Cột biểu đồ */}
                  <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-4">
                    {weeklyCareData.map((item, index) => {
                      const totalHeightPercent = Math.min(100, Math.max(12, Math.round((item.count / maxWeeklyCount) * 100)));
                      const isHovered = hoveredBar === index;
                      const safeCount = Math.max(1, item.count);
                      const waterH = (item.watering / safeCount) * 100;
                      const pruneH = (item.pruning / safeCount) * 100;
                      const fertH = (item.fertilizing / safeCount) * 100;
                      const treatH = (item.treatment / safeCount) * 100;

                      return (
                        <div
                          key={item.day}
                          className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer relative"
                          onMouseEnter={() => setHoveredBar(index)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          {isHovered && (
                            <div className="absolute -top-24 z-20 w-44 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] shadow-lg pointer-events-none">
                              <div className="font-bold text-emerald-400 mb-1">
                                {item.label} ({item.dateStr}): {item.count} lượt
                              </div>
                              <div className="space-y-0.5 text-[10px] text-slate-300">
                                <div>Tưới nước: {item.watering}</div>
                                <div>Cắt tỉa: {item.pruning}</div>
                                <div>Bón phân: {item.fertilizing}</div>
                                <div>Trị sâu bệnh: {item.treatment}</div>
                              </div>
                            </div>
                          )}

                          <div className="w-full max-w-[40px] h-36 bg-slate-100 dark:bg-slate-800/60 rounded-lg overflow-hidden flex items-end p-0.5">
                            <div className="w-full rounded-md overflow-hidden flex flex-col justify-end" style={{ height: `${totalHeightPercent}%` }}>
                              <div style={{ height: `${treatH}%` }} className={`w-full bg-amber-500 ${highlightedCategory && highlightedCategory !== 'treatment' ? 'opacity-25' : ''}`} />
                              <div style={{ height: `${fertH}%` }} className={`w-full bg-lime-500 ${highlightedCategory && highlightedCategory !== 'fertilizing' ? 'opacity-25' : ''}`} />
                              <div style={{ height: `${pruneH}%` }} className={`w-full bg-emerald-500 ${highlightedCategory && highlightedCategory !== 'pruning' ? 'opacity-25' : ''}`} />
                              <div style={{ height: `${waterH}%` }} className={`w-full bg-cyan-500 ${highlightedCategory && highlightedCategory !== 'watering' ? 'opacity-25' : ''}`} />
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.day}</div>
                            <div className="text-[10px] text-slate-400">{item.count} lượt</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryCareData.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.type} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CatIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{cat.count} lượt</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. MỤC THU GỌN 3: CÂY TIÊU BIỂU & LỊCH SỬ XÁC THỰC DỮ LIỆU */}
      <div className="bento-card dark:bg-[#0c1812] dark:border-emerald-500/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDetailsSection(!showDetailsSection)}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Cây Xanh Tiêu Biểu & Lịch Sử Xác Thực</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xem nhanh danh sách cây gần đây và nhật ký lưu trữ chống sửa đổi
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${showDetailsSection ? 'rotate-180' : ''}`}
          />
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${showDetailsSection ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
              {/* BẢNG 1: CÂY TIÊU BIỂU (BENTO PANEL RIÊNG BIỆT) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Trees className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Cây xanh tiêu biểu
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Hồ sơ cá thể cây gần đây</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('trees')}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Xem tất cả</span>

                  </button>
                </div>
                <div className="space-y-2">
                  {trees.slice(0, 4).map((tree) => (
                    <div
                      key={tree.id}
                      onClick={() => onSelectTree(tree)}
                      className="p-3 rounded-xl bg-white dark:bg-[#0c1812] border border-slate-200/80 hover:border-emerald-400 dark:border-slate-800/90 dark:hover:border-emerald-500/50 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <QrCode className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            <span className="font-mono text-emerald-700 dark:text-emerald-400 mr-1.5">{tree.publicCode}</span>
                            {tree.displayName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{tree.address}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                        {HEALTH_LABEL[tree.healthStatus] || tree.healthStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BẢNG 2: LỊCH SỬ XÁC THỰC DỮ LIỆU ON-CHAIN (BENTO PANEL RIÊNG BIỆT) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Lịch sử xác thực dữ liệu
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Nhật ký On-Chain SHA-256</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('blockchain')}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Xem sổ cái</span>

                  </button>
                </div>
                <div className="space-y-2">
                  {anchors.map((anchor) => (
                    <div
                      key={anchor.txHash}
                      className="p-3 rounded-xl bg-white dark:bg-[#0c1812] border border-slate-200/80 dark:border-slate-800/90 shadow-2xs text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{anchor.recordType}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Đã xác thực</span>
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800/80">
                        <span className="text-slate-400 select-none mr-1">Mã xác thực:</span>
                        {anchor.payloadHash}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XUẤT BÁO CÁO A4 (GIỮ NGUYÊN CHỨC NĂNG IN) */}
      {showOfficialReportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto no-print"
          data-lenis-prevent
        >
          <div className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl flex flex-col border border-slate-200 dark:border-emerald-500/30 overflow-hidden my-auto">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 shrink-0">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Bản In Báo Cáo Sở Xây Dựng TP. Cần Thơ</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Khổ chuẩn A4</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / Lưu PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfficialReportModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 text-xs print-document" data-lenis-prevent>
              <div className="flex flex-col sm:flex-row justify-between border-b border-slate-300 dark:border-slate-700 pb-3 gap-2">
                <div>
                  <div className="text-[10px] uppercase text-slate-500">ỦY BAN NHÂN DÂN TP. CẦN THƠ</div>
                  <div className="font-bold uppercase">SỞ XÂY DỰNG TP. CẦN THƠ</div>
                </div>
                <div className="sm:text-right">
                  <div className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="underline text-[11px]">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[10px] italic text-slate-500 mt-0.5">
                    Cần Thơ, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              <h1 className="text-center font-bold text-sm uppercase pt-1">
                BÁO CÁO TỔNG HỢP QUẢN LÝ CÂY XANH ĐÔ THỊ & SỰ CỐ HIỆN TRƯỜNG
              </h1>

              <div className="space-y-1.5">
                <h2 className="font-bold uppercase text-emerald-700 dark:text-emerald-400">I. Phân loại cây xanh (Tổng: {stats.totalTrees} cây)</h2>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded border border-slate-200 dark:border-slate-700">Mới trồng: <strong>{ecoAllometricStats.type1Count}</strong></div>
                  <div className="p-2 rounded border border-slate-200 dark:border-slate-700">Trưởng thành: <strong>{ecoAllometricStats.type2Count}</strong></div>
                  <div className="p-2 rounded border border-slate-200 dark:border-slate-700">Cổ thụ: <strong>{ecoAllometricStats.heritageCount}</strong></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-bold uppercase text-emerald-700 dark:text-emerald-400">II. Xử lý sự cố</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded border border-slate-200 dark:border-slate-700">Tổng sự cố: <strong>{incidents.length}</strong></div>
                  <div className="p-2 rounded border border-slate-200 dark:border-slate-700">Khẩn cấp: <strong>{incidentSlaStats.criticalCount}</strong></div>
                  <div className="p-2 rounded border border-slate-200 dark:border-slate-700">Đúng hạn: <strong>{incidentSlaStats.complianceRate}%</strong></div>
                  <div className="p-2 rounded border border-slate-200 dark:border-slate-700">Đã xong: <strong>{incidents.filter((i) => i.status === 'RESOLVED').length}</strong></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-bold uppercase text-emerald-700 dark:text-emerald-400">III. Giá trị môi trường ước tính</h2>
                <div className="p-3 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-2">
                  <span>Khối lượng gỗ: <strong>{ecoAllometricStats.totalBiomassTon} tấn</strong></span>
                  <span>CO₂ hấp thụ: <strong>{ecoAllometricStats.totalCo2TonYear} tấn/năm</strong></span>
                  <span>Oxy tạo ra: <strong>{ecoAllometricStats.totalO2TonYear} tấn/năm</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};