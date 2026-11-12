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
} from 'lucide-react';
import { storage } from '../db/storage';
import { Incident, Tree } from '../types';
import {
  getTreeCorridor,
  getTreeMilestone,
  getTreeStreetCode,
  STREET_CORRIDORS_LIST,
} from '../utils/treeUtils';

interface MapViewProps {
  onSelectTree: (tree: Tree) => void;
  onOpenCareModal: (treeId: string) => void;
  onOpenIncidentReport: (treeId?: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  onSelectTree,
  onOpenCareModal,
  onOpenIncidentReport,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [showTrees, setShowTrees] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');
  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState<string>('ALL');
  const [activeSelectedTree, setActiveSelectedTree] = useState<Tree | null>(null);
  const [activeSelectedIncident, setActiveSelectedIncident] = useState<Incident | null>(null);

  const trees = storage.getTrees();
  const incidents = storage.getIncidents();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered at Can Tho City (Ninh Kieu Wharf)
      const map = L.map(mapContainerRef.current, {
        center: [10.0345, 105.7882],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Force recalculation of map container dimensions (fixes grey map bug)
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      // cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers whenever filters or data change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    // 1. Add Tree Markers
    if (showTrees) {
      trees.forEach((tree) => {
        if (selectedHealth !== 'ALL' && tree.healthStatus !== selectedHealth) return;
        if (
          selectedCorridorFilter !== 'ALL' &&
          getTreeCorridor(tree) !== selectedCorridorFilter
        )
          return;

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
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
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

        const marker = L.marker([tree.latitude, tree.longitude], { icon });

        marker.on('click', () => {
          setActiveSelectedTree(tree);
          setActiveSelectedIncident(null);
        });

        marker.bindPopup(`
          <div style="min-width: 200px; font-family: inherit;">
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
      });
    }

    // 2. Add Incident Markers
    if (showIncidents) {
      incidents.forEach((inc) => {
        if (inc.status === 'RESOLVED') return; // only show active incidents on map

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

    // Force map tile redraw
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [trees, incidents, showTrees, showIncidents, selectedHealth]);

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bento-card p-4 dark:bg-[#0c1812] dark:border-emerald-500/20">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <span>Bản đồ Số Cây xanh &amp; Điểm nóng Sự cố GIS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tọa độ GPS chuẩn xác từ cơ sở dữ liệu và vị trí phản ánh thời gian thực của người dân.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-slate-200 dark:border-emerald-800/60">
            <input
              type="checkbox"
              checked={showTrees}
              onChange={(e) => setShowTrees(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">Cây xanh ({trees.length})</span>
          </label>

          {/* Lọc Tuyến Phố */}
          <select
            value={selectedCorridorFilter}
            onChange={(e) => setSelectedCorridorFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">📍 Tất cả tuyến đường</option>
            {STREET_CORRIDORS_LIST.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({c.prefix})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-800/60">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <span className="font-semibold text-rose-800 dark:text-rose-300">Sự cố ({incidents.filter((i) => i.status !== 'RESOLVED').length})</span>
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
      </div>

      {/* Map Container Layout */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-emerald-500/20 shadow-lg shadow-slate-900/5 h-[620px] bg-slate-100 dark:bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-[#0c1812]/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-emerald-500/30 shadow-xl text-xs space-y-2 pointer-events-auto">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Chú giải bản đồ GIS</span>
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

        {/* Selected Tree Floating Drawer (if a tree is clicked) */}
        {activeSelectedTree && (
          <div className="absolute top-4 right-4 z-20 w-84 bg-white dark:bg-[#0c1812] rounded-2xl border border-[#E0EBDD] dark:border-emerald-500/30 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-right-4 duration-150">
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
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">{activeSelectedTree.displayName}</h3>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  📍 {getTreeMilestone(activeSelectedTree)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {getTreeCorridor(activeSelectedTree)}
                </p>
              </div>
              <button
                onClick={() => setActiveSelectedTree(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-lg text-slate-600 dark:text-slate-300 font-mono text-[11px] border border-transparent dark:border-slate-800">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Sức khỏe</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{activeSelectedTree.healthStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Đường kính</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{activeSelectedTree.diameterCm || 30} cm</span>
              </div>
            </div>

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

        {/* Selected Incident Floating Drawer (if an incident is clicked) */}
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
    </div>
  );
};
