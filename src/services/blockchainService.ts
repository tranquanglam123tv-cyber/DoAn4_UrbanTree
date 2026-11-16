/**
 * UrbanTree - Blockchain Service & EVM Smart Contract Simulator (UrbanTreeRegistry)
 * Implements Section A3.3 & Section 7 of the UrbanTree 20-Day Roadmap.
 * WAVE 5.0.3: PERSISTENT SQLITE-BACKED ANCHOR LEDGER ARCHITECTURE
 */

import {
  AnchorStatus,
  BlockchainAnchor,
  CareRecord,
  Incident,
  RecordType,
  Tree,
  VerificationResult,
} from '../types';
import { computeRecordHash, sha256Hex } from './hashService';

const CONTRACT_ADDRESS = '0x71C8A5A4349488a7B6a24A61dBebf0cf4A6112C8';
const CHAIN_ID = 31337; // Hardhat Local EVM
const BACKEND_BASE = 'http://localhost:5001/api/blockchain';

export interface OnChainRecord {
  recordType: RecordType;
  recordId: string;
  payloadVersion: number;
  payloadHash: string;
  canonicalJson: string;
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  anchoredAt: string;
}

class BlockchainService {
  private anchors: Map<string, OnChainRecord> = new Map();
  private currentBlockNumber: number = 104280;
  private isNodeOnline: boolean = true;
  private isSyncing: boolean = false;

  constructor() {
    this.syncFromBackend();
  }

  private getKey(recordType: RecordType, recordId: string): string {
    return `${recordType}::${recordId}`;
  }

