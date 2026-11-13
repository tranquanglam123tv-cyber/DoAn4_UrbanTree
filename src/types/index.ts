/**
 * UrbanTree - Type Definitions
 * Following roadmap specification v2.0
 */

export type Role =
  | 'ADMIN'
  | 'STAFF'
  | 'CITIZEN'
  | 'SYSTEM_ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'DISPATCHER'
  | 'SUPERVISOR'
  | 'TEAM_LEADER'
  | 'FIELD_WORKER';
export type StaffWorkStatus = 'ACTIVE' | 'ON_MISSION' | 'ON_LEAVE';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  assignedDistrict?: string; // e.g. "Quận Ninh Kiều", "Quận Cái Răng", "Toàn TP. Cần Thơ"
  teamName?: string; // e.g. "Tổ Kỹ Thuật Số 1 - Tuyến Hòa Bình"
  department?: string; // e.g. "Phòng Quản Lý Đô Thị", "Đội Cây Xanh Môi Trường", "Tổ Kỹ Thuật Lâm Sinh"
  position?: string; // e.g. "Kỹ thuật viên trưởng", "Thợ cưa cắt cành bậc 4", "Chuyên viên giám định rễ"
  staffCode?: string; // e.g. "KTV-CT-028"
  workStatus?: StaffWorkStatus; // ACTIVE, ON_MISSION, ON_LEAVE
  missionNote?: string; // e.g. "Đang công tác rà soát cây nghiêng sau bão tại Ninh Kiều"
  joinedDate?: string; // YYYY-MM-DD
  skills?: string[]; // e.g. ["Vận hành xe thang", "Cưa hạ cành cao", "Siêu âm rễ Arbotom", "Xử lý nấm bệnh"]
  permissions?: string[]; // e.g. ["CARE_WRITE", "INCIDENT_RESOLVE", "TREE_FELL_APPROVE", "EXPORT_REPORT"]
  authProvider?: 'LOCAL' | 'GOOGLE';
}

export type TreeHealthStatus = 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'DEAD';

// Phân cấp cây đô thị theo Thông tư 20/2020/TT-BXD & Nghị định 64/2010/NĐ-CP
export type UrbanTreeClassification = 'TYPE_1' | 'TYPE_2' | 'HERITAGE';

export interface TreeType {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  careGuide: string;
  isActive: boolean;
  prohibitedPlanting?: boolean; // Cấm trồng trên vỉa hè theo quy định đô thị (rễ phá hoại hoặc độc tính)
  woodDensity?: number; // Tỷ trọng gỗ khô (g/cm3), dùng tính toán hấp thụ CO2 Allometric i-Tree
}

export interface CompensatoryPlanting {
  treeSpecies: string; // Tên loài cây trồng bù (e.g. "Cây Giáng Hương")
  targetLocation: string; // Vị trí / Địa chỉ trồng bù hoàn trả
  deadlineDate: string; // Hạn chót hoàn thành trồng bù (vụ mùa tới)
  status: 'PENDING' | 'PLANTED' | 'VERIFIED'; // Trạng thái: Chờ trồng / Đã trồng / Đã nghiệm thu
  verifiedBy?: string; // Cán bộ nghiệm thu
}

export interface FellingPermit {
  permitNumber: string; // Số quyết định / giấy phép (VD: GP-45/SXD-QLĐT)
  issuedBy: string; // Cơ quan phê duyệt (Sở Xây Dựng TP. Cần Thơ hoặc UBND Quận/TP)
  issuedDate: string; // Ngày ký phê duyệt (YYYY-MM-DD)
  reason: string; // Lý do đốn hạ (Mục gốc >70%, sâu mọt nguy hiểm mùa bão, giải phóng mặt bằng)
  approvedByOfficer: string; // Cán bộ thẩm định / ký tên
  inspectionTeam: string; // Tổ kiểm định hiện trường (Thanh tra Đô thị & Cty Cây xanh)
  replacementPlantingRequired?: boolean; // Bắt buộc trồng cây bù đắp
  compensatoryPlanting?: CompensatoryPlanting; // Kế hoạch trồng bù cây xanh hoàn trả
  trafficControlPlan?: string; // Phương án phân luồng giao thông (giờ cấm đường, thiết bị xe cẩu)
  councilMembers?: string[]; // Hội đồng 3 bên (Sở Xây Dựng, Cty Cây Xanh, UBND Phường)
}

