const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

/**
 * REST API Endpoints cho Quản lý & Vận hành Lệnh Công Tác Đô Thị (Work Orders)
 * Base path: /api/work-orders
 */

// 0. Quản lý Chiến Dịch Mùa Bão & Tiến Độ Vận Hành (WAVE 4.9)
router.get('/campaigns/storm-status', authenticateToken, requireRoles('ADMIN', 'STAFF', 'DISPATCHER'), workOrderController.getStormCampaignStatus);
router.post('/campaigns/storm/init-test-batch', authenticateToken, requireRoles('ADMIN'), workOrderController.initTestStormBatch);
router.post('/campaigns/storm/batch-complete-items', authenticateToken, requireRoles('ADMIN', 'STAFF'), workOrderController.batchCompleteItems);
router.post('/purge-all', authenticateToken, requireRoles('ADMIN'), workOrderController.purgeAllWorkOrders);

// 1. Lấy danh sách lệnh công tác (Role-aware: Chỉ ADMIN, STAFF, DISPATCHER)
router.get('/', authenticateToken, requireRoles('ADMIN', 'STAFF', 'DISPATCHER'), workOrderController.getAllWorkOrders);

// 2. Lấy chi tiết một lệnh kèm checklist cây và lịch sử audit
router.get('/:id', authenticateToken, requireRoles('ADMIN', 'STAFF', 'DISPATCHER'), workOrderController.getWorkOrderById);

// 3. Khởi tạo lệnh công tác mới (ADMIN hoặc STAFF)
router.post('/', authenticateToken, requireRoles('ADMIN', 'STAFF'), workOrderController.createWorkOrder);

// 3.1. Kích hoạt Chiến Dịch Bão: Tạo Emergency Work Orders hàng loạt theo tuyến (Chỉ ADMIN)
router.post('/emergency-storm', authenticateToken, requireRoles('ADMIN'), workOrderController.createEmergencyStormOrders);

// 3.2. Auto-Scheduler: Tự động lập lịch bảo dưỡng theo quy tắc (Chỉ ADMIN)
router.post('/auto-schedule', authenticateToken, requireRoles('ADMIN'), workOrderController.runAutoScheduleOrders);

// 4. Phân bổ tổ đội & xe cơ giới (Chỉ ADMIN)
router.patch('/:id/assign', authenticateToken, requireRoles('ADMIN'), workOrderController.assignTeamAndEquipment);

// 5. Chuyển trạng thái vòng đời (Bảo vệ bởi State Machine 12 trạng thái)
router.patch('/:id/status', authenticateToken, requireRoles('ADMIN', 'STAFF'), workOrderController.updateWorkOrderStatus);

// 6. KTV cập nhật checklist từng cây trên tuyến (Hoàn thành / Bỏ qua)
router.patch('/items/:itemId', authenticateToken, requireRoles('ADMIN', 'STAFF'), workOrderController.updateChecklistItem);

// 7. Nghiệm thu lệnh công tác (Chỉ ADMIN / Giám sát viên)
router.post('/:id/verify', authenticateToken, requireRoles('ADMIN'), workOrderController.verifyWorkOrder);

module.exports = router;

