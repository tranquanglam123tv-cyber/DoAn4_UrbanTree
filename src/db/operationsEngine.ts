/**
 * UrbanTree - Operations Engine & Work Order Dispatching System
 * Implements real-world municipal tree care workflows:
 * Zone/Route -> Maintenance Rules Engine -> Idempotent Work Order Generation ->
 * Team & Vehicle Matching -> Mobile Checklist Execution -> Supervisor Verification -> Blockchain Anchoring.
 */

import {
  CapabilityType,
  Department,
  Equipment,
  EquipmentType,
  ItemExecutionStatus,
  OperationalZone,
  Route,
  SLAPolicy,
  Team,
  Tree,
  User,
  WorkOrder,
  WorkOrderHistory,
  WorkOrderItem,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
  MaintenanceRule,
} from '../types';
import { getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

// ============================================================================
// 1. CƠ CẤU TỔ CHỨC & PHÂN BAN CHUYÊN TRÁCH (DEPARTMENTS)
// ============================================================================

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-co-gioi',
    code: 'BAN-CG',
    name: 'Ban Cắt Tỉa & Hạ Tán Cơ Giới',
    description: 'Chuyên trách xe thang 18m, 22m, cưa xích cao độ phòng chống dông lốc mùa mưa bão',
    status: 'ACTIVE',
  },
  {
    id: 'dept-lam-sinh',
    code: 'BAN-LS',
    name: 'Ban Chăm Sóc & Bảo Dưỡng Lâm Sinh',
    description: 'Quản lý xe bồn tưới nước 8m³, vi sinh bồn rễ RPZ, bón phân và dọn cỏ vỉa hè',
    status: 'ACTIVE',
  },
  {
    id: 'dept-phan-ung-nhanh',
    code: 'BAN-PUN',
    name: 'Ban Phản Ứng Nhanh Sự Cố & Thiên Tai',
    description: 'Trực ban tác chiến 24/7, xe cẩu 15m giải phóng cây gãy đổ đè đường dây điện',
    status: 'ACTIVE',
  },
  {
    id: 'dept-giam-dinh',
    code: 'BAN-GD',
    name: 'Ban Kiểm Định & Giám Định Kỹ Thuật',
    description: 'Siêu âm rễ sóng âm Arbotom 3D, đo độ nghiêng, thẩm định cấp phép đốn hạ',
    status: 'ACTIVE',
  },
];

// ============================================================================
// 2. DỮ LIỆU ĐỊA BÀN VẬN HÀNH & TUYẾN ĐƯỜNG (CẦN THƠ MUNICIPAL)
// ============================================================================

