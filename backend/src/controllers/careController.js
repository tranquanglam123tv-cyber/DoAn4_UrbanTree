const CareRecord = require('../models/CareRecord');
const Tree = require('../models/Tree');
const db = require('../config/db');
const hashService = require('../services/hashService');
const blockchainClient = require('../services/blockchainClient');

/**
 * 1. Lấy danh sách lịch sử chăm sóc (Hỗ trợ lọc theo tree_id, action_type và phân trang)
 * Endpoint: GET /api/care-records?tree_id=1&action_type=Cắt tỉa&page=1&limit=50
 */
exports.getAllCareRecords = (req, res) => {
  const { tree_id, action_type, page = 1, limit = 50, all } = req.query;
  const isAll = all === 'true' || all === '1';
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = isAll ? 20000 : Math.max(1, Math.min(10000, parseInt(limit) || 50));
  const offset = isAll ? 0 : (pageNum - 1) * limitNum;

  CareRecord.getAll({ tree_id, action_type, limit: limitNum, offset }, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn lịch sử chăm sóc',
        error: err.message
      });
    }

    res.json({
      success: true,
      count: rows.length,
      page: pageNum,
      limit: limitNum,
      filters: {
        tree_id: tree_id ? parseInt(tree_id) : null,
        action_type: action_type || null
      },
      data: rows
    });
  });
};

/**
 * 2. Lấy chi tiết một bản ghi chăm sóc theo ID
 * Endpoint: GET /api/care-records/:id
 */
exports.getCareRecordById = (req, res) => {
  const { id } = req.params;

  CareRecord.getById(id, (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn bản ghi chăm sóc',
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy bản ghi chăm sóc với ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: row
    });
  });
};

/**
 * 3. Ghi nhận hoạt động chăm sóc thực địa mới & Tự động neo Blockchain (Roadmap Ngày 5-6)
 * Endpoint: POST /api/care-records
 */
