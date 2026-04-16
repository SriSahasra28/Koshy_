@echo off
title Koshy Trading App Startup
echo ============================================
echo   Koshy Trading App - Auto Startup
echo ============================================

:: ── 1. Ensure MySQL service is running ──────────────────────────────────────
echo [1/4] Starting MySQL...
sc start MySQL83 >nul 2>&1
timeout /t 3 /nobreak >nul
echo       MySQL started.

:: ── 2. Start Redis inside WSL ────────────────────────────────────────────────
echo [2/4] Starting Redis (WSL)...
wsl -e bash -c "if ! redis-cli ping > /dev/null 2>&1; then redis-server /home/ubuntu/redis.conf --daemonize yes; fi"
timeout /t 2 /nobreak >nul
wsl -e bash -c "redis-cli config set stop-writes-on-bgsave-error no > /dev/null 2>&1"
echo       Redis started.

:: ── 3. Start Nginx ─────────────────────────────────────────────────────────
echo [3/5] Starting Nginx (port 80)...
taskkill /f /im nginx.exe >nul 2>&1
timeout /t 1 /nobreak >nul
cd /d C:\nginx-1.29.4 && nginx.exe
cd /d C:\Users\Administrator\Desktop\koshy-trading-app-client_2025
echo       Nginx started.

:: ── 4. Start Backend Server ──────────────────────────────────────────────────
echo [4/5] Starting Backend (port 1000)...
start "Koshy Backend" cmd /k "cd /d C:\Users\Administrator\Desktop\koshy-trading-app-client_2025\koshy-trading-app-server && npm start"
timeout /t 5 /nobreak >nul
echo       Backend started.

:: ── 5. Start Frontend (dev) ─────────────────────────────────────────────────
echo [5/5] Starting Frontend dev server (port 1100)...
start "Koshy Frontend" cmd /k "cd /d C:\Users\Administrator\Desktop\koshy-trading-app-client_2025\koshy-trading-app-client && npm start"
echo       Frontend started.

echo.
echo ============================================
echo   All services launched!
echo   Site     : http://103.160.145.141  (nginx)
echo   Backend  : http://localhost:1000
echo   Frontend : http://localhost:1100   (dev)
echo ============================================
