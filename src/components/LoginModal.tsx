import React, { useState } from 'react';
import {
  X,
  LogIn,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Phone,
  Award,
  Bell,
  HeartHandshake,
} from 'lucide-react';
import { storage } from '../db/storage';
import { User as UserType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer'>('citizen');

  // Citizen Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');

  // Officer Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const users = storage.getUsers();

  // Citizen Submit / Register
  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = citizenName.trim();
    const phone = citizenPhone.trim();

    if (!name) {
      setError('Vui lòng nhập Họ và tên của bạn.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newCitizen: UserType = {
        id: `citizen-${Date.now()}`,
        username: phone ? `citizen_${phone.slice(-4)}` : 'congdan',
        fullName: name,
        role: 'CITIZEN',
        isActive: true,
      };
      onLoginSuccess(newCitizen);
      onClose();
    }, 350);
  };

  const handleQuickCitizenLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoCitizen: UserType = {
        id: 'citizen-demo-an',
        username: 'nguyenvanan',
        fullName: 'Nguyễn Văn An (Công Dân Xanh)',
        role: 'CITIZEN',
        isActive: true,
      };
      onLoginSuccess(demoCitizen);
      onClose();
    }, 300);
  };

  // Officer Quick Login
  const handleQuickOfficerLogin = (selectedUsername: string) => {
    const match = users.find((u) => u.username === selectedUsername);
    if (match) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(match);
        onClose();
      }, 300);
    }
  };

  // Officer Form Submit
  const handleOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Vui lòng nhập tên đăng nhập công vụ.');
      return;
    }

    const match = users.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (!match) {
      setError('Tài khoản không tồn tại trong danh mục Cán bộ / Kỹ thuật viên!');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(match);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0c1812] rounded-3xl shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-emerald-100 dark:border-emerald-500/30 overflow-hidden animate-scale-up">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-xs">
              {activeTab === 'citizen' ? (
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Cổng Đô Thị Thông Minh Cần Thơ</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {activeTab === 'citizen' ? 'Tài Khoản Công Dân Sinh Thái' : 'Đăng Nhập Cán Bộ Quản Trị'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Tab Navigation */}
        <div className="p-2 bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('citizen');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'citizen'
                ? 'bg-white dark:bg-[#0c1812] text-emerald-800 dark:text-emerald-300 shadow-xs dark:border dark:border-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Người Dân / Cộng Đồng</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('officer');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'officer'
                ? 'bg-white dark:bg-[#0c1812] text-emerald-800 dark:text-emerald-300 shadow-xs dark:border dark:border-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cán Bộ / Kỹ Thuật</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CITIZEN ACCOUNT */}
          {activeTab === 'citizen' && (
            <div className="space-y-4">
              {/* Quyền lợi tài khoản người dân */}
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                  Quyền lợi khi đăng nhập Người dân:
                </span>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Lưu &amp; tra cứu lịch sử mọi phản ánh cây xanh của bạn.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Nhận thông báo khi Kỹ thuật viên xử lý xong cây kèm ảnh chụp.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Tích lũy Điểm Sinh Thái &amp; Huy hiệu "Công Dân Xanh Cần Thơ".</span>
                  </div>
                </div>
              </div>

              {/* Nút đăng nhập 1-click dùng thử cho người dân */}
              <button
                type="button"
                onClick={handleQuickCitizenLogin}
                className="w-full p-2.5 bg-emerald-100/60 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/60 rounded-xl text-xs font-bold flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-left">
                  <HeartHandshake className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <div>
                    <div>1-Click: Đăng nhập Công Dân Mẫu</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">Nguyễn Văn An · Đã có 3 phản ánh cây xanh</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Hoặc đăng ký tài khoản mới
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Form Đăng ký / Đăng nhập Người dân */}
              <form onSubmit={handleCitizenSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên của bạn *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="Ví dụ: Lê Thị Hồng Mai"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại (Nhận SMS khi sự cố được giải quyết)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="Ví dụ: 0918xxxxxx"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Đang kích hoạt tài khoản...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Đăng Nhập / Kích Hoạt Tài Khoản Xanh</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: OFFICER ACCOUNT */}
          {activeTab === 'officer' && (
            <div className="space-y-4">
              {/* Quick Select Buttons */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Chọn nhanh tài khoản công vụ
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickOfficerLogin('admin')}
                    className="p-3 text-left rounded-2xl border border-slate-200 dark:border-slate-700/80 dark:bg-slate-900/60 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                        ADMIN
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Đặng Thế Thuận</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Quản trị viên hệ thống</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickOfficerLogin('staff_lam')}
                    className="p-3 text-left rounded-2xl border border-slate-200 dark:border-slate-700/80 dark:bg-slate-900/60 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        STAFF
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Trần Quang Lâm</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Kỹ thuật viên thực địa</div>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Hoặc đăng nhập mật khẩu công vụ
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Form Đăng Nhập Cán Bộ */}
              <form onSubmit={handleOfficerSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên đăng nhập (Username)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin hoặc staff_lam"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu công vụ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu công vụ..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Đang xác thực...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-emerald-400" />
                      <span>Xác nhận Đăng nhập Cán Bộ</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Khách vãng lai gửi phản ánh tự do</span>
          <button
            onClick={onClose}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
