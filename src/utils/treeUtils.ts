/**
 * UrbanTree - Tree Street Coding & Radar GPS Utilities
 */
import { Tree } from '../types';

export interface StreetCorridorDef {
  id: string;
  name: string;
  prefix: string;
  district: string;
  description: string;
}

export const STREET_CORRIDORS_LIST: StreetCorridorDef[] = [
  {
    id: 'corridor-hoa-binh',
    name: 'Đại Lộ Hòa Bình',
    prefix: 'HB',
    district: 'Q. Ninh Kiều',
    description: 'Tuyến đường huyết mạch trung tâm TP. Cần Thơ · Bàng Đài Loan thẳng tắp',
  },
  {
    id: 'corridor-30-thang-4',
    name: 'Đường 30 Tháng 4',
    prefix: '30T4',
    district: 'Q. Ninh Kiều',
    description: 'Tuyến phố thương mại sầm uất · Hàng Me Tây cổ thụ che bóng mát',
  },
  {
    id: 'corridor-luu-huu-phuoc',
    name: 'Công Viên Lưu Hữu Phước',
    prefix: 'LHP',
    district: 'Q. Ninh Kiều',
    description: 'Lá phổi xanh trung tâm · Sao Đen đại mộc & Giáng Hương bản địa',
  },
  {
    id: 'corridor-hai-ba-trung',
    name: 'Bến Ninh Kiều (Hai Bà Trưng)',
    prefix: 'HBT',
    district: 'Q. Ninh Kiều',
    description: 'Dải công viên ven sông Hậu · Cây Lộc Vừng & Dầu Rái xanh mát',
  },
  {
    id: 'corridor-3-thang-2',
    name: 'Đại Lộ 3 Tháng 2',
    prefix: '3T2',
    district: 'Q. Ninh Kiều',
    description: 'Trục đường giáo dục kết nối ĐH Cần Thơ · Hàng Cây Bàng & Bọ Cạp Vàng',
  },
  {
    id: 'corridor-nguyen-trai',
    name: 'Đường Nguyễn Trãi',
    prefix: 'NT',
    district: 'Q. Ninh Kiều',
    description: 'Tuyến phố mua sắm lâu đời · Cây Lim Xẹt & Kèn Hồng rực rỡ',
  },
];

/**
 * Lấy mã hiệu tuyến đường chuẩn (ví dụ: HB-01, 30T4-03)
 */
export function getTreeStreetCode(tree: Tree): string {
  if (tree.streetCode) return tree.streetCode;
  if (tree.address.includes('Hòa Bình')) {
    const num = tree.publicCode.replace(/\D/g, '') || '01';
    return `HB-${num.padStart(2, '0')}`;
  }
  if (tree.address.includes('30 Tháng 4') || tree.address.includes('30/4')) {
    const num = tree.publicCode.replace(/\D/g, '') || '01';
    return `30T4-${num.padStart(2, '0')}`;
  }
  if (tree.address.includes('Lưu Hữu Phước')) {
    const num = tree.publicCode.replace(/\D/g, '') || '01';
    return `LHP-${num.padStart(2, '0')}`;
  }
  const prefix = tree.publicCode.split('-')[0] || 'CT';
  const num = tree.publicCode.replace(/\D/g, '') || '01';
  return `${prefix}-${num.padStart(2, '0')}`;
}

/**
 * Lấy cột mốc số nhà định danh thực địa
 */
export function getTreeMilestone(tree: Tree): string {
  if (tree.houseNumberMilestone) return tree.houseNumberMilestone;
  const parts = tree.address.split(',');
  return parts[0].trim();
}

/**
 * Lấy tên Tuyến đường / Dãy cây gom nhóm
 */
export function getTreeCorridor(tree: Tree): string {
  if (tree.streetCorridor) return tree.streetCorridor;
  if (tree.address.includes('Hòa Bình')) return 'Đại Lộ Hòa Bình';
  if (tree.address.includes('30 Tháng 4') || tree.address.includes('30/4')) return 'Đường 30 Tháng 4';
  if (tree.address.includes('Lưu Hữu Phước')) return 'Công Viên Lưu Hữu Phước';
  if (tree.address.includes('Ninh Kiều')) return 'Bến Ninh Kiều';
  return 'Tuyến Đường Trung Tâm';
}

/**
 * Chuỗi nhãn hiển thị đầy đủ theo chuẩn:
 * [HB-01] · Cây Bàng Đài Loan #01 · Trước số 12 Đại lộ Hòa Bình
 */
export function getTreeFullDisplayLabel(tree: Tree): string {
  const code = getTreeStreetCode(tree);
  const milestone = getTreeMilestone(tree);
  return `[${code}] · ${tree.displayName} · ${milestone}`;
}

/**
 * Tính khoảng cách địa lý Haversine (đơn vị: mét)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // làm tròn đến 0.1 mét
}

/**
 * Tìm cây gần nhất trong danh sách dựa trên toạ độ GPS
 */
