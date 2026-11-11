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
} from 'lucide-react';
import { Role, User } from '../types';
import { storage } from '../db/storage';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  onOpenQrScanner: () => void;
  onResetSeed: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onUserChange,
  onOpenQrScanner,
  onResetSeed,
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
      setActiveTab('incidents');
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
              onClick={() => setActiveTab(currentUser.role === 'CITIZEN' ? 'incidents' : 'dashboard')}
              className="flex items-center gap-2 text-left group focus:outline-none"
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
            {currentUser.role !== 'CITIZEN' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Tổng quan</span>
                </button>

                <button
                  onClick={() => setActiveTab('trees')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'trees'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                  }`}
                >
                  <Trees className="w-3.5 h-3.5" />
                  <span>Hồ sơ cây</span>
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'map'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Bản đồ số</span>
                </button>

                <button
                  onClick={() => setActiveTab('care')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'care'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Chăm sóc</span>
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                activeTab === 'incidents'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Sự cố</span>
            </button>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
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

            {/* Persona Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700 hover:border-emerald-500 transition-colors">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden md:inline max-w-[90px] truncate">{currentUser.fullName}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-600 text-white shrink-0">
                  {currentUser.role}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <div className="absolute right-0 mt-1.5 w-60 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl p-2 hidden group-hover:block group-focus-within:block z-50 animate-fade-in">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chuyển vai trò thử nghiệm
                </div>
                <button
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                    currentUser.role === 'ADMIN' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Đặng Thế Thuận</div>
                    <div className="text-[10px] text-slate-500">Quản trị viên (Admin)</div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-700 text-white font-bold rounded-full">ADMIN</span>
                </button>
                <button
                  onClick={() => handleRoleSelect('STAFF')}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                    currentUser.role === 'STAFF' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Trần Quang Lâm</div>
                    <div className="text-[10px] text-slate-500">Kỹ thuật viên (Staff)</div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-600 text-white font-bold rounded-full">STAFF</span>
                </button>
                <button
                  onClick={() => handleRoleSelect('CITIZEN')}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                    currentUser.role === 'CITIZEN' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Người dân</div>
                    <div className="text-[10px] text-slate-500">Công cộng / Tra cứu / Phản ánh</div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-600 text-white font-bold rounded-full">PUBLIC</span>
                </button>
              </div>
            </div>

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
          {currentUser.role !== 'CITIZEN' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('trees')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'trees' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Hồ sơ cây
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Bản đồ số
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'care' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Chăm sóc
              </button>
            </>
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
