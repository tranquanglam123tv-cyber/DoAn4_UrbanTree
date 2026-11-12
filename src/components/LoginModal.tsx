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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const users = storage.getUsers();

  const handleQuickLogin = (selectedUsername: string) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }

    const match = users.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (!match) {
      setError('Tài khoản không tồn tại trong danh mục Cán bộ / Nhân viên!');
      return;
    }

    // Chấp nhận mật khẩu hợp lệ (mật khẩu demo bất kỳ hoặc các chuỗi demo)
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(match);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-scale-up">
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Cổng Quản Trị Đô Thị</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Đăng Nhập Cán Bộ &amp; Kỹ Thuật
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Notice: Dành riêng cho cán bộ */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lưu ý phân quyền:</span> Người dân tra cứu cây xanh và gửi phản ánh sự cố <strong className="text-emerald-700 underline">hoàn toàn không cần đăng nhập</strong>. Đăng nhập chỉ dành riêng cho Admin và Kỹ thuật viên (Staff).
            </div>
          </div>

          {/* Quick Select Buttons (Dành cho việc trình diễn / demo đồ án nhanh) */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chọn nhanh tài khoản thử nghiệm
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-3 text-left rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                    ADMIN
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-xs font-bold text-slate-900">Đặng Thế Thuận</div>
                <div className="text-[10px] text-slate-500">Quản trị viên hệ thống</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff_lam')}
                className="p-3 text-left rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    STAFF
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-xs font-bold text-slate-900">Trần Quang Lâm</div>
                <div className="text-[10px] text-slate-500">Kỹ thuật viên thực địa</div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Hoặc nhập thông tin đăng nhập
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form Đăng Nhập */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên đăng nhập (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: admin hoặc staff_lam"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu công vụ..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Gợi ý: Nhập bất kỳ để thử nghiệm (Mặc định: <code className="bg-slate-100 px-1 py-0.5 rounded">admin123</code> / <code className="bg-slate-100 px-1 py-0.5 rounded">staff123</code>)
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span>Đang xác thực thông tin...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Xác nhận Đăng nhập</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Người dân không cần đăng nhập</span>
          <button
            onClick={onClose}
            className="text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            Về Trang Chủ Công Cộng
          </button>
        </div>
      </div>
    </div>
  );
};