export const INITIAL_ZONES: OperationalZone[] = [
  {
    id: 'zone-ninh-kieu',
    code: 'ZONE-NK',
    name: 'Quận Ninh Kiều (Trung Tâm Đô Thị)',
    district: 'Quận Ninh Kiều',
    description: 'Vùng lõi trung tâm hành chính thương mại, mật độ giao thông rất cao, nhiều cây cổ thụ loại 3.',
    status: 'ACTIVE',
  },
  {
    id: 'zone-binh-thuy',
    code: 'ZONE-BT',
    name: 'Quận Bình Thủy (Hành Lang Sân Bay & Ven Sông)',
    district: 'Quận Bình Thủy',
    description: 'Khu vực ven sông Hậu và trục kết nối Cảng hàng không Quốc tế Cần Thơ, thường xuyên chịu gió lốc mùa mưa.',
    status: 'ACTIVE',
  },
  {
    id: 'zone-cai-rang',
    code: 'ZONE-CR',
    name: 'Quận Cái Răng (Khu Đô Thị Mới Nam Cần Thơ)',
    district: 'Quận Cái Răng',
    description: 'Vùng đô thị mở rộng phía Nam sông Cần Thơ, nhiều tuyến đại lộ lớn nhiều cây mới trồng loại 1 và loại 2.',
    status: 'ACTIVE',
  },
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'route-hoa-binh',
    zoneId: 'zone-ninh-kieu',
    code: 'COR-HB',
    name: 'Đại Lộ Hòa Bình',
    description: 'Trục đại lộ trung tâm Ninh Kiều dài 1.8km, cây Sao đen, Dầu rái loại 2 & 3',
    startPoint: 'Vòng xoay Ngã tư Bưu điện Cần Thơ',
    endPoint: 'Tượng đài Bác Hồ - Bến Ninh Kiều',
    totalTreesCount: 420,
    status: 'ACTIVE',
  },
  {
    id: 'route-30-4',
    zoneId: 'zone-ninh-kieu',
    code: 'COR-304',
    name: 'Đường 30 Tháng 4',
    description: 'Trục huyết mạch dài 3.2km nối Ninh Kiều sang Cái Răng',
    startPoint: 'Ngã tư Hòa Bình - 30/4',
    endPoint: 'Cầu Đầu Sấu',
    totalTreesCount: 610,
    status: 'ACTIVE',
  },
  {
    id: 'route-cmt8',
    zoneId: 'zone-binh-thuy',
    code: 'COR-CMT8',
    name: 'Đường Cách Mạng Tháng 8',
    description: 'Trục ven sông Hậu dài 4.5km, nhiều cây xà cừ cổ thụ mùa bão dễ gãy nhánh',
    startPoint: 'Cầu Cái Khế',
    endPoint: 'Cầu Bình Thủy',
    totalTreesCount: 780,
    status: 'ACTIVE',
  },
  {
    id: 'route-vo-van-kiet',
    zoneId: 'zone-binh-thuy',
    code: 'COR-VVK',
    name: 'Đường Võ Văn Kiệt',
    description: 'Trục đại lộ nối trung tâm ra Sân bay Cần Thơ dài 6.2km, dải phân cách rộng',
    startPoint: 'Ngã tư Mậu Thân - Võ Văn Kiệt',
    endPoint: 'Sân Bay Quốc Tế Cần Thơ',
    totalTreesCount: 850,
    status: 'ACTIVE',
  },
  {
    id: 'route-3-2',
    zoneId: 'zone-ninh-kieu',
    code: 'COR-32',
    name: 'Đường 3 Tháng 2',
    description: 'Trục đô thị sinh viên và thương mại dài 3.8km',
    startPoint: 'Ngã ba Hùng Vương - 3/2',
    endPoint: 'Cầu Rạch Ngỗng 2',
    totalTreesCount: 540,
    status: 'ACTIVE',
  },
];

