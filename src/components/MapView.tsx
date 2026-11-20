import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Trees,
  AlertTriangle,
  MapPin,
  Layers,
  ExternalLink,
  ClipboardList,
  ShieldCheck,
  Eye,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Crosshair,
  CheckCircle,
  X,
  Compass,
  Save,
  RotateCcw,
  Search,
  HelpCircle,
  Zap,
  Truck,
  Wrench,
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useEscapeOverlay } from '../hooks/useEscapeOverlay';
import { storage } from '../db/storage';
import { Incident, Tree, User } from '../types';
import {
  getTreeCorridor,
  getTreeMilestone,
  getTreeStreetCode,
  STREET_CORRIDORS_LIST,
} from '../utils/treeUtils';
import {
  NATIONAL_PROVINCES,
  getTreeProvinceId,
  getTreeZoneId,
  getZonesByProvince,
  UrbanZone,
} from '../utils/zoneUtils';

export interface LocationLandmark {
  id: string;
  provinceId: string;
  name: string;
  district: string;
  coords: [number, number];
  zoom: number;
  keywords: string[];
}

export const ALL_LOCATION_LANDMARKS: LocationLandmark[] = [
  // Cần Thơ
  {
    id: 'luu-huu-phuoc',
    provinceId: 'can-tho',
    name: 'Công viên Lưu Hữu Phước',
    district: 'Quận Ninh Kiều',
    coords: [10.0368, 105.7825],
    zoom: 17,
    keywords: ['lưu hữu phước', 'hòa bình', 'hb-'],
  },
  {
    id: 'ben-ninh-kieu',
    provinceId: 'can-tho',
    name: 'Bến Ninh Kiều & Tượng Bác',
    district: 'Quận Ninh Kiều',
    coords: [10.0345, 105.7882],
    zoom: 17,
    keywords: ['ninh kiều', 'hai bà trưng', 'hbt-'],
  },
  {
    id: 'cau-di-bo',
    provinceId: 'can-tho',
    name: 'Cầu Đi Bộ Ninh Kiều (Cầu Tình Yêu)',
    district: 'Quận Ninh Kiều',
    coords: [10.0328, 105.7895],
    zoom: 17,
    keywords: ['cầu đi bộ', 'tình yêu', 'cdb-'],
  },
  {
    id: 'song-hau',
    provinceId: 'can-tho',
    name: 'Công viên Bờ Kè Sông Hậu',
    district: 'Quận Ninh Kiều',
    coords: [10.0465, 105.7915],
    zoom: 17,
    keywords: ['sông hậu', 'cái khế', 'lê lợi', 'sh-'],
  },
  {
    id: 'dh-can-tho',
    provinceId: 'can-tho',
    name: 'ĐH Cần Thơ Khu II (Đường 3/2)',
    district: 'Quận Ninh Kiều',
    coords: [10.0312, 105.7691],
    zoom: 17,
    keywords: ['đại học cần thơ', '3 tháng 2', '3/2', 'xuân khánh', '3t2-'],
  },
  {
    id: 'vincom-30-4',
    provinceId: 'can-tho',
    name: 'Tuyến Vincom Plaza (Đường 30/4)',
    district: 'Quận Ninh Kiều',
    coords: [10.0288, 105.7761],
    zoom: 17,
    keywords: ['30 tháng 4', '30/4', 'vincom', 'an phú', '30t4-'],
  },
  {
    id: 'cai-rang-bridge',
    provinceId: 'can-tho',
    name: 'Cầu Cần Thơ & Đại lộ Võ Nguyên Giáp',
    district: 'Quận Cái Răng',
    coords: [10.0125, 105.7982],
    zoom: 16,
    keywords: ['cái răng', 'võ nguyên giáp', 'quang trung', 'hưng phú', 'cr-'],
  },
  {
    id: 'san-bay-binh-thuy',
    provinceId: 'can-tho',
    name: 'Sân bay Quốc tế Cần Thơ (Võ Văn Kiệt)',
    district: 'Quận Bình Thủy',
    coords: [10.0682, 105.7425],
    zoom: 16,
    keywords: ['bình thủy', 'võ văn kiệt', 'sân bay', 'an thới', 'bt-'],
  },
  {
    id: 'kcn-tra-noc',
    provinceId: 'can-tho',
    name: 'KCN Trà Nóc & Quốc Lộ 91 (Ô Môn)',
    district: 'Quận Ô Môn',
    coords: [10.1150, 105.6540],
    zoom: 16,
    keywords: ['ô môn', 'trà nóc', 'quốc lộ 91', 'ql91', 'om-'],
  },
  {
    id: 'my-khanh-pd',
    provinceId: 'can-tho',
    name: 'KDL Sinh Thái Mỹ Khánh (Phong Điền)',
    district: 'Huyện Phong Điền',
    coords: [9.9920, 105.7050],
    zoom: 16,
    keywords: ['phong điền', 'mỹ khánh', 'nguyễn văn cừ', 'pd-'],
  },

  // Đà Nẵng
  {
    id: 'cau-rong-dn',
    provinceId: 'da-nang',
    name: 'Cầu Rồng & Sông Hàn (Bạch Đằng)',
    district: 'Quận Hải Châu',
    coords: [16.0610, 108.2268],
    zoom: 17,
    keywords: ['cầu rồng', 'bạch đằng', '2 tháng 9', 'hải châu'],
  },
  {
    id: 'bien-my-khe-dn',
    provinceId: 'da-nang',
    name: 'Bãi biển Mỹ Khê & Võ Nguyên Giáp',
    district: 'Quận Sơn Trà',
    coords: [16.0658, 108.2468],
    zoom: 17,
    keywords: ['mỹ khê', 'võ nguyên giáp', 'phạm văn đồng', 'sơn trà'],
  },
  {
    id: 'ngu-hanh-son-dn',
    provinceId: 'da-nang',
    name: 'Quần thể Ngũ Hành Sơn & Non Nước',
    district: 'Quận Ngũ Hành Sơn',
    coords: [16.0020, 108.2560],
    zoom: 16,
    keywords: ['ngũ hành sơn', 'non nước', 'lê văn hiến'],
  },
  {
    id: 'cong-vien-29-3-dn',
    provinceId: 'da-nang',
    name: 'Công viên 29/3 (Điện Biên Phủ)',
    district: 'Quận Thanh Khê',
    coords: [16.0620, 108.2040],
    zoom: 17,
    keywords: ['29 tháng 3', '29/3', 'điện biên phủ', 'thanh khê'],
  },

  // TP. Hồ Chí Minh
  {
    id: 'tao-dan-hcm',
    provinceId: 'hcm',
    name: 'Công viên Tao Đàn (Quận 1)',
    district: 'Quận 1',
    coords: [10.7745, 106.6920],
    zoom: 17,
    keywords: ['tao đàn', 'nguyễn thị minh khai', 'trương định', 'quận 1'],
  },
  {
    id: 'nguyen-hue-hcm',
    provinceId: 'hcm',
    name: 'Phố đi bộ Nguyễn Huệ & Lê Duẩn',
    district: 'Quận 1',
    coords: [10.7738, 106.7042],
    zoom: 17,
    keywords: ['nguyễn huệ', 'lê duẩn', 'lê lợi', 'quận 1'],
  },
  {
    id: 'ho-con-rua-hcm',
    provinceId: 'hcm',
    name: 'Hồ Con Rùa & Đại thụ Quận 3',
    district: 'Quận 3',
    coords: [10.7825, 106.6960],
    zoom: 17,
    keywords: ['hồ con rùa', 'quận 3', 'võ văn tần', 'phạm ngọc thạch'],
  },
  {
    id: 'thu-thiem-hcm',
    provinceId: 'hcm',
    name: 'Khu Đô thị Mới Thủ Thiêm',
    district: 'TP. Thủ Đức',
    coords: [10.7780, 106.7220],
    zoom: 16,
    keywords: ['thủ thiêm', 'mai chí thọ', 'thủ đức'],
  },
  {
    id: 'phu-my-hung-hcm',
    provinceId: 'hcm',
    name: 'Hồ Bán Nguyệt Phú Mỹ Hưng',
    district: 'Quận 7',
    coords: [10.7285, 106.7195],
    zoom: 16,
    keywords: ['phú mỹ hưng', 'nguyễn văn linh', 'quận 7', 'tôn dật tiên'],
  },

  // TP. Hà Nội
  {
    id: 'ho-hoan-kiem-hn',
    provinceId: 'ha-noi',
    name: 'Hồ Hoàn Kiếm (Cây Lộc Vừng & Tháp Rùa)',
    district: 'Quận Hoàn Kiếm',
    coords: [21.0285, 105.8525],
    zoom: 17,
    keywords: ['hoàn kiếm', 'hồ gươm', 'đinh tiên hoàng', 'tràng tiền'],
  },
  {
    id: 'phan-dinh-phung-hn',
    provinceId: 'ha-noi',
    name: 'Đường Phan Đình Phùng (Hàng Sấu Cổ Thụ)',
    district: 'Quận Ba Đình',
    coords: [21.0405, 105.8390],
    zoom: 17,
    keywords: ['phan đình phùng', 'ba đình', 'hoàng diệu'],
  },
  {
    id: 'ho-tay-hn',
    provinceId: 'ha-noi',
    name: 'Hồ Tây & Đường Thanh Niên',
    district: 'Quận Tây Hồ',
    coords: [21.0515, 105.8360],
    zoom: 16,
    keywords: ['hồ tây', 'thanh niên', 'quảng an', 'tây hồ'],
  },
  {
    id: 'cong-vien-cau-giay-hn',
    provinceId: 'ha-noi',
    name: 'Công viên Cầu Giấy (Thành Thái)',
    district: 'Quận Cầu Giấy',
    coords: [21.0280, 105.7890],
    zoom: 17,
    keywords: ['cầu giấy', 'thành thái', 'duy tân'],
  },
];

