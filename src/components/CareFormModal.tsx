import React, { useState, useRef } from 'react';
import { X, ClipboardList, Check, ShieldCheck, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { CareActionType, TreeHealthStatus } from '../types';
import { storage } from '../db/storage';
import { TreeSearchSelect } from './common/TreeSearchSelect';
import { assertPermission } from '../utils/permissionUtils';

interface CareFormModalProps {
  initialTreeId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const CareFormModal: React.FC<CareFormModalProps> = ({
  initialTreeId,
  onClose,
  onSaved,
}) => {
  const trees = storage.getTrees();
  const activeUser = storage.getActiveUser();

  const [treeId, setTreeId] = useState(initialTreeId || (trees[0]?.id ?? ''));
  const selectedTree = trees.find((t) => t.id === treeId);

  const [actionType, setActionType] = useState<CareActionType>('PRUNING');
  const [healthBefore, setHealthBefore] = useState<TreeHealthStatus>(selectedTree?.healthStatus || 'FAIR');
  const [healthAfter, setHealthAfter] = useState<TreeHealthStatus>(selectedTree?.healthStatus || 'GOOD');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh chụp thực địa tối đa 5MB');
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

    if (!assertPermission(activeUser, 'CARE_WRITE', 'Ghi nhật ký chăm sóc, bón phân & cắt tỉa')) {
      return;
    }

    if (!notes.trim()) {
      setError('Vui lòng nhập mô tả chi tiết công việc chăm sóc đã thực hiện');
      return;
    }

    if (!imageUrl && !imagePreview) {
      setError('Bắt buộc chụp hoặc tải ảnh hiện trường thực địa trước khi ký số Blockchain');
      return;
    }

    setIsSubmitting(true);
    try {
      await storage.createCareRecord({
        treeId,
        staffUserId: activeUser.id,
        staffName: activeUser.fullName,
        actionType,
        healthBefore,
        healthAfter,
        notes: notes.trim(),
        imageUrl: imageUrl || imagePreview || undefined,
        performedAt: new Date().toISOString(),
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi lưu nhật ký chăm sóc');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-lg w-full max-h-[92vh] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col border border-[#E0EBDD] dark:border-emerald-500/30 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400 dark:border dark:border-emerald-800/50 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#174B36] dark:text-emerald-400">Ghi nhận Nhật ký Chăm sóc Thực địa</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Người thực hiện: {activeUser.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 text-xs"
          data-lenis-prevent
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <TreeSearchSelect
              trees={trees}
              value={treeId}
              onChange={(newTreeId) => {
                setTreeId(newTreeId);
                const t = trees.find((item) => item.id === newTreeId);
                if (t) {
                  setHealthBefore(t.healthStatus);
                  setHealthAfter(t.healthStatus);
                }
              }}
              label="Cây xanh được chăm sóc"
              required
              placeholder="Tìm theo mã cây (ví dụ: HB-01), tên cây hoặc số nhà..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại công việc chăm sóc *</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as CareActionType)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-[#347A50] dark:focus:border-emerald-400 focus:ring-1 focus:ring-[#347A50] bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            >
              <option value="PRUNING">Cắt tỉa cành (PRUNING) - Cành khô, cành vươn nguy hiểm</option>
              <option value="WATERING">Tưới nước giữ ẩm (WATERING)</option>
              <option value="FERTILIZING">Bón phân hữu cơ vi sinh (FERTILIZING)</option>
              <option value="PEST_CONTROL">Xử lý sâu bệnh & mối mọt (PEST_CONTROL)</option>
              <option value="SURVEY">Khảo sát kỹ thuật & độ nghiêng (SURVEY)</option>
              <option value="SUPPORT_STAKE">Chống cọc đỡ & gia cố rễ (SUPPORT_STAKE)</option>
              <option value="TREATMENT">Bôi keo liền sẹo / Chữa sâu thân (TREATMENT)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sức khỏe trước chăm sóc</label>
              <select
                value={healthBefore}
                onChange={(e) => setHealthBefore(e.target.value as TreeHealthStatus)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:border-[#347A50] dark:focus:border-emerald-400"
              >
                <option value="GOOD">Tốt (GOOD)</option>
                <option value="FAIR">Bình thường (FAIR)</option>
                <option value="POOR">Kém (POOR)</option>
                <option value="CRITICAL">Nguy cấp (CRITICAL)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sức khỏe sau chăm sóc</label>
              <select
                value={healthAfter}
                onChange={(e) => setHealthAfter(e.target.value as TreeHealthStatus)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:border-[#347A50] dark:focus:border-emerald-400"
              >
                <option value="GOOD">Tốt (GOOD)</option>
                <option value="FAIR">Bình thường (FAIR)</option>
                <option value="POOR">Kém (POOR)</option>
                <option value="CRITICAL">Nguy cấp (CRITICAL)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả công việc & vật tư sử dụng *</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Đã cắt tỉa 4 cành khô có nguy cơ rơi gãy, bôi vôi sát khuẩn vết cắt và kiểm tra gốc cây vững vàng."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:border-[#347A50] dark:focus:border-emerald-400 focus:ring-1 focus:ring-[#347A50] text-xs"
            />
          </div>

          {/* Chụp hình / Tải ảnh thực địa bắt buộc */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Hình ảnh hiện trường thực địa <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Bắt buộc để lưu bằng chứng Blockchain
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
              <div className="relative rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-600/60 bg-slate-900 group aspect-video max-h-44 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Ảnh thực địa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chụp / Đổi ảnh khác</span>
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
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
              >
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-full shadow-xs text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-100 dark:border-emerald-800/60">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Chụp ảnh thực địa ngay từ camera
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  hoặc bấm để chọn ảnh hiện trường từ máy (Tối đa 5MB)
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#E0EBDD]/60 dark:bg-emerald-950/40 border border-[#E0EBDD] dark:border-emerald-800/60 flex items-center gap-2 text-[#174B36] dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#347A50] dark:text-emerald-400" />
            <span className="text-[11px] leading-tight">
              Bản ghi sẽ được băm SHA-256 theo chuẩn Canonical JSON Version 1 và neo ngay vào Smart Contract với địa chỉ ví của nhân viên.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <span>Đang ghi Blockchain...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Xác nhận & Ghi Blockchain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
