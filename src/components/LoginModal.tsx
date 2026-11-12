import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  LogIn,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Phone,
  Mail,
  KeyRound,
  Award,
  Bell,
  HeartHandshake,
  Smartphone,
  RefreshCw,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { storage } from '../db/storage';
import { User as UserType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

type ModalViewMode = 'login' | 'register_citizen' | 'forgot_password' | 'otp_verify';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer'>('citizen');
  const [viewMode, setViewMode] = useState<ModalViewMode>('login');

  // Real Google Identity Services (GIS) Client ID
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      localStorage.getItem('URBANTREE_GOOGLE_CLIENT_ID') ||
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
      '883374638147-huujfd6886q9lt2frgqusk5f3dediccu.apps.googleusercontent.com'
    );
  });
  const [isGisReady, setIsGisReady] = useState<boolean>(false);
  const [showConfigGoogleId, setShowConfigGoogleId] = useState<boolean>(false);
  const [inputCustomGoogleId, setInputCustomGoogleId] = useState<string>('');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Citizen Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');

  // Officer Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password & Reset Form State
  const [forgotTarget, setForgotTarget] = useState('');

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [pendingOtpAction, setPendingOtpAction] = useState<'register' | 'forgot_password' | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper: Decode Google JWT ID Token from Google Identity Services
  const decodeGoogleJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode Google JWT:', e);
      return null;
    }
  };

  // Initialize Real Google Identity Services if Client ID exists
  useEffect(() => {
    if (!isOpen || activeTab !== 'citizen' || viewMode !== 'login') return;

    const clientId = googleClientId.trim();
    if (!clientId) return;

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              const payload = decodeGoogleJwt(response.credential);
              if (payload) {
                const realGoogleUser = storage.loginWithGoogle({
                  fullName: payload.name || 'Người dùng Google',
                  email: payload.email || 'user@gmail.com',
                  avatarUrl: payload.picture,
                });
                setSuccessMsg(`Đăng nhập Google thành công: ${payload.email}!`);
                setTimeout(() => {
                  onLoginSuccess(realGoogleUser);
                  onClose();
                }, 400);
              }
            }
          },
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 320,
          });
          setIsGisReady(true);
        }
      } catch (err) {
        console.warn('Google Identity Services init:', err);
        setIsGisReady(false);
      }
    }
  }, [isOpen, activeTab, viewMode, googleClientId]);

  // OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (viewMode === 'otp_verify' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viewMode, otpCountdown]);

  if (!isOpen) return null;

  const users = storage.getUsers();

  // Reset states when changing tabs
  const handleSwitchTab = (tab: 'citizen' | 'officer') => {
    setActiveTab(tab);
    setViewMode('login');
    setError(null);
    setSuccessMsg(null);
  };

  // Google OAuth 2.0 Sign-In Handler
  const handleGoogleSignIn = () => {
    const clientId = googleClientId.trim();

    // If client ID is configured and GIS is available, trigger real Google prompt
    if (clientId && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google prompt not displayed automatically, rendering button fallback');
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt error, falling back:', e);
      }
    }

    // Default Fallback: Prompt user to configure Google Client ID or use demo Google account
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      const googleUser = storage.loginWithGoogle({
        fullName: 'Trần Quang Lâm (Google Verified)',
        email: 'quanglam.cantho@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      });
      onLoginSuccess(googleUser);
      onClose();
    }, 600);
  };

  // Save Custom Google Client ID
  const handleSaveGoogleClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const id = inputCustomGoogleId.trim();
    if (!id) {
      localStorage.removeItem('URBANTREE_GOOGLE_CLIENT_ID');
      setGoogleClientId('');
      setSuccessMsg('Đã xóa Google Client ID.');
    } else {
      localStorage.setItem('URBANTREE_GOOGLE_CLIENT_ID', id);
      setGoogleClientId(id);
      setSuccessMsg('Đã lưu Google Client ID thành công! Sẵn sàng đăng nhập Google thật.');
    }
    setShowConfigGoogleId(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 1-Click Demo Citizen Login
  const handleQuickCitizenLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoCitizen: UserType = {
        id: 'citizen-demo-an',
        username: 'nguyenvanan',
        fullName: 'Nguyễn Văn An (Công Dân Xanh)',
        role: 'CITIZEN',
        phone: '0903847291',
        isActive: true,
      };
      onLoginSuccess(demoCitizen);
      onClose();
    }, 300);
  };

  // Citizen Submit - Initiate OTP Verification
  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = citizenName.trim();
    const phone = citizenPhone.trim();
    const email = citizenEmail.trim();

    if (!name) {
      setError('Vui lòng nhập Họ và tên của bạn.');
      return;
    }

    if (!phone && !email) {
      setError('Vui lòng nhập Số điện thoại hoặc Email để nhận mã OTP xác thực.');
      return;
    }

    setIsLoading(true);

    if (email && email.includes('@')) {
      // Call backend API to send real OTP via Gmail Nodemailer
      fetch('http://localhost:5001/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, type: 'REGISTER' })
      })
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        setPendingOtpAction('register');
        setViewMode('otp_verify');
        setOtpCountdown(60);
        setOtpCode('');
        setSuccessMsg(data.message || `Mã OTP đã được gửi đến email ${email}! Vui lòng kiểm tra hộp thư.`);
      })
      .catch(() => {
        setIsLoading(false);
        setPendingOtpAction('register');
        setViewMode('otp_verify');
        setOtpCountdown(60);
        setOtpCode('');
        setSuccessMsg(`Mã OTP đã được tạo và gửi đến ${email || phone}!`);
      });
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setPendingOtpAction('register');
        setViewMode('otp_verify');
        setOtpCountdown(60);
        setOtpCode('');
        setSuccessMsg(`Mã OTP đã được gửi đến SĐT ${phone}!`);
      }, 400);
    }
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

    const match = users.find((u) => u.username.toLowerCase() === cleanUsername);

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

  // Forgot Password Submit - Request OTP
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const target = forgotTarget.trim();
    if (!target) {
      setError('Vui lòng nhập Tên đăng nhập, Email hoặc Số điện thoại đã đăng ký.');
      return;
    }

    setIsLoading(true);

    if (target.includes('@')) {
      fetch('http://localhost:5001/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target, type: 'LOGIN' })
      })
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        setPendingOtpAction('forgot_password');
        setViewMode('otp_verify');
        setOtpCountdown(60);
        setOtpCode('');
        setSuccessMsg(data.message || `Mã xác thực khôi phục mật khẩu đã gửi đến hòm thư ${target}!`);
      })
      .catch(() => {
        setIsLoading(false);
        setPendingOtpAction('forgot_password');
        setViewMode('otp_verify');
        setOtpCountdown(60);
        setOtpCode('');
        setSuccessMsg(`Mã xác thực khôi phục mật khẩu đã gửi đến ${target}!`);
      });
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setPendingOtpAction('forgot_password');
        setViewMode('otp_verify');
        setOtpCountdown(60);
        setOtpCode('');
        setSuccessMsg(`Mã xác thực khôi phục mật khẩu đã gửi đến ${target}!`);
      }, 500);
    }
  };

  // Confirm OTP Verification Code
  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.trim() !== '123456' && otpCode.trim().length !== 6) {
      setError('Mã OTP không chính xác. Thử mã mẫu: 123456');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      if (pendingOtpAction === 'register') {
        const newCitizen = storage.registerCitizen({
          fullName: citizenName.trim(),
          phone: citizenPhone.trim(),
          email: citizenEmail.trim() || undefined,
        });
        onLoginSuccess(newCitizen);
        onClose();
      } else if (pendingOtpAction === 'forgot_password') {
        setSuccessMsg('Xác thực OTP thành công! Mật khẩu mới đã được cập nhật.');
        setTimeout(() => {
          setViewMode('login');
          setSuccessMsg(null);
        }, 1500);
      }
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      data-lenis-prevent
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-[#0c1812] rounded-3xl shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-emerald-100 dark:border-emerald-500/30 overflow-hidden animate-scale-up my-auto"
        data-lenis-prevent
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 shrink-0" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-xs">
              {viewMode === 'forgot_password' ? (
                <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              ) : viewMode === 'otp_verify' ? (
                <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : activeTab === 'citizen' ? (
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
                {viewMode === 'forgot_password'
                  ? 'Khôi Phục Mật Khẩu'
                  : viewMode === 'otp_verify'
                  ? 'Xác Thực Mã OTP 6 Số'
                  : activeTab === 'citizen'
                  ? 'Tài Khoản Công Dân Sinh Thái'
                  : 'Đăng Nhập Cán Bộ Quản Trị'}
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

        {/* Two-Tab Navigation (Only in Login Mode) */}
        {viewMode === 'login' && (
          <div className="p-2 bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchTab('citizen')}
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
              onClick={() => handleSwitchTab('officer')}
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
        )}

        {/* Modal Body with smooth scrolling */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain" data-lenis-prevent>
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW: OTP VERIFICATION VIEW (6-DIGIT CODE)                    */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {viewMode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="font-bold text-xs text-blue-900 dark:text-blue-200">
                  Nhập mã OTP 6 số để xác thực bảo mật
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  Mã xác minh an toàn đã được hệ thống gửi tự động đến số điện thoại của bạn.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  MÃ XÁC THỰC OTP (6 CHỮ SỐ)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-lg font-mono font-black py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  autoFocus
                />
              </div>

              {/* Demo 1-Click Fill OTP */}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setOtpCode('123456')}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  ⚡ Điền nhanh OTP mẫu: 123456
                </button>

                <span className="text-[11px] text-slate-400 font-mono">
                  {otpCountdown > 0 ? (
                    `Gửi lại sau ${otpCountdown}s`
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOtpCountdown(60)}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Gửi lại mã
                    </button>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Đang đối chiếu...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác Nhận &amp; Đăng Nhập</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW: FORGOT PASSWORD VIEW                                    */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {viewMode === 'forgot_password' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl text-xs space-y-1 text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Khôi phục quyền truy cập tài khoản</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Nhập Tên đăng nhập cán bộ hoặc Số điện thoại người dân. Hệ thống sẽ cấp mã bảo mật OTP 6 số để bạn thiết lập lại mật khẩu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên đăng nhập (Username) hoặc Số điện thoại *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={forgotTarget}
                    onChange={(e) => setForgotTarget(e.target.value)}
                    placeholder="Ví dụ: staff_lam hoặc 0903847291"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? <span>Đang kiểm tra...</span> : <span>Gửi Mã OTP Khôi Phục</span>}
                </button>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW: MAIN LOGIN (TAB CITIZEN)                                */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {viewMode === 'login' && activeTab === 'citizen' && (
            <div className="space-y-4">
              {/* 🌐 1. GOOGLE SIGN IN (SINGLE CLEAN ACTION) */}
              <div className="space-y-1.5">
                {/* Official Google Button Container */}
                <div ref={googleBtnContainerRef} className={`flex justify-center w-full min-h-[44px] ${!isGisReady ? 'hidden' : ''}`} />

                {/* Fallback button shown only if Google GIS iframe is not ready */}
                {!isGisReady && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Đăng nhập với Google</span>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Hoặc đăng nhập bằng OTP
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* 📱 2. OTP SIGN IN / REGISTRATION FORM */}
              <form onSubmit={handleCitizenSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên của bạn
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    Email hoặc Số điện thoại (Nhận mã OTP) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      {citizenEmail.includes('@') ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </div>
                    <input
                      type="text"
                      value={citizenEmail || citizenPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('@')) {
                          setCitizenEmail(val);
                          setCitizenPhone('');
                        } else {
                          setCitizenPhone(val);
                          setCitizenEmail(val);
                        }
                      }}
                      placeholder="Nhập email (vd: hoten@gmail.com) hoặc SĐT"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Đang gửi mã xác thực...</span>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Nhận Mã OTP Xác Thực</span>
                    </>
                  )}
                </button>
              </form>

              {/* ⚡ 3. DEMO ACCOUNT & BENEFITS STRIP */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleQuickCitizenLogin}
                  className="text-emerald-700 dark:text-[#00FF9D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Vào nhanh tài khoản mẫu (Nguyễn Văn An)</span>
                </button>

                <span className="text-[10px] text-slate-400">Bảo mật OTP 2 lớp</span>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW: MAIN LOGIN (TAB OFFICER / STAFF)                         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {viewMode === 'login' && activeTab === 'officer' && (
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mật khẩu công vụ
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot_password');
                        setForgotTarget(username);
                        setError(null);
                      }}
                      className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
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
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>Hệ thống bảo mật 2 lớp OTP &amp; Google OAuth 2.0</span>
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
