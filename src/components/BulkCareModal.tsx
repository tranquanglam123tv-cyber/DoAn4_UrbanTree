import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Truck,
  Wrench,
  Trees,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  MapPin,
  CheckSquare,
  Square,
  Camera,
  Upload,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CareActionType, Tree, TreeHealthStatus, User } from '../types';
import { storage } from '../db/storage';
import {
  getTreeCorridor,
  getTreeMilestone,
  getTreeStreetCode,
  getTreeGeneralArea,
} from '../utils/treeUtils';
import { NATIONAL_PROVINCES, getTreeProvinceId } from '../utils/zoneUtils';
import { assertPermission } from '../utils/permissionUtils';

interface BulkCareModalProps {
  initialCorridor?: string;
  initialArea?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const BulkCareModal: React.FC<BulkCareModalProps> = ({
  initialCorridor,
  initialArea,
  onClose,
  onSaved,
}) => {
  const allTrees = storage.getTrees();
  const currentUser = storage.getActiveUser();

  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>(initialArea || 'ALL');
  const [selectedCorridor, setSelectedCorridor] = useState<string>(initialCorridor || 'ALL');
  const [selectedTreeIds, setSelectedTreeIds] = useState<Set<string>>(new Set());

  // Form fields for bulk action
  const [actionType, setActionType] = useState<CareActionType>('WATERING');
  const [targetHealth, setTargetHealth] = useState<TreeHealthStatus>('GOOD');
  const [equipmentUsed, setEquipmentUsed] = useState('Xe bồn tưới chuyên dụng 5m3 & Vòi phun áp lực');
  const [chemicalsUsed, setChemicalsUsed] = useState('Phân bón hữu cơ vi sinh NPK sinh học kích rễ');
  const [notes, setNotes] = useState('Duy tu, tưới nước bổ sung vi sinh định kỳ theo tuyến đường');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter trees by province, area, corridor
  const availableTrees = useMemo(() => {
    return allTrees.filter((t) => {
      if (selectedProvince !== 'all' && getTreeProvinceId(t) !== selectedProvince) return false;
      if (selectedArea !== 'ALL' && getTreeGeneralArea(t) !== selectedArea) return false;
      if (selectedCorridor !== 'ALL' && getTreeCorridor(t) !== selectedCorridor) return false;
      return true;
    });
  }, [allTrees, selectedProvince, selectedArea, selectedCorridor]);

  // Available Areas
  const availableAreas = useMemo(() => {
    const counts: { [area: string]: number } = {};
    allTrees.forEach((t) => {
      if (selectedProvince !== 'all' && getTreeProvinceId(t) !== selectedProvince) return;
      const a = getTreeGeneralArea(t);
      counts[a] = (counts[a] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allTrees, selectedProvince]);

  // Available Corridors
  const availableCorridors = useMemo(() => {
    const counts: { [c: string]: number } = {};
    allTrees.forEach((t) => {
      if (selectedProvince !== 'all' && getTreeProvinceId(t) !== selectedProvince) return;
      if (selectedArea !== 'ALL' && getTreeGeneralArea(t) !== selectedArea) return;
      const c = getTreeCorridor(t);
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allTrees, selectedProvince, selectedArea]);

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedTreeIds.size === availableTrees.length) {
      setSelectedTreeIds(new Set());
    } else {
      setSelectedTreeIds(new Set(availableTrees.map((t) => t.id)));
    }
  };

  const handleToggleTree = (treeId: string) => {
    const next = new Set(selectedTreeIds);
    if (next.has(treeId)) next.delete(treeId);
    else next.add(treeId);
    setSelectedTreeIds(next);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh tối đa 5MB');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!assertPermission(currentUser, 'CARE_WRITE', 'Ghi nhật ký chăm sóc hàng loạt')) {
      return;
    }

    if (selectedTreeIds.size === 0) {
      setError('Vui lòng tích chọn ít nhất 1 cây để thực hiện chăm sóc hàng loạt');
      return;
    }

    if (!notes.trim()) {
      setError('Vui lòng nhập mô tả công việc chăm sóc cho đợt công tác này');
      return;
    }

    setIsSubmitting(true);
    try {
      const treeIdList = Array.from(selectedTreeIds);
      await storage.batchCareMaintenance({
        treeIds: treeIdList,
        staffUserId: currentUser.id,
        staffName: currentUser.fullName,
        actionType,
        notes: notes.trim(),
        imageUrl: imageUrl || imagePreview || undefined,
        equipmentUsed,
        chemicalsUsed,
        targetHealthAfter: targetHealth,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi lưu chăm sóc hàng loạt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl text-amber-300 border border-white/20 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Chăm Sóc &amp; Duy Tu Cây Xanh Hàng Loạt
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] uppercase">
                  Ca Trực Thực Địa
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Áp dụng quy trình cơ giới hóa: Cắt tỉa, tưới bồn, phun sinh học cho toàn bộ dãy cây trên tuyến đường
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overscroll-contain space-y-5 flex-1" data-lenis-prevent>
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* 📍 PHẦN 1: BỘ LỌC CHỌN VÙNG & TUYẾN ĐƯỜNG CÔNG TÁC */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>1. Chọn Địa Bàn &amp; Tuyến Phố Cần Duy Tu Hàng Loạt:</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                Tìm thấy {availableTrees.length} cây
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Tỉnh / Toàn quốc */}
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Tỉnh / Thành phố:</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setSelectedArea('ALL');
                    setSelectedCorridor('ALL');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">🌐 Toàn quốc</option>
                  {NATIONAL_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quận / Huyện */}
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Địa phương / Quận:</label>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setSelectedCorridor('ALL');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">📍 Tất cả địa phương</option>
                  {availableAreas.map(([area, count]) => (
                    <option key={area} value={area}>
                      {area} ({count} cây)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tuyến đường */}
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Tuyến đường liên hoàn:</label>
                <select
                  value={selectedCorridor}
                  onChange={(e) => setSelectedCorridor(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-900 dark:text-emerald-300"
                >
                  <option value="ALL">🛣️ Tất cả tuyến đường</option>
                  {availableCorridors.map(([c, count]) => (
                    <option key={c} value={c}>
                      {c} ({count} cây)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checklist Chọn Cây Nhanh */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  {selectedTreeIds.size === availableTrees.length && availableTrees.length > 0 ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bỏ chọn tất cả</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Chọn tất cả ({availableTrees.length} cây)</span>
                    </>
                  )}
                </button>

                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Đã chọn: <strong className="text-sm font-mono">{selectedTreeIds.size}</strong> / {availableTrees.length} cây
                </span>
              </div>

              {/* Danh sách cuộn các cây */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {availableTrees.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">Không có cây nào trong khu vực này.</div>
                ) : (
                  availableTrees.map((t) => {
                    const isChecked = selectedTreeIds.has(t.id);
                    const streetCode = getTreeStreetCode(t);
                    const milestone = getTreeMilestone(t);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTree(t.id)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs ${
                          isChecked
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                          />
                          <span className="px-2 py-0.5 rounded font-mono font-black bg-slate-900 text-amber-300 text-[10px] shrink-0">
                            [{streetCode}]
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {t.displayName}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
                            · {milestone}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            t.healthStatus === 'GOOD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.healthStatus === 'FAIR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.healthStatus}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 🚜 PHẦN 2: THIẾT LẬP THAO TÁC CHĂM SÓC HÀNG LOẠT */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <Wrench className="w-4 h-4 text-emerald-600" />
              <span>2. Thông Số Kỹ Thuật &amp; Vật Tư Cơ Giới Áp Dụng:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại công việc chăm sóc hàng loạt *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as CareActionType)}
                  className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:border-emerald-500"
                >
                  <option value="WATERING">Tưới nước giữ ẩm bằng xe bồn (WATERING)</option>
                  <option value="PRUNING">Cắt tỉa cành khô, hạ độ cao đón bão (PRUNING)</option>
                  <option value="FERTILIZING">Bón phân hữu cơ vi sinh NPK kích rễ (FERTILIZING)</option>
                  <option value="PEST_CONTROL">Phun chế phẩm sinh học Trichoderma trừ sâu (PEST_CONTROL)</option>
                  <option value="TREATMENT">Bôi keo sẹo Tree Seal &amp; Quét vôi Bordeaux (TREATMENT)</option>
                  <option value="SUPPORT_STAKE">Chống cọc đỡ &amp; Gia cố đai cao su (SUPPORT_STAKE)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái sức khỏe sau chăm sóc
                </label>
                <select
                  value={targetHealth}
                  onChange={(e) => setTargetHealth(e.target.value as TreeHealthStatus)}
                  className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:border-emerald-500"
                >
                  <option value="GOOD">Tốt (GOOD) - Đã phục hồi &amp; an toàn</option>
                  <option value="FAIR">Bình thường (FAIR) - Đang theo dõi</option>
                  <option value="POOR">Kém (POOR) - Cần dưỡng thêm</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thiết bị cơ giới huy động
                </label>
                <select
                  value={equipmentUsed}
                  onChange={(e) => setEquipmentUsed(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="Xe bồn tưới chuyên dụng 5m3 & Vòi phun áp lực">Xe bồn tưới chuyên dụng 5m3</option>
                  <option value="Xe thang tự hành 18m & Cưa xích Stihl MS-194T">Xe thang 18m + Cưa xích Stihl</option>
                  <option value="Xe cẩu tự hành 5 tấn & Dây cáp giằng néo">Xe cẩu 5 tấn + Cáp giằng néo</option>
                  <option value="Bình phun áp lực cao Stihl SR-450">Bình phun áp lực cao Stihl SR-450</option>
                  <option value="Bộ cưa tay lâm sinh & Kéo cắt cành cao">Bộ cưa tay lâm sinh & Kéo cắt cành cao</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vật tư &amp; Hóa chất lâm sinh
                </label>
                <select
                  value={chemicalsUsed}
                  onChange={(e) => setChemicalsUsed(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="Phân bón hữu cơ vi sinh NPK sinh học kích rễ">Phân hữu cơ vi sinh NPK kích rễ</option>
                  <option value="Keo liền sẹo cây Tree Seal & Sơn vôi sát trùng">Keo liền sẹo Tree Seal + Sơn vôi quét gốc</option>
                  <option value="Chế phẩm sinh học Trichoderma phòng nấm rễ">Chế phẩm sinh học Trichoderma</option>
                  <option value="Cọc chống gỗ phi 8cm & Đai cao su giảm chấn">Cọc chống gỗ phi 8cm + Đai cao su</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú tổng hợp ca trực *
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi rõ nội dung thực hiện cho toàn bộ dãy cây trên tuyến..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hình ảnh đại diện ca trực hiện trường
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>{imagePreview ? 'Đã chọn ảnh hiện trường (Bấm để đổi)' : 'Tải ảnh hiện trường ca trực cơ giới'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || selectedTreeIds.size === 0}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                selectedTreeIds.size === 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer shadow-emerald-700/20'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Đang băm Blockchain & lưu trữ...'
                  : `Xác nhận Chăm Sóc Hàng Loạt (${selectedTreeIds.size} Cây)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

