const QRCode = require('qrcode');
const Tree = require('../models/Tree');
const db = require('../config/db');
const hashService = require('../services/hashService');
const blockchainClient = require('../services/blockchainClient');

/**
 * 1. Lấy danh sách cây xanh (Hỗ trợ phân trang, lấy toàn bộ all=true và bộ lọc)
 * Endpoint: GET /api/trees?species=...&health_status=...&page=1&limit=50&all=true
 */
exports.getAllTrees = (req, res) => {
  const { species, health_status, page = 1, limit = 50, all } = req.query;
  const isAll = all === 'true' || all === '1';
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = isAll ? 20000 : Math.max(1, Math.min(10000, parseInt(limit) || 50));
  const offset = isAll ? 0 : (pageNum - 1) * limitNum;

  Tree.getAll({ species, health_status, limit: limitNum, offset }, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn cơ sở dữ liệu cây xanh',
        error: err.message
      });
    }

    res.json({
      success: true,
      count: rows.length,
      page: pageNum,
      limit: limitNum,
      filters: {
        species: species || null,
        health_status: health_status || null
      },
      data: rows
    });
  });
};

/**
 * 2. Lấy chi tiết một cây theo ID số hoặc mã định danh tree_code (VD: TREE-001)
 * Endpoint: GET /api/trees/:id
 */
