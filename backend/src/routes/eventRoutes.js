const express = require('express');
const router = express.Router();
const sseService = require('../services/sseService');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * ⚡ REALTIME SERVER-SENT EVENTS (SSE) ROUTER
 * Endpoint mở kênh lắng nghe sự kiện đẩy từ máy chủ về trình duyệt
 * GET /api/events
 */
router.get('/', authenticateToken, (req, res) => {
  sseService.addClient(req, res);
});

/**
 * Giám sát số lượng client đang kết nối và thống kê buffer
 * GET /api/events/stats
 */
router.get('/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: sseService.getBufferStats()
  });
});

module.exports = router;

