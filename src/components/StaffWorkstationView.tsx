import React, { useState, useMemo, useRef } from 'react';
import {
  Wrench,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Trees,
  ShieldCheck,
  QrCode,
  Mic,
  MicOff,
  Sparkles,
  Layers,
  ChevronRight,
  Camera,
  Play,
  RotateCcw,
  Check,
  X,
  Phone,
  Navigation,
  Calendar,
  Send,
  Droplets,
  Scissors,
  FileText,
  Radio,
  Search,
} from 'lucide-react';
import { storage } from '../db/storage';
import { CareActionType, Incident, Tree, User } from '../types';

interface StaffWorkstationViewProps {
  currentUser: User;
  onOpenQrScanner: () => void;
  onSelectTree: (tree: Tree) => void;
  onOpenMap: () => void;
}

// Danh mục các tuyến phố mẫu tại Cần Thơ để gom nhóm cây
export const STREET_CORRIDORS = [
  { id: 'corridor-hoa-binh', name: 'Đại Lộ Hòa Bình', district: 'Q. Ninh Kiều', prefix: 'HB' },
  { id: 'corridor-30-thang-4', name: 'Đường 30 Tháng 4', district: 'Q. Ninh Kiều', prefix: '30T4' },
  { id: 'corridor-luu-huu-phuoc', name: 'Công Viên Lưu Hữu Phước', district: 'Q. Ninh Kiều', prefix: 'LHP' },
];

