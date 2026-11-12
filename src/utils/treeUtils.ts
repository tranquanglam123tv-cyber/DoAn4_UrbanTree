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
 * Lấy tên Tuyến đường / Dãy cây gom nhóm (Tự động thích ứng linh hoạt theo dữ liệu nhập vào)
 */
export function getTreeCorridor(tree: Tree): string {
  if (tree.streetCorridor && tree.streetCorridor.trim()) return tree.streetCorridor.trim();
  const addr = tree.address || '';
  if (addr.includes('Hòa Bình')) return 'Đại Lộ Hòa Bình';
  if (addr.includes('30 Tháng 4') || addr.includes('30/4')) return 'Đường 30 Tháng 4';
  if (addr.includes('3 Tháng 2') || addr.includes('3/2')) return 'Đại Lộ 3 Tháng 2';
  if (addr.includes('Mậu Thân')) return 'Đường Mậu Thân';
  if (addr.includes('Nguyễn Văn Cừ')) return 'Đường Nguyễn Văn Cừ';
  if (addr.includes('Lý Tự Trọng')) return 'Đường Lý Tự Trọng';
  if (addr.includes('Trần Hưng Đạo')) return 'Đường Trần Hưng Đạo';
  if (addr.includes('Cách Mạng Tháng 8') || addr.includes('CMT8')) return 'Đường Cách Mạng Tháng 8';
  if (addr.includes('Hai Bà Trưng')) return 'Bến Ninh Kiều (Hai Bà Trưng)';
  if (addr.includes('Lưu Hữu Phước')) return 'Công Viên Lưu Hữu Phước';
  if (addr.includes('Phan Đình Phùng')) return 'Đường Phan Đình Phùng';
  if (addr.includes('Võ Văn Kiệt')) return 'Đại Lộ Võ Văn Kiệt';
  if (addr.includes('Nguyễn Trãi')) return 'Đường Nguyễn Trãi';
  if (addr.includes('Trần Phú')) return 'Đường Trần Phú';
  if (addr.includes('Quang Trung')) return 'Đường Quang Trung';

  // Fallback: Lấy phần đầu của địa chỉ (trước dấu phẩy) nếu là tên đường
  const firstSegment = addr.split(',')[0]?.trim();
  if (firstSegment && !firstSegment.startsWith('Số ') && !firstSegment.startsWith('Trước số ')) {
    return firstSegment;
  }
  return 'Tuyến Đường Trung Tâm';
}

/**
 * 🗺️ Trích xuất Địa phương / Khu vực tổng quát (Quận/Huyện, Tỉnh/Thành phố)
 * Hỗ trợ lọc đa cấp từ toàn quốc: Cái Răng, Ninh Kiều, Bình Thủy (Cần Thơ), Đà Nẵng, Hà Nội, TP.HCM...
 */
