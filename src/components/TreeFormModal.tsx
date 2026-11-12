import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Trees,
  MapPin,
  Check,
  ShieldCheck,
  Camera,
  Compass,
  Layers,
  FileSpreadsheet,
  QrCode,
  Printer,
  Sparkles,
  ArrowRight,
  Radio,
  Navigation,
  Download,
  AlertCircle,
  Tag,
  Eye,
  RefreshCw,
  Upload,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Tree, TreeHealthStatus } from '../types';
import { storage } from '../db/storage';
import {
  STREET_CORRIDORS_LIST,
  getTreeStreetCode,
  findNearestTree,
  calculateHaversineDistance,
  getTreeMilestone,
} from '../utils/treeUtils';
import { DigitalAlloyTag } from './DigitalAlloyTag';

interface TreeFormModalProps {
  tree: Tree | null; // null if adding new
  initialCoords?: { latitude: number; longitude: number; address?: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

export const TreeFormModal: React.FC<TreeFormModalProps> = ({ tree, initialCoords, onClose, onSaved }) => {
  const treeTypes = storage.getTreeTypes();
  const allExistingTrees = storage.getTrees();

  // Mode: Single field calibration VS Bulk corridor import
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Corridor Selection & Auto Coding
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('corridor-hoa-binh');
  const [isBranchInsertion, setIsBranchInsertion] = useState<boolean>(false);
  const [branchSuffix, setBranchSuffix] = useState<string>('B');

  // Single Form fields
  const [publicCode, setPublicCode] = useState(tree?.publicCode || '');
  const [streetCode, setStreetCode] = useState(tree?.streetCode || '');
  const [displayName, setDisplayName] = useState(tree?.displayName || '');
  const [treeTypeId, setTreeTypeId] = useState(tree?.treeTypeId || treeTypes[0]?.id || '');
  const [address, setAddress] = useState(tree?.address || initialCoords?.address || '');
  const [houseMilestone, setHouseMilestone] = useState(tree?.houseNumberMilestone || '');
  const [latitude, setLatitude] = useState(tree?.latitude ?? initialCoords?.latitude ?? 10.036829);
  const [longitude, setLongitude] = useState(tree?.longitude ?? initialCoords?.longitude ?? 105.782541);
  const [plantedAt, setPlantedAt] = useState(tree?.plantedAt || '2023-01-01');
  const [healthStatus, setHealthStatus] = useState<TreeHealthStatus>(tree?.healthStatus || 'GOOD');
  const [diameterCm, setDiameterCm] = useState(tree?.diameterCm || 30);
  const [heightM, setHeightM] = useState(tree?.heightM || 8);
  const [imageUrl, setImageUrl] = useState(tree?.imageUrl || '');
  const [imagePreview, setImagePreview] = useState<string | null>(tree?.imageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Radar GPS State
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [radarResult, setRadarResult] = useState<{
    distanceM: number;
    nearestCode: string;
    nearestName: string;
    suggestedNextCode: string;
  } | null>(null);

  // Preview Tag Toggle
  const [showTagPreview, setShowTagPreview] = useState(false);

  // Bulk Import State
  const [bulkMode, setBulkMode] = useState<'file' | 'corridor'>('file');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedTreesFromFile, setParsedTreesFromFile] = useState<Array<{
    publicCode: string;
    streetCode: string;
    displayName: string;
    treeTypeId: string;
    address: string;
    latitude: number;
    longitude: number;
    diameterCm: number;
    heightM: number;
    healthStatus: TreeHealthStatus;
  }>>([]);
  const [bulkCorridorId, setBulkCorridorId] = useState('corridor-hoa-binh');
  const [bulkTreeTypeId, setBulkTreeTypeId] = useState(treeTypes[0]?.id || '');
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [bulkStartHouseNo, setBulkStartHouseNo] = useState<number>(14);
  const [bulkSpacingM, setBulkSpacingM] = useState<number>(15);
  const [bulkSuccessList, setBulkSuccessList] = useState<Tree[] | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Auto-calculate street code & sequence when corridor or insertion changes
  useEffect(() => {
    if (tree) return; // Không can thiệp nếu đang sửa cây có sẵn

    const currentCorridor = STREET_CORRIDORS_LIST.find((c) => c.id === selectedCorridorId);
    if (!currentCorridor) return;

    // Đếm số cây hiện có thuộc tuyến đường này
    const corridorTrees = allExistingTrees.filter((t) => {
      const code = getTreeStreetCode(t);
      return code.startsWith(currentCorridor.prefix + '-');
    });

    const nextSeq = corridorTrees.length + 1;
    const padSeq = String(nextSeq).padStart(2, '0');
    const baseCode = `${currentCorridor.prefix}-${padSeq}`;
    const finalCode = isBranchInsertion ? `${currentCorridor.prefix}-${padSeq}${branchSuffix}` : baseCode;

    setPublicCode(finalCode);
    setStreetCode(finalCode);

    const typeObj = treeTypes.find((t) => t.id === treeTypeId);
    const typeName = typeObj?.name || 'Cây';
    setDisplayName(`${typeName} #${padSeq} (${currentCorridor.name})`);

    const guessedHouseNo = 10 + nextSeq * 4;
    const guessedMilestone = `Trước số ${guessedHouseNo} ${currentCorridor.name}`;
    setHouseMilestone(guessedMilestone);
    setAddress(`${guessedMilestone}, ${currentCorridor.district}, Cần Thơ`);
  }, [selectedCorridorId, treeTypeId, isBranchInsertion, branchSuffix]);

  // Handler: Bắt GPS thực địa & Quét Radar cây lân cận
  const handleDetectGpsAndRadar = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị GPS Geolocation');
      return;
    }

    setIsGpsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const curLat = Number(pos.coords.latitude.toFixed(6));
        const curLng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(curLat);
        setLongitude(curLng);
        setIsGpsLocating(false);

        // Chạy radar tìm cây gần nhất
        const nearest = findNearestTree(curLat, curLng, allExistingTrees);
        if (nearest) {
          const nearestCode = getTreeStreetCode(nearest.tree);
          const nextNum = parseInt(nearestCode.replace(/\D/g, '') || '1', 10) + 1;
          const prefix = nearestCode.split('-')[0] || 'HB';
          const suggestedNext = `${prefix}-${String(nextNum).padStart(2, '0')}`;

          setRadarResult({
            distanceM: nearest.distanceM,
            nearestCode,
            nearestName: nearest.tree.displayName,
            suggestedNextCode: suggestedNext,
          });

          // Tự động gợi ý điền mã tiếp theo nếu đang tạo mới
          if (!tree) {
            setPublicCode(suggestedNext);
            setStreetCode(suggestedNext);
          }
        }
      },
      (err) => {
        setIsGpsLocating(false);
        // Fallback GPS Cần Thơ mẫu nếu người dùng từ chối quyền hoặc ở môi trường dev
        const fallbackLat = 10.036829;
        const fallbackLng = 105.782541;
        setLatitude(fallbackLat);
        setLongitude(fallbackLng);

        const nearest = findNearestTree(fallbackLat, fallbackLng, allExistingTrees);
        if (nearest) {
          setRadarResult({
            distanceM: nearest.distanceM,
            nearestCode: getTreeStreetCode(nearest.tree),
            nearestName: nearest.tree.displayName,
            suggestedNextCode: 'HB-06',
          });
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh thực địa tối đa 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageUrl(base64);
        setImagePreview(base64);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Single Tree
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!publicCode.trim()) {
      setError('Vui lòng nhập mã định danh tuyến cây (ví dụ: HB-06)');
      return;
    }
    if (!displayName.trim()) {
      setError('Vui lòng nhập tên hiển thị cây');
      return;
    }
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ vị trí cây');
      return;
    }