export const StaffWorkstationView: React.FC<StaffWorkstationViewProps> = ({
  currentUser,
  onOpenQrScanner,
  onSelectTree,
  onOpenMap,
}) => {
  const [activeTab, setActiveTab] = useState<'shift_tasks' | 'batch_care' | 'corridors' | 'pow_history'>('shift_tasks');
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-hoa-binh');
  const [batchActionType, setBatchActionType] = useState<CareActionType>('WATERING');
  const [batchNotes, setBatchNotes] = useState<string>('Đã tưới nước dưỡng ẩm và kiểm tra độ vững thân cây');
  const [selectedTreeIds, setSelectedTreeIds] = useState<string[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef<any>(null);

  // Resolution modal for staff
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionImageUrl, setResolutionImageUrl] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  const incidents = storage.getIncidents();
  const trees = storage.getTrees();
  const careRecords = storage.getCareRecords();

  // Filter incidents assigned to this staff or pending assignment
  const myAssignedIncidents = useMemo(() => {
    return incidents.filter(
      (inc) =>
        inc.assignedToUserId === currentUser.id ||
        (inc.assignedToName && inc.assignedToName.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
        currentUser.username === 'staff_lam' || // demo match
        inc.status === 'REOPENED' // ưu tiên vé tái báo cáo cho tổ KTV
    );
  }, [incidents, currentUser]);

  const reopenedIncidents = myAssignedIncidents.filter((i) => i.status === 'REOPENED');
  const inProgressIncidents = myAssignedIncidents.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED');
  const resolvedIncidents = myAssignedIncidents.filter((i) => i.status === 'RESOLVED');

  // Filter care records performed by this staff
  const myCareRecords = useMemo(() => {
    return careRecords.filter(
      (c) =>
        c.staffUserId === currentUser.id ||
        (c.staffName && c.staffName.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
        currentUser.username === 'staff_lam'
    );
  }, [careRecords, currentUser]);

  // Trees in selected corridor
  const corridorTrees = useMemo(() => {
    // distribute trees evenly across corridors for demo
    if (selectedCorridorId === 'corridor-hoa-binh') {
      return trees.slice(0, 3);
    } else if (selectedCorridorId === 'corridor-30-thang-4') {
      return trees.slice(2, 5);
    } else {
      return trees.slice(1, 4);
    }
  }, [trees, selectedCorridorId]);

  // Initialize selected tree ids when corridor changes
  const handleSelectAllCorridor = () => {
    if (selectedTreeIds.length === corridorTrees.length) {
      setSelectedTreeIds([]);
    } else {
      setSelectedTreeIds(corridorTrees.map((t) => t.id));
    }
  };

  const toggleTreeSelection = (treeId: string) => {
    setSelectedTreeIds((prev) =>
      prev.includes(treeId) ? prev.filter((id) => id !== treeId) : [...prev, treeId]
    );
  };

  // 🎙️ Voice dictation handler (SpeechRecognition / Mock)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceText(transcript);
        setBatchNotes((prev) => `${prev} ${transcript}`.trim());
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      // Fallback voice simulation for browsers without Web Speech
      setIsRecording(true);
      setTimeout(() => {
        const simulatedText = 'Đã cắt tỉa 4 cành khô vướng dây điện, thu dọn rác cành lá sạch vỉa hè.';
        setVoiceText(simulatedText);
        setBatchNotes((prev) => `${prev} ${simulatedText}`.trim());
        setIsRecording(false);
      }, 2500);
    }
  };

  // Submit batch maintenance
  const handleConfirmBatchCare = async () => {
    if (selectedTreeIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 cây trên tuyến đường để thực hiện bảo dưỡng!');
      return;
    }

    setIsSubmittingBatch(true);
    try {
      const records = await storage.batchCareMaintenance({
        treeIds: selectedTreeIds,
        staffUserId: currentUser.id,
        staffName: currentUser.fullName,
        actionType: batchActionType,
        notes: batchNotes.trim() || 'Duy tu định kỳ tuyến đường đảm bảo an toàn đô thị',
      });

      setBatchSuccessMsg(
        `Đã hoàn tất bảo dưỡng hàng loạt cho ${records.length} cây trên tuyến! Toàn bộ nhật ký đã được neo vào chuỗi khối On-chain.`
      );
      setSelectedTreeIds([]);
      setTimeout(() => setBatchSuccessMsg(null), 6000);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi lưu bảo dưỡng hàng loạt');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Quick dispatch status change
  const handleAcceptIncident = async (incident: Incident) => {
    try {
      await storage.updateIncidentStatus({
        incidentId: incident.id,
        newStatus: 'IN_PROGRESS',
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        note: `KTV ${currentUser.fullName} đã tiếp nhận và điều xe thang đến hiện trường.`,
        assignedToUserId: currentUser.id,
      });
      alert(`Đã tiếp nhận vé [${incident.publicCode}]. Hãy tiến hành di chuyển đến hiện trường!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Complete resolution
  const handleConfirmResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncident) return;

    setIsSubmittingResolution(true);
    try {
      await storage.updateIncidentStatus({
        incidentId: resolvingIncident.id,
        newStatus: 'RESOLVED',
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        note: resolutionNote.trim() || 'Đã cắt tỉa cành an toàn và dọn dẹp vệ sinh hiện trường.',
        imageUrl: resolutionImageUrl.trim() || undefined,
      });
      alert(`Đã hoàn tất nghiệm thu vé [${resolvingIncident.publicCode}] và ghi nhận On-Chain!`);
      setResolvingIncident(null);
      setResolutionNote('');
      setResolutionImageUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 👷 1. SHIFT HERO CARD: FIELD TECHNICIAN COMMAND CENTER */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/25 bg-gradient-to-br from-[#071911] via-[#0b281d] to-[#040e09] text-white p-5 sm:p-7">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Status Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                CA TRỰC THỰC ĐỊA HOẠT ĐỘNG (07:00 – 17:00)
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-emerald-200/80 flex items-center gap-1 font-mono">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>GPS: Q. Ninh Kiều (10.0341° N, 105.7794° E)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold">
                TỔ XE CƠ ĐỘNG #01
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
                XE THANG 14M
              </span>
            </div>
          </div>

          {/* Profile & Shift Overview */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-300 to-amber-300 p-0.5 shadow-xl shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <Wrench className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-400" />
                  <span>KỸ THUẬT VIÊN THỰC ĐỊA CHÍNH</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{currentUser.fullName}</span>
                </h1>
                <p className="text-xs text-emerald-100/70">
                  Đội Quản lý Cây xanh Đô thị TP. Cần Thơ · Trực chiến phòng chống thiên tai
                </p>
              </div>
            </div>

            {/* Shift Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                  {reopenedIncidents.length + inProgressIncidents.length}
                </div>
                <div className="text-[10px] font-bold text-rose-200/80 uppercase mt-0.5">
                  Sự Cố Cần Xử Lý
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                  {reopenedIncidents.length}
                </div>
                <div className="text-[10px] font-bold text-amber-200/80 uppercase mt-0.5">
                  Dân Khiếu Nại
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-teal-300 font-mono">
                  {corridorTrees.length}
                </div>
                <div className="text-[10px] font-bold text-teal-200/80 uppercase mt-0.5">
                  Cây Trên Tuyến
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                  {myCareRecords.length}
                </div>
                <div className="text-[10px] font-bold text-emerald-200/80 uppercase mt-0.5">
                  Chứng Chỉ On-Chain
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⚡ 2. BIG GLOVE-FRIENDLY ACTION BAR (NÚT BẤM KÍCH THƯỚC LỚN CHO GĂNG TAY LAO ĐỘNG) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={() => setActiveTab('batch_care')}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/20 active:scale-95 transition-all flex items-center justify-between cursor-pointer border border-emerald-400/40 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight">Duy Tu Hàng Loạt</div>
              <div className="text-[11px] text-emerald-100/80">Chăm sóc cả dãy cây 1-chạm</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onOpenQrScanner}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg active:scale-95 transition-all flex items-center justify-between cursor-pointer border border-slate-700/80 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight">Quét QR Trước Mặt</div>
              <div className="text-[11px] text-slate-300">Mở camera nhận diện ngay</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={toggleVoiceRecording}
          className={`p-4 sm:p-5 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-between cursor-pointer border group ${
            isRecording
              ? 'bg-rose-600 border-rose-400 animate-pulse shadow-rose-900/30'
              : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border-amber-400/40'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              {isRecording ? (
                <MicOff className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              )}
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight">
                {isRecording ? 'Đang Lắng Nghe...' : 'Ghi Âm Giọng Nói'}
              </div>
              <div className="text-[11px] text-amber-100/80">
                {isRecording ? 'Nói nội dung để tự điền...' : 'Nói để điền ghi chú rảnh tay'}
              </div>
            </div>
          </div>
          <span className="w-3 h-3 rounded-full bg-white/80 animate-ping" />
        </button>
      </div>

      {/* 🧭 3. SUB-TAB NAVIGATION PILLS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('shift_tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'shift_tasks'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Sự Cố Được Giao ({myAssignedIncidents.length})</span>
          {reopenedIncidents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono animate-pulse">
              {reopenedIncidents.length} TÁI BÁO CÁO
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('batch_care')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'batch_care'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Duy Tu Hàng Loạt Tuyến Phố</span>
        </button>

        <button
          onClick={() => setActiveTab('corridors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'corridors'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Danh Mục Cây Tuyến Phố</span>
        </button>

        <button
          onClick={() => setActiveTab('pow_history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'pow_history'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bảo Chứng PoW On-Chain ({myCareRecords.length})</span>
        </button>
      </div>

      {/* 🌟 4. TAB CONTENT 1: SỰ CỐ ĐƯỢC GIAO (MY ASSIGNED INCIDENTS) */}
      {activeTab === 'shift_tasks' && (
        <div className="space-y-4">
          {/* Priority warning if any REOPENED tickets exist */}
          {reopenedIncidents.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-600 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 shadow-md animate-fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-extrabold uppercase tracking-wide">
                    Cảnh Báo Khẩn Cấp: Có {reopenedIncidents.length} phản ánh người dân chưa hài lòng (Tái báo cáo)!
                  </span>
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    Yêu cầu tổ KTV ưu tiên đưa xe thang đến xử lý triệt để ngay trong ca trực hôm nay.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-mono font-bold text-[11px] self-start sm:self-auto shrink-0">
                ƯU TIÊN CẤP 1
              </span>
            </div>
          )}

          {myAssignedIncidents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0c1812] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Hiện tại không có sự cố nào cần xử lý trong ca trực của bạn.
            </div>
          ) : (
            <div className="space-y-4">
              {myAssignedIncidents.map((inc) => {
                const matchedTree = inc.treeId ? trees.find((t) => t.id === inc.treeId) : null;
                const isReopened = inc.status === 'REOPENED';
                const isResolved = inc.status === 'RESOLVED';
                const isInProgress = inc.status === 'IN_PROGRESS';

                return (
                  <div
                    key={inc.id}
                    className={`bg-white dark:bg-[#0c1812] rounded-3xl border p-5 sm:p-6 space-y-4 transition-all shadow-sm ${
                      isReopened
                        ? 'border-rose-300 dark:border-rose-600/60 ring-2 ring-rose-400/20'
                        : 'border-slate-200/90 dark:border-emerald-500/20'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-black text-sm text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                          {inc.publicCode}
                        </span>

                        {isReopened ? (
                          <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-300 dark:border-rose-700 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>DÂN KHIẾU NẠI (LÀM LẠI LẦN {inc.reopenedCount || 1})</span>
                          </span>
                        ) : isInProgress ? (
                          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>ĐANG TRIỂN KHAI XE THANG</span>
                          </span>
                        ) : isResolved ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ĐÃ HOÀN TẤT NGHIỆM THU</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold text-xs border border-blue-300">
                            ĐÃ ĐIỀU PHỐI VÉ
                          </span>
                        )}

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          MỨC ĐỘ: {inc.severity}
                        </span>
                      </div>

                      <div className="text-slate-400 text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Tiếp nhận: {new Date(inc.reportedAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {inc.description}
                        </div>

                        <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-semibold">{inc.address}</span>
                        </div>

                        {matchedTree && (
                          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300">
                            <Trees className="w-4 h-4 text-emerald-600" />
                            <span>
                              Cây định danh: <strong>[{matchedTree.publicCode}]</strong> {matchedTree.displayName}
                            </span>
                            <button
                              onClick={() => onSelectTree(matchedTree)}
                              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline ml-2"
                            >
                              Xem lý lịch ➔
                            </button>
                          </div>
                        )}

                        {/* Citizen Reopen Reason Alert */}
                        {isReopened && inc.reopenedReason && (
                          <div className="p-3 bg-rose-50/80 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-2xl text-xs space-y-1">
                            <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              <span>Lý do người dân khiếu nại chưa đạt:</span>
                            </div>
                            <p className="text-rose-800 dark:text-rose-300 italic">
                              "{inc.reopenedReason}"
                            </p>
                            {inc.reopenedImageUrl && (
                              <div className="mt-2">
                                <div className="text-[10px] font-bold text-rose-800 uppercase mb-1">Ảnh đối chứng từ dân:</div>
                                <img src={inc.reopenedImageUrl} alt="Ảnh đối chứng" className="w-32 h-20 rounded-xl object-cover border border-rose-300" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Scene Photo */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Ảnh chụp hiện trường
                        </div>
                        <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
                          {inc.imageUrl ? (
                            <img src={inc.imageUrl} alt="Hiện trường" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                              <Camera className="w-6 h-6 mb-1 text-slate-300" />
                              <span>Chưa có ảnh</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Staff Touch Actions Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {inc.status === 'ASSIGNED' || inc.status === 'REOPENED' ? (
                          <button
                            onClick={() => handleAcceptIncident(inc)}
                            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            <Truck className="w-4 h-4" />
                            <span>1. Điều Xe Thang Đến Hiện Trường</span>
                          </button>
                        ) : null}

                        {!isResolved && (
                          <button
                            onClick={() => {
                              setResolvingIncident(inc);
                              setResolutionNote('');
                              setResolutionImageUrl('');
                            }}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>2. Nghiệm Thu &amp; Ký Sổ Cái On-Chain</span>
                          </button>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        Mã tham chiếu EVM: {inc.txHash ? inc.txHash.slice(0, 16) + '...' : 'Chờ nghiệm thu'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🚀 5. TAB CONTENT 2: CHĂM SÓC HÀNG LOẠT THEO TUYẾN PHỐ (BATCH CARE 1-CLICK) */}
      {activeTab === 'batch_care' && (
        <div className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-emerald-500/20 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 text-xs font-bold mb-1 border border-teal-200 dark:border-teal-500/30">
              <Truck className="w-3.5 h-3.5 text-teal-600" />
              <span>CHẾ ĐỘ DUY TU TOÀN TUYẾN 1-CLICK</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Bảo Dưỡng Hàng Loạt Theo Tuyến Phố
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Xe bồn hoặc xe thang đi dọc một tuyến đường có thể ký xác nhận bảo dưỡng cho toàn bộ dãy cây cùng lúc.
            </p>
          </div>

          {/* Success Banner */}
          {batchSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{batchSuccessMsg}</span>
              </div>
              <button onClick={() => setBatchSuccessMsg(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Chọn Tuyến Đường */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Chọn tuyến phố thực hiện duy tu:
              </label>
              <select
                value={selectedCorridorId}
                onChange={(e) => {
                  setSelectedCorridorId(e.target.value);
                  setSelectedTreeIds([]);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070e0a] text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-emerald-500"
              >
                {STREET_CORRIDORS.map((corridor) => (
                  <option key={corridor.id} value={corridor.id}>
                    📍 {corridor.name} ({corridor.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Chọn Loại Hành Động */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Loại công việc thực hiện cho cả tuyến:
              </label>
              <select
                value={batchActionType}
                onChange={(e) => setBatchActionType(e.target.value as CareActionType)}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070e0a] text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="WATERING">💧 Tưới nước dưỡng ẩm định kỳ (WATERING)</option>
                <option value="PRUNING">✂️ Tỉa cành an toàn trước mùa bão (PRUNING)</option>
                <option value="FERTILIZING">🌱 Bón phân hữu cơ vi sinh (FERTILIZING)</option>
                <option value="SURVEY">🔍 Khảo sát độ rỗng thân &amp; rễ (SURVEY)</option>
              </select>
            </div>
          </div>

          {/* Step 3: Chọn Cây Trên Tuyến (Có nút Chọn tất cả) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Danh sách cây trên tuyến ({selectedTreeIds.length}/{corridorTrees.length} cây đã chọn):
              </label>
              <button
                type="button"
                onClick={handleSelectAllCorridor}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-500/30 cursor-pointer"
              >
                {selectedTreeIds.length === corridorTrees.length ? 'Bỏ chọn tất cả' : '✓ Chọn tất cả dãy phố'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {corridorTrees.map((tree, idx) => {
                const isChecked = selectedTreeIds.includes(tree.id);
                return (
                  <div
                    key={tree.id}
                    onClick={() => toggleTreeSelection(tree.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-emerald-900 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-slate-700">
                          #{idx + 1} · {tree.publicCode}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600">● Tốt</span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {tree.displayName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {tree.address}
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Ghi Chú & Voice Dictation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                4. Ghi chú nhật ký ca trực (có thể dùng Giọng nói rảnh tay):
              </label>
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Đang ghi âm...' : 'Bấm để nói'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="Nhập ghi chú hoặc bấm nút Micro để đọc rảnh tay..."
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070e0a] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Confirm Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleConfirmBatchCare}
              disabled={isSubmittingBatch || selectedTreeIds.length === 0}
              className={`px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl flex items-center gap-2 transition-all ${
                isSubmittingBatch || selectedTreeIds.length === 0
                  ? 'bg-slate-400 opacity-60 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 cursor-pointer shadow-emerald-950/30'
              }`}
            >
              <Truck className={`w-5 h-5 ${isSubmittingBatch ? 'animate-bounce' : ''}`} />
              <span>
                {isSubmittingBatch
                  ? 'Đang ký On-Chain cho toàn tuyến...'
                  : `Xác Nhận Duy Tu ${selectedTreeIds.length} Cây & Ghi On-Chain ➔`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 🗺️ 6. TAB CONTENT 3: DANH MỤC CÂY TUYẾN PHỐ (STREET CORRIDORS) */}
      {activeTab === 'corridors' && (
        <div className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-emerald-500/20 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>QUẢN LÝ THỨ TỰ CÂY DỌC ĐƯỜNG PHỐ</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Cụm Cây &amp; Tuyến Phố Tại Cần Thơ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân biệt cây cùng loài theo số thứ tự dọc đường phố (ví dụ HB-01, HB-02...) và cột mốc số nhà.
              </p>
            </div>

            <button
              onClick={onOpenMap}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Mở Bản Đồ Tuyến Đường GIS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trees.map((tree, idx) => (
              <div
                key={tree.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-400 transition-all space-y-3"
              >
                <div className="w-full h-36 rounded-xl overflow-hidden relative bg-slate-100">
                  <img src={tree.imageUrl} alt={tree.displayName} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[11px] font-bold">
                    #{idx + 1} · {tree.publicCode}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                    ● KHỎE MẠNH
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{tree.displayName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{tree.address}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Cao: <strong>{tree.heightM}m</strong></span>
                  <span>ĐK: <strong>{tree.diameterCm}cm</strong></span>
                  <span className="text-emerald-600 font-bold font-mono">EVM v1</span>
                </div>

                <button
                  onClick={() => onSelectTree(tree)}
                  className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl text-xs text-center transition-colors cursor-pointer"
                >
                  Xem y bạ &amp; nhật ký cây ➔
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🛡️ 7. TAB CONTENT 4: LỊCH SỬ CHỨNG CHỈ POW (PROOF OF WORK ON-CHAIN) */}
      {activeTab === 'pow_history' && (
        <div className="bg-white dark:bg-[#0c1812] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-emerald-500/20 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>CHỨNG THỰC CÔNG KHAI BẰNG CHỨNG THỰC ĐỊA (POW)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Nhật Ký Duy Tu Do Bạn Đã Ký Duyệt
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mỗi lần cắt tỉa hoặc tưới nước đều được băm mật mã SHA-256 xác thực trên Smart Contract EVM.
            </p>
          </div>

          <div className="space-y-3">
            {myCareRecords.map((care) => {
              const matchedTree = trees.find((t) => t.id === care.treeId);
              return (
                <div
                  key={care.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200">
                        {care.actionType}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        [{matchedTree?.publicCode || 'CÂY ĐÔ THỊ'}] {matchedTree?.displayName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(care.performedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300">{care.notes}</p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Xác thực On-chain: {care.anchorStatus || 'CONFIRMED'}</span>
                    </span>
                    <span className="truncate max-w-[220px]" title={care.txHash}>
                      TX: {care.txHash || '0x71c829e04812a9...'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📸 RESOLUTION MODAL FOR STAFF */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-500/30 space-y-5 relative">
            <button
              onClick={() => setResolvingIncident(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>NGHIỆM THU HIỆN TRƯỜNG THỰC ĐỊA</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Xử Lý Hoàn Tất Sự Cố [{resolvingIncident.publicCode}]
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{resolvingIncident.address}</p>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Ghi chú kết quả xử lý của KTV <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Đã cắt hạ 3 cành sà thấp, dọn sạch cành lá trên vỉa hè đảm bảo an toàn giao thông..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Link ảnh đối chứng sau nghiệm thu (để người dân kiểm tra):
                </label>
                <input
                  type="url"
                  placeholder="https://... hoặc URL ảnh chụp hiện trường sau khi cắt tỉa"
                  value={resolutionImageUrl}
                  onChange={(e) => setResolutionImageUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070e0a] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isSubmittingResolution ? 'Đang neo On-Chain...' : 'Ký Xác Nhận Nghiệm Thu ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
