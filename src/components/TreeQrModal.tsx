import React, { useEffect, useState } from 'react';
import { X, Download, Printer, QrCode, ExternalLink, Check } from 'lucide-react';
import { Tree } from '../types';
import { downloadQrCode, generateQrDataUrl } from '../services/qrService';

interface TreeQrModalProps {
  tree: Tree | null;
  onClose: () => void;
  onOpenPublicView: (tree: Tree) => void;
}

export const TreeQrModal: React.FC<TreeQrModalProps> = ({ tree, onClose, onOpenPublicView }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tree) {
      generateQrDataUrl(tree.publicCode).then(setQrUrl);
    }
  }, [tree]);

  if (!tree) return null;

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#tree-${tree.publicCode}`
    : `https://urbantree.vn/#tree-${tree.publicCode}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-[#E0EBDD] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E0EBDD] text-[#174B36] rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#174B36]">Mã QR Định danh Cây xanh</h2>
              <p className="text-xs text-slate-500 font-mono">{tree.publicCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Placard Preview Content */}
        <div className="p-6 text-center space-y-4">
          <div className="p-5 border-2 border-dashed border-[#347A50]/40 rounded-2xl bg-[#F8FAF8] space-y-3 print:border-solid">
            <div className="text-[11px] font-bold tracking-widest text-[#174B36] uppercase">
              UBND TP. CẦN THƠ · QUẢN LÝ CÂY XANH ĐÔ THỊ
            </div>

            {/* QR Image */}
            <div className="flex justify-center">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR Code ${tree.publicCode}`}
                  className="w-48 h-48 bg-white p-2 rounded-xl shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            <div>
              <div className="text-lg font-bold text-[#174B36] font-mono tracking-wider">
                {tree.publicCode}
              </div>
              <div className="text-xs font-semibold text-slate-800">{tree.displayName}</div>
              <div className="text-[11px] text-slate-500 line-clamp-1">{tree.address}</div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
              Quét mã QR để xem hồ sơ cây hoặc gửi phản ánh sự cố trực tiếp
            </div>
          </div>

          {/* Public URL Box */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-500 truncate flex-1 font-mono text-[11px] text-left">
              {publicUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-700 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> : 'Sao chép'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenPublicView(tree)}
            className="text-xs font-semibold text-[#174B36] hover:underline flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở trang công khai</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In thẻ cây</span>
            </button>

            <button
              onClick={() => downloadQrCode(qrUrl, tree.publicCode)}
              className="px-3 py-1.5 bg-[#174B36] hover:bg-[#347A50] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải ảnh PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