// ============================================================================
// 2. THIẾT BỊ & XE CƠ GIỚI CHUYÊN DỤNG (EQUIPMENT POOL)
// ============================================================================

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-truck-18m-01',
    code: 'EQ-XT-18M-01',
    name: 'Xe Thang Tự Hành Nâng Cao 18m (65A-0892)',
    type: 'AERIAL_LADDER_TRUCK',
    plateNumber: '65A-0892',
    status: 'IN_USE',
    capabilities: ['AERIAL_PLATFORM', 'HEAVY_PRUNING'],
    currentTeamId: 'team-prune-1',
    currentZoneId: 'zone-ninh-kieu',
    maintenanceNote: 'Bảo dưỡng thủy lực định kỳ ngày 01/11/2026',
  },
  {
    id: 'eq-truck-22m-02',
    code: 'EQ-XT-22M-02',
    name: 'Xe Thang Vươn Cần Kỹ Thuật 22m (65A-9988)',
    type: 'AERIAL_LADDER_TRUCK',
    plateNumber: '65A-9988',
    status: 'IN_USE',
    capabilities: ['AERIAL_PLATFORM', 'HEAVY_PRUNING'],
    currentTeamId: 'team-prune-2',
    currentZoneId: 'zone-binh-thuy',
    maintenanceNote: 'Xe thang siêu cao tuyến sân bay',
  },
  {
    id: 'eq-water-truck-01',
    code: 'EQ-XB-01',
    name: 'Xe Bồn Phun Áp Lực Tưới Rễ 8m³ (65C-3321)',
    type: 'WATER_TANK_TRUCK',
    plateNumber: '65C-3321',
    status: 'IN_USE',
    capabilities: ['WATERING', 'FERTILIZING'],
    currentTeamId: 'team-care-1',
    currentZoneId: 'zone-ninh-kieu',
  },
  {
    id: 'eq-crane-truck-01',
    code: 'EQ-XC-15M',
    name: 'Xe Cẩu Thùng Nâng Cắt Cành Gãy 15m (65B-1144)',
    type: 'CRANE_TRUCK',
    plateNumber: '65B-1144',
    status: 'AVAILABLE',
    capabilities: ['TREE_REMOVAL', 'EMERGENCY_RESPONSE'],
    currentTeamId: 'team-rapid-1',
    currentZoneId: 'zone-binh-thuy',
  },
  {
    id: 'eq-arbotom-01',
    code: 'EQ-ARBO-01',
    name: 'Bộ Máy Cảm Biến Sóng Âm Arbotom 3D Đa Kênh',
    type: 'ARBOTOM_SONIC',
    status: 'AVAILABLE',
    capabilities: ['TREE_INSPECTION', 'ARBORIST_DIAGNOSE'],
    currentTeamId: 'team-audit-1',
    currentZoneId: 'zone-ninh-kieu',
  },
  {
    id: 'eq-wood-chipper-01',
    code: 'EQ-CHIP-01',
    name: 'Máy Băm Nghiền Cành Di Động Bandit 12X',
    type: 'WOOD_CHIPPER',
    status: 'AVAILABLE',
    capabilities: ['ROUTINE_MAINTENANCE', 'HEAVY_PRUNING'],
    currentZoneId: 'zone-ninh-kieu',
  },
  {
    id: 'eq-van-rapid-01',
    code: 'EQ-VAN-01',
    name: 'Xe Bán Tải Cơ Động Cứu Hộ 24/7 (65A-7711)',
    type: 'EMERGENCY_VAN',
    plateNumber: '65A-7711',
    status: 'AVAILABLE',
    capabilities: ['EMERGENCY_RESPONSE', 'ROUTINE_MAINTENANCE'],
    currentTeamId: 'team-rapid-1',
    currentZoneId: 'zone-binh-thuy',
  },
];

