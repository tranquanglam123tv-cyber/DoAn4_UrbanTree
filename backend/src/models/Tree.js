const db = require('../config/db');

const Tree = {
  /**
   * Lấy danh sách cây xanh có hỗ trợ phân trang và bộ lọc linh hoạt
   * @param {Object} [filters] { species, health_status, limit, offset }
   * @param {Function} callback (err, rows)
   */
  getAll: (filters, callback) => {
    if (typeof filters === 'function') {
      callback = filters;
      filters = {};
    }
    filters = filters || {};

    let query = 'SELECT * FROM trees WHERE 1=1';
    const params = [];

    if (filters.species) {
      query += ' AND species LIKE ?';
      params.push(`%${filters.species}%`);
    }

    if (filters.health_status) {
      query += ' AND health_status = ?';
      params.push(filters.health_status);
    }

    query += ' ORDER BY id DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    db.all(query, params, callback);
  },

  /**
   * Tìm cây theo ID số
   * @param {number|string} id 
   * @param {Function} callback (err, row)
   */
  getById: (id, callback) => {
    const query = 'SELECT * FROM trees WHERE id = ?';
    db.get(query, [id], callback);
  },

  /**
   * Tìm cây theo mã QR tree_code (VD: TREE-001)
   * @param {string} tree_code 
   * @param {Function} callback (err, row)
   */
  getByCode: (tree_code, callback) => {
    const query = 'SELECT * FROM trees WHERE tree_code = ?';
    db.get(query, [tree_code], callback);
  },

  /**
   * Chèn bản ghi cây mới (chuẩn hóa theo sơ đồ UrbanTree_ERD.puml)
   * @param {Object} data 
   * @param {Function} callback (err, result)
   */
  create: (data, callback) => {
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
      qr_code_url,
      image_url,
      data_hash
    } = data;

    const query = `
      INSERT INTO trees (
        tree_code, tree_type_id, species, location_name, address,
        latitude, longitude, planted_date, height_meter, diameter_cm,
        health_status, status, qr_code_url, image_url, data_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
        tree_code,
        tree_type_id || null,
        species,
        location_name,
        address || location_name,
        latitude || 0,
        longitude || 0,
        planted_date || new Date().toISOString().split('T')[0],
        height_meter || null,
        diameter_cm || null,
        health_status || 'Tốt',
        status || 'ACTIVE',
        qr_code_url || null,
        image_url || null,
        data_hash || null
      ],
      function (err) {
        if (err) return callback(err);
        callback(null, { id: this ? this.lastID : null, ...data });
      }
    );
  },

  /**
   * Cập nhật thông tin sinh thái của cây
   * @param {number|string} id 
   * @param {Object} data 
   * @param {Function} callback (err, result)
   */
  update: (id, data, callback) => {
    const {
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
      qr_code_url,
      image_url,
      data_hash
    } = data;

    const query = `
      UPDATE trees 
      SET tree_type_id = COALESCE(?, tree_type_id),
          species = COALESCE(?, species),
          location_name = COALESCE(?, location_name),
          address = COALESCE(?, address),
          latitude = COALESCE(?, latitude),
          longitude = COALESCE(?, longitude),
          planted_date = COALESCE(?, planted_date),
          height_meter = COALESCE(?, height_meter),
          diameter_cm = COALESCE(?, diameter_cm),
          health_status = COALESCE(?, health_status),
          status = COALESCE(?, status),
          qr_code_url = COALESCE(?, qr_code_url),
          image_url = COALESCE(?, image_url),
          data_hash = COALESCE(?, data_hash),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(
      query,
      [
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
        qr_code_url,
        image_url,
        data_hash,
        id
      ],
      function (err) {
        if (err) return callback(err);
        callback(null, { changes: this ? this.changes : 0 });
      }
    );
  },

  /**
   * Cập nhật mã QR URL cho cây
   * @param {number|string} id 
   * @param {string} qr_code_url 
   * @param {Function} callback 
   */
  updateQrUrl: (id, qr_code_url, callback) => {
    const query = `UPDATE trees SET qr_code_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [qr_code_url, id], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this ? this.changes : 0 });
    });
  },

  /**
   * Cập nhật mã băm SHA-256 sau khi neo chuỗi Smart Contract
   * @param {number|string} id 
   * @param {string} data_hash 
   * @param {Function} callback 
   */
  updateHash: (id, data_hash, callback) => {
    const query = `UPDATE trees SET data_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [data_hash, id], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this ? this.changes : 0 });
    });
  },

  /**
   * Giải tỏa / Đốn hạ cây (Soft Delete - UT-002)
   * Tuyệt đối không xóa vật lý khỏi database để bảo vệ chứng cứ Blockchain & Lịch sử tài sản công
   * @param {number|string} id 
   * @param {Function} callback 
   */
  delete: (id, callback) => {
    const query = "UPDATE trees SET status = 'REMOVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(query, [id], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this ? this.changes : 0 });
    });
  },

  /**
   * Lưu hồ sơ đốn hạ có phê duyệt văn bản (UT-002 Felling Permit Workflow)
   */
  archiveFelledTree: (id, fellingData, callback) => {
    const { permitNumber, fellingReason, approvedByOfficer } = fellingData;
    const query = `
      UPDATE trees
      SET status = 'REMOVED',
          felling_permit_no = ?,
          felling_reason = ?,
          approved_by = ?,
          felled_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.run(query, [permitNumber || 'GP-KHAN-CAP', fellingReason || 'Mục thân nguy hiểm mùa bão', approvedByOfficer || 'Lãnh đạo Ban QLĐT', id], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this ? this.changes : 0 });
    });
  },

  /**
   * Lọc danh sách cây trong phạm vi bán kính (phục vụ bản đồ GIS A05)
   * Sử dụng thuật toán Bounding Box sơ bộ và tính khoảng cách Haversine chuẩn xác
   * @param {number} lat Tọa độ vĩ độ tâm tìm kiếm
   * @param {number} lng Tọa độ kinh độ tâm tìm kiếm
   * @param {number} radiusKm Bán kính tìm kiếm (km)
   * @param {Function} callback (err, nearbyTrees)
   */
  getNearby: (lat, lng, radiusKm, callback) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = parseFloat(radiusKm) || 5;

    // Khoảng cách ước tính kinh/vĩ độ (1 độ vĩ ~ 111 km)
    const deltaLat = radius / 111.0;
    const deltaLng = radius / (111.0 * Math.cos((latitude * Math.PI) / 180));

    const minLat = latitude - deltaLat;
    const maxLat = latitude + deltaLat;
    const minLng = longitude - Math.abs(deltaLng);
    const maxLng = longitude + Math.abs(deltaLng);

    const query = `
      SELECT * FROM trees 
      WHERE latitude BETWEEN ? AND ? 
        AND longitude BETWEEN ? AND ?
    `;

    db.all(query, [minLat, maxLat, minLng, maxLng], (err, rows) => {
      if (err) return callback(err);

      // Công thức Haversine tính khoảng cách thực tế giữa 2 tọa độ GPS
      const R = 6371; // Bán kính trái đất tính bằng km
      const nearbyTrees = (rows || [])
        .map((tree) => {
          const tLat = tree.latitude;
          const tLng = tree.longitude;
          const dLat = ((tLat - latitude) * Math.PI) / 180;
          const dLng = ((tLng - longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((latitude * Math.PI) / 180) *
              Math.cos((tLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceKm = R * c;

          return {
            ...tree,
            distance_km: Number(distanceKm.toFixed(3))
          };
        })
        .filter((tree) => tree.distance_km <= radius)
        .sort((a, b) => a.distance_km - b.distance_km);

      callback(null, nearbyTrees);
    });
  }
};

module.exports = Tree;
