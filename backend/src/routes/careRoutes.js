const express = require('express');
const router = express.Router();
const careController = require('../controllers/careController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// ==========================================
// 💧 ROUTES CHĂM SÓC (Nhiệm vụ THUAN-05 & THUAN-06)
// ==========================================

// Lấy danh sách lịch sử chăm sóc (lọc theo tree_id, action_type, phân trang)
router.get('/', careController.getAllCareRecords);

// Lấy chi tiết một bản ghi chăm sóc theo ID
router.get('/:id', careController.getCareRecordById);

// 🛡️ BẢO VỆ PHÂN QUYỀN (UT-001): Ghi nhận hoạt động chăm sóc thực địa mới (STAFF hoặc ADMIN)
router.post('/', authenticateToken, requireRoles('ADMIN', 'STAFF'), careController.addCareRecord);

// Ghi nhận hàng loạt hoạt động chăm sóc (Bulk Insert)
router.post('/bulk', authenticateToken, requireRoles('ADMIN', 'STAFF'), careController.addCareRecordsBulk);

module.exports = router;
