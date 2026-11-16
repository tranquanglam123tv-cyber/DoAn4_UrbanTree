const Incident = require('../models/Incident');
const db = require('../config/db');
const sseService = require('../services/sseService');
const notificationService = require('../services/notificationService');

/**
 * 🔒 BẢO VỆ THÔNG TIN CÁ NHÂN (UT-004 PII PROTECTION)
 * Che giấu số điện thoại và họ tên người dân trước các vai trò không phải ADMIN/DISPATCHER
 */
function maskPhoneNumber(phone) {
  if (!phone) return '';
  const clean = String(phone).trim();
  if (clean.length < 7) return '***';
  return clean.slice(0, 4) + '***' + clean.slice(-3);
}

function maskReporterName(name) {
  if (!name) return 'Công dân đô thị';
  const parts = String(name).trim().split(' ');
  if (parts.length === 1) return parts[0][0] + '***';
  return parts[0] + ' *** ' + parts[parts.length - 1];
}

function sanitizeIncidentForRole(incident, callerRole) {
  if (!incident) return incident;
  if (callerRole === 'ADMIN' || callerRole === 'DISPATCHER') {
    return incident; // Quyền quản trị và điều phối viên xem đầy đủ để tác chiến
  }
  return {
    ...incident,
    reporter_phone: maskPhoneNumber(incident.reporter_phone),
    reporter_name: maskReporterName(incident.reporter_name),
    reporter_email: incident.reporter_email ? '***@' + (incident.reporter_email.split('@')[1] || 'email.com') : null
  };
}

/**
 * 📍 TÍNH KHOẢNG CÁCH HAVERSINE GIỮA 2 TỌA ĐỘ GPS (km) (UT-005)
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 1. Lấy danh sách sự cố (Hỗ trợ phân trang và bộ lọc: status, severity, tree_id)
 * Endpoint: GET /api/incidents?status=Chờ xử lý&severity=Khẩn cấp&page=1&limit=50
 */
exports.getAllIncidents = (req, res) => {
  const { status, severity, tree_id, page = 1, limit = 50, all } = req.query;
  // 🔒 P0 SECURITY: Quyền xem PII CHỈ dựa trên JWT Token đã qua xác thực, TUYỆT ĐỐI không tin header client
  const callerRole = (req.user && req.user.role) ? String(req.user.role).toUpperCase() : 'CITIZEN';
  const isAll = all === 'true' || all === '1';
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = isAll ? 20000 : Math.max(1, Math.min(10000, parseInt(limit) || 50));
  const offset = isAll ? 0 : (pageNum - 1) * limitNum;

  Incident.getAll({ status, severity, tree_id, limit: limitNum, offset }, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn danh sách sự cố',
        error: err.message
      });
    }

    // 🔒 Áp dụng DTO che PII
    const sanitizedRows = rows.map((r) => sanitizeIncidentForRole(r, callerRole));

    res.json({
      success: true,
      count: sanitizedRows.length,
      page: pageNum,
      limit: limitNum,
      filters: {
        status: status || null,
        severity: severity || null,
        tree_id: tree_id ? parseInt(tree_id) : null
      },
      data: sanitizedRows
    });
  });
};

/**
 * 2. Lấy chi tiết một sự cố theo ID
 * Endpoint: GET /api/incidents/:id
 */
exports.getIncidentById = (req, res) => {
  const { id } = req.params;
  const callerRole = (req.user && req.user.role) ? String(req.user.role).toUpperCase() : 'CITIZEN';

  Incident.getById(id, (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn sự cố',
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy sự cố với ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: sanitizeIncidentForRole(row, callerRole)
    });
  });
};

/**
 * 3. Tiếp nhận báo cáo sự cố mới từ người dân / nhân viên
 * Có tích hợp Spatial-Temporal Deduplication (UT-005) & Anti-Spam (UT-006)
 * Endpoint: POST /api/incidents
 */
