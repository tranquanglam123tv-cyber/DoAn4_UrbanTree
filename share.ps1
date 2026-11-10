# PowerShell Script: Khoi chay UrbanTree va tao link public truc tiep
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🌿 URBANTREE - KHOI CHAY VA TAO LINK CHIA SE TRUC TUYEN" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

# 1. Khoi dong Backend
Write-Host "[1/3] Khoi dong Backend Server (Port 5001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# 2. Khoi dong Frontend
Write-Host "[2/3] Khoi dong Frontend Web (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

# 3. Cho 3 giay de server san sang
Start-Sleep -Seconds 3

# 4. Chay Cloudflare Tunnel
$cfExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cfExe)) {
    $cfExe = "cloudflared"
}

Write-Host "[3/3] Dang lay link HTTPS cong khai tu Cloudflare..." -ForegroundColor Yellow
Write-Host "👉 Hay copy duong link https://...trycloudflare.com ben duoi de gui cho moi nguoi:" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

& $cfExe tunnel --url http://127.0.0.1:3000 --http-host-header localhost:3000