export type ISATraqRating = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface Tree {
  id: string;
  publicCode: string; // e.g. TREE-001
  streetCode?: string; // e.g. "HB-01", "30T4-02", "LHP-01" (Quy tắc định danh tuyến đường)
  streetCorridor?: string; // e.g. "Đại Lộ Hòa Bình", "Đường 30 Tháng 4", "Công Viên Lưu Hữu Phước"
  houseNumberMilestone?: string; // e.g. "Trước số 12 Đại lộ Hòa Bình" (Mốc số nhà)
  sequenceNumber?: number; // Thứ tự cây trên tuyến (1, 2, 3...)
  zoneId?: string; // ID Vùng vận hành (Ninh Kiều, Bình Thủy, Cái Răng...)
  routeId?: string; // ID Tuyến công tác (Hòa Bình, 30/4, CMT8...)
  routeSequence?: number; // Thứ tự cây trên tuyến để đội đi tuần tự (1, 2, 3...)
  treeTypeId: string;
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
  plantedAt: string; // YYYY-MM-DD
  healthStatus: TreeHealthStatus;
  classification?: UrbanTreeClassification; // Phân cấp loại 1, loại 2 hoặc Cổ thụ di sản (Cấm chặt hạ)
  canopyDiameterM?: number; // Đường kính tán lá (m) - dùng hiển thị Polygon tán râm & sinh khối
  imageUrl?: string;
  diameterCm?: number;
  heightM?: number;
  // 🌲 Nghiệp vụ Thực Địa & An Toàn Bão Lũ
  tiltAngleDeg?: number; // Góc nghiêng thân cây (° so với phương đứng: 0 - 45°)
  hollowRatioPercent?: number; // Tỷ lệ rỗng ruột / mục thân theo siêu âm Arbotom (0 - 100%)
  rootDamageRisk?: 'NONE' | 'MODERATE' | 'SEVERE'; // Tổn thương bộ rễ do đào vỉa hè
  traqRating?: ISATraqRating; // Ma trận rủi ro chuẩn ISA TRAQ
  fellingPermit?: FellingPermit; // Biên bản / Giấy phép đốn hạ theo luật khi cây DEAD hoặc giải tỏa
  status?: 'ACTIVE' | 'REMOVED' | 'MAINTENANCE';
  removalPermit?: string;
  removalReason?: string;
  removedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Blockchain anchor metadata
  payloadVersion?: number;
  payloadHash?: string;
  anchorStatus?: AnchorStatus;
  txHash?: string;
}

export type CareActionType =
  | 'WATERING'
  | 'PRUNING'
  | 'FERTILIZING'
  | 'PEST_CONTROL'
  | 'SURVEY'
  | 'SUPPORT_STAKE'
  | 'TREATMENT';

