Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting BIHAN BUSINESS Server...    " -ForegroundColor Yellow
Write-Host "   BIHAN HOME CARE • Raipur, CG         " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

$env:PATH = "C:\Users\vikas\.gemini\antigravity\scratch\nodejs\node-v20.11.0-win-x64;" + $env:PATH
Set-Location "C:\Users\vikas\.gemini\antigravity\scratch\bihan-business"

Write-Host "Opening http://localhost:3000 in your browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

npm run dev
