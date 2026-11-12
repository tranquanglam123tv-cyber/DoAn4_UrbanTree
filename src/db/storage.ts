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
  {
    id: 'tree-001',
    publicCode: 'TREE-001',
    treeTypeId: 'type-bang',
    displayName: 'Cây Bàng Đài Loan #01',
    address: 'Công viên Lưu Hữu Phước, Đại lộ Hòa Bình, Phường An Lạc, Quận Ninh Kiều, Cần Thơ',
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
    id: 'tree-002',
    publicCode: 'TREE-002',
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
  {
    id: 'tree-006',
    publicCode: 'TREE-006',
    treeTypeId: 'type-me',
    displayName: 'Cây Me Tây Góc Phố #06',
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
    reportedAt: '2026-11-02T03:20:00.000Z',
    createdAt: '2026-11-02T03:20:00.000Z',
    updatedAt: '2026-11-03T02:00:00.000Z',
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
    status: 'RECEIVED',
    assignedToUserId: null,
    reportedAt: '2026-11-04T10:15:00.000Z',
    createdAt: '2026-11-04T10:15:00.000Z',
    updatedAt: '2026-11-04T10:15:00.000Z',
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
    reportedAt: '2026-10-18T04:10:00.000Z',
    resolvedAt: '2026-10-19T09:00:00.000Z',
    createdAt: '2026-10-18T04:10:00.000Z',
    updatedAt: '2026-10-19T09:00:00.000Z',
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
        this.users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || JSON.stringify(INITIAL_USERS));
        this.treeTypes = JSON.parse(localStorage.getItem(TREE_TYPES_STORAGE_KEY) || JSON.stringify(INITIAL_TREE_TYPES));
        this.careRecords = JSON.parse(localStorage.getItem(CARE_RECORDS_STORAGE_KEY) || JSON.stringify(INITIAL_CARE_RECORDS));
        this.incidents = JSON.parse(localStorage.getItem(INCIDENTS_STORAGE_KEY) || JSON.stringify(INITIAL_INCIDENTS));
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

      // Anchor RESOLUTION to blockchain
      const { hash, canonicalJson } = computeRecordHash('INCIDENT_RESOLUTION', incident, {
        resolvedBy: actorUserId,
        note,
        imageUrl: imageUrl || incident.imageUrl,
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
    const { hash, canonicalJson } = computeRecordHash('INCIDENT_REPORT', incident, {
      reopenedBy: actorUserId,
      reason,
      reopenedCount: incident.reopenedCount,
    });

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
