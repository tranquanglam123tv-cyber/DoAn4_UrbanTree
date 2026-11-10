const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * 🔐 Authentication Routes
 * UrbanTree - Đồ án 4
 * Phụ trách: Đoàn Thế Thuần (MSSV: 2311031)
 */

// Đăng nhập 1-chạm Google OAuth 2.0
router.post('/google', authController.googleSignIn);

// Gửi mã OTP 6 số qua Email (hạn 5 phút)
router.post('/otp/send', authController.sendOtp);

// Xác thực mã OTP & Đăng nhập
router.post('/otp/verify', authController.verifyOtp);

// Làm mới Access Token (Refresh Token)
router.post('/refresh', authController.refreshToken);

// Lấy thông tin tài khoản hiện tại (Yêu cầu JWT Bearer Token)
router.get('/me', authenticateToken, authController.getMe);

// Đăng nhập mật khẩu truyền thống
router.post('/login', authController.loginWithPassword);

module.exports = router;

