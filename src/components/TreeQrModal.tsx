import React, { useEffect, useState } from 'react';
import { X, Download, Printer, QrCode, ExternalLink, Check, Cpu, Tag } from 'lucide-react';
import { Tree } from '../types';
import { downloadQrCode, generateQrDataUrl } from '../services/qrService';
import { DigitalAlloyTag } from './DigitalAlloyTag';
import { getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

interface TreeQrModalProps {
  tree: Tree | null;
  onClose: () => void;
  onOpenPublicView: (tree: Tree) => void;
}

export const TreeQrModal: React.FC<TreeQrModalProps> = ({ tree, onClose, onOpenPublicView }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<'alloy_tag' | 'qr'>('alloy_tag');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-[#0c1812] rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden border border-[#E0EBDD] dark:border-emerald-500/30 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-300 font-mono text-xs font-black flex items-center justify-center border border-slate-700 shadow-xs">
              {getTreeStreetCode(tree)}
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#174B36] dark:text-emerald-400">
                Định Danh Biển Số &amp; Mã QR Cây
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                [{getTreeStreetCode(tree)}] · {tree.publicCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Mode Switcher */}
        <div className="px-4 pt-2.5 sm:px-5 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDisplayMode('alloy_tag')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              displayMode === 'alloy_tag'
                ? 'bg-slate-900 text-amber-300 border-slate-700 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-transparent hover:bg-slate-200'
            }`}
          >
            🔩 Biển Nhôm Đóng Thân Cây
          </button>
          <button
            onClick={() => setDisplayMode('qr')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              displayMode === 'qr'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-transparent hover:bg-slate-200'
            }`}
          >
            📄 Thẻ In Giấy / Decal QR
          </button>
        </div>

        {/* Content (Scrollable if screen is very short) */}
        <div className="p-4 sm:p-5 text-center space-y-3 overflow-y-auto flex-1 text-xs">
          {displayMode === 'alloy_tag' ? (
            <DigitalAlloyTag tree={tree} size="sm" showActions={false} />
          ) : (
            <div className="p-4 border-2 border-dashed border-[#347A50]/40 dark:border-emerald-500/40 rounded-xl bg-[#F8FAF8] dark:bg-[#091811] space-y-2.5 print:border-solid">
              <div className="text-[10px] font-bold tracking-widest text-[#174B36] dark:text-emerald-400 uppercase">
                UBND TP. CẦN THƠ · QUẢN LÝ CÂY XANH ĐÔ THỊ
              </div>

              {/* QR Image (Compact size) */}
              <div className="flex justify-center">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Code ${tree.publicCode}`}
                    className="w-36 h-36 bg-white p-1.5 rounded-lg shadow-xs border border-slate-200 dark:border-emerald-500/30"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
                    Đang tạo mã QR...
                  </div>
                )}
              </div>

              <div>
                <div className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono tracking-wider">
                  [{getTreeStreetCode(tree)}]
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{tree.displayName}</div>
                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  📍 {getTreeMilestone(tree)}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[9.5px] text-slate-500 dark:text-slate-400">
                Quét mã QR để xem hồ sơ cây hoặc gửi phản ánh sự cố trực tiếp
              </div>
            </div>
          )}

          {/* Public URL Box */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <span className="text-slate-500 dark:text-slate-400 truncate flex-1 font-mono text-[10px] text-left px-1">
              {publicUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="px-2 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline" /> : 'Sao chép'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => onOpenPublicView(tree)}
            className="text-[11px] font-semibold text-[#174B36] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer truncate"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="hidden xs:inline">Mở trang công khai</span>
            <span className="xs:hidden">Mở web</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>In biển số</span>
            </button>

            <button
              onClick={() => downloadQrCode(qrUrl, tree.publicCode)}
              className="px-2.5 py-1.5 bg-[#174B36] hover:bg-[#347A50] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