// ============================================================================
// 3. ĐỘI NGŨ / TỔ CƠ GIỚI THEO 4 BAN CHUYÊN TRÁCH
// ============================================================================

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-prune-1',
    departmentId: 'dept-co-gioi',
    code: 'TEAM-PRUNE-01',
    name: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
    leaderUserId: 'user-staff-1',
    leaderName: 'KTV. Trần Minh Bình',
    leaderPhone: '0912 345 601',
    memberUserIds: ['user-staff-1'],
    capabilities: ['HEAVY_PRUNING', 'AERIAL_PLATFORM', 'LOW_PRUNING'],
    equipmentIds: ['eq-truck-18m-01'],
    assignedEquipmentIds: ['eq-truck-18m-01'],
    assignedEquipmentNames: ['Xe thang tự hành 18m (65A-0892)'],
    currentStatus: 'DISPATCHED',
    status: 'DISPATCHED',
    assignedZoneId: 'zone-ninh-kieu',
    activeWorkOrdersCount: 1,
  },
  {
    id: 'team-prune-2',
    departmentId: 'dept-co-gioi',
    code: 'TEAM-PRUNE-02',
    name: 'Đội Xe Thang Cao Tuyến Sân Bay & Vành Đai',
    leaderUserId: 'user-staff-hung',
    leaderName: 'KTV. Nguyễn Văn Hùng',
    leaderPhone: '0908 776 543',
    memberUserIds: [],
    capabilities: ['AERIAL_PLATFORM', 'HEAVY_PRUNING'],
    equipmentIds: ['eq-truck-22m-02'],
    assignedEquipmentIds: ['eq-truck-22m-02'],
    assignedEquipmentNames: ['Xe thang vươn cần kỹ thuật 22m (65A-9988)'],
    currentStatus: 'DISPATCHED',
    status: 'DISPATCHED',
    assignedZoneId: 'zone-binh-thuy',
    activeWorkOrdersCount: 1,
  },
  {
    id: 'team-care-1',
    departmentId: 'dept-lam-sinh',
    code: 'TEAM-CARE-01',
    name: 'Tổ Chăm Sóc & Dưỡng Lâm Sinh Nam Cần Thơ',
    leaderUserId: 'user-staff-bao',
    leaderName: 'KTV. Đỗ Quốc Bảo',
    leaderPhone: '0939 888 234',
    memberUserIds: [],
    capabilities: ['WATERING', 'FERTILIZING', 'ROUTINE_MAINTENANCE'],
    equipmentIds: ['eq-water-truck-01'],
    assignedEquipmentIds: ['eq-water-truck-01'],
    assignedEquipmentNames: ['Xe bồn phun áp lực 8m³ (65C-3321)'],
    currentStatus: 'DISPATCHED',
    status: 'DISPATCHED',
    assignedZoneId: 'zone-ninh-kieu',
    activeWorkOrdersCount: 1,
  },
  {
    id: 'team-rapid-1',
    departmentId: 'dept-phan-ung-nhanh',
    code: 'TEAM-RAPID-01',
    name: 'Tổ Phản Ứng Nhanh Sự Cố & Thiên Tai (Bình Thủy)',
    leaderUserId: 'user-staff-2',
    leaderName: 'KTV. Lê Tuấn Anh',
    leaderPhone: '0912 345 603',
    memberUserIds: ['user-staff-2'],
    capabilities: ['EMERGENCY_RESPONSE', 'TREE_REMOVAL'],
    equipmentIds: ['eq-crane-truck-01', 'eq-van-rapid-01'],
    assignedEquipmentIds: ['eq-crane-truck-01', 'eq-van-rapid-01'],
    assignedEquipmentNames: ['Xe cẩu thùng nâng 15m (65B-1144)', 'Xe bán tải cơ động (65A-7711)'],
    currentStatus: 'AVAILABLE',
    status: 'AVAILABLE',
    assignedZoneId: 'zone-binh-thuy',
    activeWorkOrdersCount: 1,
  },
  {
    id: 'team-audit-1',
    departmentId: 'dept-giam-dinh',
    code: 'TEAM-AUDIT-01',
    name: 'Tổ Giám Định An Toàn & Siêu Âm Rễ Arbotom',
    leaderUserId: 'user-staff-phong',
    leaderName: 'KSV. Phạm Thanh Phong',
    leaderPhone: '0918 123 789',
    memberUserIds: [],
    capabilities: ['TREE_INSPECTION', 'ARBORIST_DIAGNOSE'],
    equipmentIds: ['eq-arbotom-01'],
    assignedEquipmentIds: ['eq-arbotom-01'],
    assignedEquipmentNames: ['Bộ máy cảm biến Arbotom 3D'],
    currentStatus: 'AVAILABLE',
    status: 'AVAILABLE',
    assignedZoneId: 'zone-ninh-kieu',
    activeWorkOrdersCount: 0,
  },
];

// ============================================================================
// 4. QUY TẮC BẢO DƯỠNG ĐÔ THỊ TỰ ĐỘNG (MAINTENANCE RULES ENGINE)
// ============================================================================

