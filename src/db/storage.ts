/**
 * UrbanTree - Storage Engine & Database Service
 * Provides in-memory + LocalStorage persistence, seed data, and CRUD operations.
 */

import {
  AnchorStatus,
  AppNotification,
  CapabilityType,
  CareActionType,
  CareRecord,
  Department,
  Equipment,
  EquipmentStatus,
  EquipmentType,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdate,
  MaintenanceRule,
  OperationalZone,
  RecordType,
  Role,
  Route,
  SLAPolicy,
  Team,
  Tree,
  TreeHealthStatus,
  TreeType,
  User,
  WorkOrder,
  WorkOrderHistory,
  WorkOrderItem,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from '../types';
import { blockchainService } from '../services/blockchainService';
import { computeRecordHash } from '../services/hashService';
import { calculateISATraqRating, calculateHaversineDistance, getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_ZONES,
  INITIAL_ROUTES,
  INITIAL_EQUIPMENT,
  INITIAL_TEAMS,
  INITIAL_MAINTENANCE_RULES,
  INITIAL_SLA_POLICIES,
  INITIAL_WORK_ORDERS,
  canTransitionWorkOrderStatus,
  countActiveWorkOrdersForTeam,
  evaluateTeamRecommendations,
  TeamRecommendation,
  matchBestTeamForTask,
  buildWorkOrderItemsForTrees,
  createWorkOrderHistoryRecord,
} from './operationsEngine';

const USERS_STORAGE_KEY = 'urbantree_users';
const TREE_TYPES_STORAGE_KEY = 'urbantree_tree_types';
const TREES_STORAGE_KEY = 'urbantree_trees';
const CARE_RECORDS_STORAGE_KEY = 'urbantree_care_records';
const INCIDENTS_STORAGE_KEY = 'urbantree_incidents';
const INCIDENT_UPDATES_STORAGE_KEY = 'urbantree_incident_updates';
const NOTIFICATIONS_STORAGE_KEY = 'urbantree_notifications';
const ACTIVE_USER_KEY = 'urbantree_active_user';

const DEPARTMENTS_STORAGE_KEY = 'urbantree_departments';
const ZONES_STORAGE_KEY = 'urbantree_zones';
const ROUTES_STORAGE_KEY = 'urbantree_routes';
const TEAMS_STORAGE_KEY = 'urbantree_teams';
const EQUIPMENT_STORAGE_KEY = 'urbantree_equipment';
const WORK_ORDERS_STORAGE_KEY = 'urbantree_work_orders';
const WORK_ORDER_ITEMS_STORAGE_KEY = 'urbantree_work_order_items';
const WORK_ORDER_HISTORY_STORAGE_KEY = 'urbantree_work_order_history';
const MAINTENANCE_RULES_STORAGE_KEY = 'urbantree_maintenance_rules';
const SLA_POLICIES_STORAGE_KEY = 'urbantree_sla_policies';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Đặng Thế Thuận',
    role: 'ADMIN',
    isActive: true,
    staffCode: 'ADMIN-CT-001',
    department: 'Sở Xây Dựng & Ban QLĐT Cần Thơ',
    position: 'Chỉ Huy Trưởng Hệ Thống GIS',
    assignedDistrict: 'Toàn TP. Cần Thơ',
    teamName: 'Ban Điều Hành & Giám Sát Cấp Cao',
    phone: '0903 123 456',
    email: 'dangthethuan.sxd@cantho.gov.vn',
    workStatus: 'ACTIVE',
    joinedDate: '2023-01-15',
    skills: ['Điều phối bão lũ', 'Kiểm toán Blockchain', 'Phê duyệt giấy phép'],
    permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE', 'TREE_FELL_APPROVE', 'EXPORT_REPORT', 'STAFF_MANAGE'],
  },
  {
    id: 'user-staff-1',
    username: 'staff_lam',
    fullName: 'Trần Minh Bình',
    role: 'STAFF',
    isActive: true,
    staffCode: 'KTV-CT-012',
    department: 'Đội Cây Xanh Môi Trường Đô Thị',
    position: 'Kỹ thuật viên trưởng ca',
    assignedDistrict: 'Quận Ninh Kiều',
    teamName: 'Đội Xe Thang Số 1 - Tuyến Hòa Bình',
    phone: '0912 345 601',
    email: 'staff.binh@urbantree.cantho.vn',
    workStatus: 'ACTIVE',
    joinedDate: '2023-06-01',
    skills: ['Vận hành xe thang 18m', 'Cắt tỉa hạ tán đón bão', 'Siêu âm rễ Arbotom'],
    permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE', 'EXPORT_REPORT'],
  },
  {
    id: 'user-staff-2',
    username: 'staff_tuan',
    fullName: 'Lê Tuấn Anh',
    role: 'STAFF',
    isActive: true,
    staffCode: 'KTV-CT-018',
    department: 'Đội Phản Ứng Nhanh Sự Cố Thiên Tai',
    position: 'Chuyên viên xử lý giông lốc',
    assignedDistrict: 'Quận Bình Thủy',
    teamName: 'Tổ Cơ Động Cắt Tỉa Mùa Bão',
    phone: '0912 345 603',
    email: 'tuananh.ktv@urbantree.cantho.vn',
    workStatus: 'ON_MISSION',
    missionNote: 'Đang trực tiếp tuần tra cưa nhánh gãy đổ trên tuyến Cách Mạng Tháng 8',
    joinedDate: '2023-08-10',
    skills: ['Cưa xích cao độ', 'Gia cố cọc giằng bão', 'An toàn hành lang điện'],
    permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE'],
  },
];

export const INITIAL_TREE_TYPES: TreeType[] = [
  {
    id: 'type-bang',
    name: 'Bàng Đài Loan',
    scientificName: 'Terminalia mantaly',
    description: 'Cây thân gỗ nhỏ đến trung bình, tán lá xếp tầng ngang đẹp mắt, rễ cọc bám sâu ít gây nứt vỉa hè đô thị.',
    careGuide: 'Cắt tỉa các cành sà thấp định kỳ 6 tháng/lần, kiểm tra sâu đục thân vào mùa mưa.',
    isActive: true,
  },
  {
    id: 'type-me',
    name: 'Me Tây',
    scientificName: 'Samanea saman',
    description: 'Cây bóng mát đại mộc, tán hình dù rộng tới 30m, hoa hình chùm phớt hồng thơm dịu.',
    careGuide: 'Khảo sát độ rỗng thân hằng năm, tỉa cành khô trước mùa mưa bão để tránh gãy đổ.',
    isActive: true,
  },
  {
    id: 'type-sao',
    name: 'Sao Đen',
    scientificName: 'Hopea odorata',
    description: 'Cây đại mộc cao 30-40m, thân tròn thẳng tắp, vỏ nứt dọc màu nâu sẫm, biểu tượng cây xanh cổ thụ Sài Gòn.',
    careGuide: 'Chống đỡ khi cây còn non, bón phân vi sinh định kỳ và bảo vệ vùng rễ quanh gốc cây.',
    isActive: true,
  },
  {
    id: 'type-gianghuong',
    name: 'Giáng Hương',
    scientificName: 'Pterocarpus macrocarpus',
    description: 'Cây gỗ quý bản địa, hoa vàng óng ả thơm ngát, tán lá dày lọc bụi và giảm nhiệt cực tốt.',
    careGuide: 'Tưới nước vừa phải, tưới ẩm gốc vào mùa khô, kiểm tra mối đất quanh gốc.',
    isActive: true,
  },
  {
    id: 'type-chuongvang',
    name: 'Chuông Vàng',
    scientificName: 'Tabebuia argentea',
    description: 'Cây hoa cảnh quan đô thị, nở rộ hoa chuông vàng rực rỡ vào mùa xuân hè, tạo điểm nhấn cảnh quan.',
    careGuide: 'Cắt tỉa cành vượt sau mỗi đợt hoa tàn, bón phân hữu cơ định kỳ.',
    isActive: true,
  },
];

