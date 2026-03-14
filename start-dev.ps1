# Disable Google Drive hooks for this session
$env:GDRIVE_ENABLED = "0"
$env:GOOGLE_DRIVE_FILE_STREAM_ENABLED = "0"

# Clear any problematic Node options
$env:NODE_OPTIONS = ""

Write-Host "Starting Vite development server..." -ForegroundColor Green
Write-Host "Using esbuild-wasm shim (Google Drive DLL workaround active)" -ForegroundColor Cyan
Write-Host ""

# Run via cmd.exe to avoid PowerShell treating Google Drive DLL stderr as fatal
cmd.exe /c "npm run dev"
