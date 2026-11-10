const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';

/**
 * Middleware xác thực JWT Access Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy Access Token. Vui lòng đăng nhập.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Access Token không hợp lệ hoặc đã hết hạn (15 phút)',
        error: err.name
      });
    }

    // Gắn thông tin người dùng vào request
    req.user = userPayload;
    next();
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

