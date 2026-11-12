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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-md w-full shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden border border-[#E0EBDD] dark:border-emerald-500/30 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E0EBDD] dark:bg-emerald-950/80 text-[#174B36] dark:text-emerald-400 dark:border dark:border-emerald-800/50 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#174B36] dark:text-emerald-400">Mã QR Định danh Cây xanh</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{tree.publicCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Placard Preview Content */}
        <div className="p-6 text-center space-y-4">
          <div className="p-5 border-2 border-dashed border-[#347A50]/40 dark:border-emerald-500/40 rounded-2xl bg-[#F8FAF8] dark:bg-[#091811] space-y-3 print:border-solid">
            <div className="text-[11px] font-bold tracking-widest text-[#174B36] dark:text-emerald-400 uppercase">
              UBND TP. CẦN THƠ · QUẢN LÝ CÂY XANH ĐÔ THỊ
            </div>

            {/* QR Image */}
            <div className="flex justify-center">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR Code ${tree.publicCode}`}
                  className="w-48 h-48 bg-white p-2 rounded-xl shadow-xs border border-slate-200 dark:border-emerald-500/30"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            <div>
              <div className="text-lg font-bold text-[#174B36] dark:text-emerald-400 font-mono tracking-wider">
                {tree.publicCode}
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{tree.displayName}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{tree.address}</div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
              Quét mã QR để xem hồ sơ cây hoặc gửi phản ánh sự cố trực tiếp
            </div>
          </div>

          {/* Public URL Box */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <span className="text-slate-500 dark:text-slate-400 truncate flex-1 font-mono text-[11px] text-left">
              {publicUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" /> : 'Sao chép'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenPublicView(tree)}
            className="text-xs font-semibold text-[#174B36] dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở trang công khai</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In thẻ cây</span>
            </button>

            <button
              onClick={() => downloadQrCode(qrUrl, tree.publicCode)}
              className="px-3 py-1.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
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
