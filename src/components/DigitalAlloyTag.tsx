import React, { useRef } from 'react';
import {
  ShieldCheck,
  Trees,
  QrCode,
  MapPin,
  Calendar,
  Layers,
  Printer,
  Copy,
  Check,
  Radio,
  Cpu,
} from 'lucide-react';
import { Tree } from '../types';
import { getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

interface DigitalAlloyTagProps {
  tree: Tree;
  size?: 'sm' | 'md' | 'lg';
  showActions?: boolean;
}

export const DigitalAlloyTag: React.FC<DigitalAlloyTagProps> = ({
  tree,
  size = 'md',
  showActions = true,
}) => {
  const [copied, setCopied] = React.useState(false);
  const tagRef = useRef<HTMLDivElement>(null);

  const streetCode = getTreeStreetCode(tree);
  const milestone = getTreeMilestone(tree);
  const corridor = getTreeCorridor(tree);
  const plantedYear = tree.plantedAt ? new Date(tree.plantedAt).getFullYear() : 2021;

  const handleCopyTagCode = () => {
    const text = `[${streetCode}] - ${tree.displayName} - ${milestone} (UrbanTree Cần Thơ)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isSmall = size === 'sm';

  return (
    <div className="space-y-2.5">
      {/* 🔩 BIỂN NHÔM ĐÓNG THÂN CÂY VẬT LÝ ẢO (DIGITAL ALLOY TAG - COMPACT & SCALED) */}
      <div
        ref={tagRef}
        className={`relative rounded-xl overflow-hidden select-none transition-all duration-300 ${
          isSmall ? 'p-3' : 'p-3.5 sm:p-4'
        }`}
        style={{
          background:
            'linear-gradient(135deg, #d8dee4 0%, #f4f6f8 35%, #cbd2d9 70%, #edf0f3 100%)',
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.9), inset 0 -1.5px 3px rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.14)',
          border: '2px solid #8e98a3',
        }}
      >
        {/* Subtle Brushed Metal Texture Grain Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.15) 3px, transparent 4px)',
          }}
        />

        {/* 🔩 4 METALLIC SCREW RIVETS IN THE CORNERS */}
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center">
          <div className="w-1.5 h-px bg-slate-800 rotate-45" />
        </div>
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center">
          <div className="w-1.5 h-px bg-slate-800 rotate-12" />
        </div>
        <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center">
          <div className="w-1.5 h-px bg-slate-800 rotate-60" />
        </div>
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-xs flex items-center justify-center">
          <div className="w-1.5 h-px bg-slate-800 rotate-35" />
        </div>

        {/* INNER EMBOSSED BEVEL CONTAINER */}
        <div className="relative border border-slate-400/70 rounded-lg p-2.5 sm:p-3 bg-slate-200/30 backdrop-blur-[1px]">
          {/* Header Seal */}
          <div className="flex items-center justify-between border-b border-slate-400/80 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs border border-emerald-950 shrink-0">
                <Trees className="w-3 h-3" />
              </div>
              <div className="text-left">
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-800 leading-tight">
                  UBND THÀNH PHỐ CẦN THƠ
                </div>
                <div className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-tight text-slate-600">
                  SỞ XÂY DỰNG · CHI CỤC CÂY XANH
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-300/80 border border-slate-400 text-slate-800 text-[8px] font-mono font-bold">
              <Cpu className="w-2.5 h-2.5 text-emerald-700" />
              <span>ON-CHAIN</span>
            </div>
          </div>

          {/* MAIN STAMPED BADGE & SPECIES */}
          <div className="flex items-center justify-between gap-2 py-0.5 text-left">
            {/* Left: Stamped Code */}
            <div className="space-y-0.5">
              <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                MÃ HIỆU TUYẾN PHỐ · STREET CODE
              </div>
              <div
                className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-300 font-mono font-black text-xl sm:text-2xl tracking-widest shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-slate-700"
                style={{ textShadow: '0 0 4px rgba(253,224,71,0.5)' }}
              >
                [{streetCode}]
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1">
                <span className="truncate max-w-[160px] sm:max-w-[200px]">{tree.displayName}</span>
                <span className="text-[10px] font-mono text-emerald-800 font-bold px-1 bg-emerald-100 rounded border border-emerald-300">
                  #{tree.publicCode}
                </span>
              </div>
            </div>

            {/* Right: Embedded QR Code for fast field optical scan */}
            <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-lg border border-slate-300 shadow-xs shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white p-0.5 rounded border border-slate-200 flex flex-col items-center justify-center relative">
                {/* Simulated Scannable QR Matrix */}
                <div className="w-full h-full bg-slate-900 p-0.5 rounded flex items-center justify-center">
                  <div className="w-full h-full bg-white p-0.5 grid grid-cols-4 gap-0.5">
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div />
                    <div className="bg-black" />
                    <div />
                    <div />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div className="bg-black" />
                    <div />
                    <div className="bg-black" />
                    <div className="bg-black" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Trees className="w-2 h-2" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5 text-left hidden xs:block">
                <div className="text-[8px] font-mono font-bold text-slate-700 uppercase">QUÉT QR</div>
                <div className="text-[10px] font-black text-emerald-800 font-mono">UrbanTree</div>
                <div className="text-[7.5px] text-slate-500 font-mono">SHA-256</div>
              </div>
            </div>
          </div>

          {/* PHYSICAL MILESTONE & GPS SPECS */}
          <div className="mt-2 pt-1.5 border-t border-slate-400/60 grid grid-cols-2 gap-2 text-[10px] text-left">
            <div className="flex items-start gap-1 text-slate-800">
              <MapPin className="w-3 h-3 text-rose-700 shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase block leading-tight">Cột mốc thực địa:</span>
                <span className="font-bold text-slate-900 block truncate">{milestone}</span>
                <span className="text-[8.5px] text-slate-600 block truncate">{corridor}</span>
              </div>
            </div>

            <div className="flex items-start gap-1 text-slate-800">
              <Radio className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase block leading-tight">Tọa độ GNSS:</span>
                <span className="font-mono text-[9.5px] font-bold text-slate-900 block truncate">
                  {tree.latitude.toFixed(6)}° N, {tree.longitude.toFixed(6)}° E
                </span>
                <span className="text-[8px] text-slate-500 font-mono block">RTK &lt; 0.05m</span>
              </div>
            </div>
          </div>

          {/* PARAMETERS STRIP */}
          <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-400/80 flex items-center justify-between gap-1 text-[8.5px] font-mono text-slate-700">
            <div>
              <strong>NĂM:</strong> {plantedYear}
            </div>
            <div>
              <strong>Đ.KÍNH:</strong> {tree.diameterCm || 28}cm
            </div>
            <div>
              <strong>CAO:</strong> {tree.heightM || 7.5}m
            </div>
            <div>
              <strong>TRẠNG THÁI:</strong>{' '}
              <span className="font-bold text-emerald-800 uppercase">{tree.healthStatus}</span>
            </div>
          </div>

          {/* OFFICIAL STAMP FOOTER */}
          <div className="mt-1 text-center">
            <div className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500">
              * TÀI SẢN ĐÔ THỊ ĐỊNH DANH ON-CHAIN CẦN THƠ · XÂM HẠI XỬ LÝ THEO PHÁP LUẬT *
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (IN BIỂN / SAO CHÉP MÃ) */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            onClick={handleCopyTagCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold border border-slate-300 dark:border-slate-700 text-[11px] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3 h-3 text-emerald-200" />
            <span>In biển nhôm (10x15cm)</span>
          </button>
        </div>
      )}
    </div>
  );
};

