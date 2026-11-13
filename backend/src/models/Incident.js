const db = require('../config/db');

const Incident = {
  /**
   * Lấy danh sách sự cố có hỗ trợ bộ lọc và phân trang
   * @param {Object} [filters] { status, severity, tree_id, limit, offset }
   * @param {Function} callback (err, rows)
   */
  getAll: (filters, callback) => {
    if (typeof filters === 'function') {
      callback = filters;
      filters = {};
    }
    filters = filters || {};

    let query = `
      SELECT incidents.*, trees.tree_code, trees.species, trees.location_name 
      FROM incidents 
      LEFT JOIN trees ON incidents.tree_id = trees.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND incidents.status = ?';
      params.push(filters.status);
    }

    if (filters.severity) {
      query += ' AND incidents.severity = ?';
      params.push(filters.severity);
    }

    if (filters.tree_id) {
      query += ' AND incidents.tree_id = ?';
      params.push(parseInt(filters.tree_id));
    }

    query += ' ORDER BY incidents.id DESC';

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
   * Tìm sự cố theo ID
   * @param {number|string} id 
   * @param {Function} callback (err, row)
   */
  getById: (id, callback) => {
    const query = `
      SELECT incidents.*, trees.tree_code, trees.species, trees.location_name 
      FROM incidents 
      LEFT JOIN trees ON incidents.tree_id = trees.id 
      WHERE incidents.id = ?
    `;
    db.get(query, [id], callback);
  },

  /**
   * Lấy danh sách sự cố theo tree_id
   * @param {number|string} tree_id 
   * @param {Function} callback (err, rows)
   */
  getByTreeId: (tree_id, callback) => {
    const query = `
      SELECT incidents.*, trees.tree_code, trees.species, trees.location_name 
      FROM incidents 
      LEFT JOIN trees ON incidents.tree_id = trees.id 
      WHERE incidents.tree_id = ? 
      ORDER BY incidents.id DESC
    `;
    db.all(query, [tree_id], callback);
  },

  /**
   * Tạo báo cáo sự cố mới từ người dân / nhân viên
   * @param {Object} data { tree_id, reporter_name, reporter_phone, description, image_url, severity, status }
   * @param {Function} callback (err, newIncident)
   */
  create: (data, callback) => {
    const {
      tree_id,
      reporter_name,
      reporter_phone,
      description,
      image_url,
      severity,
      status,
      latitude,
      longitude,
      address
    } = data;

    const tracking_code = `INC-${Math.floor(10000 + Math.random() * 90000)}`;

    const query = `
      INSERT INTO incidents (tree_id, reporter_name, reporter_phone, description, image_url, severity, status, latitude, longitude, address, tracking_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
        tree_id || null,
        reporter_name,
        reporter_phone,
        description,
        image_url || '',
        severity || 'Trung bình',
        status || 'Chờ xử lý',
        latitude || null,
        longitude || null,
        address || null,
        tracking_code
      ],
      function (err) {
        if (err) return callback(err);
        callback(null, {
          id: this ? this.lastID : null,
          tracking_code,
          ...data
        });
      }
    );
  },

  /**
   * Cập nhật trạng thái sự cố và mốc thời gian hoàn thành (phục vụ Blockchain anchor)
   * @param {number|string} id 
   * @param {string} status 'Chờ xử lý' | 'Đang xử lý' | 'Đã hoàn thành' | 'Từ chối'
   * @param {string} [resolved_at] 
   * @param {Function} callback (err, result)
   */
  updateStatus: (id, status, resolved_at, callback) => {
    if (typeof resolved_at === 'function') {
      callback = resolved_at;
      resolved_at = null;
    }

    let resolvedTimestamp = resolved_at;
    if (!resolvedTimestamp && status === 'Đã hoàn thành') {
      resolvedTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    const query = `
      UPDATE incidents 
      SET status = ?, 
          resolved_at = COALESCE(?, resolved_at)
      WHERE id = ?
    `;

    db.run(query, [status, resolvedTimestamp, id], function (err) {
      if (err) return callback(err);
      callback(null, {
        changes: this ? this.changes : 0,
        status,
        resolved_at: resolvedTimestamp
      });
    });
  },

  /**
   * Xóa sự cố khỏi hệ thống
   * @param {number|string} id 
   * @param {Function} callback 
   */
  delete: (id, callback) => {
    const query = 'DELETE FROM incidents WHERE id = ?';
    db.run(query, [id], function (err) {
      if (err) return callback(err);
      callback(null, { changes: this ? this.changes : 0 });
    });
  }
};

module.exports = Incident;
