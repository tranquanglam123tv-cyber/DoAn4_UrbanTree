/**
 * UrbanTree - Type Definitions
 * Following roadmap specification v2.0
 */

export type Role = 'ADMIN' | 'STAFF' | 'CITIZEN';
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

export interface FellingPermit {
  permitNumber: string; // Số quyết định / giấy phép (VD: GP-45/SXD-QLĐT)
  issuedBy: string; // Cơ quan phê duyệt (Sở Xây Dựng TP. Cần Thơ hoặc UBND Quận/TP)
  issuedDate: string; // Ngày ký phê duyệt (YYYY-MM-DD)
  reason: string; // Lý do đốn hạ (Mục gốc >70%, sâu mọt nguy hiểm mùa bão, giải phóng mặt bằng)
  approvedByOfficer: string; // Cán bộ thẩm định / ký tên
  inspectionTeam: string; // Tổ kiểm định hiện trường (Thanh tra Đô thị & Cty Cây xanh)
  replacementPlantingRequired?: boolean; // Bắt buộc trồng cây bù đắp
}

export interface Tree {
  id: string;
  publicCode: string; // e.g. TREE-001
  streetCode?: string; // e.g. "HB-01", "30T4-02", "LHP-01" (Quy tắc định danh tuyến đường)
  streetCorridor?: string; // e.g. "Đại Lộ Hòa Bình", "Đường 30 Tháng 4", "Công Viên Lưu Hữu Phước"
  houseNumberMilestone?: string; // e.g. "Trước số 12 Đại lộ Hòa Bình" (Mốc số nhà)
  sequenceNumber?: number; // Thứ tự cây trên tuyến (1, 2, 3...)
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
  fellingPermit?: FellingPermit; // Biên bản / Giấy phép đốn hạ theo luật khi cây DEAD hoặc giải tỏa
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
  performedAt: string; // ISO-8601 UTC
  createdAt: string;
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