export interface RemediationPlan {
  actionTitle: string;
  solutionDetail: string;
  recommendedTeamName: string;
  recommendedTeamId: string;
  recommendedVehicleName: string;
  recommendedVehiclePlate: string;
  urgencyLabel: string;
  safetyRadiusM: number;
  slaMinutes: number;
}

export function getIncidentRemediationPlan(incident: Incident): RemediationPlan {
  const desc = (incident.description || '').toLowerCase();

  if (desc.includes('gãy') || desc.includes('canh') || desc.includes('nhánh') || desc.includes('tước') || desc.includes('sap gay')) {
    return {
      actionTitle: 'Cắt Tỉa Hạ Cành Sắp Gãy Khẩn Cấp',
      solutionDetail: 'Điều xe thang vươn cao cắt bỏ cành xé toạc, giải tỏa áp lực tán ngọn đón bão, lập rào chắn tĩnh không an toàn.',
      recommendedTeamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
      recommendedTeamId: 'team-1',
      recommendedVehicleName: 'Xe Thang Nâng Người Chuyên Dụng 18m',
      recommendedVehiclePlate: '65A-0892',
      urgencyLabel: 'KHẨN CẤP (Ưu tiên mức 1)',
      safetyRadiusM: 8,
      slaMinutes: 120,
    };
  }

  if (desc.includes('nghiêng') || desc.includes('đổ') || desc.includes('bật gốc') || desc.includes('sụp') || desc.includes('nguy cap')) {
    return {
      actionTitle: 'Gia Cố Chống Đổ & Neo Cáp Thép Chịu Lực',
      solutionDetail: 'Dùng cẩu tự hành nâng đỡ thân nghiêng, đóng 3 cọc thép định hình tam giác, hạ 40% diện tích tán giảm cản gió.',
      recommendedTeamName: 'Tổ Cơ Động Ứng Cứu Khẩn Cấp Mùa Bão',
      recommendedTeamId: 'team-3',
      recommendedVehicleName: 'Xe Cẩu Thùng Tự Hành 5 Tấn',
      recommendedVehiclePlate: '65A-012.34',
      urgencyLabel: 'CỰC KỲ NGUY HIỂM',
      safetyRadiusM: 12,
      slaMinutes: 60,
    };
  }

  if (desc.includes('dây điện') || desc.includes('cháy') || desc.includes('chập') || desc.includes('điện')) {
    return {
      actionTitle: 'Phối Hợp Điện Lực Cắt Điện & Tỉa Tán Thông Quang',
      solutionDetail: 'Khoanh vùng cảnh báo rò điện, phối hợp Điện lực Cần Thơ cô lập lộ đường dây và dùng cưa sào cách điện tỉa cành vướng.',
      recommendedTeamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
      recommendedTeamId: 'team-1',
      recommendedVehicleName: 'Xe Thang Nâng Người Cách Điện 22KV',
      recommendedVehiclePlate: '65A-0892',
      urgencyLabel: 'NGUY CƠ CHÁY NỔ',
      safetyRadiusM: 15,
      slaMinutes: 90,
    };
  }

  if (desc.includes('sâu') || desc.includes('mục') || desc.includes('bọng') || desc.includes('nấm') || desc.includes('rỗng')) {
    return {
      actionTitle: 'Nạo Vét Bọng Mục & Khử Trùng Cây Bệnh',
      solutionDetail: 'Cạo sạch mô mục rỗng, quét dung dịch Booc-đô sát trùng, trám keo lâm nghiệp chống ngấm nước thối rễ.',
      recommendedTeamName: 'Tổ Bảo Dưỡng & Trị Liệu Cây Xanh',
      recommendedTeamId: 'team-2',
      recommendedVehicleName: 'Xe Bán Tải Thiết Bị Trị Liệu',
      recommendedVehiclePlate: '65A-1104',
      urgencyLabel: 'THEO DÕI ĐIỀU TRỊ',
      safetyRadiusM: 4,
      slaMinutes: 240,
    };
  }

  return {
    actionTitle: 'Cắt Tỉa Khắc Phục Điểm Nóng Mùa Bão',
    solutionDetail: 'Khảo sát hiện trường, phát quang tán che khuất biển báo/tầm nhìn và cắt hạ nhánh nguy hiểm trước dông lốc.',
    recommendedTeamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
    recommendedTeamId: 'team-1',
    recommendedVehicleName: 'Xe Thang Nâng Người Chuyên Dụng 18m',
    recommendedVehiclePlate: '65A-0892',
    urgencyLabel: 'ĐIỀU ĐỘNG TIÊU CHUẨN',
    safetyRadiusM: 6,
    slaMinutes: 180,
  };
}