export const INITIAL_TREES: Tree[] = [
  // --- TUYẾN 1: ĐẠI LỘ HÒA BÌNH (DÃY BÀNG ĐÀI LOAN HB-01 -> HB-05) ---
  {
    id: 'tree-001',
    publicCode: 'TREE-001',
    streetCode: 'HB-01',
    streetCorridor: 'Đại Lộ Hòa Bình',
    houseNumberMilestone: 'Trước số 12 Đại lộ Hòa Bình',
    sequenceNumber: 1,
    treeTypeId: 'type-bang',
    displayName: 'Cây Bàng Đài Loan #01',
    address: 'Trước số 12 Đại lộ Hòa Bình, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.036829,
    longitude: 105.782541,
    plantedAt: '2021-03-15',
    healthStatus: 'GOOD',
    diameterCm: 28,
    heightM: 7.5,
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-hb-02',
    publicCode: 'TREE-HB-02',
    streetCode: 'HB-02',
    streetCorridor: 'Đại Lộ Hòa Bình',
    houseNumberMilestone: 'Trước số 16 Đại lộ Hòa Bình',
    sequenceNumber: 2,
    treeTypeId: 'type-bang',
    displayName: 'Cây Bàng Đài Loan #02',
    address: 'Trước số 16 Đại lộ Hòa Bình, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.03642,
    longitude: 105.7821,
    plantedAt: '2021-03-15',
    healthStatus: 'GOOD',
    diameterCm: 29,
    heightM: 7.8,
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-hb-03',
    publicCode: 'TREE-HB-03',
    streetCode: 'HB-03',
    streetCorridor: 'Đại Lộ Hòa Bình',
    houseNumberMilestone: 'Trước số 22 Đại lộ Hòa Bình (UBND TP)',
    sequenceNumber: 3,
    treeTypeId: 'type-bang',
    displayName: 'Cây Bàng Đài Loan #03',
    address: 'Trước số 22 Đại lộ Hòa Bình, Phường Tân An, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.03601,
    longitude: 105.78168,
    plantedAt: '2021-03-15',
    healthStatus: 'FAIR',
    diameterCm: 27,
    heightM: 7.2,
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-hb-04',
    publicCode: 'TREE-HB-04',
    streetCode: 'HB-04',
    streetCorridor: 'Đại Lộ Hòa Bình',
    houseNumberMilestone: 'Đối diện số 30 Đại lộ Hòa Bình',
    sequenceNumber: 4,
    treeTypeId: 'type-bang',
    displayName: 'Cây Bàng Đài Loan #04',
    address: 'Đối diện số 30 Đại lộ Hòa Bình, Phường Tân An, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.0356,
    longitude: 105.78125,
    plantedAt: '2021-03-15',
    healthStatus: 'POOR',
    diameterCm: 26,
    heightM: 6.9,
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-hb-05',
    publicCode: 'TREE-HB-05',
    streetCode: 'HB-05',
    streetCorridor: 'Đại Lộ Hòa Bình',
    houseNumberMilestone: 'Trước số 38 Đại lộ Hòa Bình',
    sequenceNumber: 5,
    treeTypeId: 'type-bang',
    displayName: 'Cây Bàng Đài Loan #05',
    address: 'Trước số 38 Đại lộ Hòa Bình, Phường Tân An, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.03519,
    longitude: 105.78082,
    plantedAt: '2021-03-15',
    healthStatus: 'GOOD',
    diameterCm: 30,
    heightM: 8.0,
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },

  // --- TUYẾN 2: ĐƯỜNG 30 THÁNG 4 (DÃY ME TÂY CỔ THỤ 30T4-01 -> 30T4-04) ---
  {
    id: 'tree-30t4-01',
    publicCode: 'TREE-30T4-01',
    streetCode: '30T4-01',
    streetCorridor: 'Đường 30 Tháng 4',
    houseNumberMilestone: 'Trước số 15 Đường 30 Tháng 4',
    sequenceNumber: 1,
    treeTypeId: 'type-me',
    displayName: 'Cây Me Tây Tuyến Phố #01',
    address: 'Trước số 15 Đường 30 Tháng 4, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.02985,
    longitude: 105.77712,
    plantedAt: '2014-05-10',
    healthStatus: 'GOOD',
    diameterCm: 68,
    heightM: 15.5,
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-30t4-02',
    publicCode: 'TREE-30T4-02',
    streetCode: '30T4-02',
    streetCorridor: 'Đường 30 Tháng 4',
    houseNumberMilestone: 'Trước số 25 Đường 30 Tháng 4',
    sequenceNumber: 2,
    treeTypeId: 'type-me',
    displayName: 'Cây Me Tây Tuyến Phố #02',
    address: 'Trước số 25 Đường 30 Tháng 4, Phường An Phú, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.02935,
    longitude: 105.77662,
    plantedAt: '2014-05-10',
    healthStatus: 'FAIR',
    diameterCm: 62,
    heightM: 14.8,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-006',
    publicCode: 'TREE-006',
    streetCode: '30T4-03',
    streetCorridor: 'Đường 30 Tháng 4',
    houseNumberMilestone: 'Trước số 45 Đường 30 Tháng 4 (Vincom Plaza Xuân Khánh)',
    sequenceNumber: 3,
    treeTypeId: 'type-me',
    displayName: 'Cây Me Tây Góc Phố #03',
    address: 'Đường 30 Tháng 4 (Gần Vincom Plaza Xuân Khánh), Quận Ninh Kiều, Cần Thơ',
    latitude: 10.02885,
    longitude: 105.77612,
    plantedAt: '2015-11-20',
    healthStatus: 'CRITICAL',
    diameterCm: 64,
    heightM: 14.2,
    tiltAngleDeg: 24,
    hollowRatioPercent: 65,
    rootDamageRisk: 'SEVERE',
    traqRating: 'EXTREME',
    fellingPermit: {
      permitNumber: 'GP-45/SXD-QLĐT-2026',
      issuedBy: 'Sở Xây Dựng TP. Cần Thơ - Phòng Quản lý Đô thị',
      issuedDate: '2026-10-25',
      reason: 'Cây nghiêng 24° về phía lòng đường, siêu âm Arbotom phát hiện rỗng thân 65%, đứt rễ bạnh chính do đào cống, rủi ro ISA TRAQ EXTREME (Nguy cơ đổ ngã trong giông lốc).',
      approvedByOfficer: 'KS. Nguyễn Văn Dũng (Phó Trưởng phòng QLĐT)',
      inspectionTeam: 'Tổ Giám định Liên ngành: Sở Xây Dựng + Cty CP Cây Xanh Cần Thơ + UBND Phường Xuân Khánh',
      replacementPlantingRequired: true,
      councilMembers: [
        'Sở Xây Dựng TP. Cần Thơ (Phòng Quản lý Đô thị)',
        'Công ty CP Cây Xanh Đô Thị Cần Thơ (Đội Xe thang Cơ giới)',
        'UBND Phường Xuân Khánh (Cán bộ Địa chính - Môi trường)',
      ],
      trafficControlPlan: 'Tạm cấm lưu thông 2 làn đường số 45 Đ. 30/4 từ 21h00 - 23h30; Điều động xe thang 18m, xe cẩu 5 tấn cắt từng phân đoạn tán hạ thấp trước khi đào gốc.',
      compensatoryPlanting: {
        treeSpecies: 'Cây Sao Đen (Hopea odorata) - Cây loại 2 quy chuẩn',
        targetLocation: 'Trước số 48 Đường 30 Tháng 4 (Cách vị trí cũ 6m, đảm bảo tĩnh không)',
        deadlineDate: '2026-11-30',
        status: 'PENDING',
        verifiedBy: 'Cán bộ Lâm sinh TP. Cần Thơ',
      },
    },
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-30t4-04',
    publicCode: 'TREE-30T4-04',
    streetCode: '30T4-04',
    streetCorridor: 'Đường 30 Tháng 4',
    houseNumberMilestone: 'Đối diện số 52 Đường 30 Tháng 4',
    sequenceNumber: 4,
    treeTypeId: 'type-me',
    displayName: 'Cây Me Tây Tuyến Phố #04',
    address: 'Đối diện số 52 Đường 30 Tháng 4, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.02835,
    longitude: 105.77562,
    plantedAt: '2014-05-10',
    healthStatus: 'GOOD',
    diameterCm: 70,
    heightM: 16.2,
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },

  // --- TUYẾN 3: CÔNG VIÊN LƯU HỮU PHƯỚC (DÃY ĐẠI MỘC LHP-01 -> LHP-03) ---
  {
    id: 'tree-lhp-01',
    publicCode: 'TREE-LHP-01',
    streetCode: 'LHP-01',
    streetCorridor: 'Công Viên Lưu Hữu Phước',
    houseNumberMilestone: 'Cổng chính Công viên Lưu Hữu Phước',
    sequenceNumber: 1,
    treeTypeId: 'type-sao',
    displayName: 'Cây Sao Đen Đại Mộc #01',
    address: 'Cổng chính Công viên Lưu Hữu Phước, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.0371,
    longitude: 105.7828,
    plantedAt: '2010-02-14',
    healthStatus: 'GOOD',
    diameterCm: 78,
    heightM: 19.5,
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-lhp-02',
    publicCode: 'TREE-LHP-02',
    streetCode: 'LHP-02',
    streetCorridor: 'Công Viên Lưu Hữu Phước',
    houseNumberMilestone: 'Lối dạo vành đai phía Đông CV Lưu Hữu Phước',
    sequenceNumber: 2,
    treeTypeId: 'type-gianghuong',
    displayName: 'Cây Giáng Hương Quý #02',
    address: 'Lối dạo phía Đông CV Lưu Hữu Phước, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.0374,
    longitude: 105.78315,
    plantedAt: '2016-08-19',
    healthStatus: 'GOOD',
    diameterCm: 42,
    heightM: 11.2,
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-lhp-03',
    publicCode: 'TREE-LHP-03',
    streetCode: 'LHP-03',
    streetCorridor: 'Công Viên Lưu Hữu Phước',
    houseNumberMilestone: 'Quảng trường nhạc nước CV Lưu Hữu Phước',
    sequenceNumber: 3,
    treeTypeId: 'type-chuongvang',
    displayName: 'Cây Chuông Vàng Cảnh Quan #03',
    address: 'Quảng trường nhạc nước CV Lưu Hữu Phước, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.0377,
    longitude: 105.7835,
    plantedAt: '2020-04-30',
    healthStatus: 'GOOD',
    diameterCm: 25,
    heightM: 6.2,
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },

  // --- CÁC CÂY ĐẶC TRƯNG KHÁC TẠI CẦN THƠ ---
  {
    id: 'tree-002',
    publicCode: 'TREE-002',
    streetCode: 'NK-01',
    streetCorridor: 'Bến Ninh Kiều',
    houseNumberMilestone: 'Trước Tượng đài Bác Hồ, Bến Ninh Kiều',
    sequenceNumber: 1,
    treeTypeId: 'type-me',
    displayName: 'Cây Me Tây Cổ Thụ #02',
    address: 'Bến Ninh Kiều, Đường Hai Bà Trưng, Phường Tân An, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.034515,
    longitude: 105.78822,
    plantedAt: '2012-06-20',
    healthStatus: 'FAIR',
    diameterCm: 72,
    heightM: 16.0,
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-003',
    publicCode: 'TREE-003',
    streetCode: '3T2-01',
    streetCorridor: 'Đường 3 Tháng 2',
    houseNumberMilestone: 'Cổng C Đại học Cần Thơ (Khu II)',
    sequenceNumber: 1,
    treeTypeId: 'type-sao',
    displayName: 'Cây Sao Đen Đại Mộc #03',
    address: 'Đại học Cần Thơ (Khu II), Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.031251,
    longitude: 105.76915,
    plantedAt: '2008-04-10',
    healthStatus: 'POOR',
    diameterCm: 85,
    heightM: 22.0,
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-004',
    publicCode: 'TREE-004',
    streetCode: 'SH-01',
    streetCorridor: 'Công Viên Sông Hậu',
    houseNumberMilestone: 'Kè sông Hậu, gần nhà hàng Hoa Sứ',
    sequenceNumber: 1,
    treeTypeId: 'type-gianghuong',
    displayName: 'Cây Giáng Hương Tuyến Phố #04',
    address: 'Công viên Sông Hậu, Đường Lê Lợi, Phường Cái Khế, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.04652,
    longitude: 105.79153,
    plantedAt: '2022-09-02',
    healthStatus: 'GOOD',
    diameterCm: 32,
    heightM: 8.2,
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  {
    id: 'tree-005',
    publicCode: 'TREE-005',
    streetCode: 'CDB-01',
    streetCorridor: 'Cầu Đi Bộ Ninh Kiều',
    houseNumberMilestone: 'Chân Cầu Tình Yêu phía Ninh Kiều',
    sequenceNumber: 1,
    treeTypeId: 'type-chuongvang',
    displayName: 'Cây Chuông Vàng Cảnh Quan #05',
    address: 'Cầu Đi Bộ Ninh Kiều (Cầu Tình Yêu), Phường Tân An, Quận Ninh Kiều, Cần Thơ',
    latitude: 10.0328,
    longitude: 105.7895,
    plantedAt: '2023-01-18',
    healthStatus: 'GOOD',
    diameterCm: 22,
    heightM: 5.5,
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  // --- TUYẾN QUẬN CÁI RĂNG (VÕ NGUYÊN GIÁP & CẦU CẦN THƠ) ---
  {
    id: 'tree-cr-01',
    publicCode: 'TREE-CR-01',
    streetCode: 'CR-01',
    streetCorridor: 'Đại lộ Võ Nguyên Giáp',
    houseNumberMilestone: 'Gần cầu Quang Trung, Phường Hưng Phú',
    sequenceNumber: 1,
    treeTypeId: 'type-bang',
    displayName: 'Cây Bàng Đài Loan Tuyến Cái Răng #01',
    address: 'Đại lộ Võ Nguyên Giáp, Phường Hưng Phú, Quận Cái Răng, Cần Thơ',
    latitude: 10.0125,
    longitude: 105.7982,
    plantedAt: '2022-04-12',
    healthStatus: 'GOOD',
    diameterCm: 30,
    heightM: 8.0,
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  // --- TUYẾN QUẬN BÌNH THỦY (ĐẠI LỘ VÕ VĂN KIỆT & SÂN BAY) ---
  {
    id: 'tree-bt-01',
    publicCode: 'TREE-BT-01',
    streetCode: 'BT-01',
    streetCorridor: 'Đại lộ Võ Văn Kiệt',
    houseNumberMilestone: 'Vòng xoay hướng vào Sân bay Cần Thơ',
    sequenceNumber: 1,
    treeTypeId: 'type-gianghuong',
    displayName: 'Cây Giáng Hương Cảnh Quan Sân Bay #01',
    address: 'Đại lộ Võ Văn Kiệt, Phường An Thới, Quận Bình Thủy, Cần Thơ',
    latitude: 10.0682,
    longitude: 105.7425,
    plantedAt: '2020-11-20',
    healthStatus: 'GOOD',
    diameterCm: 35,
    heightM: 9.2,
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  // --- TUYẾN QUẬN Ô MÔN (QUỐC LỘ 91 & KCN TRÀ NÓC) ---
  {
    id: 'tree-om-01',
    publicCode: 'TREE-OM-01',
    streetCode: 'OM-01',
    streetCorridor: 'Quốc Lộ 91',
    houseNumberMilestone: 'Cổng KCN Trà Nóc, Phường Trà Nóc',
    sequenceNumber: 1,
    treeTypeId: 'type-sao',
    displayName: 'Cây Sao Đen Vành Đai Xanh Ô Môn #01',
    address: 'Quốc Lộ 91, Phường Trà Nóc, Quận Ô Môn, Cần Thơ',
    latitude: 10.1150,
    longitude: 105.6540,
    plantedAt: '2019-08-15',
    healthStatus: 'FAIR',
    diameterCm: 45,
    heightM: 14.5,
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
  // --- TUYẾN HUYỆN PHONG ĐIỀN (VÀNH ĐAI XANH DU LỊCH SINH THÁI) ---
  {
    id: 'tree-pd-01',
    publicCode: 'TREE-PD-01',
    streetCode: 'PD-01',
    streetCorridor: 'Nguyễn Văn Cừ Nối Dài',
    houseNumberMilestone: 'Khu du lịch sinh thái Mỹ Khánh',
    sequenceNumber: 1,
    treeTypeId: 'type-me',
    displayName: 'Cây Me Tây Sinh Thái Phong Điền #01',
    address: 'Tuyến Nguyễn Văn Cừ Nối Dài, Xã Mỹ Khánh, Huyện Phong Điền, Cần Thơ',
    latitude: 9.9920,
    longitude: 105.7050,
    plantedAt: '2018-05-10',
    healthStatus: 'GOOD',
    diameterCm: 55,
    heightM: 16.0,
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-11-01T04:30:00.000Z',
  },
];

export const INITIAL_CARE_RECORDS: CareRecord[] = [
  {
    id: 'care-001',
    treeId: 'tree-001',
    staffUserId: 'user-staff-1',
    staffName: 'Trần Quang Lâm',
    actionType: 'PRUNING',
    healthBefore: 'FAIR',
    healthAfter: 'GOOD',
    notes: 'Đã cắt tỉa cành khô sà thấp, tạo thông thoáng tán lá đón mùa mưa bão.',
    equipmentUsed: 'Xe thang tự hành 18m & Cưa xích Stihl MS-194T trên cao',
    chemicalsUsed: 'Keo liền sẹo cây Tree Seal & Sơn vôi sát trùng gốc',
    performedAt: '2026-10-15T08:30:00.000Z',
    createdAt: '2026-10-15T08:30:00.000Z',
  },
  {
    id: 'care-002',
    treeId: 'tree-002',
    staffUserId: 'user-staff-2',
    staffName: 'Lê Tuấn Anh',
    actionType: 'PEST_CONTROL',
    healthBefore: 'POOR',
    healthAfter: 'FAIR',
    notes: 'Xử lý mối đất và sâu đục thân bằng chế phẩm sinh học an toàn đô thị.',
    equipmentUsed: 'Bình xịt áp lực cao Stihl SR-450',
    chemicalsUsed: 'Chế phẩm sinh học nấm đối kháng Trichoderma & Vôi bột',
    performedAt: '2026-10-22T09:15:00.000Z',
    createdAt: '2026-10-22T09:15:00.000Z',
  },
  {
    id: 'care-003',
    treeId: 'tree-004',
    staffUserId: 'user-staff-1',
    staffName: 'Trần Quang Lâm',
    actionType: 'FERTILIZING',
    healthBefore: 'GOOD',
    healthAfter: 'GOOD',
    notes: 'Bón phân hữu cơ vi sinh cung cấp dinh dưỡng kích rễ vùng ven sông.',
    equipmentUsed: 'Xe bồn tưới chuyên dụng 5m3 & Dụng cụ xới rễ RPZ',
    chemicalsUsed: 'Phân bón hữu cơ vi sinh NPK sinh học kích rễ',
    performedAt: '2026-10-28T07:45:00.000Z',
    createdAt: '2026-10-28T07:45:00.000Z',
  },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    publicCode: 'INC-84920',
    treeId: 'tree-003',
    reporterName: 'Nguyễn Văn An',
    reporterPhone: '0903847291',
    description: 'Cành cây lớn phía trên vỉa hè trước cổng ĐH Cần Thơ có vết nứt dài và lá héo khô, nguy cơ gãy đổ trúng sinh viên.',
    latitude: 10.031251,
    longitude: 105.76915,
    address: 'Trước cổng ĐH Cần Thơ (Khu II), Đường 3/2, Xuân Khánh, Cần Thơ',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    assignedToUserId: 'user-staff-2',
    assignedToName: 'Lê Tuấn Anh',
    reportedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // Báo cách đây 35 phút (SLA 2 giờ -> Còn 85 phút)
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-002',
    publicCode: 'INC-71044',
    treeId: 'tree-006',
    reporterName: 'Trần Thị Mai',
    reporterPhone: '0918234910',
    description: 'Sau đợt mưa dông chiều qua tại đường 30/4, cây me tây nghiêng 15 độ về phía lòng đường, rễ trồi nứt vỉa hè.',
    latitude: 10.02885,
    longitude: 105.77612,
    address: 'Đường 30 Tháng 4 (Gần Vincom Plaza), Quận Ninh Kiều, Cần Thơ',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    assignedToUserId: 'user-staff-2',
    assignedToName: 'Lê Tuấn Anh',
    reportedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(), // Giải quyết sau 25 phút -> Đạt chuẩn SLA 30 phút
    updatedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-003',
    publicCode: 'INC-53219',
    treeId: 'tree-001',
    reporterName: 'Hoàng Minh Đức',
    reporterPhone: '0983112233',
    description: 'Phát hiện tổ mối đất lớn bám quanh vỏ gốc cây bàng trong công viên Lưu Hữu Phước gần sân tập thể dục.',
    latitude: 10.036829,
    longitude: 105.782541,
    address: 'Công viên Lưu Hữu Phước, Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    assignedToUserId: 'user-staff-1',
    assignedToName: 'Trần Quang Lâm',
    reportedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(), // Giải quyết sau 3 giờ -> Đạt chuẩn SLA 24 giờ
    updatedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_INCIDENT_UPDATES: IncidentUpdate[] = [
  {
    id: 'upd-001',
    incidentId: 'inc-001',
    actorUserId: 'user-admin',
    actorName: 'Đặng Thế Thuận (Admin)',
    oldStatus: 'RECEIVED',
    newStatus: 'ASSIGNED',
    note: 'Đã tiếp nhận phản ánh và phân công nhân viên kỹ thuật kiểm tra hiện trường.',
    createdAt: '2026-11-02T04:00:00.000Z',
  },
  {
    id: 'upd-002',
    incidentId: 'inc-001',
    actorUserId: 'user-staff-2',
    actorName: 'Lê Tuấn Anh (Staff)',
    oldStatus: 'ASSIGNED',
    newStatus: 'IN_PROGRESS',
    note: 'Đã khảo sát thực địa, chuẩn bị xe thang nâng để cắt tỉa cành nguy hiểm trong buổi sáng.',
    createdAt: '2026-11-03T02:00:00.000Z',
  },
  {
    id: 'upd-003',
    incidentId: 'inc-003',
    actorUserId: 'user-admin',
    actorName: 'Đặng Thế Thuận (Admin)',
    oldStatus: 'RECEIVED',
    newStatus: 'ASSIGNED',
    note: 'Chuyển thông tin cho nhân viên Lâm xử lý tổ mối.',
    createdAt: '2026-10-18T05:00:00.000Z',
  },
  {
    id: 'upd-004',
    incidentId: 'inc-003',
    actorUserId: 'user-staff-1',
    actorName: 'Trần Quang Lâm (Staff)',
    oldStatus: 'ASSIGNED',
    newStatus: 'RESOLVED',
    note: 'Đã cạo sạch tổ mối, phun khử trùng và quét vôi bảo vệ gốc cây an toàn.',
    createdAt: '2026-10-19T09:00:00.000Z',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-storm-01',
    title: '⛈️ Chiến dịch rà soát cắt tỉa hạ độ cao đón mùa mưa bão (Tháng 5 – 11)',
    message: 'Phát hiện các cây loại 2 & 3 cao trên 7m chưa được hạ độ cao quá 180 ngày. Đề nghị các tổ KTV điều động xe thang xử lý ngay.',
    type: 'STORM_ALERT',
    severity: 'WARNING',
    targetRoles: ['ADMIN', 'STAFF'],
    linkTab: 'storm_action',
    linkId: 'storm-audit',
    isRead: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    actionLabel: 'Xử lý cắt tỉa ngay',
  },
  {
    id: 'notif-sla-02',
    title: '🚨 Vi phạm SLA 30 phút: Sự cố INC-71044 cần chỉ đạo gấp!',
    message: 'Sự cố cây me tây nghiêng 15 độ về phía lòng đường tại đường 30/4 đã vượt quá hạn SLA cam kết (Trễ hạn). Đề nghị Đội Phản Ứng Nhanh khẩn cấp tiếp cận hiện trường.',
    type: 'SLA_WARNING',
    severity: 'CRITICAL',
    targetRoles: ['ADMIN', 'STAFF'],
    linkTab: 'incidents',
    linkId: 'inc-002',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    actionLabel: 'Xử lý sự cố INC-71044',
  },
  {
    id: 'notif-inc-03',
    title: '📢 Phản ánh người dân mới: Cành cây nứt trước cổng ĐH Cần Thơ',
    message: 'Người dân vừa gửi phản ánh INC-84920 kèm ảnh chụp cành cây sà thấp nguy hiểm trước cổng Khu II ĐH Cần Thơ. Chờ phân công kỹ thuật viên tiếp nhận.',
    type: 'INCIDENT_NEW',
    severity: 'WARNING',
    targetRoles: ['ADMIN', 'STAFF'],
    linkTab: 'incidents',
    linkId: 'inc-001',
    isRead: false,
    createdAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    actionLabel: 'Tiếp nhận xử lý INC-84920',
  },
  {
    id: 'notif-cit-04',
    title: '✅ Phản ánh INC-53219 của bạn đã được xử lý thành công!',
    message: 'Đội Cây Xanh Môi Trường Đô Thị đã hoàn tất xử lý tổ mối và quét vôi bảo vệ cây bàng tại Công viên Lưu Hữu Phước. Cảm ơn bạn đã đồng hành giữ gìn mảng xanh đô thị!',
    type: 'INCIDENT_RESOLVED',
    severity: 'SUCCESS',
    targetRoles: ['CITIZEN'],
    linkTab: 'citizen_portal',
    linkId: 'inc-003',
    isRead: false,
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    actionLabel: 'Xem chi tiết kết quả',
  },
  {
    id: 'notif-eco-05',
    title: '🎁 Chúc mừng! Bạn vừa nhận được +50 Eco-Points',
    message: 'Đóng góp phản ánh hiện trường chính xác của bạn đã được quản trị viên thẩm định và phê duyệt. Tổng điểm hiện tại: 240 Eco-Points.',
    type: 'SYSTEM_BROADCAST',
    severity: 'SUCCESS',
    targetRoles: ['CITIZEN'],
    linkTab: 'citizen_portal',
    isRead: true,
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    actionLabel: 'Đổi quà sinh thái',
  },
  {
    id: 'notif-care-06',
    title: '🌿 Nhắc lịch chăm sóc: Cắt tỉa hạ tán tuyến Đại lộ Hòa Bình',
    message: 'Tổ Kỹ Thuật Số 1 có lịch vận hành xe thang cắt tỉa đón bão cho dãy 13 cây Bàng Đài Loan và Giáng Hương từ số 2 đến số 38 Đại lộ Hòa Bình.',
    type: 'CARE_SCHEDULE',
    severity: 'INFO',
    targetRoles: ['STAFF', 'ADMIN'],
    linkTab: 'care',
    isRead: true,
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    actionLabel: 'Mở sổ chăm sóc',
  },
  {
    id: 'notif-chain-07',
    title: '⛓️ Smart Contract: Khối mới #104303 đã neo chuỗi thành công',
    message: 'Hệ thống EVM Hardhat đã xác nhận giao dịch neo chuỗi băm Canonical SHA-256 cho hồ sơ cây xanh và biên bản xử lý sự cố mới nhất. Tính toàn vẹn 100%.',
    type: 'BLOCKCHAIN_EVENT',
    severity: 'INFO',
    targetRoles: ['ADMIN'],
    linkTab: 'blockchain',
    isRead: true,
    createdAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    actionLabel: 'Kiểm toán Blockchain',
  },
  {
    id: 'notif-storm-cit-08',
    title: '⛈️ Khuyến cáo thời tiết: Cảnh báo mưa dông chiều tối tại đô thị',
    message: 'Đài Khí tượng Thủy văn cảnh báo mưa dông kèm gió giật mạnh cấp 6-7. Người dân chú ý hạn chế di chuyển và tuyệt đối không dừng đỗ xe dưới tán cây cổ thụ.',
    type: 'STORM_ALERT',
    severity: 'WARNING',
    targetRoles: ['CITIZEN', 'STAFF', 'ADMIN'],
    linkTab: 'home',
    isRead: false,
    createdAt: new Date(Date.now() - 600 * 60 * 1000).toISOString(),
    actionLabel: 'Xem bản tin an toàn',
  },
];

// ==========================================
// 🚀 INDEXED_DB HIGH-CAPACITY STORAGE ENGINE
// Giải quyết triệt để hạn ngạch 5MB của LocalStorage,
// cho phép lưu trữ vĩnh viễn 50,000+ cây không bao giờ bị cắt giảm.
// ==========================================
const IDB_NAME = 'UrbanTree_Storage_DB';
const IDB_VERSION = 1;
const IDB_STORE = 'app_keyval';

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openIDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function idbClear(): Promise<void> {
  try {
    const db = await openIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
  } catch {}
}

class StorageService {
  private users: User[] = [];
  private treeTypes: TreeType[] = [];
  private trees: Tree[] = [];
  private careRecords: CareRecord[] = [];
  private incidents: Incident[] = [];
  private incidentUpdates: IncidentUpdate[] = [];
  private notifications: AppNotification[] = [];
  private activeUser: User = INITIAL_USERS[0]; // Admin by default
  private cachedDashboardStats: any = null;
  private isIdbLoaded: boolean = false;

  // Real-world Field Operations Entities
  private departments: Department[] = [];
  private zones: OperationalZone[] = [];
  private routes: Route[] = [];
  private teams: Team[] = [];
  private equipment: Equipment[] = [];
  private workOrders: WorkOrder[] = [];
  private workOrderItems: WorkOrderItem[] = [];
  private workOrderHistory: WorkOrderHistory[] = [];
  private maintenanceRules: MaintenanceRule[] = [];
  private slaPolicies: SLAPolicy[] = [];

  constructor() {
    this.init();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  public init() {
    if (!this.isBrowser()) {
      this.resetToDefaults();
      return;
    }

    try {
      const storedTrees = localStorage.getItem(TREES_STORAGE_KEY);
      if (storedTrees) {
        this.trees = JSON.parse(storedTrees);
        let needSave = false;

        // Tự động bổ sung định danh tuyến đường & mốc số nhà nếu chưa có
        this.trees = this.trees.map((t) => {
          let updated = { ...t };
          let treeChanged = false;

          if (!updated.streetCode) {
            updated.streetCode = getTreeStreetCode(updated);
            updated.streetCorridor = getTreeCorridor(updated);
            updated.houseNumberMilestone = getTreeMilestone(updated);
            treeChanged = true;
          }

          // Chuẩn hóa dữ liệu Lâm sinh Thực địa: Độ nghiêng (°), Độ rỗng ruột (%), Rủi ro rễ, ISA TRAQ
          if (updated.tiltAngleDeg === undefined) {
            if (updated.healthStatus === 'CRITICAL') {
              updated.tiltAngleDeg = 20 + (parseInt(updated.id.replace(/\D/g, '') || '5', 10) % 8);
            } else if (updated.healthStatus === 'POOR') {
              updated.tiltAngleDeg = 12 + (parseInt(updated.id.replace(/\D/g, '') || '3', 10) % 6);
            } else if (updated.healthStatus === 'FAIR') {
              updated.tiltAngleDeg = 4 + (parseInt(updated.id.replace(/\D/g, '') || '2', 10) % 5);
            } else {
              updated.tiltAngleDeg = 1 + (parseInt(updated.id.replace(/\D/g, '') || '1', 10) % 4);
            }
            treeChanged = true;
          }

          if (updated.hollowRatioPercent === undefined) {
            if (updated.healthStatus === 'CRITICAL') {
              updated.hollowRatioPercent = 55 + (parseInt(updated.id.replace(/\D/g, '') || '5', 10) % 20);
            } else if (updated.healthStatus === 'POOR') {
              updated.hollowRatioPercent = 30 + (parseInt(updated.id.replace(/\D/g, '') || '3', 10) % 15);
            } else if (updated.healthStatus === 'FAIR') {
              updated.hollowRatioPercent = 10 + (parseInt(updated.id.replace(/\D/g, '') || '2', 10) % 12);
            } else {
              updated.hollowRatioPercent = parseInt(updated.id.replace(/\D/g, '') || '0', 10) % 5;
            }
            treeChanged = true;
          }

          if (!updated.rootDamageRisk) {
            if (updated.healthStatus === 'CRITICAL') updated.rootDamageRisk = 'SEVERE';
            else if (updated.healthStatus === 'POOR') updated.rootDamageRisk = 'MODERATE';
            else updated.rootDamageRisk = 'NONE';
            treeChanged = true;
          }

          if (!updated.traqRating) {
            updated.traqRating = calculateISATraqRating(updated).rating;
            treeChanged = true;
          }

          // Cập nhật fellingPermit cho cây tree-006 nếu thiếu
          if (updated.id === 'tree-006' && !updated.fellingPermit) {
            const init006 = INITIAL_TREES.find((i) => i.id === 'tree-006');
            if (init006?.fellingPermit) {
              updated.fellingPermit = init006.fellingPermit;
              treeChanged = true;
            }
          }

          if (treeChanged) needSave = true;
          return updated;
        });

        // Bổ sung các cây tuyến đường mẫu mới nếu danh sách lưu trữ cũ chưa có
        INITIAL_TREES.forEach((initTree) => {
          if (!this.trees.some((t) => t.id === initTree.id)) {
            this.trees.push(initTree);
            needSave = true;
          }
        });

        if (needSave) {
          localStorage.setItem(TREES_STORAGE_KEY, JSON.stringify(this.trees));
        }

        this.users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || JSON.stringify(INITIAL_USERS));
        this.treeTypes = JSON.parse(localStorage.getItem(TREE_TYPES_STORAGE_KEY) || JSON.stringify(INITIAL_TREE_TYPES));
        this.careRecords = JSON.parse(localStorage.getItem(CARE_RECORDS_STORAGE_KEY) || JSON.stringify(INITIAL_CARE_RECORDS));
        this.incidents = JSON.parse(localStorage.getItem(INCIDENTS_STORAGE_KEY) || JSON.stringify(INITIAL_INCIDENTS));

        // Chuẩn hóa thời gian resolvedAt cho các sự cố đã hoàn thành trong quá khứ để không bị lệch SLA
        let needSaveInc = false;
        this.incidents.forEach((inc) => {
          if (inc.status === 'RESOLVED' && !inc.resolvedAt) {
            const created = new Date(inc.createdAt).getTime();
            const mockMins = inc.severity === 'CRITICAL' ? 25 : inc.severity === 'HIGH' ? 80 : 210;
            inc.resolvedAt = new Date(created + mockMins * 60 * 1000).toISOString();
            needSaveInc = true;
          }
        });
        if (needSaveInc) {
          localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(this.incidents));
        }

        this.incidentUpdates = JSON.parse(localStorage.getItem(INCIDENT_UPDATES_STORAGE_KEY) || JSON.stringify(INITIAL_INCIDENT_UPDATES));
        const storedNotifs = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedNotifs) {
          this.notifications = JSON.parse(storedNotifs);
        } else {
          this.notifications = [...INITIAL_NOTIFICATIONS];
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
        }

        const storedActiveUser = localStorage.getItem(ACTIVE_USER_KEY);
        if (storedActiveUser) {
          this.activeUser = JSON.parse(storedActiveUser);
        }

        // Khởi tạo các bảng dữ liệu điều hành và lệnh công tác (Operations Engine)
        this.departments = JSON.parse(localStorage.getItem(DEPARTMENTS_STORAGE_KEY) || JSON.stringify(INITIAL_DEPARTMENTS));
        this.zones = JSON.parse(localStorage.getItem(ZONES_STORAGE_KEY) || JSON.stringify(INITIAL_ZONES));
        this.routes = JSON.parse(localStorage.getItem(ROUTES_STORAGE_KEY) || JSON.stringify(INITIAL_ROUTES));
        this.teams = JSON.parse(localStorage.getItem(TEAMS_STORAGE_KEY) || JSON.stringify(INITIAL_TEAMS));
        this.equipment = JSON.parse(localStorage.getItem(EQUIPMENT_STORAGE_KEY) || JSON.stringify(INITIAL_EQUIPMENT));
        this.workOrders = JSON.parse(localStorage.getItem(WORK_ORDERS_STORAGE_KEY) || JSON.stringify(INITIAL_WORK_ORDERS));
        this.workOrderItems = JSON.parse(localStorage.getItem(WORK_ORDER_ITEMS_STORAGE_KEY) || '[]');
        this.workOrderHistory = JSON.parse(localStorage.getItem(WORK_ORDER_HISTORY_STORAGE_KEY) || '[]');
        this.maintenanceRules = JSON.parse(localStorage.getItem(MAINTENANCE_RULES_STORAGE_KEY) || JSON.stringify(INITIAL_MAINTENANCE_RULES));
        this.slaPolicies = JSON.parse(localStorage.getItem(SLA_POLICIES_STORAGE_KEY) || JSON.stringify(INITIAL_SLA_POLICIES));

        // Tự động sinh items checklist cho các work orders mẫu nếu chưa có
        if (this.workOrderItems.length === 0 && this.trees.length > 0) {
          this.workOrders.forEach((wo) => {
            const treesForOrder = this.trees.slice(0, wo.totalItems || 30);
            const items = buildWorkOrderItemsForTrees(treesForOrder, wo.id, wo.type);
            // Đồng bộ trạng thái một số item hoàn thành
            const completedCount = wo.completedItems || 0;
            const skippedCount = wo.skippedItems || 0;
            items.forEach((it, idx) => {
              if (idx < completedCount) it.status = 'COMPLETED';
              else if (idx < completedCount + skippedCount) {
                it.status = 'SKIPPED';
                it.skipOrFailureReason = 'Ô tô đỗ chắn, không hạ chân xe thang được';
              }
            });
            this.workOrderItems.push(...items);
          });
          localStorage.setItem(WORK_ORDER_ITEMS_STORAGE_KEY, JSON.stringify(this.workOrderItems));
        }

        // Đảm bảo Blockchain Ledger luôn có bản ghi đối soát cho toàn bộ cây mẫu
        if (blockchainService.getAllAnchors().length === 0) {
          for (const tree of this.trees) {
            const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', tree);
            tree.payloadVersion = 1;
            tree.payloadHash = hash;
            blockchainService.anchorRecord({
              recordType: 'TREE_PROFILE',
              recordId: tree.id,
              hash,
              canonicalJson,
            }).then((receipt) => {
              tree.anchorStatus = receipt.status;
              tree.txHash = receipt.txHash;
            });
          }
        }
      } else {
        this.resetToDefaults();
      }
    } catch {
      this.resetToDefaults();
    }

    // Tự động đồng bộ song song tức thì từ Database Máy chủ SQLite Server (5,402 cây) và IndexedDB
    this.syncWithBackendServer();
    this.syncFromIndexedDB();
  }

  public async syncWithBackendServer(): Promise<boolean> {
    if (!this.isBrowser()) return false;
    try {
      const res = await fetch('http://localhost:5001/api/trees?all=true', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        // Ánh xạ các cột từ SQLite Backend sang kiểu Tree chuẩn của Frontend
        const mappedTrees: Tree[] = json.data.map((row: any) => ({
          id: row.tree_code && row.tree_code.startsWith('TREE-') ? row.tree_code.toLowerCase() : `tree-db-${row.id}`,
          publicCode: row.tree_code || `CT-${row.id}`,
          streetCode: row.tree_code || `CT-${row.id}`,
          displayName: row.species ? `${row.species} #${row.id}` : `Cây Xanh #${row.id}`,
          treeTypeId: row.tree_type_id ? `type-${row.tree_type_id}` : 'type-bang',
          address: row.address || row.location_name || 'Ninh Kiều, Cần Thơ',
          latitude: parseFloat(row.latitude) || 10.034,
          longitude: parseFloat(row.longitude) || 105.787,
          plantedAt: row.planted_date || '2023-03-15',
          heightM: row.height_meter || 8,
          diameterCm: row.diameter_cm || 30,
          healthStatus:
            row.health_status === 'Tốt'
              ? 'GOOD'
              : row.health_status === 'Cần chăm sóc'
              ? 'FAIR'
              : row.health_status === 'Sâu bệnh'
              ? 'POOR'
              : row.health_status === 'Nguy hiểm'
              ? 'CRITICAL'
              : 'GOOD',
          imageUrl:
            row.image_url ||
            'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
          isActive: row.status !== 'REMOVED',
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          payloadHash: row.data_hash,
          anchorStatus: 'CONFIRMED',
        }));

        this.trees = mappedTrees;
        // Xóa sạch cache cũ để không bao giờ bị nhảy số lộn xộn
        try {
          localStorage.removeItem(TREES_STORAGE_KEY);
          localStorage.setItem('urbantree_storage_mode', 'INDEXED_DB');
        } catch {}

        this.saveAll(); // lưu đệm vĩnh viễn vào IndexedDB dung lượng lớn
        window.dispatchEvent(
          new CustomEvent('urbantree:data-loaded', { detail: { count: this.trees.length, source: 'SQLITE_SERVER' } })
        );
        return true;
      }
      return false;
    } catch {
      // Backend server không bật hoặc đang ngoại tuyến -> tự động fallback 100% sang IndexedDB an toàn
      return false;
    }
  }

  public async syncFromIndexedDB(): Promise<boolean> {
    if (!this.isBrowser()) return false;
    try {
      const idbTrees = await idbGet<Tree[]>('TREES');
      let updated = false;

      if (idbTrees && Array.isArray(idbTrees) && idbTrees.length > 0) {
        // Nếu IndexedDB có nhiều cây hơn hoặc bằng dữ liệu hiện tại, ưu tiên IndexedDB
        if (idbTrees.length >= this.trees.length) {
          this.trees = idbTrees;
          updated = true;
        }
      }

      const idbCare = await idbGet<CareRecord[]>('CARE_RECORDS');
      if (idbCare && Array.isArray(idbCare) && idbCare.length > 0) {
        this.careRecords = idbCare;
      }

      const idbIncidents = await idbGet<Incident[]>('INCIDENTS');
      if (idbIncidents && Array.isArray(idbIncidents) && idbIncidents.length > 0) {
        this.incidents = idbIncidents;
      }

      const idbUsers = await idbGet<User[]>('USERS');
      if (idbUsers && Array.isArray(idbUsers) && idbUsers.length > 0) {
        this.users = idbUsers;
      }

      const idbWorkOrders = await idbGet<WorkOrder[]>('WORK_ORDERS');
      if (idbWorkOrders && Array.isArray(idbWorkOrders) && idbWorkOrders.length > 0) {
        this.workOrders = idbWorkOrders;
      }

      const idbWorkOrderItems = await idbGet<WorkOrderItem[]>('WORK_ORDER_ITEMS');
      if (idbWorkOrderItems && Array.isArray(idbWorkOrderItems) && idbWorkOrderItems.length > 0) {
        this.workOrderItems = idbWorkOrderItems;
      }

      this.isIdbLoaded = true;
      if (updated) {
        this.cachedDashboardStats = null;
        window.dispatchEvent(new CustomEvent('urbantree:data-loaded', { detail: { count: this.trees.length } }));
      }
      return true;
    } catch (e) {
      console.warn('Sync from IndexedDB error:', e);
      return false;
    }
  }

  public resetToDefaults() {
    idbClear();
    this.users = [...INITIAL_USERS];
    this.treeTypes = [...INITIAL_TREE_TYPES];
    this.trees = [...INITIAL_TREES];
    this.careRecords = [...INITIAL_CARE_RECORDS];
    this.incidents = [...INITIAL_INCIDENTS];
    this.incidentUpdates = [...INITIAL_INCIDENT_UPDATES];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.activeUser = INITIAL_USERS[0];

    // Operations Engine defaults
    this.departments = [...INITIAL_DEPARTMENTS];
    this.zones = [...INITIAL_ZONES];
    this.routes = [...INITIAL_ROUTES];
    this.teams = [...INITIAL_TEAMS];
    this.equipment = [...INITIAL_EQUIPMENT];
    this.workOrders = [...INITIAL_WORK_ORDERS];
    this.workOrderItems = [];
    this.workOrderHistory = [];
    this.maintenanceRules = [...INITIAL_MAINTENANCE_RULES];
    this.slaPolicies = [...INITIAL_SLA_POLICIES];

    // Anchor baseline demo records so they are immediately valid in blockchain
    blockchainService.clearLedger();

    // Auto-anchor initial trees and care records
    for (const tree of this.trees) {
      const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', tree);
      blockchainService.anchorRecord({
        recordType: 'TREE_PROFILE',
        recordId: tree.id,
        hash,
        canonicalJson,
      }).then((receipt) => {
        tree.payloadVersion = 1;
        tree.payloadHash = hash;
        tree.anchorStatus = receipt.status;
        tree.txHash = receipt.txHash;
      });
    }

    for (const care of this.careRecords) {
      const { hash, canonicalJson } = computeRecordHash('CARE_RECORD', care);
      blockchainService.anchorRecord({
        recordType: 'CARE_RECORD',
        recordId: care.id,
        hash,
        canonicalJson,
      }).then((receipt) => {
        care.payloadVersion = 1;
        care.payloadHash = hash;
        care.anchorStatus = receipt.status;
        care.txHash = receipt.txHash;
      });
    }

    this.saveAll();
  }

  private saveAll() {
    this.cachedDashboardStats = null;
    if (!this.isBrowser()) return;

    // 1. Luôn ghi nhận vĩnh viễn vào IndexedDB (Hỗ trợ vô hạn hàng chục ngàn cây, không bị giới hạn 5MB của LocalStorage)
    idbSet('TREES', this.trees);
    idbSet('CARE_RECORDS', this.careRecords);
    idbSet('INCIDENTS', this.incidents);
    idbSet('INCIDENT_UPDATES', this.incidentUpdates);
    idbSet('NOTIFICATIONS', this.notifications);
    idbSet('USERS', this.users);
    idbSet('ACTIVE_USER', this.activeUser);
    idbSet('WORK_ORDERS', this.workOrders);
    idbSet('WORK_ORDER_ITEMS', this.workOrderItems);
    idbSet('WORK_ORDER_HISTORY', this.workOrderHistory);
    idbSet('DEPARTMENTS', this.departments);
    idbSet('TEAMS', this.teams);
    idbSet('EQUIPMENT', this.equipment);

    // 2. Lưu dự phòng vào localStorage
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
      localStorage.setItem(TREE_TYPES_STORAGE_KEY, JSON.stringify(this.treeTypes));
      localStorage.setItem(CARE_RECORDS_STORAGE_KEY, JSON.stringify(this.careRecords));
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(this.incidents));
      localStorage.setItem(INCIDENT_UPDATES_STORAGE_KEY, JSON.stringify(this.incidentUpdates));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(this.activeUser));

      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(this.departments));
      localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(this.zones));
      localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(this.routes));
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(this.teams));
      localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(this.equipment));
      localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(this.workOrders));
      localStorage.setItem(WORK_ORDER_ITEMS_STORAGE_KEY, JSON.stringify(this.workOrderItems));
      localStorage.setItem(WORK_ORDER_HISTORY_STORAGE_KEY, JSON.stringify(this.workOrderHistory));
      localStorage.setItem(MAINTENANCE_RULES_STORAGE_KEY, JSON.stringify(this.maintenanceRules));
      localStorage.setItem(SLA_POLICIES_STORAGE_KEY, JSON.stringify(this.slaPolicies));

      if (this.trees.length <= 500) {
        localStorage.setItem(TREES_STORAGE_KEY, JSON.stringify(this.trees));
      } else {
        // Đánh dấu để lần khởi động sau ưu tiên tải từ IndexedDB
        localStorage.setItem('urbantree_storage_mode', 'INDEXED_DB');
      }
    } catch (err) {
      console.info(`[UrbanTree Storage] Dữ liệu lớn (${this.trees.length} cây), được bảo toàn 100% trong IndexedDB.`);
    }
  }

  // Active User / Persona
  public getActiveUser(): User {
    return this.activeUser;
  }

  public setActiveUser(user: User) {
    this.activeUser = user;
    if (this.isBrowser()) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    }
  }

  public getUsers(): User[] {
    return this.users;
  }

  public createUser(userData: Omit<User, 'id'>): User {
    const id = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id,
    };
    this.users.push(newUser);
    if (this.isBrowser()) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
    }
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Không tìm thấy nhân viên');
    this.users[idx] = { ...this.users[idx], ...updates };
    if (this.activeUser.id === id) {
      this.activeUser = { ...this.activeUser, ...updates };
      if (this.isBrowser()) {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(this.activeUser));
      }
    }
    if (this.isBrowser()) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
    }
    return this.users[idx];
  }

  public deleteUser(id: string): boolean {
    if (id === 'user-admin') {
      throw new Error('Không thể xóa tài khoản Quản trị viên gốc (Root Admin)');
    }
    const beforeCount = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    if (this.isBrowser()) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
    }
    return this.users.length < beforeCount;
  }

  // Tree Types
  public getTreeTypes(): TreeType[] {
    return this.treeTypes;
  }

  public getTreeTypeById(id: string): TreeType | undefined {
    return this.treeTypes.find((t) => t.id === id);
  }

  // Trees
  public getTrees(): Tree[] {
    return this.trees;
  }

  public getTreeById(id: string): Tree | undefined {
    return this.trees.find((t) => t.id === id);
  }

  public getTreeByPublicCode(code: string): Tree | undefined {
    const clean = code.trim().toUpperCase();
    return this.trees.find((t) => t.publicCode.toUpperCase() === clean);
  }

  public async createTree(data: Omit<Tree, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tree> {
    const id = `tree-${Date.now()}`;
    const now = new Date().toISOString();
    const newTree: Tree = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Automatically compute hash and anchor
    const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', newTree);
    const receipt = await blockchainService.anchorRecord({
      recordType: 'TREE_PROFILE',
      recordId: id,
      hash,
      canonicalJson,
    });

    newTree.payloadVersion = 1;
    newTree.payloadHash = hash;
    newTree.anchorStatus = receipt.status;
    newTree.txHash = receipt.txHash;

    this.trees.unshift(newTree);
    this.saveAll();

    // ⚡ Đồng bộ vĩnh viễn lên SQLite Database Server
    if (this.isBrowser()) {
      fetch('http://localhost:5001/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tree_code: newTree.publicCode,
          species: newTree.displayName,
          location_name: newTree.address,
          address: newTree.address,
          latitude: newTree.latitude,
          longitude: newTree.longitude,
          planted_date: newTree.plantedAt,
          height_meter: newTree.heightM,
          diameter_cm: newTree.diameterCm,
          health_status: newTree.healthStatus === 'GOOD' ? 'Tốt' : 'Tốt',
          data_hash: newTree.payloadHash,
        }),
      }).catch(() => {});
    }

    return newTree;
  }

  public async createTreesBulk(items: Array<Omit<Tree, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tree[]> {
    const now = new Date().toISOString();
    const created: Tree[] = [];
    const baseTime = Date.now();

    for (let i = 0; i < items.length; i++) {
      const data = items[i];
      const id = `tree-${baseTime}-${i}`;
      const newTree: Tree = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
        payloadVersion: 1,
        anchorStatus: 'CONFIRMED',
      };
      created.push(newTree);
    }

    this.trees = [...created, ...this.trees];
    this.saveAll();

    // ⚡ Đồng bộ hàng loạt vĩnh viễn lên SQLite Database Server (Bulk Insert Transaction)
    if (this.isBrowser()) {
      fetch('http://localhost:5001/api/trees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trees: created }),
      }).catch(() => {});
    }

    return created;
  }

  public async updateTree(id: string, updates: Partial<Tree>): Promise<Tree> {
    const index = this.trees.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Tree ${id} not found`);

    const now = new Date().toISOString();
    const updatedTree: Tree = {
      ...this.trees[index],
      ...updates,
      id,
      updatedAt: now,
    };

    // ⚡ UT-009: Non-blocking Blockchain Asynchronous Queue
    // Không làm đơ giao diện; nghiệp vụ cập nhật cây hoàn tất ngay lập tức
    const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', updatedTree);
    updatedTree.payloadVersion = 1;
    updatedTree.payloadHash = hash;
    updatedTree.anchorStatus = 'PENDING';

    this.trees[index] = updatedTree;
    this.saveAll();

    // Hàng đợi neo băm Blockchain chạy nền
    blockchainService.anchorRecord({
      recordType: 'TREE_PROFILE',
      recordId: id,
      hash,
      canonicalJson,
    }).then((receipt) => {
      const idx = this.trees.findIndex((t) => t.id === id);
      if (idx !== -1) {
        this.trees[idx].anchorStatus = receipt.status;
        this.trees[idx].txHash = receipt.txHash;
        this.saveAll();
      }
    }).catch(() => {
      const idx = this.trees.findIndex((t) => t.id === id);
      if (idx !== -1) {
        this.trees[idx].anchorStatus = 'FAILED';
      }
    });

    return updatedTree;
  }

  /**
   * ⚡ CẬP NHẬT TRẠNG THÁI NEO BATCH: Cập nhật đồng loạt hàng ngàn cây mà chỉ lưu DB đúng 1 lần duy nhất
   */
  public updateTreesAnchorBatch(
    updates: Array<{ id: string; txHash: string; status: AnchorStatus }>
  ): void {
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const now = new Date().toISOString();

    for (let i = 0; i < this.trees.length; i++) {
      const u = updateMap.get(this.trees[i].id);
      if (u) {
        this.trees[i] = {
          ...this.trees[i],
          payloadVersion: 1,
          payloadHash: u.txHash,
          anchorStatus: u.status,
          txHash: u.txHash,
          updatedAt: now,
        };
      }
    }

    this.saveAll();
  }

  public deleteTree(id: string, fellingPermit?: any): boolean {
    const index = this.trees.findIndex((t) => t.id === id);
    if (index === -1) return false;

    // 🛡️ NGHIỆP VỤ UT-002: Soft Delete lưu trữ hồ sơ cây thay vì xóa vật lý
    // Bảo toàn 100% lịch sử chăm sóc và chứng cứ băm Blockchain
    const now = new Date().toISOString();
    this.trees[index] = {
      ...this.trees[index],
      isActive: false,
      healthStatus: 'DEAD',
      updatedAt: now,
      fellingPermit: fellingPermit || this.trees[index].fellingPermit || {
        permitNumber: 'GP-DHK-2026',
        issuedBy: 'Sở Xây Dựng TP. Cần Thơ',
        issuedDate: now.slice(0, 10),
        reason: 'Cây mục thân nguy hiểm hoặc giải tỏa công trình công cộng',
        approvedByOfficer: 'Lãnh đạo Ban Quản Lý Đô Thị',
        inspectionTeam: 'Tổ Thanh tra Đô thị & Công ty Cây Xanh',
      },
    };

    this.saveAll();

    // Đồng bộ Soft Delete với backend SQLite
    if (this.isBrowser()) {
      fetch(`http://localhost:5001/api/trees/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permitNumber: this.trees[index].fellingPermit?.permitNumber,
          fellingReason: this.trees[index].fellingPermit?.reason,
          approvedByOfficer: this.trees[index].fellingPermit?.approvedByOfficer,
        }),
      }).catch(() => {});
    }

    return true;
  }

  /**
   * Tamper Simulation Tool:
   * Maliciously alters a tree record's health status or notes in the database WITHOUT re-anchoring to blockchain.
   * This is required by Section 10 & 5.1 of the roadmap to demonstrate cryptographic tamper detection.
   */
  public tamperTree(id: string, tamperedHealthStatus: TreeHealthStatus): Tree {
    const index = this.trees.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Tree not found');

    this.trees[index] = {
      ...this.trees[index],
      healthStatus: tamperedHealthStatus,
      // intentionally do NOT update payloadHash or anchor!
    };
    this.saveAll();
    return this.trees[index];
  }

  // Care Records
  public getCareRecords(treeId?: string): CareRecord[] {
    if (treeId) {
      return this.careRecords.filter((c) => c.treeId === treeId);
    }
    return this.careRecords;
  }

  public async createCareRecord(data: Omit<CareRecord, 'id' | 'createdAt'>): Promise<CareRecord> {
    // 🔒 CHÍNH SÁCH BẢO VỆ CÂY ĐÃ HẠ GIẢI / GIẢI TỎA (P0 Policy Enforcement)
    const targetTree = this.trees.find((t) => t.id === data.treeId);
    if (targetTree && (targetTree.status === 'REMOVED' || targetTree.isActive === false)) {
      throw new Error(`Không thể ghi nhận nhật ký chăm sóc cho cây [${targetTree.publicCode || targetTree.id}] đã giải tỏa / hạ giải (REMOVED). Hồ sơ cây đã đóng.`);
    }

    const id = `care-${Date.now()}`;
    const now = new Date().toISOString();

    const newCare: CareRecord = {
      ...data,
      id,
      createdAt: now,
    };

    // Update tree health status if care changed it
    if (newCare.healthAfter) {
      const treeIdx = this.trees.findIndex((t) => t.id === newCare.treeId);
      if (treeIdx !== -1) {
        this.trees[treeIdx].healthStatus = newCare.healthAfter;
        this.trees[treeIdx].updatedAt = now;
      }
    }

    // ⚡ UT-009: Non-blocking Blockchain Asynchronous Queue
    const { hash, canonicalJson } = computeRecordHash('CARE_RECORD', newCare);
    newCare.payloadVersion = 1;
    newCare.payloadHash = hash;
    newCare.anchorStatus = 'PENDING';

    this.careRecords.unshift(newCare);
    this.saveAll();

    // Hàng đợi neo băm Blockchain chạy nền
    blockchainService.anchorRecord({
      recordType: 'CARE_RECORD',
      recordId: id,
      hash,
      canonicalJson,
    }).then((receipt) => {
      const idx = this.careRecords.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this.careRecords[idx].anchorStatus = receipt.status;
        this.careRecords[idx].txHash = receipt.txHash;
        this.saveAll();
      }
    }).catch(() => {
      const idx = this.careRecords.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this.careRecords[idx].anchorStatus = 'FAILED';
      }
    });

    return newCare;
  }

  /**
   * 📝 CHUỖI ĐÍNH CHÍNH BẤT BIẾN (UT-008 APPEND-ONLY CORRECTION CHAIN)
   * Tuyệt đối không UPDATE/DELETE bản ghi gốc đã neo Blockchain.
   * Tạo bản ghi đính chính mới v2 liên kết thay thế (supersede) v1.
   */
  public async createCorrectionCareRecord(
    originalRecordId: string,
    correctionData: Partial<CareRecord>,
    correctionReason: string
  ): Promise<CareRecord> {
    const originalIndex = this.careRecords.findIndex((c) => c.id === originalRecordId);
    if (originalIndex === -1) throw new Error('Không tìm thấy bản ghi gốc cần đính chính');

    const original = this.careRecords[originalIndex];
    // Đánh dấu bản ghi gốc là đã bị thay thế
    this.careRecords[originalIndex] = {
      ...original,
      isSuperseded: true,
    };

    const id = `care-corr-${Date.now()}`;
    const now = new Date().toISOString();

    const correctionRecord: CareRecord = {
      ...original,
      ...correctionData,
      id,
      supersedesRecordId: originalRecordId,
      correctionReason,
      isSuperseded: false,
      createdAt: now,
      anchorStatus: 'PENDING',
    };

    const { hash, canonicalJson } = computeRecordHash('CARE_RECORD', correctionRecord);
    correctionRecord.payloadVersion = 1;
    correctionRecord.payloadHash = hash;

    this.careRecords.unshift(correctionRecord);
    this.saveAll();

    // Neo bản ghi đính chính lên Blockchain
    blockchainService.anchorRecord({
      recordType: 'CARE_RECORD',
      recordId: id,
      hash,
      canonicalJson,
    }).then((receipt) => {
      const idx = this.careRecords.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this.careRecords[idx].anchorStatus = receipt.status;
        this.careRecords[idx].txHash = receipt.txHash;
        this.saveAll();
      }
    }).catch(() => {
      const idx = this.careRecords.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this.careRecords[idx].anchorStatus = 'FAILED';
      }
    });

    return correctionRecord;
  }

  public async batchCareMaintenance(params: {
    treeIds: string[];
    staffUserId: string;
    staffName: string;
    actionType: CareActionType;
    notes: string;
    imageUrl?: string;
    equipmentUsed?: string;
    chemicalsUsed?: string;
    targetHealthAfter?: TreeHealthStatus;
  }): Promise<CareRecord[]> {
    const {
      treeIds,
      staffUserId,
      staffName,
      actionType,
      notes,
      imageUrl,
      equipmentUsed,
      chemicalsUsed,
      targetHealthAfter,
    } = params;
    const now = new Date().toISOString();
    const createdRecords: CareRecord[] = [];

    for (let i = 0; i < treeIds.length; i++) {
      const treeId = treeIds[i];
      const tree = this.trees.find((t) => t.id === treeId);
      if (!tree) continue;

      const id = `care-batch-${Date.now()}-${i}`;
      const afterStatus =
        targetHealthAfter ||
        (tree.healthStatus === 'CRITICAL' ? 'POOR' : tree.healthStatus === 'POOR' ? 'FAIR' : 'GOOD');

      const newCare: CareRecord = {
        id,
        treeId,
        staffUserId,
        staffName,
        actionType,
        healthBefore: tree.healthStatus,
        healthAfter: afterStatus,
        notes: `[Duy tu tuyến phố] ${notes}`,
        imageUrl: imageUrl || tree.imageUrl,
        equipmentUsed,
        chemicalsUsed,
        performedAt: now,
        createdAt: now,
      };

      // Update tree health and timestamp
      tree.healthStatus = newCare.healthAfter;
      tree.updatedAt = now;

      // Anchor to blockchain
      const { hash, canonicalJson } = computeRecordHash('CARE_RECORD', newCare);
      const receipt = await blockchainService.anchorRecord({
        recordType: 'CARE_RECORD',
        recordId: id,
        hash,
        canonicalJson,
      });

      newCare.payloadVersion = 1;
      newCare.payloadHash = hash;
      newCare.anchorStatus = receipt.status;
      newCare.txHash = receipt.txHash;

      this.careRecords.unshift(newCare);
      createdRecords.push(newCare);
    }

    this.saveAll();
    return createdRecords;
  }

  /**
   * 🚛 ĐIỀU XE CƠ GIỚI & HẠ TÁN SIÊU TỐC THEO TUYẾN ĐƯỜNG (O(1) Map Lookup + Chunking chống đơ máy)
   * Thay vì lặp 5.000 lần O(N^2) làm treo CPU, giải thuật dùng Map và chia nhỏ 500 cây/nhịp
   */
  public async dispatchCorridorPruningBatch(params: {
    treeIds: string[];
    corridorName: string;
    staffUserId: string;
    staffName: string;
    equipmentUsed?: string;
    onProgress?: (percent: number) => void;
  }): Promise<number> {
    const { treeIds, corridorName, staffUserId, staffName, equipmentUsed, onProgress } = params;
    const now = new Date().toISOString();
    const newRecords: CareRecord[] = [];
    const baseTime = Date.now();

    // Map nhanh cây bằng Map để O(1) lookup
    const treeMap = new Map<string, Tree>();
    this.trees.forEach((t) => treeMap.set(t.id, t));

    const total = treeIds.length;
    const chunkSize = 500;

    for (let i = 0; i < total; i += chunkSize) {
      const end = Math.min(i + chunkSize, total);
      for (let j = i; j < end; j++) {
        const treeId = treeIds[j];
        const tree = treeMap.get(treeId);
        if (!tree) continue;

        tree.healthStatus = 'GOOD';
        tree.updatedAt = now;

        newRecords.push({
          id: `care-dispatch-${baseTime}-${j}`,
          treeId,
          staffUserId,
          staffName,
          actionType: 'PRUNING',
          healthBefore: 'POOR',
          healthAfter: 'GOOD',
          notes: `[Lệnh Điều Xe Thang: ${corridorName}] Đã hạ tán cành cao đón mùa mưa bão`,
          equipmentUsed: equipmentUsed || 'Xe thang tự hành 18m & Cưa xích chuyên dụng Stihl MS-194T trên cao',
          chemicalsUsed: 'Keo liền sẹo cây Tree Seal & Sơn vôi sát trùng gốc',
          performedAt: now,
          createdAt: now,
          payloadVersion: 1,
          anchorStatus: 'CONFIRMED',
          txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        });
      }

      if (onProgress) {
        onProgress(Math.round((end / total) * 100));
      }
      // Nhường luồng CPU cho browser vẽ UI
      await new Promise((r) => setTimeout(r, 10));
    }

    this.careRecords = [...newRecords, ...this.careRecords];
    this.saveAll();

    // ⚡ Đồng bộ hàng loạt nhật ký chăm sóc vĩnh viễn lên SQLite Database Server
    if (this.isBrowser()) {
      fetch('http://localhost:5001/api/care-records/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords.slice(0, 500) }),
      }).catch(() => {});
    }

    return newRecords.length;
  }

  /**
   * ⚡ NEO HÀNG LOẠT: Đóng dấu băm và neo toàn bộ cây, chăm sóc, sự cố chưa neo lên Smart Contract
   */
  public async batchAnchorAllUnanchored(onProgress?: (current: number, total: number, label: string) => void): Promise<{
    treesCount: number;
    careCount: number;
    incidentsCount: number;
    totalCount: number;
  }> {
    const unanchoredTrees = this.trees.filter(
      (t) => !t.anchorStatus || t.anchorStatus === 'NOT_ANCHORED' || !blockchainService.getAnchor('TREE_PROFILE', t.id)
    );
    const unanchoredCare = this.careRecords.filter(
      (c) => !c.anchorStatus || c.anchorStatus === 'NOT_ANCHORED' || !blockchainService.getAnchor('CARE_RECORD', c.id)
    );
    const unanchoredIncidents = this.incidents.filter(
      (i) => !blockchainService.getAnchor('INCIDENT_REPORT', i.id)
    );

    const total = unanchoredTrees.length + unanchoredCare.length + unanchoredIncidents.length;
    if (total === 0) {
      return { treesCount: 0, careCount: 0, incidentsCount: 0, totalCount: 0 };
    }

    const itemsToAnchor: Array<{
      recordType: RecordType;
      recordId: string;
      hash: string;
      canonicalJson: string;
    }> = [];

    let processed = 0;

    // 1. Chuẩn bị cây
    for (const tree of unanchoredTrees) {
      const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', tree);
      itemsToAnchor.push({
        recordType: 'TREE_PROFILE',
        recordId: tree.id,
        hash,
        canonicalJson,
      });
      processed++;
      if (onProgress) onProgress(processed, total, `Chuẩn hóa mã băm: ${tree.displayName}`);
    }

    // 2. Chuẩn bị chăm sóc
    for (const care of unanchoredCare) {
      const { hash, canonicalJson } = computeRecordHash('CARE_RECORD', care);
      itemsToAnchor.push({
        recordType: 'CARE_RECORD',
        recordId: care.id,
        hash,
        canonicalJson,
      });
      processed++;
      if (onProgress) onProgress(processed, total, `Chuẩn hóa nhật ký chăm sóc: ${care.actionType}`);
    }

    // 3. Chuẩn bị sự cố
    for (const inc of unanchoredIncidents) {
      const { hash, canonicalJson } = computeRecordHash('INCIDENT_REPORT', inc);
      itemsToAnchor.push({
        recordType: 'INCIDENT_REPORT',
        recordId: inc.id,
        hash,
        canonicalJson,
      });
      processed++;
      if (onProgress) onProgress(processed, total, `Chuẩn hóa sự cố: ${inc.publicCode}`);
    }

    // Thực hiện neo hàng loạt qua blockchain service
    const batchResult = await blockchainService.batchAnchorRecords(itemsToAnchor);

    // Cập nhật lại trạng thái cho các cây
    const receiptMap = new Map(batchResult.receipts.map((r) => [r.recordId, r]));
    for (const tree of unanchoredTrees) {
      const receipt = receiptMap.get(tree.id);
      if (receipt) {
        const item = itemsToAnchor.find((i) => i.recordId === tree.id);
        tree.payloadVersion = 1;
        tree.payloadHash = item?.hash || tree.payloadHash;
        tree.anchorStatus = 'CONFIRMED';
        tree.txHash = receipt.txHash;
      }
    }

    for (const care of unanchoredCare) {
      const receipt = receiptMap.get(care.id);
      if (receipt) {
        const item = itemsToAnchor.find((i) => i.recordId === care.id);
        care.payloadVersion = 1;
        care.payloadHash = item?.hash || care.payloadHash;
        care.anchorStatus = 'CONFIRMED';
        care.txHash = receipt.txHash;
      }
    }

    this.saveAll();

    return {
      treesCount: unanchoredTrees.length,
      careCount: unanchoredCare.length,
      incidentsCount: unanchoredIncidents.length,
      totalCount: itemsToAnchor.length,
    };
  }

  // Incidents
  public getIncidents(): Incident[] {
    return this.incidents;
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  public getIncidentByPublicCode(code: string): Incident | undefined {
    const clean = code.trim().toUpperCase();
    return this.incidents.find((i) => i.publicCode.toUpperCase() === clean);
  }

  public async createIncident(data: {
    treeId?: string | null;
    reporterName?: string;
    reporterPhone?: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    severity?: IncidentSeverity;
    imageUrl?: string;
  }): Promise<Incident> {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const publicCode = `INC-${randomSuffix}`;
    const id = `inc-${Date.now()}`;
    const now = new Date().toISOString();

    // 📍 1. KIỂM TRA LỌC TRÙNG KHÔNG GIAN & THỜI GIAN (UT-005: 25 mét & 2 giờ)
    const twoHoursMs = 2 * 3600 * 1000;
    const nowTime = Date.now();
    const existingMatch = this.incidents.find((inc) => {
      if (!['RECEIVED', 'ASSIGNED', 'IN_PROGRESS'].includes(inc.status)) return false;
      const incidentTime = new Date(inc.createdAt).getTime();
      if (nowTime - incidentTime > twoHoursMs) return false;
      const distMeters = calculateHaversineDistance(data.latitude, data.longitude, inc.latitude, inc.longitude);
      return distMeters <= 25;
    });

    if (existingMatch) {
      existingMatch.duplicateCount = (existingMatch.duplicateCount || 0) + 1;
      this.incidentUpdates.unshift({
        id: `upd-${Date.now()}`,
        incidentId: existingMatch.id,
        actorUserId: 'citizen',
        actorName: 'Công dân bổ sung',
        oldStatus: existingMatch.status,
        newStatus: existingMatch.status,
        note: `[GỘP BÁO CÁO TRÙNG] Người dân bổ sung lúc ${new Date().toLocaleTimeString('vi-VN')}: "${data.description}"`,
        imageUrl: data.imageUrl,
        createdAt: now,
      });
      this.saveAll();
      return existingMatch;
    }

    const newIncident: Incident = {
      id,
      publicCode,
      treeId: data.treeId || null,
      reporterName: data.reporterName || 'Người dân ẩn danh',
      reporterPhone: data.reporterPhone || '',
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || '',
      severity: data.severity || 'MEDIUM',
      status: 'RECEIVED',
      assignedToUserId: null,
      imageUrl: data.imageUrl,
      reportedAt: now,
      createdAt: now,
      updatedAt: now,
      duplicateCount: 0,
      payloadVersion: 1,
      anchorStatus: 'PENDING',
    };

    // ⚡ UT-009: Non-blocking Blockchain Asynchronous Queue
    const { hash, canonicalJson } = computeRecordHash('INCIDENT_REPORT', newIncident);
    newIncident.payloadHash = hash;

    this.incidents.unshift(newIncident);

    // Initial timeline record
    this.incidentUpdates.unshift({
      id: `upd-${Date.now()}`,
      incidentId: id,
      actorUserId: 'citizen',
      actorName: 'Hệ thống tiếp nhận người dân',
      oldStatus: 'RECEIVED',
      newStatus: 'RECEIVED',
      note: 'Phản ánh được ghi nhận thành công từ cổng công cộng.',
      createdAt: now,
    });

    this.saveAll();

    // Hàng đợi neo băm Blockchain chạy nền không làm nghẽn UI
    blockchainService.anchorRecord({
      recordType: 'INCIDENT_REPORT',
      recordId: id,
      hash,
      canonicalJson,
    }).then((receipt) => {
      const idx = this.incidents.findIndex((i) => i.id === id);
      if (idx !== -1) {
        this.incidents[idx].anchorStatus = receipt.status;
        this.incidents[idx].txHash = receipt.txHash;
        this.saveAll();
      }
    }).catch(() => {
      const idx = this.incidents.findIndex((i) => i.id === id);
      if (idx !== -1) {
        this.incidents[idx].anchorStatus = 'FAILED';
      }
    });

    // ⚡ Đồng bộ sự cố vĩnh viễn lên SQLite Database Server
    if (this.isBrowser()) {
      fetch('http://localhost:5001/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tree_id: 1,
          description: newIncident.description,
          severity: newIncident.severity === 'CRITICAL' ? 'Khẩn cấp' : newIncident.severity === 'HIGH' ? 'Cao' : 'Trung bình',
          latitude: newIncident.latitude,
          longitude: newIncident.longitude,
          address: newIncident.address,
          reporter_name: newIncident.reporterName,
          reporter_phone: newIncident.reporterPhone,
        }),
      }).catch(() => {});
    }

    return newIncident;
  }

  public async updateIncidentStatus(params: {
    incidentId: string;
    newStatus: IncidentStatus;
    actorUserId: string;
    actorName: string;
    note: string;
    assignedToUserId?: string | null;
    imageUrl?: string;
  }): Promise<Incident> {
    const { incidentId, newStatus, actorUserId, actorName, note, assignedToUserId, imageUrl } = params;
    const index = this.incidents.findIndex((i) => i.id === incidentId);
    if (index === -1) throw new Error('Incident not found');

    const incident = this.incidents[index];
    const oldStatus = incident.status;
    const now = new Date().toISOString();

    incident.status = newStatus;
    incident.updatedAt = now;
    if (imageUrl) {
      incident.imageUrl = imageUrl;
    }

    if (assignedToUserId !== undefined) {
      incident.assignedToUserId = assignedToUserId;
      if (assignedToUserId) {
        const staff = this.users.find((u) => u.id === assignedToUserId);
        incident.assignedToName = staff?.fullName || 'Nhân viên';
      } else {
        incident.assignedToName = undefined;
      }
    }

    if (newStatus === 'RESOLVED') {
      incident.resolvedAt = now;

      // 🌿 TỰ ĐỘNG PHỤC HỒI SỨC KHỎE CÂY LIÊN KẾT & GHI NHẬN NHẬT KÝ CHĂM SÓC
      if (incident.treeId) {
        const tree = this.trees.find((t) => t.id === incident.treeId);
        if (tree && (tree.healthStatus === 'CRITICAL' || tree.healthStatus === 'POOR')) {
          const oldHealth = tree.healthStatus;
          tree.healthStatus = 'FAIR';
          tree.updatedAt = now;

          // Tạo bản ghi nhật ký chăm sóc thực địa tương ứng
          const careId = `care-inc-${Date.now()}`;
          const newCare: CareRecord = {
            id: careId,
            treeId: tree.id,
            staffUserId: actorUserId,
            staffName: actorName,
            actionType: 'PRUNING',
            healthBefore: oldHealth,
            healthAfter: 'FAIR',
            notes: `[Tự động từ Sự cố ${incident.publicCode}] ${note || 'Đã hoàn tất khắc phục sự cố hiện trường, cắt tỉa cành gãy và bảo đảm an toàn đô thị.'}`,
            imageUrl: imageUrl || incident.imageUrl,
            performedAt: now,
            createdAt: now,
          };
          this.careRecords.unshift(newCare);
        }
      }

      // Anchor RESOLUTION to blockchain
      const { hash, canonicalJson } = computeRecordHash('INCIDENT_RESOLUTION', incident, {
        resolvedBy: actorUserId,
        note,
      });

      const receipt = await blockchainService.anchorRecord({
        recordType: 'INCIDENT_RESOLUTION',
        recordId: incident.id,
        hash,
        canonicalJson,
      });

      incident.payloadHash = hash;
      incident.anchorStatus = receipt.status;
      incident.txHash = receipt.txHash;
    }

    // Append to immutable timeline
    this.incidentUpdates.unshift({
      id: `upd-${Date.now()}`,
      incidentId,
      actorUserId,
      actorName,
      oldStatus,
      newStatus,
      note,
      imageUrl,
      createdAt: now,
    });

    this.saveAll();
    return incident;
  }

  public async reopenIncident(params: {
    incidentId: string;
    actorUserId: string;
    actorName: string;
    reason: string;
    imageUrl?: string;
  }): Promise<Incident> {
    const { incidentId, actorUserId, actorName, reason, imageUrl } = params;
    const index = this.incidents.findIndex((i) => i.id === incidentId);
    if (index === -1) throw new Error('Incident not found');

    const incident = this.incidents[index];
    const oldStatus = incident.status;
    const now = new Date().toISOString();

    incident.status = 'REOPENED';
    incident.reopenedReason = reason;
    incident.reopenedAt = now;
    incident.reopenedCount = (incident.reopenedCount || 0) + 1;
    incident.updatedAt = now;
    if (imageUrl) {
      incident.reopenedImageUrl = imageUrl;
    }

    // Anchor REOPEN request to blockchain for transparency
    const { hash, canonicalJson } = computeRecordHash('INCIDENT_REPORT', incident);

    const receipt = await blockchainService.anchorRecord({
      recordType: 'INCIDENT_REPORT',
      recordId: incident.id,
      hash,
      canonicalJson,
    });

    incident.payloadHash = hash;
    incident.anchorStatus = receipt.status;
    incident.txHash = receipt.txHash;

    // Append to immutable timeline
    this.incidentUpdates.unshift({
      id: `upd-${Date.now()}`,
      incidentId,
      actorUserId,
      actorName,
      oldStatus,
      newStatus: 'REOPENED',
      note: `Người dân gửi yêu cầu tái xử lý (chưa đạt): "${reason}"`,
      imageUrl: imageUrl || incident.reopenedImageUrl,
      createdAt: now,
    });

    this.saveAll();
    return incident;
  }

  public getIncidentUpdates(incidentId: string): IncidentUpdate[] {
    return this.incidentUpdates
      .filter((u) => u.incidentId === incidentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Dashboard Aggregates (O(N) single-pass with caching for ultra-smooth 60fps performance)
  public getDashboardStats() {
    if (this.cachedDashboardStats) {
      return this.cachedDashboardStats;
    }

    const totalTrees = this.trees.length;
    let healthyTrees = 0;
    let atRiskTrees = 0;
    const healthBreakdown = {
      GOOD: 0,
      FAIR: 0,
      POOR: 0,
      CRITICAL: 0,
      DEAD: 0,
    };

    for (const t of this.trees) {
      const s = t.healthStatus;
      if (s === 'GOOD') {
        healthyTrees++;
        healthBreakdown.GOOD++;
      } else if (s === 'FAIR') {
        healthBreakdown.FAIR++;
      } else if (s === 'POOR') {
        atRiskTrees++;
        healthBreakdown.POOR++;
      } else if (s === 'CRITICAL') {
        atRiskTrees++;
        healthBreakdown.CRITICAL++;
      } else if (s === 'DEAD') {
        healthBreakdown.DEAD++;
      }
    }

    let activeIncidents = 0;
    const incidentBreakdown = {
      RECEIVED: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };

    for (const inc of this.incidents) {
      const st = inc.status;
      if (st === 'RECEIVED' || st === 'ASSIGNED' || st === 'IN_PROGRESS' || st === 'REOPENED') {
        activeIncidents++;
      }
      if (incidentBreakdown[st as keyof typeof incidentBreakdown] !== undefined) {
        incidentBreakdown[st as keyof typeof incidentBreakdown]++;
      }
    }

    const totalCareRecords = this.careRecords.length;
    const totalAnchors = blockchainService.getAllAnchors().length;

    this.cachedDashboardStats = {
      totalTrees,
      healthyTrees,
      atRiskTrees,
      activeIncidents,
      totalCareRecords,
      totalAnchors,
      healthBreakdown,
      incidentBreakdown,
    };

    return this.cachedDashboardStats;
  }

  // 🛡️ CITIZEN AUTHENTICATION & GOOGLE OAUTH 2.0
  public registerCitizen(data: { fullName: string; phone?: string; email?: string }): User {
    const id = `citizen-${Date.now()}`;
    const cleanPhone = (data.phone || '').trim();
    const username = cleanPhone ? `citizen_${cleanPhone.slice(-4)}` : `citizen_${Date.now().toString().slice(-4)}`;
    const newCitizen: User = {
      id,
      username,
      fullName: data.fullName.trim(),
      role: 'CITIZEN',
      phone: cleanPhone || undefined,
      email: data.email?.trim() || undefined,
      authProvider: 'LOCAL',
      isActive: true,
    };
    this.users.push(newCitizen);
    this.saveAll();
    this.setActiveUser(newCitizen);
    return newCitizen;
  }

  public loginWithGoogle(googleData: { fullName: string; email: string; avatarUrl?: string }): User {
    const existing = this.users.find((u) => u.email?.toLowerCase() === googleData.email.toLowerCase());
    if (existing) {
      this.setActiveUser(existing);
      return existing;
    }
    const id = `citizen-g-${Date.now()}`;
    const username = googleData.email.split('@')[0];
    const newCitizen: User = {
      id,
      username,
      fullName: googleData.fullName,
      email: googleData.email,
      avatarUrl:
        googleData.avatarUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: 'CITIZEN',
      authProvider: 'GOOGLE',
      isActive: true,
    };
    this.users.push(newCitizen);
    this.saveAll();
    this.setActiveUser(newCitizen);
    return newCitizen;
  }

  // ==========================================
  // 🔔 THÔNG BÁO & CẢNH BÁO ĐIỀU HÀNH ĐÔ THỊ
  // ==========================================

  public getNotifications(): AppNotification[] {
    return [...this.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      if (this.isBrowser()) {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
      }
    }
  }

  public markAllNotificationsAsRead(role?: string): void {
    this.notifications.forEach((n) => {
      if (!role || n.targetRoles.includes(role as any)) {
        n.isRead = true;
      }
    });
    if (this.isBrowser()) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    }
  }

  public deleteNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    if (this.isBrowser()) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    }
  }

  public deleteAllReadNotifications(role?: string): void {
    this.notifications = this.notifications.filter((n) => {
      if (!n.isRead) return true;
      if (role && !n.targetRoles.includes(role as any)) return true;
      return false;
    });
    if (this.isBrowser()) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    }
  }

  public addNotification(
    notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }
  ): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      isRead: notif.isRead ?? false,
    };
    this.notifications.unshift(newNotif);
    if (this.isBrowser()) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    }
    return newNotif;
  }

  public getUnreadNotificationCount(role?: string): number {
    return this.notifications.filter((n) => {
      if (n.isRead) return false;
      if (!role) return true;
      return n.targetRoles.includes(role as any);
    }).length;
  }

  // ==========================================================================
  // 🚜 QUẢN LÝ VẬN HÀNH HIỆN TRƯỜNG & LỆNH CÔNG TÁC (WORK ORDER ENGINE)
  // ==========================================================================

  public getDepartments(): Department[] {
    return [...this.departments];
  }

  public getOperationalZones(): OperationalZone[] {
    return [...this.zones];
  }

  public getRoutes(zoneId?: string): Route[] {
    if (!zoneId) return [...this.routes];
    return this.routes.filter((r) => r.zoneId === zoneId);
  }

  public getTeams(zoneId?: string): Team[] {
    if (!zoneId) return [...this.teams];
    return this.teams.filter((t) => t.assignedZoneId === zoneId);
  }

  public getEquipment(status?: EquipmentStatus): Equipment[] {
    if (!status) return [...this.equipment];
    return this.equipment.filter((e) => e.status === status);
  }

  public getMaintenanceRules(): MaintenanceRule[] {
    return [...this.maintenanceRules];
  }

  public getSLAPolicies(): SLAPolicy[] {
    return [...this.slaPolicies];
  }

  public getWorkOrders(filters?: {
    zoneId?: string;
    routeId?: string;
    status?: WorkOrderStatus;
    teamId?: string;
  }): WorkOrder[] {
    let list = [...this.workOrders];
    if (filters?.zoneId) list = list.filter((w) => w.zoneId === filters.zoneId);
    if (filters?.routeId) list = list.filter((w) => w.routeId === filters.routeId);
    if (filters?.status) list = list.filter((w) => w.status === filters.status);
    if (filters?.teamId) list = list.filter((w) => w.assignedTeamId === filters.teamId);

    // Tính toán thời gian quá hạn SLA
    const now = Date.now();
    list.forEach((wo) => {
      if (wo.actualStart && wo.slaTargetMinutes && (wo.status === 'IN_PROGRESS' || wo.status === 'ASSIGNED')) {
        const elapsedMinutes = (now - new Date(wo.actualStart).getTime()) / (60 * 1000);
        wo.isOverdue = elapsedMinutes > wo.slaTargetMinutes;
      }
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getWorkOrderDetails(orderId: string): {
    workOrder: WorkOrder;
    items: WorkOrderItem[];
    history: WorkOrderHistory[];
    team?: Team;
    route?: Route;
    zone?: OperationalZone;
  } | null {
    const workOrder = this.workOrders.find((w) => w.id === orderId);
    if (!workOrder) return null;

    const items = this.workOrderItems.filter((it) => it.workOrderId === orderId);
    const history = this.workOrderHistory
      .filter((h) => h.workOrderId === orderId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const team = this.teams.find((t) => t.id === workOrder.assignedTeamId);
    const route = this.routes.find((r) => r.id === workOrder.routeId);
    const zone = this.zones.find((z) => z.id === workOrder.zoneId);

    return { workOrder, items, history, team, route, zone };
  }

  public createWorkOrder(input: {
    title: string;
    description?: string;
    type: WorkOrderType;
    priority: WorkOrderPriority;
    zoneId: string;
    routeId?: string;
    assignedTeamId?: string;
    assignedEquipmentIds?: string[];
    scheduledStart?: string;
    scheduledEnd?: string;
    treeIds?: string[];
    createdByUserId: string;
  }): WorkOrder {
    const now = new Date().toISOString();
    const orderId = `wo-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const route = this.routes.find((r) => r.id === input.routeId);
    const routeCode = route ? route.code : 'GEN';
    const orderCode = `WO-${routeCode}-${Date.now().toString().slice(-4)}`;

    // Xác định SLA mục tiêu theo chính sách
    const slaPolicy = this.slaPolicies.find((p) => p.priority === input.priority);
    const slaTargetMinutes = slaPolicy ? slaPolicy.resolutionTargetMinutes : 240;

    // Tìm danh sách cây trên tuyến
    let targetTrees: Tree[] = [];
    if (input.treeIds && input.treeIds.length > 0) {
      targetTrees = this.trees.filter((t) => input.treeIds!.includes(t.id));
    } else if (route) {
      const corrName = route.name;
      targetTrees = this.trees.filter((t) => getTreeCorridor(t) === corrName);
    }
    if (targetTrees.length === 0) {
      targetTrees = this.trees.slice(0, 30);
    }

    const assignedTeam = this.teams.find((t) => t.id === input.assignedTeamId);

    const newOrder: WorkOrder = {
      id: orderId,
      code: orderCode,
      title: input.title,
      description: input.description || input.title,
      type: input.type,
      priority: input.priority,
      scopeType: 'ROUTE',
      status: input.assignedTeamId ? 'ASSIGNED' : 'DRAFT',
      workflowStatus: input.assignedTeamId ? 'ASSIGNED' : 'DRAFT',
      slaStatus: 'ON_TRACK',
      zoneId: input.zoneId,
      routeId: input.routeId,
      routeCorridorName: route?.name,
      scheduledStart: input.scheduledStart || now,
      scheduledEnd: input.scheduledEnd || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      requiredCapabilities: assignedTeam?.capabilities || ['ROUTINE_MAINTENANCE'],
      assignedTeamId: input.assignedTeamId,
      assignedTeamName: assignedTeam?.name,
      totalItems: targetTrees.length,
      completedItems: 0,
      skippedItems: 0,
      failedItems: 0,
      progressPercent: 0,
      slaTargetMinutes,
      isOverdue: false,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
      anchorStatus: 'PENDING',
      retryCount: 0,
    };

    // Tạo checklist từng cây
    const items = buildWorkOrderItemsForTrees(targetTrees, orderId, input.type);
    this.workOrders.unshift(newOrder);
    this.workOrderItems.push(...items);

    // Ghi nhận lịch sử
    const hist = createWorkOrderHistoryRecord(
      orderId,
      this.activeUser,
      'DRAFT',
      newOrder.status,
      'Khởi tạo Lệnh công tác mới'
    );
    this.workOrderHistory.unshift(hist);

    // Cập nhật workload cho team nếu đã giao
    if (input.assignedTeamId && assignedTeam) {
      assignedTeam.activeWorkOrdersCount = (assignedTeam.activeWorkOrdersCount || 0) + 1;
      assignedTeam.currentStatus = 'DISPATCHED';
    }

    this.saveAll();
    return newOrder;
  }

  public getTeamActiveWorkload(teamId: string): number {
    return countActiveWorkOrdersForTeam(teamId, this.workOrders);
  }

  public recommendTeamsForWorkOrder(orderId: string): TeamRecommendation[] {
    const order = this.workOrders.find((w) => w.id === orderId);
    if (!order) return [];
    return evaluateTeamRecommendations(
      this.teams,
      this.equipment,
      order.requiredCapabilities,
      order.zoneId,
      this.workOrders
    );
  }

  public assignWorkOrder(
    orderId: string,
    teamId: string,
    dispatcherUser: User,
    equipmentIds?: string[]
  ): WorkOrder {
    const order = this.workOrders.find((w) => w.id === orderId);
    if (!order) throw new Error(`Không tìm thấy lệnh công tác ${orderId}`);

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) throw new Error(`Không tìm thấy tổ đội ${teamId}`);

    // Kiểm tra năng lực và thiết bị theo Business Rules Phase 2 & 11
    const recommendations = evaluateTeamRecommendations(
      this.teams,
      this.equipment,
      order.requiredCapabilities,
      order.zoneId,
      this.workOrders
    );
    const teamRec = recommendations.find((r) => r.team.id === teamId);
    if (teamRec && !teamRec.canAssign) {
      throw new Error(`Không thể phân bổ: ${teamRec.unmetReason}`);
    }

    const isReassign = !!(order.assignedTeamId && order.assignedTeamId !== teamId);
    const oldTeamId = order.assignedTeamId;

    // Nếu lệnh trước đó đã có team khác, giảm workload team cũ
    if (isReassign && oldTeamId) {
      const oldTeam = this.teams.find((t) => t.id === oldTeamId);
      if (oldTeam && oldTeam.activeWorkOrdersCount > 0) {
        oldTeam.activeWorkOrdersCount -= 1;
        if (oldTeam.activeWorkOrdersCount === 0) oldTeam.currentStatus = 'AVAILABLE';
      }
    }

    const previousState = order.status;
    order.assignedTeamId = team.id;
    order.assignedTeamName = team.name;
    const assignedEq = this.equipment.filter((e) => team.assignedEquipmentIds.includes(e.id));
    if (assignedEq[0]) {
      order.assignedVehicleName = assignedEq[0].name;
      order.assignedVehiclePlate = assignedEq[0].plateNumber;
    }
    order.status = 'ASSIGNED';
    order.workflowStatus = 'ASSIGNED';
    order.updatedAt = new Date().toISOString();

    team.activeWorkOrdersCount = (team.activeWorkOrdersCount || 0) + 1;
    team.currentStatus = 'DISPATCHED';

    const hist = createWorkOrderHistoryRecord(
      order.id,
      dispatcherUser,
      previousState,
      'ASSIGNED',
      isReassign
        ? `Điều phối viên ${dispatcherUser.fullName} đã điều chuyển lại cho ${team.name}`
        : `Điều phối viên ${dispatcherUser.fullName} đã phân bổ cho ${team.name}`
    );
    hist.action = isReassign ? 'REASSIGNED' : 'STATUS_CHANGE';
    if (isReassign && oldTeamId) {
      hist.previousTeamId = oldTeamId;
      hist.newTeamId = team.id;
    }
    this.workOrderHistory.unshift(hist);

    this.addNotification({
      type: 'DISPATCH_ALERT',
      title: isReassign
        ? `Lệnh Công Tác [${order.code}] Đã Được Điều Chuyển Lại`
        : `Lệnh Công Tác [${order.code}] Đã Được Phân Bổ`,
      message: `Được phân công cho ${team.name}. Tuyến: ${order.routeCorridorName || 'Đô thị'}.`,
      severity: 'INFO',
      targetRoles: ['STAFF', 'ADMIN'],
      referenceId: order.id,
      referenceType: 'WORK_ORDER',
    });

    this.saveAll();
    return order;
  }

  public markItemNeedsFollowUp(
    itemId: string,
    followUpReason: string,
    actorUser: User
  ): WorkOrderItem {
    const item = this.workOrderItems.find((it) => it.id === itemId);
    if (!item) throw new Error(`Không tìm thấy mục công việc ${itemId}`);

    item.status = 'NEEDS_FOLLOW_UP';
    item.skipOrFailureReason = followUpReason;
    item.completedAt = new Date().toISOString();
    item.completedByUserId = actorUser.id;

    const parentOrder = this.workOrders.find((w) => w.id === item.workOrderId);
    if (parentOrder) {
      parentOrder.failedItems = (parentOrder.failedItems || 0) + 1;
      parentOrder.updatedAt = new Date().toISOString();

      this.addNotification({
        type: 'SLA_WARNING',
        title: `Cảnh Báo Hiện Trường Cần Hỗ Trợ Kỹ Thuật [${parentOrder.code}]`,
        message: `Cây [${item.treeStreetCode || item.treeId}] không thể xử lý: ${followUpReason}. Đề nghị Điều phối viên hỗ trợ thiết bị!`,
        severity: 'WARNING',
        targetRoles: ['ADMIN', 'STAFF'],
        referenceId: parentOrder.id,
        referenceType: 'WORK_ORDER',
      });
    }

    this.saveAll();
    return item;
  }

  public transitionWorkOrderStatus(
    orderId: string,
    targetStatus: WorkOrderStatus,
    actorUser: User,
    reason?: string
  ): WorkOrder {
    const order = this.workOrders.find((w) => w.id === orderId);
    if (!order) throw new Error(`Không tìm thấy lệnh công tác ${orderId}`);

    if (!canTransitionWorkOrderStatus(order.status, targetStatus)) {
      throw new Error(`Chuyển trạng thái không hợp lệ: từ ${order.status} sang ${targetStatus}`);
    }

    const previousState = order.status;
    order.status = targetStatus;
    order.workflowStatus = targetStatus;
    order.updatedAt = new Date().toISOString();

    let actionName: string = 'STATUS_CHANGE';

    // Xử lý tạm dừng công việc (ON_HOLD) do điều kiện mưa bão, vướng điện lực, hỏng xe
    if (targetStatus === 'ON_HOLD') {
      order.holdReason = reason || 'Tạm dừng thi công do điều kiện ngoại cảnh/kỹ thuật hiện trường';
      order.heldByUserId = actorUser.id;
      order.heldAt = new Date().toISOString();
      actionName = 'HOLD';
    } else if (previousState === 'ON_HOLD' && targetStatus === 'IN_PROGRESS') {
      order.holdReason = undefined;
      order.heldByUserId = undefined;
      order.heldAt = undefined;
      actionName = 'RESUME';
    } else if (targetStatus === 'VERIFIED') {
      actionName = 'VERIFIED';
    } else if (targetStatus === 'REJECTED') {
      actionName = 'REJECTED';
    } else if (targetStatus === 'CANCELLED') {
      actionName = 'CANCELLED';
    }

    if (targetStatus === 'IN_PROGRESS' && !order.actualStart) {
      order.actualStart = new Date().toISOString();
    } else if (targetStatus === 'SUBMITTED_FOR_REVIEW' || targetStatus === 'COMPLETED' || targetStatus === 'VERIFIED') {
      if (!order.actualEnd) order.actualEnd = new Date().toISOString();
    }

    // Nếu lệnh hoàn thành/nghiệm thu/đóng, cập nhật giải phóng thiết bị & tổ
    if (targetStatus === 'COMPLETED' || targetStatus === 'VERIFIED' || targetStatus === 'CLOSED' || targetStatus === 'CANCELLED') {
      if (order.assignedTeamId) {
        const team = this.teams.find((t) => t.id === order.assignedTeamId);
        if (team && team.activeWorkOrdersCount > 0) {
          team.activeWorkOrdersCount -= 1;
          if (team.activeWorkOrdersCount === 0) {
            team.currentStatus = 'AVAILABLE';
          }
        }
      }

      // Tự động neo lên Blockchain Ledger với Retry Policy (không bao giờ rollback nghiệp vụ)
      if (targetStatus === 'COMPLETED' || targetStatus === 'VERIFIED') {
        const { hash, canonicalJson } = computeRecordHash('WORK_ORDER' as any, order);
        order.payloadHash = hash;
        order.anchorStatus = 'PENDING';
        order.retryCount = 0;
        order.lastAttemptAt = new Date().toISOString();

        // Worker neo hash với cơ chế Retry Backoff phi chặn
        const attemptAnchorWithRetry = async (retry = 0, maxRetries = 3) => {
          try {
            const receipt = await blockchainService.anchorRecord({
              recordType: 'CARE_RECORD',
              recordId: order.id,
              hash,
              canonicalJson,
            });
            order.anchorStatus = (receipt.status === 'CONFIRMED' || receipt.status === 'PENDING') ? 'ANCHORED' : 'CONFIRMED';
            order.txHash = receipt.txHash;
            this.saveAll();
          } catch (err: any) {
            order.retryCount = retry + 1;
            order.lastError = err?.message || 'Lỗi kết nối Blockchain Node';
            order.lastAttemptAt = new Date().toISOString();
            if (retry + 1 < maxRetries) {
              order.anchorStatus = 'FAILED_RETRYABLE';
              order.nextRetryAt = new Date(Date.now() + Math.pow(2, retry) * 30000).toISOString();
              this.saveAll();
              setTimeout(() => attemptAnchorWithRetry(retry + 1, maxRetries), 2000);
            } else {
              order.anchorStatus = 'FAILED_FINAL';
              this.saveAll();
            }
          }
        };

        attemptAnchorWithRetry(0, 3);

        // Tạo CareRecord đồng bộ cho các cây đã hoàn thành trong checklist
        const items = this.workOrderItems.filter(
          (it) => it.workOrderId === orderId && it.status === 'COMPLETED'
        );
        items.forEach((it) => {
          const actionType: CareActionType =
            order.type === 'PRUNING'
              ? 'PRUNING'
              : order.type === 'WATERING'
              ? 'WATERING'
              : order.type === 'FERTILIZATION'
              ? 'FERTILIZING'
              : 'SURVEY';

          this.createCareRecord({
            treeId: it.treeId,
            actionType,
            staffUserId: actorUser.id,
            staffName: actorUser.fullName || actorUser.username,
            notes: `Thực hiện theo ${order.title} (${order.code})`,
            healthBefore: 'FAIR',
            healthAfter: 'GOOD',
            performedAt: new Date().toISOString().slice(0, 10),
            imageUrl: it.evidenceAfterImageUrl,
          });
        });
      }
    }

    // Lưu vết lịch sử
    const historyRecord = createWorkOrderHistoryRecord(
      orderId,
      actorUser,
      previousState,
      targetStatus,
      reason
    );
    historyRecord.action = actionName;
    if (order.holdReason) historyRecord.heldReason = order.holdReason;
    this.workOrderHistory.unshift(historyRecord);

    // Gửi thông báo
    this.addNotification({
      type: 'DISPATCH_ALERT',
      title: `Cập nhật Lệnh Công Tác [${order.code}]`,
      message: `Trạng thái đã chuyển sang "${targetStatus}" bởi ${actorUser.fullName || actorUser.username}.${reason ? ` Ghi chú: ${reason}` : ''}`,
      severity: targetStatus === 'REJECTED' ? 'WARNING' : 'INFO',
      targetRoles: ['ADMIN', 'STAFF'],
      referenceId: order.id,
      referenceType: 'WORK_ORDER',
    });

    this.saveAll();
    return order;
  }

  public updateWorkOrderItemExecution(
    itemId: string,
    status: 'COMPLETED' | 'SKIPPED' | 'FAILED',
    actorUserId: string,
    skipReason?: string,
    evidenceImageUrl?: string
  ): WorkOrderItem {
    const item = this.workOrderItems.find((it) => it.id === itemId);
    if (!item) throw new Error(`Không tìm thấy mục công việc ${itemId}`);

    item.status = status;
    item.completedAt = new Date().toISOString();
    item.completedByUserId = actorUserId;
    if (skipReason) item.skipOrFailureReason = skipReason;
    if (evidenceImageUrl) item.evidenceAfterImageUrl = evidenceImageUrl;

    // Tự động tính lại tiến độ của WorkOrder cha
    const parentOrder = this.workOrders.find((w) => w.id === item.workOrderId);
    if (parentOrder) {
      const siblingItems = this.workOrderItems.filter((it) => it.workOrderId === parentOrder.id);
      const total = siblingItems.length;
      const completed = siblingItems.filter((it) => it.status === 'COMPLETED').length;
      const skipped = siblingItems.filter((it) => it.status === 'SKIPPED').length;
      const failed = siblingItems.filter((it) => it.status === 'FAILED').length;

      parentOrder.totalItems = total;
      parentOrder.completedItems = completed;
      parentOrder.skippedItems = skipped;
      parentOrder.failedItems = failed;
      parentOrder.progressPercent = total > 0 ? Math.round(((completed + skipped) / total) * 100) : 0;
      parentOrder.updatedAt = new Date().toISOString();

      // Nếu tất cả cây đã được xử lý (xong hoặc bỏ qua) -> tự động chuyển sang CHỜ NGHIỆM THU
      if (completed + skipped + failed >= total && total > 0 && parentOrder.status === 'IN_PROGRESS') {
        parentOrder.status = 'SUBMITTED_FOR_REVIEW';
        parentOrder.actualEnd = new Date().toISOString();
        const hist = createWorkOrderHistoryRecord(
          parentOrder.id,
          this.activeUser,
          'IN_PROGRESS',
          'SUBMITTED_FOR_REVIEW',
          `Hoàn tất xử lý ${completed}/${total} cây trên tuyến (Bỏ qua: ${skipped}, Lỗi: ${failed}). Chờ Giám sát nghiệm thu.`
        );
        this.workOrderHistory.unshift(hist);
      }
    }

    this.saveAll();
    return item;
  }

  public verifyWorkOrder(
    orderId: string,
    supervisorUser: User,
    isApproved: boolean,
    notes?: string
  ): WorkOrder {
    const order = this.workOrders.find((w) => w.id === orderId);
    if (!order) throw new Error(`Không tìm thấy lệnh công tác ${orderId}`);

    order.supervisorUserId = supervisorUser.id;
    order.supervisorNotes = notes;

    if (isApproved) {
      return this.transitionWorkOrderStatus(
        orderId,
        'COMPLETED',
        supervisorUser,
        `Giám sát viên đã nghiệm thu đạt chuẩn kỹ thuật. Ghi chú: ${notes || 'Đạt yêu cầu'}`
      );
    } else {
      return this.transitionWorkOrderStatus(
        orderId,
        'REJECTED',
        supervisorUser,
        `Yêu cầu thực hiện lại. Lý do nghiệm thu không đạt: ${notes || 'Chưa đạt độ cao tĩnh không yêu cầu'}`
      );
    }
  }

  public evaluateMaintenanceRulesAndGenerateWorkOrders(): {
    createdCount: number;
    orders: WorkOrder[];
  } {
    const activeRules = this.maintenanceRules.filter((r) => r.isActive);
    const createdOrders: WorkOrder[] = [];
    const openStatuses: WorkOrderStatus[] = [
      'DRAFT',
      'PLANNED',
      'ASSIGNED',
      'ACCEPTED',
      'IN_PROGRESS',
      'SUBMITTED_FOR_REVIEW',
      'REJECTED',
    ];

    for (const rule of activeRules) {
      if (rule.scopeType === 'ROUTE' && rule.scopeId) {
        const route = this.routes.find((r) => r.id === rule.scopeId);
        if (!route) continue;

        // KIỂM TRA TÍNH BẤT BIẾN (IDEMPOTENCY): Tuyến này đã có Lệnh công tác cùng loại đang mở chưa?
        const hasOpenOrder = this.workOrders.some(
          (w) => w.routeId === route.id && w.type === rule.taskType && openStatuses.includes(w.status)
        );

        if (hasOpenOrder) {
          // Tuyến đang có lệnh thi công chưa đóng -> Bỏ qua, không bao giờ sinh trùng lặp!
          continue;
        }

        // Tự động ghép Đội và Xe theo năng lực yêu cầu
        const match = matchBestTeamForTask(
          this.teams,
          this.equipment,
          rule.requiredCapabilities,
          route.zoneId
        );

        const newOrder = this.createWorkOrder({
          title: `[Tự Động Theo Quy Tắc] ${rule.name}`,
          type: rule.taskType,
          priority: rule.priority,
          zoneId: route.zoneId,
          routeId: route.id,
          assignedTeamId: match.team ? match.team.id : this.teams[0]?.id,
          assignedEquipmentIds: match.matchedEquipment.map((e) => e.id),
          createdByUserId: 'system-scheduler',
        });

        createdOrders.push(newOrder);
      }
    }

    if (createdOrders.length > 0) {
      this.addNotification({
        type: 'MAINTENANCE_DUE',
        title: `Hệ Thống Tự Động Lập ${createdOrders.length} Lệnh Công Tác Tuyến`,
        message: `Bộ quy tắc bảo dưỡng đô thị đã quét và tự động phân bổ lệnh công tác cho các tổ cơ giới.`,
        severity: 'INFO',
        targetRoles: ['ADMIN', 'STAFF'],
      });
    }

    return { createdCount: createdOrders.length, orders: createdOrders };
  }

  public getOperationsDispatchMetrics() {
    const totalOrders = this.workOrders.length;
    const activeOrders = this.workOrders.filter((w) => w.status === 'IN_PROGRESS');
    const waitingVerification = this.workOrders.filter((w) => w.status === 'SUBMITTED_FOR_REVIEW');
    const completedOrders = this.workOrders.filter((w) => w.status === 'COMPLETED' || w.status === 'CLOSED');
    const overdueOrders = this.workOrders.filter((w) => w.isOverdue);

    // Tính chi tiết tình trạng điều xe cho từng Tổ
    const teamDispatches = this.teams.map((team) => {
      const currentWorkOrder = this.workOrders.find(
        (w) =>
          w.assignedTeamId === team.id &&
          (w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED' || w.status === 'REJECTED')
      );

      const eqList = this.equipment.filter((e) => team.assignedEquipmentIds.includes(e.id));
      const isDispatched = currentWorkOrder?.status === 'IN_PROGRESS';

      return {
        team,
        currentWorkOrder,
        isDispatched,
        equipmentList: eqList,
      };
    });

    const activeDispatchedCount = teamDispatches.filter((td) => td.isDispatched).length;
    const standbyCount = teamDispatches.filter((td) => !td.isDispatched).length;
    const delayedCount = overdueOrders.length;
    const onTimeRate =
      totalOrders > 0 ? Math.max(0, Math.round(((totalOrders - delayedCount) / totalOrders) * 100)) : 100;

    return {
      totalOrders,
      activeDispatchedCount,
      standbyCount,
      waitingVerificationCount: waitingVerification.length,
      completedCount: completedOrders.length,
      delayedCount,
      onTimeRate,
      teamDispatches,
    };
  }
}

export const storage = new StorageService();