exports.reportIncident = (req, res) => {
  const {
    tree_id,
    reporter_name,
    reporter_phone,
    description,
    image_url,
    severity,
    latitude,
    longitude,
    address
  } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mô tả chi tiết về sự cố'
    });
  }

  if (!reporter_name || !reporter_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp họ tên người phản ánh'
    });
  }

  if (!reporter_phone || !reporter_phone.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp số điện thoại người phản ánh'
    });
  }

  const validSeverities = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
  const finalSeverity = severity && validSeverities.includes(severity) ? severity : 'Trung bình';
  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  // 📍 KIỂM TRA LỌC TRÙNG KHÔNG GIAN & THỜI GIAN (UT-005: 25 mét & 2 giờ)
  if (!isNaN(latNum) && !isNaN(lngNum)) {
    const twoHoursMs = 2 * 3600 * 1000;
    const nowTime = Date.now();
    const findOpenQuery = `
      SELECT id, tracking_code, latitude, longitude, description, duplicate_count, reported_at
      FROM incidents
      WHERE status IN ('Chờ xử lý', 'Đã tiếp nhận', 'Đang xử lý')
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY id DESC
    `;

    db.all(findOpenQuery, [], (err, openIncidents) => {
      if (!err && openIncidents && openIncidents.length > 0) {
        for (const openItem of openIncidents) {
          // Chuẩn hóa định dạng thời gian ISO-8601 UTC từ SQLite CURRENT_TIMESTAMP
          const timeRaw = String(openItem.reported_at || '').trim();
          let itemTime = 0;
          if (timeRaw) {
            const isoStr = timeRaw.replace(' ', 'T') + (timeRaw.endsWith('Z') ? '' : 'Z');
            itemTime = new Date(isoStr).getTime();
            if (isNaN(itemTime)) {
              itemTime = new Date(timeRaw).getTime() || 0;
            }
          }

          // Chỉ kiểm tra sự cố trong khung 2 giờ gần nhất (sử dụng Math.abs tránh lệch đồng hồ)
          if (Math.abs(nowTime - itemTime) > twoHoursMs) continue;

          const distKm = calculateHaversineDistanceKm(latNum, lngNum, openItem.latitude, openItem.longitude);
          const distMeters = distKm * 1000;

          // Nếu sự cố cách nhau dưới hoặc bằng 25 mét trong vòng 2 giờ -> GỘP VÀO MASTER INCIDENT
          if (distMeters <= 25) {
            // Tăng biến duplicate_count cho Master Ticket hiện có
            const updatedDuplicates = (openItem.duplicate_count || 0) + 1;
            return db.run(
              'UPDATE incidents SET duplicate_count = ? WHERE id = ?',
              [updatedDuplicates, openItem.id],
              (updateErr) => {
                if (updateErr) console.error('[Incident] Lỗi cập nhật duplicate_count:', updateErr.message);

                // Lưu phản ánh chi tiết vào bảng chuyên trách incident_duplicate_reports
                db.run(
                  `INSERT INTO incident_duplicate_reports (master_incident_id, reporter_name, reporter_phone, description, image_url, distance_meters)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    openItem.id,
                    reporter_name.trim(),
                    reporter_phone.trim(),
                    description.trim(),
                    image_url || '',
                    Math.round(distMeters * 10) / 10
                  ],
                  (insertErr) => {
                    if (insertErr) console.error('[Incident] Lỗi ghi incident_duplicate_reports:', insertErr.message);

                    // Ghi nhận lịch sử đính kèm phản ánh trùng vào incident_updates
                    db.run(
                      `INSERT INTO incident_updates (incident_id, old_status, new_status, notes, image_url)
                       VALUES (?, 'Đang xử lý', 'Đang xử lý', ?, ?)`,
                      [
                        openItem.id,
                        `[GỘP BÁO CÁO TRÙNG] Người dân ${reporter_name.trim()} (${maskPhoneNumber(reporter_phone)}) báo thêm: "${description.trim()}" (Khoảng cách ${Math.round(distMeters)}m)`,
                        image_url || ''
                      ],
                      () => {
                        // Trả về kết quả tham chiếu ĐÚNG Master Incident gốc, KHÔNG tạo ticket mới
                        return res.status(200).json({
                          success: true,
                          is_duplicate: true,
                          master_incident_id: openItem.id,
                          master_tracking_code: openItem.tracking_code || `#${openItem.id}`,
                          incident_id: openItem.id,
                          tracking_code: openItem.tracking_code || `#${openItem.id}`,
                          duplicate_count: updatedDuplicates,
                          distance_meters: Math.round(distMeters * 10) / 10,
                          message: `Đã tự động gộp phản ánh vào Sự Cố Gốc [${openItem.tracking_code || '#' + openItem.id}] đang được Đội cứu hộ xử lý tại khu vực này (Khoảng cách ${Math.round(distMeters)}m). Cảm ơn bạn!`
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        }
      }

      // Nếu không trùng, tạo Master Incident mới bình thường
      createMasterIncident();
    });
  } else {
    createMasterIncident();
  }

  function createMasterIncident() {
    Incident.create(
      {
        tree_id: tree_id ? parseInt(tree_id) : null,
        reporter_name: reporter_name.trim(),
        reporter_phone: reporter_phone.trim(),
        description: description.trim(),
        image_url: image_url || '',
        severity: finalSeverity,
        status: 'Chờ xử lý',
        latitude: !isNaN(latNum) ? latNum : null,
        longitude: !isNaN(lngNum) ? lngNum : null,
        address: address ? address.trim() : null
      },
      async (err, newIncident) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi lưu thông tin tiếp nhận sự cố',
            error: err.message
          });
        }

        // ⚡ SSE BROADCAST (PII MINIMIZED - Tuyệt đối không đưa SĐT/Họ tên thật vào payload)
        sseService.broadcast({
          eventType: 'incident.created',
          entityType: 'incident',
          entityId: String(newIncident.id),
          actor: { userId: 'citizen', role: 'CITIZEN' },
          targetRoles: ['ADMIN', 'DISPATCHER'],
          payload: {
            id: newIncident.id,
            trackingCode: newIncident.tracking_code,
            description: newIncident.description,
            severity: newIncident.severity,
            status: newIncident.status || 'Chờ xử lý',
            address: newIncident.address,
            latitude: newIncident.latitude,
            longitude: newIncident.longitude
          }
        });

        // 🔔 PERSISTENT NOTIFICATION (Wave 3.2: Lưu thông báo phản ánh mới cho Quản trị viên)
        let notif = null;
        try {
          notif = await notificationService.createNotification({
            targetRole: 'ADMIN',
            title: 'Phản ánh sự cố mới',
            message: `Tiếp nhận phản ánh sự cố [${newIncident.severity || 'Khẩn cấp'}] tại ${newIncident.address || 'khu vực công cộng'}.`,
            type: 'INCIDENT_NEW',
            severity: newIncident.severity === 'Khẩn cấp' ? 'CRITICAL' : 'WARNING',
            entityType: 'INCIDENT',
            entityId: String(newIncident.id),
            linkTab: 'incidents',
            linkId: String(newIncident.id),
          });
        } catch (notifErr) {
          console.warn('⚠️ Lỗi tạo notification sự cố:', notifErr.message);
        }

        if (notif) {
          sseService.broadcast({
            eventType: 'notification.pushed',
            entityType: 'notification',
            entityId: notif.id,
            actor: { userId: 'citizen', role: 'CITIZEN' },
            targetRoles: ['ADMIN', 'DISPATCHER'],
            payload: {
              id: notif.id,
              title: notif.title,
              message: notif.message,
              type: notif.type,
              severity: notif.severity,
              entityType: notif.entityType,
              entityId: notif.entityId,
              linkTab: notif.linkTab,
              linkId: notif.linkId,
              createdAt: notif.createdAt,
            }
          });
        }

        res.status(201).json({
          success: true,
          is_duplicate: false,
          message: 'Tiếp nhận phản ánh thành công. Đội cứu hộ đang điều phối.',
          incident_id: newIncident.id,
          data: sanitizeIncidentForRole(newIncident, 'CITIZEN')
        });
      }
    );
  }
};

