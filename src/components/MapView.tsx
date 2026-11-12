import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Trees,
  AlertTriangle,
  MapPin,
  Layers,
  ExternalLink,
  ClipboardList,
  ShieldCheck,
  Eye,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Crosshair,
  Building2,
  CheckCircle,
  X,
  Compass,
  Save,
  RotateCcw,
  Search,
  Globe2,
} from 'lucide-react';
import { storage } from '../db/storage';
import { Incident, Tree, User } from '../types';
import {
  getTreeCorridor,
  getTreeMilestone,
  getTreeStreetCode,
  STREET_CORRIDORS_LIST,
} from '../utils/treeUtils';
import {
  NATIONAL_PROVINCES,
  getTreeProvinceId,
  getTreeZoneId,
  getZonesByProvince,
  UrbanZone,
} from '../utils/zoneUtils';

export interface LocationLandmark {
  id: string;
  provinceId: string;
  name: string;
  district: string;
  coords: [number, number];
  zoom: number;
  keywords: string[];
}

export const ALL_LOCATION_LANDMARKS: LocationLandmark[] = [
  // Cần Thơ
  {
    id: 'luu-huu-phuoc',
    provinceId: 'can-tho',
    name: 'Công viên Lưu Hữu Phước',
    district: 'Quận Ninh Kiều',
    coords: [10.0368, 105.7825],
    zoom: 17,
    keywords: ['lưu hữu phước', 'hòa bình', 'hb-'],
  },
  {
    id: 'ben-ninh-kieu',
    provinceId: 'can-tho',
    name: 'Bến Ninh Kiều & Tượng Bác',
    district: 'Quận Ninh Kiều',
    coords: [10.0345, 105.7882],
    zoom: 17,
    keywords: ['ninh kiều', 'hai bà trưng', 'hbt-'],
  },
  {
    id: 'cau-di-bo',
    provinceId: 'can-tho',
    name: 'Cầu Đi Bộ Ninh Kiều (Cầu Tình Yêu)',
    district: 'Quận Ninh Kiều',
    coords: [10.0328, 105.7895],
    zoom: 17,
    keywords: ['cầu đi bộ', 'tình yêu', 'cdb-'],
  },
  {
    id: 'song-hau',
    provinceId: 'can-tho',
    name: 'Công viên Bờ Kè Sông Hậu',
    district: 'Quận Ninh Kiều',
    coords: [10.0465, 105.7915],
    zoom: 17,
    keywords: ['sông hậu', 'cái khế', 'lê lợi', 'sh-'],
  },
  {
    id: 'dh-can-tho',
    provinceId: 'can-tho',
    name: 'ĐH Cần Thơ Khu II (Đường 3/2)',
    district: 'Quận Ninh Kiều',
    coords: [10.0312, 105.7691],
    zoom: 17,
    keywords: ['đại học cần thơ', '3 tháng 2', '3/2', 'xuân khánh', '3t2-'],
  },
  {
    id: 'vincom-30-4',
    provinceId: 'can-tho',
    name: 'Tuyến Vincom Plaza (Đường 30/4)',
    district: 'Quận Ninh Kiều',
    coords: [10.0288, 105.7761],
    zoom: 17,
    keywords: ['30 tháng 4', '30/4', 'vincom', 'an phú', '30t4-'],
  },
  {
    id: 'cai-rang-bridge',
    provinceId: 'can-tho',
    name: 'Cầu Cần Thơ & Đại lộ Võ Nguyên Giáp',
    district: 'Quận Cái Răng',
    coords: [10.0125, 105.7982],
    zoom: 16,
    keywords: ['cái răng', 'võ nguyên giáp', 'quang trung', 'hưng phú', 'cr-'],
  },
  {
    id: 'san-bay-binh-thuy',
    provinceId: 'can-tho',
    name: 'Sân bay Quốc tế Cần Thơ (Võ Văn Kiệt)',
    district: 'Quận Bình Thủy',
    coords: [10.0682, 105.7425],
    zoom: 16,
    keywords: ['bình thủy', 'võ văn kiệt', 'sân bay', 'an thới', 'bt-'],
  },
  {
    id: 'kcn-tra-noc',
    provinceId: 'can-tho',
    name: 'KCN Trà Nóc & Quốc Lộ 91 (Ô Môn)',
    district: 'Quận Ô Môn',
    coords: [10.1150, 105.6540],
    zoom: 16,
    keywords: ['ô môn', 'trà nóc', 'quốc lộ 91', 'ql91', 'om-'],
  },
  {
    id: 'my-khanh-pd',
    provinceId: 'can-tho',
    name: 'KDL Sinh Thái Mỹ Khánh (Phong Điền)',
    district: 'Huyện Phong Điền',
    coords: [9.9920, 105.7050],
    zoom: 16,
    keywords: ['phong điền', 'mỹ khánh', 'nguyễn văn cừ', 'pd-'],
  },

  // Đà Nẵng
  {
    id: 'cau-rong-dn',
    provinceId: 'da-nang',
    name: 'Cầu Rồng & Sông Hàn (Bạch Đằng)',
    district: 'Quận Hải Châu',
    coords: [16.0610, 108.2268],
    zoom: 17,
    keywords: ['cầu rồng', 'bạch đằng', '2 tháng 9', 'hải châu'],
  },
  {
    id: 'bien-my-khe-dn',
    provinceId: 'da-nang',
    name: 'Bãi biển Mỹ Khê & Võ Nguyên Giáp',
    district: 'Quận Sơn Trà',
    coords: [16.0658, 108.2468],
    zoom: 17,
    keywords: ['mỹ khê', 'võ nguyên giáp', 'phạm văn đồng', 'sơn trà'],
  },
  {
    id: 'ngu-hanh-son-dn',
    provinceId: 'da-nang',
    name: 'Quần thể Ngũ Hành Sơn & Non Nước',
    district: 'Quận Ngũ Hành Sơn',
    coords: [16.0020, 108.2560],
    zoom: 16,
    keywords: ['ngũ hành sơn', 'non nước', 'lê văn hiến'],
  },
  {
    id: 'cong-vien-29-3-dn',
    provinceId: 'da-nang',
    name: 'Công viên 29/3 (Điện Biên Phủ)',
    district: 'Quận Thanh Khê',
    coords: [16.0620, 108.2040],
    zoom: 17,
    keywords: ['29 tháng 3', '29/3', 'điện biên phủ', 'thanh khê'],
  },

  // TP. Hồ Chí Minh
  {
    id: 'tao-dan-hcm',
    provinceId: 'hcm',
    name: 'Công viên Tao Đàn (Quận 1)',
    district: 'Quận 1',
    coords: [10.7745, 106.6920],
    zoom: 17,
    keywords: ['tao đàn', 'nguyễn thị minh khai', 'trương định', 'quận 1'],
  },
  {
    id: 'nguyen-hue-hcm',
    provinceId: 'hcm',
    name: 'Phố đi bộ Nguyễn Huệ & Lê Duẩn',
    district: 'Quận 1',
    coords: [10.7738, 106.7042],
    zoom: 17,
    keywords: ['nguyễn huệ', 'lê duẩn', 'lê lợi', 'quận 1'],
  },
  {
    id: 'ho-con-rua-hcm',
    provinceId: 'hcm',
    name: 'Hồ Con Rùa & Đại thụ Quận 3',
    district: 'Quận 3',
    coords: [10.7825, 106.6960],
    zoom: 17,
    keywords: ['hồ con rùa', 'quận 3', 'võ văn tần', 'phạm ngọc thạch'],
  },
  {
    id: 'thu-thiem-hcm',
    provinceId: 'hcm',
    name: 'Khu Đô thị Mới Thủ Thiêm',
    district: 'TP. Thủ Đức',
    coords: [10.7780, 106.7220],
    zoom: 16,
    keywords: ['thủ thiêm', 'mai chí thọ', 'thủ đức'],
  },
  {
    id: 'phu-my-hung-hcm',
    provinceId: 'hcm',
    name: 'Hồ Bán Nguyệt Phú Mỹ Hưng',
    district: 'Quận 7',
    coords: [10.7285, 106.7195],
    zoom: 16,
    keywords: ['phú mỹ hưng', 'nguyễn văn linh', 'quận 7', 'tôn dật tiên'],
  },

  // TP. Hà Nội
  {
    id: 'ho-hoan-kiem-hn',
    provinceId: 'ha-noi',
    name: 'Hồ Hoàn Kiếm (Cây Lộc Vừng & Tháp Rùa)',
    district: 'Quận Hoàn Kiếm',
    coords: [21.0285, 105.8525],
    zoom: 17,
    keywords: ['hoàn kiếm', 'hồ gươm', 'đinh tiên hoàng', 'tràng tiền'],
  },
  {
    id: 'phan-dinh-phung-hn',
    provinceId: 'ha-noi',
    name: 'Đường Phan Đình Phùng (Hàng Sấu Cổ Thụ)',
    district: 'Quận Ba Đình',
    coords: [21.0405, 105.8390],
    zoom: 17,
    keywords: ['phan đình phùng', 'ba đình', 'hoàng diệu'],
  },
  {
    id: 'ho-tay-hn',
    provinceId: 'ha-noi',
    name: 'Hồ Tây & Đường Thanh Niên',
    district: 'Quận Tây Hồ',
    coords: [21.0515, 105.8360],
    zoom: 16,
    keywords: ['hồ tây', 'thanh niên', 'quảng an', 'tây hồ'],
  },
  {
    id: 'cong-vien-cau-giay-hn',
    provinceId: 'ha-noi',
    name: 'Công viên Cầu Giấy (Thành Thái)',
    district: 'Quận Cầu Giấy',
    coords: [21.0280, 105.7890],
    zoom: 17,
    keywords: ['cầu giấy', 'thành thái', 'duy tân'],
  },
];

