#!/bin/bash
# ========================================================
#  🌿 URBANTREE - KHỞI ĐỘNG HỆ THỐNG TRÊN MACOS / LINUX
# ========================================================

# Đảm bảo tắt tất cả process con khi nhấn Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Đang tắt các tiến trình UrbanTree..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

echo "========================================================"
echo "  🌿 URBANTREE - KHỞI ĐỘNG HỆ THỐNG (PORT 5001 & 3000)"
echo "========================================================"

# 1. Kiểm tra node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Đang cài đặt thư viện Frontend..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Đang cài đặt thư viện Backend..."
    (cd backend && npm install)
fi

# 2. Khởi động Backend (Port 5001)
echo "🚀 [1/2] Đang bật Backend Server (Port 5001)..."
(cd backend && npm start) &

# Đợi 2 giây cho Backend sẵn sàng
sleep 2

# 3. Khởi động Frontend (Port 3000)
echo "💻 [2/2] Đang bật Frontend Vite (Port 3000)..."
npm run dev &

sleep 2

echo "========================================================"
echo "  ✅ HỆ THỐNG ĐÃ SẴN SÀNG!"
echo "  💻 Frontend Web App : http://localhost:3000"
echo "  📱 Cổng Người dân   : http://localhost:5001/citizen"
echo "  🏢 Cổng Quản trị    : http://localhost:5001/admin"
echo "  🔍 Cổng Kiểm toán   : http://localhost:5001/verifier"
echo "========================================================"
echo "👉 Nhấn Ctrl + C để dừng toàn bộ hệ thống."

# Tự động mở trình duyệt trên macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000"
    open "http://localhost:5001/citizen"
fi

# Giữ script chạy và lắng nghe signal
wait