exports.getTreeById = (req, res) => {
  const { id } = req.params;

  const handleResult = (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn thông tin cây',
        error: err.message
      });
    }
    if (!row) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thông tin cây với định danh: ${id}`
      });
    }
    res.json({
      success: true,
      data: row
    });
  };

  // Nếu là số, ưu tiên tìm theo ID; nếu không thấy hoặc là chuỗi mã, tìm theo tree_code
  if (!isNaN(id)) {
    Tree.getById(id, (err, row) => {
      if (err) return handleResult(err);
      if (row) return res.json({ success: true, data: row });
      Tree.getByCode(id, handleResult);
    });
  } else {
    Tree.getByCode(id, handleResult);
  }
};

/**
 * 3. Tìm kiếm cây xanh theo vị trí xung quanh (GIS Radius Search)
 * Endpoint: GET /api/trees/nearby?lat=10.7758&lng=106.6912&radius=3
 */
exports.getNearbyTrees = (req, res) => {
  const { lat, lng, radius } = req.query;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp tọa độ trung tâm lat và lng (Ví dụ: ?lat=10.7758&lng=106.6912&radius=5)'
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusKm = parseFloat(radius) || 5;

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Tọa độ lat và lng phải là số thực hợp lệ'
    });
  }

  Tree.getNearby(latitude, longitude, radiusKm, (err, trees) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn cây xanh theo định vị GIS',
        error: err.message
      });
    }

    res.json({
      success: true,
      center: {
        latitude,
        longitude,
        radius_km: radiusKm
      },
      count: trees.length,
      data: trees
    });
  });
};

/**
 * 4. Thêm mới cây xanh, tự sinh mã QR và tự động neo Blockchain (THUAN-03 & Roadmap Ngày 5-6)
 * Endpoint: POST /api/trees
 */
exports.createTree = async (req, res) => {
  try {
    const {
      tree_code,
      tree_type_id,
      species,
      location_name,
      address,
      latitude,
      longitude,
      planted_date,
      height_meter,
      diameter_cm,
      health_status,
      status,
      image_url
    } = req.body;

    const actualCode = (tree_code || `TREE-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
    const actualSpecies = (species || 'Cây Đô Thị').trim();
    const actualLocation = (location_name || 'Khu đô thị trung tâm').trim();
    const actualPlantedDate = planted_date || new Date().toISOString().split('T')[0];
    const actualLat = parseFloat(latitude) || 0;
    const actualLng = parseFloat(longitude) || 0;

    // 1. Tự sinh nội dung QR chuẩn định dạng JSON theo đặc tả THUAN-03
    const qrPayload = {
      app: 'UrbanTree',
      code: actualCode,
      verifyUrl: `https://urbantree.hcm.gov.vn/verify/${actualCode}`
    };

    // 2. Chuyển thành DataURL (Base64 PNG) chuẩn { errorCorrectionLevel: 'H', width: 400 }
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'H',
      width: 400
    });

    // 3. Tính toán mã băm SHA-256 chuẩn Master Spec v2 (Zero Mismatch)
    const treeProfileData = {
      tree_code: actualCode,
      species: actualSpecies,
      location_name: actualLocation,
      latitude: actualLat,
      longitude: actualLng,
      planted_date: actualPlantedDate
    };
    const dataHash = hashService.hashTreeProfile(treeProfileData);

    // 4. Lưu bản ghi cây xanh vào SQLite
    Tree.create(
      {
        tree_code: actualCode,
        tree_type_id: tree_type_id || null,
        species: actualSpecies,
        location_name: actualLocation,
        address: address || actualLocation,
        latitude: actualLat,
        longitude: actualLng,
        planted_date: actualPlantedDate,
        height_meter: height_meter || null,
        diameter_cm: diameter_cm || null,
        health_status: health_status || 'Tốt',
        status: status || 'ACTIVE',
        qr_code_url: qrCodeUrl,
        image_url: image_url || null,
        data_hash: dataHash
      },
      async (err, newTree) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi thêm cây vào database (có thể mã cây đã tồn tại hoặc vi phạm CHECK constraint)',
            error: err.message
          });
        }

        // 5. Tự động gọi sang Cổng Blockchain để neo mã băm SHA-256 (Nhiệm vụ 3 trong bàn giao)
        let blockchainResult = null;
        try {
          const anchorResult = await blockchainClient.anchor(actualCode, 'TREE_PROFILE', dataHash);
          blockchainResult = {
            anchored: true,
            status: 'CONFIRMED',
            txHash: anchorResult.txHash,
            blockNumber: anchorResult.blockNumber,
            gasUsed: anchorResult.gasUsed,
            recorder: anchorResult.recorder
          };

          // Lưu vết vào bảng kiểm toán blockchain_audits
          db.run(
            `INSERT INTO blockchain_audits (record_type, record_id, data_hash, tx_hash, block_number, recorder_address, status, confirmed_at)
             VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)`,
            ['TREE_PROFILE', actualCode, dataHash, anchorResult.txHash, anchorResult.blockNumber, anchorResult.recorder]
          );
        } catch (bcErr) {
          // Xử lý mềm nếu Blockchain node chưa bật hoặc đã neo trước đó
          blockchainResult = {
            anchored: false,
            status: 'PENDING',
            message: 'Không thể kết nối EVM hoặc bản ghi đã neo: ' + bcErr.message
          };

          db.run(
            `INSERT INTO blockchain_audits (record_type, record_id, data_hash, status, last_error)
             VALUES (?, ?, ?, 'PENDING', ?)`,
            ['TREE_PROFILE', actualCode, dataHash, bcErr.message]
          );
        }

        res.status(201).json({
          success: true,
          message: 'Thêm mới cây xanh, tự sinh mã QR và neo Blockchain thành công',
          data: {
            ...newTree,
            data_hash: dataHash
          },
          blockchain: blockchainResult
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi tạo cây xanh và sinh mã QR',
      error: error.message
    });
  }
};

/**
 * 4.1. Thêm hàng loạt cây xanh (Bulk Insert với SQLite Transaction hiệu năng cao)
 * Endpoint: POST /api/trees/bulk
 */
exports.createTreesBulk = (req, res) => {
  const { trees } = req.body;
  if (!Array.isArray(trees) || trees.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách cây rỗng' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO trees (
        tree_code, tree_type_id, species, location_name, address,
        latitude, longitude, planted_date, height_meter, diameter_cm,
        health_status, status, data_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const t of trees) {
      const code = t.publicCode || t.tree_code || `CT-${Date.now()}-${inserted}`;
      const species = t.displayName || t.species || 'Cây Xanh Đô Thị';
      const address = t.address || t.location_name || 'Ninh Kiều, Cần Thơ';
      const lat = parseFloat(t.latitude) || 10.034;
      const lng = parseFloat(t.longitude) || 105.787;
      const plantedDate = t.plantedAt || t.planted_date || '2023-01-01';
      const height = t.heightM || t.height_meter || 8;
      const diameter = t.diameterCm || t.diameter_cm || 25;
      const health = t.healthStatus === 'GOOD' ? 'Tốt' : t.healthStatus === 'CRITICAL' ? 'Nguy hiểm' : 'Tốt';

      stmt.run(
        code,
        1,
        species,
        address,
        address,
        lat,
        lng,
        plantedDate,
        height,
        diameter,
        health,
        'ACTIVE',
        t.payloadHash || null
      );
      inserted++;
    }

    stmt.finalize();
    db.run('COMMIT', (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi commit bulk insert', error: err.message });
      }
      res.json({ success: true, message: `Đã lưu vĩnh viễn ${inserted} cây vào SQLite Server`, count: inserted });
    });
  });
};