export const INITIAL_MAINTENANCE_RULES: MaintenanceRule[] = [
  {
    id: 'rule-prune-storm-season',
    name: 'Hạ Tán Đón Bão Định Kỳ Cây Cao Tuyến Đại Lộ',
    description: 'Tự động lên lệnh rà soát cắt hạ 30-40% tán cho toàn bộ cây cao ≥ 7m trên tuyến Đại Lộ Hòa Bình trong mùa mưa bão (Tháng 5 - Tháng 11).',
    scopeType: 'ROUTE',
    scopeId: 'route-hoa-binh',
    taskType: 'PRUNING',
    triggerType: 'TIME_BASED',
    scheduleConfig: {
      daysOfWeek: ['MONDAY'],
      timeOfDay: '07:30',
      frequencyDays: 30,
    },
    conditionConfig: {
      heightMMin: 7,
      daysSincePruningMin: 60,
    },
    priority: 'HIGH',
    requiredCapabilities: ['HEAVY_PRUNING', 'AERIAL_PLATFORM'],
    estimatedDurationHours: 4,
    isActive: true,
    createdAt: '2023-01-20T00:00:00.000Z',
    updatedAt: '2023-01-20T00:00:00.000Z',
  },
  {
    id: 'rule-water-hb-thursday',
    name: 'Tưới Nước & Kích Rễ Vi Sinh Trục 30 Tháng 4',
    description: 'Tự động tạo lệnh điều xe bồn 8m³ tưới ẩm và bổ sung dinh dưỡng bồn rễ định kỳ 2 lần/tuần.',
    scopeType: 'ROUTE',
    scopeId: 'route-30-4',
    taskType: 'WATERING',
    triggerType: 'TIME_BASED',
    scheduleConfig: {
      daysOfWeek: ['TUESDAY', 'FRIDAY'],
      timeOfDay: '06:00',
      frequencyDays: 3,
    },
    priority: 'MEDIUM',
    requiredCapabilities: ['WATERING', 'FERTILIZING'],
    estimatedDurationHours: 3,
    isActive: true,
    createdAt: '2023-01-20T00:00:00.000Z',
    updatedAt: '2023-01-20T00:00:00.000Z',
  },
  {
    id: 'rule-audit-cmt8-hazard',
    name: 'Kiểm Định Siêu Âm Rễ Cây Xà Cừ Cổ Thụ Nguy Hiểm',
    description: 'Tự động lập lệnh kiểm định chuyên sâu bằng máy Arbotom cho các cây có TRAQ từ HIGH trở lên hoặc góc nghiêng > 5° trên trục CMT8.',
    scopeType: 'ROUTE',
    scopeId: 'route-cmt8',
    taskType: 'INSPECTION',
    triggerType: 'CONDITION_BASED',
    conditionConfig: {
      traqRiskLevels: ['HIGH', 'EXTREME'],
      healthStatuses: ['POOR', 'CRITICAL'],
    },
    priority: 'CRITICAL',
    requiredCapabilities: ['TREE_INSPECTION', 'ARBORIST_DIAGNOSE'],
    estimatedDurationHours: 5,
    isActive: true,
    createdAt: '2023-01-20T00:00:00.000Z',
    updatedAt: '2023-01-20T00:00:00.000Z',
  },
];

export const INITIAL_SLA_POLICIES: SLAPolicy[] = [
  {
    priority: 'CRITICAL',
    responseTargetMinutes: 30, // 30 phút xe phải có mặt
    resolutionTargetMinutes: 120, // 2 giờ giải tỏa hiện trường
    description: 'Sự cố khẩn cấp, bật gốc cản trở giao thông huyết mạch hoặc đè lên lưới điện',
  },
  {
    priority: 'HIGH',
    responseTargetMinutes: 60,
    resolutionTargetMinutes: 240, // 4 giờ
    description: 'Cây nguy cơ gãy cành cao, bão lốc đang đổ bộ hoặc cành khô sà sát lòng đường',
  },
  {
    priority: 'MEDIUM',
    responseTargetMinutes: 120,
    resolutionTargetMinutes: 1440, // 24 giờ
    description: 'Tưới nước bồn rễ, bón phân, dọn cỏ vỉa hè',
  },
  {
    priority: 'LOW',
    responseTargetMinutes: 360,
    resolutionTargetMinutes: 2880, // 48 giờ
    description: 'Bảo trì biển nhôm QR code, kiểm tra định kỳ thông thường',
  },
];

