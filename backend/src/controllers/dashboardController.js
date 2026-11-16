const db = require('../config/db');

// Helper tiện ích chuyển truy vấn sqlite3 sang Promise
const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

/**
 * Lấy toàn bộ số liệu thống kê tổng hợp phục vụ Bento Dashboard (Figma A04)
 * Endpoint: GET /api/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Thống kê tổng số cây và số lượng loài cây
    const treeOverview = await queryGet(`
      SELECT 
        COUNT(*) AS total_trees,
        COUNT(DISTINCT species) AS total_species
      FROM trees
    `);

    // 2. Phân loại tình trạng sức khỏe cây xanh
    const healthRows = await queryAll(`
      SELECT health_status, COUNT(*) AS count
      FROM trees
      GROUP BY health_status
    `);

    const healthDistribution = {
      'Tốt': 0,
      'Bình thường': 0,
      'Cần chăm sóc': 0,
      'Sâu bệnh': 0,
      'Nguy hiểm': 0
    };
    healthRows.forEach(row => {
      if (row.health_status) {
        healthDistribution[row.health_status] = row.count;
      }
    });

    // 3. Thống kê sự cố (theo trạng thái & mức độ nghiêm trọng)
    const incidentStatusRows = await queryAll(`
      SELECT status, COUNT(*) AS count
      FROM incidents
      GROUP BY status
    `);

    const incidentSeverityRows = await queryAll(`
      SELECT severity, COUNT(*) AS count
      FROM incidents
      GROUP BY severity
    `);

    const incidentsSummary = {
      total: 0,
      pending: 0,      // Chờ xử lý
      in_progress: 0,  // Đang xử lý
      resolved: 0,     // Đã hoàn thành
      rejected: 0,     // Từ chối
      by_severity: {
        'Khẩn cấp': 0,
        'Cao': 0,
        'Trung bình': 0,
        'Thấp': 0
      }
    };

    incidentStatusRows.forEach(row => {
      incidentsSummary.total += row.count;
      if (row.status === 'Chờ xử lý') incidentsSummary.pending = row.count;
      else if (row.status === 'Đang xử lý') incidentsSummary.in_progress = row.count;
      else if (row.status === 'Đã hoàn thành') incidentsSummary.resolved = row.count;
      else if (row.status === 'Từ chối') incidentsSummary.rejected = row.count;
    });

    incidentSeverityRows.forEach(row => {
      if (incidentsSummary.by_severity[row.severity] !== undefined) {
        incidentsSummary.by_severity[row.severity] = row.count;
      }
    });

    // 4. Thống kê hoạt động chăm sóc / bảo dưỡng thực địa
    const careOverview = await queryGet(`
      SELECT 
        COUNT(*) AS total_cares,
        SUM(CASE 
          WHEN strftime('%Y-%m', action_date) = strftime('%Y-%m', 'now') 
          THEN 1 ELSE 0 
        END) AS cares_this_month
      FROM care_records
    `);

    const careActionRows = await queryAll(`
      SELECT action_type, COUNT(*) AS count
      FROM care_records
      GROUP BY action_type
    `);

    const careByAction = {
      'Cắt tỉa': 0,
      'Tưới nước': 0,
      'Bón phân': 0,
      'Trị sâu bệnh': 0,
      'Gia cố cọc': 0
    };
    careActionRows.forEach(row => {
      if (careByAction[row.action_type] !== undefined) {
        careByAction[row.action_type] = row.count;
      }
    });

    // 5. Lấy danh sách 5 sự cố mới nhất cho Activity Feed
    const recentIncidents = await queryAll(`
      SELECT 
        incidents.id,
        incidents.description,
        incidents.severity,
        incidents.status,
        incidents.reported_at,
        trees.tree_code,
        trees.species,
        trees.location_name
      FROM incidents
      LEFT JOIN trees ON incidents.tree_id = trees.id
      ORDER BY incidents.id DESC
      LIMIT 5
    `);

    // 6. Lấy 5 hoạt động chăm sóc gần nhất
    const recentCares = await queryAll(`
      SELECT 
        care_records.id,
        care_records.caretaker_name,
        care_records.action_type,
        care_records.notes,
        care_records.action_date,
        trees.tree_code,
        trees.species
      FROM care_records
      LEFT JOIN trees ON care_records.tree_id = trees.id
      ORDER BY care_records.id DESC
      LIMIT 5
    `);

    // Phản hồi cấu trúc chuẩn phục vụ các Bento Cards A04
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        trees: {
          total: treeOverview ? treeOverview.total_trees : 0,
          species_count: treeOverview ? treeOverview.total_species : 0,
          health_distribution: healthDistribution
        },
        incidents: {
          total: incidentsSummary.total,
          pending: incidentsSummary.pending,
          in_progress: incidentsSummary.in_progress,
          resolved: incidentsSummary.resolved,
          rejected: incidentsSummary.rejected,
          resolution_rate_percent: incidentsSummary.total > 0 
            ? Number(((incidentsSummary.resolved / incidentsSummary.total) * 100).toFixed(1)) 
            : 0,
          by_severity: incidentsSummary.by_severity
        },
        care_records: {
          total: careOverview ? careOverview.total_cares : 0,
          this_month: careOverview ? (careOverview.cares_this_month || 0) : 0,
          by_action: careByAction
        },
        recent_activity: {
          incidents: recentIncidents,
          care_records: recentCares
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tổng hợp số liệu Dashboard Admin',
      error: error.message
    });
  }
};

/**
 * Lấy số liệu Telemetry chăm sóc & bảo dưỡng thực địa 7 ngày gần nhất từ SQLite
 * Endpoint: GET /api/dashboard/maintenance-telemetry
 */
