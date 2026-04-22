@echo off
echo Starting Web Server...

REM Copy our nginx config
copy /Y nginx-windows.conf C:\nginx-1.29.4\conf\nginx.conf

REM Kill any existing nginx
taskkill /F /IM nginx.exe 2>nul

REM Ensure firewall rule exists for port 8181
netsh advfirewall firewall add rule name="Nginx 8181" dir=in action=allow protocol=TCP localport=8181 2>nul

REM Start nginx
cd C:\nginx-1.29.4
start nginx.exe

echo Nginx started on port 8181
echo Site should be accessible at http://103.160.145.141:8181/
pause