export interface CareRecord {
  id: string;
  treeId: string;
  staffUserId: string;
  staffName?: string;
  actionType: CareActionType;
  healthBefore: TreeHealthStatus;
  healthAfter: TreeHealthStatus;
  notes: string;
  imageUrl?: string;
  // 🚜 Cơ giới hóa & Vật tư Lâm sinh
  equipmentUsed?: string; // e.g. "Xe thang 18m", "Máy cưa xích Stihl MS-194T", "Xe cẩu 5 tấn"
  chemicalsUsed?: string; // e.g. "Keo liền sẹo Tree Seal", "Sơn vôi quét gốc Bordeaux", "Phân vi sinh NPK"
  performedAt: string; // ISO-8601 UTC
  createdAt: string;
  // 📝 Chuỗi Đính Chính Bất Biến Append-only Correction Chain (UT-008)
  supersedesRecordId?: string; // ID bản ghi chăm sóc cũ bị đính chính
  correctionReason?: string; // Lý do đính chính (nhập sai liều lượng, nhầm lẫn loài cây...)
  isSuperseded?: boolean; // Bản ghi này đã bị bản ghi mới thay thế hay chưa
  // Blockchain metadata
  payloadVersion?: number;
  payloadHash?: string;
  anchorStatus?: AnchorStatus;
  txHash?: string;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'RECEIVED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'REOPENED';

export interface Incident {
  id: string;
  publicCode: string; // e.g. INC-84920
  treeId?: string | null;
  reporterName?: string;
  reporterPhone?: string;
  description: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  address?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedToUserId?: string | null;
  assignedToName?: string;
  reportedAt: string; // ISO-8601 UTC
  resolvedAt?: string | null;
  reopenedReason?: string;
  reopenedAt?: string;
  reopenedImageUrl?: string;
  reopenedCount?: number;
  duplicateCount?: number; // Số lượng phản ánh trùng đã được tự động gộp (UT-005)
  masterIncidentId?: string; // ID của sự cố gốc nếu đây là báo cáo trùng
  createdAt: string;
  updatedAt: string;
  // Blockchain metadata
  payloadVersion?: number;
  payloadHash?: string;
  anchorStatus?: AnchorStatus;
  txHash?: string;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  actorUserId: string;
  actorName: string;
  oldStatus: IncidentStatus;
  newStatus: IncidentStatus;
  note: string;
  imageUrl?: string;
  createdAt: string;
}

export type RecordType = 'TREE_PROFILE' | 'CARE_RECORD' | 'INCIDENT_REPORT' | 'INCIDENT_RESOLUTION';

export type AnchorStatus = 'CONFIRMED' | 'PENDING' | 'FAILED' | 'NOT_ANCHORED' | 'UNAVAILABLE';

export interface BlockchainAnchor {
  id: string;
  recordType: RecordType;
  recordId: string;
  payloadVersion: number;
  payloadHash: string; // 64-char lowercase hex
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  status: AnchorStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  confirmedAt?: string;
}

export type VerificationStatus = 'VALID' | 'MISMATCH' | 'NOT_ANCHORED' | 'PENDING' | 'UNAVAILABLE';

export interface VerificationResult {
  status: VerificationStatus;
  recordType: RecordType;
  recordId: string;
  currentHash: string;
  onChainHash?: string;
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  anchoredAt?: string;
  canonicalJson: string;
  diffFields?: Array<{
    field: string;
    currentValue: unknown;
    anchoredValue?: unknown;
  }>;
}

// ==========================================
// 🔔 THÔNG BÁO & CẢNH BÁO ĐIỀU HÀNH ĐÔ THỊ
// ==========================================

export type NotificationType =
  | 'STORM_ALERT'       // Cảnh báo giông bão / Mùa mưa bão / Hạ tán cây
  | 'INCIDENT_NEW'      // Phản ánh sự cố dân sinh mới gửi đến
  | 'INCIDENT_ASSIGNED' // Phân công lệnh xử lý hiện trường cho KTV
  | 'INCIDENT_RESOLVED' // Sự cố đã được xử lý xong
  | 'SLA_WARNING'       // Cảnh báo vi phạm / sắp trễ hạn SLA phản ứng nhanh
  | 'CARE_SCHEDULE'     // Nhắc lịch cắt tỉa cây xanh / bón phân định kỳ
  | 'FELL_PERMIT'       // Đề xuất & phê duyệt cấp phép đốn hạ cây nguy hiểm
  | 'BLOCKCHAIN_EVENT'  // Neo dữ liệu Smart Contract thành công / băm bất thường
  | 'DISPATCH_ALERT'    // Điều xe cơ giới và cập nhật Lệnh công tác hiện trường
  | 'MAINTENANCE_DUE'   // Cảnh báo lịch bảo dưỡng / tự động lập lệnh công tác
  | 'SYSTEM_BROADCAST'; // Thông báo chung từ Ban Chỉ huy Đô thị

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  targetRoles: Role[]; // Vai trò có quyền nhận thông báo
  targetUserId?: string; // Gửi riêng cho user cụ thể (nếu có)
  linkTab?: string; // Tab điều hướng nhanh: 'dashboard' | 'trees' | 'incidents' | 'map' | 'blockchain' | 'care' | 'staff_workstation'
  linkId?: string; // ID của entity liên quan: incidentId, treeId, txHash...
  isRead: boolean;
  createdAt: string; // ISO timestamp
  actionLabel?: string; // Nhãn nút bấm hành động (ví dụ: "Xem sự cố", "Xem danh sách cây")
  referenceId?: string;
  referenceType?: string;
}

// ==============================================================
// 🏢 1. ĐƠN VỊ TỔ CHỨC, ĐỘI NGŨ & NĂNG LỰC (CAPABILITY MATRIX)
// ==============================================================

