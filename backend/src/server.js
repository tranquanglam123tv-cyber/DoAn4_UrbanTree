const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

// 🛡️ BẢO VỆ HTTP HEADERS CHUYÊN SÂU BẰNG HELMET (OWASP TOP 10)
app.use(
  helmet({
    contentSecurityPolicy: false, // Để tương thích linh hoạt với Leaflet tile servers & inline styles demo
    crossOriginEmbedderPolicy: false,
  })
);

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
app.use('/api/v1/trees', treeRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/v1/care-records', careRoutes);
app.use('/api/care-records', careRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
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

const os = require('os');

function getLocalNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const hostname = os.hostname();
  let wifiIp = 'localhost';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        wifiIp = iface.address;
        break;
      }
    }
    if (wifiIp !== 'localhost') break;
  }

  return {
    ip: wifiIp,
    hostname: `${hostname.toLowerCase()}.local`
  };
}

// API Thông tin mạng nội bộ & Tự động đổi IP theo Wi-Fi
app.get('/api/system/network', (req, res) => {
  const net = getLocalNetworkInfo();
  res.json({
    success: true,
    data: {
      ...net,
      frontendUrl: `http://${net.ip}:3000`,
      frontendMdnsUrl: `http://${net.hostname}:3000`,
      citizenUrl: `http://${net.ip}:${PORT}/citizen`,
      citizenMdnsUrl: `http://${net.hostname}:${PORT}/citizen`
    }
  });
});

// Khởi chạy server nếu chạy trực tiếp
if (require.main === module) {
  const net = getLocalNetworkInfo();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 UrbanTree Backend Server (Host 0.0.0.0, Port ${PORT})`);
    console.log(`💻 Trên máy tính (PC):  http://localhost:${PORT}`);
    console.log(`📱 Trên điện thoại:     http://${net.ip}:${PORT}/citizen`);
    console.log(`✨ Hoặc dùng tên miền: http://${net.hostname}:${PORT}/citizen`);
    console.log(`====================================================`);
  });
}

module.exports = app;
