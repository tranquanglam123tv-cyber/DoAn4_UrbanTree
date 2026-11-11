@echo off
title UrbanTree - Khoi chay he thong

echo ========================================================
echo   URBANTREE - HE THONG QUAN LY CAY XANH DO THI
echo   TICH HOP QR CODE VA BLOCKCHAIN REGISTRY
echo ========================================================
echo.

echo [1/2] Dang khoi dong Backend Server (Port 5001)...
start "UrbanTree-Backend" cmd /k "cd /d "%~dp0backend" && npm start"

echo [2/2] Dang khoi dong Frontend Web App (Port 3000)...
start "UrbanTree-Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ========================================================
echo   DA KHOI CHAY BACKEND VA FRONTEND!
echo.
echo   Tren PC:
echo   - Frontend App : http://localhost:3000
echo   - Cong Citizen  : http://localhost:5001/citizen
echo   - Cong Verifier : http://localhost:5001/verifier
echo.
echo   Nhan phim bat ky de mo trinh duyet...
echo ========================================================
pause > nul

start http://localhost:3000
start http://localhost:5001/citizen
