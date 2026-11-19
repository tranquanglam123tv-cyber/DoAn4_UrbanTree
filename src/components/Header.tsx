import React, { useState, useEffect } from 'react';
import {
  Trees,
  LayoutDashboard,
  MapPin,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Home,
  Sliders,
  LogIn,
  LogOut,
  Users,
  Award,
  Wrench,
  Truck,
  Bell,
  MoreHorizontal,
  Compass,
  FileText,
} from 'lucide-react';
import { Role, User, StormCampaign } from '../types';
import { storage } from '../db/storage';
import { hasPermission } from '../utils/permissionUtils';
import { isStormSeasonPruningNeeded, buildLatestPruningMap } from '../utils/treeUtils';
import { EmergencyStormTicker } from './EmergencyStormTicker';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  onOpenQrScanner: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onResetSeed: () => void;
  onOpenStaffManagement?: () => void;
  onOpenStormPruningModal?: () => void;
  treeVersion?: number;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onUserChange,
  onOpenQrScanner,
  onOpenLogin,
  onLogout,
  onResetSeed,
  onOpenStaffManagement,
  onOpenStormPruningModal,
  treeVersion = 0,
  isDark,
  onToggleTheme,
}) => {
  const users = storage.getUsers();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(() =>
    storage.getUnreadNotificationCount(currentUser.role)
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setUnreadNotifications(storage.getUnreadNotificationCount(currentUser.role));
    const handleSync = () => {
      setUnreadNotifications(storage.getUnreadNotificationCount(currentUser.role));
    };
    window.addEventListener('urbantree:notifications-synced', handleSync);
    return () => {
      window.removeEventListener('urbantree:notifications-synced', handleSync);
    };
  }, [currentUser.role]);

  // ⛈️ Tính toán ĐỘNG số lượng cây cần rà soát cắt tỉa theo dữ liệu thực tế
  const stormAudit = React.useMemo(() => {
    const currentTrees = storage.getTrees();
    const currentCare = storage.getCareRecords();
    const pruningMap = buildLatestPruningMap(currentCare);
    const list = currentTrees
      .map((t) => ({ tree: t, audit: isStormSeasonPruningNeeded(t, currentCare, pruningMap) }))
      .filter((item) => item.audit.isNeeded);
    return {
      neededCount: list.length,
      highUrgencyCount: list.filter((i) => i.audit.urgencyLevel === 'HIGH').length,
    };
  }, [treeVersion]);

  // ⛈️ Đồng bộ tiến độ Chiến Dịch Mùa Bão thời gian thực từ SQLite
  const [stormCampaign, setStormCampaign] = React.useState<StormCampaign | null>(() => storage.getStormCampaign());

  React.useEffect(() => {
    storage.syncStormCampaignFromBackend().then((camp) => {
      if (camp) setStormCampaign(camp);
    });

    const handleCampUpdated = (e: any) => {
      if (e.detail) setStormCampaign(e.detail);
    };

    window.addEventListener('urbantree:campaign-updated', handleCampUpdated);
    window.addEventListener('urbantree:work-orders-synced', () => {
      setStormCampaign(storage.getStormCampaign());
    });
    return () => {
      window.removeEventListener('urbantree:campaign-updated', handleCampUpdated);
    };
  }, []);

  const handleRoleSelect = (role: Role) => {
    if (role === 'CITIZEN') {
      onUserChange({
        id: 'citizen-guest',
        username: 'nguoidan',
        fullName: 'Người dân (Công cộng)',
        role: 'CITIZEN',
        isActive: true,
      });
      setActiveTab('home');
    } else {
      const match = users.find((u) => u.role === role);
      if (match) {
        onUserChange(match);
      }
    }
    setIsProfileOpen(false);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TOP HEADER CỐ ĐỊNH CHUẨN 56PX (DESKTOP & TABLET) */}
      {/* ======================================================== */}
      <header className="sticky top-2 sm:top-3 z-40 w-full px-2 sm:px-4 lg:px-6 transition-all space-y-2">
        <div className="relative z-20 max-w-[1440px] mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl lg:rounded-full shadow-md shadow-emerald-950/4 px-3 sm:px-4 lg:px-5 py-1.5 transition-colors duration-200">
          <div className="flex items-center justify-between h-11 sm:h-12 gap-2 min-w-0">
            
            {/* LEFT: Logo Hệ Thống (Thuần Logo, Phóng To Tinh Tế) */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setActiveTab('home')}
                className="flex items-center group focus:outline-none cursor-pointer py-0.5"
                title="Về Trang Chủ UrbanTree"
              >
                <img
                  src="/LOGO.png"
                  alt="UrbanTree Logo"
                  className="h-10 w-10 sm:h-11 sm:w-11 object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
                />
              </button>
            </div>

            {/* CENTER: 5 WORKSPACE NAVIGATION TẬP TRUNG (Không Quá 5 Nút) */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md shrink-0">
              {/* --- ROLE: ADMIN (5 WORKSPACES CHÍNH THEO CHUẨN ĐỢT 1) --- */}
              {currentUser.role === 'ADMIN' && (
                <>
                  {/* 1. Tổng quan */}
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>TỔNG QUAN</span>
                  </button>

                  {/* 2. Tài sản cây (Bao gồm Bảng dữ liệu & Bản đồ GIS) */}
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveTab(activeTab === 'map' ? 'map' : 'trees')}
                      className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === 'trees' || activeTab === 'map'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span>TÀI SẢN CÂY</span>
                    </button>
                    {(activeTab === 'trees' || activeTab === 'map') && (
                      <div className="flex items-center ml-1 bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-full text-[10px]">
                        <button
                          type="button"
                          onClick={() => setActiveTab('trees')}
                          className={`px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider transition-all ${
                            activeTab === 'trees' ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          BẢNG
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('map')}
                          className={`px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider transition-all ${
                            activeTab === 'map' ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          BẢN ĐỒ
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Điều hành & Xe */}
                  <button
                    onClick={() => setActiveTab('work_orders')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'work_orders'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-900 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100'
                    }`}
                  >
                    <span>ĐIỀU HÀNH &amp; XE</span>
                  </button>

                  {/* 4. Sự cố */}
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'incidents'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>SỰ CỐ</span>
                  </button>

                  {/* 5. Kiểm toán (Blockchain On-Chain) */}
                  <button
                    onClick={() => setActiveTab('blockchain')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'blockchain'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>KIỂM TOÁN</span>
                  </button>
                </>
              )}

              {/* --- ROLE: STAFF --- */}
              {currentUser.role === 'STAFF' && (
                <>
                  <button
                    onClick={() => setActiveTab('staff_workstation')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'staff_workstation'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-emerald-800 dark:text-emerald-300 hover:bg-white dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>BÀN LÀM VIỆC</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('work_orders')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'work_orders'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>LỆNH CÔNG TÁC</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'map'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>BẢN ĐỒ</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('incidents')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'incidents'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>SỰ CỐ</span>
                  </button>
                </>
              )}

              {/* --- ROLE: CITIZEN --- */}
              {currentUser.role === 'CITIZEN' && (
                <>
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'home'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>TRANG CHỦ</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'map'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>BẢN ĐỒ SỐ</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('incidents')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'incidents'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>PHẢN ÁNH SỰ CỐ</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('citizen_portal')}
                    className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'citizen_portal'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>HỒ SƠ CỦA TÔI</span>
                  </button>
                </>
              )}
            </nav>

            {/* RIGHT: Quick Tools & Profile Dropdown */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Nút Quét QR Toàn Cục */}
              <button
                type="button"
                onClick={onOpenQrScanner}
                className="p-2 rounded-full text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                title="Quét mã QR thân cây"
              >
                <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>

              {/* Nút Đổi Theme Sáng / Tối */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isDark ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {/* Chuông Thông Báo */}
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`p-2 rounded-full transition-colors relative cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Trung tâm thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              {/* Menu Người Dùng & Chuyển Vai Trò */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
                    {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                    {currentUser.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Profile */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-fade-in space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {currentUser.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {currentUser.email || `${currentUser.username}@urbantree.vn`}
                      </div>
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 px-3 pt-1 uppercase tracking-wider">
                      Đổi nhanh vai trò
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('ADMIN')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                        currentUser.role === 'ADMIN' ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>Quản trị viên (ADMIN)</span>
                      {currentUser.role === 'ADMIN' && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('STAFF')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                        currentUser.role === 'STAFF' ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>Kỹ thuật viên (STAFF)</span>
                      {currentUser.role === 'STAFF' && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('CITIZEN')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                        currentUser.role === 'CITIZEN' ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>Công dân (CITIZEN)</span>
                      {currentUser.role === 'CITIZEN' && <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    {/* Phân hệ Kiểm toán Blockchain & Quản lý */}
                    {currentUser.role === 'ADMIN' && (
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('blockchain');
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sổ cái Blockchain</span>
                        </button>
                        {onOpenStaffManagement && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenStaffManagement();
                              setIsProfileOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-purple-600" />
                            <span>Quản lý Nhân sự</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onResetSeed();
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục dữ liệu gốc</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thanh Cảnh Báo Mùa Bão (Emergency Marquee Ticker) */}
        <EmergencyStormTicker
          campaign={stormCampaign}
          onOpenAction={async () => {
            if (currentUser.role === 'STAFF') {
              setActiveTab('staff');
              return;
            }
            if (stormAudit.neededCount > 0 && currentUser.role === 'ADMIN') {
              try {
                const res = await storage.triggerStormEmergencyDispatch();
                if (res.success) {
                  if (res.createdCount > 0) {
                    alert(`⚡ ĐÃ KÍCH HOẠT CHIẾN DỊCH BÃO:\nĐã lập thành công ${res.createdCount} Lệnh công tác Cắt tỉa khẩn cấp và điều động xe cơ giới!\nTổng ${res.totalTreesScheduled} cây nguy cơ cao được lên danh sách xử lý.`);
                  } else {
                    alert(`ℹ️ Các tuyến trọng điểm hiện đã có Lệnh cắt tỉa khẩn cấp đang thi công (${res.skippedCount} tuyến được bảo vệ). Hệ thống không sinh trùng lặp!`);
                  }
                } else {
                  alert(`Thông báo: ${res.message}`);
                }
              } catch (err: any) {
                console.warn('Lỗi kích hoạt bão:', err);
              }
            }
            setActiveTab('work_orders');
          }}
          neededCount={stormCampaign ? stormCampaign.remainingTrees : stormAudit.neededCount}
          highUrgencyCount={stormAudit.highUrgencyCount}
        />
      </header>

      {/* ======================================================== */}
      {/* 2. BOTTOM NAVIGATION BAR (DÀNH RIÊNG CHO MOBILE < 1024PX) */}
      {/* ======================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg flex items-center justify-around safe-area-bottom">
        {currentUser.role === 'STAFF' ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('staff_workstation')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'staff_workstation' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Wrench className="w-5 h-5 mb-0.5" />
              <span>Hôm nay</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('work_orders')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'work_orders' ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              <Truck className="w-5 h-5 mb-0.5" />
              <span>Lệnh tuyến</span>
            </button>

            {/* Nút Quét QR Nổi Bật Chính Giữa */}
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform cursor-pointer"
              title="Quét QR tại gốc cây"
            >
              <QrCode className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'map' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              <MapPin className="w-5 h-5 mb-0.5" />
              <span>Bản đồ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'incidents' ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5 mb-0.5" />
              <span>Sự cố</span>
            </button>
          </>
        ) : currentUser.role === 'CITIZEN' ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'home' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span>Trang chủ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'map' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              <MapPin className="w-5 h-5 mb-0.5" />
              <span>Bản đồ</span>
            </button>

            {/* Quét QR công dân */}
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform cursor-pointer"
              title="Quét QR tra cứu cây"
            >
              <QrCode className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'incidents' ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5 mb-0.5" />
              <span>Báo sự cố</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('citizen_portal')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'citizen_portal' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Award className="w-5 h-5 mb-0.5" />
              <span>Của tôi</span>
            </button>
          </>
        ) : (
          /* Role ADMIN trên Mobile */
          <>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'dashboard' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Sliders className="w-5 h-5 mb-0.5" />
              <span>Tổng quan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('work_orders')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'work_orders' ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              <Truck className="w-5 h-5 mb-0.5" />
              <span>Điều hành</span>
            </button>

            <button
              type="button"
              onClick={onOpenQrScanner}
              className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform cursor-pointer"
              title="Quét QR cây"
            >
              <QrCode className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'trees' ? 'map' : 'trees')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'trees' || activeTab === 'map' ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-slate-500'
              }`}
              title="Chuyển đổi nhanh giữa Danh sách cây và Bản đồ GIS"
            >
              {activeTab === 'map' ? <MapPin className="w-5 h-5 mb-0.5 text-emerald-600 dark:text-emerald-400" /> : <Trees className="w-5 h-5 mb-0.5" />}
              <span>{activeTab === 'map' ? 'Bản đồ GIS' : 'Cây xanh'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-[48px] min-w-[48px] cursor-pointer ${
                activeTab === 'incidents' ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5 mb-0.5" />
              <span>Sự cố</span>
            </button>
          </>
        )}
      </div>
    </>
  );
};
