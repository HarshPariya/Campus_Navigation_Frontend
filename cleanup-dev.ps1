# Cleanup script for Next.js dev server
# This removes stale lock files and processes

Write-Host "Cleaning up Next.js dev environment..." -ForegroundColor Yellow

# Kill any Node processes that might be holding the lock
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Node processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Remove lock file if it exists
$lockPath = ".next\dev\lock"
if (Test-Path $lockPath) {
    Write-Host "Removing stale lock file..." -ForegroundColor Yellow
    Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
}

# Remove entire dev directory if lock persists
$devPath = ".next\dev"
if (Test-Path $devPath) {
    Write-Host "Removing .next/dev directory..." -ForegroundColor Yellow
    Remove-Item $devPath -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Cleanup complete!" -ForegroundColor Green