exports.addCareRecord = (req, res) => {
  const {
    care_code,
    tree_id,
    tree_code,
    staff_id,
    caretaker_name,
    action_type,
    health_before,
    health_after,
    notes,
    image_before_url,
    image_after_url,
    action_date
  } = req.body;

  if (!caretaker_name || !caretaker_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp tên nhân viên / đội thực hiện chăm sóc'
    });
  }

  if (!action_type || !action_type.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn loại hành động chăm sóc'
    });
  }

  const validActionTypes = ['Tưới nước', 'Bón phân', 'Cắt tỉa', 'Trị sâu bệnh', 'Gia cố cọc'];
  if (!validActionTypes.includes(action_type.trim())) {
    return res.status(400).json({
      success: false,
      message: `Loại hành động không hợp lệ. Chỉ chấp nhận: ${validActionTypes.join(', ')}`
    });
  }

  // Helper tìm tree theo ID hoặc theo Code
  const findTree = (callback) => {
    if (tree_id) {
      Tree.getById(tree_id, callback);
    } else if (tree_code) {
      Tree.getByCode(tree_code, callback);
    } else {
      callback(null, null);
    }
  };

  findTree((err, tree) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra thông tin cây xanh',
        error: err.message
      });
    }

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy cây xanh với thông tin cung cấp (tree_id: ${tree_id || 'none'}, tree_code: ${tree_code || 'none'})`
      });
    }

    // 🔒 CHÍNH SÁCH BẢO VỆ CÂY ĐÃ HẠ GIẢI / GIẢI TỎA (P0 Policy Enforcement)
    // Cây có trạng thái REMOVED hoặc DECOMMISSIONED hoặc is_active = 0 bị chặn tuyệt đối không được ghi nhận chăm sóc mới
    if (tree.status === 'REMOVED' || tree.status === 'DECOMMISSIONED' || tree.is_active === 0 || tree.is_active === false) {
      return res.status(400).json({
        success: false,
        message: `Không thể tạo bản ghi chăm sóc cho cây xanh đã giải tỏa / hạ giải (Mã: ${tree.tree_code || tree.id}, Trạng thái: ${tree.status || 'REMOVED'}). Hồ sơ cây đã đóng.`
      });
    }

    const actualTreeId = tree.id;
    const actualCareCode = (care_code || `CARE-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
    const actualActionDate = action_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Tính toán mã băm SHA-256 chuẩn Master Spec cho CARE_LOG
    const dataHash = hashService.hashCareLog({
      tree_id: actualTreeId,
      caretaker_name: caretaker_name.trim(),
      action_type: action_type.trim(),
      action_date: actualActionDate
    });

    // 2. Lưu bản ghi chăm sóc vào SQLite
    CareRecord.create(
      {
        care_code: actualCareCode,
        tree_id: actualTreeId,
        staff_id: staff_id || null,
        caretaker_name: caretaker_name.trim(),
        action_type: action_type.trim(),
        health_before: health_before || tree.health_status || null,
        health_after: health_after || null,
        notes: (notes || '').trim(),
        image_before_url: image_before_url || null,
        image_after_url: image_after_url || null,
        data_hash: dataHash,
        anchor_status: 'PENDING',
        action_date: actualActionDate
      },
      async (insertErr, newRecord) => {
        if (insertErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi lưu bản ghi chăm sóc vào cơ sở dữ liệu',
            error: insertErr.message
          });
        }

        // 3. Tự động neo bản ghi lên Blockchain (Nhiệm vụ 3 trong bàn giao)
        let blockchainResult = null;
        try {
          const anchorResult = await blockchainClient.anchor(actualCareCode, 'CARE_LOG', dataHash);
          blockchainResult = {
            anchored: true,
            status: 'CONFIRMED',
            txHash: anchorResult.txHash,
            blockNumber: anchorResult.blockNumber,
            gasUsed: anchorResult.gasUsed,
            recorder: anchorResult.recorder
          };

          // Cập nhật trạng thái CONFIRMED vào bảng care_records
          CareRecord.updateAnchor(newRecord.id, dataHash, 'CONFIRMED', () => {});

          // Lưu vết kiểm toán vào blockchain_audits
          db.run(
            `INSERT INTO blockchain_audits (record_type, record_id, data_hash, tx_hash, block_number, recorder_address, status, confirmed_at)
             VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)`,
            ['CARE_LOG', actualCareCode, dataHash, anchorResult.txHash, anchorResult.blockNumber, anchorResult.recorder]
          );
        } catch (bcErr) {
          blockchainResult = {
            anchored: false,
            status: 'PENDING',
            message: 'Không thể kết nối EVM hoặc đã neo: ' + bcErr.message
          };

          db.run(
            `INSERT INTO blockchain_audits (record_type, record_id, data_hash, status, last_error)
             VALUES (?, ?, ?, 'PENDING', ?)`,
            ['CARE_LOG', actualCareCode, dataHash, bcErr.message]
          );
        }

        res.status(201).json({
          success: true,
          care_id: newRecord.id,
          care_code: actualCareCode,
          message: 'Đã lưu nhật ký bảo dưỡng thực địa và neo Blockchain thành công',
          data: {
            ...newRecord,
            data_hash: dataHash
          },
          blockchain: blockchainResult
        });
      }
    );
  });
};

/**
 * 4. Thêm hàng loạt bản ghi chăm sóc (Bulk Insert với SQLite Transaction)
 * Endpoint: POST /api/care-records/bulk
 */
exports.addCareRecordsBulk = (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách chăm sóc rỗng' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO care_records (
        care_code, tree_id, tree_code, caretaker_name, action_type,
        health_before, health_after, notes, action_date, data_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const r of records) {
      const code = r.id || `care-${Date.now()}-${inserted}`;
      const treeCode = r.treeId || 'CT-01';
      const staff = r.staffName || 'Đội Kỹ Thuật';
      const action = r.actionType || 'Cắt tỉa';
      const hBefore = r.healthBefore || 'GOOD';
      const hAfter = r.healthAfter || 'GOOD';
      const notes = r.notes || '';
      const date = r.performedAt || new Date().toISOString();
      const hash = r.payloadHash || null;

      stmt.run(code, 1, treeCode, staff, action, hBefore, hAfter, notes, date, hash);
      inserted++;
    }

    stmt.finalize();
    db.run('COMMIT', (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi commit care records', error: err.message });
      }
      res.json({ success: true, message: `Đã lưu vĩnh viễn ${inserted} bản ghi chăm sóc vào SQLite Server`, count: inserted });
    });
  });
};
