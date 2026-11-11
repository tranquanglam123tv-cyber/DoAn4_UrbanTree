@echo off
title UrbanTree - Cloudflare Tunnel

echo ========================================================
echo   [1/3] Bat Backend (Port 5001)...
echo ========================================================
start "UrbanTree-Backend" /min cmd /k "cd /d %~dp0backend && npm start"

echo [2/3] Bat Frontend (Port 3000)...
start "UrbanTree-Frontend" /min cmd /k "cd /d %~dp0 && npm run dev"

echo [3/3] Doi he thong san sang trong 4 giay...
powershell -Command "Start-Sleep -Seconds 4"

echo.
echo ========================================================
echo   DANG KET NOI VA TAO LINK TRUY CAP TRUC TUYEN...
echo   (Tim dong chu https://...trycloudflare.com ben duoi)
echo ========================================================
echo.

"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3000 --http-host-header localhost:3000

pause