export function getTreeGeneralArea(tree: Tree): string {
  const addr = (tree.address || '').toLowerCase();
  const corr = (tree.streetCorridor || '').toLowerCase();
  const full = `${addr} ${corr}`;

  // 1. Kiểm tra Cần Thơ trước nếu địa chỉ ghi rõ Cần Thơ hoặc các quận Cần Thơ
  const isExplicitCanTho = full.includes('cần thơ') || full.includes('can tho');
  
  if (full.includes('cái răng') || full.includes('cai rang')) return 'Quận Cái Răng (Cần Thơ)';
  if (full.includes('bình thủy') || full.includes('binh thuy')) return 'Quận Bình Thủy (Cần Thơ)';
  if (full.includes('ô môn') || full.includes('o mon')) return 'Quận Ô Môn (Cần Thơ)';
  if (full.includes('thốt nốt') || full.includes('thot not')) return 'Quận Thốt Nốt (Cần Thơ)';
  if (full.includes('phong điền') || full.includes('phong dien')) return 'Huyện Phong Điền (Cần Thơ)';
  if (full.includes('thới lai') || full.includes('thoi lai')) return 'Huyện Thới Lai (Cần Thơ)';
  if (full.includes('cờ đỏ') || full.includes('co do')) return 'Huyện Cờ Đỏ (Cần Thơ)';
  if (full.includes('vĩnh thạnh') || full.includes('vinh thanh')) return 'Huyện Vĩnh Thạnh (Cần Thơ)';
  if (full.includes('ninh kiều') || full.includes('ninh kieu')) return 'Quận Ninh Kiều (Cần Thơ)';

  if (isExplicitCanTho) return 'TP. Cần Thơ';

  // 2. Các tỉnh/thành phố lớn ngoài Cần Thơ
  if (full.includes('đà nẵng') || full.includes('da nang')) {
    if (full.includes('hải châu')) return 'Quận Hải Châu (Đà Nẵng)';
    if (full.includes('sơn trà')) return 'Quận Sơn Trà (Đà Nẵng)';
    if (full.includes('ngũ hành sơn')) return 'Quận Ngũ Hành Sơn (Đà Nẵng)';
    if (full.includes('thanh khê')) return 'Quận Thanh Khê (Đà Nẵng)';
    if (full.includes('cẩm lệ')) return 'Quận Cẩm Lệ (Đà Nẵng)';
    return 'TP. Đà Nẵng';
  }
  if (full.includes('hà nội') || full.includes('ha noi')) {
    if (full.includes('hoàn kiếm')) return 'Quận Hoàn Kiếm (Hà Nội)';
    if (full.includes('ba đình')) return 'Quận Ba Đình (Hà Nội)';
    if (full.includes('tây hồ')) return 'Quận Tây Hồ (Hà Nội)';
    if (full.includes('cầu giấy')) return 'Quận Cầu Giấy (Hà Nội)';
    return 'TP. Hà Nội';
  }
  if (full.includes('hồ chí minh') || full.includes('tp.hcm') || full.includes('sài gòn') || full.includes('saigon')) {
    if (full.includes('thủ đức')) return 'TP. Thủ Đức (TP.HCM)';
    if (full.includes('quận 1') || full.includes('q.1')) return 'Quận 1 (TP.HCM)';
    if (full.includes('quận 3') || full.includes('q.3')) return 'Quận 3 (TP.HCM)';
    if (full.includes('quận 7') || full.includes('q.7')) return 'Quận 7 (TP.HCM)';
    return 'TP. Hồ Chí Minh';
  }
  if (full.includes('hải phòng') || full.includes('hai phong')) return 'TP. Hải Phòng';
  if (full.includes('huế') || full.includes('thừa thiên')) return 'TP. Huế';

  // 3. Fallback: Tách theo dấu phẩy từ cuối địa chỉ
  const parts = (tree.address || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const districtPart = parts[parts.length - 2];
    const cityPart = parts[parts.length - 1];
    if (districtPart && cityPart && !districtPart.toLowerCase().includes('phường')) {
      return `${districtPart} (${cityPart})`;
    }
    return cityPart || districtPart;
  }

  return 'Quận Ninh Kiều (Cần Thơ)';
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

/**
 * ⏱️ TÍNH TOÁN SLA (SERVICE LEVEL AGREEMENT) PHẢN ỨNG NHANH SỰ CỐ ĐÔ THỊ
 * Tiêu chuẩn cam kết thời gian ứng cứu:
 * - CRITICAL: 30 phút (Cây ngã đổ, đè đường, đứt dây điện, nguy hiểm tính mạng)
 * - HIGH: 120 phút (2 giờ - Nhánh lớn rạn nứt, cản trở giao thông)
 * - MEDIUM: 24 giờ (Sâu bệnh, nhánh khô gãy rải rác)
 * - LOW: 48 giờ (Bong tróc rễ nhẹ, cần khảo sát)
 */
export interface IncidentSLAResult {
  limitMinutes: number;
  limitLabel: string;
  elapsedMinutes: number;
  remainingMinutes: number;
  isOverdue: boolean;
  isResolved: boolean;
  statusText: string;
  badgeClass: string;
  percentUsed: number;
}

export function calculateIncidentSLA(incident: {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
}): IncidentSLAResult {
  // 1. Định mức SLA theo mức độ khẩn cấp (phút)
  const SLA_LIMITS: Record<string, { minutes: number; label: string }> = {
    CRITICAL: { minutes: 30, label: '30 phút' },
    HIGH: { minutes: 120, label: '2 giờ' },
    MEDIUM: { minutes: 1440, label: '24 giờ' },
    LOW: { minutes: 2880, label: '48 giờ' },
  };

  const config = SLA_LIMITS[incident.severity] || SLA_LIMITS.MEDIUM;
  const createdTime = new Date(incident.createdAt).getTime();
  const isResolved = incident.status === 'RESOLVED';
  const endTime = isResolved && incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : Date.now();

  const elapsedMs = Math.max(0, endTime - createdTime);
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
  const remainingMinutes = config.minutes - elapsedMinutes;
  const isOverdue = remainingMinutes < 0;

  // Tính % thời gian đã tiêu tốn
  const percentUsed = Math.min(Math.round((elapsedMinutes / config.minutes) * 100), 100);

  // Helper format thời gian trễ / quá hạn thông minh (theo giờ, quá 24h thì theo ngày)
  const formatDurationSmart = (totalMinutes: number): string => {
    const mins = Math.abs(totalMinutes);
    if (mins < 60) {
      return `${mins} phút`;
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) {
      return remMins > 0 ? `${hours} giờ ${remMins} phút` : `${hours} giờ`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days} ngày ${remHours} giờ` : `${days} ngày`;
  };

  let statusText = '';
  let badgeClass = '';

  if (isResolved) {
    if (isOverdue) {
      const delayText = formatDurationSmart(remainingMinutes);
      statusText = `Đã xong (Trễ hạn SLA: ${delayText})`;
      badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    } else {
      statusText = `Đạt chuẩn SLA (${formatDurationSmart(elapsedMinutes)} / ${config.label})`;
      badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  } else {
    if (isOverdue) {
      const overdueText = formatDurationSmart(remainingMinutes);
      statusText = `🚨 VI PHẠM SLA: Quá hạn ${overdueText}!`;
      badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700 animate-pulse font-bold';
    } else {
      const remText = formatDurationSmart(remainingMinutes);
      if (percentUsed >= 70) {
        statusText = `⚠️ Khẩn cấp: Còn ${remText} (SLA ${config.label})`;
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold';
      } else {
        statusText = `🟢 Trong hạn SLA: Còn ${remText}`;
        badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      }
    }
  }

  return {
    limitMinutes: config.minutes,
    limitLabel: config.label,
    elapsedMinutes,
    remainingMinutes,
    isOverdue,
    isResolved,
    statusText,
    badgeClass,
    percentUsed,
  };
}

/**
 * ⛈️ KIỂM TRA CÂY CẦN CẮT TỈA TRƯỚC MÙA MƯA BÃO (PRE-STORM PRUNING AUDIT)
 * Tiêu chí:
 * - Cây Loại 2 hoặc Di sản Loại 3 (hoặc H >= 7m, D >= 25cm)
 * - Chưa có nhật ký chăm sóc PRUNING trong vòng 180 ngày qua (hoặc chưa bao giờ cắt tỉa)
 */
export function isStormSeasonPruningNeeded(
  tree: Tree,
  careRecords: Array<{ treeId: string; actionType: string; performedAt: string }> = []
): {
  isNeeded: boolean;
  reason: string;
  daysSinceLastPruning: number | null;
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'NORMAL';
} {
  const h = tree.heightM || 8;
  const d = tree.diameterCm || 25;
  const isLargeTree = h >= 7 || d >= 25 || tree.classification === 'HERITAGE' || tree.classification === 'TYPE_2';

  if (!isLargeTree) {
    return {
      isNeeded: false,
      reason: 'Cây nhỏ/mới trồng, tán gọn gàng, ít nguy cơ gãy đổ',
      daysSinceLastPruning: null,
      urgencyLevel: 'NORMAL',
    };
  }

  // Tìm lần cắt tỉa gần nhất
  const pruningRecords = careRecords
    .filter((r) => r.treeId === tree.id && r.actionType === 'PRUNING')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  if (pruningRecords.length === 0) {
    return {
      isNeeded: true,
      reason: 'Chưa có lịch sử cắt tỉa cành hạ độ cao. Cần rà soát ngay trước mùa bão!',
      daysSinceLastPruning: null,
      urgencyLevel: 'HIGH',
    };
  }

  const lastPruningDate = new Date(pruningRecords[0].performedAt).getTime();
  const daysSince = Math.floor((Date.now() - lastPruningDate) / (24 * 60 * 60 * 1000));

  if (daysSince >= 180) {
    return {
      isNeeded: true,
      reason: `Đã ${daysSince} ngày chưa tỉa cành đón gió bão (>6 tháng). Cần hạ độ cao tán lá.`,
      daysSinceLastPruning: daysSince,
      urgencyLevel: daysSince >= 270 ? 'HIGH' : 'MEDIUM',
    };
  }

  return {
    isNeeded: false,
    reason: `Đã cắt tỉa cách đây ${daysSince} ngày (Đạt chuẩn an toàn mùa mưa bão).`,
    daysSinceLastPruning: daysSince,
    urgencyLevel: 'NORMAL',
  };
}

// ==========================================
// 🌲 MA TRẬN ĐÁNH GIÁ RỦI RO CÂY XANH CHUẨN QUỐC TẾ (ISA TRAQ)
// International Society of Arboriculture - Tree Risk Assessment Qualification
// ==========================================

export interface ISATraqResult {
  rating: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  score: number; // 3 - 12
  color: string;
  badgeClass: string;
  likelihood: 'Thấp' | 'Trung bình' | 'Cao' | 'Sắp xảy ra (Imminent)';
  consequences: 'Nhẹ' | 'Vừa' | 'Nặng' | 'Cực kỳ nghiêm trọng';
  actionRecommendation: string;
}

export function calculateISATraqRating(tree: Tree): ISATraqResult {
  const tilt = tree.tiltAngleDeg ?? 0;
  const hollow = tree.hollowRatioPercent ?? 0;
  const health = tree.healthStatus;
  const isDeadOrCritical = health === 'DEAD' || health === 'CRITICAL';

  let riskPoints = 0;

  // 1. Góc nghiêng (Tilt Angle: 0 - 45°)
  if (tilt >= 25) riskPoints += 4;
  else if (tilt >= 15) riskPoints += 3;
  else if (tilt >= 8) riskPoints += 2;
  else riskPoints += 1;

  // 2. Độ rỗng thân (Hollow Ratio theo siêu âm Arbotom: 0 - 100%)
  if (hollow >= 55) riskPoints += 4;
  else if (hollow >= 35) riskPoints += 3;
  else if (hollow >= 20) riskPoints += 2;
  else riskPoints += 1;

  // 3. Sức khỏe lâm sinh
  if (isDeadOrCritical) riskPoints += 4;
  else if (health === 'POOR') riskPoints += 3;
  else if (health === 'FAIR') riskPoints += 2;
  else riskPoints += 1;

  // Phân hạng ma trận ISA TRAQ
  if (isDeadOrCritical || riskPoints >= 10 || (tilt >= 20 && hollow >= 45)) {
    return {
      rating: 'EXTREME',
      score: Math.min(riskPoints, 12),
      color: '#ef4444',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700',
      likelihood: 'Sắp xảy ra (Imminent)',
      consequences: 'Cực kỳ nghiêm trọng',
      actionRecommendation: 'CẦN XỬ LÝ KHẨN CẤP: Lập biên bản đốn hạ giải tỏa nguy hiểm hoặc giằng néo chịu lực ngay trong 24h đón bão!',
    };
  }

  if (riskPoints >= 8 || tilt >= 15 || hollow >= 40) {
    return {
      rating: 'HIGH',
      score: riskPoints,
      color: '#f97316',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-200 border-orange-300 dark:border-orange-700',
      likelihood: 'Cao',
      consequences: 'Nặng',
      actionRecommendation: 'RỦI RO CAO: Điều động xe thang hạ 30% tán lá đón gió bão, giải tỏa cành sà và siêu âm rễ.',
    };
  }

  if (riskPoints >= 6 || tilt >= 10 || hollow >= 20) {
    return {
      rating: 'MODERATE',
      score: riskPoints,
      color: '#eab308',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      likelihood: 'Trung bình',
      consequences: 'Vừa',
      actionRecommendation: 'RỦI RO TRUNG BÌNH: Đưa vào danh mục theo dõi định kỳ 3 tháng/lần, gia cố cọc chống nếu cần.',
    };
  }

  return {
    rating: 'LOW',
    score: riskPoints,
    color: '#10b981',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    likelihood: 'Thấp',
    consequences: 'Nhẹ',
    actionRecommendation: 'AN TOÀN BÌNH THƯỜNG: Cây sinh trưởng tốt, bộ rễ vững, duy trì chu kỳ cắt tỉa làm cỏ hàng năm.',
  };
}


