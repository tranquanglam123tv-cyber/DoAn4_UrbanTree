# PowerShell Script: Khoi chay UrbanTree voi LINK CO DINH https://urbantree-lam.loca.lt
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  URBANTREE - LINK CO DINH: https://urbantree-lam.loca.lt" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

# 1. Khoi dong Backend
Write-Host "[1/3] Khoi dong Backend Server (Port 5001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# 2. Khoi dong Frontend
Write-Host "[2/3] Khoi dong Frontend Web (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

# 3. Cho 4 giay de server san sang
Write-Host "Dang cho server khoi dong..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

# 4. Chay LocalTunnel voi subdomain co dinh
Write-Host "[3/3] Dang mo LINK CO DINH..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor Green
Write-Host "  LINK CO DINH: https://urbantree-lam.loca.lt" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Luu y: Lan dau tien mo link, nguoi dung can bam 'Click to Continue'" -ForegroundColor Yellow
Write-Host "  Sau do link hoat dong binh thuong, gui cho ai cung duoc!" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

cloudflared tunnel run urbantree --url http://127.0.0.1:3000 --http-host-header localhost:3000
