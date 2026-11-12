import React, { useState } from 'react';
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
} from 'lucide-react';
import { storage } from '../db/storage';
import { Incident, Tree, User } from '../types';

interface CitizenPortalViewProps {
  currentUser: User;
  onNavigateToNewReport: (treeId?: string) => void;
  onSelectTree: (tree: Tree) => void;
  onOpenMap: () => void;
}

export const CitizenPortalView: React.FC<CitizenPortalViewProps> = ({
  currentUser,
  onNavigateToNewReport,
  onSelectTree,
  onOpenMap,
}) => {
  const incidents = storage.getIncidents();
  const trees = storage.getTrees();

  // Filter incidents reported by this citizen (match by name or phone or fallback to show relevant records)
  const myIncidents = incidents.filter(
    (inc) =>
      (inc.reporterName && inc.reporterName.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
      (currentUser.username && inc.reporterPhone?.includes(currentUser.username)) ||
      currentUser.username === 'nguyenvanan' // demo citizen match
  );

  // If newly registered citizen with 0 reports yet, show welcoming state + sample
  const displayIncidents = myIncidents.length > 0 ? myIncidents : incidents.slice(0, 2);

  // Eco-points calculation: 100 pts per report, +50 for resolved
  const totalPoints = displayIncidents.length * 100 + displayIncidents.filter((i) => i.status === 'RESOLVED').length * 50;

  // Followed trees (demo favorites)
  const followedTrees = trees.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 🌟 1. PROFILE HEADER: ECO-CITIZEN HERO CARD */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-900/90 backdrop-blur-md rounded-[14px] flex items-center justify-center text-emerald-400">
                <Users className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-emerald-300 animate-spin" style={{ animationDuration: '6s' }} />
                <span>CÔNG DÂN SINH THÁI CẦN THƠ</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {currentUser.fullName}
              </h1>
              <p className="text-xs text-emerald-100/70">
                Đóng góp bảo vệ an toàn &amp; bóng mát không gian sống đô thị Tây Đô
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <div className="text-2xl font-black text-emerald-300 font-mono">
                {totalPoints}
              </div>
              <div className="text-[10px] uppercase font-bold text-emerald-100/80 tracking-wider">
                Điểm Eco-Points
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <div className="text-2xl font-black text-amber-300 font-mono">
                🥈 Hạng Bạc
              </div>
              <div className="text-[10px] uppercase font-bold text-amber-100/80 tracking-wider">
                Vệ Binh Rừng Phố
              </div>
            </div>

            <button
              onClick={() => onNavigateToNewReport()}
              className="hidden sm:flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gửi phản ánh mới</span>
            </button>
          </div>
        </div>

        {/* Progress bar to Gold Ambassador */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-200">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Tiến độ lên <strong>Đại Sứ Môi Trường Cần Thơ (Hạng Vàng)</strong>:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {displayIncidents.length} / 5 Phản ánh xác thực
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (displayIncidents.length / 5) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 📢 2. DANH SÁCH PHẢN ÁNH CỦA TÔI (MY INCIDENTS) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>TIẾN TRÌNH XỬ LÝ THỰC ĐỊA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Lịch Sử Phản Ánh Của Tôi ({displayIncidents.length})
            </h2>
            <p className="text-xs text-slate-500">
              Theo dõi trực tiếp quá trình tiếp nhận, điều phối xe thang và ảnh đối chứng nghiệm thu của Kỹ thuật viên.
            </p>
          </div>

          <button
            onClick={() => onNavigateToNewReport()}
            className="sm:hidden px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Gửi phản ánh mới</span>
          </button>
        </div>

        {displayIncidents.length === 0 ? (
          <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700">Bạn chưa gửi phản ánh sự cố nào</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Khi bạn phát hiện cây nghiêng, cành vướng dây điện hoặc rễ nứt, hãy gửi phản ánh để nhận huy hiệu sinh thái.
            </p>
            <button
              onClick={() => onNavigateToNewReport()}
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Gửi phản ánh đầu tiên ➔
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {displayIncidents.map((inc) => {
              const matchedTree = inc.treeId ? trees.find((t) => t.id === inc.treeId) : null;
              const isResolved = inc.status === 'RESOLVED';
              const isInProgress = inc.status === 'IN_PROGRESS';

              return (
                <div
                  key={inc.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-all hover:shadow-md space-y-4 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-[#174B36] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {inc.publicCode}
                      </span>
                      {isResolved ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Đã xử lý an toàn
                        </span>
                      ) : isInProgress ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          Kỹ thuật viên đang xử lý
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">
                          Đã tiếp nhận vé
                        </span>
                      )}
                    </div>

                    <div className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Gửi lúc: {new Date(inc.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left: Description & Location */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="font-bold text-slate-900 text-sm">
                        {inc.description}
                      </div>

                      <div className="flex items-start gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{inc.address}</span>
                      </div>

                      {matchedTree && (
                        <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <Trees className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            Cây định danh: <strong>[{matchedTree.publicCode}]</strong> {matchedTree.displayName}
                          </span>
                          <button
                            onClick={() => onSelectTree(matchedTree)}
                            className="text-emerald-700 font-bold hover:underline ml-2"
                          >
                            Xem lý lịch ➔
                          </button>
                        </div>
                      )}

                      {/* Staff Handling note */}
                      {inc.assignedToName && (
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-emerald-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Kỹ thuật viên phụ trách: <strong>{inc.assignedToName}</strong> (Tổ cơ động cắt tỉa Cần Thơ)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Photo Evidence */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ảnh hiện trường
                      </div>
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                        {inc.imageUrl ? (
                          <img
                            src={inc.imageUrl}
                            alt="Hiện trường"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px]">
                            <AlertTriangle className="w-6 h-6 mb-1 text-slate-300" />
                            <span>Ảnh hiện trường đang cập nhật</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Anchor TxHash */}
                  {inc.txHash && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Bảo chứng Smart Contract
                      </span>
                      <span className="truncate max-w-[200px]" title={inc.txHash}>
                        TX: {inc.txHash}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 🌳 3. CÂY XANH ĐANG THEO DÕI (FAVORITE TREES) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>BẢO TRỢ &amp; THEO DÕI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cây Xanh Tôi Theo Dõi ({followedTrees.length})
            </h2>
            <p className="text-xs text-slate-500">
              Nhận thông báo khi cây quanh nhà bạn được công nhân tưới nước, bón phân hoặc tỉa cành định kỳ.
            </p>
          </div>

          <button
            onClick={onOpenMap}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Tìm thêm cây trên bản đồ</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {followedTrees.map((tree) => (
            <div
              key={tree.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all hover:shadow-md space-y-3 text-xs"
            >
              <div className="w-full h-32 rounded-xl overflow-hidden relative">
                <img
                  src={tree.imageUrl}
                  alt={tree.displayName}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                  {tree.publicCode}
                </span>
                <span className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-500 shadow-xs">
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 truncate">{tree.displayName}</h3>
                <p className="text-[11px] text-slate-500 truncate">{tree.address}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                <span>Cao: <strong>{tree.heightM}m</strong></span>
                <span className="text-emerald-700 font-bold">● Khỏe mạnh</span>
              </div>

              <button
                onClick={() => onSelectTree(tree)}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-center transition-colors cursor-pointer"
              >
                Xem chi tiết nhật ký ➔
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