// ============================================================================
// 5. LỆNH CÔNG TÁC MẪU (INITIAL SEED WORK ORDERS)
// ============================================================================

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-ct-2026-001',
    code: 'WO-HB-PRUNE-01',
    title: 'Hạ Tán Cơ Giới Đón Mùa Bão Trục Đại Lộ Hòa Bình',
    description: 'Rà soát cắt hạ 30% tán cho các cây Sao đen và Dầu rái loại 2, loại 3 đón gió bão.',
    type: 'PRUNING',
    priority: 'HIGH',
    scopeType: 'ROUTE',
    zoneId: 'zone-ninh-kieu',
    routeId: 'route-hoa-binh',
    routeCorridorName: 'Đại Lộ Hòa Bình',
    status: 'IN_PROGRESS',
    workflowStatus: 'IN_PROGRESS',
    slaStatus: 'ON_TRACK',
    scheduledStart: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
    actualStart: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    requiredCapabilities: ['HEAVY_PRUNING', 'AERIAL_PLATFORM'],
    assignedTeamId: 'team-prune-1',
    assignedTeamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
    assignedVehicleName: 'Xe Thang Tự Hành Nâng Cao 18m',
    assignedVehiclePlate: '65A-0892',
    totalItems: 48,
    completedItems: 36,
    skippedItems: 2,
    failedItems: 0,
    progressPercent: 79,
    supervisorUserId: 'user-admin',
    slaTargetMinutes: 240,
    isOverdue: false,
    createdByUserId: 'user-admin',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    anchorStatus: 'CONFIRMED',
  },
  {
    id: 'wo-ct-2026-002',
    code: 'WO-VVK-HIGH-02',
    title: 'Cắt Tỉa Phát Quang Tĩnh Không Đường Võ Văn Kiệt',
    description: 'Cắt tỉa hạ cành vươn cao che khuất tầm nhìn biển báo và đèn tín hiệu sân bay.',
    type: 'PRUNING',
    priority: 'CRITICAL',
    scopeType: 'ROUTE',
    zoneId: 'zone-binh-thuy',
    routeId: 'route-vo-van-kiet',
    routeCorridorName: 'Đường Võ Văn Kiệt',
    status: 'IN_PROGRESS',
    workflowStatus: 'IN_PROGRESS',
    slaStatus: 'ON_TRACK',
    scheduledStart: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
    actualStart: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    requiredCapabilities: ['HEAVY_PRUNING', 'AERIAL_PLATFORM'],
    assignedTeamId: 'team-prune-2',
    assignedTeamName: 'Đội Xe Thang Cao Tuyến Sân Bay & Vành Đai',
    assignedVehicleName: 'Xe Thang Vươn Cần Kỹ Thuật 22m',
    assignedVehiclePlate: '65A-9988',
    totalItems: 65,
    completedItems: 40,
    skippedItems: 3,
    failedItems: 1,
    progressPercent: 66,
    supervisorUserId: 'user-admin',
    slaTargetMinutes: 240,
    isOverdue: false,
    createdByUserId: 'user-admin',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    anchorStatus: 'CONFIRMED',
  },
  {
    id: 'wo-ct-2026-003',
    code: 'WO-304-WATER-03',
    title: 'Tưới Nước Dưỡng Rễ Bằng Xe Bồn Đường 30 Tháng 4',
    description: 'Tưới dưỡng ẩm và bổ sung vi sinh RPZ cho các bồn rễ cây Bàng Đài Loan và Lim Sét.',
    type: 'WATERING',
    priority: 'MEDIUM',
    scopeType: 'ROUTE',
    zoneId: 'zone-ninh-kieu',
    routeId: 'route-30-4',
    routeCorridorName: 'Đường 30 Tháng 4',
    status: 'COMPLETED',
    workflowStatus: 'COMPLETED',
    slaStatus: 'ON_TRACK',
    scheduledStart: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actualStart: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    actualEnd: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    requiredCapabilities: ['WATERING', 'FERTILIZING'],
    assignedTeamId: 'team-care-1',
    assignedTeamName: 'Tổ Chăm Sóc & Dưỡng Lâm Sinh Nam Cần Thơ',
    assignedVehicleName: 'Xe Bồn Phun Áp Lực 8m³',
    assignedVehiclePlate: '65C-3321',
    totalItems: 80,
    completedItems: 78,
    skippedItems: 2,
    failedItems: 0,
    progressPercent: 100,
    supervisorUserId: 'user-admin',
    supervisorNotes: 'Đã nghiệm thu độ ẩm bồn rễ đạt chuẩn kỹ thuật, các điểm bỏ qua do xe ô tô dân đỗ chắn.',
    slaTargetMinutes: 240,
    isOverdue: false,
    createdByUserId: 'user-admin',
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    anchorStatus: 'CONFIRMED',
  },
  {
    id: 'wo-ct-2026-004',
    code: 'WO-CMT8-STORM-04',
    title: 'Trực Ứng Cứu Dông Lốc & Cây Nghiêng Đường CMT8',
    description: 'Trực ban phản ứng nhanh sẵn sàng cơ động xử lý cành gãy và chống đỡ cây nghiêng.',
    type: 'EMERGENCY_RESPONSE',
    priority: 'CRITICAL',
    scopeType: 'ROUTE',
    zoneId: 'zone-binh-thuy',
    routeId: 'route-cmt8',
    routeCorridorName: 'Đường Cách Mạng Tháng 8',
    status: 'ASSIGNED',
    workflowStatus: 'ASSIGNED',
    slaStatus: 'ON_TRACK',
    scheduledStart: new Date().toISOString(),
    scheduledEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    requiredCapabilities: ['EMERGENCY_RESPONSE', 'TREE_REMOVAL'],
    assignedTeamId: 'team-rapid-1',
    assignedTeamName: 'Tổ Phản Ứng Nhanh Sự Cố & Thiên Tai (Bình Thủy)',
    assignedVehicleName: 'Xe Cẩu Thùng Nâng 15m',
    assignedVehiclePlate: '65B-1144',
    totalItems: 32,
    completedItems: 0,
    skippedItems: 0,
    failedItems: 0,
    progressPercent: 0,
    supervisorUserId: 'user-admin',
    slaTargetMinutes: 60,
    isOverdue: false,
    createdByUserId: 'user-admin',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    anchorStatus: 'PENDING',
  },
];

