import React, { useState } from 'react';
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
} from 'lucide-react';
import { storage } from '../db/storage';
import { Incident, IncidentSeverity, IncidentStatus, IncidentUpdate, User } from '../types';

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
  const [activeSubTab, setActiveSubTab] = useState<'admin' | 'public_report' | 'public_lookup'>(
    initialTreeId ? 'public_report' : currentUser.role === 'CITIZEN' ? 'public_report' : 'admin'
  );

  React.useEffect(() => {
    if (initialTreeId) {
      setActiveSubTab('public_report');
      setReportTreeId(initialTreeId);
    }
  }, [initialTreeId]);

  const incidents = storage.getIncidents();
  const trees = storage.getTrees();
  const users = storage.getUsers();

  // Admin filter & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Status transition form state
  const [newStatus, setNewStatus] = useState<IncidentStatus>('ASSIGNED');
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [transitionNote, setTransitionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Citizen submission form state
  const [reportTreeId, setReportTreeId] = useState<string>('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportAddress, setReportAddress] = useState('');
  const [reportSeverity, setReportSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reportSuccessCode, setReportSuccessCode] = useState<string | null>(null);

  // Citizen lookup state
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<Incident | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

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
    if (!transitionNote.trim()) {
      alert('Vui lòng nhập ghi chú lý do thay đổi trạng thái sự cố.');
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await storage.updateIncidentStatus({
        incidentId: selectedIncident.id,
        newStatus,
        actorUserId: currentUser.id,
        actorName: `${currentUser.fullName} (${currentUser.role})`,
        note: transitionNote.trim(),
        assignedToUserId: assignStaffId || undefined,
      });

      setSelectedIncident(updated);
      setTransitionNote('');
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
    const lat = matchedTree ? matchedTree.latitude : 10.77685;
    const lng = matchedTree ? matchedTree.longitude : 106.70312;
    const addr = reportAddress.trim() || matchedTree?.address || 'Quận 1, TP.HCM';

    const newInc = await storage.createIncident({
      treeId: reportTreeId || null,
      description: reportDesc.trim(),
      address: addr,
      latitude: lat,
      longitude: lng,
      severity: reportSeverity,
      reporterName: reporterName.trim() || 'Người dân ẩn danh',
      reporterPhone: reporterPhone.trim(),
    });

    setReportSuccessCode(newInc.publicCode);
    setReportDesc('');
    setReportAddress('');
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
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="leading-snug">Quản lý Tiếp nhận &amp; Xử lý Sự cố Cây xanh</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy trình tiếp nhận phản ánh, phân công đội ngũ kỹ thuật, lưu vết lịch sử bất biến và bảo chứng kết quả giải quyết.
          </p>
        </div>

        {/* Tab switchers (Pill Tabs) */}
        <div className="bg-slate-100/80 p-1 rounded-full flex items-center gap-1 border border-slate-200/80 text-xs overflow-x-auto max-w-full scrollbar-none">
          {currentUser.role !== 'CITIZEN' && (
            <button
              onClick={() => setActiveSubTab('admin')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'admin' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Điều phối Sự cố (Admin)
            </button>
          )}
          <button
            onClick={() => setActiveSubTab('public_report')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'public_report' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cổng Phản ánh Người dân
          </button>
          <button
            onClick={() => setActiveSubTab('public_lookup')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'public_lookup' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
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
          <div className="p-3 bg-white rounded-xl border border-[#E0EBDD] shadow-2xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã sự cố (INC-84920), mô tả, địa chỉ..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-[#347A50] focus:ring-1 focus:ring-[#347A50]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="RECEIVED">Mới tiếp nhận (RECEIVED)</option>
                <option value="ASSIGNED">Đã phân công (ASSIGNED)</option>
                <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
              </select>
            </div>
          </div>

          {/* Incident List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              {filteredIncidents.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Không tìm thấy sự cố nào phù hợp.
                </div>
              ) : (
                filteredIncidents.map((inc) => {
                  const tree = inc.treeId ? trees.find((t) => t.id === inc.treeId) : null;
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F8FAF8] border-[#174B36] ring-1 ring-[#174B36]'
                          : 'bg-white border-[#E0EBDD] hover:border-[#347A50] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E0EBDD] text-[#174B36]">
                            {inc.publicCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              inc.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-700'
                                : inc.severity === 'HIGH'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {inc.status}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(inc.reportedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 font-medium leading-relaxed mb-2">
                        {inc.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span className="truncate max-w-[240px] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inc.address || 'Khu vực nội ô'}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {tree && (
                            <span className="text-[#347A50] font-semibold">
                              Cây: {tree.publicCode}
                            </span>
                          )}
                          {inc.assignedToName && (
                            <span className="text-slate-600">
                              Phụ trách: <strong>{inc.assignedToName}</strong>
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
                <div className="bg-white p-5 rounded-2xl border border-[#E0EBDD] shadow-sm sticky top-20 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#174B36]">
                        {selectedIncident.publicCode}
                      </span>
                      <div className="text-[10px] text-slate-400">Chi tiết & Tiến trình xử lý</div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                      {selectedIncident.status}
                    </span>
                  </div>

                  {/* Incident Info */}
                  <div className="space-y-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Người gửi phản ánh:</span>
                      <span className="font-semibold">{selectedIncident.reporterName}</span>
                      {selectedIncident.reporterPhone && (
                        <span className="text-slate-500 font-mono ml-2">({selectedIncident.reporterPhone})</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Mô tả hiện trường:</span>
                      <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed text-[11px]">
                        {selectedIncident.description}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Địa chỉ:</span>
                      <span>{selectedIncident.address}</span>
                    </div>
                  </div>

                  {/* Status Transition Form */}
                  <form onSubmit={handleUpdateStatus} className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="font-bold text-[#174B36] text-[11px] uppercase tracking-wider">
                      Cập nhật trạng thái sự cố
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Chuyển sang trạng thái:
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                      >
                        <option value="ASSIGNED">Phân công nhân viên (ASSIGNED)</option>
                        <option value="IN_PROGRESS">Đang xử lý tại hiện trường (IN_PROGRESS)</option>
                        <option value="RESOLVED">Đã xử lý xong (RESOLVED - Neo Blockchain)</option>
                        <option value="REJECTED">Từ chối / Tin báo sai (REJECTED)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nhân viên phân công:
                      </label>
                      <select
                        value={assignStaffId}
                        onChange={(e) => setAssignStaffId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">-- Chưa chỉ định --</option>
                        {users.filter((u) => u.role === 'STAFF').map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.fullName} (STAFF)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Ghi chú cập nhật (bắt buộc):
                      </label>
                      <textarea
                        rows={2}
                        value={transitionNote}
                        onChange={(e) => setTransitionNote(e.target.value)}
                        placeholder="Ghi rõ hành động (ví dụ: Đã cử xe nâng cắt cành an toàn)"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full py-2 bg-[#174B36] hover:bg-[#347A50] text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                    >
                      {isUpdating ? 'Đang lưu & băm lịch sử...' : 'Lưu cập nhật trạng thái'}
                    </button>
                  </form>

                  {/* Immutable Timeline History */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="font-bold text-[#174B36] text-[11px] uppercase tracking-wider block">
                      Lịch sử diễn biến (Bất biến)
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {storage.getIncidentUpdates(selectedIncident.id).map((upd) => (
                        <div key={upd.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-bold text-slate-800">{upd.actorName}</span>
                            <span className="font-mono text-[10px]">
                              {new Date(upd.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-[#347A50] font-semibold">
                            {upd.oldStatus} ➔ {upd.newStatus}
                          </div>
                          <p className="text-slate-600">{upd.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E0EBDD] text-slate-400 text-xs">
                  Chọn một sự cố từ danh sách bên trái để điều phối và xem tiến trình xử lý.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Citizen Report Portal */}
      {activeSubTab === 'public_report' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-[#E0EBDD] shadow-sm space-y-5 text-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0EBDD] text-[#174B36] font-bold text-[10px] mb-2">
              <span>Cổng Dịch vụ Đô thị</span>
              <span>·</span>
              <span>Tiếp nhận 24/7</span>
            </div>
            <h2 className="text-lg font-bold text-[#174B36]">Gửi Phản ánh Sự cố Cây xanh</h2>
            <p className="text-slate-500 mt-1">
              Người dân không cần tạo tài khoản. Mọi phản ánh được số hóa, cấp mã tra cứu tức thì và bảo chứng minh bạch.
            </p>
          </div>

          {reportSuccessCode ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div className="text-base font-bold text-emerald-900">
                Gửi phản ánh thành công!
              </div>
              <p className="text-xs text-emerald-800">
                Mã tra cứu tiến trình xử lý của bạn là:
              </p>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xl font-bold font-mono text-[#174B36] tracking-wider shadow-xs">
                {reportSuccessCode}
              </div>
              <p className="text-[11px] text-slate-500">
                Vui lòng lưu lại mã này. Bạn có thể sang mục <strong>"Tra cứu theo Mã"</strong> để theo dõi nhân viên xử lý bất cứ lúc nào.
              </p>
              <button
                onClick={() => {
                  setLookupCode(reportSuccessCode);
                  setActiveSubTab('public_lookup');
                }}
                className="px-4 py-2 bg-[#174B36] text-white rounded-lg font-semibold text-xs hover:bg-[#347A50] transition-colors"
              >
                Theo dõi tiến độ ngay
              </button>
            </div>
          ) : (
            <form onSubmit={handleCitizenSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn cây xanh liên quan (Nếu có quét mã QR trên cây)
                </label>
                <select
                  value={reportTreeId}
                  onChange={(e) => setReportTreeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">-- Không xác định mã cây / Sự cố cây chung --</option>
                  {trees.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.publicCode}] {t.displayName} — {t.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mức độ khẩn cấp *
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value as IncidentSeverity)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  <option value="CRITICAL">Nguy cấp (Cây sắp đổ trúng đường / Gãy cành to)</option>
                  <option value="HIGH">Cao (Cành khô nứt nẻ / Cây nghiêng sau mưa)</option>
                  <option value="MEDIUM">Trung bình (Tổ mối / Sâu bệnh / Cành che khuất biển báo)</option>
                  <option value="LOW">Thấp (Cần dọn lá rụng / Rác quanh gốc)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết sự cố *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Ví dụ: Cành cây me tây đối diện số nhà 45 có vết nứt lớn, nguy cơ rơi khi có gió giật..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Địa chỉ hiện trường *
                </label>
                <input
                  type="text"
                  value={reportAddress}
                  onChange={(e) => setReportAddress(e.target.value)}
                  placeholder="Ví dụ: Vỉa hè trước số 12 Trương Định, P. Bến Thành, Q.1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ tên người báo (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại (Nhận tin nhắn)
                  </label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#174B36] hover:bg-[#347A50] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
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
          <div className="bg-white p-6 rounded-2xl border border-[#E0EBDD] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#174B36]">
              Tra cứu Tiến trình Xử lý Sự cố theo Mã
            </h2>
            <p className="text-slate-500">
              Nhập mã phản ánh nhận được (ví dụ: <button onClick={() => setLookupCode('INC-84920')} className="text-[#174B36] font-bold underline font-mono">INC-84920</button> hoặc <button onClick={() => setLookupCode('INC-53219')} className="text-[#174B36] font-bold underline font-mono">INC-53219</button>)
            </p>

            <form onSubmit={handleCitizenLookup} className="flex gap-2">
              <input
                type="text"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                placeholder="INC-XXXXX"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-[#174B36] text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] text-white font-semibold rounded-lg shrink-0 transition-colors"
              >
                Tra cứu
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {lookupError}
              </div>
            )}
          </div>

          {lookupResult && (
            <div className="bg-white p-6 rounded-2xl border border-[#E0EBDD] shadow-sm space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-base font-bold text-[#174B36]">
                    {lookupResult.publicCode}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    Ghi nhận lúc: {new Date(lookupResult.reportedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    lookupResult.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : lookupResult.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {lookupResult.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] block">Nội dung phản ánh:</span>
                <p className="text-slate-800 font-medium">{lookupResult.description}</p>
                <div className="text-slate-500 text-[11px] pt-1">
                  Địa điểm: {lookupResult.address}
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-[#174B36] text-xs uppercase tracking-wider block">
                  Nhật ký tiến trình thực tế:
                </span>
                <div className="space-y-3 pl-3 border-l-2 border-[#174B36]/30">
                  {storage.getIncidentUpdates(lookupResult.id).map((upd) => (
                    <div key={upd.id} className="relative pl-3 space-y-0.5">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#174B36] ring-4 ring-white" />
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span className="font-bold text-slate-800">{upd.actorName}</span>
                        <span className="font-mono">
                          {new Date(upd.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-[#347A50] font-semibold text-xs">
                        {upd.oldStatus} ➔ {upd.newStatus}
                      </div>
                      <p className="text-slate-700 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
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
