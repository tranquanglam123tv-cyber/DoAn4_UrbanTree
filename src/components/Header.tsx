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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E0EBDD] transition-colors w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveTab(currentUser.role === 'CITIZEN' ? 'incidents' : 'dashboard')}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#174B36] flex items-center justify-center text-[#F3E8B2] shadow-sm transition-transform group-hover:scale-105">
                <Trees className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#174B36] flex items-center gap-1.5">
                  UrbanTree
                </span>
                <span className="hidden sm:block text-[11px] text-[#4C956C] font-medium leading-none">
                  Quản lý Cây xanh & Blockchain
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
            {currentUser.role !== 'CITIZEN' && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'bg-[#174B36] text-white shadow-xs'
                      : 'text-[#1E2922]/70 hover:text-[#174B36] hover:bg-[#E0EBDD]/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Tổng quan</span>
                </button>

                <button
                  onClick={() => setActiveTab('trees')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'trees'
                      ? 'bg-[#174B36] text-white shadow-xs'
                      : 'text-[#1E2922]/70 hover:text-[#174B36] hover:bg-[#E0EBDD]/60'
                  }`}
                >
                  <Trees className="w-4 h-4" />
                  <span>Hồ sơ cây</span>
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'map'
                      ? 'bg-[#174B36] text-white shadow-xs'
                      : 'text-[#1E2922]/70 hover:text-[#174B36] hover:bg-[#E0EBDD]/60'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Bản đồ số</span>
                </button>

                <button
                  onClick={() => setActiveTab('care')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                    activeTab === 'care'
                      ? 'bg-[#174B36] text-white shadow-xs'
                      : 'text-[#1E2922]/70 hover:text-[#174B36] hover:bg-[#E0EBDD]/60'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Nhật ký chăm sóc</span>
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                activeTab === 'incidents'
                  ? 'bg-[#174B36] text-white shadow-xs'
                  : 'text-[#1E2922]/70 hover:text-[#174B36] hover:bg-[#E0EBDD]/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Sự cố & Phản ánh</span>
            </button>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
                  activeTab === 'blockchain'
                    ? 'bg-[#174B36] text-white shadow-xs'
                    : 'text-[#1E2922]/70 hover:text-[#174B36] hover:bg-[#E0EBDD]/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Blockchain A19</span>
              </button>
            )}
          </nav>

          {/* Action Zone: QR Scanner, Persona Switcher, Reset */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick QR Scanner button */}
            <button
              onClick={onOpenQrScanner}
              title="Quét hoặc tra cứu mã QR cây"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-[#E0EBDD] text-[#174B36] hover:bg-[#d0dfcc] text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Quét QR</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 sm:gap-2 px-2 sm:pl-2.5 sm:pr-2 py-1.5 bg-[#F6F5EC] border border-[#E0EBDD] rounded-lg text-xs font-medium text-[#174B36] hover:border-[#347A50] transition-colors">
                <UserCheck className="w-3.5 h-3.5 text-[#347A50] shrink-0" />
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.fullName}</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#174B36] text-[#F3E8B2] shrink-0">
                  {currentUser.role}
                </span>
                <ChevronDown className="w-3 h-3 text-[#174B36]/60 shrink-0" />
              </button>

              <div className="absolute right-0 mt-1 w-56 bg-white border border-[#E0EBDD] rounded-xl shadow-lg p-1.5 hidden group-hover:block group-focus-within:block z-50">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-[#1E2922]/60 uppercase tracking-wider">
                  Chuyển vai trò thử nghiệm
                </div>
                <button
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                    currentUser.role === 'ADMIN' ? 'bg-[#E0EBDD] text-[#174B36] font-semibold' : 'text-[#1E2922] hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>Đặng Thế Thuận</div>
                    <div className="text-[10px] text-slate-500">Quản trị viên (Admin)</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#174B36] text-white rounded">ADMIN</span>
                </button>
                <button
                  onClick={() => handleRoleSelect('STAFF')}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                    currentUser.role === 'STAFF' ? 'bg-[#E0EBDD] text-[#174B36] font-semibold' : 'text-[#1E2922] hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>Trần Quang Lâm</div>
                    <div className="text-[10px] text-slate-500">Kỹ thuật viên (Staff)</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#347A50] text-white rounded">STAFF</span>
                </button>
                <button
                  onClick={() => handleRoleSelect('CITIZEN')}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                    currentUser.role === 'CITIZEN' ? 'bg-[#E0EBDD] text-[#174B36] font-semibold' : 'text-[#1E2922] hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>Người dân</div>
                    <div className="text-[10px] text-slate-500">Công cộng / Tra cứu / Phản ánh</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#4C956C] text-white rounded">PUBLIC</span>
                </button>
              </div>
            </div>

            {/* Reset Seed button */}
            <button
              onClick={onResetSeed}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="p-1.5 text-slate-400 hover:text-[#174B36] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile & Tablet secondary navigation */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-[#E0EBDD]/60 px-1 scrollbar-none">
          {currentUser.role !== 'CITIZEN' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-[#174B36] text-white' : 'text-slate-600'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('trees')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  activeTab === 'trees' ? 'bg-[#174B36] text-white' : 'text-slate-600'
                }`}
              >
                Cây xanh
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  activeTab === 'map' ? 'bg-[#174B36] text-white' : 'text-slate-600'
                }`}
              >
                Bản đồ
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  activeTab === 'care' ? 'bg-[#174B36] text-white' : 'text-slate-600'
                }`}
              >
                Chăm sóc
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'incidents' ? 'bg-[#174B36] text-white' : 'text-slate-600'
            }`}
          >
            Sự cố
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('blockchain')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                activeTab === 'blockchain' ? 'bg-[#174B36] text-white' : 'text-slate-600'
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