/**
 * 4. Cập nhật trạng thái sự cố và mốc thời gian hoàn thành (phục vụ Blockchain anchor)
 * Endpoint: PATCH /api/incidents/:id/status
 */
exports.updateIncidentStatus = (req, res) => {
  const { id } = req.params;
  const { status, resolved_at } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp trạng thái mới cho sự cố'
    });
  }

  const STATUS_MAP = {
    'PENDING': 'Chờ xử lý',
    'IN_PROGRESS': 'Đang xử lý',
    'RESOLVED': 'Đã hoàn thành',
    'COMPLETED': 'Đã hoàn thành',
    'REJECTED': 'Từ chối',
    'Chờ xử lý': 'Chờ xử lý',
    'Đã tiếp nhận': 'Đang xử lý',
    'Đang xử lý': 'Đang xử lý',
    'Đã giải quyết': 'Đã hoàn thành',
    'Đã hoàn thành': 'Đã hoàn thành',
    'Từ chối': 'Từ chối'
  };

  const normalizedStatus = STATUS_MAP[status] || status;
  const validStatuses = ['Chờ xử lý', 'Đang xử lý', 'Đã hoàn thành', 'Từ chối'];
  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: `Trạng thái không hợp lệ. Chỉ chấp nhận một trong các giá trị: ${validStatuses.join(', ')} hoặc (PENDING, IN_PROGRESS, RESOLVED, REJECTED)`
    });
  }

  // 🔒 WAVE 3.3 INCIDENT STATE MACHINE TRANSITION GUARD
  Incident.getById(id, (getErr, currentIncident) => {
    if (getErr) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi truy vấn sự cố',
        error: getErr.message
      });
    }

    if (!currentIncident) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy sự cố với ID: ${id}`
      });
    }

    const currentStatus = currentIncident.status || 'Chờ xử lý';

    // 1. Idempotency: Không tạo side effect nếu trạng thái không đổi
    if (currentStatus === normalizedStatus) {
      return res.json({
        success: true,
        alreadyInStatus: true,
        message: `Sự cố #${id} hiện đã ở trạng thái "${normalizedStatus}"`,
        incident_id: parseInt(id),
        status: currentStatus,
        resolved_at: currentIncident.resolved_at
      });
    }

    // 2. Ma trận chuyển trạng thái hợp lệ
    const VALID_TRANSITIONS = {
      'Chờ xử lý': ['Đang xử lý', 'Từ chối'],
      'Đang xử lý': ['Đã hoàn thành'],
      'Đã hoàn thành': [], // Terminal
      'Từ chối': []        // Terminal
    };

    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Chuyển trạng thái không hợp lệ: Không thể chuyển sự cố từ "${currentStatus}" sang "${normalizedStatus}". Trạng thái cho phép: [${allowed.join(', ') || 'Không có - Trạng thái kết thúc'}]`
      });
    }

    Incident.updateStatus(id, normalizedStatus, resolved_at, async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi cập nhật trạng thái sự cố',
          error: err.message
        });
      }

      // Ghi lịch sử chuyển đổi trạng thái vào incident_updates
      db.run(
        `INSERT INTO incident_updates (incident_id, actor_id, old_status, new_status, notes) VALUES (?, ?, ?, ?, ?)`,
        [id, (req.user && req.user.id) ? req.user.id : null, currentStatus, normalizedStatus, `Chuyển trạng thái sự cố từ "${currentStatus}" sang "${normalizedStatus}"`],
        () => {}
      );

      // ⚡ SSE BROADCAST (Phát sự kiện cập nhật trạng thái sự cố)
      sseService.broadcast({
        eventType: 'incident.status_changed',
        entityType: 'incident',
        entityId: String(id),
        actor: { userId: (req.user && req.user.id) ? String(req.user.id) : 'staff', role: req.user ? req.user.role : 'STAFF' },
        targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
        payload: {
          id: parseInt(id),
          status: normalizedStatus,
          previousStatus: currentStatus,
          resolvedAt: result.resolved_at
        }
      });

      // 🔔 PERSISTENT NOTIFICATION (Wave 3.2: Lưu thông báo cập nhật tiến độ sự cố)
      let notif = null;
      try {
        notif = await notificationService.createNotification({
          targetRole: 'STAFF',
          title: 'Cập nhật trạng thái sự cố',
          message: `Sự cố #${id} đã được chuyển sang trạng thái: "${normalizedStatus}".`,
          type: 'INCIDENT_RESOLVED',
          severity: normalizedStatus === 'Đã hoàn thành' ? 'SUCCESS' : 'INFO',
          entityType: 'INCIDENT',
          entityId: String(id),
          linkTab: 'incidents',
          linkId: String(id),
        });
      } catch (notifErr) {
        console.warn('⚠️ Lỗi tạo notification sự cố update:', notifErr.message);
      }

      if (notif) {
        sseService.broadcast({
          eventType: 'notification.pushed',
          entityType: 'notification',
          entityId: notif.id,
          actor: { userId: (req.user && req.user.id) ? String(req.user.id) : 'staff', role: req.user ? req.user.role : 'STAFF' },
          targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
          payload: {
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            severity: notif.severity,
            entityType: notif.entityType,
            entityId: notif.entityId,
            linkTab: notif.linkTab,
            linkId: notif.linkId,
            createdAt: notif.createdAt,
          }
        });
      }

      res.json({
        success: true,
        message: `Cập nhật trạng thái sự cố thành: ${normalizedStatus}`,
        incident_id: parseInt(id),
        status: result.status,
        resolved_at: result.resolved_at
      });
    });
  });
};
