# Build Comparison & Deployment Guide

## Current Situation

### Old Build Folder (`build/` at root)
- Contains **OLD PHP-based frontend**:
  - `condition.php` - Old conditions editor (3 separate condition blocks)
  - `filter_option.php` - Simple PHP script
  - Old React build files (outdated)
  - **NO LRC Filter or Time Filter features**

### New Build Folder (`koshy-trading-app-client/build/`)
- Contains **NEW React-based frontend**:
  - Fresh React build with all new features
  - **LRC Filter section** (NEW)
  - **Time Filter section** (NEW)
  - Updated Condition editor with "Add H LFP 1" section
  - Filter page component (placeholder, but exists)

## Key Differences

### Conditions Editor Page

**OLD (PHP - `build/condition.php`):**
- 3 separate condition blocks:
  1. Condition 1: PSAR + Stochastic dropdowns
  2. Condition 2: PSAR dropdown only
  3. Filters: Basic LRC line selection
- No LRC Filter options
- No Time Filter options

**NEW (React - `koshy-trading-app-client/src/components/Condition.jsx`):**
- "Add H LFP 1" section with detailed condition descriptions
- Full form with:
  - H LFP dropdown
  - LRC, PSAR, Fast Stoch dropdowns
  - LRC Angle section
  - Signal Arrow section
  - **LRC Filter section** ✅ (NEW)
  - **Time Filter section** ✅ (NEW)

### Filter Page

**OLD (PHP - `build/filter_option.php`):**
- Simple PHP script that calls API endpoint
- No UI

**NEW (React - `koshy-trading-app-client/src/components/Filter.jsx`):**
- React component (currently placeholder)
- Route exists: `/filter`
- Ready for full implementation

## Deployment Steps

### Option 1: Replace Entire Build Folder (Recommended)

1. **Backup old build folder:**
   ```bash
   # Rename old build folder
   mv build build_old_backup
   ```

2. **Copy new build to root:**
   ```bash
   # Copy new React build to root
   cp -r koshy-trading-app-client/build ./build
   ```

3. **Keep PHP files if needed:**
   - If you still need PHP files, copy them separately
   - Or merge them into the new build folder

### Option 2: Merge Build Folders

1. **Copy new React build files:**
   ```bash
   # Copy new React build files
   cp -r koshy-trading-app-client/build/static ./build/
   cp koshy-trading-app-client/build/index.html ./build/
   cp koshy-trading-app-client/build/asset-manifest.json ./build/
   ```

2. **Keep PHP files:**
   - Keep `condition.php`, `filter_option.php`, etc. if still needed
   - But React app will be served instead

### Option 3: Use New Build Folder Location

1. **Update server configuration:**
   - Point web server to `koshy-trading-app-client/build/`
   - Instead of root `build/` folder

## Verification

After deployment, check:

1. **Conditions Page (`/cn`):**
   - ✅ Should show "Add H LFP 1" section
   - ✅ Should have LRC Filter checkbox and options
   - ✅ Should have Time Filter checkbox and time inputs
   - ❌ Should NOT show old 3-block condition editor

2. **Filter Page (`/filter`):**
   - ✅ Should show React Filter component
   - ❌ Should NOT show PHP script

3. **Check browser console:**
   - No 404 errors for React assets
   - React app loads correctly

## Server Configuration

### For Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### For Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Important Notes

1. **React Router:** The new React app uses client-side routing
   - All routes must serve `index.html` for React Router to work
   - Routes: `/`, `/cn`, `/filter`, `/scan`, `/groups`, etc.

2. **API Endpoints:** Ensure backend API is running and accessible
   - React app calls APIs defined in `src/api/`
   - Check CORS settings if needed

3. **PHP Files:** If you still need PHP files:
   - Keep them in a separate directory
   - Or serve them via different routes
   - Don't mix PHP and React routing

## Quick Test

After deployment, test these URLs:
- `http://your-server/` - Home page
- `http://your-server/cn` - Conditions editor (should show new UI)
- `http://your-server/filter` - Filter page (should show React component)
