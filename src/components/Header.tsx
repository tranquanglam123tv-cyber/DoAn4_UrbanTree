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
} from 'lucide-react';
import { Role, User } from '../types';
import { storage } from '../db/storage';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  onOpenQrScanner: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onResetSeed: () => void;
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
  isDark,
  onToggleTheme,
}) => {
  const users = storage.getUsers();

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
    <header className="sticky top-2 sm:top-3.5 z-40 w-full px-2.5 sm:px-6 lg:px-8 transition-all">
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-full shadow-lg shadow-emerald-950/4 px-3 sm:px-5 py-2">
        <div className="flex items-center justify-between h-11 sm:h-12 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shadow-2xs transition-transform group-hover:scale-105">
                <Trees className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  UrbanTree
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <span className="hidden sm:block text-[10px] text-emerald-600 font-semibold leading-none">
                  Smart Eco-GIS 4.0
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links (Pill Tabs) */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0 bg-slate-100/70 p-1 rounded-full border border-slate-200/60">
            {/* 1. Trang chủ (dành cho mọi người, công cộng) */}
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </button>

            {/* 2. Nút riêng vào Dashboard Quản trị dành cho Admin & Staff */}
            {currentUser.role !== 'CITIZEN' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'text-emerald-800 bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/80'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dashboard Quản trị</span>
              </button>
            )}

            {/* 3. Phân hệ Quản lý Cây cho Nhân viên/Admin */}
            {currentUser.role !== 'CITIZEN' && (
              <>
                <button
                  onClick={() => setActiveTab('trees')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                    activeTab === 'trees'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                  }`}
                >
                  <Trees className="w-3.5 h-3.5" />
                  <span>Hồ sơ cây</span>
                </button>
              </>
            )}

            {/* 4. Bản đồ số GIS (Mọi người dân và nhân viên đều xem được) */}
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Bản đồ số GIS</span>
            </button>

            {/* 5. Chăm sóc (Nhân viên / Admin) */}
            {currentUser.role !== 'CITIZEN' && (
              <button
                onClick={() => setActiveTab('care')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  activeTab === 'care'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Chăm sóc</span>
              </button>
            )}

            {/* 6. Phản ánh Sự cố (Mọi người) */}
            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                activeTab === 'incidents'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Sự cố</span>
            </button>

            {/* 7. Blockchain Proof (Admin) */}
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  activeTab === 'blockchain'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>Blockchain A19</span>
              </button>
            )}
          </nav>

          {/* Action Zone: QR Scanner, Persona Switcher, Reset */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick QR Scanner button */}
            <button
              onClick={onOpenQrScanner}
              title="Quét hoặc tra cứu mã QR cây"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-full border border-emerald-200/70 transition-all shadow-2xs whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Quét QR</span>
            </button>

            {/* Nút Đăng nhập hệ thống (Người dân / Cán bộ) */}
            {currentUser.role === 'CITIZEN' ? (
              <button
                onClick={onOpenLogin}
                title="Đăng nhập tài khoản Người dân hoặc Cán bộ quản lý"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border border-emerald-600 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-200" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              /* Persona Badge & Profile Menu (Khi đã đăng nhập Admin hoặc Staff) */
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-50 border border-emerald-300/80 rounded-full text-xs font-medium text-emerald-900 hover:border-emerald-500 transition-colors cursor-pointer shadow-xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden md:inline max-w-[100px] truncate font-semibold">{currentUser.fullName}</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-700 text-white shrink-0">
                    {currentUser.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                <div className="absolute right-0 mt-1.5 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl p-2 hidden group-hover:block group-focus-within:block z-50 animate-fade-in">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tài khoản cán bộ
                    </div>
                    <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                    <div className="text-[10px] text-emerald-700 font-medium">Vai trò: {currentUser.role === 'ADMIN' ? 'Quản trị viên (Toàn quyền)' : 'Kỹ thuật viên thực địa'}</div>
                  </div>

                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-emerald-50 text-slate-800 font-semibold transition-colors cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Mở Dashboard Quản Trị</span>
                  </button>

                  <button
                    onClick={onOpenLogin}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>Đổi tài khoản cán bộ khác</span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-rose-50 text-rose-700 font-semibold transition-colors cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Đăng xuất (Về quyền Người dân)</span>
                  </button>

                  <div className="pt-2 mt-1 border-t border-slate-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chuyển nhanh thử nghiệm
                    </div>
                    <button
                      onClick={() => handleRoleSelect('ADMIN')}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-slate-50 text-slate-600 flex items-center justify-between"
                    >
                      <span>Admin: Đặng Thế Thuận</span>
                      <span className="text-[8px] px-1 bg-slate-200 rounded">ADMIN</span>
                    </button>
                    <button
                      onClick={() => handleRoleSelect('STAFF')}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-slate-50 text-slate-600 flex items-center justify-between"
                    >
                      <span>Staff: Trần Quang Lâm</span>
                      <span className="text-[8px] px-1 bg-slate-200 rounded">STAFF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Light / Dark Mode Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={isDark ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 rounded-full transition-colors flex items-center gap-1.5 border border-slate-300 dark:border-slate-600 shadow-xs cursor-pointer text-xs font-semibold"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-[11px] text-amber-300">Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" />
                    <span className="hidden sm:inline text-[11px] text-slate-700">Tối</span>
                  </>
                )}
              </button>
            )}

            {/* Reset Seed button */}
            <button
              onClick={onResetSeed}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pt-2 pb-1 border-t border-slate-100 px-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'home' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trang chủ
          </button>
          {currentUser.role !== 'CITIZEN' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'dashboard' ? 'bg-emerald-700 text-white font-bold' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('trees')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'trees' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Hồ sơ cây
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bản đồ số
          </button>
          {currentUser.role !== 'CITIZEN' && (
            <button
              onClick={() => setActiveTab('care')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'care' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Chăm sóc
            </button>
          )}
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'incidents' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sự cố
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('blockchain')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'blockchain' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Blockchain
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
