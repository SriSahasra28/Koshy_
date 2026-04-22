@echo off
echo ===============================================
echo Deploying Chart Fix to Production Server
echo ===============================================
echo.

REM Navigate to project directory
cd C:\Users\Administrator\Desktop\koshy-trading-app-client_2025

echo Step 1: Pulling latest changes from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo Error: Failed to pull changes
    pause
    exit /b 1
)

echo.
echo Step 2: Installing dependencies if needed...
cd koshy-trading-app-server
call npm install
cd ..

echo.
echo Step 3: Building client application...
cd koshy-trading-app-client
call npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build client
    pause
    exit /b 1
)
cd ..

echo.
echo Step 4: Restarting server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq koshy-trading-app-server*" 2>nul
timeout /t 2 >nul

cd koshy-trading-app-server
start "koshy-trading-app-server" cmd /c "npm start"

echo.
echo Step 5: Restarting Python services...
taskkill /F /IM python.exe /FI "COMMANDLINE eq *tick_zerodha*" 2>nul
taskkill /F /IM python.exe /FI "COMMANDLINE eq *main_redis*" 2>nul
timeout /t 2 >nul

cd ..\koshy_python
start "tick_zerodha" cmd /c "python tick_zerodha.py"
timeout /t 3 >nul
start "main_redis" cmd /c "python main_redis_remaster.py"

echo.
echo ===============================================
echo Deployment Complete!
echo ===============================================
echo.
echo Please test the following:
echo 1. Open http://103.160.145.141:8181/
echo 2. Test 1-minute chart (should work as before)
echo 3. Test 2-minute chart (should now show full data)
echo 4. Test 3-minute chart (should now show full data)
echo 5. Test 5-minute chart (should now show full data)
echo 6. Test 30-minute chart (should work as before)
echo.
echo Check browser console for resampling strategy messages.
echo.
pause