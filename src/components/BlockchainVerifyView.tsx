import React, { useState, useMemo } from 'react';
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
  Zap,
  Sparkles,
  CheckSquare,
  Activity,
  FileCheck,
  Radio,
  Search,
  Link2,
} from 'lucide-react';
import { blockchainService } from '../services/blockchainService';
import { storage } from '../db/storage';
import { RecordType, Tree, TreeHealthStatus, VerificationResult } from '../types';
import { computeRecordHash } from '../services/hashService';
import { TreeSearchSelect } from './common/TreeSearchSelect';
import { getTreeCorridor, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

export const BlockchainVerifyView: React.FC = () => {
  const [nodeOnline, setNodeOnline] = useState(true);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('TREE_PROFILE');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(storage.getTrees()[0]?.id || '');
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [tamperNotice, setTamperNotice] = useState<string | null>(null);

  // ⚡ Batch Anchoring & Live Verification States
  const [dataVersion, setDataVersion] = useState(0);
  const [isBatchAnchoring, setIsBatchAnchoring] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [batchResultNotice, setBatchResultNotice] = useState<string | null>(null);
  const [isBatchVerifying, setIsBatchVerifying] = useState(false);
  const [batchAuditResult, setBatchAuditResult] = useState<{
    totalChecked: number;
    validCount: number;
    mismatchCount: number;
    mismatchList: Array<{ code: string; name: string }>;
  } | null>(null);

  // Filter tree selector by anchor status
  const [treeAnchorFilter, setTreeAnchorFilter] = useState<'ALL' | 'UNANCHORED' | 'ANCHORED'>('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [ledgerRecordFilter, setLedgerRecordFilter] = useState<string>('ALL');

  const trees = useMemo(() => storage.getTrees(), [dataVersion]);
  const careRecords = useMemo(() => storage.getCareRecords(), [dataVersion]);
  const incidents = useMemo(() => storage.getIncidents(), [dataVersion]);
  const anchors = useMemo(() => blockchainService.getAllAnchors(), [dataVersion]);
  const nodeStatus = blockchainService.getNodeStatus();

  // 📊 THỐNG KÊ BAO PHỦ BLOCKCHAIN (ANCHOR COVERAGE METRICS)
  const totalTrees = trees.length;
  const anchoredTreesCount = useMemo(() => {
    return trees.filter((t) => !!blockchainService.getAnchor('TREE_PROFILE', t.id)).length;
  }, [trees, anchors]);
  const unanchoredTreesCount = Math.max(0, totalTrees - anchoredTreesCount);
  const treeCoveragePercent = totalTrees > 0 ? Math.round((anchoredTreesCount / totalTrees) * 100) : 0;

  const totalCare = careRecords.length;
  const anchoredCareCount = useMemo(() => {
    return careRecords.filter((c) => !!blockchainService.getAnchor('CARE_RECORD', c.id)).length;
  }, [careRecords, anchors]);

  const totalIncidents = incidents.length;
  const anchoredIncidentsCount = useMemo(() => {
    return incidents.filter((i) => !!blockchainService.getAnchor('INCIDENT_REPORT', i.id)).length;
  }, [incidents, anchors]);

  // Cây lọc theo trạng thái neo cho TreeSearchSelect
  const displayTreesForSelector = useMemo(() => {
    if (treeAnchorFilter === 'ALL') return trees;
    return trees.filter((t) => {
      const isAnchored = !!blockchainService.getAnchor('TREE_PROFILE', t.id);
      return treeAnchorFilter === 'ANCHORED' ? isAnchored : !isAnchored;
    });
  }, [trees, treeAnchorFilter, anchors]);

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

  // ⚡ Neo hàng loạt tất cả cây chưa neo lên Blockchain
  const handleBatchAnchorUnanchoredTrees = async () => {
    if (!nodeOnline) {
      alert('Node EVM đang ngoại tuyến, vui lòng bật lại kết nối Node trước khi neo!');
      return;
    }

    const unanchored = trees.filter((t) => !blockchainService.getAnchor('TREE_PROFILE', t.id));
    if (unanchored.length === 0) {
      setBatchResultNotice('Tất cả cá thể cây xanh đã được neo đầy đủ và an toàn trên Smart Contract on-chain!');
      return;
    }

    setIsBatchAnchoring(true);
    setBatchResultNotice(null);

    try {
      const items = unanchored.map((t) => {
        const { hash, canonicalJson } = computeRecordHash('TREE_PROFILE', t);
        return {
          recordType: 'TREE_PROFILE' as RecordType,
          recordId: t.id,
          hash,
          canonicalJson,
        };
      });

      const res = await blockchainService.batchAnchorRecords(items);

      // Cập nhật lại thuộc tính cho các cây trong DB
      res.receipts.forEach((r) => {
        storage.updateTree(r.recordId, {
          payloadVersion: 1,
          payloadHash: r.txHash,
          anchorStatus: 'CONFIRMED',
          txHash: r.txHash,
        });
      });

      setDataVersion((v) => v + 1);
      setBatchResultNotice(
        `✅ Đã neo thành công ${res.count} cây xanh lên Smart Contract on-chain (từ Block #${res.startBlock} đến #${res.endBlock})! Tính toàn vẹn đạt 100%.`
      );
    } catch (err: any) {
      setBatchResultNotice(`❌ Lỗi khi neo hàng loạt: ${err?.message || err}`);
    } finally {
      setIsBatchAnchoring(false);
    }
  };

  // ⚡ Neo hàng loạt nhật ký chăm sóc chưa neo
  const handleBatchAnchorCareRecords = async () => {
    if (!nodeOnline) {
      alert('Node EVM đang ngoại tuyến, vui lòng bật lại kết nối Node!');
      return;
    }

    const unanchoredCare = careRecords.filter((c) => !blockchainService.getAnchor('CARE_RECORD', c.id));
    if (unanchoredCare.length === 0) {
      setBatchResultNotice('Toàn bộ nhật ký chăm sóc đã được neo on-chain!');
      return;
    }

    setIsBatchAnchoring(true);
    setBatchResultNotice(null);

    try {
      const items = unanchoredCare.map((c) => {
        const { hash, canonicalJson } = computeRecordHash('CARE_RECORD', c);
        return {
          recordType: 'CARE_RECORD' as RecordType,
          recordId: c.id,
          hash,
          canonicalJson,
        };
      });

      const res = await blockchainService.batchAnchorRecords(items);
      setDataVersion((v) => v + 1);
      setBatchResultNotice(`✅ Đã neo thành công ${res.count} nhật ký chăm sóc lên Smart Contract!`);
    } catch (err: any) {
      setBatchResultNotice(`❌ Lỗi: ${err?.message || err}`);
    } finally {
      setIsBatchAnchoring(false);
    }
  };

  // 🛡️ Kiểm toán đối soát toàn bộ cây on-chain
  const handleBatchAuditAllTrees = async () => {
    setIsBatchVerifying(true);
    setBatchAuditResult(null);

    await new Promise((r) => setTimeout(r, 800));

    let valid = 0;
    let mismatch = 0;
    const mismatchList: Array<{ code: string; name: string }> = [];

    for (const tree of trees) {
      const res = await blockchainService.verifyRecord('TREE_PROFILE', tree);
      if (res.status === 'VALID') {
        valid++;
      } else if (res.status === 'MISMATCH') {
        mismatch++;
        mismatchList.push({ code: tree.publicCode, name: tree.displayName });
      }
    }

    setBatchAuditResult({
      totalChecked: trees.length,
      validCount: valid,
      mismatchCount: mismatch,
      mismatchList,
    });
    setIsBatchVerifying(false);
  };

  // Neo lẻ một cây trực tiếp từ bảng kiểm tra
  const handleAnchorSpecificTree = async (treeId: string) => {
    const tree = storage.getTreeById(treeId);
    if (!tree) return;

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

    setDataVersion((v) => v + 1);
  };

  // Lọc cây cho Bảng Đối Soát & Kiểm Tra Tình Trạng Neo
  const tableFilteredTrees = useMemo(() => {
    const s = tableSearch.toLowerCase().trim();
    return trees.filter((t) => {
      const isAnchored = !!blockchainService.getAnchor('TREE_PROFILE', t.id);
      if (treeAnchorFilter === 'ANCHORED' && !isAnchored) return false;
      if (treeAnchorFilter === 'UNANCHORED' && isAnchored) return false;

      if (!s) return true;
      const streetCode = getTreeStreetCode(t).toLowerCase();
      const milestone = getTreeMilestone(t).toLowerCase();
      return (
        t.publicCode.toLowerCase().includes(s) ||
        streetCode.includes(s) ||
        t.displayName.toLowerCase().includes(s) ||
        milestone.includes(s)
      );
    });
  }, [trees, treeAnchorFilter, tableSearch, anchors]);

  const tablePageSize = 15;
  const tableTotalPages = Math.max(1, Math.ceil(tableFilteredTrees.length / tablePageSize));
  const tablePaginatedTrees = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return tableFilteredTrees.slice(start, start + tablePageSize);
  }, [tableFilteredTrees, tablePage, tablePageSize]);

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

      {/* BLOCKCHAIN COVERAGE DASHBOARD & BATCH ACTION HUB */}
      <div className="bg-white dark:bg-[#0c1812] p-5 rounded-2xl border border-[#E0EBDD] dark:border-slate-800 shadow-2xs space-y-4">
        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Bao phủ Cây xanh</span>
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#174B36] dark:text-[#00FF9D]">
              {treeCoveragePercent}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {anchoredTreesCount}/{trees.length} cây đã neo
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#174B36] dark:bg-[#00FF9D] h-full rounded-full transition-all duration-500"
                style={{ width: `${treeCoveragePercent}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Cây chưa neo on-chain</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {unanchoredTreesCount}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cần neo để bảo vệ toàn vẹn
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Nhật ký chăm sóc</span>
              <FileCheck className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400">
              {anchoredCareCount}/{careRecords.length}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Đã bảo chứng SHA-256
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              <span>Sự cố &amp; Nghiệm thu</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400">
              {anchoredIncidentsCount}/{incidents.length}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Chống gian lận đền bù
            </div>
          </div>
        </div>

        {/* Action Hub: Batch Anchor & Batch Audit */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-[#00FF9D]" />
              Trung tâm Điều hành Neo Hàng loạt &amp; Kiểm toán On-Chain (Batch Engine)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tự động gom nhóm tất cả hồ sơ hợp lệ, tính Canonical SHA-256 song song và neo đồng loạt lên Smart Contract.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBatchAnchorUnanchoredTrees}
              disabled={isBatchAnchoring || unanchoredTreesCount === 0}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                unanchoredTreesCount === 0
                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-[#174B36] hover:bg-[#123829] text-white dark:bg-[#00FF9D] dark:hover:bg-[#00e68d] dark:text-[#022c1b]'
              }`}
            >
              {isBatchAnchoring ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang neo {unanchoredTreesCount} cây...
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  Neo hàng loạt {unanchoredTreesCount} cây chưa neo
                </>
              )}
            </button>

            {careRecords.length > anchoredCareCount && (
              <button
                type="button"
                onClick={handleBatchAnchorCareRecords}
                disabled={isBatchAnchoring}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Neo {careRecords.length - anchoredCareCount} nhật ký chăm sóc
              </button>
            )}

            <button
              type="button"
              onClick={handleBatchAuditAllTrees}
              disabled={isBatchVerifying}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isBatchVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  Đang đối soát toàn bộ...
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
                  Kiểm toán toàn bộ {trees.length} cây (Audit All)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Batch Operation Result Feedback Banner */}
        {batchResultNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00FF9D] shrink-0" />
              <span>{batchResultNotice}</span>
            </div>
            <button
              onClick={() => setBatchResultNotice(null)}
              className="text-xs text-emerald-600 hover:underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Batch Audit Report Alert */}
        {batchAuditResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 animate-fadeIn ${
            batchAuditResult.mismatchCount > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm flex items-center gap-2">
                {batchAuditResult.mismatchCount > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    BÁO CÁO KIỂM TOÁN: PHÁT HIỆN DỮ LIỆU BỊ SAI LỆCH ({batchAuditResult.mismatchCount} CÂY)
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00FF9D]" />
                    KẾT QUẢ KIỂM TOÁN HOÀN HẢO: 100% DỮ LIỆU ĐÃ NEO KHỚP VỚI BLOCKCHAIN
                  </>
                )}
              </div>
              <button
                onClick={() => setBatchAuditResult(null)}
                className="text-xs hover:underline cursor-pointer opacity-70"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
              <div className="p-2 bg-white/60 dark:bg-slate-900/60 rounded">
                Tổng đã quét: <strong>{batchAuditResult.totalChecked}</strong>
              </div>
              <div className="p-2 bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-700 dark:text-[#00FF9D] rounded">
                Hợp lệ: <strong>{batchAuditResult.validCount}</strong>
              </div>
              <div className={`p-2 rounded ${
                batchAuditResult.mismatchCount > 0
                  ? 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
              }`}>
                Sai lệch (Mismatch): <strong>{batchAuditResult.mismatchCount}</strong>
              </div>
            </div>

            {batchAuditResult.mismatchList.length > 0 && (
              <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-900">
                <span className="font-semibold">Danh sách cây bị sai lệch mã băm:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {batchAuditResult.mismatchList.map((m) => (
                    <span
                      key={m.code}
                      className="px-2 py-0.5 rounded bg-rose-200/90 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-mono text-[11px]"
                    >
                      {m.code} ({m.name})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
        <div className="space-y-3">
          {selectedRecordType === 'TREE_PROFILE' && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF9D]" />
                Lọc cây hiển thị theo tình trạng neo:
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTreeAnchorFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    treeAnchorFilter === 'ALL'
                      ? 'bg-[#174B36] text-white dark:bg-[#00FF9D] dark:text-[#022c1b] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tất cả ({trees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTreeAnchorFilter('UNANCHORED')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    treeAnchorFilter === 'UNANCHORED'
                      ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Chưa neo ({unanchoredTreesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTreeAnchorFilter('ANCHORED')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    treeAnchorFilter === 'ANCHORED'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                      : 'text-emerald-700 dark:text-[#00FF9D] hover:text-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Đã neo ({anchoredTreesCount})
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại bản ghi:</label>
              <select
                value={selectedRecordType}
                onChange={(e) => {
                  const type = e.target.value as RecordType;
                  setSelectedRecordType(type);
                  if (type === 'TREE_PROFILE') setSelectedRecordId(displayTreesForSelector[0]?.id || trees[0]?.id || '');
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
                  trees={displayTreesForSelector}
                  value={selectedRecordId}
                  onChange={(treeId) => {
                    setSelectedRecordId(treeId);
                    setVerifyResult(null);
                  }}
                  label={`Chọn cá thể cây xanh (${displayTreesForSelector.length} cây theo bộ lọc):`}
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

      {/* LIVE ANCHOR CHECKLIST: BẢNG KIỂM TRA TÌNH TRẠNG NEO CỦA TỪNG CÂY */}
      <div className="bg-white dark:bg-[#0c1812] p-5 rounded-2xl border border-[#E0EBDD] dark:border-slate-800 shadow-2xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#174B36] dark:text-[#00FF9D] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-[#00FF9D]" />
              <span>Bảng Đối Soát &amp; Kiểm Tra Tình Trạng Neo (Live Anchor Checklist)</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kiểm tra trực quan cây nào đã neo, cây nào chưa neo và bấm neo lẻ hoặc chọn kiểm tra ngay tức thì.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setTablePage(1);
                }}
                placeholder="Tìm mã cây, tên loài, vị trí..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:border-emerald-500 text-slate-800 dark:text-slate-200 w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setTreeAnchorFilter('ALL');
                  setTablePage(1);
                }}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  treeAnchorFilter === 'ALL'
                    ? 'bg-[#174B36] text-white dark:bg-[#00FF9D] dark:text-[#022c1b]'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tất cả ({trees.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTreeAnchorFilter('UNANCHORED');
                  setTablePage(1);
                }}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  treeAnchorFilter === 'UNANCHORED'
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                Chưa neo ({unanchoredTreesCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTreeAnchorFilter('ANCHORED');
                  setTablePage(1);
                }}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  treeAnchorFilter === 'ANCHORED'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                    : 'text-emerald-700 dark:text-[#00FF9D]'
                }`}
              >
                Đã neo ({anchoredTreesCount})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-[#08120c] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Mã cây / Tuyến</th>
                <th className="py-2.5 px-3">Tên cá thể cây</th>
                <th className="py-2.5 px-3">Vị trí / Địa bàn</th>
                <th className="py-2.5 px-3">Tình trạng Smart Contract</th>
                <th className="py-2.5 px-3">Transaction Hash</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
              {tablePaginatedTrees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy cây nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                tablePaginatedTrees.map((tree) => {
                  const anc = blockchainService.getAnchor('TREE_PROFILE', tree.id);
                  const isAnchored = !!anc;
                  const streetCode = getTreeStreetCode(tree);
                  const milestone = getTreeMilestone(tree);

                  return (
                    <tr
                      key={tree.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#102017]/70 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#174B36] dark:text-[#00FF9D]">
                        <div>{tree.publicCode}</div>
                        {streetCode && (
                          <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {streetCode}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                        {tree.displayName}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {tree.healthStatus} · {tree.classification || 'TYPE_1'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {milestone ? `${milestone}, ` : ''}{tree.address || 'TP. Cần Thơ'}
                      </td>
                      <td className="py-2.5 px-3">
                        {isAnchored ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-[#00FF9D] dark:border dark:border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            ĐÃ NEO (Block #{anc.blockNumber})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-500/40">
                            <AlertTriangle className="w-3 h-3" />
                            CHƯA NEO (NOT_ANCHORED)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {anc?.txHash ? (
                          <span title={anc.txHash}>
                            {anc.txHash.slice(0, 10)}...{anc.txHash.slice(-6)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa phát hành Tx</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isAnchored ? (
                            <button
                              type="button"
                              onClick={() => handleAnchorSpecificTree(tree.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#174B36] hover:bg-[#123829] text-white dark:bg-[#00FF9D] dark:hover:bg-[#00e68d] dark:text-[#022c1b] font-semibold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Link2 className="w-3 h-3" />
                              Neo ngay
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecordType('TREE_PROFILE');
                                setSelectedRecordId(tree.id);
                                handleVerify();
                                window.scrollTo({ top: 400, behavior: 'smooth' });
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-[#00FF9D]" />
                              Kiểm tra
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {tableTotalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Hiển thị {(tablePage - 1) * tablePageSize + 1} -{' '}
              {Math.min(tablePage * tablePageSize, tableFilteredTrees.length)} trên tổng số{' '}
              <strong>{tableFilteredTrees.length}</strong> cây
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                disabled={tablePage === 1}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Trước
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {tablePage} / {tableTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
                disabled={tablePage === tableTotalPages}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
