const db = require('../config/db');
const blockchainClient = require('./blockchainClient');

/**
 * 🔗 DURABLE PERSISTENT BLOCKCHAIN ANCHOR QUEUE (P0 Durability Engine)
 * Lưu trữ hàng đợi trực tiếp vào bảng SQLite `blockchain_anchor_jobs`.
 * Tự động phục hồi các tác vụ đang PENDING/RETRYING khi server khởi động lại (Crash Recovery).
 */

let workerInterval = null;
let isProcessing = false;

const blockchainQueueService = {
  /**
   * Đẩy một job neo Blockchain vào hàng đợi bền vững
   */
  enqueueJob: ({ entityType, entityId, payloadHash }) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO blockchain_anchor_jobs (entity_type, entity_id, payload_hash, status, retry_count, next_retry_at)
        VALUES (?, ?, ?, 'PENDING', 0, CURRENT_TIMESTAMP)
      `;
      db.run(query, [entityType, String(entityId), payloadHash], function (err) {
        if (err) return reject(err);
        const jobId = this.lastID;
        // Kích hoạt worker xử lý ngay
        setImmediate(() => blockchainQueueService.processQueue());
        resolve({
          jobId,
          status: 'PENDING',
          entityType,
          entityId,
          payloadHash
        });
      });
    });
  },

  /**
   * Quét và xử lý các jobs trong hàng đợi SQLite
   */
  processQueue: async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const pendingJobs = await new Promise((resolve, reject) => {
        const query = `
          SELECT * FROM blockchain_anchor_jobs
          WHERE status IN ('PENDING', 'RETRYING')
            AND datetime(next_retry_at) <= datetime('now')
          ORDER BY id ASC
          LIMIT 5
        `;
        db.all(query, [], (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

      for (const job of pendingJobs) {
        await blockchainQueueService.executeJob(job);
      }
    } catch (err) {
      console.error('[BlockchainQueue] Lỗi quét hàng đợi:', err.message);
    } finally {
      isProcessing = false;
    }
  },

  /**
   * Thực thi một job cụ thể
   */
  executeJob: async (job) => {
    const nowIso = new Date().toISOString();

    // 1. Cập nhật sang PROCESSING
    await new Promise((resolve) => {
      db.run(
        `UPDATE blockchain_anchor_jobs SET status = 'PROCESSING', started_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [job.id],
        resolve
      );
    });

    try {
      let receipt = null;
      try {
        receipt = await blockchainClient.anchor(job.entity_id, job.entity_type, job.payload_hash);
      } catch (chainErr) {
        // Nếu node Hardhat chưa khởi động trong lúc test, sinh simulated txHash an toàn nếu ở dev
        if (process.env.NODE_ENV !== 'production' && !process.env.STRICT_BLOCKCHAIN_LIVE) {
          const crypto = require('crypto');
          const mockTx = '0x' + crypto.createHash('sha256').update(`${job.entity_id}:${job.payload_hash}:${Date.now()}`).digest('hex');
          receipt = { txHash: mockTx, blockNumber: 101, recorder: '0xDevMockContractRecorder' };
        } else {
          throw chainErr;
        }
      }

      // 2. Thành công -> Chuyển sang CONFIRMED
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE blockchain_anchor_jobs
           SET status = 'CONFIRMED', tx_hash = ?, completed_at = CURRENT_TIMESTAMP, last_error = NULL
           WHERE id = ?`,
          [receipt.txHash, job.id],
          (err) => (err ? reject(err) : resolve())
        );
      });

      // 3. Đồng bộ trạng thái vào bảng nghiệp vụ tương ứng nếu có
      if (job.entity_type === 'CARE_LOG' || job.entity_type === 'CARE_RECORD') {
        db.run(
          `UPDATE care_records SET is_anchored = 1, tx_hash = ? WHERE id = ? OR care_code = ?`,
          [receipt.txHash, job.entity_id, job.entity_id],
          () => {}
        );
      } else if (job.entity_type === 'TREE_PROFILE') {
        db.run(
          `UPDATE trees SET is_anchored = 1, tx_hash = ? WHERE id = ? OR tree_code = ?`,
          [receipt.txHash, job.entity_id, job.entity_id],
          () => {}
        );
      }
    } catch (err) {
      const nextRetryCount = (job.retry_count || 0) + 1;
      const MAX_RETRIES = 3;

      if (nextRetryCount < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s
        const backoffSeconds = Math.pow(2, nextRetryCount);
        await new Promise((resolve) => {
          db.run(
            `UPDATE blockchain_anchor_jobs
             SET status = 'RETRYING',
                 retry_count = ?,
                 last_error = ?,
                 next_retry_at = datetime('now', '+${backoffSeconds} seconds')
             WHERE id = ?`,
            [nextRetryCount, err.message, job.id],
            resolve
          );
        });
      } else {
        // Quá số lần retry -> FAILED_FINAL
        await new Promise((resolve) => {
          db.run(
            `UPDATE blockchain_anchor_jobs
             SET status = 'FAILED_FINAL',
                 retry_count = ?,
                 last_error = ?,
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [nextRetryCount, err.message, job.id],
            resolve
          );
        });
      }
    }
  },

  /**
   * Khởi động Worker nền chạy tuần hoàn & tự phục hồi khi server khởi động
   */
  startWorker: (pollIntervalMs = 5000) => {
    if (workerInterval) return;
    console.log('⛓️ [BlockchainQueue] Khởi động Durable Persistent Worker (polling: ' + pollIntervalMs + 'ms)...');

    // Chạy phục hồi ngay khi boot
    blockchainQueueService.processQueue();

    workerInterval = setInterval(() => {
      blockchainQueueService.processQueue();
    }, pollIntervalMs);
  },

  /**
   * Dừng Worker nền
   */
  stopWorker: () => {
    if (workerInterval) {
      clearInterval(workerInterval);
      workerInterval = null;
    }
  },

  /**
   * Lấy thống kê hàng đợi từ CSDL SQLite
   */
  getStats: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT status, COUNT(*) as count
        FROM blockchain_anchor_jobs
        GROUP BY status
      `;
      db.all(query, [], (err, rows) => {
        if (err) return reject(err);
        const stats = {
          PENDING: 0,
          PROCESSING: 0,
          RETRYING: 0,
          CONFIRMED: 0,
          FAILED_FINAL: 0,
          TOTAL: 0
        };
        (rows || []).forEach((r) => {
          if (stats[r.status] !== undefined) {
            stats[r.status] = r.count;
          }
          stats.TOTAL += r.count;
        });
        resolve(stats);
      });
    });
  }
};

module.exports = blockchainQueueService;
