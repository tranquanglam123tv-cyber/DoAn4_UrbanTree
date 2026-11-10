@echo off
chcp 65001 > nul
title UrbanTree - Khoi chay toan bo he thong

echo ========================================================
echo   🌿 URBANTREE - HỆ THỐNG QUẢN LÝ CÂY XANH ĐÔ THỊ
echo        TÍCH HỢP QR CODE, AI & BLOCKCHAIN REGISTRY
echo ========================================================
echo.

echo [1/3] Đang khởi động Backend Server (Port 5001)...
start "UrbanTree Backend (Port 5001)" cmd /k "cd /d "%~dp0backend" && npm start"

echo [2/3] Đợi Backend sẵn sàng trong 3 giây...
timeout /t 3 /nobreak > nul

echo [3/3] Đang khởi động Frontend Web App (Port 3000)...
start "UrbanTree Frontend (Port 3000)" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ========================================================
echo   ✅ TẤT CẢ CÁC DỊCH VỤ ĐÃ ĐƯỢC MỞ TRONG TERMINAL RIÊNG
echo.
echo   👉 Frontend Dashboard : http://localhost:3000
echo   👉 Cổng Citizen (QR)   : http://localhost:5001/citizen
echo   👉 Cổng Admin          : http://localhost:5001/admin
echo   👉 Cổng Verifier       : http://localhost:5001/verifier
echo.
echo   Nhấn phím bất kỳ để mở tự động trình duyệt...
echo ========================================================
pause > nul

start http://localhost:3000
start http://localhost:5001/citizen
start http://localhost:5001/verifier
