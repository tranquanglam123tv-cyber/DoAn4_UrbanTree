import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Trees,
  ShieldCheck,
  Send,
  Plus,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Heart,
  TrendingUp,
  Phone,
  Calendar,
  Layers,
  QrCode,
  Star,
  Filter,
  Search,
  Share2,
  Check,
  RefreshCw,
  Leaf,
  Droplets,
  Zap,
  Gift,
  Info,
  Eye,
  ArrowUpRight,
  Copy,
  Radio,
  Bookmark,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
} from 'lucide-react';
import { storage } from '../db/storage';
import { Incident, Tree, User } from '../types';

interface CitizenPortalViewProps {
  currentUser: User;
  onNavigateToNewReport: (treeId?: string) => void;
  onSelectTree: (tree: Tree) => void;
  onOpenMap: () => void;
}

type SubTab = 'reports' | 'trees' | 'badges' | 'transparency';

export const CitizenPortalView: React.FC<CitizenPortalViewProps> = ({
  currentUser,
  onNavigateToNewReport,
  onSelectTree,
  onOpenMap,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('reports');
  const [reportFilter, setReportFilter] = useState<'ALL' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [redeemedReward, setRedeemedReward] = useState<string | null>(null);

  // Re-report (Tái báo cáo khi chưa ổn thỏa) state
  const [reopenModalIncident, setReopenModalIncident] = useState<Incident | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenImageUrl, setReopenImageUrl] = useState('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);
  const [reopenSuccessMsg, setReopenSuccessMsg] = useState<string | null>(null);

  const incidents = storage.getIncidents();
  const trees = storage.getTrees();

  // Filter incidents reported by this citizen:
  // ONLY show demo incidents if logged in with the demo account 'nguyenvanan'.
  // Any real or newly registered user/Google account starts with their own real data (empty initially).
  const myIncidents = useMemo(() => {
    const isExplicitDemoUser = currentUser.id === 'citizen-demo-an' || currentUser.username === 'nguyenvanan';

    if (isExplicitDemoUser) {
      return incidents.filter(
        (inc) =>
          inc.reporterName?.toLowerCase().includes('nguyễn văn an') ||
          inc.reporterPhone === '0903847291'
      );
    }

    // New or real user: strictly filter by matching phone, email, or exact full name
    return incidents.filter((inc) => {
      const matchPhone = Boolean(currentUser.phone && inc.reporterPhone && inc.reporterPhone === currentUser.phone);
      const matchEmail = Boolean(currentUser.email && inc.reporterPhone && inc.reporterPhone.toLowerCase() === currentUser.email.toLowerCase());
      const matchName = Boolean(inc.reporterName && currentUser.fullName && inc.reporterName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase());
      return matchPhone || matchEmail || matchName;
    });
  }, [incidents, currentUser]);

  // Filtered by sub-status & search
  const filteredIncidents = useMemo(() => {
    return myIncidents.filter((inc) => {
      const matchStatus =
        reportFilter === 'ALL'
          ? true
          : reportFilter === 'RESOLVED'
          ? inc.status === 'RESOLVED'
          : reportFilter === 'REOPENED'
          ? inc.status === 'REOPENED'
          : inc.status === 'IN_PROGRESS' || inc.status === 'RECEIVED' || inc.status === 'ASSIGNED';

      const matchSearch =
        !searchQuery.trim() ||
        inc.publicCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.address && inc.address.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStatus && matchSearch;
    });
  }, [myIncidents, reportFilter, searchQuery]);

  // Dynamic metrics: for new accounts with 0 reports, all values start at 0
  const resolvedCount = myIncidents.filter((i) => i.status === 'RESOLVED').length;
  const inProgressCount = myIncidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'REOPENED').length;
  const reopenedCount = myIncidents.filter((i) => i.status === 'REOPENED').length;
  const totalPoints = myIncidents.length * 100 + resolvedCount * 50;
  const carbonOffsetKg = myIncidents.length === 0 ? '0.0' : (myIncidents.length * 24.6 + resolvedCount * 18.2).toFixed(1);

  // Favorite / Followed trees: New accounts start with 0 followed trees (no fake pre-filled trees)
  const followedTrees = useMemo(() => {
    const isExplicitDemoUser = currentUser.id === 'citizen-demo-an' || currentUser.username === 'nguyenvanan';
    if (isExplicitDemoUser) {
      return trees.slice(0, 3);
    }
    return [];
  }, [trees, currentUser]);

  // Dynamic Citizen Tier & Level (Calculated dynamically based on real user activity)
  const citizenTier = useMemo(() => {
    const count = myIncidents.length;
    if (count >= 10) {
      return {
        level: 4,
        tierName: 'Hạng Kim Cương',
        title: 'Hiệp Sĩ Rừng Cổ Thụ',
        badgeIcon: '💎',
        colorClass: 'from-cyan-400 to-blue-600',
        nextTargetText: 'Đã đạt Cấp Bậc Tối Cao',
        remainingToNext: 0,
        progressPercent: 100,
        targetCount: 10,
        statusDesc: 'Danh hiệu danh dự tối cao của Thành phố',
      };
    } else if (count >= 5) {
      return {
        level: 3,
        tierName: 'Hạng Vàng',
        title: 'Đại Sứ Môi Trường Tây Đô',
        badgeIcon: '🥇',
        colorClass: 'from-amber-400 to-yellow-600',
        nextTargetText: '💎 Hiệp Sĩ Rừng Cổ Thụ (Hạng Kim Cương)',
        remainingToNext: 10 - count,
        progressPercent: Math.min(100, Math.round(((count - 5) / 5) * 100)),
        targetCount: 10,
        statusDesc: 'Uy tín cấp độ 3 · Ưu tiên xử lý nhanh',
      };
    } else if (count >= 2) {
      return {
        level: 2,
        tierName: 'Hạng Bạc',
        title: 'Vệ Binh Rừng Phố',
        badgeIcon: '🥈',
        colorClass: 'from-slate-300 to-teal-500',
        nextTargetText: '🥇 Đại Sứ Môi Trường Tây Đô (Hạng Vàng)',
        remainingToNext: 5 - count,
        progressPercent: Math.min(100, Math.round(((count - 2) / 3) * 100)),
        targetCount: 5,
        statusDesc: 'Uy tín cấp độ 2 · Tích cực bảo vệ cây xanh',
      };
    } else if (count >= 1) {
      return {
        level: 1,
        tierName: 'Hạng Đồng',
        title: 'Mầm Xanh Tiên Phong',
        badgeIcon: '🌱',
        colorClass: 'from-emerald-400 to-teal-700',
        nextTargetText: '🥈 Vệ Binh Rừng Phố (Hạng Bạc)',
        remainingToNext: 2 - count,
        progressPercent: 50,
        targetCount: 2,
        statusDesc: 'Uy tín cấp độ 1 · Đã có đóng góp đầu tiên',
      };
    } else {
      // 0 incidents - Brand new citizen
      return {
        level: 0,
        tierName: 'Công Dân Mới',
        title: 'Cộng Tác Viên Khởi Động',
        badgeIcon: '🌿',
        colorClass: 'from-emerald-600 to-teal-900',
        nextTargetText: '🌱 Mầm Xanh Tiên Phong (Hạng Đồng)',
        remainingToNext: 1,
        progressPercent: 0,
        targetCount: 1,
        statusDesc: 'Tài khoản mới · Hãy gửi phản ánh đầu tiên để thăng hạng',
      };
    }
  }, [myIncidents.length]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRate = (incidentId: string, star: number) => {
    setRatings((prev) => ({ ...prev, [incidentId]: star }));
  };

  const handleSubmitReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenModalIncident || !reopenReason.trim()) return;

    setIsSubmittingReopen(true);
    try {
      await storage.reopenIncident({
        incidentId: reopenModalIncident.id,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        reason: reopenReason.trim(),
        imageUrl: reopenImageUrl.trim() || undefined,
      });
      setReopenSuccessMsg(`Đã gửi yêu cầu tái xử lý cho sự cố [${reopenModalIncident.publicCode}]! Đội cơ động Cần Thơ đã tiếp nhận lệnh ưu tiên cao.`);
      setReopenModalIncident(null);
      setReopenReason('');
      setReopenImageUrl('');
      setTimeout(() => setReopenSuccessMsg(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const citizenCardNumber = `CT-ECO·2026·${currentUser.username ? currentUser.username.slice(0, 4).toUpperCase() : '8892'}`;

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 🧭 1. BREADCRUMB & WELCOME BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-[#0c1812]/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-2xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-800 dark:text-emerald-400">Cổng Dịch Vụ Đô Thị Số</span>
          <span>/</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">Công Dân Sinh Thái Tây Đô</span>
          <span>/</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Hồ Sơ &amp; Phản Ánh Của Tôi</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Thẻ QR Công Dân</span>
          </button>

          <button
            onClick={() => onNavigateToNewReport()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Báo Sự Cố Cây</span>
          </button>
        </div>
      </div>

      {/* 💳 2. DIGITAL ECO-CITIZEN PASS (THẺ CĂN CƯỚC SINH THÁI SỐ CẦN THƠ) */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl dark:shadow-[0_8px_40px_rgba(16,185,129,0.12)] transition-all duration-300 border border-emerald-200/90 dark:border-emerald-400/30 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 dark:from-[#05130b] dark:via-[#092218] dark:to-[#040e09] text-slate-800 dark:text-white p-6 sm:p-8">
        {/* Ambient Botanical Glass Orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-400/10 dark:bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle Decorative Circuit / Leaf Watermark */}
        <div className="absolute right-6 top-6 opacity-5 dark:opacity-10 pointer-events-none">
          <Trees className="w-48 h-48 text-emerald-800 dark:text-emerald-200" />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Card Top Strip: Smart Chip, Contactless Wave, Card ID */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              {/* Metallic Smart Chip Visual */}
              <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-md border border-amber-300/60 p-1 flex items-center justify-center relative overflow-hidden">
                <div className="w-full h-full border border-amber-800/40 rounded-xs flex flex-col justify-between py-0.5">
                  <div className="h-[1px] bg-amber-900/40 w-full" />
                  <div className="h-[1px] bg-amber-900/40 w-full" />
                  <div className="h-[1px] bg-amber-900/40 w-full" />
                </div>
              </div>
              {/* NFC Wave */}
              <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300/80">
                <Radio className="w-4 h-4 rotate-90" />
                <span className="text-[10px] font-mono tracking-widest uppercase">NFC · SMART ECO-PASS</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-900 dark:text-emerald-300/90 font-bold bg-emerald-100/70 dark:bg-white/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-white/10 backdrop-blur-xs">
                {citizenCardNumber}
              </span>
              <button
                onClick={() => handleCopy(citizenCardNumber, 'card_num')}
                title="Sao chép số thẻ công dân"
                className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-white/15 text-emerald-800 dark:text-emerald-300 transition-colors"
              >
                {copiedCode === 'card_num' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Card Middle: Profile Details & Rank */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar with Botanical Ring */}
              <div className="relative shrink-0">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 p-0.5 shadow-xl">
                  <div className="w-full h-full bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-[14px] flex items-center justify-center text-emerald-700 dark:text-emerald-300 overflow-hidden relative">
                    <span className="text-2xl font-black font-mono tracking-wider">
                      {currentUser.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(-2)
                        .join('')}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 dark:from-emerald-950/60 to-transparent" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-400/20 border border-emerald-300 dark:border-emerald-400/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                  CỘNG TÁC VIÊN SINH THÁI TÂY ĐÔ
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentUser.fullName}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-600 dark:text-emerald-200/80">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>0912 ··· 678</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Q. Ninh Kiều, Cần Thơ</span>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-300/70 font-mono text-[11px]">
                    Tham gia: Tháng 11/2026
                  </span>
                </div>
              </div>
            </div>

            {/* Rank Badge Visual - 100% Dynamic */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-black/30 backdrop-blur-xl border border-emerald-200/80 dark:border-emerald-500/20 flex items-center gap-3.5 self-start md:self-center shadow-sm dark:shadow-lg">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${citizenTier.colorClass} flex items-center justify-center text-slate-950 font-black text-2xl shadow-md`}>
                {citizenTier.badgeIcon}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-200 tracking-wider">
                  Cấp Bậc Công Dân
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {citizenTier.title}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-200/90 font-medium">
                  {citizenTier.tierName} {citizenTier.level > 0 ? `· Cấp độ ${citizenTier.level}` : '· Thành viên mới'}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Interactive Eco Impact Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-emerald-200/80 dark:border-emerald-500/20 backdrop-blur-md transition-all text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                {totalPoints}
              </div>
              <div className="text-[10px] uppercase font-bold text-emerald-800/70 dark:text-emerald-100/70 tracking-wider mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Điểm Eco-Karma</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-teal-200/80 dark:border-emerald-500/20 backdrop-blur-md transition-all text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-cyan-300 font-mono">
                {myIncidents.length}
              </div>
              <div className="text-[10px] uppercase font-bold text-teal-800/70 dark:text-cyan-100/70 tracking-wider mt-0.5 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-teal-600 dark:text-cyan-400" />
                <span>Phản Ánh Đã Gửi</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-amber-200/80 dark:border-emerald-500/20 backdrop-blur-md transition-all text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 font-mono">
                {followedTrees.length}
              </div>
              <div className="text-[10px] uppercase font-bold text-amber-800/70 dark:text-amber-100/70 tracking-wider mt-0.5 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>Cây Đang Bảo Trợ</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-emerald-200/80 dark:border-emerald-500/20 backdrop-blur-md transition-all text-center shadow-2xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-teal-300 font-mono">
                {carbonOffsetKg} <span className="text-xs font-normal text-emerald-600 dark:text-teal-200">kg</span>
              </div>
              <div className="text-[10px] uppercase font-bold text-emerald-800/70 dark:text-teal-100/70 tracking-wider mt-0.5 flex items-center justify-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-600 dark:text-teal-400" />
                <span>CO₂ Giảm Thiểu</span>
              </div>
            </div>
          </div>

          {/* Tier Progression Bar - 100% Dynamic */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-emerald-200/90">
              <span className="flex items-center gap-1.5 font-medium">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                <span>Mục tiêu tiếp theo: <strong>{citizenTier.nextTargetText}</strong></span>
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-transparent">
                {myIncidents.length} / {citizenTier.targetCount} Phản ánh {citizenTier.remainingToNext > 0 ? `(Cần thêm ${citizenTier.remainingToNext})` : '(Đạt tối đa)'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/80 dark:bg-black/40 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                style={{ width: `${citizenTier.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 3. SUB-TAB NAVIGATION PILLS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-[#070e0a]/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-emerald-500/20 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'reports'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)] border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Lịch Sử Phản Ánh Của Tôi</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono">
            {myIncidents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('trees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'trees'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)] border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Cây Tôi Đang Theo Dõi</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-mono">
            {followedTrees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('badges')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'badges'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)] border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Huy Hiệu &amp; Đổi Quà Sinh Thái</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-mono">
            4 Đã mở
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('transparency')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'transparency'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)] border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Minh Bạch Blockchain</span>
        </button>
      </div>

      {/* 🌟 4. TAB CONTENT 1: LỊCH SỬ PHẢN ÁNH CỦA TÔI */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Controls: Search & Filters */}
          <div className="bg-white dark:bg-[#0c1812] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-emerald-500/20 shadow-2xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setReportFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reportFilter === 'ALL'
                    ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Tất cả ({myIncidents.length})
              </button>
              <button
                onClick={() => setReportFilter('IN_PROGRESS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  reportFilter === 'IN_PROGRESS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Đang xử lý ({inProgressCount})</span>
              </button>
              <button
                onClick={() => setReportFilter('RESOLVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  reportFilter === 'RESOLVED'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã giải quyết ({resolvedCount})</span>
              </button>
              <button
                onClick={() => setReportFilter('REOPENED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  reportFilter === 'REOPENED'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cần làm lại ({reopenedCount})</span>
              </button>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã vé INC-, tên đường, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:bg-[#091510] transition-all"
              />
            </div>
          </div>

          {/* Reopen Success Alert */}
          {reopenSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{reopenSuccessMsg}</span>
              </div>
              <button
                onClick={() => setReopenSuccessMsg(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Incident Cards List */}
          {filteredIncidents.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-[#0c1812] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy phản ánh phù hợp</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Khi bạn bắt gặp cây sâu mục, cành sà vướng dây điện hoặc rễ bật gốc, hãy báo ngay để giữ an toàn cho bà con.
              </p>
              <button
                onClick={() => onNavigateToNewReport()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Gửi phản ánh sự cố ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((inc) => {
                const matchedTree = inc.treeId ? trees.find((t) => t.id === inc.treeId) : null;
                const isResolved = inc.status === 'RESOLVED';
                const isInProgress = inc.status === 'IN_PROGRESS' || inc.status === 'ASSIGNED';

                return (
                  <div
                    key={inc.id}
                    className="bg-white dark:bg-[#0c1812] rounded-3xl border border-slate-200/90 dark:border-emerald-500/20 shadow-2xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-md dark:hover:border-emerald-500/40 transition-all overflow-hidden"
                  >
                    {/* Top Row: Code, Status & Timestamp */}
                    <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-black text-sm text-emerald-900 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200/80 dark:border-emerald-500/30 flex items-center gap-1.5">
                          <span>{inc.publicCode}</span>
                          <button
                            onClick={() => handleCopy(inc.publicCode, inc.id)}
                            title="Sao chép mã phản ánh"
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
                          >
                            {copiedCode === inc.id ? (
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>

                        {inc.status === 'REOPENED' ? (
                          <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-300 dark:border-rose-700 shadow-2xs animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            Đang tái xử lý (Dân phản hồi chưa đạt)
                          </span>
                        ) : isResolved ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-500/30 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Đã khắc phục hoàn tất
                          </span>
                        ) : isInProgress ? (
                          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-200 dark:border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                            Kỹ thuật viên đang xử lý thực địa
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-500/30">
                            Đã tiếp nhận vé
                          </span>
                        )}

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase">
                          Mức: {inc.severity}
                        </span>
                      </div>

                      <div className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>Thời điểm gửi: {new Date(inc.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>

                    {/* Middle Body: Description & Tree linkage */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {inc.description}
                        </div>

                        <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-medium">{inc.address}</span>
                        </div>

                        {matchedTree && (
                          <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300">
                            <Trees className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            <span>
                              Cây định danh: <strong>[{matchedTree.publicCode}]</strong> {matchedTree.displayName}
                            </span>
                            <button
                              onClick={() => onSelectTree(matchedTree)}
                              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline ml-2 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Xem lý lịch cây</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 📸 Dual Comparison: Before vs After Evidence */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Ảnh lúc người dân gửi */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <span>1. Ảnh hiện trường lúc bạn gửi</span>
                          </div>
                          <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative group">
                            {inc.imageUrl ? (
                              <img
                                src={inc.imageUrl}
                                alt="Ảnh hiện trường lúc gửi"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                                <AlertTriangle className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
                                <span>Chưa đính kèm ảnh</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
                              HIỆN TRƯỜNG GỐC
                            </div>
                          </div>
                        </div>

                        {/* Ảnh nghiệm thu thực địa của KTV */}
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>2. Ảnh KTV nghiệm thu sau cắt tỉa</span>
                          </div>
                          <div className="w-full h-40 rounded-2xl overflow-hidden bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 relative group">
                            {isResolved ? (
                              <>
                                <img
                                  src={matchedTree?.imageUrl || inc.imageUrl || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'}
                                  alt="Nghiệm thu thực địa"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-emerald-700 dark:bg-emerald-600 text-white text-[10px] font-bold tracking-wide flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-200" />
                                  <span>ĐÃ NGHIỆM THU AN TOÀN</span>
                                </div>
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                                  KTV: {inc.assignedToName || 'Trần Quang Lâm'}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs p-4 text-center">
                                <Clock className="w-6 h-6 mb-2 text-amber-500 animate-spin" />
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Đang triển khai xe thang</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                  Kỹ thuật viên sẽ tải ảnh đối chứng sau khi xử lý xong
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 4-Stage Process Stepper */}
                      <div className="bg-slate-50/80 dark:bg-[#070e0a]/80 rounded-2xl p-4 border border-slate-200/80 dark:border-emerald-500/20 space-y-3">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Tiến trình xử lý công vụ 4 bước:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30">
                            <div className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0">
                              ✓
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">1. Tiếp nhận</div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Hệ thống ghi nhận</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30">
                            <div className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0">
                              ✓
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">2. Phê duyệt</div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Điều phối xe cơ động</div>
                            </div>
                          </div>

                          <div className={`flex items-center gap-2 p-2 rounded-xl ${isResolved ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/30'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isResolved ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950' : 'bg-amber-500 text-white animate-pulse'}`}>
                              {isResolved ? '✓' : '3'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">3. Cắt tỉa thực địa</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {inc.assignedToName || 'KTV Trần Quang Lâm'}
                              </div>
                            </div>
                          </div>

                          <div className={`flex items-center gap-2 p-2 rounded-xl ${isResolved ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isResolved ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              {isResolved ? '✓' : '4'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">4. Đóng dấu On-chain</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {isResolved ? 'Hoàn tất bất biến' : 'Chờ nghiệm thu'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alert when incident is REOPENED (đang tái xử lý) */}
                      {inc.status === 'REOPENED' && (
                        <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 rounded-2xl space-y-2 animate-fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                              <span>Yêu cầu tái xử lý từ bạn (Lần {inc.reopenedCount || 1}):</span>
                            </span>
                            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-mono">
                              {new Date(inc.reopenedAt || inc.updatedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 dark:text-rose-200 font-medium italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                            "{inc.reopenedReason}"
                          </p>
                          {inc.reopenedImageUrl && (
                            <div className="pt-1">
                              <div className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase mb-1">
                                Ảnh chụp đối chứng bạn đã gửi bổ sung:
                              </div>
                              <img
                                src={inc.reopenedImageUrl}
                                alt="Ảnh đối chứng"
                                className="w-36 h-24 object-cover rounded-xl border border-rose-300"
                              />
                            </div>
                          )}
                          <div className="text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1.5 pt-1">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Hệ thống đã phát lệnh ưu tiên khẩn cấp cho tổ Kỹ thuật viên phụ trách.</span>
                          </div>
                        </div>
                      )}

                      {/* Citizen Feedback Rating (Interactive 5-star) & Re-report Action */}
                      {isResolved && (
                        <div className="space-y-3">
                          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                              <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span>Đánh giá mức độ hài lòng về Kỹ thuật viên xử lý:</span>
                              </div>
                              <div className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                                Ý kiến của bạn giúp nâng cao chất lượng dịch vụ đô thị Cần Thơ.
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRate(inc.id, star)}
                                  className="p-1 rounded-lg hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-transform active:scale-110 cursor-pointer"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      (ratings[inc.id] || 5) >= star
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="ml-2 font-bold text-emerald-900 dark:text-emerald-300 font-mono">
                                {ratings[inc.id] ? `${ratings[inc.id]}/5 Sao` : '5/5 Rất Tốt'}
                              </span>
                            </div>
                          </div>

                          {/* ⚠️ Nút Tái Báo Cáo Nếu Hiện Trường Chưa Ổn Thỏa */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 rounded-2xl text-xs">
                            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>Hiện trường thực tế sau khi xử lý vẫn còn nguy cơ hoặc chưa sạch sẽ?</span>
                            </div>
                            <button
                              onClick={() => {
                                setReopenModalIncident(inc);
                                setReopenReason('');
                                setReopenImageUrl('');
                              }}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Tái báo cáo (Chưa ổn thỏa)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Blockchain Footer */}
                    <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-[#070e0a] border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-sans font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Mã băm SHA-256 bảo chứng toàn vẹn (Không thể xóa hay sửa đổi)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[220px]" title={inc.txHash || '0x71c829e...12a9'}>
                          TX: {inc.txHash || '0x71c829e04812a99182...'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">✓ Verified</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🌳 5. TAB CONTENT 2: CÂY TÔI THEO DÕI & BẢO TRỢ */}
      {activeSubTab === 'trees' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-emerald-500/20 shadow-2xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-bold mb-1 border border-rose-200 dark:border-rose-500/30">
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                  <span>CÂY XANH ĐƯỢC BẢO TRỢ BỞI CÔNG DÂN</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Cây Xanh Quanh Nhà Bạn ({followedTrees.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Theo dõi lịch trình chăm sóc, tỉa cành định kỳ và độ che phủ bóng mát của cây xanh bạn yêu thích.
                </p>
              </div>

              <button
                onClick={onOpenMap}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Khám phá thêm trên Bản đồ GIS</span>
              </button>
            </div>

            {followedTrees.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-[#0c1812] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                  Bạn chưa lưu theo dõi cây xanh nào
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Tài khoản mới bắt đầu từ trang sạch. Hãy mở Bản đồ GIS hoặc quét mã QR trên thân cây gần nhà để đánh dấu theo dõi lịch tưới nước, tỉa cành và độ phủ bóng mát.
                </p>
                <button
                  onClick={onOpenMap}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Mở Bản đồ GIS để chọn cây quan tâm</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                {followedTrees.map((tree) => (
                  <div
                    key={tree.id}
                    className="bg-white dark:bg-[#091510] rounded-2xl border border-slate-200/90 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all hover:shadow-lg dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-4 space-y-3.5 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="w-full h-44 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-900">
                        <img
                          src={tree.imageUrl || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'}
                          alt={tree.displayName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[11px] font-bold">
                          {tree.publicCode}
                        </span>
                        <span className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-500 shadow-md">
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </span>
                        <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Đang phát triển tốt
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {tree.displayName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{tree.address}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-50 dark:bg-[#070e0a] rounded-xl text-center text-xs border border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Chiều cao</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">{tree.heightM}m</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Đường kính</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">{tree.diameterCm}cm</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Hấp thụ CO₂</div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">22kg/y</div>
                        </div>
                      </div>

                      {/* Recent Care Info */}
                      <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Lịch chăm sóc tuần này:</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          • Cắt tỉa cành an toàn hoàn tất ngày 10/11
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          • Tưới dưỡng rễ: Dự kiến sáng mai 07:00
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => onSelectTree(tree)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs text-center transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem sổ cái &amp; nhật ký cây ➔</span>
                      </button>

                      <button
                        onClick={() => onNavigateToNewReport(tree.id)}
                        className="w-full py-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 dark:bg-slate-900 dark:hover:bg-amber-950/40 dark:text-slate-300 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-800 text-slate-700 font-semibold rounded-xl text-xs text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Báo sự cố cho cây này</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🏅 6. TAB CONTENT 3: HUY HIỆU & ĐỔI QUÀ SINH THÁI */}
      {activeSubTab === 'badges' && (
        <div className="space-y-8">
          {/* Badges Grid */}
          <div className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-emerald-500/20 shadow-2xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold mb-1 border border-amber-200 dark:border-amber-500/30">
                <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>HỆ THỐNG DANH HIỆU SINH THÁI TÂY ĐÔ</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Bộ Sưu Tập Huy Hiệu Của Bạn
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mỗi đóng góp báo cáo chính xác giúp xây dựng Cần Thơ xanh - sạch - đẹp và mở khóa huy hiệu danh dự.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Badge 1: Mầm Xanh Tiên Phong */}
              {myIncidents.length >= 1 ? (
                <div className="p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/40 dark:to-[#0c1812] space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-md">
                      🌱
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/40">
                      ✓ ĐÃ MỞ KHÓA
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Mầm Xanh Tiên Phong</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Gửi phản ánh sự cố cây xanh đầu tiên giúp cơ quan quản lý phát hiện sớm.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-emerald-100 dark:border-emerald-800/60">
                    +100 Điểm Eco-Points
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3 relative opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                      🌱
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      🔒 CẦN 1 PHẢN ÁNH
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Mầm Xanh Tiên Phong</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Gửi phản ánh sự cố cây xanh đầu tiên giúp cơ quan quản lý phát hiện sớm.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Thưởng: +100 Điểm Eco-Points
                  </div>
                </div>
              )}

              {/* Badge 2: Vệ Binh Rừng Phố */}
              {myIncidents.length >= 2 ? (
                <div className="p-5 rounded-2xl border-2 border-teal-300 dark:border-teal-500/40 bg-gradient-to-br from-teal-50/60 to-white dark:from-teal-950/40 dark:to-[#0c1812] space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl shadow-md">
                      🥈
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-500/40">
                      ✓ ĐÃ MỞ KHÓA
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Vệ Binh Rừng Phố</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Đóng góp từ 2 phản ánh chính xác đã được tiếp nhận và xử lý.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-teal-700 dark:text-teal-400 pt-2 border-t border-teal-100 dark:border-teal-800/60">
                    +250 Điểm Eco-Points
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3 relative opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                      🥈
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      🔒 TIẾN ĐỘ: {myIncidents.length}/2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Vệ Binh Rừng Phố</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Đóng góp từ 2 phản ánh chính xác đã được tiếp nhận và xử lý.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Thưởng: +250 Điểm Eco-Points
                  </div>
                </div>
              )}

              {/* Badge 3: Đại Sứ Môi Trường Tây Đô */}
              {myIncidents.length >= 5 ? (
                <div className="p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/40 dark:to-[#0c1812] space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md">
                      🥇
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-500/40">
                      ✓ ĐÃ MỞ KHÓA
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Đại Sứ Môi Trường Tây Đô</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Đạt mốc 5 phản ánh thực địa chính xác cho phong trào cây xanh đô thị.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 pt-2 border-t border-amber-100 dark:border-amber-800/60">
                    +500 Điểm &amp; Bằng khen điện tử
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3 relative opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                      🥇
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      🔒 TIẾN ĐỘ: {myIncidents.length}/5
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Đại Sứ Môi Trường Tây Đô</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Đạt mốc 5 phản ánh thực địa chính xác cho phong trào cây xanh đô thị.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Thưởng: +500 Điểm &amp; Bằng khen điện tử
                  </div>
                </div>
              )}

              {/* Badge 4: Bàn Tay Xanh Nghĩa Tình (Bảo trợ cây) */}
              {followedTrees.length >= 1 ? (
                <div className="p-5 rounded-2xl border-2 border-rose-300 dark:border-rose-500/40 bg-gradient-to-br from-rose-50/60 to-white dark:from-rose-950/40 dark:to-[#0c1812] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl shadow-md">
                      💧
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-500/40">
                      ✓ ĐÃ MỞ KHÓA
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Bàn Tay Xanh Nghĩa Tình</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Theo dõi và bảo trợ bóng mát cho cây xanh xung quanh khu vực bạn sinh sống.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-400 pt-2 border-t border-rose-100 dark:border-rose-800/60">
                    +150 Điểm Eco-Points
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3 opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                      💧
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      🔒 CHƯA BẢO TRỢ CÂY
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Bàn Tay Xanh Nghĩa Tình</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Theo dõi và bảo trợ bóng mát cho cây xanh xung quanh khu vực bạn sinh sống.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Thưởng: +150 Điểm Eco-Points
                  </div>
                </div>
              )}

              {/* Badge 5: Mắt Thần Mùa Mưa Bão (Sự cố Critical) */}
              {myIncidents.some((i) => i.severity === 'CRITICAL') ? (
                <div className="p-5 rounded-2xl border-2 border-amber-400 dark:border-amber-500/60 bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-950/40 dark:to-[#0c1812] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md">
                      ⚡
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-500/50">
                      ✓ ĐÃ MỞ KHÓA
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Mắt Thần Mùa Mưa Bão</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Phát hiện sớm cành sà nguy hiểm cấp độ Khẩn cấp (Critical) trước giông lốc.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 pt-2 border-t border-amber-100 dark:border-amber-800/60">
                    +300 Điểm &amp; Huy hiệu vàng
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3 opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                      ⚡
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      🔒 CHỜ SỰ CỐ KHẨN CẤP
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Mắt Thần Mùa Mưa Bão</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Phát hiện sớm cành sà nguy hiểm cấp độ Khẩn cấp (Critical) trước giông lốc.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Thưởng: +300 Điểm &amp; Huy hiệu vàng
                  </div>
                </div>
              )}

              {/* Badge 6: Công Dân Web3 Tiên Phong */}
              {myIncidents.some((i) => i.status === 'RESOLVED') ? (
                <div className="p-5 rounded-2xl border-2 border-blue-300 dark:border-blue-500/40 bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/40 dark:to-[#0c1812] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-md">
                      🔗
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-500/40">
                      ✓ ĐÃ MỞ KHÓA
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Công Dân Web3 Tiên Phong</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Phản ánh của bạn đã được đóng dấu mật mã SHA-256 lên Smart Contract On-Chain.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 pt-2 border-t border-blue-100 dark:border-blue-800/60">
                    +100 Điểm On-Chain
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3 opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                      🔗
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      🔒 CHỜ NGHIỆM THU ĐẦU TIÊN
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Công Dân Web3 Tiên Phong</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Phản ánh của bạn đã được đóng dấu mật mã SHA-256 lên Smart Contract On-Chain.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Thưởng: +100 Điểm On-Chain
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Green Rewards Store */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 dark:from-[#05130b] dark:via-[#092218] dark:to-[#040e09] rounded-3xl p-6 sm:p-8 text-white shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-transparent dark:border-emerald-500/20 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold mb-1 border border-emerald-400/30">
                  <Gift className="w-3.5 h-3.5" />
                  <span>GIAN HÀNG ĐỔI QUÀ CÔNG DÂN XANH</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Đổi Điểm Eco-Points Lấy Quà Tặng Sinh Thái
                </h2>
                <p className="text-xs text-emerald-100/70">
                  Điểm thưởng được tài trợ bởi Quỹ Phát Triển Bền Vững Đô Thị TP. Cần Thơ.
                </p>
              </div>

              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center shrink-0">
                <div className="text-xs text-emerald-200">Số dư hiện tại của bạn:</div>
                <div className="text-xl font-black text-amber-300 font-mono">
                  {totalPoints} Eco-Points
                </div>
              </div>
            </div>

            {redeemedReward && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-xs text-emerald-200 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Chúc mừng! Bạn đã đổi thành công: <strong>{redeemedReward}</strong>. Mã voucher đã gửi về số điện thoại của bạn.
                  </span>
                </div>
                <button
                  onClick={() => setRedeemedReward(null)}
                  className="text-emerald-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-md border border-white/15 dark:border-emerald-500/20 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-3xl">🌱</div>
                  <h4 className="font-bold text-white text-sm">Gói Hạt Giống Hoa Chuông Vàng Mini</h4>
                  <p className="text-xs text-emerald-100/70">
                    Kèm chậu xơ dừa tự hủy và cẩm nang ươm mầm sinh thái tại nhà.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-300 text-xs">150 Điểm</span>
                  <button
                    onClick={() => setRedeemedReward('Gói Hạt Giống Hoa Chuông Vàng')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Đổi quà
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-md border border-white/15 dark:border-emerald-500/20 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-3xl">🚌</div>
                  <h4 className="font-bold text-white text-sm">Thẻ Xe Buýt Điện Cần Thơ 1 Tháng</h4>
                  <p className="text-xs text-emerald-100/70">
                    Miễn phí di chuyển các tuyến trung tâm Q. Ninh Kiều - Cái Răng.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-300 text-xs">300 Điểm</span>
                  <button
                    onClick={() => setRedeemedReward('Thẻ Xe Buýt Điện Cần Thơ 1 Tháng')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Đổi quà
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-md border border-white/15 dark:border-emerald-500/20 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-3xl">📜</div>
                  <h4 className="font-bold text-white text-sm">Bằng Khen Công Dân Xanh Danh Dự</h4>
                  <p className="text-xs text-emerald-100/70">
                    Bằng khen điện tử NFT kèm chữ ký số xác thực của Sở Xây Dựng Cần Thơ.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-300 text-xs">500 Điểm</span>
                  <button
                    disabled={totalPoints < 500}
                    onClick={() => setRedeemedReward('Bằng Khen Công Dân Xanh')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      totalPoints >= 500
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {totalPoints >= 500 ? 'Đổi quà' : 'Cần thêm điểm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ 7. TAB CONTENT 4: MINH BẠCH BLOCKCHAIN */}
      {activeSubTab === 'transparency' && (
        <div className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-emerald-500/20 shadow-2xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold mb-1 border border-teal-200 dark:border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>CÔNG NGHỆ CHUỖI KHỐI PHỤC VỤ DÂN SINH</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Tại Sao Phản Ánh Của Bạn Cần Được Lưu On-Chain?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              UrbanTree tích hợp Smart Contract EVM để đảm bảo mọi phản ánh của người dân đều được giải quyết công tâm và minh bạch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
                🔒
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Tuyệt Đối Không Thể Xóa Vé</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Khi bạn gửi phản ánh, mã băm SHA-256 được chốt vào khối. Không một cán bộ nào có thể tùy tiện xóa bỏ hoặc ỉm đi phản ánh của bà con.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-lg">
                ⏱️
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Thời Gian Thực Khách Quan</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mốc thời gian (Block Timestamp) được mạng phân tán chứng thực từng giây. Đo lường chính xác tốc độ xử lý hiện trường của tổ xe thang.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-lg">
                🌿
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Minh Bạch Ngân Sách Duy Tu</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Người dân giám sát trực tiếp kinh phí chăm sóc và tỉa cành cho từng gốc cây cổ thụ thông qua hợp đồng thông minh công khai.
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Hợp đồng thông minh đã triển khai: <strong className="font-mono">0x71C829e04812a99182C89E901F29b80</strong>
              </span>
            </div>
            <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              EVM Compatible · SHA-256 v1.0
            </div>
          </div>
        </div>
      )}

      {/* 🪪 8. CITIZEN QR PASS MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-500/30 space-y-5 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-200 dark:border-emerald-500/30">
                THẺ CÔNG DÂN XANH TÂY ĐÔ
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{currentUser.fullName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{citizenCardNumber}</p>
            </div>

            {/* High contrast QR Visual */}
            <div className="w-56 h-56 mx-auto bg-white dark:bg-[#070e0a] p-3 rounded-2xl border-2 border-emerald-500 shadow-inner flex flex-col items-center justify-center relative">
              <div className="w-full h-full bg-slate-900 rounded-xl p-2.5 flex items-center justify-center relative overflow-hidden">
                {/* SVG QR Code Simulation */}
                <svg className="w-full h-full text-white" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer position markers */}
                  <rect x="5" y="5" width="25" height="25" rx="3" fill="#34d399" />
                  <rect x="9" y="9" width="17" height="17" rx="2" fill="#0f172a" />
                  <rect x="13" y="13" width="9" height="9" rx="1" fill="#34d399" />

                  <rect x="70" y="5" width="25" height="25" rx="3" fill="#34d399" />
                  <rect x="74" y="9" width="17" height="17" rx="2" fill="#0f172a" />
                  <rect x="78" y="13" width="9" height="9" rx="1" fill="#34d399" />

                  <rect x="5" y="70" width="25" height="25" rx="3" fill="#34d399" />
                  <rect x="9" y="74" width="17" height="17" rx="2" fill="#0f172a" />
                  <rect x="13" y="78" width="9" height="9" rx="1" fill="#34d399" />

                  {/* QR Data Dots Matrix */}
                  <rect x="36" y="8" width="6" height="6" />
                  <rect x="48" y="8" width="6" height="6" />
                  <rect x="58" y="16" width="6" height="6" />
                  <rect x="36" y="24" width="6" height="6" />
                  <rect x="46" y="24" width="6" height="6" />
                  <rect x="12" y="38" width="6" height="6" />
                  <rect x="22" y="38" width="6" height="6" />
                  <rect x="34" y="38" width="6" height="6" />
                  <rect x="46" y="38" width="8" height="8" fill="#34d399" />
                  <rect x="60" y="38" width="6" height="6" />
                  <rect x="72" y="38" width="6" height="6" />
                  <rect x="82" y="38" width="6" height="6" />
                  <rect x="8" y="50" width="6" height="6" />
                  <rect x="24" y="50" width="6" height="6" />
                  <rect x="38" y="50" width="6" height="6" />
                  <rect x="54" y="50" width="6" height="6" />
                  <rect x="68" y="50" width="6" height="6" />
                  <rect x="84" y="50" width="6" height="6" />
                  <rect x="36" y="62" width="6" height="6" />
                  <rect x="50" y="62" width="6" height="6" />
                  <rect x="62" y="62" width="6" height="6" />
                  <rect x="36" y="76" width="6" height="6" />
                  <rect x="48" y="76" width="6" height="6" />
                  <rect x="60" y="76" width="6" height="6" />
                  <rect x="74" y="76" width="6" height="6" />
                  <rect x="86" y="76" width="6" height="6" />
                  <rect x="40" y="86" width="6" height="6" />
                  <rect x="54" y="86" width="6" height="6" />
                  <rect x="68" y="86" width="6" height="6" />
                  <rect x="82" y="86" width="6" height="6" />
                </svg>
                {/* Center Badge in QR */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-md">
                    <Trees className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Xuất trình mã QR này khi tham gia Ngày Hội Trồng Cây Cần Thơ hoặc đổi quà sinh thái tại các điểm đối tác xanh.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Đóng thẻ
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ RE-REPORT / TÁI BÁO CÁO MODAL */}
      {reopenModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-amber-500/30 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReopenModalIncident(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-500/40">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>YÊU CẦU TÁI XỬ LÝ (CHƯA ỔN THỎA)</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Khiếu Nại Sự Cố [{reopenModalIncident.publicCode}]
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Địa điểm: <strong>{reopenModalIncident.address}</strong>
              </p>
            </div>

            {/* Explanation notice */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              💡 <strong>Quyền lợi công dân:</strong> Nếu sau khi Kỹ thuật viên báo đã hoàn tất mà hiện trường vẫn chưa sạch sẽ, còn cành nguy hiểm hoặc chưa triệt để, bạn có quyền gửi yêu cầu làm lại. Lệnh điều xe thang khẩn cấp sẽ được phát tức thì lên On-Chain.
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReopen} className="space-y-4 text-xs">
              {/* Quick Reason Chips */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Chọn nhanh nguyên nhân chưa đạt:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Cành mục lớn nguy hiểm vẫn chưa cắt',
                    'Chưa dọn dẹp cành lá, chắn lối đi',
                    'Cây vẫn còn nghiêng đè vào dây điện',
                    'Chỉ tỉa cành nhỏ, chưa xử lý dứt điểm',
                    'Hiện trường còn rác bừa bãi',
                  ].map((quickText) => (
                    <button
                      key={quickText}
                      type="button"
                      onClick={() => setReopenReason(quickText)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                        reopenReason === quickText
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      }`}
                    >
                      {quickText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Mô tả chi tiết điểm chưa ổn thỏa <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: KTV chỉ cắt 1 cành nhỏ phía dưới, cành khô mục lớn phía trên vẫn còn vướng vào dây điện sinh hoạt, rất nguy hiểm khi trời mưa bão..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                />
              </div>

              {/* Photo Proof */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Link ảnh đối chứng hiện trường hiện tại (nếu có):
                </label>
                <input
                  type="url"
                  placeholder="https://... hoặc dán URL ảnh chụp thực tế"
                  value={reopenImageUrl}
                  onChange={(e) => setReopenImageUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReopenModalIncident(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReopen || !reopenReason.trim()}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                    isSubmittingReopen || !reopenReason.trim()
                      ? 'bg-amber-400 opacity-60 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSubmittingReopen ? 'animate-spin' : ''}`} />
                  <span>{isSubmittingReopen ? 'Đang gửi On-Chain...' : 'Gửi Yêu Cầu Tái Xử Lý'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
