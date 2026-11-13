import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Wrench,
  Gift,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { storage } from '../db/storage';
import { AppNotification, NotificationSeverity, NotificationType, User } from '../types';

interface NotificationsViewProps {
  currentUser: User;
  onNavigate: (tab: string, entityId?: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    storage.getNotifications()
  );

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('CURRENT'); // Mặc định hiển thị thông báo dành cho vai trò hiện tại
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const refreshList = () => {
    setNotifications(storage.getNotifications());
  };

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    storage.markNotificationAsRead(id);
    refreshList();
  };

  const handleMarkAllAsRead = () => {
    const role = roleFilter === 'CURRENT' ? currentUser.role : roleFilter === 'ALL' ? undefined : roleFilter;
    storage.markAllNotificationsAsRead(role);
    refreshList();
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    storage.deleteNotification(id);
    refreshList();
  };

  const handleDeleteAllRead = () => {
    const role = roleFilter === 'CURRENT' ? currentUser.role : roleFilter === 'ALL' ? undefined : roleFilter;
    storage.deleteAllReadNotifications(role);
    refreshList();
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      storage.markNotificationAsRead(notif.id);
      refreshList();
    }
    if (notif.type === 'STORM_ALERT' || notif.linkId === 'storm-audit') {
      onNavigate('storm_action', 'storm-audit');
      return;
    }
    if (notif.linkTab) {
      onNavigate(notif.linkTab, notif.linkId);
    }
  };

  // Helper format thời gian tương đối
  const formatTimeAgo = (dateStr: string): string => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(ms / (60 * 1000));
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  // Helper icon theo phân loại thông báo
  const getTypeIcon = (type: NotificationType, severity: NotificationSeverity) => {
    switch (type) {
      case 'STORM_ALERT':
        return <CloudRain className="w-5 h-5 text-amber-500" />;
      case 'SLA_WARNING':
        return <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'INCIDENT_NEW':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'INCIDENT_RESOLVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'CARE_SCHEDULE':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'BLOCKCHAIN_EVENT':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'FELL_PERMIT':
        return <Wrench className="w-5 h-5 text-orange-500" />;
      case 'SYSTEM_BROADCAST':
      default:
        return severity === 'SUCCESS' ? (
          <Gift className="w-5 h-5 text-teal-500" />
        ) : (
          <Info className="w-5 h-5 text-blue-500" />
        );
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return notifications.filter((n) => {
      // 1. Lọc theo vai trò (Role)
      if (roleFilter === 'CURRENT') {
        if (!n.targetRoles.includes(currentUser.role)) return false;
      } else if (roleFilter !== 'ALL') {
        if (!n.targetRoles.includes(roleFilter as any)) return false;
      }

      // 2. Lọc theo phân loại (Type)
      if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;

      // 3. Lọc theo trạng thái đọc (Status)
      if (statusFilter === 'UNREAD' && n.isRead) return false;
      if (statusFilter === 'READ' && !n.isRead) return false;

      // 4. Lọc theo mức độ nghiêm trọng (Severity)
      if (severityFilter !== 'ALL' && n.severity !== severityFilter) return false;

      // 5. Tìm kiếm từ khóa
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        Boolean(n.actionLabel && n.actionLabel.toLowerCase().includes(q))
      );
    });
  }, [notifications, searchQuery, roleFilter, typeFilter, statusFilter, severityFilter, currentUser.role]);

  // KPI stats
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalCount = notifications.filter(
    (n) => n.severity === 'CRITICAL' || n.type === 'STORM_ALERT' || n.type === 'SLA_WARNING'
  ).length;
  const myRoleCount = notifications.filter((n) => n.targetRoles.includes(currentUser.role)).length;

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* 🌟 HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 dark:from-[#0c2419] dark:via-[#091811] dark:to-[#040e08] border border-emerald-200/80 dark:border-emerald-500/25 p-5 sm:p-7 text-slate-800 dark:text-white shadow-xl dark:shadow-2xl transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500" />
              </span>
              <span>Trung Tâm Chỉ Huy Giám Sát Đô Thị 4.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Bell className="w-7 h-7 text-amber-500 dark:text-amber-400" />
              <span>Trung Tâm Thông Báo &amp; Cảnh Báo</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 max-w-2xl leading-relaxed">
              Kênh thông tin tích hợp đa vai trò: Cập nhật các cảnh báo giông bão, hạn SLA khẩn cấp, phân công kỹ thuật viên thực địa và tiến độ xử lý phản ánh dân sinh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-100" />
              <span>Đánh dấu đã đọc</span>
            </button>
            <button
              onClick={handleDeleteAllRead}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 dark:bg-slate-800/80 dark:hover:bg-rose-900/60 dark:text-slate-200 dark:hover:text-white dark:border-slate-700/80 dark:hover:border-rose-600/80 font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
              <span>Dọn dẹp đã đọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🍱 BENTO KPI STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => {
            setRoleFilter('CURRENT');
            setStatusFilter('ALL');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            roleFilter === 'CURRENT'
              ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Dành cho vai trò của bạn</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-[#00FF9D]">
              {currentUser.role}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-[#00FF9D] mt-2">
            {myRoleCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Thông báo liên quan trực tiếp</div>
        </div>

        <div
          onClick={() => setStatusFilter('UNREAD')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'UNREAD'
              ? 'bg-blue-500/10 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500/50 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Tin chưa đọc</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400 mt-2">
            {unreadCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cần xem &amp; tiếp nhận xử lý</div>
        </div>

        <div
          onClick={() => setSeverityFilter('CRITICAL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            severityFilter === 'CRITICAL'
              ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500/50 shadow-md ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Khẩn cấp / Bão lũ</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 mt-2">
            {criticalCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Đòi hỏi hành động ngay</div>
        </div>

        <div
          onClick={() => {
            setRoleFilter('ALL');
            setStatusFilter('ALL');
            setTypeFilter('ALL');
            setSeverityFilter('ALL');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Tổng thông báo hệ thống</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lưu trữ trên cơ sở dữ liệu</div>
        </div>
      </div>

      {/* 🔍 MULTI-FILTER TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung sự cố, mã cây, địa chỉ đường phố..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Selects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Lọc theo Vai Trò */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Kênh tiếp nhận (Vai trò)
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer focus:ring-1.5 focus:ring-emerald-500"
            >
              <option value="CURRENT">⭐ Dành riêng cho tôi ({currentUser.role})</option>
              <option value="ALL">🌐 Tất cả các vai trò</option>
              <option value="ADMIN">👮 Quản trị viên (ADMIN)</option>
              <option value="STAFF">👷 Kỹ thuật viên (STAFF)</option>
              <option value="CITIZEN">👤 Người dân (CITIZEN)</option>
            </select>
          </div>

          {/* 2. Lọc theo Phân Loại */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Phân loại sự vụ
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer focus:ring-1.5 focus:ring-emerald-500"
            >
              <option value="ALL">📋 Tất cả phân loại</option>
              <option value="STORM_ALERT">⛈️ Bão lũ &amp; Mùa mưa</option>
              <option value="SLA_WARNING">🚨 Vi phạm hạn SLA</option>
              <option value="INCIDENT_NEW">📢 Phản ánh sự cố mới</option>
              <option value="INCIDENT_RESOLVED">✅ Sự cố đã xử lý xong</option>
              <option value="CARE_SCHEDULE">🌿 Lịch chăm sóc &amp; Cắt tỉa</option>
              <option value="BLOCKCHAIN_EVENT">⛓️ Toàn vẹn Smart Contract</option>
              <option value="SYSTEM_BROADCAST">🎁 Điểm thưởng &amp; Hệ thống</option>
            </select>
          </div>

          {/* 3. Lọc theo Trạng Thái */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Trạng thái đọc
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer focus:ring-1.5 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="UNREAD">🔵 Chưa đọc ({unreadCount})</option>
              <option value="READ">⚪ Đã đọc</option>
            </select>
          </div>

          {/* 4. Lọc theo Mức Độ Khẩn */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Mức độ khẩn cấp
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer focus:ring-1.5 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="CRITICAL">🚨 Nguy cấp (CRITICAL)</option>
              <option value="WARNING">⚠️ Cảnh báo (WARNING)</option>
              <option value="INFO">ℹ️ Thông tin (INFO)</option>
              <option value="SUCCESS">✅ Thành công (SUCCESS)</option>
            </select>
          </div>
        </div>

        {/* Filter Active Chips & Clear Filter */}
        {(searchQuery || roleFilter !== 'CURRENT' || typeFilter !== 'ALL' || statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Đang hiển thị <strong className="text-emerald-700 dark:text-[#00FF9D]">{filteredNotifications.length}</strong> / {totalCount} thông báo
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('CURRENT');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Khôi phục mặc định</span>
            </button>
          </div>
        )}
      </div>

      {/* 📋 DANH SÁCH THÔNG BÁO */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy thông báo nào</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Không có thông báo nào khớp với các tiêu chí bộ lọc đã chọn. Hãy thử nới lỏng bộ lọc hoặc tìm kiếm với từ khóa khác.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.isRead;
            const borderAccent =
              notif.severity === 'CRITICAL'
                ? 'border-rose-400/80 dark:border-rose-600/80 bg-rose-50/30 dark:bg-rose-950/20'
                : notif.severity === 'WARNING'
                ? 'border-amber-400/80 dark:border-amber-600/80 bg-amber-50/30 dark:bg-amber-950/20'
                : notif.severity === 'SUCCESS'
                ? 'border-emerald-400/80 dark:border-emerald-600/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:shadow-md cursor-pointer relative ${borderAccent} ${
                  isUnread ? 'shadow-xs' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Unread Indicator Dot */}
                {isUnread && (
                  <span className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
                  </span>
                )}

                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Icon Column */}
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                    {getTypeIcon(notif.type, notif.severity)}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {notif.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          notif.severity === 'CRITICAL'
                            ? 'bg-rose-500 text-white'
                            : notif.severity === 'WARNING'
                            ? 'bg-amber-500 text-white'
                            : notif.severity === 'SUCCESS'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {notif.severity}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {notif.message}
                    </p>

                    {/* Metadata bar */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimeAgo(notif.createdAt)}</span>
                      </span>

                      {/* Target roles pills */}
                      <div className="flex items-center gap-1">
                        {notif.targetRoles.map((r) => (
                          <span
                            key={r}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              r === currentUser.role
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-[#00FF9D] border border-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>

                      {/* Deep-link action button */}
                      {notif.actionLabel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notif);
                          }}
                          className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-[#00FF9D] dark:hover:text-emerald-300 hover:underline cursor-pointer"
                        >
                          <span>{notif.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Mark as read toggle */}
                      {isUnread ? (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          title="Đánh dấu đã đọc"
                        >
                          Đánh dấu đã đọc
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Đã đọc</span>
                      )}

                      {/* Delete notification */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Xóa thông báo này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

