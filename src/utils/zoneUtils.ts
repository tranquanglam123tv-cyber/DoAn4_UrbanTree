/**
 * UrbanTree - Management Zones & Multi-District Jurisdiction for Cần Thơ City
 */

import { Tree } from '../types';

export interface UrbanZone {
  id: string;
  name: string;
  shortName: string;
  type: 'CITY_ALL' | 'DISTRICT' | 'COUNTY';
  center: [number, number]; // [lat, lng]
  zoom: number;
  description: string;
  agency: string;
  areaKm2: number;
  targetTrees: number;
  color: string;
}

export const CAN_THO_ZONES: UrbanZone[] = [
  {
    id: 'all',
    name: 'Toàn TP. Cần Thơ (Tất cả 9 quận/huyện)',
    shortName: '🌐 Toàn thành phố',
    type: 'CITY_ALL',
    center: [10.0345, 105.7650],
    zoom: 13,
    description: 'Hạ tầng mạng lưới cây xanh đô thị & vành đai sinh thái toàn thành phố Cần Thơ.',
    agency: 'Sở Xây Dựng Cần Thơ · Chi cục Cây xanh Đô thị',
    areaKm2: 1439,
    targetTrees: 50000,
    color: '#10b981',
  },
  {
    id: 'ninh-kieu',
    name: 'Quận Ninh Kiều (Đô thị Trung tâm & Di sản)',
    shortName: '🏛️ Q. Ninh Kiều',
    type: 'DISTRICT',
    center: [10.0355, 105.7825],
    zoom: 15,
    description: 'Vùng lõi hành chính thương mại, Bến Ninh Kiều, Đại lộ Hòa Bình, Đường 30/4, Lưu Hữu Phước.',
    agency: 'Phòng Quản lý Đô thị Q. Ninh Kiều · Công ty CP Môi trường Đô thị',
    areaKm2: 29.2,
    targetTrees: 18500,
    color: '#059669',
  },
  {
    id: 'cai-rang',
    name: 'Quận Cái Răng (Đô thị Mới & Cửa ngõ Phía Nam)',
    shortName: '🌉 Q. Cái Răng',
    type: 'DISTRICT',
    center: [10.0075, 105.7950],
    zoom: 14,
    description: 'Trục đại lộ Võ Nguyên Giáp, Quang Trung, Vành đai Cầu Cần Thơ & Chợ nổi Cái Răng.',
    agency: 'Phòng Quản lý Đô thị Quận Cái Răng',
    areaKm2: 62.5,
    targetTrees: 12000,
    color: '#0284c7',
  },
  {
    id: 'binh-thuy',
    name: 'Quận Bình Thủy (Cửa ngõ Hàng không & Di sản)',
    shortName: '✈️ Q. Bình Thủy',
    type: 'DISTRICT',
    center: [10.0680, 105.7460],
    zoom: 14,
    description: 'Đại lộ Võ Văn Kiệt cảnh quan sân bay, Bùi Hữu Nghĩa, Đình Bình Thủy, Kè rạch Bình Thủy.',
    agency: 'Phòng Kinh tế & Hạ tầng Kỹ thuật Q. Bình Thủy',
    areaKm2: 70.6,
    targetTrees: 9500,
    color: '#8b5cf6',
  },
  {
    id: 'o-mon',
    name: 'Quận Ô Môn (Đô thị Công nghiệp & Bắc Cần Thơ)',
    shortName: '🏭 Q. Ô Môn',
    type: 'DISTRICT',
    center: [10.1180, 105.6420],
    zoom: 14,
    description: 'Vành đai xanh KCN Trà Nóc, Quốc lộ 91, Công viên văn hóa Ô Môn.',
    agency: 'Ban Quản lý Dự án & Hạ tầng Đô thị Q. Ô Môn',
    areaKm2: 125.4,
    targetTrees: 7200,
    color: '#d97706',
  },
  {
    id: 'phong-dien',
    name: 'Huyện Phong Điền (Vành đai Xanh Sinh thái Miệt vườn)',
    shortName: '🍃 H. Phong Điền',
    type: 'COUNTY',
    center: [9.9950, 105.6950],
    zoom: 14,
    description: 'Lá phổi xanh đô thị, du lịch sinh thái sông nước, tuyến Nguyễn Văn Cừ nối dài & Lộ Vòng Cung.',
    agency: 'Phòng Tài nguyên Môi trường & Đô thị H. Phong Điền',
    areaKm2: 125.3,
    targetTrees: 15000,
    color: '#16a34a',
  },
];

/**
 * Identify which zone a tree belongs to
 */
export function getTreeZoneId(tree: Tree): string {
  const addr = (tree.address || '').toLowerCase();
  const name = (tree.displayName || '').toLowerCase();
  const milestone = (tree.houseNumberMilestone || '').toLowerCase();
  const text = `${addr} ${name} ${milestone}`;

  if (text.includes('cái răng') || text.includes('hưng phú') || text.includes('phú thứ') || text.includes('võ nguyên giáp') || text.includes('quang trung')) {
    return 'cai-rang';
  }
  if (text.includes('bình thủy') || text.includes('võ văn kiệt') || text.includes('an thới') || text.includes('sân bay') || text.includes('bùi hữu nghĩa')) {
    return 'binh-thuy';
  }
  if (text.includes('ô môn') || text.includes('trà nóc') || text.includes('ql91') || text.includes('quốc lộ 91')) {
    return 'o-mon';
  }
  if (text.includes('phong điền') || text.includes('mỹ khánh') || text.includes('lộ vòng cung') || text.includes('nguyễn văn cừ nối dài')) {
    return 'phong-dien';
  }
  // Default to central district Ninh Kiều
  return 'ninh-kieu';
}
