/**
 * 🔔 NOTIFICATION SERVICE — SINGLE RESPONSIBILITY LAYER
 * Quản lý lưu trữ bền vững (SQLite) và truy vấn thông báo đa thiết bị cho UrbanTree.
 * Tuân thủ chuẩn Wave 3.2:
 * - Phân quyền hiển thị nghiêm ngặt (User / Role isolation)
 * - Đảm bảo tính Idempotency khi đọc / đánh dấu đã đọc
 * - Bảo vệ PII (Data Minimization)
 * - Tương thích giao dịch (Atomicity support)
 */

const db = require('../config/db');

// Helper Promise wrappers cho SQLite
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function getAllRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function mapRowToNotification(row) {
  if (!row) return null;
  const roles = row.target_role
    ? row.target_role.split(',').map((r) => r.trim())
    : ['ADMIN', 'STAFF', 'CITIZEN'];

  return {
    id: row.id,
    userId: row.user_id,
    targetUserId: row.user_id ? String(row.user_id) : undefined,
    targetRole: row.target_role,
    targetRoles: roles,
    title: row.title,
    message: row.message,
    type: row.type,
    severity: row.severity,
    entityType: row.entity_type,
    entityId: row.entity_id,
    referenceType: row.entity_type,
    referenceId: row.entity_id,
    linkTab: row.link_tab,
    linkId: row.link_id,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

class NotificationService {
  /**
   * Tạo thông báo mới và lưu bền vững vào bảng notifications.
   * Hỗ trợ truyền runSql tùy biến khi chạy trong một transaction mở.
   */
  async createNotification(data, customRunSql = null) {
    const id = data.id || `notif-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = data.userId !== undefined && data.userId !== null ? Number(data.userId) : null;
    const targetRole = data.targetRole || (Array.isArray(data.targetRoles) ? data.targetRoles.join(',') : null);
    const title = data.title || 'Thông báo hệ thống';
    const message = data.message || '';
    const type = data.type || 'SYSTEM_BROADCAST';
    const severity = data.severity || 'INFO';
    const entityType = data.entityType || null;
    const entityId = data.entityId ? String(data.entityId) : null;
    const linkTab = data.linkTab || null;
    const linkId = data.linkId ? String(data.linkId) : null;
    const isRead = data.isRead ? 1 : 0;
    const createdAt = data.createdAt || new Date().toISOString();
    const readAt = isRead ? createdAt : null;

    // Idempotency / Duplicate check: nếu cùng entityType + entityId + type + targetRole tạo trong 15s qua thì bỏ qua
    if (entityType && entityId) {
      const existing = await getRow(
        `SELECT id FROM notifications 
         WHERE entity_type = ? AND entity_id = ? AND type = ? AND COALESCE(user_id, 0) = COALESCE(?, 0)
         AND (strftime('%s', 'now') - strftime('%s', created_at)) < 15`,
        [entityType, entityId, type, userId]
      );
      if (existing) {
        return await this.getNotificationById(existing.id);
      }
    }

    const sql = `
      INSERT INTO notifications (
        id, user_id, target_role, title, message, type, severity,
        entity_type, entity_id, link_tab, link_id, is_read, created_at, read_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id, userId, targetRole, title, message, type, severity,
      entityType, entityId, linkTab, linkId, isRead, createdAt, readAt
    ];

    if (customRunSql && typeof customRunSql === 'function') {
      await customRunSql(sql, params);
    } else {
      await runQuery(sql, params);
    }

    return {
      id,
      userId,
      targetUserId: userId ? String(userId) : undefined,
      targetRole,
      targetRoles: targetRole ? targetRole.split(',').map((r) => r.trim()) : ['ADMIN', 'STAFF', 'CITIZEN'],
      title,
      message,
      type,
      severity,
      entityType,
      entityId,
      referenceType: entityType,
      referenceId: entityId,
      linkTab,
      linkId,
      isRead: Boolean(isRead),
      createdAt,
      readAt,
    };
  }

  async getNotificationById(id) {
    const row = await getRow('SELECT * FROM notifications WHERE id = ?', [id]);
    return mapRowToNotification(row);
  }

  /**
   * Lấy danh sách thông báo cho người dùng xác thực qua JWT.
   * Phân quyền hiển thị:
   * - user_id = user.id
   * - HOẶC user_id IS NULL AND (target_role = role OR target_role = 'ALL' OR target_role LIKE '%role%' OR target_role IS NULL)
   */
  async getNotificationsForUser(user, options = {}) {
    const userId = Number(user.id);
    const role = String(user.role || '').toUpperCase();
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 50));
    const offset = (page - 1) * limit;
    const unreadOnly = Boolean(options.unreadOnly);
    const type = options.type || null;

    let whereClause = `WHERE (user_id = ? OR (user_id IS NULL AND (target_role = ? OR target_role = 'ALL' OR target_role LIKE ? OR target_role IS NULL)))`;
    const params = [userId, role, `%${role}%`];

    if (unreadOnly) {
      whereClause += ' AND is_read = 0';
    }
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const countSql = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
    const countRow = await getRow(countSql, params);
    const total = countRow ? countRow.total : 0;

    const unreadCount = await this.getUnreadCount(user);

    const dataSql = `
      SELECT * FROM notifications 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const rows = await getAllRows(dataSql, [...params, limit, offset]);

    return {
      notifications: rows.map(mapRowToNotification),
      total,
      unreadCount,
      page,
      limit,
    };
  }

  /**
   * Lấy số lượng thông báo chưa đọc của người dùng.
   */
  async getUnreadCount(user) {
    const userId = Number(user.id);
    const role = String(user.role || '').toUpperCase();

    const sql = `
      SELECT COUNT(*) as unread_count 
      FROM notifications 
      WHERE is_read = 0 
        AND (user_id = ? OR (user_id IS NULL AND (target_role = ? OR target_role = 'ALL' OR target_role LIKE ? OR target_role IS NULL)))
    `;
    const row = await getRow(sql, [userId, role, `%${role}%`]);
    return row ? row.unread_count : 0;
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc (Idempotent).
   * Kiểm tra quyền sở hữu / hiển thị trước khi cập nhật.
   */
  async markAsRead(id, user) {
    const userId = Number(user.id);
    const role = String(user.role || '').toUpperCase();

    // 1. Kiểm tra quyền truy cập thông báo
    const checkSql = `
      SELECT * FROM notifications 
      WHERE id = ? 
        AND (user_id = ? OR (user_id IS NULL AND (target_role = ? OR target_role = 'ALL' OR target_role LIKE ? OR target_role IS NULL)))
    `;
    const row = await getRow(checkSql, [id, userId, role, `%${role}%`]);

    if (!row) {
      return { success: false, notFound: true, message: 'Thông báo không tồn tại hoặc bạn không có quyền truy cập.' };
    }

    // 2. Idempotent: nếu đã đọc thì giữ nguyên không ghi đè read_at
    if (row.is_read === 1) {
      return {
        success: true,
        alreadyRead: true,
        notification: mapRowToNotification(row),
      };
    }

    // 3. Cập nhật is_read = 1
    const readAt = new Date().toISOString();
    await runQuery('UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?', [readAt, id]);

    return {
      success: true,
      alreadyRead: false,
      notification: {
        ...mapRowToNotification(row),
        isRead: true,
        readAt,
      },
    };
  }

  /**
   * Đánh dấu tất cả thông báo thuộc quyền xem của người dùng là đã đọc (Idempotent).
   * Chỉ cập nhật các dòng thuộc về user/role hiện tại.
   */
  async markAllAsRead(user) {
    const userId = Number(user.id);
    const role = String(user.role || '').toUpperCase();
    const readAt = new Date().toISOString();

    const sql = `
      UPDATE notifications 
      SET is_read = 1, read_at = ? 
      WHERE is_read = 0 
        AND (user_id = ? OR (user_id IS NULL AND (target_role = ? OR target_role = 'ALL' OR target_role LIKE ? OR target_role IS NULL)))
    `;
    const result = await runQuery(sql, [readAt, userId, role, `%${role}%`]);

    return {
      success: true,
      updatedCount: result.changes,
    };
  }

  /**
   * Xóa một thông báo (chỉ cho phép nếu thông báo thuộc về user hoặc targetRole).
   */
  async deleteNotification(id, user) {
    const userId = Number(user.id);
    const role = String(user.role || '').toUpperCase();

    // 1. Kiểm tra quyền sở hữu & lấy metadata trước khi xóa
    const checkSql = `
      SELECT * FROM notifications 
      WHERE id = ? 
        AND (user_id = ? OR (user_id IS NULL AND (target_role = ? OR target_role = 'ALL' OR target_role LIKE ? OR target_role IS NULL)))
    `;
    const row = await getRow(checkSql, [id, userId, role, `%${role}%`]);
    if (!row) {
      return { success: false, notFound: true, message: 'Thông báo không tồn tại hoặc bạn không có quyền xóa.' };
    }

    const notifMeta = mapRowToNotification(row);

    const sql = `DELETE FROM notifications WHERE id = ?`;
    const result = await runQuery(sql, [id]);
    return {
      success: result.changes > 0,
      deletedCount: result.changes,
      notification: notifMeta,
    };
  }
}

module.exports = new NotificationService();

