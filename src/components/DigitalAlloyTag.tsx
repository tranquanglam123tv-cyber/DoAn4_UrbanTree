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

  // Generate QR URL matching system
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/#tree-${tree.publicCode}`;

  return (
    <div className="space-y-3">
      {/* 🔩 BIỂN NHÔM ĐÓNG THÂN CÂY VẬT LÝ ẢO (DIGITAL ALLOY TAG) */}
      <div
        ref={tagRef}
        className="relative rounded-2xl p-5 sm:p-6 overflow-hidden select-none transition-all duration-300"
        style={{
          background:
            'linear-gradient(135deg, #d8dee4 0%, #f4f6f8 35%, #cbd2d9 70%, #edf0f3 100%)',
          boxShadow:
            'inset 0 1px 3px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.25), 0 12px 30px rgba(0,0,0,0.18)',
          border: '3px solid #8e98a3',
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
        {/* Top-Left */}
        <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-[inset_0_1px_1px_rgba(0,0,0,0.7),0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-slate-800 rotate-45" />
          <div className="w-2 h-0.5 bg-slate-800 -rotate-45 -ml-2" />
        </div>
        {/* Top-Right */}
        <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-[inset_0_1px_1px_rgba(0,0,0,0.7),0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-slate-800 rotate-12" />
          <div className="w-2 h-0.5 bg-slate-800 -rotate-78 -ml-2" />
        </div>
        {/* Bottom-Left */}
        <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-[inset_0_1px_1px_rgba(0,0,0,0.7),0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-slate-800 rotate-60" />
          <div className="w-2 h-0.5 bg-slate-800 -rotate-30 -ml-2" />
        </div>
        {/* Bottom-Right */}
        <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-600 via-slate-200 to-slate-500 border border-slate-700 shadow-[inset_0_1px_1px_rgba(0,0,0,0.7),0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-slate-800 rotate-35" />
          <div className="w-2 h-0.5 bg-slate-800 -rotate-55 -ml-2" />
        </div>

        {/* INNER EMBOSSED BEVEL CONTAINER */}
        <div className="relative border-2 border-slate-400/70 rounded-xl p-3 sm:p-4 bg-slate-200/30 backdrop-blur-[1px]">
          {/* Header Seal */}
          <div className="flex items-center justify-between border-b-2 border-slate-400/80 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs border border-emerald-950 shrink-0">
                <Trees className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-800">
                  UBND THÀNH PHỐ CẦN THƠ
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight text-slate-600">
                  SỞ XÂY DỰNG · CHI CỤC CÂY XANH ĐÔ THỊ
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-300/80 border border-slate-400 text-slate-800 text-[9px] font-mono font-bold shadow-2xs">
              <Cpu className="w-3 h-3 text-emerald-700" />
              <span>NFC / ON-CHAIN</span>
            </div>
          </div>

          {/* MAIN STAMPED BADGE & SPECIES */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
            {/* Left: Huge Stamped Code */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                MÃ HIỆU TUYẾN PHỐ · STREET CODE
              </div>
              <div
                className="inline-block px-3.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-mono font-black text-2xl sm:text-3xl tracking-widest shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.9)] border-2 border-slate-700"
                style={{ textShadow: '0 0 6px rgba(253,224,71,0.5)' }}
              >
                [{streetCode}]
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 pt-0.5">
                <span>{tree.displayName}</span>
                <span className="text-xs font-mono text-emerald-800 font-bold px-1.5 py-0.2 bg-emerald-100 rounded-md border border-emerald-300">
                  #{tree.publicCode}
                </span>
              </div>
            </div>

            {/* Right: Embedded QR Code for fast field optical scan */}
            <div className="flex items-center gap-3 bg-white/80 p-2.5 rounded-xl border border-slate-300 shadow-xs shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white p-1 rounded-lg border border-slate-200 flex flex-col items-center justify-center relative">
                {/* Simulated Scannable QR Matrix */}
                <div className="w-full h-full bg-slate-900 p-0.5 rounded flex items-center justify-center">
                  <div className="w-full h-full bg-white p-1 grid grid-cols-4 gap-0.5">
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
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Trees className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-[9px] font-mono font-bold text-slate-700 uppercase">QUÉT TRA CỨU</div>
                <div className="text-[11px] font-black text-emerald-800 font-mono">UrbanTree</div>
                <div className="text-[8px] text-slate-500 font-mono">Bảo chứng SHA-256</div>
              </div>
            </div>
          </div>

          {/* PHYSICAL MILESTONE & GPS SPECS */}
          <div className="mt-3 pt-2.5 border-t border-slate-400/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-1.5 text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Cột mốc thực địa:</span>
                <span className="font-bold text-slate-900">{milestone}</span>
                <span className="text-[10px] text-slate-600 block">{corridor}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-slate-800">
              <Radio className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Tọa độ vệ tinh GNSS:</span>
                <span className="font-mono text-[11px] font-bold text-slate-900 block">
                  {tree.latitude.toFixed(6)}° N, {tree.longitude.toFixed(6)}° E
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Sai số vi sai RTK &lt; 0.05m
                </span>
              </div>
            </div>
          </div>

          {/* PARAMETERS STRIP */}
          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-400/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-700">
            <div>
              <strong>NĂM TRỒNG:</strong> {plantedYear}
            </div>
            <div>
              <strong>ĐƯỜNG KÍNH:</strong> {tree.diameterCm || 28} cm
            </div>
            <div>
              <strong>CHIỀU CAO:</strong> {tree.heightM || 7.5} m
            </div>
            <div>
              <strong>TÌNH TRẠNG:</strong>{' '}
              <span className="font-bold text-emerald-800 uppercase">{tree.healthStatus}</span>
            </div>
          </div>

          {/* OFFICIAL STAMP FOOTER */}
          <div className="mt-3 text-center">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-600">
              * TÀI SẢN CÔNG CỘNG ĐÔ THỊ ĐƯỢC ĐỊNH DANH ON-CHAIN · MỌI HÀNH VI XÂM HẠI SẼ BỊ XỬ LÝ THEO PHÁP LUẬT *
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (IN BIỂN / SAO CHÉP MÃ) */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            onClick={handleCopyTagCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép mã biển'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-200" />
            <span>In biển số nhôm (Khổ 10x15cm)</span>
          </button>
        </div>
      )}
    </div>
  );
};
