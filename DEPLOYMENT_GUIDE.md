# Deployment Guide - Nginx Setup for Koshy Trading App

## Server Information
- **Server IP**: 103.160.145.141
- **Frontend URL**: http://103.160.145.141
- **Backend API**: http://103.160.145.141/api (proxied to localhost:1000)
- **WebSocket**: ws://103.160.145.141/ws (proxied to localhost:8080)

## Prerequisites
- Node.js and npm installed
- Nginx installed
- Backend server running on port 1000
- WebSocket server running on port 8080

## Step 1: Create Environment File

Create a `.env.production` file in the `koshy-trading-app-client` directory:

```bash
cd koshy-trading-app-client
echo "REACT_APP_API_ENDPOINT=http://103.160.145.141/api" > .env.production
```

This tells the React app to use the production API endpoint.

## Step 2: Build the React Frontend

```bash
npm install
npm run build
```

This will create a production build in the `build` directory with the correct API endpoint configured.

## Step 3: Copy Build Files to Server

On your server (103.160.145.141), create the deployment directory:

```bash
sudo mkdir -p /var/www/koshy-trading-app
sudo chown -R $USER:$USER /var/www/koshy-trading-app
```

Copy the build directory from your local machine to the server:

```bash
# From your local machine
scp -r koshy-trading-app-client/build/* user@103.160.145.141:/var/www/koshy-trading-app/build/
```

Or if you're already on the server, copy from the project directory:

```bash
sudo cp -r /path/to/koshy-trading-app-client/build /var/www/koshy-trading-app/
```

## Step 4: Install and Configure Nginx

### Install Nginx (if not already installed)
```bash
sudo apt update
sudo apt install nginx -y
```

### Copy Nginx Configuration

Copy the `nginx.conf` file to nginx sites-available:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/koshy-trading-app
sudo ln -s /etc/nginx/sites-available/koshy-trading-app /etc/nginx/sites-enabled/
```

### Remove default nginx site (optional)
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Test Nginx Configuration
```bash
sudo nginx -t
```

### Restart Nginx
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 5: Verify Deployment

1. **Check Nginx Status**:
   ```bash
   sudo systemctl status nginx
   ```

2. **Check Backend API**:
   ```bash
   curl http://localhost:1000/api/check_login
   ```

3. **Access Frontend**:
   Open browser and navigate to: http://103.160.145.141

## Step 6: Firewall Configuration (if needed)

If you have a firewall enabled, allow HTTP traffic:

```bash
sudo ufw allow 'Nginx Full'
# Or specifically:
sudo ufw allow 80/tcp
```

## Troubleshooting

### Check Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check Nginx Access Logs
```bash
sudo tail -f /var/log/nginx/access.log
```

### Verify Backend is Running
```bash
# Check if Node.js server is running on port 1000
sudo netstat -tlnp | grep 1000
# Or
sudo ss -tlnp | grep 1000
```

### Verify WebSocket Server is Running
```bash
# Check if WebSocket server is running on port 8080
sudo netstat -tlnp | grep 8080
```

### Restart Services
```bash
# Restart nginx
sudo systemctl restart nginx

# Restart backend (if using PM2 or similar)
pm2 restart all
# Or restart your Node.js server manually
```

## Updating the Frontend

When you make changes to the frontend:

1. **Rebuild**:
   ```bash
   cd koshy-trading-app-client
   npm run build
   ```

2. **Copy new build to server**:
   ```bash
   scp -r build/* user@103.160.145.141:/var/www/koshy-trading-app/build/
   ```

3. **No need to restart nginx** - changes take effect immediately

## Environment Variables

**Important**: Before building, create a `.env.production` file in `koshy-trading-app-client/` with:

```
REACT_APP_API_ENDPOINT=http://103.160.145.141/api
```

This tells the frontend to make API calls to `/api` which nginx will proxy to `localhost:1000`.

**Note**: The `.env.production` file is gitignored, so you need to create it manually on the server or include it in your deployment process.

## Notes

- The nginx configuration proxies `/api/*` requests to `localhost:1000`
- WebSocket connections to `/ws` are proxied to `localhost:8080`
- All other requests serve the React app (for client-side routing)
- Static assets are cached for 1 year for better performance
