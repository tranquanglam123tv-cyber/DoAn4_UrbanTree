/**
 * UrbanTree - Type Definitions
 * Following roadmap specification v2.0
 */

export type Role = 'ADMIN' | 'STAFF' | 'CITIZEN';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  phone?: string;
  assignedDistrict?: string; // e.g. "Q. Ninh Kiều", "Q. Cái Răng", "Toàn thành phố"
  teamName?: string; // e.g. "Tổ Kỹ Thuật Số 1 - Phụ Trách Tuyến Hòa Bình"
}

export type TreeHealthStatus = 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'DEAD';

export interface TreeType {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  careGuide: string;
  isActive: boolean;
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
  imageUrl?: string;
  diameterCm?: number;
  heightM?: number;
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
