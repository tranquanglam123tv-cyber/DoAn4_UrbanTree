@echo off
chcp 65001 > nul
title UrbanTree - Tao Link Chia Se Cho Moi Thiet Bi (4G / Wi-Fi)

echo ========================================================
echo   🌿 URBANTREE - TẠO LINK CHIA SẺ TRỰC TUYẾN
echo      (Chạy được cho tất cả điện thoại/laptop qua 4G/Wi-Fi)
echo ========================================================
echo.

REM Kiem tra cloudflared.exe
set CF_EXE="C:\Program Files (x86)\cloudflared\cloudflared.exe"
if not exist %CF_EXE% (
    set CF_EXE=cloudflared
)

echo [1/3] Đang khởi động Backend Server (Port 5001)...
start "UrbanTree Backend (Port 5001)" /min cmd /k "cd /d "%~dp0backend" && npm start"

echo [2/3] Đang khởi động Frontend Web App (Port 3000)...
start "UrbanTree Frontend (Port 3000)" /min cmd /k "cd /d "%~dp0" && npm run dev"

echo [3/3] Đợi hệ thống sẵn sàng trong 3 giây...
timeout /t 3 /nobreak > nul

echo.
echo ========================================================
echo   🚀 ĐANG KẾT NỐI ĐƯỜNG TRUYỀN CLOUDFLARE TUNNEL...
echo   (Đợi vài giây để lấy link HTTPS công khai)
echo ========================================================
echo.

%CF_EXE% tunnel --url http://localhost:3000


