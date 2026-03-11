# Deployment Guide - Nginx Setup for Windows (Local Machine)

## Server Information
- **Local IP**: 103.160.145.141
- **Frontend URL**: http://103.160.145.141
- **Backend API**: http://103.160.145.141/api (proxied to localhost:1000)
- **WebSocket**: ws://103.160.145.141/ws (proxied to localhost:8080)

## Prerequisites
- Node.js and npm installed
- Nginx for Windows installed
- Backend server running on port 1000
- WebSocket server running on port 8080

## Step 1: Download and Install Nginx for Windows

1. Download Nginx for Windows from: http://nginx.org/en/download.html
   - Choose the "Mainline version" (e.g., nginx/Windows-1.25.x)

2. Extract the zip file to a location like `C:\nginx`

3. The nginx directory structure should be:
   ```
   C:\nginx\
   ├── conf\
   ├── contrib\
   ├── docs\
   ├── logs\
   ├── temp\
   └── nginx.exe
   ```

## Step 2: Create Environment File

Create a `.env.production` file in the `koshy-trading-app-client` directory:

```bash
cd koshy-trading-app-client
echo REACT_APP_API_ENDPOINT=http://103.160.145.141/api > .env.production
```

Or manually create the file with this content:
```
REACT_APP_API_ENDPOINT=http://103.160.145.141/api
```

## Step 3: Build the React Frontend

```bash
cd koshy-trading-app-client
npm install
npm run build
```

This will create a production build in the `build` directory.

## Step 4: Copy Build Files

Create a directory for the frontend files:

```bash
mkdir C:\nginx\html\koshy-trading-app
```

Copy the build directory contents:

```bash
# From the project root
xcopy /E /I /Y koshy-trading-app-client\build\* C:\nginx\html\koshy-trading-app\
```

## Step 5: Configure Nginx

### Option A: Replace the default nginx.conf

1. Backup the existing config:
   ```bash
   copy C:\nginx\conf\nginx.conf C:\nginx\conf\nginx.conf.backup
   ```

2. Copy our nginx configuration:
   ```bash
   copy nginx.conf C:\nginx\conf\nginx.conf
   ```

3. Update the `root` path in `nginx.conf` to use Windows path format:
   ```
   root C:/nginx/html/koshy-trading-app/build;
   ```

### Option B: Create a separate config file

1. Create `C:\nginx\conf\koshy-trading-app.conf` with the configuration
2. Update the main `nginx.conf` to include it, or run nginx with:
   ```bash
   nginx.exe -c C:\nginx\conf\koshy-trading-app.conf
   ```

## Step 6: Update nginx.conf for Windows Paths

Edit `C:\nginx\conf\nginx.conf` and update the paths:

```nginx
server {
    listen 80;
    server_name 103.160.145.141;

    root C:/nginx/html/koshy-trading-app/build;
    index index.html;

    # ... rest of the configuration from nginx.conf
}
```

**Important**: Use forward slashes `/` in paths, not backslashes `\`.

## Step 7: Test Nginx Configuration

Open Command Prompt as Administrator and run:

```bash
cd C:\nginx
nginx.exe -t
```

This will test the configuration and report any errors.

## Step 8: Start Nginx

```bash
cd C:\nginx
nginx.exe
```

To stop nginx:
```bash
nginx.exe -s stop
```

To reload configuration (after changes):
```bash
nginx.exe -s reload
```

## Step 9: Configure Windows Firewall

Allow HTTP traffic through Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "80" → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name it "Nginx HTTP" → Finish

Or use PowerShell (as Administrator):
```powershell
New-NetFirewallRule -DisplayName "Nginx HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

## Step 10: Verify Deployment

1. **Check Nginx is running**:
   - Open Task Manager → Look for `nginx.exe` processes
   - Or check: `http://localhost` should serve your app

2. **Check Backend API**:
   - Open browser: http://103.160.145.141/api/check_login
   - Should connect to your Node.js backend

3. **Access Frontend**:
   - Open browser: http://103.160.145.141
   - Should show your React app

## Running Nginx as a Windows Service (Optional)

To run nginx as a Windows service (starts automatically on boot):

1. Download NSSM (Non-Sucking Service Manager): https://nssm.cc/download
2. Extract and run:
   ```bash
   nssm install nginx "C:\nginx\nginx.exe"
   nssm set nginx AppDirectory "C:\nginx"
   nssm start nginx
   ```

Or use WinSW (Windows Service Wrapper) for a more robust solution.

## Troubleshooting

### Check Nginx Error Logs
```bash
type C:\nginx\logs\error.log
```

### Check Nginx Access Logs
```bash
type C:\nginx\logs\access.log
```

### Verify Backend is Running
```bash
netstat -an | findstr :1000
```

### Verify WebSocket Server is Running
```bash
netstat -an | findstr :8080
```

### Check if Port 80 is in Use
```bash
netstat -an | findstr :80
```

If port 80 is already in use, you can:
1. Change nginx to use a different port (e.g., 8080) in `nginx.conf`
2. Or stop the service using port 80 (e.g., IIS, Skype, etc.)

### Common Issues

1. **"bind() to 0.0.0.0:80 failed"**
   - Port 80 is already in use
   - Check what's using it: `netstat -ano | findstr :80`
   - Stop that service or change nginx port

2. **"Access Denied"**
   - Run Command Prompt as Administrator
   - Or change nginx to use a port > 1024 (e.g., 8080)

3. **"File not found"**
   - Check the `root` path in nginx.conf uses forward slashes
   - Verify the build files are in the correct location
   - Check file permissions

## Updating the Frontend

When you make changes:

1. **Rebuild**:
   ```bash
   cd koshy-trading-app-client
   npm run build
   ```

2. **Copy new build**:
   ```bash
   xcopy /E /I /Y koshy-trading-app-client\build\* C:\nginx\html\koshy-trading-app\build\
   ```

3. **Reload nginx** (if needed):
   ```bash
   cd C:\nginx
   nginx.exe -s reload
   ```

## Quick Start Script

Create a batch file `start-nginx.bat`:

```batch
@echo off
cd /d C:\nginx
echo Starting Nginx...
nginx.exe
echo Nginx started. Press any key to stop...
pause
nginx.exe -s stop
```

## Notes

- Nginx on Windows runs in the foreground by default
- To run in background, use a service wrapper (NSSM/WinSW)
- The configuration uses forward slashes `/` for paths (Windows nginx requirement)
- Make sure your backend (port 1000) and WebSocket (port 8080) are running before accessing the frontend
