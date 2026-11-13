/**
 * UrbanTree - Blockchain Service & EVM Smart Contract Simulator (UrbanTreeRegistry)
 * Implements Section A3.3 & Section 7 of the UrbanTree 20-Day Roadmap.
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

// In-memory / persistent ledger of anchored records
interface OnChainRecord {
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

  constructor() {
    this.loadFromStorage();
  }

  private getKey(recordType: RecordType, recordId: string): string {
    return `${recordType}::${recordId}`;
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('urbantree_blockchain_ledger');
        if (saved) {
          const list: OnChainRecord[] = JSON.parse(saved);
          list.forEach((rec) => {
            this.anchors.set(this.getKey(rec.recordType, rec.recordId), rec);
            if (rec.blockNumber > this.currentBlockNumber) {
              this.currentBlockNumber = rec.blockNumber;
            }
          });
        }
      }
    } catch {
      // Ignore in non-browser env
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = Array.from(this.anchors.values());
        localStorage.setItem('urbantree_blockchain_ledger', JSON.stringify(list));
      }
    } catch {
      // Ignore
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

  /**
   * Generates a deterministic simulated EVM transaction hash: 0x + 64 hex chars
   */
  private generateTxHash(recordType: string, recordId: string, blockNum: number): string {
    const raw = `${recordType}:${recordId}:${blockNum}:${Date.now()}`;
    return '0x' + sha256Hex(raw);
  }

  /**
   * Anchors a record hash to the Smart Contract.
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
    const key = this.getKey(recordType, recordId);

    this.currentBlockNumber += 1;
    const blockNumber = this.currentBlockNumber;
    const txHash = this.generateTxHash(recordType, recordId, blockNumber);

    const onChainRecord: OnChainRecord = {
      recordType,
      recordId,
      payloadVersion,
      payloadHash: hash.toLowerCase(),
      canonicalJson,
      txHash,
      blockNumber,
      contractAddress: CONTRACT_ADDRESS,
      anchoredAt: new Date().toISOString(),
    };

    this.anchors.set(key, onChainRecord);
    this.saveToStorage();

    return {
      status: 'CONFIRMED',
      txHash,
      blockNumber,
      contractAddress: CONTRACT_ADDRESS,
    };
  }

  /**
   * ⚡ BATCH ANCHOR: Neo hàng loạt nhiều bản ghi trong cùng một block / transaction
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

    const startBlock = this.currentBlockNumber + 1;
    const receipts: Array<{ recordId: string; txHash: string; blockNumber: number }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.currentBlockNumber += 1;
      const blockNumber = this.currentBlockNumber;
      const txHash = this.generateTxHash(item.recordType, item.recordId, blockNumber);
      const key = this.getKey(item.recordType, item.recordId);

      const onChainRecord: OnChainRecord = {
        recordType: item.recordType,
        recordId: item.recordId,
        payloadVersion: item.payloadVersion || 1,
        payloadHash: item.hash.toLowerCase(),
        canonicalJson: item.canonicalJson || '',
        txHash,
        blockNumber,
        contractAddress: CONTRACT_ADDRESS,
        anchoredAt: new Date().toISOString(),
      };

      this.anchors.set(key, onChainRecord);
      receipts.push({ recordId: item.recordId, txHash, blockNumber });
    }

    this.saveToStorage();

    return {
      count: items.length,
      startBlock,
      endBlock: this.currentBlockNumber,
      receipts,
    };
  }

  /**
   * Verifies an on-chain record against current database record state.
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

    // Detect diff fields if there is a mismatch
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

  /**
   * Gets anchor record by key
   */
  public getAnchor(recordType: RecordType, recordId: string): BlockchainAnchor | null {
    const key = this.getKey(recordType, recordId);
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

  /**
   * Returns all anchored records sorted by newest first
   */
  public getAllAnchors(): OnChainRecord[] {
    return Array.from(this.anchors.values()).sort(
      (a, b) => new Date(b.anchoredAt).getTime() - new Date(a.anchoredAt).getTime()
    );
  }

  /**
   * Reset / clear local ledger (for demo refresh)
   */
  public clearLedger() {
    this.anchors.clear();
    this.currentBlockNumber = 104280;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('urbantree_blockchain_ledger');
    }
  }
}

export const blockchainService = new BlockchainService();
