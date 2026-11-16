import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Filter,
  LocateFixed,
  Cpu,
  Zap,
} from 'lucide-react';
import { storage } from '../db/storage';
import {
  CareActionType,
  Incident,
  Tree,
  User,
  WorkOrder,
  WorkOrderHistory,
  WorkOrderItem,
  WorkOrderStatus,
  StormCampaign,
} from '../types';
import { DigitalAlloyTag } from './DigitalAlloyTag';
import { RightSlideOverDrawer } from './common/RightSlideOverDrawer';
import {
  findNearestTree,
  getTreeCorridor,
  getTreeMilestone,
  getTreeStreetCode,
  STREET_CORRIDORS_LIST,
} from '../utils/treeUtils';

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
  const [activeTab, setActiveTab] = useState<'work_orders' | 'shift_tasks' | 'batch_care' | 'corridors' | 'pow_history'>('work_orders');
  const [workOrdersVersion, setWorkOrdersVersion] = useState(0);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-hoa-binh');
  const [batchActionType, setBatchActionType] = useState<CareActionType>('WATERING');
  const [batchNotes, setBatchNotes] = useState<string>('Đã tưới nước dưỡng ẩm và kiểm tra độ vững thân cây');
  const [selectedTreeIds, setSelectedTreeIds] = useState<string[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  const [corridorViewSelectedId, setCorridorViewSelectedId] = useState<string>('ALL');
  const [corridorSearchQuery, setCorridorSearchQuery] = useState<string>('');
  const [corridorPage, setCorridorPage] = useState<number>(1);
  const corridorPageSize = 24;

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef<any>(null);

  // 🧭 Hàng Đợi Vận Hành Thực Địa (Operational Queues - WAVE 4.9)
  const [operationalQueue, setOperationalQueue] = useState<'ALL' | 'EMERGENCY' | 'ALERTS' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'RESOLVED'>('ALL');
  const [selectedBatchItemIds, setSelectedBatchItemIds] = useState<string[]>([]);
  const [batchItemNotes, setBatchItemNotes] = useState<string>('Đã kiểm tra, cắt tỉa cành an toàn theo quy chuẩn kỹ thuật');
  const [batchItemEvidence, setBatchItemEvidence] = useState<string>('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80');
  const [isSubmittingBatchItems, setIsSubmittingBatchItems] = useState(false);
  const [stormCampaign, setStormCampaign] = useState<StormCampaign | null>(() => storage.getStormCampaign());
  const [itemFilterStatus, setItemFilterStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [reassigningWorkOrder, setReassigningWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  const allTeams = useMemo(() => storage.getTeams(), [workOrdersVersion]);

  const handleReassignTeam = (orderId: string, teamId: string) => {
    try {
      storage.assignWorkOrder(orderId, teamId, currentUser);
      setReassigningWorkOrder(null);
      setWorkOrdersVersion((v) => v + 1);
      alert('✅ Đã phân bổ tổ thi công tiếp nhận thành công!');
    } catch (err: any) {
      alert(`Lỗi phân bổ tổ: ${err.message}`);
    }
  };

  useEffect(() => {
    storage.syncStormCampaignFromBackend().then((camp) => {
      if (camp) setStormCampaign(camp);
    });

    const handleCampUpdated = (e: any) => {
      if (e.detail) setStormCampaign(e.detail);
    };
    window.addEventListener('urbantree:campaign-updated', handleCampUpdated);
    return () => {
      window.removeEventListener('urbantree:campaign-updated', handleCampUpdated);
    };
  }, []);

  const handleBatchCompleteItems = async () => {
    if (selectedBatchItemIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 cây trong checklist để ghi nhận hoàn tất.');
      return;
    }

    setIsSubmittingBatchItems(true);
    try {
      await storage.batchCompleteWorkOrderItems(
        selectedBatchItemIds,
        batchItemNotes.trim() || 'Đã kiểm tra, cắt tỉa cành an toàn theo quy chuẩn kỹ thuật',
        batchItemEvidence
      );
      setSelectedBatchItemIds([]);
      setWorkOrdersVersion((v) => v + 1);
      alert(`✅ Đã ghi nhận hoàn tất ${selectedBatchItemIds.length} cây trên tuyến thành công!`);
    } catch (err: any) {
      alert(`Lỗi ghi nhận hoàn tất: ${err.message}`);
    } finally {
      setIsSubmittingBatchItems(false);
    }
  };

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

  // Lọc danh sách Lệnh công tác được giao cho tổ của KTV
  const myWorkOrders = useMemo(() => {
    const allOrders = storage.getWorkOrders();
    const teams = storage.getTeams();
    const myTeam = teams.find(
      (t) =>
        t.leaderUserId === currentUser.id ||
        t.memberUserIds.includes(currentUser.id) ||
        (currentUser.teamName && t.name.toLowerCase().includes(currentUser.teamName.toLowerCase())) ||
        currentUser.username === 'staff_lam'
    );

    if (myTeam) {
      const teamOrders = allOrders.filter((w) => w.assignedTeamId === myTeam.id);
      if (teamOrders.length > 0) return teamOrders;
    }
    return allOrders.filter(
      (w) =>
        w.status === 'ASSIGNED' ||
        w.status === 'IN_PROGRESS' ||
        w.status === 'SUBMITTED_FOR_REVIEW' ||
        w.status === 'REJECTED'
    );
  }, [currentUser, workOrdersVersion]);

  // Đếm khối lượng công việc theo các phân khúc hàng đợi
  const emergencyCount = useMemo(() => {
    const incCount = incidents.filter((i) => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && i.status !== 'RESOLVED' && i.status !== 'REJECTED').length;
    const woCount = myWorkOrders.filter((w) => w.priority === 'CRITICAL' && w.status !== 'COMPLETED').length;
    return incCount + woCount;
  }, [incidents, myWorkOrders]);

  const alertsCount = stormCampaign ? stormCampaign.remainingTrees : 5424;
  const assignedCount = myWorkOrders.filter((w) => w.status === 'ASSIGNED' || w.status === 'ACCEPTED').length;
  const inProgressCount = myWorkOrders.filter((w) => w.status === 'IN_PROGRESS' || w.status === 'REJECTED').length;
  const submittedCount = myWorkOrders.filter((w) => w.status === 'SUBMITTED_FOR_REVIEW').length;
  const completedCount = myWorkOrders.filter((w) => w.status === 'COMPLETED' || w.status === 'CLOSED').length;

  const filteredWorkOrders = useMemo(() => {
    let list = myWorkOrders;
    if (operationalQueue === 'EMERGENCY') {
      list = list.filter((w) => w.priority === 'CRITICAL');
    } else if (operationalQueue === 'ASSIGNED') {
      list = list.filter((w) => w.status === 'ASSIGNED' || w.status === 'ACCEPTED');
    } else if (operationalQueue === 'IN_PROGRESS') {
      list = list.filter((w) => w.status === 'IN_PROGRESS' || w.status === 'REJECTED');
    } else if (operationalQueue === 'SUBMITTED') {
      list = list.filter((w) => w.status === 'SUBMITTED_FOR_REVIEW');
    } else if (operationalQueue === 'RESOLVED') {
      list = list.filter((w) => w.status === 'COMPLETED' || w.status === 'CLOSED');
    }
    return list;
  }, [myWorkOrders, operationalQueue]);

  const selectedWorkOrderDetails = useMemo(() => {
    if (!selectedWorkOrderId) return null;
    return storage.getWorkOrderDetails(selectedWorkOrderId);
  }, [selectedWorkOrderId, workOrdersVersion]);

  const activeDrawerWorkOrder = useMemo(() => {
    if (!selectedWorkOrderId) return null;
    const cleanId = selectedWorkOrderId.toLowerCase();
    return (
      filteredWorkOrders.find((w) => w.id === selectedWorkOrderId || w.code === selectedWorkOrderId || w.id.toLowerCase() === cleanId || (w.code && w.code.toLowerCase() === cleanId)) ||
      myWorkOrders.find((w) => w.id === selectedWorkOrderId || w.code === selectedWorkOrderId || w.id.toLowerCase() === cleanId || (w.code && w.code.toLowerCase() === cleanId)) ||
      selectedWorkOrderDetails?.workOrder ||
      null
    );
  }, [selectedWorkOrderId, filteredWorkOrders, myWorkOrders, selectedWorkOrderDetails]);

  // Đồng bộ với Backend SQLite khi mount và nhận sự kiện
  useEffect(() => {
    storage.syncWorkOrdersFromBackend().then(() => {
      setWorkOrdersVersion((v) => v + 1);
    });
    storage.syncIncidentsFromBackend().then(() => {
      setWorkOrdersVersion((v) => v + 1);
    });
    storage.syncCareRecordsFromBackend();

    const handleSync = () => setWorkOrdersVersion((v) => v + 1);
    window.addEventListener('urbantree:work-orders-synced', handleSync);
    window.addEventListener('urbantree:incidents-synced', handleSync);
    window.addEventListener('urbantree:care-records-synced', handleSync);
    return () => {
      window.removeEventListener('urbantree:work-orders-synced', handleSync);
      window.removeEventListener('urbantree:incidents-synced', handleSync);
      window.removeEventListener('urbantree:care-records-synced', handleSync);
    };
  }, []);

  // Tải chi tiết lệnh công tác và checklist từ SQLite Backend khi KTV chọn lệnh
  useEffect(() => {
    if (selectedWorkOrderId) {
      setIsLoadingDetails(true);
      storage.syncWorkOrderDetails(selectedWorkOrderId)
        .then((res) => {
          setIsLoadingDetails(false);
          if (res) setWorkOrdersVersion((v) => v + 1);
        })
        .catch(() => {
          setIsLoadingDetails(false);
        });
    }
  }, [selectedWorkOrderId]);

  const handleStartFieldWorkOrder = (orderId: string) => {
    try {
      storage.transitionWorkOrderStatus(orderId, 'IN_PROGRESS', currentUser, 'Kỹ thuật viên đã nhận lệnh và bắt đầu thi công');
      setWorkOrdersVersion((v) => v + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitFieldWorkOrder = (orderId: string) => {
    try {
      storage.transitionWorkOrderStatus(orderId, 'SUBMITTED_FOR_REVIEW', currentUser, 'Đã hoàn tất rà soát toàn bộ cây trên tuyến, đề nghị Giám sát viên nghiệm thu');
      setWorkOrdersVersion((v) => v + 1);
      alert('Đã gửi báo cáo nghiệm thu lên Ban Giám Sát thành công!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ⚡ Kỹ thuật viên hoàn tất 1-chạm toàn bộ tuyến đường (không phải bấm từng cây)
  const [isFastCompletingRoute, setIsFastCompletingRoute] = useState(false);
  const handleFastCompleteEntireRouteForStaff = async (orderId: string) => {
    if (isFastCompletingRoute) return;
    setIsFastCompletingRoute(true);
    try {
      // 1. Chuyển sang IN_PROGRESS nếu đang ASSIGNED
      const wo = myWorkOrders.find((w: any) => w.id === orderId);
      if (wo?.status === 'ASSIGNED') {
        storage.transitionWorkOrderStatus(orderId, 'IN_PROGRESS', currentUser, 'Kỹ thuật viên bắt đầu thi công toàn tuyến');
      }

      // 2. Lấy danh sách cây chưa hoàn thành
      const details = storage.getWorkOrderDetails(orderId);
      const pendingItems = (details?.items || []).filter((it) => it.status !== 'COMPLETED');
      if (pendingItems.length > 0) {
        const pendingIds = pendingItems.map((it) => it.id);
        await storage.batchCompleteWorkOrderItems(
          pendingIds,
          'KTV đã cắt tỉa cành hạ tán hoàn tất an toàn toàn tuyến theo quy chuẩn kỹ thuật',
          'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80'
        );
      }

      // 3. Nộp báo cáo nghiệm thu lên Ban Giám Sát
      storage.transitionWorkOrderStatus(
        orderId,
        'SUBMITTED_FOR_REVIEW',
        currentUser,
        'Đã hoàn tất 100% cây trên tuyến, đề nghị Giám sát viên / Admin nghiệm thu'
      );

      setWorkOrdersVersion((v) => v + 1);
      alert(`🎉 Đã hoàn tất 100% cây trên tuyến và nộp báo cáo nghiệm thu lên Ban Giám Sát thành công!`);
    } catch (err: any) {
      alert(`Lỗi thực hiện nhanh: ${err.message}`);
    } finally {
      setIsFastCompletingRoute(false);
    }
  };

  const handleFieldItemComplete = (itemId: string) => {
    try {
      storage.updateWorkOrderItemExecution(itemId, 'COMPLETED', currentUser.id);
      setWorkOrdersVersion((v) => v + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFieldItemSkip = (itemId: string) => {
    const reason = prompt(
      'Nhập lý do thực tế bỏ qua cây này (Bắt buộc):\n1. Ô tô đỗ chắn\n2. Vướng đường dây điện trung thế\n3. Chủ nhà không cho tiếp cận\n4. Mưa dông nguy hiểm',
      'Ô tô đỗ chắn vỉa hè không thể mở chân xe thang'
    );
    if (!reason || !reason.trim()) return;

    try {
      storage.updateWorkOrderItemExecution(itemId, 'SKIPPED', currentUser.id, reason.trim());
      setWorkOrdersVersion((v) => v + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFieldItemFail = (itemId: string) => {
    const reason = prompt(
      'Nhập lý do thất bại / không thể thi công (Bắt buộc):\n1. Cần xe thang vươn cao hơn (>18m)\n2. Có tổ ong bắp cày nguy hiểm\n3. Cây mục rỗng gốc nghiêm trọng\n4. Thiếu thiết bị cưa xích chuyên dụng',
      'Cần xe thang vươn cao hơn (>18m) để tiếp cận tán ngọn'
    );
    if (!reason || !reason.trim()) return;

    try {
      storage.updateWorkOrderItemExecution(itemId, 'FAILED', currentUser.id, reason.trim());
      setWorkOrdersVersion((v) => v + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFieldItemRequestFollowUp = (itemId: string) => {
    const reason = prompt(
      'Yêu cầu Điều phối viên hỗ trợ kỹ thuật bổ sung (Follow-up):\nNhập trang thiết bị hoặc năng lực cần chi viện:',
      'Đề nghị chi viện xe thang 22m và tổ bắt ong bắp cày'
    );
    if (!reason || !reason.trim()) return;

    try {
      storage.markItemNeedsFollowUp(itemId, reason.trim(), currentUser);
      setWorkOrdersVersion((v) => v + 1);
      alert('Đã gửi cảnh báo yêu cầu hỗ trợ kỹ thuật đến Điều Phối Viên!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Trees in selected corridor
  const corridorTrees = useMemo(() => {
    const targetCorridor = STREET_CORRIDORS_LIST.find((c) => c.id === selectedCorridorId) || STREET_CORRIDORS.find((c) => c.id === selectedCorridorId);
    if (!targetCorridor) return trees.slice(0, 5);

    const matches = trees.filter((t) => {
      const c = getTreeCorridor(t);
      const code = getTreeStreetCode(t);
      return c === targetCorridor.name || code.startsWith(targetCorridor.prefix);
    });

    return matches.length > 0 ? matches : trees.slice(0, 5);
  }, [trees, selectedCorridorId]);

  // Danh mục cây tuyến phố (Tab 3: Corridors) - Tối ưu lọc & phân trang thông minh (24 cây/trang)
  const filteredCorridorTabTrees = useMemo(() => {
    const q = corridorSearchQuery.trim().toLowerCase();
    return trees.filter((tree) => {
      if (corridorViewSelectedId !== 'ALL') {
        const target = STREET_CORRIDORS_LIST.find((c) => c.id === corridorViewSelectedId);
        if (target) {
          const c = getTreeCorridor(tree);
          const code = getTreeStreetCode(tree);
          if (c !== target.name && !code.startsWith(target.prefix)) return false;
        }
      }
      if (q) {
        const sc = getTreeStreetCode(tree).toLowerCase();
        const ms = getTreeMilestone(tree).toLowerCase();
        const dn = (tree.displayName || '').toLowerCase();
        const cd = (tree.publicCode || '').toLowerCase();
        const ad = (tree.address || '').toLowerCase();
        if (!sc.includes(q) && !ms.includes(q) && !dn.includes(q) && !cd.includes(q) && !ad.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [trees, corridorViewSelectedId, corridorSearchQuery]);

  const totalCorridorPages = Math.max(1, Math.ceil(filteredCorridorTabTrees.length / corridorPageSize));
  const paginatedCorridorTrees = useMemo(() => {
    const start = (corridorPage - 1) * corridorPageSize;
    return filteredCorridorTabTrees.slice(start, start + corridorPageSize);
  }, [filteredCorridorTabTrees, corridorPage, corridorPageSize]);

  // 📍 Radar GPS State & Auto-Detect for Staff
  const [isScanningGps, setIsScanningGps] = useState(false);
  const [radarNearestTree, setRadarNearestTree] = useState<{ tree: Tree; distanceM: number } | null>(null);
  const [radarToast, setRadarToast] = useState<string | null>(null);

  const handleTriggerStaffGpsRadar = () => {
    setIsScanningGps(true);
    setRadarToast('🛰️ Đang quét GPS vi sai tìm cây gần xe thang nhất trong bán kính 5m...');

    const onCoords = (lat: number, lng: number) => {
      const nearest = findNearestTree(lat, lng, trees);
      if (nearest) {
        setRadarNearestTree(nearest);
        const streetCode = getTreeStreetCode(nearest.tree);
        const milestone = getTreeMilestone(nearest.tree);
        setRadarToast(`🎯 PHÁT HIỆN CÂY TRƯỚC MẶT: [${streetCode}] (${nearest.distanceM}m) · ${milestone}`);
      }
      setIsScanningGps(false);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => onCoords(pos.coords.latitude, pos.coords.longitude),
        () => onCoords(10.036829, 105.782541),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      onCoords(10.036829, 105.782541);
    }
  };

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
      <div className="relative rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl border border-emerald-200/90 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 dark:from-[#071911] dark:via-[#0b281d] dark:to-[#040e09] text-slate-800 dark:text-white p-5 sm:p-7 transition-colors">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-400/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Status Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981] dark:shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                CA TRỰC THỰC ĐỊA HOẠT ĐỘNG (07:00 – 17:00)
              </span>
              <span className="text-slate-300 dark:text-white/40">•</span>
              <span className="text-xs text-slate-600 dark:text-emerald-200/80 flex items-center gap-1 font-mono">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>GPS: Q. Ninh Kiều (10.0341° N, 105.7794° E)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-400/20 border border-emerald-300 dark:border-emerald-400/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                TỔ XE CƠ ĐỘNG #01
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100/90 dark:bg-amber-400/20 border border-amber-300 dark:border-amber-400/40 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold">
                XE THANG 14M
              </span>
            </div>
          </div>

          {/* Profile & Shift Overview */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-300 to-amber-300 p-0.5 shadow-xl shrink-0">
                <div className="w-full h-full bg-emerald-50 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Wrench className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>KỸ THUẬT VIÊN THỰC ĐỊA CHÍNH</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{currentUser.fullName}</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-emerald-100/70">
                  Đội Quản lý Cây xanh Đô thị TP. Cần Thơ · Trực chiến phòng chống thiên tai
                </p>
              </div>
            </div>

            {/* Shift Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {reopenedIncidents.length + inProgressIncidents.length}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-rose-200/80 uppercase mt-0.5">
                  Sự Cố Cần Xử Lý
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-300 font-mono">
                  {reopenedIncidents.length}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-amber-200/80 uppercase mt-0.5">
                  Dân Khiếu Nại
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-300 font-mono">
                  {corridorTrees.length}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-teal-200/80 uppercase mt-0.5">
                  Cây Trên Tuyến
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none text-center min-w-[90px]">
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-300 font-mono">
                  {myCareRecords.length}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-emerald-200/80 uppercase mt-0.5">
                  Chứng Chỉ On-Chain
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📡 Staff Radar GPS Notification */}
      {radarToast && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl border border-emerald-400/50 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="text-xs font-medium">
              <span>{radarToast}</span>
            </div>
          </div>
          {radarNearestTree && (
            <button
              onClick={() => onSelectTree(radarNearestTree.tree)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              Mở cây này
            </button>
          )}
        </div>
      )}

      {/* ⚡ 2. BIG GLOVE-FRIENDLY ACTION BAR (4 NÚT BẤM KÍCH THƯỚC LỚN CHO GĂNG TAY LAO ĐỘNG) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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

        {/* 📍 Nút Radar GPS mới */}
        <button
          onClick={handleTriggerStaffGpsRadar}
          disabled={isScanningGps}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg active:scale-95 transition-all flex items-center justify-between cursor-pointer border border-teal-500/40 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-white">
              <LocateFixed className={`w-6 h-6 ${isScanningGps ? 'animate-spin' : 'animate-pulse'}`} />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight">
                {isScanningGps ? 'Đang Bắt Sóng...' : 'Radar GPS Cây Gần'}
              </div>
              <div className="text-[11px] text-teal-100/80">Quét cây trong bán kính 5m</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onOpenQrScanner}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 dark:from-slate-900 dark:to-slate-800 dark:hover:from-slate-800 dark:hover:to-slate-700 text-white shadow-lg active:scale-95 transition-all flex items-center justify-between cursor-pointer border border-blue-400/40 dark:border-slate-700/80 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 dark:bg-emerald-500/20 border border-white/30 dark:border-emerald-500/40 flex items-center justify-center shrink-0 text-white dark:text-emerald-400">
              <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black tracking-tight">Quét QR Trước Mặt</div>
              <div className="text-[11px] text-blue-100/90 dark:text-slate-300">Mở camera nhận diện ngay</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-200 dark:text-slate-400 group-hover:translate-x-1 transition-transform" />
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
          onClick={() => setActiveTab('work_orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'work_orders'
              ? 'bg-white dark:bg-[#0c1812] text-emerald-900 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Lệnh Tuyến Của Đội ({myWorkOrders.length})</span>
        </button>

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

      {/* 🌟 4. TAB CONTENT 0: LỆNH CÔNG TÁC THEO TUYẾN CỦA ĐỘI HIỆN TRƯỜNG */}
      {activeTab === 'work_orders' && (
        <div className="space-y-4">
          {/* 🧭 HÀNG ĐỢI VẬN HÀNH THỰC TẾ (OPERATIONAL RESOLUTION INBOX - WAVE 4.9) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setOperationalQueue('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                operationalQueue === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>Tất Cả</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-800 dark:text-slate-200">
                {myWorkOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalQueue('EMERGENCY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                operationalQueue === 'EMERGENCY'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
              }`}
            >
              <span>🚨 Khẩn Cấp</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-[10px] text-rose-900 dark:text-rose-100">
                {emergencyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalQueue('ALERTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                operationalQueue === 'ALERTS'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
              }`}
            >
              <span>⚠️ Cảnh Báo Bão</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-[10px] text-amber-900 dark:text-amber-100">
                {alertsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalQueue('ASSIGNED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                operationalQueue === 'ASSIGNED'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100'
              }`}
            >
              <span>📋 Đã Được Giao</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-200 dark:bg-indigo-900 text-[10px] text-indigo-900 dark:text-indigo-100">
                {assignedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalQueue('IN_PROGRESS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                operationalQueue === 'IN_PROGRESS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100'
              }`}
            >
              <span>🔧 Đang Thực Hiện</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-200 dark:bg-blue-900 text-[10px] text-blue-900 dark:text-blue-100">
                {inProgressCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalQueue('SUBMITTED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                operationalQueue === 'SUBMITTED'
                  ? 'bg-yellow-600 text-white shadow-sm'
                  : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/60 hover:bg-yellow-100'
              }`}
            >
              <span>⏳ Chờ Xác Minh</span>
              <span className="px-1.5 py-0.2 rounded-full bg-yellow-200 dark:bg-yellow-900 text-[10px] text-yellow-900 dark:text-yellow-100">
                {submittedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOperationalQueue('RESOLVED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                operationalQueue === 'RESOLVED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100'
              }`}
            >
              <span>✅ Đã Hoàn Thành</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900 text-[10px] text-emerald-900 dark:text-emerald-100">
                {completedCount}
              </span>
            </button>
          </div>

          {/* HIỂN THỊ TRUNG TÂM CHIẾN DỊCH BÃO NẾU CHỌN TAB ALERTS */}
          {operationalQueue === 'ALERTS' && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-300 dark:border-amber-800/60 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-black tracking-wider text-amber-700 dark:text-amber-400 uppercase">
                    Chiến Dịch Rà Soát Cắt Tỉa Hạ Độ Cao Mùa Bão 2026
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    Hàng Đợi Cây Nguy Cơ Cần Phân Bổ & Xử Lý
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm">
                  {stormCampaign ? stormCampaign.status : 'ACTIVE'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {stormCampaign ? stormCampaign.totalDetectedTrees : 5424}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Phát Hiện Ban Đầu</div>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {stormCampaign ? stormCampaign.assignedTrees + stormCampaign.inProgressTrees : 100}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Đã Phân Bổ / Đang Thi Công</div>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {stormCampaign ? stormCampaign.resolvedTrees : 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Đã Nghiệm Thu An Toàn</div>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {stormCampaign ? stormCampaign.remainingTrees : 5424}
                  </div>
                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Còn Cần Xử Lý</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-200 dark:border-amber-900/40 flex-wrap">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Chiến dịch chỉ giảm số lượng cây còn tồn khi đã được KTV thi công và Giám sát viên nghiệm thu ĐẠT.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await storage.triggerStormEmergencyDispatch();
                        alert(res.message || 'Đã phân bổ lệnh cắt tỉa khẩn cấp theo tuyến');
                        setWorkOrdersVersion((v) => v + 1);
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    <span>⚡ Nhận Phân Bổ Lệnh Tuyến Khẩn Cấp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredWorkOrders.length === 0 && operationalQueue !== 'ALERTS' ? (
            <div className="p-12 text-center bg-white dark:bg-[#0c1812] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-2">
              <Truck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Không có lệnh công tác nào trong phân khúc hàng đợi này
              </div>
              <div className="text-slate-500">
                Hãy chuyển sang các phân khúc khác hoặc chọn "Tất Cả" để xem toàn bộ danh mục nhiệm vụ.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkOrders.map((wo) => {
                const isRejected = wo.status === 'REJECTED';
                const isDispatched = wo.status === 'ASSIGNED';
                const isInProgress = wo.status === 'IN_PROGRESS';
                const isSubmitted = wo.status === 'SUBMITTED_FOR_REVIEW';
                const isCompleted = wo.status === 'COMPLETED';

                const isIncident = !!(wo.incidentId || (wo.title && wo.title.includes('SỰ CỐ')));
                const isStorm = !!(wo.campaignId || wo.type === 'PRUNING' || (wo.title && wo.title.includes('MÙA BÃO')) || (wo.code && wo.code.includes('STORM')));

                // Khối lượng cây thực tế từ SQLite
                const total = wo.totalItems || 0;
                const completed = wo.completedItems || 0;
                const pending = Math.max(0, total - completed - (wo.skippedItems || 0) - (wo.failedItems || 0));
                const inProgress = (isInProgress && pending > 0) ? Math.min(5, pending) : 0;
                const unhandled = Math.max(0, pending - inProgress);
                const submitted = isSubmitted ? completed : 0;
                const verified = isCompleted ? completed : (isSubmitted ? 0 : completed);

                return (
                  <div
                    key={wo.id}
                    className={`p-5 rounded-3xl bg-white dark:bg-[#0c1812] border transition-all shadow-md flex flex-col justify-between ${
                      isRejected
                        ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20'
                        : isInProgress
                        ? 'border-blue-400 dark:border-blue-500/50 shadow-blue-500/10 ring-1 ring-blue-400/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges: Code, Type Badge, Status Badge */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                            {wo.code}
                          </span>
                          {/* Type Badge */}
                          {isIncident ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>🚨 SỰ CỐ ĐƠN LẺ {wo.incidentId ? `#${wo.incidentId}` : ''}</span>
                            </span>
                          ) : isStorm ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <span>🌪️ CHIẾN DỊCH MÙA BÃO</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                              <span>📅 BẢO DƯỠNG ĐỊNH KỲ</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {wo.priority === 'CRITICAL' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                              KHẨN CẤP
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                : isInProgress
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 animate-pulse'
                                : isSubmitted
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300'
                            }`}
                          >
                            {isCompleted
                              ? 'ĐÃ NGHIỆM THU'
                              : isInProgress
                              ? 'ĐANG THI CÔNG'
                              : isSubmitted
                              ? 'CHỜ NGHIỆM THU'
                              : isRejected
                              ? 'YÊU CẦU LÀM LẠI'
                              : 'ĐÃ NHẬN LỆNH'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Route & Vehicle Info */}
                      <div>
                        <h4 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                          {wo.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {wo.routeCorridorName || 'Tuyến đô thị'}
                          </span>
                          {wo.assignedTeamName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                👥 {wo.assignedTeamName}
                              </span>
                            </>
                          )}
                          {wo.assignedVehiclePlate && (
                            <>
                              <span>•</span>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                🚒 Xe: {wo.assignedVehiclePlate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Workload Section */}
                      {isStorm ? (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <Trees className="w-4 h-4" />
                              <span>🌳 KHỐI LƯỢNG: {total} cây</span>
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-bold">
                              Tiến độ: <span className="text-emerald-600 dark:text-emerald-400 font-black">{completed}/{total}</span> ({wo.progressPercent || 0}%)
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                              style={{ width: `${wo.progressPercent || 0}%` }}
                            />
                          </div>

                          {/* Breakdown Pills: ⬜ chưa xử lý | 🔧 đang xử lý | ⏳ chờ nghiệm thu | ✅ đã hoàn thành */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              ⬜ {unhandled} chưa xử lý
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                              🔧 {inProgress} đang xử lý
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                              ⏳ {submitted} chờ nghiệm thu
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                              ✅ {verified} đã hoàn thành
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Phạm vi ảnh hưởng: {total || 1} cây</span>
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              Đã xử lý: <strong className="text-emerald-600 dark:text-emerald-400">{completed}/{total || 1} cây</strong>
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full transition-all duration-300"
                              style={{ width: `${wo.progressPercent || 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Thông báo nếu lệnh bị Giám sát viên từ chối để làm lại */}
                      {isRejected && (
                        <div className="p-3 rounded-2xl bg-rose-100/80 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                          <div className="flex items-center gap-1.5 font-black uppercase text-[11px] text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Giám Sát Viên Yêu Cầu Khắc Phục Lại:</span>
                          </div>
                          <div className="italic text-rose-800 dark:text-rose-200 pl-5">
                            "{wo.supervisorNotes || 'Cần hoàn thiện các cây còn sót trước khi nghiệm thu lại'}"
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(isDispatched || isRejected) && (
                          <button
                            type="button"
                            onClick={() => handleStartFieldWorkOrder(wo.id)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>{isRejected ? 'Làm Lại Tuyến' : 'Bắt Đầu Thi Công'}</span>
                          </button>
                        )}

                        {/* ⚡ Nút 1-Chạm Hoàn Tất Toàn Tuyến & Nộp Nghiệm Thu cho Staff */}
                        {!isCompleted && !isSubmitted && (
                          <button
                            type="button"
                            disabled={isFastCompletingRoute}
                            onClick={() => handleFastCompleteEntireRouteForStaff(wo.id)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-102"
                            title="Tự động hoàn thành toàn bộ cây trên tuyến và nộp báo cáo nghiệm thu ngay lập tức"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>{isFastCompletingRoute ? 'Đang gửi...' : '⚡ Xong Tuyến (1-Chạm)'}</span>
                          </button>
                        )}

                        {/* Nút Đổi Đội / Phân Đội */}
                        <button
                          type="button"
                          onClick={() => setReassigningWorkOrder(wo)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Điều chuyển hoặc chỉ định tổ thi công"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{wo.assignedTeamId ? '👥 Đổi Đội' : '👥 Phân Đội'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {isSubmitted && (
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 py-1">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span className="hidden sm:inline">Chờ Duyệt</span>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Đã Duyệt</span>
                          </div>
                        )}

                        {/* Nút Chi Tiết & Mở Sổ Kiểm Tra */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWorkOrderId(wo.id);
                            setIsLoadingDetails(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Xem chi tiết lệnh công tác"
                        >
                          <span>Chi Tiết</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWorkOrderId(wo.id);
                            setIsLoadingDetails(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
                          title="Mở sổ kiểm tra từng cây trên tuyến"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Mở Sổ ({wo.completedItems || 0}/{wo.totalItems || 0} cây) →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 📋 DRAWER: SỔ KIỂM TRA HIỆN TRƯỜNG TỪNG CÂY THEO TUYẾN */}
      <RightSlideOverDrawer
        isOpen={!!selectedWorkOrderId}
        onClose={() => setSelectedWorkOrderId(null)}
        widthClass="max-w-2xl sm:max-w-3xl lg:max-w-4xl"
        title={
          activeDrawerWorkOrder ? (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {activeDrawerWorkOrder.code}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white truncate">
                {activeDrawerWorkOrder.title}
              </span>
            </div>
          ) : undefined
        }
        subtitle={
          activeDrawerWorkOrder ? (
            <span>
              Tuyến: <strong className="text-slate-800 dark:text-slate-200">{activeDrawerWorkOrder.routeCorridorName || 'Tuyến Đô Thị'}</strong> · Xe: <strong className="text-slate-800 dark:text-slate-200">{activeDrawerWorkOrder.assignedVehiclePlate || 'N/A'}</strong>
            </span>
          ) : undefined
        }
        headerBadge={
          activeDrawerWorkOrder ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              {selectedWorkOrderDetails && selectedWorkOrderDetails.items.length > 0 ? (
                `${selectedWorkOrderDetails.items.filter((it) => it.status === 'COMPLETED').length}/${selectedWorkOrderDetails.items.length} cây (${Math.round((selectedWorkOrderDetails.items.filter((it) => it.status === 'COMPLETED').length / selectedWorkOrderDetails.items.length) * 100)}%)`
              ) : activeDrawerWorkOrder.totalItems > 0 ? (
                `${activeDrawerWorkOrder.completedItems || 0}/${activeDrawerWorkOrder.totalItems} cây`
              ) : (
                '0 cây'
              )}
            </span>
          ) : undefined
        }
        footer={
          activeDrawerWorkOrder ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {activeDrawerWorkOrder.status === 'ASSIGNED' ? (
                <button
                  type="button"
                  onClick={() => handleStartFieldWorkOrder(activeDrawerWorkOrder.id)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Bắt Đầu Thi Công Ngay</span>
                </button>
              ) : activeDrawerWorkOrder.status === 'IN_PROGRESS' || activeDrawerWorkOrder.status === 'REJECTED' ? (
                <button
                  type="button"
                  onClick={() => handleSubmitFieldWorkOrder(activeDrawerWorkOrder.id)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Nộp Báo Cáo Nghiệm Thu Lên Ban Giám Sát</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  Mọi thao tác đánh dấu tại hiện trường được đồng bộ trực tiếp lên hệ thống trung tâm.
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedWorkOrderId(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : undefined
        }
      >
        {isLoadingDetails && (!selectedWorkOrderDetails || selectedWorkOrderDetails.items.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Đang tải sổ kiểm tra thực địa &amp; thông số cây từ máy chủ...
            </div>
          </div>
        ) : selectedWorkOrderDetails ? (
          <div className="space-y-3.5">
            {/* Banner trạng thái nếu lệnh đang ASSIGNED */}
            {activeDrawerWorkOrder?.status === 'ASSIGNED' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Lệnh Công Tác Đã Giao — Sẵn Sàng Xuất Phát</span>
                  </div>
                  <p className="text-xs text-amber-700/90 dark:text-amber-400">
                    Bấm &quot;Bắt Đầu Thi Công&quot; để ghi nhận thời điểm tiếp cận hiện trường và mở khoá checklist từng cây.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartFieldWorkOrder(activeDrawerWorkOrder.id)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
                >
                  <Play className="w-4 h-4" />
                  <span>Bắt Đầu Thi Công Ngay</span>
                </button>
              </div>
            )}

            {/* Banner thông báo nếu lệnh bị Giám sát REJECTED */}
            {activeDrawerWorkOrder?.status === 'REJECTED' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-1">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Yêu Cầu Làm Lại Từ Ban Giám Sát</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  {activeDrawerWorkOrder.supervisorNotes || 'Cần kiểm tra và khắc phục lại các cây chưa đạt tiêu chuẩn kỹ thuật trước khi nộp lại.'}
                </p>
              </div>
            )}

            {/* ⚡ BANNER 1-CHẠM HOÀN TẤT TRỌN GÓI CẢ TUYẾN DÀNH CHO KTV */}
            {activeDrawerWorkOrder && activeDrawerWorkOrder.status !== 'COMPLETED' && activeDrawerWorkOrder.status !== 'CLOSED' && activeDrawerWorkOrder.status !== 'SUBMITTED_FOR_REVIEW' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-0.5">
                  <div className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
                    <span>Thi Công Nhanh 1-Chạm Toàn Bộ Tuyến</span>
                  </div>
                  <p className="text-[11px] text-emerald-100">
                    Tự động hoàn thành toàn bộ {selectedWorkOrderDetails?.items.length || 0} cây trên tuyến và nộp báo cáo nghiệm thu lên Giám Sát Viên chỉ với 1 click.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isFastCompletingRoute}
                  onClick={() => handleFastCompleteEntireRouteForStaff(activeDrawerWorkOrder.id)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-105 shrink-0"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>{isFastCompletingRoute ? 'Đang Gửi Nghiệm Thu...' : `⚡ Hoàn Tất Cả Tuyến (${selectedWorkOrderDetails?.items.length || 0} Cây)`}</span>
                </button>
              </div>
            )}

            {/* Thanh lọc trạng thái cây trong lệnh */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setItemFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  itemFilterStatus === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Tất Cả ({selectedWorkOrderDetails.items.length})
              </button>
              <button
                type="button"
                onClick={() => setItemFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  itemFilterStatus === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Chưa Xử Lý ({selectedWorkOrderDetails.items.filter((it) => it.status !== 'COMPLETED').length})
              </button>
              <button
                type="button"
                onClick={() => setItemFilterStatus('COMPLETED')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  itemFilterStatus === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Đã Xong ({selectedWorkOrderDetails.items.filter((it) => it.status === 'COMPLETED').length})
              </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Danh Sách Cây Cần Xử Lý ({
                  selectedWorkOrderDetails.items.filter((it) => {
                    if (itemFilterStatus === 'PENDING') return it.status !== 'COMPLETED';
                    if (itemFilterStatus === 'COMPLETED') return it.status === 'COMPLETED';
                    return true;
                  }).length
                } cây):
              </div>
              {selectedWorkOrderDetails.items.length > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all-pending"
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    checked={
                      selectedWorkOrderDetails.items.filter((it) => it.status !== 'COMPLETED').length > 0 &&
                      selectedWorkOrderDetails.items
                        .filter((it) => it.status !== 'COMPLETED')
                        .every((it) => selectedBatchItemIds.includes(it.id))
                    }
                    onChange={(e) => {
                      const pendingIds = selectedWorkOrderDetails.items
                        .filter((it) => it.status !== 'COMPLETED')
                        .map((it) => it.id);
                      if (e.target.checked) {
                        setSelectedBatchItemIds(pendingIds);
                      } else {
                        setSelectedBatchItemIds([]);
                      }
                    }}
                  />
                  <label htmlFor="select-all-pending" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Chọn tất cả chưa xử lý ({selectedWorkOrderDetails.items.filter((it) => it.status !== 'COMPLETED').length})
                  </label>
                </div>
              )}
            </div>

            {/* BATCH TOOLBAR: XỬ LÝ HÀNG LOẠT NHIỀU CÂY TRÊN TUYẾN (WAVE 4.9) */}
            {selectedBatchItemIds.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                    ⚡ Xử lý hàng loạt {selectedBatchItemIds.length} cây đã chọn
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBatchItemIds([])}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>

                <input
                  type="text"
                  value={batchItemNotes}
                  onChange={(e) => setBatchItemNotes(e.target.value)}
                  placeholder="Ghi chú thi công đợt cây (vd: Cắt tỉa hạ ngọn an toàn đón bão)"
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ảnh hiện trường tự động bảo chứng</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchCompleteItems}
                    disabled={isSubmittingBatchItems}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all ml-auto"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmittingBatchItems ? 'Đang Lưu...' : `Hoàn Tất Lô (${selectedBatchItemIds.length} Cây)`}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedWorkOrderDetails.items.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                Chưa có danh sách checklist từng cây cho lệnh công tác này hoặc dữ liệu đang được đồng bộ từ máy chủ.
              </div>
            ) : (
              selectedWorkOrderDetails.items
                .filter((it) => {
                  if (itemFilterStatus === 'PENDING') return it.status !== 'COMPLETED';
                  if (itemFilterStatus === 'COMPLETED') return it.status === 'COMPLETED';
                  return true;
                })
                .map((item, index) => {
                  const isItemCompleted = item.status === 'COMPLETED';
                  const isItemSkipped = item.status === 'SKIPPED';
                  const isItemFailed = item.status === 'FAILED';
                  const isItemFollowUp = item.status === 'NEEDS_FOLLOW_UP';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isItemCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : isItemSkipped
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : isItemFailed
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : isItemFollowUp
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Checkbox chọn hàng loạt */}
                          <input
                            type="checkbox"
                            checked={selectedBatchItemIds.includes(item.id)}
                            disabled={isItemCompleted}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBatchItemIds((prev) => [...prev, item.id]);
                              } else {
                                setSelectedBatchItemIds((prev) => prev.filter((id) => id !== item.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 mt-1.5 shrink-0"
                          />

                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              isItemCompleted
                                ? 'bg-emerald-500 text-white'
                                : isItemSkipped
                                ? 'bg-amber-500 text-white'
                                : isItemFailed
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="space-y-1">
                            {/* Mã cây, loài cây, kích thước */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                {item.treeStreetCode || (item.treeId ? `CT-${item.treeId}` : 'CÂY-CHƯA-MÃ')}
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                {item.species || item.treeDisplayName || 'Cây Xanh Đô Thị'}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                📐 Cao: {item.heightMeter || 8}m | ĐK: {item.diameterCm || 25}cm
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                                Sức khỏe: {item.healthStatus || 'Tốt'}
                              </span>
                            </div>

                            {/* Cột mốc số nhà / vị trí */}
                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Vị trí / Cột mốc: <strong className="text-slate-700 dark:text-slate-300">{item.houseMilestone || item.address || 'Vỉa hè đô thị'}</strong></span>
                            </div>

                            {/* Lý do cảnh báo / phân công */}
                            {item.reason && (
                              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md inline-block">
                                ⚠️ <span className="font-semibold">Lý do:</span> {item.reason}
                              </div>
                            )}

                            {/* Lý do bỏ qua / báo hỏng nếu có */}
                            {item.skipOrFailureReason && (
                              <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md inline-block">
                                🚫 <span className="font-semibold">Ghi chú hiện trường:</span> {item.skipOrFailureReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Field Action Buttons (Large, glove-friendly) */}
                        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                          {isItemCompleted ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>ĐÃ HOÀN TẤT</span>
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleFieldItemComplete(item.id)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                              >
                                <Check className="w-4 h-4" />
                                <span>Hoàn Tất</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFieldItemSkip(item.id)}
                                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 dark:bg-slate-800 dark:hover:bg-amber-950/60 dark:text-slate-300 dark:hover:text-amber-300 font-bold text-xs transition-colors cursor-pointer"
                              >
                                <span>Bỏ Qua</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFieldItemFail(item.id)}
                                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:text-slate-300 dark:hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                              >
                                <span>Báo Hỏng</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFieldItemRequestFollowUp(item.id)}
                                title="Gửi yêu cầu điều xe thang lớn hơn hoặc chi viện kỹ thuật"
                                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 dark:bg-slate-800 dark:hover:bg-purple-950/60 dark:text-slate-300 dark:hover:text-purple-300 font-bold text-xs transition-colors cursor-pointer"
                              >
                                <Radio className="w-3.5 h-3.5" />
                                <span>Chi Viện</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Đang chờ tải danh sách cây từ máy chủ SQLite
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Nếu danh sách chưa hiện, bấm nút bên dưới để đồng bộ trực tiếp.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedWorkOrderId) {
                  setIsLoadingDetails(true);
                  storage.syncWorkOrderDetails(selectedWorkOrderId).finally(() => {
                    setIsLoadingDetails(false);
                    setWorkOrdersVersion((v) => v + 1);
                  });
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
            >
              🔄 Tải Danh Sách Cây
            </button>
          </div>
        )}
      </RightSlideOverDrawer>

      {/* 👥 MODAL: CHỈ ĐỊNH / ĐIỀU CHUYỂN TỔ THI CÔNG */}
      {reassigningWorkOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1812] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>Chỉ Định / Điều Chuyển Tổ Thi Công</span>
              </h3>
              <button
                type="button"
                onClick={() => setReassigningWorkOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div>
                Mã lệnh: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{reassigningWorkOrder.code}</strong>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {reassigningWorkOrder.title}
              </div>
              <div>
                Tuyến: <strong>{reassigningWorkOrder.routeCorridorName || 'Tuyến Đô Thị'}</strong>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chọn Tổ Cơ Giới / Kỹ Thuật tiếp nhận:
              </div>
              {allTeams.map((team) => {
                const isSelected = reassigningWorkOrder.assignedTeamId === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleReassignTeam(reassigningWorkOrder.id, team.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{team.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tổ trưởng: {team.leaderName} ({team.leaderPhone})
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-1 rounded-lg">
                        Đang phụ trách
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        Giao việc →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setReassigningWorkOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
                        <span className="font-mono font-black text-xs text-amber-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700 shadow-2xs">
                          [{getTreeStreetCode(tree)}]
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                        <span className="text-[10px] font-semibold text-emerald-600">● {tree.healthStatus}</span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {tree.displayName}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                        📍 {getTreeMilestone(tree)}
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

          {/* Thanh công cụ lọc & tìm kiếm tuyến đường dành cho KTV */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Tuyến phố:
              </span>
              <select
                value={corridorViewSelectedId}
                onChange={(e) => {
                  setCorridorViewSelectedId(e.target.value);
                  setCorridorPage(1);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">🌐 Tất cả tuyến phố ({trees.length} cây)</option>
                {STREET_CORRIDORS_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    📍 {c.name} ({c.prefix})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={corridorSearchQuery}
                onChange={(e) => {
                  setCorridorSearchQuery(e.target.value);
                  setCorridorPage(1);
                }}
                placeholder="Tìm mã [HB-01], số nhà, loài..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Grid Cây hiển thị mượt mà theo phân trang */}
          {paginatedCorridorTrees.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">
              Không tìm thấy cây nào thuộc tuyến phố này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paginatedCorridorTrees.map((tree, idx) => {
                const streetCode = getTreeStreetCode(tree);
                const milestone = getTreeMilestone(tree);
                const corridor = getTreeCorridor(tree);

                return (
                  <div
                    key={tree.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-400 transition-all space-y-3"
                  >
                    <div className="w-full h-36 rounded-xl overflow-hidden relative bg-slate-100">
                      <img
                        src={tree.imageUrl}
                        alt={tree.displayName}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/90 text-amber-300 font-mono text-[11px] font-black border border-slate-700 shadow-md">
                        [{streetCode}]
                      </span>
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        tree.healthStatus === 'GOOD' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        ● {tree.healthStatus}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{tree.displayName}</h3>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{milestone}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 pl-4">{corridor}</p>
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
                      Xem Biển Nhôm &amp; Hồ Sơ ➔
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Thanh phân trang thông minh cho KTV */}
          {totalCorridorPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 font-medium">
                Đang xem trang <strong>{corridorPage}</strong> / {totalCorridorPages} (Tổng số <strong>{filteredCorridorTabTrees.length}</strong> cây)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={corridorPage <= 1}
                  onClick={() => setCorridorPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={corridorPage >= totalCorridorPages}
                  onClick={() => setCorridorPage((p) => Math.min(totalCorridorPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-700 cursor-pointer shadow-2xs"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
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