exports.getMaintenanceTelemetry = async (req, res) => {
  try {
    // 1. Xác định mốc ngày cuối cùng có dữ liệu hoặc hôm nay
    const latestDateRow = await queryGet(`
      SELECT MAX(SUBSTR(COALESCE(action_date, created_at), 1, 10)) as max_d 
      FROM care_records
    `);
    const endDateStr = latestDateRow?.max_d || '2026-11-15';
    const endDate = new Date(endDateStr + 'T00:00:00Z');

    // Tạo danh sách 7 ngày liên tiếp lùi về trước
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const fullDayLabels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate.getTime() - i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const dayIdx = d.getUTCDay();
      dates.push({
        isoDate: iso,
        day: dayNames[dayIdx],
        label: fullDayLabels[dayIdx],
        dateStr: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
      });
    }

    // 2. Truy vấn SQLite cho từng ngày
    const timeline = [];
    let weeklyTotal = 0;
    let totalWatering = 0;
    let totalPruning = 0;
    let totalFertilizing = 0;
    let totalTreatment = 0;

    for (const d of dates) {
      const rows = await queryAll(`
        SELECT action_type, COUNT(*) as c
        FROM care_records
        WHERE SUBSTR(COALESCE(action_date, created_at), 1, 10) = ?
        GROUP BY action_type
      `, [d.isoDate]);

      let watering = 0;
      let pruning = 0;
      let fertilizing = 0;
      let treatment = 0;

      rows.forEach(r => {
        const t = (r.action_type || '').toLowerCase();
        if (t.includes('tưới') || t.includes('water')) watering += r.c;
        else if (t.includes('cắt') || t.includes('tỉa') || t.includes('prun')) pruning += r.c;
        else if (t.includes('bón') || t.includes('fertil')) fertilizing += r.c;
        else treatment += r.c;
      });

      const dayCount = watering + pruning + fertilizing + treatment;
      weeklyTotal += dayCount;
      totalWatering += watering;
      totalPruning += pruning;
      totalFertilizing += fertilizing;
      totalTreatment += treatment;

      // Tìm tuyến đường có nhiều lượt thực hiện nhất trong ngày
      const streetRow = await queryGet(`
        SELECT t.location_name, COUNT(*) as c
        FROM care_records cr
        JOIN trees t ON cr.tree_id = t.id
        WHERE SUBSTR(COALESCE(cr.action_date, cr.created_at), 1, 10) = ?
        GROUP BY t.location_name
        ORDER BY c DESC LIMIT 1
      `, [d.isoDate]);

      timeline.push({
        date: d.isoDate,
        day: d.day,
        label: d.label,
        dateStr: d.dateStr,
        count: dayCount,
        watering,
        pruning,
        fertilizing,
        treatment,
        mainStreet: streetRow?.location_name || 'Khu vực Trung tâm Quận Ninh Kiều'
      });
    }

    // 3. Tính đỉnh điểm tuần (Peak Day)
    const peakDay = timeline.reduce((max, curr) => (curr.count > max.count ? curr : max), timeline[0]);

    // 4. Phân bổ phần trăm nghiệp vụ
    const totalOps = Math.max(1, weeklyTotal);
    const wateringPct = Number(((totalWatering / totalOps) * 100).toFixed(1));
    const pruningPct = Number(((totalPruning / totalOps) * 100).toFixed(1));
    const fertilizingPct = Number(((totalFertilizing / totalOps) * 100).toFixed(1));
    const treatmentPct = Math.max(0, Number((100 - (wateringPct + pruningPct + fertilizingPct)).toFixed(1)));

    // 5. Thống kê tỷ lệ hoàn thành thực tế từ các lệnh công tác
    const woStats = await queryGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
      FROM work_orders
      WHERE status NOT IN ('CANCELLED', 'DRAFT')
    `);
    const totalWos = woStats?.total || 1;
    const completedWos = woStats?.completed || 0;
    const completionRate = Number(((completedWos / totalWos) * 100).toFixed(1));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        timeline,
        totalWeeklyCare: weeklyTotal,
        averageDailyCare: Number((weeklyTotal / 7).toFixed(1)),
        peakDay: {
          day: peakDay.day,
          label: peakDay.label,
          date: peakDay.date,
          count: peakDay.count,
          mainStreet: peakDay.mainStreet
        },
        actionDistribution: {
          watering: { count: totalWatering, percent: wateringPct },
          pruning: { count: totalPruning, percent: pruningPct },
          fertilizing: { count: totalFertilizing, percent: fertilizingPct },
          treatment: { count: totalTreatment, percent: treatmentPct }
        },
        completionRate,
        slaStatus: completionRate >= 90 ? 'Đạt chuẩn SLA vận hành (Không tồn đọng)' : 'Đang xử lý theo tiến độ SLA'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tổng hợp số liệu Telemetry bảo dưỡng',
      error: error.message
    });
  }
};

