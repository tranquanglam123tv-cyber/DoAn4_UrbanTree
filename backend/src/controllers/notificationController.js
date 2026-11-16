const notificationService = require('../services/notificationService');
const sseService = require('../services/sseService');

/**
 * Controller xử lý các REST API liên quan đến Notification Hub
 */
exports.getNotifications = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để xem thông báo.' });
    }

    const { page, limit, unreadOnly, type } = req.query;
    const result = await notificationService.getNotificationsForUser(user, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
      type,
    });

    res.json({
      success: true,
      data: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách thông báo:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách thông báo.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
    }

    const count = await notificationService.getUnreadCount(user);
    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy số lượng thông báo chưa đọc:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đếm thông báo.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
    }

    const { id } = req.params;
    const result = await notificationService.markAsRead(id, user);

    if (result.notFound) {
      return res.status(404).json({ success: false, message: result.message });
    }

    // ⚡ Phát SSE notification.read để đồng bộ đa thiết bị của cùng user/role
    if (!result.alreadyRead) {
      sseService.broadcast({
        eventType: 'notification.read',
        entityType: 'notification',
        entityId: id,
        actor: { userId: String(user.id), role: user.role, name: user.full_name || user.username },
        targetUserId: result.notification.userId ? String(result.notification.userId) : null,
        targetRoles: result.notification.targetRoles || [user.role],
        payload: {
          id,
          isRead: true,
          readAt: result.notification.readAt,
        },
      });
    }

    res.json({
      success: true,
      alreadyRead: result.alreadyRead,
      data: result.notification,
    });
  } catch (error) {
    console.error('❌ Lỗi khi đánh dấu thông báo đã đọc:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đánh dấu thông báo.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
    }

    const result = await notificationService.markAllAsRead(user);

    // ⚡ Phát SSE notification.read_all để đồng bộ đa thiết bị
    sseService.broadcast({
      eventType: 'notification.read_all',
      entityType: 'notification',
      actor: { userId: String(user.id), role: user.role, name: user.full_name || user.username },
      targetUserId: String(user.id),
      targetRoles: [user.role],
      payload: {
        userId: user.id,
        role: user.role,
        updatedCount: result.updatedCount,
      },
    });

    res.json({
      success: true,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    console.error('❌ Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đánh dấu tất cả thông báo.' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
    }

    const { id } = req.params;
    const result = await notificationService.deleteNotification(id, user);

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message || 'Thông báo không tồn tại hoặc không thể xóa.' });
    }

    // ⚡ SSE notification.deleted (Fix P1: Đồng bộ xóa đa thiết bị realtime)
    if (result.notification) {
      sseService.broadcast({
        eventType: 'notification.deleted',
        entityType: 'notification',
        entityId: id,
        actor: { userId: String(user.id), role: user.role, name: user.full_name || user.username },
        targetUserId: result.notification.userId ? String(result.notification.userId) : null,
        targetRoles: result.notification.targetRoles || [user.role],
        payload: {
          id,
          entityType: 'notification',
        },
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa thông báo.',
    });
  } catch (error) {
    console.error('❌ Lỗi khi xóa thông báo:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa thông báo.' });
  }
};

