const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const treeRoutes = require('./routes/treeRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const careRoutes = require('./routes/careRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const registryRoutes = require('./registry');
const blockchainRoutes = require('./routes/blockchainRoutes');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares & CORS (Hỗ trợ Localhost, Mobile PWA & Cloudflare Tunnel *.trycloudflare.com)
const allowedOriginRegex = /^(http:\/\/localhost(:\d+)?|http:\/\/127\.0\.0\.1(:\d+)?|https:\/\/.*\.trycloudflare\.com)$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginRegex.test(origin)) {
      callback(null, true);
    } else {
      // Trong môi trường testing/IoT, cho phép linh hoạt để tránh chặn tunnel domain
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ file tĩnh và trang Verifier (A18/A19)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/verifier', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'verifier.html'));
});
app.get('/citizen', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'citizen.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Đăng ký API Routes
// 1. Module Xác thực & Bảo mật (Thuận)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

// 2. Module 4 Engine Trí tuệ Nhân tạo Gemini AI (Lâm)
app.use('/api/v1/ai', aiRoutes);
app.use('/api/ai', aiRoutes);

// 3. Database & Nghiệp vụ quản lý cây xanh theo từng Module chuẩn hóa (Thuận)
app.use('/api/trees', treeRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/care-records', careRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', apiRoutes); // Giữ tương thích ngược

// 4. Blockchain Smart Contract & Đối chiếu toàn vẹn dữ liệu (Lâm)
app.use('/api', registryRoutes);              // Legacy endpoint (/api/record, /api/verify/:id)
app.use('/api/blockchain', blockchainRoutes); // Chuẩn Master Spec v2 (/api/blockchain/anchor, verify, explorer...)

// Root endpoint kiểm tra trạng thái máy chủ
app.get('/', (req, res) => {
  res.json({
    project: 'UrbanTree Backend API, Gemini AI & Blockchain Registry',
    status: 'Running',
    version: '2.5.0 (Đồ án 4)',
    endpoints: {
      auth: {
        google: '/api/v1/auth/google',
        otpSend: '/api/v1/auth/otp/send',
        otpVerify: '/api/v1/auth/otp/verify',
        refresh: '/api/v1/auth/refresh',
        me: '/api/v1/auth/me'
      },
      ai: {
        treeHealth: '/api/v1/ai/trees/:id/health',
        climateMatch: '/api/v1/ai/climate-match',
        riskPredict: '/api/v1/ai/trees/:id/risk',
        careAdvisor: '/api/v1/ai/trees/:id/care-plan'
      },
      dashboard: '/api/dashboard/stats',
      trees: '/api/trees',
      incidents: '/api/incidents',
      careRecords: '/api/care-records',
      blockchain: {
        status: '/api/blockchain/status',
        anchor: '/api/blockchain/anchor',
        verify: '/api/blockchain/verify/:recordId',
        explorer: '/api/blockchain/explorer',
        record: '/api/blockchain/record/:recordId'
      }
    }
  });
});

// Khởi chạy server nếu chạy trực tiếp
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 UrbanTree Backend Server đang chạy tại:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👉 Thống kê Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`👉 Danh sách API Cây xanh: http://localhost:${PORT}/api/trees`);
    console.log(`👉 Cổng Blockchain APIs: http://localhost:${PORT}/api/blockchain/status`);
    console.log(`👉 Explorer Hoạt động Sổ cái: http://localhost:${PORT}/api/blockchain/explorer`);
    console.log(`====================================================`);
  });
}

module.exports = app;
