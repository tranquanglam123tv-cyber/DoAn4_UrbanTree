const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'urbantree_jwt_super_secret_key_2026_doan4');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('🚨 [CRITICAL SECURITY ERROR] Production environment must define JWT_SECRET in .env!');
  process.exit(1);
}

/**
 * Middleware xác thực JWT Access Token & Role Credentials
 * Bảo vệ tất cả API Write/Delete (UT-001)
 * 🔒 SECURITY ENFORCEMENT:
 * - Khi NODE_ENV === 'production', x-user-role bị vô hiệu hóa 100%. Bắt buộc phải có Bearer JWT Token hợp lệ.
 * - Chỉ cho phép fallback x-user-role khi ở Development VÀ có cờ ALLOW_DEV_ROLE_OVERRIDE === 'true'.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token) {
    return jwt.verify(token, JWT_SECRET, (err, userPayload) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Access Token không hợp lệ hoặc đã hết hạn',
          error: err.name
        });
      }
      req.user = userPayload;
      next();
    });
  }

  // 🔒 CHẶN TUYỆT ĐỐI x-user-role VÀ ANONYMOUS TRONG MÔI TRƯỜNG PRODUCTION
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy Access Token. Vui lòng đăng nhập với JWT hợp lệ để thực hiện hành động này.'
    });
  }

  // Development / Test: Chỉ cho phép override vai trò khi có cấu hình rõ ràng
  if (process.env.ALLOW_DEV_ROLE_OVERRIDE === 'true') {
    const headerRole = req.headers['x-user-role'];
    const headerUserId = req.headers['x-user-id'];
    if (headerRole) {
      req.user = {
        id: headerUserId || 'user-admin',
        role: String(headerRole).toUpperCase(),
        username: 'dev_override_user'
      };
      return next();
    }
  }

  // Nếu không có Token và không bật dev override -> Từ chối 401
  return res.status(401).json({
    success: false,
    message: 'Yêu cầu xác thực: Vui lòng cung cấp Access Token để truy cập tài nguyên.'
  });
}

/**
 * Middleware phân quyền (Role-based Access Control)
 * @param {string[]} allowedRoles Mảng các quyền được phép (['ADMIN', 'STAFF'])
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ' + allowedRoles.join(', ')
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles
};