export function findNearestTree(
  currentLat: number,
  currentLng: number,
  trees: Tree[]
): { tree: Tree; distanceM: number } | null {
  if (!trees || trees.length === 0) return null;

  let nearest = trees[0];
  let minDistance = calculateHaversineDistance(currentLat, currentLng, nearest.latitude, nearest.longitude);

  for (let i = 1; i < trees.length; i++) {
    const t = trees[i];
    const d = calculateHaversineDistance(currentLat, currentLng, t.latitude, t.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = t;
    }
  }

  return { tree: nearest, distanceM: minDistance };
}

/**
 * 🌳 PHÂN CẤP CÂY ĐÔ THỊ THEO THÔNG TƯ 20/2020/TT-BXD
 * - Cây Loại 1: D < 20cm, H < 6m (Cây con, mới trồng)
 * - Cây Loại 2: D 20-50cm, H 6-12m (Cây trưởng thành vỉa hè)
 * - Cây Loại 3: D > 50cm, H > 12m hoặc cây cổ thụ bảo tồn di sản (CẤM ĐỐN HẠ)
 */
export function getTreeClassification(tree: {
  diameterCm?: number;
  heightM?: number;
  classification?: string;
}): {
  key: 'TYPE_1' | 'TYPE_2' | 'HERITAGE';
  label: string;
  badgeClass: string;
  legalNote: string;
  isProtected: boolean;
} {
  const d = tree.diameterCm || 25;
  const h = tree.heightM || 8;

  if (tree.classification === 'HERITAGE' || d >= 50 || h >= 12) {
    return {
      key: 'HERITAGE',
      label: 'Cây Cổ Thụ Loại 3 (Di Sản / Bảo Tồn)',
      badgeClass: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      legalNote: '⚠️ CẤM ĐỐN HẠ: Cây thuộc danh mục bảo tồn đô thị. Mọi tác động đốn hạ phải có phê duyệt từ UBND Tỉnh/Thành phố hoặc Sở Xây Dựng!',
      isProtected: true,
    };
  }

  if (d >= 20 || h >= 6) {
    return {
      key: 'TYPE_2',
      label: 'Cây Trưởng Thành Loại 2',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      legalNote: 'Duy tu cắt tỉa hạ độ cao theo lịch trước mùa mưa bão (Đường kính 20–50cm, Cao 6–12m).',
      isProtected: false,
    };
  }

  return {
    key: 'TYPE_1',
    label: 'Cây Trẻ / Mới Trồng Loại 1',
    badgeClass: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    legalNote: 'Cần chống cọc giữ gốc và tưới dưỡng ẩm thường xuyên (Đường kính < 20cm, Cao < 6m).',
    isProtected: false,
  };
}

/**
 * 🌿 TÍNH TOÁN SINH KHỐI & HẤP THỤ CARBON (CO2) CHUẨN KHOA HỌC ALLOMETRIC (i-Tree Eco)
 * Công thức Allometric lâm sinh: Biomass = 0.0673 * (woodDensity * DBH^2 * H)^0.976
 * Lượng CO2 cô lập hàng năm = Sinh khối tích lũy * 0.5 (tỷ lệ Carbon) * (44/12 tỷ số phân tử CO2)
 */
export function calculateAllometricCarbon(tree: {
  diameterCm?: number;
  heightM?: number;
  woodDensity?: number;
}): {
  biomassKg: number;
  co2SequestrationKgYear: number;
  oxygenProductionKgYear: number;
  rootProtectionRadiusM: number;
} {
  const dbh = tree.diameterCm || 25; // DBH (cm)
  const h = tree.heightM || 8; // Chiều cao (m)
  const rho = tree.woodDensity || 0.65; // Tỷ trọng gỗ khô (g/cm3)

  // 1. Sinh khối trên mặt đất (Aboveground Biomass) theo Chave et al. (2014)
  const biomassKg = Math.round(0.0673 * Math.pow(rho * Math.pow(dbh, 2) * h, 0.976));

  // 2. Lượng hấp thụ CO2 hàng năm (kg CO2/năm)
  // Cây hấp thụ trung bình tích lũy sinh khối hàng năm ~ 3.5% - 5% tổng sinh khối
  const annualBiomassGrowth = Math.max(biomassKg * 0.045, 1.2);
  const co2SequestrationKgYear = Math.round(annualBiomassGrowth * 0.5 * (44 / 12) * 10) / 10;

  // 3. Lượng Oxy giải phóng tương đương (1 phân tử CO2 hấp thụ giải phóng 1 phân tử O2)
  const oxygenProductionKgYear = Math.round(co2SequestrationKgYear * (32 / 44) * 10) / 10;

  // 4. Bán kính vùng bảo vệ rễ an toàn (Root Protection Zone - RPZ) theo tiêu chuẩn BS 5837
  // RPZ = DBH (cm) * 0.12 (m)
  const rootProtectionRadiusM = Math.max(Math.round(dbh * 0.12 * 10) / 10, 1.5);

  return {
    biomassKg,
    co2SequestrationKgYear,
    oxygenProductionKgYear,
    rootProtectionRadiusM,
  };
}


