import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Truck,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Printer,
  FileSpreadsheet,
  Users,
  Navigation,
  Radio,
  RefreshCw,
  PhoneCall,
  Flame,
  Check,
  AlertOctagon,
  Timer,
  Zap,
} from 'lucide-react';
import { storage } from '../db/storage';
import { isStormSeasonPruningNeeded, getTreeCorridor, buildLatestPruningMap } from '../utils/treeUtils';
import {
  playEmergencySirenSound,
  playDispatchConfirmChirp,
  sendWebPushNotification,
  isSirenSoundEnabled,
  setSirenSoundEnabled,
} from '../utils/soundAndAlertUtils';
import { Tree } from '../types';

interface StormPruningActionModalProps {
  onClose: () => void;
  onPruned: () => void;
  onSelectTree?: (tree: Tree) => void;
}

export type FleetVehicleStatus =
  | 'STANDBY'    // Tổ đang trực tại bãi / Chưa điều xe
  | 'EN_ROUTE'   // Đang xuất phát / Di chuyển ra hiện trường
  | 'ON_SITE'    // Đã tiếp cận hiện trường & Đang thi công cắt tỉa
  | 'DELAYED'    // Cảnh báo trễ hạn SLA
  | 'COMPLETED'; // Đã hoàn tất hạ tán toàn tuyến

export interface CorridorDispatchRecord {
  corridorName: string;
  assignedTeam: string;
  assignedVehicle: string;
  vehiclePlate: string;
  leaderName: string;
  leaderPhone: string;
  status: FleetVehicleStatus;
  dispatchedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  slaTargetMinutes: number; // e.g. 30 phút xuất kích
  completedTreeCount: number;
  totalTreeCount: number;
  highUrgencyCount: number;
  delayReason?: string;
  treeIds: string[];
}

export interface MunicipalTeamProfile {
  id: string;
  name: string;
  leaderName: string;
  phone: string;
  vehicleName: string;
  vehiclePlate: string;
  capacityType: string;
  baseStation: string;
  defaultCorridors: string[];
}

const MUNICIPAL_TEAMS: MunicipalTeamProfile[] = [
  {
    id: 'team-1',
    name: 'Tổ Kỹ Thuật Số 1 (Ninh Kiều)',
    leaderName: 'KTV. Trần Minh Bình',
    phone: '0912 345 601',
    vehicleName: 'Xe thang tự hành 18m & Cưa Stihl',
    vehiclePlate: '65A-0892',
    capacityType: 'Xe Thang Cao & Cưa Xích',
    baseStation: 'Trạm Cơ Giới Lê Hồng Phong',
    defaultCorridors: ['Đại Lộ Hòa Bình', 'Đường 30 Tháng 4', 'Đường Hai Bà Trưng'],
  },
  {
    id: 'team-2',
    name: 'Tổ Cơ Giới Phản Ứng Nhanh Số 2 (Bình Thủy)',
    leaderName: 'KTV. Lê Tuấn Anh',
    phone: '0912 345 603',
    vehicleName: 'Xe cẩu thùng nâng 15m & Xe ben',
    vehiclePlate: '65B-1144',
    capacityType: 'Cẩu Nâng & Cứu Hộ Gãy Đổ',
    baseStation: 'Trạm Xung Kích Bình Thủy',
    defaultCorridors: ['Đường Cách Mạng Tháng 8', 'Đường Lê Hồng Phong', 'Đường Bùi Hữu Nghĩa'],
  },
  {
    id: 'team-3',
    name: 'Đội Xe Thang Cao Tuyến Sân Bay & Vành Đai',
    leaderName: 'KTV. Nguyễn Văn Hùng',
    phone: '0908 776 543',
    vehicleName: 'Xe thang chuyên dụng 22m',
    vehiclePlate: '65A-9988',
    capacityType: 'Xe Thang Siêu Cao Độ',
    baseStation: 'Bãi Xe Cơ Giới Võ Văn Kiệt',
    defaultCorridors: ['Đường Võ Văn Kiệt', 'Đường Nguyễn Văn Cừ', 'Đại Lộ Hùng Vương'],
  },
  {
    id: 'team-4',
    name: 'Tổ Duy Tu Vùng Ven Nam Cần Thơ (Cái Răng)',
    leaderName: 'KTV. Đỗ Quốc Bảo',
    phone: '0939 888 234',
    vehicleName: 'Xe bồn 8m³ & Xe cẩu tải 5 tấn',
    vehiclePlate: '65C-3321',
    capacityType: 'Duy Tu Lâm Sinh & Vận Tải Cành',
    baseStation: 'Trạm Quản Lộ Cái Răng',
    defaultCorridors: ['Đường 3 Tháng 2', 'Đường Quang Trung', 'Đường Trần Hưng Đạo'],
  },
  {
    id: 'team-5',
    name: 'Đội Xung Kích Dự Phòng Khẩn Cấp (IOC Ban Chỉ Huy)',
    leaderName: 'KTV. Phạm Thanh Phong',
    phone: '0918 123 789',
    vehicleName: 'Xe cẩu tự hành đa năng 10 tấn',
    vehiclePlate: '65A-7711',
    capacityType: 'Chiến Tranh Bão Lũ 24/7',
    baseStation: 'Tổng Kho Cơ Giới Sở Xây Dựng',
    defaultCorridors: ['Công Viên Lưu Hữu Phước', 'Bến Ninh Kiều', 'Các điểm sạt lở sông Hậu'],
  },
];

