import React, { useState, useRef } from 'react';
import { X, Trees, MapPin, Check, ShieldCheck, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Tree, TreeHealthStatus } from '../types';
import { storage } from '../db/storage';

interface TreeFormModalProps {
  tree: Tree | null; // null if adding new
  onClose: () => void;
  onSaved: () => void;
}

export const TreeFormModal: React.FC<TreeFormModalProps> = ({ tree, onClose, onSaved }) => {
  const treeTypes = storage.getTreeTypes();

  const [publicCode, setPublicCode] = useState(
    tree?.publicCode || `TREE-00${storage.getTrees().length + 1}`
  );
  const [displayName, setDisplayName] = useState(tree?.displayName || '');
  const [treeTypeId, setTreeTypeId] = useState(tree?.treeTypeId || treeTypes[0]?.id || '');
  const [address, setAddress] = useState(tree?.address || '');
  const [latitude, setLatitude] = useState(tree?.latitude || 10.0345);
  const [longitude, setLongitude] = useState(tree?.longitude || 105.7882);
  const [plantedAt, setPlantedAt] = useState(tree?.plantedAt || '2023-01-01');
  const [healthStatus, setHealthStatus] = useState<TreeHealthStatus>(tree?.healthStatus || 'GOOD');
  const [diameterCm, setDiameterCm] = useState(tree?.diameterCm || 30);
  const [heightM, setHeightM] = useState(tree?.heightM || 8);
  const [imageUrl, setImageUrl] = useState(tree?.imageUrl || '');
  const [imagePreview, setImagePreview] = useState<string | null>(tree?.imageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!publicCode.trim()) {
      setError('Vui lòng nhập mã định danh cây (ví dụ: TREE-008)');
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

    setIsSubmitting(true);
    try {
      if (tree) {
        // Edit
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
        });
      } else {
        // Add new
        await storage.createTree({
          publicCode: publicCode.trim().toUpperCase(),
          displayName,
          treeTypeId,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          plantedAt,
          healthStatus,
          diameterCm: Number(diameterCm),
          heightM: Number(heightM),
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
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

  const handleLocationPreset = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl flex flex-col border border-[#E0EBDD] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E0EBDD] text-[#174B36] rounded-lg">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#174B36]">
                {tree ? 'Cập nhật Hồ sơ Cây xanh' : 'Thêm Cây xanh Mới vào Hệ thống'}
              </h2>
              <p className="text-xs text-slate-500">Tự động băm chuẩn SHA-256 và neo lên Smart Contract</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã định danh (Public Code) *</label>
              <input
                type="text"
                disabled={!!tree}
                value={publicCode}
                onChange={(e) => setPublicCode(e.target.value.toUpperCase())}
                placeholder="TREE-008"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-[#174B36] focus:border-[#347A50] focus:ring-1 focus:ring-[#347A50] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loài cây *</label>
              <select
                value={treeTypeId}
                onChange={(e) => setTreeTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-[#347A50] focus:ring-1 focus:ring-[#347A50] bg-white"
              >
                {treeTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.scientificName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên hiển thị cây *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cây Bàng Đài Loan Tuyến Phố"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-[#347A50] focus:ring-1 focus:ring-[#347A50]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vị trí & Địa chỉ *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-[#347A50] focus:ring-1 focus:ring-[#347A50]"
            />
          </div>

          {/* Coordinates & Preset Buttons */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#174B36]" />
                <span>Tọa độ GPS (WGS84)</span>
              </span>
              <span className="text-[10px] text-slate-400">Chọn vị trí nhanh:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Vĩ độ (Latitude)</span>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white font-mono text-[11px]"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Kinh độ (Longitude)</span>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Presets Cần Thơ */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleLocationPreset(10.036829, 105.782541, 'Công viên Lưu Hữu Phước, Đại lộ Hòa Bình, Ninh Kiều')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:border-[#347A50]"
              >
                Lưu Hữu Phước
              </button>
              <button
                type="button"
                onClick={() => handleLocationPreset(10.034515, 105.78822, 'Bến Ninh Kiều, Đường Hai Bà Trưng, Tân An')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:border-[#347A50]"
              >
                Bến Ninh Kiều
              </button>
              <button
                type="button"
                onClick={() => handleLocationPreset(10.04652, 105.79153, 'Công viên Sông Hậu, Đường Lê Lợi, Cái Khế')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:border-[#347A50]"
              >
                Công viên Sông Hậu
              </button>
              <button
                type="button"
                onClick={() => handleLocationPreset(10.031251, 105.76915, 'ĐH Cần Thơ Khu II, Đường 3/2, Xuân Khánh')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:border-[#347A50]"
              >
                ĐH Cần Thơ (Khu II)
              </button>
              <button
                type="button"
                onClick={() => handleLocationPreset(10.0328, 105.7895, 'Cầu Đi Bộ Ninh Kiều, Tân An, Ninh Kiều')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:border-[#347A50]"
              >
                Cầu Đi Bộ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hiện trạng sức khỏe</label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as TreeHealthStatus)}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="GOOD">Tốt (GOOD)</option>
                <option value="FAIR">Bình thường (FAIR)</option>
                <option value="POOR">Kém (POOR)</option>
                <option value="CRITICAL">Nguy cấp (CRITICAL)</option>
                <option value="DEAD">Chết khô (DEAD)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Đường kính (cm)</label>
              <input
                type="number"
                value={diameterCm}
                onChange={(e) => setDiameterCm(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chiều cao (m)</label>
              <input
                type="number"
                step="0.5"
                value={heightM}
                onChange={(e) => setHeightM(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ngày/Năm trồng</label>
            <input
              type="date"
              value={plantedAt}
              onChange={(e) => setPlantedAt(e.target.value)}
              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {/* Photo field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Hình ảnh thực địa cây xanh <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Bắt buộc chụp thực tế
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
              <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-slate-900 group aspect-video max-h-44 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Ảnh cây xanh"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 hover:bg-slate-100"
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
                    className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
              >
                <div className="p-2.5 bg-white rounded-full shadow-xs text-emerald-600 mb-2 border border-emerald-100">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-emerald-900">
                  Chụp ảnh cây từ Camera điện thoại / máy tính
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  hoặc bấm để tải tệp ảnh từ thiết bị
                </div>
              </div>
            )}

            <div className="mt-2">
              <input
                type="url"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value || null);
                }}
                placeholder="Hoặc dán URL ảnh trực tuyến (https://...)"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-600"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#E0EBDD]/60 border border-[#E0EBDD] flex items-center gap-2 text-[#174B36]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#347A50]" />
            <span className="text-[11px] leading-tight">
              Khi bấm lưu, hệ thống tự động băm canonical payload và neo giao dịch vào Hardhat EVM local, lưu txHash và blockNumber.
            </span>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#174B36] hover:bg-[#347A50] text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {isSubmitting ? (
                <span>Đang ghi Blockchain...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{tree ? 'Lưu thay đổi' : 'Thêm cây & Neo Blockchain'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