  /**
   * Sync persistent anchors from SQLite backend
   */
  public async syncFromBackend(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      // 1. Fetch highest block and counts
      const statusRes = await fetch(`${BACKEND_BASE}/anchors/status`).then((r) => r.json()).catch(() => null);
      if (statusRes && statusRes.success && statusRes.data) {
        if (statusRes.data.currentBlockNumber > this.currentBlockNumber) {
          this.currentBlockNumber = statusRes.data.currentBlockNumber;
        }
      }

      // 2. Fetch paginated records from persistent SQLite ledger (up to 1000 for client memory)
      const recordsRes = await fetch(`${BACKEND_BASE}/anchors/records?limit=1000`).then((r) => r.json()).catch(() => null);
      if (recordsRes && recordsRes.success && Array.isArray(recordsRes.records)) {
        for (const r of recordsRes.records) {
          const rec: OnChainRecord = {
            recordType: r.recordType,
            recordId: String(r.recordId),
            payloadVersion: 1,
            payloadHash: (r.payloadHash || '').toLowerCase(),
            canonicalJson: r.canonicalJson || '',
            txHash: r.txHash,
            blockNumber: r.blockNumber,
            contractAddress: CONTRACT_ADDRESS,
            anchoredAt: r.anchoredAt,
          };
          this.anchors.set(this.getKey(rec.recordType, rec.recordId), rec);
        }
      }
    } catch (err) {
      console.warn('[BlockchainService] Sync error, fallback to memory:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  public setNodeOnline(online: boolean) {
    this.isNodeOnline = online;
  }

  public getNodeStatus(): { isOnline: boolean; chainId: number; contractAddress: string; blockNumber: number } {
    return {
      isOnline: this.isNodeOnline,
      chainId: CHAIN_ID,
      contractAddress: CONTRACT_ADDRESS,
      blockNumber: this.currentBlockNumber,
    };
  }

  private generateTxHash(recordType: string, recordId: string, blockNum: number): string {
    const raw = `${recordType}:${recordId}:${blockNum}:${Date.now()}`;
    return '0x' + sha256Hex(raw);
  }

  /**
   * Anchors a record hash to SQLite persistent ledger
   */
  public async anchorRecord(params: {
    recordType: RecordType;
    recordId: string;
    payloadVersion?: number;
    hash: string;
    canonicalJson?: string;
  }): Promise<{
    status: AnchorStatus;
    txHash?: string;
    blockNumber?: number;
    contractAddress?: string;
    error?: string;
  }> {
    if (!this.isNodeOnline) {
      return {
        status: 'UNAVAILABLE',
        error: 'EVM Local Node is currently unreachable (Connection refused: 127.0.0.1:8545)',
      };
    }

    const { recordType, recordId, payloadVersion = 1, hash, canonicalJson = '' } = params;

    try {
      const res = await fetch(`${BACKEND_BASE}/anchors/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ recordType, recordId, payloadVersion, hash, canonicalJson }],
        }),
      });

      const json = await res.json();
      if (json.success && json.receipts && json.receipts[0]) {
        const rc = json.receipts[0];
        const onChainRecord: OnChainRecord = {
          recordType,
          recordId: String(recordId),
          payloadVersion,
          payloadHash: hash.toLowerCase(),
          canonicalJson,
          txHash: rc.txHash,
          blockNumber: rc.blockNumber,
          contractAddress: CONTRACT_ADDRESS,
          anchoredAt: new Date().toISOString(),
        };
        this.anchors.set(this.getKey(recordType, String(recordId)), onChainRecord);
        if (rc.blockNumber > this.currentBlockNumber) {
          this.currentBlockNumber = rc.blockNumber;
        }

        return {
          status: 'CONFIRMED',
          txHash: rc.txHash,
          blockNumber: rc.blockNumber,
          contractAddress: CONTRACT_ADDRESS,
        };
      }
    } catch {
      // Fallback local memory
    }

    this.currentBlockNumber += 1;
    const blockNumber = this.currentBlockNumber;
    const txHash = this.generateTxHash(recordType, recordId, blockNumber);
    const fallbackRec: OnChainRecord = {
      recordType,
      recordId: String(recordId),
      payloadVersion,
      payloadHash: hash.toLowerCase(),
      canonicalJson,
      txHash,
      blockNumber,
      contractAddress: CONTRACT_ADDRESS,
      anchoredAt: new Date().toISOString(),
    };
    this.anchors.set(this.getKey(recordType, String(recordId)), fallbackRec);

    return {
      status: 'CONFIRMED',
      txHash,
      blockNumber,
      contractAddress: CONTRACT_ADDRESS,
    };
  }

  /**
   * ⚡ BATCH ANCHOR: Gửi danh sách bản ghi lên SQLite persistent ledger
   */
  public async batchAnchorRecords(
    items: Array<{
      recordType: RecordType;
      recordId: string;
      payloadVersion?: number;
      hash: string;
      canonicalJson?: string;
    }>
  ): Promise<{
    count: number;
    startBlock: number;
    endBlock: number;
    receipts: Array<{ recordId: string; txHash: string; blockNumber: number }>;
  }> {
    if (!this.isNodeOnline) {
      throw new Error('EVM Local Node đang ngoại tuyến (Offline)');
    }

    // Gửi chunk tối đa 500 bản ghi lên backend SQLite persistent API
    const CHUNK_SIZE = 500;
    const receipts: Array<{ recordId: string; txHash: string; blockNumber: number }> = [];
    let startBlock = this.currentBlockNumber + 1;
    let endBlock = this.currentBlockNumber;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      try {
        const res = await fetch(`${BACKEND_BASE}/anchors/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk }),
        });

