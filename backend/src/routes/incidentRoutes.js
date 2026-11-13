const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// ==========================================
// ⚠️ ROUTES SỰ CỐ (Nhiệm vụ THUAN-04 & THUAN-06)
// ==========================================

// Lấy danh sách sự cố (lọc theo status, severity, tree_id, phân trang - Có DTO che PII theo vai trò)
router.get('/', incidentController.getAllIncidents);

// Lấy chi tiết một sự cố theo ID
router.get('/:id', incidentController.getIncidentById);

// Tiếp nhận báo cáo sự cố từ người dân / nhân viên (Có bộ lọc chống Spam & Deduplication UT-005, UT-006)
router.post('/', incidentController.reportIncident);

// 🛡️ BẢO VỆ PHÂN QUYỀN (UT-001): Cập nhật trạng thái sự cố (Chỉ STAFF hoặc ADMIN)
router.patch('/:id/status', authenticateToken, requireRoles('ADMIN', 'STAFF'), incidentController.updateIncidentStatus);

module.exports = router;