const LOCAL_STORAGE_DISPATCH_KEY = 'urbantree_corridor_fleet_dispatches_v1';

export const StormPruningActionModal: React.FC<StormPruningActionModalProps> = ({
  onClose,
  onPruned,
  onSelectTree,
}) => {
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'TEAMS' | 'REPORT'>('TRACKING');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCorridors, setExpandedCorridors] = useState<Set<string>>(new Set());
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectedDelayCorridor, setSelectedDelayCorridor] = useState<string | null>(null);
  const [delayInputReason, setDelayInputReason] = useState<string>('Ùn tắc giao thông giờ cao điểm');

  const currentUser = storage.getActiveUser();
  const trees = storage.getTrees();
  const careRecords = storage.getCareRecords();

  // 🚨 Quản lý trạng thái Còi Hú Tác Chiến (Audio Siren)
  const [sirenActive, setSirenActive] = useState(() => isSirenSoundEnabled());

  const handleToggleSiren = () => {
    const next = !sirenActive;
    setSirenActive(next);
    setSirenSoundEnabled(next);
    if (next) {
      playEmergencySirenSound(1.2);
    }
  };

  const handleTestSiren = () => {
    playEmergencySirenSound(1.8);
    sendWebPushNotification('🚨 Thử Nghiệm Còi Hú Tác Chiến', {
      body: 'Hệ thống cảnh báo điều động cơ giới phản ứng nhanh UrbanTree sẵn sàng hoạt động!',
    });
  };

  // 1. Lọc tất cả các cây cần rà soát hạ tán đón bão
  const pruningMap = useMemo(() => buildLatestPruningMap(careRecords), [careRecords]);

  const neededTrees = useMemo(() => {
    return trees
      .map((t) => ({ tree: t, audit: isStormSeasonPruningNeeded(t, careRecords, pruningMap) }))
      .filter((item) => item.audit.isNeeded)
      .map((item) => item.tree);
  }, [trees, careRecords, pruningMap]);

  // 2. Gom nhóm cây theo Tuyến Đường
  const corridorGroups = useMemo(() => {
    const map = new Map<string, Tree[]>();
    neededTrees.forEach((tree) => {
      const corr = getTreeCorridor(tree);
      const list = map.get(corr) || [];
      list.push(tree);
      map.set(corr, list);
    });
    return map;
  }, [neededTrees]);

  // 3. Khởi tạo & Đồng bộ trạng thái Điều Xe (Persistent Dispatch State)
  const [dispatchRecords, setDispatchRecords] = useState<Record<string, CorridorDispatchRecord>>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_DISPATCH_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Lưu dispatchRecords vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_DISPATCH_KEY, JSON.stringify(dispatchRecords));
  }, [dispatchRecords]);

  // Đồng bộ danh sách tuyến đường vào dispatchRecords (nếu chưa có)
  const rawCorridorNames = useMemo(() => Array.from(corridorGroups.keys()), [corridorGroups]);

  // Nếu hiện tại 100% cây đã an toàn (neededTrees = 0), tự động lấy danh mục các tuyến phố trọng điểm toàn thành phố để duy trì Dashboard đối soát
  const DEFAULT_CITY_CORRIDORS = [
    'Đại Lộ Hòa Bình',
    'Đường 30 Tháng 4',
    'Đường Cách Mạng Tháng 8',
    'Đường Lê Hồng Phong',
    'Đường Võ Văn Kiệt',
    'Đại Lộ Hùng Vương',
    'Đường 3 Tháng 2',
    'Công Viên Lưu Hữu Phước',
    'Bến Ninh Kiều'
  ];

  const allCorridorNames = useMemo(() => {
    if (rawCorridorNames.length > 0) return rawCorridorNames;
    return DEFAULT_CITY_CORRIDORS;
  }, [rawCorridorNames]);

  // Hợp nhất các tuyến đường từ cây vào bảng theo dõi
  const mergedCorridorList = useMemo(() => {
    const list: CorridorDispatchRecord[] = [];

    allCorridorNames.forEach((corridorName, idx) => {
      const neededTreesOnCorridor = corridorGroups.get(corridorName) || [];
      const allTreesOnCorridor = trees.filter((t) => getTreeCorridor(t) === corridorName);
      const totalCount = neededTreesOnCorridor.length > 0 ? neededTreesOnCorridor.length : (allTreesOnCorridor.length > 0 ? allTreesOnCorridor.length : 18);

      const highUrgency = neededTreesOnCorridor.filter((t) => {
        const audit = isStormSeasonPruningNeeded(t, careRecords, pruningMap);
        return audit.urgencyLevel === 'HIGH';
      }).length;

      const teamProfile = MUNICIPAL_TEAMS[idx % MUNICIPAL_TEAMS.length];
      const existing = dispatchRecords[corridorName];

      if (existing) {
        list.push({
          ...existing,
          totalTreeCount: totalCount,
          highUrgencyCount: highUrgency,
          treeIds: neededTreesOnCorridor.length > 0 ? neededTreesOnCorridor.map((t) => t.id) : allTreesOnCorridor.slice(0, 10).map((t) => t.id),
        });
      } else {
        const defaultStatus: FleetVehicleStatus = neededTrees.length === 0 ? 'COMPLETED' : 'STANDBY';
        list.push({
          corridorName,
          assignedTeam: teamProfile.name,
          assignedVehicle: teamProfile.vehicleName,
          vehiclePlate: teamProfile.vehiclePlate,
          leaderName: teamProfile.leaderName,
          leaderPhone: teamProfile.phone,
          status: defaultStatus,
          slaTargetMinutes: 30,
          completedTreeCount: defaultStatus === 'COMPLETED' ? totalCount : 0,
          totalTreeCount: totalCount,
          highUrgencyCount: highUrgency,
          treeIds: neededTreesOnCorridor.length > 0 ? neededTreesOnCorridor.map((t) => t.id) : allTreesOnCorridor.slice(0, 10).map((t) => t.id),
        });
      }
    });

    // Thêm các tuyến đã hoàn thành hoặc đang lưu trong cache dù neededTrees đã hạ xong
    Object.keys(dispatchRecords).forEach((savedCorridor) => {
      if (!allCorridorNames.includes(savedCorridor)) {
        list.push(dispatchRecords[savedCorridor]);
      }
    });

    return list.sort((a, b) => {
      // Đưa tuyến trễ hạn & đang thi công lên đầu
      const weight: Record<FleetVehicleStatus, number> = {
        DELAYED: 5,
        ON_SITE: 4,
        EN_ROUTE: 3,
        STANDBY: 2,
        COMPLETED: 1,
      };
      return (weight[b.status] || 0) - (weight[a.status] || 0) || b.totalTreeCount - a.totalTreeCount;
    });
  }, [allCorridorNames, corridorGroups, dispatchRecords, careRecords, pruningMap]);

  // Bộ lọc tìm kiếm & trạng thái
  const filteredCorridors = useMemo(() => {
    return mergedCorridorList.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.corridorName.toLowerCase().includes(search.toLowerCase()) ||
        item.assignedTeam.toLowerCase().includes(search.toLowerCase()) ||
        item.assignedVehicle.toLowerCase().includes(search.toLowerCase()) ||
        item.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
        item.leaderName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [mergedCorridorList, search, statusFilter]);

  // ========================================================
  // THỐNG KÊ TỔNG HỢP FLEET METRICS (KPIs)
  // ========================================================
  const stats = useMemo(() => {
    const totalCorridors = mergedCorridorList.length;
    const standbyCount = mergedCorridorList.filter((c) => c.status === 'STANDBY').length;
    const enRouteCount = mergedCorridorList.filter((c) => c.status === 'EN_ROUTE').length;
    const onSiteCount = mergedCorridorList.filter((c) => c.status === 'ON_SITE').length;
    const delayedCount = mergedCorridorList.filter((c) => c.status === 'DELAYED').length;
    const completedCount = mergedCorridorList.filter((c) => c.status === 'COMPLETED').length;

    // Phân tích trạng thái 5 Tổ Cơ Giới
    const teamAssignmentMap = new Map<string, { dispatchedCorridors: string[]; status: 'ACTIVE' | 'STANDBY' }>();
    MUNICIPAL_TEAMS.forEach((t) => {
      teamAssignmentMap.set(t.name, { dispatchedCorridors: [], status: 'STANDBY' });
    });

    mergedCorridorList.forEach((c) => {
      if (c.status !== 'STANDBY' && c.status !== 'COMPLETED') {
        const teamData = teamAssignmentMap.get(c.assignedTeam);
        if (teamData) {
          teamData.dispatchedCorridors.push(c.corridorName);
          teamData.status = 'ACTIVE';
        }
      }
    });

    const activeTeamsCount = Array.from(teamAssignmentMap.values()).filter((t) => t.status === 'ACTIVE').length;
    const standbyTeamsCount = MUNICIPAL_TEAMS.length - activeTeamsCount;

    const onTimeRate =
      totalCorridors > 0
        ? Math.round(((totalCorridors - delayedCount) / totalCorridors) * 100)
        : 100;

    return {
      totalCorridors,
      standbyCount,
      enRouteCount,
      onSiteCount,
      delayedCount,
      completedCount,
      activeTeamsCount,
      standbyTeamsCount,
      onTimeRate,
      teamAssignmentMap,
    };
  }, [mergedCorridorList]);

  // ========================================================
  // CÁC HÀNH ĐỘNG ĐIỀU PHỐI (ACTIONS)
  // ========================================================

  // 1. Xuất lệnh điều xe cho 1 tuyến (Chuyển sang EN_ROUTE)
  const handleDispatchCorridor = (item: CorridorDispatchRecord) => {
    const now = new Date().toISOString();
    playEmergencySirenSound(1.8);
    sendWebPushNotification(`🚨 Lệnh Điều Xe Tuyến ${item.corridorName}`, {
      body: `Huy động ${item.assignedVehicle} (${item.vehiclePlate}) do ${item.leaderName} phụ trách xuất kích khẩn cấp!`,
    });

    setDispatchRecords((prev) => ({
      ...prev,
      [item.corridorName]: {
        ...item,
        status: 'EN_ROUTE',
        dispatchedAt: now,
      },
    }));

    setSuccessToast(`🚛 Đã phát lệnh xuất phát cho ${item.assignedTeam} tới ${item.corridorName}! Bắt đầu tính giờ SLA 30 phút.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 2. Báo đã tiếp cận hiện trường (Chuyển sang ON_SITE)
  const handleArrivedOnSite = (item: CorridorDispatchRecord) => {
    const now = new Date().toISOString();
    playDispatchConfirmChirp();

    setDispatchRecords((prev) => ({
      ...prev,
      [item.corridorName]: {
        ...item,
        status: 'ON_SITE',
        arrivedAt: now,
      },
    }));

    setSuccessToast(`🦺 Xe ${item.vehiclePlate} đã tiếp cận ${item.corridorName}. Đang hạ tán cành cây thực địa!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 3. Nghiệm thu & Hoàn thành toàn tuyến (Ghi vào CSDL & Blockchain)
  const handleCompleteCorridor = async (item: CorridorDispatchRecord) => {
    setIsProcessing(true);
    const now = new Date().toISOString();

    try {
      if (item.treeIds && item.treeIds.length > 0) {
        await storage.dispatchCorridorPruningBatch({
          treeIds: item.treeIds,
          corridorName: item.corridorName,
          staffUserId: currentUser.id,
          staffName: currentUser.fullName,
          equipmentUsed: `${item.assignedVehicle} (${item.vehiclePlate})`,
        });
      }

      setDispatchRecords((prev) => ({
        ...prev,
        [item.corridorName]: {
          ...item,
          status: 'COMPLETED',
          completedAt: now,
          completedTreeCount: item.totalTreeCount,
        },
      }));

      playDispatchConfirmChirp();
      setSuccessToast(`🎉 Đã nghiệm thu an toàn toàn bộ ${item.totalTreeCount} cây trên ${item.corridorName}! Hồ sơ đã lưu trữ.`);
      setTimeout(() => setSuccessToast(null), 4500);
      onPruned();
    } catch (err: any) {
      alert('Lỗi nghiệm thu: ' + (err?.message || 'Không thể lưu hồ sơ'));
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Báo trễ hạn / Cảnh báo kẹt đường
  const handleReportDelay = (corridorName: string, reason: string) => {
    setDispatchRecords((prev) => {
      const existing = prev[corridorName];
      if (!existing) return prev;
      return {
        ...prev,
        [corridorName]: {
          ...existing,
          status: 'DELAYED',
          delayReason: reason,
        },
      };
    });

    playEmergencySirenSound(1.0);
    setSelectedDelayCorridor(null);
    setSuccessToast(`⚠️ Đã ghi nhận cảnh báo trễ hạn cho tuyến ${corridorName}: ${reason}`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 5. Tổng điều động tất cả các tuyến đang STANDBY
  const handleDispatchAllStandby = () => {
    const standbyList = mergedCorridorList.filter((c) => c.status === 'STANDBY');
    if (standbyList.length === 0) return;

    playEmergencySirenSound(2.5);
    sendWebPushNotification(`🚀 TỔNG LỆNH ĐIỀU XE TOÀN THÀNH PHỐ`, {
      body: `Xuất kích toàn bộ 5 tổ cơ giới xe thang rà soát các tuyến phố trước giờ bão đổ bộ!`,
    });

    const now = new Date().toISOString();
    const updates: Record<string, CorridorDispatchRecord> = {};

    standbyList.forEach((c) => {
      updates[c.corridorName] = {
        ...c,
        status: 'EN_ROUTE',
        dispatchedAt: now,
      };
    });

    setDispatchRecords((prev) => ({ ...prev, ...updates }));
    setSuccessToast(`🚀 Đã đồng loạt phát lệnh xuất xe cho ${standbyList.length} tuyến phố trọng điểm!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 6. Reset toàn bộ dữ liệu điều xe (Dành cho thử nghiệm)
  const handleResetDispatches = () => {
    if (confirm('Bác có chắc muốn hoàn nguyên bảng điều xe về trạng thái Trực ban ban đầu?')) {
      localStorage.removeItem(LOCAL_STORAGE_DISPATCH_KEY);
      setDispatchRecords({});
      setSuccessToast('Đã làm mới dữ liệu điều phối xe cơ giới!');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // 7. Xuất file CSV báo cáo điều động
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'Tuyến Đường',
      'Tổ Kỹ Thuật Phụ Trách',
      'Phương Tiện Cơ Giới',
      'Biển Số Xe',
      'Đội Trưởng',
      'Số Điện Thoại',
      'Trạng Thái Vận Hành',
      'Thời Điểm Điều Xe',
      'Thời Điểm Đến Nơi',
      'Thời Điểm Hoàn Thành',
      'Tổng Số Cây',
      'Cây Nguy Cơ Cao',
      'Lý Do Trễ Hạn (Nếu có)',
    ];

    const rows = mergedCorridorList.map((c, idx) => [
      idx + 1,
      `"${c.corridorName}"`,
      `"${c.assignedTeam}"`,
      `"${c.assignedVehicle}"`,
      c.vehiclePlate,
      `"${c.leaderName}"`,
      c.leaderPhone,
      c.status,
      c.dispatchedAt ? `"${new Date(c.dispatchedAt).toLocaleString('vi-VN')}"` : 'Chưa điều xe',
      c.arrivedAt ? `"${new Date(c.arrivedAt).toLocaleString('vi-VN')}"` : '',
      c.completedAt ? `"${new Date(c.completedAt).toLocaleString('vi-VN')}"` : '',
      c.totalTreeCount,
      c.highUrgencyCount,
      `"${c.delayReason || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [
        `BÁO CÁO TỔNG HỢP ĐIỀU ĐỘNG XE CƠ GIỚI HẠ TÁN CÂY ĐÓN BÃOp`,
        `Đơn vị: Ban Chỉ Huy Phòng Chống Thiên Tai & Hạ Tầng Đô Thị TP. Cần Thơ`,
        `Thời gian lập: ${new Date().toLocaleString('vi-VN')}`,
        '',
      ]
        .concat([headers.join(',')])
        .concat(rows.map((r) => r.join(',')))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_DieuXe_UrbanTree_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (corridorName: string) => {
    setExpandedCorridors((prev) => {
      const next = new Set(prev);
      if (next.has(corridorName)) next.delete(corridorName);
      else next.add(corridorName);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* ======================================================== */}
        {/* HEADER TRUNG TÂM CHỈ HUY */}
        {/* ======================================================== */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent dark:from-amber-950/40 dark:via-orange-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                  Trung Tâm Điều Hành & Giám Sát Xe Cơ Giới Hạ Tán
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                  {stats.activeTeamsCount}/{MUNICIPAL_TEAMS.length} TỔ ĐANG TÁC CHIẾN
                </span>
                {stats.delayedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" />
                    {stats.delayedCount} TUYẾN TRỄ HẠN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Giám sát lộ trình, kiểm soát trễ hạn SLA, phân bổ đội ngũ xe thang và xuất báo cáo ca trực.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Còi Hú Tác Chiến */}
            <button
              type="button"
              onClick={handleToggleSiren}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                sirenActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title={sirenActive ? 'Còi Hú Đang BẬT' : 'Còi Hú Đang TẮT'}
            >
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Còi Hú: {sirenActive ? 'BẬT' : 'TẮT'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestSiren}
              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer hidden sm:flex items-center gap-1"
              title="Thử âm lượng còi hú"
            >
              <span>Thử Còi</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* THANH ĐIỀU HƯỚNG TABS & 4 THẺ CHỈ SỐ KPI */}
        {/* ======================================================== */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          {/* 4 Thẻ KPI Tổng Hợp */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Tổng Tuyến Rà Soát</span>
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {stats.totalCorridors}{' '}
                <span className="text-xs font-normal text-slate-500">tuyến phố</span>
              </div>
              <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                {neededTrees.length.toLocaleString('vi-VN')} cây cần hạ tán
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Lực Lượng Tổ Đội</span>
                <Users className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                <span className="text-emerald-600 dark:text-emerald-400">{stats.activeTeamsCount}</span>
                <span className="text-slate-400">/{MUNICIPAL_TEAMS.length}</span>{' '}
                <span className="text-xs font-normal text-slate-500">tổ đang đi</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {stats.standbyTeamsCount} tổ đang sẵn sàng trực bãi
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Tiến Độ Xe Chạy</span>
                <Navigation className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                <span className="text-indigo-600 dark:text-indigo-400">{stats.enRouteCount + stats.onSiteCount}</span>{' '}
                <span className="text-xs font-normal text-slate-500">xe ngoài đường</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                {stats.completedCount} tuyến đã hoàn thành xong
              </div>
            </div>

            <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border shadow-2xs ${
              stats.delayedCount > 0
                ? 'border-rose-400 dark:border-rose-800 bg-rose-50/30'
                : 'border-slate-200/80 dark:border-slate-700/80'
            }`}>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Chỉ Số Đúng Hạn (SLA)</span>
                <Timer className={`w-3.5 h-3.5 ${stats.delayedCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
              </div>
              <div className={`text-lg font-black mt-1 ${stats.delayedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {stats.onTimeRate}%{' '}
                <span className="text-xs font-normal text-slate-500">đúng giờ</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {stats.delayedCount > 0 ? (
                  <span className="text-rose-600 font-bold">{stats.delayedCount} tuyến vi phạm thời gian</span>
                ) : (
                  <span className="text-emerald-600 font-medium">100% trong khung cam kết</span>
                )}
              </div>
            </div>
          </div>

          {/* 3 Tabs Điều Hướng */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('TRACKING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'TRACKING'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>Bảng Giám Sát Xe & Tuyến ({mergedCorridorList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('TEAMS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'TEAMS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Phân Bổ Tổ / Đội Cơ Giới ({MUNICIPAL_TEAMS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('REPORT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'REPORT'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Báo Cáo Tổng Hợp Điều Động</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {stats.standbyCount > 0 && (
                <button
                  type="button"
                  onClick={handleDispatchAllStandby}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Xuất Xe Toàn Tuyến ({stats.standbyCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetDispatches}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-medium transition-colors cursor-pointer"
                title="Khôi phục trạng thái trực ban ban đầu"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Toast thông báo thành công */}
        {successToast && (
          <div className="px-5 py-2.5 bg-emerald-500 text-white text-xs font-semibold flex items-center justify-between animate-fade-in shadow-md">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successToast}
            </span>
            <button onClick={() => setSuccessToast(null)} className="cursor-pointer font-bold opacity-80 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* NỘI DUNG TỪNG TAB */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* ========================================== */}
          {/* TAB 1: BẢNG GIÁM SÁT XE & TUYẾN THỰC ĐỊA */}
          {/* ========================================== */}
          {activeTab === 'TRACKING' && (
            <div className="space-y-3">
              {/* Banner Trạng Thái An Toàn Mùa Bão */}
              {neededTrees.length === 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                        100% Tuyến Đường Đã Được Điều Xe Cơ Giới Hạ Tán Đạt Chuẩn!
                      </div>
                      <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                        Tất cả các tuyến đường đô thị trọng điểm đã được rà soát. Dưới đây là bảng đối soát lộ trình xe và trực ban thực tế của các tổ cơ giới.
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
                    ĐÔ THỊ AN TOÀN
                  </span>
                </div>
              )}

              {/* Thanh lọc & Tìm kiếm */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tuyến phố, biển số xe, tên tổ, đội trưởng..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">Lọc:</span>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'STANDBY', label: 'Chưa điều xe' },
                    { id: 'EN_ROUTE', label: 'Đang di chuyển' },
                    { id: 'ON_SITE', label: 'Đang thi công' },
                    { id: 'DELAYED', label: '⚠️ Trễ hạn' },
                    { id: 'COMPLETED', label: '✓ Hoàn thành' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        statusFilter === f.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách các Thẻ Tuyến & Tình trạng Xe */}
              <div className="space-y-3">
                {filteredCorridors.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Không tìm thấy tuyến đường nào khớp với bộ lọc hiện tại.
                  </div>
                ) : (
                  filteredCorridors.map((item) => {
                    const isExpanded = expandedCorridors.has(item.corridorName);

                    // Badge trạng thái
                    const statusBadgeConfig = {
                      STANDBY: {
                        label: 'Chờ Xuất Xe (Trực Ban)',
                        color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
                        icon: Clock,
                      },
                      EN_ROUTE: {
                        label: 'Đang Xuất Phát / Di Chuyển',
                        color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800 animate-pulse',
                        icon: Truck,
                      },
                      ON_SITE: {
                        label: 'Đang Có Mặt & Hạ Tán',
                        color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                        icon: Scissors,
                      },
                      DELAYED: {
                        label: '⚠️ CẢNH BÁO TRỄ HẠN SLA',
                        color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-black animate-pulse',
                        icon: AlertOctagon,
                      },
                      COMPLETED: {
                        label: '✓ Đã Hoàn Thành Toàn Tuyến',
                        color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                        icon: CheckCircle2,
                      },
                    }[item.status];

                    const StatusIcon = statusBadgeConfig.icon;

                    return (
                      <div
                        key={item.corridorName}
                        className={`p-4 rounded-xl border bg-white dark:bg-slate-900 transition-all shadow-2xs space-y-3 ${
                          item.status === 'DELAYED'
                            ? 'border-rose-400 dark:border-rose-800 ring-1 ring-rose-400/40'
                            : item.status === 'ON_SITE'
                            ? 'border-amber-400/80 dark:border-amber-700'
                            : item.status === 'COMPLETED'
                            ? 'border-emerald-200 dark:border-emerald-900/60 opacity-90'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Khối Thông tin Tuyến & Đội phụ trách */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                                {item.corridorName}
                              </span>

                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${statusBadgeConfig.color}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                <span>{statusBadgeConfig.label}</span>
                              </span>

                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-300">
                                {item.totalTreeCount.toLocaleString('vi-VN')} Cây
                              </span>

                              {item.highUrgencyCount > 0 && (
                                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                                  {item.highUrgencyCount} CÂY NGUY CƠ CAO
                                </span>
                              )}
                            </div>

                            {/* Chi tiết Phương tiện & Tổ đội */}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                Đội: <strong className="text-slate-800 dark:text-slate-200">{item.assignedTeam}</strong>
                              </span>

                              <span className="flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-slate-400" />
                                Phương tiện: <strong className="text-slate-800 dark:text-slate-200">{item.assignedVehicle}</strong>{' '}
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-amber-600 font-bold">
                                  [{item.vehiclePlate}]
                                </span>
                              </span>

                              <span>
                                Đội trưởng: <strong className="text-slate-800 dark:text-slate-200">{item.leaderName}</strong> ({item.leaderPhone})
                              </span>
                            </div>

                            {/* Thời gian thực tế & Cảnh báo trễ */}
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {item.dispatchedAt && (
                                <span>
                                  Lệnh điều xe: <strong>{new Date(item.dispatchedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
                                </span>
                              )}
                              {item.arrivedAt && (
                                <span>
                                  Đến hiện trường: <strong>{new Date(item.arrivedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
                                </span>
                              )}
                              {item.completedAt && (
                                <span className="text-emerald-600 font-semibold">
                                  Hoàn thành: {new Date(item.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {item.delayReason && (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertOctagon className="w-3 h-3" />
                                  Lý do chậm trễ: {item.delayReason}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bộ Nút Điều Phối Hiện Trường (Action Buttons) */}
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.corridorName)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Thu gọn' : 'Xem cây'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {/* Hành động theo từng bước trạng thái */}
                            {item.status === 'STANDBY' && (
                              <button
                                type="button"
                                onClick={() => handleDispatchCorridor(item)}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Xuất Lệnh Điều Xe</span>
                              </button>
                            )}

                            {(item.status === 'EN_ROUTE' || item.status === 'DELAYED') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleArrivedOnSite(item)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Đã Đến Nơi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedDelayCorridor(item.corridorName)}
                                  className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  Báo Trễ
                                </button>
                              </>
                            )}

                            {item.status === 'ON_SITE' && (
                              <button
                                type="button"
                                onClick={() => handleCompleteCorridor(item)}
                                disabled={isProcessing}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Nghiệm Thu Xong</span>
                              </button>
                            )}

                            {item.status === 'COMPLETED' && (
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                                <Check className="w-3.5 h-3.5" />
                                Đã chốt ca
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Accordion: Danh sách cây trên tuyến */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                            <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                              <span>Mẫu cá thể cây trên tuyến ({item.treeIds.length} cây):</span>
                              <span className="text-[10px] text-slate-400">Đã gán xe thang {item.vehiclePlate}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {trees
                                .filter((t) => item.treeIds.includes(t.id))
                                .slice(0, 6)
                                .map((tree) => (
                                  <div
                                    key={tree.id}
                                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                  >
                                    <div>
                                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                                        [{tree.streetCode || tree.publicCode}]
                                      </span>{' '}
                                      <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {tree.displayName}
                                      </span>
                                      <div className="text-[10px] text-slate-400">
                                        Cao {tree.heightM || 8}m · ĐK {tree.diameterCm || 25}cm
                                      </div>
                                    </div>
                                    {onSelectTree && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onSelectTree(tree);
                                          onClose();
                                        }}
                                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                                      >
                                        Xem hồ sơ
                                      </button>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: MA TRẬN PHÂN BỔ TỔ / ĐỘI (TEAM MATRIX) */}
          {/* ========================================== */}
          {activeTab === 'TEAMS' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-blue-950 dark:text-blue-200">
                    Bảng Giám Sát Phân Bổ Ca Trực: Tổ Nào Đã Chia Xe - Tổ Nào Chưa
                  </h4>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                    Kiểm tra trạng thái sẵn sàng của 5 tổ cơ giới, tránh tình trạng tổ quá tải trong khi tổ khác đang rảnh rỗi.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    {stats.activeTeamsCount}/{MUNICIPAL_TEAMS.length} Tổ Đang Hoạt Động
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {MUNICIPAL_TEAMS.map((team) => {
                  const assignedCorridors = mergedCorridorList.filter(
                    (c) => c.assignedTeam === team.name && c.status !== 'STANDBY' && c.status !== 'COMPLETED'
                  );
                  const isBusy = assignedCorridors.length > 0;

                  return (
                    <div
                      key={team.id}
                      className={`p-4 rounded-xl border bg-white dark:bg-slate-900 transition-all shadow-2xs space-y-3 ${
                        isBusy
                          ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                              {team.name}
                            </h5>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                isBusy
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                              }`}
                            >
                              {isBusy ? '🚚 ĐANG TÁC CHIẾN' : '🟢 SẴN SÀNG TRỰC BAN'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                            <span>Đội trưởng: <strong>{team.leaderName}</strong></span>
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                              <PhoneCall className="w-3 h-3 text-slate-400" />
                              {team.phone}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-xs font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-amber-600">
                          {team.vehiclePlate}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span>Phương tiện: <strong>{team.vehicleName}</strong></span>
                          <span className="text-slate-400">{team.capacityType}</span>
                        </div>
                        <div className="text-slate-500">
                          Trạm đỗ: <strong>{team.baseStation}</strong>
                        </div>
                      </div>

                      {/* Tuyến đang phụ trách */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                          <span>Tuyến đường phụ trách ca này:</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {assignedCorridors.length} Tuyến Đang Chạy
                          </span>
                        </div>

                        {assignedCorridors.length === 0 ? (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1">
                            ✓ Chưa có lệnh điều xe. Tổ đang túc trực sẵn sàng tại trạm.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {assignedCorridors.map((c) => (
                              <div
                                key={c.corridorName}
                                className="px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-300/60 dark:border-amber-800 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {c.corridorName} ({c.totalTreeCount} cây)
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                  {c.status === 'EN_ROUTE' ? 'Đang di chuyển' : c.status === 'ON_SITE' ? 'Đang hạ tán' : 'Trễ hạn'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: BÁO CÁO TỔNG HỢP & XUẤT LƯU CHIỂU */}
          {/* ========================================== */}
          {activeTab === 'REPORT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Báo Cáo Tổng Hợp Điều Động Cơ Giới Hạ Tán Cây Xanh
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ phục vụ báo cáo Giám đốc Sở Xây Dựng, Ban QLĐT và Nghiệm thu thanh quyết toán dịch vụ công ích.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Xuất CSV / Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Báo Cáo</span>
                  </button>
                </div>
              </div>

              {/* Bảng báo cáo chi tiết */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">STT</th>
                        <th className="py-2.5 px-3">Tuyến Đường</th>
                        <th className="py-2.5 px-3">Tổ Phụ Trách</th>
                        <th className="py-2.5 px-3">Phương Tiện</th>
                        <th className="py-2.5 px-3">Trạng Thái</th>
                        <th className="py-2.5 px-3 text-center">Tổng Cây</th>
                        <th className="py-2.5 px-3">Giờ Điều Xe</th>
                        <th className="py-2.5 px-3">Đến Nơi</th>
                        <th className="py-2.5 px-3">Hoàn Thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {mergedCorridorList.map((c, idx) => (
                        <tr key={c.corridorName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {c.corridorName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {c.assignedTeam}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-amber-600 font-bold">
                            {c.vehiclePlate}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                c.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'DELAYED'
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : c.status === 'ON_SITE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : c.status === 'EN_ROUTE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {c.totalTreeCount}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {c.dispatchedAt ? new Date(c.dispatchedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {c.arrivedAt ? new Date(c.arrivedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {c.completedAt ? new Date(c.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MODAL GHI NHẬN LÝ DO TRỄ HẠN */}
        {/* ======================================================== */}
        {selectedDelayCorridor && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-rose-300 dark:border-rose-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertOctagon className="w-4 h-4" />
                <span>Ghi Nhận Lý Do Trễ Hạn: {selectedDelayCorridor}</span>
              </div>
              <p className="text-xs text-slate-500">
                Lý do này sẽ được ghi nhận vào nhật ký kiểm toán và báo cáo gửi Ban Giám Đốc.
              </p>
              <select
                value={delayInputReason}
                onChange={(e) => setDelayInputReason(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="Ùn tắc giao thông giờ cao điểm">Ùn tắc giao thông giờ cao điểm</option>
                <option value="Thời tiết mưa dông to, nguy cơ sét đánh">Thời tiết mưa dông to, nguy cơ sét đánh</option>
                <option value="Xe thang gặp sự cố hỏng lốp / máy nén thủy lực">Xe thang gặp sự cố hỏng lốp / máy nén thủy lực</option>
                <option value="Vướng đường dây điện trung thế cần cắt điện">Vướng đường dây điện trung thế cần cắt điện</option>
                <option value="Ô tô dân đỗ chắn không mở được chân chống xe thang">Ô tô dân đỗ chắn không mở được chân chống xe thang</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDelayCorridor(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleReportDelay(selectedDelayCorridor, delayInputReason)}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Xác Nhận Báo Trễ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* FOOTER */}
        {/* ======================================================== */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <span>Quy chuẩn điều phối xe cơ giới: TCVN 9257:2012 & Quyết định 19/2020/QĐ-UBND Cần Thơ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Đóng Trung Tâm
          </button>
        </div>
      </div>
    </div>
  );
};
