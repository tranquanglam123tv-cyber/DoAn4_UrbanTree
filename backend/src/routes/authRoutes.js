const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * 🔐 Rate Limiters bảo vệ Authentication & OTP (Chống brute-force & spam email)
 */
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 5, // Tối đa 5 lần gửi OTP mỗi IP trong 10 phút
  message: {
    success: false,
    message: 'Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau 10 phút để đảm bảo an toàn.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần đoán mã OTP mỗi IP
  message: {
    success: false,
    message: 'Phát hiện nhiều lần nhập sai mã xác thực. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 15, // Tối đa 15 lần đăng nhập sai
  message: {
    success: false,
    message: 'Tạm khóa thử đăng nhập do nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 🔐 Authentication Routes
 * UrbanTree - Đồ án 4
 * Phụ trách: Đoàn Thế Thuần (MSSV: 2311031)
 */

// Đăng nhập 1-chạm Google OAuth 2.0
router.post('/google', authController.googleSignIn);

// Gửi mã OTP 6 số qua Email (Có Rate Limit chống spam)
router.post('/otp/send', otpSendLimiter, authController.sendOtp);

// Xác thực mã OTP & Đăng nhập (Có Rate Limit chống đoán mã)
router.post('/otp/verify', otpVerifyLimiter, authController.verifyOtp);

// Làm mới Access Token (Refresh Token)
router.post('/refresh', authController.refreshToken);

// Lấy thông tin tài khoản hiện tại (Yêu cầu JWT Bearer Token)
router.get('/me', authenticateToken, authController.getMe);

// Đăng nhập mật khẩu truyền thống (Có Rate Limit chống dò mật khẩu)
router.post('/login', loginLimiter, authController.loginWithPassword);

module.exports = router;

