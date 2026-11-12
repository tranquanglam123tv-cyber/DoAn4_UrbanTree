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