export type CapabilityType =
  | 'WATERING'           // Tưới nước xe bồn 8m³
  | 'FERTILIZING'        // Bón phân vi sinh, kích rễ RPZ
  | 'ROUTINE_MAINTENANCE'// Quét vôi gốc, làm cỏ bồn rễ
  | 'TREE_INSPECTION'    // Khám nghiệm sâu bệnh, siêu âm rễ Arbotom
  | 'LOW_PRUNING'        // Cắt tỉa cành sà thấp <4m
  | 'HEAVY_PRUNING'      // Cắt tỉa hạ tán đón bão >7m (xe thang 18m)
  | 'AERIAL_PLATFORM'    // Vận hành xe thang 18m - 22m
  | 'TREE_REMOVAL'       // Đốn hạ cây nguy hiểm, xe cẩu 5-10 tấn
  | 'ARBORIST_DIAGNOSE'  // Giám định bệnh lý chuyên gia lâm sinh
  | 'EMERGENCY_RESPONSE';// Phản ứng nhanh cứu hộ bão lũ 24/7

export type EquipmentType =
  | 'AERIAL_LADDER_TRUCK' // Xe thang tự hành 18m - 22m
  | 'CRANE_TRUCK'         // Xe cẩu thùng nâng 5 tấn - 10 tấn
  | 'WATER_TANK_TRUCK'    // Xe bồn tưới nước 8m³
  | 'CHAINSAW'            // Máy cưa xích chuyên dụng Stihl
  | 'WOOD_CHIPPER'        // Máy băm nghiền cành nhánh di động
  | 'ARBOTOM_SONIC'       // Thiết bị siêu âm sóng âm bộng thân Arbotom
  | 'EMERGENCY_VAN';      // Xe bán tải cơ động cứu hộ 24/7

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface Equipment {
  id: string;
  code: string; // e.g. "EQ-XT-01"
  name: string; // e.g. "Xe thang tự hành 18m (65A-0892)"
  type: EquipmentType;
  plateNumber?: string; // e.g. "65A-0892"
  status: EquipmentStatus;
  capabilities: CapabilityType[];
  currentTeamId?: string;
  currentZoneId?: string;
  currentWorkOrderId?: string;
  maintenanceNote?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type OrgUnitType = 'HEADQUARTERS' | 'DEPARTMENT' | 'TEAM' | 'UNIT';

export interface OrganizationUnit {
  id: string;
  name: string;
  code: string;
  type: OrgUnitType;
  parentId?: string | null;
  managerId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  departmentId?: string;
  organizationUnitId?: string;
  name: string;
  code: string;
  leaderUserId?: string;
  leaderName?: string;
  leaderPhone?: string;
  memberUserIds: string[];
  capabilities: CapabilityType[];
  equipmentIds?: string[];
  assignedEquipmentIds: string[];
  assignedEquipmentNames?: string[];
  status?: 'AVAILABLE' | 'BUSY' | 'DISPATCHED' | 'OFF_DUTY';
  currentStatus: 'AVAILABLE' | 'BUSY' | 'DISPATCHED' | 'OFF_DUTY';
  assignedZoneId?: string;
  activeWorkOrdersCount: number;
}

// ==============================================================
// 🗺️ 2. PHÂN CẤP ĐỊA BÀN: ZONE & ROUTE MANAGEMENT
// ==============================================================

export interface OperationalZone {
  id: string;
  code: string; // e.g. "ZONE-NK-01"
  name: string; // e.g. "Khu Vực Trung Tâm Ninh Kiều"
  district: string; // e.g. "Quận Ninh Kiều"
  description: string;
  boundaryGeometry?: string; // GeoJSON Polygon
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Route {
  id: string;
  zoneId: string;
  code: string; // e.g. "ROUTE-HB"
  name: string; // e.g. "Trục Đại Lộ Hòa Bình"
  description: string;
  startPoint?: string;
  endPoint?: string;
  totalTreesCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

// ==============================================================
// 📋 3. TRUNG TÂM LỆNH CÔNG TÁC (WORK ORDER CENTER)
// ==============================================================

export type WorkOrderType =
  | 'PLANNED_MAINTENANCE'
  | 'INSPECTION'
  | 'PRUNING'
  | 'WATERING'
  | 'FERTILIZATION'
  | 'TREE_REMOVAL'
  | 'INCIDENT_RESPONSE'
  | 'EMERGENCY_RESPONSE'
  | 'SPECIAL_CAMPAIGN';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type WorkOrderScopeType = 'SINGLE_TREE' | 'MULTIPLE_TREES' | 'ROUTE' | 'ZONE';

export type WorkOrderWorkflowStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'SUBMITTED_FOR_REVIEW'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REJECTED';

// Alias backwards compatible với WorkOrderWorkflowStatus (đã loại bỏ OVERDUE và REASSIGNED khỏi Workflow)
export type WorkOrderStatus = WorkOrderWorkflowStatus;

export type WorkOrderSLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export type BlockchainAnchorStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'ANCHORED'
  | 'CONFIRMED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL';

export type ItemExecutionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED' | 'NEEDS_FOLLOW_UP';

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  treeId: string;
  treeStreetCode?: string;
  treeDisplayName?: string;
  houseMilestone?: string;
  sequence: number;
  status: ItemExecutionStatus;
  result?: string;
  reason?: string; // Tương đương skipOrFailureReason
  skipOrFailureReason?: string; // Lý do bỏ qua hoặc thất bại bắt buộc
  completedAt?: string;
  completedBy?: string; // Tên hoặc ID người hoàn thành
  completedByUserId?: string;
  evidenceBeforeImageUrl?: string;
  evidenceAfterImageUrl?: string;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  code: string; // e.g. "WO-2026-CT-00125"
  title: string;
  description: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  scopeType: WorkOrderScopeType;
  zoneId?: string;
  routeId?: string;
  routeCorridorName?: string;
  incidentId?: string | null;
  status: WorkOrderWorkflowStatus;
  workflowStatus?: WorkOrderWorkflowStatus;
  slaStatus: WorkOrderSLAStatus;
  scheduledStart: string;
  scheduledEnd: string;
  deadline?: string;
  actualStart?: string;
  actualEnd?: string;
  // Trạng thái tạm dừng thi công (ON_HOLD)
  holdReason?: string;
  heldByUserId?: string;
  heldAt?: string;
  requiredCapabilities: CapabilityType[];
  requiredEquipmentIds?: string[];
  assignedTeamId?: string | null;
  assignedTeamName?: string;
  assignedVehicleName?: string;
  assignedVehiclePlate?: string;
  totalItems: number;
  completedItems: number;
  skippedItems: number;
  failedItems: number;
  progressPercent: number;
  supervisorUserId?: string;
  supervisorNotes?: string;
  slaTargetMinutes?: number;
  isOverdue?: boolean; // Cờ cảnh báo SLA, không làm mất trạng thái workflow
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  // Blockchain metadata & Queue retry policy
  payloadHash?: string;
  anchorStatus?: BlockchainAnchorStatus;
  retryCount?: number;
  lastError?: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  txHash?: string;
}

export interface WorkOrderHistory {
  id: string;
  workOrderId: string;
  actorUserId: string;
  actorName: string;
  previousState: WorkOrderWorkflowStatus;
  previousStatus?: WorkOrderWorkflowStatus;
  newState: WorkOrderWorkflowStatus;
  newStatus?: WorkOrderWorkflowStatus;
  action?: 'STATUS_CHANGE' | 'REASSIGNED' | 'HOLD' | 'RESUME' | 'ITEM_UPDATED' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | string;
  reason?: string;
  previousTeamId?: string;
  newTeamId?: string;
  heldReason?: string;
  performedBy?: string;
  performedAt?: string;
  createdAt: string;
}

// ==============================================================
// ⚙️ 4. QUY TẮC BẢO DƯỠNG & CHÍNH SÁCH SLA (RULES ENGINE)
// ==============================================================

export type RuleTriggerType = 'TIME_BASED' | 'CONDITION_BASED' | 'EVENT_BASED';

export interface MaintenanceRule {
  id: string;
  name: string; // e.g. "Tưới nước trục Đại Lộ Hòa Bình Thứ 2 & Thứ 5"
  description: string;
  scopeType: 'ROUTE' | 'ZONE' | 'CRITERIA';
  scopeId?: string; // Route ID hoặc Zone ID
  taskType: WorkOrderType;
  triggerType: RuleTriggerType;
  scheduleConfig?: {
    daysOfWeek?: string[]; // e.g. ["MONDAY", "THURSDAY"]
    timeOfDay?: string; // e.g. "07:00"
    frequencyDays?: number; // e.g. 7
  };
  conditionConfig?: {
    heightMMin?: number;
    daysSincePruningMin?: number;
    traqRiskLevels?: string[]; // e.g. ["HIGH", "EXTREME"]
    healthStatuses?: string[]; // e.g. ["POOR", "CRITICAL"]
  };
  priority: WorkOrderPriority;
  requiredCapabilities: CapabilityType[];
  estimatedDurationHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SLAPolicy {
  priority: WorkOrderPriority;
  responseTargetMinutes: number; // Thời gian tối đa xe phải xuất phát tới nơi
  resolutionTargetMinutes: number; // Thời gian tối đa hoàn thành xử lý
  description: string;
}
