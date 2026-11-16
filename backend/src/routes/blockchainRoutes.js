const express = require('express');
const router = express.Router();
const blockchainClient = require('../services/blockchainClient');
const hashService = require('../services/hashService');
const db = require('../config/db');
const blockchainController = require('../controllers/blockchainController');

/**
 * ⛓️ BLOCKCHAIN API ROUTES (Dành cho Người 1 - Trần Quang Lâm)
 * Đảm nhận các chức năng Neo dữ liệu bất biến, Cổng kiểm toán xác minh A18/A19
 */

// ==========================================
// 0. PERSISTENT SQLITE-BACKED ANCHOR LEDGER ENDPOINTS (WAVE 5.0.3)
// ==========================================
router.get('/anchors/status', blockchainController.getAnchorStatus);
router.post('/anchors/batch', blockchainController.batchAnchor);
router.get('/anchors/records', blockchainController.getRecords);
router.post('/anchors/verify', blockchainController.verifyRecord);

// ==========================================
// 1. KIỂM TRA TRẠNG THÁI KẾT NỐI MẠNG BLOCKCHAIN
// GET /api/blockchain/status
// ==========================================
router.get('/status', async (req, res) => {
    try {
        const status = await blockchainClient.getNetworkStatus();
        res.json({
            success: true,
            network: status
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Không thể kết nối RPC Node Blockchain',
            error: err.message
        });
    }
});

// ==========================================
// 2. HELPER: TÍNH TOÁN MÃ BĂM SHA-256 CHO CÂY XANH
// POST /api/blockchain/hash/tree
// ==========================================
router.post('/hash/tree', (req, res) => {
    try {
        const treeData = req.body;
        const dataHash = hashService.hashTreeProfile(treeData);
        res.json({
            success: true,
            tree_code: treeData.tree_code,
            dataHash,
            algorithm: 'SHA-256'
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Lỗi tính toán mã băm',
            error: err.message
        });
    }
});

// ==========================================
// 3. NEO BẢN GHI LÊN BLOCKCHAIN (ANCHOR TO CHAIN)
// POST /api/blockchain/anchor
// ==========================================
router.post('/anchor', async (req, res) => {
    const { recordId, recordType, dataHash, treeData } = req.body;

    try {
        let finalHash = dataHash;

        // Nếu client truyền object treeData thay vì dataHash, tự động tính hash chuẩn
        if (!finalHash && treeData) {
            finalHash = hashService.hashTreeProfile(treeData);
        }

        if (!recordId || !recordType || !finalHash) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: recordId, recordType và dataHash (hoặc treeData)'
            });
        }

        const result = await blockchainClient.anchor(recordId, recordType, finalHash);

        // Đồng bộ lưu vào bảng kiểm toán blockchain_audits
        db.run(
            `INSERT INTO blockchain_audits (record_type, record_id, data_hash, tx_hash, block_number, recorder_address, status, confirmed_at)
             VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)`,
            [recordType, recordId, finalHash, result.txHash, result.blockNumber, result.recorder]
        );

        // Đồng bộ cập nhật hash vào bảng SQLite tương ứng
        if (recordType === 'TREE_PROFILE') {
            db.run(`UPDATE trees SET data_hash = ? WHERE tree_code = ?`, [finalHash, recordId]);
        } else if (recordType === 'CARE_LOG') {
            db.run(`UPDATE care_records SET data_hash = ?, anchor_status = 'CONFIRMED' WHERE care_code = ?`, [finalHash, recordId]);
        }

        res.status(201).json({
            success: true,
            status: 'ok',
            message: `Đã neo bản ghi ${recordId} thành công lên Blockchain`,
            recordId,
            recordType,
            dataHash: finalHash,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            recorder: result.recorder
        });
    } catch (err) {
        let statusCode = 400;
        let errorMessage = err.message;

        if (errorMessage.includes('Record already anchored')) {
            errorMessage = 'CHỐNG GIAN LẬN: Bản ghi này đã được neo trên Blockchain trước đó. Tuyệt đối không cho phép ghi đè!';
            statusCode = 409; // Conflict
        } else if (errorMessage.includes('not authorized')) {
            errorMessage = 'Ví thực hiện giao dịch chưa được cấp quyền ghi dấu trên hợp đồng thông minh.';
            statusCode = 403; // Forbidden
        }

        res.status(statusCode).json({
            success: false,
            status: 'error',
            message: errorMessage,
            rawError: err.message
        });
    }
});

// ==========================================
// 4. CỔNG XÁC MINH TOÀN VẸN MERKLE HASH (CỔNG A19)
// GET /api/blockchain/verify/:recordId
// Query param: ?currentHash=...
// ==========================================
router.get('/verify/:recordId', async (req, res) => {
    const { recordId } = req.params;
    const { currentHash } = req.query;

    try {
        const result = await blockchainClient.verify(recordId, currentHash);

        let auditStatus = 'UNKNOWN';
        let humanMessage = '';

        if (!result.isExisted) {
            auditStatus = 'NOT_FOUND_ON_CHAIN';
            humanMessage = 'Bản ghi chưa được đăng ký hoặc chưa được neo lên chuỗi khối.';
        } else if (result.isValid) {
            auditStatus = 'VERIFIED_INTEGRITY_MATCH';
            humanMessage = '✅ XÁC THỰC THÀNH CÔNG: Dữ liệu hoàn toàn khớp 100% với bản ghi bất biến trên Blockchain (Tích xanh uy tín).';
        } else {
            auditStatus = 'TAMPERING_DETECTED_HASH_MISMATCH';
            humanMessage = '🚨 CẢNH BÁO GIẢ MẠO: Dữ liệu hiện tại khác với mã băm gốc trên Blockchain! Có dấu hiệu sửa đổi trái phép!';
        }

        res.json({
            success: true,
            recordId: result.recordId,
            isValid: result.isValid,
            isExisted: result.isExisted,
            auditStatus,
            message: humanMessage,
            timestamp: result.timestamp,
            dateFormatted: result.dateFormatted,
            recorder: result.recorder,
            storedHash: result.storedHash,
            currentHash: result.currentHash
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Lỗi trong quá trình xác minh dữ liệu với Smart Contract',
            error: err.message
        });
    }
});

// ==========================================
// 5. ĐỌC CHI TIẾT BẢN GHI TRÊN CHUỖI
// GET /api/blockchain/record/:recordId
// ==========================================
router.get('/record/:recordId', async (req, res) => {
    const { recordId } = req.params;
    try {
        const rec = await blockchainClient.getRecord(recordId);
        res.json({
            success: true,
            data: rec
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            message: `Không tìm thấy bản ghi ${recordId} trên chuỗi khối`,
            error: err.message
        });
    }
});

// ==========================================
// 6. KHÁM PHÁ HOẠT ĐỘNG SỔ CÁI (A18 ACTIVITY EXPLORER)
// GET /api/blockchain/explorer
// ==========================================
router.get('/explorer', async (req, res) => {
    try {
        const data = await blockchainClient.getAllRecords();
        res.json({
            success: true,
            totalRecords: data.totalRecords,
            records: data.records
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Lỗi truy xuất sổ cái Blockchain',
            error: err.message
        });
    }
});

module.exports = router;