/**
 * 5. Xuất hình ảnh mã QR (Tuân thủ đặc tả THUAN-03)
 * Endpoint: GET /api/trees/:id/qr
 * Mặc định: Trả về trực tiếp buffer hình ảnh PNG để hiển thị hoặc in ấn nhãn thẻ nhôm đúc
 * Nếu thêm ?format=json hoặc ?format=base64: Trả về chuỗi base64 qua JSON
 */
exports.generateQrCode = (req, res) => {
  const { id } = req.params;

  const onTreeFound = async (err, tree) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn cây xanh',
        error: err.message
      });
    }

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy cây với định danh: ${id} để xuất mã QR`
      });
    }

    try {
      // Nội dung mã QR chuẩn hóa
      const qrPayload = {
        app: 'UrbanTree',
        code: tree.tree_code,
        verifyUrl: `https://urbantree.hcm.gov.vn/verify/${tree.tree_code}`
      };

      // Tự động đồng bộ cập nhật qr_code_url trong DB nếu cây chưa có
      if (!tree.qr_code_url) {
        const base64Url = await QRCode.toDataURL(JSON.stringify(qrPayload), {
          errorCorrectionLevel: 'H',
          width: 400
        });
        Tree.updateQrUrl(tree.id, base64Url, () => {});
      }

      // Trường hợp ứng dụng muốn nhận chuỗi Base64 qua JSON
      if (req.query.format === 'json' || req.query.format === 'base64') {
        const base64Url = tree.qr_code_url || (await QRCode.toDataURL(JSON.stringify(qrPayload), {
          errorCorrectionLevel: 'H',
          width: 400
        }));

        return res.json({
          success: true,
          tree_code: tree.tree_code,
          species: tree.species,
          qr_code_url: base64Url
        });
      }

      // Mặc định: Trả về trực tiếp binary buffer PNG chuẩn công nghiệp
      const qrBuffer = await QRCode.toBuffer(JSON.stringify(qrPayload), {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 400,
        margin: 2
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="qr-${tree.tree_code}.png"`);
      res.send(qrBuffer);
    } catch (qrErr) {
      res.status(500).json({
        success: false,
        message: 'Lỗi trong quá trình tạo file ảnh mã QR',
        error: qrErr.message
      });
    }
  };

  if (!isNaN(id)) {
    Tree.getById(id, (err, row) => {
      if (err) return onTreeFound(err);
      if (row) return onTreeFound(null, row);
      Tree.getByCode(id, onTreeFound);
    });
  } else {
    Tree.getByCode(id, onTreeFound);
  }
};

/**
 * 6. Cập nhật thông tin cây xanh
 * Endpoint: PUT /api/trees/:id
 */
exports.updateTree = (req, res) => {
  const { id } = req.params;

  Tree.update(id, req.body, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi cập nhật cây xanh',
        error: err.message
      });
    }

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cây cần cập nhật'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin cây xanh thành công'
    });
  });
};

/**
 * 7. Giải tỏa / Đốn hạ cây (Soft Delete - UT-002)
 * Endpoint: DELETE /api/trees/:id
 */
exports.deleteTree = (req, res) => {
  const { id } = req.params;
  const { permitNumber, fellingReason, approvedByOfficer } = req.body || {};

  const onDone = (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi cập nhật hồ sơ giải tỏa / đốn hạ cây',
        error: err.message
      });
    }

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cây cần giải tỏa'
      });
    }

    res.json({
      success: true,
      message: 'Cây đã được chuyển sang trạng thái REMOVED (Lưu trữ hồ sơ đốn hạ, bảo toàn chứng cứ số)'
    });
  };

  if (permitNumber || fellingReason) {
    Tree.archiveFelledTree(id, { permitNumber, fellingReason, approvedByOfficer }, onDone);
  } else {
    Tree.delete(id, onDone);
  }
};
