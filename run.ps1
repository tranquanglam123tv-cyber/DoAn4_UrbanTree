# UrbanTree - PowerShell Runner
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🌿 URBANTREE - KHOI DONG HE THONG (PORT 5001 & 3000)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

# 1. Khoi dong Backend
Write-Host "[1/2] Dang bat Backend Server (Port 5001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd $PSScriptRoot\backend; npm start"

# 2. Khoi dong Frontend
Write-Host "[2/2] Dang bat Frontend Vite (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd $PSScriptRoot; npm run dev"

# 3. Cho 3 giay de server san sang
Start-Sleep -Seconds 3

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ✅ HE THONG DA SAN SANG!" -ForegroundColor Green
Write-Host "  💻 Tren PC:         http://localhost:3000" -ForegroundColor White
Write-Host "  📱 Tren Dien thoai: http://$($env:COMPUTERNAME).local:3000" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green

# Tu dong mo trinh duyet
Start-Process "http://localhost:3000"
Start-Process "http://localhost:5001/citizen"
