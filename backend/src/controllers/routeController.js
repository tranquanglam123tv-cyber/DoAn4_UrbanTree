const db = require('../config/db');

/**
 * 🛣️ ROUTE & ZONE CONTROLLER (Wave 2.2 Data Alignment)
 * Cung cấp master data địa bàn vận hành và các tuyến đường từ SQLite Source of Truth
 */

exports.getAllRoutes = (req, res) => {
  const query = `
    SELECT 
      r.id,
      r.zone_id AS zoneId,
      r.code,
      r.name,
      r.description,
      r.start_point AS startPoint,
      r.end_point AS endPoint,
      r.total_trees_count AS totalTreesCount,
      r.status,
      z.name AS zoneName,
      z.code AS zoneCode
    FROM routes r
    LEFT JOIN operational_zones z ON r.zone_id = z.id
    ORDER BY r.code ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn danh mục tuyến đường',
        error: err.message
      });
    }

    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  });
};

exports.getAllOperationalZones = (req, res) => {
  const query = `
    SELECT 
      id,
      code,
      name,
      district,
      description,
      boundary_geometry AS boundaryGeometry,
      status
    FROM operational_zones
    ORDER BY code ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn danh mục địa bàn vận hành',
        error: err.message
      });
    }

    res.json({
      success: true,
      total: rows.length,
      data: rows
    });
  });
};

