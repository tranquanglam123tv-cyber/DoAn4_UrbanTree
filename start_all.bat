@echo off
chcp 65001 > nul
title UrbanTree - Khoi chay toan bo he thong

echo ========================================================
echo   🌿 URBANTREE - HỆ THỐNG QUẢN LÝ CÂY XANH ĐÔ THỊ
echo        TÍCH HỢP QR CODE, AI & BLOCKCHAIN REGISTRY
echo ========================================================
echo.

REM Lay dia chi IP Wi-Fi hien tai cua may tinh
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue).IPAddress"` ) do set LOCAL_IP=%%i
if "%LOCAL_IP%"=="" (
    for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress"` ) do set LOCAL_IP=%%i
)
if "%LOCAL_IP%"=="" set LOCAL_IP=localhost

echo [1/3] Đang khởi động Backend Server (Port 5001 - Host 0.0.0.0)...
start "UrbanTree Backend (Port 5001)" cmd /k "cd /d "%~dp0backend" && npm start"

echo [2/3] Đợi Backend sẵn sàng trong 3 giây...
timeout /t 3 /nobreak > nul

echo [3/3] Đang khởi động Frontend Web App (Port 3000 - Host 0.0.0.0)...
start "UrbanTree Frontend (Port 3000)" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ========================================================
echo   ✅ HỆ THỐNG ĐÃ SẴN SÀNG CHẠY TRÊN CẢ MÁY TÍNH & ĐIỆN THOẠI!
echo.
echo   💻 TRÊN MÁY TÍNH (PC):
echo   👉 Frontend Dashboard : http://localhost:3000
echo   👉 Cổng Citizen (QR)   : http://localhost:5001/citizen
echo   👉 Cổng Verifier       : http://localhost:5001/verifier
echo.
echo   📱 TRÊN ĐIỆN THOẠI (BẮT CHUNG WI-FI VỚI MÁY TÍNH):
echo   👉 Mở Safari / Chrome  : http://%LOCAL_IP%:3000
echo   👉 Cổng Citizen (QR)   : http://%LOCAL_IP%:5001/citizen
echo.
echo   👉 Trên điện thoại bấm nút Chia sẻ / 3 chấm ->
echo      chọn "Thêm vào màn hình chính" (Add to Home screen)
echo      để dùng như App Native không có thanh duyệt web!
echo.
echo   Nhấn phím bất kỳ để mở tự động trình duyệt trên máy tính...
echo ========================================================
pause > nul

start http://localhost:3000
start http://localhost:5001/citizen
start http://localhost:5001/verifier