interface MapViewProps {
  currentUser: User;
  onSelectTree: (tree: Tree) => void;
  onOpenCareModal: (treeId: string) => void;
  onOpenIncidentReport: (treeId?: string) => void;
  onOpenAddTree: (coords?: { latitude: number; longitude: number; address?: string }) => void;
  onOpenEditTree: (tree: Tree) => void;
  onTreeUpdated?: () => void;
  onOpenListView?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  currentUser,
  onSelectTree,
  onOpenCareModal,
  onOpenIncidentReport,
  onOpenAddTree,
  onOpenEditTree,
  onTreeUpdated,
  onOpenListView,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const rpzLayerRef = useRef<L.LayerGroup | null>(null);
  const tempPinLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const treeMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Filter States
  const [showTrees, setShowTrees] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showRootProtectionZone, setShowRootProtectionZone] = useState(false); // 🛡️ Bật/Tắt Vùng bảo vệ rễ (RPZ)
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');
  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL'); // 📍 Bộ lọc Vị trí / Địa điểm
  const [searchLocationInput, setSearchLocationInput] = useState<string>(''); // 🔍 Ô tìm kiếm số nhà, vị trí
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState<string>('');

  // ⚡ Debounce 300ms cho ô tìm kiếm bản đồ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocationQuery(searchLocationInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchLocationInput]);

  // 🏙️ Multi-Province / City State
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('can-tho');

  // 🏛️ Multi-Zone / District Jurisdiction State
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [mapViewportVersion, setMapViewportVersion] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(14);

  // Selection Drawers
  const [activeSelectedTree, setActiveSelectedTree] = useState<Tree | null>(null);
  const [activeSelectedIncident, setActiveSelectedIncident] = useState<Incident | null>(null);

  // 🎯 Admin Pin-Adding Mode
  const [isPinAddMode, setIsPinAddMode] = useState<boolean>(false);
  const isPinAddModeRef = useRef<boolean>(false);
  isPinAddModeRef.current = isPinAddMode;

  // 📍 Reposition / Relocate Mode for a selected Tree
  const [isRepositioning, setIsRepositioning] = useState<boolean>(false);
  const [repositionedCoords, setRepositionedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 🗑️ Delete Tree Confirmation Modal
  const [treeToDelete, setTreeToDelete] = useState<Tree | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('Chặt hạ giải tỏa quy hoạch');

  // ⚡ Map Transition Skeleton & Loading HUD
  const [isMapTransitioning, setIsMapTransitioning] = useState<boolean>(false);
  const mapTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerMapTransition = (durationMs = 700) => {
    setIsMapTransitioning(true);
    if (mapTransitionTimerRef.current) clearTimeout(mapTransitionTimerRef.current);
    mapTransitionTimerRef.current = setTimeout(() => {
      setIsMapTransitioning(false);
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      if (mapTransitionTimerRef.current) clearTimeout(mapTransitionTimerRef.current);
    };
  }, []);

  // 🛡️ BS 5837 RPZ Contextual Tooltip State
  const [showRpzTooltip, setShowRpzTooltip] = useState<boolean>(false);

  // ⌨️ ESC Overlays (Stack-managed)
  useEscapeOverlay('map-delete-tree-modal', !!treeToDelete, () => {
    setTreeToDelete(null);
  });

  useEscapeOverlay('map-selected-tree-drawer', !!activeSelectedTree, () => {
    setActiveSelectedTree(null);
    setIsRepositioning(false);
  });

  useEscapeOverlay('map-selected-incident-drawer', !!activeSelectedIncident, () => {
    setActiveSelectedIncident(null);
  });

  // 🔍 Cursor Live Coordinates (Direct DOM Ref to eliminate 60fps React re-renders)
  const cursorCoordsRef = useRef<HTMLDivElement>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const trees = storage.getTrees();
  const incidents = storage.getIncidents();
  const isAdmin = currentUser.role === 'ADMIN';

  const [isDispatchingIncident, setIsDispatchingIncident] = useState(false);
  const [isResolvingIncident, setIsResolvingIncident] = useState(false);

  // ⚡ Xử lý khẩn cấp 1-chạm cho sự cố trên bản đồ
  const handleDispatchIncident = async (incident: Incident) => {
    if (isDispatchingIncident) return;
    setIsDispatchingIncident(true);
    const plan = getIncidentRemediationPlan(incident);
    try {
      const newWo = await storage.createWorkOrderFromIncident({
        incidentId: incident.id,
        title: `[XỬ LÝ KHẨN CẤP] ${plan.actionTitle} - ${incident.address || 'Hiện trường'}`,
        description: `${plan.solutionDetail} (Sự cố: ${incident.description})`,
        type: 'EMERGENCY_RESPONSE',
        priority: incident.severity === 'HIGH' ? 'HIGH' : 'CRITICAL',
        zoneId: 'ninh-kieu',
        routeCorridorName: incident.address || 'Tuyến Đô Thị Cần Thơ',
        assignedTeamId: plan.recommendedTeamId,
        assignedTeamName: plan.recommendedTeamName,
        assignedVehicleName: plan.recommendedVehicleName,
        assignedVehiclePlate: plan.recommendedVehiclePlate,
        slaTargetMinutes: plan.slaMinutes,
      });

      // Cập nhật trạng thái sự cố sang IN_PROGRESS
      await storage.updateIncidentStatus({
        incidentId: incident.id,
        newStatus: 'IN_PROGRESS',
        actorUserId: currentUser.id,
        actorName: currentUser.fullName || currentUser.username,
        note: `Đã kích hoạt Lệnh công tác khẩn cấp [${newWo.code}] & điều xe thang ${plan.recommendedVehiclePlate} tới hiện trường`,
      });

      setActiveSelectedIncident((prev) => (prev ? { ...prev, status: 'IN_PROGRESS', workOrderId: newWo.id, workOrderCode: newWo.code } : null));
      showToast(`🎉 Đã lập Lệnh điều xe [${newWo.code}] & gán cho ${plan.recommendedTeamName} thành công!`);
    } catch (err: any) {
      alert(`Lỗi tạo lệnh xử lý: ${err.message}`);
    } finally {
      setIsDispatchingIncident(false);
    }
  };

  // ✅ Đóng / Giải quyết sự cố an toàn
  const handleResolveIncident = async (incident: Incident) => {
    if (isResolvingIncident) return;
    setIsResolvingIncident(true);
    try {
      await storage.updateIncidentStatus({
        incidentId: incident.id,
        newStatus: 'RESOLVED',
        actorUserId: currentUser.id,
        actorName: currentUser.fullName || currentUser.username,
        note: 'Admin/Giám sát viên đã xác nhận xử lý an toàn điểm nóng sự cố trên bản đồ GIS',
      });

      setActiveSelectedIncident((prev) => (prev ? { ...prev, status: 'RESOLVED' } : null));
      showToast(`✅ Đã đóng điểm cảnh báo [${incident.publicCode}], trạng thái: ĐÃ XỬ LÝ AN TOÀN!`);
    } catch (err: any) {
      alert(`Lỗi đóng sự cố: ${err.message}`);
    } finally {
      setIsResolvingIncident(false);
    }
  };

  // ⚡ Tạo Lệnh cắt tỉa khẩn cấp cho Cây nguy cấp
  const handleCreateWorkOrderForTree = (tree: Tree) => {
    try {
      const isCritical = tree.healthStatus === 'CRITICAL';
      const newWo = storage.createWorkOrder({
        title: `[KHẨN CẤP] Cắt tỉa hạ tán giải tỏa hiểm họa - ${tree.streetCode || tree.displayName}`,
        description: `Cắt tỉa hạ 40% thể tích tán, kiểm tra mọt bọng rỗng thân và gia cố chống đổ cho cây ${tree.displayName}`,
        type: 'PRUNING',
        priority: isCritical ? 'CRITICAL' : 'HIGH',
        zoneId: 'ninh-kieu',
        treeIds: [tree.id],
        assignedTeamId: 'team-1',
        createdByUserId: currentUser.id,
      });

      showToast(`⚡ Đã lập Lệnh công tác khẩn cấp [${newWo.code}] cho cây ${tree.displayName}!`);
    } catch (err: any) {
      alert(`Lỗi tạo lệnh: ${err.message}`);
    }
  };

  // Province & Zone Resolution
  const activeProvince =
    NATIONAL_PROVINCES.find((p) => p.id === selectedProvinceId) || NATIONAL_PROVINCES[1];
  const availableZones = activeProvince.zones;
  const activeZone =
    availableZones.find((z) => z.id === selectedZoneId) || availableZones[0];

  // Dynamic tree count by province
  const treesByProvince = React.useMemo(() => {
    const counts: Record<string, number> = {};
    trees.forEach((t) => {
      const pid = getTreeProvinceId(t);
      counts[pid] = (counts[pid] || 0) + 1;
    });
    return counts;
  }, [trees]);

  // Handle Switch Province & FlyTo
  const handleSelectProvince = (provId: string) => {
    setSelectedProvinceId(provId);
    setSelectedZoneId('all');
    setSelectedLocation('ALL');
    setSelectedCorridorFilter('ALL');
    triggerMapTransition(1000);

    const prov = NATIONAL_PROVINCES.find((p) => p.id === provId) || NATIONAL_PROVINCES[1];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(prov.center, prov.zoom, { duration: 1.5 });
    }
    showToast(`🗺️ Đã chuyển góc nhìn sang: ${prov.name}`);
  };

  // Handle Switch Zone & FlyTo
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSelectedLocation('ALL');
    triggerMapTransition(800);
    const zone = availableZones.find((z) => z.id === zoneId);
    if (zone && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(zone.center, zone.zoom, { duration: 1.2 });
      showToast(`🏛️ Đã chuyển sang khu vực: ${zone.shortName}`);
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered at active province/zone
      const map = L.map(mapContainerRef.current, {
        center: activeZone.center,
        zoom: activeZone.zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | UrbanTree Eco-GIS 4.0',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const rpzGroup = L.layerGroup().addTo(map);
      const tempGroup = L.layerGroup().addTo(map);
      const userLocGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      rpzLayerRef.current = rpzGroup;
      tempPinLayerRef.current = tempGroup;
      userLocationLayerRef.current = userLocGroup;
      mapInstanceRef.current = map;

      // Mousemove coordinates (Direct DOM update: 0 React re-renders for ultra-smooth 60-120fps panning)
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (cursorCoordsRef.current) {
          cursorCoordsRef.current.textContent = `📍 ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
        }
      });

      // Viewport culling on move / zoom (Debounce 100ms)
      let moveTimer: any = null;
      map.on('moveend zoomend', () => {
        if (moveTimer) clearTimeout(moveTimer);
        moveTimer = setTimeout(() => {
          setMapViewportVersion((v) => v + 1);
          setCurrentZoom(map.getZoom());
        }, 100);
      });

      // Click on Map for Pin Add Mode or General clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));

        if (isPinAddModeRef.current) {
          // Drop a pulsing pin at clicked coordinates
          tempPinLayerRef.current?.clearLayers();

          const tempIcon = L.divIcon({
            html: `
              <div style="
                background: #10b981;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 20px #10b981;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                animation: bounce 1s infinite alternate;
              ">
                📍
              </div>
            `,
            className: 'temp-pin',
            iconSize: [38, 38],
            iconAnchor: [19, 38],
          });

          L.marker([lat, lng], { icon: tempIcon }).addTo(tempPinLayerRef.current!);

          // Turn off pin mode
          setIsPinAddMode(false);

          // Infer estimated address based on zone
          const estimatedAddr = `Vị trí định vị vỉa hè tại ${activeZone.name}, Cần Thơ`;
          onOpenAddTree({ latitude: lat, longitude: lng, address: estimatedAddr });
        }
      });

      // Force recalculation of map container dimensions
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Zone FlyTo Transition when selectedZoneId changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(activeZone.center, activeZone.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedZoneId]);

  // 3. Render Markers (Filtered by Zone, Health, Corridor)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();
    rpzLayerRef.current?.clearLayers();
    treeMarkersMapRef.current.clear();

    // 1. Add Tree Markers
    if (showTrees) {
      let renderedCount = 0;
      const map = mapInstanceRef.current;
      const bounds = map ? map.getBounds().pad(0.2) : null;
      const zoom = map ? map.getZoom() : 15;
      const isZoomedOut = zoom < 14;

      trees.forEach((tree) => {
        // 🛡️ UT-002: Cây đã đốn hạ/giải tỏa (isActive === false) ẩn mặc định trên bản đồ tác chiến
        if (tree.isActive === false && selectedHealth !== 'DEAD' && activeSelectedTree?.id !== tree.id) {
          return;
        }

        // Province Filter
        if (selectedProvinceId !== 'all') {
          const treeProvince = getTreeProvinceId(tree);
          if (treeProvince !== selectedProvinceId) return;
        }

        // Zone Filter
        if (selectedZoneId !== 'all') {
          const treeZone = getTreeZoneId(tree);
          if (treeZone !== selectedZoneId) return;
        }

        // Health Filter
        if (selectedHealth !== 'ALL' && tree.healthStatus !== selectedHealth) return;

        // Corridor Filter
        if (
          selectedCorridorFilter !== 'ALL' &&
          getTreeCorridor(tree) !== selectedCorridorFilter
        )
          return;

        // 📍 Bộ lọc Vị trí / Địa điểm (Location Landmark Filter)
        if (selectedLocation !== 'ALL') {
          const loc = ALL_LOCATION_LANDMARKS.find((l) => l.id === selectedLocation);
          if (loc) {
            const treeSearchable = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode}`.toLowerCase();
            const matched = loc.keywords.some((k) => treeSearchable.includes(k.toLowerCase()));
            if (!matched) return;
          }
        }

        // 🔍 Ô tìm kiếm số nhà, vị trí (Search Query Filter - Debounced 300ms)
        if (debouncedLocationQuery.trim()) {
          const q = debouncedLocationQuery.toLowerCase().trim();
          const treeSearchable = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode} ${tree.publicCode}`.toLowerCase();
          if (!treeSearchable.includes(q)) return;
        }

        // ⚡ GIS Scalable Viewport Culling (UT-010):
        if (bounds && !bounds.contains([tree.latitude, tree.longitude]) && activeSelectedTree?.id !== tree.id) {
          return;
        }

        renderedCount++;

        const streetCode = getTreeStreetCode(tree);
        const milestone = getTreeMilestone(tree);
        const corridor = getTreeCorridor(tree);

        const healthColors: Record<string, string> = {
          GOOD: '#10B981',
          FAIR: '#F59E0B',
          POOR: '#F97316',
          CRITICAL: '#EF4444',
          DEAD: '#64748B',
        };
        const color = healthColors[tree.healthStatus] || '#10B981';

        // 🚀 CHẾ ĐỘ HIỂN THỊ SCALABLE (UT-010):
        // Khi thu nhỏ bản đồ (Zoom < 14): Sử dụng Canvas CircleMarker siêu nhẹ, hiển thị đầy đủ 5.402 cây không giật lag.
        // Khi phóng to (Zoom >= 14): Hiển thị Ghim DivIcon chi tiết đầy đủ nhãn biển số và tán lá.
        if (isZoomedOut && activeSelectedTree?.id !== tree.id) {
          const circlePin = L.circleMarker([tree.latitude, tree.longitude], {
            radius: 4,
            fillColor: color,
            fillOpacity: 0.9,
            color: '#ffffff',
            weight: 0.8,
          });

          circlePin.on('click', () => {
            setActiveSelectedTree(tree);
            setActiveSelectedIncident(null);
            setIsRepositioning(false);
            setRepositionedCoords(null);
          });

          circlePin.bindTooltip(`[${streetCode}] ${tree.displayName}`, {
            direction: 'top',
            offset: [0, -4],
          });

          layer.addLayer(circlePin);
          treeMarkersMapRef.current.set(tree.id, circlePin as any);
          return;
        }

        const customHtml = `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-family: monospace;
            font-size: 8px;
            cursor: pointer;
            transition: transform 0.2s;
            line-height: 1;
          ">
            <span>🌲</span>
            <span style="font-size: 7px; margin-top: 1px;">${streetCode.split('-')[1] || ''}</span>
          </div>
        `;

        const icon = L.divIcon({
          html: customHtml,
          className: 'custom-tree-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([tree.latitude, tree.longitude], {
          icon,
          draggable: false,
        });

        marker.on('click', () => {
          setActiveSelectedTree(tree);
          setActiveSelectedIncident(null);
          setIsRepositioning(false);
          setRepositionedCoords(null);
        });

        marker.bindPopup(`
          <div style="min-width: 210px; font-family: inherit;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #0f172a; color: #fde047; padding: 2px 6px; border-radius: 6px; font-weight: 900; font-family: monospace; font-size: 11px;">[${streetCode}]</span>
              <span style="font-weight: bold; font-size: 12px; color: #174B36;">${tree.displayName}</span>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px;">📍 ${milestone}</div>
            <div style="font-size: 10px; color: #64748b;">${corridor}</div>
            <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color};">
                ${tree.healthStatus}
              </span>
              <span style="font-size: 10px; color: #347A50; font-weight: 700; font-family: monospace;">EVM On-Chain</span>
            </div>
          </div>
        `);

        layer.addLayer(marker);
        treeMarkersMapRef.current.set(tree.id, marker);

        // 🛡️ VÙNG BẢO VỆ RỄ CÂY (ROOT PROTECTION ZONE - RPZ) THEO TIÊU CHUẨN BS 5837
        if (showRootProtectionZone || activeSelectedTree?.id === tree.id) {
          const rpzRadius = Math.max(
            3,
            tree.canopyDiameterM ? Math.round((tree.canopyDiameterM / 2) * 10) / 10 : 3,
            Math.round((tree.diameterCm || 25) * 0.12 * 10) / 10
          );
          const isCurrentSelected = activeSelectedTree?.id === tree.id;
          const circleColor = tree.healthStatus === 'CRITICAL' ? '#EF4444' : '#F59E0B';
          const rpzCircle = L.circle([tree.latitude, tree.longitude], {
            radius: rpzRadius,
            color: circleColor,
            weight: isCurrentSelected ? 2.5 : 1.5,
            dashArray: '5, 5',
            fillColor: circleColor,
            fillOpacity: isCurrentSelected ? 0.28 : 0.14,
          });
          rpzCircle.bindTooltip(
            `🛡️ <strong>Vùng bảo vệ rễ (RPZ): ${rpzRadius}m</strong><br/>
             <span>[${streetCode}] ${tree.displayName}</span><br/>
             <span style="font-size:10px; color:#b45309;">⚠️ Chuẩn BS 5837: Cấm đào cáp / đặt máy xúc cơ giới vi phạm rễ cọc.</span>`,
            { sticky: true }
          );
          rpzLayerRef.current?.addLayer(rpzCircle);
        }
      });
    }

    // 2. Add Incident Markers
    if (showIncidents) {
      incidents.forEach((inc) => {
        if (inc.status === 'RESOLVED') return;

        const isCritical = inc.severity === 'CRITICAL';
        const color = isCritical ? '#DC2626' : '#EA580C';

        const customHtml = `
          <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 8px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(220,38,38,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            cursor: pointer;
            animation: pulse 2s infinite;
          ">
            ⚠️
          </div>
        `;

        const icon = L.divIcon({
          html: customHtml,
          className: 'custom-incident-pin',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon });

        marker.on('click', () => {
          setActiveSelectedIncident(inc);
          setActiveSelectedTree(null);
        });

        const plan = getIncidentRemediationPlan(inc);
        marker.bindPopup(`
          <div style="min-width: 230px; font-family: inherit; line-height: 1.4;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
              <span style="font-weight: 800; font-size: 11px; color: #DC2626; background: #FEE2E2; padding: 2px 6px; border-radius: 4px;">${inc.publicCode} · ${inc.severity}</span>
              <span style="font-size: 10px; font-weight: bold; color: ${(inc.status as string) === 'RESOLVED' ? '#059669' : '#D97706'};">${inc.status}</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #1E293B; margin-top: 5px;">${inc.description}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">📍 ${inc.address || 'Hiện trường Cần Thơ'}</div>
            <div style="margin-top: 6px; padding: 5px 8px; background: #FEF3C7; border-left: 3px solid #D97706; border-radius: 4px;">
              <div style="font-size: 10px; font-weight: 800; color: #B45309; text-transform: uppercase;">⚡ Giải Pháp Đề Xuất:</div>
              <div style="font-size: 11px; font-weight: 700; color: #92400E; margin-top: 1px;">${plan.actionTitle}</div>
              <div style="font-size: 10px; color: #78350F; margin-top: 2px;">🚒 Xe: ${plan.recommendedVehiclePlate} · ⏱️ SLA: ${plan.slaMinutes}p</div>
            </div>
          </div>
        `);

        layer.addLayer(marker);
      });
    }
  }, [
    trees,
    incidents,
    showTrees,
    showIncidents,
    showRootProtectionZone,
    activeSelectedTree,
    selectedHealth,
    selectedCorridorFilter,
    selectedLocation,
    debouncedLocationQuery,
    selectedProvinceId,
    selectedZoneId,
    mapViewportVersion,
  ]);

  // Handle Location Landmark Select & FlyTo
  const handleSelectLocation = (locId: string) => {
    setSelectedLocation(locId);
    if (locId !== 'ALL') {
      triggerMapTransition(800);
      const loc = ALL_LOCATION_LANDMARKS.find((l) => l.id === locId);
      if (loc && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(loc.coords, loc.zoom, { duration: 1.2 });
        showToast(`📍 Đã bay tới vị trí: ${loc.name}`);
      }
    }
  };

  // 4. Handle Repositioning Toggle
  const startRepositioning = (tree: Tree) => {
    setIsRepositioning(true);
    setRepositionedCoords({ lat: tree.latitude, lng: tree.longitude });

    const marker = treeMarkersMapRef.current.get(tree.id);
    if (marker) {
      marker.dragging?.enable();
      marker.openPopup();

      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setRepositionedCoords({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        });
      });

      showToast('Đã bật chế độ kéo thả ghim cây! Hãy kéo marker đến vị trí mới trên bản đồ.');
    }
  };

  const cancelRepositioning = () => {
    if (activeSelectedTree) {
      const marker = treeMarkersMapRef.current.get(activeSelectedTree.id);
      if (marker) {
        marker.setLatLng([activeSelectedTree.latitude, activeSelectedTree.longitude]);
        marker.dragging?.disable();
      }
    }
    setIsRepositioning(false);
    setRepositionedCoords(null);
  };

  const saveRepositioning = async () => {
    if (!activeSelectedTree || !repositionedCoords) return;

    try {
      await storage.updateTree(activeSelectedTree.id, {
        latitude: repositionedCoords.lat,
        longitude: repositionedCoords.lng,
      });

      const updatedTree = storage.getTreeById(activeSelectedTree.id);
      if (updatedTree) {
        setActiveSelectedTree(updatedTree);
      }

      const marker = treeMarkersMapRef.current.get(activeSelectedTree.id);
      if (marker) {
        marker.dragging?.disable();
      }

      setIsRepositioning(false);
      setRepositionedCoords(null);
      showToast('Đã lưu tọa độ mới và cập nhật Blockchain Smart Contract thành công!');
      onTreeUpdated?.();
    } catch (err: any) {
      alert('Lỗi cập nhật tọa độ: ' + err.message);
    }
  };

  // 5. Handle Tree Deletion / Giải tỏa
  const confirmDeleteTree = () => {
    if (!treeToDelete) return;

    const success = storage.deleteTree(treeToDelete.id);
    if (success) {
      // Remove marker from map
      const marker = treeMarkersMapRef.current.get(treeToDelete.id);
      if (marker) {
        markersLayerRef.current?.removeLayer(marker);
        treeMarkersMapRef.current.delete(treeToDelete.id);
      }

      setActiveSelectedTree(null);
      setTreeToDelete(null);
      showToast(`Đã giải tỏa cây [${treeToDelete.streetCode || treeToDelete.publicCode}] khỏi cơ sở dữ liệu GIS!`);
      onTreeUpdated?.();
    } else {
      alert('Không thể xóa cây.');
    }
  };

  // 6. My Live Location (GPS Navigator)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        userLocationLayerRef.current?.clearLayers();

        const locIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 24px; height: 24px;">
              <div style="
                position: absolute;
                inset: -8px;
                border-radius: 50%;
                background: rgba(59, 130, 246, 0.35);
                animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
              <div style="
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background: #2563eb;
                border: 3px solid white;
                box-shadow: 0 0 14px rgba(37,99,235,0.7);
              "></div>
            </div>
          `,
          className: 'user-loc-pin',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([lat, lng], { icon: locIcon })
          .bindPopup('<strong>📍 Vị trí hiện tại của bạn</strong>')
          .addTo(userLocationLayerRef.current!);

        mapInstanceRef.current?.flyTo([lat, lng], 17, { duration: 1.5 });
        showToast('Đã bắt tọa độ GPS thực tế của bạn!');
      },
      (err) => {
        showToast('Không thể lấy GPS: ' + err.message + '. Bay về trung tâm Cần Thơ.');
        mapInstanceRef.current?.flyTo([10.0345, 105.7882], 15);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filtered trees for current province & zone
  const currentProvinceTrees =
    selectedProvinceId === 'all'
      ? trees
      : trees.filter((t) => getTreeProvinceId(t) === selectedProvinceId);

  const currentZoneTrees =
    selectedZoneId === 'all'
      ? currentProvinceTrees
      : currentProvinceTrees.filter((t) => getTreeZoneId(t) === selectedZoneId);

  const filteredTrees = currentZoneTrees.filter((tree) => {
    if (selectedHealth !== 'ALL' && tree.healthStatus !== selectedHealth) return false;
    if (selectedCorridorFilter !== 'ALL' && getTreeCorridor(tree) !== selectedCorridorFilter) return false;
    if (selectedLocation !== 'ALL') {
      const loc = ALL_LOCATION_LANDMARKS.find((l) => l.id === selectedLocation);
      if (loc) {
        const text = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode}`.toLowerCase();
        if (!loc.keywords.some((k) => text.includes(k.toLowerCase()))) return false;
      }
    }
    if (debouncedLocationQuery.trim()) {
      const q = debouncedLocationQuery.toLowerCase().trim();
      const text = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode} ${tree.publicCode}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const goodRate = React.useMemo(() => {
    if (currentZoneTrees.length === 0) return 100;
    let good = 0;
    for (let i = 0; i < currentZoneTrees.length; i++) {
      if (currentZoneTrees[i].healthStatus === 'GOOD') good++;
    }
    return Math.round((good / currentZoneTrees.length) * 100);
  }, [currentZoneTrees]);

  // Available corridors dynamic based on current province trees
  const availableCorridors = React.useMemo(() => {
    const list: { name: string; prefix: string }[] = [];
    const seen = new Set<string>();

    currentProvinceTrees.forEach((t) => {
      const corr = getTreeCorridor(t);
      if (corr && !seen.has(corr)) {
        seen.add(corr);
        const streetCode = getTreeStreetCode(t);
        const prefix = streetCode ? streetCode.split('-')[0] : 'TP';
        list.push({ name: corr, prefix });
      }
    });

    if (list.length === 0) {
      return STREET_CORRIDORS_LIST.map((c) => ({ name: c.name, prefix: c.prefix }));
    }
    return list;
  }, [currentProvinceTrees]);

  // Available landmarks filtered by current province
  const availableLandmarks = React.useMemo(() => {
    if (selectedProvinceId === 'all') return ALL_LOCATION_LANDMARKS;
    return ALL_LOCATION_LANDMARKS.filter((l) => l.provinceId === selectedProvinceId);
  }, [selectedProvinceId]);

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* 📱 Mobile Workspace Segmented Switcher (GIS Map ↔ List) - FIX-01 */}
      {onOpenListView && (
        <div className="lg:hidden flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={onOpenListView}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[44px] text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 active:scale-98 cursor-pointer"
          >
            <Trees className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>📋 Danh Sách Cây</span>
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[44px] bg-white dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs cursor-default"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>🗺️ Bản Đồ GIS</span>
          </button>
        </div>
      )}

      {/* 👑 GIS OPERATIONS CONTROL PANEL */}
      <div className="bento-card p-3 sm:p-4 dark:bg-[#0c1812] dark:border-emerald-500/20 flex flex-col gap-3">
        {/* Row 1: Header + Admin Badge + Location Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Bản đồ Số Cây Xanh &amp; Không Gian GIS
                </h1>
                {isAdmin && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold hidden sm:inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>ADMIN</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeZone.agency} · {activeZone.description}
              </p>
            </div>
          </div>

          {/* Quick Actions (GPS Me + Add Tree on Map) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleLocateMe}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Định vị tọa độ thiết bị của tôi"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Vị trí của tôi</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  const nextState = !isPinAddMode;
                  setIsPinAddMode(nextState);
                  if (nextState) {
                    showToast('🎯 Chế độ ghim đang bật: Hãy click bất kỳ điểm nào trên bản đồ để cắm mốc cây mới!');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isPinAddMode
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30 ring-2 ring-rose-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{isPinAddMode ? 'Hủy ghim' : 'Ghim thêm cây'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Bộ chọn Tỉnh/Thành & Quận/Huyện tích hợp gọn gàng + Tìm kiếm & Tuyến đường */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          {/* Tỉnh / Thành phố */}
          <select
            value={selectedProvinceId}
            onChange={(e) => handleSelectProvince(e.target.value)}
            className="h-8 pl-3.5 pr-8.5 text-xs font-bold border border-blue-300 dark:border-blue-800 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 focus:border-blue-500 shadow-2xs cursor-pointer max-w-[240px] truncate custom-select-arrow"
          >
            {NATIONAL_PROVINCES.map((prov) => (
              <option key={prov.id} value={prov.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                {prov.name.replace(/^[^\p{L}\p{N}]+/u, '').trim() || prov.name} ({prov.id === 'all' ? trees.length : (treesByProvince[prov.id] || 0)})
              </option>
            ))}
          </select>

          {/* Quận / Khu vực */}
          <select
            value={selectedZoneId}
            onChange={(e) => handleSelectZone(e.target.value)}
            className="h-8 pl-3.5 pr-8.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-emerald-500 shadow-2xs cursor-pointer max-w-[180px] truncate custom-select-arrow"
          >
            {availableZones.map((zone) => {
              const countInZone =
                zone.id === 'all'
                  ? currentProvinceTrees.length
                  : currentProvinceTrees.filter((t) => getTreeZoneId(t) === zone.id).length;
              const cleanZoneName = zone.shortName.replace(/^[^\p{L}\p{N}]+/u, '').trim() || zone.shortName;
              return (
                <option key={zone.id} value={zone.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {cleanZoneName} ({countInZone})
                </option>
              );
            })}
          </select>

          {/* Tuyến đường */}
          <select
            value={selectedCorridorFilter}
            onChange={(e) => setSelectedCorridorFilter(e.target.value)}
            className="h-8 pl-3.5 pr-8.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 shadow-2xs cursor-pointer max-w-[180px] truncate custom-select-arrow"
          >
            <option value="ALL">Tất cả tuyến</option>
            {availableCorridors.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.prefix})
              </option>
            ))}
          </select>

          {/* Địa điểm nổi tiếng */}
          <select
            value={selectedLocation}
            onChange={(e) => handleSelectLocation(e.target.value)}
            className="h-8 pl-3.5 pr-8.5 text-xs font-bold border border-emerald-300 dark:border-emerald-600/70 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer max-w-[180px] truncate custom-select-arrow"
            title="Chọn địa điểm để bản đồ tự động bay tới"
          >
            <option value="ALL">Địa điểm nổi tiếng</option>
            {availableLandmarks.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name.replace(/^[^\p{L}\p{N}]+/u, '').trim() || loc.name}
              </option>
            ))}
          </select>

          {/* Ô tìm kiếm nhanh */}
          <div className="relative flex items-center ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm số nhà, vị trí..."
              value={searchLocationInput}
              onChange={(e) => setSearchLocationInput(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 w-36 sm:w-44 focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
            />
            {searchLocationInput && (
              <button
                type="button"
                onClick={() => setSearchLocationInput('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Lớp hiển thị GIS (Layer Toggles) + Sức khỏe + Thống kê */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <label className="h-8 min-w-[144px] px-3 inline-flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold rounded-full border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 transition-colors select-none">
              <input
                type="checkbox"
                checked={showTrees}
                onChange={(e) => setShowTrees(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Cây xanh ({filteredTrees.length})</span>
            </label>

            <label className="h-8 min-w-[144px] px-3 inline-flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold rounded-full border border-rose-300/80 dark:border-rose-700/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100/70 dark:hover:bg-rose-900/50 transition-colors select-none">
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span>
                Sự cố ({incidents.filter((i) => i.status !== 'RESOLVED').length})
              </span>
            </label>

            <div className="relative inline-flex items-center">
              <label
                className="h-8 min-w-[144px] px-3 inline-flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold rounded-full border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors select-none"
                title="Quy chuẩn BS 5837: Hiển thị bán kính bảo vệ rễ cây an toàn khi thi công đào vỉa hè"
              >
                <input
                  type="checkbox"
                  checked={showRootProtectionZone}
                  onChange={(e) => setShowRootProtectionZone(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Vùng rễ (RPZ)</span>
                <button
                  type="button"
                  aria-label="Xem giải thích quy chuẩn vùng rễ BS 5837:2012"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRpzTooltip((prev) => !prev);
                  }}
                  onMouseEnter={() => setShowRpzTooltip(true)}
                  onMouseLeave={() => setShowRpzTooltip(false)}
                  className="p-0.5 rounded-full hover:bg-amber-200/80 dark:hover:bg-amber-800/80 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer focus:outline-none shrink-0 inline-flex items-center justify-center"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>

              {showRpzTooltip && (
                <div
                  role="tooltip"
                  onMouseEnter={() => setShowRpzTooltip(true)}
                  onMouseLeave={() => setShowRpzTooltip(false)}
                  className="absolute bottom-full left-0 mb-2 w-[min(20rem,calc(100vw-2.5rem))] p-3.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-xl shadow-2xl border border-amber-500/50 z-50 pointer-events-auto leading-relaxed animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1.5">
                    <span>🛡️ Quy chuẩn Vùng Rễ (RPZ) — BS 5837:2012</span>
                  </div>
                  <p className="text-slate-300 mb-2">
                    <strong>Root Protection Zone (RPZ)</strong> xác định bán kính an toàn tối thiểu xung quanh gốc cây để ngăn chặn tổn hại hệ thống rễ cọc và rễ hút khi thi công đào hào, đặt cáp hoặc hạ tầng ngầm.
                  </p>
                  <div className="p-2 bg-slate-800/90 rounded-lg font-mono text-[10px] text-amber-300 border border-amber-500/30 mb-2">
                    Công thức: R = max(3m, D_canopy / 2, 0.12 × D_trunk_cm)
                  </div>
                  <ul className="list-disc list-inside text-[10px] text-slate-300 space-y-0.5">
                    <li><strong>Bán kính sàn:</strong> Tối thiểu 3.0m cho mọi loại cây.</li>
                    <li><strong>Theo tán lá:</strong> Bằng nửa bán kính tán cây thực tế.</li>
                    <li><strong>Theo thân:</strong> Hệ số 12× đường kính thân (cm → m).</li>
                  </ul>
                  <div className="mt-2 text-[10px] text-amber-400 font-semibold border-t border-slate-800 pt-1.5">
                    ⚠️ Nghiêm cấm đặt xe ủi, máy xúc cơ giới hoặc đào cắt kết cấu rễ trong vành đai giới hạn này.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Sức khỏe:</span>
              <select
                value={selectedHealth}
                onChange={(e) => setSelectedHealth(e.target.value)}
                className="h-8 pl-3 pr-7 text-xs border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 custom-select-arrow cursor-pointer"
              >
                <option value="ALL">Tất cả</option>
                <option value="GOOD">Tốt</option>
                <option value="FAIR">Bình thường</option>
                <option value="POOR">Kém</option>
                <option value="CRITICAL">Nguy cấp</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span>Cây trong vùng: <strong className="text-emerald-700 dark:text-emerald-400">{currentZoneTrees.length} cây</strong></span>
              <span>·</span>
              <span>Khỏe mạnh: <strong className="text-teal-700 dark:text-teal-400">{goodRate}%</strong></span>
            </div>

            {/* Current Live Cursor GPS Coordinates */}
            <div
              ref={cursorCoordsRef}
              className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0"
            >
              📍 Di chuột trên bản đồ...
            </div>
          </div>
        </div>
      </div>

      {/* 🗺️ MAP CONTAINER (GPU Hardware Accelerated) */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-emerald-500/20 shadow-lg shadow-slate-900/5 h-[580px] sm:h-[640px] xl:h-[calc(100vh-230px)] bg-slate-100 dark:bg-slate-950 transform-gpu will-change-transform">
        {/* ⚡ GIS Loading HUD / Skeleton Indicator */}
        {isMapTransitioning && (
          <div className="absolute inset-0 z-30 bg-slate-950/25 dark:bg-black/35 backdrop-blur-[2px] flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
            <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white px-5 py-3 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center gap-3.5 text-xs font-bold">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div className="flex flex-col">
                <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 animate-spin" />
                  Đang đồng bộ tọa độ không gian GIS
                </span>
                <span className="text-[10px] text-slate-300 font-normal">
                  Đang tái định vị góc nhìn & kết xuất lớp bản đồ thực địa...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ⚡ GIS High-Performance LOD Badge (Tầm nhìn toàn cảnh) */}
        {currentZoom < 14 && trees.length > 300 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-emerald-500/40 shadow-xl flex items-center gap-2.5 text-xs pointer-events-auto">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>⚡ <strong>Tầm nhìn toàn cảnh:</strong> Đang tối ưu 300 cây tiêu biểu. Phóng to vào từng tuyến phố để xem toàn bộ chi tiết.</span>
          </div>
        )}

        {/* Banner while Pin-Adding mode is active */}
        {isPinAddMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce pointer-events-auto">
            <Crosshair className="w-4 h-4 animate-spin" />
            <span>🎯 CHẾ ĐỘ GHIM: Hãy click vào vỉa hè / vị trí trên bản đồ để cắm mốc cây xanh mới</span>
            <button
              onClick={() => setIsPinAddMode(false)}
              className="ml-2 bg-emerald-700 hover:bg-emerald-800 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Repositioning Banner for Selected Tree */}
        {isRepositioning && activeSelectedTree && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-black animate-fade-in pointer-events-auto">
            <Compass className="w-4 h-4 animate-spin" />
            <span>
              📍 Đang định vị lại [{getTreeStreetCode(activeSelectedTree)}]: Kéo thả marker trên map
              {repositionedCoords && ` (${repositionedCoords.lat}, ${repositionedCoords.lng})`}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={saveRepositioning}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu vị trí mới</span>
              </button>
              <button
                onClick={cancelRepositioning}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Map Element */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-10 ${isPinAddMode ? 'cursor-crosshair' : ''}`}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-[#0c1812]/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-emerald-500/30 shadow-xl text-xs space-y-2 pointer-events-auto">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Chú giải GIS · {activeZone.shortName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300">Sinh trưởng tốt (GOOD)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300">Bình thường (FAIR)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300">Kém / Cần tỉa cành (POOR)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300">Nguy cấp / Nghiêng (CRITICAL)</span>
          </div>
          <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="w-3 h-3 rounded bg-red-600 inline-block" />
            <span className="text-red-700 dark:text-red-400 font-semibold">Điểm nóng sự cố</span>
          </div>
        </div>

        {/* 🌿 SELECTED TREE FLOATING DRAWER (WITH ADMIN CRUD & REPOSITION) */}
        {activeSelectedTree && (
          <div className="absolute bottom-4 right-4 z-20 w-88 max-w-[calc(100vw-32px)] max-h-[calc(100%-2rem)] overflow-y-auto scrollbar-thin bg-white/95 dark:bg-[#0c1812]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-emerald-500/30 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-150 pointer-events-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-900 text-amber-300 border border-slate-700 shadow-2xs">
                    [{getTreeStreetCode(activeSelectedTree)}]
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400">
                    {activeSelectedTree.publicCode}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">
                  {activeSelectedTree.displayName}
                </h3>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  📍 {getTreeMilestone(activeSelectedTree)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {getTreeCorridor(activeSelectedTree)} · Tọa độ: {activeSelectedTree.latitude.toFixed(5)}, {activeSelectedTree.longitude.toFixed(5)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng thông tin cây"
                onClick={() => {
                  setActiveSelectedTree(null);
                  setIsRepositioning(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-lg text-slate-600 dark:text-slate-300 font-mono text-[11px] border border-transparent dark:border-slate-800">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Sức khỏe</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{activeSelectedTree.healthStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Đường kính/Cao</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {activeSelectedTree.diameterCm || 30}cm / {activeSelectedTree.heightM || 8}m
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">🛡️ Vùng rễ (RPZ)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {Math.max(
                    3,
                    activeSelectedTree.canopyDiameterM ? Math.round((activeSelectedTree.canopyDiameterM / 2) * 10) / 10 : 3,
                    Math.round((activeSelectedTree.diameterCm || 25) * 0.12 * 10) / 10
                  )}m
                </span>
              </div>
            </div>

            {/* ⚠️ CẢNH BÁO SỨC KHỎE CÂY & GIẢI PHÁP LÂM NGHIỆP */}
            {(activeSelectedTree.healthStatus === 'CRITICAL' || activeSelectedTree.healthStatus === 'POOR') && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{activeSelectedTree.healthStatus === 'CRITICAL' ? 'Cây Nguy Cấp: Nguy Cơ Đổ Gãy Cao' : 'Cây Kém: Cần Can Thiệp Kỹ Thuật'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeSelectedTree.healthStatus === 'CRITICAL'
                    ? '💡 Giải pháp: Điều xe thang hạ bớt cành nặng ngọn, gia cố cọc chống chịu lực, khoanh vùng rễ RPZ an toàn.'
                    : '💡 Giải pháp: Cắt tỉa cành khô, quét vôi sát trùng gốc, bổ sung phân bón vi lượng phục hồi rễ.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateWorkOrderForTree(activeSelectedTree)}
                  className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-102"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200" />
                  <span>⚡ Tạo Lệnh Cắt Tỉa Khẩn Cấp Cho Cây Này</span>
                </button>
              </div>
            )}

            {/* 🛠️ ADMIN CRUD & REPOSITION ACTIONS */}
            {isAdmin && (
              <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Quyền Quản Trị Viên (Admin)</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Sửa thông tin cây */}
                  <button
                    type="button"
                    onClick={() => onOpenEditTree(activeSelectedTree)}
                    className="py-1.5 px-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Sửa thông tin</span>
                  </button>

                  {/* Định vị lại tọa độ (Kéo thả marker) */}
                  <button
                    type="button"
                    onClick={() => startRepositioning(activeSelectedTree)}
                    className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title="Kéo thả marker trên map để cập nhật tọa độ GPS chuẩn xác"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Định vị lại</span>
                  </button>
                </div>

                {/* Xóa / Giải tỏa cây */}
                <button
                  type="button"
                  onClick={() => setTreeToDelete(activeSelectedTree)}
                  className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg font-bold border border-rose-200 dark:border-rose-800/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Giải tỏa / Xóa hồ sơ cây này</span>
                </button>
              </div>
            )}

            {/* Standard View Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onSelectTree(activeSelectedTree)}
                className="flex-1 py-1.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem hồ sơ</span>
              </button>
              <button
                onClick={() => onOpenCareModal(activeSelectedTree.id)}
                className="px-3 py-1.5 bg-[#E0EBDD] hover:bg-[#d0dfcc] dark:bg-emerald-950/60 hover:dark:bg-emerald-900/60 text-[#174B36] dark:text-emerald-300 dark:border dark:border-emerald-800/50 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Chăm sóc
              </button>
            </div>
          </div>
        )}

        {/* Selected Incident Drawer With Real Operational Remediation Solution */}
        {activeSelectedIncident && (() => {
          const plan = getIncidentRemediationPlan(activeSelectedIncident);
          const linkedTree = activeSelectedIncident.treeId ? trees.find((t) => t.id === activeSelectedIncident.treeId) : null;
          const isResolved = activeSelectedIncident.status === 'RESOLVED';
          const isInProgress = activeSelectedIncident.status === 'IN_PROGRESS';

          return (
            <div className="absolute bottom-4 right-4 z-20 w-88 sm:w-96 max-w-[calc(100vw-32px)] max-h-[calc(100%-2rem)] overflow-y-auto scrollbar-thin bg-white/95 dark:bg-[#0c1812]/95 backdrop-blur-md rounded-2xl border border-rose-300 dark:border-rose-500/40 shadow-2xl p-4 text-xs space-y-3.5 animate-in fade-in slide-in-from-bottom-4 duration-150 pointer-events-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                      {activeSelectedIncident.publicCode}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isResolved
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                        : isInProgress
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                    }`}>
                      {isResolved ? 'ĐÃ XỬ LÝ AN TOÀN' : isInProgress ? 'ĐANG TÁC CHIẾN' : 'CHỜ ĐIỀU PHỐI'}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{activeSelectedIncident.severity} · Điểm Cảnh Báo Nguy Hiểm</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    📍 {activeSelectedIncident.address || 'Đường Đô Thị Cần Thơ'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng thông tin sự cố"
                  onClick={() => setActiveSelectedIncident(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 -mr-1.5 -mt-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mô tả hiện trường sự cố */}
              <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl text-slate-800 dark:text-slate-200 text-xs border border-rose-200/60 dark:border-rose-900/40">
                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide mb-1">
                  Mô Tả Hiện Trường:
                </div>
                <p className="font-medium italic">"{activeSelectedIncident.description}"</p>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Người phản ánh: <strong>{activeSelectedIncident.reporterName || 'Người dân'}</strong> · Số điện thoại: <strong>{activeSelectedIncident.reporterPhone || 'Không công khai'}</strong>
                </div>
              </div>

              {/* 💡 KHỐI PHƯƠNG ÁN & GIẢI PHÁP KỸ THUẬT LÂM NGHIỆP ĐỀ XUẤT */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-xl border border-amber-300 dark:border-amber-700/60 space-y-2.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Giải Pháp Kỹ Thuật Đề Xuất</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                    SLA: {plan.slaMinutes}p
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-amber-100">
                  {plan.actionTitle}
                </div>

                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {plan.solutionDetail}
                </p>

                {/* Các thông số tác chiến */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Xe: <strong className="text-slate-800 dark:text-slate-100">{plan.recommendedVehiclePlate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Cách ly: <strong className="text-slate-800 dark:text-slate-100">R = {plan.safetyRadiusM}m</strong></span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>Tổ đảm trách:</span>
                  <strong className="text-slate-700 dark:text-slate-300">{plan.recommendedTeamName}</strong>
                </div>
              </div>

              {/* HÀNG NÚT HÀNH ĐỘNG THỰC THI 1-CHẠM */}
              <div className="space-y-2 pt-1">
                {!isResolved && (
                  <button
                    type="button"
                    disabled={isDispatchingIncident}
                    onClick={() => handleDispatchIncident(activeSelectedIncident)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-102"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>
                      {isDispatchingIncident
                        ? 'Đang Khởi Tạo Lệnh...'
                        : isInProgress
                        ? '⚡ Điều Xe Bổ Sung / Tạo Lệnh Xử Lý Lại'
                        : '⚡ Điều Xe & Tạo Lệnh Xử Lý Khẩn Cấp (1-Chạm)'}
                    </span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {!isResolved ? (
                    <button
                      type="button"
                      disabled={isResolvingIncident}
                      onClick={() => handleResolveIncident(activeSelectedIncident)}
                      className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isResolvingIncident ? 'Đang đóng...' : 'Đã Xử Lý Xong'}</span>
                    </button>
                  ) : (
                    <div className="py-2 px-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã Xử Lý An Toàn</span>
                    </div>
                  )}

                  {linkedTree ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSelectedTree(linkedTree);
                        setActiveSelectedIncident(null);
                      }}
                      className="py-2 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trees className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Soi Cây #{linkedTree.streetCode || linkedTree.displayName}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        showToast(`📍 Sự cố tại tọa độ [${activeSelectedIncident.latitude.toFixed(4)}, ${activeSelectedIncident.longitude.toFixed(4)}]`);
                      }}
                      className="py-2 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Tọa Độ Hiện Trường</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ⚠️ DIALOG XÁC NHẬN GIẢI TỎA / XÓA CÂY (ADMIN CONFIRMATION MODAL) */}
      {treeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-md w-full border border-rose-300 dark:border-rose-800/80 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Xác nhận Giải tỏa / Xóa Cây</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Thao tác này sẽ gỡ bỏ cây khỏi bản đồ GIS.</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40 text-xs space-y-1">
              <div>Mã tuyến: <strong className="font-mono text-slate-900 dark:text-slate-100">[{getTreeStreetCode(treeToDelete)}]</strong> ({treeToDelete.publicCode})</div>
              <div>Tên cây: <strong className="text-slate-900 dark:text-slate-100">{treeToDelete.displayName}</strong></div>
              <div>Vị trí: {getTreeMilestone(treeToDelete)}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lý do giải tỏa / xóa:
              </label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
              >
                <option value="Chặt hạ giải tỏa quy hoạch">Chặt hạ giải tỏa quy hoạch mở rộng đường</option>
                <option value="Cây chết khô bão đổ">Cây chết khô / ngã đổ sau mưa bão</option>
                <option value="Di dời sang vườn ươm">Bứng dời sang vườn ươm thành phố</option>
                <option value="Sai lệch dữ liệu thực địa">Sai lệch dữ liệu Excel so với thực địa</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTreeToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteTree}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận giải tỏa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