// ============================================================================
// 6. BUSINESS LOGIC ENGINE & STATE MACHINE VALIDATOR
// ============================================================================

/**
 * Tính số lượng Lệnh công tác đang hoạt động (Source of Truth) cho Tổ đội
 */
export function countActiveWorkOrdersForTeam(teamId: string, workOrders: WorkOrder[]): number {
  const activeStatuses: WorkOrderStatus[] = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD'];
  return workOrders.filter((wo) => wo.assignedTeamId === teamId && activeStatuses.includes(wo.status)).length;
}

/**
 * Kiểm tra hợp lệ chuyển đổi trạng thái WorkOrder theo State Machine
 * (Đã chuẩn hóa tách bạch Workflow State và SLA, bổ sung ON_HOLD, loại bỏ OVERDUE/REASSIGNED)
 */
export function canTransitionWorkOrderStatus(
  currentStatus: WorkOrderStatus,
  targetStatus: WorkOrderStatus
): boolean {
  if (currentStatus === targetStatus) return true;

  const validTransitions: Partial<Record<WorkOrderStatus, WorkOrderStatus[]>> = {
    DRAFT: ['PLANNED', 'ASSIGNED', 'CANCELLED'],
    PLANNED: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['ACCEPTED', 'IN_PROGRESS', 'CANCELLED'],
    ACCEPTED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
    IN_PROGRESS: ['SUBMITTED_FOR_REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
    ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
    SUBMITTED_FOR_REVIEW: ['VERIFIED', 'COMPLETED', 'REJECTED'],
    REJECTED: ['IN_PROGRESS', 'ASSIGNED', 'CANCELLED'],
    VERIFIED: ['COMPLETED', 'CLOSED'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
    CANCELLED: [],
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Gợi ý Tổ & Xe phù hợp nhất cho Lệnh công tác dựa theo năng lực yêu cầu
 */
export interface TeamRecommendation {
  team: Team;
  matchedEquipment: Equipment[];
  capabilityMatch: boolean;
  equipmentAvailable: boolean;
  canAssign: boolean;
  unmetReason?: string;
  score: number;
}

export function evaluateTeamRecommendations(
  teams: Team[],
  equipment: Equipment[],
  requiredCaps: CapabilityType[],
  zoneId?: string,
  workOrders?: WorkOrder[]
): TeamRecommendation[] {
  return teams.map((team) => {
    const capabilityMatch = requiredCaps.every((req) => team.capabilities.includes(req));
    const teamEq = equipment.filter((e) => team.assignedEquipmentIds.includes(e.id));
    const equipmentAvailable = teamEq.length > 0 && teamEq.every((e) => e.status !== 'MAINTENANCE' && e.status !== 'OUT_OF_SERVICE');
    
    // Tính active workload động từ Work Orders (Source of Truth)
    const activeOrdersCount = workOrders
      ? countActiveWorkOrdersForTeam(team.id, workOrders)
      : (team.activeWorkOrdersCount || 0);

    let canAssign = true;
    let unmetReason = '';

    if (!capabilityMatch) {
      canAssign = false;
      unmetReason = 'Thiếu năng lực kỹ thuật yêu cầu';
    } else if (teamEq.some((e) => e.status === 'MAINTENANCE' || e.status === 'OUT_OF_SERVICE')) {
      canAssign = false;
      unmetReason = 'Thiết bị/xe cơ giới đang bảo dưỡng hoặc hỏng hóc';
    }

    let score = 0;
    if (capabilityMatch) score += 50;
    if (equipmentAvailable) score += 30;
    if (zoneId && team.assignedZoneId === zoneId) score += 20;
    score -= activeOrdersCount * 10;

    return {
      team,
      matchedEquipment: teamEq,
      capabilityMatch,
      equipmentAvailable,
      canAssign,
      unmetReason,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

export function matchBestTeamForTask(
  teams: Team[],
  equipment: Equipment[],
  requiredCaps: CapabilityType[],
  zoneId?: string
): { team: Team | null; matchedEquipment: Equipment[] } {
  const recommendations = evaluateTeamRecommendations(teams, equipment, requiredCaps, zoneId);
  const eligible = recommendations.filter((r) => r.canAssign);

  if (eligible.length === 0) {
    return { team: null, matchedEquipment: [] };
  }

  return { team: eligible[0].team, matchedEquipment: eligible[0].matchedEquipment };
}

/**
 * Tự động tạo danh sách WorkOrderItem cho từng cây từ danh sách Tree
 */
export function buildWorkOrderItemsForTrees(
  trees: Tree[],
  workOrderId: string,
  taskType: WorkOrderType
): WorkOrderItem[] {
  // 🔒 CHÍNH SÁCH LOẠI TRỪ CÂY ĐÃ HẠ GIẢI / GIẢI TỎA (P0 Policy Enforcement)
  const activeTrees = trees.filter((t) => t.status !== 'REMOVED' && t.isActive !== false);

  return activeTrees.map((tree, idx) => {
    let actionDesc = 'Kiểm tra chăm sóc định kỳ';
    if (taskType === 'PRUNING') {
      actionDesc = (tree.heightM || 8) >= 10
        ? 'Hạ thấp 40% tán ngọn đón bão, quét keo liền sẹo cành lớn'
        : 'Cắt tỉa cành khô, tạo thông thoáng tĩnh không đường dây';
    } else if (taskType === 'WATERING') {
      actionDesc = 'Tưới vi sinh kích rễ RPZ 50 lít/cây, làm sạch cỏ bồn';
    } else if (taskType === 'INSPECTION') {
      actionDesc = 'Siêu âm rễ Arbotom 2D, đo độ nghiêng và ghi nhận rỗng thân';
    }

    return {
      id: `wo-item-${workOrderId}-${idx + 1}`,
      workOrderId,
      treeId: tree.id,
      treeStreetCode: getTreeStreetCode(tree),
      treeDisplayName: tree.displayName,
      houseMilestone: getTreeMilestone(tree),
      sequence: tree.sequenceNumber || idx + 1,
      status: 'PENDING' as ItemExecutionStatus,
      notes: actionDesc,
    };
  });
}

/**
 * Tạo bản ghi lịch sử chuyển trạng thái WorkOrder
 */
export function createWorkOrderHistoryRecord(
  workOrderId: string,
  actorUser: User,
  previousState: WorkOrderStatus,
  newState: WorkOrderStatus,
  reason?: string
): WorkOrderHistory {
  return {
    id: `wo-hist-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    workOrderId,
    actorUserId: actorUser.id,
    actorName: actorUser.fullName || actorUser.username,
    previousState,
    newState,
    reason,
    createdAt: new Date().toISOString(),
  };
}
