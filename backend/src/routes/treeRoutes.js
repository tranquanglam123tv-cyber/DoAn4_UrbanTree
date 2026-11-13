const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');
const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');

// ==========================================
// 🌳 ROUTES CÂY XANH (Nhiệm vụ THUAN-02 & THUAN-03)
// ==========================================

// Lấy danh sách cây (hỗ trợ phân trang, lọc theo loài, tình trạng sức khỏe)
router.get('/', treeController.getAllTrees);

// Tìm kiếm cây theo tọa độ GPS bán kính (phục vụ bản đồ GIS A05)
// Lưu ý: Đặt trước /:id để không bị Express hiểu nhầm "nearby" là id
router.get('/nearby', treeController.getNearbyTrees);

// Lấy chi tiết cây theo ID hoặc mã tree_code
router.get('/:id', treeController.getTreeById);

// Xuất hình ảnh mã QR (Buffer PNG trực tiếp hoặc JSON Base64)
router.get('/:id/qr', treeController.generateQrCode);

// 🛡️ BẢO VỆ PHÂN QUYỀN SERVER-SIDE (UT-001)
// Thêm mới cây xanh & tự động sinh mã QR (Chỉ ADMIN)
router.post('/', authenticateToken, requireRoles('ADMIN'), treeController.createTree);

// Thêm hàng loạt cây xanh (Bulk Insert) (Chỉ ADMIN)
router.post('/bulk', authenticateToken, requireRoles('ADMIN'), treeController.createTreesBulk);

// Cập nhật thông tin cây (ADMIN hoặc KTV STAFF)
router.put('/:id', authenticateToken, requireRoles('ADMIN', 'STAFF'), treeController.updateTree);

// Giải tỏa / Đốn hạ cây (Soft Delete UT-002 - Bắt buộc ADMIN phê duyệt)
router.delete('/:id', authenticateToken, requireRoles('ADMIN'), treeController.deleteTree);

module.exports = router;

