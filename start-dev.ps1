# Disable Google Drive hooks for this session
$env:GDRIVE_ENABLED = "0"
$env:GOOGLE_DRIVE_FILE_STREAM_ENABLED = "0"

# Clear any problematic Node options
$env:NODE_OPTIONS = ""

Write-Host "Starting Vite development server..." -ForegroundColor Green
Write-Host "If you see Google Drive errors, consider:" -ForegroundColor Yellow
Write-Host "1. Moving the project outside of Google Drive" -ForegroundColor Yellow
Write-Host "2. Pausing Google Drive Desktop sync temporarily" -ForegroundColor Yellow
Write-Host ""

npm run dev