    if (!imageUrl && !imagePreview) {
      setError('Vui lòng chụp ảnh hoặc tải ảnh thực địa của cây để lưu hồ sơ');
      return;
    }

    const currentCorridor = STREET_CORRIDORS_LIST.find((c) => c.id === selectedCorridorId);

    setIsSubmitting(true);
    try {
      if (tree) {
        // Edit existing
        await storage.updateTree(tree.id, {
          displayName,
          treeTypeId,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          plantedAt,
          healthStatus,
          diameterCm: Number(diameterCm),
          heightM: Number(heightM),
          imageUrl,
          streetCode: streetCode || publicCode,
          houseNumberMilestone: houseMilestone || address.split(',')[0],
          streetCorridor: currentCorridor?.name || 'Đại Lộ Hòa Bình',
        });
      } else {
        // Add new single tree
        await storage.createTree({
          publicCode: publicCode.trim().toUpperCase(),
          streetCode: streetCode || publicCode.trim().toUpperCase(),
          streetCorridor: currentCorridor?.name || 'Đại Lộ Hòa Bình',
          houseNumberMilestone: houseMilestone || address.split(',')[0],
          displayName,
          treeTypeId,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          plantedAt,
          healthStatus,
          diameterCm: Number(diameterCm),
          heightM: Number(heightM),
          imageUrl:
            imageUrl ||
            'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
          isActive: true,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu cây');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Bulk Corridor Import
  const handleBulkImport = async () => {
    const corridor = STREET_CORRIDORS_LIST.find((c) => c.id === bulkCorridorId);
    if (!corridor) return;

    setIsBulkSubmitting(true);
    setError(null);

    try {
      const typeObj = treeTypes.find((t) => t.id === bulkTreeTypeId) || treeTypes[0];
      const baseLat = 10.036829;
      const baseLng = 105.782541;

      // Tìm số thứ tự lớn nhất hiện tại
      const corridorTrees = allExistingTrees.filter((t) => {
        const code = getTreeStreetCode(t);
        return code.startsWith(corridor.prefix + '-');
      });
      const startSeq = corridorTrees.length + 1;

      const createdList: Tree[] = [];

      for (let i = 0; i < bulkCount; i++) {
        const seq = startSeq + i;
        const code = `${corridor.prefix}-${String(seq).padStart(2, '0')}`;
        const houseNo = bulkStartHouseNo + i * 4;
        const milestone = `Trước số ${houseNo} ${corridor.name}`;
        const fullAddr = `${milestone}, ${corridor.district}, Cần Thơ`;

        // Tọa độ dải cây chạy dần dọc đường
        const treeLat = Number((baseLat + i * 0.00015).toFixed(6));
        const treeLng = Number((baseLng + i * 0.00018).toFixed(6));

        const newTree = await storage.createTree({
          publicCode: code,
          streetCode: code,
          streetCorridor: corridor.name,
          houseNumberMilestone: milestone,
          sequenceNumber: seq,
          displayName: `${typeObj.name} #${String(seq).padStart(2, '0')} (${corridor.name})`,
          treeTypeId: typeObj.id,
          address: fullAddr,
          latitude: treeLat,
          longitude: treeLng,
          plantedAt: '2023-03-15',
          healthStatus: 'GOOD',
          diameterCm: 28,
          heightM: 7.5,
          imageUrl:
            'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
          isActive: true,
        });

        createdList.push(newTree);
      }

      setBulkSuccessList(createdList);
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi nhập hàng loạt');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // 📁 Xử lý đọc File GeoJSON (.geojson, .json), Excel (.xlsx, .xls), CSV (.csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setError(null);
    const fileNameLower = file.name.toLowerCase();

    try {
      // 1. Trường hợp file GeoJSON hoặc JSON từ OpenStreetMap
      if (fileNameLower.endsWith('.geojson') || fileNameLower.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        const features = Array.isArray(json) ? json : (json.features || []);

        if (!Array.isArray(features) || features.length === 0) {
          setError('File GeoJSON không chứa đối tượng hình học (Feature/Point) hợp lệ.');
          return;
        }

        const parsed: any[] = [];
        for (let i = 0; i < features.length; i++) {
          const f = features[i];
          const coords = f.geometry?.coordinates;
          if (!coords || !Array.isArray(coords) || coords.length < 2) continue;

          // Chuẩn GeoJSON: [Kinh độ, Vĩ độ] = [longitude, latitude]
          const lng = parseFloat(coords[0]);
          const lat = parseFloat(coords[1]);
          if (isNaN(lat) || isNaN(lng)) continue;

          const p = f.properties || {};
          const code =
            p['Mã Cây (publicCode)'] ||
            p['publicCode'] ||
            p['ref'] ||
            p['@id'] ||
            f.id ||
            `CT-OSM-${String(i + 1).padStart(4, '0')}`;
          const nameVi =
            p['Tên tiếng Việt (name:vi)'] ||
            p['Tên (name)'] ||
            p['species'] ||
            p['natural'] ||
            'Cây Xanh';
          const name =
            p['Tên Hiển Thị (displayName)'] ||
            p['displayName'] ||
            p['name'] ||
            `Cây ${nameVi} #${String(i + 1).padStart(4, '0')}`;
          const addr =
            p['Địa Chỉ (address)'] ||
            p['address'] ||
            p['addr:street'] ||
            `Tọa độ (${lat.toFixed(5)}, ${lng.toFixed(5)}), Ninh Kiều, Cần Thơ`;
          const diam =
            parseFloat(p['Đường kính (cm)'] || p['diameter'] || (p.circumference ? p.circumference / 3.14 : 30)) || 30;
          const height = parseFloat(p['Chiều cao (m)'] || p['height'] || 8) || 8;
          const rawHealth = String(p['Tình trạng sức khỏe'] || p['healthStatus'] || 'GOOD').toUpperCase();
          const health: TreeHealthStatus = ['GOOD', 'FAIR', 'POOR', 'CRITICAL'].includes(rawHealth)
            ? (rawHealth as TreeHealthStatus)
            : 'GOOD';

          parsed.push({
            publicCode: code,
            streetCode: code,
            displayName: name,
            treeTypeId: treeTypes[0]?.id || 'type-bang',
            address: addr,
            latitude: lat,
            longitude: lng,
            diameterCm: Math.round(diam),
            heightM: Number(height.toFixed(1)),
            healthStatus: health,
          });
        }

        if (parsed.length === 0) {
          setError('Không trích xuất được tọa độ cây nào từ file GeoJSON.');
          return;
        }

        setParsedTreesFromFile(parsed);
        return;
      }

      // 2. Trường hợp file Excel (.xlsx, .xls) hoặc CSV
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames.includes('DuLieuCayXanh') ? 'DuLieuCayXanh' : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows || rows.length === 0) {
        setError('File Excel / CSV không có dữ liệu hàng nào.');
        return;
      }

      const parsed: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const lat = parseFloat(
          r['Vĩ độ (Latitude)'] || r['latitude'] || r['ViDo'] || r['lat'] || r['Vĩ độ']
        );
        const lng = parseFloat(
          r['Kinh độ (Longitude)'] || r['longitude'] || r['KinhDo'] || r['lng'] || r['lon'] || r['Kinh độ']
        );
        if (isNaN(lat) || isNaN(lng)) continue;

        const code =
          r['Mã Cây (publicCode)'] ||
          r['publicCode'] ||
          r['MaTuyen'] ||
          r['ID'] ||
          `CT-OSM-${String(i + 1).padStart(4, '0')}`;
        const name =
          r['Tên Hiển Thị (displayName)'] ||
          r['displayName'] ||
          r['TenHienThi'] ||
          r['Tên (name)'] ||
          r['Tên tiếng Việt (name:vi)'] ||
          `Cây Xanh #${String(i + 1).padStart(4, '0')}`;
        const addr =
          r['Địa Chỉ (address)'] ||
          r['address'] ||
          r['DiaChi'] ||
          r['Tuyến đường phụ trách'] ||
          'TP. Cần Thơ';
        const diam =
          parseFloat(r['Đường kính (cm)'] || r['diameterCm'] || r['DuongKinh'] || 30) || 30;
        const height =
          parseFloat(r['Chiều cao (m)'] || r['heightM'] || r['ChieuCao'] || r['Chiều cao (height)'] || 8) || 8;
        const rawHealth = String(
          r['Tình trạng sức khỏe'] || r['healthStatus'] || r['SucKhoe'] || 'GOOD'
        ).toUpperCase();
        const health: TreeHealthStatus = ['GOOD', 'FAIR', 'POOR', 'CRITICAL'].includes(rawHealth)
          ? (rawHealth as TreeHealthStatus)
          : 'GOOD';

        parsed.push({
          publicCode: code,
          streetCode: code,
          displayName: name,
          treeTypeId: treeTypes[0]?.id || 'type-bang',
          address: addr,
          latitude: lat,
          longitude: lng,
          diameterCm: Math.round(diam),
          heightM: Number(height.toFixed(1)),
          healthStatus: health,
        });
      }

      if (parsed.length === 0) {
        setError('Không trích xuất được tọa độ (Vĩ độ / Kinh độ) hợp lệ nào từ file.');
        return;
      }

      setParsedTreesFromFile(parsed);
    } catch (err: any) {
      setError('Lỗi khi đọc file: ' + err.message);
    }
  };

  // 📥 Tải file mẫu CSV
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        'MaTuyen,TenHienThi,DiaChi,ViDo,KinhDo,DuongKinhCm,ChieuCaoM,SucKhoe\n' +
        'HB-06,Cây Bàng Đài Loan #06,Trước số 26 Đại lộ Hòa Bình Ninh Kiều Cần Thơ,10.035120,105.782210,32,8.5,GOOD\n' +
        'HB-07,Cây Bàng Đài Loan #07,Trước số 30 Đại lộ Hòa Bình Ninh Kiều Cần Thơ,10.034810,105.782050,30,8.0,GOOD\n' +
        '30T4-06,Cây Me Tây Tuyến 30/4 #06,Trước số 120 Đường 30 Tháng 4 Ninh Kiều Cần Thơ,10.027850,105.775820,45,12.0,FAIR\n' +
        'CR-03,Cây Sao Đen Nam Cần Thơ #03,Trước số 45 Đại lộ Võ Nguyên Giáp Cái Răng,10.011200,105.797500,28,7.5,GOOD\n' +
        'BT-03,Cây Giáng Hương Sân Bay #03,Dải phân cách Đại lộ Võ Văn Kiệt Bình Thủy,10.067500,105.743100,35,9.0,GOOD\n'
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'UrbanTree_Mau_Nhap_Cay_CanTho.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ⚡ Nạp dữ liệu mẫu thử nghiệm từ Sở Xây Dựng
  const handleLoadDemoDataset = () => {
    const demoList = [
      {
        publicCode: 'HB-06',
        streetCode: 'HB-06',
        displayName: 'Cây Bàng Đài Loan #06 (Đại Lộ Hòa Bình)',
        treeTypeId: 'type-bang',
        address: 'Trước số 26 Đại lộ Hòa Bình, Phường An Lạc, Ninh Kiều, Cần Thơ',
        latitude: 10.03512,
        longitude: 105.78221,
        diameterCm: 32,
        heightM: 8.5,
        healthStatus: 'GOOD' as TreeHealthStatus,
      },
      {
        publicCode: 'HB-07',
        streetCode: 'HB-07',
        displayName: 'Cây Bàng Đài Loan #07 (Đại Lộ Hòa Bình)',
        treeTypeId: 'type-bang',
        address: 'Trước số 30 Đại lộ Hòa Bình, Phường An Lạc, Ninh Kiều, Cần Thơ',
        latitude: 10.03481,
        longitude: 105.78205,
        diameterCm: 30,
        heightM: 8.0,
        healthStatus: 'GOOD' as TreeHealthStatus,
      },
      {
        publicCode: '30T4-06',
        streetCode: '30T4-06',
        displayName: 'Cây Me Tây Tuyến 30/4 #06',
        treeTypeId: 'type-me',
        address: 'Trước số 120 Đường 30 Tháng 4, Phường An Phú, Ninh Kiều, Cần Thơ',
        latitude: 10.02785,
        longitude: 105.77582,
        diameterCm: 45,
        heightM: 12.0,
        healthStatus: 'FAIR' as TreeHealthStatus,
      },
      {
        publicCode: 'CR-03',
        streetCode: 'CR-03',
        displayName: 'Cây Sao Đen Tuyến Cái Răng #03',
        treeTypeId: 'type-sao',
        address: 'Trước số 45 Đại lộ Võ Nguyên Giáp, Phường Hưng Phú, Cái Răng, Cần Thơ',
        latitude: 10.0112,
        longitude: 105.7975,
        diameterCm: 28,
        heightM: 7.5,
        healthStatus: 'GOOD' as TreeHealthStatus,
      },
      {
        publicCode: 'BT-03',
        streetCode: 'BT-03',
        displayName: 'Cây Giáng Hương Tuyến Sân Bay #03',
        treeTypeId: 'type-gianghuong',
        address: 'Dải phân cách Đại lộ Võ Văn Kiệt, Phường An Thới, Bình Thủy, Cần Thơ',
        latitude: 10.0675,
        longitude: 105.7431,
        diameterCm: 35,
        heightM: 9.0,
        healthStatus: 'GOOD' as TreeHealthStatus,
      },
    ];
    setParsedTreesFromFile(demoList);
    setUploadedFileName('So_Xay_Dung_Can_Tho_Danh_Muc_Cay_2026.csv');
    setError(null);
  };

  // 🚀 Tiến hành nhập dữ liệu từ File vào Database & Blockchain
  const handleSubmitFileImport = async () => {
    if (parsedTreesFromFile.length === 0) {
      setError('Vui lòng chọn file dữ liệu hoặc bấm "Nạp file mẫu" trước khi tiến hành nhập.');
      return;
    }

    setIsBulkSubmitting(true);
    setError(null);

    try {
      const itemsToCreate = parsedTreesFromFile.map((item) => ({
        publicCode: item.publicCode,
        streetCode: item.streetCode,
        streetCorridor: item.address.includes('Hòa Bình')
          ? 'Đại Lộ Hòa Bình'
          : item.address.includes('30 Tháng 4')
          ? 'Đường 30 Tháng 4'
          : item.address.includes('Bình Thủy') || item.address.includes('Võ Văn Kiệt')
          ? 'Tuyến Võ Văn Kiệt'
          : item.address.includes('Cái Răng') || item.address.includes('Võ Nguyên Giáp')
          ? 'Tuyến Võ Nguyên Giáp'
          : 'Tuyến Phố Đô Thị',
        houseNumberMilestone: item.address.split(',')[0],
        displayName: item.displayName,
        treeTypeId: item.treeTypeId,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        plantedAt: '2023-03-15',
        healthStatus: item.healthStatus,
        diameterCm: item.diameterCm,
        heightM: item.heightM,
        imageUrl:
          'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      }));

      const createdList = await storage.createTreesBulk(itemsToCreate);
      setBulkSuccessList(createdList);
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi nhập file');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleLocationPreset = (lat: number, lng: number, addr: string, corridorId: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setSelectedCorridorId(corridorId);
    setHouseMilestone(addr.split(',')[0]);
  };

  // Simulated temporary tree object for live DigitalAlloyTag preview
  const previewTreeObj: Tree = {
    id: tree?.id || 'temp-preview-tree',
    publicCode: publicCode || 'HB-06',
    streetCode: streetCode || publicCode || 'HB-06',
    streetCorridor: STREET_CORRIDORS_LIST.find((c) => c.id === selectedCorridorId)?.name || 'Đại Lộ Hòa Bình',
    houseNumberMilestone: houseMilestone || 'Trước số 24 Đại Lộ Hòa Bình',
    displayName: displayName || 'Cây Bàng Đài Loan Tuyến Phố',
    treeTypeId,
    address: address || 'Số 24 Đại Lộ Hòa Bình, Ninh Kiều, Cần Thơ',
    latitude,
    longitude,
    plantedAt,
    healthStatus,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col border border-[#E0EBDD] dark:border-emerald-500/30 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400 dark:border dark:border-emerald-800/50 rounded-xl shadow-xs">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#174B36] dark:text-emerald-400 flex items-center gap-2">
                <span>{tree ? 'Cập nhật Hồ sơ Cây xanh' : 'Thêm Cây Mới & Chuẩn Hóa Thực Địa'}</span>
                {!tree && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Smart GIS 4.0
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Định danh Tuyến Phố · Radar GPS Auto-Detect · Biển Nhôm & Blockchain SHA-256
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Single Field Calibration VS Bulk Corridor Import */}
        {!tree && (
          <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/40 dark:bg-slate-900/20">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'border-[#174B36] dark:border-emerald-400 text-[#174B36] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>📍 Thêm Đơn Lẻ & Khớp GPS Thực Địa (10s/cây)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'bulk'
                  ? 'border-[#174B36] dark:border-emerald-400 text-[#174B36] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📑 Nhập Hàng Loạt Từ Tuyến Phố / Excel (Bulk Import)</span>
            </button>
          </div>
        )}

        {/* BODY TAB 1: THÊM ĐƠN LẺ / KHỚP THỰC ĐỊA */}
        {activeTab === 'single' ? (
          <form
            onSubmit={handleSubmit}
            className="p-5 overflow-y-auto overscroll-contain space-y-4 flex-1 text-xs"
            data-lenis-prevent
          >
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* RADAR GPS AUTO-DETECT BANNER */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-slate-900/60 rounded-xl border border-emerald-200/90 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold">
                  <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span>Chức năng Radar GPS: Nhận diện cây gần bạn nhất</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectGpsAndRadar}
                  disabled={isGpsLocating}
                  className="px-3 py-1.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  {isGpsLocating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang dò vệ tinh GPS...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>📍 Lấy vị trí GPS của tôi</span>
                    </>
                  )}
                </button>
              </div>

              {radarResult ? (
                <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-300/80 dark:border-emerald-700 text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <strong>Phát hiện hiện trường:</strong> Bạn đang đứng cách cây{' '}
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      [{radarResult.nearestCode}]
                    </span>{' '}
                    khoảng <strong>{radarResult.distanceM}m</strong>. Đã tự động khớp GPS & đề xuất mã tiếp theo:{' '}
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                      [{radarResult.suggestedNextCode}]
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Công nhân đến hiện trường chỉ cần bấm nút để thiết bị tự động bắt tọa độ GPS chuẩn và đề xuất số thứ tự
                  cây tiếp theo theo đúng tuyến phố!
                </p>
              )}
            </div>

            {/* QUY TẮC MÃ THEO TUYẾN PHỐ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Chọn Tuyến Phố / Corridor *
                </label>
                <select
                  value={selectedCorridorId}
                  onChange={(e) => setSelectedCorridorId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:border-emerald-500"
                >
                  {STREET_CORRIDORS_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.prefix})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Mã Tuyến Phố (Street Code) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={publicCode}
                    onChange={(e) => {
                      setPublicCode(e.target.value.toUpperCase());
                      setStreetCode(e.target.value.toUpperCase());
                    }}
                    placeholder="HB-06"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-[#174B36] dark:text-emerald-400 bg-white dark:bg-slate-900 focus:border-[#347A50] dark:focus:border-emerald-400"
                  />
                  <span className="absolute right-2 top-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Định danh thực địa
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">3. Loài cây *</label>
                <select
                  value={treeTypeId}
                  onChange={(e) => setTreeTypeId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#347A50] dark:focus:border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {treeTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.scientificName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox Cây chèn xen kẽ ngoài thực địa */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBranchInsertion}
                  onChange={(e) => setIsBranchInsertion(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300">
                  <strong>Cây phát sinh xen kẽ ngoài thực tế</strong> (Ví dụ: mọc thêm cây mới giữa HB-02 và HB-03)
                </span>
              </label>

              {isBranchInsertion && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Hậu tố:</span>
                  <input
                    type="text"
                    value={branchSuffix}
                    maxLength={2}
                    onChange={(e) => setBranchSuffix(e.target.value.toUpperCase())}
                    className="w-10 px-1 py-0.5 text-center font-mono font-bold border border-emerald-400 rounded bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300"
                  />
                </div>
              )}
            </div>

            {/* Tên hiển thị & Cột mốc số nhà */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị cây *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Cây Bàng Đài Loan #06"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cột mốc số nhà (Định vị mắt thường) *
                </label>
                <input
                  type="text"
                  value={houseMilestone}
                  onChange={(e) => {
                    setHouseMilestone(e.target.value);
                    const parts = address.split(',');
                    if (parts.length > 1) {
                      setAddress(`${e.target.value}, ${parts.slice(1).join(',').trim()}`);
                    } else {
                      setAddress(e.target.value);
                    }
                  }}
                  placeholder="Trước số 28 Đại lộ Hòa Bình"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Địa chỉ hành chính đầy đủ */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Địa chỉ hành chính *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Trước số 28 Đại lộ Hòa Bình, Phường Tân An, Quận Ninh Kiều, Cần Thơ"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500"
              />
            </div>

            {/* Coordinates & Presets */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#174B36] dark:text-emerald-400" />
                  <span>Tọa độ GPS (WGS84)</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Chọn vị trí nhanh Cần Thơ:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Vĩ độ (Latitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Kinh độ (Longitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Presets Cần Thơ */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleLocationPreset(
                      10.036829,
                      105.782541,
                      'Trước số 12 Đại lộ Hòa Bình, Phường An Lạc, Ninh Kiều, Cần Thơ',
                      'corridor-hoa-binh'
                    )
                  }
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300 hover:border-[#347A50] dark:hover:border-emerald-500 cursor-pointer"
                >
                  Đại Lộ Hòa Bình
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLocationPreset(
                      10.034515,
                      105.78822,
                      'Công viên Bến Ninh Kiều, Đường Hai Bà Trưng, Tân An, Ninh Kiều, Cần Thơ',
                      'corridor-hai-ba-trung'
                    )
                  }
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300 hover:border-[#347A50] dark:hover:border-emerald-500 cursor-pointer"
                >
                  Bến Ninh Kiều
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLocationPreset(
                      10.03812,
                      105.78391,
                      'Công viên Lưu Hữu Phước, Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ',
                      'corridor-luu-huu-phuoc'
                    )
                  }
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300 hover:border-[#347A50] dark:hover:border-emerald-500 cursor-pointer"
                >
                  Lưu Hữu Phước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLocationPreset(
                      10.0315,
                      105.7762,
                      'Số 42 Đường 30 Tháng 4, Phường An Phú, Ninh Kiều, Cần Thơ',
                      'corridor-30-thang-4'
                    )
                  }
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300 hover:border-[#347A50] dark:hover:border-emerald-500 cursor-pointer"
                >
                  Đường 30 Tháng 4
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleLocationPreset(
                      10.031251,
                      105.76915,
                      'ĐH Cần Thơ Khu II, Đường 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ',
                      'corridor-3-thang-2'
                    )
                  }
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-300 hover:border-[#347A50] dark:hover:border-emerald-500 cursor-pointer"
                >
                  ĐH Cần Thơ (3/2)
                </button>
              </div>
            </div>

            {/* Sức khỏe, Kích thước */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hiện trạng</label>
                <select
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value as TreeHealthStatus)}
                  className="w-full px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="GOOD">Tốt (GOOD)</option>
                  <option value="FAIR">Bình thường (FAIR)</option>
                  <option value="POOR">Kém (POOR)</option>
                  <option value="CRITICAL">Nguy cấp (CRITICAL)</option>
                  <option value="DEAD">Chết khô (DEAD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đường kính (cm)</label>
                <input
                  type="number"
                  value={diameterCm}
                  onChange={(e) => setDiameterCm(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chiều cao (m)</label>
                <input
                  type="number"
                  step="0.5"
                  value={heightM}
                  onChange={(e) => setHeightM(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* 🏷️ PHÂN CẤP CÂY ĐÔ THỊ TỰ ĐỘNG THEO THÔNG TƯ 20/2020/TT-BXD */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Phân cấp Cây Đô thị (Thông tư 20/2020/TT-BXD):</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  diameterCm >= 50 || heightM >= 12
                    ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800 animate-pulse'
                    : diameterCm >= 20 || heightM >= 6
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300'
                }`}>
                  {diameterCm >= 50 || heightM >= 12
                    ? '🏛️ CÂY LOẠI 3 (CỔ THỤ / BẢO TỒN)'
                    : diameterCm >= 20 || heightM >= 6
                    ? '🌳 CÂY LOẠI 2 (TRƯỞNG THÀNH)'
                    : '🌱 CÂY LOẠI 1 (MỚI TRỒNG)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {diameterCm >= 50 || heightM >= 12 ? (
                  <span className="text-purple-700 dark:text-purple-300 font-semibold">
                    🛑 <strong>Cảnh báo Pháp lý:</strong> Cây có đường kính &ge; 50cm hoặc cao &ge; 12m thuộc nhóm Cổ thụ bảo tồn. Mọi hành vi đốn hạ phải có Giấy phép được ký duyệt bởi UBND Tỉnh/Thành phố hoặc Sở Xây Dựng!
                  </span>
                ) : diameterCm >= 20 || heightM >= 6 ? (
                  'Thuộc nhóm cây xanh vỉa hè trưởng thành, nằm trong kế hoạch cắt tỉa hạ độ cao định kỳ trước mùa mưa bão.'
                ) : (
                  'Cây con đang trong giai đoạn ươm dưỡng, yêu cầu cắm cọc chống đỡ và tưới ẩm giữ rễ thường xuyên.'
                )}
              </p>
            </div>

            {/* Chụp ảnh thực tế bắt buộc */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Hình ảnh thực địa cây xanh <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Chụp thực tế tại gốc cây
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-600/60 bg-slate-900 group aspect-video max-h-40 flex items-center justify-center">
                  <img src={imagePreview} alt="Ảnh cây xanh" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đổi ảnh khác</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageUrl('');
                      }}
                      className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
                >
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-xs text-emerald-600 dark:text-emerald-400 mb-1 border border-emerald-100 dark:border-emerald-800/60">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Chụp ảnh cây từ Camera điện thoại / Hiện trường
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">hoặc bấm để tải tệp ảnh từ máy</div>
                </div>
              )}
            </div>

            {/* MÔ PHỎNG BIỂN SỐ NHÔM VẬT LÝ ẢO (DIGITAL ALLOY TAG PREVIEW) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowTagPreview(!showTagPreview)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-xs"
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Mô phỏng Thẻ Biển Nhôm gắn thân cây thực tế ([{publicCode || 'HB-06'}])</span>
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showTagPreview ? 'Thu gọn' : 'Xem thẻ nhôm'}</span>
                </span>
              </button>

              {showTagPreview && (
                <div className="mt-2.5 p-2 bg-slate-900/10 dark:bg-slate-950/60 rounded-2xl border border-emerald-500/20">
                  <DigitalAlloyTag tree={previewTreeObj} size="sm" showActions={false} />
                </div>
              )}
            </div>

            {/* Blockchain Notice */}
            <div className="p-3 rounded-xl bg-[#E0EBDD]/60 dark:bg-emerald-950/40 border border-[#E0EBDD] dark:border-emerald-800/60 flex items-center gap-2 text-[#174B36] dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#347A50] dark:text-emerald-400" />
              <span className="text-[11px] leading-tight">
                Mỗi cây khi được thêm vào hệ thống sẽ được cấp thẻ QR duy nhất, tự động băm chuẩn SHA-256 và neo giao dịch
                lên Smart Contract Blockchain bất biến.
              </span>
            </div>

            {/* Footer Submit */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Đang ghi Blockchain...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{tree ? 'Lưu thay đổi' : 'Kích hoạt cá thể & Neo Blockchain'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* BODY TAB 2: NHẬP HÀNG LOẠT TỪ TUYẾN PHỐ / EXCEL */
          <div
            className="p-5 overflow-y-auto overscroll-contain space-y-4 flex-1 text-xs"
            data-lenis-prevent
          >
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sub-tab switcher: Nhập file Excel/CSV vs Khởi tạo theo tuyến */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setBulkMode('file')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bulkMode === 'file'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Nhập File Excel / CSV (.csv, .xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('corridor')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bulkMode === 'corridor'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Tự động theo Tuyến Phố (Corridor)</span>
              </button>
            </div>

            {bulkMode === 'file' ? (
              /* PHÂN ĐOẠN 1: NHẬP TỪ FILE EXCEL / CSV */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 font-bold">
                    GIS
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                      Tự Động Định Vị Tọa Độ GPS & Sinh Icon Marker Trên Bản Đồ
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400 leading-relaxed">
                      Hệ thống tự động đọc cột <strong>vĩ độ (latitude)</strong> và <strong>kinh độ (longitude)</strong> từ file để ghim mốc trực tiếp lên bản đồ GIS chuẩn WGS-84 với độ chính xác tuyệt đối. 
                      Đồng thời, Leaflet sẽ <strong>tự động tạo huy hiệu biểu tượng (Icon Marker)</strong> có màu theo sức khỏe cây và số thứ tự tuyến phố!
                    </p>
                  </div>
                </div>

                {/* Khu vực Upload Kéo thả */}
                <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-6 bg-emerald-50/30 dark:bg-emerald-950/20 text-center hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    id="excel-csv-file-input"
                    accept=".geojson,.json,.xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-csv-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {uploadedFileName ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-center">
                          <CheckCircle2 className="w-4 h-4" /> Đã nạp file: {uploadedFileName} ({parsedTreesFromFile.length.toLocaleString('vi-VN')} cây)
                        </span>
                      ) : (
                        'Chọn hoặc Kéo thả file GeoJSON (.geojson), Excel (.xlsx), CSV (.csv) vào đây'
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-xl mx-auto">
                      Hỗ trợ định dạng GIS OpenStreetMap GeoJSON (.geojson), Bảng tính Excel (.xlsx) khảo sát thực địa: Mã cây, Tên loài, Địa chỉ, Vĩ độ, Kinh độ, Đường kính, Chiều cao, Tình trạng
                    </p>
                  </label>

                  <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSampleCsv}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tải file Excel / CSV mẫu chuẩn (.csv)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadDemoDataset}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Nạp 5 cây mẫu Cần Thơ (Thử nghiệm nhanh)</span>
                    </button>
                  </div>
                </div>

                {/* Bảng Preview dữ liệu đã đọc từ file */}
                {parsedTreesFromFile.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Danh sách trích xuất ({parsedTreesFromFile.length.toLocaleString('vi-VN')} cây hợp lệ):</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ✓ Sẵn sàng cắm mốc lên Bản đồ GIS
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                          <tr>
                            <th className="p-2">Mã cây</th>
                            <th className="p-2">Tên hiển thị / Chủng loại</th>
                            <th className="p-2">Vị trí / Địa chỉ</th>
                            <th className="p-2">Tọa độ GPS</th>
                            <th className="p-2">D/H</th>
                            <th className="p-2">Tình trạng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {parsedTreesFromFile.slice(0, 50).map((t: any, idx) => {
                            const code = t.publicCode || t.streetCode || t.code || `TREE-${idx + 1}`;
                            const name = t.displayName || t.typeName || 'Cây Đô Thị';
                            const lat = typeof t.latitude === 'number' ? t.latitude : typeof t.lat === 'number' ? t.lat : null;
                            const lng = typeof t.longitude === 'number' ? t.longitude : typeof t.lng === 'number' ? t.lng : null;
                            const diam = t.diameterCm ?? t.diameter ?? 30;
                            const height = t.heightM ?? t.height ?? 8;
                            const health = t.healthStatus || 'GOOD';

                            return (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {code}
                                </td>
                                <td className="p-2 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={name}>
                                  {name}
                                </td>
                                <td className="p-2 text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={t.address}>
                                  {t.address || 'TP. Cần Thơ'}
                                </td>
                                <td className="p-2 font-mono text-slate-500 text-[10px]">
                                  {lat !== null ? lat.toFixed(5) : '—'}, {lng !== null ? lng.toFixed(5) : '—'}
                                </td>
                                <td className="p-2 text-slate-600 dark:text-slate-400 font-mono">
                                  {diam}cm / {height}m
                                </td>
                                <td className="p-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      health === 'GOOD'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                        : health === 'FAIR'
                                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                                        : health === 'POOR'
                                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                        : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                                    }`}
                                  >
                                    {health}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {parsedTreesFromFile.length > 50 && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center pt-1">
                        * Đang hiển thị xem trước 50 / {parsedTreesFromFile.length.toLocaleString('vi-VN')} cây từ file. Toàn bộ {parsedTreesFromFile.length.toLocaleString('vi-VN')} cây sẽ được cắm mốc lên bản đồ khi bấm nút bên dưới.
                      </p>
                    )}
                  </div>
                )}

                {/* Footer Submit File */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitFileImport}
                    disabled={isBulkSubmitting || parsedTreesFromFile.length === 0}
                    className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    {isBulkSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang định vị GIS & ghi Blockchain...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>🚀 Nhập {parsedTreesFromFile.length > 0 ? parsedTreesFromFile.length : ''} Cây & Cắm Mốc Lên Bản Đồ GIS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* PHÂN ĐOẠN 2: TỰ ĐỘNG THEO TUYẾN ĐƯỜNG (CORRIDOR) */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                      Khởi tạo Tuyến Cây Tự Động (Corridor Generator)
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400 leading-relaxed">
                      Tạo dãy mã định danh nối tiếp trên tuyến đường (ví dụ: <strong>HB-01 đến HB-10</strong>), 
                      hệ thống tự động tính toán tọa độ tịnh tiến dọc tuyến phố và chuẩn bị sẵn mã QR.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chọn Tuyến Đường Trồng *
                    </label>
                    <select
                      value={bulkCorridorId}
                      onChange={(e) => setBulkCorridorId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      {STREET_CORRIDORS_LIST.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.prefix}) - {c.district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chủng loại cây trồng đồng loạt *
                    </label>
                    <select
                      value={bulkTreeTypeId}
                      onChange={(e) => setBulkTreeTypeId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {treeTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.scientificName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số lượng cây *</label>
                    <select
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    >
                      <option value={3}>3 cây</option>
                      <option value={5}>5 cây</option>
                      <option value={10}>10 cây</option>
                      <option value={15}>15 cây</option>
                      <option value={20}>20 cây</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số nhà khởi đầu</label>
                    <input
                      type="number"
                      value={bulkStartHouseNo}
                      onChange={(e) => setBulkStartHouseNo(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khoảng cách (m)</label>
                    <input
                      type="number"
                      value={bulkSpacingM}
                      onChange={(e) => setBulkSpacingM(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* PREVIEW BẢNG CÂY SẼ TẠO */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between text-xs">
                    <span>📋 Bản xem trước dãy cây sẽ tạo tự động:</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Tự động cắm cờ dọc đường trên GIS
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-2">Mã Tuyến</th>
                          <th className="p-2">Cột mốc số nhà</th>
                          <th className="p-2">Tọa độ dự kiến</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {Array.from({ length: Math.min(bulkCount, 5) }).map((_, idx) => {
                          const corridor = STREET_CORRIDORS_LIST.find((c) => c.id === bulkCorridorId);
                          const prefix = corridor?.prefix || 'HB';
                          const seqStr = String(idx + 1).padStart(2, '0');
                          const houseNo = bulkStartHouseNo + idx * 4;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-2 font-bold text-emerald-600 dark:text-emerald-400">
                                [{prefix}-{seqStr}]
                              </td>
                              <td className="p-2 font-sans">
                                Trước số {houseNo} {corridor?.name}
                              </td>
                              <td className="p-2 text-slate-400">
                                10.03{idx}..., 105.78{idx}...
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Bulk Submit */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={isBulkSubmitting}
                    className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    {isBulkSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang khởi tạo dãy cây...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>⚡ Khởi tạo {bulkCount} cây trên Tuyến & Neo Blockchain</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Kết quả tạo hàng loạt */}
            {bulkSuccessList && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-500 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    🎉 Đã nạp thành công {bulkSuccessList.length} cây lên hệ thống và neo Smart Contract!
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Các cây đã được tự động cắm mốc chuẩn tọa độ GPS lên Bản đồ số GIS. Bạn có thể in ngay danh sách thẻ nhôm mã QR bên dưới để mang ra hiện trường đóng vào thân cây!
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#174B36] hover:bg-[#347A50] text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>🖨️ In toàn bộ {bulkSuccessList.length} Thẻ QR Tuyến Phố</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
