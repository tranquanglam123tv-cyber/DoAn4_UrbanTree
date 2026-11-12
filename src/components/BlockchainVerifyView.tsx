import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Bug,
  Database,
  Link,
  Cpu,
  Layers,
  FileCode,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { storage } from '../db/storage';
import { RecordType, Tree, TreeHealthStatus, VerificationResult } from '../types';
import { computeRecordHash } from '../services/hashService';
import { TreeSearchSelect } from './common/TreeSearchSelect';

export const BlockchainVerifyView: React.FC = () => {
  const [nodeOnline, setNodeOnline] = useState(true);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('TREE_PROFILE');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(storage.getTrees()[0]?.id || '');
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [tamperNotice, setTamperNotice] = useState<string | null>(null);

  const trees = storage.getTrees();
  const careRecords = storage.getCareRecords();
  const incidents = storage.getIncidents();
  const anchors = blockchainService.getAllAnchors();
  const nodeStatus = blockchainService.getNodeStatus();

  const handleToggleNode = () => {
    const next = !nodeOnline;
    setNodeOnline(next);
    blockchainService.setNodeOnline(next);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyResult(null);

    // Tạo độ trễ 600ms để hiệu ứng tia quét Laser chạy mượt mà
    await new Promise((r) => setTimeout(r, 600));

    try {
      let recordData: any = null;
      if (selectedRecordType === 'TREE_PROFILE') {
        recordData = storage.getTreeById(selectedRecordId);
      } else if (selectedRecordType === 'CARE_RECORD') {
        recordData = storage.getCareRecords().find((c) => c.id === selectedRecordId);
      } else {
        recordData = storage.getIncidentById(selectedRecordId);
      }

      if (!recordData) {
        alert('Không tìm thấy bản ghi trong cơ sở dữ liệu!');
        return;
      }

      const result = await blockchainService.verifyRecord(selectedRecordType, recordData);
      setVerifyResult(result);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperSelectedTree = async () => {
    const tree = storage.getTreeById(selectedRecordId);
    if (!tree) return;

    // 1. Nếu cây chưa có trong Blockchain ledger, lập tức neo trạng thái hợp lệ ban đầu của cây lên Smart Contract trước
    const existingAnchor = blockchainService.getAnchor('TREE_PROFILE', tree.id);
    if (!existingAnchor) {
      const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', tree);
      const receipt = await blockchainService.anchorRecord({
        recordType: 'TREE_PROFILE',
        recordId: tree.id,
        hash,
        canonicalJson,
      });
      storage.updateTree(tree.id, {
        payloadVersion: 1,
        payloadHash: hash,
        anchorStatus: receipt.status,
        txHash: receipt.txHash,
      });
    }

    // 2. Thực hiện hành vi "sửa trộm" dữ liệu trong DB (giả mạo tình trạng sức khỏe)
    const oldStatus = tree.healthStatus;
    const newStatus: TreeHealthStatus = oldStatus === 'GOOD' ? 'CRITICAL' : 'GOOD';
    storage.tamperTree(tree.id, newStatus);
    setTamperNotice(
      `Đã cố tình sửa trộm trường "healthStatus" của [${tree.publicCode}] từ "${oldStatus}" thành "${newStatus}" trong DB mà không thực hiện giao dịch Blockchain! Hãy bấm nút "Kiểm tra tính toàn vẹn" bên dưới để quan sát hệ thống phát hiện băm sai lệch (MISMATCH).`
    );
    setVerifyResult(null);
  };

  const handleAnchorCurrentRecord = async () => {
    let recordData: any = null;
    if (selectedRecordType === 'TREE_PROFILE') {
      recordData = storage.getTreeById(selectedRecordId);
    } else if (selectedRecordType === 'CARE_RECORD') {
      recordData = storage.getCareRecords().find((c) => c.id === selectedRecordId);
    } else {
      recordData = storage.getIncidentById(selectedRecordId);
    }

    if (!recordData) return;

    const { hash, canonicalJson } = computeRecordHash(selectedRecordType, recordData);
    const receipt = await blockchainService.anchorRecord({
      recordType: selectedRecordType,
      recordId: selectedRecordId,
      hash,
      canonicalJson,
    });

    if (selectedRecordType === 'TREE_PROFILE') {
      storage.updateTree(selectedRecordId, {
        payloadVersion: 1,
        payloadHash: hash,
        anchorStatus: receipt.status,
        txHash: receipt.txHash,
      });
    }

    // Chạy lại kiểm tra ngay lập tức để người dùng thấy kết quả VALID
    await handleVerify();
  };

  const handleRestoreDefaults = () => {
    storage.resetToDefaults();
    setTamperNotice('Đã khôi phục dữ liệu mẫu gốc từ Blockchain. Bản ghi trở về trạng thái nguyên bản.');
    setVerifyResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / EVM Node Telemetry */}
      <div className="bg-[#174B36] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-gradient-to-r dark:from-[#05130b] dark:via-[#091f13] dark:to-[#06140c] dark:border dark:border-emerald-500/30 dark:shadow-[0_0_30px_rgba(0,255,157,0.08)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-[#00FF9D] animate-pulse dark:shadow-[0_0_10px_#00FF9D]" />
            <span className="text-xs font-mono font-bold text-[#F3E8B2] dark:text-[#00FF9D] uppercase tracking-wider">
              Smart Contract: UrbanTreeRegistry.sol
            </span>
          </div>
          <h1 className="text-xl font-bold">Sổ cái Hoạt động &amp; Xác minh Tính toàn vẹn Blockchain</h1>
          <p className="text-xs text-white/80 dark:text-emerald-100/70 max-w-xl">
            Màn hình A18/A19: Đối chiếu chuỗi băm Canonical SHA-256 hiện tại với chữ ký điện tử đã neo trên mạng EVM để chứng minh tính bất biến.
          </p>
        </div>

        {/* Node Status Card & Offline Toggle */}
        <div className="bg-white/10 dark:bg-[#040e08]/90 backdrop-blur-xs p-3.5 rounded-xl border border-white/20 dark:border-emerald-500/30 text-xs space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/80 dark:text-slate-300">Trạng thái Node EVM:</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                nodeOnline
                  ? 'bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-[#00FF9D] dark:border dark:border-emerald-500/40 dark:shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                  : 'bg-red-500 text-white dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-500/40'
              }`}
            >
              {nodeOnline ? 'ONLINE (127.0.0.1:8545)' : 'OFFLINE'}
            </span>
          </div>

          <div className="font-mono text-[11px] text-white/90 dark:text-slate-200 space-y-0.5">
            <div>Chain ID: <strong>{nodeStatus.chainId} (Local Hardhat)</strong></div>
            <div className="truncate max-w-[220px]">Contract: {nodeStatus.contractAddress}</div>
            <div>Block mới nhất: <strong>#{nodeStatus.blockNumber}</strong></div>
          </div>

          <button
            onClick={handleToggleNode}
            className="w-full py-1 bg-white/20 hover:bg-white/30 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/70 dark:border dark:border-emerald-500/30 dark:text-[#00FF9D] text-white font-semibold rounded text-[11px] transition-colors cursor-pointer"
          >
            {nodeOnline ? 'Mô phỏng ngắt kết nối Node' : 'Bật lại kết nối Node'}
          </button>
        </div>
      </div>

      {/* Main Grid: Section A19 (Verification Tool) + Tamper Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Verification Console (Section A19) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0c1812] p-6 rounded-2xl border border-[#E0EBDD] dark:border-slate-800 shadow-2xs space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#E0EBDD] text-[#174B36] rounded-xl dark:bg-emerald-950/80 dark:text-[#00FF9D] dark:border dark:border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#174B36] dark:text-[#00FF9D]">
                  A19 — Công cụ Kiểm tra Tính toàn vẹn (Live Verifier)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tái tạo Canonical JSON ➔ Tính SHA-256 ➔ Đọc hợp đồng ➔ Đối chiếu kết quả
                </p>
              </div>
            </div>
          </div>

          {/* Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại bản ghi:</label>
              <select
                value={selectedRecordType}
                onChange={(e) => {
                  const type = e.target.value as RecordType;
                  setSelectedRecordType(type);
                  if (type === 'TREE_PROFILE') setSelectedRecordId(trees[0]?.id || '');
                  else if (type === 'CARE_RECORD') setSelectedRecordId(careRecords[0]?.id || '');
                  else setSelectedRecordId(incidents[0]?.id || '');
                  setVerifyResult(null);
                }}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:border-emerald-500"
              >
                <option value="TREE_PROFILE">Hồ sơ Cây xanh (TREE_PROFILE)</option>
                <option value="CARE_RECORD">Nhật ký Chăm sóc (CARE_RECORD)</option>
                <option value="INCIDENT_REPORT">Phản ánh Sự cố (INCIDENT_REPORT)</option>
                <option value="INCIDENT_RESOLUTION">Nghiệm thu Sự cố (INCIDENT_RESOLUTION)</option>
              </select>
            </div>

            <div>
              {selectedRecordType === 'TREE_PROFILE' ? (
                <TreeSearchSelect
                  trees={trees}
                  value={selectedRecordId}
                  onChange={(treeId) => {
                    setSelectedRecordId(treeId);
                    setVerifyResult(null);
                  }}
                  label="Chọn cá thể cây xanh cần kiểm tra đối soát"
                  placeholder="Gõ mã cây (HB-01), tên cây hoặc vị trí để tìm nhanh..."
                  required
                />
              ) : (
                <>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chọn bản ghi cụ thể:</label>
                  <select
                    value={selectedRecordId}
                    onChange={(e) => {
                      setSelectedRecordId(e.target.value);
                      setVerifyResult(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:border-emerald-500"
                  >
                    {selectedRecordType === 'CARE_RECORD' &&
                      careRecords.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{c.actionType}] Cây #{c.treeId.slice(-4)} · {new Date(c.performedAt).toLocaleDateString('vi-VN')}
                        </option>
                      ))}
                    {(selectedRecordType === 'INCIDENT_REPORT' || selectedRecordType === 'INCIDENT_RESOLUTION') &&
                      incidents.map((i) => (
                        <option key={i.id} value={i.id}>
                          [{i.publicCode}] {i.severity} · {i.status}
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-2.5 bg-[#174B36] hover:bg-[#347A50] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Đang băm & đối soát...' : 'Kiểm tra tính toàn vẹn (Run Verification)'}</span>
          </button>

          {/* Scanning Laser Beam */}
          {isVerifying && (
            <div className="relative overflow-hidden p-6 rounded-2xl bg-slate-900 dark:bg-[#020604] text-white text-center shadow-lg border border-emerald-500/30 dark:border-emerald-500/50">
              <div className="scanner-beam-line"></div>
              <div className="flex items-center justify-center gap-2.5 font-mono text-emerald-400 dark:text-[#00FF9D] text-xs font-bold">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300 dark:text-[#00FF9D]" />
                <span>ĐANG QUÉT MÃ BĂM SHA-256 &amp; TRUY VẤN SMART CONTRACT ON-CHAIN...</span>
              </div>
            </div>
          )}

          {/* Verification Result Output */}
          {verifyResult && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-3 animate-in fade-in duration-200 ${
                verifyResult.status === 'VALID'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-[#06180e] dark:border-emerald-500/40 dark:text-emerald-100 shadow-sm'
                  : verifyResult.status === 'MISMATCH'
                  ? 'bg-red-50 border-red-300 text-red-950 dark:bg-[#1a0808] dark:border-rose-500/40 dark:text-rose-100 shadow-sm'
                  : verifyResult.status === 'UNAVAILABLE'
                  ? 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-[#101713] dark:border-slate-700 dark:text-slate-200'
                  : 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-[#1a1205] dark:border-amber-500/40 dark:text-amber-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {verifyResult.status === 'VALID' && (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-[#00FF9D]" />
                      <span className="dark:text-[#00FF9D]">XÁC THỰC THÀNH CÔNG: VALID (HỢP LỆ)</span>
                    </>
                  )}
                  {verifyResult.status === 'MISMATCH' && (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-rose-400" />
                      <span className="dark:text-rose-300">PHÁT HIỆN GIAN LẬN: MISMATCH (KHÔNG KHỚP)</span>
                    </>
                  )}
                  {verifyResult.status === 'NOT_ANCHORED' && (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="dark:text-amber-300">BẢN GHI CHƯA ĐƯỢC NEO LÊN BLOCKCHAIN</span>
                    </>
                  )}
                  {verifyResult.status === 'UNAVAILABLE' && (
                    <>
                      <AlertTriangle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span>EVM NODE UNAVAILABLE (MẤT KẾT NỐI)</span>
                    </>
                  )}
                </div>

                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                  verifyResult.status === 'VALID'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-[#00FF9D] dark:border-emerald-500/40'
                    : verifyResult.status === 'MISMATCH'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-500/40'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/40'
                }`}>
                  {verifyResult.status}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed opacity-90">
                {verifyResult.status === 'VALID' &&
                  'Chuỗi băm SHA-256 từ cơ sở dữ liệu hiện thời hoàn toàn trùng khớp từng byte với bản ghi đã neo trên Smart Contract. Không có bất kỳ sự sửa đổi nào sau khi neo.'}
                {verifyResult.status === 'MISMATCH' &&
                  'CẢNH BÁO NGUY HIỂM: Dữ liệu trong cơ sở dữ liệu hiện tại đã bị ai đó sửa đổi trái phép sau khi bản ghi đã được khóa trên Smart Contract Blockchain! Chuỗi băm đối soát bị sai lệch.'}
                {verifyResult.status === 'NOT_ANCHORED' &&
                  'Bản ghi này hiện chỉ mới tồn tại trong cơ sở dữ liệu nội bộ (Local DB) và chưa từng được đóng dấu băm (Timestamp Proof) trên Smart Contract UrbanTreeRegistry. Bấm nút bên dưới để tiến hành neo lên Blockchain!'}
                {verifyResult.status === 'UNAVAILABLE' &&
                  'Không thể kết nối đến node Blockchain. Nghiệp vụ lưu trữ cơ sở dữ liệu vẫn an toàn và chuyển sang chế độ đợi đối chiếu (PENDING).'}
              </p>

              {/* Nút neo ngay nếu chưa neo */}
              {verifyResult.status === 'NOT_ANCHORED' && (
                <div className="pt-1">
                  <button
                    onClick={handleAnchorCurrentRecord}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Link className="w-4 h-4" />
                    <span>🔗 Neo bản ghi này lên Smart Contract ngay (Anchor on Chain)</span>
                  </button>
                </div>
              )}

              {/* Hash comparison boxes */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="text-[10px] font-bold opacity-75 dark:text-slate-300 mb-0.5">Hash tính toán từ DB hiện tại (SHA-256):</div>
                  <div className="font-mono text-[10px] p-2.5 bg-white/80 dark:bg-[#030905] rounded-xl border border-black/10 dark:border-emerald-500/20 text-slate-700 dark:text-[#00FF9D]/90 flex items-center justify-between gap-2">
                    <span className="truncate">{verifyResult.currentHash}</span>
                    <button onClick={() => handleCopy(verifyResult.currentHash)} title="Sao chép" className="cursor-pointer text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-[#00FF9D]">
                      {copiedHash === verifyResult.currentHash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {verifyResult.onChainHash && (
                  <div>
                    <div className="text-[10px] font-bold opacity-75 dark:text-slate-300 mb-0.5">Hash gốc đã neo trên Smart Contract:</div>
                    <div className="font-mono text-[10px] p-2.5 bg-white/80 dark:bg-[#030905] rounded-xl border border-black/10 dark:border-emerald-500/20 text-slate-700 dark:text-[#00FF9D]/90 flex items-center justify-between gap-2">
                      <span className="truncate">{verifyResult.onChainHash}</span>
                      <button onClick={() => handleCopy(verifyResult.onChainHash || '')} title="Sao chép" className="cursor-pointer text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-[#00FF9D]">
                        {copiedHash === verifyResult.onChainHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Detected Diffs */}
              {verifyResult.diffFields && verifyResult.diffFields.length > 0 && (
                <div className="p-3 bg-red-100/80 dark:bg-rose-950/60 rounded-xl border border-red-200 dark:border-rose-500/40 text-[11px] space-y-1">
                  <div className="font-bold text-red-900 dark:text-rose-200">Chi tiết các trường dữ liệu bị sửa đổi trái phép:</div>
                  {verifyResult.diffFields.map((d) => (
                    <div key={d.field} className="font-mono text-red-800 dark:text-rose-300">
                      • <strong>{d.field}</strong>: Hiện thời = <span className="bg-red-200 dark:bg-rose-900/80 px-1 rounded">"{String(d.currentValue)}"</span> ➔ Gốc trên Chain = <span className="bg-emerald-200 dark:bg-emerald-950 px-1 rounded text-emerald-900 dark:text-[#00FF9D]">"{String(d.anchoredValue)}"</span>
                    </div>
                  ))}
                </div>
              )}

              {verifyResult.txHash && (
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
                  <span className="truncate max-w-[280px]">TxHash: {verifyResult.txHash}</span>
                  <span>Block #{verifyResult.blockNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Tamper Simulation Lab & Payload Inspector */}
        <div className="lg:col-span-5 space-y-5 text-xs">
          {/* Tamper Demonstration Box (Roadmap item 10 defense scenario) */}
          <div className="bg-amber-50/70 dark:bg-[#140e04]/80 p-5 rounded-2xl border border-amber-200 dark:border-amber-500/30 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
              <Bug className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <span>Phòng Thí nghiệm Giả lập Gian lận (Tamper Lab)</span>
            </div>

            <p className="text-amber-800 dark:text-amber-400/90 leading-relaxed text-[11px]">
              Kịch bản bảo vệ đồ án: Giả lập tình huống người quản trị hoặc kẻ gian thâm nhập cơ sở dữ liệu sửa trộm tình trạng sức khỏe của cây (ví dụ sửa từ Kém/Nguy cấp thành Tốt) nhằm che giấu sai sót.
            </p>

            {tamperNotice && (
              <div className="p-2.5 bg-white dark:bg-[#1f1505] rounded-xl border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 font-medium text-[11px] leading-relaxed">
                {tamperNotice}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleTamperSelectedTree}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Bug className="w-4 h-4" />
                <span>1. Sửa trộm dữ liệu cây đang chọn</span>
              </button>

              <button
                onClick={handleRestoreDefaults}
                className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                2. Khôi phục dữ liệu mẫu gốc từ Blockchain
              </button>
            </div>
          </div>

          {/* Terminal-like Canonical Payload Inspection Card */}
          <div className="bg-white dark:bg-[#0c1812] p-5 rounded-2xl border border-[#E0EBDD] dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#174B36] dark:text-[#00FF9D] text-sm">
                <FileCode className="w-4 h-4 text-[#347A50] dark:text-emerald-400" />
                <span>Chuẩn hóa Canonical JSON v1</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                UTF-8 NFC
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Quy tắc chuẩn hóa Section A6: sắp xếp trường cố định, Unicode NFC, ngày UTC ISO-8601, tọa độ 6 số thập phân, loại bỏ PII khỏi chuỗi băm.
            </p>

            {/* Terminal Window Box */}
            <div className="rounded-xl overflow-hidden border border-slate-800 dark:border-emerald-500/30 bg-slate-950 dark:bg-[#030906] shadow-[inset_0_0_20px_rgba(0,255,157,0.04)]">
              {/* Terminal Title Bar */}
              <div className="px-3 py-2 bg-slate-900/90 dark:bg-[#051109] border-b border-slate-800 dark:border-emerald-500/20 flex items-center justify-between text-[10px] text-slate-400 dark:text-emerald-400/80 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 font-semibold text-slate-300 dark:text-emerald-300">payload_serializer.json</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500">SHA-256 Engine</span>
              </div>

              {/* Terminal Code View */}
              <div className="p-3.5 font-mono text-[10px] text-emerald-400 dark:text-[#00FF9D] overflow-x-auto max-h-56">
                <pre className="whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(
                    selectedRecordType === 'TREE_PROFILE'
                      ? computeRecordHash('TREE_PROFILE', trees[0] || {}).payload
                      : computeRecordHash('CARE_RECORD', careRecords[0] || {}).payload,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section A18: Full On-Chain Blockchain Activity Log Table */}
      <div className="bg-white dark:bg-[#0c1812] p-5 rounded-2xl border border-[#E0EBDD] dark:border-slate-800 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#174B36] dark:text-[#00FF9D] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#347A50] dark:text-emerald-400" />
              <span>A18 — Sổ cái Hoạt động Blockchain (On-Chain Activity Log)</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tổng số {anchors.length} bản ghi đã neo thành công trên mạng Hardhat Local EVM.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-[#08120c] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Loại bản ghi</th>
                <th className="py-2.5 px-3">Mã ID</th>
                <th className="py-2.5 px-3">Data Hash (SHA-256)</th>
                <th className="py-2.5 px-3">Transaction Hash</th>
                <th className="py-2.5 px-3">Block</th>
                <th className="py-2.5 px-3">Thời gian neo</th>
                <th className="py-2.5 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
              {anchors.map((anc) => (
                <tr key={anc.txHash} className="hover:bg-slate-50/80 dark:hover:bg-[#102017]/70 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-bold text-[#174B36] dark:text-[#00FF9D]">
                    {anc.recordType}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{anc.recordId}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-emerald-300/80 max-w-xs truncate" title={anc.payloadHash}>
                    {anc.payloadHash.slice(0, 16)}...{anc.payloadHash.slice(-8)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={anc.txHash}>
                    {anc.txHash.slice(0, 12)}...{anc.txHash.slice(-6)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">#{anc.blockNumber}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 text-[10px]">
                    {new Date(anc.anchoredAt).toLocaleTimeString('vi-VN')} {new Date(anc.anchoredAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-[#00FF9D] dark:border dark:border-emerald-500/40">
                      CONFIRMED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
