import React, { useState } from 'react';
import {
  Trees,
  Search,
  Filter,
  Plus,
  QrCode,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ClipboardList,
  Edit,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Tree, TreeHealthStatus } from '../types';
import { storage } from '../db/storage';

interface TreeListViewProps {
  onSelectTree: (tree: Tree) => void;
  onOpenQrModal: (tree: Tree) => void;
  onOpenAddTree: () => void;
  onOpenEditTree: (tree: Tree) => void;
  onOpenCareModal: (treeId: string) => void;
  onOpenPublicView: (tree: Tree) => void;
}

export const TreeListView: React.FC<TreeListViewProps> = ({
  onSelectTree,
  onOpenQrModal,
  onOpenAddTree,
  onOpenEditTree,
  onOpenCareModal,
  onOpenPublicView,
}) => {
  const trees = storage.getTrees();
  const treeTypes = storage.getTreeTypes();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      tree.publicCode.toLowerCase().includes(search.toLowerCase()) ||
      tree.displayName.toLowerCase().includes(search.toLowerCase()) ||
      tree.address.toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedType === 'ALL' || tree.treeTypeId === selectedType;
    const matchesHealth = selectedHealth === 'ALL' || tree.healthStatus === selectedHealth;

    return matchesSearch && matchesType && matchesHealth;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#174B36] dark:text-[#00FF9D] flex items-center gap-2">
            <Trees className="w-6 h-6 text-[#347A50] dark:text-emerald-400" />
            <span>Danh mục &amp; Hồ sơ Cây xanh Đô thị</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mỗi cây xanh được gán mã định danh duy nhất và bảo chứng tính toàn vẹn trên Smart Contract.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              title="Chế độ lưới"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#174B36] shadow-xs dark:bg-[#0c1812] dark:text-[#00FF9D] dark:border dark:border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Chế độ bảng"
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#174B36] shadow-xs dark:bg-[#0c1812] dark:text-[#00FF9D] dark:border dark:border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddTree}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174B36] hover:bg-[#347A50] text-white text-xs font-semibold rounded-xl transition-all shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm cây mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bento-card flex flex-wrap items-center gap-3 dark:bg-[#0c1812] dark:border-slate-800">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã cây (TREE-001), tên, hoặc địa chỉ..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700/80 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Loài cây:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700/80 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">Tất cả các loài</option>
            {treeTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-2">
            <span>Sức khỏe:</span>
          </div>
          <select
            value={selectedHealth}
            onChange={(e) => setSelectedHealth(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700/80 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="GOOD">Tốt (GOOD)</option>
            <option value="FAIR">Bình thường (FAIR)</option>
            <option value="POOR">Kém (POOR)</option>
            <option value="CRITICAL">Nguy cấp (CRITICAL)</option>
            <option value="DEAD">Chết khô (DEAD)</option>
          </select>

          <span className="text-xs text-emerald-700 dark:text-[#00FF9D] font-mono font-semibold pl-2">
            {filteredTrees.length}/{trees.length} cây
          </span>
        </div>
      </div>

      {/* Main Trees Display */}
      {filteredTrees.length === 0 ? (
        <div className="p-12 text-center bento-card border-dashed text-slate-400 dark:text-slate-500 text-xs dark:bg-[#0c1812] dark:border-slate-800">
          Không tìm thấy cây xanh nào phù hợp với bộ lọc tìm kiếm.
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View (Bento Style with dark:bg-[#0c1812] dark:border-slate-800) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrees.map((tree) => {
            const treeType = treeTypes.find((t) => t.id === tree.treeTypeId);
            return (
              <div
                key={tree.id}
                className="bento-card overflow-hidden flex flex-col justify-between group cursor-pointer dark:bg-[#0c1812] dark:border-slate-800 dark:hover:border-emerald-500/40 dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all"
                onClick={() => onSelectTree(tree)}
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="h-40 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                    <img
                      src={tree.imageUrl || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'}
                      alt={tree.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-[#00FF9D] font-mono text-xs font-bold shadow-md border border-emerald-500/30">
                      {tree.publicCode}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                          tree.healthStatus === 'GOOD'
                            ? 'bg-emerald-500/90 text-white dark:bg-emerald-950/80 dark:text-[#00FF9D] dark:border dark:border-emerald-500/40'
                            : tree.healthStatus === 'FAIR'
                            ? 'bg-slate-700/80 text-white dark:bg-slate-800/80 dark:text-slate-200 dark:border dark:border-slate-700'
                            : tree.healthStatus === 'POOR'
                            ? 'bg-amber-500/90 text-white dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-500/40'
                            : 'bg-rose-600/90 text-white dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-500/40'
                        }`}
                      >
                        {tree.healthStatus}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-[#00FF9D] transition-colors">
                        {tree.displayName}
                      </h3>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium italic mt-0.5">
                        {treeType?.scientificName || 'Thực vật đô thị'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{tree.address}</span>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800/80" />

                    {/* Tree Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 dark:bg-[#08120c] p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Chiều cao</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 font-mono">{tree.heightMeters || tree.heightM || 8} m</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#08120c] p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Đường kính</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 font-mono">{tree.diameterCm || 30} cm</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#08120c] p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Tuổi ước tính</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 font-mono">{tree.ageYears || 15} năm</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-[#08120c] border-t border-slate-100/90 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQrModal(tree);
                      }}
                      title="Xem mã QR kim loại"
                      className="p-1.5 rounded-full hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-emerald-950/60 dark:hover:text-[#00FF9D] transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPublicView(tree);
                      }}
                      title="Xem cổng công khai"
                      className="p-1.5 rounded-full hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-emerald-950/60 dark:hover:text-[#00FF9D] transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCareModal(tree.id);
                      }}
                      className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200/60 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-[#00FF9D] dark:border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      Chăm sóc
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditTree(tree);
                      }}
                      className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Table View */
        <div className="bg-white dark:bg-[#0c1812] rounded-xl border border-[#E0EBDD] dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#08120c] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã QR</th>
                  <th className="py-3 px-4">Tên &amp; Loài cây</th>
                  <th className="py-3 px-4">Vị trí địa lý</th>
                  <th className="py-3 px-4">Sức khỏe</th>
                  <th className="py-3 px-4">Kích thước</th>
                  <th className="py-3 px-4">Blockchain</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTrees.map((tree) => {
                  const treeType = treeTypes.find((t) => t.id === tree.treeTypeId);
                  return (
                    <tr key={tree.id} className="hover:bg-[#F8FAF8] dark:hover:bg-[#102017]/70 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenQrModal(tree)}
                          className="flex items-center gap-1.5 font-mono font-bold text-[#174B36] hover:underline dark:text-[#00FF9D] cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#347A50] dark:text-emerald-400" />
                          <span>{tree.publicCode}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{tree.displayName}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{treeType?.name}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {tree.address}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            tree.healthStatus === 'GOOD'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-[#00FF9D] dark:border dark:border-emerald-500/40'
                              : tree.healthStatus === 'FAIR'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700'
                              : tree.healthStatus === 'POOR'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-500/40'
                              : 'bg-red-100 text-red-800 dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-500/40'
                          }`}
                        >
                          {tree.healthStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {tree.diameterCm || 30}cm / {tree.heightMeters || tree.heightM || 8}m
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-[#00FF9D] font-semibold font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-[#00FF9D]" />
                          <span>CONFIRMED</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => onSelectTree(tree)}
                          className="px-2 py-1 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded text-[11px] font-medium cursor-pointer"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() => onOpenCareModal(tree.id)}
                          className="px-2 py-1 bg-[#174B36] text-white hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded text-[11px] font-medium cursor-pointer"
                        >
                          Chăm sóc
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