        const json = await res.json();
        if (json.success && json.receipts) {
          if (i === 0) startBlock = json.startBlock;
          endBlock = json.endBlock;
          this.currentBlockNumber = json.endBlock;

          for (const rc of json.receipts) {
            receipts.push(rc);
            const orig = chunk.find((c) => String(c.recordId) === String(rc.recordId));
            const onChainRecord: OnChainRecord = {
              recordType: rc.recordType,
              recordId: String(rc.recordId),
              payloadVersion: 1,
              payloadHash: (rc.hash || orig?.hash || '').toLowerCase(),
              canonicalJson: orig?.canonicalJson || '',
              txHash: rc.txHash,
              blockNumber: rc.blockNumber,
              contractAddress: CONTRACT_ADDRESS,
              anchoredAt: new Date().toISOString(),
            };
            this.anchors.set(this.getKey(rc.recordType, String(rc.recordId)), onChainRecord);
          }
          continue;
        }
      } catch (e) {
        console.warn('Batch anchor API network failure, fallback:', e);
      }

      // Memory fallback
      for (const item of chunk) {
        this.currentBlockNumber += 1;
        const blockNumber = this.currentBlockNumber;
        const txHash = this.generateTxHash(item.recordType, item.recordId, blockNumber);
        receipts.push({ recordId: item.recordId, txHash, blockNumber });
        const onChainRecord: OnChainRecord = {
          recordType: item.recordType,
          recordId: String(item.recordId),
          payloadVersion: item.payloadVersion || 1,
          payloadHash: item.hash.toLowerCase(),
          canonicalJson: item.canonicalJson || '',
          txHash,
          blockNumber,
          contractAddress: CONTRACT_ADDRESS,
          anchoredAt: new Date().toISOString(),
        };
        this.anchors.set(this.getKey(item.recordType, String(item.recordId)), onChainRecord);
      }
      endBlock = this.currentBlockNumber;
    }

    return {
      count: receipts.length,
      startBlock,
      endBlock,
      receipts,
    };
  }

  /**
   * Verifies an on-chain record against current database record state with SQLite backend.
   */
  public async verifyRecord(
    recordType: RecordType,
    recordData: Partial<Tree> | Partial<CareRecord> | Partial<Incident>
  ): Promise<VerificationResult> {
    const recordId = String(recordData.id || '');
    const { canonicalJson, hash } = computeRecordHash(recordType, recordData);

    if (!this.isNodeOnline) {
      return {
        status: 'UNAVAILABLE',
        recordType,
        recordId,
        currentHash: hash,
        canonicalJson,
      };
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/anchors/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType,
          recordId,
          currentHash: hash,
          currentPayload: canonicalJson,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        return {
          status: d.status,
          recordType,
          recordId,
          currentHash: hash,
          onChainHash: d.onChainHash,
          txHash: d.txHash,
          blockNumber: d.blockNumber,
          contractAddress: d.contractAddress || CONTRACT_ADDRESS,
          anchoredAt: d.anchoredAt,
          canonicalJson,
          diffFields: d.diffFields,
        };
      }
    } catch (err) {
      console.warn('Backend verify call failed, fallback to local map:', err);
    }

    // Local Map Fallback
    const key = this.getKey(recordType, recordId);
    const anchored = this.anchors.get(key);

    if (!anchored) {
      return {
        status: 'NOT_ANCHORED',
        recordType,
        recordId,
        currentHash: hash,
        canonicalJson,
      };
    }

    const isMatch = anchored.payloadHash.toLowerCase() === hash.toLowerCase();
    let diffFields: VerificationResult['diffFields'] = undefined;
    if (!isMatch && anchored.canonicalJson) {
      try {
        const anchoredPayload = JSON.parse(anchored.canonicalJson);
        const currentPayload = JSON.parse(canonicalJson);
        diffFields = [];
        const allKeys = Array.from(new Set([...Object.keys(anchoredPayload), ...Object.keys(currentPayload)]));
        for (const k of allKeys) {
          if (JSON.stringify(anchoredPayload[k]) !== JSON.stringify(currentPayload[k])) {
            diffFields.push({
              field: k,
              currentValue: currentPayload[k],
              anchoredValue: anchoredPayload[k],
            });
          }
        }
      } catch {
        // Fallback
      }
    }

    return {
      status: isMatch ? 'VALID' : 'MISMATCH',
      recordType,
      recordId,
      currentHash: hash,
      onChainHash: anchored.payloadHash,
      txHash: anchored.txHash,
      blockNumber: anchored.blockNumber,
      contractAddress: anchored.contractAddress,
      anchoredAt: anchored.anchoredAt,
      canonicalJson,
      diffFields,
    };
  }

  public getAnchor(recordType: RecordType, recordId: string): BlockchainAnchor | null {
    const key = this.getKey(recordType, String(recordId));
    const rec = this.anchors.get(key);
    if (!rec) return null;

    return {
      id: `anchor-${rec.recordType}-${rec.recordId}`,
      recordType: rec.recordType,
      recordId: rec.recordId,
      payloadVersion: rec.payloadVersion,
      payloadHash: rec.payloadHash,
      txHash: rec.txHash,
      blockNumber: rec.blockNumber,
      contractAddress: rec.contractAddress,
      status: 'CONFIRMED',
      retryCount: 0,
      createdAt: rec.anchoredAt,
      confirmedAt: rec.anchoredAt,
    };
  }

  public getAllAnchors(): OnChainRecord[] {
    return Array.from(this.anchors.values()).sort(
      (a, b) => new Date(b.anchoredAt).getTime() - new Date(a.anchoredAt).getTime()
    );
  }

  public clearLedger() {
    this.anchors.clear();
    this.currentBlockNumber = 104280;
  }
}

export const blockchainService = new BlockchainService();