interface MapViewProps {
  currentUser: User;
  onSelectTree: (tree: Tree) => void;
  onOpenCareModal: (treeId: string) => void;
  onOpenIncidentReport: (treeId?: string) => void;
  onOpenAddTree: (coords?: { latitude: number; longitude: number; address?: string }) => void;
  onOpenEditTree: (tree: Tree) => void;
  onTreeUpdated?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  currentUser,
  onSelectTree,
  onOpenCareModal,
  onOpenIncidentReport,
  onOpenAddTree,
  onOpenEditTree,
  onTreeUpdated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const rpzLayerRef = useRef<L.LayerGroup | null>(null);
  const tempPinLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const treeMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Filter States
  const [showTrees, setShowTrees] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showRootProtectionZone, setShowRootProtectionZone] = useState(false); // 🛡️ Bật/Tắt Vùng bảo vệ rễ (RPZ)
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');
  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL'); // 📍 Bộ lọc Vị trí / Địa điểm
  const [searchLocationInput, setSearchLocationInput] = useState<string>(''); // 🔍 Ô tìm kiếm số nhà, vị trí
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState<string>('');

  // ⚡ Debounce 300ms cho ô tìm kiếm bản đồ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocationQuery(searchLocationInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchLocationInput]);

  // 🏙️ Multi-Province / City State
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('can-tho');

  // 🏛️ Multi-Zone / District Jurisdiction State
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [mapViewportVersion, setMapViewportVersion] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(14);

  // Selection Drawers
  const [activeSelectedTree, setActiveSelectedTree] = useState<Tree | null>(null);
  const [activeSelectedIncident, setActiveSelectedIncident] = useState<Incident | null>(null);

  // 🎯 Admin Pin-Adding Mode
  const [isPinAddMode, setIsPinAddMode] = useState<boolean>(false);
  const isPinAddModeRef = useRef<boolean>(false);
  isPinAddModeRef.current = isPinAddMode;

  // 📍 Reposition / Relocate Mode for a selected Tree
  const [isRepositioning, setIsRepositioning] = useState<boolean>(false);
  const [repositionedCoords, setRepositionedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 🗑️ Delete Tree Confirmation Modal
  const [treeToDelete, setTreeToDelete] = useState<Tree | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('Chặt hạ giải tỏa quy hoạch');

  // 🔍 Cursor Live Coordinates
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const trees = storage.getTrees();
  const incidents = storage.getIncidents();
  const isAdmin = currentUser.role === 'ADMIN';

  // Province & Zone Resolution
  const activeProvince =
    NATIONAL_PROVINCES.find((p) => p.id === selectedProvinceId) || NATIONAL_PROVINCES[1];
  const availableZones = activeProvince.zones;
  const activeZone =
    availableZones.find((z) => z.id === selectedZoneId) || availableZones[0];

  // Dynamic tree count by province
  const treesByProvince = React.useMemo(() => {
    const counts: Record<string, number> = {};
    trees.forEach((t) => {
      const pid = getTreeProvinceId(t);
      counts[pid] = (counts[pid] || 0) + 1;
    });
    return counts;
  }, [trees]);

  // Handle Switch Province & FlyTo
  const handleSelectProvince = (provId: string) => {
    setSelectedProvinceId(provId);
    setSelectedZoneId('all');
    setSelectedLocation('ALL');
    setSelectedCorridorFilter('ALL');

    const prov = NATIONAL_PROVINCES.find((p) => p.id === provId) || NATIONAL_PROVINCES[1];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(prov.center, prov.zoom, { duration: 1.5 });
    }
    showToast(`🗺️ Đã chuyển góc nhìn sang: ${prov.name}`);
  };

  // Handle Switch Zone & FlyTo
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSelectedLocation('ALL');
    const zone = availableZones.find((z) => z.id === zoneId);
    if (zone && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(zone.center, zone.zoom, { duration: 1.2 });
      showToast(`🏛️ Đã chuyển sang khu vực: ${zone.shortName}`);
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered at active province/zone
      const map = L.map(mapContainerRef.current, {
        center: activeZone.center,
        zoom: activeZone.zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | UrbanTree Eco-GIS 4.0',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const rpzGroup = L.layerGroup().addTo(map);
      const tempGroup = L.layerGroup().addTo(map);
      const userLocGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      rpzLayerRef.current = rpzGroup;
      tempPinLayerRef.current = tempGroup;
      userLocationLayerRef.current = userLocGroup;
      mapInstanceRef.current = map;

      // Mousemove coordinates
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        setCursorCoords({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      });

      // Viewport culling on move / zoom (Debounce 100ms)
      let moveTimer: any = null;
      map.on('moveend zoomend', () => {
        if (moveTimer) clearTimeout(moveTimer);
        moveTimer = setTimeout(() => {
          setMapViewportVersion((v) => v + 1);
          setCurrentZoom(map.getZoom());
        }, 100);
      });

      // Click on Map for Pin Add Mode or General clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));

        if (isPinAddModeRef.current) {
          // Drop a pulsing pin at clicked coordinates
          tempPinLayerRef.current?.clearLayers();

          const tempIcon = L.divIcon({
            html: `
              <div style="
                background: #10b981;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 20px #10b981;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                animation: bounce 1s infinite alternate;
              ">
                📍
              </div>
            `,
            className: 'temp-pin',
            iconSize: [38, 38],
            iconAnchor: [19, 38],
          });

          L.marker([lat, lng], { icon: tempIcon }).addTo(tempPinLayerRef.current!);

          // Turn off pin mode
          setIsPinAddMode(false);

          // Infer estimated address based on zone
          const estimatedAddr = `Vị trí định vị vỉa hè tại ${activeZone.name}, Cần Thơ`;
          onOpenAddTree({ latitude: lat, longitude: lng, address: estimatedAddr });
        }
      });

      // Force recalculation of map container dimensions
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Zone FlyTo Transition when selectedZoneId changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(activeZone.center, activeZone.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedZoneId]);

  // 3. Render Markers (Filtered by Zone, Health, Corridor)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();
    rpzLayerRef.current?.clearLayers();
    treeMarkersMapRef.current.clear();

    // 1. Add Tree Markers
    if (showTrees) {
      let renderedCount = 0;
      const map = mapInstanceRef.current;
      const bounds = map ? map.getBounds().pad(0.2) : null;
      const zoom = map ? map.getZoom() : 15;
      const isZoomedOut = zoom < 14;

      trees.forEach((tree) => {
        // Province Filter
        if (selectedProvinceId !== 'all') {
          const treeProvince = getTreeProvinceId(tree);
          if (treeProvince !== selectedProvinceId) return;
        }

        // Zone Filter
        if (selectedZoneId !== 'all') {
          const treeZone = getTreeZoneId(tree);
          if (treeZone !== selectedZoneId) return;
        }

        // Health Filter
        if (selectedHealth !== 'ALL' && tree.healthStatus !== selectedHealth) return;

        // Corridor Filter
        if (
          selectedCorridorFilter !== 'ALL' &&
          getTreeCorridor(tree) !== selectedCorridorFilter
        )
          return;

        // 📍 Bộ lọc Vị trí / Địa điểm (Location Landmark Filter)
        if (selectedLocation !== 'ALL') {
          const loc = ALL_LOCATION_LANDMARKS.find((l) => l.id === selectedLocation);
          if (loc) {
            const treeSearchable = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode}`.toLowerCase();
            const matched = loc.keywords.some((k) => treeSearchable.includes(k.toLowerCase()));
            if (!matched) return;
          }
        }

        // 🔍 Ô tìm kiếm số nhà, vị trí (Search Query Filter - Debounced 300ms)
        if (debouncedLocationQuery.trim()) {
          const q = debouncedLocationQuery.toLowerCase().trim();
          const treeSearchable = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode} ${tree.publicCode}`.toLowerCase();
          if (!treeSearchable.includes(q)) return;
        }

        // ⚡ GIS High-Performance Viewport Culling (Chống giật lag khi có hàng ngàn cây):
        if (isZoomedOut && renderedCount >= 300 && activeSelectedTree?.id !== tree.id) {
          return;
        }
        if (!isZoomedOut && bounds && !bounds.contains([tree.latitude, tree.longitude]) && activeSelectedTree?.id !== tree.id) {
          return;
        }

        renderedCount++;

        const streetCode = getTreeStreetCode(tree);
        const milestone = getTreeMilestone(tree);
        const corridor = getTreeCorridor(tree);

        const healthColors: Record<string, string> = {
          GOOD: '#10B981',
          FAIR: '#64748B',
          POOR: '#F59E0B',
          CRITICAL: '#EF4444',
          DEAD: '#1E293B',
        };
        const color = healthColors[tree.healthStatus] || '#10B981';

        const customHtml = `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-family: monospace;
            font-size: 8px;
            cursor: pointer;
            transition: transform 0.2s;
            line-height: 1;
          ">
            <span>🌲</span>
            <span style="font-size: 7px; margin-top: 1px;">${streetCode.split('-')[1] || ''}</span>
          </div>
        `;

        const icon = L.divIcon({
          html: customHtml,
          className: 'custom-tree-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([tree.latitude, tree.longitude], {
          icon,
          draggable: false,
        });

        marker.on('click', () => {
          setActiveSelectedTree(tree);
          setActiveSelectedIncident(null);
          setIsRepositioning(false);
          setRepositionedCoords(null);
        });

        marker.bindPopup(`
          <div style="min-width: 210px; font-family: inherit;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #0f172a; color: #fde047; padding: 2px 6px; border-radius: 6px; font-weight: 900; font-family: monospace; font-size: 11px;">[${streetCode}]</span>
              <span style="font-weight: bold; font-size: 12px; color: #174B36;">${tree.displayName}</span>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px;">📍 ${milestone}</div>
            <div style="font-size: 10px; color: #64748b;">${corridor}</div>
            <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color};">
                ${tree.healthStatus}
              </span>
              <span style="font-size: 10px; color: #347A50; font-weight: 700; font-family: monospace;">EVM On-Chain</span>
            </div>
          </div>
        `);

        layer.addLayer(marker);
        treeMarkersMapRef.current.set(tree.id, marker);

        // 🛡️ VÙNG BẢO VỆ RỄ CÂY (ROOT PROTECTION ZONE - RPZ) THEO TIÊU CHUẨN BS 5837
        if (showRootProtectionZone || activeSelectedTree?.id === tree.id) {
          const rpzRadius = Math.max(
            3,
            tree.canopyDiameterM ? Math.round((tree.canopyDiameterM / 2) * 10) / 10 : 3,
            Math.round((tree.diameterCm || 25) * 0.12 * 10) / 10
          );
          const isCurrentSelected = activeSelectedTree?.id === tree.id;
          const circleColor = tree.healthStatus === 'CRITICAL' ? '#EF4444' : '#F59E0B';
          const rpzCircle = L.circle([tree.latitude, tree.longitude], {
            radius: rpzRadius,
            color: circleColor,
            weight: isCurrentSelected ? 2.5 : 1.5,
            dashArray: '5, 5',
            fillColor: circleColor,
            fillOpacity: isCurrentSelected ? 0.28 : 0.14,
          });
          rpzCircle.bindTooltip(
            `🛡️ <strong>Vùng bảo vệ rễ (RPZ): ${rpzRadius}m</strong><br/>
             <span>[${streetCode}] ${tree.displayName}</span><br/>
             <span style="font-size:10px; color:#b45309;">⚠️ Chuẩn BS 5837: Cấm đào cáp / đặt máy xúc cơ giới vi phạm rễ cọc.</span>`,
            { sticky: true }
          );
          rpzLayerRef.current?.addLayer(rpzCircle);
        }
      });
    }

    // 2. Add Incident Markers
    if (showIncidents) {
      incidents.forEach((inc) => {
        if (inc.status === 'RESOLVED') return;

        const isCritical = inc.severity === 'CRITICAL';
        const color = isCritical ? '#DC2626' : '#EA580C';

        const customHtml = `
          <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 8px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(220,38,38,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            cursor: pointer;
            animation: pulse 2s infinite;
          ">
            ⚠️
          </div>
        `;

        const icon = L.divIcon({
          html: customHtml,
          className: 'custom-incident-pin',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon });

        marker.on('click', () => {
          setActiveSelectedIncident(inc);
          setActiveSelectedTree(null);
        });

        marker.bindPopup(`
          <div style="min-width: 190px; font-family: inherit;">
            <div style="font-weight: bold; font-size: 12px; color: #DC2626;">${inc.publicCode} · ${inc.severity}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">${inc.description}</div>
            <div style="margin-top: 6px; font-size: 10px; color: #64748b;">
              Trạng thái: <strong>${inc.status}</strong>
            </div>
          </div>
        `);

        layer.addLayer(marker);
      });
    }
  }, [
    trees,
    incidents,
    showTrees,
    showIncidents,
    showRootProtectionZone,
    activeSelectedTree,
    selectedHealth,
    selectedCorridorFilter,
    selectedLocation,
    debouncedLocationQuery,
    selectedProvinceId,
    selectedZoneId,
    mapViewportVersion,
  ]);

  // Handle Location Landmark Select & FlyTo
  const handleSelectLocation = (locId: string) => {
    setSelectedLocation(locId);
    if (locId !== 'ALL') {
      const loc = ALL_LOCATION_LANDMARKS.find((l) => l.id === locId);
      if (loc && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(loc.coords, loc.zoom, { duration: 1.2 });
        showToast(`📍 Đã bay tới vị trí: ${loc.name}`);
      }
    }
  };

  // 4. Handle Repositioning Toggle
  const startRepositioning = (tree: Tree) => {
    setIsRepositioning(true);
    setRepositionedCoords({ lat: tree.latitude, lng: tree.longitude });

    const marker = treeMarkersMapRef.current.get(tree.id);
    if (marker) {
      marker.dragging?.enable();
      marker.openPopup();

      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setRepositionedCoords({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        });
      });

      showToast('Đã bật chế độ kéo thả ghim cây! Hãy kéo marker đến vị trí mới trên bản đồ.');
    }
  };

  const cancelRepositioning = () => {
    if (activeSelectedTree) {
      const marker = treeMarkersMapRef.current.get(activeSelectedTree.id);
      if (marker) {
        marker.setLatLng([activeSelectedTree.latitude, activeSelectedTree.longitude]);
        marker.dragging?.disable();
      }
    }
    setIsRepositioning(false);
    setRepositionedCoords(null);
  };

  const saveRepositioning = async () => {
    if (!activeSelectedTree || !repositionedCoords) return;

    try {
      await storage.updateTree(activeSelectedTree.id, {
        latitude: repositionedCoords.lat,
        longitude: repositionedCoords.lng,
      });

      const updatedTree = storage.getTreeById(activeSelectedTree.id);
      if (updatedTree) {
        setActiveSelectedTree(updatedTree);
      }

      const marker = treeMarkersMapRef.current.get(activeSelectedTree.id);
      if (marker) {
        marker.dragging?.disable();
      }

      setIsRepositioning(false);
      setRepositionedCoords(null);
      showToast('Đã lưu tọa độ mới và cập nhật Blockchain Smart Contract thành công!');
      onTreeUpdated?.();
    } catch (err: any) {
      alert('Lỗi cập nhật tọa độ: ' + err.message);
    }
  };

  // 5. Handle Tree Deletion / Giải tỏa
  const confirmDeleteTree = () => {
    if (!treeToDelete) return;

    const success = storage.deleteTree(treeToDelete.id);
    if (success) {
      // Remove marker from map
      const marker = treeMarkersMapRef.current.get(treeToDelete.id);
      if (marker) {
        markersLayerRef.current?.removeLayer(marker);
        treeMarkersMapRef.current.delete(treeToDelete.id);
      }

      setActiveSelectedTree(null);
      setTreeToDelete(null);
      showToast(`Đã giải tỏa cây [${treeToDelete.streetCode || treeToDelete.publicCode}] khỏi cơ sở dữ liệu GIS!`);
      onTreeUpdated?.();
    } else {
      alert('Không thể xóa cây.');
    }
  };

  // 6. My Live Location (GPS Navigator)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        userLocationLayerRef.current?.clearLayers();

        const locIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 24px; height: 24px;">
              <div style="
                position: absolute;
                inset: -8px;
                border-radius: 50%;
                background: rgba(59, 130, 246, 0.35);
                animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
              <div style="
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background: #2563eb;
                border: 3px solid white;
                box-shadow: 0 0 14px rgba(37,99,235,0.7);
              "></div>
            </div>
          `,
          className: 'user-loc-pin',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([lat, lng], { icon: locIcon })
          .bindPopup('<strong>📍 Vị trí hiện tại của bạn</strong>')
          .addTo(userLocationLayerRef.current!);

        mapInstanceRef.current?.flyTo([lat, lng], 17, { duration: 1.5 });
        showToast('Đã bắt tọa độ GPS thực tế của bạn!');
      },
      (err) => {
        showToast('Không thể lấy GPS: ' + err.message + '. Bay về trung tâm Cần Thơ.');
        mapInstanceRef.current?.flyTo([10.0345, 105.7882], 15);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filtered trees for current province & zone
  const currentProvinceTrees =
    selectedProvinceId === 'all'
      ? trees
      : trees.filter((t) => getTreeProvinceId(t) === selectedProvinceId);

  const currentZoneTrees =
    selectedZoneId === 'all'
      ? currentProvinceTrees
      : currentProvinceTrees.filter((t) => getTreeZoneId(t) === selectedZoneId);

  const filteredTrees = currentZoneTrees.filter((tree) => {
    if (selectedHealth !== 'ALL' && tree.healthStatus !== selectedHealth) return false;
    if (selectedCorridorFilter !== 'ALL' && getTreeCorridor(tree) !== selectedCorridorFilter) return false;
    if (selectedLocation !== 'ALL') {
      const loc = ALL_LOCATION_LANDMARKS.find((l) => l.id === selectedLocation);
      if (loc) {
        const text = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode}`.toLowerCase();
        if (!loc.keywords.some((k) => text.includes(k.toLowerCase()))) return false;
      }
    }
    if (debouncedLocationQuery.trim()) {
      const q = debouncedLocationQuery.toLowerCase().trim();
      const text = `${tree.address} ${tree.displayName} ${tree.houseNumberMilestone} ${tree.streetCorridor} ${tree.streetCode} ${tree.publicCode}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const goodTreesCount = currentZoneTrees.filter((t) => t.healthStatus === 'GOOD').length;
  const goodRate = currentZoneTrees.length > 0 ? Math.round((goodTreesCount / currentZoneTrees.length) * 100) : 100;

  // Available corridors dynamic based on current province trees
  const availableCorridors = React.useMemo(() => {
    const list: { name: string; prefix: string }[] = [];
    const seen = new Set<string>();

    currentProvinceTrees.forEach((t) => {
      const corr = getTreeCorridor(t);
      if (corr && !seen.has(corr)) {
        seen.add(corr);
        const streetCode = getTreeStreetCode(t);
        const prefix = streetCode ? streetCode.split('-')[0] : 'TP';
        list.push({ name: corr, prefix });
      }
    });

    if (list.length === 0) {
      return STREET_CORRIDORS_LIST.map((c) => ({ name: c.name, prefix: c.prefix }));
    }
    return list;
  }, [currentProvinceTrees]);

  // Available landmarks filtered by current province
  const availableLandmarks = React.useMemo(() => {
    if (selectedProvinceId === 'all') return ALL_LOCATION_LANDMARKS;
    return ALL_LOCATION_LANDMARKS.filter((l) => l.provinceId === selectedProvinceId);
  }, [selectedProvinceId]);

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* 👑 ADMIN MULTI-DISTRICT / ZONE CONTROLLER BAR */}
      <div className="bento-card p-3.5 sm:p-4 dark:bg-[#0c1812] dark:border-emerald-500/20 flex flex-col gap-3">
        {/* Row 1: Header + Admin Badge + Location Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <h1 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Bản đồ Số Cây Xanh &amp; Không Gian GIS Đô Thị</span>
                {isAdmin && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>ADMIN JURISDICTION</span>
                  </span>
                )}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeZone.agency} · {activeZone.description}
            </p>
          </div>

          {/* Quick Actions (GPS Me + Add Tree on Map) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* GPS Locate Me Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Định vị tọa độ thiết bị của tôi"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Vị trí của tôi</span>
            </button>

            {/* Admin Add Tree via Map Pin */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  const nextState = !isPinAddMode;
                  setIsPinAddMode(nextState);
                  if (nextState) {
                    showToast('🎯 Chế độ ghim đang bật: Hãy click bất kỳ điểm nào trên bản đồ để cắm mốc cây mới!');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isPinAddMode
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30 ring-2 ring-rose-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{isPinAddMode ? 'Hủy ghim vị trí' : '➕ Ghim thêm cây trên map'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2A: 🏙️ BỘ CHỌN TỈNH / THÀNH PHỐ TOÀN QUỐC (NATIONAL PROVINCE SELECTOR) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Tỉnh / Thành phố:</span>
            </span>

            {NATIONAL_PROVINCES.map((prov) => {
              const isProvSelected = selectedProvinceId === prov.id;
              const provTreeCount =
                prov.id === 'all' ? trees.length : (treesByProvince[prov.id] || 0);

              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => handleSelectProvince(prov.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                    isProvSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
                  }`}
                >
                  <span>{prov.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                      isProvSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {provTreeCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Badge Cơ quan chủ quản theo Tỉnh / Thành */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900 text-blue-800 dark:text-blue-300 font-mono text-[10px] uppercase">
              {activeProvince.badge}
            </span>
          </div>
        </div>

        {/* Row 2B: 🏛️ QUẬN / HUYỆN & KHU VỰC QUẢN LÝ (DYNAMIC DISTRICTS) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Khu vực ({activeProvince.shortName}):</span>
            </span>

            {/* District / Zone Buttons of Active Province */}
            {availableZones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const countInZone =
                zone.id === 'all'
                  ? currentProvinceTrees.length
                  : currentProvinceTrees.filter((t) => getTreeZoneId(t) === zone.id).length;

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => handleSelectZone(zone.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
                  }`}
                >
                  <span>{zone.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {countInZone}
                  </span>
                </button>
              );
            })}
          </div>

          {/* District Quick Stats Pill */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300 self-end lg:self-auto shrink-0">
            <span>Cây trong vùng: <strong className="text-emerald-700 dark:text-emerald-400">{currentZoneTrees.length} cây</strong></span>
            <span>·</span>
            <span>Khỏe mạnh: <strong className="text-teal-700 dark:text-teal-400">{goodRate}%</strong></span>
          </div>
        </div>

        {/* Row 3: Sub-filters (Trees checkbox, Location dropdown, Corridor dropdown, Search input, Health status) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-slate-200 dark:border-emerald-800/60">
              <input
                type="checkbox"
                checked={showTrees}
                onChange={(e) => setShowTrees(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">Cây xanh ({filteredTrees.length})</span>
            </label>

            {/* 📍 BỘ LỌC VỊ TRÍ / ĐỊA ĐIỂM (ĐỒNG BỘ THEO TỈNH THÀNH) */}
            <select
              value={selectedLocation}
              onChange={(e) => handleSelectLocation(e.target.value)}
              className="px-3 py-1 text-xs font-bold border border-emerald-300 dark:border-emerald-600/70 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs max-w-[210px] truncate"
              title="Chọn vị trí hoặc địa điểm nổi tiếng để bản đồ tự động bay tới và lọc cây"
            >
              <option value="ALL">📍 Tất cả vị trí / địa điểm</option>
              {availableLandmarks.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district})
                </option>
              ))}
            </select>

            {/* Lọc Tuyến Phố (Đồng bộ theo tỉnh thành) */}
            <select
              value={selectedCorridorFilter}
              onChange={(e) => setSelectedCorridorFilter(e.target.value)}
              className="px-3 py-1 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">🛣️ Tất cả tuyến đường</option>
              {availableCorridors.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.prefix})
                </option>
              ))}
            </select>

            {/* 🔍 Ô TÌM KIẾM NHANH VỊ TRÍ, SỐ NHÀ, ĐỊA CHỈ */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm số nhà, vị trí..."
                value={searchLocationInput}
                onChange={(e) => setSearchLocationInput(e.target.value)}
                className="pl-7 pr-6 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 w-36 sm:w-44 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchLocationInput && (
                <button
                  type="button"
                  onClick={() => setSearchLocationInput('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800/60">
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="font-semibold text-rose-800 dark:text-rose-300">
                Sự cố ({incidents.filter((i) => i.status !== 'RESOLVED').length})
              </span>
            </label>

            {/* 🛡️ CÔNG TẮC BẬT VÙNG BẢO VỆ RỄ CÂY (ROOT PROTECTION ZONE - RPZ) */}
            <label
              className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700/60 shadow-2xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              title="Quy chuẩn BS 5837: Hiển thị bán kính bảo vệ rễ cây an toàn khi thi công đào vỉa hè / đặt cáp viễn thông"
            >
              <input
                type="checkbox"
                checked={showRootProtectionZone}
                onChange={(e) => setShowRootProtectionZone(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <span>🛡️ Vùng rễ (RPZ)</span>
              </span>
            </label>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Sức khỏe:</span>
              <select
                value={selectedHealth}
                onChange={(e) => setSelectedHealth(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="GOOD">Tốt</option>
                <option value="FAIR">Bình thường</option>
                <option value="POOR">Kém</option>
                <option value="CRITICAL">Nguy cấp</option>
              </select>
            </div>
          </div>

          {/* Current Live Cursor GPS Coordinates */}
          {cursorCoords && (
            <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
              📍 {cursorCoords.lat.toFixed(5)}, {cursorCoords.lng.toFixed(5)}
            </div>
          )}
        </div>
      </div>

      {/* 🗺️ MAP CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-emerald-500/20 shadow-lg shadow-slate-900/5 h-[620px] bg-slate-100 dark:bg-slate-950">
        {/* ⚡ GIS High-Performance LOD Badge (Tầm nhìn toàn cảnh) */}
        {currentZoom < 14 && trees.length > 300 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-emerald-500/40 shadow-xl flex items-center gap-2.5 text-xs pointer-events-auto">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>⚡ <strong>Tầm nhìn toàn cảnh:</strong> Đang tối ưu 300 cây tiêu biểu. Phóng to vào từng tuyến phố để xem toàn bộ chi tiết.</span>
          </div>
        )}

        {/* Banner while Pin-Adding mode is active */}
        {isPinAddMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce pointer-events-auto">
            <Crosshair className="w-4 h-4 animate-spin" />
            <span>🎯 CHẾ ĐỘ GHIM: Hãy click vào vỉa hè / vị trí trên bản đồ để cắm mốc cây xanh mới</span>
            <button
              onClick={() => setIsPinAddMode(false)}
              className="ml-2 bg-emerald-700 hover:bg-emerald-800 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Repositioning Banner for Selected Tree */}
        {isRepositioning && activeSelectedTree && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-black animate-fade-in pointer-events-auto">
            <Compass className="w-4 h-4 animate-spin" />
            <span>
              📍 Đang định vị lại [{getTreeStreetCode(activeSelectedTree)}]: Kéo thả marker trên map
              {repositionedCoords && ` (${repositionedCoords.lat}, ${repositionedCoords.lng})`}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={saveRepositioning}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu vị trí mới</span>
              </button>
              <button
                onClick={cancelRepositioning}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Map Element */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-10 ${isPinAddMode ? 'cursor-crosshair' : ''}`}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-[#0c1812]/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-emerald-500/30 shadow-xl text-xs space-y-2 pointer-events-auto">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Chú giải GIS · {activeZone.shortName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300">Sinh trưởng tốt (GOOD)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300">Bình thường (FAIR)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300">Kém / Cần tỉa cành (POOR)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300">Nguy cấp / Nghiêng (CRITICAL)</span>
          </div>
          <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="w-3 h-3 rounded bg-red-600 inline-block" />
            <span className="text-red-700 dark:text-red-400 font-semibold">Điểm nóng sự cố</span>
          </div>
        </div>

        {/* 🌿 SELECTED TREE FLOATING DRAWER (WITH ADMIN CRUD & REPOSITION) */}
        {activeSelectedTree && (
          <div className="absolute top-4 right-4 z-20 w-88 bg-white dark:bg-[#0c1812] rounded-2xl border border-[#E0EBDD] dark:border-emerald-500/30 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-right-4 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-900 text-amber-300 border border-slate-700 shadow-2xs">
                    [{getTreeStreetCode(activeSelectedTree)}]
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400">
                    {activeSelectedTree.publicCode}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">
                  {activeSelectedTree.displayName}
                </h3>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  📍 {getTreeMilestone(activeSelectedTree)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {getTreeCorridor(activeSelectedTree)} · Tọa độ: {activeSelectedTree.latitude.toFixed(5)}, {activeSelectedTree.longitude.toFixed(5)}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveSelectedTree(null);
                  setIsRepositioning(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-lg text-slate-600 dark:text-slate-300 font-mono text-[11px] border border-transparent dark:border-slate-800">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Sức khỏe</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{activeSelectedTree.healthStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Đường kính/Cao</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {activeSelectedTree.diameterCm || 30}cm / {activeSelectedTree.heightM || 8}m
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">🛡️ Vùng rễ (RPZ)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {Math.max(
                    3,
                    activeSelectedTree.canopyDiameterM ? Math.round((activeSelectedTree.canopyDiameterM / 2) * 10) / 10 : 3,
                    Math.round((activeSelectedTree.diameterCm || 25) * 0.12 * 10) / 10
                  )}m
                </span>
              </div>
            </div>

            {/* 🛠️ ADMIN CRUD & REPOSITION ACTIONS */}
            {isAdmin && (
              <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Quyền Quản Trị Viên (Admin)</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Sửa thông tin cây */}
                  <button
                    type="button"
                    onClick={() => onOpenEditTree(activeSelectedTree)}
                    className="py-1.5 px-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Sửa thông tin</span>
                  </button>

                  {/* Định vị lại tọa độ (Kéo thả marker) */}
                  <button
                    type="button"
                    onClick={() => startRepositioning(activeSelectedTree)}
                    className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title="Kéo thả marker trên map để cập nhật tọa độ GPS chuẩn xác"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Định vị lại</span>
                  </button>
                </div>

                {/* Xóa / Giải tỏa cây */}
                <button
                  type="button"
                  onClick={() => setTreeToDelete(activeSelectedTree)}
                  className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg font-bold border border-rose-200 dark:border-rose-800/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Giải tỏa / Xóa hồ sơ cây này</span>
                </button>
              </div>
            )}

            {/* Standard View Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onSelectTree(activeSelectedTree)}
                className="flex-1 py-1.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem hồ sơ</span>
              </button>
              <button
                onClick={() => onOpenCareModal(activeSelectedTree.id)}
                className="px-3 py-1.5 bg-[#E0EBDD] hover:bg-[#d0dfcc] dark:bg-emerald-950/60 hover:dark:bg-emerald-900/60 text-[#174B36] dark:text-emerald-300 dark:border dark:border-emerald-800/50 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Chăm sóc
              </button>
            </div>
          </div>
        )}

        {/* Selected Incident Drawer */}
        {activeSelectedIncident && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-white dark:bg-[#0c1812] rounded-xl border border-red-200 dark:border-rose-500/30 shadow-xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-rose-950/80 text-red-700 dark:text-rose-400 dark:border dark:border-rose-800/50">
                  {activeSelectedIncident.publicCode}
                </span>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">{activeSelectedIncident.severity} - Sự cố</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeSelectedIncident.address}</p>
              </div>
              <button
                onClick={() => setActiveSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-red-50/50 dark:bg-rose-950/30 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] border border-transparent dark:border-rose-900/40">
              {activeSelectedIncident.description}
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-400">
              Người báo: {activeSelectedIncident.reporterName} · Trạng thái: {activeSelectedIncident.status}
            </div>
          </div>
        )}
      </div>

      {/* ⚠️ DIALOG XÁC NHẬN GIẢI TỎA / XÓA CÂY (ADMIN CONFIRMATION MODAL) */}
      {treeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-md w-full border border-rose-300 dark:border-rose-800/80 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Xác nhận Giải tỏa / Xóa Cây</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Thao tác này sẽ gỡ bỏ cây khỏi bản đồ GIS.</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40 text-xs space-y-1">
              <div>Mã tuyến: <strong className="font-mono text-slate-900 dark:text-slate-100">[{getTreeStreetCode(treeToDelete)}]</strong> ({treeToDelete.publicCode})</div>
              <div>Tên cây: <strong className="text-slate-900 dark:text-slate-100">{treeToDelete.displayName}</strong></div>
              <div>Vị trí: {getTreeMilestone(treeToDelete)}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lý do giải tỏa / xóa:
              </label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
              >
                <option value="Chặt hạ giải tỏa quy hoạch">Chặt hạ giải tỏa quy hoạch mở rộng đường</option>
                <option value="Cây chết khô bão đổ">Cây chết khô / ngã đổ sau mưa bão</option>
                <option value="Di dời sang vườn ươm">Bứng dời sang vườn ươm thành phố</option>
                <option value="Sai lệch dữ liệu thực địa">Sai lệch dữ liệu Excel so với thực địa</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTreeToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteTree}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận giải tỏa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
