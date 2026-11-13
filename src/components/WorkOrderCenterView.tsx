import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Play,
  RotateCcw,
  FileSpreadsheet,
  Plus,
  ChevronRight,
  MapPin,
  Calendar,
  Users,
  Eye,
  Check,
  X,
  AlertOctagon,
  Timer,
  Zap,
  ArrowRight,
  Sparkles,
  Link2,
} from 'lucide-react';
import { storage } from '../db/storage';
import {
  Equipment,
  OperationalZone,
  Route,
  Team,
  User,
  WorkOrder,
  WorkOrderHistory,
  WorkOrderItem,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from '../types';

interface WorkOrderCenterViewProps {
  currentUser: User;
  onSelectTree?: (treeId: string) => void;
}

export const WorkOrderCenterView: React.FC<WorkOrderCenterViewProps> = ({
  currentUser,
  onSelectTree,
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'WORK_ORDERS' | 'TEAMS_FLEET' | 'RULES'>('DASHBOARD');
  const [dataVersion, setDataVersion] = useState(0);

  // Filters
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Modal Detail & Checklist
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Order being manually assigned or dispatched
  const [assigningOrder, setAssigningOrder] = useState<WorkOrder | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lấy dữ liệu từ storage
  const departments = useMemo(() => storage.getDepartments(), [dataVersion]);
  const zones = useMemo(() => storage.getOperationalZones(), [dataVersion]);
  const routes = useMemo(() => storage.getRoutes(), [dataVersion]);
  const teams = useMemo(() => storage.getTeams(), [dataVersion]);
  const equipment = useMemo(() => storage.getEquipment(), [dataVersion]);
  const rules = useMemo(() => storage.getMaintenanceRules(), [dataVersion]);
  const workOrders = useMemo(() => storage.getWorkOrders(), [dataVersion]);
  const metrics = useMemo(() => storage.getOperationsDispatchMetrics(), [dataVersion]);

  // Lọc danh sách Work Orders
  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (selectedZoneId !== 'ALL' && wo.zoneId !== selectedZoneId) return false;
      if (selectedStatus !== 'ALL' && wo.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = wo.code.toLowerCase().includes(q);
        const matchTitle = wo.title.toLowerCase().includes(q);
        const matchRoute = (wo.routeCorridorName || '').toLowerCase().includes(q);
        const matchTeam = (wo.assignedTeamName || '').toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchRoute && !matchTeam) return false;
      }
      return true;
    });
  }, [workOrders, selectedZoneId, selectedStatus, searchQuery]);

  // Chi tiết Work Order đang chọn
  const selectedOrderDetails = useMemo(() => {
    if (!selectedOrderId) return null;
    return storage.getWorkOrderDetails(selectedOrderId);
  }, [selectedOrderId, dataVersion]);

  // Xử lý chạy Bộ Quy Tắc Tự Động (Auto-Scheduler)
  const handleRunAutoScheduler = () => {
    const res = storage.evaluateMaintenanceRulesAndGenerateWorkOrders();
    setDataVersion((v) => v + 1);
    if (res.createdCount > 0) {
      showToast(`⚡ Đã tự động lập và điều phối ${res.createdCount} Lệnh công tác theo tuyến!`);
    } else {
      showToast('ℹ️ Các tuyến trọng điểm hiện đã có Lệnh công tác đang hoạt động (Đảm bảo không sinh trùng lặp).');
    }
  };

  // Xuất Báo Cáo Ca Trực & Điều Động Xe
  const handleExportDispatchReport = () => {
    const headers = [
      'STT',
      'Tên Tổ / Đội',
      'Đội Trưởng',
      'Số Điện Thoại',
      'Xe Cơ Giới & Biển Số',
      'Tình Trạng Điều Xe',
      'Tuyến Đường Đang Đảm Nhận',
      'Lệnh Công Tác Hiện Tại',
      'Tiến Độ Cây',
      'Trạng Thái SLA',
    ];

    const rows = metrics.teamDispatches.map((td, idx) => {
      const wo = td.currentWorkOrder;
      const eqNames = td.equipmentList.map((e) => `${e.name} [${e.plateNumber || 'N/A'}]`).join('; ');
      return [
        idx + 1,
        `"${td.team.name}"`,
        `"${td.team.leaderName || 'N/A'}"`,
        `"${td.team.leaderPhone || 'N/A'}"`,
        `"${eqNames || 'Chưa gắn xe'}"`,
        td.isDispatched ? 'ĐÃ ĐI XE (NGOÀI ĐƯỜNG)' : 'TRỰC BÃI (SẴN SÀNG)',
        `"${wo?.routeCorridorName || 'Trực tại trạm'}"`,
        `"${wo?.title || 'Không có lệnh mở'}"`,
        wo ? `${wo.completedItems}/${wo.totalItems} (${wo.progressPercent}%)` : '-',
        wo?.isOverdue ? '⚠️ CẢNH BÁO TRỄ HẠN' : 'ĐÚNG HẠN',
      ];
    });

    const csvContent =
      '\uFEFF' +
      [
        `BÁO CÁO TỔNG HỢP ĐIỀU ĐỘNG XE CƠ GIỚI & CÁC TỔ HIỆN TRƯỜNG`,
        `Đơn vị: Ban Chỉ Huy Điều Hành Đô Thị UrbanTree Cần Thơ`,
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
    showToast('📊 Đã xuất Báo cáo Điều Xe Hiện Trường thành công!');
  };

  // Chuyển trạng thái Lệnh công tác
  const handleTransition = (orderId: string, nextStatus: WorkOrderStatus, reason?: string) => {
    try {
      storage.transitionWorkOrderStatus(orderId, nextStatus, currentUser, reason);
      setDataVersion((v) => v + 1);
      showToast(`Đã chuyển trạng thái lệnh sang "${nextStatus}"`);
    } catch (err: any) {
      alert(err.message || 'Lỗi chuyển trạng thái');
    }
  };

  // Cập nhật trạng thái từng cây trong checklist
  const handleUpdateItem = (
    itemId: string,
    status: 'COMPLETED' | 'SKIPPED' | 'FAILED',
    skipReason?: string
  ) => {
    try {
      storage.updateWorkOrderItemExecution(itemId, status, currentUser.id, skipReason);
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Giám sát nghiệm thu Lệnh công tác
  const handleVerify = (orderId: string, isApproved: boolean) => {
    const note = prompt(
      isApproved
        ? 'Nhập ghi chú nghiệm thu đạt chuẩn kỹ thuật:'
        : 'Nhập lý do TỪ CHỐI nghiệm thu (yêu cầu làm lại):',
      isApproved ? 'Đạt chuẩn kỹ thuật đô thị Cần Thơ' : 'Cần hạ thêm độ cao cành sà thấp'
    );
    if (note === null) return;

    try {
      storage.verifyWorkOrder(orderId, currentUser, isApproved, note);
      setDataVersion((v) => v + 1);
      showToast(
        isApproved
          ? '🎉 Đã nghiệm thu ĐẠT CHUẨN, đóng lệnh và tự động neo lên Blockchain Ledger!'
          : '⚠️ Đã TỪ CHỐI nghiệm thu và yêu cầu tổ làm lại!'
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse">ĐANG THI CÔNG</span>;
      case 'SUBMITTED_FOR_REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">CHỜ NGHIỆM THU</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">ĐÃ HOÀN TẤT</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">YÊU CẦU LÀM LẠI</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">ĐÃ GIAO XE</span>;
      case 'DRAFT':
      case 'PLANNED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">CHỜ PHÂN BỔ</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white">KHẨN CẤP</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white">ƯU TIÊN CAO</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white">TRUNG BÌNH</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-400 text-white">THẤP</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER: TRUNG TÂM CHỈ HUY & ĐIỀU ĐỘNG VẬN HÀNH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  Trung Tâm Điều Hành & Vận Hành Hiện Trường (Work Order Center)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {metrics.activeDispatchedCount}/{teams.length} TỔ ĐANG TÁC CHIẾN
                </span>
                {metrics.delayedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    {metrics.delayedCount} LỆNH TRỄ HẠN SLA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quy trình vận hành chuẩn: Tuyến Đường → Quy Tắc Vận Hành → Auto-Scheduler → Lệnh Công Tác → Phân Đội Cơ Giới → Nghiệm Thu → Neo Blockchain.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleRunAutoScheduler}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Quét bộ quy tắc và tự động lập lệnh công tác theo tuyến"
            >
              <Zap className="w-4 h-4" />
              <span>Chạy Auto-Scheduler Tuyến</span>
            </button>

            <button
              type="button"
              onClick={handleExportDispatchReport}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Báo Cáo Điều Xe</span>
            </button>
          </div>
        </div>

        {/* 4 Tabs Điều Hướng */}
        <div className="flex items-center gap-1.5 mt-5 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto">
          {[
            { id: 'DASHBOARD', label: 'Báo Cáo Điều Xe Ca Trực', icon: Truck },
            { id: 'WORK_ORDERS', label: `Hàng Đợi Lệnh Công Tác (${workOrders.length})`, icon: Clock },
            { id: 'TEAMS_FLEET', label: `Biên Chế Tổ Đội & Xe Cơ Giới (${teams.length})`, icon: Users },
            { id: 'RULES', label: `Quy Tắc Bảo Dưỡng Tuyến (${rules.length})`, icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: BÁO CÁO ĐIỀU XE CA TRỰC & DASHBOARD TỔNG HỢP */}
      {/* ===================================================================== */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-5">
          {/* 4 Thẻ KPI Chỉ Số Vận Hành */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Tổ Đã Xuất Kích Ngoài Đường</span>
                <Truck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                <span className="text-emerald-600">{metrics.activeDispatchedCount}</span>
                <span className="text-slate-400 text-base font-normal"> / {teams.length} tổ</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                {metrics.standbyCount} tổ đang trực bãi sẵn sàng
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Lệnh Đang Thi Công & Chờ Duyệt</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                {workOrders.filter((w) => w.status === 'IN_PROGRESS' || w.status === 'SUBMITTED_FOR_REVIEW').length}
                <span className="text-xs font-normal text-slate-500 ml-1.5">lệnh mở</span>
              </div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">
                {metrics.waitingVerificationCount} lệnh đang chờ nghiệm thu
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Độ Tuân Thủ Đúng Hạn SLA</span>
                <Timer className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                <span className={metrics.delayedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  {metrics.onTimeRate}%
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                {metrics.delayedCount > 0 ? (
                  <span className="text-rose-600 font-bold">{metrics.delayedCount} lệnh vượt thời gian cam kết</span>
                ) : (
                  <span className="text-emerald-600 font-medium">100% trong khung thời gian quy định</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Đã Hoàn Tất & Neo Blockchain</span>
                <ShieldCheck className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                <span className="text-teal-600">{metrics.completedCount}</span>
                <span className="text-xs font-normal text-slate-500 ml-1.5">lệnh thành công</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Bảo chứng đối soát bất biến On-chain
              </div>
            </div>
          </div>

          {/* BẢNG TỔNG HỢP: XEM TỔ NÀO ĐÃ CHIA XE ĐI RỒI, TỔ NÀO CHƯA ĐI */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <span>Bảng Tổng Hợp Điều Xe & Trực Ban Ca Trực</span>
                  <span className="text-xs font-normal text-slate-500 lowercase">(theo thời gian thực)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm soát rõ ràng tổ nào đã điều xe ra hiện trường, tổ nào đang trực bãi, tiến độ xử lý và cảnh báo trễ hạn.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Đang Ở Hiện Trường ({metrics.activeDispatchedCount})
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  Trực Bãi ({metrics.standbyCount})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-black text-slate-500 text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Tổ / Đội Hiện Trường</th>
                    <th className="py-3 px-3.5">Đội Trưởng & SĐT</th>
                    <th className="py-3 px-3.5">Xe Cơ Giới Biên Chế</th>
                    <th className="py-3 px-3.5">Tình Trạng Điều Xe</th>
                    <th className="py-3 px-3.5">Tuyến Đường & Lệnh Công Tác</th>
                    <th className="py-3 px-3.5 text-center">Tiến Độ Cây</th>
                    <th className="py-3 px-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics.teamDispatches.map((td) => {
                    const wo = td.currentWorkOrder;
                    const isDispatched = td.isDispatched;
                    return (
                      <tr key={td.team.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{td.team.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{td.team.code}</div>
                        </td>

                        <td className="py-3.5 px-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{td.team.leaderName || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{td.team.leaderPhone || 'N/A'}</div>
                        </td>

                        <td className="py-3.5 px-3.5">
                          {td.equipmentList.length > 0 ? (
                            <div className="space-y-1">
                              {td.equipmentList.map((eq) => (
                                <div key={eq.id} className="flex items-center gap-1.5 font-mono text-[11px]">
                                  <Truck className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{eq.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa gắn xe</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5">
                          {isDispatched ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                ĐÃ ĐI XE RA ĐƯỜNG
                              </span>
                              {wo?.isOverdue && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white flex items-center gap-1 w-fit animate-pulse">
                                  <AlertOctagon className="w-3 h-3" /> TRỄ HẠN SLA
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 w-fit">
                              TRỰC BÃI (SẴN SÀNG)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 max-w-xs">
                          {wo ? (
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{wo.routeCorridorName || 'Tuyến đô thị'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{wo.title}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa giao nhiệm vụ ca này</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 text-center">
                          {wo ? (
                            <div>
                              <div className="font-black text-sm text-slate-900 dark:text-white">
                                {wo.progressPercent}%
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {wo.completedItems}/{wo.totalItems} cây
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3.5 text-right">
                          {wo ? (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderId(wo.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer text-xs flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Mở Chi Tiết</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveTab('WORK_ORDERS')}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold hover:bg-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1 ml-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Giao Lệnh Mới</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: HÀNG ĐỢI LỆNH CÔNG TÁC (WORK ORDERS QUEUE) */}
      {/* ===================================================================== */}
      {activeTab === 'WORK_ORDERS' && (
        <div className="space-y-4">
          {/* Bộ lọc và Tìm kiếm */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã lệnh (WO-HB-01), tên tuyến đường, tổ phụ trách..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Lọc theo Zone */}
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Tất cả Khu Vực (3 Quận)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>

              {/* Lọc theo Trạng Thái */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Tất cả Trạng Thái</option>
                <option value="IN_PROGRESS">Đang thi công</option>
                <option value="SUBMITTED_FOR_REVIEW">Chờ nghiệm thu</option>
                <option value="COMPLETED">Đã hoàn tất</option>
                <option value="ASSIGNED">Đã giao xe</option>
                <option value="REJECTED">Yêu cầu làm lại</option>
              </select>
            </div>
          </div>

          {/* Danh sách Thẻ Lệnh Công Tác */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredOrders.map((wo) => {
              return (
                <div
                  key={wo.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {wo.code}
                      </span>
                      {getStatusBadge(wo.status)}
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2">
                        {wo.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {wo.routeCorridorName || 'Toàn Tuyến'}
                        </span>
                        <span className="text-slate-400">·</span>
                        {getPriorityBadge(wo.priority)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-[11px] text-slate-400 font-medium">Tổ Phụ Trách:</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {wo.assignedTeamName || 'Chưa giao tổ'}
                        </span>
                      </div>
                      {wo.assignedVehiclePlate && (
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-[11px] text-slate-400 font-medium">Xe Cơ Giới:</span>
                          <span className="font-mono font-bold text-amber-600">{wo.assignedVehiclePlate}</span>
                        </div>
                      )}
                    </div>

                    {/* Thanh tiến độ xử lý cây */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Tiến Độ Tuyến:</span>
                        <span className="text-emerald-600">
                          {wo.completedItems}/{wo.totalItems} cây ({wo.progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                          style={{ width: `${wo.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">
                      {wo.actualStart
                        ? `Bắt đầu: ${new Date(wo.actualStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Chưa xuất phát'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAssigningOrder(wo)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Phân bổ hoặc đổi tổ điều phối xe"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{wo.assignedTeamId ? 'Đổi Tổ' : 'Phân Tổ'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(wo.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Checklist</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: BIÊN CHẾ TỔ ĐỘI & THIẾT BỊ XE CƠ GIỚI */}
      {/* ===================================================================== */}
      {activeTab === 'TEAMS_FLEET' && (
        <div className="space-y-5">
          {/* Sơ đồ 4 Ban Chuyên Trách Đô Thị */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-base text-emerald-400">
                  Cơ Cấu 4 Ban Chuyên Trách Quản Lý Cây Xanh Đô Thị (Mô Hình Phân Ban Cần Thơ)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Định hướng chuyên môn hóa: Admin điều hành cấp IOC, các Ban độc lập phụ trách phương tiện và năng lực chuyên sâu
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30 self-start sm:self-auto">
                {departments.length} BAN CHUYÊN TRÁCH
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {departments.map((dept) => {
                const deptTeams = teams.filter((t) => t.departmentId === dept.id);
                return (
                  <div key={dept.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-emerald-400">{dept.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {deptTeams.length} Tổ Đội
                      </span>
                    </div>
                    <div className="font-bold text-xs text-white line-clamp-1">{dept.name}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2">{dept.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const eqList = equipment.filter((e) => team.assignedEquipmentIds.includes(e.id));
              return (
                <div
                  key={team.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-600">{team.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        team.currentStatus === 'DISPATCHED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {team.currentStatus === 'DISPATCHED' ? 'ĐANG TÁC CHIẾN' : 'TRỰC BÃI'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">{team.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đội trưởng: <span className="font-bold text-slate-700 dark:text-slate-300">{team.leaderName}</span> ({team.leaderPhone})
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Xe Cơ Giới & Thiết Bị:</div>
                    {eqList.length > 0 ? (
                      eqList.map((eq) => (
                        <div key={eq.id} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{eq.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chưa phân bổ xe</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {team.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: QUY TẮC BẢO DƯỠNG TUYẾN (MAINTENANCE RULES ENGINE) */}
      {/* ===================================================================== */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                Bộ Quy Tắc Vận Hành Đô Thị (Maintenance Rules Engine)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các quy tắc tự động hóa lập lệnh công tác theo mùa bão, theo ngày trong tuần hoặc theo chỉ số rủi ro ISA TRAQ.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunAutoScheduler}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Kích Hoạt Quét Toàn Bộ Tuyến</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const route = routes.find((r) => r.id === rule.scopeId);
              return (
                <div
                  key={rule.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {rule.triggerType}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{rule.priority}</span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">{rule.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{rule.description}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tuyến Áp Dụng:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{route?.name || 'Tất cả tuyến'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Loại Công Việc:</span>
                      <span className="font-bold text-emerald-600">{rule.taskType}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL CHI TIẾT LỆNH CÔNG TÁC & CHECKLIST CÂY HIỆN TRƯỜNG */}
      {/* ===================================================================== */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedOrderDetails.workOrder.code}
                    </span>
                    {getStatusBadge(selectedOrderDetails.workOrder.status)}
                    {getPriorityBadge(selectedOrderDetails.workOrder.priority)}
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
                    {selectedOrderDetails.workOrder.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin điều xe & Tổ phụ trách */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span>
                  Tổ: <strong className="text-slate-900 dark:text-white">{selectedOrderDetails.team?.name || 'Chưa giao'}</strong>
                </span>
                <span>·</span>
                <span>
                  Đội trưởng: <strong>{selectedOrderDetails.team?.leaderName} ({selectedOrderDetails.team?.leaderPhone})</strong>
                </span>
                <span>·</span>
                <span>
                  Tuyến: <strong>{selectedOrderDetails.route?.name}</strong>
                </span>
              </div>

              {/* Blockchain info nếu có */}
              {selectedOrderDetails.workOrder.anchorStatus === 'CONFIRMED' && (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bảo chứng Blockchain ON-CHAIN</span>
                </div>
              )}
            </div>

            {/* Thân Modal: Danh sách checklist từng cây trên tuyến */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase">
                    Danh Sách Kiểm Tra & Thực Thi Từng Cây ({selectedOrderDetails.items.length} cây)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Cập nhật tiến độ hoàn thành, đánh dấu bỏ qua kèm lý do hoặc báo hỏng tại hiện trường.
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-emerald-600">
                    {selectedOrderDetails.workOrder.completedItems}/{selectedOrderDetails.workOrder.totalItems} Hoàn Thành ({selectedOrderDetails.workOrder.progressPercent}%)
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {selectedOrderDetails.items.map((item, idx) => {
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                          : item.status === 'SKIPPED'
                          ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {item.treeStreetCode || item.treeId}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {item.treeDisplayName}
                            </span>
                            {item.houseMilestone && (
                              <span className="text-[11px] text-slate-400">({item.houseMilestone})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.notes}</div>
                          {item.skipOrFailureReason && (
                            <div className="text-[11px] text-amber-600 font-bold mt-0.5">
                              ⚠️ Lý do bỏ qua: {item.skipOrFailureReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nút thao tác hiện trường cho cây */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {item.status !== 'COMPLETED' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'COMPLETED')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Xong</span>
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã Hoàn Thành
                          </span>
                        )}

                        {item.status !== 'SKIPPED' && item.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt('Nhập lý do bỏ qua cây này (VD: Ô tô đỗ chắn, Vướng dây điện):', 'Ô tô đỗ chắn vỉa hè');
                              if (reason) handleUpdateItem(item.id, 'SKIPPED', reason);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Bỏ Qua
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Modal: Nghiệm thu & Chuyển trạng thái */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {selectedOrderDetails.workOrder.status === 'ASSIGNED' && (
                  <button
                    type="button"
                    onClick={() => handleTransition(selectedOrderDetails.workOrder.id, 'IN_PROGRESS', 'Đội đã xuất phát ra hiện trường')}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Xuất Xe Ra Hiện Trường</span>
                  </button>
                )}

                {selectedOrderDetails.workOrder.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={() => handleTransition(selectedOrderDetails.workOrder.id, 'SUBMITTED_FOR_REVIEW', 'Hoàn tất ca làm việc, nộp báo cáo nghiệm thu')}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Nộp Báo Cáo Chờ Nghiệm Thu</span>
                  </button>
                )}

                {/* Supervisor Nghiệm thu */}
                {selectedOrderDetails.workOrder.status === 'SUBMITTED_FOR_REVIEW' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerify(selectedOrderDetails.workOrder.id, true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Duyệt Nghiệm Thu & Đóng Lệnh (Neo On-Chain)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerify(selectedOrderDetails.workOrder.id, false)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Từ Chối (Yêu Cầu Làm Lại)</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL PHÂN BỔ TỔ ĐỘI & ĐIỀU ĐỘNG XE CƠ GIỚI THÔNG MINH */}
      {/* ===================================================================== */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#0c1812] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {assigningOrder.code}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {assigningOrder.routeCorridorName || 'Tuyến Đô Thị'}
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Điều Phối Tổ Đội & Xe Cơ Giới
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recommendations List */}
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Gợi ý Tổ Đội Phù Hợp Năng Lực & Trạng Thái:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold lowercase">
                  (hệ thống tự chấm điểm sẵn sàng)
                </span>
              </div>

              {storage.recommendTeamsForWorkOrder(assigningOrder.id).map((rec) => {
                const teamEquip = equipment.filter((e) => rec.team.assignedEquipmentIds.includes(e.id));
                const isCurrent = assigningOrder.assignedTeamId === rec.team.id;

                return (
                  <div
                    key={rec.team.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30'
                        : rec.canAssign
                        ? 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 hover:border-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {rec.team.name}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {rec.team.code}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                              Đang Giao
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Đội trưởng: <span className="font-semibold text-slate-800 dark:text-slate-200">{rec.team.leaderName}</span> ({rec.team.leaderPhone})
                        </div>

                        {/* Equipment & Capability */}
                        <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                          <span className="text-slate-400">Xe/Thiết bị:</span>
                          {teamEquip.map((eq) => (
                            <span key={eq.id} className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              {eq.name} [{eq.plateNumber || 'N/A'}]
                            </span>
                          ))}
                        </div>

                        {/* Reason / Status */}
                        <div className="text-xs font-medium text-slate-500 pt-1">
                          {rec.canAssign
                            ? `Điểm sẵn sàng: ${rec.score} (Đủ năng lực & thiết bị sẵn sàng)`
                            : `Chưa thể giao: ${rec.unmetReason}`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          try {
                            storage.assignWorkOrder(assigningOrder.id, rec.team.id, currentUser);
                            setDataVersion((v) => v + 1);
                            setAssigningOrder(null);
                            showToast(`Đã điều động ${rec.team.name} phụ trách lệnh ${assigningOrder.code}!`);
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }}
                        disabled={isCurrent}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors self-end sm:self-center shrink-0 ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{isCurrent ? 'Đã Chọn' : 'Điều Động Tổ Này'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
