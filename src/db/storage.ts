/**
 * UrbanTree - Storage Engine & Database Service
 * Provides in-memory + LocalStorage persistence, seed data, and CRUD operations.
 */

import {
  CareRecord,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdate,
  RecordType,
  Role,
  Tree,
  TreeHealthStatus,
  TreeType,
  User,
} from '../types';
import { blockchainService } from '../services/blockchainService';
import { computeRecordHash } from '../services/hashService';
import { getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

const USERS_STORAGE_KEY = 'urbantree_users';
const TREE_TYPES_STORAGE_KEY = 'urbantree_tree_types';
const TREES_STORAGE_KEY = 'urbantree_trees';
const CARE_RECORDS_STORAGE_KEY = 'urbantree_care_records';
const INCIDENTS_STORAGE_KEY = 'urbantree_incidents';
const INCIDENT_UPDATES_STORAGE_KEY = 'urbantree_incident_updates';
const ACTIVE_USER_KEY = 'urbantree_active_user';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Đặng Thế Thuận',
    role: 'ADMIN',
    isActive: true,
  },
  {
    id: 'user-staff-1',
    username: 'staff_lam',
    fullName: 'Trần Quang Lâm',
    role: 'STAFF',
    isActive: true,
  },
  {
    id: 'user-staff-2',
    username: 'staff_tuan',
    fullName: 'Lê Tuấn Anh',
    role: 'STAFF',
    isActive: true,
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
    notes: 'Đã cắt tỉa cành khô, tạo thông thoáng tán lá trước mùa mưa bão.',
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

class StorageService {
  private users: User[] = [];
  private treeTypes: TreeType[] = [];
  private trees: Tree[] = [];
  private careRecords: CareRecord[] = [];
  private incidents: Incident[] = [];
  private incidentUpdates: IncidentUpdate[] = [];
  private activeUser: User = INITIAL_USERS[0]; // Admin by default

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
          if (!t.streetCode) {
            needSave = true;
            return {
              ...t,
              streetCode: getTreeStreetCode(t),
              streetCorridor: getTreeCorridor(t),
              houseNumberMilestone: getTreeMilestone(t),
            };
          }
          return t;
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

        const storedActiveUser = localStorage.getItem(ACTIVE_USER_KEY);
        if (storedActiveUser) {
          this.activeUser = JSON.parse(storedActiveUser);
        }
      } else {
        this.resetToDefaults();
      }
    } catch {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    this.users = [...INITIAL_USERS];
    this.treeTypes = [...INITIAL_TREE_TYPES];
    this.trees = [...INITIAL_TREES];
    this.careRecords = [...INITIAL_CARE_RECORDS];
    this.incidents = [...INITIAL_INCIDENTS];
    this.incidentUpdates = [...INITIAL_INCIDENT_UPDATES];
    this.activeUser = INITIAL_USERS[0];

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
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
      localStorage.setItem(TREE_TYPES_STORAGE_KEY, JSON.stringify(this.treeTypes));
      localStorage.setItem(TREES_STORAGE_KEY, JSON.stringify(this.trees));
      localStorage.setItem(CARE_RECORDS_STORAGE_KEY, JSON.stringify(this.careRecords));
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(this.incidents));
      localStorage.setItem(INCIDENT_UPDATES_STORAGE_KEY, JSON.stringify(this.incidentUpdates));
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(this.activeUser));
    } catch (err) {
      console.error('Storage save error:', err);
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
    return [...this.users];
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
    return [...this.treeTypes];
  }

  public getTreeTypeById(id: string): TreeType | undefined {
    return this.treeTypes.find((t) => t.id === id);
  }

  // Trees
  public getTrees(): Tree[] {
    return [...this.trees];
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
    return newTree;
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

    // Re-anchor updated tree
    const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', updatedTree);
    const receipt = await blockchainService.anchorRecord({
      recordType: 'TREE_PROFILE',
      recordId: id,
      hash,
      canonicalJson,
    });

    updatedTree.payloadVersion = 1;
    updatedTree.payloadHash = hash;
    updatedTree.anchorStatus = receipt.status;
    updatedTree.txHash = receipt.txHash;

    this.trees[index] = updatedTree;
    this.saveAll();
    return updatedTree;
  }

  public deleteTree(id: string): boolean {
    const prevLen = this.trees.length;
    this.trees = this.trees.filter((t) => t.id !== id);
    if (this.trees.length !== prevLen) {
      this.saveAll();
      return true;
    }
    return false;
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
    return [...this.careRecords];
  }

  public async createCareRecord(data: Omit<CareRecord, 'id' | 'createdAt'>): Promise<CareRecord> {
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
    this.saveAll();
    return newCare;
  }

  public async batchCareMaintenance(params: {
    treeIds: string[];
    staffUserId: string;
    staffName: string;
    actionType: CareActionType;
    notes: string;
    imageUrl?: string;
  }): Promise<CareRecord[]> {
    const { treeIds, staffUserId, staffName, actionType, notes, imageUrl } = params;
    const now = new Date().toISOString();
    const createdRecords: CareRecord[] = [];

    for (let i = 0; i < treeIds.length; i++) {
      const treeId = treeIds[i];
      const tree = this.trees.find((t) => t.id === treeId);
      if (!tree) continue;

      const id = `care-batch-${Date.now()}-${i}`;
      const newCare: CareRecord = {
        id,
        treeId,
        staffUserId,
        staffName,
        actionType,
        healthBefore: tree.healthStatus,
        healthAfter: tree.healthStatus === 'CRITICAL' ? 'POOR' : tree.healthStatus === 'POOR' ? 'FAIR' : 'GOOD',
        notes: `[Duy tu tuyến phố] ${notes}`,
        imageUrl: imageUrl || tree.imageUrl,
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

  // Incidents
  public getIncidents(): Incident[] {
    return [...this.incidents];
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
    };

    // Anchor incident report to blockchain
    const { hash, canonicalJson } = computeRecordHash('INCIDENT_REPORT', newIncident);
    const receipt = await blockchainService.anchorRecord({
      recordType: 'INCIDENT_REPORT',
      recordId: id,
      hash,
      canonicalJson,
    });

    newIncident.payloadVersion = 1;
    newIncident.payloadHash = hash;
    newIncident.anchorStatus = receipt.status;
    newIncident.txHash = receipt.txHash;

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

  // Dashboard Aggregates
  public getDashboardStats() {
    const totalTrees = this.trees.length;
    const healthyTrees = this.trees.filter((t) => t.healthStatus === 'GOOD').length;
    const atRiskTrees = this.trees.filter((t) => ['POOR', 'CRITICAL'].includes(t.healthStatus)).length;
    const activeIncidents = this.incidents.filter((i) => ['RECEIVED', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)).length;
    const totalCareRecords = this.careRecords.length;
    const totalAnchors = blockchainService.getAllAnchors().length;

    const healthBreakdown = {
      GOOD: this.trees.filter((t) => t.healthStatus === 'GOOD').length,
      FAIR: this.trees.filter((t) => t.healthStatus === 'FAIR').length,
      POOR: this.trees.filter((t) => t.healthStatus === 'POOR').length,
      CRITICAL: this.trees.filter((t) => t.healthStatus === 'CRITICAL').length,
      DEAD: this.trees.filter((t) => t.healthStatus === 'DEAD').length,
    };

    const incidentBreakdown = {
      RECEIVED: this.incidents.filter((i) => i.status === 'RECEIVED').length,
      ASSIGNED: this.incidents.filter((i) => i.status === 'ASSIGNED').length,
      IN_PROGRESS: this.incidents.filter((i) => i.status === 'IN_PROGRESS').length,
      RESOLVED: this.incidents.filter((i) => i.status === 'RESOLVED').length,
      REJECTED: this.incidents.filter((i) => i.status === 'REJECTED').length,
    };

    return {
      totalTrees,
      healthyTrees,
      atRiskTrees,
      activeIncidents,
      totalCareRecords,
      totalAnchors,
      healthBreakdown,
      incidentBreakdown,
    };
  }
}

export const storage = new StorageService();
