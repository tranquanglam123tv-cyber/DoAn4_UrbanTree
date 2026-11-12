import React from 'react';
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
} from 'lucide-react';
import { Role, User } from '../types';
import { storage } from '../db/storage';
import { hasPermission } from '../utils/permissionUtils';
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
  isDark,
  onToggleTheme,
}) => {
  const users = storage.getUsers();
  const unreadNotifications = storage.getUnreadNotificationCount(currentUser.role);

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
  };

  return (
    <header className="sticky top-2 sm:top-3.5 z-40 w-full px-2 sm:px-4 lg:px-6 transition-all space-y-2">
      <div className="max-w-[1440px] mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl lg:rounded-full shadow-lg shadow-emerald-950/4 dark:shadow-emerald-950/30 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 transition-colors duration-200">
        <div className="flex items-center justify-between h-11 sm:h-12 gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-2xs transition-transform group-hover:scale-105">
                <Trees className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  UrbanTree
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                </span>
                <span className="hidden xl:block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-none">
                  Smart Eco-GIS 4.0
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links (Pill Tabs) - Phân quyền rõ rệt ADMIN vs STAFF vs CITIZEN (Tối ưu co giãn theo màn hình) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0 bg-slate-100/70 dark:bg-slate-800/80 p-0.5 xl:p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
            {/* 1. Trang chủ (dành cho mọi người) */}
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'home'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Trang chủ</span>
            </button>

            {/* --- ROLE: STAFF (Kỹ thuật viên thực địa) --- */}
            {currentUser.role === 'STAFF' && (
              <>
                <button
                  onClick={() => setActiveTab('staff_workstation')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3.5 py-1.5 rounded-full text-[11px] xl:text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer border shrink-0 ${
                    activeTab === 'staff_workstation'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-500/30'
                      : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Bàn làm việc</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'map'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Bản đồ GIS</span>
                </button>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'incidents'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Sự cố</span>
                </button>
              </>
            )}

            {/* --- ROLE: ADMIN (Lãnh đạo / Cơ quan Quản lý Vĩ mô) --- */}
            {currentUser.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer border shrink-0 ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Dashboard<span className="hidden 2xl:inline"> Vĩ Mô</span></span>
                </button>
                <button
                  onClick={() => setActiveTab('trees')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'trees'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <Trees className="w-3.5 h-3.5 shrink-0" />
                  <span>Hồ sơ cây</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'map'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Bản đồ GIS</span>
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'care'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                  <span>Chăm sóc</span>
                </button>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'incidents'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Sự cố</span>
                </button>
                <button
                  onClick={() => setActiveTab('blockchain')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'blockchain'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                  <span>Blockchain</span>
                </button>
                {onOpenStaffManagement && hasPermission(currentUser, 'STAFF_MANAGE') && (
                  <button
                    onClick={onOpenStaffManagement}
                    className="flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 border border-purple-200 dark:border-purple-800/60"
                    title="Quản lý đội ngũ nhân viên & phân công địa bàn"
                  >
                    <Users className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                    <span>Nhân sự</span>
                  </button>
                )}
              </>
            )}

            {/* --- ROLE: CITIZEN (Công dân sinh thái) --- */}
            {currentUser.role === 'CITIZEN' && (
              <>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'map'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>Bản đồ<span className="hidden xl:inline"> số</span> GIS</span>
                </button>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeTab === 'incidents'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Báo sự cố<span className="hidden xl:inline"> cây</span></span>
                </button>
                {currentUser.id !== 'citizen-guest' && (
                  <button
                    onClick={() => setActiveTab('citizen_portal')}
                    className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer border shrink-0 ${
                      activeTab === 'citizen_portal'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800/60'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Phản ánh của tôi</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Action Zone: QR Scanner, Persona Switcher, Reset */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Quick Notification Bell Button */}
            <button
              onClick={() => setActiveTab('notifications')}
              title={`Xem ${unreadNotifications} thông báo mới của bạn`}
              className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-full border transition-all shadow-2xs whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-amber-50/80 dark:bg-slate-800/90 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-700/90 border-amber-200/80 dark:border-slate-700'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden 2xl:inline">Thông báo</span>
              {unreadNotifications > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white leading-none shadow-xs">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Quick QR Scanner button */}
            <button
              onClick={onOpenQrScanner}
              title="Quét hoặc tra cứu mã QR cây"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-50 dark:bg-slate-800/90 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700/90 text-xs font-semibold rounded-full border border-emerald-200/70 dark:border-slate-700 transition-all shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden 2xl:inline">Quét QR</span>
            </button>

            {/* Nút Đăng nhập hệ thống (Chỉ hiển thị khi là Khách vãng lai chưa đăng nhập) */}
            {currentUser.id === 'citizen-guest' ? (
              <button
                onClick={onOpenLogin}
                title="Đăng nhập tài khoản Người dân hoặc Cán bộ quản lý"
                className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border border-emerald-600 active:scale-95 whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              /* Persona Badge & Profile Menu (Khi đã đăng nhập Người dân hoặc Cán bộ) */
              <div className="relative group shrink-0">
                <button className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 border rounded-full text-xs font-medium transition-colors cursor-pointer shadow-xs ${
                  currentUser.role === 'CITIZEN'
                    ? 'bg-emerald-50 dark:bg-slate-800/90 border-emerald-300 dark:border-slate-700 text-emerald-900 dark:text-slate-100'
                    : 'bg-emerald-50 dark:bg-slate-800/90 border-emerald-300/80 dark:border-slate-700 text-emerald-900 dark:text-slate-100'
                }`}>
                  {currentUser.role === 'CITIZEN' ? (
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="hidden 2xl:inline max-w-[95px] truncate font-bold">{currentUser.fullName}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full text-white shrink-0 ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-emerald-800 dark:bg-emerald-700'
                      : currentUser.role === 'STAFF'
                      ? 'bg-emerald-700 dark:bg-emerald-600'
                      : 'bg-teal-700 dark:bg-teal-600'
                  }`}>
                    {currentUser.role === 'CITIZEN' ? 'ECO' : currentUser.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                </button>

                <div className="absolute right-0 mt-1.5 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-emerald-950/50 p-2 hidden group-hover:block group-focus-within:block z-50 animate-fade-in">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {currentUser.role === 'CITIZEN' ? 'Công dân sinh thái' : 'Tài khoản cán bộ'}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser.fullName}</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      {currentUser.role === 'ADMIN'
                        ? 'Quản trị viên (Toàn quyền On-chain)'
                        : currentUser.role === 'STAFF'
                        ? 'Kỹ thuật viên thực địa'
                        : 'Công dân xanh · 240 Eco-Points'}
                    </div>
                  </div>

                  {currentUser.role === 'CITIZEN' && (
                    <button
                      onClick={() => setActiveTab('citizen_portal')}
                      className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-900 dark:text-emerald-300 font-bold transition-colors cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Hồ sơ &amp; Phản ánh của tôi</span>
                    </button>
                  )}

                  {currentUser.role === 'STAFF' && (
                    <button
                      onClick={() => setActiveTab('staff_workstation')}
                      className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-900 dark:text-emerald-300 font-bold transition-colors cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Bàn làm việc thực địa (Field)</span>
                    </button>
                  )}

                  {currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Mở Dashboard Quản Trị Vĩ Mô</span>
                    </button>
                  )}

                  <button
                    onClick={onOpenLogin}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Đổi tài khoản khác</span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800/80 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    <span>Đăng xuất (Về khách công cộng)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Light / Dark Mode Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={isDark ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
                className="p-1.5 sm:px-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-slate-700 dark:text-amber-400 rounded-full transition-all flex items-center gap-1 border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer text-xs font-semibold backdrop-blur-md shrink-0"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="hidden 2xl:inline text-[11px] text-amber-300 font-medium">Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="hidden 2xl:inline text-[11px] text-slate-700 font-medium">Tối</span>
                  </>
                )}
              </button>
            )}

            {/* Reset Seed button */}
            <button
              onClick={onResetSeed}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 px-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'home'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Trang chủ
          </button>

          {/* STAFF Mobile Items */}
          {currentUser.role === 'STAFF' && (
            <>
              <button
                onClick={() => setActiveTab('staff_workstation')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  activeTab === 'staff_workstation'
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                ⚡ Thực địa
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'map'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Bản đồ GIS
              </button>
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'incidents'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Sự cố giao
              </button>
            </>
          )}

          {/* ADMIN Mobile Items */}
          {currentUser.role === 'ADMIN' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('trees')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'trees'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Hồ sơ cây
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'map'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Bản đồ số
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'care'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Chăm sóc
              </button>
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'incidents'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Sự cố
              </button>
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'blockchain'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Blockchain
              </button>
              {onOpenStaffManagement && hasPermission(currentUser, 'STAFF_MANAGE') && (
                <button
                  onClick={onOpenStaffManagement}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100"
                >
                  👥 Quản lý Nhân sự
                </button>
              )}
            </>
          )}

          {/* CITIZEN Mobile Items */}
          {currentUser.role === 'CITIZEN' && (
            <>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'map'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Bản đồ số
              </button>
              <button
                onClick={() => setActiveTab('incidents')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'incidents'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Báo sự cố
              </button>
              {currentUser.id !== 'citizen-guest' && (
                <button
                  onClick={() => setActiveTab('citizen_portal')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    activeTab === 'citizen_portal'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                  }`}
                >
                  Phản ánh của tôi
                </button>
              )}
            </>
          )}

          {/* Thông báo Mobile (Mọi vai trò) */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'notifications'
                ? 'bg-amber-600 text-white'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
            }`}
          >
            <span>🔔 Thông báo</span>
            {unreadNotifications > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ⛈️ Thanh cảnh báo chạy ngang bão (Nằm sát dưới Navbar, không bị che lấp) */}
      <EmergencyStormTicker onNavigateTrees={() => setActiveTab('trees')} />
    </header>
  );
};
