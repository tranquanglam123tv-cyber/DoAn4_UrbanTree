import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  MapPin,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { storage } from '../db/storage';
import { Incident, IncidentSeverity, IncidentStatus, IncidentUpdate, User } from '../types';
import { TreeSearchSelect } from './common/TreeSearchSelect';
import { calculateIncidentSLA } from '../utils/treeUtils';

interface IncidentsViewProps {
  onSelectTree: (tree: any) => void;
  currentUser: User;
  initialTreeId?: string;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  onSelectTree,
  currentUser,
  initialTreeId,
}) => {
  const incidents = storage.getIncidents();
  const trees = storage.getTrees();
  const users = storage.getUsers();

  const [activeSubTab, setActiveSubTab] = useState<'admin' | 'public_report' | 'public_lookup'>(
    initialTreeId ? 'public_report' : currentUser.role === 'CITIZEN' ? 'public_report' : 'admin'
  );

  // Admin filter & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Status transition form state
  const [newStatus, setNewStatus] = useState<IncidentStatus>('ASSIGNED');
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [transitionNote, setTransitionNote] = useState('');
  const [transitionImageUrl, setTransitionImageUrl] = useState('');
  const [transitionImagePreview, setTransitionImagePreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const statusPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Citizen submission form state
  const [reportTreeId, setReportTreeId] = useState<string>(initialTreeId || '');
  const [reportDesc, setReportDesc] = useState('');
  const [reportAddress, setReportAddress] = useState(() => {
    if (initialTreeId) {
      const match = storage.getTrees().find((t) => t.id === initialTreeId);
      return match ? match.address : '';
    }
    return '';
  });
  const [reportSeverity, setReportSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [reporterName, setReporterName] = useState(() => {
    return currentUser.role === 'CITIZEN' && currentUser.id !== 'citizen-guest' ? currentUser.fullName : '';
  });
  const [reporterPhone, setReporterPhone] = useState('');
  const [reportImageUrl, setReportImageUrl] = useState('');
  const [reportImagePreview, setReportImagePreview] = useState<string | null>(null);
  const [reportSuccessCode, setReportSuccessCode] = useState<string | null>(null);
  const citizenPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Citizen lookup state
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<Incident | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showLookupReopenForm, setShowLookupReopenForm] = useState(false);
  const [lookupReopenReason, setLookupReopenReason] = useState('');
  const [lookupReopenImageUrl, setLookupReopenImageUrl] = useState('');
  const [isSubmittingLookupReopen, setIsSubmittingLookupReopen] = useState(false);
  const [lookupReopenSuccess, setLookupReopenSuccess] = useState<string | null>(null);

  const handleLookupReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupResult || !lookupReopenReason.trim()) return;

    setIsSubmittingLookupReopen(true);
    try {
      const updated = await storage.reopenIncident({
        incidentId: lookupResult.id,
        actorUserId: currentUser?.id || 'citizen-guest',
        actorName: currentUser?.fullName || 'Người dân (Công cộng)',
        reason: lookupReopenReason.trim(),
        imageUrl: lookupReopenImageUrl.trim() || undefined,
      });
      setLookupResult({ ...updated });
      setShowLookupReopenForm(false);
      setLookupReopenReason('');
      setLookupReopenImageUrl('');
      setLookupReopenSuccess(`Đã gửi yêu cầu tái xử lý cho sự cố [${lookupResult.publicCode}]!`);
      setTimeout(() => setLookupReopenSuccess(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingLookupReopen(false);
    }
  };

  React.useEffect(() => {
    if (initialTreeId) {
      setActiveSubTab('public_report');
      setReportTreeId(initialTreeId);
      const match = trees.find((t) => t.id === initialTreeId);
      if (match) {
        setReportAddress(match.address);
      }
    }
  }, [initialTreeId, trees]);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.publicCode.toLowerCase().includes(search.toLowerCase()) ||
      inc.description.toLowerCase().includes(search.toLowerCase()) ||
      (inc.address && inc.address.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    if (currentUser.role === 'ADMIN') {
      if (!assignStaffId && newStatus === 'ASSIGNED') {
        alert('Vui lòng chọn Kỹ thuật viên (Staff) để giao nhiệm vụ xử lý.');
        return;
      }
    } else {
      if (!transitionNote.trim()) {
        alert('Vui lòng nhập ghi chú kết quả công việc xử lý tại hiện trường.');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const assignedStaffObj = users.find((u) => u.id === assignStaffId);
      const defaultAdminNote =
        newStatus === 'ASSIGNED'
          ? `Admin ${currentUser.fullName} đã phân công xử lý cho KTV ${assignedStaffObj?.fullName || 'thực địa'}.`
          : newStatus === 'REJECTED'
          ? `Admin ${currentUser.fullName} từ chối tiếp nhận (Tin báo trùng lặp hoặc không thuộc phạm vi xử lý).`
          : `Admin ${currentUser.fullName} yêu cầu tổ KTV kiểm tra lại hiện trường (Reopened).`;

      const updated = await storage.updateIncidentStatus({
        incidentId: selectedIncident.id,
        newStatus,
        actorUserId: currentUser.id,
        actorName: `${currentUser.fullName} (${currentUser.role})`,
        note: transitionNote.trim() || defaultAdminNote,
        assignedToUserId: assignStaffId || undefined,
        imageUrl: transitionImageUrl || transitionImagePreview || undefined,
      });

      setSelectedIncident(updated);
      setTransitionNote('');
      setTransitionImageUrl('');
      setTransitionImagePreview(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) {
      alert('Vui lòng nhập mô tả sự cố.');
      return;
    }

    const matchedTree = reportTreeId ? trees.find((t) => t.id === reportTreeId) : null;
    const lat = matchedTree ? matchedTree.latitude : 10.0345;
    const lng = matchedTree ? matchedTree.longitude : 105.7882;
    const addr = reportAddress.trim() || matchedTree?.address || 'Quận Ninh Kiều, Cần Thơ';

    const newInc = await storage.createIncident({
      treeId: reportTreeId || null,
      description: reportDesc.trim(),
      address: addr,
      latitude: lat,
      longitude: lng,
      severity: reportSeverity,
      imageUrl: reportImageUrl || reportImagePreview || undefined,
      reporterName: reporterName.trim() || 'Người dân Cần Thơ',
      reporterPhone: reporterPhone.trim(),
    });

    setReportSuccessCode(newInc.publicCode);
    setReportDesc('');
    setReportAddress('');
    setReportImageUrl('');
    setReportImagePreview(null);
  };

  const handleCitizenLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const inc = storage.getIncidentByPublicCode(lookupCode);
    if (inc) {
      setLookupResult(inc);
    } else {
      setLookupResult(null);
      setLookupError(`Không tìm thấy sự cố với mã "${lookupCode}". Vui lòng kiểm tra lại.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-700/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="leading-snug">Quản lý Tiếp nhận &amp; Xử lý Sự cố Cây xanh</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quy trình tiếp nhận phản ánh, phân công đội ngũ kỹ thuật, lưu vết lịch sử bất biến và bảo chứng kết quả giải quyết.
          </p>
        </div>

        {/* Tab switchers (Pill Tabs) */}
        <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-full flex items-center gap-1 border border-slate-200/80 dark:border-slate-800 text-xs overflow-x-auto max-w-full scrollbar-none">
          {currentUser.role !== 'CITIZEN' && (
            <button
              onClick={() => setActiveSubTab('admin')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'admin'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Điều phối Sự cố (Admin)
            </button>
          )}
          <button
            onClick={() => setActiveSubTab('public_report')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'public_report'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Cổng Phản ánh Người dân
          </button>
          <button
            onClick={() => setActiveSubTab('public_lookup')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'public_lookup'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Tra cứu theo Mã
          </button>
        </div>
      </div>

      {/* Subtab 1: Admin Management & Triage */}
      {activeSubTab === 'admin' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-3 bg-white dark:bg-[#0c1812] rounded-xl border border-[#E0EBDD] dark:border-emerald-500/20 shadow-2xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã sự cố (INC-84920), mô tả, địa chỉ..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 focus:border-[#347A50] dark:focus:border-emerald-400 focus:ring-1 focus:ring-[#347A50]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="RECEIVED">Mới tiếp nhận (RECEIVED)</option>
                <option value="ASSIGNED">Đã phân công (ASSIGNED)</option>
                <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                <option value="REOPENED">Yêu cầu tái xử lý (REOPENED)</option>
                <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
              </select>
            </div>
          </div>

          {/* Incident List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              {filteredIncidents.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#0c1812] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
                  Không tìm thấy sự cố nào phù hợp.
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const tree = inc.treeId ? trees.find((t) => t.id === inc.treeId) : null;
                  const isSelected = selectedIncident?.id === inc.id;
                  const sla = calculateIncidentSLA(inc);
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F8FAF8] dark:bg-[#12241b] border-[#174B36] dark:border-emerald-500 ring-1 ring-[#174B36] dark:ring-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-[#0c1812] border-[#E0EBDD] dark:border-slate-800/80 hover:border-[#347A50] dark:hover:border-emerald-500/40 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400 dark:border dark:border-emerald-800/50">
                            {inc.publicCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              inc.severity === 'CRITICAL'
                                ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 dark:border dark:border-red-800/50'
                                : inc.severity === 'HIGH'
                                ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 dark:border dark:border-orange-800/50'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 dark:border dark:border-amber-800/50'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              inc.status === 'REOPENED'
                                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse font-bold flex items-center gap-1'
                                : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 border-transparent dark:border-slate-700/60'
                            }`}
                          >
                            {inc.status === 'REOPENED' ? `⚠️ TÁI XỬ LÝ (Lần ${inc.reopenedCount || 1})` : inc.status}
                          </span>

                          {/* ⏱️ ĐỒNG HỒ SLA PHẢN ỨNG NHANH */}
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono border flex items-center gap-1 ${sla.badgeClass}`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{sla.statusText}</span>
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(inc.reportedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed mb-2">
                        {inc.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="truncate max-w-[240px] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{inc.address || 'Khu vực nội ô'}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {tree && (
                            <span className="text-[#347A50] dark:text-emerald-400 font-semibold">
                              Cây: {tree.publicCode}
                            </span>
                          )}
                          {inc.assignedToName && (
                            <span className="text-slate-600 dark:text-slate-400">
                              Phụ trách: <strong className="text-slate-800 dark:text-slate-200">{inc.assignedToName}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Incident Details & Workflow State Machine Panel */}
            <div className="lg:col-span-1">
              {selectedIncident ? (
                <div className="bg-white dark:bg-[#0c1812] p-5 rounded-2xl border border-[#E0EBDD] dark:border-emerald-500/20 shadow-sm sticky top-20 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#174B36] dark:text-emerald-400">
                        {selectedIncident.publicCode}
                      </span>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Chi tiết & Tiến trình xử lý</div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700">
                      {selectedIncident.status}
                    </span>
                  </div>

                  {/* Incident Info */}
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Người gửi phản ánh:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedIncident.reporterName}</span>
                      {selectedIncident.reporterPhone && (
                        <span className="text-slate-500 dark:text-slate-400 font-mono ml-2">({selectedIncident.reporterPhone})</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Mô tả hiện trường:</span>
                      <p className="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed text-[11px] text-slate-800 dark:text-slate-200">
                        {selectedIncident.description}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Địa chỉ:</span>
                      <span className="text-slate-800 dark:text-slate-200">{selectedIncident.address}</span>
                    </div>

                    {/* ⏱️ SLA MONITOR BOX */}
                    {(() => {
                      const selSla = calculateIncidentSLA(selectedIncident);
                      return (
                        <div
                          className={`p-3 rounded-xl border space-y-1.5 ${
                            selSla.isOverdue
                              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Cam kết SLA: {selSla.limitLabel}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${selSla.badgeClass}`}>
                              {selSla.statusText}
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                selSla.isOverdue
                                  ? 'bg-rose-600'
                                  : selSla.percentUsed >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(selSla.percentUsed, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>
                              Đã trôi qua: <strong>{selSla.elapsedMinutes} phút</strong>
                            </span>
                            <span>
                              {selSla.isResolved
                                ? 'Hoàn tất nghiệm thu On-Chain'
                                : selSla.isOverdue
                                ? '🚨 Vi phạm tiến độ đáp ứng'
                                : `Còn lại: ${selSla.remainingMinutes} phút`}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status Transition Form */}
                  <form onSubmit={handleUpdateStatus} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#174B36] dark:text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{currentUser.role === 'ADMIN' ? 'Điều Phối & Phân Công Nhiệm Vụ' : 'Cập nhật hiện trường'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        {currentUser.role === 'ADMIN' ? 'Vai trò Admin: Điều phối' : 'Vai trò Staff: Xử lý'}
                      </span>
                    </div>

                    {currentUser.role === 'ADMIN' ? (
                      /* KHỐI FORM RIÊNG DÀNH CHO ADMIN ĐIỀU PHỐI */
                      <div className="space-y-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                          👮 <strong>Quy trình thực tế:</strong> Admin chỉ thực hiện sàng lọc phản ánh, chỉ định giao việc cho Kỹ thuật viên (Staff). Việc chụp ảnh nghiệm thu, cưa cắt dọn dẹp hiện trường sẽ do <strong>bên Staff thực hiện tại chỗ</strong>.
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Lệnh điều phối sự cố:
                          </label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:border-[#347A50] dark:focus:border-emerald-400 text-xs"
                          >
                            <option value="ASSIGNED">👉 Phân công Kỹ thuật viên xử lý (ASSIGNED)</option>
                            <option value="REOPENED">⚠️ Yêu cầu tổ KTV làm lại (REOPENED - Khi dân tái phản ánh)</option>
                            <option value="REJECTED">🚫 Từ chối / Tin báo sai / Ngoài thẩm quyền (REJECTED)</option>
                          </select>
                        </div>

                        {newStatus === 'ASSIGNED' && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Chọn Kỹ thuật viên (Staff) phụ trách địa bàn *:
                            </label>
                            <select
                              value={assignStaffId}
                              onChange={(e) => setAssignStaffId(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:border-emerald-500 text-xs"
                              required
                            >
                              <option value="">-- Chọn KTV tiếp nhận vé công tác --</option>
                              {users.filter((u) => u.role === 'STAFF').map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                  👷 {staff.fullName} — Đội Kỹ thuật Đô thị (STAFF)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Lưu ý điều phối gửi KTV (Tùy chọn):
                          </label>
                          <input
                            type="text"
                            value={transitionNote}
                            onChange={(e) => setTransitionNote(e.target.value)}
                            placeholder="Ví dụ: Ưu tiên điều xe thang 12m vì cành sà sát đường dây điện..."
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white dark:placeholder-slate-500 text-xs"
                          />
                        </div>

                        {/* Banner nhắc nhở KTV sẽ cập nhật hiện trường */}
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>KTV phụ trách: <strong>{users.find((u) => u.id === (assignStaffId || selectedIncident.assignedToUserId))?.fullName || 'Chưa chỉ định'}</strong></span>
                          <span className="text-emerald-600 font-semibold">Staff sẽ chụp ảnh &amp; nghiệm thu On-Chain</span>
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="w-full py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isUpdating ? 'Đang điều phối...' : 'Lưu Lệnh Điều Phối & Bàn Giao KTV'}</span>
                        </button>
                      </div>
                    ) : (
                      /* KHỐI FORM DÀNH CHO STAFF CẬP NHẬT HIỆN TRƯỜNG & NGHIỆM THU */
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Trạng thái tiến độ thực địa:
                          </label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:border-[#347A50] dark:focus:border-emerald-400"
                          >
                            <option value="IN_PROGRESS">Đang xử lý tại hiện trường (IN_PROGRESS)</option>
                            <option value="RESOLVED">Đã xử lý xong (RESOLVED - Nghiệm thu On-Chain)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Ghi chú hành động thực tế tại chỗ *:
                          </label>
                          <textarea
                            rows={2}
                            value={transitionNote}
                            onChange={(e) => setTransitionNote(e.target.value)}
                            placeholder="Mô tả cụ thể: Đã cắt hạ 2 nhánh khô, quét dọn vỉa hè an toàn..."
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white dark:placeholder-slate-500 focus:border-[#347A50] dark:focus:border-emerald-400"
                            required
                          />
                        </div>

                        {/* Ảnh chụp hiện trường xử lý thực địa */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              Ảnh chụp hiện trường sau xử lý:
                            </label>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Minh chứng nghiệm thu
                            </span>
                          </div>

                          <input
                            type="file"
                            ref={statusPhotoInputRef}
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64 = reader.result as string;
                                  setTransitionImageUrl(base64);
                                  setTransitionImagePreview(base64);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />

                          {transitionImagePreview ? (
                            <div className="relative rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-600/60 max-h-28 group flex items-center justify-center bg-slate-900">
                              <img
                                src={transitionImagePreview}
                                alt="Ảnh xử lý"
                                className="w-full h-28 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => statusPhotoInputRef.current?.click()}
                                  className="px-2 py-1 bg-white text-slate-800 rounded text-[10px] font-semibold cursor-pointer"
                                >
                                  Đổi ảnh
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransitionImagePreview(null);
                                    setTransitionImageUrl('');
                                  }}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-semibold cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => statusPhotoInputRef.current?.click()}
                              className="w-full py-1.5 border border-dashed border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium cursor-pointer transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Chụp / Tải ảnh nghiệm thu sau xử lý</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="w-full py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          {isUpdating ? 'Đang lưu & băm lịch sử...' : 'Xác nhận xử lý & Ký On-Chain'}
                        </button>
                      </div>
                    )}
                  </form>

                  {/* Immutable Timeline History */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-[#174B36] dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                      Lịch sử diễn biến (Bất biến)
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {storage.getIncidentUpdates(selectedIncident.id).map((upd) => (
                        <div key={upd.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{upd.actorName}</span>
                            <span className="font-mono text-[10px]">
                              {new Date(upd.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-[#347A50] dark:text-emerald-400 font-semibold">
                            {upd.oldStatus} ➔ {upd.newStatus}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{upd.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-[#0c1812] rounded-2xl border border-[#E0EBDD] dark:border-emerald-500/20 text-slate-400 dark:text-slate-500 text-xs">
                  Chọn một sự cố từ danh sách bên trái để điều phối và xem tiến trình xử lý.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Citizen Report Portal */}
      {activeSubTab === 'public_report' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#0c1812] p-6 rounded-2xl border border-[#E0EBDD] dark:border-emerald-500/20 shadow-sm space-y-5 text-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400 dark:border dark:border-emerald-800/50 font-bold text-[10px] mb-2">
              <span>Cổng Dịch vụ Đô thị</span>
              <span>·</span>
              <span>Tiếp nhận 24/7</span>
            </div>
            <h2 className="text-lg font-bold text-[#174B36] dark:text-emerald-400">Gửi Phản ánh Sự cố Cây xanh</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Người dân không cần tạo tài khoản. Mọi phản ánh được số hóa, cấp mã tra cứu tức thì và bảo chứng minh bạch.
            </p>
          </div>

          {reportSuccessCode ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Gửi phản ánh thành công!
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Mã tra cứu tiến trình xử lý của bạn là:
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-700/60 text-xl font-bold font-mono text-[#174B36] dark:text-emerald-400 tracking-wider shadow-xs">
                {reportSuccessCode}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vui lòng lưu lại mã này. Bạn có thể sang mục <strong>"Tra cứu theo Mã"</strong> để theo dõi nhân viên xử lý bất cứ lúc nào.
              </p>
              <button
                onClick={() => {
                  setLookupCode(reportSuccessCode);
                  setActiveSubTab('public_lookup');
                }}
                className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Theo dõi tiến độ ngay
              </button>
            </div>
          ) : (
            <form onSubmit={handleCitizenSubmit} className="space-y-4">
              {reportTreeId && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>
                      Đang phản ánh cho cây: <strong>[{trees.find((t) => t.id === reportTreeId)?.publicCode}]</strong> {trees.find((t) => t.id === reportTreeId)?.displayName}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    Đã nhận diện QR
                  </span>
                </div>
              )}

              <div>
                <TreeSearchSelect
                  trees={trees}
                  value={reportTreeId}
                  onChange={(treeId) => setReportTreeId(treeId)}
                  label="Chọn cây xanh liên quan (Nếu có quét mã QR trên cây)"
                  allowEmpty={true}
                  emptyLabel="-- Không xác định mã cây / Sự cố cây chung trên vỉa hè --"
                  placeholder="Gõ mã cây (HB-01) hoặc số nhà để tìm nhanh..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mức độ khẩn cấp *
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value as IncidentSeverity)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:border-[#347A50] dark:focus:border-emerald-400"
                >
                  <option value="CRITICAL">Nguy cấp (Cây sắp đổ trúng đường / Gãy cành to)</option>
                  <option value="HIGH">Cao (Cành khô nứt nẻ / Cây nghiêng sau mưa)</option>
                  <option value="MEDIUM">Trung bình (Tổ mối / Sâu bệnh / Cành che khuất biển báo)</option>
                  <option value="LOW">Thấp (Cần dọn lá rụng / Rác quanh gốc)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết sự cố *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Ví dụ: Cành cây me tây đối diện số nhà 45 có vết nứt lớn, nguy cơ rơi khi có gió giật..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white dark:placeholder-slate-500 focus:border-[#347A50] dark:focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ hiện trường *
                </label>
                <input
                  type="text"
                  value={reportAddress}
                  onChange={(e) => setReportAddress(e.target.value)}
                  placeholder="Ví dụ: Vỉa hè trước cổng ĐH Cần Thơ, Đường 3/2, Xuân Khánh, Ninh Kiều"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white dark:placeholder-slate-500 focus:border-[#347A50] dark:focus:border-emerald-400"
                />
              </div>

              {/* Citizen Photo capture */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Ảnh chụp thực tế hiện trường sự cố
                  </label>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Khuyến khích chụp để xử lý nhanh
                  </span>
                </div>

                <input
                  type="file"
                  ref={citizenPhotoInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setReportImageUrl(base64);
                        setReportImagePreview(base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />

                {reportImagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-600/60 bg-slate-900 group aspect-video max-h-40 flex items-center justify-center">
                    <img
                      src={reportImagePreview}
                      alt="Ảnh sự cố"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => citizenPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow hover:bg-slate-100 cursor-pointer"
                      >
                        Chụp / Chọn ảnh khác
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReportImagePreview(null);
                          setReportImageUrl('');
                        }}
                        className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => citizenPhotoInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 rounded-xl p-3 flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-xs text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Chụp ảnh hiện trường từ máy ảnh
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        hoặc bấm để tải ảnh từ thư viện thiết bị
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ tên người báo (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white dark:placeholder-slate-500 focus:border-[#347A50] dark:focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại (Nhận tin nhắn)
                  </label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white dark:placeholder-slate-500 focus:border-[#347A50] dark:focus:border-emerald-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi phản ánh ngay</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Subtab 3: Citizen Lookup Portal */}
      {activeSubTab === 'public_lookup' && (
        <div className="max-w-xl mx-auto space-y-4 text-xs">
          <div className="bg-white dark:bg-[#0c1812] p-6 rounded-2xl border border-[#E0EBDD] dark:border-emerald-500/20 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#174B36] dark:text-emerald-400">
              Tra cứu Tiến trình Xử lý Sự cố theo Mã
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Nhập mã phản ánh nhận được (ví dụ: <button onClick={() => setLookupCode('INC-84920')} className="text-[#174B36] dark:text-emerald-400 font-bold underline font-mono cursor-pointer">INC-84920</button> hoặc <button onClick={() => setLookupCode('INC-53219')} className="text-[#174B36] dark:text-emerald-400 font-bold underline font-mono cursor-pointer">INC-53219</button>)
            </p>

            <form onSubmit={handleCitizenLookup} className="flex gap-2">
              <input
                type="text"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                placeholder="INC-XXXXX"
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-[#174B36] dark:text-emerald-400 bg-white dark:bg-slate-900 text-sm focus:border-[#347A50] dark:focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                Tra cứu
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                {lookupError}
              </div>
            )}
          </div>

          {lookupResult && (
            <div className="bg-white dark:bg-[#0c1812] p-6 rounded-2xl border border-[#E0EBDD] dark:border-emerald-500/20 shadow-sm space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-base font-bold text-[#174B36] dark:text-emerald-400">
                    {lookupResult.publicCode}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ghi nhận lúc: {new Date(lookupResult.reportedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    lookupResult.status === 'REOPENED'
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse'
                      : lookupResult.status === 'RESOLVED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 dark:border dark:border-emerald-800'
                      : lookupResult.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 dark:border dark:border-blue-800'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 dark:border dark:border-amber-800'
                  }`}
                >
                  {lookupResult.status === 'REOPENED' ? `⚠️ TÁI XỬ LÝ (Lần ${lookupResult.reopenedCount || 1})` : lookupResult.status}
                </span>
              </div>

              {lookupReopenSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{lookupReopenSuccess}</span>
                </div>
              )}

              {/* Notice when REOPENED */}
              {lookupResult.status === 'REOPENED' && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 rounded-xl space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Yêu cầu tái xử lý từ người dân (Lần {lookupResult.reopenedCount || 1}):</span>
                  </div>
                  <p className="italic bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                    "{lookupResult.reopenedReason}"
                  </p>
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1 pt-0.5">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Đội xe cơ động Cần Thơ đã nhận lệnh khẩn cấp quay lại xử lý triệt để.</span>
                  </div>
                </div>
              )}

              {/* Citizen Re-report Box when RESOLVED */}
              {lookupResult.status === 'RESOLVED' && (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 rounded-xl space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-semibold">Hiện trường thực tế chưa ổn thỏa hoặc chưa sạch sẽ?</span>
                    </div>
                    <button
                      onClick={() => setShowLookupReopenForm(!showLookupReopenForm)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{showLookupReopenForm ? 'Đóng form' : 'Tái báo cáo'}</span>
                    </button>
                  </div>

                  {showLookupReopenForm && (
                    <form onSubmit={handleLookupReopenSubmit} className="space-y-3 pt-2 border-t border-amber-200 dark:border-amber-900/60 animate-fade-in">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Nêu rõ lý do chưa đạt yêu cầu <span className="text-rose-500">*</span>:
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Ví dụ: Cành cây mục phía trên vẫn chưa được cắt hết, cành lá rơi vãi chưa được dọn..."
                          value={lookupReopenReason}
                          onChange={(e) => setLookupReopenReason(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Link ảnh đối chứng (nếu có):
                        </label>
                        <input
                          type="url"
                          placeholder="https://... hoặc dán URL ảnh hiện trường"
                          value={lookupReopenImageUrl}
                          onChange={(e) => setLookupReopenImageUrl(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingLookupReopen || !lookupReopenReason.trim()}
                          className={`px-4 py-2 rounded-lg text-white font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                            isSubmittingLookupReopen || !lookupReopenReason.trim()
                              ? 'bg-amber-400 opacity-60 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-700 cursor-pointer active:scale-95'
                          }`}
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isSubmittingLookupReopen ? 'animate-spin' : ''}`} />
                          <span>{isSubmittingLookupReopen ? 'Đang gửi...' : 'Gửi yêu cầu làm lại'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 border border-transparent dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block">Nội dung phản ánh:</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{lookupResult.description}</p>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                  Địa điểm: {lookupResult.address}
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-[#174B36] dark:text-emerald-400 text-xs uppercase tracking-wider block">
                  Nhật ký tiến trình thực tế:
                </span>
                <div className="space-y-3 pl-3 border-l-2 border-[#174B36]/30 dark:border-emerald-500/40">
                  {storage.getIncidentUpdates(lookupResult.id).map((upd) => (
                    <div key={upd.id} className="relative pl-3 space-y-0.5">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#174B36] dark:bg-emerald-400 ring-4 ring-white dark:ring-[#0c1812]" />
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{upd.actorName}</span>
                        <span className="font-mono">
                          {new Date(upd.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-[#347A50] dark:text-emerald-400 font-semibold text-xs">
                        {upd.oldStatus} ➔ {upd.newStatus}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-xs bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {upd.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
