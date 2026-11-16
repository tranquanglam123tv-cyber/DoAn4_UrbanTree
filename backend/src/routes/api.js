const express = require('express');
const router = express.Router();

const treeController = require('../controllers/treeController');
const incidentController = require('../controllers/incidentController');
const careController = require('../controllers/careController');
const dashboardController = require('../controllers/dashboardController');
const routeController = require('../controllers/routeController');
const { authenticateToken, optionalAuthenticateToken, requireRoles } = require('../middleware/authMiddleware');

// ==========================================
// 📊 ROUTE THỐNG KÊ DASHBOARD (Figma A04)
// ==========================================
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// ==========================================
// 🗺️ ROUTES ĐỊA BÀN & TUYẾN ĐƯỜNG (Wave 2.2)
// ==========================================
router.get('/routes', routeController.getAllRoutes);
router.get('/operational-zones', routeController.getAllOperationalZones);

// ==========================================
// 🌳 ROUTES CÂY XANH (Người 2 - Bạn Thuận)
// ==========================================
router.get('/trees', treeController.getAllTrees);
router.get('/trees/nearby', treeController.getNearbyTrees);
router.get('/trees/:id', treeController.getTreeById);
router.post('/trees', treeController.createTree);
router.put('/trees/:id', treeController.updateTree);
router.delete('/trees/:id', treeController.deleteTree);
router.get('/trees/:id/qr', treeController.generateQrCode);

// ==========================================
// ⚠️ ROUTES SỰ CỐ (Người 2 - Bạn Thuận)
// ==========================================
router.get('/incidents', optionalAuthenticateToken, incidentController.getAllIncidents);
router.get('/incidents/:id', optionalAuthenticateToken, incidentController.getIncidentById);
router.post('/incidents', incidentController.reportIncident);
router.patch('/incidents/:id/status', authenticateToken, requireRoles('ADMIN', 'STAFF'), incidentController.updateIncidentStatus);

// ==========================================
// 💧 ROUTES CHĂM SÓC (Người 2 - Bạn Thuận)
// ==========================================
router.get('/care-records', careController.getAllCareRecords);
router.get('/care-records/:id', careController.getCareRecordById);
router.post('/care-records', careController.addCareRecord);

// ==========================================
// ⛓️ ROUTE BLOCKCHAIN (Người 1 - Bạn Lâm)
// Các endpoint /api/record, /api/record/:id, /api/verify/:id được xử lý trực tiếp bởi registry.js
// ==========================================

module.exports = router;
