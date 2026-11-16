const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// ==========================================
// 📊 ROUTES THỐNG KÊ DASHBOARD (Figma A04)
// ==========================================

// Lấy toàn bộ số liệu thống kê tổng quan (KPIs, Sức khỏe cây, Sự cố, Chăm sóc)
router.get('/stats', dashboardController.getDashboardStats);
router.get('/kpi', dashboardController.getDashboardStats);
router.get('/maintenance-telemetry', dashboardController.getMaintenanceTelemetry);

module.exports = router;
