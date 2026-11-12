/**
 * UrbanTree - Management Zones & Multi-District Jurisdiction for Cần Thơ City & National Provinces
 */

import { Tree } from '../types';

export interface UrbanZone {
  id: string;
  provinceId: string;
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

export interface ProvinceDef {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  center: [number, number];
  zoom: number;
  agency: string;
  description: string;
  zones: UrbanZone[];
}

export const CAN_THO_ZONES: UrbanZone[] = [
  {
    id: 'all',
    provinceId: 'can-tho',
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
    provinceId: 'can-tho',
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
    provinceId: 'can-tho',
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
    provinceId: 'can-tho',
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
    provinceId: 'can-tho',
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
    provinceId: 'can-tho',
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

export const DA_NANG_ZONES: UrbanZone[] = [
  {
    id: 'all',
    provinceId: 'da-nang',
    name: 'Toàn TP. Đà Nẵng (Đô thị Biển & Đáng Sống)',
    shortName: '🌐 Toàn Đà Nẵng',
    type: 'CITY_ALL',
    center: [16.0544, 108.2022],
    zoom: 13,
    description: 'Hạ tầng cây xanh đô thị ven biển, sông Hàn & bán đảo Sơn Trà.',
    agency: 'Sở Xây Dựng TP. Đà Nẵng · Công ty Công viên Cây xanh Đà Nẵng',
    areaKm2: 1285,
    targetTrees: 45000,
    color: '#0284c7',
  },
  {
    id: 'hai-chau',
    provinceId: 'da-nang',
    name: 'Quận Hải Châu (Trung tâm Hành chính & Thương mại)',
    shortName: '🏛️ Q. Hải Châu',
    type: 'DISTRICT',
    center: [16.0610, 108.2205],
    zoom: 15,
    description: 'Trục đường Bạch Đằng, Trần Phú, 2 Tháng 9, Cầu Rồng, Công viên APEC.',
    agency: 'Phòng Quản lý Đô thị Q. Hải Châu',
    areaKm2: 27.1,
    targetTrees: 16000,
    color: '#059669',
  },
  {
    id: 'son-tra',
    provinceId: 'da-nang',
    name: 'Quận Sơn Trà (Bán đảo Du lịch & Sinh thái Biển)',
    shortName: '🌊 Q. Sơn Trà',
    type: 'DISTRICT',
    center: [16.0820, 108.2430],
    zoom: 14,
    description: 'Dải cây xanh ven biển Võ Nguyên Giáp, Phạm Văn Đồng, Khu bảo tồn Sơn Trà.',
    agency: 'Phòng Tài nguyên & Đô thị Q. Sơn Trà',
    areaKm2: 60.0,
    targetTrees: 14000,
    color: '#0ea5e9',
  },
  {
    id: 'ngu-hanh-son',
    provinceId: 'da-nang',
    name: 'Quận Ngũ Hành Sơn (Cảnh quan Non Nước & Resort)',
    shortName: '⛰️ Q. Ngũ Hành Sơn',
    type: 'DISTRICT',
    center: [16.0020, 108.2560],
    zoom: 14,
    description: 'Trục đường Lê Văn Hiến, Trường Sa ven biển, Quần thể danh thắng Ngũ Hành Sơn.',
    agency: 'Phòng Quản lý Đô thị Q. Ngũ Hành Sơn',
    areaKm2: 37.0,
    targetTrees: 9000,
    color: '#8b5cf6',
  },
  {
    id: 'thanh-khe',
    provinceId: 'da-nang',
    name: 'Quận Thanh Khê (Đô thị Cửa ngõ Vịnh Đà Nẵng)',
    shortName: '🏙️ Q. Thanh Khê',
    type: 'DISTRICT',
    center: [16.0650, 108.1880],
    zoom: 14,
    description: 'Tuyến đường Nguyễn Tất Thành ven vịnh, Điện Biên Phủ, Công viên 29/3.',
    agency: 'Phòng Quản lý Đô thị Q. Thanh Khê',
    areaKm2: 9.5,
    targetTrees: 7500,
    color: '#f59e0b',
  },
  {
    id: 'cam-le',
    provinceId: 'da-nang',
    name: 'Quận Cẩm Lệ (Đô thị Mới Nam Sông Cẩm Lệ)',
    shortName: '🌸 Q. Cẩm Lệ',
    type: 'DISTRICT',
    center: [16.0180, 108.1960],
    zoom: 14,
    description: 'Đại lộ Cách Mạng Tháng 8, Nguyễn Hữu Thọ, Vành đai xanh bờ sông.',
    agency: 'Phòng Quản lý Đô thị Q. Cẩm Lệ',
    areaKm2: 33.8,
    targetTrees: 8000,
    color: '#ec4899',
  },
];

export const HCM_ZONES: UrbanZone[] = [
  {
    id: 'all',
    provinceId: 'hcm',
    name: 'Toàn TP. Hồ Chí Minh (Đô thị Đặc biệt & Đầu tàu Kinh tế)',
    shortName: '🌐 Toàn TP.HCM',
    type: 'CITY_ALL',
    center: [10.8231, 106.6297],
    zoom: 12,
    description: 'Mạng lưới cây xanh đô thị, công viên cảnh quan và mảng xanh 22 quận huyện.',
    agency: 'Sở Xây Dựng TP.HCM · Trung tâm Quản lý Hạ tầng Kỹ thuật (CITI)',
    areaKm2: 2095,
    targetTrees: 120000,
    color: '#059669',
  },
  {
    id: 'quan-1',
    provinceId: 'hcm',
    name: 'Quận 1 (Trung tâm Lịch sử & Công viên Cổ thụ)',
    shortName: '🏛️ Quận 1',
    type: 'DISTRICT',
    center: [10.7769, 106.7009],
    zoom: 15,
    description: 'Công viên Tao Đàn, Thảo Cầm Viên, Đường Lê Duẩn, Nguyễn Huệ, Đồng Khởi.',
    agency: 'Công ty TNHH MTV Công viên Cây xanh TP.HCM',
    areaKm2: 7.7,
    targetTrees: 18000,
    color: '#10b981',
  },
  {
    id: 'quan-3',
    provinceId: 'hcm',
    name: 'Quận 3 (Khu Biệt thự Di sản & Đại thụ Me Tây)',
    shortName: '🌳 Quận 3',
    type: 'DISTRICT',
    center: [10.7844, 106.6844],
    zoom: 15,
    description: 'Đường Tú Xương, Trương Định, Nam Kỳ Khởi Nghĩa, Hồ Con Rùa.',
    agency: 'Phòng Quản lý Đô thị Quận 3',
    areaKm2: 4.9,
    targetTrees: 9500,
    color: '#0284c7',
  },
  {
    id: 'thu-duc',
    provinceId: 'hcm',
    name: 'TP. Thủ Đức (Đô thị Sáng tạo & Công viên Sinh thái)',
    shortName: '🚀 TP. Thủ Đức',
    type: 'DISTRICT',
    center: [10.8494, 106.7718],
    zoom: 13,
    description: 'Khu Đô thị Thủ Thiêm, Xa lộ Hà Nội, Công viên Lịch sử Văn hóa Dân tộc.',
    agency: 'Phòng Quản lý Đô thị TP. Thủ Đức',
    areaKm2: 211,
    targetTrees: 35000,
    color: '#6366f1',
  },
  {
    id: 'quan-7',
    provinceId: 'hcm',
    name: 'Quận 7 & Phú Mỹ Hưng (Đô thị Xanh & Sông nước)',
    shortName: '🌉 Quận 7',
    type: 'DISTRICT',
    center: [10.7340, 106.7190],
    zoom: 14,
    description: 'Đại lộ Nguyễn Văn Linh, Nguyễn Thị Thập, Hồ Bán Nguyệt Phú Mỹ Hưng.',
    agency: 'Phòng Quản lý Đô thị Quận 7',
    areaKm2: 35.3,
    targetTrees: 22000,
    color: '#0ea5e9',
  },
];

export const HA_NOI_ZONES: UrbanZone[] = [
  {
    id: 'all',
    provinceId: 'ha-noi',
    name: 'Toàn TP. Hà Nội (Thủ đô Ngàn năm Văn hiến)',
    shortName: '🌐 Toàn Hà Nội',
    type: 'CITY_ALL',
    center: [21.0285, 105.8542],
    zoom: 12,
    description: 'Quần thể cây xanh di sản, hồ nước tự nhiên và hệ sinh thái thủ đô.',
    agency: 'Sở Xây Dựng Hà Nội · Công ty TNHH MTV Công viên Cây xanh Hà Nội',
    areaKm2: 3359,
    targetTrees: 95000,
    color: '#16a34a',
  },
  {
    id: 'hoan-kiem',
    provinceId: 'ha-noi',
    name: 'Quận Hoàn Kiếm (Cây Di sản Hồ Gươm & Phố Cổ)',
    shortName: '🏛️ Q. Hoàn Kiếm',
    type: 'DISTRICT',
    center: [21.0305, 105.8525],
    zoom: 15,
    description: 'Dải cây Lộc vừng Hồ Gươm, Phố đi bộ Đinh Tiên Hoàng, Tràng Tiền, Lý Thường Kiệt.',
    agency: 'Phòng Quản lý Đô thị Q. Hoàn Kiếm',
    areaKm2: 5.3,
    targetTrees: 12000,
    color: '#059669',
  },
  {
    id: 'ba-dinh',
    provinceId: 'ha-noi',
    name: 'Quận Ba Đình (Trung tâm Chính trị & Cảnh quan Quảng trường)',
    shortName: '⭐ Q. Ba Đình',
    type: 'DISTRICT',
    center: [21.0370, 105.8280],
    zoom: 15,
    description: 'Đường Phan Đình Phùng (Hàng Sấu cổ thụ), Hoàng Diệu, Công viên Bách Thảo.',
    agency: 'Phòng Quản lý Đô thị Q. Ba Đình',
    areaKm2: 9.2,
    targetTrees: 14500,
    color: '#0284c7',
  },
  {
    id: 'tay-ho',
    provinceId: 'ha-noi',
    name: 'Quận Tây Hồ (Vành đai Sinh thái Hồ Tây)',
    shortName: '🌊 Q. Tây Hồ',
    type: 'DISTRICT',
    center: [21.0660, 105.8220],
    zoom: 14,
    description: 'Đường Thanh Niên, Quảng An, Lạc Long Quân, dải công viên cảnh quan ven hồ.',
    agency: 'Phòng Quản lý Đô thị Q. Tây Hồ',
    areaKm2: 24.0,
    targetTrees: 16000,
    color: '#0ea5e9',
  },
  {
    id: 'cau-giay',
    provinceId: 'ha-noi',
    name: 'Quận Cầu Giấy (Đô thị Giáo dục & Công nghệ)',
    shortName: '🏢 Q. Cầu Giấy',
    type: 'DISTRICT',
    center: [21.0360, 105.7900],
    zoom: 14,
    description: 'Công viên Cầu Giấy, Công viên Nghĩa Đô, Đường Cầu Giấy, Xuân Thủy, Hoàng Quốc Việt.',
    agency: 'Phòng Quản lý Đô thị Q. Cầu Giấy',
    areaKm2: 12.1,
    targetTrees: 11000,
    color: '#8b5cf6',
  },
];

export const NATIONAL_PROVINCES: ProvinceDef[] = [
  {
    id: 'all',
    name: 'Toàn quốc (Tất cả Tỉnh / Thành phố)',
    shortName: '🌐 Toàn quốc',
    badge: 'VIETNAM GIS',
    center: [16.0544, 107.5000],
    zoom: 6,
    agency: 'Bộ Xây Dựng · Cục Hạ tầng Kỹ thuật Đô thị Quốc Gia',
    description: 'Cơ sở dữ liệu hạ tầng cây xanh đô thị quốc gia 63 tỉnh thành Việt Nam.',
    zones: [
      {
        id: 'all',
        provinceId: 'all',
        name: 'Tất cả vùng đô thị toàn quốc',
        shortName: '🌐 Toàn bộ cây xanh',
        type: 'CITY_ALL',
        center: [16.0544, 107.5000],
        zoom: 6,
        description: 'Tổng hợp số liệu GIS cây xanh từ tất cả tỉnh thành.',
        agency: 'Cục Hạ tầng Kỹ thuật Đô thị Quốc Gia',
        areaKm2: 331212,
        targetTrees: 1000000,
        color: '#10b981',
      },
    ],
  },
  {
    id: 'can-tho',
    name: 'TP. Cần Thơ (Đô thị Trung tâm Đồng bằng Sông Cửu Long)',
    shortName: '🏙️ TP. Cần Thơ',
    badge: 'CẦN THƠ ECO-GIS',
    center: [10.0345, 105.7650],
    zoom: 13,
    agency: 'Sở Xây Dựng TP. Cần Thơ · Công ty CP Môi trường Đô thị Cần Thơ',
    description: 'Hạ tầng mạng lưới cây xanh đô thị & vành đai sinh thái toàn thành phố Cần Thơ.',
    zones: CAN_THO_ZONES,
  },
  {
    id: 'da-nang',
    name: 'TP. Đà Nẵng (Thành phố Đáng sống & Đô thị Biển)',
    shortName: '🏖️ TP. Đà Nẵng',
    badge: 'ĐÀ NẴNG SMART-GIS',
    center: [16.0544, 108.2022],
    zoom: 13,
    agency: 'Sở Xây Dựng TP. Đà Nẵng · Công ty Công viên Cây xanh Đà Nẵng',
    description: 'Hạ tầng cây xanh đô thị ven biển, sông Hàn & bán đảo Sơn Trà.',
    zones: DA_NANG_ZONES,
  },
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh (Trung tâm Kinh tế & Đô thị Đặc biệt)',
    shortName: '🏢 TP. Hồ Chí Minh',
    badge: 'TP.HCM CITI-GIS',
    center: [10.8231, 106.6297],
    zoom: 12,
    agency: 'Sở Xây Dựng TP.HCM · Trung tâm Quản lý Hạ tầng Kỹ thuật (CITI)',
    description: 'Mạng lưới cây xanh đô thị, công viên cảnh quan và mảng xanh 22 quận huyện.',
    zones: HCM_ZONES,
  },
  {
    id: 'ha-noi',
    name: 'TP. Hà Nội (Thủ đô Ngàn năm Văn hiến & Cây Di sản)',
    shortName: '🏛️ TP. Hà Nội',
    badge: 'HÀ NỘI CAPITAL-GIS',
    center: [21.0285, 105.8542],
    zoom: 12,
    agency: 'Sở Xây Dựng Hà Nội · Công ty TNHH MTV Công viên Cây xanh Hà Nội',
    description: 'Quần thể cây xanh di sản, hồ nước tự nhiên và hệ sinh thái thủ đô.',
    zones: HA_NOI_ZONES,
  },
];

/**
 * 🗺️ Identify which province a tree belongs to
 */
export function getTreeProvinceId(tree: Tree): string {
  const addr = (tree.address || '').toLowerCase();
  const name = (tree.displayName || '').toLowerCase();
  const corr = (tree.streetCorridor || '').toLowerCase();
  const text = `${addr} ${name} ${corr}`;

  // 1. ƯU TIÊN VĂN BẢN ĐỊA CHỈ: Kiểm tra rõ tên Tỉnh / Thành phố
  // Cần Thơ (Ưu tiên số 1 nếu có chữ cần thơ hoặc các quận đặc trưng của Cần Thơ)
  if (
    text.includes('cần thơ') || text.includes('can tho') ||
    text.includes('ninh kiều') || text.includes('bình thủy') ||
    text.includes('cái răng') || text.includes('ô môn') ||
    text.includes('thốt nốt') || text.includes('phong điền')
  ) {
    return 'can-tho';
  }

  // Đà Nẵng
  if (
    text.includes('đà nẵng') || text.includes('da nang') ||
    text.includes('sơn trà') || text.includes('hải châu') ||
    text.includes('ngũ hành sơn') || text.includes('thanh khê') || text.includes('cẩm lệ')
  ) {
    return 'da-nang';
  }

  // Hà Nội
  if (
    text.includes('hà nội') || text.includes('ha noi') ||
    text.includes('hoàn kiếm') || text.includes('ba đình') ||
    text.includes('tây hồ') || text.includes('cầu giấy') || text.includes('đống đa')
  ) {
    return 'ha-noi';
  }

  // TP. Hồ Chí Minh
  if (
    text.includes('hồ chí minh') || text.includes('tp.hcm') ||
    text.includes('sài gòn') || text.includes('saigon') ||
    text.includes('thủ đức') || text.includes('quận 1') ||
    text.includes('quận 3') || text.includes('quận 7')
  ) {
    return 'hcm';
  }

  // 2. FALLBACK TỌA ĐỘ GPS (Chỉ áp dụng khi địa chỉ không ghi rõ tỉnh thành)
  // Đà Nẵng
  if (tree.latitude >= 15.8 && tree.latitude <= 16.3 && tree.longitude >= 108.0 && tree.longitude <= 108.4) {
    return 'da-nang';
  }
  // Hà Nội
  if (tree.latitude >= 20.8 && tree.latitude <= 21.3 && tree.longitude >= 105.6 && tree.longitude <= 106.0) {
    return 'ha-noi';
  }
  // TP.HCM
  if (tree.latitude >= 10.6 && tree.latitude <= 11.0 && tree.longitude >= 106.5 && tree.longitude <= 107.0) {
    return 'hcm';
  }

  // 3. Mặc định là Cần Thơ
  return 'can-tho';
}

/**
 * 🏛️ Identify which zone a tree belongs to (within its province)
 */
export function getTreeZoneId(tree: Tree): string {
  const provId = getTreeProvinceId(tree);
  const addr = (tree.address || '').toLowerCase();
  const name = (tree.displayName || '').toLowerCase();
  const milestone = (tree.houseNumberMilestone || '').toLowerCase();
  const corr = (tree.streetCorridor || '').toLowerCase();
  const text = `${addr} ${name} ${milestone} ${corr}`;

  // Đà Nẵng Zones
  if (provId === 'da-nang') {
    if (text.includes('hải châu') || text.includes('bạch đằng') || text.includes('cầu rồng') || text.includes('2 tháng 9')) return 'hai-chau';
    if (text.includes('sơn trà') || text.includes('võ nguyên giáp') || text.includes('phạm văn đồng')) return 'son-tra';
    if (text.includes('ngũ hành sơn') || text.includes('lê văn hiến') || text.includes('non nước')) return 'ngu-hanh-son';
    if (text.includes('thanh khê') || text.includes('nguyễn tất thành') || text.includes('điện biên phủ')) return 'thanh-khe';
    if (text.includes('cẩm lệ') || text.includes('cách mạng tháng 8') || text.includes('nguyễn hữu thọ')) return 'cam-le';
    return 'hai-chau';
  }

  // HCM Zones
  if (provId === 'hcm') {
    if (text.includes('quận 1') || text.includes('tao đàn') || text.includes('lê duẩn') || text.includes('nguyễn huệ')) return 'quan-1';
    if (text.includes('quận 3') || text.includes('hồ con rùa') || text.includes('tú xương')) return 'quan-3';
    if (text.includes('thủ đức') || text.includes('xa lộ hà nội') || text.includes('thủ thiêm')) return 'thu-duc';
    if (text.includes('quận 7') || text.includes('phú mỹ hưng') || text.includes('nguyễn văn linh')) return 'quan-7';
    return 'quan-1';
  }

  // Hà Nội Zones
  if (provId === 'ha-noi') {
    if (text.includes('hoàn kiếm') || text.includes('hồ gươm') || text.includes('đinh tiên hoàng') || text.includes('tràng tiền')) return 'hoan-kiem';
    if (text.includes('ba đình') || text.includes('phan đình phùng') || text.includes('hoàng diệu')) return 'ba-dinh';
    if (text.includes('tây hồ') || text.includes('hồ tây') || text.includes('thanh niên')) return 'tay-ho';
    if (text.includes('cầu giấy') || text.includes('xuân thủy') || text.includes('nghĩa đô')) return 'cau-giay';
    return 'hoan-kiem';
  }

  // Cần Thơ Zones
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

/**
 * 📍 Get active zones list for a given province
 */
export function getZonesByProvince(provinceId: string): UrbanZone[] {
  const prov = NATIONAL_PROVINCES.find((p) => p.id === provinceId);
  return prov ? prov.zones : CAN_THO_ZONES;
}
